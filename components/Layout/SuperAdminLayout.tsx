import React from 'react';
import { 
  Building2, 
  Receipt, 
  ShieldAlert, 
  Database, 
  Users, 
  Activity, 
  LogOut,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/authContext';

export type SuperAdminNavTab = 
  | 'labs'
  | 'settlements'
  | 'audit'
  | 'catalog'
  | 'users'
  | 'health';

interface SuperAdminLayoutProps {
  currentTab: SuperAdminNavTab;
  onTabChange: (tab: SuperAdminNavTab) => void;
  children: React.ReactNode;
  onLogout?: () => void;
}

export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({
  currentTab,
  onTabChange,
  children,
  onLogout
}) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'labs' as SuperAdminNavTab, label: 'Partner Labs', icon: Building2 },
    { id: 'settlements' as SuperAdminNavTab, label: 'Monthly Settlements (5%)', icon: Receipt },
    { id: 'audit' as SuperAdminNavTab, label: 'System Audit Trail', icon: ShieldAlert },
    { id: 'catalog' as SuperAdminNavTab, label: 'Master Test Catalog', icon: Database },
    { id: 'users' as SuperAdminNavTab, label: 'Platform Users', icon: Users },
    { id: 'health' as SuperAdminNavTab, label: 'System Health', icon: Activity }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#0B1F1D] flex flex-col antialiased">
      {/* Top Super Admin Nav */}
      <header className="sticky top-0 z-40 bg-[#0D3B38] text-white px-4 sm:px-6 py-3 border-b border-teal-900/60 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-sm text-white tracking-tight">
                nano<span className="text-[#14B8A6]">Labs</span>
              </span>
              <span className="ml-2 text-[10px] uppercase font-bold text-teal-300 tracking-wider">
                Super Admin Master Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-teal-100">
                {user?.name || user?.email || 'Super Administrator'}
              </p>
              <p className="text-[10px] text-teal-400 font-mono">
                Platform administration
              </p>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign Out"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-teal-300 hover:text-rose-400 rounded-xl hover:bg-teal-900/50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Navigation Menu */}
        <div className="max-w-7xl mx-auto mt-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 pb-1 min-w-max">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#14B8A6] text-[#0D3B38] font-black shadow-xs'
                      : 'text-teal-200/80 hover:text-white hover:bg-teal-900/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Admin View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};

export default SuperAdminLayout;
