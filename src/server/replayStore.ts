import fs from 'node:fs';
import path from 'node:path';
import type { ExecuteResponse } from '../services/api/types';

export class ReplayStorageError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ReplayStorageError';
  }
}

export interface ReplayEntry {
  executionId: string;
  challengeId: string;
  candidateCodeHash: string;
  idempotencyKey?: string;
  consumedAt: number;
  response: ExecuteResponse;
}

export interface ReplayCheckResult {
  status: 'ALLOWED' | 'IDEMPOTENT_REPLAY' | 'REPLAY_ATTACK' | 'IDEMPOTENCY_CONFLICT';
  cachedResponse?: ExecuteResponse;
  reason?: string;
}

export interface ReplayStore {
  /**
   * Atomically checks for replay/idempotency and records reservation.
   */
  checkAndRecord(params: {
    executionId: string;
    challengeId: string;
    candidateCodeHash: string;
    idempotencyKey?: string;
    response: ExecuteResponse;
  }): Promise<ReplayCheckResult>;

  /**
   * Checks if an idempotency key is already registered with conflicting payload.
   */
  checkIdempotencyKey(params: {
    idempotencyKey: string;
    challengeId: string;
    candidateCodeHash: string;
  }): Promise<{ status: 'NEW' | 'MATCH' | 'CONFLICT'; cachedResponse?: ExecuteResponse }>;

  /**
   * Cleans up expired entries.
   */
  pruneExpired(maxAgeMs?: number): Promise<void>;

  /**
   * Clears all stored entries (primarily for testing).
   */
  clear(): Promise<void>;
}

export const DEFAULT_REPLAY_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * File-backed durable replay store with atomic writes and memory cache.
 * Suitable for container restarts and persistent storage.
 */
export class FileDurableReplayStore implements ReplayStore {
  private memoryCache = new Map<string, ReplayEntry>();
  private idempotencyIndex = new Map<string, string>(); // idempotencyKey -> executionId
  private filePath: string;
  private isInitialized = false;
  private writeMutex: Promise<void> = Promise.resolve();
  public failClosed = true;

  constructor(filePath?: string) {
    this.filePath = filePath || process.env.REPLAY_STORE_PATH || path.join(process.cwd(), '.data', 'replay_store.json');
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        if (raw.trim()) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (item && item.executionId) {
                this.memoryCache.set(item.executionId, item);
                if (item.idempotencyKey) {
                  this.idempotencyIndex.set(item.idempotencyKey, item.executionId);
                }
              }
            }
          }
        }
      }
      this.isInitialized = true;
    } catch (err: unknown) {
      if (this.failClosed) {
        throw new ReplayStorageError(`Failed to initialize durable replay store at ${this.filePath}`, err);
      }
      this.isInitialized = true;
    }
  }

  private async persist(): Promise<void> {
    const data = Array.from(this.memoryCache.values());
    const tempPath = `${this.filePath}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;

    try {
      await fs.promises.writeFile(tempPath, JSON.stringify(data, null, 2), {
        encoding: 'utf-8',
        mode: 0o600,
      });
      await fs.promises.rename(tempPath, this.filePath);
    } catch (err: unknown) {
      try {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch {
        // ignore cleanup error
      }
      throw new ReplayStorageError('Durable replay storage write failure', err);
    }
  }

  public async checkIdempotencyKey(params: {
    idempotencyKey: string;
    challengeId: string;
    candidateCodeHash: string;
  }): Promise<{ status: 'NEW' | 'MATCH' | 'CONFLICT'; cachedResponse?: ExecuteResponse }> {
    await this.initialize();

    const existingExecutionId = this.idempotencyIndex.get(params.idempotencyKey);
    if (!existingExecutionId) {
      return { status: 'NEW' };
    }

    const existingEntry = this.memoryCache.get(existingExecutionId);
    if (!existingEntry) {
      return { status: 'NEW' };
    }

    // Check payload identity
    if (
      existingEntry.challengeId === params.challengeId &&
      existingEntry.candidateCodeHash === params.candidateCodeHash
    ) {
      return {
        status: 'MATCH',
        cachedResponse: existingEntry.response,
      };
    }

    // Key reuse with conflicting parameters
    return { status: 'CONFLICT' };
  }

  public async checkAndRecord(params: {
    executionId: string;
    challengeId: string;
    candidateCodeHash: string;
    idempotencyKey?: string;
    response: ExecuteResponse;
  }): Promise<ReplayCheckResult> {
    await this.initialize();

    // Mutex locking for atomic read-modify-write across async microtasks
    let releaseLock: () => void = () => {};
    const lock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    const previousLock = this.writeMutex;
    this.writeMutex = lock;

    try {
      await previousLock;

      // 1. Idempotency Key Conflict Check
      if (params.idempotencyKey) {
        const idempCheck = await this.checkIdempotencyKey({
          idempotencyKey: params.idempotencyKey,
          challengeId: params.challengeId,
          candidateCodeHash: params.candidateCodeHash,
        });

        if (idempCheck.status === 'CONFLICT') {
          return {
            status: 'IDEMPOTENCY_CONFLICT',
            reason: `Idempotency key '${params.idempotencyKey}' was already used with a different code submission or challenge.`,
          };
        }

        if (idempCheck.status === 'MATCH' && idempCheck.cachedResponse) {
          return {
            status: 'IDEMPOTENT_REPLAY',
            cachedResponse: idempCheck.cachedResponse,
          };
        }
      }

      // 2. Execution ID Replay Check
      const existing = this.memoryCache.get(params.executionId);
      if (existing) {
        // Legitimate exact retry
        if (
          params.idempotencyKey &&
          existing.idempotencyKey === params.idempotencyKey &&
          existing.challengeId === params.challengeId &&
          existing.candidateCodeHash === params.candidateCodeHash
        ) {
          return {
            status: 'IDEMPOTENT_REPLAY',
            cachedResponse: existing.response,
          };
        }

        return {
          status: 'REPLAY_ATTACK',
          reason: `Execution ID '${params.executionId}' was already consumed and cannot be replayed.`,
        };
      }

      // 3. Atomically Record Entry
      const newEntry: ReplayEntry = {
        executionId: params.executionId,
        challengeId: params.challengeId,
        candidateCodeHash: params.candidateCodeHash,
        idempotencyKey: params.idempotencyKey,
        consumedAt: Date.now(),
        response: params.response,
      };

      this.memoryCache.set(params.executionId, newEntry);
      if (params.idempotencyKey) {
        this.idempotencyIndex.set(params.idempotencyKey, params.executionId);
      }

      // 4. Persist to durable storage
      await this.persist();

      return { status: 'ALLOWED' };
    } finally {
      releaseLock();
    }
  }

  public async pruneExpired(maxAgeMs: number = DEFAULT_REPLAY_TTL_MS): Promise<void> {
    await this.initialize();
    const now = Date.now();
    let changed = false;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.consumedAt > maxAgeMs) {
        this.memoryCache.delete(key);
        if (entry.idempotencyKey) {
          this.idempotencyIndex.delete(entry.idempotencyKey);
        }
        changed = true;
      }
    }

    if (changed) {
      await this.persist();
    }
  }

  public async clear(): Promise<void> {
    await this.initialize();
    this.memoryCache.clear();
    this.idempotencyIndex.clear();
    try {
      if (fs.existsSync(this.filePath)) {
        await fs.promises.unlink(this.filePath);
      }
    } catch {
      // ignore
    }
  }
}

// Global default singleton store
export const defaultReplayStore = new FileDurableReplayStore();
