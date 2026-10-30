import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VerificationState } from '../types';
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
  } = useApp();

  const [isVerifying, setIsVerifying] = useState(false);

  const simulateReverification = () => {
    setIsVerifying(true);
    addToast('Contacting public key registry (Simulated)...', 'info');
    setTimeout(() => {
      setIsVerifying(false);
      addToast(`Status verified: ${verificationStateLabels[verificationState].badge}`, 'info');
    }, 700);
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
      title: 'Valid Signature & Active Credential',
      badge: 'Verified (Simulated Demonstration)',
      color: 'green',
      icon: ShieldCheck,
      message:
        'The cryptographic signature matches the public key of the issuer. The credential payload has not been altered since issuance and remains active.',
      technicalDetail:
        'Simulated Ed25519 verification: Payload SHA-256 digest matches signed manifest against mock authority public key.',
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
        'Computed digest (sha256:9f2d1e...) differs from signed claim (sha256:4c8b67...). Content integrity compromise detected.',
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
        'Signing key ID "key_unregistered_9921" is absent from the trusted authority federation list.',
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
        'Simulated HTTP 503 Service Unavailable when querying authority responder.',
      isPositive: false,
    },
    malformed: {
      title: 'Incomplete or Missing Proof Data',
      badge: 'Malformed Payload',
      color: 'rose',
      icon: FileX,
      message:
        'The credential payload is missing mandatory cryptographic fields (e.g. challenge version digest or timestamp).',
      technicalDetail:
        'Schema validation error: Missing required property "signedPayloadDigest".',
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
            <span>Credential Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172B4D] dark:text-[#F0F5FC] mt-0.5">
            Public Proof Inspector & Verification
          </h1>
        </div>

        <button
          onClick={() => setScreen('proof')}
          className="px-4 py-2 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
        >
          &larr; Back to Proof Card
        </button>
      </div>

      {/* Reviewer Simulation Harness */}
      <div className="p-5 rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-bold text-[#172B4D] dark:text-[#F0F5FC] uppercase tracking-wider font-mono">
              Reviewer Test Harness: Simulate Verification States
            </h2>
            <p className="text-xs text-[#4D607B] dark:text-[#B1C2D8]">
              Select any of the 6 prototype states to observe reviewer feedback:
            </p>
          </div>

          <button
            onClick={simulateReverification}
            disabled={isVerifying}
            className="px-3.5 py-1.5 rounded-lg bg-[#3569A8] hover:bg-[#28558D] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>Re-verify</span>
          </button>
        </div>

        {/* 6 Clean State Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {(
            [
              'valid',
              'tampered',
              'revoked',
              'untrusted_key',
              'service_unavailable',
              'malformed',
            ] as VerificationState[]
          ).map((stateKey) => {
            const isSelected = verificationState === stateKey;
            return (
              <button
                key={stateKey}
                onClick={() => {
                  setVerificationState(stateKey);
                  addToast(`Simulated status: ${stateKey.replace('_', ' ')}`, 'info');
                }}
                className={`p-2.5 rounded-lg text-left text-xs transition-colors cursor-pointer border ${
                  isSelected
                    ? 'border-[#3569A8] dark:border-[#80B9F5] bg-[#D7E5F7] dark:bg-[#233D5C] text-[#172B4D] dark:text-[#F0F5FC] font-bold shadow-xs'
                    : 'border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] text-[#4D607B] dark:text-[#B1C2D8] hover:border-[#3569A8]/40'
                }`}
              >
                <span className="truncate block text-[11px] capitalize">
                  {stateKey.replace('_', ' ')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Verification Status Card */}
      <div
        className={`p-6 sm:p-7 rounded-xl border transition-colors ${
          currentStatus.isPositive
            ? 'border-[#237A57]/40 dark:border-[#78C9A4]/40 bg-[#E3F5EC] dark:bg-[#163327]'
            : currentStatus.color === 'amber'
            ? 'border-[#94621B]/40 dark:border-[#F0C477]/40 bg-[#FEF7EC] dark:bg-[#352A18]'
            : 'border-[#B93838]/40 dark:border-[#F29A9A]/40 bg-[#FDF1F0] dark:bg-[#381E1E]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#CBD9EB] dark:border-[#34465F]">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                currentStatus.isPositive
                  ? 'bg-[#237A57] text-white shadow-xs'
                  : currentStatus.color === 'amber'
                  ? 'bg-[#94621B] text-white shadow-xs'
                  : 'bg-[#B93838] text-white shadow-xs'
              }`}
            >
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span
                  className={`font-bold uppercase tracking-wider ${
                    currentStatus.isPositive
                      ? 'text-[#237A57] dark:text-[#78C9A4]'
                      : currentStatus.color === 'amber'
                      ? 'text-[#94621B] dark:text-[#F0C477]'
                      : 'text-[#B93838] dark:text-[#F29A9A]'
                  }`}
                >
                  {currentStatus.badge}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#172B4D] dark:text-[#F0F5FC] mt-0.5">
                {currentStatus.title}
              </h2>
            </div>
          </div>

          <span className="text-xs font-mono text-[#4D607B] dark:text-[#B1C2D8] self-start sm:self-auto">
            ID: {proofCardData.credentialId}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-[#172B4D] dark:text-[#F0F5FC] leading-relaxed mt-4">
          {currentStatus.message}
        </p>

        {/* Technical Detail Log Box */}
        <div className="mt-4 p-3.5 rounded-lg bg-[#0D1520] text-[#E6EFFD] font-mono text-xs space-y-1 border border-[#203046]">
          <span className="text-[10px] text-[#9AACC3] uppercase tracking-wider block font-bold">
            Verification Diagnostics:
          </span>
          <p
            className={`text-[11px] leading-relaxed ${
              currentStatus.isPositive
                ? 'text-[#78C9A4]'
                : currentStatus.color === 'amber'
                ? 'text-[#F0C477]'
                : 'text-[#F29A9A]'
            }`}
          >
            {currentStatus.technicalDetail}
          </p>
        </div>
      </div>

      {/* Reviewer Document Record Details */}
      <article className="rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] p-6 sm:p-7 space-y-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#CBD9EB] dark:border-[#34465F]">
          <h3 className="text-xs font-bold text-[#172B4D] dark:text-[#F0F5FC] uppercase tracking-wider font-mono">
            Candidate & Assessment Identity
          </h3>
          <span className="text-xs text-[#4D607B] dark:text-[#B1C2D8] font-mono">
            Issued {proofCardData.issuedAt.split('T')[0]}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-lg bg-[#FFFFFF] dark:bg-[#111B2B] border border-[#CBD9EB] dark:border-[#34465F]">
            <span className="text-[#4D607B] dark:text-[#B1C2D8] block text-[11px]">Candidate</span>
            <span className="font-bold text-[#172B4D] dark:text-[#F0F5FC] mt-0.5 block text-sm">
              {displayName}
            </span>
          </div>
          <div className="p-3.5 rounded-lg bg-[#FFFFFF] dark:bg-[#111B2B] border border-[#CBD9EB] dark:border-[#34465F]">
            <span className="text-[#4D607B] dark:text-[#B1C2D8] block text-[11px]">Challenge</span>
            <span className="font-semibold text-[#172B4D] dark:text-[#F0F5FC] mt-0.5 block">
              {challenge.title}
            </span>
          </div>
          <div className="p-3.5 rounded-lg bg-[#FFFFFF] dark:bg-[#111B2B] border border-[#CBD9EB] dark:border-[#34465F]">
            <span className="text-[#4D607B] dark:text-[#B1C2D8] block text-[11px]">Rubric Specification</span>
            <span className="font-semibold text-[#172B4D] dark:text-[#F0F5FC] mt-0.5 block">
              {proofCardData.rubricId} v{proofCardData.rubricVersion}
            </span>
          </div>
          <div className="p-3.5 rounded-lg bg-[#FFFFFF] dark:bg-[#111B2B] border border-[#CBD9EB] dark:border-[#34465F]">
            <span className="text-[#4D607B] dark:text-[#B1C2D8] block text-[11px]">Authority</span>
            <span className="font-semibold text-[#172B4D] dark:text-[#F0F5FC] mt-0.5 block">
              {proofCardData.issuer.name}
            </span>
          </div>
        </div>

        {/* Cryptographic Manifest Parameters */}
        <div className="p-4 rounded-lg bg-[#FFFFFF] dark:bg-[#111B2B] border border-[#CBD9EB] dark:border-[#34465F] font-mono text-xs space-y-2 text-[#4D607B] dark:text-[#B1C2D8]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-[#4D607B] dark:text-[#B1C2D8]">Signature Algorithm:</span>
            <span className="text-[#172B4D] dark:text-[#F0F5FC] font-medium">
              {proofCardData.cryptographicSignature.algorithm}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-[#4D607B] dark:text-[#B1C2D8]">Key Fingerprint:</span>
            <span className="text-[#172B4D] dark:text-[#F0F5FC] truncate max-w-sm">
              {proofCardData.cryptographicSignature.keyFingerprint}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-[#4D607B] dark:text-[#B1C2D8]">Signed Digest:</span>
            <span className="text-[#172B4D] dark:text-[#F0F5FC] truncate max-w-sm">
              {proofCardData.cryptographicSignature.signedPayloadDigest}
            </span>
          </div>
        </div>

        {/* Evidence Scope Boundaries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-lg bg-[#E3F5EC]/70 dark:bg-[#163327]/60 border border-[#A3D9C0] dark:border-[#245740] text-xs space-y-2">
            <span className="font-bold text-[#237A57] dark:text-[#78C9A4] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#237A57] dark:text-[#78C9A4]" />
              <span>What This Record Establishes</span>
            </span>
            <ul className="space-y-1.5 text-[#172B4D] dark:text-[#F0F5FC] list-disc list-inside text-[11px] leading-relaxed">
              <li>Candidate completed the challenge under timed conditions.</li>
              <li>Visible unit tests and sandbox edge cases passed.</li>
              <li>A regression test was authored reproducing the defect.</li>
              <li>Root-cause explanation satisfies Rubric v1.4 criteria.</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-[#FFFFFF] dark:bg-[#111B2B] border border-[#CBD9EB] dark:border-[#34465F] text-xs space-y-2">
            <span className="font-bold text-[#172B4D] dark:text-[#F0F5FC] flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#4D607B] dark:text-[#B1C2D8]" />
              <span>What This Record Does Not Establish</span>
            </span>
            <ul className="space-y-1.5 text-[#4D607B] dark:text-[#B1C2D8] list-disc list-inside text-[11px] leading-relaxed">
              <li>Does not verify identity outside the browser session.</li>
              <li>Does not guarantee unassisted work beyond sandbox bounds.</li>
              <li>Does not predict general on-the-job engineering performance.</li>
            </ul>
          </div>
        </div>
      </article>
    </div>
  );
};
