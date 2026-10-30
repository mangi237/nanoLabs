import React from 'react';
import { useAuth } from '../../context/authContext';
import { useNav } from '../../components/doctor/nav';
import { Card, PageHeader, Avatar, Button } from '../../components/doctor/ui';
import { User, Building2, FileBadge, Clock, Lock, Bell, Shield, LogOut, ChevronRight } from 'lucide-react';

const ROWS: { to: string; label: string; sub: string; Icon: any }[] = [
  { to: 'profile', label: 'Your profile', sub: 'Name, photo, specialty, bio', Icon: User },
  { to: 'practice', label: 'Practice & clinic', sub: 'Workplace, address, fees', Icon: Building2 },
  { to: 'credentials', label: 'Medical credentials', sub: 'ONMC number and documents', Icon: FileBadge },
  { to: 'availability', label: 'Availability', sub: 'Days and hours', Icon: Clock },
  { to: 'security', label: 'Password & security', sub: 'Change your password', Icon: Lock },
  { to: 'notifications', label: 'Notifications', sub: 'Alerts and channels', Icon: Bell },
  { to: 'privacy', label: 'Privacy', sub: 'Directory and visibility', Icon: Shield }
];

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { go } = useNav();

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your account and practice" />

      <Card className="mb-6 flex items-center gap-4 p-5">
        <Avatar name={user?.name} size={56} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold">{user?.name || 'Your name'}</p>
          <p className="truncate text-[13px] text-[#6B7280]">{user?.specialty || 'Add your specialty'}</p>
        </div>
      </Card>

      <Card>
        {ROWS.map(({ to, label, sub, Icon }, i) => (
          <button
            key={to}
            onClick={() => go(to)}
            className={`flex w-full items-center gap-4 p-4 text-left ${i ? 'border-t border-[#E5E7EB]' : ''}`}
          >
            <Icon size={20} className="text-[#006978]" />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium">{label}</p>
              <p className="text-[12px] text-[#6B7280]">{sub}</p>
            </div>
            <ChevronRight size={18} className="text-[#9CA3AF]" />
          </button>
        ))}
      </Card>

      <div className="mt-8">
        <Button variant="danger" onClick={() => logout()}>
          <LogOut size={16} className="mr-2 inline" /> Sign out
        </Button>
      </div>
    </>
  );
}