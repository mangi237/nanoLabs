import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { db, addDoc, collection } from '../../services/firebase';
import { 
  Activity, User, Mail, Phone, MapPin, ArrowLeft, Loader2, 
  CheckCircle2, Building2, Key, RefreshCw, Search, Check, 
  Sparkles, ShieldCheck, ChevronDown, FileText, ExternalLink
} from 'lucide-react';
import PatientTermsModal from '../../components/legal/PatientTermsModal';

interface RegisterScreenProps {
  onBackToLogin?: () => void;
  onRegisterSuccess?: (patient: any) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onBackToLogin, onRegisterSuccess }) => {
  const { lab, getAllLabs } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Terms & Conditions state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [healthConsent, setHealthConsent] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  // Labs state & search
  const [labs, setLabs] = useState<any[]>([]);
  const [loadingLabs, setLoadingLabs] = useState(true);
  const [labSearchQuery, setLabSearchQuery] = useState('');
  const [showLabSelector, setShowLabSelector] = useState(false);
  const [selectedLab, setSelectedLab] = useState<any>(null);

  const generateDefaultAccessCode = () => 'PAT-' + Math.floor(1000 + Math.random() * 9000);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: 'Male',
    address: '',
    accessCode: generateDefaultAccessCode()
  });

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      setLoadingLabs(true);
      const list = await getAllLabs();
      if (list && list.length > 0) {
        setLabs(list);
        // Pre-select current context lab or first lab in list
        const initialLab = list.find((l: any) => l.id === lab?.id) || list[0];
        setSelectedLab(initialLab);
      } else {
        // Fallback default lab if none found
        const fallback = { id: 'lab-1', name: 'Main Medical Laboratory', location: 'Central Hub' };
        setLabs([fallback]);
        setSelectedLab(fallback);
      }
    } catch (e) {
      console.error('Error fetching labs for registration:', e);
      const fallback = { id: 'lab-1', name: 'Main Medical Laboratory', location: 'Central Hub' };
      setLabs([fallback]);
      setSelectedLab(fallback);
    } finally {
      setLoadingLabs(false);
    }
  };

  const handleSelectLab = (chosenLab: any) => {
    setSelectedLab(chosenLab);
    setShowLabSelector(false);
  };

  const handleRegenerateCode = () => {
    setFormData(prev => ({ ...prev, accessCode: generateDefaultAccessCode() }));
  };

  const filteredLabs = labs.filter(l => 
    l.name?.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
    l.location?.toLowerCase().includes(labSearchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.phone.trim()) {
      setErrorMessage('Full name and primary phone number are required.');
      return;
    }

    if (!formData.accessCode.trim()) {
      setErrorMessage('Please specify or generate a personal access code.');
      return;
    }

    if (!selectedLab?.id) {
      setErrorMessage('Please select a laboratory center.');
      return;
    }

    if (!termsAccepted) {
      setErrorMessage('You must read and agree to the Terms and Conditions before creating an account.');
      return;
    }

    if (!healthConsent) {
      setErrorMessage('You must consent to the processing of your health data to proceed.');
      return;
    }

    setLoading(true);
    try {
      const patientId = 'P-' + Math.floor(1000 + Math.random() * 9000);
      const targetLabId = selectedLab.id;

      const newPatient = {
        patientId,
        accessCode: formData.accessCode.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        age: parseInt(formData.age) || 30,
        gender: formData.gender,
        address: formData.address.trim(),
        status: 'pending_confirmation',
        labId: targetLabId,
        labName: selectedLab.name || 'Medical Laboratory',
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
        healthDataConsent: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        labTests: []
      };

      // Save to Firestore under the selected lab's patients subcollection
      const docRef = await addDoc(collection(db, 'labs', targetLabId, 'patients'), newPatient);

      if (onRegisterSuccess) {
        onRegisterSuccess({ id: docRef.id, ...newPatient });
      }
    } catch (error: any) {
      console.error('Error registering patient:', error);
      setErrorMessage(error?.message || 'Patient registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full mx-auto space-y-6">
        
        {/* Navigation back */}
        {onBackToLogin && (
          <button
            onClick={onBackToLogin}
            className="inline-flex items-center gap-2 text-xs font-semibold text-teal-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to portal login
          </button>
        )}

        {/* Page Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-blue-600 text-white shadow-xl shadow-teal-500/20 mb-1">
            <Activity className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Patient Portal Registration
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            Create your personal medical profile & pick your access code to track test results anytime.
          </p>
        </div>

        {/* Registration Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs rounded-2xl font-medium">
                {errorMessage}
              </div>
            )}

            {/* STEP 1: LAB SELECTION (Searchable) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-teal-400" />
                  1. Select Laboratory Center <span className="text-rose-400">*</span>
                </label>
                {selectedLab && !showLabSelector && (
                  <button
                    type="button"
                    onClick={() => setShowLabSelector(true)}
                    className="text-xs font-semibold text-teal-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    Change / Search Lab
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Selected Lab Card or Search Selector */}
              {!showLabSelector && selectedLab ? (
                <div 
                  onClick={() => setShowLabSelector(true)}
                  className="p-4 bg-teal-500/10 border border-teal-500/30 hover:border-teal-400 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      style={{ backgroundColor: selectedLab.primaryColor || '#0D9488' }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md"
                    >
                      {selectedLab.name?.charAt(0) || 'L'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-white group-hover:text-teal-200 transition-colors truncate">
                        {selectedLab.name}
                      </div>
                      <div className="text-xs text-slate-300 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-teal-400 shrink-0" />
                        {selectedLab.location || 'Main Center'}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-teal-500/20 border border-teal-400/30 text-teal-300 text-[11px] font-bold rounded-lg shrink-0 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Selected
                  </span>
                </div>
              ) : (
                <div className="bg-slate-900/90 border border-teal-500/40 rounded-2xl p-4 space-y-3 shadow-xl">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-teal-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Search lab by name or city (e.g. Douala, Main, Central)..."
                      value={labSearchQuery}
                      onChange={e => setLabSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400"
                      autoFocus
                    />
                  </div>

                  {/* Filtered Labs List */}
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {loadingLabs ? (
                      <div className="p-4 text-center text-xs text-teal-300 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading laboratories...
                      </div>
                    ) : filteredLabs.length > 0 ? (
                      filteredLabs.map((l: any) => (
                        <div
                          key={l.id}
                          onClick={() => handleSelectLab(l)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            selectedLab?.id === l.id
                              ? 'bg-teal-500/20 border-teal-400 text-white'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
                            <div className="min-w-0 text-xs">
                              <div className="font-bold truncate">{l.name}</div>
                              <div className="text-[11px] text-slate-400 truncate">{l.location || 'Center'}</div>
                            </div>
                          </div>
                          {selectedLab?.id === l.id && (
                            <Check className="w-4 h-4 text-teal-300 shrink-0" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No laboratory matches "{labSearchQuery}".
                      </div>
                    )}
                  </div>

                  {selectedLab && (
                    <button
                      type="button"
                      onClick={() => setShowLabSelector(false)}
                      className="w-full py-1.5 text-center text-xs text-slate-300 hover:text-white underline cursor-pointer"
                    >
                      Close lab search
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* STEP 2: PERSONAL DETAILS */}
            <div className="space-y-3 pt-1">
              <label className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-teal-400" />
                2. Personal Information
              </label>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="e.g. Eleanor Vance"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone Number <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      placeholder="+237 670000000"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      placeholder="e.vance@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                </div>
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Age</label>
                  <input
                    type="number"
                    placeholder="28"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Residential Address</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Avenue De L'Independance, Akwa"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>
            </div>

            {/* STEP 3: ACCESS CODE */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-teal-400" />
                  3. Personal Login Security Code <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  className="text-xs font-bold text-teal-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer bg-teal-500/20 px-2.5 py-1 rounded-lg border border-teal-400/30"
                >
                  <RefreshCw className="w-3 h-3" />
                  Auto-Generate
                </button>
              </div>

              <div className="relative">
                <Key className="w-4 h-4 text-teal-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="e.g. PAT-1234"
                  value={formData.accessCode}
                  onChange={e => setFormData({ ...formData, accessCode: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-teal-400/50 rounded-xl text-teal-300 text-sm font-mono tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-start gap-2.5 text-[11px] text-teal-200">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Save or write down this access code!</strong> You will use it together with your selected lab center (<span className="text-white font-semibold">{selectedLab?.name || 'Selected Lab'}</span>) to log in to your patient portal.
                </span>
              </div>
            </div>

            {/* STEP 4: TERMS & CONDITIONS AND PRIVACY CONSENT */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-400" />
                  4. Terms & Privacy Agreement <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-xs font-semibold text-teal-300 hover:text-white flex items-center gap-1 transition-colors underline cursor-pointer"
                >
                  Read Full Terms
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* System Fee Notice */}
              <div className="p-3 bg-teal-950/60 border border-teal-500/30 rounded-xl text-[11px] text-slate-300 leading-relaxed">
                <span className="text-teal-300 font-semibold">Service & System Fee Notice:</span> Standard laboratory fees are set by the facility. A platform System Fee of <strong className="text-white">1,000 XAF</strong> applies per completed service transaction to maintain secure digital result delivery and sample accountability.
              </div>

              {/* Checkbox 1: Terms and Conditions */}
              <label className="flex items-start gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-teal-600 focus:ring-teal-500 bg-slate-900 border-white/30 cursor-pointer"
                />
                <span className="text-xs text-slate-200">
                  I have read and agree to the{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTermsModal(true);
                    }}
                    className="text-teal-300 font-bold underline hover:text-white inline-flex items-center gap-0.5"
                  >
                    Terms and Conditions
                  </button>
                </span>
              </label>

              {/* Checkbox 2: Health Data Processing Consent */}
              <label className="flex items-start gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={healthConsent}
                  onChange={e => setHealthConsent(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-teal-600 focus:ring-teal-500 bg-slate-900 border-white/30 cursor-pointer"
                />
                <span className="text-xs text-slate-200">
                  I consent to the processing of my health data as described in the Terms & Conditions
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !termsAccepted || !healthConsent}
              className="w-full py-3.5 px-4 mt-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold rounded-2xl text-sm shadow-xl shadow-teal-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Registering Patient Record...
                </>
              ) : (
                <>
                  Agree & Complete Registration
                  <CheckCircle2 className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>

      {/* Patient Terms Modal */}
      <PatientTermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setTermsAccepted(true);
          setHealthConsent(true);
        }}
        accepted={termsAccepted && healthConsent}
      />
    </div>
  );
};

export default RegisterScreen;
