import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { SkipLink } from './components/SkipLink';
import { ToastContainer } from './components/Toast';
import { CandidateDashboard } from './screens/CandidateDashboard';
import { DebuggingWorkspace } from './screens/DebuggingWorkspace';
import { AssessmentResults } from './screens/AssessmentResults';
import { EvidenceReport } from './screens/EvidenceReport';
import { PublicVerification } from './screens/PublicVerification';
import { ProfileModal } from './components/ProfileModal';
import { ShieldCheck } from 'lucide-react';

const MainContent: React.FC = () => {
  const { screen } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#E8EFF9] dark:bg-[#111B2B] text-[#172B4D] dark:text-[#F0F5FC] transition-colors">
      <SkipLink />
      <Navbar />

      <main id="main-content" className="flex-1 pb-16">
        {screen === 'dashboard' && <CandidateDashboard />}
        {screen === 'workspace' && <DebuggingWorkspace />}
        {screen === 'results' && <AssessmentResults />}
        {screen === 'proof' && <EvidenceReport />}
        {screen === 'verify' && <PublicVerification />}
      </main>

      {/* Global Product Footer */}
      <footer className="border-t border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] py-8 px-4 sm:px-6 lg:px-8 text-xs text-[#4D607B] dark:text-[#B1C2D8] transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[#3569A8] dark:bg-[#80B9F5] text-white dark:text-[#111B2B] flex items-center justify-center font-bold text-xs shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-[#172B4D] dark:text-[#F0F5FC]">
                Proof of Skill
              </span>{' '}
              — Evidence-backed technical skills assessment and verification platform.
            </div>
          </div>

          <div className="text-center md:text-right text-[11px] text-[#64748B] dark:text-[#9AACC3] font-mono">
            <p>
              &ldquo;Don&apos;t just show that you passed. Show how you solved the problem.&rdquo;
            </p>
            <p className="mt-0.5">
              Prototype Demonstration · Simulated execution and verification environments.
            </p>
          </div>
        </div>
      </footer>

      <ToastContainer />
      <ProfileModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
