import React, { useState } from 'react';
import { 
  User, 
  ArrowLeft, 
  FileText, 
  Shield, 
  MapPin, 
  Bell, 
  HelpCircle, 
  Settings, 
  ChevronRight, 
  LogOut, 
  Check, 
  Edit3,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useFamilyProfile } from '../../context/familyProfileContext';

interface PatientProfileScreenProps {
  onBack?: () => void;
  onNavigateInsurance?: () => void;
  onNavigateHealthRecords?: () => void;
  onLogout?: () => void;
}

export const PatientProfileScreen: React.FC<PatientProfileScreenProps> = ({
  onBack,
  onNavigateInsurance,
  onNavigateHealthRecords,
  onLogout
}) => {
  const { user, logout } = useAuth();
  const { activeProfile, isDependentActive } = useFamilyProfile();

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [userName, setUserName] = useState(activeProfile?.fullName || user?.name || 'Verified Patient');
  const [userEmail, setUserEmail] = useState(user?.email || `${(activeProfile?.fullName || 'patient').toLowerCase().replace(/\s+/g, '.')}@nanolabs.cm`);
  const [userPhone, setUserPhone] = useState(user?.phone || '+237 670 00 00 00');

  const menuItems = [
    { id: 'personal', label: 'Personal information', icon: User, action: () => setActiveModal('personal') },
    { id: 'records', label: 'My health records', icon: FileText, action: onNavigateHealthRecords || (() => setActiveModal('records')) },
    { id: 'insurance', label: 'Insurance', icon: Shield, action: onNavigateInsurance || (() => setActiveModal('insurance')) },
    { id: 'addresses', label: 'Saved addresses', icon: MapPin, action: () => setActiveModal('addresses') },
    { id: 'notifications', label: 'Notifications', icon: Bell, action: () => setActiveModal('notifications') },
    { id: 'help', label: 'Help & support', icon: HelpCircle, action: () => setActiveModal('help') },
    { id: 'settings', label: 'Settings', icon: Settings, action: () => setActiveModal('settings') }
  ];

  return (
    <div className="max-w-2xl mx-auto py-3 px-3 sm:px-6 text-slate-900 animate-in fade-in duration-300 space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Profile & Account
        </h1>
      </div>

      {/* User Header Card */}
      <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-[#006978] text-white flex items-center justify-center font-black text-xl shadow-xs border-2 border-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <button 
              onClick={() => setActiveModal('personal')}
              className="w-5 h-5 rounded-full bg-[#006978] text-white flex items-center justify-center absolute bottom-0 right-0 shadow-xs cursor-pointer"
              title="Edit info"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">{userName}</h2>
              {isDependentActive && (
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  {activeProfile.relationshipLabel}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">{userEmail}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#E0F2F1] text-[#006978] text-[10px] font-bold">
                Verified Diagnostic Account
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                PID: {activeProfile.id}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={item.action}
              className="p-4 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-50 group-hover:bg-[#E0F2F1] text-slate-600 group-hover:text-[#006978] flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-[#006978]">
                  {item.label}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#006978]" />
            </div>
          );
        })}
      </div>

      {/* Logout Action */}
      <div className="pt-2">
        <button
          onClick={onLogout || logout}
          className="w-full py-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-2 border border-rose-200/80"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Modal Dialog for Personal Information */}
      {activeModal === 'personal' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-black text-slate-900">Personal Information</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 block mb-1">Email</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 block mb-1">Phone</label>
                <input
                  type="text"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 bg-[#006978] text-white font-bold text-xs rounded-xl"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Generic Modal Dialog */}
      {activeModal && activeModal !== 'personal' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-3 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-black text-slate-900 capitalize">{activeModal.replace('_', ' ')}</h3>
            <p className="text-xs text-slate-600">
              Your {activeModal} settings are configured according to your secure clinical profile.
            </p>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 bg-[#006978] text-white font-bold text-xs rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientProfileScreen;
