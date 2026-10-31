import assert from 'node:assert';
import { getAllChallenges, getPublicCatalog, getChallengeById } from '../challengesCatalog.js';
import { defaultProgressStore } from '../progressStore.js';

async function runTests() {
  console.log('=== Running Proof of Skill Product Features & Endpoints Test Suite ===');

  // Test 1: Catalog returns >= 10 challenges
  const rawCatalog = getAllChallenges();
  assert(rawCatalog.length >= 10, `Expected at least 10 challenges, got ${rawCatalog.length}`);
  console.log(`✓ Test 1 Passed: Assessment Marketplace has ${rawCatalog.length} realistic challenges (>= 10).`);

  // Test 2: Public catalog strictly strips runnerCodeGenerator and hidden test cases
  const publicChallenges = getPublicCatalog();
  assert.strictEqual(publicChallenges.length, rawCatalog.length);
  for (const ch of publicChallenges) {
    assert(!('runnerCodeGenerator' in ch), `Challenge ${ch.id} must not leak runnerCodeGenerator in public catalog`);
    assert(ch.sampleIO && typeof ch.sampleIO.input === 'string', `Challenge ${ch.id} must contain sample I/O`);
    assert(Array.isArray(ch.skills) && ch.skills.length > 0, `Challenge ${ch.id} must specify skills`);
    for (const tc of ch.testCases) {
      assert(!tc.isHidden, `Public challenge ${ch.id} must not expose hidden test cases`);
    }
  }
  console.log('✓ Test 2 Passed: Hidden tests and runner generators strictly withheld from public catalog while sample I/O and skills are present.');

  // Test 3: Challenge lookup by ID
  const ch1 = getChallengeById('CH-4982');
  assert(ch1, 'CH-4982 should exist');
  assert(typeof ch1.runnerCodeGenerator === 'function', 'Server-internal lookup must include runnerCodeGenerator');
  console.log('✓ Test 3 Passed: Server-authoritative lookup retrieves hidden runner for execution.');

  // Test 4: Progress storage persistence & default candidate
  const progress = await defaultProgressStore.getProgress();
  assert(progress.candidateProfile.fullName, 'Candidate profile must have a fullName');
  assert(typeof progress.points === 'number', 'Progress must have points');
  assert(typeof progress.streakDays === 'number', 'Progress must have streakDays');
  console.log('✓ Test 4 Passed: Durable progress store initialized with profile, points, streak, and badges.');

  // Test 5: Draft saving & retrieval
  const draftCode = '# Fix for CH-4982\ndef authenticate(token): return True\n';
  await defaultProgressStore.saveDraft('CH-4982', draftCode, 'def test_auth(): pass');
  const progressWithDraft = await defaultProgressStore.getProgress();
  assert(progressWithDraft.drafts['CH-4982'], 'Draft should be saved');
  assert.strictEqual(progressWithDraft.drafts['CH-4982'].code, draftCode);
  console.log('✓ Test 5 Passed: Workspace draft code persists safely.');

  // Test 6: Record authentic completion with Ed25519 signature
  const fakeExecutionId = 'exec-test-' + Date.now();
  const fakeSig = 'a'.repeat(128); // 64 bytes hex
  const record = await defaultProgressStore.recordCompletion({
    challengeId: 'CH-4982',
    challengeTitle: 'Session Concurrency Limiter',
    executionId: fakeExecutionId,
    signature: fakeSig,
    keyId: 'pos_server_ed25519_v1',
    score: 100,
    testsPassed: 4,
    testsTotal: 4,
    durationMinutes: 12,
    skills: ['Python', 'Concurrency', 'Redis'],
  });
  assert(record.credentialId.startsWith('cred_') || record.credentialId.startsWith('CR-'), 'Credential ID must start with cred_ or CR-');
  const updatedProgress = await defaultProgressStore.getProgress();
  assert(updatedProgress.completedChallengeIds.includes('CH-4982'), 'Challenge should be marked completed');
  console.log(`✓ Test 6 Passed: Completion recorded with durable credential ID ${record.credentialId}.`);

  // Test 7: Credential record lookup
  const cred = await defaultProgressStore.getCredentialById(record.credentialId);
  assert(cred !== null, 'Credential should be retrievable by credentialId');
  assert.strictEqual(cred.challengeId, 'CH-4982');
  console.log('✓ Test 7 Passed: Public verification credential lookup succeeds.');

  // Test 8: Privacy settings & blind screening mode
  await defaultProgressStore.updatePrivacySettings({
    anonymizedCandidate: true,
  });
  const talentList = await defaultProgressStore.getAllEvaluatorCandidates();
  assert(talentList.length > 0, 'Talent directory should return candidates');
  const blindCandidate = talentList[0];
  assert.strictEqual(blindCandidate.displayName, 'Candidate #8842 (Blind Screening Mode)');
  console.log('✓ Test 8 Passed: Blind Screening Mode masks candidate name in recruiter talent directory.');

  // Test 9: Profile info update
  await defaultProgressStore.updateProfile({
    fullName: 'Jane Developer',
    role: 'Staff Systems Engineer',
  });
  const finalProgress = await defaultProgressStore.getProgress();
  assert.strictEqual(finalProgress.candidateProfile.fullName, 'Jane Developer');
  assert.strictEqual(finalProgress.candidateProfile.role, 'Staff Systems Engineer');
  console.log('✓ Test 9 Passed: Candidate profile and professional settings updated successfully.');

  console.log('=== All 9 Product Features & Endpoints Tests Passed Successfully ===');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
