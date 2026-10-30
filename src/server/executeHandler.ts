import type { Request, Response } from 'express';
import type { ExecuteRequest, ExecuteResponse, ApiErrorResponse } from '../services/api/types';
import { executeInSandbox, isSandboxConfigured, SandboxError } from './sandboxClient';

const MAX_CODE_CHARS = 64000;

export async function handleExecute(req: Request, res: Response): Promise<void> {
  const body = req.body as Partial<ExecuteRequest>;

  // 1. Validation: challengeId
  if (!body.challengeId || typeof body.challengeId !== 'string' || body.challengeId.trim() === '') {
    const errorResponse: ApiErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Missing or invalid challenge identifier (challengeId).',
      },
    };
    res.status(400).json(errorResponse);
    return;
  }

  // 2. Validation: candidateCode
  if (typeof body.candidateCode !== 'string') {
    const errorResponse: ApiErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Missing or invalid candidate Python code (candidateCode).',
      },
    };
    res.status(400).json(errorResponse);
    return;
  }

  // 3. Payload size enforcement: 64 KB limit
  const totalLength = body.candidateCode.length + (body.regressionTestCode ? body.regressionTestCode.length : 0);
  if (totalLength > MAX_CODE_CHARS) {
    const errorResponse: ApiErrorResponse = {
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: `Submitted payload of ${totalLength} characters exceeds the 64 KB maximum limit.`,
      },
    };
    res.status(413).json(errorResponse);
    return;
  }

  const validRequest: ExecuteRequest = {
    challengeId: body.challengeId,
    candidateCode: body.candidateCode,
    regressionTestCode: body.regressionTestCode,
    idempotencyKey: body.idempotencyKey,
  };

  // 4. Genuine Sandbox Execution or Fail-Closed Error
  if (isSandboxConfigured()) {
    try {
      const result: ExecuteResponse = await executeInSandbox(validRequest);
      res.status(200).json(result);
      return;
    } catch (err: unknown) {
      if (err instanceof SandboxError) {
        let httpStatus = 503;
        if (err.code === 'EXECUTION_TIMEOUT') httpStatus = 408;
        if (err.code === 'INTEGRITY_VERIFICATION_FAILED') httpStatus = 502;
        if (err.code === 'IDEMPOTENCY_CONFLICT') httpStatus = 409;

        const errorResponse: ApiErrorResponse = {
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
          },
        };
        res.status(httpStatus).json(errorResponse);
        return;
      }

      console.error('[UNHANDLED_EXECUTE_ERROR]', err);
      const errorResponse: ApiErrorResponse = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected internal error occurred during execution. Please retry or switch to mock mode.',
        },
      };
      res.status(500).json(errorResponse);
      return;
    }
  }

  // Optional M1 Contract Simulation for dedicated local development test harnesses
  if (process.env.ENABLE_M1_CONTRACT_SIMULATOR === 'true') {
    const code = body.candidateCode;
    const hasFixedMutation =
      code.includes('retained_events') ||
      code.includes('event for event in') ||
      !code.includes('events.pop(i)');

    const executionId = `exec_sim_${Math.random().toString(36).substring(2, 11)}`;
    const timestamp = new Date().toISOString();

    const responseData: ExecuteResponse = {
      executionId,
      challengeId: body.challengeId,
      status: hasFixedMutation ? 'passed' : 'failed',
      executionSource: 'server_simulated',
      durationMs: 42,
      summary: {
        passedCount: hasFixedMutation ? 3 : 1,
        totalCount: 3,
        visiblePassed: hasFixedMutation ? 3 : 1,
        visibleTotal: 3,
        regressionTestPassed: Boolean(body.regressionTestCode && body.regressionTestCode.length > 20),
      },
      testCases: [
        {
          id: 'tc-01',
          name: 'test_single_expired_event_purged',
          status: 'passed',
          durationMs: 12,
        },
        {
          id: 'tc-02',
          name: 'test_consecutive_expired_events_purge',
          status: hasFixedMutation ? 'passed' : 'failed',
          durationMs: 14,
          message: hasFixedMutation ? undefined : 'AssertionError: Expected active_count == 1, but got 2.',
        },
        {
          id: 'tc-03',
          name: 'test_exact_window_cutoff_boundary',
          status: hasFixedMutation ? 'passed' : 'failed',
          durationMs: 16,
          message: hasFixedMutation ? undefined : 'AssertionError: Window cutoff shifted due to list index mutation.',
        },
      ],
      logs: [
        'pytest session started for test_session_limiter.py',
        'rootdir: /tmp/server_contract_eval, configfile: pytest.ini',
        `collected 3 visible items`,
        `=================== ${hasFixedMutation ? '3 passed' : '2 failed, 1 passed'} in 0.04s ===================`,
      ],
      timestamp,
    };

    res.status(200).json(responseData);
    return;
  }

  // 5. Fail-Closed Default: Sandbox unconfigured
  const errorResponse: ApiErrorResponse = {
    error: {
      code: 'SANDBOX_UNAVAILABLE',
      message: 'The isolated Python execution sandbox is not configured. Please retry or switch to Mock (Simulated) mode.',
    },
  };
  res.status(503).json(errorResponse);
}
