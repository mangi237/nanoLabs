import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/authContext';
import { ThemeProvider } from './context/themeContext';
import { LanguageProvider } from './context/languageContext';
import { LandingPage } from './components/website/LandingPage';

// Import Screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import LabSelectionScreen from './screens/auth/LabSelectionScreen';
import SetPermanentPasswordScreen from './screens/auth/SetPermanentPasswordScreen';
import OfflineStatusIndicator from './components/common/OfflineStatusIndicator';
import UnifiedDashboard from './screens/UnifiedDashboard';
import AdminDashboard from './screens/admin/adminDashboard';
import AnalyticsDashboard from './screens/admin/AnalyticsDashboard';
import InventoryManagement from './screens/admin/InventoryManagement';
import PatientManagement from './screens/admin/PatientManagement';
import ReportsScreen from './screens/admin/ReportsScreen';
import StaffManagement from './screens/admin/StaffManagement';
import TestCatalogManagement from './screens/admin/TestCatalogManagement';

import PatientDashboard from './screens/Patient/PatientDashboard';
import AppointmentScreen from './screens/Patient/AppointmentScreen';
import BookAppointmentScreen from './screens/Patient/BookAppointmentScreen';
import TestHistoryScreen from './screens/Patient/TestHistoryScreen';
import TransferScreen from './screens/Patient/TransferScreen';
import ShareResultsScreen from './screens/Patient/ShareResultsScreen';
import ResultViewScreen from './screens/Patient/ResultViewScreen';
import RegistrationCompleteScreen from './screens/Patient/RegistrationCompleteScreen';

import ReceptionistView from './screens/staff/ReceptionistView';
import RoleSwitcher from './screens/staff/RoleSwitcher';
import NotificationsScreen from './screens/NotificationScreen';
import PatientDetailsScreen from './screens/PatientDetailsScreen';
import ProfileScreen from './screens/ProfileScreen';

import { Activity, RefreshCw } from 'lucide-react';

type ScreenType =
  | 'landing'
  | 'login'
  | 'register'
  | 'registration-complete'
  | 'select-lab'
  | 'dashboard'
  | 'admin-dashboard'
  | 'commercial-brochure'
  | 'staff'
  | 'analytics'
  | 'inventory'
  | 'catalog'
  | 'patient-list'
  | 'reports'
  | 'patient-dashboard'
  | 'book-appointment'
  | 'appointment'
  | 'test-history'
  | 'transfer'
  | 'share'
  | 'result-view'
  | 'notifications'
  | 'patient-details'
  | 'profile'
  | 'role-switcher'
  | 'receptionist';

const MainAppContent: React.FC = () => {
  const { user, setUser, lab, isLoading, logout } = useAuth();
  const [screen, setScreen] = useState<ScreenType>('landing');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [registeredPatient, setRegisteredPatient] = useState<any>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Force landing page on initial load
  useEffect(() => {
    // Always start on landing page regardless of auth state
    setScreen('landing');
    setIsInitialLoad(false);
  }, []);

  // Handle navigation from landing page to portal/login
  const handleGoToPortal = () => {
    setScreen('login');
  };

  // Handle login success - determine where to go based on user role
  const handleLoginSuccess = (loggedInUser: any) => {
    if (loggedInUser?.role === 'admin' || loggedInUser?.role === 'super_admin') {
      setScreen('admin-dashboard');
    } else if (loggedInUser?.role === 'patient') {
      setScreen('patient-dashboard');
    } else if (loggedInUser?.role === 'staff' || loggedInUser?.role === 'receptionist') {
      setScreen('receptionist');
    } else {
      setScreen('dashboard');
    }
  };

  // Handle logout - go back to landing page
  const handleLogout = () => {
    logout();
    setScreen('landing');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white select-none">
        <div className="flex flex-col items-center space-y-6 max-w-sm text-center animate-in fade-in duration-300">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400 shadow-2xl shadow-teal-500/20 animate-pulse">
              <Activity className="w-10 h-10 stroke-[2.5]" />
            </div>
            <div className="absolute -inset-2 rounded-3xl border border-teal-500/20 animate-ping pointer-events-none opacity-40" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              nano<span className="text-teal-400">Labs</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 tracking-wider uppercase">LIMS</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Clinical Diagnostic & Laboratory Intelligence System
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-teal-300/80 font-mono pt-2">
            <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
            <span>Establishing Secure Session...</span>
          </div>
        </div>
      </div>
    );
  }

  const handleNavigateTab = (tab: string) => {
    switch (tab) {
      case 'overview': setScreen('dashboard'); break;
      case 'admin':
      case 'admin-dashboard': setScreen('admin-dashboard'); break;
      case 'patient-dashboard': setScreen('patient-dashboard'); break;
      case 'staff': setScreen('staff'); break;
      case 'analytics': setScreen('analytics'); break;
      case 'inventory': setScreen('inventory'); break;
      case 'catalog': setScreen('catalog'); break;
      case 'reports': setScreen('reports'); break;
      case 'patients': setScreen('patient-list'); break;
      case 'book': setScreen('book-appointment'); break;
      case 'history': setScreen('test-history'); break;
      case 'share': setScreen('share'); break;
      case 'transfer': setScreen('transfer'); break;
      case 'register': setScreen('register'); break;
      case 'brochure':
      case 'commercial-brochure': setScreen('commercial-brochure'); break;
      default: setScreen('dashboard'); break;
    }
  };

  const renderScreen = () => {
    // CRITICAL: If screen is 'landing', ALWAYS show the landing page
    // regardless of user auth state
    if (screen === 'landing') {
      return <LandingPage onGoToPortal={handleGoToPortal} />;
    }

    // If user is authenticated and must change password
    if (user && user.mustChangePassword) {
      return (
        <SetPermanentPasswordScreen
          onSuccess={(updatedUser) => {
            setUser(updatedUser);
            handleLoginSuccess(updatedUser);
          }}
        />
      );
    }

    // If user is logged in, show the appropriate dashboard
    if (user) {
      // Check user role and show appropriate dashboard
      if (user.role === 'admin' || user.role === 'super_admin') {
        return (
          <AdminDashboard
            onNavigateTab={handleNavigateTab}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
            onSelectPatient={(patient) => {
              setSelectedPatient(patient);
              setScreen('patient-details');
            }}
          />
        );
      } else if (user.role === 'patient') {
        return (
          <PatientDashboard
            onNavigateTab={handleNavigateTab}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
            onSelectTest={(test) => {
              setSelectedTest(test);
              setScreen('result-view');
            }}
          />
        );
      } else if (user.role === 'staff' || user.role === 'receptionist') {
        return (
          <ReceptionistView
            onBack={() => setScreen('dashboard')}
            onNavigateRegister={() => setScreen('register')}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
            onNavigatePatientDetails={(patientId: string) => {
              setSelectedPatient({ id: patientId });
              setScreen('patient-details');
            }}
          />
        );
      } else {
        return (
          <UnifiedDashboard
            onNavigateTab={handleNavigateTab}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
            onSelectPatient={(patient) => {
              setSelectedPatient(patient);
              setScreen('patient-details');
            }}
            onSelectTest={(test) => {
              setSelectedTest(test);
              setScreen('result-view');
            }}
          />
        );
      }
    }

    // If no user is logged in, show auth screens based on screen state
    switch (screen) {
      case 'login':
        return (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onNavigateRegister={() => setScreen('register')}
            onNavigateSelectLab={() => setScreen('select-lab')}
          />
        );

      case 'register':
        return (
          <RegisterScreen
            onBackToLogin={() => setScreen('login')}
            onRegisterSuccess={(patientData) => {
              setRegisteredPatient(patientData);
              setScreen('registration-complete');
            }}
          />
        );

      case 'registration-complete':
        return (
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
                  roles: ['patient']
                });
                setScreen('patient-dashboard');
              }
            }}
          />
        );

      case 'select-lab':
        return (
          <LabSelectionScreen
            onBack={() => setScreen('login')}
            onSelectLab={() => setScreen('login')}
          />
        );

      // If user somehow gets here without being logged in and screen isn't set,
      // go back to landing page
      default:
        setScreen('landing');
        return <LandingPage onGoToPortal={handleGoToPortal} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
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