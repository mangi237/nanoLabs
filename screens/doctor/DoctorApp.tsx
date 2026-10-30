import React, { useState } from 'react';
import { useAuth } from '../../context/authContext';
import { Logo } from '../../components/doctor/ui';
import { NavContext, type Route } from '../../components/doctor/nav';
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
import { Calendar, Users, FileText, Building2, Settings, MessageSquare, ChevronLeft } from 'lucide-react';

const TABS = [
  { id: 'today', label: 'Today', Icon: Calendar },
  { id: 'patients', label: 'Patients', Icon: Users },
  { id: 'results', label: 'Results', Icon: FileText },
  { id: 'labs', label: 'Labs', Icon: Building2 },
  { id: 'settings', label: 'Settings', Icon: Settings }
];

const TITLES: Record<string, string> = {
  messages: 'Messages',
  conversation: 'Conversation',
  patient: 'Patient',
  result: 'Result',
  prescription: 'New prescription',
  appointment: 'New appointment',
  profile: 'Your profile',
  practice: 'Practice & clinic',
  credentials: 'Medical credentials',
  availability: 'Availability',
  security: 'Password & security',
  notifications: 'Notifications',
  privacy: 'Privacy'
};

// Which bottom tab stays highlighted for each screen
const TAB_OF: Record<string, string> = {
  messages: 'patients', conversation: 'patients', patient: 'patients', prescription: 'patients',
  result: 'results', appointment: 'today',
  profile: 'settings', practice: 'settings', credentials: 'settings', availability: 'settings',
  security: 'settings', notifications: 'settings', privacy: 'settings'
};

export default function DoctorApp() {
  const { user } = useAuth();
  const doctorId: string = user?.id ?? '';
  const [stack, setStack] = useState<Route[]>([{ name: 'today' }]);
  const current = stack[stack.length - 1];
  const p = current.params || {};

  const go = (name: string, params?: Record<string, string>) => setStack((s) => [...s, { name, params }]);
  const back = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  const tab = (name: string) => setStack([{ name }]);

  const activeTab = TAB_OF[current.name] || current.name;
  const isSub = stack.length > 1;

  const renderScreen = () => {
    switch (current.name) {
      case 'today': return <TodayScreen doctorId={doctorId} doctorName={user?.name} />;
      case 'patients': return <PatientsScreen doctorId={doctorId} />;
      case 'results': return <ResultsScreen doctorId={doctorId} />;
      case 'labs': return <LabsScreen doctorId={doctorId} />;
      case 'settings': return <SettingsScreen />;
      case 'messages': return <MessagesScreen doctorId={doctorId} />;
      case 'conversation': return <ConversationScreen doctorId={doctorId} patientId={p.patientId} patientName={p.patientName} />;
      case 'patient': return <PatientDetailScreen doctorId={doctorId} patientId={p.patientId} patientName={p.patientName} />;
      case 'result': return <ResultDetailScreen resultId={p.resultId} />;
      case 'prescription': return <PrescriptionScreen doctorId={doctorId} doctorName={user?.name} patientId={p.patientId} patientName={p.patientName} />;
      case 'appointment': return <AppointmentScreen doctorId={doctorId} patientId={p.patientId} patientName={p.patientName} patientPhone={p.patientPhone} />;
      case 'profile': return <ProfileEdit />;
      case 'practice': return <PracticeEdit />;
      case 'credentials': return <CredentialsScreen />;
      case 'availability': return <AvailabilityScreen />;
      case 'security': return <SecurityScreen />;
      case 'notifications': return <NotificationsScreen />;
      case 'privacy': return <PrivacyScreen />;
      default: return null;
    }
  };

  const title = current.name === 'patient' ? p.patientName : current.name === 'conversation' ? p.patientName : TITLES[current.name];

  return (
    <NavContext.Provider value={{ go, back }}>
      <div className="min-h-[100dvh] bg-[#F4F6F6] font-[Poppins] text-[#111827] md:flex">
        {/* Web sidebar */}
        <aside className="hidden md:sticky md:top-0 md:flex md:h-[100dvh] md:w-60 md:flex-col md:gap-1 md:border-r md:border-[#E5E7EB] md:bg-white md:p-4">
          <div className="px-2 pb-6 pt-2"><Logo size={34} /></div>
          {[...TABS.slice(0, 3), { id: 'messages', label: 'Messages', Icon: MessageSquare }, ...TABS.slice(3)].map(({ id, label, Icon }) => {
            const on = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => tab(id)}
                className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] font-medium ${
                  on ? 'bg-[#E6F2F3] font-semibold text-[#006978]' : 'text-[#6B7280] hover:bg-[#F4F6F6]'
                }`}
              >
                <Icon size={20} />
                {label}
              </button>
            );
          })}
        </aside>

        <main className="min-w-0 flex-1 pb-28 md:pb-12">
          {isSub && (
            <div className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-[#E5E7EB] bg-white px-3 pt-[env(safe-area-inset-top)]">
              <button onClick={back} className="grid h-10 w-10 place-items-center rounded-xl text-[#006978]" aria-label="Back">
                <ChevronLeft size={24} />
              </button>
              <span className="truncate text-[16px] font-semibold">{title}</span>
            </div>
          )}
          <div className="mx-auto w-full max-w-5xl px-4 pt-6 md:px-10 md:pt-10">{renderScreen()}</div>
        </main>

        {/* Mobile tab bar */}
        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-[#E5E7EB] bg-white px-2 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 md:hidden">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => tab(id)}
              className={`flex min-h-[44px] flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                activeTab === id ? 'text-[#006978]' : 'text-[#6B7280]'
              }`}
            >
              <Icon size={22} />
              {label}
            </button>
          ))}
        </nav>
      </div>
    </NavContext.Provider>
  );
}