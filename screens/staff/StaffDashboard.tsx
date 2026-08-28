import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  DollarSign, 
  Microscope, 
  TestTube, 
  RefreshCw, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { ReceptionistView } from './ReceptionistView';
import { CashierView } from './CashierView';
import { AnalyzerView } from './AnalyzerView';
import { LabTechView } from './LabTechView';

interface StaffDashboardProps {
  onNavigate?: (screen: string, params?: any) => void;
  onOpenRoleSwitcher?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void ;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  onNavigate,
  onOpenRoleSwitcher,
  onNotificationPress,
  onProfilePress
}) => {
  const { user, lab } = useAuth();
  const activeRole = user?.role || 'receptionist';

  // Sub-tab selection when viewing overall staff dashboard
  const [selectedWorkstation, setSelectedWorkstation] = useState<string>(activeRole);

  const rolesConfig = [
    { id: 'receptionist', label: 'Receptionist', icon: User, color: 'text-teal-600 bg-teal-50 border-teal-200' },
    { id: 'cashier', label: 'Cashier', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'analyzer', label: 'Analyzer', icon: Microscope, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { id: 'lab_tech', label: 'Lab Tech', icon: TestTube, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  ];

  const currentRoleObj = rolesConfig.find(r => r.id === selectedWorkstation) || rolesConfig[0];
  const CurrentIcon = currentRoleObj.icon;

  return (
    <div className="space-y-6">
      {/* Staff Header & Lab Badge */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
              <Building2 className="w-3.5 h-3.5" />
              {lab?.name || user?.labName || 'nanoLabs Health Network'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {user?.name || 'Staff Member'}
            </h1>
            <p className="text-teal-100/80 text-sm max-w-xl">
              Access staff workstations, register patients, process samples, and manage lab billing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenRoleSwitcher}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold border border-white/20 transition-all cursor-pointer backdrop-blur-xs"
            >
              <ShieldCheck className="w-4 h-4 text-teal-300" />
              Active Role: <span className="uppercase tracking-wider font-bold text-teal-300">{user?.role || 'Staff'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Workstation Selector Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap sm:flex-nowrap gap-2">
        {rolesConfig.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedWorkstation === role.id;

          return (
            <button
              key={role.id}
              onClick={() => setSelectedWorkstation(role.id)}
              className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-teal-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
              <span>{role.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render Active Workstation View */}
      <div className="pt-2">
        {selectedWorkstation === 'receptionist' && (
          <ReceptionistView 
            onNavigatePatientDetails={(patientId) => onNavigate?.('PatientDetailsScreen', { patientId })}
          />
        )}
        {selectedWorkstation === 'cashier' && (
          <CashierView />
        )}
        {selectedWorkstation === 'analyzer' && (
          <AnalyzerView />
        )}
        {selectedWorkstation === 'lab_tech' && (
          <LabTechView />
        )}
      </div>
    </div>
  );
};
