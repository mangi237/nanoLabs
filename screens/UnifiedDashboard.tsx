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
import StaffSidebar from '../components/common/StaffSidebar';

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

  // Render Staff View Content
  const renderStaffContent = () => {
    switch (currentRole) {
      case 'inventory_manager':
      case 'inventory':
        return (
          <InventoryManagement
            embedded={false}
            onNotificationPress={onNotificationPress}
            onProfilePress={onProfilePress}
            onBack={() => onNavigateTab('overview')}
          />
        );

      case 'receptionist':
        return (
          <ReceptionistView
            onNavigateRegister={() => onNavigateTab('register')}
            onNotificationPress={onNotificationPress}
            onProfilePress={onProfilePress}
          />
        );

      case 'cashier':
        return (
          <CashierView
            onNotificationPress={onNotificationPress}
            onProfilePress={onProfilePress}
          />
        );

      case 'analyzer':
        return (
          <AnalyzerView
            onNotificationPress={onNotificationPress}
            onProfilePress={onProfilePress}
          />
        );

      case 'lab_tech':
      case 'labtech':
        return (
          <LabTechView
            onNotificationPress={onNotificationPress}
            onProfilePress={onProfilePress}
          />
        );

      case 'biologist':
        return (
          <BiologistView
            onNotificationPress={onNotificationPress}
            onProfilePress={onProfilePress}
          />
        );

      case 'admin':
      case 'administrator':
      case 'lab_admin':
      case 'manager':
        return (
          <AdminDashboard
            onNavigateTab={onNavigateTab}
            onNotificationPress={onNotificationPress}
            onProfilePress={onProfilePress}
            onSelectPatient={onSelectPatient}
          />
        );

      case 'staff':
      default:
        return (
          <StaffDashboard 
            onNavigate={(screen, params) => {
              if (screen === 'PatientDetailsScreen') {
                onSelectPatient?.(params);
              }
            }}
            onNotificationPress={onNotificationPress}
            onProfilePress={onProfilePress}
          />
        );
    }
  };

  // Staff Unified Layout with Left Sidebar
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <StaffSidebar
        onNotificationPress={onNotificationPress}
        onNavigateTab={onNavigateTab}
      />
      <div className="flex-1 min-w-0 overflow-x-hidden">
        {renderStaffContent()}
      </div>
    </div>
  );
};

export default UnifiedDashboard;
