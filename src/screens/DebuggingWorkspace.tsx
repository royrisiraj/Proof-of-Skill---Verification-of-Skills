import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CodeEditor } from '../components/CodeEditor';
import {
  Clock,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Terminal,
  ArrowRight,
  Info,
  Bug,
  Sparkles,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Save,
  HelpCircle,
  ChevronDown,
  Layers,
} from 'lucide-react';

export const DebuggingWorkspace: React.FC = () => {
  const {
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
    activeSession,
    sessionTimeRemaining,
    sessionExpiryStatus,
    recoverCurrentSession,
  } = useApp();

  const [activeEditorTab, setActiveEditorTab] = useState<'source' | 'tests'>('source');
  const [activeInstructionTab, setActiveInstructionTab] = useState<'overview' | 'sampleIO' | 'diagnosis'>('overview');
  const [challengeMenuOpen, setChallengeMenuOpen] = useState(false);

  const sourceFileName = `${challenge.code.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20)}.py`;
  const testFileName = `test_${sourceFileName}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Workspace Bar: Developer Tool Header & Challenge Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#CBD9EB] dark:border-[#34465F]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#4D607B] dark:text-[#B1C2D8] font-mono flex-wrap">
            {/* Quick Challenge Switcher Dropdown */}
            <div className="relative inline-block">
              <button
                onClick={() => setChallengeMenuOpen(!challengeMenuOpen)}
                className="px-2.5 py-1 rounded bg-[#D7E5F7] dark:bg-[#233D5C] text-[#3569A8] dark:text-[#80B9F5] font-semibold border border-[#3569A8]/30 dark:border-[#80B9F5]/30 flex items-center gap-1.5 cursor-pointer hover:bg-[#CBD9EB] dark:hover:bg-[#28496D] transition-colors"
                title="Switch active challenge"
              >
                <span>{challenge.code}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {challengeMenuOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-72 rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-xl z-30 p-1.5 max-h-80 overflow-y-auto divide-y divide-[#CBD9EB]/40 dark:divide-[#34465F]/40">
                  <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#64748B] dark:text-[#9AACC3]">
                    Select Active Challenge
                  </div>
                  {challenges.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        selectChallenge(c.id);
                        setChallengeMenuOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-colors cursor-pointer flex flex-col gap-0.5 ${
                        c.id === challenge.id
                          ? 'bg-[#D7E5F7] dark:bg-[#233D5C] text-[#3569A8] dark:text-[#80B9F5] font-semibold'
                          : 'hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] text-[#172B4D] dark:text-[#F0F5FC]'
                      }`}
                    >
                      <span className="font-bold truncate">{c.title}</span>
                      <span className="text-[10px] text-[#4D607B] dark:text-[#B1C2D8] font-mono">
                        {c.code} · {c.difficulty}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span aria-hidden="true">·</span>
            <span>{challenge.language}</span>
            <span aria-hidden="true">·</span>
            <span>{challenge.difficulty} Difficulty</span>
            <span aria-hidden="true">·</span>
            {sessionTimeRemaining !== null ? (
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono font-semibold ${
                  sessionTimeRemaining > 300
                    ? 'bg-[#D7E5F7] dark:bg-[#233D5C] text-[#3569A8] dark:text-[#80B9F5]'
                    : sessionTimeRemaining > 0
                    ? 'bg-[#FEF3D6] dark:bg-[#3E2D11] text-[#94621B] dark:text-[#F0C477]'
                    : 'bg-[#FBE8E8] dark:bg-[#381E1E] text-[#C23934] dark:text-[#F29A9A]'
                }`}
                title="Server-Authoritative Session Timer"
              >
                <Clock className="w-3.5 h-3.5" />
                {sessionTimeRemaining > 0
                  ? `Remaining: ${Math.floor(sessionTimeRemaining / 60)}:${(sessionTimeRemaining % 60).toString().padStart(2, '0')}`
                  : sessionExpiryStatus === 'expired_recoverable'
                  ? 'Expired (Grace Active)'
                  : 'Session Expired'}
              </span>
            ) : (
              <span>~{challenge.recommendedMinutes} min</span>
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#172B4D] dark:text-[#F0F5FC]">
            {challenge.title}
          </h1>
        </div>

        {/* Action Controls: Save Draft, Reset, Load Sample */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          <button
            onClick={saveCurrentDraft}
            disabled={isSavingDraft}
            className="px-3.5 py-2 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            title="Save draft code to persistent storage"
          >
            {isSavingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-[#3569A8] dark:text-[#80B9F5]" />}
            <span>{isSavingDraft ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            onClick={loadSampleSolution}
            className="px-3.5 py-2 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="Load reference patch, regression test, and candidate defense notes"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#3569A8] dark:text-[#80B9F5]" />
            <span>Reference Solution</span>
          </button>

          <button
            onClick={resetToStarterCode}
            className="px-3.5 py-2 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] text-xs font-medium text-[#172B4D] dark:text-[#F0F5FC] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="Reset code back to the original unpatched state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#4D607B] dark:text-[#B1C2D8]" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Grace period warning banner if session is expired_recoverable */}
      {sessionExpiryStatus === 'expired_recoverable' && (
        <div className="rounded-xl bg-[#FEF3D6] dark:bg-[#3E2D11] border border-[#F0C477] dark:border-[#7A551A] p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#94621B] dark:text-[#F0C477]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#94621B] dark:text-[#F0C477]" />
            <div>
              <strong className="font-semibold block sm:inline mr-1">Assessment Session Expired (Grace Period Active):</strong>
              <span>Your drafts are preserved. You have a 5-minute recovery grace period to recover your session.</span>
            </div>
          </div>
          <button
            onClick={() => recoverCurrentSession()}
            className="px-3.5 py-1.5 rounded-lg bg-[#94621B] hover:bg-[#784E13] text-white font-semibold text-xs transition-colors shrink-0 self-start sm:self-auto cursor-pointer shadow-xs"
          >
            Recover (+5 min grace)
          </button>
        </div>
      )}

      {/* Main Focused Environment Layout: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 Cols): Instructions, Sample IO, & Candidate Defense Form */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-xs overflow-hidden">
            {/* Segmented Tab Header */}
            <div className="flex border-b border-[#CBD9EB] dark:border-[#34465F] bg-[#DCE7F5] dark:bg-[#111B2B] p-1 gap-1">
              <button
                onClick={() => setActiveInstructionTab('overview')}
                className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeInstructionTab === 'overview'
                    ? 'bg-[#FFFFFF] dark:bg-[#263952] text-[#172B4D] dark:text-[#F0F5FC] shadow-xs font-semibold'
                    : 'text-[#4D607B] hover:text-[#172B4D] dark:text-[#B1C2D8] dark:hover:text-[#F0F5FC]'
                }`}
              >
                1. Incident Brief
              </button>
              <button
                onClick={() => setActiveInstructionTab('sampleIO')}
                className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeInstructionTab === 'sampleIO'
                    ? 'bg-[#FFFFFF] dark:bg-[#263952] text-[#172B4D] dark:text-[#F0F5FC] shadow-xs font-semibold'
                    : 'text-[#4D607B] hover:text-[#172B4D] dark:text-[#B1C2D8] dark:hover:text-[#F0F5FC]'
                }`}
              >
                2. Sample I/O
              </button>
              <button
                onClick={() => setActiveInstructionTab('diagnosis')}
                className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeInstructionTab === 'diagnosis'
                    ? 'bg-[#FFFFFF] dark:bg-[#263952] text-[#172B4D] dark:text-[#F0F5FC] shadow-xs font-semibold'
                    : 'text-[#4D607B] hover:text-[#172B4D] dark:text-[#B1C2D8] dark:hover:text-[#F0F5FC]'
                }`}
              >
                3. Defense Form
              </button>
            </div>

            {/* Tab 1: Problem Description & Bug Report */}
            {activeInstructionTab === 'overview' && (
              <div className="p-5 text-xs space-y-4 max-h-[580px] overflow-y-auto leading-relaxed">
                <div>
                  <h3 className="font-bold text-[#172B4D] dark:text-[#F0F5FC] text-sm mb-1">
                    Expected Behavior & Invariants
                  </h3>
                  <p className="text-[#4D607B] dark:text-[#B1C2D8]">
                    {challenge.expectedBehavior}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#FFFFFF] dark:bg-[#22334A]/50 border border-[#CBD9EB] dark:border-[#34465F] space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-[#172B4D] dark:text-[#F0F5FC]">
                    <Bug className="w-4 h-4 text-[#B93838] dark:text-[#F29A9A] shrink-0" />
                    <span>{challenge.bugReport.reportedBy}</span>
                  </div>
                  <p className="text-[#4D607B] dark:text-[#B1C2D8]">
                    <strong className="text-[#172B4D] dark:text-[#F0F5FC] font-semibold">Symptom:</strong> {challenge.bugReport.symptom}
                  </p>
                  <p className="text-[#4D607B] dark:text-[#B1C2D8]">
                    <strong className="text-[#172B4D] dark:text-[#F0F5FC] font-semibold">Impact:</strong> {challenge.bugReport.impact}
                  </p>
                </div>

                {challenge.bugReport.reproductionSteps && (
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-[#172B4D] dark:text-[#F0F5FC]">
                      Reproduction Steps
                    </h4>
                    <ol className="space-y-1 text-[#4D607B] dark:text-[#B1C2D8] list-decimal list-inside">
                      {challenge.bugReport.reproductionSteps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="pt-2 border-t border-[#CBD9EB] dark:border-[#34465F] space-y-1">
                  <span className="font-semibold text-[#172B4D] dark:text-[#F0F5FC] block">
                    Diagnostic Hints
                  </span>
                  {challenge.diagnosticHints.map((hint, i) => (
                    <p key={i} className="text-[#4D607B] dark:text-[#B1C2D8]">
                      • {hint}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Sample Input / Output */}
            {activeInstructionTab === 'sampleIO' && (
              <div className="p-5 text-xs space-y-4 max-h-[580px] overflow-y-auto leading-relaxed">
                <div className="space-y-2">
                  <h3 className="font-bold text-[#172B4D] dark:text-[#F0F5FC] text-sm">
                    Canonical Input / Output Example
                  </h3>
                  <p className="text-[#4D607B] dark:text-[#B1C2D8]">
                    Compare how the buggy implementation handles edge cases versus expected specifications.
                  </p>
                </div>

                {challenge.sampleIO ? (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-lg bg-[#0D1520] text-[#E6EFFD] font-mono text-xs space-y-1.5 border border-[#203046]">
                      <span className="text-[#9AACC3] text-[10px] uppercase font-bold block">Sample Input:</span>
                      <pre className="text-[11px] whitespace-pre-wrap">{challenge.sampleIO.input}</pre>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#0D1520] text-[#78C9A4] font-mono text-xs space-y-1.5 border border-[#203046]">
                      <span className="text-[#9AACC3] text-[10px] uppercase font-bold block">Expected Output:</span>
                      <pre className="text-[11px] whitespace-pre-wrap">{challenge.sampleIO.output}</pre>
                    </div>

                    <div className="p-3 rounded-lg bg-[#FFFFFF] dark:bg-[#22334A]/50 border border-[#CBD9EB] dark:border-[#34465F]">
                      <span className="font-semibold text-[#172B4D] dark:text-[#F0F5FC] block mb-1">
                        Technical Explanation:
                      </span>
                      <p className="text-[#4D607B] dark:text-[#B1C2D8]">
                        {challenge.sampleIO.explanation}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-[#D7E5F7]/30 text-center text-[#4D607B] dark:text-[#B1C2D8]">
                    No custom sample I/O for this challenge. Refer to test cases in the right editor.
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Candidate Diagnosis & Defense Form */}
            {activeInstructionTab === 'diagnosis' && (
              <div className="p-5 text-xs space-y-4 max-h-[580px] overflow-y-auto">
                <div className="space-y-1">
                  <h3 className="font-bold text-[#172B4D] dark:text-[#F0F5FC] text-sm">
                    Candidate Diagnostic Defense
                  </h3>
                  <p className="text-[#4D607B] dark:text-[#B1C2D8]">
                    Rubric evaluators score your engineering reasoning in addition to test passes.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-[#172B4D] dark:text-[#F0F5FC] mb-1">
                      1. Root Cause Analysis
                    </label>
                    <textarea
                      rows={3}
                      value={rootCauseDiagnosis}
                      onChange={(e) => setRootCauseDiagnosis(e.target.value)}
                      placeholder="Identify the exact invariant or boundary condition failure..."
                      className="w-full p-2.5 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] text-[#172B4D] dark:text-[#F0F5FC] text-xs focus:ring-2 focus:ring-[#3569A8] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#172B4D] dark:text-[#F0F5FC] mb-1">
                      2. Fix Justification & Safety
                    </label>
                    <textarea
                      rows={3}
                      value={fixRationale}
                      onChange={(e) => setFixRationale(e.target.value)}
                      placeholder="Why is your approach sound? How does it avoid regressions?"
                      className="w-full p-2.5 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] text-[#172B4D] dark:text-[#F0F5FC] text-xs focus:ring-2 focus:ring-[#3569A8] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#172B4D] dark:text-[#F0F5FC] mb-1">
                      3. Complexity & Algorithmic Trade-offs
                    </label>
                    <textarea
                      rows={2}
                      value={complexityTradeoffs}
                      onChange={(e) => setComplexityTradeoffs(e.target.value)}
                      placeholder="Time complexity O(N), Space complexity O(K)..."
                      className="w-full p-2.5 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] text-[#172B4D] dark:text-[#F0F5FC] text-xs focus:ring-2 focus:ring-[#3569A8] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 Cols): Code Editor & Execution Results */}
        <div className="lg:col-span-7 space-y-4">
          {/* Editor Header Navigation */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#DCE7F5] dark:bg-[#111B2B] border border-[#CBD9EB] dark:border-[#34465F]">
              <button
                onClick={() => setActiveEditorTab('source')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                  activeEditorTab === 'source'
                    ? 'bg-[#FFFFFF] dark:bg-[#263952] text-[#172B4D] dark:text-[#F0F5FC] shadow-xs font-semibold'
                    : 'text-[#4D607B] dark:text-[#B1C2D8] hover:text-[#172B4D]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-[#3569A8] dark:text-[#80B9F5]" />
                <span>{sourceFileName} (Source)</span>
              </button>
              <button
                onClick={() => setActiveEditorTab('tests')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                  activeEditorTab === 'tests'
                    ? 'bg-[#FFFFFF] dark:bg-[#263952] text-[#172B4D] dark:text-[#F0F5FC] shadow-xs font-semibold'
                    : 'text-[#4D607B] dark:text-[#B1C2D8] hover:text-[#172B4D]'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-[#3569A8] dark:text-[#80B9F5]" />
                <span>{testFileName} (Regression)</span>
              </button>
            </div>

            <span className="text-[11px] text-[#4D607B] dark:text-[#B1C2D8] font-mono hidden sm:inline">
              Python 3.12 Sandboxed
            </span>
          </div>

          {/* Active Code Editor */}
          {activeEditorTab === 'source' ? (
            <CodeEditor
              filename={sourceFileName}
              value={candidateCode}
              onChange={setCandidateCode}
              minHeight="380px"
              badgeText="Python 3.12 · Editable Source"
            />
          ) : (
            <CodeEditor
              filename={testFileName}
              value={regressionTestCode}
              onChange={setRegressionTestCode}
              minHeight="380px"
              badgeText="Pytest · Candidate Regression Suite"
            />
          )}

          {/* Controls & Animated Execution Output Panel */}
          <div className="rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] p-5 space-y-4 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => runTests(false)}
                  disabled={testExecutionState === 'running'}
                  className="px-5 py-2.5 rounded-lg bg-[#3569A8] hover:bg-[#28558D] disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  {testExecutionState === 'running' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{executionMode === 'server' ? 'Executing via API...' : 'Executing Pytest Sandbox...'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run Test Suite</span>
                    </>
                  )}
                </button>

                {/* Execution Mode Controller */}
                <div className="flex items-center p-0.5 rounded-lg bg-[#DCE7F5] dark:bg-[#111B2B] border border-[#CBD9EB] dark:border-[#34465F] shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setExecutionMode('server')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      executionMode === 'server'
                        ? 'bg-white dark:bg-[#263952] text-[#3569A8] dark:text-[#80B9F5] shadow-xs font-semibold'
                        : 'text-[#4D607B] dark:text-[#B1C2D8] hover:text-[#172B4D] dark:hover:text-[#F0F5FC]'
                    }`}
                    title="Dispatch execution to isolated server execution sandbox (/api/execute)"
                  >
                    Server Verified
                  </button>
                  <button
                    type="button"
                    onClick={() => setExecutionMode('mock')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      executionMode === 'mock'
                        ? 'bg-white dark:bg-[#263952] text-[#172B4D] dark:text-[#F0F5FC] shadow-xs font-semibold'
                        : 'text-[#4D607B] dark:text-[#B1C2D8] hover:text-[#172B4D] dark:hover:text-[#F0F5FC]'
                    }`}
                    title="Run locally in simulated browser environment"
                  >
                    Mock (Simulated)
                  </button>
                </div>

                <button
                  onClick={() => runTests(true)}
                  disabled={testExecutionState === 'running'}
                  className="px-3.5 py-2 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] disabled:opacity-60 text-[#172B4D] dark:text-[#F0F5FC] text-xs font-medium transition-colors cursor-pointer"
                  title="Simulate catching the defect on unpatched code"
                >
                  <span>Test Failure State</span>
                </button>
              </div>

              {/* Submit Action */}
              <button
                onClick={submitChallenge}
                className="px-5 py-2.5 rounded-lg bg-[#172B4D] hover:bg-[#0D1520] dark:bg-[#80B9F5] dark:hover:bg-[#A1CEFA] text-white dark:text-[#111B2B] text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <span>Submit Solution</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Test Execution Output Box - Dark navy canvas */}
            {executionError ? (
              <div className="rounded-lg bg-[#0D1520] p-4 font-mono text-xs text-[#E6EFFD] space-y-3 border border-[#6B2E2E]">
                <div className="flex items-center justify-between border-b border-[#203046] pb-2.5">
                  <div className="flex items-center gap-2 text-[#F29A9A] font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>EXECUTION ERROR / TIMEOUT</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#B93838]/20 text-[#F29A9A] border border-[#B93838]/40">
                    Source: Server API
                  </span>
                </div>

                <div className="p-3 rounded-md bg-[#381E1E]/60 border border-[#6B2E2E] text-[#F29A9A] text-[11px] leading-relaxed whitespace-pre-wrap">
                  {executionError}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => runTests(false)}
                    className="px-3.5 py-1.5 rounded-md bg-[#3569A8] hover:bg-[#28558D] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Request</span>
                  </button>
                  <button
                    onClick={() => {
                      setExecutionMode('mock');
                      clearExecutionError();
                    }}
                    className="px-3.5 py-1.5 rounded-md border border-[#CBD9EB] dark:border-[#34465F] hover:bg-[#203046] text-[#B1C2D8] text-xs font-medium transition-colors cursor-pointer"
                  >
                    <span>Switch to Mock Mode</span>
                  </button>
                </div>
              </div>
            ) : testResults ? (
              <div className="rounded-lg bg-[#0D1520] p-4 font-mono text-xs text-[#E6EFFD] space-y-3 border border-[#203046]">
                <div className="flex items-center justify-between border-b border-[#203046] pb-2.5">
                  <div className="flex items-center gap-2">
                    {testResults.passedCount === testResults.totalCount ? (
                      <span className="flex items-center gap-1.5 text-[#78C9A4] font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ALL TESTS PASSED</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[#F29A9A] font-bold text-xs">
                        <AlertCircle className="w-4 h-4" />
                        <span>ASSERTION FAILURES DETECTED</span>
                      </span>
                    )}

                    {testResults.executionSource === 'server_verified' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#224A7A]/30 text-[#80B9F5] border border-[#3569A8]/50 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#78C9A4]" />
                        <span>Server Verified (Ed25519)</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-[#9AACC3] border border-slate-700">
                        Source: Mock (Simulated)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#9AACC3]">
                    {testResults.durationMs !== undefined && (
                      <span className="font-mono tabular-nums">{testResults.durationMs}ms</span>
                    )}
                    <span>
                      Passed: {testResults.passedCount}/{testResults.totalCount}
                    </span>
                  </div>
                </div>

                {/* Error Traceback if any */}
                {testResults.errorTrace && (
                  <div className="p-3 rounded-md bg-[#381E1E]/60 border border-[#6B2E2E] text-[#F29A9A] text-[11px] leading-relaxed whitespace-pre-wrap">
                    {testResults.errorTrace}
                  </div>
                )}

                {/* Clean log stream */}
                <div className="space-y-1 text-[11px] max-h-48 overflow-y-auto leading-relaxed">
                  {testResults.logs.map((log, idx) => (
                    <div
                      key={idx}
                      className={
                        log.includes('PASSED')
                          ? 'text-[#78C9A4]'
                          : log.includes('FAILED')
                          ? 'text-[#F29A9A]'
                          : 'text-[#9AACC3]'
                      }
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Idle Prompt */
              <div className="rounded-lg bg-[#0D1520] p-4 font-mono text-xs text-[#9AACC3] flex items-center justify-between border border-[#203046]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#80B9F5]" />
                  <span>Interactive Pytest Runtime Ready. Click &ldquo;Run Test Suite&rdquo; to execute code.</span>
                </div>
                <span className="text-[11px] text-[#64748B]">Limit: 4.0s</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
