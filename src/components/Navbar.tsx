import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppScreen } from '../types';
import {
  ShieldCheck,
  Sun,
  Moon,
  Menu,
  X,
  UserCheck,
  UserX,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    screen,
    setScreen,
    theme,
    setTheme,
    isFirstTimeUser,
    setIsFirstTimeUser,
    candidate,
    addToast,
    setIsProfileModalOpen,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: AppScreen; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'workspace', label: 'Challenge Workspace' },
    { id: 'results', label: 'Assessment Results' },
    { id: 'proof', label: 'Evidence & Proof Card' },
    { id: 'verify', label: 'Public Verification' },
  ];

  const handleNavClick = (id: AppScreen) => {
    setScreen(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE]/95 dark:bg-[#1B293D]/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity - Spacious, refined typography */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center gap-3 text-left group focus-visible:ring-2 focus-visible:ring-[#3569A8] dark:focus-visible:ring-[#80B9F5] focus-visible:outline-none rounded-xl cursor-pointer"
              aria-label="Proof of Skill Home"
            >
              <div className="w-9 h-9 rounded-xl bg-[#3569A8] dark:bg-[#80B9F5] text-white dark:text-[#111B2B] flex items-center justify-center font-bold text-sm shadow-xs transition-transform group-hover:scale-105">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-[#172B4D] dark:text-[#F0F5FC] block leading-tight">
                  Proof of Skill
                </span>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#3569A8] dark:text-[#80B9F5] block leading-tight font-medium">
                  Code &rarr; Evidence &rarr; Proof
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links with active indicators */}
            <nav className="hidden lg:flex items-center gap-1.5" aria-label="Main Navigation">
              {navItems.map((item) => {
                const isActive = screen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3569A8] dark:focus-visible:ring-[#80B9F5] focus-visible:outline-none ${
                      isActive
                        ? 'bg-[#D7E5F7] text-[#3569A8] dark:bg-[#233D5C] dark:text-[#80B9F5] font-semibold'
                        : 'text-[#4D607B] hover:text-[#172B4D] hover:bg-[#DCE7F5] dark:text-[#B1C2D8] dark:hover:text-[#F0F5FC] dark:hover:bg-[#22334A]'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#3569A8] dark:bg-[#80B9F5] rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Controls: Mode Toggle, Theme, Profile */}
          <div className="flex items-center gap-3">
            {/* Prototype Demo Status Notice */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DCE7F5] dark:bg-[#22334A] border border-[#CBD9EB] dark:border-[#34465F] text-[11px] font-medium text-[#4D607B] dark:text-[#B1C2D8]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#237A57] dark:bg-[#78C9A4]" aria-hidden="true" />
              <span>Simulated Prototype</span>
            </div>

            {/* Candidate Sample Mode Switcher */}
            <button
              onClick={() => {
                const nextState = !isFirstTimeUser;
                setIsFirstTimeUser(nextState);
                addToast(
                  nextState
                    ? 'Previewing First-time Candidate View (empty state)'
                    : 'Previewing Active Candidate View with assessment records',
                  'info'
                );
              }}
              title="Toggle between candidate with history and new candidate empty states"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] text-xs text-[#4D607B] dark:text-[#B1C2D8] hover:text-[#172B4D] dark:hover:text-[#F0F5FC] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] transition-colors cursor-pointer"
            >
              {isFirstTimeUser ? (
                <>
                  <UserX className="w-3.5 h-3.5 text-[#94621B] dark:text-[#F0C477]" aria-hidden="true" />
                  <span className="text-[11px] font-medium">New Candidate</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-[#3569A8] dark:text-[#80B9F5]" aria-hidden="true" />
                  <span className="text-[11px] font-medium">Active Candidate</span>
                </>
              )}
            </button>

            {/* Explicit Theme Segmented Control: Light and Dark buttons with clear states */}
            <div
              role="group"
              aria-label="Color theme selection"
              className="flex items-center p-0.5 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#DCE7F5] dark:bg-[#111B2B]"
            >
              <button
                type="button"
                onClick={() => setTheme('light')}
                aria-label="Light mode"
                aria-pressed={theme === 'light'}
                title="Select Light Mode"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  theme === 'light'
                    ? 'bg-[#FFFFFF] text-[#172B4D] shadow-xs font-semibold'
                    : 'text-[#4D607B] hover:text-[#172B4D]'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-[#94621B]" aria-hidden="true" />
                <span className="text-[11px]">Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-label="Dark mode"
                aria-pressed={theme === 'dark'}
                title="Select Dark Mode"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#263952] text-[#F0F5FC] shadow-xs font-semibold'
                    : 'text-[#B1C2D8] hover:text-[#F0F5FC]'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-[#80B9F5]" aria-hidden="true" />
                <span className="text-[11px]">Dark</span>
              </button>
            </div>

            {/* Candidate Identity Thumbnail & Profile Modal Trigger */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#CBD9EB] dark:border-[#34465F]">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="w-8 h-8 rounded-full bg-[#D7E5F7] dark:bg-[#233D5C] text-[#3569A8] dark:text-[#80B9F5] border border-[#CBD9EB] dark:border-[#34465F] hover:border-[#3569A8] dark:hover:border-[#80B9F5] flex items-center justify-center text-xs font-bold shadow-xs cursor-pointer transition-transform hover:scale-105"
                title={`${candidate.fullName} · Profile & Account Settings`}
                aria-label="Open Candidate Profile & Account Settings"
              >
                {candidate.fullName.charAt(0)}
              </button>
            </div>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden p-2 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] text-[#4D607B] dark:text-[#B1C2D8] hover:text-[#172B4D] dark:hover:text-[#F0F5FC] hover:bg-[#DCE7F5] dark:hover:bg-[#22334A] transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#CBD9EB] dark:border-[#34465F] bg-[#F8FAFE] dark:bg-[#1B293D] px-4 pt-2 pb-4 space-y-3 shadow-md">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = screen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#D7E5F7] text-[#3569A8] dark:bg-[#233D5C] dark:text-[#80B9F5] font-semibold'
                      : 'text-[#4D607B] hover:bg-[#DCE7F5] dark:text-[#B1C2D8] dark:hover:bg-[#22334A]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#CBD9EB] dark:border-[#34465F] flex items-center justify-between text-xs text-[#4D607B] dark:text-[#B1C2D8]">
            <span>Theme Selection:</span>
            <div className="flex items-center p-0.5 rounded-lg border border-[#CBD9EB] dark:border-[#34465F] bg-[#DCE7F5] dark:bg-[#111B2B]">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  theme === 'light'
                    ? 'bg-[#FFFFFF] text-[#172B4D] shadow-xs font-semibold'
                    : 'text-[#4D607B]'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-[#94621B]" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#263952] text-[#F0F5FC] shadow-xs font-semibold'
                    : 'text-[#B1C2D8]'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-[#80B9F5]" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-[#CBD9EB] dark:border-[#34465F] flex items-center justify-between text-xs text-[#4D607B] dark:text-[#B1C2D8]">
            <span>Prototype Demo Environment</span>
            <button
              onClick={() => setIsFirstTimeUser(!isFirstTimeUser)}
              className="font-semibold text-[#3569A8] dark:text-[#80B9F5] underline underline-offset-2"
            >
              {isFirstTimeUser ? 'Load Sample Data' : 'View Empty State'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
