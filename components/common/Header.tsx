import React, { useState } from 'react';
import { useAuth } from '../../context/authContext';
import { useTheme } from '../../context/themeContext';
import { Bell, Activity, MapPin } from 'lucide-react';
import LabLocationSearchModal from './LabLocationSearchModal';

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
  const [showLocationModal, setShowLocationModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            {lab?.logoUrl ? (
              <img
                src={lab.logoUrl}
                alt={lab.name || 'Lab Logo'}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-sm bg-white"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-sm">
                <Activity className="w-5 h-5 stroke-[2.5]" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  nano<span className="text-teal-700">Labs</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  Health Care
                </span>
              </div>
              
              {/* Lab Name with City & Address right under */}
              <div className="text-xs text-slate-600 font-semibold truncate max-w-[200px] sm:max-w-xs">
                {lab?.name || 'nanoLabs Central Diagnostics'}
              </div>
              <div className="text-[10px] text-teal-800 font-medium truncate max-w-[220px] sm:max-w-xs flex items-center gap-1">
                <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                <span className="truncate">
                  {lab?.city ? `${lab.city} • ` : ''}
                  {lab?.address || lab?.location || 'Central Diagnostic Hub'}
                </span>
              </div>
            </div>
          </div>

          {/* Title, Lab Badge or User Info */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hospital / Location Switcher Badge */}
            <button
              onClick={() => setShowLocationModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/90 rounded-2xl border border-slate-200 transition-all cursor-pointer"
              title="Click to search labs around you"
            >
              <MapPin className="w-4 h-4 text-teal-700 shrink-0" />
              <div className="text-left hidden sm:block">
                <div className="text-[11px] font-bold text-slate-900 leading-tight truncate max-w-[130px] md:max-w-[170px]">
                  {lab?.name || 'Find Labs Near You'}
                </div>
                <div className="text-[10px] text-teal-700 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 inline-block"></span>
                  <span className="truncate">{lab?.city ? `${lab.city} Center` : 'Change Location'}</span>
                </div>
              </div>
            </button>

            {title && (
              <div className="hidden lg:block text-right border-l border-slate-200 pl-3">
                <h1 className="text-xs font-bold text-slate-800">{title}</h1>
                {subtitle && <p className="text-[10px] text-slate-500 truncate max-w-[160px]">{subtitle}</p>}
              </div>
            )}

            {/* Notifications Button */}
            <button
              onClick={onNotificationPress}
              className="relative p-2 rounded-xl text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-all border border-slate-200 cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            </button>

            {/* User Profile Pill */}
            <button
              onClick={onProfilePress}
              className="flex items-center gap-2.5 p-1.5 pl-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition-all bg-white cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-900 leading-tight">
                  {user?.name || 'Authorized User'}
                </div>
                <div className="text-[11px] text-teal-700 font-medium capitalize">
                  {user?.role?.replace('_', ' ') || 'User'}
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
                <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs border border-teal-800">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'NL'}
                </div>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Location Search Modal */}
      <LabLocationSearchModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </>
  );
};

export default Header;
