import { CandidateProfile, Challenge, AssessmentResult, ProofCardData } from '../types';

export const mockCandidate: CandidateProfile = {
  id: 'cand_u9834b12',
  fullName: 'Alex Chen',
  handle: 'alexchen_dev',
  email: 'alex.chen@university.edu',
  role: 'B.S. Computer Science Senior',
  affiliation: 'UC Berkeley (Class of 2026)',
  targetRole: 'Backend Systems & Infrastructure Intern',
  totalAssessments: 3,
  completedAssessments: 2,
};

export const sampleChallenge: Challenge = {
  id: 'chal_py_session_v2',
  code: 'CHAL-PY-SESSION-v2.1',
  version: '2.1.0',
  title: 'Session Expiry & Sliding Window Purge Buffer',
  difficulty: 'Intermediate',
  language: 'Python 3.12',
  domain: 'Backend Concurrency & State Invariants',
  recommendedMinutes: 25,
  summary:
    'Diagnose an index-skipping bug caused by in-place list mutation during expired session eviction, write an author-verified regression test, and provide a structured fix defense.',
  bugReport: {
    reportedBy: 'Production Infrastructure Alert (#INC-4481)',
    environment: 'Python 3.12 · Gateway Session Validator',
    symptom:
      'Under high-frequency traffic bursts, user sessions are intermittently flagged as exceeding the sliding rate limit, even when older sessions should have expired.',
    impact:
      'Legitimate requests were rejected with HTTP 429 during burst windows when expired sessions failed to purge from the active window buffer.',
    reproductionSteps: [
      'Simulate a burst where 3 events occur consecutively at timestamps T-62, T-61, and T-60.',
      'Call evaluate_session_activity with a 60-second window at timestamp T.',
      'Observe that T-61 remains in the active buffer because T-62 deletion shifted list indices during iteration.',
    ],
  },
  expectedBehavior:
    'All events strictly older than (current_time - window_seconds) must be purged from the active session tracker before checking whether the count exceeds max_allowed. Consecutive expired events must never be skipped.',
  diagnosticHints: [
    'Inspect how the active events list is modified inside the for/while loop.',
    'Trace index advancement when an element is removed via .pop(i) or del events[i].',
    'Verify strict vs non-strict inequality for the window cutoff boundary.',
  ],
  starterCode: `"""
Module: session_limiter
Evaluates session timestamps within a rolling sliding window.
"""

def evaluate_session_activity(events: list[dict], current_time: int, window_seconds: int, max_allowed: int) -> dict:
    """
    Purges expired events older than (current_time - window_seconds) and
    determines if active session count is within max_allowed threshold.
    
    BUG ALERT: In-place list mutation during iteration causes skipped elements,
    and cutoff boundary has an off-by-one arithmetic error.
    """
    # BUG 1: Off-by-one boundary offset (+1 causes boundary events to linger)
    cutoff_time = current_time - window_seconds + 1
    
    # BUG 2: Mutating 'events' in-place during indexed iteration!
    # When an element at index i is popped, subsequent items shift left,
    # causing index i+1 to skip the immediate next element.
    i = 0
    while i < len(events):
        event = events[i]
        if event.get("timestamp", 0) < cutoff_time:
            events.pop(i)
        i += 1
        
    is_allowed = len(events) <= max_allowed
    
    return {
        "allowed": is_allowed,
        "active_count": len(events),
        "retained_events": events
    }
`,
  referenceSolutionCode: `"""
Module: session_limiter
Evaluates session timestamps within a rolling sliding window.
"""

def evaluate_session_activity(events: list[dict], current_time: int, window_seconds: int, max_allowed: int) -> dict:
    """
    Purges expired events older than (current_time - window_seconds) and
    determines if active session count is within max_allowed threshold.
    """
    # Strict sliding window cutoff: any event strictly before (current_time - window_seconds) is expired
    cutoff_time = current_time - window_seconds
    
    # Avoid in-place list mutation during traversal:
    # Filter retained events in a clean list comprehension preserving order
    retained_events = [
        event for event in events
        if event.get("timestamp", 0) >= cutoff_time
    ]
    
    is_allowed = len(retained_events) <= max_allowed
    
    return {
        "allowed": is_allowed,
        "active_count": len(retained_events),
        "retained_events": retained_events
    }
`,
  starterRegressionTest: `import pytest
from session_limiter import evaluate_session_activity

def test_single_expired_event_purged():
    events = [{"id": "s1", "timestamp": 100}]
    # Current time 170 with 60s window -> cutoff is 110. Event at 100 is expired.
    result = evaluate_session_activity(events, current_time=170, window_seconds=60, max_allowed=2)
    assert result["active_count"] == 0
    assert result["allowed"] is True

# TODO: Add your regression test below that catches the consecutive-expired index skip!
def test_consecutive_expired_events_purge():
    # Candidate should write assertions demonstrating the bug scenario
    pass
`,
  referenceRegressionTest: `import pytest
from session_limiter import evaluate_session_activity

def test_consecutive_expired_events_purge():
    """
    Regression Test: Verifies that consecutive expired events are all purged
    without index-skipping anomaly.
    """
    # 3 consecutive expired events (timestamps 20, 25, 30) followed by 1 valid event (timestamp 95)
    # At current_time=100 with window_seconds=60, cutoff is 40.
    events = [
        {"id": "exp_1", "timestamp": 20},
        {"id": "exp_2", "timestamp": 25},
        {"id": "exp_3", "timestamp": 30},
        {"id": "valid_1", "timestamp": 95},
    ]
    result = evaluate_session_activity(events, current_time=100, window_seconds=60, max_allowed=1)
    
    # On buggy code, exp_2 is skipped by index increment after exp_1 pop!
    # On correct code, all 3 expired events are purged.
    assert result["active_count"] == 1
    assert result["allowed"] is True
    assert result["retained_events"][0]["id"] == "valid_1"
`,
  testCases: [
    {
      id: 'tc_1',
      name: 'Single Expired Event Eviction',
      description: 'Verifies an isolated expired event is removed from active count',
      inputRepresentation: 'events: [ts: 100], current: 170, window: 60, max: 2',
      expectedOutput: 'active_count: 0, allowed: True',
      isHidden: false,
      passed: true,
      actualOutput: 'active_count: 0, allowed: True',
      executionTimeMs: 4,
    },
    {
      id: 'tc_2',
      name: 'Consecutive Expired Events Sequence',
      description: 'Verifies 3 consecutive expired events do not skip due to list mutation',
      inputRepresentation: 'events: [ts: 20, ts: 25, ts: 30, ts: 95], current: 100, window: 60, max: 1',
      expectedOutput: 'active_count: 1, allowed: True',
      isHidden: false,
      passed: true,
      actualOutput: 'active_count: 1, allowed: True',
      executionTimeMs: 6,
    },
    {
      id: 'tc_3',
      name: 'Exact Window Cutoff Boundary',
      description: 'Verifies boundary condition at current_time - window_seconds is non-expired',
      inputRepresentation: 'events: [ts: 40], current: 100, window: 60, max: 1',
      expectedOutput: 'active_count: 1, allowed: True (timestamp 40 is exactly on boundary)',
      isHidden: false,
      passed: true,
      actualOutput: 'active_count: 1, allowed: True',
      executionTimeMs: 5,
    },
    {
      id: 'tc_4',
      name: 'Stress Test: Alternating Valid & Stale Bursts',
      description: 'Evaluates 100 alternating timestamp pairs to ensure deterministic filtering',
      inputRepresentation: 'events: 100 mixed items, current: 500, window: 50, max: 25',
      expectedOutput: 'active_count: 24, allowed: True',
      isHidden: true,
      passed: true,
      actualOutput: '[Hidden test passed in simulated sandbox]',
      executionTimeMs: 14,
    },
    {
      id: 'tc_5',
      name: 'Empty and Single-Element Edge Cases',
      description: 'Checks handling of empty list and zero window duration edge behavior',
      inputRepresentation: 'events: [], current: 100, window: 10, max: 0',
      expectedOutput: 'active_count: 0, allowed: True',
      isHidden: true,
      passed: true,
      actualOutput: '[Hidden test passed in simulated sandbox]',
      executionTimeMs: 3,
    },
  ],
};

export const sampleCandidateSubmission = {
  code: sampleChallenge.referenceSolutionCode,
  regressionTest: sampleChallenge.referenceRegressionTest,
  rootCauseDiagnosis:
    'The bug was twofold: 1) In-place list mutation (`events.pop(i)`) while incrementing `i += 1` in the while loop causes the list to shift left, skipping the adjacent item directly following any popped event. When two or more expired items occur consecutively, odd-indexed expired items remain unevicted. 2) The cutoff calculation added an erroneous `+1`, creating an off-by-one window inclusion error.',
  fixRationale:
    'Replaced in-place iteration mutation with a non-mutating list comprehension filter (`[event for event in events if event.get("timestamp", 0) >= cutoff_time]`). This guarantees O(N) evaluation order without index shifting, preserving all valid items while evicting all expired ones. Corrected the cutoff calculation to `current_time - window_seconds`.',
  complexityTradeoffs:
    'Time complexity remains linear O(N) where N is the number of events. Space complexity allocates a new list of size K (where K <= N is retained events), which avoids mutation hazards and maintains immutability invariants at negligible memory overhead for request window sizes.',
  submittedAt: '2026-10-27T19:42:18Z',
  timeSpentSeconds: 1140, // 19 minutes
};

export const sampleAssessmentResult: AssessmentResult = {
  id: 'asmt_py_884291',
  candidateId: 'cand_u9834b12',
  challengeId: 'chal_py_session_v2',
  challengeTitle: 'Session Expiry & Sliding Window Purge Buffer',
  challengeVersion: '2.1.0',
  rubricId: 'RUBRIC-PY-DEBUG',
  rubricVersion: '1.4.0',
  overallStatus: 'Demonstrated',
  completedAt: '2026-10-27T19:42:18Z',
  durationMinutes: 19,
  environment: 'Python 3.12.2 · Linux 6.1 Ephemeral Container (Simulated)',
  sessionConditions: {
    proctoring: 'Unproctored Timed Session',
    isolationType: 'Isolated ephemeral sandbox (simulated)',
    singleAttempt: true,
    durationMinutes: 19,
  },
  dimensions: {
    correctness: {
      level: 'exemplary',
      levelLabel: 'Exemplary Evidence',
      descriptor:
        'All visible and hidden test assertions passed with zero runtime exceptions or timeout flags.',
      evidencePoints: [
        'Visible test suite: 3 of 3 passed',
        'Hidden edge-case test suite: 2 of 2 passed in simulated sandbox',
        'Deterministic execution confirmed on boundary timestamps',
      ],
      visiblePassed: 3,
      visibleTotal: 3,
      hiddenPassed: 2,
      hiddenTotal: 2,
    },
    diagnosis: {
      level: 'exemplary',
      levelLabel: 'Exemplary Evidence',
      descriptor:
        'Accurately identified both the mutation-during-iteration mechanism and the off-by-one cutoff error.',
      evidencePoints: [
        'Specifically cited array index shift after .pop(i) traversal',
        'Correctly identified off-by-one boundary arithmetic (+1 artifact)',
        'Demonstrated precise technical vocabulary (mutation invariants, traversal hazards)',
      ],
    },
    regressionTesting: {
      level: 'exemplary',
      levelLabel: 'Exemplary Evidence',
      descriptor:
        'Authored regression test specifically isolates the consecutive-expired failure case and fails on buggy code.',
      evidencePoints: [
        'Constructed multi-element sequence with 3 adjacent expired timestamps',
        'Verified failure reproduction on unpatched starter code',
        'Verified assertion pass on patched implementation',
      ],
      catchesOriginalBug: true,
      passesOnFixedCode: true,
    },
    codeDefense: {
      level: 'proficient',
      levelLabel: 'Demonstrated Evidence',
      descriptor:
        'Clear, coherent technical justification of the chosen non-mutating list comprehension with space-time analysis.',
      evidencePoints: [
        'Articulated O(N) time and O(K) memory trade-off',
        'Explained why immutability prevents subtle concurrency/iterator hazards',
        'Recommended deque for production workloads if events array exceeds 10k items',
      ],
    },
  },
  summaryReasoning:
    'Candidate demonstrated complete problem diagnosis by spotting the list-mutation index slip and boundary offset. The candidate-authored regression test proved effective at catching the specific defect, and the submitted solution passes all visible and hidden regression suites.',
  testExecutionSummary: {
    exitCode: 0,
    durationMs: 32,
    testsPassed: 5,
    testsTotal: 5,
  },
};

export const sampleProofCardData: ProofCardData = {
  credentialId: 'cred_9a4f8e21c08b472e',
  issuer: {
    name: 'Proof of Skill Verification Authority',
    authorityId: 'auth_pos_core_prod_01',
    publicKeyId: 'ed25519_key_2026_q4',
    complianceStandard: 'POS-VERIFIABLE-EVIDENCE-v1',
  },
  issuedAt: '2026-10-27T19:45:00Z',
  expiresAt: '2028-10-27T19:45:00Z',
  candidateDisplayName: 'Alex Chen',
  challengeTitle: 'Session Expiry & Sliding Window Purge Buffer',
  challengeId: 'CHAL-PY-SESSION-v2.1',
  challengeVersion: '2.1.0',
  rubricId: 'RUBRIC-PY-DEBUG',
  rubricVersion: '1.4.0',
  cryptographicSignature: {
    algorithm: 'Ed25519 (RFC 8032 - Simulated in Prototype)',
    keyFingerprint: 'SHA256:7b1e4fa832cd095e6834bb1c0825ae7041f92e3d7a6b4129',
    signatureHex:
      'e9b0429f635c914da7b23c9a01874b335fe39a04f981dcbc6e71350a4d528efb36e84d12c091ad552809e6c4331405b57d00f91a2e4b4783305c5dfc54530e0a',
    signedPayloadDigest:
      'sha256:4c8b67f139d89bb6ea684d0938ff5d56b026779a5b4c1001a4db4cb30a84b55e',
  },
  privacySettings: {
    showFullCodeDiff: true,
    showCandidateNotes: true,
    anonymizedCandidate: false,
  },
  shareableUrl: 'https://proofofskill.dev/verify/cred_9a4f8e21c08b472e',
};

export const sampleHistoricalAssessments = [
  {
    id: 'asmt_py_884291',
    credentialId: 'cred_9a4f8e21c08b472e',
    title: 'Session Expiry & Sliding Window Purge Buffer',
    language: 'Python 3.12',
    domain: 'State Invariants & List Traversal',
    date: 'Oct 27, 2026',
    status: 'Demonstrated',
    rubricVersion: 'RUBRIC-PY-DEBUG v1.4',
    badge: 'Verified Evidence',
    shareUrl: 'https://proofofskill.dev/verify/cred_9a4f8e21c08b472e',
    testsPassedRatio: '5/5 Passed',
    dimensionsSummary: '4/4 Criteria Satisfied',
  },
  {
    id: 'asmt_py_772104',
    credentialId: 'cred_3b11ef99c148',
    title: 'Async Lock Contention & Deadlock Resolver',
    language: 'Python 3.12',
    domain: 'Asyncio & Mutex Synchronization',
    date: 'Oct 14, 2026',
    status: 'Demonstrated',
    rubricVersion: 'RUBRIC-PY-CONCUR v1.1',
    badge: 'Verified Evidence',
    shareUrl: 'https://proofofskill.dev/verify/cred_3b11ef99c148',
    testsPassedRatio: '6/6 Passed',
    dimensionsSummary: '4/4 Criteria Satisfied',
  },
];

export const sampleSkillsSummary = [
  {
    skill: 'Iteration Invariant Preservation',
    level: 'Demonstrated with Evidence',
    context: 'Avoided in-place array mutation during sliding-window eviction',
    verifiedAssessmentsCount: 2,
  },
  {
    skill: 'Regression Test Formulation',
    level: 'Demonstrated with Evidence',
    context: 'Authored test specifically reproducing consecutive-item skip',
    verifiedAssessmentsCount: 2,
  },
  {
    skill: 'Boundary Value Discrepancy Analysis',
    level: 'Demonstrated with Evidence',
    context: 'Identified off-by-one window inclusion threshold arithmetic',
    verifiedAssessmentsCount: 2,
  },
  {
    skill: 'Algorithmic Complexity Defense',
    level: 'Demonstrated with Evidence',
    context: 'Articulated O(N) runtime vs O(K) immutability memory balance',
    verifiedAssessmentsCount: 2,
  },
];
