import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import { Lab } from '../../types';
import { Search, MapPin, Users, ChevronRight, Activity, ArrowLeft, Loader2, Plus, Building2, ShieldCheck } from 'lucide-react';
import LabRegistrationModal from '../superAdmin/LabRegistrationModal';

interface LabSelectionScreenProps {
  onSelectLab?: (lab: Lab) => void;
  onBack?: () => void;
}

export const LabSelectionScreen: React.FC<LabSelectionScreenProps> = ({ onSelectLab, onBack }) => {
  const { t } = useLanguage();
  const { getAllLabs } = useAuth();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const list = await getAllLabs();
      setLabs(list);
    } catch (e) {
      console.error('Error fetching labs:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLabs = labs.filter(lab =>
    lab.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lab.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full mx-auto space-y-6">
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-teal-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to previous page
          </button>
        )}

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-blue-600 text-white shadow-lg shadow-teal-500/30 mb-2">
            <Activity className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            nano<span className="text-teal-400">Labs</span> Health Network
          </h1>
          <p className="text-sm text-slate-300 max-w-sm mx-auto">
            {t('select_your_lab')}
          </p>
          <p className="text-xs text-slate-400">
            {t('choose_lab_to_continue')}
          </p>
        </div>

        {/* Register Facility CTA Card */}
        <div className="p-4 bg-teal-500/10 border border-teal-400/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">Register a New Medical Facility</h4>
              <p className="text-[11px] text-teal-200">Zero software fees • 1,000 XAF System Fee</p>
            </div>
          </div>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="w-full sm:w-auto px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Register Facility
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder={t('search_lab')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm transition-all"
          />
        </div>

        {/* Labs List Container */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-teal-300 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-xs font-semibold">Loading Laboratory Centers...</span>
          </div>
        ) : (
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {filteredLabs.map(item => (
              <div
                key={item.id}
                onClick={() => onSelectLab && onSelectLab(item)}
                className="group p-5 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 hover:border-teal-400/50 rounded-2xl cursor-pointer transition-all duration-200 flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    style={{ backgroundColor: item.primaryColor || '#0D9488' }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0"
                  >
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-bold text-white text-base group-hover:text-teal-300 transition-colors truncate">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 truncate">
                      <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Users className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{item.patientCount || 0} active patient profiles</span>
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-300 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            ))}

            {filteredLabs.length === 0 && (
              <div className="p-10 text-center bg-white/5 rounded-2xl border border-white/10 space-y-2">
                <p className="text-sm font-semibold text-slate-300">{t('no_labs_found')}</p>
                <p className="text-xs text-slate-400">{t('try_different_search')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Facility Registration Modal */}
      <LabRegistrationModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onLabCreated={() => {
          fetchLabs();
          setShowRegisterModal(false);
        }}
      />
    </div>
  );
};

export default LabSelectionScreen;
