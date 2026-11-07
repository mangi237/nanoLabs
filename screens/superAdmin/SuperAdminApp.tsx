import React, { useState } from 'react';
import { SuperAdminLayout, SuperAdminNavTab } from '../../components/Layout/SuperAdminLayout';
import { LabManagementScreen } from '../../screens/superAdmin/LabManagementScreen';
import { MonthlySettlementScreen } from '../../screens/superAdmin/MonthlySettlementScreen';
import { SystemAuditScreen } from '../../screens/superAdmin/SystemAuditScreen';
import { MasterCatalogScreen } from '../../screens/superAdmin/MasterCatalogScreen';
import { UserManagementScreen } from './UserManagementScreen';
import { useAuth } from '../../context/authContext';

export const SuperAdminApp: React.FC = () => {
  const { logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<SuperAdminNavTab>('settlements');

  const renderContent = () => {
    switch (currentTab) {
      case 'labs':
        return <LabManagementScreen />;
      case 'settlements':
        return <MonthlySettlementScreen />;
      case 'audit':
        return <SystemAuditScreen />;
      case 'catalog':
        return <MasterCatalogScreen />;
      case 'users':
        return <UserManagementScreen />;
      case 'health':
        return <SystemAuditScreen />;
      default:
        return <MonthlySettlementScreen />;
    }
  };

  return (
    <SuperAdminLayout
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      onLogout={logout}
    >
      {renderContent()}
    </SuperAdminLayout>
  );
};

export default SuperAdminApp;
