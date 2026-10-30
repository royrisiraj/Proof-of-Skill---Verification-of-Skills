import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { validatePayloadSize, ExecutionApiError } from '../executionClient';
import { handleExecute } from '../../../server/executeHandler';
import {
  computeCandidateCodeHash,
  buildCanonicalSigningString,
  verifyExecutionSignature,
  validateTimestampFreshness,
} from '../../../server/cryptoVerifier';
import {
  FileDurableReplayStore,
  ReplayStorageError,
  defaultReplayStore,
} from '../../../server/replayStore';
import type { Request, Response } from 'express';
import type { ExecuteResponse } from '../types';

console.log('=== Running Proof of Skill Milestone 3 Production Readiness & Security Tests ===');

// Test 1: validatePayloadSize accepts valid request
try {
  validatePayloadSize({
    challengeId: 'CH-4982',
    candidateCode: 'def purge(): pass',
  });
  console.log('✓ Test 1 Passed: Valid payload size accepted.');
} catch (e) {
  console.error('✗ Test 1 Failed:', e);
  process.exit(1);
}

// Test 2: validatePayloadSize rejects missing challengeId
try {
  validatePayloadSize({
    challengeId: '',
    candidateCode: 'def purge(): pass',
  });
  console.error('✗ Test 2 Failed: Did not reject empty challengeId');
  process.exit(1);
} catch (e) {
  if (e instanceof ExecutionApiError && e.code === 'VALIDATION_ERROR') {
    console.log('✓ Test 2 Passed: Rejected missing challengeId with VALIDATION_ERROR.');
  } else {
    console.error('✗ Test 2 Failed with unexpected error:', e);
    process.exit(1);
  }
}

// Test 3: validatePayloadSize rejects oversized code (> 64,000 characters)
try {
  const hugeCode = 'a'.repeat(64001);
  validatePayloadSize({
    challengeId: 'CH-4982',
    candidateCode: hugeCode,
  });
  console.error('✗ Test 3 Failed: Did not reject oversized payload');
  process.exit(1);
} catch (e) {
  if (e instanceof ExecutionApiError && e.code === 'PAYLOAD_TOO_LARGE') {
    console.log('✓ Test 3 Passed: Rejected oversized payload with PAYLOAD_TOO_LARGE.');
  } else {
    console.error('✗ Test 3 Failed with unexpected error:', e);
    process.exit(1);
  }
}

// Test 4: Native server execution without SANDBOX_SERVICE_URL returns HTTP 200 server_verified
delete process.env.SANDBOX_SERVICE_URL;
delete process.env.ENABLE_M1_CONTRACT_SIMULATOR;

let statusCodeExec = 0;
let jsonExec: any = null;

const reqExec = {
  body: {
    challengeId: 'CH-4982',
    candidateCode: 'def evaluate_session_activity(events, current_time, window_seconds, max_allowed):\n    cutoff = current_time - window_seconds\n    retained = [e for e in events if e.get("timestamp", 0) >= cutoff]\n    return {"allowed": len(retained) <= max_allowed, "active_count": len(retained), "retained_events": retained}',
  },
} as unknown as Request;

const resExec = {
  status(code: number) {
    statusCodeExec = code;
    return this;
  },
  json(data: any) {
    jsonExec = data;
    return this;
  },
} as unknown as Response;

await handleExecute(reqExec, resExec);

if (
  statusCodeExec === 200 &&
  jsonExec?.executionSource === 'server_verified' &&
  jsonExec?.status === 'passed' &&
  jsonExec?.signature
) {
  console.log('✓ Test 4 Passed: Server executed native Python code, returned server_verified with Ed25519 signature.');
} else {
  console.error('✗ Test 4 Failed: Expected HTTP 200 server_verified, got', statusCodeExec, jsonExec);
  process.exit(1);
}


// Test 5: Ed25519 digital signature generation and verification
const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
const publicKeySpkiB64 = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');

const signingData = {
  executionId: 'exec_real_8a9f2bc104de',
  challengeId: 'CH-4982',
  candidateCodeHash: computeCandidateCodeHash('def solution(): return True'),
  status: 'passed',
  timestamp: new Date().toISOString(),
  visiblePassed: 3,
  visibleTotal: 3,
};

const canonicalString = buildCanonicalSigningString(signingData);
const validSignatureHex = crypto
  .sign(null, Buffer.from(canonicalString, 'utf-8'), privateKey)
  .toString('hex');

const isValid = verifyExecutionSignature(signingData, validSignatureHex, publicKeySpkiB64);
if (!isValid) {
  console.error('✗ Test 5 Failed: Valid Ed25519 signature was rejected');
  process.exit(1);
}
console.log('✓ Test 5 Passed: Valid Ed25519 signature verified.');

// Test 6: Invariant check: hiddenPassed and hiddenTotal are never exposed
process.env.ENABLE_M1_CONTRACT_SIMULATOR = 'true';
let m1StatusCode = 0;
let m1Json: any = null;

const reqM1 = {
  body: {
    challengeId: 'CH-4982',
    candidateCode: 'retained_events = [e for e in events]',
    regressionTestCode: 'def test(): assert True',
  },
} as unknown as Request;

const resM1 = {
  status(code: number) {
    m1StatusCode = code;
    return this;
  },
  json(data: any) {
    m1Json = data;
    return this;
  },
} as unknown as Response;

await handleExecute(reqM1, resM1);

if (m1StatusCode === 200 && m1Json) {
  if ('hiddenPassed' in m1Json.summary || 'hiddenTotal' in m1Json.summary) {
    console.error('✗ Test 6 Failed: Hidden test counts present in response');
    process.exit(1);
  }
  console.log('✓ Test 6 Passed: Hidden test counts strictly excluded from response.');
} else {
  console.error('✗ Test 6 Failed:', m1StatusCode, m1Json);
  process.exit(1);
}

// Test 7: Timestamp freshness - Reject expired timestamps (> 60s old)
const staleTimestamp = new Date(Date.now() - 65 * 1000).toISOString();
const staleCheck = validateTimestampFreshness(staleTimestamp);
if (!staleCheck.valid && staleCheck.reason?.includes('stale')) {
  console.log('✓ Test 7 Passed: Stale timestamp (>60s) rejected with security reason.');
} else {
  console.error('✗ Test 7 Failed: Stale timestamp was accepted:', staleCheck);
  process.exit(1);
}

// Test 8: Timestamp freshness - Reject excessively future-dated timestamps (> 15s future)
const futureTimestamp = new Date(Date.now() + 30 * 1000).toISOString();
const futureCheck = validateTimestampFreshness(futureTimestamp);
if (!futureCheck.valid && futureCheck.reason?.includes('future-dated')) {
  console.log('✓ Test 8 Passed: Excessively future-dated timestamp (>15s) rejected.');
} else {
  console.error('✗ Test 8 Failed: Future timestamp was accepted:', futureCheck);
  process.exit(1);
}

// Test 9: Timestamp freshness - Reject malformed timestamps
const malformedCheck = validateTimestampFreshness('invalid-not-a-date');
if (!malformedCheck.valid && malformedCheck.reason?.includes('Malformed')) {
  console.log('✓ Test 9 Passed: Malformed timestamp rejected.');
} else {
  console.error('✗ Test 9 Failed: Malformed timestamp was accepted:', malformedCheck);
  process.exit(1);
}

// Test 10: Timestamp freshness - Accept valid fresh timestamps (now - 2s)
const freshTimestamp = new Date(Date.now() - 2 * 1000).toISOString();
const freshCheck = validateTimestampFreshness(freshTimestamp);
if (freshCheck.valid) {
  console.log('✓ Test 10 Passed: Valid fresh timestamp accepted.');
} else {
  console.error('✗ Test 10 Failed: Fresh timestamp rejected:', freshCheck);
  process.exit(1);
}

// Test 11: Binding Check - Altered executionId tampering fails signature verification
const alteredExecutionIdData = { ...signingData, executionId: 'exec_real_different_id' };
const isAlteredExecValid = verifyExecutionSignature(alteredExecutionIdData, validSignatureHex, publicKeySpkiB64);
if (!isAlteredExecValid) {
  console.log('✓ Test 11 Passed: Altered executionId tampering detected and rejected.');
} else {
  console.error('✗ Test 11 Failed: Altered executionId was accepted!');
  process.exit(1);
}

// Test 12: Binding Check - Altered candidateCodeHash tampering fails signature verification
const alteredCodeData = { ...signingData, candidateCodeHash: computeCandidateCodeHash('tampered malicious code') };
const isAlteredCodeValid = verifyExecutionSignature(alteredCodeData, validSignatureHex, publicKeySpkiB64);
if (!isAlteredCodeValid) {
  console.log('✓ Test 12 Passed: Altered candidateCodeHash tampering detected and rejected.');
} else {
  console.error('✗ Test 12 Failed: Altered code hash was accepted!');
  process.exit(1);
}

// Test 13: Durable ReplayStore - Idempotency & Replay Attack Defense
const testStoreFile = path.join(process.cwd(), '.data', 'test_replay_store.json');
const durableStore = new FileDurableReplayStore(testStoreFile);
await durableStore.clear();

const mockVerifiedResponse: ExecuteResponse = {
  executionId: 'exec_real_test_durable_01',
  challengeId: 'CH-4982',
  status: 'passed',
  executionSource: 'server_verified',
  durationMs: 45,
  summary: {
    passedCount: 3,
    totalCount: 3,
    visiblePassed: 3,
    visibleTotal: 3,
    regressionTestPassed: true,
  },
  testCases: [],
  logs: ['all passed'],
  timestamp: new Date().toISOString(),
};

// First consumption
const firstRecord = await durableStore.checkAndRecord({
  executionId: 'exec_real_test_durable_01',
  challengeId: 'CH-4982',
  candidateCodeHash: signingData.candidateCodeHash,
  idempotencyKey: 'idemp-key-durable-001',
  response: mockVerifiedResponse,
});
if (firstRecord.status === 'ALLOWED') {
  console.log('✓ Test 13.1 Passed: Initial execution recorded in durable replay store.');
} else {
  console.error('✗ Test 13.1 Failed:', firstRecord);
  process.exit(1);
}

// Replay attempt on same execution ID with different code
const replayAttempt = await durableStore.checkAndRecord({
  executionId: 'exec_real_test_durable_01',
  challengeId: 'CH-4982',
  candidateCodeHash: computeCandidateCodeHash('different code'),
  idempotencyKey: 'different-idemp-key',
  response: mockVerifiedResponse,
});
if (replayAttempt.status === 'REPLAY_ATTACK') {
  console.log('✓ Test 13.2 Passed: Replayed executionId detected and rejected as REPLAY_ATTACK.');
} else {
  console.error('✗ Test 13.2 Failed:', replayAttempt);
  process.exit(1);
}

// Valid idempotent retry
const idempotentRetry = await durableStore.checkAndRecord({
  executionId: 'exec_real_test_durable_01',
  challengeId: 'CH-4982',
  candidateCodeHash: signingData.candidateCodeHash,
  idempotencyKey: 'idemp-key-durable-001',
  response: mockVerifiedResponse,
});
if (idempotentRetry.status === 'IDEMPOTENT_REPLAY' && idempotentRetry.cachedResponse?.executionId === 'exec_real_test_durable_01') {
  console.log('✓ Test 13.3 Passed: Legitimate idempotent retry returned cached verified response.');
} else {
  console.error('✗ Test 13.3 Failed:', idempotentRetry);
  process.exit(1);
}

// Test 14: Conflicting Idempotency Key Detection (same idempotencyKey with different code)
const conflictCheck = await durableStore.checkIdempotencyKey({
  idempotencyKey: 'idemp-key-durable-001',
  challengeId: 'CH-4982',
  candidateCodeHash: computeCandidateCodeHash('altered code content'),
});
if (conflictCheck.status === 'CONFLICT') {
  console.log('✓ Test 14 Passed: Reusing idempotency key with conflicting code correctly detected as CONFLICT.');
} else {
  console.error('✗ Test 14 Failed: Conflicting idempotency key was not detected:', conflictCheck);
  process.exit(1);
}

// Test 15: Concurrent Requests Mutual Exclusion
const concurrentExecId = 'exec_real_concurrent_01';
const concurrentCodeHash = computeCandidateCodeHash('def conc(): pass');
const [res1, res2] = await Promise.all([
  durableStore.checkAndRecord({
    executionId: concurrentExecId,
    challengeId: 'CH-4982',
    candidateCodeHash: concurrentCodeHash,
    idempotencyKey: 'conc-key-1',
    response: mockVerifiedResponse,
  }),
  durableStore.checkAndRecord({
    executionId: concurrentExecId,
    challengeId: 'CH-4982',
    candidateCodeHash: concurrentCodeHash,
    idempotencyKey: 'conc-key-2',
    response: mockVerifiedResponse,
  }),
]);

const allowedCount = [res1, res2].filter((r) => r.status === 'ALLOWED').length;
const replayCount = [res1, res2].filter((r) => r.status === 'REPLAY_ATTACK').length;

if (allowedCount === 1 && replayCount === 1) {
  console.log('✓ Test 15 Passed: Concurrent racing duplicate requests serialized; one accepted and one rejected.');
} else {
  console.error('✗ Test 15 Failed: Concurrency control failed:', { res1, res2 });
  process.exit(1);
}

// Test 16: Durable ReplayStore Pruning of Expired Entries
const pruneStoreFile = path.join(process.cwd(), '.data', 'test_prune_store.json');
const pruneStore = new FileDurableReplayStore(pruneStoreFile);
await pruneStore.clear();

await pruneStore.checkAndRecord({
  executionId: 'exec_real_stale_to_prune',
  challengeId: 'CH-4982',
  candidateCodeHash: signingData.candidateCodeHash,
  idempotencyKey: 'prune-key-1',
  response: mockVerifiedResponse,
});

// Force prune with 0ms age to simulate expiration
await pruneStore.pruneExpired(0);

// Key should now be NEW because entry was pruned
const postPruneCheck = await pruneStore.checkIdempotencyKey({
  idempotencyKey: 'prune-key-1',
  challengeId: 'CH-4982',
  candidateCodeHash: signingData.candidateCodeHash,
});

if (postPruneCheck.status === 'NEW') {
  console.log('✓ Test 16 Passed: Expired entries correctly pruned from durable storage.');
} else {
  console.error('✗ Test 16 Failed: Expired entry was not pruned:', postPruneCheck);
  process.exit(1);
}

// Cleanup test stores
await durableStore.clear();
await pruneStore.clear();

console.log('=== All 16 Milestone 3 Security & Unit Tests Passed Successfully ===');
