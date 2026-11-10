import { Assistant } from './components/assistant/Assistant';
import { usePortalNavigation } from './hooks/usePortalNavigation';
import PatientRegistrationModal from './components/patient/PatientRegistrationModal';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/authContext';
import { ThemeProvider } from './context/themeContext';
import { LanguageProvider } from './context/languageContext';
const LandingPage = lazy(() => import('./components/website/LandingPage'));
const DoctorApp = lazy(() => import('./screens/doctor/DoctorApp'));
const SuperAdminApp = lazy(() => import('./screens/superAdmin/SuperAdminApp'));
const LoginScreen = lazy(() => import('./screens/auth/LoginScreen'));
const PatientApp = lazy(() => import('./screens/Patient/PatientApp'));
const LabApp = lazy(() => import('./screens/Lab/LabApp'));
const SharedReportViewerScreen = lazy(() => import('./screens/Public/SharedReportViewerScreen'));
function Main() {
  const { user, isLoading, logout } = useAuth();
  const [page, navigate] = usePortalNavigation('public', 'website');
  const goToLogin = (role: 'patient' | 'doctor' | 'lab' = 'patient') => { const url = new URL(window.location.href); url.searchParams.set('portal',role); url.searchParams.set('page','login'); window.history.pushState({},'',url); window.dispatchEvent(new Event('nanolabs_navigation')); };
  const enterWorkspace = (account: any) => { const role = account.role; const url = new URL(window.location.href); url.searchParams.set('portal',role === 'superadmin'?'platform':role === 'patient'||role === 'doctor'?role:'lab'); url.searchParams.set('page',role==='patient'?'home':role==='doctor'?'dashboard':role==='superadmin'?'labs':({cashier:'cashier',biologist:'validation',labtech:'bench',analyzer:'phlebotomy',receptionist:'reception',inventory_manager:'inventory'} as Record<string,string>)[role]||'worklist'); window.history.pushState({},'',url); window.dispatchEvent(new Event('nanolabs_navigation')); };
  const portal = new URLSearchParams(window.location.search).get('portal');
  const [error, setError] = useState('');
  useEffect(() => {
    const show = (event: Event) => setError((event as CustomEvent<string>).detail);
    window.addEventListener('nanolabs_api_error', show);
    return () => window.removeEventListener('nanolabs_api_error', show);
  }, []);
  const shared = new URLSearchParams(window.location.search).has('share');
  return <>{import.meta.env.VITE_ENVIRONMENT === 'staging' && <div role="status" className="bg-amber-100 text-amber-950 text-center text-xs py-2 px-4">Test environment · use synthetic information only</div>}<div aria-live="polite">{error && <div role="alert" className="fixed bottom-4 left-4 right-4 z-[100] max-w-xl mx-auto rounded-xl bg-red-50 text-red-900 border border-red-200 p-4 shadow-lg flex justify-between gap-3"><p>{error}</p><button aria-label="Dismiss error" onClick={() => setError('')}>Dismiss</button></div>}</div>
    {shared ? <SharedReportViewerScreen onGoToLogin={() => window.location.assign(`${window.location.pathname}?page=login&portal=patient`)} /> : page === 'website' ? <LandingPage onGoToPortal={goToLogin} /> : isLoading ? <p role="status" className="p-8">Checking your session…</p> : !user ? page === 'website' ? <LandingPage onGoToPortal={goToLogin} /> : page === 'register' ? <PatientRegistrationModal isOpen onSuccess={enterWorkspace} onClose={() => goToLogin()} /> : <LoginScreen initialPortal={portal === 'doctor' ? 'doctor' : portal === 'lab' ? 'lab' : 'patient'} onLoginSuccess={enterWorkspace} onNavigateWebsite={() => navigate('website')} onNavigateRegister={() => navigate('register')} /> : user.role === 'doctor' ? <DoctorApp /> : user.role === 'superadmin' ? <SuperAdminApp /> : user.role === 'patient' ? <PatientApp /> : user.labId ? <LabApp /> : <main className="p-8 space-y-4"><h1 className="text-xl font-bold">Your account has no laboratory workspace</h1><p>Contact your administrator for laboratory access. Released reports can be opened through patient-authorized sharing links.</p><button onClick={logout}>Sign out</button></main>}
    {user && !shared && page !== 'website' && <Assistant key={user.id} />}
  </>;
}
export default function App() { return <ThemeProvider><LanguageProvider><AuthProvider><Suspense fallback={<p role="status" className="p-8">Loading…</p>}><Main /></Suspense></AuthProvider></LanguageProvider></ThemeProvider>; }
