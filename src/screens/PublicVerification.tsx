import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { VerificationState } from '../types';
import { verifyCredentialViaApi, fetchEvaluatorCandidates } from '../services/api/platformClient';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  RefreshCw,
  FileX,
  Server,
  CheckCircle2,
  Info,
  Search,
  Users,
  Award,
  Layers,
  ArrowRight,
  ExternalLink,
  Lock,
  Filter,
} from 'lucide-react';

export const PublicVerification: React.FC = () => {
  const {
    proofCardData,
    challenge,
    candidate,
    privacySettings,
    verificationState,
    setVerificationState,
    addToast,
    setScreen,
    copyToClipboard,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'verify' | 'evaluator'>('verify');
  const [searchId, setSearchId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Evaluator directory states
  const [evaluatorSkillFilter, setEvaluatorSkillFilter] = useState('');
  const [candidatesList, setCandidatesList] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Read ?credentialId=... query parameter from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paramId = urlParams.get('credentialId');
    if (paramId) {
      setSearchId(paramId);
      performBackendVerification(paramId);
    }
  }, []);

  // Load evaluator candidates when switching to evaluator tab
  useEffect(() => {
    if (activeTab === 'evaluator') {
      loadEvaluatorDirectory(evaluatorSkillFilter);
    }
  }, [activeTab, evaluatorSkillFilter]);

  const loadEvaluatorDirectory = async (skill?: string) => {
    setLoadingCandidates(true);
    try {
      const data = await fetchEvaluatorCandidates(skill || undefined);
      setCandidatesList(data);
    } catch {
      // fallback
    } finally {
      setLoadingCandidates(false);
    }
  };

  const performBackendVerification = async (idToVerify?: string) => {
    const targetId = (idToVerify || searchId || proofCardData.credentialId).trim();
    if (!targetId) {
      addToast('Please enter a valid Credential or Evidence ID', 'warning');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await verifyCredentialViaApi(targetId);
      setVerificationResult(res);

      if (res.valid) {
        setVerificationState('valid');
        addToast(`Credential '${targetId}' verified successfully via Ed25519 signature!`, 'success');
      } else if (res.state === 'not_found') {
        setVerificationState('malformed');
        addToast(`Credential '${targetId}' not found in verification registry.`, 'error');
      } else {
        setVerificationState('tampered');
        addToast('Verification failed: signature mismatch or tampered payload.', 'error');
      }
    } catch {
      setVerificationState('service_unavailable');
      addToast('Verification service temporarily unreachable.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const displayName = privacySettings.anonymizedCandidate
    ? 'Candidate #8842 (Blind Screening Mode)'
    : candidate.fullName;

  const verificationStateLabels: Record<
    VerificationState,
    {
      title: string;
      badge: string;
      color: 'green' | 'amber' | 'rose';
      icon: React.ElementType;
      message: string;
      technicalDetail: string;
      isPositive: boolean;
    }
  > = {
    valid: {
      title: 'Valid Signature & Authentic Credential',
      badge: 'Verified (Ed25519 Signature Match)',
      color: 'green',
      icon: ShieldCheck,
      message:
        'The cryptographic signature matches the public key of the issuer. The credential payload has not been altered since issuance and remains active.',
      technicalDetail:
        'Server Ed25519 verification: Canonical JSON SHA-256 digest verified against issuer authority public key.',
      isPositive: true,
    },
    tampered: {
      title: 'Invalid Signature / Modified Signed Data',
      badge: 'Signature Mismatch (Tamper Detected)',
      color: 'rose',
      icon: ShieldAlert,
      message:
        'Verification failed. The hash of the presented payload does not match the signed manifest, indicating the evidence record was modified after issuance.',
      technicalDetail:
        'Computed digest differs from signed claim. Content integrity compromise detected.',
      isPositive: false,
    },
    revoked: {
      title: 'Revoked Credential',
      badge: 'Credential Revoked',
      color: 'rose',
      icon: ShieldX,
      message:
        'This credential was formally revoked by the issuing authority or candidate. It should no longer be relied upon for hiring evaluation.',
      technicalDetail:
        'Revocation directory check: Record status REVOKED on 2026-10-25T14:10:00Z (Candidate privacy withdrawal).',
      isPositive: false,
    },
    untrusted_key: {
      title: 'Unknown or Untrusted Signing Key',
      badge: 'Untrusted Root Authority',
      color: 'amber',
      icon: AlertTriangle,
      message:
        'The signature was produced by a key not present in the Proof of Skill trusted authority registry. Authenticity cannot be confirmed.',
      technicalDetail:
        'Signing key ID is absent from the trusted authority federation list.',
      isPositive: false,
    },
    service_unavailable: {
      title: 'Verification Service Unavailable',
      badge: 'Directory Offline',
      color: 'amber',
      icon: Server,
      message:
        'Unable to query the revocation directory or certificate transparency registry. Please retry shortly.',
      technicalDetail:
        'HTTP 503 Service Unavailable when querying authority responder.',
      isPositive: false,
    },
    malformed: {
      title: 'Credential Not Found in Registry',
      badge: 'Record Not Found',
      color: 'rose',
      icon: FileX,
      message:
        'The requested credential ID was not located in the verified authority database.',
      technicalDetail:
        'Database lookup returned null for presented identifier.',
      isPositive: false,
    },
  };

  const currentStatus = verificationStateLabels[verificationState];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Reviewer Portal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#CBD9EB] dark:border-[#34465F]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#4D607B] dark:text-[#B1C2D8] font-mono">
            <span>Independent Reviewer Portal</span>
            <span>·</span>
            <span>Cryptographic Verification & Talent Evaluation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172B4D] dark:text-[#F0F5FC] mt-0.5">
            Public Proof Inspector & Evaluator Directory
          </h1>
        </div>

        <button
          onClick={() => setScreen('proof')}
          className="px-4 py-2 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
        >
          &larr; Back to Proof Card
        </button>
      </div>

      {/* Navigation Segments: Verify by ID vs Recruiter Directory */}
      <div className="flex border-b border-[#CBD9EB] dark:border-[#34465F] bg-[#DCE7F5] dark:bg-[#111B2B] p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('verify')}
          className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'verify'
              ? 'bg-[#FFFFFF] dark:bg-[#263952] text-[#172B4D] dark:text-[#F0F5FC] shadow-xs'
              : 'text-[#4D607B] hover:text-[#172B4D] dark:text-[#B1C2D8] dark:hover:text-[#F0F5FC]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#3569A8] dark:text-[#80B9F5]" />
          <span>Verify Credential by ID</span>
        </button>

        <button
          onClick={() => setActiveTab('evaluator')}
          className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'evaluator'
              ? 'bg-[#FFFFFF] dark:bg-[#263952] text-[#172B4D] dark:text-[#F0F5FC] shadow-xs'
              : 'text-[#4D607B] hover:text-[#172B4D] dark:text-[#B1C2D8] dark:hover:text-[#F0F5FC]'
          }`}
        >
          <Users className="w-4 h-4 text-[#3569A8] dark:text-[#80B9F5]" />
          <span>Recruiter / Evaluator Search</span>
        </button>
      </div>

      {/* TAB 1: VERIFY CREDENTIAL BY ID */}
      {activeTab === 'verify' && (
        <div className="space-y-6">
          {/* Interactive Credential ID Lookup Input */}
          <div className="p-5 rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-xs space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#172B4D] dark:text-[#F0F5FC] font-mono">
              Enter Credential Identifier to Verify
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4D607B] dark:text-[#B1C2D8]" />
                <input
                  type="text"
                  placeholder="e.g. cred_9a4f8e21c08b472e"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs font-mono rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] text-[#172B4D] dark:text-[#F0F5FC] focus:outline-none focus:ring-2 focus:ring-[#3569A8]"
                />
              </div>

              <button
                onClick={() => performBackendVerification()}
                disabled={isVerifying}
                className="px-5 py-2.5 rounded-lg bg-[#3569A8] hover:bg-[#28558D] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verify with Server</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#4D607B] dark:text-[#B1C2D8] font-mono pt-1">
              <span>Current Evidence ID: {proofCardData.credentialId}</span>
              <button
                type="button"
                onClick={() => {
                  setSearchId(proofCardData.credentialId);
                  performBackendVerification(proofCardData.credentialId);
                }}
                className="text-[#3569A8] dark:text-[#80B9F5] underline hover:no-underline cursor-pointer"
              >
                Load Active Record
              </button>
            </div>
          </div>

          {/* Primary Verification Result Hero Box */}
          <div
            className={`p-6 sm:p-8 rounded-2xl border-2 shadow-sm space-y-4 transition-colors ${
              currentStatus.color === 'green'
                ? 'border-[#237A57] bg-[#E3F5EC] dark:bg-[#163327]'
                : currentStatus.color === 'amber'
                ? 'border-[#94621B] bg-[#FEF3D6] dark:bg-[#3E2D11]'
                : 'border-[#C23934] bg-[#FBE8E8] dark:bg-[#381E1E]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
                    currentStatus.color === 'green'
                      ? 'bg-[#237A57]'
                      : currentStatus.color === 'amber'
                      ? 'bg-[#94621B]'
                      : 'bg-[#C23934]'
                  }`}
                >
                  <StatusIcon className="w-5 h-5" />
                </div>
                <div>
                  <span
                    className={`text-[10px] font-mono uppercase font-bold tracking-wider block ${
                      currentStatus.color === 'green'
                        ? 'text-[#237A57] dark:text-[#78C9A4]'
                        : currentStatus.color === 'amber'
                        ? 'text-[#94621B] dark:text-[#F0C477]'
                        : 'text-[#C23934] dark:text-[#F29A9A]'
                    }`}
                  >
                    Verification Result
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172B4D] dark:text-[#F0F5FC]">
                    {currentStatus.title}
                  </h2>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold shrink-0 self-start sm:self-auto ${
                  currentStatus.color === 'green'
                    ? 'bg-[#237A57] text-white'
                    : currentStatus.color === 'amber'
                    ? 'bg-[#94621B] text-white'
                    : 'bg-[#C23934] text-white'
                }`}
              >
                {currentStatus.badge}
              </span>
            </div>

            <p className="text-sm text-[#172B4D] dark:text-[#F0F5FC] leading-relaxed">
              {currentStatus.message}
            </p>

            {/* Technical Signature Inspection Output */}
            <div className="p-3.5 rounded-lg bg-[#0D1520] text-[#E6EFFD] font-mono text-xs space-y-1 border border-[#203046]">
              <span className="text-[#9AACC3] text-[10px] uppercase font-bold block">
                Cryptographic Trace Detail
              </span>
              <p className="text-[11px] text-[#B1C2D8] leading-relaxed">
                {currentStatus.technicalDetail}
              </p>
            </div>
          </div>

          {/* Credential Attributes */}
          <div className="rounded-xl border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#172B4D] dark:text-[#F0F5FC] font-mono">
              Verified Credential Manifest
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-lg bg-[#FFFFFF] dark:bg-[#111B2B] border border-[#CBD9EB] dark:border-[#34465F] space-y-1">
                <span className="text-[#4D607B] dark:text-[#B1C2D8] text-[10px] block">Candidate Identity</span>
                <span className="font-bold text-[#172B4D] dark:text-[#F0F5FC] block">{displayName}</span>
                {privacySettings.anonymizedCandidate && (
                  <span className="text-[10px] text-[#3569A8] dark:text-[#80B9F5] block">
                    (Blind Screening Mode Active)
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-lg bg-[#FFFFFF] dark:bg-[#111B2B] border border-[#CBD9EB] dark:border-[#34465F] space-y-1">
                <span className="text-[#4D607B] dark:text-[#B1C2D8] text-[10px] block">Challenge Evaluated</span>
                <span className="font-bold text-[#172B4D] dark:text-[#F0F5FC] block">
                  {challenge.title}
                </span>
                <span className="text-[10px] text-[#4D607B] dark:text-[#B1C2D8] block">
                  {challenge.code}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-[#FFFFFF] dark:bg-[#111B2B] border border-[#CBD9EB] dark:border-[#34465F] space-y-1">
                <span className="text-[#4D607B] dark:text-[#B1C2D8] text-[10px] block">Signing Algorithm</span>
                <span className="font-bold text-[#172B4D] dark:text-[#F0F5FC] block">Ed25519 (RFC 8032)</span>
                <span className="text-[10px] text-[#237A57] dark:text-[#78C9A4] block">Verified Asymmetric Proof</span>
              </div>

              <div className="p-3.5 rounded-lg bg-[#FFFFFF] dark:bg-[#111B2B] border border-[#CBD9EB] dark:border-[#34465F] space-y-1">
                <span className="text-[#4D607B] dark:text-[#B1C2D8] text-[10px] block">Issuing Authority</span>
                <span className="font-bold text-[#172B4D] dark:text-[#F0F5FC] block">Proof of Skill Authority</span>
                <span className="text-[10px] text-[#4D607B] dark:text-[#B1C2D8] block">{proofCardData.issuer.authorityId}</span>
              </div>
            </div>

            {/* Shareable URL Copy Action */}
            <div className="pt-3 border-t border-[#CBD9EB] dark:border-[#34465F] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-[#4D607B] dark:text-[#B1C2D8] font-mono">
                Shareable link for HR systems, recruiters & background checks
              </span>
              <button
                onClick={() =>
                  copyToClipboard(
                    `${window.location.origin}/?credentialId=${proofCardData.credentialId}`,
                    'Shareable verification URL copied'
                  )
                }
                className="px-4 py-2 rounded-lg bg-[#3569A8] hover:bg-[#28558D] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Copy Verification URL</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECRUITER / EVALUATOR TALENT DIRECTORY */}
      {activeTab === 'evaluator' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#172B4D] dark:text-[#F0F5FC]">
                  Verified Candidate Talent Search
                </h2>
                <p className="text-xs text-[#4D607B] dark:text-[#B1C2D8]">
                  Filter engineering candidates who have demonstrated empirical problem-solving skills in sandboxed evaluations.
                </p>
              </div>

              {/* Skill Filter Dropdown */}
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[#3569A8] dark:text-[#80B9F5]" />
                <select
                  value={evaluatorSkillFilter}
                  onChange={(e) => setEvaluatorSkillFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] text-[#172B4D] dark:text-[#F0F5FC] focus:outline-none focus:ring-2 focus:ring-[#3569A8]"
                >
                  <option value="">All Verified Skills</option>
                  <option value="Iteration">Iteration Invariants</option>
                  <option value="Regression">Regression Testing</option>
                  <option value="Boundary">Boundary Analysis</option>
                  <option value="Complexity">Algorithmic Complexity</option>
                </select>
              </div>
            </div>

            {/* Candidate Directory List */}
            {loadingCandidates ? (
              <div className="p-8 text-center text-xs text-[#4D607B] dark:text-[#B1C2D8] flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#3569A8]" />
                <span>Querying verified candidate registry...</span>
              </div>
            ) : candidatesList.length > 0 ? (
              <div className="divide-y divide-[#CBD9EB] dark:divide-[#34465F] rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] overflow-hidden">
                {candidatesList.map((cand) => (
                  <div key={cand.candidateId} className="p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#172B4D] dark:text-[#F0F5FC]">
                            {cand.displayName}
                          </span>
                          <span className="text-[11px] font-mono text-[#3569A8] dark:text-[#80B9F5]">
                            @{cand.handle}
                          </span>
                        </div>
                        <span className="text-xs text-[#4D607B] dark:text-[#B1C2D8]">
                          {cand.role} · {cand.affiliation}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="px-2 py-0.5 rounded bg-[#D7E5F7] dark:bg-[#233D5C] text-[#3569A8] dark:text-[#80B9F5] font-semibold">
                          {cand.totalPoints} pts
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#E3F5EC] dark:bg-[#163327] text-[#237A57] dark:text-[#78C9A4] font-semibold">
                          {cand.completedCount} Proofs
                        </span>
                      </div>
                    </div>

                    {/* Skills list */}
                    <div className="flex flex-wrap gap-1.5">
                      {cand.verifiedSkills.map((sk: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[11px] bg-[#DCE7F5] dark:bg-[#22334A] text-[#172B4D] dark:text-[#F0F5FC] border border-[#CBD9EB] dark:border-[#34465F]"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>

                    {/* Credentials List */}
                    <div className="pt-2 border-t border-[#CBD9EB]/40 dark:border-[#34465F]/40 space-y-1.5">
                      <span className="text-[10px] font-mono uppercase text-[#64748B] dark:text-[#9AACC3] block">
                        Verified Proof Credentials:
                      </span>
                      {cand.credentials.map((cred: any) => (
                        <div
                          key={cred.credentialId}
                          className="p-2.5 rounded-md bg-[#F8FAFE] dark:bg-[#1B293D] flex items-center justify-between text-xs font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#237A57] dark:text-[#78C9A4]" />
                            <span className="font-semibold text-[#172B4D] dark:text-[#F0F5FC]">
                              {cred.challengeTitle}
                            </span>
                            <span className="text-[10px] text-[#4D607B] dark:text-[#B1C2D8]">
                              ({cred.credentialId})
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setSearchId(cred.credentialId);
                              setActiveTab('verify');
                              performBackendVerification(cred.credentialId);
                            }}
                            className="px-2.5 py-1 rounded bg-[#3569A8] text-white text-[11px] font-semibold hover:bg-[#28558D] transition-colors cursor-pointer"
                          >
                            Verify Authenticity
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#4D607B] dark:text-[#B1C2D8] border border-dashed border-[#CBD9EB] dark:border-[#34465F] rounded-lg">
                No candidates found matching the selected skill criteria.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
