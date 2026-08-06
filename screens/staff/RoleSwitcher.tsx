import React from 'react';
import { useAuth } from '../../context/authContext';
import { Shield, User, DollarSign, Microscope, TestTube, Package, Check, ArrowLeft, Activity } from 'lucide-react';
import Header from '../../components/common/Header';

interface RoleSwitcherProps {
  onBack?: () => void;
  onRoleSwitched?: (role: string) => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  onBack,
  onRoleSwitched,
  onNotificationPress,
  onProfilePress
}) => {
  const { user, setUser } = useAuth();

  const availableRoles = [
    { value: 'admin', label: 'Lab Administrator', icon: Shield, desc: 'Full laboratory operations, staff management & multi-category analytics' },
    { value: 'receptionist', label: 'Receptionist Intake', icon: User, desc: 'Patient admissions & sample intake processing' },
    { value: 'cashier', label: 'Cashier & Billing', icon: DollarSign, desc: 'Billing invoices & payment collection' },
    { value: 'analyzer', label: 'Analyzer / Phlebotomist', icon: Microscope, desc: 'Sample verification & diagnostic result entry' },
    { value: 'labtech', label: 'Lab Technologist', icon: TestTube, desc: 'Specimen processing & testing workflow' },
    { value: 'inventory_manager', label: 'Inventory Manager', icon: Package, desc: 'Stock level monitoring & reorder orders' }
  ];

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || (user?.roles && (user.roles.includes('admin') || user.roles.includes('superadmin')));
  const userRoles = user?.roles || [user?.role || 'admin'];

  const handleSelectRole = (roleValue: string) => {
    if (user) {
      setUser({
        ...user,
        role: roleValue as any
      });
      if (onRoleSwitched) onRoleSwitched(roleValue);
      else if (onBack) onBack();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Role Switcher"
        subtitle="Switch active operational view & permissions"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Switch Workspace Role</h2>
            <p className="text-xs text-slate-500">Select an authorized role context for your session</p>
          </div>

          <div className="space-y-3">
            {availableRoles.map(role => {
              const Icon = role.icon;
              const isActive = user?.role === role.value;
              const isAssigned = userRoles.includes(role.value as any) || user?.role === 'admin' || user?.role === 'superadmin';

              return (
                <button
                  key={role.value}
                  onClick={() => isAssigned && handleSelectRole(role.value)}
                  disabled={!isAssigned}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between gap-4 transition-all ${
                    isActive
                      ? 'border-teal-600 bg-teal-50/80 shadow-xs'
                      : isAssigned
                      ? 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                      : 'border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`p-2.5 rounded-xl border ${isActive ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm truncate">{role.label}</span>
                        {isActive && (
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
                            Active Role
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{role.desc}</p>
                    </div>
                  </div>

                  {isActive && <Check className="w-5 h-5 text-teal-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoleSwitcher;
