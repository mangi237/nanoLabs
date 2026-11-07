import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Users,
  FileCheck2,
  Building2,
  Settings,
  MessageSquareLock,
  LogOut,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { Logo } from '../../components/doctor/ui';
import { NavContext, Route, TabId } from '../../components/doctor/nav';
import {
  doctorPatientFirestoreService,
  DoctorPatientConnectionRecord,
  DoctorPatientLabDossier,
} from '../../services/doctorPatientFirestoreService';

import TodayScreen from './TodayScreen';
import PatientsScreen from './PatientsScreen';
import ResultsScreen from './ResultsScreen';
import LabsScreen from './LabsScreen';
import SettingsScreen from './SettingsScreen';
import MessagesScreen from './MessagesScreen';
import ConversationScreen from './ConversationScreen';
import PatientDetailScreen from './PatientDetailScreen';
import ResultDetailScreen from './ResultDetailScreen';
import PrescriptionScreen from './PrescriptionScreen';
import AppointmentScreen from './AppointmentScreen';

import ProfileEdit from './settings/ProfileEdit';
import PracticeEdit from './settings/PracticeEdit';
import CredentialsScreen from './settings/CredentialsScreen';
import AvailabilityScreen from './settings/AvailabilityScreen';
import SecurityScreen from './settings/SecurityScreen';
import NotificationsScreen from './settings/NotificationsScreen';
import PrivacyScreen from './settings/PrivacyScreen';

const TABS: Array<{ id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'today', label: 'Today', icon: Calendar },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'results', label: 'Results', icon: FileCheck2 },
  { id: 'labs', label: 'Labs', icon: Building2 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const DoctorApp: React.FC = () => {
  const { user, logout } = useAuth();
  const doctorId = user?.id || '';
  const doctorName = user?.name || 'Dr. Physician';

  const [tab, setTabState] = useState<TabId>('today');
  const [history, setHistory] = useState<Route[]>([{ name: 'tab', tab: 'today' }]);

  const [connections, setConnections] = useState<DoctorPatientConnectionRecord[]>([]);
  const [dossiers, setDossiers] = useState<DoctorPatientLabDossier[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  const currentRoute = history[history.length - 1] || { name: 'tab', tab };

  const setTab = useCallback((nextTab: TabId) => {
    setTabState(nextTab);
    setHistory([{ name: 'tab', tab: nextTab }]);
  }, []);

  const push = useCallback((nextRoute: Route) => {
    setHistory((prev) => [...prev, nextRoute]);
  }, []);

  const pop = useCallback(() => {
    setHistory((prev) => {
      if (prev.length <= 1) return [{ name: 'tab', tab }];
      return prev.slice(0, -1);
    });
  }, [tab]);

  const resetToTab = useCallback((targetTab: TabId) => {
    setTabState(targetTab);
    setHistory([{ name: 'tab', tab: targetTab }]);
  }, []);

  // Real-time Doctor Connections & Incoming Follow Requests
  useEffect(() => {
    if (!doctorId) return;
    const unsub = doctorPatientFirestoreService.subscribeDoctorConnections(doctorId, (list) => {
      setConnections(list);
    });
    return () => unsub();
  }, [doctorId]);

  // Real-time Doctor Appointments
  useEffect(() => {
    if (!doctorId) return;
    const unsub = doctorPatientFirestoreService.subscribeDoctorAppointments(doctorId, (list) => {
      setAppointments(list);
    });
    return () => unsub();
  }, [doctorId]);

  // Live Patient Lab Test Requests & Certified Results
  const refreshDossiers = useCallback(async () => {
    if (!doctorId) return;
    const acceptedPatients = connections
      .filter((c) => c.status === 'accepted')
      .map((c) => ({
        patientId: c.patientId,
        patientPid: c.patientPid,
        patientPhone: c.patientPhone,
      }));
    const list = await doctorPatientFirestoreService.fetchDoctorPatientDossiers({
      doctorId,
      doctorName,
      connectedPatients: acceptedPatients,
    });
    setDossiers(list);
  }, [doctorId, doctorName, connections]);

  useEffect(() => {
    refreshDossiers();
    const timer = setInterval(() => {
      refreshDossiers();
    }, 20000);
    return () => clearInterval(timer);
  }, [refreshDossiers]);

  const unreadMessagesCount = useMemo(
    () =>
      connections
        .filter((c) => c.status === 'accepted')
        .reduce((acc, c) => acc + Number(c.unreadForDoctor || 0), 0),
    [connections]
  );

  const pendingRequestsCount = useMemo(
    () => connections.filter((c) => c.status === 'pending' && c.requestedBy === 'patient').length,
    [connections]
  );

  const navValue = useMemo(
    () => ({
      route: currentRoute,
      tab,
      setTab,
      push,
      pop,
      resetToTab,
      connections,
      dossiers,
      appointments,
      refreshDossiers,
      unreadMessagesCount,
      pendingRequestsCount,
    }),
    [
      currentRoute,
      tab,
      setTab,
      push,
      pop,
      resetToTab,
      connections,
      dossiers,
      appointments,
      refreshDossiers,
      unreadMessagesCount,
      pendingRequestsCount,
    ]
  );

  const renderMainView = () => {
    switch (currentRoute.name) {
      case 'tab':
        if (currentRoute.tab === 'patients') return <PatientsScreen />;
        if (currentRoute.tab === 'results') return <ResultsScreen />;
        if (currentRoute.tab === 'labs') return <LabsScreen />;
        if (currentRoute.tab === 'settings') return <SettingsScreen />;
        return <TodayScreen />;
      case 'messages':
        return <MessagesScreen />;
      case 'conversation':
        return (
          <ConversationScreen
            patientId={currentRoute.patientId}
            patientName={currentRoute.patientName}
            patientAlias={currentRoute.patientAlias}
            patientPid={currentRoute.patientPid}
            patientPhone={currentRoute.patientPhone}
          />
        );
      case 'patient':
        return (
          <PatientDetailScreen
            patientId={currentRoute.patientId}
            patientName={currentRoute.patientName}
            patientAlias={currentRoute.patientAlias}
            patientPid={currentRoute.patientPid}
            patientPhone={currentRoute.patientPhone}
            patientCity={currentRoute.patientCity}
          />
        );
      case 'result':
        return (
          <ResultDetailScreen
            dossierId={currentRoute.dossierId}
            initialDossier={currentRoute.dossier}
          />
        );
      case 'prescribe':
        return (
          <PrescriptionScreen
            initialPatientId={currentRoute.patientId}
            initialPatientName={currentRoute.patientName}
            initialPatientAlias={currentRoute.patientAlias}
            initialPatientPid={currentRoute.patientPid}
            initialPatientPhone={currentRoute.patientPhone}
            initialKind={currentRoute.initialKind}
            preselectedLabId={currentRoute.preselectedLabId}
            preselectedLabName={currentRoute.preselectedLabName}
          />
        );
      case 'appoint':
        return (
          <AppointmentScreen
            initialPatientId={currentRoute.patientId}
            initialPatientName={currentRoute.patientName}
            initialPatientAlias={currentRoute.patientAlias}
            initialPatientPid={currentRoute.patientPid}
            initialPatientPhone={currentRoute.patientPhone}
          />
        );
      case 'settings-profile':
        return <ProfileEdit />;
      case 'settings-practice':
        return <PracticeEdit />;
      case 'settings-credentials':
        return <CredentialsScreen />;
      case 'settings-availability':
        return <AvailabilityScreen />;
      case 'settings-security':
        return <SecurityScreen />;
      case 'settings-notifications':
        return <NotificationsScreen />;
      case 'settings-privacy':
        return <PrivacyScreen />;
      default:
        return <TodayScreen />;
    }
  };

  return (
    <NavContext.Provider value={navValue}>
      <div className="min-h-[100dvh] bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-64 xl:w-72 bg-white border-r border-slate-200 flex-col justify-between shrink-0 sticky top-0 h-[100dvh]">
          <div className="p-5 space-y-6">
            <Logo />

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="text-xs font-bold text-slate-900 truncate">{doctorName}</p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {(user as any)?.specialty || 'Medical Practitioner'}
              </p>
              {(user as any)?.hospital && (
                <p className="text-[11px] text-teal-700 font-semibold truncate mt-0.5">
                  {(user as any).hospital}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => push({ name: 'prescribe', initialKind: 'lab_tests' })}
              className="w-full py-2.5 px-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Order Lab Tests / Rx
            </button>

            <nav className="space-y-1">
              {TABS.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute.name === 'tab' && tab === item.id;
                const badge =
                  item.id === 'patients' && pendingRequestsCount > 0 ? pendingRequestsCount : 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-teal-50 text-teal-800 border border-teal-200'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </span>
                    {badge > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => push({ name: 'messages' })}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  currentRoute.name === 'messages' || currentRoute.name === 'conversation'
                    ? 'bg-teal-50 text-teal-800 border border-teal-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-3">
                  <MessageSquareLock className="w-4 h-4" />
                  Encrypted Chat
                </span>
                {unreadMessagesCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-teal-600 text-white">
                    {unreadMessagesCount}
                  </span>
                )}
              </button>
            </nav>
          </div>

          <div className="p-5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => logout()}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Mobile Top Bar (only on main tab screens so sub-screens use their own sticky header) */}
        {currentRoute.name === 'tab' && (
          <header className="lg:hidden sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => push({ name: 'messages' })}
                className="relative p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Encrypted Messages"
              >
                <MessageSquareLock className="w-4 h-4" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-md bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadMessagesCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => push({ name: 'prescribe', initialKind: 'lab_tests' })}
                className="px-3 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Order
              </button>
            </div>
          </header>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 pb-24 lg:pb-10">{renderMainView()}</main>

        {/* Mobile Bottom Tab Bar */}
        {currentRoute.name === 'tab' && (
          <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 px-2 py-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] grid grid-cols-5 gap-1">
            {TABS.map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.id;
              const badge =
                item.id === 'patients' && pendingRequestsCount > 0 ? pendingRequestsCount : 0;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`relative flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors cursor-pointer ${
                    isActive ? 'text-teal-700 bg-teal-50/70 font-bold' : 'text-slate-500 font-medium'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] mt-1">{item.label}</span>
                  {badge > 0 && (
                    <span className="absolute top-1 right-3 min-w-[16px] h-4 px-1 rounded bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </NavContext.Provider>
  );
};

export default DoctorApp;
