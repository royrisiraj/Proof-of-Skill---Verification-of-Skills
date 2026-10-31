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
  Printer,
  Download,
  Calendar,
  Key,
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
    progressData,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'evidence' | 'diff' | 'tests'>('evidence');

  const displayName = privacySettings.anonymizedCandidate
    ? 'Candidate #8842 (Blind Screening Mode)'
    : candidate.fullName;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadProof = () => {
    const proofExport = {
      credentialId: proofCardData.credentialId,
      challengeTitle: challenge.title,
      challengeCode: challenge.code,
      issuedAt: proofCardData.issuedAt,
      candidate: privacySettings.anonymizedCandidate
        ? { id: 'cand_#8842', anonymized: true }
        : {
            id: candidate.id,
            fullName: candidate.fullName,
            handle: candidate.handle,
            affiliation: candidate.affiliation,
          },
      issuer: proofCardData.issuer,
      cryptographicSignature: proofCardData.cryptographicSignature,
      skillsVerified: challenge.skills || ['Python', 'Debugging'],
      verificationUrl: proofCardData.shareableUrl,
      verifiedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(proofExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proof_of_skill_${proofCardData.credentialId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Cryptographic Evidence Proof JSON downloaded.', 'success');
  };

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

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="Print-friendly certificate report"
          >
            <Printer className="w-3.5 h-3.5 text-[#3569A8] dark:text-[#80B9F5]" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleDownloadProof}
            className="px-3 py-2 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="Download verified JSON record"
          >
            <Download className="w-3.5 h-3.5 text-[#3569A8] dark:text-[#80B9F5]" />
            <span>Export JSON</span>
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
      <div className="p-5 rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-xs space-y-3 print:hidden">
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
                {privacySettings.anonymizedCandidate ? 'Name masked (#8842)' : `Display ${candidate.fullName}`}
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

          {/* Notes Toggle */}
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
              <span className="font-bold block text-[#172B4D] dark:text-[#F0F5FC]">Show Defense Notes</span>
              <span className="text-[11px] text-[#4D607B] dark:text-[#B1C2D8] block mt-0.5">
                {privacySettings.showCandidateNotes ? 'Diagnosis notes visible' : 'Diagnosis notes hidden'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Evidence Card: Premium Proof Certificate */}
      <article
        aria-labelledby="proof-title"
        className="rounded-2xl border-2 border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] shadow-md overflow-hidden transition-colors"
      >
        {/* Certificate Header Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-[#D7E5F7] via-[#F8FAFE] to-[#D7E5F7] dark:from-[#1B293D] dark:via-[#22334A] dark:to-[#1B293D] border-b border-[#CBD9EB] dark:border-[#34465F] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#3569A8] text-white flex items-center justify-center font-bold shadow-md shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#3569A8] dark:text-[#80B9F5] uppercase tracking-wider">
                <span>Verified Assessment Credential</span>
                <span>·</span>
                <span className="text-[#237A57] dark:text-[#78C9A4]">Demonstrated with Evidence</span>
              </div>
              <h2 id="proof-title" className="text-xl sm:text-2xl font-bold text-[#172B4D] dark:text-[#F0F5FC] mt-0.5">
                {challenge.title}
              </h2>
              <span className="text-xs text-[#4D607B] dark:text-[#B1C2D8] font-mono">
                Candidate: {displayName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              onClick={() => copyToClipboard(proofCardData.shareableUrl, 'Public verification URL copied')}
              className="px-4 py-2 rounded-lg bg-[#3569A8] hover:bg-[#28558D] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Proof URL</span>
            </button>
          </div>
        </div>

        {/* Demonstrated Skills Chips */}
        <div className="p-6 sm:p-8 border-b border-[#CBD9EB] dark:border-[#34465F] space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#172B4D] dark:text-[#F0F5FC] font-mono flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#3569A8] dark:text-[#80B9F5]" />
            <span>Demonstrated Engineering Competencies</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {(challenge.skills || ['Python 3.12', 'State Machine Invariants', 'Sliding Window Rate Limiting', 'Regression Testing']).map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full text-xs font-medium bg-[#D7E5F7] dark:bg-[#233D5C] text-[#3569A8] dark:text-[#80B9F5] border border-[#3569A8]/30 dark:border-[#80B9F5]/30 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#237A57] dark:text-[#78C9A4]" />
                <span>{skill}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Cryptographic Signature Verification Box */}
        <div className="p-6 sm:p-8 border-b border-[#CBD9EB] dark:border-[#34465F] space-y-3 bg-[#DCE7F5]/30 dark:bg-[#111B2B]/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#172B4D] dark:text-[#F0F5FC] uppercase tracking-wider font-mono">
              <Key className="w-4 h-4 text-[#3569A8] dark:text-[#80B9F5]" />
              <span>Cryptographic Signature Proof (Ed25519)</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-[#E3F5EC] dark:bg-[#163327] text-[#237A57] dark:text-[#78C9A4]">
              <CheckCircle2 className="w-3 h-3" />
              AUTHENTIC RECORD
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#FFFFFF] dark:bg-[#111B2B] border border-[#CBD9EB] dark:border-[#34465F]">
              <span className="text-[10px] uppercase text-[#64748B] dark:text-[#9AACC3] block">Key ID:</span>
              <span className="font-bold text-[#172B4D] dark:text-[#F0F5FC] truncate block">
                {proofCardData.cryptographicSignature.keyFingerprint || 'pos_server_ed25519_v1'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#FFFFFF] dark:bg-[#111B2B] border border-[#CBD9EB] dark:border-[#34465F]">
              <span className="text-[10px] uppercase text-[#64748B] dark:text-[#9AACC3] block">Signed Timestamp:</span>
              <span className="font-bold text-[#172B4D] dark:text-[#F0F5FC] truncate block">
                {proofCardData.issuedAt}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0D1520] text-[#E6EFFD] font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed border border-[#203046]">
            <span className="text-[#9AACC3] text-[10px] uppercase block mb-0.5">Signature Hex:</span>
            {proofCardData.cryptographicSignature.signatureHex}
          </div>
        </div>

        {/* Tabbed Inspection Section */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-[#CBD9EB] dark:border-[#34465F] pb-2">
            <div className="flex items-center gap-2 text-xs font-mono">
              <button
                onClick={() => setActiveTab('evidence')}
                className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'evidence'
                    ? 'bg-[#FFFFFF] dark:bg-[#263952] text-[#172B4D] dark:text-[#F0F5FC] shadow-xs font-semibold'
                    : 'text-[#4D607B] dark:text-[#B1C2D8] hover:text-[#172B4D]'
                }`}
              >
                Candidate Defense Notes
              </button>
              <button
                onClick={() => setActiveTab('diff')}
                className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'diff'
                    ? 'bg-[#FFFFFF] dark:bg-[#263952] text-[#172B4D] dark:text-[#F0F5FC] shadow-xs font-semibold'
                    : 'text-[#4D607B] dark:text-[#B1C2D8] hover:text-[#172B4D]'
                }`}
              >
                Code Patch Diff
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
                  <span>Candidate-Authored Test Suite</span>
                  <span className="text-[#78C9A4] font-semibold">Passed in Sandbox</span>
                </div>
                <pre className="overflow-x-auto whitespace-pre leading-relaxed text-[#B1C2D8] pt-1">
                  <code>{challenge.referenceRegressionTest || sampleCandidateSubmission.regressionTest}</code>
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
            <span>Ed25519 Cryptographic Authenticity Record</span>
          </div>
        </div>
      </article>
    </div>
  );
};
