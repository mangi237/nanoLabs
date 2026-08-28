import React from 'react';
import { useAuth } from '../context/authContext';
import AdminDashboard from './admin/adminDashboard';
import PatientDashboard from './Patient/PatientDashboard';
import ReceptionistView from './staff/ReceptionistView';
import { LabTechView } from './staff/LabTechView';
import { CashierView } from './staff/CashierView';
import { AnalyzerView } from './staff/AnalyzerView';
import { StaffDashboard } from './staff/StaffDashboard';
import { BiologistView } from './staff/BiologistView';
import { SuperAdminDashboard } from './superAdmin/SuperAdminDashboard';
import InventoryManagement from './admin/InventoryManagement';
import { DoctorPortal } from './doctor/DoctorPortal';

interface UnifiedDashboardProps {
  onNavigateTab: (tab: string) => void;
  onNotificationPress: () => void;
  onProfilePress: () => void;
  onSelectPatient?: (patient: any) => void;
  onSelectTest?: (test: any) => void;
}

export const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({
  onNavigateTab,
  onNotificationPress,
  onProfilePress,
  onSelectPatient,
  onSelectTest
}) => {
  const { user } = useAuth();
  const currentRole = user?.role || 'patient';

  if (currentRole === 'inventory_manager' || currentRole === 'inventory') {
    return (
      <InventoryManagement
        embedded={false}
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
        onBack={() => onNavigateTab('role-switcher')}
      />
    );
  }

  if (currentRole === 'doctor' || currentRole === 'referring_doctor' || currentRole === 'physician') {
    return (
      <DoctorPortal
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />
    );
  }

  if (currentRole === 'superadmin') {
    return (
      <SuperAdminDashboard 
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />
    );
  }

  if (currentRole === 'patient') {
    return (
      <PatientDashboard
        onNavigateTab={onNavigateTab}
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
        onSelectTest={onSelectTest}
      />
    );
  }

  if (currentRole === 'receptionist') {
    return (
      <ReceptionistView
        onNavigateRegister={() => onNavigateTab('register')}
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
        onRoleSwitcherPress={() => onNavigateTab('role-switcher')}
      />
    );
  }

  if (currentRole === 'cashier') {
    return (
      <CashierView
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
        onRoleSwitcherPress={() => onNavigateTab('role-switcher')}
      />
    );
  }

  if (currentRole === 'analyzer') {
    return (
      <AnalyzerView
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
        onRoleSwitcherPress={() => onNavigateTab('role-switcher')}
      />
    );
  }

  if (currentRole === 'lab_tech' || currentRole === 'labtech') {
    return (
      <LabTechView
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
        onRoleSwitcherPress={() => onNavigateTab('role-switcher')}
      />
    );
  }

  if (currentRole === 'staff') {
    return (
      <StaffDashboard 
        onNavigate={(screen, params) => {
          if (screen === 'PatientDetailsScreen') {
            onSelectPatient?.(params);
          }
        }}
        onOpenRoleSwitcher={() => onNavigateTab('role-switcher')}
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />
    );
  }

  if (currentRole === 'biologist') {
    return (
      <BiologistView
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
        onRoleSwitcherPress={() => onNavigateTab('role-switcher')}
      />
    );
  }

  if (currentRole === 'admin' || currentRole === 'administrator' || currentRole === 'lab_admin' || currentRole === 'manager') {
    return (
      <AdminDashboard
        onNavigateTab={onNavigateTab}
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
        onSelectPatient={onSelectPatient}
      />
    );
  }

  // Explicit Unauthorized / Access Denied Fallback for unrecognized roles
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-5 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto text-2xl font-black">
          🔒
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white tracking-tight">Access Restricted</h2>
          <p className="text-xs text-slate-400">
            Your current role (<span className="font-mono text-rose-300 font-bold">{currentRole}</span>) is not authorized to access this department portal.
          </p>
        </div>

        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-[11px] text-slate-400 text-left font-mono">
          <div>Status: <strong className="text-rose-400">403_FORBIDDEN</strong></div>
          <div>User: <strong className="text-slate-200">{user?.name || 'Unknown'}</strong></div>
          <div>Security Rule: <strong className="text-emerald-400">LIMS_STRICT_RBAC</strong></div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => onNavigateTab('role-switcher')}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            Switch to Authorized Role
          </button>
          <button
            onClick={() => onNavigateTab('overview')}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Return to My Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedDashboard;
