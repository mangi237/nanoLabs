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
import { useState } from 'react';
interface UnifiedDashboardProps {
  onNavigateTab: (tab: string) => void;
  onNotificationPress: () => void;
  onProfilePress: () => void;
  onSelectPatient?: (patient: any) => void;
  onSelectTest?: (test: any) => void;
}
type ScreenType =
  | 'login'
  | 'register'
  | 'select-lab'
  | 'dashboard'
  | 'admin-dashboard'
  | 'staff'
  | 'analytics'
  | 'inventory'
  | 'catalog'
  | 'patient-list'
  | 'reports'
  | 'patient-dashboard'
  | 'book-appointment'
  | 'appointment'
  | 'test-history'
  | 'transfer'
  | 'share'
  | 'result-view'
  | 'notifications'
  | 'patient-details'
  | 'profile'
  | 'role-switcher'
  | 'receptionist';


export const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({
  onNavigateTab,
  onNotificationPress,
  onProfilePress,
  onSelectPatient,
  onSelectTest
}) => {
  const { user } = useAuth();
  const currentRole = user?.role || 'admin';

  if (currentRole === 'superadmin') {
    return <SuperAdminDashboard />;
  }

  const [screen, setScreen] = useState<ScreenType>(user ? 'dashboard' : 'login');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState<any>(null);

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
      onBack={() => setScreen('dashboard')}
      onNavigateRegister={() => setScreen('register')}
      onNotificationPress={() => setScreen('notifications')}
      onProfilePress={() => setScreen('profile')}
      onNavigatePatientDetails={(patientId: string) => {
        setSelectedPatient({ id: patientId });
        setScreen('patient-details');
      }}
    />
    );
  }

  if (currentRole === 'cashier') {
    return <CashierView />;
  }

  if (currentRole === 'analyzer') {
    return <AnalyzerView />;
  }

  if (currentRole === 'lab_tech') {
    return <LabTechView />;
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
