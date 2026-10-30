import React, { useState } from 'react';
import { Columns, AlignJustify } from 'lucide-react';

interface DiffViewerProps {
  originalCode: string;
  modifiedCode: string;
  originalLabel?: string;
  modifiedLabel?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalCode,
  modifiedCode,
  originalLabel = 'Starter Code (Buggy)',
  modifiedLabel = 'Candidate Submission (Fixed)',
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  const origLines = originalCode.split('\n');
  const modLines = modifiedCode.split('\n');

  return (
    <div className="rounded-xl border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] overflow-hidden shadow-xs">
      {/* Diff Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#CBD9EB] dark:border-[#34465F] bg-[#DCE7F5] dark:bg-[#22334A] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#172B4D] dark:text-[#F0F5FC]">
            Code Change Evidence (Diff)
          </span>
          <span aria-hidden="true" className="text-[#4D607B]/40 dark:text-[#B1C2D8]/40">·</span>
          <span className="text-[#4D607B] dark:text-[#B1C2D8] font-mono text-[11px]">session_limiter.py</span>
        </div>

        <div className="flex items-center gap-1 bg-[#CBD9EB]/60 dark:bg-[#111B2B] p-0.5 rounded-md">
          <button
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 rounded-sm text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              viewMode === 'split'
                ? 'bg-[#FFFFFF] dark:bg-[#263952] text-[#172B4D] dark:text-[#F0F5FC] shadow-xs'
                : 'text-[#4D607B] dark:text-[#B1C2D8] hover:text-[#172B4D]'
            }`}
          >
            <Columns className="w-3 h-3" />
            <span>Side-by-Side</span>
          </button>
          <button
            onClick={() => setViewMode('unified')}
            className={`px-2.5 py-1 rounded-sm text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              viewMode === 'unified'
                ? 'bg-[#FFFFFF] dark:bg-[#263952] text-[#172B4D] dark:text-[#F0F5FC] shadow-xs'
                : 'text-[#4D607B] dark:text-[#B1C2D8] hover:text-[#172B4D]'
            }`}
          >
            <AlignJustify className="w-3 h-3" />
            <span>Unified</span>
          </button>
        </div>
      </div>

      {viewMode === 'split' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#CBD9EB] dark:divide-[#34465F] font-mono text-xs overflow-x-auto">
          {/* Left: Original */}
          <div>
            <div className="px-3.5 py-1.5 bg-[#FDF1F0] dark:bg-[#381E1E] border-b border-[#CBD9EB] dark:border-[#34465F] text-[11px] text-[#B93838] dark:text-[#F29A9A] font-semibold">
              - {originalLabel}
            </div>
            <div className="p-3.5 leading-relaxed text-[#172B4D] dark:text-[#F0F5FC] overflow-x-auto whitespace-pre max-h-[420px] overflow-y-auto">
              {origLines.map((line, i) => {
                const isBugArea =
                  line.includes('events.pop(i)') ||
                  line.includes('cutoff_time = current_time - window_seconds + 1') ||
                  line.includes('while i < len(events):');
                return (
                  <div
                    key={i}
                    className={`flex items-start ${
                      isBugArea ? 'bg-[#FDF1F0] dark:bg-[#381E1E] text-[#B93838] dark:text-[#F29A9A]' : ''
                    }`}
                  >
                    <span className="w-8 select-none text-[#64748B]/50 dark:text-[#9AACC3]/50 text-right pr-3 shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1">{line || ' '}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Modified */}
          <div>
            <div className="px-3.5 py-1.5 bg-[#E3F5EC] dark:bg-[#163327] border-b border-[#CBD9EB] dark:border-[#34465F] text-[11px] text-[#237A57] dark:text-[#78C9A4] font-semibold">
              + {modifiedLabel}
            </div>
            <div className="p-3.5 leading-relaxed text-[#172B4D] dark:text-[#F0F5FC] overflow-x-auto whitespace-pre max-h-[420px] overflow-y-auto">
              {modLines.map((line, i) => {
                const isFixArea =
                  line.includes('retained_events = [') ||
                  line.includes('cutoff_time = current_time - window_seconds') ||
                  line.includes('event for event in events');
                return (
                  <div
                    key={i}
                    className={`flex items-start ${
                      isFixArea
                        ? 'bg-[#E3F5EC] dark:bg-[#163327] text-[#237A57] dark:text-[#78C9A4] font-semibold'
                        : ''
                    }`}
                  >
                    <span className="w-8 select-none text-[#64748B]/50 dark:text-[#9AACC3]/50 text-right pr-3 shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1">{line || ' '}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Unified View */
        <div className="p-4 font-mono text-xs leading-relaxed max-h-[420px] overflow-y-auto overflow-x-auto text-[#172B4D] dark:text-[#F0F5FC]">
          <div className="text-[11px] text-[#4D607B] dark:text-[#B1C2D8] mb-2 font-mono">
            @@ -13,11 +13,10 @@ def evaluate_session_activity @@
          </div>
          <div className="bg-[#FDF1F0] dark:bg-[#381E1E] text-[#B93838] dark:text-[#F29A9A] py-0.5 px-2 rounded">
            - cutoff_time = current_time - window_seconds + 1
          </div>
          <div className="bg-[#E3F5EC] dark:bg-[#163327] text-[#237A57] dark:text-[#78C9A4] py-0.5 px-2 rounded">
            + cutoff_time = current_time - window_seconds
          </div>
          <div className="py-0.5 px-2 text-[#64748B]/40">
            &nbsp;
          </div>
          <div className="bg-[#FDF1F0] dark:bg-[#381E1E] text-[#B93838] dark:text-[#F29A9A] py-0.5 px-2 rounded">
            - i = 0<br />
            - while i &lt; len(events):<br />
            - &nbsp;&nbsp;&nbsp;&nbsp;event = events[i]<br />
            - &nbsp;&nbsp;&nbsp;&nbsp;if event.get("timestamp", 0) &lt; cutoff_time:<br />
            - &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;events.pop(i)<br />
            - &nbsp;&nbsp;&nbsp;&nbsp;i += 1
          </div>
          <div className="bg-[#E3F5EC] dark:bg-[#163327] text-[#237A57] dark:text-[#78C9A4] py-0.5 px-2 rounded">
            + # Non-mutating list filter:<br />
            + retained_events = [<br />
            + &nbsp;&nbsp;&nbsp;&nbsp;event for event in events<br />
            + &nbsp;&nbsp;&nbsp;&nbsp;if event.get("timestamp", 0) &gt;= cutoff_time<br />
            + ]
          </div>
        </div>
      )}
    </div>
  );
};
