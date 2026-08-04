import React, { useState } from 'react';
import { useAuth } from '../../context/authContext';
import { useTheme } from '../../context/themeContext';
import { Bell, ShieldCheck, Activity, User as UserIcon, Sparkles, FileText, RefreshCw, X, Check, Shield, DollarSign, Microscope, TestTube, Package } from 'lucide-react';
// import TestingGuideModal from './TestingGuideModal';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onRoleSwitcherPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onNotificationPress,
  onProfilePress,
  onRoleSwitcherPress
}) => {
  const { user, setUser, lab } = useAuth();
  const { colors } = useTheme();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const availableRoles = [
    { value: 'superadmin', label: 'Super Admin', icon: Shield, desc: 'Global system overview' },
    { value: 'admin', label: 'Admin Administrator', icon: Shield, desc: 'Full laboratory control & analytics' },
    { value: 'receptionist', label: 'Receptionist Intake', icon: UserIcon, desc: 'Patient admissions & test registration' },
    { value: 'cashier', label: 'Cashier & Billing', icon: DollarSign, desc: 'Billing invoices & payment processing' },
    { value: 'analyzer', label: 'Laboratory Analyzer', icon: Microscope, desc: 'Sample accessioning & phlebotomy' },
    { value: 'lab_tech', label: 'Lab Technician', icon: TestTube, desc: 'Result validation & test reporting' },
    { value: 'inventory_manager', label: 'Inventory Manager', icon: Package, desc: 'Reagent stock monitoring' },
    { value: 'patient', label: 'Patient Portal', icon: Activity, desc: 'Patient results & booking' },
  ];

  const handleSelectRole = (roleValue: string) => {
    if (user) {
      setUser({
        ...user,
        role: roleValue as any
      });
      setShowRoleModal(false);
      if (onRoleSwitcherPress) {
        onRoleSwitcherPress();
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  nano<span className="text-teal-600">Labs</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60">
                  Health Care
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs">
                {lab?.name || 'Central Diagnostics'}
              </p>
            </div>
          </div>

          {/* Title or User Info */}
          <div className="flex items-center gap-2 sm:gap-3">
            {title && (
              <div className="hidden md:block text-right">
                <h1 className="text-sm font-semibold text-slate-800">{title}</h1>
                {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
              </div>
            )}

            {/* Role Switcher Button */}
            {/* {user && (
              <button
                onClick={() => {
                  if (onRoleSwitcherPress) onRoleSwitcherPress();
                  else setShowRoleModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all border border-purple-200 text-xs font-bold cursor-pointer shadow-2xs"
                title="Switch Active Role (Cashier, Lab, Analyzer, etc.)"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span className="hidden sm:inline">Role Switcher</span>
              </button>
            )} */}

            {/* Tester Guide Button */}
            {/* <button
              onClick={() => setShowGuideModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100/80 transition-all border border-teal-200 text-xs font-semibold cursor-pointer shadow-2xs"
              title="Testing & User Guide PDF"
            >
              <FileText className="w-4 h-4 text-teal-600" />
              <span className="hidden sm:inline">Tester Guide</span>
            </button> */}

            {/* Notifications Button */}
            <button
              onClick={onNotificationPress}
              className="relative p-2 rounded-xl text-slate-600 hover:text-teal-600 hover:bg-teal-50/80 transition-all border border-slate-200/60 cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            </button>

            {/* User Profile Pill */}
            <button
              onClick={onProfilePress}
              className="flex items-center gap-2.5 p-1.5 pl-3 rounded-xl border border-slate-200/80 hover:border-teal-300 hover:bg-teal-50/40 transition-all bg-white cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-900 leading-tight">
                  {user?.name || 'Authorized Staff'}
                </div>
                <div className="text-[11px] text-teal-600 font-medium capitalize">
                  {user?.role?.replace('_', ' ') || 'Staff'}
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs border border-teal-200">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'NL'}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Role Switcher Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-purple-300" />
                <div>
                  <h3 className="font-bold text-base">Quick Role Switcher</h3>
                  <p className="text-purple-200 text-xs">Switch active workstation perspective</p>
                </div>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-purple-200 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
              {availableRoles.map((role) => {
                const Icon = role.icon;
                const isActive = user?.role === role.value;

                return (
                  <button
                    key={role.value}
                    onClick={() => handleSelectRole(role.value)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      isActive
                        ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-xl border ${isActive ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs">{role.label}</div>
                        <div className="text-[11px] text-slate-500 truncate">{role.desc}</div>
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Testing Guide Modal */}
     
    </>
  );
};

export default Header;
