import { ExecuteResponse } from './types';

export interface AdaptedExecutionResult {
  passedCount: number;
  totalCount: number;
  visiblePassed: number;
  visibleTotal: number;
  hiddenPassed: number;
  hiddenTotal: number;
  regressionTestPassed: boolean;
  logs: string[];
  errorTrace?: string;
  executionSource: 'mock' | 'server_simulated' | 'server_verified';
  executionId?: string;
  durationMs?: number;
  signature?: string;
  keyId?: string;
}

/**
 * Adapts backend ExecuteResponse into the client AppContext data model.
 * Note: hiddenPassed and hiddenTotal default to 0 as hidden test counts are never disclosed in the API contract.
 */
export function adaptExecuteResponse(response: ExecuteResponse): AdaptedExecutionResult {
  return {
    passedCount: response.summary.passedCount,
    totalCount: response.summary.totalCount,
    visiblePassed: response.summary.visiblePassed,
    visibleTotal: response.summary.visibleTotal,
    hiddenPassed: 0,
    hiddenTotal: 0,
    regressionTestPassed: response.summary.regressionTestPassed,
    logs: response.logs,
    errorTrace: response.errorTrace,
    executionSource: response.executionSource,
    executionId: response.executionId,
    durationMs: response.durationMs,
    signature: response.signature,
    keyId: response.keyId,
  };
}
