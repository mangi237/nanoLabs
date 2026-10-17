import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FilePlus, 
  Users, 
  FileText, 
  Building2, 
  Share2, 
  User, 
  Menu, 
  X, 
  LogOut, 
  Activity, 
  Stethoscope,
  ChevronRight,
  Sparkles,
  Search,
  Bell,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/authContext';

export type DoctorNavTab = 
  | 'dashboard'
  | 'new_request'
  | 'patients'
  | 'reports'
  | 'directory'
  | 'connect'
  | 'profile';

interface DoctorLayoutProps {
  currentTab: DoctorNavTab;
  onTabChange: (tab: DoctorNavTab) => void;
  children: React.ReactNode;
  onLogout?: () => void;
}

export const DoctorLayout: React.FC<DoctorLayoutProps> = ({
  currentTab,
  onTabChange,
  children,
  onLogout
}) => {
  const { user } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as DoctorNavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new_request' as DoctorNavTab, label: 'New Lab Request', icon: FilePlus },
    { id: 'patients' as DoctorNavTab, label: 'My Patients', icon: Users },
    { id: 'reports' as DoctorNavTab, label: 'Diagnostic Reports', icon: FileText },
    { id: 'directory' as DoctorNavTab, label: 'Lab Directory', icon: Building2 },
    { id: 'connect' as DoctorNavTab, label: 'Patient Connect & Chat', icon: Share2 },
    { id: 'profile' as DoctorNavTab, label: 'Physician Profile', icon: User }
  ];

  const handleSelect = (tab: DoctorNavTab) => {
    onTabChange(tab);
    setMobileDrawerOpen(false);
  };

  const doctorDisplayName = user?.name || user?.fullName || 'Dr. Emmanuel Nkuo';
  const doctorSpecialty = user?.specialty || 'Internal Medicine & Diagnostics';

  return (
    <div className="min-h-screen bg-[#F4F7F6] text-[#0A2624] flex antialiased font-sans selection:bg-[#E0F2F1] selection:text-[#006978]">
      {/* Desktop Permanent Sleek Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/90 shrink-0 justify-between shadow-2xs z-30">
        <div className="p-5 space-y-6">
          {/* Logo Brand */}
          <button
            onClick={() => handleSelect('dashboard')}
            className="flex items-center gap-3 text-left w-full group cursor-pointer focus:outline-hidden"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#006978] to-[#00838F] text-white flex items-center justify-center shadow-md shadow-[#006978]/20 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5 text-cyan-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base text-[#006978] tracking-tight">
                  Nano<span className="text-[#00838F]">Labs</span>
                </span>
                <span className="text-[9px] font-black uppercase bg-[#E0F2F1] text-[#006978] px-1.5 py-0.5 rounded-md">
                  MD
                </span>
              </div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Physician Portal
              </span>
            </div>
          </button>

          {/* Quick Create Action */}
          <button
            onClick={() => handleSelect('new_request')}
            className="w-full py-3 px-3.5 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white rounded-2xl text-xs font-black shadow-md shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2 group"
          >
            <FilePlus className="w-4 h-4 text-cyan-200 group-hover:scale-110 transition-transform" />
            <span>+ Prescribe Lab Tests</span>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#E0F2F1] text-[#006978] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#006978]' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Doctor Info Card & Sign Out */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-[#006978] flex items-center justify-center font-black text-xs shrink-0">
              {doctorDisplayName.replace('Dr. ', '').charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-slate-900 truncate">
                {doctorDisplayName}
              </p>
              <p className="text-[10px] text-[#006978] font-bold truncate">
                {doctorSpecialty}
              </p>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs lg:hidden animate-in fade-in"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 p-5 flex flex-col justify-between transition-transform duration-300 lg:hidden shadow-2xl ${
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#006978] text-white flex items-center justify-center shadow-xs">
                <Stethoscope className="w-4 h-4 text-cyan-200" />
              </div>
              <span className="font-black text-sm text-[#006978]">
                Nano<span className="text-[#00838F]">Labs</span> MD
              </span>
            </div>
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => handleSelect('new_request')}
            className="w-full py-3 px-3.5 bg-[#006978] text-white rounded-2xl text-xs font-black shadow-md shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <FilePlus className="w-4 h-4" />
            <span>+ Prescribe Lab Tests</span>
          </button>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#E0F2F1] text-[#006978] font-black'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 rounded-xl cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar for Desktop & Mobile */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="font-black text-sm text-slate-900 tracking-tight capitalize truncate">
                {navItems.find((i) => i.id === currentTab)?.label || 'Doctor Console'}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>ONMC Accredited</span>
              </span>
            </div>
          </div>

          {/* Right Header Badges & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onTabChange('connect')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#E0F2F1] hover:bg-[#B2DFDB] text-[#006978] rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Connect QR</span>
            </button>

            <button
              onClick={() => onTabChange('profile')}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-85 transition-opacity cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#006978] to-[#00838F] text-white flex items-center justify-center font-mono font-black text-xs shadow-xs">
                MD
              </div>
              <div className="hidden md:block text-left leading-none max-w-[130px]">
                <span className="text-xs font-black text-slate-800 block truncate">
                  {doctorDisplayName}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Verified Doctor
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-28 lg:pb-12">
          {children}
        </main>

        {/* Doctor Mobile Bottom Navigation Bar */}
        <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 lg:hidden z-40 px-2 py-1.5 flex items-center justify-around shadow-lg">
          {[
            { id: 'dashboard' as DoctorNavTab, label: 'Dashboard', icon: LayoutDashboard },
            { id: 'new_request' as DoctorNavTab, label: 'New Rx', icon: FilePlus },
            { id: 'patients' as DoctorNavTab, label: 'Patients', icon: Users },
            { id: 'reports' as DoctorNavTab, label: 'Reports', icon: FileText },
            { id: 'connect' as DoctorNavTab, label: 'Chat', icon: Share2 }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-[#006978] font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-[#E0F2F1]' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#006978]' : 'text-slate-500'}`} />
                </div>
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default DoctorLayout;
