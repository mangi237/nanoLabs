import { LabLayout, type LabNavTab } from '../../components/Layout/LabLayout';
import { usePortalNavigation } from '../../hooks/usePortalNavigation';
import { ResourcePage, ConfigPage } from '../../components/portal/ResourcePage';
import { ProfilePage } from '../../components/portal/ProfilePage';
import React, { useState } from 'react';
import { useAuth } from '../../context/authContext';
import { BatchWorklistScreen } from './BatchWorklistScreen';
import TestCatalogManagement from '../admin/TestCatalogManagement';
import { apiJson } from '../../services/apiClient';
export const LabApp: React.FC = () => {
  const { user, lab, logout } = useAuth();
  const [view, setView] = usePortalNavigation('lab', user.role === 'inventory_manager' ? 'inventory' : user.role === 'cashier' ? 'cashier' : user.role === 'biologist' ? 'validation' : user.role === 'labtech' ? 'bench' : user.role === 'analyzer' ? 'phlebotomy' : user.role === 'receptionist' ? 'reception' : 'worklist');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const admin = user.roles.includes('admin');
  const staffSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = event.currentTarget; const fields = new FormData(form); setError(''); setNotice('');
    try { await apiJson('/api/staff', { name: fields.get('name'), email: fields.get('email'), password: fields.get('password'), role: fields.get('role') }); form.reset(); setNotice('Staff account created. No invitation message has been sent.'); } catch (err: any) { setError(err.message); }
  };
  const deskPages: Record<string, {title:string;stages?:string[]}> = { worklist:{title:'Laboratory worklist'}, reception:{title:'Reception intake',stages:['Pending_Validation']}, cashier:{title:'Cashier desk',stages:['Pending_Payment']}, phlebotomy:{title:'Sample collection and dispatch',stages:['Pending_Collection']}, bench:{title:'Analyzer bench',stages:['In_Lab_Testing']}, validation:{title:'Biologist validation',stages:['Pending_Biologist_Validation']}, release:{title:'Released reports',stages:['Completed']} };
  return <LabLayout currentTab={view as LabNavTab} onTabChange={setView} onLogout={logout}>
    {deskPages[view] && <BatchWorklistScreen key={view} {...deskPages[view]} />}{view === 'catalog' && admin && <TestCatalogManagement onBack={() => setView('worklist')} />}
    {view === 'staff' && admin && <main className="max-w-xl mx-auto p-5 space-y-5"><h1 className="text-2xl font-bold">Create staff account</h1><p>The new account can access only this laboratory. Give the initial credentials to its owner through your approved process.</p>{error && <p role="alert" className="text-red-700">{error}</p>}{notice && <p role="status">{notice}</p>}<form onSubmit={staffSubmit} className="space-y-4">{['name', 'email', 'password'].map(field => <label key={field} className="block capitalize">{field}<input name={field} type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'} required minLength={field === 'password' ? 12 : undefined} maxLength={128} className="block border rounded-xl p-3 w-full" /></label>)}<label className="block">Role<select name="role" className="block border p-3 rounded-xl">{['receptionist', 'cashier', 'analyzer', 'labtech', 'biologist', 'admin'].map(role => <option key={role}>{role}</option>)}</select></label><button className="bg-teal-800 text-white p-4 rounded-xl">Create account</button></form></main>}
    {view === 'staff' && admin && <ResourcePage title="Laboratory staff" endpoint="/api/portal/staff" columns={[{key:'name',label:'Name'},{key:'email',label:'Email'},{key:'role',label:'Role'},{key:'status',label:'Status'}]} />}
    {view === 'patients' && admin && <ResourcePage title="Patient directory" endpoint="/api/portal/patients" columns={[{key:'name',label:'Patient'},{key:'phone',label:'Phone'},{key:'bookingCount',label:'Requests'}]} />}
    {view === 'inventory' && <ResourcePage title="Reagent inventory" help="Track reagent quantities, minimum stock levels, and expiry dates for your laboratory." endpoint="/api/portal/inventory" columns={[{key:'name',label:'Reagent'},{key:'quantity',label:'Stock'},{key:'unit',label:'Unit'},{key:'minimumStock',label:'Minimum stock'},{key:'expiryDate',label:'Expires'}]} fields={[{key:'name',label:'Reagent name'},{key:'quantity',label:'Quantity',type:'number'},{key:'unit',label:'Unit'},{key:'minimumStock',label:'Minimum stock',type:'number'},{key:'expiryDate',label:'Expiry date',type:'date'}]} />}
    {view === 'stats' && <ResourcePage title="Laboratory analytics" endpoint="/api/portal/analytics" columns={[{key:'label',label:'Metric'},{key:'value',label:'Value'}]} />}
    {view === 'audit' && <ResourcePage title="Audit trail" endpoint="/api/portal/audit" columns={[{key:'title',label:'Event'},{key:'actorName',label:'Performed by'},{key:'actorRole',label:'Role'},{key:'timestamp',label:'Time'}]} />}
    {view === 'payments' && admin && <ConfigPage title="Payment settings" endpoint="/api/portal/payment-settings" fields={[{key:'mtnMomoNumber',label:'MTN Mobile Money number'},{key:'mtnMomoName',label:'MTN account name'},{key:'orangeMoneyNumber',label:'Orange Money number'},{key:'orangeMoneyName',label:'Orange account name'},{key:'bankName',label:'Bank name'},{key:'bankAccountName',label:'Bank account name'},{key:'bankAccountNumber',label:'Bank account number'}]} />}
    {view === 'profile' && <ProfilePage />}
    {(!deskPages[view]&&!['catalog','staff','patients','inventory','stats','audit','payments','profile'].includes(view)) && <section><h1 className="text-2xl font-bold">Page not found</h1><button onClick={()=>setView('worklist')}>Return to worklist</button></section>}
  </LabLayout>;
};
export default LabApp;
