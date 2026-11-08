import { signInWithCustomToken, setPersistence, browserSessionPersistence, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { apiJson } from './apiClient';

export interface AuthResult { success: boolean; user?: any; lab?: any; role?: string; mustChangePassword?: boolean; error?: string; }
async function session(): Promise<AuthResult> {
  const data = await apiJson('/api/auth/session');
  return { ...data, role: data.user.role, mustChangePassword: false };
}
async function login(identifier: string, password: string, portal: 'patient' | 'doctor' | 'staff') {
  const data = await apiJson('/api/auth/login', { identifier, password, portal });
  await setPersistence(auth, browserSessionPersistence);
  await signInWithCustomToken(auth, data.customToken);
  try { return await session(); } catch (error) { await signOut(auth); throw error; }
}
export const authService = {
  session,
  logout: () => signOut(auth),
  verifyAccessCode: (password = '', identifier = '') => login(identifier, password, 'staff'),
  loginPatient: (identifier: string, password: string, _labId?: string) => login(identifier, password, 'patient'),
  loginDoctor: (identifier: string, password: string) => login(identifier, password, 'doctor'),
  async registerPatient(_labId: string, data: any): Promise<{ success: boolean; id?: string; patient?: any; error?: string }> {
    const payload = { name: data.name, alias: data.alias, phone: String(data.phone).replace(/[\s()-]/g, ''), password: data.password,
      email: data.email ?? '', dateOfBirth: data.dateOfBirth, gender: data.gender, city: data.city ?? '',
      ...(data.labId ? { labId: data.labId } : {}) };
    const result = await apiJson('/api/auth/register-patient', payload);
    try { await login(payload.phone, data.password, 'patient'); }
    catch (error) { throw new Error('Your account was created, but automatic sign-in failed. Close this form and sign in with your phone number and password.'); }
    return { success: true, id: result.patient.id, patient: result.patient };
  },
  async getAllLabs(_options?: { includePending?: boolean }): Promise<any[]> { return (await apiJson('/api/labs')).labs; },
  async getLabDetails(labId: string, _name?: string) {
    const lab = (await this.getAllLabs()).find(lab => lab.id === labId);
    if (!lab) throw new Error('This laboratory is unavailable.');
    return lab;
  },
  async createStaffWithCode(data: any, _adminUser?: any) {
    return apiJson('/api/staff', { name: data.name, email: data.email, password: data.password ?? data.initialCode ?? data.accessCode, role: data.primaryRole ?? data.role ?? data.roles?.[0] });
  },
  async inviteStaff(_data: any, _adminUser?: any): Promise<any> { throw new Error('Create a v2 staff account with an email and a private password. Email invitation delivery is not available.'); },
  async resetStaffAccessCode(_staffId: string, _email: string, _code: string, _labId?: string, _adminUser?: any): Promise<any> { throw new Error('Access-code resets are disabled. Use the secure account password process.'); },
  async setPermanentPassword(_staffId: string, _email: string, _password: string, _labId?: string): Promise<any> { throw new Error('This access-code setup link is unavailable in v2. Sign in with your v2 account password.'); },
  async resendStaffInvite(_staffId: string, _email: string, _adminUser?: any): Promise<any> { throw new Error('Invitation delivery is not configured. No invitation was sent.'); },
  async updateStaffRoles(staffId: string, _email: string, roles: string[], primaryRole?: string, _adminUser?: any) { return apiJson(`/api/staff/${encodeURIComponent(staffId)}`, { role: primaryRole ?? roles[0] }, { method: 'PATCH' }); },
  async verifyStaffActionCode(inputCode: string, allowedRoles: string[], _currentCode?: string, _labId?: string) { return apiJson('/api/auth/reauthenticate', { password: inputCode, allowedRoles }); },
  async getAuditLogs() { return (await apiJson('/api/staff/audit-logs')).logs; },
  async getServerStaffList() { return (await apiJson('/api/staff/list')).staff; },
};
export default authService;
