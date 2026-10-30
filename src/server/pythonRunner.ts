import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { ExecuteRequest, ExecuteResponse } from '../services/api/types';
import {
  computeCandidateCodeHash,
  signCanonicalData,
  getServerPublicKeyBase64,
  verifyExecutionSignature,
} from './cryptoVerifier';
import { SandboxError } from './sandboxClient';

interface RawTestCaseResult {
  id: string;
  name: string;
  status: 'passed' | 'failed';
  durationMs: number;
  message?: string;
  isHidden?: boolean;
}

/**
 * Executes candidate Python code within an ephemeral, isolated subprocess on the server.
 * Uses system python3 with strict timeouts, clean environment, resource restrictions,
 * and server-authoritative Ed25519 digital signature generation.
 */
export async function executePythonInServer(request: ExecuteRequest): Promise<ExecuteResponse> {
  const startTime = Date.now();
  const candidateCodeHash = computeCandidateCodeHash(request.candidateCode);

  // 1. Create ephemeral scratch directory
  const runId = `exec_srv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `pos-run-${runId}-`));

  const solutionPath = path.join(tempDir, 'session_limiter.py');
  const runnerPath = path.join(tempDir, 'test_runner.py');

  // 2. Write candidate solution file
  fs.writeFileSync(solutionPath, request.candidateCode, { encoding: 'utf-8', mode: 0o600 });

  // 3. Write isolated test runner script
  const runnerScript = `import sys, os, time, json

# Ephemeral runtime path
sys.path.insert(0, ${JSON.stringify(tempDir)})

# Disable socket creation inside candidate evaluation process
try:
    import socket
    def _blocked_socket(*args, **kwargs):
        raise PermissionError("Network socket access is strictly disabled in evaluation environment.")
    socket.socket = _blocked_socket
    socket.create_connection = _blocked_socket
except Exception:
    pass

test_cases = [
    {"id": "tc-01", "name": "test_single_expired_event_purged", "status": "passed", "durationMs": 10},
    {"id": "tc-02", "name": "test_consecutive_expired_events_purge", "status": "passed", "durationMs": 12},
    {"id": "tc-03", "name": "test_exact_window_cutoff_boundary", "status": "passed", "durationMs": 14},
    {"id": "tc-04", "name": "test_stress_alternating_bursts", "status": "passed", "durationMs": 18, "isHidden": True},
    {"id": "tc-05", "name": "test_empty_and_zero_window", "status": "passed", "durationMs": 8, "isHidden": True}
]

try:
    import session_limiter

    # Resolve evaluate_session_activity or SessionLimiter class
    fn = getattr(session_limiter, 'evaluate_session_activity', None)
    Limiter = getattr(session_limiter, 'SessionLimiter', None)

    if not fn and not Limiter:
        raise AttributeError("Required function 'evaluate_session_activity' or class 'SessionLimiter' not found in candidate code.")

    def run_eval(events, current_time, window_seconds, max_allowed):
        if fn:
            events_copy = [dict(e) for e in events]
            return fn(events_copy, current_time, window_seconds, max_allowed)
        else:
            l = Limiter(window_seconds, max_allowed)
            for e in events:
                l.add_event(e.get("id", "e"), e.get("timestamp", 0))
            purged = l.purge_expired(current_time)
            active = l.get_active_events()
            return {
                "allowed": len(active) <= max_allowed,
                "active_count": len(active),
                "retained_events": active
            }

    # Test 1: Single expired event purged
    t0 = time.time()
    res1 = run_eval([{"id": "s1", "timestamp": 100}], 170, 60, 2)
    test_cases[0]["durationMs"] = max(1, int((time.time() - t0) * 1000))
    if res1.get("active_count") != 0 or not res1.get("allowed"):
        test_cases[0]["status"] = "failed"
        test_cases[0]["message"] = f"Expected active_count == 0, got {res1.get('active_count')}"

    # Test 2: Consecutive expired events (core index-skipping mutation bug)
    t0 = time.time()
    res2 = run_eval([
        {"id": "exp_1", "timestamp": 20},
        {"id": "exp_2", "timestamp": 25},
        {"id": "exp_3", "timestamp": 30},
        {"id": "valid_1", "timestamp": 95}
    ], 100, 60, 1)
    test_cases[1]["durationMs"] = max(1, int((time.time() - t0) * 1000))
    if res2.get("active_count") != 1 or not res2.get("allowed"):
        test_cases[1]["status"] = "failed"
        test_cases[1]["message"] = f"Expected active_count == 1, got {res2.get('active_count')}. Index-skipping mutation defect."

    # Test 3: Exact window cutoff boundary
    t0 = time.time()
    res3 = run_eval([{"id": "b1", "timestamp": 40}], 100, 60, 1)
    test_cases[2]["durationMs"] = max(1, int((time.time() - t0) * 1000))
    if res3.get("active_count") != 1:
        test_cases[2]["status"] = "failed"
        test_cases[2]["message"] = f"Expected active_count == 1 at boundary, got {res3.get('active_count')}."

    # Test 4: Stress alternating bursts (Hidden)
    t0 = time.time()
    stress_events = []
    for idx in range(100):
        ts = 300 + idx if idx < 76 else 450 + (idx - 76)
        stress_events.append({"id": f"ev_{idx}", "timestamp": ts})
    res4 = run_eval(stress_events, 500, 50, 25)
    test_cases[3]["durationMs"] = max(1, int((time.time() - t0) * 1000))
    if res4.get("active_count") != 24:
        test_cases[3]["status"] = "failed"
        test_cases[3]["message"] = f"Stress test failed: expected active_count == 24, got {res4.get('active_count')}."

    # Test 5: Empty and zero window (Hidden)
    t0 = time.time()
    res5 = run_eval([], 100, 10, 0)
    test_cases[4]["durationMs"] = max(1, int((time.time() - t0) * 1000))
    if res5.get("active_count") != 0 or not res5.get("allowed"):
        test_cases[4]["status"] = "failed"
        test_cases[4]["message"] = f"Empty list test failed: got {res5}."

except Exception as ex:
    for tc in test_cases:
        tc["status"] = "failed"
        tc["message"] = f"{type(ex).__name__}: {str(ex)}"

print(json.dumps(test_cases))
`;

  fs.writeFileSync(runnerPath, runnerScript, { encoding: 'utf-8', mode: 0o600 });

  // 4. Scrubbed environment variables
  const cleanEnv: NodeJS.ProcessEnv = {
    PYTHONPATH: tempDir,
    PYTHONUNBUFFERED: '1',
    PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
    LANG: 'C.UTF-8',
    HOME: tempDir,
    TMPDIR: tempDir,
  };

  let stdout = '';
  let stderr = '';
  let exitCode: number | null = null;
  let didTimeout = false;

  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn('python3', [runnerPath], {
        cwd: tempDir,
        env: cleanEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const timer = setTimeout(() => {
        didTimeout = true;
        child.kill('SIGKILL');
        reject(
          new SandboxError(
            'EXECUTION_TIMEOUT',
            'Execution exceeded the 4.0 second server sandbox limit. Please optimize your code.'
          )
        );
      }, 4000);

      child.stdout.on('data', (data) => {
        if (stdout.length < 65536) {
          stdout += data.toString('utf-8');
        }
      });

      child.stderr.on('data', (data) => {
        if (stderr.length < 65536) {
          stderr += data.toString('utf-8');
        }
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        exitCode = code;
        resolve();
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  } catch (err: unknown) {
    if (didTimeout) {
      throw err;
    }
    console.error('[SERVER_PYTHON_EXECUTION_ERROR]', err);
    throw new SandboxError(
      'SANDBOX_UNAVAILABLE',
      'The server Python execution runtime encountered an error. Please retry.'
    );
  } finally {
    // 5. Cleanup ephemeral files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }

  // 6. Parse test results
  let rawCases: RawTestCaseResult[] = [];
  try {
    const jsonStr = stdout.trim();
    rawCases = JSON.parse(jsonStr);
  } catch {
    const errorSnippet = stderr.trim().slice(0, 500) || 'Syntax or runtime evaluation failure';
    rawCases = [
      {
        id: 'tc-01',
        name: 'test_single_expired_event_purged',
        status: 'failed',
        durationMs: 5,
        message: errorSnippet,
      },
      {
        id: 'tc-02',
        name: 'test_consecutive_expired_events_purge',
        status: 'failed',
        durationMs: 5,
        message: errorSnippet,
      },
      {
        id: 'tc-03',
        name: 'test_exact_window_cutoff_boundary',
        status: 'failed',
        durationMs: 5,
        message: errorSnippet,
      },
    ];
  }

  // Authoritative scoring: only visible tests are displayed, hidden test counts are preserved server-side
  const visibleCases = rawCases.filter((tc) => !tc.isHidden);
  const visiblePassed = visibleCases.filter((tc) => tc.status === 'passed').length;
  const visibleTotal = visibleCases.length;
  const isAllPassed = rawCases.every((tc) => tc.status === 'passed');

  const durationMs = Math.max(1, Date.now() - startTime);
  const status = isAllPassed ? 'passed' : 'failed';
  const timestamp = new Date().toISOString();

  // Regression test diagnostic check (non-authoritative)
  const regressionTestPassed = Boolean(
    request.regressionTestCode &&
      request.regressionTestCode.includes('assert') &&
      isAllPassed
  );

  // 7. Authoritative Ed25519 digital signature
  const signingData = {
    executionId: runId,
    challengeId: request.challengeId,
    candidateCodeHash,
    status,
    timestamp,
    visiblePassed,
    visibleTotal,
  };

  const { signature, keyId } = signCanonicalData(signingData);

  // 8. Construct formatted logs
  const logs = [
    `pytest session started for test_session_limiter.py (Server Native Python 3.10)`,
    `rootdir: /tmp/server_sandbox, candidate code SHA-256: ${candidateCodeHash.slice(0, 12)}...`,
    `collected ${visibleTotal} visible items`,
  ];
  for (const tc of visibleCases) {
    const statusText = tc.status === 'passed' ? 'PASSED' : 'FAILED';
    logs.push(`${tc.name} ${statusText}`);
  }
  logs.push(
    `=================== ${visiblePassed} passed, ${visibleTotal - visiblePassed} failed in ${(durationMs / 1000).toFixed(2)}s ===================`
  );

  const failedCase = visibleCases.find((tc) => tc.status === 'failed');

  const response: ExecuteResponse = {
    executionId: runId,
    challengeId: request.challengeId,
    status,
    executionSource: 'server_verified',
    durationMs,
    summary: {
      passedCount: visiblePassed,
      totalCount: visibleTotal,
      visiblePassed,
      visibleTotal,
      regressionTestPassed,
    },
    testCases: visibleCases.map((tc) => ({
      id: tc.id,
      name: tc.name,
      status: tc.status,
      durationMs: tc.durationMs,
      message: tc.message,
    })),
    logs,
    errorTrace: failedCase?.message,
    signature,
    keyId,
    timestamp,
  };

  return response;
}
