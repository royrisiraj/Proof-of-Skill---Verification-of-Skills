import { ExecuteRequest, ExecuteResponse, ApiErrorResponse, ApiErrorCode } from './types';

export const MAX_PAYLOAD_BYTES = 65536; // 64 KB
export const MAX_CODE_CHARS = 64000;
export const DEFAULT_TIMEOUT_MS = 10000;

export class ExecutionApiError extends Error {
  code: ApiErrorCode;
  details?: string[];

  constructor(code: ApiErrorCode, message: string, details?: string[]) {
    super(message);
    this.name = 'ExecutionApiError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Validates request payload size before sending over the network.
 */
export function validatePayloadSize(request: ExecuteRequest): void {
  if (!request.challengeId || typeof request.challengeId !== 'string') {
    throw new ExecutionApiError(
      'VALIDATION_ERROR',
      'Assessment challenge identifier is required.'
    );
  }

  if (typeof request.candidateCode !== 'string') {
    throw new ExecutionApiError(
      'VALIDATION_ERROR',
      'Candidate code must be provided as text.'
    );
  }

  const codeChars = request.candidateCode.length;
  const regressionChars = request.regressionTestCode ? request.regressionTestCode.length : 0;
  const totalChars = codeChars + regressionChars;

  if (totalChars > MAX_CODE_CHARS) {
    throw new ExecutionApiError(
      'PAYLOAD_TOO_LARGE',
      `Submitted code exceeds the 64 KB limit (${totalChars} characters, maximum allowed is ${MAX_CODE_CHARS}).`
    );
  }
}

/**
 * Dispatches execution request to the server API endpoint with timeout and error handling.
 */
export async function executeCodeViaApi(
  request: ExecuteRequest,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ExecuteResponse> {
  // Client-side preflight validation
  validatePayloadSize(request);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData: ApiErrorResponse | null = null;
      try {
        errorData = (await response.json()) as ApiErrorResponse;
      } catch {
        // Non-JSON response (e.g. gateway error or server crash)
      }

      if (errorData?.error) {
        throw new ExecutionApiError(
          errorData.error.code,
          errorData.error.message,
          errorData.error.details
        );
      }

      if (response.status === 413) {
        throw new ExecutionApiError(
          'PAYLOAD_TOO_LARGE',
          'Submitted code payload exceeds the 64 KB server limit.'
        );
      }

      if (response.status === 503) {
        throw new ExecutionApiError(
          'SANDBOX_UNAVAILABLE',
          'Execution service is temporarily unavailable. Please retry or switch to mock mode.'
        );
      }

      if (response.status === 502) {
        throw new ExecutionApiError(
          'INTEGRITY_VERIFICATION_FAILED',
          'Evidence integrity verification failed on the server.'
        );
      }

      throw new ExecutionApiError(
        'INTERNAL_ERROR',
        `Server returned error status HTTP ${response.status}.`
      );
    }

    const data = (await response.json()) as ExecuteResponse;

    if (!data || !data.summary || typeof data.summary.passedCount !== 'number') {
      throw new ExecutionApiError(
        'INTERNAL_ERROR',
        'Malformed execution response received from server.'
      );
    }

    return data;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof ExecutionApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ExecutionApiError(
        'EXECUTION_TIMEOUT',
        `Execution request timed out after ${timeoutMs / 1000} seconds. The server did not respond in time.`
      );
    }

    const message = error instanceof Error ? error.message : 'Network failure';
    throw new ExecutionApiError(
      'NETWORK_ERROR',
      `Could not reach execution API endpoint (/api/execute): ${message}. Check your connection or retry.`
    );
  }
}
