import React from 'react';
import {
  User,
  Building2,
  Award,
  Clock,
  Lock,
  Bell,
  ShieldCheck,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useNav } from '../../components/doctor/nav';
import { SectionCard } from '../../components/doctor/ui';
import { Route } from '../../components/doctor/nav';

const ITEMS: Array<{
  route: Route['name'];
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    route: 'settings-profile',
    title: 'Physician Identity & Bio',
    subtitle: 'Full name, specialty, phone, email, and clinical biography',
    icon: User,
  },
  {
    route: 'settings-practice',
    title: 'Hospital & Practice Details',
    subtitle: 'Primary hospital affiliation, consultation address, and city',
    icon: Building2,
  },
  {
    route: 'settings-credentials',
    title: 'ONMC Credentials & License',
    subtitle: 'Medical Council registration number and verification status',
    icon: Award,
  },
  {
    route: 'settings-availability',
    title: 'Consultation Availability',
    subtitle: 'Weekly clinic hours and teleconsultation slots',
    icon: Clock,
  },
  {
    route: 'settings-security',
    title: 'Password & Account Security',
    subtitle: 'Update PBKDF2-SHA256 password hash in Firestore',
    icon: Lock,
  },
  {
    route: 'settings-notifications',
    title: 'Clinical Alert Preferences',
    subtitle: 'Critical lab value alerts, patient follow requests, and chat',
    icon: Bell,
  },
  {
    route: 'settings-privacy',
    title: 'Zero-Knowledge E2EE & Data Audit',
    subtitle: 'AES-256-GCM encryption specification and patient data isolation',
    icon: ShieldCheck,
  },
];

export const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { push } = useNav();

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900">
            {user?.name || 'Dr. Physician'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {(user as any)?.specialty || 'General Medicine'}
            {(user as any)?.hospital ? ` · ${(user as any).hospital}` : ''}
          </p>
          {(user as any)?.licenseNumber && (
            <p className="text-xs font-mono text-teal-700 mt-1">
              ONMC: {(user as any).licenseNumber}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <SectionCard title="Account & Clinical Practice Configuration">
        <div className="divide-y divide-slate-100">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.route}
                type="button"
                onClick={() => push({ name: item.route } as Route)}
                className="w-full text-left py-3.5 first:pt-0 last:pb-0 hover:bg-slate-50 -mx-2 px-2 rounded-xl transition-colors cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
};

export default SettingsScreen;
