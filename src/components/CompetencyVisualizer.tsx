import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, ChevronRight, Layers, FileCode } from 'lucide-react';
import { sampleSkillsSummary } from '../data/mockData';

export const CompetencyVisualizer: React.FC = () => {
  const [selectedSkill, setSelectedSkill] = useState<number>(0);

  const competencyDetails = [
    {
      ...sampleSkillsSummary[0],
      category: 'Concurrency & Traversal',
      description: 'Preserves container state invariants by avoiding in-place array mutation during indexed loops. Prevents element skipping in monotonic timestamp sliding windows.',
      criteriaMet: ['Non-mutating list filter', 'Zero index-shifting artifacts', 'Monotonic evaluation preserved'],
    },
    {
      ...sampleSkillsSummary[1],
      category: 'Software Verification',
      description: 'Authors targeted regression assertions specifically reproducing edge-case regressions before asserting patch correctness on fixed code.',
      criteriaMet: ['Bug reproduction verified', 'Passes on patched implementation', 'Clear assertion failure message'],
    },
    {
      ...sampleSkillsSummary[2],
      category: 'Boundary Analysis',
      description: 'Identifies strict vs non-strict boundary arithmetic defects and off-by-one window inclusion offsets in rate limiting buffers.',
      criteriaMet: ['Exact threshold equality verified', 'Time window offset calculation corrected', 'No stale boundary artifacts'],
    },
    {
      ...sampleSkillsSummary[3],
      category: 'Systems & Complexity',
      description: 'Defends space-time complexity trade-offs between O(N) linear iteration and O(K) memory allocation for immutability guarantees.',
      criteriaMet: ['Linear runtime verified', 'Memory overhead justified', 'Production deque trade-off noted'],
    },
  ];

  return (
    <div className="rounded-xl border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] shadow-xs overflow-hidden">
      <div className="p-5 border-b border-[#CBD9EB] dark:border-[#34465F] bg-[#DCE7F5] dark:bg-[#22334A] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#3569A8] dark:text-[#80B9F5]" />
            <h3 className="font-semibold text-sm text-[#172B4D] dark:text-[#F0F5FC]">
              Demonstrated Competency Matrix
            </h3>
          </div>
          <p className="text-xs text-[#4D607B] dark:text-[#B1C2D8] mt-0.5">
            Empirical evidence verified through unit test passes and candidate diagnostic defense
          </p>
        </div>
        <span className="text-[11px] font-mono text-[#237A57] dark:text-[#78C9A4] bg-[#E3F5EC] dark:bg-[#163327] px-2.5 py-1 rounded-md font-semibold border border-[#A3D9C0] dark:border-[#245740] self-start sm:self-auto">
          4 / 4 Criteria Demonstrated
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#CBD9EB] dark:divide-[#34465F]">
        {/* Left List of Competencies */}
        <div className="md:col-span-5 p-2 space-y-1 bg-[#F8FAFE] dark:bg-[#1B293D]">
          {competencyDetails.map((skill, idx) => {
            const isSelected = selectedSkill === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedSkill(idx)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-[#D7E5F7] dark:bg-[#233D5C] border border-[#3569A8]/40 dark:border-[#80B9F5]/40 text-[#172B4D] dark:text-[#F0F5FC]'
                    : 'hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] text-[#4D607B] dark:text-[#B1C2D8]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isSelected ? 'text-[#237A57] dark:text-[#78C9A4]' : 'text-[#4D607B]/60 dark:text-[#B1C2D8]/60'
                      }`}
                    />
                    <span className={`text-xs font-medium ${isSelected ? 'text-[#172B4D] dark:text-[#F0F5FC] font-semibold' : ''}`}>{skill.skill}</span>
                  </div>
                  <span className="text-[11px] text-[#4D607B] dark:text-[#B1C2D8] block pl-5 font-mono">
                    {skill.category}
                  </span>
                </div>
                <ChevronRight
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isSelected ? 'text-[#3569A8] dark:text-[#80B9F5] translate-x-0.5' : 'text-[#4D607B]/40 dark:text-[#B1C2D8]/40'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Right Detail Pane */}
        <div className="md:col-span-7 p-5 space-y-4 bg-[#FFFFFF] dark:bg-[#22334A]/50">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#3569A8] dark:text-[#80B9F5] font-semibold">
              {competencyDetails[selectedSkill].category}
            </span>
            <h4 className="text-base font-bold text-[#172B4D] dark:text-[#F0F5FC]">
              {competencyDetails[selectedSkill].skill}
            </h4>
            <p className="text-xs text-[#4D607B] dark:text-[#B1C2D8] leading-relaxed pt-1">
              {competencyDetails[selectedSkill].description}
            </p>
          </div>

          <div className="pt-2 border-t border-[#CBD9EB] dark:border-[#34465F] space-y-2">
            <span className="text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] block">
              Observed Validation Checkpoints:
            </span>
            <div className="space-y-1.5">
              {competencyDetails[selectedSkill].criteriaMet.map((criterion, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-[#4D607B] dark:text-[#B1C2D8]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#237A57] dark:text-[#78C9A4] shrink-0" />
                  <span>{criterion}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] text-[#4D607B] dark:text-[#B1C2D8] font-mono border-t border-[#CBD9EB] dark:border-[#34465F]">
            <span>Verified across 2 submissions</span>
            <span className="text-[#3569A8] dark:text-[#80B9F5] font-medium">Rubric Validated (Simulated Prototype)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
