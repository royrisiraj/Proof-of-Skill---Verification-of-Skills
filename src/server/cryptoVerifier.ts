import crypto from 'node:crypto';
import canonicalize from 'canonicalize';

export interface CanonicalSubmission {
  tenantId: string;
  candidateId: string;
  challengeId: string;
  challengeVersion: number;
  attemptNumber: number;
  candidateCodeHash: string;
}

export interface CanonicalSigningData {
  executionId: string;
  challengeId: string;
  candidateCodeHash: string;
  status: string;
  timestamp: string;
  visiblePassed: number;
  visibleTotal: number;
  keyId?: string;
}

export interface TimestampValidationOptions {
  now?: number;
  maxAgeMs?: number;
  maxFutureSkewMs?: number;
}

export interface TimestampValidationResult {
  valid: boolean;
  reason?: string;
}

export const DEFAULT_MAX_TIMESTAMP_AGE_MS = 60 * 1000; // 60 seconds
export const DEFAULT_MAX_FUTURE_SKEW_MS = 15 * 1000;  // 15 seconds

/**
 * Computes a deterministic SHA-256 hex hash of candidate code.
 */
export function computeCandidateCodeHash(code: string): string {
  return crypto.createHash('sha256').update(code, 'utf-8').digest('hex');
}

/**
 * Computes deterministic RFC 8785 Canonical JSON SHA-256 fingerprint of a logical submission.
 */
export function computeCanonicalRequestFingerprint(submission: CanonicalSubmission): string {
  const canonicalObj = {
    attemptNumber: Number(submission.attemptNumber || 1),
    candidateCodeHash: submission.candidateCodeHash,
    candidateId: String(submission.candidateId || '').trim(),
    challengeId: String(submission.challengeId || '').trim(),
    challengeVersion: Number(submission.challengeVersion || 1),
    tenantId: String(submission.tenantId || '').trim(),
  };

  const canonicalJson = canonicalize(canonicalObj);
  if (!canonicalJson) {
    throw new Error('RFC 8785 Canonicalization failed for submission');
  }
  return crypto.createHash('sha256').update(canonicalJson, 'utf-8').digest('hex');
}

/**
 * Constructs the canonical signing string agreed between runner and verifier.
 */
export function buildCanonicalSigningString(data: CanonicalSigningData): string {
  const base = `${data.executionId}|${data.challengeId}|${data.candidateCodeHash}|${data.status}|${data.timestamp}|${data.visiblePassed}|${data.visibleTotal}`;
  return data.keyId ? `${base}|${data.keyId}` : base;
}

/**
 * Validates timestamp freshness to prevent replay of stale or future-dated signatures.
 */
export function validateTimestampFreshness(
  timestampStr: string,
  options: TimestampValidationOptions = {}
): TimestampValidationResult {
  if (!timestampStr || typeof timestampStr !== 'string') {
    return { valid: false, reason: 'Missing or non-string timestamp' };
  }

  const parsedMs = Date.parse(timestampStr);
  if (Number.isNaN(parsedMs)) {
    return { valid: false, reason: 'Malformed timestamp format' };
  }

  const now = options.now ?? Date.now();
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_TIMESTAMP_AGE_MS;
  const maxFutureSkewMs = options.maxFutureSkewMs ?? DEFAULT_MAX_FUTURE_SKEW_MS;

  const age = now - parsedMs;
  if (age > maxAgeMs) {
    return {
      valid: false,
      reason: `Signature timestamp is stale (age: ${Math.round(age / 1000)}s, max allowed: ${maxAgeMs / 1000}s)`,
    };
  }

  const futureDelta = parsedMs - now;
  if (futureDelta > maxFutureSkewMs) {
    return {
      valid: false,
      reason: `Signature timestamp is excessively future-dated (${Math.round(futureDelta / 1000)}s ahead of server clock)`,
    };
  }

  return { valid: true };
}

/**
 * Verifies an Ed25519 digital signature against the canonical execution string.
 * Uses Node.js native crypto.verify. Returns false if signature is invalid or key malformed.
 */
export function verifyExecutionSignature(
  data: CanonicalSigningData,
  signatureHex: string,
  publicKeyBase64OrPem: string
): boolean {
  if (!signatureHex || !publicKeyBase64OrPem) {
    return false;
  }

  try {
    const canonicalString = buildCanonicalSigningString(data);
    const dataBuffer = Buffer.from(canonicalString, 'utf-8');
    const signatureBuffer = Buffer.from(signatureHex, 'hex');

    let publicKey: crypto.KeyObject;

    if (publicKeyBase64OrPem.includes('-----BEGIN PUBLIC KEY-----')) {
      publicKey = crypto.createPublicKey({
        key: publicKeyBase64OrPem,
        format: 'pem',
      });
    } else {
      publicKey = crypto.createPublicKey({
        key: Buffer.from(publicKeyBase64OrPem, 'base64'),
        format: 'der',
        type: 'spki',
      });
    }

    return crypto.verify(null, dataBuffer, publicKey, signatureBuffer);
  } catch {
    // Return false without throwing or leaking crypto internals
    return false;
  }
}

/**
 * In-memory replay protection and idempotency store.
 * Tracks consumed execution identifiers and binds them to request context.
 */
interface ReplayEntry {
  executionId: string;
  challengeId: string;
  candidateCodeHash: string;
  idempotencyKey?: string;
  consumedAt: number;
  cachedResponse: any;
}

const replayCache = new Map<string, ReplayEntry>();
const REPLAY_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes retention

export function clearReplayStore(): void {
  replayCache.clear();
}

/**
 * Validates against replay attacks while allowing legitimate idempotent retries.
 */
export function checkAndRecordReplay(params: {
  executionId: string;
  challengeId: string;
  candidateCodeHash: string;
  idempotencyKey?: string;
  response: any;
}): { status: 'NEW' | 'IDEMPOTENT_REPLAY' | 'REPLAY_ATTACK'; cachedResponse?: any; reason?: string } {
  const now = Date.now();

  // Prune expired entries periodically
  if (replayCache.size > 200) {
    for (const [key, entry] of replayCache.entries()) {
      if (now - entry.consumedAt > REPLAY_CACHE_TTL_MS) {
        replayCache.delete(key);
      }
    }
  }

  const existing = replayCache.get(params.executionId);
  if (existing) {
    // Legitimate retry: exact same idempotencyKey, challengeId, and code hash
    if (
      params.idempotencyKey &&
      existing.idempotencyKey === params.idempotencyKey &&
      existing.challengeId === params.challengeId &&
      existing.candidateCodeHash === params.candidateCodeHash
    ) {
      return {
        status: 'IDEMPOTENT_REPLAY',
        cachedResponse: existing.cachedResponse,
      };
    }

    // Otherwise, a previously consumed executionId is being reused
    return {
      status: 'REPLAY_ATTACK',
      reason: `Execution ID '${params.executionId}' has already been consumed and cannot be replayed.`,
    };
  }

  // Record newly consumed execution ID
  replayCache.set(params.executionId, {
    executionId: params.executionId,
    challengeId: params.challengeId,
    candidateCodeHash: params.candidateCodeHash,
    idempotencyKey: params.idempotencyKey,
    consumedAt: now,
    cachedResponse: params.response,
  });

  return { status: 'NEW' };
}

// ==============================================================================
// Server-Side Ed25519 Cryptographic Signing & Public Key Management
// ==============================================================================

let _serverPrivateKey: crypto.KeyObject | null = null;
let _serverPublicKeyBase64: string | null = null;
const SERVER_KEY_ID = 'pos_server_ed25519_v1';

export function getServerSigningKey(): { privateKey: crypto.KeyObject; publicKeyBase64: string } {
  if (_serverPrivateKey && _serverPublicKeyBase64) {
    return { privateKey: _serverPrivateKey, publicKeyBase64: _serverPublicKeyBase64 };
  }

  // If provided in environment, parse it; otherwise generate a secure in-process key
  const envPriv = process.env.RUNNER_PRIVATE_KEY?.trim();
  if (envPriv) {
    try {
      _serverPrivateKey = crypto.createPrivateKey(envPriv);
      const pub = crypto.createPublicKey(_serverPrivateKey);
      _serverPublicKeyBase64 = pub.export({ type: 'spki', format: 'der' }).toString('base64');
      return { privateKey: _serverPrivateKey, publicKeyBase64: _serverPublicKeyBase64 };
    } catch {
      // fallback to generated key
    }
  }

  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
  _serverPrivateKey = privateKey;
  _serverPublicKeyBase64 = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  return { privateKey: _serverPrivateKey, publicKeyBase64: _serverPublicKeyBase64 };
}

export function getServerPublicKeyBase64(): string {
  // If explicitly configured in env, allow override
  if (process.env.RUNNER_PUBLIC_KEY?.trim()) {
    return process.env.RUNNER_PUBLIC_KEY.trim();
  }
  return getServerSigningKey().publicKeyBase64;
}

export function signCanonicalData(data: CanonicalSigningData): { signature: string; keyId: string } {
  const { privateKey } = getServerSigningKey();
  const canonicalString = buildCanonicalSigningString(data);
  const dataBuffer = Buffer.from(canonicalString, 'utf-8');
  const signatureHex = crypto.sign(null, dataBuffer, privateKey).toString('hex');
  return {
    signature: signatureHex,
    keyId: SERVER_KEY_ID,
  };
}

