import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/authContext';
import { ThemeProvider } from './context/themeContext';
import { LanguageProvider } from './context/languageContext';
import { LandingPage } from './components/website/LandingPage';

// Auth screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import SetPermanentPasswordScreen from './screens/auth/SetPermanentPasswordScreen';

// Shared components
import OfflineStatusIndicator from './components/common/OfflineStatusIndicator';

// Staff and admin screens
import UnifiedDashboard from './screens/UnifiedDashboard';
import AdminDashboard from './screens/admin/adminDashboard';
import AnalyticsDashboard from './screens/admin/AnalyticsDashboard';
import InventoryManagement from './screens/admin/InventoryManagement';
import PatientManagement from './screens/admin/PatientManagement';
import ReportsScreen from './screens/admin/ReportsScreen';
import StaffManagement from './screens/admin/StaffManagement';
import TestCatalogManagement from './screens/admin/TestCatalogManagement';
import ReceptionistView from './screens/staff/ReceptionistView';
import RoleSwitcher from './screens/staff/RoleSwitcher';
import StaffTrainingBookletPage from './screens/staff/StaffTrainingBookletPage';

// Patient screens
import PatientApp from './screens/Patient/PatientApp';
import AppointmentScreen from './screens/Patient/AppointmentScreen';
import BookAppointmentScreen from './screens/Patient/BookAppointmentScreen';
import TestHistoryScreen from './screens/Patient/TestHistoryScreen';
import TransferScreen from './screens/Patient/TransferScreen';
import ShareResultsScreen from './screens/Patient/ShareResultsScreen';
import ResultViewScreen from './screens/Patient/ResultViewScreen';
import RegistrationCompleteScreen from './screens/Patient/RegistrationCompleteScreen';

// Other screens
import SharedReportViewerScreen from './screens/Public/SharedReportViewerScreen';
import NotificationsScreen from './screens/NotificationScreen';
import PatientDetailsScreen from './screens/PatientDetailsScreen';
import ProfileScreen from './screens/ProfileScreen';

import { Activity, RefreshCw } from 'lucide-react';

type ScreenType =
  | 'website'
  | 'login'
  | 'register'
  | 'registration-complete'
  | 'dashboard'
  | 'admin-dashboard'
  | 'staff-training'
  | 'staff'
  | 'analytics'
  | 'inventory'
  | 'catalog'
  | 'patient-list'
  | 'reports'
  | 'book-appointment'
  | 'appointment'
  | 'test-history'
  | 'transfer'
  | 'share'
  | 'result-view'
  | 'receptionist'
  | 'notifications'
  | 'patient-details'
  | 'profile'
  | 'role-switcher';

const isPublicReportUrl = (): boolean => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return (
    params.get('view') === 'verify-report' ||
    !!params.get('code') ||
    !!params.get('shared') ||
    !!params.get('verify')
  );
};

const MainAppContent: React.FC = () => {
  const { user, setUser, lab, isLoading, logout } = useAuth();

  const [screen, setScreen] = useState<ScreenType>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('screen') === 'login' || params.get('portal') === 'login') return 'login';
      if (params.get('screen') === 'register') return 'register';
    }
    return user ? 'dashboard' : 'website';
  });

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [registeredPatient, setRegisteredPatient] = useState<any>(null);
  const [preselectedBookingTests] = useState<any[]>([]);
  const [bookingInitialStep] = useState<1 | 2 | 3>(1);

  // Shortcuts used by most screens
  const goDashboard = () => setScreen('dashboard');
  const goNotifications = () => setScreen('notifications');
  const goProfile = () => setScreen('profile');

  const openPatient = (patient: any) => {
    setSelectedPatient(patient);
    setScreen('patient-details');
  };

  const openResult = (test: any) => {
    setSelectedTest(test);
    setScreen('result-view');
  };

  const handleSignOut = () => {
    logout();
    setSelectedPatient(null);
    setSelectedTest(null);
    setScreen('website');
  };

  // Sidebar and tab navigation used by the dashboards
  const handleNavigateTab = (tab: string) => {
    const map: Record<string, ScreenType> = {
      overview: 'dashboard',
      admin: 'admin-dashboard',
      'admin-dashboard': 'admin-dashboard',
      'patient-dashboard': 'dashboard',
      staff: 'staff',
      analytics: 'analytics',
      inventory: 'inventory',
      catalog: 'catalog',
      reports: 'reports',
      patients: 'patient-list',
      book: 'book-appointment',
      history: 'test-history',
      share: 'share',
      transfer: 'transfer',
      register: 'register',
      'role-switcher': 'role-switcher',
      receptionist: 'receptionist',
      'staff-training': 'staff-training',
      'training-booklet': 'staff-training',
      'staff-manual': 'staff-training',
    };
    setScreen(map[tab] ?? 'dashboard');
  };

  // 1. Waiting for the saved session to load
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-slate-900 flex flex-col items-center justify-center p-6 text-white select-none">
        <div className="flex flex-col items-center space-y-6 max-w-sm text-center">
          <div className="w-20 h-20 rounded-3xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400 shadow-2xl">
            <Activity className="w-10 h-10 stroke-[2.5]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-white">
              nano<span className="text-teal-400">Labs</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Clinical Diagnostic & Laboratory Intelligence System
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-teal-300/80 font-mono pt-2">
            <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Public shared report links (from WhatsApp or SMS)
  if (isPublicReportUrl()) {
    return (
      <SharedReportViewerScreen
        onGoToLogin={() => {
          if (typeof window !== 'undefined') {
            window.history.pushState({}, document.title, window.location.pathname);
          }
          setScreen('login');
        }}
        onGoToWebsite={() => {
          if (typeof window !== 'undefined') {
            window.history.pushState({}, document.title, window.location.pathname);
          }
          setScreen('website');
        }}
      />
    );
  }

  // 3. Not signed in
  if (!user) {
    if (screen === 'website') {
      return (
        <div className="min-h-[100dvh] bg-slate-50 font-sans antialiased">
          <LandingPage onGoToPortal={() => setScreen('login')} />
        </div>
      );
    }

    if (screen === 'register') {
      return (
        <div className="min-h-[100dvh] bg-slate-50 font-sans antialiased">
          <OfflineStatusIndicator />
          <RegisterScreen
            onBackToLogin={() => setScreen('login')}
            onRegisterSuccess={(patientData) => {
              setRegisteredPatient(patientData);
              setScreen('registration-complete');
            }}
          />
        </div>
      );
    }

    if (screen === 'registration-complete') {
      return (
        <div className="min-h-[100dvh] bg-slate-50 font-sans antialiased">
          <RegistrationCompleteScreen
            patientData={registeredPatient}
            onGoToLogin={() => setScreen('login')}
            onGoToDashboard={() => {
              if (registeredPatient) {
                setUser({
                  id: registeredPatient.id || registeredPatient.patientId,
                  patientId: registeredPatient.patientId,
                  name: registeredPatient.name,
                  accessCode: registeredPatient.accessCode,
                  labId: registeredPatient.labId,
                  labName: registeredPatient.labName,
                  role: 'patient',
                  roles: ['patient'],
                });
              }
              setScreen('dashboard');
            }}
          />
        </div>
      );
    }

    // Default: login screen
    return (
      <div className="min-h-[100dvh] bg-slate-50 font-sans antialiased">
        <OfflineStatusIndicator />
        <LoginScreen
          onLoginSuccess={() => setScreen('dashboard')}
          onNavigateWebsite={() => setScreen('website')}
        />
      </div>
    );
  }

  // 4. Signed in, but must set a permanent password first
  if (user.mustChangePassword) {
    return (
      <SetPermanentPasswordScreen
        onSuccess={(updatedUser: any) => {
          setUser(updatedUser);
          setScreen('dashboard');
        }}
      />
    );
  }

  // 5. Signed in: route to the right screen
  const renderScreen = () => {
    switch (screen) {
      case 'dashboard':
        if (user.role === 'patient') {
          return <PatientApp />;
        }
        return (
          <UnifiedDashboard
            onNavigateTab={handleNavigateTab}
            onNotificationPress={goNotifications}
            onProfilePress={goProfile}
            onSelectPatient={openPatient}
            onSelectTest={openResult}
          />
        );

      case 'admin-dashboard':
        return (
          <AdminDashboard
            onNavigateTab={handleNavigateTab}
            onNotificationPress={goNotifications}
            onProfilePress={goProfile}
            onSelectPatient={openPatient}
          />
        );

      case 'staff-training':
        return (
          <StaffTrainingBookletPage
            onBack={goDashboard}
            onNavigateDesk={(deskRole: string) => {
              setUser({ ...user, role: deskRole });
              goDashboard();
            }}
          />
        );

      case 'staff':
        return (
          <StaffManagement
            onBack={goDashboard}
            onNotificationPress={goNotifications}
            onProfilePress={goProfile}
          />
        );

      case 'analytics':
        return (
          <AnalyticsDashboard
            onBack={goDashboard}
            onNotificationPress={goNotifications}
            onProfilePress={goProfile}
          />
        );

      case 'inventory':
        return (
          <InventoryManagement
            onBack={goDashboard}
            onNotificationPress={goNotifications}
            onProfilePress={goProfile}
          />
        );

      case 'catalog':
        return (
          <TestCatalogManagement
            onBack={goDashboard}
            onNotificationPress={goNotifications}
            onProfilePress={goProfile}
          />
        );

      case 'patient-list':
        return (
          <PatientManagement
            onBack={goDashboard}
            onNotificationPress={goNotifications}
            onProfilePress={goProfile}
            onSelectPatient={openPatient}
          />
        );

      case 'reports':
        return (
          <ReportsScreen
            onBack={goDashboard}
            onNotificationPress={goNotifications}
            onProfilePress={goProfile}
          />
        );

      case 'book-appointment':
        return (
          <BookAppointmentScreen
            onBack={goDashboard}
            onSuccess={goDashboard}
            onNotificationPress={goNotifications}
            onProfilePress={goProfile}
            initialSelectedTests={preselectedBookingTests}
            initialStep={bookingInitialStep}
          />
        );

      case 'appointment':
        return (
          <AppointmentScreen
            onBack={goDashboard}
            onNavigateBook={() => setScreen('book-appointment')}
            onNotificationPress={goNotifications}
            onProfilePress={goProfile}
          />
        );

      case 'test-history':
        return (
          <TestHistoryScreen
            onBack={goDashboard}
            onSelectTest={openResult}
            onNotificationPress={goNotifications}
            onProfilePress={goProfile}
          />
        );

      case 'transfer':
        return (
          <TransferScreen
            onBack={goDashboard}
            onNotificationPress={goNotifications}
            onProfilePress={goProfile}
          />
        );

      case 'share':
        return (
          <ShareResultsScreen
            onBack={goDashboard}
            onNotificationPress={goNotifications}
            onProfilePress={goProfile}
          />
        );

      case 'result-view':
        return (
          <ResultViewScreen
            test={selectedTest}
            onBack={goDashboard}
            onNotificationPress={goNotifications}
            onProfilePress={goProfile}
          />
        );

      case 'receptionist':
        return (
          <ReceptionistView
            onBack={goDashboard}
            onNavigateRegister={() => setScreen('register')}
            onNotificationPress={goNotifications}
            onProfilePress={goProfile}
            onNavigatePatientDetails={(patientId: string) => openPatient({ id: patientId })}
          />
        );

      case 'notifications':
        return <NotificationsScreen onBack={goDashboard} onProfilePress={goProfile} />;

      case 'patient-details':
        return (
          <PatientDetailsScreen
            patient={selectedPatient}
            onBack={goDashboard}
            onSelectTest={openResult}
            onNotificationPress={goNotifications}
            onProfilePress={goProfile}
          />
        );

      case 'profile':
        return (
          <ProfileScreen
            onBack={goDashboard}
            onNavigateRoleSwitcher={() => setScreen('role-switcher')}
            onNotificationPress={goNotifications}
            onLogout={handleSignOut}
          />
        );

      case 'role-switcher':
        return (
          <RoleSwitcher
            onBack={goDashboard}
            onRoleSwitched={() => goDashboard()}
            onNotificationPress={goNotifications}
            onProfilePress={goProfile}
          />
        );

      default:
        return (
          <UnifiedDashboard
            onNavigateTab={handleNavigateTab}
            onNotificationPress={goNotifications}
            onProfilePress={goProfile}
            onSelectPatient={openPatient}
            onSelectTest={openResult}
          />
        );
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-900 font-sans antialiased">
      <OfflineStatusIndicator />
      {renderScreen()}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <MainAppContent />
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}