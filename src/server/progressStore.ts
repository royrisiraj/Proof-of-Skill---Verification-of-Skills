import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { signCanonicalData, getServerPublicKeyBase64 } from './cryptoVerifier';

export interface CompletedAssessmentRecord {
  id: string;
  credentialId: string;
  challengeId: string;
  challengeTitle: string;
  challengeVersion: string;
  language: string;
  domain: string;
  score: number;
  testsPassed: number;
  testsTotal: number;
  completedAt: string;
  durationMinutes: number;
  executionId: string;
  signature: string;
  keyId: string;
  status: 'Demonstrated' | 'Partially Demonstrated';
  demonstratedSkills: string[];
  anonymized: boolean;
}

export interface AssessmentSession {
  sessionId: string;
  candidateId: string;
  challengeId: string;
  challengeTitle: string;
  startedAt: string;
  durationMinutes: number;
  expiresAt: string;
  gracePeriodMinutes: number;
  status: 'active' | 'expired_recoverable' | 'expired_permanent' | 'completed' | 'abandoned';
  lastSavedCode: string;
  lastSavedRegressionTest: string;
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
  createdAt: string;
  updatedAt: string;
  restoredAt?: string;
  recoveryCount?: number;
  completedAt?: string;
}

export interface CandidateProgressData {
  candidateProfile: {
    id: string;
    fullName: string;
    handle: string;
    email: string;
    role: string;
    affiliation: string;
    targetRole: string;
    bio?: string;
    interests?: string[];
  };
  points: number;
  streakDays: number;
  lastActiveDate: string;
  startedChallengeIds: string[];
  completedChallengeIds: string[];
  drafts: Record<string, { code: string; regressionTest?: string; updatedAt: string }>;
  completedAssessments: CompletedAssessmentRecord[];
  assessmentSessions: Record<string, AssessmentSession>;
  activeSessionId?: string | null;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    category: 'algorithm' | 'debugging' | 'speed' | 'milestone';
    unlockedAt: string;
    icon: string;
  }>;
  privacySettings: {
    showFullCodeDiff: boolean;
    showCandidateNotes: boolean;
    anonymizedCandidate: boolean;
    publicProfile: boolean;
  };
}

const DEFAULT_STORE_PATH = path.join(process.cwd(), '.data', 'candidate_progress.json');

export class ProgressStore {
  private filePath: string;
  private data: CandidateProgressData;
  private isInitialized = false;

  constructor(filePath?: string) {
    this.filePath = filePath || DEFAULT_STORE_PATH;
    this.data = this.getDefaultState();
  }

  private getDefaultState(): CandidateProgressData {
    // Generate initial verified credential with valid cryptographic signature
    const defaultExecId = 'exec_srv_init_8a9f2bc104de';
    const defaultTimestamp = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const defaultSigning = signCanonicalData({
      executionId: defaultExecId,
      challengeId: 'CH-4982',
      candidateCodeHash: crypto.createHash('sha256').update('def evaluate_session_activity(): pass', 'utf-8').digest('hex'),
      status: 'passed',
      timestamp: defaultTimestamp,
      visiblePassed: 3,
      visibleTotal: 3,
    });

    const initialSessionId = 'sess_py_4982_active';
    const initStartedAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const initExpiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();
    const initDraftCode = `def evaluate_session_activity(events, current_time, window_seconds, max_allowed):\n    cutoff_time = current_time - window_seconds\n    retained = [e for e in events if e.get("timestamp", 0) >= cutoff_time]\n    return {"allowed": len(retained) <= max_allowed, "active_count": len(retained), "retained_events": retained}`;

    const defaultActiveSession: AssessmentSession = {
      sessionId: initialSessionId,
      candidateId: 'cand_u9834b12',
      challengeId: 'CH-4982',
      challengeTitle: 'Session Expiry & Sliding Window Purge Buffer',
      startedAt: initStartedAt,
      durationMinutes: 25,
      expiresAt: initExpiresAt,
      gracePeriodMinutes: 5,
      status: 'active',
      lastSavedCode: initDraftCode,
      lastSavedRegressionTest: `def test_retained_invariants():\n    # Preserves non-expired timestamps\n    pass`,
      diagnosisNotes: {
        rootCause: 'In-place iteration mutation caused elements to be skipped during window purge.',
        fixRationale: 'Constructed new retained slice adhering to immutability invariants.',
        complexityTradeoffs: 'O(N) linear time and O(N) space guarantee.',
      },
      createdAt: initStartedAt,
      updatedAt: initStartedAt,
    };

    return {
      candidateProfile: {
        id: 'cand_u9834b12',
        fullName: 'Alex Chen',
        handle: 'alexchen_dev',
        email: 'alex.chen@university.edu',
        role: 'B.S. Computer Science Senior',
        affiliation: 'UC Berkeley (Class of 2026)',
        targetRole: 'Backend Systems & Infrastructure Engineer',
        bio: 'Passionate about reliable distributed systems, sliding window rate limiters, and high-throughput concurrency.',
        interests: ['Python', 'Distributed Systems', 'Algorithms', 'Reliability Engineering'],
      },
      points: 450,
      streakDays: 4,
      lastActiveDate: new Date().toISOString().split('T')[0],
      startedChallengeIds: ['CH-4982', 'CH-5120'],
      completedChallengeIds: ['CH-4982'],
      drafts: {
        'CH-4982': {
          code: initDraftCode,
          updatedAt: new Date().toISOString(),
        },
      },
      assessmentSessions: {
        [initialSessionId]: defaultActiveSession,
      },
      activeSessionId: initialSessionId,
      completedAssessments: [
        {
          id: 'asmt_py_884291',
          credentialId: 'cred_9a4f8e21c08b472e',
          challengeId: 'CH-4982',
          challengeTitle: 'Session Expiry & Sliding Window Purge Buffer',
          challengeVersion: '2.1.0',
          language: 'Python 3.12',
          domain: 'State Invariants & List Traversal',
          score: 100,
          testsPassed: 5,
          testsTotal: 5,
          completedAt: defaultTimestamp,
          durationMinutes: 18,
          executionId: defaultExecId,
          signature: defaultSigning.signature,
          keyId: defaultSigning.keyId,
          status: 'Demonstrated',
          demonstratedSkills: [
            'Iteration Invariant Preservation',
            'Regression Test Formulation',
            'Boundary Value Discrepancy Analysis',
            'Algorithmic Complexity Defense',
          ],
          anonymized: false,
        },
      ],
      badges: [
        {
          id: 'badge-sliding-window',
          name: 'Sliding Window Specialist',
          description: 'Preserved iteration invariants and eliminated in-place list mutation defects.',
          category: 'algorithm',
          unlockedAt: defaultTimestamp,
          icon: 'Layers',
        },
        {
          id: 'badge-zero-regression',
          name: 'Zero Regression Sentinel',
          description: 'Authored an isolated regression test that caught consecutive element deletion defects.',
          category: 'debugging',
          unlockedAt: defaultTimestamp,
          icon: 'ShieldCheck',
        },
        {
          id: 'badge-first-proof',
          name: 'First Verifiable Proof',
          description: 'Generated a cryptographically verifiable Ed25519 evidence report.',
          category: 'milestone',
          unlockedAt: defaultTimestamp,
          icon: 'Award',
        },
      ],
      privacySettings: {
        showFullCodeDiff: true,
        showCandidateNotes: true,
        anonymizedCandidate: false,
        publicProfile: true,
      },
    };
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = await fs.promises.readFile(this.filePath, 'utf-8');
        if (raw.trim()) {
          const parsed = JSON.parse(raw);
          this.data = { ...this.data, ...parsed };
          if (!this.data.assessmentSessions) {
            this.data.assessmentSessions = {};
          }
          // Seed default active session if empty
          if (Object.keys(this.data.assessmentSessions).length === 0) {
            const defaultState = this.getDefaultState();
            this.data.assessmentSessions = defaultState.assessmentSessions;
            this.data.activeSessionId = defaultState.activeSessionId;
          }
        }
      } else {
        await this.persist();
      }
      this.isInitialized = true;
    } catch {
      this.isInitialized = true;
    }
  }

  private async persist(): Promise<void> {
    const tempPath = `${this.filePath}.${Date.now()}.tmp`;
    try {
      await fs.promises.writeFile(tempPath, JSON.stringify(this.data, null, 2), {
        encoding: 'utf-8',
        mode: 0o600,
      });
      await fs.promises.rename(tempPath, this.filePath);
    } catch {
      // ignore write error
    }
  }

  public async getProgress(): Promise<CandidateProgressData> {
    await this.init();
    return this.data;
  }

  public async saveDraft(challengeId: string, code: string, regressionTest?: string): Promise<void> {
    await this.init();
    if (!this.data.drafts) this.data.drafts = {};
    this.data.drafts[challengeId] = {
      code,
      regressionTest,
      updatedAt: new Date().toISOString(),
    };
    if (!this.data.startedChallengeIds.includes(challengeId)) {
      this.data.startedChallengeIds.push(challengeId);
    }
    await this.persist();
  }

  public async recordCompletion(params: {
    challengeId: string;
    challengeTitle: string;
    executionId: string;
    signature: string;
    keyId: string;
    score: number;
    testsPassed: number;
    testsTotal: number;
    durationMinutes: number;
    skills: string[];
  }): Promise<CompletedAssessmentRecord> {
    await this.init();

    const credentialId = `cred_${crypto.randomBytes(8).toString('hex')}`;
    const assessmentId = `asmt_${crypto.randomBytes(6).toString('hex')}`;
    const completedAt = new Date().toISOString();

    const record: CompletedAssessmentRecord = {
      id: assessmentId,
      credentialId,
      challengeId: params.challengeId,
      challengeTitle: params.challengeTitle,
      challengeVersion: '1.0.0',
      language: 'Python 3.12',
      domain: 'Systems & Algorithms',
      score: params.score,
      testsPassed: params.testsPassed,
      testsTotal: params.testsTotal,
      completedAt,
      durationMinutes: params.durationMinutes,
      executionId: params.executionId,
      signature: params.signature,
      keyId: params.keyId,
      status: params.score >= 80 ? 'Demonstrated' : 'Partially Demonstrated',
      demonstratedSkills: params.skills,
      anonymized: this.data.privacySettings.anonymizedCandidate,
    };

    if (!this.data.completedChallengeIds.includes(params.challengeId)) {
      this.data.completedChallengeIds.push(params.challengeId);
      this.data.points += 150;
    }

    // Mark corresponding session as completed to prevent duplicate active sessions
    if (this.data.assessmentSessions) {
      for (const sess of Object.values(this.data.assessmentSessions)) {
        if (sess.challengeId === params.challengeId && sess.status !== 'abandoned') {
          sess.status = 'completed';
          sess.completedAt = completedAt;
          sess.updatedAt = completedAt;
        }
      }
    }

    this.data.completedAssessments.unshift(record);

    // Award milestones if threshold reached
    if (this.data.completedChallengeIds.length >= 2 && !this.data.badges.some((b) => b.id === 'badge-double-down')) {
      this.data.badges.push({
        id: 'badge-double-down',
        name: 'Multi-Disciplinary Engineer',
        description: 'Successfully verified 2 distinct technical challenges.',
        category: 'milestone',
        unlockedAt: completedAt,
        icon: 'Sparkles',
      });
    }

    if (this.data.completedChallengeIds.length >= 3 && !this.data.badges.some((b) => b.id === 'badge-triad')) {
      this.data.badges.push({
        id: 'badge-triad',
        name: 'Algorithm Master',
        description: 'Successfully verified 3 technical challenges.',
        category: 'milestone',
        unlockedAt: completedAt,
        icon: 'Award',
      });
    }

    await this.persist();
    return record;
  }

  public evaluateSessionStatus(session: AssessmentSession): {
    dynamicStatus: 'active' | 'expired_recoverable' | 'expired_permanent' | 'completed' | 'abandoned';
    timeRemainingSeconds: number;
    graceRemainingSeconds: number;
  } {
    if (session.status === 'completed' || session.status === 'abandoned') {
      return { dynamicStatus: session.status, timeRemainingSeconds: 0, graceRemainingSeconds: 0 };
    }

    const now = Date.now();
    const expiryMs = new Date(session.expiresAt).getTime();
    const graceMs = expiryMs + (session.gracePeriodMinutes || 5) * 60 * 1000;

    if (now < expiryMs) {
      return {
        dynamicStatus: 'active',
        timeRemainingSeconds: Math.max(0, Math.floor((expiryMs - now) / 1000)),
        graceRemainingSeconds: (session.gracePeriodMinutes || 5) * 60,
      };
    } else if (now < graceMs) {
      return {
        dynamicStatus: 'expired_recoverable',
        timeRemainingSeconds: 0,
        graceRemainingSeconds: Math.max(0, Math.floor((graceMs - now) / 1000)),
      };
    } else {
      return {
        dynamicStatus: 'expired_permanent',
        timeRemainingSeconds: 0,
        graceRemainingSeconds: 0,
      };
    }
  }

  public async getMostRecentUnfinishedSession(candidateId: string): Promise<{
    session: AssessmentSession;
    status: 'active' | 'expired_recoverable' | 'expired_permanent' | 'already_completed';
    timeRemainingSeconds: number;
    graceRemainingSeconds: number;
  } | null> {
    await this.init();
    const allSessions = Object.values(this.data.assessmentSessions || {}).filter(
      (s) => s.candidateId === candidateId
    );

    if (allSessions.length === 0) {
      return null;
    }

    // Unfinished sessions take precedence
    const unfinished = allSessions.filter((s) => s.status !== 'completed' && s.status !== 'abandoned');
    if (unfinished.length > 0) {
      unfinished.sort(
        (a, b) => new Date(b.updatedAt || b.startedAt).getTime() - new Date(a.updatedAt || a.startedAt).getTime()
      );
      const target = unfinished[0];
      const evaluated = this.evaluateSessionStatus(target);
      return {
        session: target,
        status: evaluated.dynamicStatus as any,
        timeRemainingSeconds: evaluated.timeRemainingSeconds,
        graceRemainingSeconds: evaluated.graceRemainingSeconds,
      };
    }

    // If no unfinished session exists, check for completed session
    const completed = allSessions.filter((s) => s.status === 'completed');
    if (completed.length > 0) {
      completed.sort(
        (a, b) => new Date(b.completedAt || b.updatedAt).getTime() - new Date(a.completedAt || a.updatedAt).getTime()
      );
      return {
        session: completed[0],
        status: 'already_completed',
        timeRemainingSeconds: 0,
        graceRemainingSeconds: 0,
      };
    }

    return null;
  }

  public async restoreSession(params: { candidateId: string; sessionId?: string }): Promise<{
    status: 'restored' | 'expired_recoverable' | 'expired_permanent' | 'already_completed' | 'not_found';
    session?: AssessmentSession;
    timeRemainingSeconds?: number;
    graceRemainingSeconds?: number;
    message?: string;
  }> {
    await this.init();
    let target: AssessmentSession | null = null;

    if (params.sessionId) {
      target = this.data.assessmentSessions?.[params.sessionId] || null;
      if (!target) {
        return { status: 'not_found', message: 'Requested assessment session was not found.' };
      }
      if (target.candidateId !== params.candidateId) {
        throw new Error('UNAUTHORIZED_CANDIDATE: Session does not belong to candidate');
      }
    } else {
      const recent = await this.getMostRecentUnfinishedSession(params.candidateId);
      if (!recent) {
        return { status: 'not_found', message: 'No active assessment found.' };
      }
      if (recent.status === 'already_completed') {
        return {
          status: 'already_completed',
          session: recent.session,
          timeRemainingSeconds: 0,
          message: 'This assessment has already been completed and verified.',
        };
      }
      target = recent.session;
    }

    const evaluated = this.evaluateSessionStatus(target);

    if (evaluated.dynamicStatus === 'completed') {
      return {
        status: 'already_completed',
        session: target,
        timeRemainingSeconds: 0,
        message: 'This assessment has already been completed and verified.',
      };
    }

    if (evaluated.dynamicStatus === 'expired_permanent') {
      target.status = 'expired_permanent';
      target.updatedAt = new Date().toISOString();
      await this.persist();
      return {
        status: 'expired_permanent',
        session: target,
        timeRemainingSeconds: 0,
        message: 'Assessment session permanently expired. The submission window and grace period have ended.',
      };
    }

    if (evaluated.dynamicStatus === 'expired_recoverable') {
      target.status = 'expired_recoverable';
      target.updatedAt = new Date().toISOString();
      await this.persist();
      return {
        status: 'expired_recoverable',
        session: target,
        timeRemainingSeconds: 0,
        graceRemainingSeconds: evaluated.graceRemainingSeconds,
        message: 'Assessment session has expired, but is within the 5-minute recovery grace period.',
      };
    }

    // Active session restored
    target.restoredAt = new Date().toISOString();
    target.updatedAt = new Date().toISOString();
    this.data.activeSessionId = target.sessionId;
    await this.persist();

    return {
      status: 'restored',
      session: target,
      timeRemainingSeconds: evaluated.timeRemainingSeconds,
      graceRemainingSeconds: evaluated.graceRemainingSeconds,
      message: 'Assessment session successfully restored. Resuming from last saved state.',
    };
  }

  public async recoverSession(params: { candidateId: string; sessionId: string; extensionMinutes?: number }): Promise<{
    status: 'restored' | 'expired_permanent' | 'not_found';
    session?: AssessmentSession;
    timeRemainingSeconds?: number;
    message?: string;
  }> {
    await this.init();
    const target = this.data.assessmentSessions?.[params.sessionId];
    if (!target) {
      return { status: 'not_found', message: 'Assessment session not found.' };
    }
    if (target.candidateId !== params.candidateId) {
      throw new Error('UNAUTHORIZED_CANDIDATE: Session does not belong to candidate');
    }

    const evaluated = this.evaluateSessionStatus(target);
    if (evaluated.dynamicStatus === 'expired_permanent') {
      target.status = 'expired_permanent';
      await this.persist();
      return {
        status: 'expired_permanent',
        session: target,
        message: 'Grace period has expired. Session cannot be recovered.',
      };
    }

    // Recover within grace period: provide extension (default 5 minutes)
    const extension = params.extensionMinutes || 5;
    target.status = 'active';
    target.recoveryCount = (target.recoveryCount || 0) + 1;
    target.expiresAt = new Date(Date.now() + extension * 60 * 1000).toISOString();
    target.updatedAt = new Date().toISOString();
    target.restoredAt = new Date().toISOString();
    this.data.activeSessionId = target.sessionId;
    await this.persist();

    return {
      status: 'restored',
      session: target,
      timeRemainingSeconds: extension * 60,
      message: `Session recovered with ${extension} minute grace window.`,
    };
  }

  public async startSession(params: {
    candidateId: string;
    challengeId: string;
    challengeTitle: string;
    durationMinutes?: number;
    initialCode?: string;
    initialRegressionTest?: string;
    forceRestart?: boolean;
  }): Promise<{ session: AssessmentSession; isNew: boolean }> {
    await this.init();

    // Prevent duplicate active sessions
    if (!params.forceRestart) {
      const activeUnfinished = Object.values(this.data.assessmentSessions || {}).find(
        (s) =>
          s.candidateId === params.candidateId &&
          s.challengeId === params.challengeId &&
          s.status !== 'completed' &&
          s.status !== 'abandoned'
      );
      if (activeUnfinished) {
        const evalState = this.evaluateSessionStatus(activeUnfinished);
        if (evalState.dynamicStatus === 'active') {
          return { session: activeUnfinished, isNew: false };
        }
      }
    }

    // Archive any prior unfinished session for this challenge
    Object.values(this.data.assessmentSessions || {}).forEach((s) => {
      if (s.candidateId === params.candidateId && s.challengeId === params.challengeId && s.status !== 'completed') {
        s.status = 'abandoned';
      }
    });

    const duration = params.durationMinutes || 25;
    const now = new Date();
    const startedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + duration * 60 * 1000).toISOString();
    const sessionId = `sess_${crypto.randomBytes(6).toString('hex')}`;

    const newSession: AssessmentSession = {
      sessionId,
      candidateId: params.candidateId,
      challengeId: params.challengeId,
      challengeTitle: params.challengeTitle,
      startedAt,
      durationMinutes: duration,
      expiresAt,
      gracePeriodMinutes: 5,
      status: 'active',
      lastSavedCode: params.initialCode || '',
      lastSavedRegressionTest: params.initialRegressionTest || '',
      createdAt: startedAt,
      updatedAt: startedAt,
    };

    if (!this.data.assessmentSessions) this.data.assessmentSessions = {};
    this.data.assessmentSessions[sessionId] = newSession;
    this.data.activeSessionId = sessionId;

    if (!this.data.startedChallengeIds.includes(params.challengeId)) {
      this.data.startedChallengeIds.push(params.challengeId);
    }

    await this.persist();
    return { session: newSession, isNew: true };
  }

  public async saveSessionProgress(params: {
    sessionId: string;
    candidateId: string;
    code?: string;
    regressionTest?: string;
    diagnosisNotes?: { rootCause?: string; fixRationale?: string; complexityTradeoffs?: string };
    completedQuestions?: string[];
    testResultsSummary?: { passedCount: number; totalCount: number; regressionTestPassed: boolean };
  }): Promise<AssessmentSession> {
    await this.init();
    const session = this.data.assessmentSessions?.[params.sessionId];
    if (!session) {
      throw new Error('Assessment session not found');
    }
    if (session.candidateId !== params.candidateId) {
      throw new Error('UNAUTHORIZED_CANDIDATE: Session does not belong to candidate');
    }

    if (params.code !== undefined) {
      session.lastSavedCode = params.code;
    }
    if (params.regressionTest !== undefined) {
      session.lastSavedRegressionTest = params.regressionTest;
    }
    if (params.diagnosisNotes !== undefined) {
      session.diagnosisNotes = { ...session.diagnosisNotes, ...params.diagnosisNotes };
    }
    if (params.completedQuestions !== undefined) {
      session.completedQuestions = params.completedQuestions;
    }
    if (params.testResultsSummary !== undefined) {
      session.testResultsSummary = params.testResultsSummary;
    }

    session.updatedAt = new Date().toISOString();

    // Synchronize to candidate drafts as well
    if (!this.data.drafts) this.data.drafts = {};
    this.data.drafts[session.challengeId] = {
      code: session.lastSavedCode,
      regressionTest: session.lastSavedRegressionTest,
      updatedAt: session.updatedAt,
    };

    await this.persist();
    return session;
  }

  public async simulateSessionState(params: {
    candidateId: string;
    challengeId?: string;
    state: 'active' | 'expired_recoverable' | 'expired_permanent' | 'already_completed' | 'not_found';
  }): Promise<any> {
    await this.init();
    const challengeId = params.challengeId || 'CH-4982';

    if (params.state === 'not_found') {
      if (this.data.assessmentSessions) {
        for (const [k, s] of Object.entries(this.data.assessmentSessions)) {
          if (s.candidateId === params.candidateId) {
            delete this.data.assessmentSessions[k];
          }
        }
      }
      this.data.activeSessionId = null;
      await this.persist();
      return { status: 'ok', state: 'not_found' };
    }

    const now = Date.now();
    let startedAt = '';
    let expiresAt = '';
    let status: AssessmentSession['status'] = 'active';
    let completedAt: string | undefined = undefined;

    if (params.state === 'active') {
      startedAt = new Date(now - 5 * 60 * 1000).toISOString();
      expiresAt = new Date(now + 20 * 60 * 1000).toISOString();
      status = 'active';
    } else if (params.state === 'expired_recoverable') {
      startedAt = new Date(now - 30 * 60 * 1000).toISOString();
      expiresAt = new Date(now - 2 * 60 * 1000).toISOString(); // expired 2 mins ago, 3 min grace left
      status = 'expired_recoverable';
    } else if (params.state === 'expired_permanent') {
      startedAt = new Date(now - 60 * 60 * 1000).toISOString();
      expiresAt = new Date(now - 35 * 60 * 1000).toISOString(); // expired 35 mins ago, past 5m grace
      status = 'expired_permanent';
    } else if (params.state === 'already_completed') {
      startedAt = new Date(now - 40 * 60 * 1000).toISOString();
      expiresAt = new Date(now - 15 * 60 * 1000).toISOString();
      status = 'completed';
      completedAt = new Date(now - 10 * 60 * 1000).toISOString();
    }

    const sessionId = `sess_${challengeId.toLowerCase().replace(/[^a-z0-9]/g, '_')}_sim`;
    const session: AssessmentSession = {
      sessionId,
      candidateId: params.candidateId,
      challengeId,
      challengeTitle: 'Session Expiry & Sliding Window Purge Buffer',
      startedAt,
      durationMinutes: 25,
      expiresAt,
      gracePeriodMinutes: 5,
      status,
      lastSavedCode:
        this.data.drafts?.[challengeId]?.code ||
        'def evaluate_session_activity(events, current_time, window_seconds, max_allowed):\n    cutoff_time = current_time - window_seconds\n    retained = [e for e in events if e.get("timestamp", 0) >= cutoff_time]\n    return {"allowed": len(retained) <= max_allowed, "active_count": len(retained), "retained_events": retained}',
      lastSavedRegressionTest:
        this.data.drafts?.[challengeId]?.regressionTest ||
        'def test_session_expiry_purge():\n    pass',
      diagnosisNotes: {
        rootCause: 'In-place iteration mutation caused elements to be skipped during window purge.',
        fixRationale: 'Constructed new retained slice adhering to immutability invariants.',
        complexityTradeoffs: 'O(N) linear time and O(N) space guarantee.',
      },
      createdAt: startedAt,
      updatedAt: new Date().toISOString(),
      completedAt,
    };

    if (!this.data.assessmentSessions) this.data.assessmentSessions = {};
    this.data.assessmentSessions[sessionId] = session;
    this.data.activeSessionId = sessionId;
    await this.persist();
    return { status: 'ok', state: params.state, session };
  }

  public async updateProfile(profile: Partial<CandidateProgressData['candidateProfile']>): Promise<void> {
    await this.init();
    this.data.candidateProfile = {
      ...this.data.candidateProfile,
      ...profile,
    };
    await this.persist();
  }

  public async updatePrivacySettings(settings: Partial<CandidateProgressData['privacySettings']>): Promise<void> {
    await this.init();
    this.data.privacySettings = {
      ...this.data.privacySettings,
      ...settings,
    };
    await this.persist();
  }

  public async getCredentialById(credentialId: string): Promise<CompletedAssessmentRecord | null> {
    await this.init();
    return this.data.completedAssessments.find((a) => a.credentialId === credentialId) || null;
  }

  public async getAllEvaluatorCandidates(filterSkill?: string): Promise<any[]> {
    await this.init();
    const candidate = this.data.candidateProfile;
    const isAnon = this.data.privacySettings.anonymizedCandidate;

    const visibleAssessments = this.data.completedAssessments.filter((a) => {
      if (!filterSkill) return true;
      return a.demonstratedSkills.some((s) => s.toLowerCase().includes(filterSkill.toLowerCase()));
    });

    if (visibleAssessments.length === 0 && filterSkill) {
      return [];
    }

    return [
      {
        candidateId: isAnon ? 'cand_#8842' : candidate.id,
        displayName: isAnon ? 'Candidate #8842 (Blind Screening Mode)' : candidate.fullName,
        handle: isAnon ? 'blind_candidate_8842' : candidate.handle,
        role: candidate.role,
        targetRole: candidate.targetRole,
        affiliation: isAnon ? 'Accredited Computer Science Program' : candidate.affiliation,
        completedCount: this.data.completedChallengeIds.length,
        totalPoints: this.data.points,
        verifiedSkills: Array.from(new Set(this.data.completedAssessments.flatMap((a) => a.demonstratedSkills))),
        credentials: visibleAssessments.map((a) => ({
          credentialId: a.credentialId,
          challengeTitle: a.challengeTitle,
          status: a.status,
          testsPassedRatio: `${a.testsPassed}/${a.testsTotal} Passed`,
          completedAt: a.completedAt,
          signature: a.signature,
          keyId: a.keyId,
        })),
      },
    ];
  }
}

export const defaultProgressStore = new ProgressStore();
