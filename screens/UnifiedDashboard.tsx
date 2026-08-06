import React from 'react';
import { useAuth } from '../context/authContext';
import AdminDashboard from './admin/adminDashboard';
import PatientDashboard from './Patient/PatientDashboard';
import ReceptionistView from './staff/ReceptionistView';
import { LabTechView } from './staff/LabTechView';
import { CashierView } from './staff/CashierView';
import { AnalyzerView } from './staff/AnalyzerView';
import { StaffDashboard } from './staff/StaffDashboard';
import { SuperAdminDashboard } from './superAdmin/SuperAdminDashboard';

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

  if (currentRole === 'superadmin') {
    return <SuperAdminDashboard />;
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
      />
    );
  }

  // Default to Admin Dashboard for admin
  return (
    <AdminDashboard
      onNavigateTab={onNavigateTab}
      onNotificationPress={onNotificationPress}
      onProfilePress={onProfilePress}
      onSelectPatient={onSelectPatient}
    />
  );
};

export default UnifiedDashboard;
