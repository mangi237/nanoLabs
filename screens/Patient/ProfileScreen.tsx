import React, { useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  CreditCard, 
  Stethoscope, 
  Download, 
  Bell, 
  LogOut, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  Save,
  Trash2,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { CEMAC_INSURERS } from '../auth/InsuranceSetupScreen';

interface ProfileScreenProps {
  onLogout?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout }) => {
  const { user, logout } = useAuth();

  const [name, setName] = useState(user?.name || user?.fullName || 'Mme. Claire Ngo');
  const [phone, setPhone] = useState(user?.phone || '+237 670 11 22 33');
  const [email, setEmail] = useState(user?.email || 'claire.ngo@gmail.com');
  const [address, setAddress] = useState(user?.address || 'Akwa, Douala, Cameroun');
  
  // Insurance
  const [insuranceProvider, setInsuranceProvider] = useState('Ascoma Assurances');
  const [policyNumber, setPolicyNumber] = useState('ASC-2026-992014');
  const [coveragePercent, setCoveragePercent] = useState(80);

  // Notification Preferences
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [emailReports, setEmailReports] = useState(true);

  // Connected Doctors
  const [doctors, setDoctors] = useState([
    { id: 'doc1', name: 'Dr. Jean-Paul Kamga', specialty: 'Médecine Interne', hospital: 'Hôpital Général Douala' },
    { id: 'doc2', name: 'Dr. Mireille Essomba', specialty: 'Endocrinologie', hospital: 'Cabinet Médical Bonanjo' }
  ]);

  const [saveMessage, setSaveMessage] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage(true);
    setTimeout(() => setSaveMessage(false), 3000);
  };

  const handleDownloadData = () => {
    const data = {
      patientProfile: { name, phone, email, address, insuranceProvider, policyNumber, coveragePercent },
      exportedAt: new Date().toISOString(),
      platform: 'nanoLabs CEMAC Clinical Data Hub'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nanoLabs_patient_record_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-[#0B1F1D] tracking-tight">
          Patient Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7F7D]">
          Manage your personal identifiers, health insurance co-pay details, and clinical data preferences.
        </p>
      </div>

      {saveMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">Profile and insurance information saved successfully.</span>
        </div>
      )}

      {/* Personal Information Form */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
        <h2 className="text-sm font-black uppercase tracking-wide text-[#0B1F1D] pb-2 border-b border-slate-100 flex items-center gap-2">
          <User className="w-4 h-4 text-[#0F766E]" />
          <span>Personal Information</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-teal-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Phone Number (MoMo / SMS)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-hidden focus:border-teal-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-teal-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Residence / Sampling Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-teal-500"
            />
          </div>
        </div>

        {/* Insurance Co-Pay Configuration */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#0F766E]" />
              <span>CEMAC Health Insurance</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-[#0F766E] border border-teal-200">
              Verified at Intake Desk
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600">Insurer</label>
              <input
                type="text"
                value={insuranceProvider}
                onChange={(e) => setInsuranceProvider(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600">Card / Policy Number</label>
              <input
                type="text"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600">Coverage Percentage (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={coveragePercent}
                onChange={(e) => setCoveragePercent(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="min-h-[44px] px-6 py-2 bg-[#0F766E] hover:bg-[#0D3B38] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Updates</span>
          </button>
        </div>
      </form>

      {/* Connected Doctors Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-sm font-black uppercase tracking-wide text-[#0B1F1D] flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-[#0F766E]" />
            <span>Connected Physicians ({doctors.length})</span>
          </h2>
        </div>

        <div className="space-y-2">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="font-bold text-slate-900">{doc.name}</div>
                <div className="text-[11px] text-slate-500">
                  {doc.specialty} &bull; {doc.hospital}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDoctors(doctors.filter((d) => d.id !== doc.id))}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications & Data Management */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Notification Preferences */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#0F766E]" />
            <span>Diagnostic Alerts</span>
          </h3>
          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between cursor-pointer">
              <span>WhatsApp Results Ready Notification</span>
              <input
                type="checkbox"
                checked={whatsappAlerts}
                onChange={(e) => setWhatsappAlerts(e.target.checked)}
                className="accent-[#0F766E]"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>SMS Phlebotomist Dispatch Tracking</span>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="accent-[#0F766E]"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Email Official PDF Reports</span>
              <input
                type="checkbox"
                checked={emailReports}
                onChange={(e) => setEmailReports(e.target.checked)}
                className="accent-[#0F766E]"
              />
            </label>
          </div>
        </div>

        {/* Data Portability */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-2">
              <Download className="w-4 h-4 text-[#0F766E]" />
              <span>Medical Data Portability</span>
            </h3>
            <p className="text-xs text-[#6B7F7D]">
              Download an encrypted JSON file containing your complete laboratory history and biomarker ledger.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadData}
            className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 self-start"
          >
            <Download className="w-4 h-4 text-[#0F766E]" />
            <span>Download My Medical Data (JSON)</span>
          </button>
        </div>
      </div>

      {/* Logout Action */}
      {onLogout && (
        <div className="pt-4 flex justify-end">
          <button
            onClick={onLogout}
            className="min-h-[44px] px-5 py-2 text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of nanoLabs</span>
          </button>
        </div>
      )}
    </div>
  );
};

export { ProfileScreen as PatientProfileScreen };
export default ProfileScreen;
