# Proof of Skill — Milestone 2: Real Python Execution Service (Hardened Security Specification)

Definitive architectural specification, security boundary design, and deployment model to transition Proof of Skill from simulated responses to genuine, isolated Python code execution. Enforces strict process separation, server-authoritative scoring, asymmetric Ed25519 digital signature verification, sanitized error handling, and absolute preservation of the existing UI and Milestone 1 API contracts.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> This finalized specification integrates all 5 critical security corrections:
> 1. **Zero-Import Process Isolation**: Candidate-submitted Python is **never** imported, evaluated, or executed inside the trusted supervisor, hidden-test harness, API gateway, or signing process. Candidate code runs strictly within a restricted, unprivileged sandbox jail. The supervisor communicates with the sandbox solely across serialized standard I/O pipes.
> 2. **Trusted Server-Authoritative Scoring**: Candidate-supplied `regressionTestCode` is preserved in the API contract for backward compatibility and candidate diagnostics, but is **strictly excluded** from official assessment scoring and proof-card evidence. Official scoring is determined solely by server-controlled, trusted test suites.
> 3. **Strict Separation of Test vs. Production Keys**: Automated test suites use dedicated ephemeral test key pairs. Production verification strictly requires the production `RUNNER_PUBLIC_KEY` and rejects unexpected key IDs, test keys, or forged signatures. Private signing keys are never exposed to the frontend or repository.
> 4. **Sanitized Error Exposure**: Internal runner URLs, connection topologies, server stack traces, and signing metadata are **never** returned to candidates. All internal diagnostics are logged securely server-side; the client receives only clean, actionable messages.
> 5. **Complete UI & Contract Preservation**: All 5 screens, the blue palette, light/dark themes, navigation, Milestone 1 API fields (`challengeId`, `candidateCode`, `regressionTestCode`, `idempotencyKey`), fail-closed behavior, and explicit mock-mode switching remain 100% intact.

---

## 1. Zero-Import Trust Boundary & Process Separation

### The "No-Import" Rule
Under Python's execution model, `import <module>` or `exec()` executes module-level code immediately inside the host interpreter process. If candidate code were imported into the supervisor:
- A candidate could execute `os._exit()`, `sys.modules.clear()`, monkey-patch `pytest`, or inspect `globals()` to steal hidden tests and signing keys.
- **Mandatory Architecture**: The trusted supervisor **never** imports candidate code.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PHYSICAL PROCESS & SECURITY BOUNDARY                 │
│                                                                        │
│   UNTRUSTED RUNTIME JAIL (uid=65534 / sandbox_user)                    │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │  Candidate Code: solution.py                                   │   │
│   │  - Ephemeral scratch directory (/tmp/sandbox/<run_id>/)        │   │
│   │  - Memory: 256 MB cgroup | CPU: 1.0 core quota                 │   │
│   │  - Wall-clock limit: 4.0 seconds (hard SIGKILL)                │   │
│   │  - Network: STRICTLY DISABLED (--net=none)                     │   │
│   │  - Mounts: Read-only Python standard library + candidate code  │   │
│   │  - NO access to /supervisor, /tests/hidden, or parent env      │   │
│   │  - Jailed runner executes visible tests and emits JSON to stdout│  │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │ Serialized JSON over Stdout / Pipe │
│  ═════════════════════════════════╪══════════════════════════════════  │
│  SECURITY BARRIER: Namespaces, cgroups, Seccomp, No Shared Memory      │
│  ═════════════════════════════════╪══════════════════════════════════  │
│                                   ▼                                    │
│   TRUSTED SUPERVISOR & SIGNING SERVICE (uid=1000 / runner_service)     │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │  Supervisor Engine: supervisor.py                              │   │
│   │  1. Spawns sandboxed sub-process to run public/diagnostic tests│   │
│   │  2. Spawns isolated execution to evaluate hidden test cases    │   │
│   │  3. Reads raw JSON output from pipe (never executes code)      │   │
│   │  4. Computes authoritative assessment score (trusted tests only│   │
│   │  5. Signs canonical summary using RUNNER_PRIVATE_KEY (Ed25519) │   │
│   │  6. Returns sanitized response to API gateway                  │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Prevention of Exploits
1. **Hidden Test Access**: Hidden test files exist only in the trusted supervisor's filesystem at `/tests/hidden/` (`chmod 0700`, owner `uid=1000`). The candidate process runs inside a separate mount namespace where `/tests/hidden/` is completely absent.
2. **Result Forgery Prevention**: The sandbox process has no access to the output signature. The supervisor reads test exit codes and structured JSON from the child process's stdout pipe, performs validation, and signs the canonical payload with its own private Ed25519 key.
3. **Infrastructure Tampering**: Candidate code runs as `nobody` (`uid=65534`) with a read-only root filesystem and a 16MB writable `/tmp` tmpfs. It cannot overwrite pytest binaries, supervisor scripts, or system libraries.

---

## 2. Trusted Server-Authoritative Scoring

The application preserves the Milestone 1 request field `regressionTestCode` so candidates can write custom regression tests in the workspace. However, scoring is strictly partitioned:

```
Candidate Code Submission
        │
        ├─► [Trusted Server Visible Tests] ──► Authoritative Score (Visible)
        │
        ├─► [Trusted Server Hidden Tests]  ──► Authoritative Score (Competency)
        │
        └─► [Candidate Regression Test]    ──► Diagnostic Only (Non-authoritative)
```

- **Diagnostic Status**: The candidate's `regressionTestCode` is executed in the sandbox and reported under `summary.regressionTestPassed` for immediate developer feedback.
- **Authoritative Invariant**: Official pass/fail status, proof-card competency scores, and evidence verification depend **exclusively** on the server's trusted test suites. A candidate cannot inflate their score or achieve verification by passing their own trivial regression test.

---

## 3. Cryptographic Verification & Key Management (Ed25519)

### Key Separation Architecture
- **Production Environment**:
  - `RUNNER_PRIVATE_KEY`: Stored exclusively as a cloud secret in the isolated runner microservice (e.g. Cloud Run Secret Manager). Never present in the AI Studio web gateway or frontend.
  - `RUNNER_PUBLIC_KEY`: Configured on the Node.js application server (`server.ts`) via environment variable.
- **Testing & Development Environment**:
  - Automated unit tests (`executionClient.test.ts`) generate an ephemeral in-memory Ed25519 key pair at test time.
  - Test keys are never committed or deployed to production.
  - Production verification strictly rejects any signature signed by an unexpected or test key.

### Canonical Signing & Verification Flow
1. **Supervisor Canonical Serialization**:
   ```
   canonical_string = f"{execution_id}|{challenge_id}|{sha256(candidate_code)}|{status}|{timestamp}|{visible_passed}|{visible_total}"
   signature_hex = ed25519_sign(RUNNER_PRIVATE_KEY, canonical_string.encode('utf-8')).hex()
   ```
2. **Server-Side Verification**:
   ```typescript
   // src/server/cryptoVerifier.ts
   import crypto from 'node:crypto';

   export function verifyExecutionSignature(
     payload: {
       executionId: string;
       challengeId: string;
       candidateCodeHash: string;
       status: string;
       timestamp: string;
       visiblePassed: number;
       visibleTotal: number;
     },
     signatureHex: string,
     publicKeyBase64: string
   ): boolean {
     try {
       const canonical = `${payload.executionId}|${payload.challengeId}|${payload.candidateCodeHash}|${payload.status}|${payload.timestamp}|${payload.visiblePassed}|${payload.visibleTotal}`;
       const publicKey = crypto.createPublicKey({
         key: Buffer.from(publicKeyBase64, 'base64'),
         format: 'der',
         type: 'spki',
       });
       return crypto.verify(null, Buffer.from(canonical, 'utf-8'), publicKey, Buffer.from(signatureHex, 'hex'));
     } catch {
       return false;
     }
   }
   ```
3. **Verification Condition**: `executionSource` is labeled `'server_verified'` **only** when `verifyExecutionSignature()` returns `true`. If verification fails, the response is rejected with `INTEGRITY_VERIFICATION_FAILED`.

---

## 4. Protected Internal Errors & Fail-Closed Posture

### Sanitized Error Contract
To prevent information leakage, the API gateway intercepts all sandbox network errors, timeouts, and runner exceptions, transforming them into sanitized responses:

```typescript
// Example: Connection failure or internal error
// ❌ NEVER EXPOSED TO CLIENT:
// { "error": "ECONNREFUSED to https://internal-runner-829.us-central1.run.app:5000", "stack": "..." }

// ✅ RETURNED TO CLIENT:
{
  "error": {
    "code": "SANDBOX_UNAVAILABLE",
    "message": "The isolated code execution service is currently unavailable. Please retry or switch to mock mode."
  }
}
```

- **Server-Side Logging**: Detailed connection logs, runner latency, and HTTP status codes are written securely to `console.error('[SANDBOX_ERROR]', ...)` for operational monitoring.
- **Fail-Closed Behavior**: If `SANDBOX_SERVICE_URL` is missing, invalid, unreachable, or returns a 5xx error, `/api/execute` immediately returns HTTP 503 `SANDBOX_UNAVAILABLE`. It **never** silently substitutes mock or simulated data.
- **User-Directed Recovery**: The UI renders an error banner with two distinct action buttons:
  - **Retry Request**: Retries the API call.
  - **Switch to Mock Mode**: Changes `executionMode` to `'mock'` upon explicit user click.

---

## 5. Preserved API Contract (`POST /api/execute`)

### Request Payload (`ExecuteRequest`)
```typescript
export interface ExecuteRequest {
  challengeId: string;         // Preserved from Milestone 1 (e.g. "py-debug-01")
  candidateCode: string;       // Preserved: Submitted Python code (max 64 KB)
  regressionTestCode?: string; // Preserved: Diagnostic regression test (max 64 KB)
  idempotencyKey?: string;     // Preserved: Optional client deduplication key
}
```

### Response Payload (`ExecuteResponse`)
```typescript
export interface ExecuteResponse {
  executionId: string;
  challengeId: string;
  status: 'passed' | 'failed' | 'error' | 'timeout';
  executionSource: 'mock' | 'server_simulated' | 'server_verified';
  durationMs: number;
  summary: {
    passedCount: number;         // Authoritative passed visible tests
    totalCount: number;          // Authoritative total visible tests
    visiblePassed: number;
    visibleTotal: number;
    regressionTestPassed: boolean; // Diagnostic only (does not alter score)
  };
  testCases: Array<{
    id: string;
    name: string;
    status: 'passed' | 'failed';
    durationMs: number;
    message?: string;
  }>;
  logs: string[];
  errorTrace?: string;
  signature?: string;            // Hex-encoded Ed25519 signature
  keyId?: string;                // Identifier for verification public key
  timestamp: string;             // ISO 8601 UTC timestamp
}
```

---

## 6. Hosting Requirements, External Services & Cost Analysis

| Component | Execution Location | Hosting / Deployment Requirements | Cost Profile |
| :--- | :--- | :--- | :--- |
| **Proof of Skill Web App** | AI Studio Dev Container | Node.js 22 + Express proxy on Port 3000 | Free / included in AI Studio |
| **Isolated Runner Service** | External Cloud Run Service | Docker container (`sandbox-runner/`) with Python 3.11, pytest, gVisor execution tier | Free tier (~2M requests/mo); ~$0.000024/vCPU-s beyond |
| **Key Management** | Cloud Secret Manager / Env | `RUNNER_PRIVATE_KEY` on runner; `RUNNER_PUBLIC_KEY` on app | Free tier covers secret storage |

### Environment Variables
- `SANDBOX_SERVICE_URL`: Base HTTPS URL of the external runner (e.g. `https://runner-xyz.a.run.app`).
- `SANDBOX_API_KEY`: Bearer token for gateway-to-runner authentication.
- `RUNNER_PUBLIC_KEY`: Base64 SPKI DER Ed25519 public key.

---

## 7. Exact Files to Modify & New Components

```
sandbox-runner/                        <-- NEW: External runner service artifact
├── Dockerfile                         <-- Hardened Linux container (non-root, Python 3.11, pytest)
├── supervisor.py                      <-- Trusted supervisor (spawns jail, inspects pipe, signs Ed25519)
├── requirements.txt                   <-- pytest, cryptography, pydantic
└── test_suites/                       <-- Assessment public & hidden test suites

src/
├── services/
│   └── api/
│       ├── types.ts                   <-- Add 'server_verified', signature & keyId; add SANDBOX_UNAVAILABLE
│       ├── executionClient.ts         <-- 64KB check, 10s AbortController, sanitized error handling
│       └── __tests__/
│           └── executionClient.test.ts<-- Tests for payload size, fail-closed 503, Ed25519 signature verification
├── server/
│   ├── executeHandler.ts              <-- Fail-closed gateway; dispatches to sandboxClient; no silent fallback
│   ├── sandboxClient.ts               <-- NEW: Dispatches to SANDBOX_SERVICE_URL with 5s timeout & auth header
│   └── cryptoVerifier.ts              <-- NEW: Ed25519 public key verification utility
├── context/
│   └── AppContext.tsx                 <-- Handles 'server_verified' source; preserves explicit mock mode toggle
└── screens/
    └── DebuggingWorkspace.tsx         <-- Renders 'Server Verified' badge; preserves Retry & Switch to Mock
```

*Zero modifications to CandidateDashboard, AssessmentResults, EvidenceReport, PublicVerification, navigation, or color tokens.*

---

## 8. Acceptance Criteria

- [ ] **Strict Process Separation**: Candidate code is never imported into supervisor or server processes. Execution occurs solely in isolated sub-process/jail.
- [ ] **Trusted Scoring**: Authoritative score is determined exclusively by server-controlled tests; candidate `regressionTestCode` is diagnostic only.
- [ ] **Fail-Closed Sandbox**: When `SANDBOX_SERVICE_URL` is missing or unreachable, `/api/execute` returns HTTP 503 `SANDBOX_UNAVAILABLE`. Zero automatic fallback to simulated results.
- [ ] **Authentic Verification Badge**: The badge `Source: Server Verified` appears **only** when genuine isolated execution succeeds and the Ed25519 signature is verified against `RUNNER_PUBLIC_KEY`.
- [ ] **Sanitized Errors**: No internal URLs, stack traces, or secrets are exposed in candidate-facing error payloads.
- [ ] **Complete UI Preservation**: All 5 screens, blue visual identity, theme toggle, and existing workflows operate identically.
- [ ] **Zero Build/Type Errors**: Passes `compile_applet` and `lint_applet` cleanly.
