import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/authContext';
import { ThemeProvider } from './context/themeContext';
import { LanguageProvider } from './context/languageContext';
import { useNavigation } from '@react-navigation/native';

// Import Screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import LabSelectionScreen from './screens/auth/LabSelectionScreen';

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

import ReceptionistView from './screens/staff/ReceptionistView';
import RoleSwitcher from './screens/staff/RoleSwitcher';
import NotificationsScreen from './screens/NotificationScreen';
import PatientDetailsScreen from './screens/PatientDetailsScreen';
import ProfileScreen from './screens/ProfileScreen';

import { Activity, Shield, User, Users, RefreshCw, LogOut, CheckCircle2, ChevronDown } from 'lucide-react';

type ScreenType =
  | 'login'
  | 'register'
  | 'select-lab'
  | 'dashboard'
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
  const navigation = useNavigation<any>();
  const { user, setUser, logout } = useAuth();
  const [screen, setScreen] = useState<ScreenType>(user ? 'dashboard' : 'login');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState<any>(null);

  const handleNavigateTab = (tab: string) => {
    switch (tab) {
      case 'overview': setScreen('dashboard'); break;
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
      default: setScreen('dashboard'); break;
    }
  };

  // Render Screen Switcher
  const renderScreen = () => {
    if (!user && screen !== 'register' && screen !== 'select-lab') {
      return (
        <LoginScreen
          onLoginSuccess={() => setScreen('dashboard')}
          onNavigateRegister={() => setScreen('register')}
          onNavigateSelectLab={() => setScreen('select-lab')}
        />
      );
    }

    switch (screen) {
      case 'login':
        return (
          <LoginScreen
            onLoginSuccess={() => setScreen('dashboard')}
            onNavigateRegister={() => setScreen('register')}
            onNavigateSelectLab={() => setScreen('select-lab')}
          />
        );

      case 'register':
        return (
          <RegisterScreen
            onBackToLogin={() => setScreen('login')}
            onRegisterSuccess={() => setScreen('dashboard')}
          />
        );

      case 'select-lab':
        return (
          <LabSelectionScreen
            onBack={() => setScreen('login')}
            onSelectLab={() => setScreen('login')}
          />
        );

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

      case 'staff':
        return (
          <StaffManagement
            onBack={() => setScreen('dashboard')}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'analytics':
        return (
          <AnalyticsDashboard
            onBack={() => setScreen('dashboard')}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'inventory':
        return (
          <InventoryManagement
            onBack={() => setScreen('dashboard')}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'catalog':
        return (
          <TestCatalogManagement
            onBack={() => setScreen('dashboard')}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'patient-list':
        return (
          <PatientManagement
            onBack={() => setScreen('dashboard')}
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
            onBack={() => setScreen('dashboard')}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'book-appointment':
        return (
          <BookAppointmentScreen
            onBack={() => setScreen('dashboard')}
            onSuccess={() => setScreen('appointment')}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'appointment':
        return (
          <AppointmentScreen
            onBack={() => setScreen('dashboard')}
            onNavigateBook={() => setScreen('book-appointment')}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'test-history':
        return (
          <TestHistoryScreen
            onBack={() => setScreen('dashboard')}
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
            onBack={() => setScreen('dashboard')}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'share':
        return (
          <ShareResultsScreen
            onBack={() => setScreen('dashboard')}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'result-view':
        return (
          <ResultViewScreen
            test={selectedTest}
            onBack={() => setScreen('dashboard')}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'receptionist':
        return (
          <ReceptionistView
            onBack={() => setScreen('dashboard')}
            onNavigateRegister={() => setScreen('register')}
            onNotificationPress={() => setScreen('notifications')}
            onProfilePress={() => setScreen('profile')}
            onNavigatePatientDetails={(patientId: string) => 
              navigation.navigate('PatientDetailsScreen', { patientId }) // 👈 This accepts two arguments perfectly
            } 
          />
        );

      case 'notifications':
        return (
          <NotificationsScreen
            onBack={() => setScreen('dashboard')}
            onProfilePress={() => setScreen('profile')}
          />
        );

      case 'patient-details':
        return (
          <PatientDetailsScreen
            patient={selectedPatient}
            onBack={() => setScreen('dashboard')}
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
            onBack={() => setScreen('dashboard')}
            onNavigateRoleSwitcher={() => setScreen('role-switcher')}
            onLogout={() => {
              setScreen('login');
            }}
          />
        );

      case 'role-switcher':
        return (
          <RoleSwitcher
            onBack={() => setScreen('dashboard')}
            onRoleSwitched={() => setScreen('dashboard')}
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
      {/* Global Quick Demo Switcher Bar at Bottom Right for easy testing */}
      {user && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 rounded-2xl shadow-2xl border border-slate-700 text-xs flex flex-wrap items-center gap-1.5 max-w-xl">
          <span className="text-[10px] text-slate-400 font-semibold uppercase mr-1">Role View:</span>
          {[
            { id: 'superadmin', label: 'SuperAdmin' },
            { id: 'admin', label: 'Admin' },
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
                setScreen('dashboard');
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
