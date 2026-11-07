import React, { useState } from 'react';
import { LabLayout, LabNavTab } from '../../components/layouts/LabLayout';
import { ReceptionIntakeScreen } from './ReceptionIntakeScreen';
import { BatchWorklistScreen } from './BatchWorklistScreen';
import { CashierScreen } from './CashierScreen';
import { PhlebotomyDispatchScreen } from './PhlebotomyDispatchScreen';
import { EquipmentMonitorScreen } from './EquipmentMonitorScreen';
import { BiologistValidationScreen } from './BiologistValidationScreen';
import InventoryManagement from '../admin/InventoryManagement';
import AnalyticsDashboard from '../admin/AnalyticsDashboard';
import ReportsScreen from '../admin/ReportsScreen';
import { useAuth } from '../../context/authContext';

export const LabApp: React.FC = () => {
  const { user, logout } = useAuth();

  // Pick initial tab based on role clearance
  const getInitialTab = (): LabNavTab => {
    const role = user?.role || user?.primaryRole;
    if (role === 'cashier') return 'cashier';
    if (role === 'phlebotomist') return 'phlebotomy';
    if (role === 'biologist') return 'validation';
    if (role === 'technician') return 'bench';
    return 'worklist';
  };

  const [currentTab, setCurrentTab] = useState<LabNavTab>(getInitialTab());

  const renderContent = () => {
    switch (currentTab) {
      case 'reception':
        return <ReceptionIntakeScreen />;
      case 'worklist':
        return <BatchWorklistScreen />;
      case 'cashier':
        return <CashierScreen />;
      case 'phlebotomy':
        return <PhlebotomyDispatchScreen />;
      case 'bench':
        return <EquipmentMonitorScreen />;
      case 'validation':
      case 'release':
        return <BiologistValidationScreen />;
      case 'inventory':
        return <InventoryManagement onBack={() => setCurrentTab('worklist')} />;
      case 'stats':
        return <AnalyticsDashboard onBack={() => setCurrentTab('worklist')} />;
      case 'audit':
        return <ReportsScreen onBack={() => setCurrentTab('worklist')} />;
      default:
        return <BatchWorklistScreen />;
    }
  };

  return (
    <LabLayout
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      onLogout={logout}
    >
      {renderContent()}
    </LabLayout>
  );
};

export default LabApp;
