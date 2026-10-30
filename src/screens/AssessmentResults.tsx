import React from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Clock,
  Cpu,
  Info,
  ExternalLink,
  Layers,
  Terminal,
} from 'lucide-react';

export const AssessmentResults: React.FC = () => {
  const { assessmentResult, setScreen, challenge, proofCardData, copyToClipboard } = useApp();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between text-xs text-[#4D607B] dark:text-[#B1C2D8]">
        <button
          onClick={() => setScreen('workspace')}
          className="flex items-center gap-1.5 hover:text-[#172B4D] dark:hover:text-[#F0F5FC] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Workspace</span>
        </button>
        <span className="font-mono">{assessmentResult.rubricId} v{assessmentResult.rubricVersion}</span>
      </div>

      {/* Main Outcome Banner */}
      <div className="p-6 sm:p-8 rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CBD9EB] dark:border-[#34465F]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#3569A8] dark:text-[#80B9F5]">
              <span className="font-bold uppercase tracking-wider">Evaluation Outcome</span>
              <span>·</span>
              <span>Single Session Completed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#172B4D] dark:text-[#F0F5FC] mt-1">
              {assessmentResult.overallStatus} with Evidence
            </h1>
          </div>

          <button
            onClick={() => setScreen('proof')}
            className="px-5 py-2.5 rounded-lg bg-[#3569A8] hover:bg-[#28558D] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>View Evidence & Proof Card</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-[#4D607B] dark:text-[#B1C2D8] leading-relaxed max-w-3xl">
          {assessmentResult.summaryReasoning}
        </p>

        {/* Assessment Environment Metadata */}
        <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#4D607B] dark:text-[#B1C2D8] font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Duration: {assessmentResult.durationMinutes} min
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5" />
            {assessmentResult.environment}
          </span>
          <span>·</span>
          <span>{assessmentResult.sessionConditions.proctoring}</span>
        </div>
      </div>

      {/* 1. Machine-Observed Test Evidence Matrix */}
      <section aria-labelledby="tests-matrix-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2
              id="tests-matrix-heading"
              className="text-sm font-bold uppercase tracking-wider text-[#172B4D] dark:text-[#F0F5FC] font-mono flex items-center gap-2"
            >
              <Terminal className="w-4 h-4 text-[#3569A8] dark:text-[#80B9F5]" />
              <span>01. Machine-Observed Test Evidence</span>
            </h2>
            <p className="text-xs text-[#4D607B] dark:text-[#B1C2D8] mt-0.5">
              Empirical execution passes captured directly inside the simulated Python sandbox
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#237A57] dark:text-[#78C9A4]">
            5 / 5 Tests Passed
          </span>
        </div>

        <div className="rounded-xl border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#CBD9EB] dark:border-[#34465F] bg-[#DCE7F5] dark:bg-[#22334A] text-[#4D607B] dark:text-[#B1C2D8] font-medium font-mono text-[11px]">
                <th className="py-3 px-4">Test Identifier</th>
                <th className="py-3 px-4">Scope</th>
                <th className="py-3 px-4 hidden sm:table-cell">Target Assertion</th>
                <th className="py-3 px-4 text-right">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CBD9EB] dark:divide-[#34465F] font-mono text-[11px]">
              {challenge.testCases.map((tc) => (
                <tr key={tc.id} className="hover:bg-[#DCE7F5]/50 dark:hover:bg-[#22334A]/40 transition-colors">
                  <td className="py-3 px-4 font-sans font-semibold text-[#172B4D] dark:text-[#F0F5FC]">
                    {tc.name}
                  </td>
                  <td className="py-3 px-4 text-[#4D607B] dark:text-[#B1C2D8]">
                    {tc.isHidden ? 'Hidden Sandbox Edge' : 'Visible Unit Test'}
                  </td>
                  <td className="py-3 px-4 text-[#4D607B] dark:text-[#B1C2D8] hidden sm:table-cell">
                    {tc.description}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1.5 font-bold text-[#237A57] dark:text-[#78C9A4]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#237A57] dark:text-[#78C9A4]" />
                      Passed ({tc.executionTimeMs}ms)
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="hover:bg-[#DCE7F5]/50 dark:hover:bg-[#22334A]/40 transition-colors">
                <td className="py-3 px-4 font-sans font-semibold text-[#172B4D] dark:text-[#F0F5FC]">
                  Candidate-Authored Regression Test
                </td>
                <td className="py-3 px-4 text-[#4D607B] dark:text-[#B1C2D8]">
                  Author Regression
                </td>
                <td className="py-3 px-4 text-[#4D607B] dark:text-[#B1C2D8] hidden sm:table-cell">
                  Isolates consecutive-expired element traversal skip
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="inline-flex items-center gap-1.5 font-bold text-[#237A57] dark:text-[#78C9A4]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#237A57] dark:text-[#78C9A4]" />
                    Passed (4ms)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Structured Rubric-Based Evaluations */}
      <section aria-labelledby="rubric-eval-heading" className="space-y-4">
        <div>
          <h2
            id="rubric-eval-heading"
            className="text-sm font-bold uppercase tracking-wider text-[#172B4D] dark:text-[#F0F5FC] font-mono flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-[#3569A8] dark:text-[#80B9F5]" />
            <span>02. Rubric-Based Dimension Evaluations</span>
          </h2>
          <p className="text-xs text-[#4D607B] dark:text-[#B1C2D8] mt-0.5">
            Structured criteria evaluation against Rubric Specification {assessmentResult.rubricId} v{assessmentResult.rubricVersion}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dimension 1: Correctness */}
          <div className="p-5 rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#4D607B] dark:text-[#B1C2D8] font-bold block">
                  DIMENSION 01
                </span>
                <h3 className="font-bold text-base text-[#172B4D] dark:text-[#F0F5FC] mt-0.5">
                  Correctness
                </h3>
              </div>
              <span className="text-xs font-bold text-[#237A57] dark:text-[#78C9A4] font-mono">
                {assessmentResult.dimensions.correctness.levelLabel}
              </span>
            </div>
            <p className="text-xs text-[#4D607B] dark:text-[#B1C2D8] leading-relaxed">
              {assessmentResult.dimensions.correctness.descriptor}
            </p>
            <div className="pt-2 border-t border-[#CBD9EB] dark:border-[#34465F] space-y-1 text-xs text-[#4D607B] dark:text-[#B1C2D8]">
              {assessmentResult.dimensions.correctness.evidencePoints.map((pt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-[#237A57] dark:text-[#78C9A4] shrink-0" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dimension 2: Bug Diagnosis */}
          <div className="p-5 rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#4D607B] dark:text-[#B1C2D8] font-bold block">
                  DIMENSION 02
                </span>
                <h3 className="font-bold text-base text-[#172B4D] dark:text-[#F0F5FC] mt-0.5">
                  Bug Diagnosis
                </h3>
              </div>
              <span className="text-xs font-bold text-[#237A57] dark:text-[#78C9A4] font-mono">
                {assessmentResult.dimensions.diagnosis.levelLabel}
              </span>
            </div>
            <p className="text-xs text-[#4D607B] dark:text-[#B1C2D8] leading-relaxed">
              {assessmentResult.dimensions.diagnosis.descriptor}
            </p>
            <div className="pt-2 border-t border-[#CBD9EB] dark:border-[#34465F] space-y-1 text-xs text-[#4D607B] dark:text-[#B1C2D8]">
              {assessmentResult.dimensions.diagnosis.evidencePoints.map((pt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-[#237A57] dark:text-[#78C9A4] shrink-0" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dimension 3: Regression Testing */}
          <div className="p-5 rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#4D607B] dark:text-[#B1C2D8] font-bold block">
                  DIMENSION 03
                </span>
                <h3 className="font-bold text-base text-[#172B4D] dark:text-[#F0F5FC] mt-0.5">
                  Regression Testing
                </h3>
              </div>
              <span className="text-xs font-bold text-[#237A57] dark:text-[#78C9A4] font-mono">
                {assessmentResult.dimensions.regressionTesting.levelLabel}
              </span>
            </div>
            <p className="text-xs text-[#4D607B] dark:text-[#B1C2D8] leading-relaxed">
              {assessmentResult.dimensions.regressionTesting.descriptor}
            </p>
            <div className="pt-2 border-t border-[#CBD9EB] dark:border-[#34465F] space-y-1 text-xs text-[#4D607B] dark:text-[#B1C2D8]">
              {assessmentResult.dimensions.regressionTesting.evidencePoints.map((pt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-[#237A57] dark:text-[#78C9A4] shrink-0" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dimension 4: Explanation & Code Defense */}
          <div className="p-5 rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#4D607B] dark:text-[#B1C2D8] font-bold block">
                  DIMENSION 04
                </span>
                <h3 className="font-bold text-base text-[#172B4D] dark:text-[#F0F5FC] mt-0.5">
                  Explanation & Code Defense
                </h3>
              </div>
              <span className="text-xs font-bold text-[#237A57] dark:text-[#78C9A4] font-mono">
                {assessmentResult.dimensions.codeDefense.levelLabel}
              </span>
            </div>
            <p className="text-xs text-[#4D607B] dark:text-[#B1C2D8] leading-relaxed">
              {assessmentResult.dimensions.codeDefense.descriptor}
            </p>
            <div className="pt-2 border-t border-[#CBD9EB] dark:border-[#34465F] space-y-1 text-xs text-[#4D607B] dark:text-[#B1C2D8]">
              {assessmentResult.dimensions.codeDefense.evidencePoints.map((pt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-[#237A57] dark:text-[#78C9A4] shrink-0" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Scope Disclaimer */}
      <div className="p-4 rounded-xl bg-[#DCE7F5] dark:bg-[#22334A] border border-[#CBD9EB] dark:border-[#34465F] text-xs text-[#4D607B] dark:text-[#B1C2D8] flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#3569A8] dark:text-[#80B9F5] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Assessment outcomes reflect evidence demonstrated under defined sandbox conditions.
          They are not a scientifically validated measure of general programming proficiency or an absolute guarantee of job performance.
        </p>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#CBD9EB] dark:border-[#34465F]">
        <button
          onClick={() => setScreen('dashboard')}
          className="text-xs font-medium text-[#4D607B] hover:text-[#172B4D] dark:text-[#B1C2D8] dark:hover:text-[#F0F5FC] transition-colors cursor-pointer"
        >
          &larr; Return to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => copyToClipboard(proofCardData.shareableUrl, 'Proof link copied')}
            className="px-4 py-2.5 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] text-xs font-medium text-[#172B4D] dark:text-[#F0F5FC] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#4D607B] dark:text-[#B1C2D8]" />
            <span>Copy Link</span>
          </button>
          <button
            onClick={() => setScreen('proof')}
            className="px-5 py-2.5 rounded-lg bg-[#3569A8] hover:bg-[#28558D] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <span>Proceed to Proof Card</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
