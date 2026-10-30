import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  AppScreen,
  VerificationState,
  CandidateProfile,
  Challenge,
  AssessmentResult,
  ProofCardData,
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
  challenge: Challenge;
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
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  copyToClipboard: (text: string, successMessage?: string) => Promise<void>;
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

  // Explicit user theme selection: records user choice in localStorage
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
  const [executionMode, setExecutionModeState] = useState<ExecutionMode>('mock');
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [testExecutionState, setTestExecutionState] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [testResults, setTestResults] = useState<AppContextType['testResults']>(null);

  const setExecutionMode = (mode: ExecutionMode) => {
    setExecutionModeState(mode);
    setExecutionError(null);
  };

  const clearExecutionError = () => {
    setExecutionError(null);
  };

  // Verification state selector (simulated states for reviewer page)
  const [verificationState, setVerificationState] = useState<VerificationState>('valid');

  // Privacy toggles for shared proof card
  const [privacySettings, setPrivacySettings] = useState({
    showFullCodeDiff: true,
    showCandidateNotes: true,
    anonymizedCandidate: false,
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Synchronize HTML root .dark class, data-theme attribute, and colorScheme with theme state
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

  // Listen for operating-system theme preference changes ONLY when the user has not explicitly chosen a theme
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
        // Fallback for restricted clipboard contexts
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

  const updatePrivacySettings = (
    settings: Partial<{
      showFullCodeDiff: boolean;
      showCandidateNotes: boolean;
      anonymizedCandidate: boolean;
    }>
  ) => {
    setPrivacySettings((prev) => ({ ...prev, ...settings }));
    addToast('Privacy preferences updated for shared report', 'info');
  };

  const resetToStarterCode = () => {
    setCandidateCode(sampleChallenge.starterCode);
    setRegressionTestCode(sampleChallenge.starterRegressionTest);
    setRootCauseDiagnosis('');
    setFixRationale('');
    setComplexityTradeoffs('');
    setTestExecutionState('idle');
    setTestResults(null);
    setExecutionError(null);
    addToast('Workspace reset to unpatched starter code', 'info');
  };

  const loadSampleSolution = () => {
    setCandidateCode(sampleChallenge.referenceSolutionCode);
    setRegressionTestCode(sampleChallenge.referenceRegressionTest);
    setRootCauseDiagnosis(sampleCandidateSubmission.rootCauseDiagnosis);
    setFixRationale(sampleCandidateSubmission.fixRationale);
    setComplexityTradeoffs(sampleCandidateSubmission.complexityTradeoffs);
    setExecutionError(null);
    addToast('Loaded verified solution, regression test & diagnosis notes', 'success');
  };

  const runTests = async (simulateFailure: boolean = false) => {
    setExecutionError(null);
    setTestExecutionState('running');

    if (executionMode === 'server') {
      addToast('Dispatching execution request to Server API (/api/execute)...', 'info');
      try {
        const response = await executeCodeViaApi({
          challengeId: sampleChallenge.id,
          candidateCode,
          regressionTestCode,
        });

        const adapted = adaptExecuteResponse(response);
        setTestResults(adapted);

        const sourceLabel =
          adapted.executionSource === 'server_verified'
            ? 'Server Verified'
            : adapted.executionSource === 'server_simulated'
            ? 'Server (Simulated)'
            : 'Mock (Simulated)';

        if (adapted.passedCount === adapted.totalCount) {
          setTestExecutionState('completed');
          addToast(`${sourceLabel} test suite completed: all visible tests passed.`, 'success');
        } else {
          setTestExecutionState('error');
          addToast(`${sourceLabel} test suite completed: assertion failures caught.`, 'warning');
        }
      } catch (err: unknown) {
        // Never automatically fallback to mock results when server API fails
        setTestExecutionState('error');
        setTestResults(null);
        const errorMessage = err instanceof Error ? err.message : 'Execution API request failed.';
        setExecutionError(errorMessage);
        addToast(errorMessage, 'error');
      }
      return;
    }

    // Client Mock Execution Mode
    addToast('Running Python test runner: Mock (Simulated)...', 'info');
    await new Promise((res) => setTimeout(res, 900));

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
          'pytest session started for test_session_limiter.py',
          'rootdir: /tmp/mock_eval, configfile: pytest.ini',
          'collected 3 visible items',
          'test_session_limiter.py::test_single_expired_event_purged PASSED [ 33%]',
          'test_session_limiter.py::test_consecutive_expired_events_purge FAILED [ 66%]',
          'test_session_limiter.py::test_exact_window_cutoff_boundary FAILED [100%]',
        ],
        errorTrace:
          'AssertionError: Expected active_count == 1, but got 2.\nEvent \'exp_2\' was not purged because events.pop(i) shifted the indices and skipped evaluation.',
      });
      addToast('Mock execution completed: 2 failures detected on unpatched code.', 'warning');
      return;
    }

    // Determine based on whether code looks patched
    const hasFixedMutation =
      candidateCode.includes('retained_events') ||
      candidateCode.includes('event for event in') ||
      !candidateCode.includes('events.pop(i)');

    if (hasFixedMutation) {
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
          'pytest session started for test_session_limiter.py',
          'rootdir: /tmp/mock_eval, configfile: pytest.ini',
          'collected 3 visible items',
          'test_session_limiter.py::test_single_expired_event_purged PASSED',
          'test_session_limiter.py::test_consecutive_expired_events_purge PASSED',
          'test_session_limiter.py::test_exact_window_cutoff_boundary PASSED',
          '=================== 3 passed in 0.03s ===================',
        ],
      });
      addToast('All visible tests passed in Mock (Simulated) runner.', 'success');
    } else {
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
          'pytest session started for test_session_limiter.py',
          'rootdir: /tmp/mock_eval, configfile: pytest.ini',
          'collected 3 visible items',
          'test_session_limiter.py::test_single_expired_event_purged PASSED',
          'test_session_limiter.py::test_consecutive_expired_events_purge FAILED',
          'test_session_limiter.py::test_exact_window_cutoff_boundary FAILED',
        ],
        errorTrace:
          'AssertionError: Expected active_count == 1, but got 2.\nIndex-skip detected: consecutive expired items skipped during list mutation in session_limiter.py.',
      });
      addToast('Mock execution caught unpatched index-mutation defect.', 'warning');
    }
  };

  const submitChallenge = () => {
    // If not filled, fill with reasonable values for the user journey
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
    }, 600);
  };

  return (
    <AppContext.Provider
      value={{
        screen,
        setScreen,
        theme,
        setTheme,
        toggleTheme,
        candidate: mockCandidate,
        isFirstTimeUser,
        setIsFirstTimeUser,
        challenge: sampleChallenge,
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
        submitChallenge,
        assessmentResult: sampleAssessmentResult,
        proofCardData: {
          ...sampleProofCardData,
          privacySettings,
        },
        verificationState,
        setVerificationState,
        privacySettings,
        updatePrivacySettings,
        toasts,
        addToast,
        removeToast,
        copyToClipboard,
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
