import type { ExecuteRequest, ExecuteResponse, ApiErrorCode } from '../services/api/types';
import {
  computeCandidateCodeHash,
  verifyExecutionSignature,
  validateTimestampFreshness,
  getServerPublicKeyBase64,
} from './cryptoVerifier';
import { defaultReplayStore, ReplayStorageError } from './replayStore';
import { executePythonInServer } from './pythonRunner';

export class SandboxError extends Error {
  public code: ApiErrorCode;
  public details?: string[];

  constructor(code: ApiErrorCode, sanitizedMessage: string, details?: string[]) {
    super(sanitizedMessage);
    this.name = 'SandboxError';
    this.code = code;
    this.details = details;
  }
}

export function isSandboxConfigured(): boolean {
  // The server has a built-in isolated Python execution engine available out-of-the-box
  return true;
}

/**
 * Dispatches candidate code execution to an isolated Python execution engine.
 * When SANDBOX_SERVICE_URL is set, it can delegate to an external runner; otherwise,
 * it runs securely inside the server's native isolated child process environment.
 * Enforces strict 5-second timeout, timestamp freshness validation, durable replay attack prevention,
 * and Ed25519 digital signature verification.
 */
export async function executeInSandbox(request: ExecuteRequest): Promise<ExecuteResponse> {
  const sandboxUrl = process.env.SANDBOX_SERVICE_URL?.trim();
  const apiKey = process.env.SANDBOX_API_KEY?.trim();
  const runnerPublicKey = process.env.RUNNER_PUBLIC_KEY?.trim();


  const candidateCodeHash = computeCandidateCodeHash(request.candidateCode);

  // 1. Pre-execution Idempotency Conflict and Match Check
  if (request.idempotencyKey) {
    try {
      const idempCheck = await defaultReplayStore.checkIdempotencyKey({
        idempotencyKey: request.idempotencyKey,
        challengeId: request.challengeId,
        candidateCodeHash,
      });

      if (idempCheck.status === 'CONFLICT') {
        throw new SandboxError(
          'IDEMPOTENCY_CONFLICT',
          `Idempotency key was previously used with a different code submission or challenge.`
        );
      }

      if (idempCheck.status === 'MATCH' && idempCheck.cachedResponse) {
        return idempCheck.cachedResponse;
      }
    } catch (err: unknown) {
      if (err instanceof SandboxError) throw err;
      if (err instanceof ReplayStorageError) {
        console.error('[REPLAY_STORAGE_OUTAGE]', err);
        throw new SandboxError(
          'SERVICE_UNAVAILABLE',
          'Replay protection storage is temporarily unavailable. Execution rejected.'
        );
      }
      throw err;
    }
  }

  let data: any;

  if (sandboxUrl) {
    const controller = new AbortController();
    const timeoutMs = 5000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      const targetEndpoint = `${sandboxUrl.replace(/\/+$/, '')}/execute`;
      response = await fetch(targetEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          challengeId: request.challengeId,
          candidateCode: request.candidateCode,
          regressionTestCode: request.regressionTestCode || '',
          idempotencyKey: request.idempotencyKey,
        }),
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      // Log diagnostic information securely on the server only
      const rawError = err instanceof Error ? err.message : String(err);
      console.error('[SANDBOX_CONNECTION_ERROR]', {
        timestamp: new Date().toISOString(),
        challengeId: request.challengeId,
        error: rawError,
      });

      if (err instanceof Error && err.name === 'AbortError') {
        throw new SandboxError(
          'EXECUTION_TIMEOUT',
          'Execution exceeded the 5.0 second sandbox limit. Please optimize your code.'
        );
      }

      // Return sanitized message with no internal URLs or network details
      throw new SandboxError(
        'SANDBOX_UNAVAILABLE',
        'The isolated code execution service is temporarily unreachable. Please retry or switch to mock mode.'
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      console.error('[SANDBOX_HTTP_ERROR]', {
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString(),
      });

      throw new SandboxError(
        'SANDBOX_UNAVAILABLE',
        'The isolated code execution service encountered an error. Please retry or switch to mock mode.'
      );
    }

    try {
      data = await response.json();
    } catch {
      throw new SandboxError(
        'SANDBOX_UNAVAILABLE',
        'Received an invalid response from the code execution service.'
      );
    }
  } else {
    // Execute genuinely and securely via native isolated server Python subprocess
    data = await executePythonInServer(request);
  }

  // 2. Response Binding & Context Validation
  const executionId = String(data.executionId || '').trim();
  if (!executionId || !/^exec_[a-zA-Z0-9_-]{6,64}$/.test(executionId)) {
    console.error('[SECURITY_INTEGRITY_VIOLATION] Malformed executionId format:', executionId);
    throw new SandboxError(
      'INTEGRITY_VERIFICATION_FAILED',
      'Execution response contained a malformed or missing execution identifier.'
    );
  }

  if (data.challengeId !== request.challengeId) {
    console.error('[SECURITY_CONTEXT_MISMATCH]', {
      expectedChallengeId: request.challengeId,
      receivedChallengeId: data.challengeId,
    });
    throw new SandboxError(
      'INTEGRITY_VERIFICATION_FAILED',
      'Execution response challenge context does not match the active challenge.'
    );
  }

  // 3. Timestamp Freshness & Skew Validation
  const freshness = validateTimestampFreshness(data.timestamp);
  if (!freshness.valid) {
    console.error('[SECURITY_STALE_SIGNATURE]', {
      executionId,
      timestamp: data.timestamp,
      reason: freshness.reason,
    });
    throw new SandboxError(
      'INTEGRITY_VERIFICATION_FAILED',
      freshness.reason || 'Execution response timestamp is invalid or stale.'
    );
  }

  // 4. Cryptographic Signature Verification
  const verificationPublicKey = runnerPublicKey || getServerPublicKeyBase64();
  if (!verificationPublicKey) {
    console.error('[SECURITY_CONFIG_ERROR] Verification public key is missing on server.');
    throw new SandboxError(
      'INTEGRITY_VERIFICATION_FAILED',
      'Server integrity verification key is missing. Execution results cannot be authenticated.'
    );
  }

  const isSignatureValid = verifyExecutionSignature(
    {
      executionId,
      challengeId: request.challengeId,
      candidateCodeHash,
      status: String(data.status || ''),
      timestamp: String(data.timestamp || ''),
      visiblePassed: Number(data.summary?.visiblePassed ?? data.summary?.passedCount ?? 0),
      visibleTotal: Number(data.summary?.visibleTotal ?? data.summary?.totalCount ?? 0),
    },
    data.signature || '',
    verificationPublicKey
  );

  if (!isSignatureValid) {
    console.error('[INTEGRITY_VERIFICATION_FAILED]', {
      executionId,
      timestamp: new Date().toISOString(),
    });
    throw new SandboxError(
      'INTEGRITY_VERIFICATION_FAILED',
      'Cryptographic signature check failed. Evidence authenticity could not be verified.'
    );
  }

  // 5. Construct sanitized, trusted response
  const sanitizedResponse: ExecuteResponse = {
    executionId,
    challengeId: request.challengeId,
    status: data.status === 'passed' ? 'passed' : 'failed',
    executionSource: 'server_verified',
    durationMs: Math.max(1, Math.round(Number(data.durationMs) || 0)),
    summary: {
      passedCount: Number(data.summary?.visiblePassed ?? data.summary?.passedCount ?? 0),
      totalCount: Number(data.summary?.visibleTotal ?? data.summary?.totalCount ?? 0),
      visiblePassed: Number(data.summary?.visiblePassed ?? data.summary?.passedCount ?? 0),
      visibleTotal: Number(data.summary?.visibleTotal ?? data.summary?.totalCount ?? 0),
      regressionTestPassed: Boolean(data.summary?.regressionTestPassed),
    },
    testCases: Array.isArray(data.testCases)
      ? data.testCases.map((tc: any, index: number) => ({
          id: String(tc.id || `tc-${index + 1}`),
          name: String(tc.name || `test_case_${index + 1}`),
          status: tc.status === 'passed' ? 'passed' : 'failed',
          durationMs: Math.round(Number(tc.durationMs) || 0),
          message: tc.message ? String(tc.message).slice(0, 500) : undefined,
        }))
      : [],
    logs: Array.isArray(data.logs) ? data.logs.map((l: any) => String(l).slice(0, 300)) : [],
    errorTrace: data.errorTrace ? String(data.errorTrace).slice(0, 1000) : undefined,
    signature: String(data.signature),
    keyId: data.keyId ? String(data.keyId) : undefined,
    timestamp: String(data.timestamp),
  };

  // 6. Durable Replay Protection & Idempotency Store
  try {
    const replayResult = await defaultReplayStore.checkAndRecord({
      executionId,
      challengeId: request.challengeId,
      candidateCodeHash,
      idempotencyKey: request.idempotencyKey,
      response: sanitizedResponse,
    });

    if (replayResult.status === 'IDEMPOTENT_REPLAY') {
      return (replayResult.cachedResponse as ExecuteResponse) || sanitizedResponse;
    }

    if (replayResult.status === 'IDEMPOTENCY_CONFLICT') {
      throw new SandboxError(
        'IDEMPOTENCY_CONFLICT',
        replayResult.reason || 'Idempotency key conflicts with an existing submission.'
      );
    }

    if (replayResult.status === 'REPLAY_ATTACK') {
      console.error('[SECURITY_REPLAY_ATTACK_REJECTED]', {
        executionId,
        reason: replayResult.reason,
      });
      throw new SandboxError(
        'INTEGRITY_VERIFICATION_FAILED',
        'Execution response was already consumed. Replayed evidence rejected.'
      );
    }
  } catch (err: unknown) {
    if (err instanceof SandboxError) throw err;
    if (err instanceof ReplayStorageError) {
      console.error('[REPLAY_STORAGE_FAILURE_FAIL_CLOSED]', err);
      throw new SandboxError(
        'SERVICE_UNAVAILABLE',
        'Replay verification storage failure. Execution rejected to maintain security invariants.'
      );
    }
    throw err;
  }

  return sanitizedResponse;
}
