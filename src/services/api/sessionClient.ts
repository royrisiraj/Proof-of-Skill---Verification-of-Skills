import { AssessmentSession, Challenge, RestoreSessionResponse } from '../../types';

export interface ActiveSessionCheckResponse {
  active: boolean;
  status?: 'active' | 'expired_recoverable' | 'expired_permanent' | 'completed' | 'not_found';
  session?: AssessmentSession;
  timeRemainingSeconds?: number;
  graceRemainingSeconds?: number;
}

/**
 * Identifies and restores the candidate's most recent unfinished assessment session.
 * Server validates candidate identity and returns authoritative remaining time.
 */
export async function restoreAssessmentSession(params?: {
  candidateId?: string;
  sessionId?: string;
}): Promise<RestoreSessionResponse> {
  const candidateId = params?.candidateId || 'cand_u9834b12';
  const res = await fetch('/api/assessment-sessions/restore', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Candidate-Id': candidateId,
    },
    body: JSON.stringify({
      candidateId,
      sessionId: params?.sessionId,
    }),
  });

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('ACCESS_DENIED: Candidate ownership validation failed.');
    }
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Server error during session restore: HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Recovers an assessment session that has expired but remains within the recovery grace period.
 */
export async function recoverAssessmentSession(params: {
  sessionId: string;
  candidateId?: string;
  extensionMinutes?: number;
}): Promise<RestoreSessionResponse> {
  const candidateId = params.candidateId || 'cand_u9834b12';
  const res = await fetch('/api/assessment-sessions/recover', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Candidate-Id': candidateId,
    },
    body: JSON.stringify({
      sessionId: params.sessionId,
      candidateId,
      extensionMinutes: params.extensionMinutes || 5,
    }),
  });

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('ACCESS_DENIED: Candidate ownership validation failed.');
    }
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Failed to recover session: HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Checks if the candidate currently has an ongoing active assessment.
 */
export async function checkActiveSession(candidateId: string = 'cand_u9834b12'): Promise<ActiveSessionCheckResponse> {
  const res = await fetch(`/api/assessment-sessions/active?candidateId=${encodeURIComponent(candidateId)}`, {
    headers: { 'X-Candidate-Id': candidateId },
  });

  if (!res.ok) {
    throw new Error(`Failed to check active assessment session: HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Starts a new assessment session or retrieves existing active session, preventing duplicate active sessions.
 */
export async function startAssessmentSession(params: {
  challengeId: string;
  candidateId?: string;
  durationMinutes?: number;
  initialCode?: string;
  initialRegressionTest?: string;
  forceRestart?: boolean;
}): Promise<{ status: string; session: AssessmentSession; isNew: boolean; timeRemainingSeconds: number }> {
  const candidateId = params.candidateId || 'cand_u9834b12';
  const res = await fetch('/api/assessment-sessions/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Candidate-Id': candidateId,
    },
    body: JSON.stringify({
      challengeId: params.challengeId,
      candidateId,
      durationMinutes: params.durationMinutes,
      initialCode: params.initialCode,
      initialRegressionTest: params.initialRegressionTest,
      forceRestart: params.forceRestart,
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Failed to start session: HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Periodically or on-demand synchronizes candidate code drafts and defense notes to backend session store.
 */
export async function syncSessionProgress(params: {
  sessionId: string;
  candidateId?: string;
  code?: string;
  regressionTest?: string;
  diagnosisNotes?: {
    rootCause?: string;
    fixRationale?: string;
    complexityTradeoffs?: string;
  };
  completedQuestions?: string[];
  testResultsSummary?: {
    passedCount: number;
    totalCount: number;
    regressionTestPassed: boolean;
  };
}): Promise<{ status: string; session: AssessmentSession }> {
  const candidateId = params.candidateId || 'cand_u9834b12';
  const res = await fetch('/api/assessment-sessions/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Candidate-Id': candidateId,
    },
    body: JSON.stringify({
      ...params,
      candidateId,
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Failed to sync session progress: HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * QA & Automated Testing Helper: Simulates server-side session state transitions.
 */
export async function simulateSessionState(params: {
  candidateId?: string;
  challengeId?: string;
  state: 'active' | 'expired_recoverable' | 'expired_permanent' | 'already_completed' | 'not_found';
}): Promise<any> {
  const candidateId = params.candidateId || 'cand_u9834b12';
  const res = await fetch('/api/assessment-sessions/simulate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Candidate-Id': candidateId,
    },
    body: JSON.stringify({
      ...params,
      candidateId,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to simulate session state: HTTP ${res.status}`);
  }

  return res.json();
}
