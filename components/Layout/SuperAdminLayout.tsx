import React from 'react';
import { Building2, Receipt, ShieldAlert, Database, Users, Activity } from 'lucide-react';
import { PortalShell } from './PortalShell';
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

export function SuperAdminLayout({currentTab,onTabChange,children,onLogout}:SuperAdminLayoutProps) {
 const items=[{id:'labs',label:'Partner laboratories',icon:Building2,group:'Platform'},{id:'users',label:'Platform users',icon:Users,group:'Platform'},{id:'catalog',label:'Master test catalog',icon:Database,group:'Platform'},{id:'settlements',label:'Settlements',icon:Receipt,group:'Oversight'},{id:'audit',label:'System audit',icon:ShieldAlert,group:'Oversight'},{id:'health',label:'System health',icon:Activity,group:'Oversight'}];
 return <PortalShell title="Partner network" subtitle="Platform administration" current={currentTab} navigate={onTabChange} items={items} logout={onLogout}>{children}</PortalShell>;
}
export default SuperAdminLayout;
