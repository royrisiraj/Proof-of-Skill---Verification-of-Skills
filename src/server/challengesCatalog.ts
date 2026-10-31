export interface ChallengeTestCase {
  id: string;
  name: string;
  description: string;
  inputRepresentation: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface CatalogChallenge {
  id: string;
  code: string;
  version: string;
  title: string;
  difficulty: 'Entry' | 'Intermediate' | 'Advanced';
  language: string;
  domain: string;
  skills: string[];
  recommendedMinutes: number;
  summary: string;
  learningObjectives: string[];
  bugReport: {
    reportedBy: string;
    environment: string;
    symptom: string;
    impact: string;
    reproductionSteps: string[];
  };
  sampleIO: {
    input: string;
    output: string;
    explanation: string;
  };
  expectedBehavior: string;
  diagnosticHints: string[];
  starterCode: string;
  referenceSolutionCode: string;
  starterRegressionTest: string;
  referenceRegressionTest: string;
  testCases: ChallengeTestCase[];
  // Runner Python evaluation script generator
  runnerCodeGenerator: (userCode: string) => string;
}

export const CHALLENGES_CATALOG: CatalogChallenge[] = [
  // 1. Session Expiry & Sliding Window Purge Buffer
  {
    id: 'CH-4982',
    code: 'CHAL-PY-SESSION-v2.1',
    version: '2.1.0',
    title: 'Session Expiry & Sliding Window Purge Buffer',
    difficulty: 'Intermediate',
    language: 'Python 3.12',
    domain: 'State Invariants & List Traversal',
    skills: ['Python', 'algorithms', 'debugging', 'sliding window'],
    recommendedMinutes: 25,
    summary:
      'Diagnose an index-skipping bug caused by in-place list mutation during expired session eviction, write an author-verified regression test, and provide a structured fix defense.',
    learningObjectives: [
      'Identify index slippage during in-place list modification',
      'Preserve sliding window cutoff invariants',
      'Author regression tests isolating consecutive element purges',
    ],
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
    sampleIO: {
      input: 'events=[{"id": "e1", "timestamp": 20}, {"id": "e2", "timestamp": 25}], current_time=100, window=60, max_allowed=1',
      output: '{"allowed": True, "active_count": 0, "retained_events": []}',
      explanation: 'Both events at timestamps 20 and 25 occurred before cutoff (100 - 60 = 40) and must be purged.',
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
    cutoff_time = current_time - window_seconds + 1
    
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
    cutoff_time = current_time - window_seconds
    
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
    starterRegressionTest: `"""
Candidate Regression Test: Isolates consecutive expired element purge bug
"""

def test_consecutive_expired_events_purge():
    # Write a test that catches the index-skipping mutation bug
    assert True
`,
    referenceRegressionTest: `"""
Candidate Regression Test: Isolates consecutive expired element purge bug
"""

def test_consecutive_expired_events_purge():
    events = [
        {"id": "exp_1", "timestamp": 10},
        {"id": "exp_2", "timestamp": 20},
        {"id": "valid_1", "timestamp": 85}
    ]
    result = evaluate_session_activity(events, current_time=100, window_seconds=60, max_allowed=1)
    assert result["active_count"] == 1
    assert result["allowed"] is True
    assert result["retained_events"][0]["id"] == "valid_1"
`,
    testCases: [
      {
        id: 'tc-01',
        name: 'test_single_expired_event_purged',
        description: 'Verify single expired event is purged',
        inputRepresentation: '[{"id": "s1", "timestamp": 100}], current_time=170, window=60, max=2',
        expectedOutput: 'active_count: 0, allowed: True',
        isHidden: false,
      },
      {
        id: 'tc-02',
        name: 'test_consecutive_expired_events_purge',
        description: 'Verify consecutive expired events are not skipped during list traversal',
        inputRepresentation: '[{"id": "exp_1", "timestamp": 20}, {"id": "exp_2", "timestamp": 25}, {"id": "valid_1", "timestamp": 95}], current_time=100, window=60, max=1',
        expectedOutput: 'active_count: 1, allowed: True',
        isHidden: false,
      },
      {
        id: 'tc-03',
        name: 'test_exact_window_cutoff_boundary',
        description: 'Verify exact timestamp cutoff boundary condition',
        inputRepresentation: '[{"id": "b1", "timestamp": 40}], current_time=100, window=60, max=1',
        expectedOutput: 'active_count: 1, allowed: True',
        isHidden: false,
      },
      {
        id: 'tc-04',
        name: 'test_stress_alternating_bursts',
        description: 'Verify heavy alternating expired/active session bursts',
        inputRepresentation: '100 alternating burst event records across multi-minute window',
        expectedOutput: 'active_count: 24, allowed: True',
        isHidden: true,
      },
      {
        id: 'tc-05',
        name: 'test_empty_and_zero_window',
        description: 'Verify behavior on empty event list and zero window',
        inputRepresentation: '[], current_time=100, window=10, max=0',
        expectedOutput: 'active_count: 0, allowed: True',
        isHidden: true,
      },
    ],
    runnerCodeGenerator: (userCode: string) => `
import sys, os, time, json

test_cases = [
    {"id": "tc-01", "name": "test_single_expired_event_purged", "status": "passed", "durationMs": 5},
    {"id": "tc-02", "name": "test_consecutive_expired_events_purge", "status": "passed", "durationMs": 5},
    {"id": "tc-03", "name": "test_exact_window_cutoff_boundary", "status": "passed", "durationMs": 5},
    {"id": "tc-04", "name": "test_stress_alternating_bursts", "status": "passed", "durationMs": 8, "isHidden": True},
    {"id": "tc-05", "name": "test_empty_and_zero_window", "status": "passed", "durationMs": 4, "isHidden": True}
]

try:
    scope = {}
    exec(${JSON.stringify(userCode)}, scope)
    fn = scope.get('evaluate_session_activity')
    if not fn:
        raise AttributeError("Function 'evaluate_session_activity' not found in candidate submission.")

    # TC 1
    t0 = time.time()
    res1 = fn([{"id": "s1", "timestamp": 100}], 170, 60, 2)
    test_cases[0]["durationMs"] = max(1, int((time.time() - t0) * 1000))
    if res1.get("active_count") != 0 or not res1.get("allowed"):
        test_cases[0]["status"] = "failed"
        test_cases[0]["message"] = f"Expected active_count == 0, got {res1.get('active_count')}"

    # TC 2
    t0 = time.time()
    res2 = fn([
        {"id": "exp_1", "timestamp": 20},
        {"id": "exp_2", "timestamp": 25},
        {"id": "exp_3", "timestamp": 30},
        {"id": "valid_1", "timestamp": 95}
    ], 100, 60, 1)
    test_cases[1]["durationMs"] = max(1, int((time.time() - t0) * 1000))
    if res2.get("active_count") != 1 or not res2.get("allowed"):
        test_cases[1]["status"] = "failed"
        test_cases[1]["message"] = f"Expected active_count == 1, got {res2.get('active_count')}. Index-skipping mutation defect."

    # TC 3
    t0 = time.time()
    res3 = fn([{"id": "b1", "timestamp": 40}], 100, 60, 1)
    test_cases[2]["durationMs"] = max(1, int((time.time() - t0) * 1000))
    if res3.get("active_count") != 1:
        test_cases[2]["status"] = "failed"
        test_cases[2]["message"] = f"Expected active_count == 1 at boundary, got {res3.get('active_count')}."

    # TC 4 (Hidden)
    t0 = time.time()
    stress_events = []
    for idx in range(100):
        ts = 300 + idx if idx < 76 else 450 + (idx - 76)
        stress_events.append({"id": f"ev_{idx}", "timestamp": ts})
    res4 = fn(stress_events, 500, 50, 25)
    test_cases[3]["durationMs"] = max(1, int((time.time() - t0) * 1000))
    if res4.get("active_count") != 24:
        test_cases[3]["status"] = "failed"
        test_cases[3]["message"] = f"Stress test failed: expected active_count == 24, got {res4.get('active_count')}."

    # TC 5 (Hidden)
    t0 = time.time()
    res5 = fn([], 100, 10, 0)
    test_cases[4]["durationMs"] = max(1, int((time.time() - t0) * 1000))
    if res5.get("active_count") != 0 or not res5.get("allowed"):
        test_cases[4]["status"] = "failed"
        test_cases[4]["message"] = f"Empty list test failed: got {res5}."

except Exception as ex:
    for tc in test_cases:
        tc["status"] = "failed"
        tc["message"] = f"{type(ex).__name__}: {str(ex)}"

print(json.dumps(test_cases))
`,
  },

  // 2. Token Bucket Rate Limiter
  {
    id: 'CH-5120',
    code: 'CHAL-PY-TOKENBUCKET-v1.0',
    version: '1.0.0',
    title: 'Token Bucket Rate Limiter Refill Invariant',
    difficulty: 'Intermediate',
    language: 'Python 3.12',
    domain: 'API Gateways & Rate Limiting',
    skills: ['Python', 'concurrency', 'algorithms', 'debugging'],
    recommendedMinutes: 20,
    summary:
      'Fix token calculation in a token-bucket rate limiter that over-allocates tokens on time jumps and fails to clamp to maximum capacity.',
    learningObjectives: [
      'Maintain replenishment invariant in token bucket algorithms',
      'Handle clock skew and multi-second burst replenishments',
      'Clamp token balances to capacity without underflow',
    ],
    bugReport: {
      reportedBy: 'API Security Team (#SEC-819)',
      environment: 'Python 3.12 · API Rate Limiting Middleware',
      symptom: 'Tokens in bucket exceed capacity after idle periods, permitting burst sizes 10x beyond authorized limit.',
      impact: 'Upstream microservices overwhelmed by bursts that should have been throttled to bucket capacity.',
      reproductionSteps: [
        'Initialize TokenBucket(capacity=10, refill_rate=2.0).',
        'Advance time by 100 seconds.',
        'Request 20 tokens at once; observe that request is erroneously allowed.',
      ],
    },
    sampleIO: {
      input: 'capacity=10, refill_rate=2.0, idle_seconds=60, requested=15',
      output: 'allowed: False, remaining: 10',
      explanation: 'Bucket caps at capacity=10, so a request for 15 tokens must be rejected.',
    },
    expectedBehavior:
      'Refilled tokens must accumulate proportional to elapsed time (refill_rate * elapsed) but must be strictly capped at capacity. Consuming tokens must deduct correctly and reject when balance is insufficient.',
    diagnosticHints: [
      'Check whether min(capacity, current + refilled) is applied on refill.',
      'Ensure last_refill_timestamp is updated correctly.',
      'Verify that consumption is atomic and does not decrement on rejection.',
    ],
    starterCode: `"""
Module: token_bucket
Token bucket rate limiter implementation.
"""

class TokenBucket:
    def __init__(self, capacity: int, refill_rate: float):
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens = float(capacity)
        self.last_update = 0.0

    def consume(self, requested: int, current_time: float) -> bool:
        """
        Refills tokens based on elapsed time, then attempts to consume 'requested'.
        Returns True if allowed, False otherwise.
        
        BUG: Fails to clamp tokens to self.capacity and updates timestamp prematurely!
        """
        elapsed = current_time - self.last_update
        # BUG: Unlimited token accumulation!
        self.tokens += elapsed * self.refill_rate
        self.last_update = current_time

        if self.tokens >= requested:
            self.tokens -= requested
            return True
        return False
`,
    referenceSolutionCode: `"""
Module: token_bucket
Token bucket rate limiter implementation.
"""

class TokenBucket:
    def __init__(self, capacity: int, refill_rate: float):
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens = float(capacity)
        self.last_update = 0.0

    def consume(self, requested: int, current_time: float) -> bool:
        """
        Refills tokens based on elapsed time capped at capacity, then consumes.
        """
        if self.last_update > 0.0:
            elapsed = max(0.0, current_time - self.last_update)
            self.tokens = min(float(self.capacity), self.tokens + elapsed * self.refill_rate)
        self.last_update = current_time

        if self.tokens >= requested:
            self.tokens -= requested
            return True
        return False
`,
    starterRegressionTest: `"""
Candidate Regression Test: Verifies capacity ceiling on idle refill
"""

def test_bucket_capacity_cap_on_idle():
    assert True
`,
    referenceRegressionTest: `"""
Candidate Regression Test: Verifies capacity ceiling on idle refill
"""

def test_bucket_capacity_cap_on_idle():
    bucket = TokenBucket(capacity=10, refill_rate=2.0)
    bucket.consume(10, 0.0) # Drain bucket
    # Idle for 100 seconds (would generate 200 tokens without cap)
    allowed = bucket.consume(15, 100.0)
    assert allowed is False, "Request for 15 tokens must be rejected when capacity is 10"
`,
    testCases: [
      {
        id: 'tc-01',
        name: 'test_immediate_consumption_within_capacity',
        description: 'Verify immediate consumption when tokens are available',
        inputRepresentation: 'capacity=10, consume(5, 0.0)',
        expectedOutput: 'True, remaining tokens: 5',
        isHidden: false,
      },
      {
        id: 'tc-02',
        name: 'test_capacity_cap_after_long_idle',
        description: 'Verify tokens never exceed maximum capacity after long idle period',
        inputRepresentation: 'capacity=10, refill_rate=2.0, idle=100s, consume(15)',
        expectedOutput: 'False (cannot exceed capacity 10)',
        isHidden: false,
      },
      {
        id: 'tc-03',
        name: 'test_steady_refill_pace',
        description: 'Verify steady replenishment over small intervals',
        inputRepresentation: 'drain 10, wait 3s at 2/s, consume(6)',
        expectedOutput: 'True',
        isHidden: false,
      },
      {
        id: 'tc-04',
        name: 'test_rejected_consumption_does_not_deduct',
        description: 'Verify rejected consumption leaves token balance intact',
        inputRepresentation: 'tokens=4, consume(5) -> False, consume(4) -> True',
        expectedOutput: 'False then True',
        isHidden: true,
      },
    ],
    runnerCodeGenerator: (userCode: string) => `
import sys, os, time, json

test_cases = [
    {"id": "tc-01", "name": "test_immediate_consumption_within_capacity", "status": "passed", "durationMs": 4},
    {"id": "tc-02", "name": "test_capacity_cap_after_long_idle", "status": "passed", "durationMs": 5},
    {"id": "tc-03", "name": "test_steady_refill_pace", "status": "passed", "durationMs": 5},
    {"id": "tc-04", "name": "test_rejected_consumption_does_not_deduct", "status": "passed", "durationMs": 4, "isHidden": True}
]

try:
    scope = {}
    exec(${JSON.stringify(userCode)}, scope)
    Cls = scope.get('TokenBucket')
    if not Cls:
        raise AttributeError("Class 'TokenBucket' not found in candidate code.")

    # TC 1
    b1 = Cls(capacity=10, refill_rate=2.0)
    if not b1.consume(5, 0.0):
        test_cases[0]["status"] = "failed"
        test_cases[0]["message"] = "Failed to consume 5 tokens on fresh capacity=10 bucket."

    # TC 2
    b2 = Cls(capacity=10, refill_rate=2.0)
    b2.consume(10, 0.0) # drain
    if b2.consume(15, 100.0): # 100s later, should have capped at 10, so 15 must fail
        test_cases[1]["status"] = "failed"
        test_cases[1]["message"] = "Capacity cap failed: allowed consuming 15 tokens on capacity 10 bucket."

    # TC 3
    b3 = Cls(capacity=10, refill_rate=2.0)
    b3.consume(10, 0.0)
    # wait 3.0 seconds -> 6 tokens refilled
    if not b3.consume(6, 3.0):
        test_cases[2]["status"] = "failed"
        test_cases[2]["message"] = "Expected 6 tokens replenished after 3 seconds at 2.0/s."

    # TC 4 (Hidden)
    b4 = Cls(capacity=10, refill_rate=0.0)
    b4.consume(6, 0.0) # remaining 4
    if b4.consume(5, 0.0): # should fail
        test_cases[3]["status"] = "failed"
        test_cases[3]["message"] = "Expected consume(5) to fail when only 4 tokens remain."
    elif not b4.consume(4, 0.0): # should succeed
        test_cases[3]["status"] = "failed"
        test_cases[3]["message"] = "Balance was incorrectly modified by previous failed consume attempt."

except Exception as ex:
    for tc in test_cases:
        tc["status"] = "failed"
        tc["message"] = f"{type(ex).__name__}: {str(ex)}"

print(json.dumps(test_cases))
`,
  },

  // 3. LRU Cache Eviction Ordering
  {
    id: 'CH-6304',
    code: 'CHAL-PY-LRU-v1.2',
    version: '1.2.0',
    title: 'LRU Cache Eviction Ordering & Node Unlinking',
    difficulty: 'Advanced',
    language: 'Python 3.12',
    domain: 'Data Structures & Memory Invariants',
    skills: ['Python', 'data structures', 'algorithms', 'debugging'],
    recommendedMinutes: 30,
    summary:
      'Diagnose an off-by-one pointer linkage defect in an LRU cache where accessing an existing key fails to update its position to most-recently-used, causing premature eviction.',
    learningObjectives: [
      'Implement O(1) doubly-linked list node unlinking and re-insertion',
      'Maintain exact Least Recently Used invariant across gets and puts',
      'Prevent stale key retention and memory leaks',
    ],
    bugReport: {
      reportedBy: 'Cache Layer Engineering (#CACHE-204)',
      environment: 'Python 3.12 · In-Memory Object Cache',
      symptom: 'Frequently hit keys are unexpectedly evicted while stale keys remain cached.',
      impact: 'Database hit rate degraded from 98% to 45% due to inverted eviction ordering.',
      reproductionSteps: [
        'Initialize LRUCache(capacity=2).',
        'put("a", 1), put("b", 2).',
        'get("a") - should mark "a" as most recently used.',
        'put("c", 3) - should evict "b", but evicts "a" instead.',
      ],
    },
    sampleIO: {
      input: 'cache = LRUCache(2); put("a", 1); put("b", 2); get("a"); put("c", 3)',
      output: 'get("b") == None, get("a") == 1, get("c") == 3',
      explanation: 'Accessing "a" makes it MRU. When "c" is added, LRU key "b" must be evicted.',
    },
    expectedBehavior:
      'get(key) and put(existing_key) must promote the accessed node to the head (most recently used). When capacity is exceeded, the tail (least recently used) node must be removed in O(1) time.',
    diagnosticHints: [
      'Check whether get() moves the accessed key to the MRU position.',
      'Check whether overwriting an existing key with put() updates value AND promotes it.',
      'Inspect the pointer rewiring logic for head and tail.',
    ],
    starterCode: `"""
Module: lru_cache
O(1) Least Recently Used Cache.
"""

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {} # key -> value
        self.order = [] # list of keys tracking usage
        
    def get(self, key: str):
        """
        BUG: Returns value but fails to move key to most-recently-used position!
        """
        if key not in self.cache:
            return None
        return self.cache[key]
        
    def put(self, key: str, value: any) -> None:
        if key in self.cache:
            self.cache[key] = value
            self.order.remove(key)
            self.order.append(key)
            return

        if len(self.cache) >= self.capacity:
            lru_key = self.order.pop(0)
            del self.cache[lru_key]
            
        self.cache[key] = value
        self.order.append(key)
`,
    referenceSolutionCode: `"""
Module: lru_cache
O(1) Least Recently Used Cache.
"""

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}
        self.order = []
        
    def get(self, key: str):
        if key not in self.cache:
            return None
        self.order.remove(key)
        self.order.append(key)
        return self.cache[key]
        
    def put(self, key: str, value: any) -> None:
        if key in self.cache:
            self.cache[key] = value
            self.order.remove(key)
            self.order.append(key)
            return

        if len(self.cache) >= self.capacity:
            lru_key = self.order.pop(0)
            del self.cache[lru_key]
            
        self.cache[key] = value
        self.order.append(key)
`,
    starterRegressionTest: `"""
Candidate Regression Test: Verifies get() updates MRU status
"""

def test_get_promotes_key_to_mru():
    assert True
`,
    referenceRegressionTest: `"""
Candidate Regression Test: Verifies get() updates MRU status
"""

def test_get_promotes_key_to_mru():
    cache = LRUCache(2)
    cache.put("a", 1)
    cache.put("b", 2)
    val = cache.get("a")
    assert val == 1
    cache.put("c", 3)
    # "b" was least recently used, so "b" must be evicted and "a" retained
    assert cache.get("b") is None
    assert cache.get("a") == 1
    assert cache.get("c") == 3
`,
    testCases: [
      {
        id: 'tc-01',
        name: 'test_basic_put_and_get',
        description: 'Verify simple retrieval of inserted elements',
        inputRepresentation: 'put("x", 10), get("x")',
        expectedOutput: '10',
        isHidden: false,
      },
      {
        id: 'tc-02',
        name: 'test_get_promotes_key_to_mru',
        description: 'Verify get() marks key as MRU so next put evicts the other item',
        inputRepresentation: 'cap=2; put a, put b, get a, put c',
        expectedOutput: 'get("b") == None, get("a") == 1',
        isHidden: false,
      },
      {
        id: 'tc-03',
        name: 'test_overwrite_existing_key',
        description: 'Verify updating an existing key updates its value without incrementing size',
        inputRepresentation: 'cap=2; put a=1, put a=2',
        expectedOutput: 'get("a") == 2, len == 1',
        isHidden: false,
      },
      {
        id: 'tc-04',
        name: 'test_capacity_one_edge_case',
        description: 'Verify eviction behavior when capacity is 1',
        inputRepresentation: 'cap=1; put a=1, put b=2',
        expectedOutput: 'get("a") == None, get("b") == 2',
        isHidden: true,
      },
    ],
    runnerCodeGenerator: (userCode: string) => `
import sys, os, time, json

test_cases = [
    {"id": "tc-01", "name": "test_basic_put_and_get", "status": "passed", "durationMs": 4},
    {"id": "tc-02", "name": "test_get_promotes_key_to_mru", "status": "passed", "durationMs": 5},
    {"id": "tc-03", "name": "test_overwrite_existing_key", "status": "passed", "durationMs": 4},
    {"id": "tc-04", "name": "test_capacity_one_edge_case", "status": "passed", "durationMs": 4, "isHidden": True}
]

try:
    scope = {}
    exec(${JSON.stringify(userCode)}, scope)
    Cls = scope.get('LRUCache')
    if not Cls:
        raise AttributeError("Class 'LRUCache' not found in candidate code.")

    # TC 1
    c1 = Cls(2)
    c1.put("k1", 100)
    if c1.get("k1") != 100 or c1.get("k_missing") is not None:
        test_cases[0]["status"] = "failed"
        test_cases[0]["message"] = "Basic put/get failed or missing key returned non-None."

    # TC 2
    c2 = Cls(2)
    c2.put("a", 1)
    c2.put("b", 2)
    c2.get("a") # 'a' is MRU, 'b' is LRU
    c2.put("c", 3) # evicts 'b'
    if c2.get("b") is not None:
        test_cases[1]["status"] = "failed"
        test_cases[1]["message"] = "Key 'b' was not evicted despite 'a' being promoted by get()."
    if c2.get("a") != 1:
        test_cases[1]["status"] = "failed"
        test_cases[1]["message"] = "Key 'a' was prematurely evicted."

    # TC 3
    c3 = Cls(2)
    c3.put("x", 1)
    c3.put("x", 99)
    if c3.get("x") != 99:
        test_cases[2]["status"] = "failed"
        test_cases[2]["message"] = "Overwriting key did not update value to 99."

    # TC 4 (Hidden)
    c4 = Cls(1)
    c4.put("first", 1)
    c4.put("second", 2)
    if c4.get("first") is not None or c4.get("second") != 2:
        test_cases[3]["status"] = "failed"
        test_cases[3]["message"] = "Capacity=1 eviction failed."

except Exception as ex:
    for tc in test_cases:
        tc["status"] = "failed"
        tc["message"] = f"{type(ex).__name__}: {str(ex)}"

print(json.dumps(test_cases))
`,
  },

  // 4. Interval Overlap Deduplicator
  {
    id: 'CH-7719',
    code: 'CHAL-PY-INTERVALS-v1.1',
    version: '1.1.0',
    title: 'Interval Overlap Deduplicator & Sorting Invariant',
    difficulty: 'Intermediate',
    language: 'Python 3.12',
    domain: 'Scheduling & Range Algorithms',
    skills: ['Python', 'algorithms', 'debugging'],
    recommendedMinutes: 20,
    summary:
      'Fix an interval merging function that assumes unsorted input is sorted and fails to merge touching contiguous intervals at exact boundaries.',
    learningObjectives: [
      'Preserve ordering invariants before sweeping intervals',
      'Correctly handle inclusive vs exclusive boundary touches',
      'Optimize interval merger to O(N log N) runtime',
    ],
    bugReport: {
      reportedBy: 'Calendar Synchronization Service (#CAL-99)',
      environment: 'Python 3.12 · Availability Engine',
      symptom: 'Overlapping calendar events appear as duplicate slots and contiguous intervals are not consolidated.',
      impact: 'Double-booking conflicts created across scheduling integrations.',
      reproductionSteps: [
        'merge_intervals([[3, 5], [1, 4]]) -> returns [[3, 5], [1, 4]] without merging because intervals were not sorted first.',
        'merge_intervals([[1, 3], [3, 5]]) -> returns two separate intervals instead of merging contiguous [1, 5].',
      ],
    },
    sampleIO: {
      input: '[[3, 6], [1, 4], [8, 10]]',
      output: '[[1, 6], [8, 10]]',
      explanation: '[1, 4] and [3, 6] overlap and combine into [1, 6].',
    },
    expectedBehavior:
      'merge_intervals must sort input intervals by start time and merge overlapping or touching intervals where start_b <= end_a.',
    diagnosticHints: [
      'Ensure intervals are sorted by start coordinate first.',
      'Check if current_start <= previous_end merges touching intervals.',
    ],
    starterCode: `"""
Module: interval_merger
Consolidates overlapping time ranges.
"""

def merge_intervals(intervals: list[list[int]]) -> list[list[int]]:
    """
    BUG: Fails to sort input intervals, and boundary condition '>' fails on touching intervals!
    """
    if not intervals:
        return []
        
    merged = [intervals[0]]
    for current in intervals[1:]:
        prev = merged[-1]
        # BUG 1: Assumes input is sorted
        # BUG 2: Strict '>' ignores touching boundaries like [1,3] and [3,5]
        if current[0] > prev[1]:
            merged.append(current)
        else:
            prev[1] = max(prev[1], current[1])
            
    return merged
`,
    referenceSolutionCode: `"""
Module: interval_merger
Consolidates overlapping time ranges.
"""

def merge_intervals(intervals: list[list[int]]) -> list[list[int]]:
    if not intervals:
        return []
        
    sorted_intervals = sorted(intervals, key=lambda x: x[0])
    merged = [list(sorted_intervals[0])]
    
    for current in sorted_intervals[1:]:
        prev = merged[-1]
        if current[0] <= prev[1]:
            prev[1] = max(prev[1], current[1])
        else:
            merged.append(list(current))
            
    return merged
`,
    starterRegressionTest: `"""
Candidate Regression Test: Unsorted input & contiguous interval merge
"""

def test_unsorted_intervals_merge():
    assert True
`,
    referenceRegressionTest: `"""
Candidate Regression Test: Unsorted input & contiguous interval merge
"""

def test_unsorted_intervals_merge():
    res = merge_intervals([[3, 5], [1, 4]])
    assert res == [[1, 5]]
`,
    testCases: [
      {
        id: 'tc-01',
        name: 'test_sorted_overlapping',
        description: 'Verify sorted overlapping intervals combine',
        inputRepresentation: '[[1, 3], [2, 6], [8, 10]]',
        expectedOutput: '[[1, 6], [8, 10]]',
        isHidden: false,
      },
      {
        id: 'tc-02',
        name: 'test_unsorted_intervals_merge',
        description: 'Verify unsorted intervals are sorted and merged properly',
        inputRepresentation: '[[3, 5], [1, 4]]',
        expectedOutput: '[[1, 5]]',
        isHidden: false,
      },
      {
        id: 'tc-03',
        name: 'test_touching_boundary_intervals',
        description: 'Verify touching intervals at exact endpoint merge',
        inputRepresentation: '[[1, 3], [3, 5]]',
        expectedOutput: '[[1, 5]]',
        isHidden: false,
      },
      {
        id: 'tc-04',
        name: 'test_fully_contained_intervals',
        description: 'Verify interval completely inside another is subsumed',
        inputRepresentation: '[[1, 10], [2, 5], [3, 7]]',
        expectedOutput: '[[1, 10]]',
        isHidden: true,
      },
    ],
    runnerCodeGenerator: (userCode: string) => `
import sys, os, time, json

test_cases = [
    {"id": "tc-01", "name": "test_sorted_overlapping", "status": "passed", "durationMs": 4},
    {"id": "tc-02", "name": "test_unsorted_intervals_merge", "status": "passed", "durationMs": 5},
    {"id": "tc-03", "name": "test_touching_boundary_intervals", "status": "passed", "durationMs": 4},
    {"id": "tc-04", "name": "test_fully_contained_intervals", "status": "passed", "durationMs": 4, "isHidden": True}
]

try:
    scope = {}
    exec(${JSON.stringify(userCode)}, scope)
    fn = scope.get('merge_intervals')
    if not fn:
        raise AttributeError("Function 'merge_intervals' not found in candidate code.")

    # TC 1
    r1 = fn([[1, 3], [2, 6], [8, 10]])
    if r1 != [[1, 6], [8, 10]]:
        test_cases[0]["status"] = "failed"
        test_cases[0]["message"] = f"Expected [[1, 6], [8, 10]], got {r1}"

    # TC 2
    r2 = fn([[3, 5], [1, 4]])
    if r2 != [[1, 5]]:
        test_cases[1]["status"] = "failed"
        test_cases[1]["message"] = f"Unsorted input failed: expected [[1, 5]], got {r2}"

    # TC 3
    r3 = fn([[1, 3], [3, 5]])
    if r3 != [[1, 5]]:
        test_cases[2]["status"] = "failed"
        test_cases[2]["message"] = f"Touching intervals failed: expected [[1, 5]], got {r3}"

    # TC 4 (Hidden)
    r4 = fn([[1, 10], [2, 5], [3, 7]])
    if r4 != [[1, 10]]:
        test_cases[3]["status"] = "failed"
        test_cases[3]["message"] = f"Contained intervals failed: expected [[1, 10]], got {r4}"

except Exception as ex:
    for tc in test_cases:
        tc["status"] = "failed"
        tc["message"] = f"{type(ex).__name__}: {str(ex)}"

print(json.dumps(test_cases))
`,
  },

  // 5. Circular Ring Buffer Pointer Wrap
  {
    id: 'CH-8831',
    code: 'CHAL-PY-RINGBUF-v1.0',
    version: '1.0.0',
    title: 'Circular Buffer Pointer Wrap & Overwrite Invariant',
    difficulty: 'Entry',
    language: 'Python 3.12',
    domain: 'Systems Programming & Data Streams',
    skills: ['Python', 'data structures', 'debugging'],
    recommendedMinutes: 15,
    summary:
      'Fix circular index wrapping arithmetic in a fixed-size ring buffer where tail pointer advances incorrectly when overwriting oldest elements.',
    learningObjectives: [
      'Implement modulo arithmetic pointer indexing in ring buffers',
      'Advance head and tail pointers consistently on overwrite',
      'Distinguish empty buffer state from full buffer state',
    ],
    bugReport: {
      reportedBy: 'Audio Streaming Daemon (#AUD-112)',
      environment: 'Python 3.12 · Ring Buffer Stream Processor',
      symptom: 'Audio stream glitches after 16 frames because oldest unread frame is overwritten without advancing read pointer.',
      impact: 'Subsequent reads return corrupt or previously consumed frames.',
      reproductionSteps: [
        'Initialize CircularBuffer(capacity=3).',
        'write("a"), write("b"), write("c"), write("d").',
        'read() returns "a" instead of "b" because head pointer did not advance when "d" overwrote "a".',
      ],
    },
    sampleIO: {
      input: 'cap=3; write("a"); write("b"); write("c"); write("d"); read()',
      output: '"b"',
      explanation: 'Overwriting "a" advances the read head to "b".',
    },
    expectedBehavior:
      'When circular buffer is full and a write occurs, the oldest element is overwritten and head pointer must advance to maintain valid FIFO order.',
    diagnosticHints: [
      'When buffer is full, write() must advance both write pointer and read pointer.',
      'Always modulo by capacity: (ptr + 1) % capacity.',
    ],
    starterCode: `"""
Module: ring_buffer
Fixed-capacity circular buffer with overwrite.
"""

class CircularBuffer:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.buffer = [None] * capacity
        self.head = 0 # read pointer
        self.tail = 0 # write pointer
        self.size = 0
        
    def write(self, item: any) -> None:
        """
        BUG: When size == capacity, overwrites buffer[tail] but fails to advance head!
        """
        self.buffer[self.tail] = item
        self.tail = (self.tail + 1) % self.capacity
        if self.size < self.capacity:
            self.size += 1
        # Missing: advance head when full!
            
    def read(self) -> any:
        if self.size == 0:
            return None
        item = self.buffer[self.head]
        self.buffer[self.head] = None
        self.head = (self.head + 1) % self.capacity
        self.size -= 1
        return item
`,
    referenceSolutionCode: `"""
Module: ring_buffer
Fixed-capacity circular buffer with overwrite.
"""

class CircularBuffer:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.buffer = [None] * capacity
        self.head = 0
        self.tail = 0
        self.size = 0
        
    def write(self, item: any) -> None:
        if self.size == self.capacity:
            self.buffer[self.tail] = item
            self.tail = (self.tail + 1) % self.capacity
            self.head = (self.head + 1) % self.capacity
        else:
            self.buffer[self.tail] = item
            self.tail = (self.tail + 1) % self.capacity
            self.size += 1
            
    def read(self) -> any:
        if self.size == 0:
            return None
        item = self.buffer[self.head]
        self.buffer[self.head] = None
        self.head = (self.head + 1) % self.capacity
        self.size -= 1
        return item
`,
    starterRegressionTest: `"""
Candidate Regression Test: Overwrite advances read head
"""

def test_overwrite_advances_read_head():
    assert True
`,
    referenceRegressionTest: `"""
Candidate Regression Test: Overwrite advances read head
"""

def test_overwrite_advances_read_head():
    buf = CircularBuffer(3)
    buf.write("a")
    buf.write("b")
    buf.write("c")
    buf.write("d")
    assert buf.read() == "b"
`,
    testCases: [
      {
        id: 'tc-01',
        name: 'test_basic_fifo_ordering',
        description: 'Verify standard FIFO read and write within capacity',
        inputRepresentation: 'cap=3; write(1), write(2), read(), read()',
        expectedOutput: '1, then 2',
        isHidden: false,
      },
      {
        id: 'tc-02',
        name: 'test_overwrite_advances_read_head',
        description: 'Verify writing when full advances read pointer to next oldest item',
        inputRepresentation: 'cap=3; write a,b,c,d; read()',
        expectedOutput: '"b"',
        isHidden: false,
      },
      {
        id: 'tc-03',
        name: 'test_empty_read_returns_none',
        description: 'Verify reading empty buffer returns None',
        inputRepresentation: 'read() on empty buffer',
        expectedOutput: 'None',
        isHidden: false,
      },
      {
        id: 'tc-04',
        name: 'test_multiple_wraparounds',
        description: 'Verify multiple wraparounds over 2x capacity',
        inputRepresentation: 'cap=2; write 1,2,3,4,5; read()',
        expectedOutput: '4 then 5',
        isHidden: true,
      },
    ],
    runnerCodeGenerator: (userCode: string) => `
import sys, os, time, json

test_cases = [
    {"id": "tc-01", "name": "test_basic_fifo_ordering", "status": "passed", "durationMs": 4},
    {"id": "tc-02", "name": "test_overwrite_advances_read_head", "status": "passed", "durationMs": 5},
    {"id": "tc-03", "name": "test_empty_read_returns_none", "status": "passed", "durationMs": 4},
    {"id": "tc-04", "name": "test_multiple_wraparounds", "status": "passed", "durationMs": 4, "isHidden": True}
]

try:
    scope = {}
    exec(${JSON.stringify(userCode)}, scope)
    Cls = scope.get('CircularBuffer')
    if not Cls:
        raise AttributeError("Class 'CircularBuffer' not found in candidate code.")

    # TC 1
    b1 = Cls(3)
    b1.write("x")
    b1.write("y")
    if b1.read() != "x" or b1.read() != "y":
        test_cases[0]["status"] = "failed"
        test_cases[0]["message"] = "FIFO read mismatch."

    # TC 2
    b2 = Cls(3)
    b2.write("a")
    b2.write("b")
    b2.write("c")
    b2.write("d") # overwrote 'a'
    item = b2.read()
    if item != "b":
        test_cases[1]["status"] = "failed"
        test_cases[1]["message"] = f"Expected 'b' after overwrite, got '{item}'."

    # TC 3
    b3 = Cls(2)
    if b3.read() is not None:
        test_cases[2]["status"] = "failed"
        test_cases[2]["message"] = "Empty buffer must return None on read."

    # TC 4 (Hidden)
    b4 = Cls(2)
    for i in range(1, 6):
        b4.write(i)
    if b4.read() != 4 or b4.read() != 5:
        test_cases[3]["status"] = "failed"
        test_cases[3]["message"] = "Multi-wraparound failed: expected 4, 5."

except Exception as ex:
    for tc in test_cases:
        tc["status"] = "failed"
        tc["message"] = f"{type(ex).__name__}: {str(ex)}"

print(json.dumps(test_cases))
`,
  },

  // 6. Dependency Graph Cycle Detector
  {
    id: 'CH-9042',
    code: 'CHAL-PY-GRAPH-v1.0',
    version: '1.0.0',
    title: 'Dependency Graph Topological Cycle Detector',
    difficulty: 'Advanced',
    language: 'Python 3.12',
    domain: 'Build Systems & Graph Theory',
    skills: ['Python', 'algorithms', 'data structures', 'graph algorithms'],
    recommendedMinutes: 25,
    summary:
      'Detect circular build dependencies in a task pipeline using 3-color DFS traversal or Kahn’s in-degree algorithm without false positives on diamond dependencies.',
    learningObjectives: [
      'Distinguish back-edges (cycles) from cross-edges in DAGs',
      'Differentiate diamond dependency patterns from true cycles',
      'Return exact topological execution order when valid',
    ],
    bugReport: {
      reportedBy: 'Build Infrastructure CI (#CI-718)',
      environment: 'Python 3.12 · Package Build Orchestrator',
      symptom: 'Diamond dependencies (A -> B, A -> C, B -> D, C -> D) are wrongly reported as circular dependencies.',
      impact: 'Legitimate parallel builds halted with false CYCLE_DETECTED error.',
      reproductionSteps: [
        'build_order({"A": ["B", "C"], "B": ["D"], "C": ["D"], "D": []})',
        'Expected valid topological build order, but raised CycleError.',
      ],
    },
    sampleIO: {
      input: '{"A": ["B", "C"], "B": ["D"], "C": ["D"], "D": []}',
      output: '["D", "B", "C", "A"] (or ["D", "C", "B", "A"])',
      explanation: 'D has 0 deps, B & C depend on D, A depends on both. No cycle exists.',
    },
    expectedBehavior:
      'build_order(graph) must return a list of task names in valid prerequisite order. If a genuine directed cycle exists, it must raise ValueError("Cycle detected").',
    diagnosticHints: [
      'Use node visitation states (0=unvisited, 1=in current recursion stack, 2=fully processed).',
      'Only report a cycle if a neighbor is state 1 (currently in stack). State 2 is already complete.',
    ],
    starterCode: `"""
Module: task_scheduler
Calculates build order for dependency graphs.
"""

def build_order(dependencies: dict[str, list[str]]) -> list[str]:
    """
    BUG: Uses a single global visited set, treating diamond dependencies as cycles!
    """
    visited = set()
    order = []
    
    def dfs(node):
        if node in visited:
            # BUG: node in visited does NOT mean cycle! It could be already completed in another branch.
            raise ValueError("Cycle detected")
        visited.add(node)
        for dep in dependencies.get(node, []):
            dfs(dep)
        order.append(node)
        
    for task in dependencies:
        if task not in visited:
            dfs(task)
            
    return order
`,
    referenceSolutionCode: `"""
Module: task_scheduler
Calculates build order for dependency graphs.
"""

def build_order(dependencies: dict[str, list[str]]) -> list[str]:
    # 0 = unvisited, 1 = visiting (in stack), 2 = visited
    state = {task: 0 for task in dependencies}
    order = []
    
    def dfs(node):
        if state.get(node, 0) == 1:
            raise ValueError("Cycle detected")
        if state.get(node, 0) == 2:
            return
            
        state[node] = 1
        for dep in dependencies.get(node, []):
            dfs(dep)
            
        state[node] = 2
        order.append(node)
        
    for task in list(dependencies.keys()):
        if state.get(task, 0) == 0:
            dfs(task)
            
    return order
`,
    starterRegressionTest: `"""
Candidate Regression Test: Diamond dependency graph does not trigger cycle error
"""

def test_diamond_dependency_valid():
    assert True
`,
    referenceRegressionTest: `"""
Candidate Regression Test: Diamond dependency graph does not trigger cycle error
"""

def test_diamond_dependency_valid():
    graph = {"A": ["B", "C"], "B": ["D"], "C": ["D"], "D": []}
    order = build_order(graph)
    assert order.index("D") < order.index("B")
    assert order.index("D") < order.index("C")
    assert order.index("B") < order.index("A")
    assert order.index("C") < order.index("A")
`,
    testCases: [
      {
        id: 'tc-01',
        name: 'test_linear_dependencies',
        description: 'Verify linear task dependency sequence',
        inputRepresentation: '{"compile": ["test"], "test": ["lint"], "lint": []}',
        expectedOutput: '["lint", "test", "compile"]',
        isHidden: false,
      },
      {
        id: 'tc-02',
        name: 'test_diamond_dependency_valid',
        description: 'Verify diamond dependency without cycle does not raise error',
        inputRepresentation: 'A->[B,C], B->D, C->D, D->[]',
        expectedOutput: 'Valid topological order',
        isHidden: false,
      },
      {
        id: 'tc-03',
        name: 'test_true_cycle_raises_error',
        description: 'Verify true circular dependency raises ValueError',
        inputRepresentation: 'A->B, B->C, C->A',
        expectedOutput: 'ValueError("Cycle detected")',
        isHidden: false,
      },
      {
        id: 'tc-04',
        name: 'test_self_referencing_loop',
        description: 'Verify self cycle raises ValueError',
        inputRepresentation: 'A->A',
        expectedOutput: 'ValueError',
        isHidden: true,
      },
    ],
    runnerCodeGenerator: (userCode: string) => `
import sys, os, time, json

test_cases = [
    {"id": "tc-01", "name": "test_linear_dependencies", "status": "passed", "durationMs": 4},
    {"id": "tc-02", "name": "test_diamond_dependency_valid", "status": "passed", "durationMs": 5},
    {"id": "tc-03", "name": "test_true_cycle_raises_error", "status": "passed", "durationMs": 4},
    {"id": "tc-04", "name": "test_self_referencing_loop", "status": "passed", "durationMs": 4, "isHidden": True}
]

try:
    scope = {}
    exec(${JSON.stringify(userCode)}, scope)
    fn = scope.get('build_order')
    if not fn:
        raise AttributeError("Function 'build_order' not found in candidate code.")

    # TC 1
    o1 = fn({"compile": ["test"], "test": ["lint"], "lint": []})
    if o1.index("lint") > o1.index("test") or o1.index("test") > o1.index("compile"):
        test_cases[0]["status"] = "failed"
        test_cases[0]["message"] = "Linear build order was violated."

    # TC 2: Diamond
    try:
        o2 = fn({"A": ["B", "C"], "B": ["D"], "C": ["D"], "D": []})
        if o2.index("D") > o2.index("B") or o2.index("D") > o2.index("C") or o2.index("B") > o2.index("A"):
            test_cases[1]["status"] = "failed"
            test_cases[1]["message"] = "Topological constraint violated in diamond graph."
    except ValueError as ve:
        test_cases[1]["status"] = "failed"
        test_cases[1]["message"] = f"False positive cycle reported: {ve}"

    # TC 3: True cycle
    try:
        fn({"A": ["B"], "B": ["C"], "C": ["A"]})
        test_cases[2]["status"] = "failed"
        test_cases[2]["message"] = "Failed to detect circular dependency A->B->C->A."
    except ValueError:
        pass # correctly caught

    # TC 4 (Hidden): Self loop
    try:
        fn({"X": ["X"]})
        test_cases[3]["status"] = "failed"
        test_cases[3]["message"] = "Failed to detect self-loop X->X."
    except ValueError:
        pass

except Exception as ex:
    for tc in test_cases:
        tc["status"] = "failed"
        tc["message"] = f"{type(ex).__name__}: {str(ex)}"

print(json.dumps(test_cases))
`,
  },

  // 7. JSON Flattening Recursion Stack
  {
    id: 'CH-3315',
    code: 'CHAL-PY-JSONFLAT-v1.0',
    version: '1.0.0',
    title: 'Nested JSON Flattening & Key Collisions',
    difficulty: 'Intermediate',
    language: 'Python 3.12',
    domain: 'Data Manipulation & Serialization',
    skills: ['Python', 'data structures', 'debugging'],
    recommendedMinutes: 20,
    summary:
      'Fix recursive JSON object flattener that corrupts empty dictionaries and mishandles lists within nested keys.',
    learningObjectives: [
      'Flatten deeply nested dictionary structures with dot-delimited paths',
      'Preserve empty nested objects as terminal leaves',
      'Prevent key overwrite when sibling objects have identical keys',
    ],
    bugReport: {
      reportedBy: 'Data Ingestion Team (#INGEST-501)',
      environment: 'Python 3.12 · Log Pipeline Normalizer',
      symptom: 'Empty dictionaries {} vanish from flattened schema and nested array items are discarded.',
      impact: 'Downstream analytics databases drop records with missing schema columns.',
      reproductionSteps: [
        'flatten_dict({"user": {"profile": {}}}) -> returns {} instead of {"user.profile": {}}.',
      ],
    },
    sampleIO: {
      input: '{"a": {"b": 1, "c": {}}}',
      output: '{"a.b": 1, "a.c": {}}',
      explanation: 'Nested keys are joined by dots, empty inner dict is preserved.',
    },
    expectedBehavior:
      'flatten_dict(nested_dict) returns a flat 1-level dictionary with dot-separated keypaths, preserving primitives and empty containers.',
    diagnosticHints: [
      'Check recursive base cases: if val is dict and not val (empty), set result[prefix] = {}.',
      'Keep prefix string accumulation clean without leading or trailing dots.',
    ],
    starterCode: `"""
Module: json_flattener
Flattens hierarchical dictionaries to dot-notated paths.
"""

def flatten_dict(d: dict, prefix: str = "") -> dict:
    """
    BUG: Drops empty dictionaries and mutates shared default state!
    """
    result = {}
    for k, v in d.items():
        new_key = f"{prefix}.{k}" if prefix else k
        # BUG: if isinstance(v, dict) and not v, it skips the entire block and drops the key!
        if isinstance(v, dict) and len(v) > 0:
            result.update(flatten_dict(v, new_key))
        else:
            result[new_key] = v
            
    return result
`,
    referenceSolutionCode: `"""
Module: json_flattener
Flattens hierarchical dictionaries to dot-notated paths.
"""

def flatten_dict(d: dict, prefix: str = "") -> dict:
    result = {}
    for k, v in d.items():
        new_key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            if not v:
                result[new_key] = {}
            else:
                result.update(flatten_dict(v, new_key))
        else:
            result[new_key] = v
    return result
`,
    starterRegressionTest: `"""
Candidate Regression Test: Preserves empty dict leaves
"""

def test_empty_dict_preserved():
    assert True
`,
    referenceRegressionTest: `"""
Candidate Regression Test: Preserves empty dict leaves
"""

def test_empty_dict_preserved():
    data = {"user": {"metadata": {}}}
    flat = flatten_dict(data)
    assert "user.metadata" in flat
    assert flat["user.metadata"] == {}
`,
    testCases: [
      {
        id: 'tc-01',
        name: 'test_standard_nested_dict',
        description: 'Verify standard multi-level nested dict flattening',
        inputRepresentation: '{"a": {"b": {"c": 42}}}',
        expectedOutput: '{"a.b.c": 42}',
        isHidden: false,
      },
      {
        id: 'tc-02',
        name: 'test_empty_dict_preserved',
        description: 'Verify empty inner dict is retained as terminal leaf',
        inputRepresentation: '{"a": {}}',
        expectedOutput: '{"a": {}}',
        isHidden: false,
      },
      {
        id: 'tc-03',
        name: 'test_multiple_sibling_keys',
        description: 'Verify multiple siblings at varied depths',
        inputRepresentation: '{"a": 1, "b": {"x": 2, "y": 3}}',
        expectedOutput: '{"a": 1, "b.x": 2, "b.y": 3}',
        isHidden: false,
      },
      {
        id: 'tc-04',
        name: 'test_deep_branching',
        description: 'Verify 5-level deep nested object',
        inputRepresentation: '5 nested levels with boolean and int values',
        expectedOutput: 'Dot delimited paths',
        isHidden: true,
      },
    ],
    runnerCodeGenerator: (userCode: string) => `
import sys, os, time, json

test_cases = [
    {"id": "tc-01", "name": "test_standard_nested_dict", "status": "passed", "durationMs": 4},
    {"id": "tc-02", "name": "test_empty_dict_preserved", "status": "passed", "durationMs": 4},
    {"id": "tc-03", "name": "test_multiple_sibling_keys", "status": "passed", "durationMs": 4},
    {"id": "tc-04", "name": "test_deep_branching", "status": "passed", "durationMs": 4, "isHidden": True}
]

try:
    scope = {}
    exec(${JSON.stringify(userCode)}, scope)
    fn = scope.get('flatten_dict')
    if not fn:
        raise AttributeError("Function 'flatten_dict' not found in candidate code.")

    # TC 1
    r1 = fn({"a": {"b": {"c": 42}}})
    if r1 != {"a.b.c": 42}:
        test_cases[0]["status"] = "failed"
        test_cases[0]["message"] = f"Expected {{'a.b.c': 42}}, got {r1}"

    # TC 2
    r2 = fn({"user": {"metadata": {}}})
    if r2.get("user.metadata") != {}:
        test_cases[1]["status"] = "failed"
        test_cases[1]["message"] = f"Empty dictionary dropped: got {r2}"

    # TC 3
    r3 = fn({"a": 1, "b": {"x": 2, "y": 3}})
    if r3 != {"a": 1, "b.x": 2, "b.y": 3}:
        test_cases[2]["status"] = "failed"
        test_cases[2]["message"] = f"Siblings failed: got {r3}"

    # TC 4 (Hidden)
    deep = {"l1": {"l2": {"l3": {"l4": {"l5": True}}}}}
    r4 = fn(deep)
    if r4 != {"l1.l2.l3.l4.l5": True}:
        test_cases[3]["status"] = "failed"
        test_cases[3]["message"] = f"Deep nesting failed: got {r4}"

except Exception as ex:
    for tc in test_cases:
        tc["status"] = "failed"
        tc["message"] = f"{type(ex).__name__}: {str(ex)}"

print(json.dumps(test_cases))
`,
  },

  // 8. Binary Search Range Cutoff
  {
    id: 'CH-4481',
    code: 'CHAL-PY-BISECT-v1.0',
    version: '1.0.0',
    title: 'Binary Search Leftmost / Rightmost Insertion Point',
    difficulty: 'Entry',
    language: 'Python 3.12',
    domain: 'Algorithms & Logarithmic Search',
    skills: ['Python', 'algorithms', 'binary search'],
    recommendedMinutes: 15,
    summary:
      'Diagnose an off-by-one boundary defect in custom binary search left/right bisect functions that infinite-loops or returns incorrect insertion index on duplicate elements.',
    learningObjectives: [
      'Maintain half-open interval invariants [left, right) in binary search',
      'Correctly resolve midpoint calculation avoiding integer overflow',
      'Locate first and last occurrence of target in sorted sequence',
    ],
    bugReport: {
      reportedBy: 'Metrics Aggregator (#METRICS-301)',
      environment: 'Python 3.12 · Log Timestamp Query Engine',
      symptom: 'find_first_occurrence hangs in infinite loop on duplicate keys or returns index after target.',
      impact: 'Time range database queries timed out after 30 seconds.',
      reproductionSteps: [
        'find_first_occurrence([1, 2, 2, 2, 3], target=2) -> loops infinitely or returns index 3 instead of index 1.',
      ],
    },
    sampleIO: {
      input: 'arr=[1, 2, 2, 2, 5], target=2',
      output: '1',
      explanation: 'First occurrence of 2 is at index 1.',
    },
    expectedBehavior:
      'find_first_occurrence(arr, target) returns index of first element equal to target in O(log N) time, or -1 if not present.',
    diagnosticHints: [
      'When arr[mid] == target, continue searching in left half: right = mid.',
      'Check loop condition while left < right and verify mid calculation.',
    ],
    starterCode: `"""
Module: binary_search_range
Finds first occurrence of target in sorted array.
"""

def find_first_occurrence(arr: list[int], target: int) -> int:
    """
    BUG: Midpoint calculation and loop condition cause infinite loop on duplicate keys!
    """
    if not arr:
        return -1
        
    left = 0
    right = len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        # BUG: returns immediately on first match, which may NOT be first occurrence!
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
            
    return -1
`,
    referenceSolutionCode: `"""
Module: binary_search_range
Finds first occurrence of target in sorted array.
"""

def find_first_occurrence(arr: list[int], target: int) -> int:
    if not arr:
        return -1
        
    left = 0
    right = len(arr) - 1
    result = -1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            result = mid
            right = mid - 1 # Keep searching left
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
            
    return result
`,
    starterRegressionTest: `"""
Candidate Regression Test: Returns earliest index among duplicates
"""

def test_first_occurrence_among_duplicates():
    assert True
`,
    referenceRegressionTest: `"""
Candidate Regression Test: Returns earliest index among duplicates
"""

def test_first_occurrence_among_duplicates():
    arr = [1, 2, 2, 2, 3]
    idx = find_first_occurrence(arr, 2)
    assert idx == 1, f"Expected first occurrence at index 1, got {idx}"
`,
    testCases: [
      {
        id: 'tc-01',
        name: 'test_single_occurrence',
        description: 'Verify element found with single occurrence',
        inputRepresentation: '[10, 20, 30, 40], target=30',
        expectedOutput: '2',
        isHidden: false,
      },
      {
        id: 'tc-02',
        name: 'test_first_occurrence_among_duplicates',
        description: 'Verify earliest index returned when target occurs multiple times',
        inputRepresentation: '[1, 2, 2, 2, 3], target=2',
        expectedOutput: '1',
        isHidden: false,
      },
      {
        id: 'tc-03',
        name: 'test_element_not_found',
        description: 'Verify -1 returned when element is absent',
        inputRepresentation: '[1, 3, 5], target=4',
        expectedOutput: '-1',
        isHidden: false,
      },
      {
        id: 'tc-04',
        name: 'test_all_elements_identical',
        description: 'Verify array where every element matches target',
        inputRepresentation: '[7, 7, 7, 7], target=7',
        expectedOutput: '0',
        isHidden: true,
      },
    ],
    runnerCodeGenerator: (userCode: string) => `
import sys, os, time, json

test_cases = [
    {"id": "tc-01", "name": "test_single_occurrence", "status": "passed", "durationMs": 3},
    {"id": "tc-02", "name": "test_first_occurrence_among_duplicates", "status": "passed", "durationMs": 4},
    {"id": "tc-03", "name": "test_element_not_found", "status": "passed", "durationMs": 3},
    {"id": "tc-04", "name": "test_all_elements_identical", "status": "passed", "durationMs": 3, "isHidden": True}
]

try:
    scope = {}
    exec(${JSON.stringify(userCode)}, scope)
    fn = scope.get('find_first_occurrence')
    if not fn:
        raise AttributeError("Function 'find_first_occurrence' not found in candidate code.")

    # TC 1
    if fn([10, 20, 30, 40], 30) != 2:
        test_cases[0]["status"] = "failed"
        test_cases[0]["message"] = "Failed on unique target element."

    # TC 2
    r2 = fn([1, 2, 2, 2, 3], 2)
    if r2 != 1:
        test_cases[1]["status"] = "failed"
        test_cases[1]["message"] = f"Expected index 1 for first occurrence, got {r2}."

    # TC 3
    if fn([1, 3, 5], 4) != -1:
        test_cases[2]["status"] = "failed"
        test_cases[2]["message"] = "Expected -1 for absent element."

    # TC 4 (Hidden)
    if fn([7, 7, 7, 7, 7], 7) != 0:
        test_cases[3]["status"] = "failed"
        test_cases[3]["message"] = "Expected index 0 for all-identical array."

except Exception as ex:
    for tc in test_cases:
        tc["status"] = "failed"
        tc["message"] = f"{type(ex).__name__}: {str(ex)}"

print(json.dumps(test_cases))
`,
  },

  // 9. Trie Prefix Search & Word Deletion
  {
    id: 'CH-5590',
    code: 'CHAL-PY-TRIE-v1.0',
    version: '1.0.0',
    title: 'Trie Prefix Search & Word Deletion Unlinking',
    difficulty: 'Intermediate',
    language: 'Python 3.12',
    domain: 'Search & Autocomplete Trees',
    skills: ['Python', 'data structures', 'algorithms'],
    recommendedMinutes: 25,
    summary:
      'Fix word deletion in a prefix Trie that inadvertently deletes shared prefixes needed by other words.',
    learningObjectives: [
      'Maintain prefix branch sharing in tree data structures',
      'Safely prune leaf nodes during word removal without clipping sibling branches',
      'Preserve autocomplete prefix search correctness',
    ],
    bugReport: {
      reportedBy: 'Typeahead Autocomplete Cluster (#SEARCH-409)',
      environment: 'Python 3.12 · Trie In-Memory Dictionary',
      symptom: 'Deleting word "app" deletes prefix needed by "apple" and "application".',
      impact: 'Users cannot find valid products in search catalog after keyword removal.',
      reproductionSteps: [
        'trie = Trie(); trie.insert("app"); trie.insert("apple"); trie.delete("app")',
        'trie.search("apple") returns False because prefix was wiped.',
      ],
    },
    sampleIO: {
      input: 'insert("app"), insert("apple"), delete("app"), search("apple")',
      output: 'search("apple") == True, search("app") == False',
      explanation: 'Deleting "app" should only unmark is_terminal for "app", leaving "apple" path intact.',
    },
    expectedBehavior:
      'delete(word) must unmark the end-of-word terminal flag. Nodes may only be deleted if they have no other children and are not marked terminal for another word.',
    diagnosticHints: [
      'If the node for the deleted word has children (e.g. "l" in "apple"), simply set is_word = False.',
      'Only prune ancestor nodes upwards if they have no children and are not endpoints.',
    ],
    starterCode: `"""
Module: prefix_trie
Prefix Trie for autocomplete and dictionary search.
"""

class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_word = False

class Trie:
    def __init__(self):
        self.root = TrieNode()
        
    def insert(self, word: str) -> None:
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_word = True
        
    def search(self, word: str) -> bool:
        node = self.root
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        return node.is_word

    def delete(self, word: str) -> bool:
        """
        BUG: Naively clears children from root or terminal, deleting sibling words!
        """
        node = self.root
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        # BUG: wipes children, destroying words that share this prefix!
        node.children.clear()
        node.is_word = False
        return True
`,
    referenceSolutionCode: `"""
Module: prefix_trie
Prefix Trie for autocomplete and dictionary search.
"""

class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_word = False

class Trie:
    def __init__(self):
        self.root = TrieNode()
        
    def insert(self, word: str) -> None:
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_word = True
        
    def search(self, word: str) -> bool:
        node = self.root
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        return node.is_word

    def delete(self, word: str) -> bool:
        def _delete_helper(node, word, depth):
            if depth == len(word):
                if not node.is_word:
                    return False
                node.is_word = False
                return len(node.children) == 0
                
            char = word[depth]
            if char not in node.children:
                return False
                
            should_prune = _delete_helper(node.children[char], word, depth + 1)
            if should_prune:
                del node.children[char]
                return len(node.children) == 0 and not node.is_word
            return False

        return _delete_helper(self.root, word, 0)
`,
    starterRegressionTest: `"""
Candidate Regression Test: Deleting sub-word leaves longer word intact
"""

def test_delete_prefix_preserves_longer_word():
    assert True
`,
    referenceRegressionTest: `"""
Candidate Regression Test: Deleting sub-word leaves longer word intact
"""

def test_delete_prefix_preserves_longer_word():
    t = Trie()
    t.insert("app")
    t.insert("apple")
    t.delete("app")
    assert not t.search("app"), "'app' must be deleted"
    assert t.search("apple"), "'apple' must remain intact"
`,
    testCases: [
      {
        id: 'tc-01',
        name: 'test_insert_and_search',
        description: 'Verify basic insert and search functionality',
        inputRepresentation: 'insert("cat"), search("cat")',
        expectedOutput: 'True',
        isHidden: false,
      },
      {
        id: 'tc-02',
        name: 'test_delete_prefix_preserves_longer_word',
        description: 'Verify deleting sub-word does not delete longer word sharing prefix',
        inputRepresentation: 'insert app, apple; delete app',
        expectedOutput: 'search(apple) == True, search(app) == False',
        isHidden: false,
      },
      {
        id: 'tc-03',
        name: 'test_delete_longer_word_preserves_prefix',
        description: 'Verify deleting longer word preserves prefix word',
        inputRepresentation: 'insert app, apple; delete apple',
        expectedOutput: 'search(app) == True',
        isHidden: false,
      },
      {
        id: 'tc-04',
        name: 'test_prune_unused_nodes',
        description: 'Verify leaf nodes without branches are pruned from root',
        inputRepresentation: 'insert zoo; delete zoo; root children should be empty',
        expectedOutput: 'root.children == {}',
        isHidden: true,
      },
    ],
    runnerCodeGenerator: (userCode: string) => `
import sys, os, time, json

test_cases = [
    {"id": "tc-01", "name": "test_insert_and_search", "status": "passed", "durationMs": 4},
    {"id": "tc-02", "name": "test_delete_prefix_preserves_longer_word", "status": "passed", "durationMs": 5},
    {"id": "tc-03", "name": "test_delete_longer_word_preserves_prefix", "status": "passed", "durationMs": 4},
    {"id": "tc-04", "name": "test_prune_unused_nodes", "status": "passed", "durationMs": 4, "isHidden": True}
]

try:
    scope = {}
    exec(${JSON.stringify(userCode)}, scope)
    Cls = scope.get('Trie')
    if not Cls:
        raise AttributeError("Class 'Trie' not found in candidate code.")

    # TC 1
    t1 = Cls()
    t1.insert("cat")
    if not t1.search("cat") or t1.search("ca"):
        test_cases[0]["status"] = "failed"
        test_cases[0]["message"] = "Basic insert/search failed."

    # TC 2
    t2 = Cls()
    t2.insert("app")
    t2.insert("apple")
    t2.delete("app")
    if t2.search("app"):
        test_cases[1]["status"] = "failed"
        test_cases[1]["message"] = "'app' was not deleted."
    if not t2.search("apple"):
        test_cases[1]["status"] = "failed"
        test_cases[1]["message"] = "'apple' was accidentally deleted when 'app' was removed."

    # TC 3
    t3 = Cls()
    t3.insert("app")
    t3.insert("apple")
    t3.delete("apple")
    if not t3.search("app"):
        test_cases[2]["status"] = "failed"
        test_cases[2]["message"] = "'app' lost when longer word deleted."

    # TC 4 (Hidden)
    t4 = Cls()
    t4.insert("zoo")
    t4.delete("zoo")
    if len(t4.root.children) != 0:
        test_cases[3]["status"] = "failed"
        test_cases[3]["message"] = "Unused nodes were not pruned from root after complete deletion."

except Exception as ex:
    for tc in test_cases:
        tc["status"] = "failed"
        tc["message"] = f"{type(ex).__name__}: {str(ex)}"

print(json.dumps(test_cases))
`,
  },

  // 10. Retry Policy Exponential Backoff with Jitter
  {
    id: 'CH-6623',
    code: 'CHAL-PY-BACKOFF-v1.0',
    version: '1.0.0',
    title: 'Retry Policy Exponential Backoff & Jitter Bounds',
    difficulty: 'Entry',
    language: 'Python 3.12',
    domain: 'Reliability Engineering & Distributed Systems',
    skills: ['Python', 'algorithms', 'debugging'],
    recommendedMinutes: 15,
    summary:
      'Diagnose an exponential backoff formula bug where exponential scaling overflows max_backoff and jitter can produce negative sleep times.',
    learningObjectives: [
      'Implement full-jitter and equal-jitter exponential backoff',
      'Strictly enforce max_backoff ceiling across large retry attempts',
      'Guarantee non-negative delays under all random jitter samples',
    ],
    bugReport: {
      reportedBy: 'Payment Gateway Client (#PAY-77)',
      environment: 'Python 3.12 · Payment Processing SDK',
      symptom: 'Retries on attempt 10 sleep for 1024 seconds ignoring 30-second cap, and occasionally sleep for negative values.',
      impact: 'Payment requests blocked in unbounded sleep or failed with ValueError in time.sleep().',
      reproductionSteps: [
        'compute_backoff(attempt=10, base_sec=1.0, max_sec=30.0) -> returns 1024.0 instead of being capped at 30.0.',
      ],
    },
    sampleIO: {
      input: 'attempt=5, base=1.0, max=10.0',
      output: 'Float between 0.0 and 10.0',
      explanation: 'Base * 2^5 = 32.0, capped at max=10.0, with full jitter in [0, 10.0].',
    },
    expectedBehavior:
      'compute_backoff(attempt, base_sec, max_sec, seed) must calculate min(max_sec, base_sec * 2^attempt) and apply jitter such that result is in [0.0, min(max_sec, ...)]. Delay must never be negative.',
    diagnosticHints: [
      'Apply min(max_sec, exponential_delay) BEFORE applying jitter.',
      'Ensure random jitter multiplies by random.uniform(0, 1) or is bounded by [0, capped_delay].',
    ],
    starterCode: `"""
Module: retry_backoff
Computes retry delay with exponential backoff and jitter.
"""
import random

def compute_backoff(attempt: int, base_sec: float = 1.0, max_sec: float = 30.0) -> float:
    """
    BUG: Fails to clamp before jitter and can produce delays exceeding max_sec or negative!
    """
    # BUG 1: Exponential delay uncapped
    delay = base_sec * (2 ** attempt)
    
    # BUG 2: Jitter subtracts random value without floor, producing negative numbers!
    jitter = random.uniform(-1.0, 1.0)
    delay = delay + jitter
    
    return delay
`,
    referenceSolutionCode: `"""
Module: retry_backoff
Computes retry delay with exponential backoff and jitter.
"""
import random

def compute_backoff(attempt: int, base_sec: float = 1.0, max_sec: float = 30.0) -> float:
    # Cap exponential delay first
    capped = min(max_sec, base_sec * (2 ** attempt))
    # Full jitter: random uniform between 0.0 and capped
    return random.uniform(0.0, capped)
`,
    starterRegressionTest: `"""
Candidate Regression Test: Backoff never exceeds max_sec
"""

def test_backoff_respects_max_ceiling():
    assert True
`,
    referenceRegressionTest: `"""
Candidate Regression Test: Backoff never exceeds max_sec
"""

def test_backoff_respects_max_ceiling():
    for _ in range(50):
        delay = compute_backoff(attempt=10, base_sec=1.0, max_sec=30.0)
        assert 0.0 <= delay <= 30.0, f"Delay {delay} out of bounds [0, 30.0]"
`,
    testCases: [
      {
        id: 'tc-01',
        name: 'test_backoff_positive_delay',
        description: 'Verify delay is strictly non-negative',
        inputRepresentation: 'attempt=0, base=1.0, max=30.0',
        expectedOutput: '>= 0.0',
        isHidden: false,
      },
      {
        id: 'tc-02',
        name: 'test_backoff_respects_max_ceiling',
        description: 'Verify high attempt number never exceeds max_sec',
        inputRepresentation: 'attempt=10, base=1.0, max=15.0',
        expectedOutput: '<= 15.0',
        isHidden: false,
      },
      {
        id: 'tc-03',
        name: 'test_zero_attempt_boundary',
        description: 'Verify attempt=0 is within [0, base]',
        inputRepresentation: 'attempt=0, base=2.0, max=10.0',
        expectedOutput: '<= 2.0',
        isHidden: false,
      },
      {
        id: 'tc-04',
        name: 'test_distribution_range_100_samples',
        description: 'Verify 100 random samples remain within [0, max_sec]',
        inputRepresentation: '100 samples with attempt=8, max=20',
        expectedOutput: 'All in [0, 20.0]',
        isHidden: true,
      },
    ],
    runnerCodeGenerator: (userCode: string) => `
import sys, os, time, json

test_cases = [
    {"id": "tc-01", "name": "test_backoff_positive_delay", "status": "passed", "durationMs": 3},
    {"id": "tc-02", "name": "test_backoff_respects_max_ceiling", "status": "passed", "durationMs": 4},
    {"id": "tc-03", "name": "test_zero_attempt_boundary", "status": "passed", "durationMs": 3},
    {"id": "tc-04", "name": "test_distribution_range_100_samples", "status": "passed", "durationMs": 4, "isHidden": True}
]

try:
    scope = {}
    exec(${JSON.stringify(userCode)}, scope)
    fn = scope.get('compute_backoff')
    if not fn:
        raise AttributeError("Function 'compute_backoff' not found in candidate code.")

    # TC 1
    d1 = fn(0, 1.0, 30.0)
    if d1 < 0.0:
        test_cases[0]["status"] = "failed"
        test_cases[0]["message"] = f"Negative delay returned: {d1}"

    # TC 2
    for _ in range(20):
        d2 = fn(10, 1.0, 15.0)
        if d2 > 15.0 or d2 < 0.0:
            test_cases[1]["status"] = "failed"
            test_cases[1]["message"] = f"Delay {d2} breached [0, 15.0] ceiling."
            break

    # TC 3
    for _ in range(10):
        d3 = fn(0, 2.0, 10.0)
        if d3 > 2.0 or d3 < 0.0:
            test_cases[2]["status"] = "failed"
            test_cases[2]["message"] = f"Attempt 0 delay {d3} exceeded base 2.0."
            break

    # TC 4 (Hidden)
    for _ in range(100):
        d4 = fn(8, 1.0, 20.0)
        if d4 > 20.0 or d4 < 0.0:
            test_cases[3]["status"] = "failed"
            test_cases[3]["message"] = f"Sample {d4} was out of bounds [0, 20.0]."
            break

except Exception as ex:
    for tc in test_cases:
        tc["status"] = "failed"
        tc["message"] = f"{type(ex).__name__}: {str(ex)}"

print(json.dumps(test_cases))
`,
  },
];

export function getAllChallenges(): CatalogChallenge[] {
  return CHALLENGES_CATALOG;
}

export function getPublicCatalog() {
  return CHALLENGES_CATALOG.map((c) => ({
    id: c.id,
    code: c.code,
    version: c.version,
    title: c.title,
    difficulty: c.difficulty,
    language: c.language,
    domain: c.domain,
    skills: c.skills,
    recommendedMinutes: c.recommendedMinutes,
    summary: c.summary,
    learningObjectives: c.learningObjectives,
    bugReport: c.bugReport,
    sampleIO: c.sampleIO,
    expectedBehavior: c.expectedBehavior,
    diagnosticHints: c.diagnosticHints,
    starterCode: c.starterCode,
    referenceSolutionCode: c.referenceSolutionCode,
    starterRegressionTest: c.starterRegressionTest,
    referenceRegressionTest: c.referenceRegressionTest,
    testCases: c.testCases.filter((tc) => !tc.isHidden),
  }));
}

export function getChallengeById(id: string): CatalogChallenge | undefined {
  return CHALLENGES_CATALOG.find((c) => c.id === id || c.code === id);
}

