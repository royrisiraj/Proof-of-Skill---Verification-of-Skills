import React from 'react';
import { CheckCircle2, ShieldCheck, Terminal, Cpu, ArrowRight } from 'lucide-react';

export const HeroIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none select-none">
      {/* Subtle, soft ambient background tint */}
      <div
        className="absolute -top-8 -right-8 w-64 h-64 bg-[#D7E5F7]/70 dark:bg-[#233D5C]/50 rounded-full blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Main Container: Layered Workspace Visual Composition */}
      <div className="relative space-y-4">
        {/* Layer 1: Stylized Code Editor Window (Purposeful dark navy editor) */}
        <div className="rounded-xl border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] shadow-sm overflow-hidden transition-all">
          {/* Window Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#DCE7F5] dark:bg-[#22334A] border-b border-[#CBD9EB] dark:border-[#34465F]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B93838]/70 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#94621B]/70 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#3569A8]/70 inline-block" />
              <span className="ml-2 font-mono text-[11px] font-medium text-[#172B4D] dark:text-[#F0F5FC]">
                session_limiter.py
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-[#4D607B] dark:text-[#B1C2D8]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3569A8] dark:bg-[#80B9F5]" />
              <span>Python 3.12</span>
            </div>
          </div>

          {/* Code Window Body — Clean dark navy canvas */}
          <div className="p-4 font-mono text-xs leading-relaxed overflow-x-hidden bg-[#0D1520] text-[#E6EFFD]">
            <div className="flex items-start">
              <span className="w-7 text-[#4D607B] select-none text-right pr-3 shrink-0">1</span>
              <span><span className="text-[#80B9F5]">def</span> <span className="text-[#F0F5FC] font-medium">evaluate_session_activity</span>(events, current, window):</span>
            </div>
            <div className="flex items-start">
              <span className="w-7 text-[#4D607B] select-none text-right pr-3 shrink-0">2</span>
              <span className="pl-4 text-[#64748B]"># Strict cutoff timestamp boundary</span>
            </div>
            <div className="flex items-start bg-[#1B2D45]/90 text-[#80B9F5] -mx-4 px-4 py-0.5 border-l-2 border-[#80B9F5]">
              <span className="w-7 text-[#80B9F5] select-none text-right pr-3 shrink-0">3</span>
              <span className="pl-4 font-medium">cutoff_time = current - window</span>
            </div>
            <div className="flex items-start bg-[#1B2D45]/90 text-[#80B9F5] -mx-4 px-4 py-0.5 border-l-2 border-[#80B9F5]">
              <span className="w-7 text-[#80B9F5] select-none text-right pr-3 shrink-0">4</span>
              <span className="pl-4 font-medium">retained = [e <span className="text-[#F0C477]">for</span> e <span className="text-[#F0C477]">in</span> events <span className="text-[#F0C477]">if</span> e[&quot;ts&quot;] &gt;= cutoff_time]</span>
            </div>
            <div className="flex items-start">
              <span className="w-7 text-[#4D607B] select-none text-right pr-3 shrink-0">5</span>
              <span className="pl-4"><span className="text-[#80B9F5]">return</span> &#123;&quot;allowed&quot;: len(retained) &lt;= max_allowed&#125;</span>
            </div>
          </div>
        </div>

        {/* Layer 2: Floating Test Pipeline & Diagnostic Outcome */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* Test Outcomes Sub-Card */}
          <div className="rounded-xl border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] p-4 shadow-sm animate-float">
            <div className="flex items-center justify-between pb-2 border-b border-[#CBD9EB] dark:border-[#34465F]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC]">
                <Terminal className="w-3.5 h-3.5 text-[#3569A8] dark:text-[#80B9F5]" />
                <span>Sandbox Test Suite</span>
              </div>
              <span className="text-[10px] font-mono text-[#237A57] dark:text-[#78C9A4] font-semibold bg-[#E3F5EC] dark:bg-[#163327] px-2 py-0.5 rounded-full border border-[#A3D9C0] dark:border-[#245740]">
                5/5 Passed
              </span>
            </div>

            <div className="mt-2.5 space-y-2 text-[11px] font-mono">
              <div className="flex items-center justify-between text-[#4D607B] dark:text-[#B1C2D8]">
                <span className="flex items-center gap-1.5 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#237A57] dark:text-[#78C9A4] shrink-0" />
                  <span className="truncate">test_consecutive_purges</span>
                </span>
                <span className="text-[#64748B] text-[10px]">0.04s</span>
              </div>
              <div className="flex items-center justify-between text-[#4D607B] dark:text-[#B1C2D8]">
                <span className="flex items-center gap-1.5 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#237A57] dark:text-[#78C9A4] shrink-0" />
                  <span className="truncate">test_boundary_cutoff</span>
                </span>
                <span className="text-[#64748B] text-[10px]">0.02s</span>
              </div>
              <div className="flex items-center justify-between text-[#4D607B] dark:text-[#B1C2D8]">
                <span className="flex items-center gap-1.5 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#237A57] dark:text-[#78C9A4] shrink-0" />
                  <span className="truncate">test_regression_author</span>
                </span>
                <span className="text-[#64748B] text-[10px]">0.03s</span>
              </div>
            </div>
          </div>

          {/* Floating Verifiable Proof Card Badge */}
          <div className="rounded-xl border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] p-4 shadow-sm animate-float-delayed flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#3569A8] dark:text-[#80B9F5]">
                  <ShieldCheck className="w-4 h-4 text-[#3569A8] dark:text-[#80B9F5]" />
                  <span>Verifiable Proof Record</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#237A57] dark:bg-[#78C9A4]" />
              </div>

              <div className="mt-2 space-y-1 text-[11px] font-mono text-[#4D607B] dark:text-[#B1C2D8]">
                <p className="truncate">
                  <span className="text-[#64748B] dark:text-[#9AACC3]">Cred ID:</span> cred_9a4f8e21
                </p>
                <p className="truncate">
                  <span className="text-[#64748B] dark:text-[#9AACC3]">Rubric:</span> RUBRIC-PY-DEBUG v1.4
                </p>
                <p className="truncate">
                  <span className="text-[#64748B] dark:text-[#9AACC3]">Digest:</span> sha256:4c8b67...
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-[#CBD9EB] dark:border-[#34465F] flex items-center justify-between text-[11px]">
              <span className="font-semibold text-[#3569A8] dark:text-[#80B9F5]">
                Demonstrated with Evidence
              </span>
              <span className="text-[10px] text-[#64748B] dark:text-[#9AACC3] font-mono">
                Simulated Key
              </span>
            </div>
          </div>
        </div>

        {/* Visual Workflow Connection Banner */}
        <div className="p-3 rounded-lg bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] text-[11px] font-medium text-[#4D607B] dark:text-[#B1C2D8] flex items-center justify-center gap-3 shadow-xs">
          <span className="flex items-center gap-1.5 text-[#172B4D] dark:text-[#F0F5FC] font-semibold">
            <Cpu className="w-3.5 h-3.5 text-[#3569A8] dark:text-[#80B9F5]" />
            1. Python Debugging
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-[#64748B]" />
          <span className="flex items-center gap-1.5 text-[#172B4D] dark:text-[#F0F5FC] font-semibold">
            <Terminal className="w-3.5 h-3.5 text-[#3569A8] dark:text-[#80B9F5]" />
            2. Regression Evidence
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-[#64748B]" />
          <span className="flex items-center gap-1.5 text-[#3569A8] dark:text-[#80B9F5] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            3. Verifiable Proof
          </span>
        </div>
      </div>
    </div>
  );
};
