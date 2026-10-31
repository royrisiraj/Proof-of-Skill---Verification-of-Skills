import fs from 'node:fs';
import path from 'node:path';
import type { ExecuteResponse } from '../services/api/types';

export class ReplayStorageError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ReplayStorageError';
  }
}

export type ExecutionState = 'PENDING' | 'COMPLETED' | 'FAILED' | 'AMBIGUOUS_LAUNCH';

export interface ReplayEntry {
  executionId: string;
  tenantId?: string;
  challengeId: string;
  candidateCodeHash: string;
  requestFingerprint?: string;
  idempotencyKey?: string;
  ownerToken?: string;
  state: ExecutionState;
  fencingGeneration: number;
  consumedAt: number;
  lastHeartbeat?: number;
  leaseExpiresAt?: number;
  nextRetryAt?: number;
  error?: string;
  response?: ExecuteResponse;
}

export interface ReplayCheckResult {
  status:
    | 'ALLOWED'
    | 'IDEMPOTENT_REPLAY'
    | 'REPLAY_ATTACK'
    | 'IDEMPOTENCY_CONFLICT'
    | 'IN_PROGRESS'
    | 'RETRY_BACKOFF_ACTIVE'
    | 'FENCING_MISMATCH_STALE_WORKER'
    | 'INCONSISTENT_RECORDS_FAIL_CLOSED';
  cachedResponse?: ExecuteResponse;
  reason?: string;
  remainingBackoffSec?: number;
  fencingGeneration?: number;
}

export interface ReserveParams {
  tenantId?: string;
  executionId: string;
  challengeId: string;
  candidateCodeHash: string;
  requestFingerprint?: string;
  idempotencyKey?: string;
  ownerToken: string;
  leaseTtlSec?: number;
}

export interface ReplayStore {
  reserveExecution(params: ReserveParams): Promise<ReplayCheckResult>;
  renewLease(params: { executionId: string; ownerToken: string; requestFingerprint?: string; leaseTtlSec?: number }): Promise<boolean>;
  completeExecution(params: { executionId: string; ownerToken: string; requestFingerprint?: string; response: ExecuteResponse }): Promise<boolean>;
  failExecution(params: { executionId: string; ownerToken: string; requestFingerprint?: string; error: string; backoffSec?: number }): Promise<boolean>;
  setAmbiguousLaunch(params: { executionId: string; ownerToken: string; error: string }): Promise<boolean>;

  checkAndRecord(params: {
    executionId: string;
    challengeId: string;
    candidateCodeHash: string;
    idempotencyKey?: string;
    response: ExecuteResponse;
  }): Promise<ReplayCheckResult>;

  checkIdempotencyKey(params: {
    idempotencyKey: string;
    challengeId: string;
    candidateCodeHash: string;
  }): Promise<{ status: 'NEW' | 'MATCH' | 'CONFLICT'; cachedResponse?: ExecuteResponse }>;

  pruneExpired(maxAgeMs?: number): Promise<void>;
  clear(): Promise<void>;
}

export const DEFAULT_REPLAY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const DEFAULT_LEASE_TTL_MS = 15 * 1000; // 15 seconds

/**
 * File-backed durable replay store with atomic state transitions,
 * fencing generation tracking, and memory caching.
 */
export class FileDurableReplayStore implements ReplayStore {
  private memoryCache = new Map<string, ReplayEntry>();
  private idempotencyIndex = new Map<string, string>(); // idempotencyKey -> executionId
  private fencingGenerations = new Map<string, number>(); // executionId -> monotonic generation
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
                if (item.fencingGeneration) {
                  this.fencingGenerations.set(item.executionId, item.fencingGeneration);
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
        // ignore
      }
      throw new ReplayStorageError('Durable replay storage write failure', err);
    }
  }

  public async reserveExecution(params: ReserveParams): Promise<ReplayCheckResult> {
    await this.initialize();

    let releaseLock: () => void = () => {};
    const lock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    const previousLock = this.writeMutex;
    this.writeMutex = lock;

    try {
      await previousLock;
      const now = Date.now();
      const leaseTtl = (params.leaseTtlSec ? params.leaseTtlSec * 1000 : DEFAULT_LEASE_TTL_MS);

      // Check idempotency record if key provided
      if (params.idempotencyKey) {
        const mappedExecId = this.idempotencyIndex.get(params.idempotencyKey);
        if (mappedExecId && mappedExecId !== params.executionId) {
          const mappedEntry = this.memoryCache.get(mappedExecId);
          if (mappedEntry) {
            if (
              mappedEntry.candidateCodeHash !== params.candidateCodeHash ||
              mappedEntry.challengeId !== params.challengeId
            ) {
              return {
                status: 'IDEMPOTENCY_CONFLICT',
                reason: `Idempotency key '${params.idempotencyKey}' was previously bound to different code or challenge.`,
              };
            }
            if (mappedEntry.state === 'COMPLETED' && mappedEntry.response) {
              return { status: 'IDEMPOTENT_REPLAY', cachedResponse: mappedEntry.response };
            }
            if (mappedEntry.state === 'PENDING' || mappedEntry.state === 'AMBIGUOUS_LAUNCH') {
              return { status: 'IN_PROGRESS', reason: 'Previous submission with this idempotency key is currently executing.' };
            }
          }
        }
      }

      const existing = this.memoryCache.get(params.executionId);
      if (existing) {
        // Replay of completed execution
        if (existing.state === 'COMPLETED') {
          if (
            existing.candidateCodeHash === params.candidateCodeHash &&
            existing.challengeId === params.challengeId
          ) {
            return { status: 'IDEMPOTENT_REPLAY', cachedResponse: existing.response };
          }
          return {
            status: 'REPLAY_ATTACK',
            reason: `Execution ID '${params.executionId}' was already consumed with different code submission.`,
          };
        }

        // Active execution
        if (existing.state === 'PENDING' || existing.state === 'AMBIGUOUS_LAUNCH') {
          if (
            existing.candidateCodeHash === params.candidateCodeHash &&
            existing.challengeId === params.challengeId
          ) {
            return { status: 'IN_PROGRESS', reason: 'Execution is currently in progress.' };
          }
          return {
            status: 'IDEMPOTENCY_CONFLICT',
            reason: `Execution ID '${params.executionId}' is currently executing with different parameters.`,
          };
        }

        // Failed state: check retry backoff
        if (existing.state === 'FAILED') {
          if (
            existing.candidateCodeHash !== params.candidateCodeHash ||
            existing.challengeId !== params.challengeId
          ) {
            return {
              status: 'IDEMPOTENCY_CONFLICT',
              reason: `Failed execution '${params.executionId}' cannot be reused with different code.`,
            };
          }
          if (existing.nextRetryAt && now < existing.nextRetryAt) {
            const remaining = Math.ceil((existing.nextRetryAt - now) / 1000);
            return {
              status: 'RETRY_BACKOFF_ACTIVE',
              remainingBackoffSec: remaining,
              reason: `Retry backoff active. Please wait ${remaining} seconds before re-attempting.`,
            };
          }
        }
      }

      // Compute monotonic fencing generation
      const currentGen = (this.fencingGenerations.get(params.executionId) || 0) + 1;
      this.fencingGenerations.set(params.executionId, currentGen);

      // Record new PENDING entry
      const newEntry: ReplayEntry = {
        executionId: params.executionId,
        tenantId: params.tenantId,
        challengeId: params.challengeId,
        candidateCodeHash: params.candidateCodeHash,
        requestFingerprint: params.requestFingerprint,
        idempotencyKey: params.idempotencyKey,
        ownerToken: params.ownerToken,
        state: 'PENDING',
        fencingGeneration: currentGen,
        consumedAt: now,
        lastHeartbeat: now,
        leaseExpiresAt: now + leaseTtl,
      };

      this.memoryCache.set(params.executionId, newEntry);
      if (params.idempotencyKey) {
        this.idempotencyIndex.set(params.idempotencyKey, params.executionId);
      }

      await this.persist();
      return { status: 'ALLOWED', fencingGeneration: currentGen };
    } finally {
      releaseLock();
    }
  }

  public async renewLease(params: {
    executionId: string;
    ownerToken: string;
    requestFingerprint?: string;
    leaseTtlSec?: number;
  }): Promise<boolean> {
    await this.initialize();
    const entry = this.memoryCache.get(params.executionId);
    if (!entry || entry.state !== 'PENDING') return false;
    if (entry.ownerToken !== params.ownerToken) return false;

    const now = Date.now();
    if (entry.leaseExpiresAt && now > entry.leaseExpiresAt) return false;

    entry.lastHeartbeat = now;
    entry.leaseExpiresAt = now + (params.leaseTtlSec ? params.leaseTtlSec * 1000 : DEFAULT_LEASE_TTL_MS);
    await this.persist();
    return true;
  }

  public async completeExecution(params: {
    executionId: string;
    ownerToken: string;
    requestFingerprint?: string;
    response: ExecuteResponse;
  }): Promise<boolean> {
    await this.initialize();
    const entry = this.memoryCache.get(params.executionId);
    if (!entry || (entry.state !== 'PENDING' && entry.state !== 'AMBIGUOUS_LAUNCH')) return false;
    if (entry.ownerToken !== params.ownerToken) return false;

    entry.state = 'COMPLETED';
    entry.response = params.response;
    entry.consumedAt = Date.now();
    await this.persist();
    return true;
  }

  public async failExecution(params: {
    executionId: string;
    ownerToken: string;
    requestFingerprint?: string;
    error: string;
    backoffSec?: number;
  }): Promise<boolean> {
    await this.initialize();
    const entry = this.memoryCache.get(params.executionId);
    if (!entry || (entry.state !== 'PENDING' && entry.state !== 'AMBIGUOUS_LAUNCH')) return false;
    if (entry.ownerToken !== params.ownerToken) return false;

    const now = Date.now();
    const backoffMs = (params.backoffSec !== undefined ? params.backoffSec : 5) * 1000;
    entry.state = 'FAILED';
    entry.error = params.error;
    entry.nextRetryAt = now + backoffMs;
    await this.persist();
    return true;
  }

  public async setAmbiguousLaunch(params: { executionId: string; ownerToken: string; error: string }): Promise<boolean> {
    await this.initialize();
    const entry = this.memoryCache.get(params.executionId);
    if (!entry || entry.state !== 'PENDING') return false;
    if (entry.ownerToken !== params.ownerToken) return false;

    entry.state = 'AMBIGUOUS_LAUNCH';
    entry.error = params.error;
    entry.leaseExpiresAt = Date.now() + 300 * 1000; // 5 min quarantine
    await this.persist();
    return true;
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

    if (
      existingEntry.challengeId === params.challengeId &&
      existingEntry.candidateCodeHash === params.candidateCodeHash
    ) {
      return {
        status: 'MATCH',
        cachedResponse: existingEntry.response,
      };
    }

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

      // 3. Atomically Record Entry as COMPLETED
      const newEntry: ReplayEntry = {
        executionId: params.executionId,
        challengeId: params.challengeId,
        candidateCodeHash: params.candidateCodeHash,
        idempotencyKey: params.idempotencyKey,
        state: 'COMPLETED',
        fencingGeneration: (this.fencingGenerations.get(params.executionId) || 0) + 1,
        consumedAt: Date.now(),
        response: params.response,
      };

      this.memoryCache.set(params.executionId, newEntry);
      if (params.idempotencyKey) {
        this.idempotencyIndex.set(params.idempotencyKey, params.executionId);
      }

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
    this.fencingGenerations.clear();
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
