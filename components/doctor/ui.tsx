import React from 'react';
import { ArrowLeft, Activity, Lock } from 'lucide-react';

export const Logo: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm shrink-0">
        <Activity className="w-5 h-5 stroke-[2.5]" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-base font-black tracking-tight text-slate-900">
            nano<span className="text-teal-600">Labs</span>
            <span className="ml-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-md">
              MD
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Physician Portal</p>
        </div>
      )}
    </div>
  );
};

interface SubScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  rightAction?: React.ReactNode;
  encryptedBadge?: boolean;
}

export const SubScreenHeader: React.FC<SubScreenHeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
  encryptedBadge = false,
}) => {
  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">{title}</h1>
            {encryptedBadge && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-[10px] font-bold text-teal-800 uppercase tracking-wider shrink-0">
                <Lock className="w-3 h-3" /> E2EE
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
        </div>
      </div>
      {rightAction && <div className="shrink-0">{rightAction}</div>}
    </div>
  );
};

export const SectionCard: React.FC<{
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, children, className = '' }) => {
  return (
    <section className={`bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            {title && <h2 className="text-sm sm:text-base font-bold text-slate-900">{title}</h2>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
};

export const EmptyStateCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => {
  return (
    <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl p-6 sm:p-8 text-center">
      <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
};

export const StatusTag: React.FC<{
  tone?: 'teal' | 'amber' | 'slate' | 'rose' | 'emerald';
  children: React.ReactNode;
}> = ({ tone = 'slate', children }) => {
  const styles: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-800 border-teal-200',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    rose: 'bg-rose-50 text-rose-800 border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold tracking-tight ${styles[tone]}`}
    >
      {children}
    </span>
  );
};
