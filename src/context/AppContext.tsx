import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  AppScreen,
  VerificationState,
  CandidateProfile,
  Challenge,
  AssessmentResult,
  ProofCardData,
  AssessmentSession,
  RestoreSessionResponse,
} from '../types';
import {
  mockCandidate,
  sampleChallenge,
  sampleAssessmentResult,
  sampleProofCardData,
  sampleCandidateSubmission,
} from '../data/mockData';
import { executeCodeViaApi } from '../services/api/executionClient';
import { adaptExecuteResponse } from '../services/api/adapter';
import { ExecutionMode } from '../services/api/types';
import {
  fetchChallenges,
  fetchProgress,
  saveDraftCode,
  recordChallengeCompletion,
  updateCandidateProfile,
  updateCandidatePrivacy,
  ProgressResponse,
  CatalogChallengeItem,
} from '../services/api/platformClient';
import {
  restoreAssessmentSession,
  recoverAssessmentSession,
  syncSessionProgress,
  checkActiveSession,
} from '../services/api/sessionClient';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface AppContextType {
  screen: AppScreen;
  setScreen: (screen: AppScreen) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  candidate: CandidateProfile;
  isFirstTimeUser: boolean;
  setIsFirstTimeUser: (val: boolean) => void;
  challenges: Challenge[];
  challenge: Challenge;
  selectChallenge: (challengeId: string) => void;
  candidateCode: string;
  setCandidateCode: (code: string) => void;
  regressionTestCode: string;
  setRegressionTestCode: (code: string) => void;
  rootCauseDiagnosis: string;
  setRootCauseDiagnosis: (val: string) => void;
  fixRationale: string;
  setFixRationale: (val: string) => void;
  complexityTradeoffs: string;
  setComplexityTradeoffs: (val: string) => void;
  executionMode: ExecutionMode;
  setExecutionMode: (mode: ExecutionMode) => void;
  executionError: string | null;
  clearExecutionError: () => void;
  testExecutionState: 'idle' | 'running' | 'completed' | 'error';
  testResults: {
    passedCount: number;
    totalCount: number;
    visiblePassed: number;
    visibleTotal: number;
    hiddenPassed: number;
    hiddenTotal: number;
    regressionTestPassed: boolean;
    logs: string[];
    errorTrace?: string;
    executionSource?: 'mock' | 'server_simulated' | 'server_verified';
    durationMs?: number;
    executionId?: string;
    signature?: string;
    keyId?: string;
  } | null;
  runTests: (simulateFailure?: boolean) => Promise<void>;
  resetToStarterCode: () => void;
  loadSampleSolution: () => void;
  saveCurrentDraft: () => Promise<void>;
  isSavingDraft: boolean;
  submitChallenge: () => void;
  assessmentResult: AssessmentResult;
  proofCardData: ProofCardData;
  verificationState: VerificationState;
  setVerificationState: (state: VerificationState) => void;
  privacySettings: {
    showFullCodeDiff: boolean;
    showCandidateNotes: boolean;
    anonymizedCandidate: boolean;
  };
  updatePrivacySettings: (settings: Partial<{
    showFullCodeDiff: boolean;
    showCandidateNotes: boolean;
    anonymizedCandidate: boolean;
  }>) => void;
  progressData: ProgressResponse | null;
  refreshProgress: () => Promise<void>;
  updateProfileInfo: (profile: Partial<ProgressResponse['candidateProfile']>) => Promise<void>;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (val: boolean) => void;
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  copyToClipboard: (text: string, successMessage?: string) => Promise<void>;
  activeSession: AssessmentSession | null;
  sessionTimeRemaining: number | null;
  sessionExpiryStatus: 'active' | 'expired_recoverable' | 'expired_permanent' | null;
  resumeAssessmentSession: (restored: RestoreSessionResponse) => void;
  recoverCurrentSession: () => Promise<boolean>;
  resetAssessmentSession: () => void;
  setSessionExpiryStatus: (status: 'active' | 'expired_recoverable' | 'expired_permanent' | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getInitialTheme = (): 'dark' | 'light' => {
  try {
    const stored = localStorage.getItem('pos_theme');
    if (stored === 'dark' || stored === 'light') return stored;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // fallback
  }
  return 'light';
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [screen, setScreenState] = useState<AppScreen>('dashboard');
  const [theme, setThemeState] = useState<'dark' | 'light'>(getInitialTheme);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Challenges Catalog & Active Challenge State
  const [challenges, setChallenges] = useState<Challenge[]>([sampleChallenge]);
  const [challenge, setChallenge] = useState<Challenge>(sampleChallenge);

  // Progress State
  const [progressData, setProgressData] = useState<ProgressResponse | null>(null);

  // Candidate Profile State
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile>(mockCandidate);

  // Theme synchronization
  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('pos_theme', newTheme);
    } catch {
      // storage unavailable
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Challenge workspace states
  const [candidateCode, setCandidateCode] = useState<string>(sampleChallenge.starterCode);
  const [regressionTestCode, setRegressionTestCode] = useState<string>(sampleChallenge.starterRegressionTest);
  const [rootCauseDiagnosis, setRootCauseDiagnosis] = useState<string>('');
  const [fixRationale, setFixRationale] = useState<string>('');
  const [complexityTradeoffs, setComplexityTradeoffs] = useState<string>('');
  // Production-first execution mode: default to server execution
  const [executionMode, setExecutionModeState] = useState<ExecutionMode>('server');
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [testExecutionState, setTestExecutionState] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [testResults, setTestResults] = useState<AppContextType['testResults']>(null);

  // Dynamic assessment results & verifiable proof card
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult>(sampleAssessmentResult);
  const [proofCardData, setProofCardData] = useState<ProofCardData>(sampleProofCardData);

  // Assessment Session & Expiry State
  const [activeSession, setActiveSession] = useState<AssessmentSession | null>(null);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number | null>(null);
  const [sessionExpiryStatus, setSessionExpiryStatus] = useState<
    'active' | 'expired_recoverable' | 'expired_permanent' | null
  >(null);

  // Countdown timer for active assessment sessions
  useEffect(() => {
    if (sessionTimeRemaining === null || sessionTimeRemaining <= 0) {
      if (sessionTimeRemaining === 0 && activeSession && sessionExpiryStatus === 'active') {
        setSessionExpiryStatus('expired_recoverable');
        addToast('Assessment timer expired. Entered 5-minute recovery grace period.', 'warning');
      }
      return;
    }

    const timer = setInterval(() => {
      setSessionTimeRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          setSessionExpiryStatus('expired_recoverable');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionTimeRemaining, activeSession, sessionExpiryStatus]);

  const setExecutionMode = (mode: ExecutionMode) => {
    setExecutionModeState(mode);
    setExecutionError(null);
  };

  const clearExecutionError = () => {
    setExecutionError(null);
  };

  // Verification state selector
  const [verificationState, setVerificationState] = useState<VerificationState>('valid');

  // Privacy toggles
  const [privacySettings, setPrivacySettings] = useState({
    showFullCodeDiff: true,
    showCandidateNotes: true,
    anonymizedCandidate: false,
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Load challenges and progress on initial mount
  useEffect(() => {
    async function loadData() {
      try {
        const loadedChallenges = await fetchChallenges();
        if (loadedChallenges.length > 0) {
          setChallenges(loadedChallenges);
        }
      } catch {
        // preserve sample challenge fallback
      }

      try {
        const loadedProgress = await fetchProgress();
        setProgressData(loadedProgress);
        if (loadedProgress.candidateProfile) {
          setCandidateProfile({
            id: loadedProgress.candidateProfile.id,
            fullName: loadedProgress.candidateProfile.fullName,
            handle: loadedProgress.candidateProfile.handle,
            email: loadedProgress.candidateProfile.email,
            role: loadedProgress.candidateProfile.role,
            affiliation: loadedProgress.candidateProfile.affiliation,
            targetRole: loadedProgress.candidateProfile.targetRole,
            totalAssessments: loadedProgress.startedChallengeIds.length,
            completedAssessments: loadedProgress.completedChallengeIds.length,
          });
        }
        if (loadedProgress.privacySettings) {
          setPrivacySettings({
            showFullCodeDiff: loadedProgress.privacySettings.showFullCodeDiff,
            showCandidateNotes: loadedProgress.privacySettings.showCandidateNotes,
            anonymizedCandidate: loadedProgress.privacySettings.anonymizedCandidate,
          });
        }
      } catch {
        // fallback
      }
    }
    loadData();
  }, []);

  // Synchronize HTML root .dark class, data-theme attribute, and colorScheme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [theme]);

  // Listen for OS theme preference changes ONLY when user hasn't explicitly set one
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleOSChange = (e: MediaQueryListEvent) => {
      try {
        const stored = localStorage.getItem('pos_theme');
        if (!stored) {
          setThemeState(e.matches ? 'dark' : 'light');
        }
      } catch {
        // fallback
      }
    };
    mediaQuery.addEventListener('change', handleOSChange);
    return () => mediaQuery.removeEventListener('change', handleOSChange);
  }, []);

  const setScreen = (newScreen: AppScreen) => {
    setScreenState(newScreen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const copyToClipboard = async (text: string, successMessage: string = 'Copied to clipboard') => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        addToast(successMessage, 'success');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        addToast(successMessage, 'success');
      }
    } catch {
      addToast('Could not copy link automatically.', 'warning');
    }
  };

  const refreshProgress = async () => {
    try {
      const p = await fetchProgress();
      setProgressData(p);
    } catch {
      // ignore
    }
  };

  const selectChallenge = (challengeId: string) => {
    const found = challenges.find((c) => c.id === challengeId || c.code === challengeId);
    if (!found) return;

    setChallenge(found);
    const draft = progressData?.drafts?.[found.id];
    if (draft && draft.code) {
      setCandidateCode(draft.code);
      setRegressionTestCode(draft.regressionTest || found.starterRegressionTest);
      addToast(`Resumed draft for ${found.title}`, 'info');
    } else {
      setCandidateCode(found.starterCode);
      setRegressionTestCode(found.starterRegressionTest);
    }

    setRootCauseDiagnosis('');
    setFixRationale('');
    setComplexityTradeoffs('');
    setTestExecutionState('idle');
    setTestResults(null);
    setExecutionError(null);
    setScreen('workspace');
  };

  const resumeAssessmentSession = (restored: RestoreSessionResponse) => {
    if (!restored.session) return;
    const sess = restored.session;
    setActiveSession(sess);

    if (restored.challenge) {
      setChallenge(restored.challenge);
    } else {
      const matching = challenges.find((c) => c.id === sess.challengeId);
      if (matching) setChallenge(matching);
    }

    // Restore saved candidate code
    if (sess.lastSavedCode) {
      setCandidateCode(sess.lastSavedCode);
    }

    // Restore saved regression test
    if (sess.lastSavedRegressionTest) {
      setRegressionTestCode(sess.lastSavedRegressionTest);
    }

    // Restore diagnosis notes
    if (sess.diagnosisNotes) {
      setRootCauseDiagnosis(sess.diagnosisNotes.rootCause || '');
      setFixRationale(sess.diagnosisNotes.fixRationale || '');
      setComplexityTradeoffs(sess.diagnosisNotes.complexityTradeoffs || '');
    }

    // Restore timer from server authoritative remaining time
    const timeRemaining = restored.timeRemainingSeconds ?? 0;
    setSessionTimeRemaining(timeRemaining);
    setSessionExpiryStatus(restored.status === 'restored' ? 'active' : (restored.status as any));

    setTestExecutionState('idle');
    setTestResults(null);
    setExecutionError(null);
    setScreen('workspace');
    addToast(restored.message || `Resumed assessment for ${sess.challengeTitle}`, 'success');
  };

  const recoverCurrentSession = async (): Promise<boolean> => {
    if (!activeSession) return false;
    try {
      const res = await recoverAssessmentSession({
        sessionId: activeSession.sessionId,
        candidateId: candidateProfile.id,
        extensionMinutes: 5,
      });
      if (res.status === 'restored' && res.session) {
        setActiveSession(res.session);
        setSessionTimeRemaining(res.timeRemainingSeconds ?? 300);
        setSessionExpiryStatus('active');
        addToast('Assessment recovered. 5-minute grace window granted.', 'success');
        return true;
      }
      addToast(res.message || 'Could not recover assessment.', 'error');
      return false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Recovery failed.';
      addToast(msg, 'error');
      return false;
    }
  };

  const resetAssessmentSession = () => {
    setActiveSession(null);
    setSessionTimeRemaining(null);
    setSessionExpiryStatus(null);
  };

  const saveCurrentDraft = async () => {
    setIsSavingDraft(true);
    try {
      await saveDraftCode({
        challengeId: challenge.id,
        code: candidateCode,
        regressionTest: regressionTestCode,
      });

      // Synchronize session progress if active session exists
      if (activeSession) {
        syncSessionProgress({
          sessionId: activeSession.sessionId,
          candidateId: candidateProfile.id,
          code: candidateCode,
          regressionTest: regressionTestCode,
          diagnosisNotes: {
            rootCause: rootCauseDiagnosis,
            fixRationale,
            complexityTradeoffs,
          },
        }).catch(() => {});
      }

      addToast('Code draft saved to persistent storage', 'success');
      await refreshProgress();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save code draft.';
      addToast(msg, 'error');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const updateProfileInfo = async (profile: Partial<ProgressResponse['candidateProfile']>) => {
    try {
      await updateCandidateProfile(profile);
      await refreshProgress();
      setCandidateProfile((prev) => ({ ...prev, ...profile }));
      addToast('Profile updated successfully', 'success');
    } catch {
      addToast('Failed to update candidate profile', 'error');
    }
  };

  const updatePrivacySettings = (
    settings: Partial<{
      showFullCodeDiff: boolean;
      showCandidateNotes: boolean;
      anonymizedCandidate: boolean;
    }>
  ) => {
    const updated = { ...privacySettings, ...settings };
    setPrivacySettings(updated);
    updateCandidatePrivacy(updated).catch(() => {});
    addToast('Privacy preferences updated for shared report', 'info');
  };

  const resetToStarterCode = () => {
    setCandidateCode(challenge.starterCode);
    setRegressionTestCode(challenge.starterRegressionTest);
    setRootCauseDiagnosis('');
    setFixRationale('');
    setComplexityTradeoffs('');
    setTestExecutionState('idle');
    setTestResults(null);
    setExecutionError(null);
    addToast(`Reset code to unpatched starter for ${challenge.title}`, 'info');
  };

  const loadSampleSolution = () => {
    setCandidateCode(challenge.referenceSolutionCode);
    setRegressionTestCode(challenge.referenceRegressionTest);
    setRootCauseDiagnosis(sampleCandidateSubmission.rootCauseDiagnosis);
    setFixRationale(sampleCandidateSubmission.fixRationale);
    setComplexityTradeoffs(sampleCandidateSubmission.complexityTradeoffs);
    setExecutionError(null);
    addToast('Loaded reference patch, regression test & diagnosis notes', 'success');
  };

  const runTests = async (simulateFailure: boolean = false) => {
    setExecutionError(null);
    setTestExecutionState('running');

    if (executionMode === 'server') {
      addToast(`Dispatching ${challenge.title} to Server API (/api/execute)...`, 'info');
      try {
        const response = await executeCodeViaApi({
          challengeId: challenge.id,
          candidateCode,
          regressionTestCode,
        });

        const adapted = adaptExecuteResponse(response);
        setTestResults(adapted);

        const sourceLabel = 'Server Verified';

        if (adapted.passedCount === adapted.totalCount && response.status === 'passed') {
          setTestExecutionState('completed');
          addToast(`${sourceLabel}: All test cases passed with valid Ed25519 signature!`, 'success');

          // Record completion in backend persistent store
          try {
            const compRes = await recordChallengeCompletion({
              challengeId: challenge.id,
              challengeTitle: challenge.title,
              executionId: response.executionId,
              signature: response.signature || '',
              keyId: response.keyId || 'pos_server_ed25519_v1',
              score: 100,
              testsPassed: adapted.visiblePassed,
              testsTotal: adapted.visibleTotal,
              durationMinutes: Math.max(1, Math.round((adapted.durationMs ?? 0) / 60000) || 5),
              skills: challenge.skills || ['Python', 'Debugging'],
            });

            if (compRes?.record) {
              const rec = compRes.record;
              // Update verifiable proof card with real cryptographic record
              setProofCardData((prev) => ({
                ...prev,
                credentialId: rec.credentialId,
                challengeTitle: challenge.title,
                challengeId: challenge.code || challenge.id,
                cryptographicSignature: {
                  ...prev.cryptographicSignature,
                  signatureHex: rec.signature,
                  keyFingerprint: rec.keyId,
                },
                shareableUrl: `${window.location.origin}/?credentialId=${rec.credentialId}`,
              }));

              // Update assessment result screen state
              setAssessmentResult((prev) => ({
                ...prev,
                challengeId: challenge.id,
                challengeTitle: challenge.title,
                completedAt: rec.completedAt,
                overallStatus: 'Demonstrated',
                testExecutionSummary: {
                  exitCode: 0,
                  durationMs: adapted.durationMs ?? 0,
                  testsPassed: adapted.visiblePassed,
                  testsTotal: adapted.visibleTotal,
                },
              }));

              await refreshProgress();
            }
          } catch {
            // completion recording error
          }
        } else {
          setTestExecutionState('error');
          addToast(`${sourceLabel}: Test failures detected on submitted code.`, 'warning');
        }
      } catch (err: unknown) {
        setTestExecutionState('error');
        setTestResults(null);
        const errorMessage = err instanceof Error ? err.message : 'Execution API request failed.';
        setExecutionError(errorMessage);
        addToast(errorMessage, 'error');
      }
      return;
    }

    // Client Mock Mode fallback
    addToast('Running Python test runner: Mock (Simulated)...', 'info');
    await new Promise((res) => setTimeout(res, 800));

    if (simulateFailure) {
      setTestExecutionState('error');
      setTestResults({
        passedCount: 1,
        totalCount: 3,
        visiblePassed: 1,
        visibleTotal: 3,
        hiddenPassed: 0,
        hiddenTotal: 0,
        regressionTestPassed: false,
        executionSource: 'mock',
        logs: [
          `pytest session started for ${challenge.id}`,
          'collected 3 visible items',
          'test_case_1 PASSED',
          'test_case_2 FAILED',
        ],
        errorTrace: 'AssertionError: Diagnostic test failed.',
      });
      addToast('Mock execution completed: test failures detected.', 'warning');
      return;
    }

    setTestExecutionState('completed');
    setTestResults({
      passedCount: 3,
      totalCount: 3,
      visiblePassed: 3,
      visibleTotal: 3,
      hiddenPassed: 0,
      hiddenTotal: 0,
      regressionTestPassed: true,
      executionSource: 'mock',
      logs: [
        `pytest session started for ${challenge.id}`,
        'collected 3 visible items',
        'test_case_1 PASSED',
        'test_case_2 PASSED',
        'test_case_3 PASSED',
      ],
    });
    addToast('All visible tests passed in Mock runner.', 'success');
  };

  const submitChallenge = () => {
    if (!rootCauseDiagnosis.trim()) {
      setRootCauseDiagnosis(sampleCandidateSubmission.rootCauseDiagnosis);
    }
    if (!fixRationale.trim()) {
      setFixRationale(sampleCandidateSubmission.fixRationale);
    }
    if (!complexityTradeoffs.trim()) {
      setComplexityTradeoffs(sampleCandidateSubmission.complexityTradeoffs);
    }
    addToast('Assessment submitted. Generating structured evidence and rubric evaluation...', 'success');
    setTimeout(() => {
      setScreen('results');
    }, 500);
  };

  return (
    <AppContext.Provider
      value={{
        screen,
        setScreen,
        theme,
        setTheme,
        toggleTheme,
        candidate: candidateProfile,
        isFirstTimeUser,
        setIsFirstTimeUser,
        challenges,
        challenge,
        selectChallenge,
        candidateCode,
        setCandidateCode,
        regressionTestCode,
        setRegressionTestCode,
        rootCauseDiagnosis,
        setRootCauseDiagnosis,
        fixRationale,
        setFixRationale,
        complexityTradeoffs,
        setComplexityTradeoffs,
        executionMode,
        setExecutionMode,
        executionError,
        clearExecutionError,
        testExecutionState,
        testResults,
        runTests,
        resetToStarterCode,
        loadSampleSolution,
        saveCurrentDraft,
        isSavingDraft,
        submitChallenge,
        assessmentResult,
        proofCardData: {
          ...proofCardData,
          privacySettings,
        },
        verificationState,
        setVerificationState,
        privacySettings,
        updatePrivacySettings,
        progressData,
        refreshProgress,
        updateProfileInfo,
        isProfileModalOpen,
        setIsProfileModalOpen,
        toasts,
        addToast,
        removeToast,
        copyToClipboard,
        activeSession,
        sessionTimeRemaining,
        sessionExpiryStatus,
        resumeAssessmentSession,
        recoverCurrentSession,
        resetAssessmentSession,
        setSessionExpiryStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
