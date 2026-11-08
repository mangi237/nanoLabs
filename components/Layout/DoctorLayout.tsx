import React from 'react';
import { LayoutDashboard, FilePlus, Users, FileText, Building2, MessageCircle, User } from 'lucide-react';
import { PortalShell } from './PortalShell';
export type DoctorNavTab = 
  | 'dashboard'
  | 'new_request'
  | 'patients'
  | 'reports'
  | 'directory'
  | 'connect'
  | 'profile';

interface DoctorLayoutProps {
  currentTab: DoctorNavTab;
  onTabChange: (tab: DoctorNavTab) => void;
  children: React.ReactNode;
  onLogout?: () => void;
}

export function DoctorLayout({currentTab,onTabChange,children,onLogout}:DoctorLayoutProps) {
 const items=[{id:'dashboard',label:'Clinical requests',icon:LayoutDashboard,group:'Patient care'},{id:'new_request',label:'New lab request',icon:FilePlus,group:'Patient care'},{id:'patients',label:'My patients',icon:Users,group:'Patient care'},{id:'reports',label:'Shared reports',icon:FileText,group:'Patient care'},{id:'connect',label:'Care messages',icon:MessageCircle,group:'Patient care'},{id:'directory',label:'Laboratories',icon:Building2,group:'My practice'},{id:'profile',label:'My profile',icon:User,group:'My practice'}];
 return <PortalShell title="Your clinical workspace" subtitle="Physician portal" current={currentTab} navigate={onTabChange} items={items} logout={onLogout}>{children}</PortalShell>;
}
export default DoctorLayout;
