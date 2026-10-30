import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CodeEditor } from '../components/CodeEditor';
import {
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
} from 'lucide-react';

export const DebuggingWorkspace: React.FC = () => {
  const {
    challenge,
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
  } = useApp();

  const [activeEditorTab, setActiveEditorTab] = useState<'source' | 'tests'>('source');
  const [activeInstructionTab, setActiveInstructionTab] = useState<'overview' | 'diagnosis'>('overview');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Workspace Bar: Developer Tool Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#CBD9EB] dark:border-[#34465F]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#4D607B] dark:text-[#B1C2D8] font-mono">
            <span className="font-semibold text-[#3569A8] dark:text-[#80B9F5]">
              {challenge.code}
            </span>
            <span aria-hidden="true">·</span>
            <span>{challenge.language}</span>
            <span aria-hidden="true">·</span>
            <span>{challenge.difficulty} Difficulty</span>
            <span aria-hidden="true">·</span>
            <span>~{challenge.recommendedMinutes} min</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172B4D] dark:text-[#F0F5FC] mt-1">
            {challenge.title}
          </h1>
        </div>

        {/* Demo Helper Actions */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={loadSampleSolution}
            className="px-3.5 py-2 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="Load reference patch, regression test, and candidate defense notes"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#3569A8] dark:text-[#80B9F5]" />
            <span>Load Sample Solution (Demo)</span>
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

      {/* Main Focused Environment Layout: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 Cols): Instructions & Candidate Defense Form */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-xs overflow-hidden">
            {/* Segmented Tab Header */}
            <div className="flex border-b border-[#CBD9EB] dark:border-[#34465F] bg-[#DCE7F5] dark:bg-[#111B2B] p-1">
              <button
                onClick={() => setActiveInstructionTab('overview')}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeInstructionTab === 'overview'
                    ? 'bg-[#FFFFFF] dark:bg-[#263952] text-[#172B4D] dark:text-[#F0F5FC] shadow-xs font-semibold'
                    : 'text-[#4D607B] hover:text-[#172B4D] dark:text-[#B1C2D8] dark:hover:text-[#F0F5FC]'
                }`}
              >
                1. Problem & Incident Brief
              </button>
              <button
                onClick={() => setActiveInstructionTab('diagnosis')}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeInstructionTab === 'diagnosis'
                    ? 'bg-[#FFFFFF] dark:bg-[#263952] text-[#172B4D] dark:text-[#F0F5FC] shadow-xs font-semibold'
                    : 'text-[#4D607B] hover:text-[#172B4D] dark:text-[#B1C2D8] dark:hover:text-[#F0F5FC]'
                }`}
              >
                2. Candidate Defense Form
              </button>
            </div>

            {/* Tab 1: Problem Description & Bug Report */}
            {activeInstructionTab === 'overview' ? (
              <div className="p-5 text-xs space-y-4 max-h-[580px] overflow-y-auto leading-relaxed">
                <div>
                  <h3 className="font-bold text-[#172B4D] dark:text-[#F0F5FC] text-sm mb-1">
                    Expected Behavior
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

                <div className="space-y-2">
                  <h4 className="font-bold text-[#172B4D] dark:text-[#F0F5FC]">
                    Required Candidate Deliverables
                  </h4>
                  <ul className="space-y-1.5 text-[#4D607B] dark:text-[#B1C2D8] list-disc list-inside">
                    <li>
                      Correct the list-traversal mutation defect in <code className="font-mono text-[#172B4D] dark:text-[#F0F5FC] font-medium">session_limiter.py</code>.
                    </li>
                    <li>
                      Author a targeted regression test in <code className="font-mono text-[#172B4D] dark:text-[#F0F5FC] font-medium">test_session_limiter.py</code> verifying that consecutive-expired elements are not skipped.
                    </li>
                    <li>
                      Document your root cause diagnosis and fix rationale before final submission.
                    </li>
                  </ul>
                </div>

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
            ) : (
              /* Tab 2: Candidate Diagnosis & Defense Form */
              <div className="p-5 text-xs space-y-4 max-h-[580px] overflow-y-auto">
                <div className="space-y-1">
                  <h3 className="font-bold text-[#172B4D] dark:text-[#F0F5FC] text-sm">
                    Candidate Diagnostic Defense
                  </h3>
                  <p className="text-[#4D607B] dark:text-[#B1C2D8]">
                    Your written analysis is evaluated under Rubric Dimension 02 & 04.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="root-cause"
                      className="block font-semibold text-[#172B4D] dark:text-[#F0F5FC] mb-1"
                    >
                      Root Cause Diagnosis
                    </label>
                    <textarea
                      id="root-cause"
                      rows={4}
                      value={rootCauseDiagnosis}
                      onChange={(e) => setRootCauseDiagnosis(e.target.value)}
                      placeholder="Explain the specific code mechanism that caused the defect (e.g. in-place list mutation during indexed traversal)..."
                      className="w-full p-3 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] text-[#172B4D] dark:text-[#F0F5FC] focus-visible:ring-2 focus-visible:ring-[#3569A8] outline-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="fix-rationale"
                      className="block font-semibold text-[#172B4D] dark:text-[#F0F5FC] mb-1"
                    >
                      Fix Rationale & Prevention Strategy
                    </label>
                    <textarea
                      id="fix-rationale"
                      rows={3}
                      value={fixRationale}
                      onChange={(e) => setFixRationale(e.target.value)}
                      placeholder="Why does this patch resolve the issue and prevent future regressions?..."
                      className="w-full p-3 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] text-[#172B4D] dark:text-[#F0F5FC] focus-visible:ring-2 focus-visible:ring-[#3569A8] outline-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="complexity"
                      className="block font-semibold text-[#172B4D] dark:text-[#F0F5FC] mb-1"
                    >
                      Algorithmic Complexity & Trade-offs
                    </label>
                    <input
                      id="complexity"
                      type="text"
                      value={complexityTradeoffs}
                      onChange={(e) => setComplexityTradeoffs(e.target.value)}
                      placeholder="e.g. Time: O(N), Space: O(K) where K is retained events count"
                      className="w-full p-2.5 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] text-[#172B4D] dark:text-[#F0F5FC] focus-visible:ring-2 focus-visible:ring-[#3569A8] outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 Cols): Code Editor, Test Controls & Output */}
        <div className="lg:col-span-7 space-y-4">
          {/* Editor File Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-[#DCE7F5] dark:bg-[#111B2B] p-1 rounded-lg border border-[#CBD9EB] dark:border-[#34465F]">
              <button
                onClick={() => setActiveEditorTab('source')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                  activeEditorTab === 'source'
                    ? 'bg-[#FFFFFF] dark:bg-[#263952] text-[#172B4D] dark:text-[#F0F5FC] shadow-xs font-semibold'
                    : 'text-[#4D607B] dark:text-[#B1C2D8] hover:text-[#172B4D]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-[#3569A8] dark:text-[#80B9F5]" />
                <span>session_limiter.py (Source)</span>
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
                <span>test_session_limiter.py (Regression)</span>
              </button>
            </div>

            <span className="text-[11px] text-[#4D607B] dark:text-[#B1C2D8] font-mono hidden sm:inline">
              Simulated Python 3.12 Sandbox
            </span>
          </div>

          {/* Active Code Editor */}
          {activeEditorTab === 'source' ? (
            <CodeEditor
              filename="session_limiter.py"
              value={candidateCode}
              onChange={setCandidateCode}
              minHeight="380px"
              badgeText="Python 3.12 · Editable Source"
            />
          ) : (
            <CodeEditor
              filename="test_session_limiter.py"
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
                    <span>EXECUTION SERVICE ERROR</span>
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
                        <span>TEST SUITE PASSED</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[#F29A9A] font-bold text-xs">
                        <AlertCircle className="w-4 h-4" />
                        <span>ASSERTION FAILURES DETECTED</span>
                      </span>
                    )}

                    {/* Truthful execution source badge */}
                    {testResults.executionSource === 'server_verified' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#224A7A]/30 text-[#80B9F5] border border-[#3569A8]/50 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#78C9A4]" />
                        <span>Source: Server Verified</span>
                      </span>
                    ) : testResults.executionSource === 'server_simulated' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#3569A8]/20 text-[#80B9F5] border border-[#3569A8]/40">
                        Source: Server (Simulated)
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
                <div className="space-y-1 text-[11px] text-[#B1C2D8]">
                  {testResults.logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[#4D607B] select-none">&gt;</span>
                      <span className={log.includes('PASSED') ? 'text-[#78C9A4]' : log.includes('FAILED') ? 'text-[#F29A9A]' : ''}>
                        {log}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-lg border border-dashed border-[#CBD9EB] dark:border-[#34465F] text-center text-xs text-[#4D607B] dark:text-[#B1C2D8]">
                Click &ldquo;Run Test Suite&rdquo; to execute unit and regression tests against your code (Active:{' '}
                <span className="font-semibold text-[#3569A8] dark:text-[#80B9F5]">
                  {executionMode === 'server' ? 'Server API' : 'Client Mock'}
                </span>
                ).
              </div>
            )}

            <p className="text-[11px] text-[#4D607B] dark:text-[#B1C2D8] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>
                {executionMode === 'server'
                  ? 'Connected to Node.js backend API (/api/execute). Responses are structured simulated contracts.'
                  : 'Client-side simulated runner for instant local preview and testing.'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
