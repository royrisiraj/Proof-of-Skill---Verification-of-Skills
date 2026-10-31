import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { HeroIllustration } from '../components/HeroIllustration';
import { CompetencyVisualizer } from '../components/CompetencyVisualizer';
import { sampleHistoricalAssessments } from '../data/mockData';
import { AssessmentSession } from '../types';
import {
  restoreAssessmentSession,
  recoverAssessmentSession,
  startAssessmentSession,
  simulateSessionState,
} from '../services/api/sessionClient';
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
  Search,
  Filter,
  Flame,
  Zap,
  TrendingUp,
  RotateCcw,
  Loader2,
  AlertTriangle,
  AlertCircle,
  X,
  Info,
  RefreshCw,
} from 'lucide-react';

export const CandidateDashboard: React.FC = () => {
  const {
    candidate,
    isFirstTimeUser,
    setIsFirstTimeUser,
    setScreen,
    challenges,
    challenge,
    selectChallenge,
    progressData,
    copyToClipboard,
    resumeAssessmentSession,
    addToast,
  } = useApp();

  // Session restoration and modal states
  const [isRestoringSession, setIsRestoringSession] = useState(false);
  const [sessionModal, setSessionModal] = useState<{
    isOpen: boolean;
    type: 'expired_recoverable' | 'expired_permanent' | 'not_found' | 'already_completed' | 'network_error';
    session?: AssessmentSession;
    challengeData?: any;
    timeRemainingSeconds?: number;
    graceRemainingSeconds?: number;
    message?: string;
  }>({
    isOpen: false,
    type: 'not_found',
  });

  // Marketplace filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedSkill, setSelectedSkill] = useState<string>('All');

  // Filtered challenges
  const filteredChallenges = useMemo(() => {
    return challenges.filter((c) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.skills && c.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesDifficulty =
        selectedDifficulty === 'All' || c.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

      const matchesSkill =
        selectedSkill === 'All' ||
        (c.skills && c.skills.some((s) => s.toLowerCase() === selectedSkill.toLowerCase()));

      return matchesSearch && matchesDifficulty && matchesSkill;
    });
  }, [challenges, searchQuery, selectedDifficulty, selectedSkill]);

  const completedCount = progressData?.completedChallengeIds?.length ?? candidate.completedAssessments;
  const startedCount = progressData?.startedChallengeIds?.length ?? candidate.totalAssessments;
  const totalPoints = progressData?.points ?? 450;
  const streakDays = progressData?.streakDays ?? 4;
  const completionPercentage = Math.round((completedCount / Math.max(1, challenges.length)) * 100);

  // Determine status for a challenge
  const getChallengeStatus = (cId: string): 'Completed' | 'In Progress' | 'Not Started' => {
    if (progressData?.completedChallengeIds?.includes(cId)) return 'Completed';
    if (progressData?.startedChallengeIds?.includes(cId)) return 'In Progress';
    return 'Not Started';
  };

  // 1. Session Restoration Handler (for Continue Assessment button)
  const handleContinueAssessment = async () => {
    setIsRestoringSession(true);
    try {
      const response = await restoreAssessmentSession({ candidateId: candidate.id });

      if (response.status === 'restored') {
        resumeAssessmentSession(response);
      } else if (response.status === 'expired_recoverable') {
        setSessionModal({
          isOpen: true,
          type: 'expired_recoverable',
          session: response.session,
          challengeData: response.challenge,
          timeRemainingSeconds: response.timeRemainingSeconds ?? 0,
          graceRemainingSeconds: response.graceRemainingSeconds ?? 300,
          message: response.message,
        });
      } else if (response.status === 'expired_permanent') {
        setSessionModal({
          isOpen: true,
          type: 'expired_permanent',
          session: response.session,
          message: response.message,
        });
      } else if (response.status === 'already_completed') {
        setSessionModal({
          isOpen: true,
          type: 'already_completed',
          session: response.session,
          message: response.message,
        });
      } else if (response.status === 'not_found') {
        setSessionModal({
          isOpen: true,
          type: 'not_found',
          message: response.message || 'No active assessment found.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network failure during session restoration.';
      setSessionModal({
        isOpen: true,
        type: 'network_error',
        message: msg,
      });
    } finally {
      setIsRestoringSession(false);
    }
  };

  // 2. Session Recovery Handler (within 5-min grace window)
  const handleRecoverSession = async (sessionId: string) => {
    setIsRestoringSession(true);
    try {
      const res = await recoverAssessmentSession({
        sessionId,
        candidateId: candidate.id,
        extensionMinutes: 5,
      });
      if (res.status === 'restored') {
        setSessionModal((prev) => ({ ...prev, isOpen: false }));
        resumeAssessmentSession(res);
      } else {
        setSessionModal({
          isOpen: true,
          type: 'expired_permanent',
          session: res.session,
          message: res.message || 'Grace period expired. Session cannot be recovered.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Session recovery failed.';
      addToast(msg, 'error');
    } finally {
      setIsRestoringSession(false);
    }
  };

  // 3. Start Fresh Assessment Handler
  const handleStartFreshSession = async (challengeIdToStart: string) => {
    setIsRestoringSession(true);
    try {
      await startAssessmentSession({
        challengeId: challengeIdToStart,
        candidateId: candidate.id,
        forceRestart: true,
      });
      setSessionModal((prev) => ({ ...prev, isOpen: false }));
      const restored = await restoreAssessmentSession({ candidateId: candidate.id });
      resumeAssessmentSession(restored);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not start fresh session.';
      addToast(msg, 'error');
    } finally {
      setIsRestoringSession(false);
    }
  };

  // 4. Test State Simulation Helper
  const handleSimulateState = async (
    state: 'active' | 'expired_recoverable' | 'expired_permanent' | 'already_completed' | 'not_found'
  ) => {
    try {
      await simulateSessionState({ candidateId: candidate.id, challengeId: 'CH-4982', state });
      addToast(`Simulated assessment state: ${state}`, 'info');
      await handleContinueAssessment();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to simulate state.';
      addToast(msg, 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* 1. HERO SECTION: Engaging Two-Part Composition */}
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
                onClick={handleContinueAssessment}
                disabled={isRestoringSession}
                className="px-6 py-3.5 rounded-lg bg-[#3569A8] hover:bg-[#28558D] text-white font-semibold text-sm flex items-center gap-2.5 shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-[#3569A8] focus-visible:outline-none cursor-pointer disabled:opacity-80"
              >
                {isRestoringSession ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Code2 className="w-4 h-4" />
                )}
                <span>Continue Assessment ({challenge.title.split('&')[0].trim()})</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setScreen('verify')}
                className="px-5 py-3.5 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] text-[#172B4D] dark:text-[#F0F5FC] font-medium text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#3569A8] dark:text-[#80B9F5]" />
                <span>Reviewer Verification</span>
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
                Server-Authoritative Ed25519
              </span>
            </div>
          </div>

          {/* Right Column: Custom Interactive Hero Illustration */}
          <div className="lg:col-span-6">
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* 2. REAL CANDIDATE PROGRESS TRACKING METRICS */}
      {!isFirstTimeUser && (
        <section aria-labelledby="metrics-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2
              id="metrics-heading"
              className="text-xs font-bold uppercase tracking-wider text-[#4D607B] dark:text-[#B1C2D8] font-mono flex items-center gap-2"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#3569A8] dark:text-[#80B9F5]" />
              <span>Assessment Progress & Competencies</span>
            </h2>
            <span className="text-xs font-mono text-[#3569A8] dark:text-[#80B9F5] font-semibold">
              {completionPercentage}% Overall Completion
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Verified Proofs */}
            <div className="p-5 rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-xs flex items-center gap-4 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#D7E5F7] dark:bg-[#233D5C] border border-[#3569A8]/20 dark:border-[#80B9F5]/20 text-[#3569A8] dark:text-[#80B9F5] flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-bold tracking-tight text-[#172B4D] dark:text-[#F0F5FC] block">
                  {completedCount} / {challenges.length}
                </span>
                <span className="text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] block">
                  Completed Proofs
                </span>
                <span className="text-[11px] text-[#4D607B] dark:text-[#B1C2D8] block">
                  {startedCount} challenges in progress
                </span>
              </div>
            </div>

            {/* Metric 2: Earned Points */}
            <div className="p-5 rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-xs flex items-center gap-4 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#D7E5F7] dark:bg-[#233D5C] border border-[#3569A8]/20 dark:border-[#80B9F5]/20 text-[#3569A8] dark:text-[#80B9F5] flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-[#94621B] dark:text-[#F0C477]" />
              </div>
              <div>
                <span className="text-2xl font-bold tracking-tight text-[#172B4D] dark:text-[#F0F5FC] block">
                  {totalPoints} pts
                </span>
                <span className="text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] block">
                  Engineering Score
                </span>
                <span className="text-[11px] text-[#4D607B] dark:text-[#B1C2D8] block">
                  +150 pts per verified challenge
                </span>
              </div>
            </div>

            {/* Metric 3: Active Streak */}
            <div className="p-5 rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-xs flex items-center gap-4 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#E3F5EC] dark:bg-[#163327] border border-[#A3D9C0] dark:border-[#245740] text-[#237A57] dark:text-[#78C9A4] flex items-center justify-center shrink-0">
                <Flame className="w-6 h-6 text-[#237A57] dark:text-[#78C9A4]" />
              </div>
              <div>
                <span className="text-2xl font-bold tracking-tight text-[#237A57] dark:text-[#78C9A4] block">
                  {streakDays} Days
                </span>
                <span className="text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] block">
                  Solving Streak
                </span>
                <span className="text-[11px] text-[#4D607B] dark:text-[#B1C2D8] block">
                  Active learning continuity
                </span>
              </div>
            </div>

            {/* Metric 4: Credential Status */}
            <div className="p-5 rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-xs flex items-center gap-4 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#D7E5F7] dark:bg-[#233D5C] border border-[#3569A8]/20 dark:border-[#80B9F5]/20 text-[#3569A8] dark:text-[#80B9F5] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-[#3569A8] dark:text-[#80B9F5]" />
              </div>
              <div>
                <span className="text-2xl font-bold tracking-tight text-[#3569A8] dark:text-[#80B9F5] block">
                  Active
                </span>
                <span className="text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] block">
                  Public Standing
                </span>
                <span className="text-[11px] text-[#4D607B] dark:text-[#B1C2D8] block">
                  Authentic Ed25519 signatures
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. INTERACTIVE ASSESSMENT MARKETPLACE */}
      <section aria-labelledby="marketplace-heading" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3569A8] dark:text-[#80B9F5] font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Assessment Marketplace</span>
            </div>
            <h2 id="marketplace-heading" className="text-2xl font-bold tracking-tight text-[#172B4D] dark:text-[#F0F5FC] mt-1">
              Explore Available Engineering Challenges
            </h2>
            <p className="text-xs sm:text-sm text-[#4D607B] dark:text-[#B1C2D8] mt-1 max-w-2xl">
              Select any real-world defect scenario. Inspect live reproduction logs, implement non-mutating algorithms, and author authoritative regression tests.
            </p>
          </div>

          <div className="text-xs font-mono text-[#4D607B] dark:text-[#B1C2D8] self-start md:self-auto">
            Showing <span className="font-bold text-[#172B4D] dark:text-[#F0F5FC]">{filteredChallenges.length}</span> of {challenges.length} Challenges
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-4 rounded-xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4D607B] dark:text-[#B1C2D8]" />
              <input
                type="text"
                placeholder="Search challenges by title, domain, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#111B2B] text-[#172B4D] dark:text-[#F0F5FC] focus:outline-none focus:ring-2 focus:ring-[#3569A8] dark:focus:ring-[#80B9F5] transition-colors placeholder-[#64748B] dark:placeholder-[#9AACC3]"
              />
            </div>

            {/* Clear Filters Button if active */}
            {(searchQuery || selectedDifficulty !== 'All' || selectedSkill !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDifficulty('All');
                  setSelectedSkill('All');
                }}
                className="px-3 py-2 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] text-xs font-medium text-[#4D607B] dark:text-[#B1C2D8] hover:text-[#172B4D] dark:hover:text-[#F0F5FC] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Difficulty & Skill Tag Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#CBD9EB]/60 dark:border-[#34465F]/60">
            {/* Difficulty Segments */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono text-[#4D607B] dark:text-[#B1C2D8] mr-1">Difficulty:</span>
              {['All', 'Entry', 'Intermediate', 'Advanced'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedDifficulty(lvl)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedDifficulty === lvl
                      ? 'bg-[#3569A8] text-white shadow-xs font-semibold'
                      : 'bg-[#DCE7F5] dark:bg-[#22334A] text-[#4D607B] dark:text-[#B1C2D8] hover:text-[#172B4D] dark:hover:text-[#F0F5FC]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Skill Segments */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono text-[#4D607B] dark:text-[#B1C2D8] mr-1">Skill:</span>
              {['All', 'Algorithms', 'Debugging', 'Data Structures', 'Concurrency'].map((sk) => (
                <button
                  key={sk}
                  onClick={() => setSelectedSkill(sk)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedSkill === sk
                      ? 'bg-[#237A57] text-white shadow-xs font-semibold'
                      : 'bg-[#DCE7F5] dark:bg-[#22334A] text-[#4D607B] dark:text-[#B1C2D8] hover:text-[#172B4D] dark:hover:text-[#F0F5FC]'
                  }`}
                >
                  {sk}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Challenge Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges.map((c) => {
            const status = getChallengeStatus(c.id);
            const isSelected = challenge.id === c.id;

            return (
              <div
                key={c.id}
                className={`rounded-xl border bg-[#F8FAFE] dark:bg-[#1B293D] shadow-xs p-6 flex flex-col justify-between transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-[#3569A8] dark:border-[#80B9F5] ring-2 ring-[#3569A8]/20'
                    : 'border-[#CBD9EB] dark:border-[#34465F]'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                    <span
                      className={`px-2 py-0.5 rounded font-semibold ${
                        c.difficulty === 'Advanced'
                          ? 'bg-[#FBE8E8] dark:bg-[#381E1E] text-[#C23934] dark:text-[#F29A9A]'
                          : c.difficulty === 'Intermediate'
                          ? 'bg-[#D7E5F7] dark:bg-[#233D5C] text-[#3569A8] dark:text-[#80B9F5]'
                          : 'bg-[#E3F5EC] dark:bg-[#163327] text-[#237A57] dark:text-[#78C9A4]'
                      }`}
                    >
                      {c.difficulty}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded font-medium ${
                        status === 'Completed'
                          ? 'bg-[#E3F5EC] dark:bg-[#163327] text-[#237A57] dark:text-[#78C9A4]'
                          : status === 'In Progress'
                          ? 'bg-[#FEF3D6] dark:bg-[#3E2D11] text-[#94621B] dark:text-[#F0C477]'
                          : 'bg-[#DCE7F5] dark:bg-[#22334A] text-[#4D607B] dark:text-[#B1C2D8]'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  {/* Title & Domain */}
                  <div>
                    <span className="text-[11px] font-mono text-[#3569A8] dark:text-[#80B9F5] block font-medium">
                      {c.code} · {c.domain}
                    </span>
                    <h3 className="text-base font-bold text-[#172B4D] dark:text-[#F0F5FC] mt-0.5 leading-snug">
                      {c.title}
                    </h3>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-[#4D607B] dark:text-[#B1C2D8] leading-relaxed line-clamp-3">
                    {c.summary}
                  </p>

                  {/* Learning Objectives Preview */}
                  {c.learningObjectives && c.learningObjectives.length > 0 && (
                    <div className="pt-2 border-t border-[#CBD9EB]/60 dark:border-[#34465F]/60">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] dark:text-[#9AACC3] block mb-1">
                        Core Competency:
                      </span>
                      <p className="text-[11px] text-[#172B4D] dark:text-[#F0F5FC] flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-[#237A57] dark:text-[#78C9A4] shrink-0" />
                        <span className="truncate">{c.learningObjectives[0]}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-4 mt-4 border-t border-[#CBD9EB] dark:border-[#34465F] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[11px] font-mono text-[#4D607B] dark:text-[#B1C2D8]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{c.recommendedMinutes} min</span>
                  </div>

                  <button
                    onClick={() => selectChallenge(c.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                      status === 'Completed'
                        ? 'border border-[#CBD9EB] dark:border-[#34465F] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] text-[#172B4D] dark:text-[#F0F5FC]'
                        : 'bg-[#3569A8] hover:bg-[#28558D] text-white'
                    }`}
                  >
                    <span>{status === 'Completed' ? 'Review Solution' : status === 'In Progress' ? 'Continue' : 'Start Challenge'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. RECENT EVIDENCE TIMELINE OR EMPTY STATE */}
      <section aria-labelledby="recent-evidence-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            id="recent-evidence-heading"
            className="text-xs font-bold uppercase tracking-wider text-[#4D607B] dark:text-[#B1C2D8] font-mono"
          >
            Verified Assessment Records
          </h2>
          <span className="text-xs text-[#4D607B] dark:text-[#B1C2D8] font-mono">Durable Cryptographic Audit Records</span>
        </div>

        {isFirstTimeUser ? (
          <div className="rounded-xl border border-dashed border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] p-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-xl bg-[#D7E5F7] dark:bg-[#233D5C] border border-[#3569A8]/20 dark:border-[#80B9F5]/20 text-[#3569A8] dark:text-[#80B9F5] flex items-center justify-center">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-[#172B4D] dark:text-[#F0F5FC]">
                No Completed Assessments Yet
              </h3>
              <p className="text-xs sm:text-sm text-[#4D607B] dark:text-[#B1C2D8] leading-relaxed">
                Select any challenge from the marketplace above to generate verifiable evidence,
                regression test records, and an inspectable Proof Card.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => selectChallenge(challenges[0]?.id || 'CH-4982')}
                className="px-5 py-2.5 rounded-lg bg-[#3569A8] hover:bg-[#28558D] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Launch First Challenge
              </button>
              <button
                onClick={() => setIsFirstTimeUser(false)}
                className="px-4 py-2.5 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] text-xs font-medium text-[#172B4D] dark:text-[#F0F5FC] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] transition-colors cursor-pointer"
              >
                Restore Active Records
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] shadow-xs overflow-hidden divide-y divide-[#CBD9EB] dark:divide-[#34465F]">
            {progressData?.completedAssessments && progressData.completedAssessments.length > 0 ? (
              progressData.completedAssessments.map((item) => (
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
                      <span>{new Date(item.completedAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#172B4D] dark:text-[#F0F5FC]">
                      {item.challengeTitle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#4D607B] dark:text-[#B1C2D8] font-mono pt-0.5">
                      <span className="px-2 py-0.5 rounded bg-[#DCE7F5] dark:bg-[#22334A] text-[#172B4D] dark:text-[#F0F5FC] text-[11px] border border-[#CBD9EB] dark:border-[#34465F]">
                        {item.domain}
                      </span>
                      <span>{item.credentialId}</span>
                      <span>·</span>
                      <span>{item.testsPassed}/{item.testsTotal} Tests Passed</span>
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
                      onClick={() =>
                        copyToClipboard(
                          `${window.location.origin}/?credentialId=${item.credentialId}`,
                          'Public verification link copied'
                        )
                      }
                      className="p-2 rounded-lg text-[#4D607B] hover:text-[#172B4D] dark:text-[#B1C2D8] dark:hover:text-[#F0F5FC] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] transition-colors cursor-pointer"
                      title="Copy verification link"
                      aria-label="Copy verification link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              sampleHistoricalAssessments.map((item) => (
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
              ))
            )}
          </div>
        )}
      </section>

      {/* 6. SESSION RESTORATION & EXPIRY MODAL DIALOG */}
      {sessionModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs transition-opacity"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-[#F8FAFE] dark:bg-[#1B293D] border border-[#CBD9EB] dark:border-[#34465F] shadow-2xl p-6 sm:p-7 space-y-5 text-[#172B4D] dark:text-[#F0F5FC]">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#CBD9EB] dark:border-[#34465F]">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    sessionModal.type === 'expired_recoverable'
                      ? 'bg-[#FEF3D6] dark:bg-[#3E2D11] text-[#94621B] dark:text-[#F0C477] border border-[#F0C477]/40'
                      : sessionModal.type === 'expired_permanent'
                      ? 'bg-[#FBE8E8] dark:bg-[#381E1E] text-[#B93838] dark:text-[#F29A9A] border border-[#B93838]/40'
                      : sessionModal.type === 'already_completed'
                      ? 'bg-[#E3F5EC] dark:bg-[#163327] text-[#237A57] dark:text-[#78C9A4] border border-[#A3D9C0]/40'
                      : sessionModal.type === 'network_error'
                      ? 'bg-[#FBE8E8] dark:bg-[#381E1E] text-[#B93838] dark:text-[#F29A9A] border border-[#B93838]/40'
                      : 'bg-[#D7E5F7] dark:bg-[#233D5C] text-[#3569A8] dark:text-[#80B9F5] border border-[#3569A8]/40'
                  }`}
                >
                  {sessionModal.type === 'expired_recoverable' && <Clock className="w-5 h-5" />}
                  {sessionModal.type === 'expired_permanent' && <AlertCircle className="w-5 h-5" />}
                  {sessionModal.type === 'already_completed' && <CheckCircle2 className="w-5 h-5" />}
                  {sessionModal.type === 'network_error' && <AlertTriangle className="w-5 h-5" />}
                  {sessionModal.type === 'not_found' && <Info className="w-5 h-5" />}
                </div>

                <div>
                  <h3 id="session-modal-title" className="text-base font-bold tracking-tight">
                    {sessionModal.type === 'expired_recoverable' && 'Session Expired (Recovery Grace Period)'}
                    {sessionModal.type === 'expired_permanent' && 'Assessment Session Expired'}
                    {sessionModal.type === 'already_completed' && 'Assessment Already Completed'}
                    {sessionModal.type === 'not_found' && 'No Active Assessment Found'}
                    {sessionModal.type === 'network_error' && 'Assessment Server Connection Error'}
                  </h3>
                  <span className="text-[11px] font-mono text-[#4D607B] dark:text-[#B1C2D8]">
                    {sessionModal.type === 'expired_recoverable' && '5-minute recovery grace period active'}
                    {sessionModal.type === 'expired_permanent' && 'Server-authoritative expiry enforced'}
                    {sessionModal.type === 'already_completed' && 'Verified Ed25519 credential exists'}
                    {sessionModal.type === 'not_found' && 'Candidate session registry clean'}
                    {sessionModal.type === 'network_error' && 'Connection retry available'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSessionModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1.5 rounded-lg text-[#4D607B] hover:text-[#172B4D] dark:text-[#B1C2D8] dark:hover:text-[#F0F5FC] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-3 text-xs leading-relaxed text-[#4D607B] dark:text-[#B1C2D8]">
              {sessionModal.type === 'expired_recoverable' && (
                <>
                  <p>
                    Your assessment window has passed, but your saved Python code and diagnosis notes have been
                    safely preserved in the 5-minute recovery grace period.
                  </p>
                  <div className="p-3.5 rounded-xl bg-[#FFFFFF] dark:bg-[#111B2B] border border-[#CBD9EB] dark:border-[#34465F] space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Challenge:</span>
                      <span className="font-bold text-[#172B4D] dark:text-[#F0F5FC]">
                        {sessionModal.session?.challengeTitle || 'Defect Scenario'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Grace Window:</span>
                      <span className="font-bold text-[#94621B] dark:text-[#F0C477]">
                        ~{Math.max(1, Math.ceil((sessionModal.graceRemainingSeconds ?? 300) / 60))} min remaining
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Preserved Code:</span>
                      <span className="font-bold text-[#237A57] dark:text-[#78C9A4]">
                        {sessionModal.session?.lastSavedCode?.length || 0} bytes stored
                      </span>
                    </div>
                  </div>
                </>
              )}

              {sessionModal.type === 'expired_permanent' && (
                <>
                  <p>
                    The assessment timer and its 5-minute recovery grace period have ended. In compliance with
                    Proof of Skill server-authoritative integrity rules, permanently expired sessions cannot be resumed.
                  </p>
                  <p className="p-3 rounded-lg bg-[#FBE8E8]/50 dark:bg-[#381E1E]/50 border border-[#B93838]/20 text-[#B93838] dark:text-[#F29A9A]">
                    Your code draft has been archived to candidate records. You may start a fresh attempt when ready.
                  </p>
                </>
              )}

              {sessionModal.type === 'already_completed' && (
                <>
                  <p>
                    You have already submitted this assessment. A server-verified Ed25519 cryptographic credential
                    has been recorded in your verifiable portfolio. Duplicate submissions are prevented.
                  </p>
                  <div className="p-3.5 rounded-xl bg-[#E3F5EC]/40 dark:bg-[#163327]/40 border border-[#A3D9C0] dark:border-[#245740] flex items-center justify-between font-mono text-[11px]">
                    <span className="text-[#237A57] dark:text-[#78C9A4] font-semibold">Status: Demonstrated</span>
                    <span className="text-[#172B4D] dark:text-[#F0F5FC]">Score: 100%</span>
                  </div>
                </>
              )}

              {sessionModal.type === 'not_found' && (
                <>
                  <p>
                    No active or unfinished assessment session was found for your account. You can select any
                    challenge from the marketplace below to launch an assessment.
                  </p>
                </>
              )}

              {sessionModal.type === 'network_error' && (
                <>
                  <p>
                    Could not establish a connection to the assessment session server. Your progress has not been lost.
                  </p>
                  <p className="font-mono text-[11px] text-[#B93838] dark:text-[#F29A9A] bg-[#FBE8E8]/40 dark:bg-[#381E1E]/40 p-2.5 rounded-lg border border-[#B93838]/20">
                    {sessionModal.message}
                  </p>
                </>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-[#CBD9EB] dark:border-[#34465F]">
              <button
                onClick={() => setSessionModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] text-xs font-semibold text-[#172B4D] dark:text-[#F0F5FC] transition-colors cursor-pointer"
              >
                {sessionModal.type === 'already_completed' ? 'Done' : 'Dismiss'}
              </button>

              {sessionModal.type === 'expired_recoverable' && sessionModal.session && (
                <button
                  onClick={() => handleRecoverSession(sessionModal.session!.sessionId)}
                  disabled={isRestoringSession}
                  className="px-5 py-2.5 rounded-lg bg-[#3569A8] hover:bg-[#28558D] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isRestoringSession ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Recover & Resume Assessment</span>
                </button>
              )}

              {sessionModal.type === 'expired_permanent' && (
                <button
                  onClick={() => handleStartFreshSession(sessionModal.session?.challengeId || 'CH-4982')}
                  disabled={isRestoringSession}
                  className="px-5 py-2.5 rounded-lg bg-[#3569A8] hover:bg-[#28558D] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start Fresh Assessment</span>
                </button>
              )}

              {sessionModal.type === 'already_completed' && (
                <button
                  onClick={() => {
                    setSessionModal((prev) => ({ ...prev, isOpen: false }));
                    setScreen('results');
                  }}
                  className="px-5 py-2.5 rounded-lg bg-[#3569A8] hover:bg-[#28558D] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>View Verified Results</span>
                </button>
              )}

              {sessionModal.type === 'not_found' && (
                <button
                  onClick={() => {
                    setSessionModal((prev) => ({ ...prev, isOpen: false }));
                    selectChallenge(challenges[0]?.id || 'CH-4982');
                  }}
                  className="px-5 py-2.5 rounded-lg bg-[#3569A8] hover:bg-[#28558D] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Launch Recommended Challenge</span>
                </button>
              )}

              {sessionModal.type === 'network_error' && (
                <button
                  onClick={handleContinueAssessment}
                  disabled={isRestoringSession}
                  className="px-5 py-2.5 rounded-lg bg-[#3569A8] hover:bg-[#28558D] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isRestoringSession ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Retry Connection</span>
                </button>
              )}
            </div>

            {/* Testing State Simulation Bar (Convenient Verification) */}
            <div className="pt-3 border-t border-[#CBD9EB]/40 dark:border-[#34465F]/40 flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-mono text-[#64748B] dark:text-[#9AACC3]">
              <span>QA State Simulator:</span>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => handleSimulateState('active')}
                  className="px-2 py-0.5 rounded bg-[#DCE7F5] dark:bg-[#22334A] hover:bg-[#3569A8] hover:text-white transition-colors cursor-pointer"
                >
                  Active
                </button>
                <button
                  onClick={() => handleSimulateState('expired_recoverable')}
                  className="px-2 py-0.5 rounded bg-[#DCE7F5] dark:bg-[#22334A] hover:bg-[#94621B] hover:text-white transition-colors cursor-pointer"
                >
                  Grace
                </button>
                <button
                  onClick={() => handleSimulateState('expired_permanent')}
                  className="px-2 py-0.5 rounded bg-[#DCE7F5] dark:bg-[#22334A] hover:bg-[#B93838] hover:text-white transition-colors cursor-pointer"
                >
                  Expired
                </button>
                <button
                  onClick={() => handleSimulateState('already_completed')}
                  className="px-2 py-0.5 rounded bg-[#DCE7F5] dark:bg-[#22334A] hover:bg-[#237A57] hover:text-white transition-colors cursor-pointer"
                >
                  Completed
                </button>
                <button
                  onClick={() => handleSimulateState('not_found')}
                  className="px-2 py-0.5 rounded bg-[#DCE7F5] dark:bg-[#22334A] hover:bg-[#3569A8] hover:text-white transition-colors cursor-pointer"
                >
                  None
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
