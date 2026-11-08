import React, { useState } from 'react';
import { useAuth } from '../../context/authContext';
import { BatchWorklistScreen } from './BatchWorklistScreen';
import TestCatalogManagement from '../admin/TestCatalogManagement';
import { apiJson } from '../../services/apiClient';
export const LabApp: React.FC = () => {
  const { user, lab, logout } = useAuth();
  const [view, setView] = useState('orders');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const admin = user.roles.includes('admin');
  const staffSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = event.currentTarget; const fields = new FormData(form); setError(''); setNotice('');
    try { await apiJson('/api/staff', { name: fields.get('name'), email: fields.get('email'), password: fields.get('password'), role: fields.get('role') }); form.reset(); setNotice('Staff account created. No invitation message has been sent.'); } catch (err: any) { setError(err.message); }
  };
  return <div className="min-h-screen bg-slate-50 text-slate-900"><header className="bg-white border-b p-4 flex flex-wrap justify-between gap-3"><strong>{lab?.name} · {user.name}</strong><nav className="flex gap-4"><button onClick={() => setView('orders')}>Worklist</button>{admin && <><button onClick={() => setView('catalog')}>Test catalog</button><button onClick={() => setView('staff')}>Create staff account</button></>}<button onClick={logout}>Sign out</button></nav></header>
    {view === 'orders' && <BatchWorklistScreen />}{view === 'catalog' && admin && <TestCatalogManagement onBack={() => setView('orders')} />}
    {view === 'staff' && admin && <main className="max-w-xl mx-auto p-5 space-y-5"><h1 className="text-2xl font-bold">Create staff account</h1><p>The new account can access only this laboratory. Give the initial credentials to its owner through your approved process.</p>{error && <p role="alert" className="text-red-700">{error}</p>}{notice && <p role="status">{notice}</p>}<form onSubmit={staffSubmit} className="space-y-4">{['name', 'email', 'password'].map(field => <label key={field} className="block capitalize">{field}<input name={field} type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'} required minLength={field === 'password' ? 12 : undefined} maxLength={128} className="block border rounded-xl p-3 w-full" /></label>)}<label className="block">Role<select name="role" className="block border p-3 rounded-xl">{['receptionist', 'cashier', 'analyzer', 'labtech', 'biologist', 'admin'].map(role => <option key={role}>{role}</option>)}</select></label><button className="bg-teal-800 text-white p-4 rounded-xl">Create account</button></form></main>}
  </div>;
};
export default LabApp;
