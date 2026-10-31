import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, ChevronRight, CheckCircle2, Inbox, Layers } from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useFamilyProfile } from '../../context/familyProfileContext';
import { BatchConsolidatedReportModal } from '../../components/patient/BatchConsolidatedReportModal';

export interface PatientResultItem {
  id: string;
  bookingId?: string;
  bookingCode?: string;
  labId?: string;
  testId?: string;
  testName: string;
  labName: string;
  date: string;
  biologistName?: string;
  releaseChannel?: string;
  booking?: any;
  status: 'normal' | 'flagged';
  statusText: string;
  parameters: {
    name: string;
    value: string;
    unit: string;
    referenceRange: string;
    isNormal: boolean;
  }[];
}

export const DEFAULT_RESULT_TEMPLATE: PatientResultItem = {
  id: 'res-empty',
  testName: 'Diagnostic Test Result',
  labName: 'Performing Laboratory',
  date: 'Recent',
  status: 'normal',
  statusText: 'Certified by Medical Biologist',
  parameters: []
};

interface MyResultsScreenProps {
  onBack: () => void;
  onSelectResult: (result: PatientResultItem) => void;
}

export const MyResultsScreen: React.FC<MyResultsScreenProps> = ({
  onBack,
  onSelectResult
}) => {
  const { user } = useAuth();
  const { activeProfile, isDependentActive } = useFamilyProfile();

  const [activeTab, setActiveTab] = useState<'Single' | 'Batches'>('Single');
  const [results, setResults] = useState<PatientResultItem[]>([]);
  const [completedBatches, setCompletedBatches] = useState<any[]>([]);
  const [selectedBatchModal, setSelectedBatchModal] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLivePatientResults = async () => {
    try {
      setLoading(true);
      const { limsService } = await import('../../services/limsService');
      const allBookings = await limsService.fetchPatientBookingsAcrossLabs(
        user?.labId ? [user.labId] : []
      );

      const activeName = (activeProfile?.fullName || '').toLowerCase().trim();
      const activeId = activeProfile?.id || '';
      const userId = user?.id || '';
      const userName = (user?.name || '').toLowerCase().trim();

      // Strictly show results ONLY once signed & released by the Biologist (or overallStatus === 'Completed')
      const releasedBookings = allBookings.filter((b) => {
        const bPid = (b.patientPid || b.patientId || '').trim();
        const bName = (b.patientName || '').toLowerCase().trim();
        const isMatch = isDependentActive
          ? Boolean((activeId && bPid === activeId) || (activeName && bName === activeName))
          : Boolean(
              (activeId && bPid === activeId) ||
                (userId && bPid === userId) ||
                (activeName && bName === activeName) ||
                (userName && bName === userName)
            );
        const isBiologistCertified = Boolean(
          b.biologistSigned || b.resultsReleased || b.overallStatus === 'Completed'
        );
        return isMatch && isBiologistCertified;
      });

      setCompletedBatches(releasedBookings);

      const mapped: PatientResultItem[] = [];
      releasedBookings.forEach((b) => {
        (b.tests || []).forEach((t: any, idx: number) => {
          const subParams = Array.isArray(t.subParameters) && t.subParameters.length > 0
            ? t.subParameters.map((sp: any) => ({
                name: sp.name || sp.parameterName || 'Parameter',
                value: String(sp.value ?? sp.resultValue ?? 'Validated'),
                unit: sp.units || sp.unit || '',
                referenceRange: sp.refRange || sp.referenceRange || 'Standard',
                isNormal: !sp.flag || sp.flag.toLowerCase() === 'normal'
              }))
            : [
                {
                  name: t.testName || t.name || 'Diagnostic Assay',
                  value: String(t.resultValue || 'Validated'),
                  unit: t.units || '',
                  referenceRange: t.refRangeMale || t.referenceRange || 'Reference Range',
                  isNormal: !t.resultFlag || t.resultFlag.toLowerCase() === 'normal'
                }
              ];

          const hasAbnormal = subParams.some((p: any) => !p.isNormal);
          mapped.push({
            id: `${b.id}-t-${idx}`,
            bookingId: b.id,
            bookingCode: b.bookingCode,
            labId: b.labId || 'lab-1',
            testId: t.id || t.testId,
            testName: t.testName || t.name || 'Diagnostic Test',
            labName: b.labName || 'Performing Laboratory',
            date: b.biologistSignedAt
              ? new Date(b.biologistSignedAt).toLocaleDateString()
              : b.createdAt
                ? new Date(b.createdAt).toLocaleDateString()
                : 'Recent',
            biologistName: b.biologistName || 'Medical Biologist',
            releaseChannel: b.releaseChannel,
            booking: b,
            status: hasAbnormal ? 'flagged' : 'normal',
            statusText: hasAbnormal ? 'Attention Required · Certified' : 'Within Reference Range · Certified',
            parameters: subParams
          });
        });
      });

      setResults(mapped);
    } catch (err) {
      console.warn('Error fetching live results:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivePatientResults();
    window.addEventListener('nanolabs_booking_updated', fetchLivePatientResults);
    return () => window.removeEventListener('nanolabs_booking_updated', fetchLivePatientResults);
  }, [user?.id, activeProfile?.id, isDependentActive]);

  return (
    <div className="max-w-2xl mx-auto py-3 px-2 sm:px-4 text-slate-900 animate-in fade-in duration-300 space-y-5">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Biologist Certified Results
          </h1>
          <p className="text-[11px] text-slate-500">
            Patient: <strong className="text-slate-800">{activeProfile.fullName}</strong> ({activeProfile.relationshipLabel})
          </p>
        </div>
      </div>

      {/* Mode Tabs: Single Test Reports vs Consolidated Batch Reports */}
      <div className="flex items-center border-b border-slate-200">
        <button
          onClick={() => setActiveTab('Single')}
          className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
            activeTab === 'Single'
              ? 'border-[#006978] text-[#006978]'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Single Test Reports ({results.length})
        </button>
        <button
          onClick={() => setActiveTab('Batches')}
          className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
            activeTab === 'Batches'
              ? 'border-[#006978] text-[#006978]'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Consolidated Batch Dossiers ({completedBatches.length})
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
          Synchronizing certified biological reports...
        </div>
      ) : activeTab === 'Single' ? (
        results.length > 0 ? (
          <div className="space-y-3">
            {results.map((res) => (
              <div
                key={res.id}
                onClick={() => onSelectResult(res)}
                className="p-4 bg-white hover:border-[#006978] border border-slate-200 rounded-3xl shadow-xs flex items-center justify-between gap-3 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center font-bold shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#006978]">
                      {res.testName}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                      <span className="font-semibold text-slate-700">{res.labName}</span>
                      <span>&middot;</span>
                      <span>{res.date}</span>
                      <span>&middot;</span>
                      <span className="text-emerald-700 font-semibold">Signed by {res.biologistName}</span>
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#006978] shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-800">
                No Certified Results Released Yet for {activeProfile.fullName}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                As soon as the Medical Biologist validates and signs your laboratory findings, your official report with the laboratory's header appears here immediately.
              </p>
            </div>
          </div>
        )
      ) : completedBatches.length > 0 ? (
        <div className="space-y-3">
          {completedBatches.map((batch) => (
            <div
              key={batch.id}
              onClick={() => setSelectedBatchModal(batch)}
              className="p-4 bg-white hover:border-[#006978] border border-slate-200 rounded-3xl shadow-xs flex items-center justify-between gap-3 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Batch #{batch.bookingCode} &middot; {(batch.tests || []).length} Test(s)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {batch.labName || 'Performing Laboratory'} &middot; Signed by {batch.biologistName || 'Medical Biologist'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#006978]">Open Dossier</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
          No consolidated batch dossiers released yet.
        </div>
      )}

      {selectedBatchModal && (
        <BatchConsolidatedReportModal
          isOpen={!!selectedBatchModal}
          onClose={() => setSelectedBatchModal(null)}
          booking={selectedBatchModal}
        />
      )}
    </div>
  );
};
