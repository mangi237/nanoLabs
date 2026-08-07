import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { 
  Activity, 
  Building2, 
  Key, 
  ChevronDown, 
  CheckCircle, 
  Search, 
  ArrowRight, 
  Loader2, 
  Shield, 
  Sparkles, 
  X, 
  Award, 
  Lock, 
  Cpu, 
  HeartHandshake, 
  CheckCircle2, 
  UserCheck 
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess?: (user: any) => void;
  onNavigateRegister?: () => void;
  onNavigateSelectLab?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateRegister,
  onNavigateSelectLab
}) => {
  const { t } = useLanguage();
  const { login, isLoading, getAllLabs, lab: currentLab } = useAuth();
  const [accessCode, setAccessCode] = useState('');
  const [labId, setLabId] = useState(currentLab?.id || '');
  const [labName, setLabName] = useState(currentLab?.name || '');
  const [showLabSelector, setShowLabSelector] = useState(false);
  const [labs, setLabs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showAboutModal, setShowAboutModal] = useState(false);

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const list = await getAllLabs();
      setLabs(list || []);
      if (list && list.length > 0 && !labId) {
        setLabId(list[0].id);
        setLabName(list[0].name);
      }
    } catch (e) {
      console.error('Error fetching labs:', e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!accessCode.trim()) {
      setErrorMessage('Please enter your authorization access code.');
      return;
    }

    try {
      const result = await login(accessCode, labId);
      if (result.success && result.user) {
        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        }
      } else {
        setErrorMessage('Invalid access code or laboratory configuration.');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const filteredLabs = labs.filter((lab: any) =>
    lab.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lab.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedLab = labs.find((l: any) => l.id === labId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-md w-full mx-auto space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          {selectedLab?.logoUrl ? (
            <div className="inline-flex items-center justify-center mb-2">
              <img
                src={selectedLab.logoUrl}
                alt={selectedLab.name || 'Hospital Logo'}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-400/40 shadow-xl shadow-teal-500/25 bg-white"
              />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-blue-600 text-white shadow-xl shadow-teal-500/25 mb-2">
              <Activity className="w-8 h-8 stroke-[2.5]" />
            </div>
          )}
          <h1 className="text-3xl font-extrabold tracking-tight">
            {selectedLab?.name ? selectedLab.name : <>nano<span className="text-teal-400">Labs</span> Health Care</>}
          </h1>
          <p className="text-sm text-slate-300">
            {selectedLab?.location ? `Clinical Portal • ${selectedLab.location}` : 'Secure Portal Access & Laboratory Management'}
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs rounded-xl flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Laboratory Selector */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Select Facility / Lab
              </label>
              <button
                type="button"
                onClick={() => setShowLabSelector(!showLabSelector)}
                className="w-full flex items-center justify-between p-3.5 bg-white/10 border border-white/20 rounded-2xl text-left text-sm text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 truncate">
                  {selectedLab?.logoUrl ? (
                    <img
                      src={selectedLab.logoUrl}
                      alt={selectedLab.name}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-lg object-cover border border-white/20 shrink-0 bg-white"
                    />
                  ) : (
                    <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
                  )}
                  <span className="truncate font-semibold">{labName || 'Select Laboratory'}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {/* Lab Selector Dropdown */}
              {showLabSelector && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search facility name or location..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                    {filteredLabs.map((l: any) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          setLabId(l.id);
                          setLabName(l.name);
                          setShowLabSelector(false);
                          setSearchQuery('');
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                          labId === l.id ? 'bg-teal-600/30 text-teal-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {l.logoUrl ? (
                            <img
                              src={l.logoUrl}
                              alt={l.name}
                              referrerPolicy="no-referrer"
                              className="w-7 h-7 rounded-lg object-cover border border-slate-700 shrink-0 bg-white"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center shrink-0">
                              <Building2 className="w-4 h-4 text-teal-300" />
                            </div>
                          )}
                          <div className="truncate">
                            <div className="truncate font-semibold">{l.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{l.location}</div>
                          </div>
                        </div>
                        {labId === l.id && <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Access Code Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Access Code / Passcode / OTP
                </label>
                <span className="text-[10px] text-teal-300/80">Staff & Patients</span>
              </div>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  placeholder="Enter access code or email OTP"
                  value={accessCode}
                  onChange={e => setAccessCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-400 text-sm tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Staff: Enter your email setup OTP or private password. Patients: Enter your registration passcode.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Access Portal
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Register Redirect */}
          <div className="pt-4 border-t border-white/10 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={onNavigateRegister}
              className="text-xs text-teal-300 hover:text-white font-medium transition-colors hover:underline cursor-pointer"
            >
              New patient? Register your profile here
            </button>

            {/* About Us Link at the Bottom */}
            <button
              type="button"
              onClick={() => setShowAboutModal(true)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-300 font-semibold transition-colors cursor-pointer py-1 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              About nanoLabs & Founder Story
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ABOUT US MODAL */}
      {/* ------------------------------------------------------------- */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 text-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200 my-8">
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                <Activity className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">About nanoLabs Health Care</h3>
                <p className="text-xs text-teal-300 font-medium">Next-Generation Zero-Knowledge Laboratory Operating System</p>
              </div>
            </div>

            {/* Founder Spotlight */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-950/80 via-slate-800/90 to-indigo-950/80 border border-teal-500/30 space-y-3">
              <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
                <Award className="w-4 h-4" />
                Visionary Founder & Lead Architect
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-lg font-black text-white">Mangi Lerine Laslie Jr</h4>
                  <p className="text-xs text-teal-200/90 font-medium">16-Year-Old Technologist & Healthcare Innovator</p>
                </div>
                <span className="px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-400/30 rounded-full text-[11px] font-bold self-start sm:self-auto">
                  Founder at Age 16
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Engineered from the ground up by 16-year-old visionary <strong>Mangi Lerine Laslie Jr</strong>, nanoLabs was created to eliminate administrative friction in diagnostic medicine, accelerate test turnaround times, and establish ironclad cryptographic privacy for patients and medical practitioners across Cameroon and Africa.
              </p>
            </div>

            {/* Core Pillars & Enhanced Security */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Enhanced Security & Architecture Guarantees
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
                    <Lock className="w-4 h-4" />
                    Zero-Knowledge Staff Governance
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Administrators assign job roles only. Employees receive cryptographically hashed OTPs and set permanent private passwords that even administrators cannot access.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                    <Shield className="w-4 h-4" />
                    Role-Isolated Portal Isolation
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Strict separation of duties. Cashiers handle billing without clinical access; Phlebotomists accession samples; Lab Techs verify results under AES-GCM encryption.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                    <Cpu className="w-4 h-4" />
                    nanoLabs AI Report System
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Privacy-preserving AI summarization of facility throughput, stock reorder forecasting, and multi-department operational audits with zero patient PII exposure.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <HeartHandshake className="w-4 h-4" />
                    Automated Invoicing & Co-Pay
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Split-billing supporting 100% and partial insurance policies, MTN Mobile Money, Orange Money, Cash, and instant cryptographic receipts.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="text-[11px] text-slate-500 font-mono">
                nanoLabs v2.4 • Cameroon & Central Africa
              </div>
              <button
                onClick={() => setShowAboutModal(false)}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close & Return to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
