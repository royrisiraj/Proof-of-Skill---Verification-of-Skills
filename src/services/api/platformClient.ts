import { Challenge } from '../../types';

export interface CatalogChallengeItem extends Challenge {
  skills?: string[];
  learningObjectives?: string[];
  sampleIO?: {
    input: string;
    output: string;
    explanation: string;
  };
}

export interface ProgressResponse {
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
  completedAssessments: Array<{
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
  }>;
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

export async function fetchChallenges(): Promise<CatalogChallengeItem[]> {
  const res = await fetch('/api/challenges');
  if (!res.ok) {
    throw new Error(`Failed to load challenges: ${res.statusText}`);
  }
  const data = await res.json();
  return data.challenges || [];
}

export async function fetchChallengeById(id: string): Promise<CatalogChallengeItem | null> {
  const res = await fetch(`/api/challenges/${encodeURIComponent(id)}`);
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  return data.challenge || null;
}

export async function fetchProgress(): Promise<ProgressResponse> {
  const res = await fetch('/api/progress');
  if (!res.ok) {
    throw new Error(`Failed to load progress: ${res.statusText}`);
  }
  return res.json();
}

export async function saveDraftCode(params: {
  challengeId: string;
  code: string;
  regressionTest?: string;
}): Promise<void> {
  const res = await fetch('/api/progress/save-draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error('Failed to save draft code');
  }
}

export async function recordChallengeCompletion(params: {
  challengeId: string;
  challengeTitle: string;
  executionId: string;
  signature: string;
  keyId?: string;
  score: number;
  testsPassed: number;
  testsTotal: number;
  durationMinutes: number;
  skills: string[];
}): Promise<any> {
  const res = await fetch('/api/progress/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error('Failed to record completion');
  }
  return res.json();
}

export async function updateCandidateProfile(profile: Partial<ProgressResponse['candidateProfile']>): Promise<void> {
  const res = await fetch('/api/progress/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!res.ok) {
    throw new Error('Failed to update candidate profile');
  }
}

export async function updateCandidatePrivacy(privacy: Partial<ProgressResponse['privacySettings']>): Promise<void> {
  const res = await fetch('/api/progress/privacy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(privacy),
  });
  if (!res.ok) {
    throw new Error('Failed to update privacy settings');
  }
}

export async function verifyCredentialViaApi(credentialId: string): Promise<any> {
  const res = await fetch('/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credentialId }),
  });
  if (!res.ok) {
    throw new Error('Verification network request failed');
  }
  return res.json();
}

export async function fetchEvaluatorCandidates(skill?: string): Promise<any[]> {
  const url = skill ? `/api/evaluator/candidates?skill=${encodeURIComponent(skill)}` : '/api/evaluator/candidates';
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch evaluator candidate directory');
  }
  const data = await res.json();
  return data.candidates || [];
}
