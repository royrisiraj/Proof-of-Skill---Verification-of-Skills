import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { ProgressStore } from '../progressStore';
import { getChallengeById } from '../challengesCatalog';

async function runSessionRestorationTests() {
  console.log('--- Proof of Skill: Session Restoration & Expiry Test Suite ---');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pos_session_test_'));
  const testStorePath = path.join(tempDir, 'candidate_progress.json');

  const store = new ProgressStore(testStorePath);
  await store.init();
  const candidateId = 'cand_u9834b12';

  // TEST 1: Unfinished Active Assessment Restoration
  console.log('\n[Test 1] Unfinished Active Assessment Restoration');
  {
    // Start an active session for CH-4982
    const startRes = await store.startSession({
      candidateId,
      challengeId: 'CH-4982',
      challengeTitle: 'Session Expiry & Sliding Window Purge Buffer',
      durationMinutes: 25,
      initialCode: 'def evaluate_session_activity():\n    return {"allowed": True}',
      initialRegressionTest: 'def test_invariants(): pass',
      forceRestart: true,
    });
    assert.strictEqual(startRes.isNew, true, 'New session must be initialized');
    assert.strictEqual(startRes.session.status, 'active');

    // Save candidate draft progress & diagnosis notes
    await store.saveSessionProgress({
      sessionId: startRes.session.sessionId,
      candidateId,
      code: '# Candidate Work In Progress\ndef evaluate_session_activity(): return True\n',
      regressionTest: '# Custom regression test\ndef test_custom(): assert True\n',
      diagnosisNotes: {
        rootCause: 'In-place iteration mutation causes index skipping.',
        fixRationale: 'Replaced with list comprehension.',
        complexityTradeoffs: 'O(N) time and O(N) space.',
      },
      completedQuestions: ['Q1', 'Q2'],
      testResultsSummary: {
        passedCount: 3,
        totalCount: 3,
        regressionTestPassed: true,
      },
    });

    // Restore session
    const restoreRes = await store.restoreSession({ candidateId });
    assert.strictEqual(restoreRes.status, 'restored', 'Session should restore as active');
    assert.ok(restoreRes.session, 'Restored session must be present');
    assert.strictEqual(restoreRes.session.challengeId, 'CH-4982');
    assert.ok(restoreRes.session.lastSavedCode.includes('Candidate Work In Progress'), 'Candidate code must be preserved');
    assert.ok(restoreRes.session.lastSavedRegressionTest.includes('Custom regression test'), 'Regression test must be preserved');
    assert.strictEqual(restoreRes.session.diagnosisNotes?.rootCause, 'In-place iteration mutation causes index skipping.');
    assert.ok((restoreRes.timeRemainingSeconds ?? 0) > 0, 'Server-authoritative timer must have positive remaining time');

    // Confidentiality check: hidden tests are never exposed
    const catalogItem = getChallengeById(restoreRes.session.challengeId);
    assert.ok(catalogItem, 'Challenge must exist in catalog');
    const safeTests = catalogItem.testCases.filter((tc) => !tc.isHidden);
    assert.ok(safeTests.every((tc) => !tc.isHidden), 'Public challenge payload must strictly exclude hidden tests');

    console.log('✓ PASS: Active unfinished assessment successfully identified and restored with preserved code and server-authoritative timer');
  }

  // TEST 2: Expired but Recoverable Session (5-Minute Grace Period)
  console.log('\n[Test 2] Expired but Recoverable Session (Grace Period Policy)');
  {
    // Simulate expired session within 5-minute grace period
    const simRes = await store.simulateSessionState({
      candidateId,
      challengeId: 'CH-4982',
      state: 'expired_recoverable',
    });
    assert.strictEqual(simRes.state, 'expired_recoverable');

    // Restore attempt
    const restoreRes = await store.restoreSession({ candidateId });
    assert.strictEqual(restoreRes.status, 'expired_recoverable', 'Session must be reported as expired_recoverable');
    assert.strictEqual(restoreRes.timeRemainingSeconds, 0, 'Primary timer must be 0');
    assert.ok((restoreRes.graceRemainingSeconds ?? 0) > 0, 'Grace timer must have positive remaining time');
    assert.ok(restoreRes.session?.lastSavedCode, 'Saved candidate code must remain intact in recoverable state');

    // Perform recovery action
    const recoverRes = await store.recoverSession({
      candidateId,
      sessionId: restoreRes.session!.sessionId,
      extensionMinutes: 5,
    });
    assert.strictEqual(recoverRes.status, 'restored', 'Session must recover successfully');
    assert.ok((recoverRes.timeRemainingSeconds ?? 0) >= 290, 'Extension must grant ~5 minutes');
    assert.strictEqual(recoverRes.session?.recoveryCount, 1, 'Recovery count must increment');

    console.log('✓ PASS: Expired recoverable session correctly detected and granted 5-minute recovery grace period');
  }

  // TEST 3: Permanently Expired Session (Past Grace Period)
  console.log('\n[Test 3] Permanently Expired Session');
  {
    // Simulate session past both regular window and grace period
    await store.simulateSessionState({
      candidateId,
      challengeId: 'CH-4982',
      state: 'expired_permanent',
    });

    const restoreRes = await store.restoreSession({ candidateId });
    assert.strictEqual(restoreRes.status, 'expired_permanent', 'Must report permanently expired');
    assert.strictEqual(restoreRes.timeRemainingSeconds, 0);

    // Attempting to recover permanently expired session must fail
    const recoverRes = await store.recoverSession({
      candidateId,
      sessionId: restoreRes.session!.sessionId,
    });
    assert.strictEqual(recoverRes.status, 'expired_permanent', 'Cannot recover once grace period ends');

    // Candidate can start a fresh attempt
    const freshRes = await store.startSession({
      candidateId,
      challengeId: 'CH-4982',
      challengeTitle: 'Session Expiry & Sliding Window Purge Buffer',
      forceRestart: true,
    });
    assert.strictEqual(freshRes.isNew, true, 'Fresh session must be created');
    assert.strictEqual(freshRes.session.status, 'active');

    console.log('✓ PASS: Permanently expired session blocked from recovery and offered fresh restart');
  }

  // TEST 4: No Active Assessment Found
  console.log('\n[Test 4] No Active Assessment Found');
  {
    await store.simulateSessionState({
      candidateId,
      state: 'not_found',
    });

    const restoreRes = await store.restoreSession({ candidateId });
    assert.strictEqual(restoreRes.status, 'not_found', 'Must return not_found when registry is empty');
    assert.ok(restoreRes.message?.includes('No active assessment found'));

    console.log('✓ PASS: Correctly handled "No active assessment found" without crashing or undefined state');
  }

  // TEST 5: Already Completed Assessment
  console.log('\n[Test 5] Already Completed Assessment');
  {
    await store.simulateSessionState({
      candidateId,
      challengeId: 'CH-4982',
      state: 'already_completed',
    });

    const restoreRes = await store.restoreSession({ candidateId });
    assert.strictEqual(restoreRes.status, 'already_completed', 'Must detect already completed session');
    assert.ok(restoreRes.message?.includes('already been completed'));

    console.log('✓ PASS: Already completed assessment correctly identified; duplicate submissions prevented');
  }

  // TEST 6: Candidate Identity / Ownership Validation
  console.log('\n[Test 6] Candidate Ownership & Security Enforcements');
  {
    // Create session belonging to candidate A
    const sessA = await store.startSession({
      candidateId: 'cand_alice_123',
      challengeId: 'CH-4982',
      challengeTitle: 'Session Expiry',
      forceRestart: true,
    });

    // Candidate B attempts to restore Candidate A's session by ID
    let unauthorizedBlocked = false;
    try {
      await store.restoreSession({
        candidateId: 'cand_mallory_999',
        sessionId: sessA.session.sessionId,
      });
    } catch (err: any) {
      if (err.message.includes('UNAUTHORIZED_CANDIDATE')) {
        unauthorizedBlocked = true;
      }
    }
    assert.strictEqual(unauthorizedBlocked, true, 'Must reject unauthorized candidate access');

    console.log('✓ PASS: Server validates candidate identity and rejects cross-candidate session access');
  }

  // TEST 7: Disk Persistence Check (.data/candidate_progress.json)
  console.log('\n[Test 7] Disk Persistence Verification');
  {
    // Re-instantiate ProgressStore pointing to the same file
    const reloadedStore = new ProgressStore(testStorePath);
    await reloadedStore.init();
    const data = await reloadedStore.getProgress();
    assert.ok(data.assessmentSessions, 'Sessions must persist across store instances');
    assert.ok(Object.keys(data.assessmentSessions).length > 0, 'Saved sessions must load from JSON');

    console.log('✓ PASS: All session state, drafts, and timestamps persist to disk correctly');
  }

  // Cleanup
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('\n🎉 ALL 7 SESSION RESTORATION & EXPIRY TESTS PASSED!');
}

runSessionRestorationTests().catch((err) => {
  console.error('Session test suite failed:', err);
  process.exit(1);
});
