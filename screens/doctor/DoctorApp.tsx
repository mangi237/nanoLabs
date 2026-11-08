import { BookingResults } from '../../components/results/BookingResults';
import React from 'react';
import { DoctorLayout, type DoctorNavTab } from '../../components/Layout/DoctorLayout';
import { useAuth } from '../../context/authContext';
import { usePortalNavigation } from '../../hooks/usePortalNavigation';
import { ResourcePage } from '../../components/portal/ResourcePage';
import { ProfilePage } from '../../components/portal/ProfilePage';
import { CareMessages } from '../../components/portal/CareMessages';
export const DoctorApp: React.FC = () => {
  const { logout }=useAuth();const [page,navigate]=usePortalNavigation('doctor','dashboard');
  return <DoctorLayout currentTab={page as DoctorNavTab} onTabChange={navigate} onLogout={logout}>
    {page==='dashboard'&&<ResourcePage title="Today’s clinical requests" endpoint="/api/portal/requests" columns={[{key:'patientName',label:'Patient'},{key:'tests',label:'Requested tests'},{key:'status',label:'Status'},{key:'createdAt',label:'Created'}]} />}
    {page==='patients'&&<ResourcePage title="My patients" endpoint="/api/portal/connections" columns={[{key:'patientName',label:'Patient'},{key:'status',label:'Care connection'}]} />}
    {page==='reports'&&<ResourcePage title="Diagnostic reports" help="Only released reports explicitly shared by patients appear here." endpoint="/api/portal/reports" columns={[{key:'patientName',label:'Patient'},{key:'labName',label:'Laboratory'},{key:'biologistName',label:'Released by'},{key:'biologistSignedAt',label:'Released at'}]} actions={row=><details><summary className="cursor-pointer underline">View report</summary><BookingResults booking={row}/></details>} />}
    {page==='directory'&&<ResourcePage title="Laboratory directory" endpoint="/api/labs" recordKey="labs" columns={[{key:'name',label:'Laboratory'},{key:'city',label:'City'},{key:'address',label:'Address'},{key:'phone',label:'Contact'}]} />}
    {page==='new_request'&&<ResourcePage title="New laboratory request" help="Choose an accepted care connection. The patient can review the requested tests before booking." endpoint="/api/portal/requests" columns={[{key:'patientName',label:'Patient'},{key:'tests',label:'Tests'},{key:'status',label:'Status'}]} fields={[{key:'connectionId',label:'Patient care connection',type:'select',endpoint:'/api/portal/connections',labelKey:'patientName'},{key:'tests',label:'Tests to request',type:'textarea'},{key:'notes',label:'Notes',type:'textarea'}]} />}
    {page==='connect'&&<CareMessages />}{page==='profile'&&<ProfilePage />}
    {!['dashboard','patients','reports','directory','new_request','connect','profile'].includes(page)&&<section><h1 className="text-2xl font-bold">Page not found</h1><button onClick={()=>navigate('dashboard')}>Doctor dashboard</button></section>}
  </DoctorLayout>;
};
export default DoctorApp;
