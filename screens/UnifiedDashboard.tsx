import React from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/authContext';
import { canLabUseFeature, getLabPackageConfig, getRequiredPackageNameForFeature } from '../utils/labPackages';
import AdminDashboard from './admin/adminDashboard';
// import PatientDashboard from './patient/PatientDashboard';
import { PatientApp } from './Patient/PatientApp';
import  DoctorApp from './doctor/DoctorApp'
import ReceptionistView from './staff/ReceptionistView';
import { LabTechView } from './staff/LabTechView';
import { CashierView } from './staff/CashierView';
import { AnalyzerView } from './staff/AnalyzerView';
import { StaffDashboard } from './staff/StaffDashboard';
import { BiologistView } from './staff/BiologistView';
import { SuperAdminDashboard } from './superAdmin/SuperAdminDashboard';
import InventoryManagement from './admin/InventoryManagement';
import { DoctorPortal } from './doctor/DoctorPortal';
import { PhlebotomyDispatchScreen } from './Lab/PhlebotomyDispatchScreen';
import StaffSidebar from '../components/common/StaffSidebar';
import { StaffTrainingBookletPage } from './staff/StaffTrainingBookletPage';

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
  const { user, lab, setUser } = useAuth();
  const currentRole = user?.role || 'patient';

  if (currentRole === 'doctor' || currentRole === 'referring_doctor' || currentRole === 'physician') {
    return <DoctorApp />;
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
    return <PatientApp />;
  }

  // Render Staff View Content
  const renderStaffContent = () => {
    switch (currentRole) {
      case 'inventory_manager':
      case 'inventory':
        if (!canLabUseFeature(lab, 'inventory')) {
          const pkg = getLabPackageConfig(lab);
          return (
            <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Inventory Module Not in Current Package</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong>{lab?.name || 'This laboratory'}</strong> is currently on the <strong>{pkg.name}</strong> ({pkg.priceLabel}) plan. Reagent &amp; Consumables Inventory Management requires <strong>{getRequiredPackageNameForFeature('inventory')}</strong> or higher.
              </p>
            </div>
          );
        }
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

      case 'mobile_phlebotomist':
      case 'phlebotomist':
      case 'phlebotomy':
      case 'dispatch':
        return (
          <PhlebotomyDispatchScreen />
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

      case 'training_manual':
      case 'manual':
      case 'staff_training':
      case 'handbook':
      case 'booklet':
        return (
          <StaffTrainingBookletPage
            onBack={() => {
              const fallback = user?.roles?.[0] || 'receptionist';
              const updated = { ...user, role: fallback };
              setUser(updated);
            }}
            onNavigateDesk={(deskRole) => {
              const updated = { ...user, role: deskRole };
              setUser(updated);
            }}
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
