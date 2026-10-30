import React from 'react';
import { useApp } from '../context/AppContext';
import { HeroIllustration } from '../components/HeroIllustration';
import { CompetencyVisualizer } from '../components/CompetencyVisualizer';
import { sampleHistoricalAssessments } from '../data/mockData';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Code2,
  Layers,
  Award,
  BookOpen,
  FileCode,
} from 'lucide-react';

export const CandidateDashboard: React.FC = () => {
  const {
    candidate,
    isFirstTimeUser,
    setIsFirstTimeUser,
    setScreen,
    challenge,
    copyToClipboard,
  } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* 4.A HERO SECTION: Engaging Two-Part Composition */}
      <section aria-labelledby="hero-heading" className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Value Proposition & Clear Call to Actions */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#D7E5F7] dark:bg-[#233D5C] border border-[#3569A8]/30 dark:border-[#80B9F5]/30 text-xs font-medium text-[#3569A8] dark:text-[#80B9F5]">
              <span className="w-2 h-2 rounded-full bg-[#3569A8] dark:bg-[#80B9F5]" />
              <span>Evidence-Backed Engineering Assessment</span>
            </div>

            <div className="space-y-3">
              <h1
                id="hero-heading"
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#172B4D] dark:text-[#F0F5FC] leading-[1.18]"
              >
                Don&apos;t just claim you passed.{' '}
                <span className="text-[#3569A8] dark:text-[#80B9F5]">
                  Show how you solved it.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-[#4D607B] dark:text-[#B1C2D8] leading-relaxed max-w-xl">
                Résumés and certificates only state claims. Proof of Skill captures your real-world
                Python debugging reasoning, regression tests, and code diffs into an inspectable,
                verifiable record.
              </p>
            </div>

            {/* Primary & Secondary Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setScreen('workspace')}
                className="px-6 py-3.5 rounded-lg bg-[#3569A8] hover:bg-[#28558D] text-white font-semibold text-sm flex items-center gap-2.5 shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-[#3569A8] focus-visible:outline-none cursor-pointer"
              >
                <Code2 className="w-4 h-4" />
                <span>Start Challenge Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setScreen('verify')}
                className="px-5 py-3.5 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] text-[#172B4D] dark:text-[#F0F5FC] font-medium text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#3569A8] dark:text-[#80B9F5]" />
                <span>Reviewer Verification Demo</span>
              </button>
            </div>

            <div className="pt-2 flex items-center gap-4 text-xs text-[#4D607B] dark:text-[#B1C2D8] font-mono">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#237A57] dark:text-[#78C9A4]" />
                Python 3.12 Sandboxed
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#237A57] dark:text-[#78C9A4]" />
                Pytest Regression Checked
              </span>
            </div>
          </div>

          {/* Right Column: Custom Interactive Hero Illustration */}
          <div className="lg:col-span-6">
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* 4.B CANDIDATE SUMMARY: Refined Visual Metrics */}
      {!isFirstTimeUser && (
        <section aria-labelledby="metrics-heading" className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Metric 1 */}
            <div className="p-5 rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-xs flex items-center gap-4 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#D7E5F7] dark:bg-[#233D5C] border border-[#3569A8]/20 dark:border-[#80B9F5]/20 text-[#3569A8] dark:text-[#80B9F5] flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-bold tracking-tight text-[#172B4D] dark:text-[#F0F5FC] block">
                  {candidate.completedAssessments}
                </span>
                <span className="text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] block">
                  Completed Proofs
                </span>
                <span className="text-[11px] text-[#4D607B] dark:text-[#B1C2D8] block">
                  Verified in simulated sandbox
                </span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="p-5 rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-xs flex items-center gap-4 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#D7E5F7] dark:bg-[#233D5C] border border-[#3569A8]/20 dark:border-[#80B9F5]/20 text-[#3569A8] dark:text-[#80B9F5] flex items-center justify-center shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-bold tracking-tight text-[#172B4D] dark:text-[#F0F5FC] block">
                  4
                </span>
                <span className="text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] block">
                  Verified Competencies
                </span>
                <span className="text-[11px] text-[#4D607B] dark:text-[#B1C2D8] block">
                  Tested against Rubric v1.4
                </span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="p-5 rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-xs flex items-center gap-4 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#E3F5EC] dark:bg-[#163327] border border-[#A3D9C0] dark:border-[#245740] text-[#237A57] dark:text-[#78C9A4] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-bold tracking-tight text-[#237A57] dark:text-[#78C9A4] block">
                  Active
                </span>
                <span className="text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] block">
                  Credential Standing
                </span>
                <span className="text-[11px] text-[#4D607B] dark:text-[#B1C2D8] block">
                  Simulated Ed25519 demonstration
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4.C FEATURED CHALLENGE: Technical Preview & Instant Launch */}
      <section aria-labelledby="featured-challenge-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            id="featured-challenge-heading"
            className="text-xs font-bold uppercase tracking-wider text-[#4D607B] dark:text-[#B1C2D8] font-mono flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#3569A8] dark:text-[#80B9F5]" />
            <span>Recommended Debugging Challenge</span>
          </h2>
          <span className="text-xs text-[#4D607B] dark:text-[#B1C2D8] font-mono hidden sm:inline">
            Focus: Monotonic Sliding Window State Invariants
          </span>
        </div>

        <div className="rounded-xl border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Challenge Description (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-0.5 rounded-md bg-[#D7E5F7] dark:bg-[#233D5C] text-[#3569A8] dark:text-[#80B9F5] font-semibold border border-[#3569A8]/30 dark:border-[#80B9F5]/30">
                  {challenge.difficulty} Difficulty
                </span>
                <span className="text-[#CBD9EB] dark:text-[#34465F]">·</span>
                <span className="text-[#4D607B] dark:text-[#B1C2D8]">{challenge.language}</span>
                <span className="text-[#CBD9EB] dark:text-[#34465F]">·</span>
                <span className="text-[#4D607B] dark:text-[#B1C2D8] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ~{challenge.recommendedMinutes} min recommended
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-[#172B4D] dark:text-[#F0F5FC]">
                {challenge.title}
              </h3>

              <p className="text-sm text-[#4D607B] dark:text-[#B1C2D8] leading-relaxed">
                {challenge.summary}
              </p>
            </div>

            <div className="pt-4 border-t border-[#CBD9EB] dark:border-[#34465F] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs text-[#4D607B] dark:text-[#B1C2D8] font-mono">
                <span>Code: {challenge.code}</span>
                <span>·</span>
                <span>Rubric v1.4</span>
              </div>

              <button
                onClick={() => setScreen('workspace')}
                className="px-5 py-2.5 rounded-lg bg-[#3569A8] hover:bg-[#28558D] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>Launch Challenge Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Technical Code Preview Snippet (5 cols) - purposeful dark editor style */}
          <div className="lg:col-span-5 bg-[#0D1520] p-6 font-mono text-xs text-[#E6EFFD] border-t lg:border-t-0 lg:border-l border-[#203046] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[#9AACC3] pb-3 border-b border-[#203046] text-[11px]">
                <span className="flex items-center gap-1.5 text-[#E6EFFD]">
                  <FileCode className="w-3.5 h-3.5 text-[#80B9F5]" />
                  session_limiter.py (Defect Preview)
                </span>
                <span className="text-[#F29A9A] text-[10px]">Bug on Line 18</span>
              </div>

              <div className="pt-3 space-y-1 text-[11px] leading-relaxed text-[#B1C2D8]">
                <p className="text-[#64748B]"># Traversal mutation causes element skipping:</p>
                <p className="text-[#E6EFFD]">i = 0</p>
                <p className="text-[#F29A9A] bg-[#381E1E]/80 -mx-2 px-2 py-0.5 rounded">
                  while i &lt; len(events):
                </p>
                <p className="text-[#F29A9A] bg-[#381E1E]/80 -mx-2 px-2 py-0.5 rounded pl-4">
                  if events[i].timestamp &lt; cutoff:
                </p>
                <p className="text-[#F29A9A] bg-[#381E1E]/80 -mx-2 px-2 py-0.5 rounded pl-8 font-semibold">
                  events.pop(i) # &lt;- Shifts indices!
                </p>
                <p className="pl-4 text-[#E6EFFD]">i += 1</p>
              </div>
            </div>

            <div className="pt-4 text-[10px] text-[#9AACC3] border-t border-[#203046] flex items-center justify-between">
              <span>Goal: Patch non-mutating list filter & regression test</span>
              <span className="text-[#80B9F5] font-semibold">Pytest Evaluated</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4.D RECENT EVIDENCE TIMELINE OR EMPTY STATE */}
      <section aria-labelledby="recent-evidence-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            id="recent-evidence-heading"
            className="text-xs font-bold uppercase tracking-wider text-[#4D607B] dark:text-[#B1C2D8] font-mono"
          >
            Verified Assessment Records
          </h2>
          <span className="text-xs text-[#4D607B] dark:text-[#B1C2D8] font-mono">Sample Candidate History</span>
        </div>

        {isFirstTimeUser ? (
          /* Custom Empty State Illustration */
          <div className="rounded-xl border border-dashed border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] p-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-xl bg-[#D7E5F7] dark:bg-[#233D5C] border border-[#3569A8]/20 dark:border-[#80B9F5]/20 text-[#3569A8] dark:text-[#80B9F5] flex items-center justify-center">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-[#172B4D] dark:text-[#F0F5FC]">
                No Completed Assessments Yet
              </h3>
              <p className="text-xs sm:text-sm text-[#4D607B] dark:text-[#B1C2D8] leading-relaxed">
                Complete your first Python debugging challenge to generate verifiable evidence,
                regression test records, and an inspectable Proof Card.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setScreen('workspace')}
                className="px-5 py-2.5 rounded-lg bg-[#3569A8] hover:bg-[#28558D] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Launch Session Expiry Challenge
              </button>
              <button
                onClick={() => setIsFirstTimeUser(false)}
                className="px-4 py-2.5 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] text-xs font-medium text-[#172B4D] dark:text-[#F0F5FC] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] transition-colors cursor-pointer"
              >
                Restore Sample History
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] shadow-xs overflow-hidden divide-y divide-[#CBD9EB] dark:divide-[#34465F]">
            {sampleHistoricalAssessments.map((item) => (
              <div
                key={item.id}
                className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#DCE7F5]/50 dark:hover:bg-[#22334A]/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-[#4D607B] dark:text-[#B1C2D8] font-mono">
                    <span className="font-semibold text-[#237A57] dark:text-[#78C9A4]">
                      {item.status}
                    </span>
                    <span>·</span>
                    <span>{item.language}</span>
                    <span>·</span>
                    <span>{item.date}</span>
                  </div>
                  <h3 className="text-base font-bold text-[#172B4D] dark:text-[#F0F5FC]">
                    {item.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#4D607B] dark:text-[#B1C2D8] font-mono pt-0.5">
                    <span className="px-2 py-0.5 rounded bg-[#DCE7F5] dark:bg-[#22334A] text-[#172B4D] dark:text-[#F0F5FC] text-[11px] border border-[#CBD9EB] dark:border-[#34465F]">
                      {item.domain}
                    </span>
                    <span>{item.credentialId}</span>
                    <span>·</span>
                    <span>{item.testsPassedRatio}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <button
                    onClick={() => setScreen('proof')}
                    className="px-3.5 py-2 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#3569A8] dark:text-[#80B9F5]" />
                    <span>View Proof Card</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(item.shareUrl, 'Public verification link copied')}
                    className="p-2 rounded-lg text-[#4D607B] hover:text-[#172B4D] dark:text-[#B1C2D8] dark:hover:text-[#F0F5FC] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] transition-colors cursor-pointer"
                    title="Copy verification link"
                    aria-label="Copy verification link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4.E COMPETENCY VISUALIZATION: Placed beneath primary content */}
      {!isFirstTimeUser && (
        <section aria-labelledby="competency-heading" className="space-y-4 pt-2">
          <CompetencyVisualizer />
        </section>
      )}
    </div>
  );
};
