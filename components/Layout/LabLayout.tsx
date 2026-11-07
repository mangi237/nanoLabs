import React from 'react';
import { 
  Users, 
  CreditCard, 
  Syringe, 
  Cpu, 
  CheckSquare, 
  FileCheck2, 
  Boxes, 
  BarChart3, 
  ShieldCheck, 
  LogOut, 
  Building2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/authContext';

export type LabNavTab = 
  | 'reception'
  | 'worklist'
  | 'cashier'
  | 'phlebotomy'
  | 'bench'
  | 'validation'
  | 'release'
  | 'inventory'
  | 'stats'
  | 'audit';

interface LabLayoutProps {
  currentTab: LabNavTab;
  onTabChange: (tab: LabNavTab) => void;
  children: React.ReactNode;
  onLogout?: () => void;
}

export const LabLayout: React.FC<LabLayoutProps> = ({
  currentTab,
  onTabChange,
  children,
  onLogout
}) => {
  const { user, lab } = useAuth();
  const userRole = user?.role || user?.primaryRole || 'admin';

  const allTabs = [
    { id: 'reception' as LabNavTab, label: 'Reception Intake', icon: Users, roles: ['receptionist', 'admin', 'lab_admin', 'superadmin', 'lab_staff'] },
    { id: 'worklist' as LabNavTab, label: 'Batch Worklist', icon: CheckSquare, roles: ['technician', 'lab_tech', 'biologist', 'admin', 'lab_admin', 'superadmin', 'lab_staff'] },
    { id: 'cashier' as LabNavTab, label: 'Cashier Desk', icon: CreditCard, roles: ['cashier', 'admin', 'lab_admin', 'superadmin', 'lab_staff'] },
    { id: 'phlebotomy' as LabNavTab, label: 'Phlebotomy Dispatch', icon: Syringe, roles: ['phlebotomist', 'nurse', 'admin', 'lab_admin', 'superadmin', 'lab_staff'] },
    { id: 'bench' as LabNavTab, label: 'Analyzer Bench', icon: Cpu, roles: ['technician', 'lab_tech', 'analyzer', 'admin', 'lab_admin', 'superadmin', 'lab_staff'] },
    { id: 'validation' as LabNavTab, label: 'Biologist Validation', icon: FileCheck2, roles: ['biologist', 'admin', 'lab_admin', 'superadmin', 'lab_staff'] },
    { id: 'inventory' as LabNavTab, label: 'Reagent Inventory', icon: Boxes, roles: ['inventory_manager', 'admin', 'lab_admin', 'superadmin'] },
    { id: 'stats' as LabNavTab, label: 'Analytics', icon: BarChart3, roles: ['admin', 'lab_admin', 'superadmin'] },
    { id: 'audit' as LabNavTab, label: 'Audit Trail', icon: ShieldCheck, roles: ['admin', 'lab_admin', 'superadmin'] }
  ];

  // If user is admin or superadmin, show all tabs; otherwise filter by clearance
  const visibleTabs = allTabs.filter(
    (tab) =>
      userRole === 'admin' ||
      userRole === 'superadmin' ||
      userRole === 'lab_admin' ||
      tab.roles.includes(userRole)
  );

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#0B1F1D] flex flex-col antialiased">
      {/* Lab Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Lab Entity & Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0D3B38] text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5 text-[#14B8A6]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-[#0D3B38] tracking-tight">
                  {lab?.name || 'Laboratoire Partenaire Certifié'}
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-[#0F766E] border border-teal-200">
                  ISO 15189 / MINSANTE
                </span>
              </div>
              <p className="text-[11px] text-[#6B7F7D] font-medium truncate max-w-xs sm:max-w-md">
                nanoLabs LIMS Core &bull; Akwa / Bonanjo Node &bull; TVA Exempt
              </p>
            </div>
          </div>

          {/* User Role Badge & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[#0B1F1D] capitalize">
                {user?.name || user?.fullName || 'Clinical Staff'}
              </p>
              <p className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">
                {userRole.replace('_', ' ')}
              </p>
            </div>

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

        {/* Role-Conditional Horizontal Subnav */}
        <div className="max-w-7xl mx-auto mt-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 pb-1 min-w-max">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0F766E] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#0D3B38] hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Lab Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};

export default LabLayout;
