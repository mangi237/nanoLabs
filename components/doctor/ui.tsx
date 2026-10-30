import React from 'react';

export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-[#E5E7EB] bg-white ${className}`}>{children}</div>
);

export const PageHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <header className="mb-6">
    <h1 className="text-2xl font-semibold tracking-tight text-[#111827] md:text-[28px]">{title}</h1>
    {subtitle && <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p>}
  </header>
);

export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-2 mt-6 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">{children}</p>
);

export const EmptyState = ({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) => (
  <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#D1D9D8] bg-white px-6 py-10 text-center">
    <div className="grid h-12 w-12 place-items-center rounded-full bg-[#E6F2F3] text-[#006978]">{icon}</div>
    <p className="text-[15px] font-semibold text-[#111827]">{title}</p>
    <p className="text-[13px] text-[#6B7280]">{text}</p>
  </div>
);

export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-[#E5E7EB] ${className}`} />
);

export const Button = ({
  variant = 'primary',
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) => {
  const styles = {
    primary: 'bg-[#006978] text-white hover:bg-[#005660]',
    ghost: 'bg-white text-[#006978] border border-[#E5E7EB] hover:bg-[#F4F6F6]',
    danger: 'bg-white text-[#B91C1C] border border-[#F3C4C0] hover:bg-[#FEF2F2]'
  }[variant];
  return (
    <button
      className={`h-11 rounded-[14px] px-4 text-[14px] font-semibold transition disabled:opacity-50 ${styles} ${className}`}
      {...rest}
    />
  );
};

export const Toggle = ({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative h-[26px] w-[44px] shrink-0 rounded-full transition ${checked ? 'bg-[#006978]' : 'bg-[#E5E7EB]'}`}
  >
    <span
      className={`absolute top-[3px] h-5 w-5 rounded-full bg-white transition ${checked ? 'left-[21px]' : 'left-[3px]'}`}
    />
  </button>
);

export const Pill = ({ children, tone = 'teal' }: { children: React.ReactNode; tone?: 'teal' | 'amber' | 'green' }) => {
  const styles = {
    teal: 'bg-[#E6F2F3] text-[#006978]',
    amber: 'bg-[#FEF3C7] text-[#B45309]',
    green: 'bg-[#DCFCE7] text-[#15803D]'
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold ${styles}`}>{children}</span>;
};

export const Avatar = ({ name, size = 40 }: { name?: string; size?: number }) => {
  const initials = (name || '')
    .replace(/^(dr|pr|mme|m)\.?\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div
      className="grid shrink-0 place-items-center rounded-[12px] bg-[#E6F2F3] text-[13px] font-semibold text-[#006978]"
      style={{ width: size, height: size }}
    >
      {initials || '·'}
    </div>
  );
};

export const Logo = ({ size = 36 }: { size?: number }) => (
  <div className="flex items-center gap-3">
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#006978" />
      <path d="M8 21h6l3-7 4 12 3-5h8" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span className="text-[20px] font-bold text-[#111827]">
      Nano<span className="text-[#006978]">Labs</span>
    </span>
  </div>
);