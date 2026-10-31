import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  User,
  ShieldCheck,
  Award,
  Lock,
  Mail,
  Briefcase,
  GraduationCap,
  Sparkles,
  Layers,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const ProfileModal: React.FC = () => {
  const {
    isProfileModalOpen,
    setIsProfileModalOpen,
    candidate,
    updateProfileInfo,
    privacySettings,
    updatePrivacySettings,
    progressData,
    addToast,
  } = useApp();

  const [fullName, setFullName] = useState(candidate.fullName);
  const [handle, setHandle] = useState(candidate.handle);
  const [targetRole, setTargetRole] = useState(candidate.targetRole);
  const [affiliation, setAffiliation] = useState(candidate.affiliation);
  const [bio, setBio] = useState(
    progressData?.candidateProfile?.bio ||
      'Dedicated backend engineer focused on algorithmic correctness and test reliability.'
  );

  const [anonymized, setAnonymized] = useState(privacySettings.anonymizedCandidate);
  const [showCodeDiff, setShowCodeDiff] = useState(privacySettings.showFullCodeDiff);
  const [showNotes, setShowNotes] = useState(privacySettings.showCandidateNotes);
  const [isSaving, setIsSaving] = useState(false);

  if (!isProfileModalOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfileInfo({
        fullName,
        handle,
        targetRole,
        affiliation,
        bio,
      });
      updatePrivacySettings({
        anonymizedCandidate: anonymized,
        showFullCodeDiff: showCodeDiff,
        showCandidateNotes: showNotes,
      });
      addToast('Profile & privacy settings saved successfully.', 'success');
      setIsProfileModalOpen(false);
    } catch {
      addToast('Failed to save settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs transition-opacity"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-2xl p-6 sm:p-8 space-y-6 text-[#172B4D] dark:text-[#F0F5FC]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#CBD9EB] dark:border-[#34465F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D7E5F7] dark:bg-[#233D5C] text-[#3569A8] dark:text-[#80B9F5] flex items-center justify-center font-bold text-base shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 id="profile-modal-title" className="text-xl font-bold tracking-tight">
                Candidate Profile & Settings
              </h2>
              <p className="text-xs text-[#4D607B] dark:text-[#B1C2D8] font-mono">
                Manage personal profile details, target roles, and privacy exports
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="p-2 rounded-lg text-[#4D607B] hover:text-[#172B4D] dark:text-[#B1C2D8] dark:hover:text-[#F0F5FC] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* Identity Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#3569A8] dark:text-[#80B9F5] font-mono flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Personal Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] text-[#172B4D] dark:text-[#F0F5FC] focus:outline-none focus:ring-2 focus:ring-[#3569A8] dark:focus:ring-[#80B9F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] mb-1">
                  Handle / Username
                </label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] text-[#172B4D] dark:text-[#F0F5FC] focus:outline-none focus:ring-2 focus:ring-[#3569A8] dark:focus:ring-[#80B9F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] mb-1">
                  Target Engineering Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] text-[#172B4D] dark:text-[#F0F5FC] focus:outline-none focus:ring-2 focus:ring-[#3569A8] dark:focus:ring-[#80B9F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] mb-1">
                  School / Affiliation
                </label>
                <input
                  type="text"
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] text-[#172B4D] dark:text-[#F0F5FC] focus:outline-none focus:ring-2 focus:ring-[#3569A8] dark:focus:ring-[#80B9F5]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] mb-1">
                Bio & Technical Focus
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] text-[#172B4D] dark:text-[#F0F5FC] focus:outline-none focus:ring-2 focus:ring-[#3569A8] dark:focus:ring-[#80B9F5]"
              />
            </div>
          </div>

          {/* Privacy & Blind Screening */}
          <div className="space-y-3 pt-3 border-t border-[#CBD9EB] dark:border-[#34465F]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#3569A8] dark:text-[#80B9F5] font-mono flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Public Verification & Privacy Controls</span>
            </h3>

            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] cursor-pointer hover:bg-[#DCE7F5]/50 dark:hover:bg-[#22334A]/50 transition-colors">
                <input
                  type="checkbox"
                  checked={anonymized}
                  onChange={(e) => setAnonymized(e.target.checked)}
                  className="mt-0.5 rounded text-[#3569A8] focus:ring-[#3569A8]"
                />
                <div>
                  <span className="text-xs font-semibold block">Blind Screening Mode</span>
                  <span className="text-[11px] text-[#4D607B] dark:text-[#B1C2D8] block">
                    Mask name and photo on public proof cards (displays as &ldquo;Candidate #8842&rdquo; to reduce hiring bias).
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] cursor-pointer hover:bg-[#DCE7F5]/50 dark:hover:bg-[#22334A]/50 transition-colors">
                <input
                  type="checkbox"
                  checked={showCodeDiff}
                  onChange={(e) => setShowCodeDiff(e.target.checked)}
                  className="mt-0.5 rounded text-[#3569A8] focus:ring-[#3569A8]"
                />
                <div>
                  <span className="text-xs font-semibold block">Share Code Diffs with Evaluators</span>
                  <span className="text-[11px] text-[#4D607B] dark:text-[#B1C2D8] block">
                    Allow authorized recruiters to inspect side-by-side patch diffs and regression tests.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] cursor-pointer hover:bg-[#DCE7F5]/50 dark:hover:bg-[#22334A]/50 transition-colors">
                <input
                  type="checkbox"
                  checked={showNotes}
                  onChange={(e) => setShowNotes(e.target.checked)}
                  className="mt-0.5 rounded text-[#3569A8] focus:ring-[#3569A8]"
                />
                <div>
                  <span className="text-xs font-semibold block">Include Problem Diagnosis & Defense Notes</span>
                  <span className="text-[11px] text-[#4D607B] dark:text-[#B1C2D8] block">
                    Publish your root cause analysis and complexity rationale on shared evidence reports.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Gamification Badges Preview */}
          {progressData?.badges && progressData.badges.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-[#CBD9EB] dark:border-[#34465F]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#3569A8] dark:text-[#80B9F5] font-mono flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Earned Skill Badges ({progressData.badges.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {progressData.badges.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-lg bg-[#D7E5F7]/40 dark:bg-[#233D5C]/40 border border-[#3569A8]/20 dark:border-[#80B9F5]/20 flex items-center gap-2.5"
                  >
                    <div className="w-8 h-8 rounded-md bg-[#3569A8] dark:bg-[#80B9F5] text-white dark:text-[#111B2B] flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold truncate block">{b.name}</span>
                      <span className="text-[10px] text-[#4D607B] dark:text-[#B1C2D8] line-clamp-1">
                        {b.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#CBD9EB] dark:border-[#34465F]">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] text-xs font-medium hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-[#3569A8] hover:bg-[#28558D] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
