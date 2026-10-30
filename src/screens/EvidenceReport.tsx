import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DiffViewer } from '../components/DiffViewer';
import { sampleCandidateSubmission } from '../data/mockData';
import {
  ShieldCheck,
  Share2,
  UserCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Info,
  Layers,
  Eye,
  EyeOff,
} from 'lucide-react';

export const EvidenceReport: React.FC = () => {
  const {
    challenge,
    candidate,
    proofCardData,
    privacySettings,
    updatePrivacySettings,
    copyToClipboard,
    setScreen,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'evidence' | 'diff' | 'tests'>('evidence');

  const displayName = privacySettings.anonymizedCandidate
    ? 'Candidate #8842 (Blind Screening Mode)'
    : candidate.fullName;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#CBD9EB] dark:border-[#34465F]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#4D607B] dark:text-[#B1C2D8] font-mono">
            <span>Verified Evidence Record</span>
            <span>·</span>
            <span>{proofCardData.credentialId}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172B4D] dark:text-[#F0F5FC] mt-0.5">
            Verifiable Proof Document
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScreen('results')}
            className="px-3.5 py-2 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#4D607B] dark:text-[#B1C2D8]" />
            <span>Rubric Breakdown</span>
          </button>
          <button
            onClick={() => setScreen('verify')}
            className="px-4 py-2 rounded-lg bg-[#3569A8] hover:bg-[#28558D] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Reviewer Verification</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Candidate Privacy Controls */}
      <div className="p-5 rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#172B4D] dark:text-[#F0F5FC] uppercase tracking-wider font-mono">
            <Lock className="w-4 h-4 text-[#3569A8] dark:text-[#80B9F5]" />
            <span>Candidate Privacy & Export Controls</span>
          </div>
          <span className="text-[11px] text-[#4D607B] dark:text-[#B1C2D8] font-mono">Customize public shared link</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Anonymization Toggle */}
          <button
            onClick={() =>
              updatePrivacySettings({ anonymizedCandidate: !privacySettings.anonymizedCandidate })
            }
            className={`p-3.5 rounded-lg border text-left text-xs transition-colors cursor-pointer flex items-start gap-3 ${
              privacySettings.anonymizedCandidate
                ? 'border-[#3569A8]/50 dark:border-[#80B9F5]/50 bg-[#D7E5F7] dark:bg-[#233D5C] text-[#172B4D] dark:text-[#F0F5FC] shadow-xs'
                : 'border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] text-[#4D607B] dark:text-[#B1C2D8] hover:border-[#3569A8]/40'
            }`}
          >
            <UserCheck className="w-4 h-4 mt-0.5 shrink-0 text-[#3569A8] dark:text-[#80B9F5]" />
            <div>
              <span className="font-bold block text-[#172B4D] dark:text-[#F0F5FC]">Blind Screening</span>
              <span className="text-[11px] text-[#4D607B] dark:text-[#B1C2D8] block mt-0.5">
                {privacySettings.anonymizedCandidate ? 'Name masked (#8842)' : 'Display Alex Chen'}
              </span>
            </div>
          </button>

          {/* Code Diff Toggle */}
          <button
            onClick={() =>
              updatePrivacySettings({ showFullCodeDiff: !privacySettings.showFullCodeDiff })
            }
            className={`p-3.5 rounded-lg border text-left text-xs transition-colors cursor-pointer flex items-start gap-3 ${
              privacySettings.showFullCodeDiff
                ? 'border-[#3569A8]/50 dark:border-[#80B9F5]/50 bg-[#D7E5F7] dark:bg-[#233D5C] text-[#172B4D] dark:text-[#F0F5FC] shadow-xs'
                : 'border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] text-[#4D607B] dark:text-[#B1C2D8] hover:border-[#3569A8]/40'
            }`}
          >
            {privacySettings.showFullCodeDiff ? (
              <Eye className="w-4 h-4 mt-0.5 shrink-0 text-[#3569A8] dark:text-[#80B9F5]" />
            ) : (
              <EyeOff className="w-4 h-4 mt-0.5 shrink-0 text-[#4D607B] dark:text-[#B1C2D8]" />
            )}
            <div>
              <span className="font-bold block text-[#172B4D] dark:text-[#F0F5FC]">Show Code Diff</span>
              <span className="text-[11px] text-[#4D607B] dark:text-[#B1C2D8] block mt-0.5">
                {privacySettings.showFullCodeDiff ? 'Code diff visible' : 'Code diff hidden'}
              </span>
            </div>
          </button>

          {/* Defense Notes Toggle */}
          <button
            onClick={() =>
              updatePrivacySettings({ showCandidateNotes: !privacySettings.showCandidateNotes })
            }
            className={`p-3.5 rounded-lg border text-left text-xs transition-colors cursor-pointer flex items-start gap-3 ${
              privacySettings.showCandidateNotes
                ? 'border-[#3569A8]/50 dark:border-[#80B9F5]/50 bg-[#D7E5F7] dark:bg-[#233D5C] text-[#172B4D] dark:text-[#F0F5FC] shadow-xs'
                : 'border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] text-[#4D607B] dark:text-[#B1C2D8] hover:border-[#3569A8]/40'
            }`}
          >
            {privacySettings.showCandidateNotes ? (
              <Eye className="w-4 h-4 mt-0.5 shrink-0 text-[#3569A8] dark:text-[#80B9F5]" />
            ) : (
              <EyeOff className="w-4 h-4 mt-0.5 shrink-0 text-[#4D607B] dark:text-[#B1C2D8]" />
            )}
            <div>
              <span className="font-bold block text-[#172B4D] dark:text-[#F0F5FC]">Candidate Notes</span>
              <span className="text-[11px] text-[#4D607B] dark:text-[#B1C2D8] block mt-0.5">
                {privacySettings.showCandidateNotes ? 'Diagnosis notes visible' : 'Notes redacted'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* THE PROOF CARD: Professional Evidence Document */}
      <article className="rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-sm overflow-hidden relative">
        {/* Deep midnight navy Security Header */}
        <div className="relative p-6 sm:p-8 border-b border-[#203046] bg-[#0E1726] text-white overflow-hidden">
          {/* Background SVG Security Seal Watermark */}
          <div
            className="absolute right-4 -top-8 w-64 h-64 text-[#80B9F5]/10 pointer-events-none select-none"
            aria-hidden="true"
          >
            <ShieldCheck className="w-full h-full stroke-[0.75]" />
          </div>

          <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-[#80B9F5] font-bold tracking-wider uppercase">
                <ShieldCheck className="w-4 h-4 text-[#80B9F5]" />
                <span>Proof of Skill Verified Evidence Record</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {challenge.title}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#B1C2D8] font-mono pt-1">
                <span>Subject: <strong className="text-white font-semibold">{displayName}</strong></span>
                <span>·</span>
                <span>Challenge: {challenge.code}</span>
                <span>·</span>
                <span>Rubric: {proofCardData.rubricId} v{proofCardData.rubricVersion}</span>
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(proofCardData.shareableUrl, 'Shareable verification link copied')}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto border border-white/15"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Evidence Link</span>
            </button>
          </div>
        </div>

        {/* Triple Partition: Facts vs Evaluations vs Non-Established Claims */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#CBD9EB] dark:divide-[#34465F] text-xs">
          {/* Column 1: Observed Facts */}
          <div className="p-6 space-y-3 bg-[#FFFFFF] dark:bg-[#1B293D]">
            <h3 className="font-bold text-[#172B4D] dark:text-[#F0F5FC] uppercase tracking-wider font-mono text-[11px] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3569A8] dark:text-[#80B9F5]" />
              <span>01. Observed Facts</span>
            </h3>
            <p className="text-[#4D607B] dark:text-[#B1C2D8] text-[11px] leading-relaxed">
              Empirical execution parameters captured from the Python container runtime:
            </p>
            <ul className="space-y-1.5 text-[#172B4D] dark:text-[#F0F5FC] font-mono text-[11px]">
              <li className="flex justify-between border-b border-[#CBD9EB] dark:border-[#34465F] pb-1">
                <span className="text-[#4D607B] dark:text-[#B1C2D8]">Sandbox Exit:</span>
                <span className="font-bold text-[#237A57] dark:text-[#78C9A4]">0 (Clean)</span>
              </li>
              <li className="flex justify-between border-b border-[#CBD9EB] dark:border-[#34465F] pb-1">
                <span className="text-[#4D607B] dark:text-[#B1C2D8]">Visible Tests:</span>
                <span>3 / 3 Passed</span>
              </li>
              <li className="flex justify-between border-b border-[#CBD9EB] dark:border-[#34465F] pb-1">
                <span className="text-[#4D607B] dark:text-[#B1C2D8]">Hidden Edge Tests:</span>
                <span>2 / 2 Passed (Simulated)</span>
              </li>
              <li className="flex justify-between border-b border-[#CBD9EB] dark:border-[#34465F] pb-1">
                <span className="text-[#4D607B] dark:text-[#B1C2D8]">Duration:</span>
                <span>19 minutes</span>
              </li>
              <li className="flex justify-between">
                <span className="text-[#4D607B] dark:text-[#B1C2D8]">Environment:</span>
                <span>Unproctored Timed</span>
              </li>
            </ul>
          </div>

          {/* Column 2: Rubric-Based Evaluations */}
          <div className="p-6 space-y-3 bg-[#FFFFFF] dark:bg-[#1B293D]">
            <h3 className="font-bold text-[#172B4D] dark:text-[#F0F5FC] uppercase tracking-wider font-mono text-[11px] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#3569A8] dark:text-[#80B9F5]" />
              <span>02. Rubric Evaluations</span>
            </h3>
            <p className="text-[#4D607B] dark:text-[#B1C2D8] text-[11px] leading-relaxed">
              Qualitative ratings mapped to the published rubric criteria:
            </p>
            <ul className="space-y-1.5 text-[#172B4D] dark:text-[#F0F5FC] font-mono text-[11px]">
              <li className="flex justify-between border-b border-[#CBD9EB] dark:border-[#34465F] pb-1">
                <span className="text-[#4D607B] dark:text-[#B1C2D8]">Correctness:</span>
                <span className="font-bold text-[#237A57] dark:text-[#78C9A4]">Exemplary</span>
              </li>
              <li className="flex justify-between border-b border-[#CBD9EB] dark:border-[#34465F] pb-1">
                <span className="text-[#4D607B] dark:text-[#B1C2D8]">Bug Diagnosis:</span>
                <span className="font-bold text-[#237A57] dark:text-[#78C9A4]">Exemplary</span>
              </li>
              <li className="flex justify-between border-b border-[#CBD9EB] dark:border-[#34465F] pb-1">
                <span className="text-[#4D607B] dark:text-[#B1C2D8]">Regression Test:</span>
                <span className="font-bold text-[#237A57] dark:text-[#78C9A4]">Exemplary</span>
              </li>
              <li className="flex justify-between border-b border-[#CBD9EB] dark:border-[#34465F] pb-1">
                <span className="text-[#4D607B] dark:text-[#B1C2D8]">Code Defense:</span>
                <span className="font-bold text-[#172B4D] dark:text-[#F0F5FC]">Demonstrated</span>
              </li>
              <li className="flex justify-between">
                <span className="text-[#4D607B] dark:text-[#B1C2D8]">Overall:</span>
                <span className="font-bold text-[#237A57] dark:text-[#78C9A4]">Demonstrated</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Non-Established Claims */}
          <div className="p-6 space-y-3 bg-[#FFFFFF] dark:bg-[#1B293D]">
            <h3 className="font-bold text-[#172B4D] dark:text-[#F0F5FC] uppercase tracking-wider font-mono text-[11px] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#4D607B] dark:text-[#B1C2D8]" />
              <span>03. Non-Established Claims</span>
            </h3>
            <p className="text-[#4D607B] dark:text-[#B1C2D8] text-[11px] leading-relaxed">
              Explicit boundary limits on what this record does not attest:
            </p>
            <ul className="space-y-1.5 text-[#4D607B] dark:text-[#B1C2D8] text-[11px] list-disc list-inside">
              <li>Does not verify candidate identity or biometric verification.</li>
              <li>Does not guarantee unassisted authorship outside sandbox.</li>
              <li>Does not predict general software engineering career performance.</li>
            </ul>
          </div>
        </div>

        {/* Detailed Evidence Work (Tabs) */}
        <div className="p-6 sm:p-8 border-t border-[#CBD9EB] dark:border-[#34465F] space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1 bg-[#DCE7F5] dark:bg-[#111B2B] p-1 rounded-lg text-xs font-medium border border-[#CBD9EB] dark:border-[#34465F]">
              <button
                onClick={() => setActiveTab('evidence')}
                className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'evidence'
                    ? 'bg-[#FFFFFF] dark:bg-[#263952] text-[#172B4D] dark:text-[#F0F5FC] shadow-xs font-semibold'
                    : 'text-[#4D607B] dark:text-[#B1C2D8] hover:text-[#172B4D]'
                }`}
              >
                Diagnosis & Defense Notes
              </button>
              <button
                onClick={() => setActiveTab('diff')}
                className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'diff'
                    ? 'bg-[#FFFFFF] dark:bg-[#263952] text-[#172B4D] dark:text-[#F0F5FC] shadow-xs font-semibold'
                    : 'text-[#4D607B] dark:text-[#B1C2D8] hover:text-[#172B4D]'
                }`}
              >
                Code Diff (Evidence)
              </button>
              <button
                onClick={() => setActiveTab('tests')}
                className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'tests'
                    ? 'bg-[#FFFFFF] dark:bg-[#263952] text-[#172B4D] dark:text-[#F0F5FC] shadow-xs font-semibold'
                    : 'text-[#4D607B] dark:text-[#B1C2D8] hover:text-[#172B4D]'
                }`}
              >
                Candidate Regression Test
              </button>
            </div>

            <span className="text-[11px] text-[#4D607B] dark:text-[#B1C2D8] font-mono">
              Signed Digest: {proofCardData.cryptographicSignature.signedPayloadDigest.substring(0, 20)}...
            </span>
          </div>

          {/* Tab 1: Diagnosis Notes */}
          {activeTab === 'evidence' && (
            <div className="pt-2">
              {privacySettings.showCandidateNotes ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] space-y-2">
                    <span className="font-bold text-[#172B4D] dark:text-[#F0F5FC] block font-mono text-[11px]">
                      Candidate Root-Cause Diagnosis
                    </span>
                    <p className="text-[#4D607B] dark:text-[#B1C2D8] leading-relaxed">
                      {sampleCandidateSubmission.rootCauseDiagnosis}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] space-y-2">
                    <span className="font-bold text-[#172B4D] dark:text-[#F0F5FC] block font-mono text-[11px]">
                      Candidate Fix Defense & Complexity Notes
                    </span>
                    <p className="text-[#4D607B] dark:text-[#B1C2D8] leading-relaxed">
                      {sampleCandidateSubmission.fixRationale}
                    </p>
                    <p className="text-[#4D607B] dark:text-[#B1C2D8] font-mono text-[11px] pt-1 border-t border-[#CBD9EB] dark:border-[#34465F]">
                      {sampleCandidateSubmission.complexityTradeoffs}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[#4D607B] dark:text-[#B1C2D8] border border-dashed border-[#CBD9EB] dark:border-[#34465F] rounded-lg">
                  Candidate notes have been redacted per candidate privacy preferences.
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Code Diff */}
          {activeTab === 'diff' && (
            <div className="pt-2">
              {privacySettings.showFullCodeDiff ? (
                <DiffViewer
                  originalCode={challenge.starterCode}
                  modifiedCode={challenge.referenceSolutionCode}
                />
              ) : (
                <div className="p-6 text-center text-xs text-[#4D607B] dark:text-[#B1C2D8] border border-dashed border-[#CBD9EB] dark:border-[#34465F] rounded-lg">
                  Code diff has been hidden per candidate privacy preferences.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Candidate Regression Test */}
          {activeTab === 'tests' && (
            <div className="pt-2">
              <div className="rounded-lg border border-[#203046] bg-[#0D1520] p-4 font-mono text-xs text-[#E6EFFD] space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#9AACC3] border-b border-[#203046] pb-2">
                  <span>test_session_limiter.py (Candidate-Authored Test)</span>
                  <span className="text-[#78C9A4] font-semibold">Passed in Sandbox</span>
                </div>
                <pre className="overflow-x-auto whitespace-pre leading-relaxed text-[#B1C2D8] pt-1">
                  <code>{sampleCandidateSubmission.regressionTest}</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Document Footer */}
        <div className="px-6 py-4 bg-[#DCE7F5] dark:bg-[#111B2B] border-t border-[#CBD9EB] dark:border-[#34465F] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#4D607B] dark:text-[#B1C2D8] font-mono">
          <div>
            <span>Issuer: {proofCardData.issuer.name}</span>
            <span className="mx-2">·</span>
            <span>Credential ID: {proofCardData.credentialId}</span>
          </div>
          <div>
            <span>Simulated Ed25519 Demonstration Record</span>
          </div>
        </div>
      </article>
    </div>
  );
};
