import React from 'react';
import { Home, FlaskConical, Navigation, Stethoscope, User, FileText, Users, Building2, ShieldCheck, MessageCircle, ArrowRightLeft, ScanLine, Bell, CalendarDays } from 'lucide-react';
import { TestBatch } from '../../types';
import { PortalShell } from './PortalShell';
export type PatientNavTab = 'home' | 'tests' | 'tracking' | 'doctors' | 'profile' | 'book' | 'results' | 'messages' | 'connect' | 'booklet' | 'chat' | 'insurance' | 'family' | 'transfer' | 'scan' | 'ai' | 'labs' | 'appointments' | 'notifications';

interface PatientLayoutProps {
  currentTab: PatientNavTab;
  onTabChange: (tab: PatientNavTab) => void;
  activeBatch?: TestBatch | null;
  onOpenBatch?: (batchId: string) => void;
  onOpenAI?: () => void;
  children: React.ReactNode;
  onLogout?: () => void;
  hideBottomNav?: boolean;
}

export function PatientLayout({currentTab,onTabChange,children,onLogout}:PatientLayoutProps) {
 const items=[{id:'home',label:'Overview',icon:Home,group:'My care'},{id:'tests',label:'Book a test',icon:FlaskConical,group:'My care'},{id:'tracking',label:'Track requests',icon:Navigation,group:'My care'},{id:'results',label:'My results',icon:FileText,group:'My care'},{id:'appointments',label:'Appointments',icon:CalendarDays,group:'My care'},
 {id:'labs',label:'Laboratories',icon:Building2,group:'Care network'},{id:'doctors',label:'Doctors',icon:Stethoscope,group:'Care network'},{id:'messages',label:'Care messages',icon:MessageCircle,group:'Care network'},{id:'family',label:'Family profiles',icon:Users,group:'Care network'},
 {id:'insurance',label:'Insurance',icon:ShieldCheck,group:'My records'},{id:'booklet',label:'Health booklet',icon:FileText,group:'My records'},{id:'transfer',label:'Transfer requests',icon:ArrowRightLeft,group:'My records'},{id:'scan',label:'Scan prescription',icon:ScanLine,group:'My records'},{id:'notifications',label:'Notifications',icon:Bell,group:'My records'},{id:'profile',label:'My profile',icon:User,group:'My records'}];
 return <PortalShell title="Your health, in one place" subtitle="Patient workspace" current={currentTab} navigate={onTabChange} items={items} logout={onLogout}>{children}</PortalShell>;
}
export default PatientLayout;
