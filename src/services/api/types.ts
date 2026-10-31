export type ExecutionMode = 'mock' | 'server';

export interface ExecuteRequest {
  challengeId: string;
  candidateCode: string;
  regressionTestCode?: string;
  idempotencyKey?: string;
  executionId?: string;
}

export interface TestCaseResult {
  id: string;
  name: string;
  status: 'passed' | 'failed';
  durationMs: number;
  message?: string;
}

export interface ExecutionSummary {
  passedCount: number;
  totalCount: number;
  visiblePassed: number;
  visibleTotal: number;
  regressionTestPassed: boolean;
}

export interface ExecuteResponse {
  executionId: string;
  challengeId: string;
  status: 'passed' | 'failed' | 'error' | 'timeout';
  executionSource: 'server_simulated' | 'mock' | 'server_verified';
  durationMs: number;
  summary: ExecutionSummary;
  testCases: TestCaseResult[];
  logs: string[];
  errorTrace?: string;
  signature?: string;
  keyId?: string;
  timestamp: string;
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'PAYLOAD_TOO_LARGE'
  | 'EXECUTION_TIMEOUT'
  | 'NETWORK_ERROR'
  | 'SANDBOX_UNAVAILABLE'
  | 'INTEGRITY_VERIFICATION_FAILED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: string[];
  };
}
