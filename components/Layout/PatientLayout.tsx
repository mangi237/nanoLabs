import React from 'react';
import { 
  Home, 
  PlusCircle, 
  FileText, 
  BookOpen, 
  User, 
  Bell, 
  Activity, 
  LogOut, 
  ChevronRight,
  ShieldCheck,
  MapPin,
  Clock,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { TestBatch } from '../../types';
import { FamilyProfileSwitcher } from '../patient/FamilyProfileSwitcher';

export type PatientNavTab = 'home' | 'book' | 'results' | 'booklet' | 'chat' | 'profile';

interface PatientLayoutProps {
  currentTab: PatientNavTab;
  onTabChange: (tab: PatientNavTab) => void;
  activeBatch?: TestBatch | null;
  onOpenBatch?: (batchId: string) => void;
  children: React.ReactNode;
  onLogout?: () => void;
}

export const PatientLayout: React.FC<PatientLayoutProps> = ({
  currentTab,
  onTabChange,
  activeBatch,
  onOpenBatch,
  children,
  onLogout
}) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'home' as PatientNavTab, label: 'Home', icon: Home },
    { id: 'book' as PatientNavTab, label: 'Book Test', icon: PlusCircle },
    { id: 'results' as PatientNavTab, label: 'Results', icon: FileText },
    { id: 'chat' as PatientNavTab, label: 'Doctor Chat', icon: MessageSquare },
    { id: 'booklet' as PatientNavTab, label: 'Booklet', icon: BookOpen },
    { id: 'profile' as PatientNavTab, label: 'Profile', icon: User }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#0B1F1D] flex flex-col antialiased">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0F766E] to-[#14B8A6] flex items-center justify-center text-white shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="font-black text-sm text-[#0D3B38] tracking-tight">
                nano<span className="text-[#0F766E]">Labs</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold text-slate-400">
                Patient Portal
              </span>
            </div>
          </div>

          {/* Center: Active Batch Status Chip */}
          {activeBatch && (
            <button
              onClick={() => onOpenBatch && onOpenBatch(activeBatch.id)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-teal-50 hover:bg-teal-100/80 border border-teal-200 rounded-full text-xs font-semibold text-[#0F766E] transition-all cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
              <span className="font-mono font-bold text-[11px]">{activeBatch.batchNumber}</span>
              <span className="text-[11px] text-slate-500 capitalize">&bull; {activeBatch.status.replace('_', ' ')}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          )}

          {/* Right Actions: Family Profile Switcher & Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3">
            <FamilyProfileSwitcher />

            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign Out"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Active Batch Banner */}
        {activeBatch && (
          <div className="mt-2 md:hidden">
            <button
              onClick={() => onOpenBatch && onOpenBatch(activeBatch.id)}
              className="w-full flex items-center justify-between p-2 px-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-[#0F766E] cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
                <span className="font-mono font-bold">{activeBatch.batchNumber}</span>
                <span className="capitalize text-[11px] text-slate-600">({activeBatch.status.replace('_', ' ')})</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (44px min tap targets) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1.5 md:hidden">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-[#0F766E] font-bold'
                    : 'text-[#6B7F7D] hover:text-[#0B1F1D] font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                <span className="text-[10px] leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default PatientLayout;
