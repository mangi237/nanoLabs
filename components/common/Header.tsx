import React from 'react';
import { useAuth } from '../../context/authContext';
import { useTheme } from '../../context/themeContext';
import { useLanguage } from '../../context/languageContext';
import { Bell, Activity, MapPin } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

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
  const { user, lab } = useAuth();
  const { colors } = useTheme();
  const { language, toggleLanguage } = useLanguage();

  const handleProfileClick = () => {
    if (onProfilePress) {
      onProfilePress();
    } else if (onRoleSwitcherPress) {
      onRoleSwitcherPress();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-2 sm:px-4 py-2 sm:py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo & Brand - Simplified for mobile */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {lab?.isCustomSelected && lab?.logoUrl ? (
            <img
              src={lab.logoUrl}
              alt={lab.name || 'Lab Logo'}
              referrerPolicy="no-referrer"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover border border-slate-200 shadow-sm bg-white shrink-0"
            />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-sm shrink-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="font-bold text-sm sm:text-lg tracking-tight text-slate-900 whitespace-nowrap">
                nano<span className="text-teal-700">Labs</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 whitespace-nowrap">
                Health Network
              </span>
            </div>
            
            {/* Responsive Lab Name - truncates on mobile */}
            <div className="text-[10px] sm:text-xs text-slate-600 font-semibold truncate max-w-[100px] xs:max-w-[140px] sm:max-w-xs">
              {lab?.isCustomSelected ? lab.name : 'nanoLabs Central Network'}
            </div>
            <div className="hidden xs:flex text-[10px] text-teal-800 font-medium truncate max-w-[120px] sm:max-w-[200px] items-center gap-1">
              <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
              <span className="truncate">
                {lab?.isCustomSelected ? (
                  <>
                    {lab.city ? `${lab.city} • ` : ''}
                    {lab.address || lab.location || 'Diagnostic Facility'}
                  </>
                ) : (
                  'Central Diagnostic Hub'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls - Responsive */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {/* Title - Hidden on mobile */}
          {title && (
            <div className="hidden lg:block text-right border-l border-slate-200 pl-3">
              <h1 className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{title}</h1>
              {subtitle && <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{subtitle}</p>}
            </div>
          )}

          {/* Language Selector - Compact on mobile */}
          <LanguageSelector variant="dropdown" />

          {/* Notifications Button */}
          <button
            onClick={onNotificationPress}
            className="relative p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-all border border-slate-200 cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute top-0.5 right-0.5 sm:top-1.5 sm:right-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-teal-600 animate-pulse" />
          </button>

          {/* User Profile Pill - Responsive */}
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-1.5 sm:gap-2.5 p-1 pl-2 sm:p-1.5 sm:pl-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition-all bg-white cursor-pointer shadow-2xs hover:shadow-xs"
            title="Click to view profile & switch role"
          >
            <div className="text-right hidden xs:block">
              <div className="text-[10px] sm:text-xs font-semibold text-slate-900 leading-tight truncate max-w-[60px] sm:max-w-[100px]">
                {user?.name || 'Authorized User'}
              </div>
              <div className="text-[9px] sm:text-[11px] text-teal-700 font-medium capitalize truncate max-w-[60px] sm:max-w-[100px]">
                {user?.role?.replace('_', ' ') || 'User'}
              </div>
            </div>
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || 'User'}
                referrerPolicy="no-referrer"
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg object-cover border border-teal-200 shadow-2xs"
              />
            ) : (
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-[10px] sm:text-xs border border-teal-800">
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