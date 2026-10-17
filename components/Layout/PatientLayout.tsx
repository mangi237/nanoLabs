import React from 'react';
import { 
  Home, 
  FlaskConical, 
  Navigation, 
  Stethoscope, 
  User, 
  Activity, 
  LogOut, 
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { TestBatch } from '../../types';
import { FamilyProfileSwitcher } from '../patient/FamilyProfileSwitcher';
import { useFamilyProfile } from '../../context/familyProfileContext';

export type PatientNavTab = 'home' | 'tests' | 'tracking' | 'doctors' | 'profile' | 'book' | 'results' | 'messages' | 'connect' | 'booklet' | 'chat';

interface PatientLayoutProps {
  currentTab: PatientNavTab;
  onTabChange: (tab: PatientNavTab) => void;
  activeBatch?: TestBatch | null;
  onOpenBatch?: (batchId: string) => void;
  onOpenAI?: () => void;
  children: React.ReactNode;
  onLogout?: () => void;
  hideBottomNav?: boolean;
}

export const PatientLayout: React.FC<PatientLayoutProps> = ({
  currentTab,
  onTabChange,
  activeBatch,
  onOpenBatch,
  onOpenAI,
  children,
  onLogout,
  hideBottomNav = false
}) => {
  const { user } = useAuth();
  const { activeProfile, isDependentActive } = useFamilyProfile();

  const navItems = [
    { id: 'home' as PatientNavTab, label: 'Home', icon: Home },
    { id: 'tests' as PatientNavTab, label: 'Tests', icon: FlaskConical },
    { id: 'tracking' as PatientNavTab, label: 'Tracking', icon: Navigation },
    { id: 'doctors' as PatientNavTab, label: 'Doctors', icon: Stethoscope },
    { id: 'profile' as PatientNavTab, label: 'Profile', icon: User }
  ];

  const getIsActive = (itemId: PatientNavTab) => {
    if (currentTab === itemId) return true;
    if (itemId === 'tests' && currentTab === 'book') return true;
    if (itemId === 'tracking' && (currentTab === 'results' || currentTab === 'booklet')) return true;
    if (itemId === 'doctors' && (currentTab === 'messages' || currentTab === 'connect' || currentTab === 'chat')) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#0A2624] flex flex-col font-sans antialiased selection:bg-[#E0F2F1] selection:text-[#006978]">
      {/* Top Header - Compact, fully responsive & zero-overflow */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 py-2.5 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <button 
            onClick={() => onTabChange('home')}
            className="flex items-center gap-2 group cursor-pointer focus:outline-hidden shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#006978] to-[#0097A7] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4 text-cyan-200" />
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="font-extrabold text-base tracking-tight text-[#006978]">
                Nano<span className="text-[#00838F]">Labs</span>
              </span>
              <span className="hidden sm:inline-block text-[9px] font-semibold text-slate-400">
                Diagnostic Network
              </span>
            </div>
          </button>

          {/* Active Family Dossier Indicator (when dependent active) */}
          {isDependentActive && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-900 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Viewing {activeProfile.fullName}'s Dossier</span>
            </div>
          )}

          {/* Active Order Pill in Header */}
          {activeBatch && (
            <button
              onClick={() => onOpenBatch && onOpenBatch(activeBatch.id)}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#E0F2F1] hover:bg-[#B2DFDB] border border-[#80CBC4] rounded-full text-xs font-semibold text-[#006978] transition-all cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-[#00897B] animate-pulse" />
              <span className="font-mono font-bold text-[11px]">{activeBatch.batchNumber}</span>
              <span className="text-[11px] text-[#004D40] capitalize">&bull; {activeBatch.status.replace('_', ' ')}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5 text-[#006978]" />
            </button>
          )}

          {/* Right Actions: NanoLabs AI, Compact Family Profile Switcher & Sign Out */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {onOpenAI && (
              <button
                onClick={onOpenAI}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-full text-xs font-black shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
                title="Consult NanoLabs AI (Gemini Medical Assistant)"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                <span className="hidden sm:inline">NanoLabs AI</span>
                <span className="sm:hidden font-black">AI</span>
              </button>
            )}

            <FamilyProfileSwitcher />
          </div>
        </div>

        {/* Dependent notice on mobile header if dependent selected */}
        {isDependentActive && (
          <div className="md:hidden mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-amber-900 font-semibold px-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Active Dossier: <strong>{activeProfile.fullName}</strong> ({activeProfile.relationshipLabel})
            </span>
          </div>
        )}
      </header>

      {/* Main Content Viewport - Optimized for both Mobile & Desktop Web */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-32 md:pb-32">
        {children}
      </main>

      {/* Glassy Floating Rounded Circular Bottom Navigation Bar */}
      {!hideBottomNav && (
        <div className="fixed bottom-4 sm:bottom-6 inset-x-0 mx-auto w-[calc(100%-2rem)] max-w-sm sm:max-w-md z-50 pointer-events-none">
          <nav className="pointer-events-auto bg-white/70 backdrop-blur-2xl border border-white/70 shadow-[0_16px_50px_-8px_rgba(0,105,120,0.32)] rounded-full px-2.5 py-1.5 ring-1 ring-slate-900/5 transition-all">
            <div className="grid grid-cols-5 gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = getIsActive(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`h-12 flex flex-col items-center justify-center gap-0.5 rounded-full transition-all cursor-pointer select-none ${
                      active
                        ? 'bg-[#006978] text-white shadow-md shadow-[#006978]/35 font-bold scale-[1.03] ring-1 ring-white/40'
                        : 'text-slate-500 hover:text-[#006978] hover:bg-white/50 font-medium'
                    }`}
                  >
                    <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${active ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                    <span className="text-[10px] leading-none tracking-tight">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
};

export default PatientLayout;
