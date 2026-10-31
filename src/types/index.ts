export type AppScreen = 'dashboard' | 'workspace' | 'results' | 'proof' | 'verify';

export type VerificationState =
  | 'valid'
  | 'tampered'
  | 'revoked'
  | 'untrusted_key'
  | 'service_unavailable'
  | 'malformed';

export type RubricLevel = 'exemplary' | 'proficient' | 'emerging' | 'unattempted';

export interface CandidateProfile {
  id: string;
  fullName: string;
  handle: string;
  email: string;
  avatarUrl?: string;
  role: string;
  affiliation: string;
  targetRole: string;
  totalAssessments: number;
  completedAssessments: number;
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  inputRepresentation: string;
  expectedOutput: string;
  isHidden: boolean;
  passed?: boolean;
  actualOutput?: string;
  executionTimeMs?: number;
}

export interface Challenge {
  id: string;
  code: string;
  version: string;
  title: string;
  difficulty: 'Entry' | 'Intermediate' | 'Advanced';
  language: string;
  domain: string;
  recommendedMinutes: number;
  summary: string;
  bugReport: {
    reportedBy: string;
    environment: string;
    symptom: string;
    impact: string;
    reproductionSteps: string[];
  };
  expectedBehavior: string;
  diagnosticHints: string[];
  starterCode: string;
  referenceSolutionCode: string;
  starterRegressionTest: string;
  referenceRegressionTest: string;
  testCases: TestCase[];
  skills?: string[];
  learningObjectives?: string[];
  sampleIO?: {
    input: string;
    output: string;
    explanation: string;
  };
}

export interface CandidateSubmission {
  code: string;
  regressionTest: string;
  rootCauseDiagnosis: string;
  fixRationale: string;
  complexityTradeoffs: string;
  submittedAt?: string;
  timeSpentSeconds: number;
}

export interface DimensionScore {
  level: RubricLevel;
  levelLabel: string;
  descriptor: string;
  evidencePoints: string[];
}

export interface AssessmentResult {
  id: string;
  candidateId: string;
  challengeId: string;
  challengeTitle: string;
  challengeVersion: string;
  rubricId: string;
  rubricVersion: string;
  overallStatus: 'Demonstrated' | 'Partially Demonstrated' | 'Insufficient Evidence';
  completedAt: string;
  durationMinutes: number;
  environment: string;
  sessionConditions: {
    proctoring: 'Unproctored Timed Session' | 'Proctored';
    isolationType: 'Isolated ephemeral sandbox (simulated)';
    singleAttempt: boolean;
    durationMinutes: number;
  };
  dimensions: {
    correctness: DimensionScore & {
      visiblePassed: number;
      visibleTotal: number;
      hiddenPassed: number;
      hiddenTotal: number;
    };
    diagnosis: DimensionScore;
    regressionTesting: DimensionScore & {
      catchesOriginalBug: boolean;
      passesOnFixedCode: boolean;
    };
    codeDefense: DimensionScore;
  };
  summaryReasoning: string;
  testExecutionSummary: {
    exitCode: number;
    durationMs: number;
    testsPassed: number;
    testsTotal: number;
  };
}

export interface ProofCardData {
  credentialId: string;
  issuer: {
    name: string;
    authorityId: string;
    publicKeyId: string;
    complianceStandard: string;
  };
  issuedAt: string;
  expiresAt: string;
  candidateDisplayName: string;
  challengeTitle: string;
  challengeId: string;
  challengeVersion: string;
  rubricId: string;
  rubricVersion: string;
  cryptographicSignature: {
    algorithm: string;
    keyFingerprint: string;
    signatureHex: string;
    signedPayloadDigest: string;
  };
  privacySettings: {
    showFullCodeDiff: boolean;
    showCandidateNotes: boolean;
    anonymizedCandidate: boolean;
  };
  shareableUrl: string;
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

export interface RestoreSessionResponse {
  status: 'restored' | 'expired_recoverable' | 'expired_permanent' | 'already_completed' | 'not_found';
  session?: AssessmentSession;
  challenge?: Challenge;
  timeRemainingSeconds?: number;
  graceRemainingSeconds?: number;
  message?: string;
}
