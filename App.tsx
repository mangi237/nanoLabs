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
import SharedReportViewerScreen from './screens/Public/SharedReportViewerScreen';
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

// Define all possible screens
type ScreenType =
  | 'landing'
  | 'login'
  | 'register'
  | 'registration-complete'
  | 'select-lab'
  | 'verify-report'
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
  
  // *** CRITICAL FIX: ALWAYS START ON LANDING PAGE ***
  const [screen, setScreen] = useState<ScreenType>('landing');
  
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [registeredPatient, setRegisteredPatient] = useState<any>(null);

  // Force landing page on initial load
  useEffect(() => {
    setScreen('landing');
  }, []);

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
      case 'role-switcher': setScreen('role-switcher'); break;
      case 'receptionist': setScreen('receptionist'); break;
      default: setScreen('landing'); break;
    }
  };

  const getDefaultDashboard = (): ScreenType => {
    if (user?.role === 'patient') return 'patient-dashboard';
    return 'dashboard';
  };

  // Render Screen Switcher
  const renderScreen = () => {
    // 0. Check for Public Shared Report Verification URL (e.g. from WhatsApp/SMS share link)
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const isPublicVerifyUrl = urlParams && (
      urlParams.get('view') === 'verify-report' ||
      urlParams.get('code') ||
      urlParams.get('shared') ||
      urlParams.get('verify')
    );

    if (screen === 'verify-report' || isPublicVerifyUrl) {
      return (
        <SharedReportViewerScreen
          onGoToLogin={() => {
            if (typeof window !== 'undefined' && window.history?.pushState) {
              window.history.pushState({}, document.title, window.location.pathname);
            }
            setScreen('login');
          }}
          onGoToWebsite={() => {
            if (typeof window !== 'undefined' && window.history?.pushState) {
              window.history.pushState({}, document.title, window.location.pathname);
            }
            setScreen('landing');
          }}
        />
      );
    }

    // If user is authenticated via one-time OTP and must set their permanent password
    if (user && user.mustChangePassword) {
      return (
        <SetPermanentPasswordScreen
          onSuccess={(updatedUser) => {
            setUser(updatedUser);
            setScreen(getDefaultDashboard());
          }}
        />
      );
    }

    // *** CRITICAL: ALWAYS SHOW LANDING PAGE FIRST, REGARDLESS OF USER AUTH ***
    if (screen === 'landing') {
      return <LandingPage onGoToPortal={() => setScreen('login')} />;
    }

    // If no user is logged in, show auth screens based on screen state
    if (!user) {
      switch (screen) {
        case 'login':
          return (
            <LoginScreen
              onLoginSuccess={() => setScreen(getDefaultDashboard())}
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
        case 'select-lab':
          return (
            <LabSelectionScreen
              onBack={() => setScreen('login')}
              onSelectLab={() => setScreen('login')}
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
                }
                setScreen('patient-dashboard');
              }}
            />
          );
        default:
          return <LandingPage onGoToPortal={() => setScreen('login')} />;
      }
    }

    // If user is logged in, show the appropriate dashboard
    switch (screen) {
      case 'dashboard':
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

      case 'admin-dashboard':
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

      case 'staff':
        return (
          <StaffManagement
            onBack={() => setScreen(getDefaultDashboard())}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'analytics':
        return (
          <AnalyticsDashboard
            onBack={() => setScreen(getDefaultDashboard())}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'inventory':
        return (
          <InventoryManagement
            onBack={() => setScreen(getDefaultDashboard())}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'catalog':
        return (
          <TestCatalogManagement
            onBack={() => setScreen(getDefaultDashboard())}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'patient-list':
        return (
          <PatientManagement
            onBack={() => setScreen(getDefaultDashboard())}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
            onSelectPatient={(patient) => {
              setSelectedPatient(patient);
              setScreen('patient-details');
            }}
          />
        );

      case 'reports':
        return (
          <ReportsScreen
            onBack={() => setScreen(getDefaultDashboard())}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'patient-dashboard':
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

      case 'book-appointment':
        return (
          <BookAppointmentScreen
            onBack={() => setScreen(getDefaultDashboard())}
            onSuccess={() => setScreen(getDefaultDashboard())}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'appointment':
        return (
          <AppointmentScreen
            onBack={() => setScreen(getDefaultDashboard())}
            onNavigateBook={() => setScreen('book-appointment')}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'test-history':
        return (
          <TestHistoryScreen
            onBack={() => setScreen(getDefaultDashboard())}
            onSelectTest={(test) => {
              setSelectedTest(test);
              setScreen('result-view');
            }}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'transfer':
        return (
          <TransferScreen
            onBack={() => setScreen(getDefaultDashboard())}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'share':
        return (
          <ShareResultsScreen
            onBack={() => setScreen(getDefaultDashboard())}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'result-view':
        return (
          <ResultViewScreen
            test={selectedTest}
            onBack={() => setScreen(getDefaultDashboard())}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'receptionist':
        return (
          <ReceptionistView
            onBack={() => setScreen(getDefaultDashboard())}
            onNavigateRegister={() => setScreen('register')}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
            onNavigatePatientDetails={(patientId: string) => {
              setSelectedPatient({ id: patientId });
              setScreen('patient-details');
            }}
          />
        );

      case 'notifications':
        return (
          <NotificationsScreen
            onBack={() => setScreen(getDefaultDashboard())}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'patient-details':
        return (
          <PatientDetailsScreen
            patient={selectedPatient}
            onBack={() => setScreen(getDefaultDashboard())}
            onSelectTest={(test) => {
              setSelectedTest(test);
              setScreen('result-view');
            }}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'profile':
        return (
          <ProfileScreen
            onBack={() => setScreen(getDefaultDashboard())}
            onNavigateRoleSwitcher={() => setScreen('role-switcher')}
            onNotificationPress={() => setScreen('notifications')}
            onLogout={() => {
              logout();
              setScreen('landing');
            }}
          />
        );

      case 'role-switcher':
        return (
          <RoleSwitcher
            onBack={() => setScreen(getDefaultDashboard())}
            onRoleSwitched={(newRole) => {
              setScreen(newRole === 'patient' ? 'patient-dashboard' : 'dashboard');
            }}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      default:
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
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Offline and Network Sync Status Indicator */}
      <OfflineStatusIndicator />

      {/* Global Quick Demo Switcher Bar at Bottom Right for easy testing */}
      {user && screen !== 'landing' && screen !== 'login' && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 rounded-2xl shadow-2xl border border-slate-700 text-xs flex flex-wrap items-center gap-1.5 max-w-xl">
          <span className="text-[10px] text-slate-400 font-semibold uppercase mr-1">Role View:</span>
          {[
            { id: 'superadmin', label: 'SuperAdmin' },
            { id: 'admin', label: 'Admin' },
            { id: 'biologist', label: 'Biologist' },
            { id: 'inventory_manager', label: 'Inventory' },
            { id: 'staff', label: 'Staff Hub' },
            { id: 'receptionist', label: 'Reception' },
            { id: 'cashier', label: 'Cashier' },
            { id: 'analyzer', label: 'Analyzer' },
            { id: 'lab_tech', label: 'Lab Tech' },
            { id: 'patient', label: 'Patient' }
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setUser({ ...user, role: r.id as any });
                setScreen(r.id === 'patient' ? 'patient-dashboard' : 'dashboard');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                user.role === r.id ? 'bg-teal-600 text-white shadow-xs' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

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