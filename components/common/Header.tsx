import React from 'react';
import { useAuth } from '../../context/authContext';
import { useTheme } from '../../context/themeContext';
import { Bell, Activity } from 'lucide-react';

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
  onProfilePress
}) => {
  const { user, lab } = useAuth();
  const { colors } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 sm:px-6 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          {lab?.logoUrl ? (
            <img
              src={lab.logoUrl}
              alt={lab.name || 'Lab Logo'}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-md shadow-teal-600/10"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
          )}
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
          {/* Hospital / Clinic Logo Badge on Right Side */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100/90 hover:bg-slate-200/80 rounded-2xl border border-slate-200/80 transition-all">
            {lab?.logoUrl ? (
              <img
                src={lab.logoUrl}
                alt={lab.name || 'Hospital Logo'}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-lg object-cover border border-slate-300 shadow-2xs bg-white"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-[10px] shadow-2xs">
                <Activity className="w-4 h-4" />
              </div>
            )}
            <div className="text-left hidden sm:block">
              <div className="text-[11px] font-bold text-slate-800 leading-tight truncate max-w-[130px] md:max-w-[170px]">
                {lab?.name || 'nanoLabs Medical Center'}
              </div>
              <div className="text-[9px] text-teal-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block"></span>
                <span>Verified Facility</span>
              </div>
            </div>
          </div>

          {title && (
            <div className="hidden lg:block text-right border-l border-slate-200/80 pl-3">
              <h1 className="text-xs font-bold text-slate-800">{title}</h1>
              {subtitle && <p className="text-[10px] text-slate-500 truncate max-w-[160px]">{subtitle}</p>}
            </div>
          )}

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
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || 'User'}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-lg object-cover border border-teal-200 shadow-2xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs border border-teal-200">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'NL'}
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
