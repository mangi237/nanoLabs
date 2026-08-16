import React from 'react';
import { useAuth } from '../../context/authContext';
import { Building2, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

interface StaffHeroBannerProps {
  workstationTitle: string;
  workstationNumber: string;
  description: string;
  actions?: React.ReactNode;
  rightBadge?: React.ReactNode;
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
  borderColor?: string;
  badgeBg?: string;
}

export const StaffHeroBanner: React.FC<StaffHeroBannerProps> = ({
  workstationTitle,
  workstationNumber,
  description,
  actions,
  rightBadge,
  gradientFrom = 'from-teal-900',
  gradientVia = 'via-slate-900',
  gradientTo = 'to-teal-950',
  borderColor = 'border-teal-800',
  badgeBg = 'bg-teal-400 text-slate-950'
}) => {
  const { user, lab } = useAuth();

  const formattedRole = user?.role 
    ? user.role.replace('_', ' ').toUpperCase() 
    : 'STAFF SPECIALIST';

  return (
    <div className={`bg-gradient-to-r ${gradientFrom} ${gradientVia} ${gradientTo} rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border ${borderColor}`}>
      {/* Decorative ambient background blur */}
      <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          {/* Top Company & Workstation Info Row */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Company Logo / Badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-xs shadow-xs">
              {lab?.logoUrl ? (
                <img src={lab.logoUrl} alt={lab.name} className="w-5 h-5 object-contain rounded-md bg-white p-0.5" />
              ) : (
                <Building2 className="w-4 h-4 text-teal-300" />
              )}
              <span className="truncate max-w-[200px]">{lab?.name || 'nanoLabs Central Diagnostics'}</span>
            </div>

            {/* Workstation Pill */}
            <span className={`px-2.5 py-1 rounded-full ${badgeBg} text-[10px] font-extrabold uppercase tracking-wider`}>
              {workstationNumber}
            </span>

            {/* Staff Role Badge */}
            <span className="px-2.5 py-1 rounded-full bg-white/10 text-slate-200 text-[10px] font-mono font-bold border border-white/20 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-teal-300" />
              {formattedRole}
            </span>
          </div>

          {/* Welcome Message & Staff Name */}
          <div className="pt-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2 flex-wrap">
              <span>Welcome back, {user?.name || 'Staff Member'}!</span>
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse hidden sm:inline-block" />
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-teal-200/90 mt-0.5">
              {workstationTitle} • {formattedRole}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-300/90 max-w-2xl leading-relaxed">
            {description}
          </p>
        </div>

        {/* Right Action Buttons or Metrics Badge */}
        {(actions || rightBadge) && (
          <div className="flex items-center gap-3 shrink-0">
            {rightBadge}
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffHeroBanner;
