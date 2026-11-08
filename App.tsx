import React, { lazy, Suspense, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/authContext';
import { ThemeProvider } from './context/themeContext';
import { LanguageProvider } from './context/languageContext';
const LoginScreen = lazy(() => import('./screens/auth/LoginScreen'));
const PatientApp = lazy(() => import('./screens/Patient/PatientApp'));
const LabApp = lazy(() => import('./screens/Lab/LabApp'));
const SharedReportViewerScreen = lazy(() => import('./screens/Public/SharedReportViewerScreen'));
function Main() {
  const { user, isLoading, logout } = useAuth();
  const [error, setError] = useState('');
  useEffect(() => {
    const show = (event: Event) => setError((event as CustomEvent<string>).detail);
    window.addEventListener('nanolabs_api_error', show);
    return () => window.removeEventListener('nanolabs_api_error', show);
  }, []);
  const shared = new URLSearchParams(window.location.search).has('share');
  return <><div aria-live="polite">{error && <div role="alert" className="fixed bottom-4 left-4 right-4 z-[100] max-w-xl mx-auto rounded-xl bg-red-50 text-red-900 border border-red-200 p-4 shadow-lg flex justify-between gap-3"><p>{error}</p><button aria-label="Dismiss error" onClick={() => setError('')}>Dismiss</button></div>}</div>
    {shared ? <SharedReportViewerScreen onGoToLogin={() => window.location.assign(window.location.pathname)} /> : isLoading ? <p role="status" className="p-8">Checking your session…</p> : !user ? <LoginScreen initialPortal="patient" /> : user.role === 'patient' ? <PatientApp /> : user.labId ? <LabApp /> : <main className="p-8 space-y-4"><h1 className="text-xl font-bold">Your account has no laboratory workspace</h1><p>Contact your administrator for laboratory access. Released reports can be opened through patient-authorized sharing links.</p><button onClick={logout}>Sign out</button></main>}
  </>;
}
export default function App() { return <ThemeProvider><LanguageProvider><AuthProvider><Suspense fallback={<p role="status" className="p-8">Loading…</p>}><Main /></Suspense></AuthProvider></LanguageProvider></ThemeProvider>; }
