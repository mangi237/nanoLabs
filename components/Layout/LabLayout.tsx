import React from 'react';
import { Users, CreditCard, Syringe, Cpu, CheckSquare, FileCheck2, Boxes, BarChart3, ShieldCheck, List, Settings, User, FlaskConical } from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { PortalShell } from './PortalShell';
export type LabNavTab = 
  | 'reception'
  | 'worklist'
  | 'cashier'
  | 'phlebotomy'
  | 'bench'
  | 'validation'
  | 'release'
  | 'inventory'
  | 'stats'
  | 'audit' | 'catalog' | 'staff' | 'payments' | 'profile' | 'patients';

export function LabLayout({currentTab,onTabChange,children,onLogout}:{currentTab:LabNavTab;onTabChange:(page:LabNavTab)=>void;children:React.ReactNode;onLogout?:()=>void}) {
 const {user,lab}=useAuth(); const admin=user.roles.includes('admin'); const allowed=(...roles:string[])=>admin||user.roles.some((role:string)=>roles.includes(role));
 const items=[
 {id:'worklist',label:'All requests',icon:CheckSquare,group:'Patient workflow',show:allowed('labtech','biologist')},
 {id:'reception',label:'Reception',icon:Users,group:'Patient workflow',show:allowed('receptionist')},
 {id:'cashier',label:'Cashier desk',icon:CreditCard,group:'Patient workflow',show:allowed('cashier')},
 {id:'phlebotomy',label:'Sample collection',icon:Syringe,group:'Patient workflow',show:allowed('analyzer')},
 {id:'bench',label:'Analyzer bench',icon:Cpu,group:'Patient workflow',show:allowed('labtech','analyzer')},
 {id:'validation',label:'Validation',icon:FileCheck2,group:'Patient workflow',show:allowed('biologist')},
 {id:'patients',label:'Patients',icon:Users,group:'Management',show:admin},
 {id:'catalog',label:'Test catalog',icon:FlaskConical,group:'Management',show:admin},
 {id:'inventory',label:'Reagent inventory',icon:Boxes,group:'Management',show:allowed('inventory_manager')},
 {id:'staff',label:'Team members',icon:Users,group:'Management',show:admin},
 {id:'stats',label:'Analytics',icon:BarChart3,group:'Management',show:admin},
 {id:'audit',label:'Audit trail',icon:ShieldCheck,group:'Management',show:admin},
 {id:'payments',label:'Payment settings',icon:Settings,group:'Settings',show:admin},
 {id:'profile',label:'My profile',icon:User,group:'Settings',show:true}].filter(item=>item.show);
 return <PortalShell title={lab?.name||'Laboratory workspace'} subtitle="Laboratory operations" current={currentTab} navigate={onTabChange} items={items} logout={onLogout}>{children}</PortalShell>;
}
export default LabLayout;
