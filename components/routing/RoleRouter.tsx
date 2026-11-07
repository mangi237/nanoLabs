import React, { useState } from 'react';
import { useAuth } from '../../context/authContext';
import { UserRole } from '../../types';
import PatientApp from '../../screens/Patient/PatientApp';
import DoctorApp from '../../screens/doctor/DoctorApp';
import LabApp from '../../screens/Lab/LabApp';
import SuperAdminApp from '../../screens/superAdmin/SuperAdminApp';
import { Shield, ChevronDown, Check, UserCheck, RefreshCw } from 'lucide-react';

interface RoleRouterProps {
  onNavigateWebsite?: () => void;
}

export const RoleRouter: React.FC<RoleRouterProps> = ({ onNavigateWebsite }) => {
  const { user, setUser } = useAuth();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  if (!user) return null;

  const currentRole = (user.role || user.primaryRole || 'patient') as string;

  const handleSwitchRole = (newRole: UserRole) => {
    setUser({
      ...user,
      role: newRole,
      primaryRole: newRole
    });
    setShowRoleSwitcher(false);
  };

  const roleOptions: { role: UserRole; label: string; desc: string }[] = [
    { role: 'patient', label: 'Patient Portal', desc: 'Scan prescriptions, book home/walk-in tests, view reports' },
    { role: 'doctor', label: 'Physician Portal', desc: 'Prescribe e-requests, ONMC digital sign, manage patient cohort' },
    { role: 'lab_staff', label: 'Laboratory Intake & Worklist', desc: 'Specimen barcoding, bench analyzers, worklist progression' },
    { role: 'cashier', label: 'Cashier Counter', desc: 'Manual insurance verification, 5% fee on patient share only' },
    { role: 'phlebotomist', label: 'Phlebotomy Fleet', desc: 'Home sample collection, cold-chain GPS tracker (+4°C)' },
    { role: 'biologist', label: 'Medical Biologist Validation', desc: 'Delta check, automated flagging, cryptographic QR seal' },
    { role: 'super_admin', label: 'Super Admin Governance', desc: 'Monthly 5% settlements, audit hash-chain, lab onboarding' }
  ];

  const renderPortal = () => {
    switch (currentRole) {
      case 'patient':
        return <PatientApp />;
      case 'doctor':
        return <DoctorApp />;
      case 'super_admin':
      case 'superadmin':
        return <SuperAdminApp />;
      case 'lab_staff':
      case 'cashier':
      case 'phlebotomist':
      case 'biologist':
      case 'technician':
      case 'receptionist':
      case 'admin':
      case 'lab_admin':
      default:
        return <LabApp />;
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Floating Role Switcher Pill for quick role testing / demo */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="relative">
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="min-h-[44px] px-3.5 py-2 bg-[#0D3B38] text-white rounded-2xl shadow-xl hover:bg-[#0F766E] transition-all flex items-center gap-2 border border-teal-500/30 text-xs font-bold cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-teal-400" />
            <span className="capitalize">{currentRole.replace('_', ' ')} Mode</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showRoleSwitcher ? 'rotate-180' : ''}`} />
          </button>

          {showRoleSwitcher && (
            <div className="absolute bottom-12 right-0 w-80 bg-white rounded-3xl border border-slate-200 shadow-2xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-[11px] font-black uppercase text-slate-800 tracking-wide">
                  Switch Operational Role
                </span>
                <span className="text-[10px] font-mono text-slate-400">B2B2C Sandbox</span>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {roleOptions.map((opt) => {
                  const isActive = currentRole === opt.role;
                  return (
                    <button
                      key={opt.role}
                      onClick={() => handleSwitchRole(opt.role)}
                      className={`w-full p-2.5 rounded-xl text-left text-xs transition-all flex items-start justify-between gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-teal-50/80 border border-teal-300 text-[#0D3B38]'
                          : 'hover:bg-slate-50 border border-transparent text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{opt.label}</span>
                          {isActive && <Check className="w-3.5 h-3.5 text-[#0F766E]" />}
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {onNavigateWebsite && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowRoleSwitcher(false);
                      onNavigateWebsite();
                    }}
                    className="w-full py-2 text-center text-xs font-bold text-slate-500 hover:text-[#0F766E] transition-colors cursor-pointer"
                  >
                    Return to Public Website
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {renderPortal()}
    </div>
  );
};

export default RoleRouter;
