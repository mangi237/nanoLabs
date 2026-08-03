import React from 'react';
import Header from '../components/common/Header';
import { useAuth } from '../context/authContext';
import { User, Mail, Phone, Shield, Building2, Key, LogOut, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';

interface ProfileScreenProps {
  onBack?: () => void;
  onNavigateRoleSwitcher?: () => void;
  onLogout?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onNavigateRoleSwitcher,
  onLogout
}) => {
  const { user, lab, logout } = useAuth();

  const handleLogoutAction = async () => {
    await logout();
    if (onLogout) onLogout();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Profile Settings"
        subtitle="Manage personal credentials & active workspace"
      />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {/* Profile Info Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-blue-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'NL'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{user?.name || 'Authorized Staff'}</h1>
              <p className="text-xs text-teal-600 font-semibold capitalize mt-0.5">
                Role: {user?.role?.replace('_', ' ') || 'Staff Member'}
              </p>
              <p className="text-xs text-slate-400 font-medium">
                Lab Center: {lab?.name || 'nanoLabs Central Diagnostics'}
              </p>
            </div>
          </div>

          {/* User Attributes Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal & Security Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <Mail className="w-4 h-4 text-teal-600 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">Email Address</span>
                  <span className="font-semibold text-slate-800">{user?.email || 'user@nanolabs.com'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <Phone className="w-4 h-4 text-teal-600 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">Phone Number</span>
                  <span className="font-semibold text-slate-800">{user?.phone || '+237 670000000'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <Key className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">Security Access Code</span>
                  <span className="font-mono font-bold text-slate-900">{user?.accessCode || 'SUPER123'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">Assigned Lab ID</span>
                  <span className="font-semibold text-slate-800">{lab?.id || 'lab-1'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            {onNavigateRoleSwitcher && (
              <button
                onClick={onNavigateRoleSwitcher}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-semibold border border-teal-200 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Switch Active Role
              </button>
            )}

            <button
              onClick={handleLogoutAction}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out of Portal
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileScreen;
