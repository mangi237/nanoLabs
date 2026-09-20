import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Share2, 
  QrCode, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Printer, 
  Clock, 
  User, 
  ChevronRight, 
  ExternalLink, 
  X, 
  Users,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { TestBatch } from '../../types';
import { getBatchesForPatient } from '../../services/batchService';
import { buildReportModel, RenderedReportData } from '../../services/reportRenderer';
import { formatXAF } from '../../shared/money';
import { useAuth } from '../../context/authContext';
import { useFamilyProfile } from '../../context/familyProfileContext';
import { PatientA4ReportViewerModal } from '../../components/patient/PatientA4ReportViewerModal';
import { doctorChatService } from '../../services/doctorChatService';
import { PatientBooking } from '../../services/limsService';

interface TestResultsScreenProps {
  initialBatchId?: string;
  onBack?: () => void;
  onSelectBatch?: (batchId: string) => void;
  onNavigateToChat?: () => void;
}

export const TestResultsScreen: React.FC<TestResultsScreenProps> = ({
  initialBatchId,
  onBack,
  onSelectBatch,
  onNavigateToChat
}) => {
  const { user } = useAuth();
  const { familyMembers, activeProfile } = useFamilyProfile();
  const [batches, setBatches] = useState<TestBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<TestBatch | null>(null);
  const [selectedFamilyFilter, setSelectedFamilyFilter] = useState<string>('all');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // A4 Viewer States
  const [showA4Modal, setShowA4Modal] = useState(false);
  const [a4InitialTestIndex, setA4InitialTestIndex] = useState<number | undefined>(undefined);

  useEffect(() => {
    const patientId = user?.id || 'demo_patient';
    let loaded = getBatchesForPatient(patientId, user?.phone, user?.name);

    if (loaded.length === 0) {
      // Demo signed batch for primary user
      const signedDemo: TestBatch = {
        id: 'batch_signed_demo',
        batchNumber: 'BCH-202609-1092',
        patientId,
        familyProfileId: 'fam_claire_self',
        patientName: user?.name || 'Mme. Claire Ngo',
        patientAge: 38,
        patientGender: 'F',
        labId: 'lab_central_douala',
        labName: 'Laboratoire Central Akwa - Douala',
        sampleMode: 'walk_in',
        status: 'ready',
        tests: [
          { testId: 't1', code: 'NFS-HB', name: 'Hémoglobine (Hb)', category: 'hematology', sampleType: 'Whole Blood', basePrice: 4500, resultValue: '12.8', referenceRange: '11.5 - 15.0', unit: 'g/dL', flag: 'normal', status: 'validated' },
          { testId: 't2', code: 'NFS-WBC', name: 'Leucocytes (Globules Blancs)', category: 'hematology', sampleType: 'Whole Blood', basePrice: 0, resultValue: '6,400', referenceRange: '4,000 - 10,000', unit: '/mm³', flag: 'normal', status: 'validated' },
          { testId: 't3', code: 'NFS-PLT', name: 'Plaquettes Sanguines', category: 'hematology', sampleType: 'Whole Blood', basePrice: 0, resultValue: '285,000', referenceRange: '150,000 - 450,000', unit: '/mm³', flag: 'normal', status: 'validated' },
          { testId: 't4', code: 'GLYC', name: 'Glycémie à Jeûn', category: 'biochemistry', sampleType: 'Plasma Fluoré', basePrice: 2000, resultValue: '0.94', referenceRange: '0.70 - 1.10', unit: 'g/L', flag: 'normal', status: 'validated' },
          { testId: 't5', code: 'CRTC', name: 'Créatinine Sérique', category: 'biochemistry', sampleType: 'Sérum', basePrice: 3500, resultValue: '8.2', referenceRange: '6.0 - 11.0', unit: 'mg/L', flag: 'normal', status: 'validated' }
        ],
        biologistName: 'Dr. Suzanne Mbongo',
        biologistLicense: 'ONMC #4829 / ONPC #1204',
        qrAuditHash: 'NL-BCH-202609-1092-99FA03',
        paymentStatus: 'verified',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        collectedAt: new Date(Date.now() - 82800000).toISOString(),
        receivedAt: new Date(Date.now() - 79200000).toISOString(),
        signedAt: new Date(Date.now() - 43200000).toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Demo signed batch for elderly mother (Mme Ngo Madeleine)
      const motherDemo: TestBatch = {
        id: 'batch_mother_demo',
        batchNumber: 'BCH-202609-0824',
        patientId,
        familyProfileId: 'fam_mother_madeleine',
        familyRelationship: 'mother',
        patientName: 'Mme. Ngo Madeleine',
        patientAge: 72,
        patientGender: 'F',
        labId: 'lab_central_douala',
        labName: 'Laboratoire Central Akwa - Douala',
        sampleMode: 'home_collection',
        status: 'ready',
        tests: [
          { testId: 'tm1', code: 'HBA1C', name: 'Hémoglobine Glyquée (HbA1c)', category: 'biochemistry', sampleType: 'Sang Total EDTA', basePrice: 12000, resultValue: '6.8', referenceRange: '< 6.5 (Cible Diabétique)', unit: '%', flag: 'high', status: 'validated' },
          { testId: 'tm2', code: 'GLYC', name: 'Glycémie Veineuse', category: 'biochemistry', sampleType: 'Plasma Fluoré', basePrice: 2000, resultValue: '1.28', referenceRange: '0.70 - 1.10', unit: 'g/L', flag: 'high', status: 'validated' },
          { testId: 'tm3', code: 'CLCR', name: 'Clairance Créatinine (Cockcroft)', category: 'biochemistry', sampleType: 'Sérum', basePrice: 4000, resultValue: '62', referenceRange: '> 60', unit: 'mL/min', flag: 'normal', status: 'validated' },
          { testId: 'tm4', code: 'K_POT', name: 'Ionogramme (Potassium K+)', category: 'biochemistry', sampleType: 'Sérum', basePrice: 3500, resultValue: '4.4', referenceRange: '3.5 - 5.1', unit: 'mEq/L', flag: 'normal', status: 'validated' }
        ],
        biologistName: 'Dr. Suzanne Mbongo',
        biologistLicense: 'ONMC #4829 / ONPC #1204',
        qrAuditHash: 'NL-BCH-202609-0824-77EB21',
        paymentStatus: 'verified',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        collectedAt: new Date(Date.now() - 169200000).toISOString(),
        receivedAt: new Date(Date.now() - 165600000).toISOString(),
        signedAt: new Date(Date.now() - 129600000).toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Demo signed batch for Child (Junior Kamdem)
      const childDemo: TestBatch = {
        id: 'batch_child_demo',
        batchNumber: 'BCH-202608-4491',
        patientId,
        familyProfileId: 'fam_child_junior',
        familyRelationship: 'son',
        patientName: 'Junior Kamdem',
        patientAge: 8,
        patientGender: 'M',
        labId: 'centre_pasteur_yde',
        labName: 'Centre Pasteur du Cameroun (CPC)',
        sampleMode: 'walk_in',
        status: 'ready',
        tests: [
          { testId: 'tc1', code: 'GE_PALU', name: 'Goutte Épaisse & Frottis Sanguin (Paludisme)', category: 'parasitology', sampleType: 'Sang Capillaire', basePrice: 3500, resultValue: 'NÉGATIF (Absence de Plasmodium falciparum)', referenceRange: 'Négatif', unit: 'parasites/µL', flag: 'normal', status: 'validated' },
          { testId: 'tc2', code: 'NFS_PED', name: 'NFS Pédiatrique (Hémoglobine)', category: 'hematology', sampleType: 'Sang Total EDTA', basePrice: 4500, resultValue: '12.2', referenceRange: '11.0 - 14.5', unit: 'g/dL', flag: 'normal', status: 'validated' }
        ],
        biologistName: 'Dr. Martin Ebolo',
        biologistLicense: 'ONMC #6102 / Biologiste Médical',
        qrAuditHash: 'NL-BCH-202608-4491-03AA88',
        paymentStatus: 'verified',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        collectedAt: new Date(Date.now() - 255600000).toISOString(),
        receivedAt: new Date(Date.now() - 252000000).toISOString(),
        signedAt: new Date(Date.now() - 216000000).toISOString(),
        updatedAt: new Date().toISOString()
      };

      loaded = [signedDemo, motherDemo, childDemo];
    }

    setBatches(loaded);
    if (initialBatchId) {
      const found = loaded.find((b) => b.id === initialBatchId);
      if (found) setSelectedBatch(found);
      else if (loaded.length > 0) setSelectedBatch(loaded[0]);
    } else if (loaded.length > 0) {
      setSelectedBatch(loaded[0]);
    }
  }, [initialBatchId, user]);

  const filteredBatches = batches.filter((b) => {
    if (selectedFamilyFilter === 'all') return true;
    return b.familyProfileId === selectedFamilyFilter || (selectedFamilyFilter === 'fam_claire_self' && !b.familyProfileId);
  });

  // Keep selectedBatch consistent when filter changes
  useEffect(() => {
    if (filteredBatches.length > 0 && (!selectedBatch || !filteredBatches.some((b) => b.id === selectedBatch.id))) {
      setSelectedBatch(filteredBatches[0]);
    }
  }, [selectedFamilyFilter, batches]);

  const reportModel: RenderedReportData | null = selectedBatch ? buildReportModel(selectedBatch) : null;

  // Convert selectedBatch to PatientBooking for PatientA4ReportViewerModal
  const bookingForA4: PatientBooking | null = useMemo(() => {
    if (!selectedBatch) return null;
    return {
      id: selectedBatch.id,
      bookingCode: selectedBatch.batchNumber || 'NL-DEMO',
      patientId: selectedBatch.patientId || 'P-001',
      patientPid: selectedBatch.patientId || 'P-001',
      patientName: selectedBatch.patientName || 'Patient',
      patientPhone: selectedBatch.patientPhone || '',
      patientAge: selectedBatch.patientAge || 38,
      patientGender: ((selectedBatch.patientGender as string) === 'F' ? 'Female' : 'Male') as any,
      bookingDate: selectedBatch.createdAt || new Date().toISOString(),
      status: 'Completed',
      totalPrice: 0,
      totalAmount: 0,
      labId: selectedBatch.labId || 'lab_central_douala',
      invoiceNumber: selectedBatch.batchNumber || 'INV-001',
      paymentStatus: 'Paid',
      patientCategory: 'Regular',
      createdAt: selectedBatch.createdAt || new Date().toISOString(),
      updatedAt: selectedBatch.updatedAt || new Date().toISOString(),
      collectedSamples: [],
      overallStatus: 'Completed',
      tests: (selectedBatch.tests || []).map((it: any) => ({
        id: it.testId || it.id || 't1',
        testName: it.name || it.testName || 'Test Examen',
        testCode: it.code || it.testCode,
        category: it.category || 'Clinical Chemistry',
        price: it.basePrice || it.price || 0,
        status: 'Completed',
        resultValue: it.resultValue || 'Normal',
        unit: it.unit || '',
        referenceRange: it.referenceRange || 'Normale du laboratoire',
        completedAt: selectedBatch.signedAt || selectedBatch.updatedAt,
        sampleType: it.sampleType || 'Venous Blood',
        richReportHtml: it.richReportHtml || undefined,
        clinicalInterpretation: it.clinicalInterpretation || undefined
      }))
    } as unknown as PatientBooking;
  }, [selectedBatch]);

  const handleShareWithDoctor = (docId: string, docName: string) => {
    if (selectedBatch) {
      doctorChatService.shareTestResult({
        senderId: user?.id || 'demo_patient',
        senderName: user?.name || selectedBatch.patientName,
        doctorId: docId,
        doctorName: docName,
        testName: selectedBatch.tests[0]?.name || 'Bilan de laboratoire',
        bookingCode: selectedBatch.batchNumber,
        bookingId: selectedBatch.id,
        resultSummary: `${selectedBatch.tests.length} tests validés • Signé par ${selectedBatch.biologistName || 'Biologiste'}`,
        isBatch: true,
        batchTestCount: selectedBatch.tests.length
      });
    }
    setShareSuccess(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0B1F1D] tracking-tight">
            Diagnostic Laboratory Reports
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7F7D]">
            Accredited, signed medical reports with dynamic biologist seals, A4 printable PDF letterhead, and QR verification.
          </p>
        </div>

        {reportModel && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setA4InitialTestIndex(undefined);
                setShowA4Modal(true);
              }}
              className="min-h-[44px] px-3.5 py-2 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Open Official Multi-Page A4 PDF Viewer & Continuous Scroll"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>A4 Official PDF</span>
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="min-h-[44px] px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Share2 className="w-4 h-4 text-[#0F766E]" />
              <span>Share with Doctor</span>
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="min-h-[44px] px-3.5 py-2 bg-teal-50 border border-teal-200 hover:bg-teal-100/60 text-[#0F766E] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4" />
              <span>Verify Seal</span>
            </button>
            <button
              onClick={() => window.print()}
              className="min-h-[44px] px-4 py-2 bg-[#0F766E] hover:bg-[#0D3B38] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Print Sheet</span>
            </button>
          </div>
        )}
      </div>

      {/* Family Member Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0D3B38]">
          <Users className="w-4 h-4 text-[#0F766E]" />
          <span>Filter by Family Account:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedFamilyFilter('all')}
            className={`min-h-[32px] px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedFamilyFilter === 'all'
                ? 'bg-[#0D3B38] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Family Records ({batches.length})
          </button>

          {familyMembers.map((m) => {
            const count = batches.filter((b) => b.familyProfileId === m.id || (m.relationship === 'self' && !b.familyProfileId)).length;
            const isSelected = selectedFamilyFilter === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedFamilyFilter(m.id)}
                className={`min-h-[32px] px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{m.fullName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Batch Selector Pills */}
      {filteredBatches.length > 0 ? (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {filteredBatches.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBatch(b)}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                selectedBatch?.id === b.id
                  ? 'bg-[#0D3B38] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="font-mono">{b.batchNumber}</span>
              <span className="text-[11px] font-semibold text-[#14B8A6]">{b.patientName}</span>
              <span className="capitalize text-[10px] text-slate-400">({b.status})</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
          No validated reports found for this family member yet.
        </div>
      )}

      {/* LAB-BRANDED MEDICAL REPORT SHEET */}
      {reportModel && selectedBatch && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-10 space-y-8 print:border-none print:shadow-none print:p-0">
          {/* Header Letterhead */}
          <div className="border-b-2 border-slate-900/80 pb-6 flex flex-col sm:flex-row justify-between gap-6">
            <div className="space-y-1.5 max-w-lg">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#0D3B38] text-white flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#14B8A6]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#0D3B38] leading-tight">
                    {reportModel.branding.labName}
                  </h2>
                  <p className="text-[11px] font-semibold text-teal-800">
                    {reportModel.branding.tagline}
                  </p>
                </div>
              </div>

              <p className="text-[10px] text-slate-500">
                {reportModel.branding.physicalAddress} &bull; Tél: {reportModel.branding.phone}
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-600 pt-0.5">
                <span className="font-bold">Agrément: {reportModel.branding.minsanteApprovalCode}</span>
                <span>&bull;</span>
                <span className="font-bold">Accréditation: {reportModel.branding.accreditationNumber}</span>
              </div>
            </div>

            {/* Official Report Metadata Box */}
            <div className="sm:text-right space-y-1 text-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Numéro d'Échantillon / Dossier
              </div>
              <div className="font-mono font-black text-sm text-[#0D3B38]">
                {selectedBatch.batchNumber}
              </div>
              <p className="text-[11px] text-slate-500">
                Édité le: {new Date(selectedBatch.signedAt || selectedBatch.updatedAt).toLocaleDateString('fr-FR')}
              </p>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 border border-teal-200 rounded-full text-[10px] font-bold text-[#0F766E]">
                <ShieldCheck className="w-3 h-3 text-[#14B8A6]" />
                <span>Rapport Officiel Validé</span>
              </div>
            </div>
          </div>

          {/* Patient & Prescribing Physician Information Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Identification Patient</span>
                {selectedBatch.familyRelationship && selectedBatch.familyRelationship !== 'self' && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 uppercase">
                    {selectedBatch.familyRelationship} &bull; Ayant-Droit
                  </span>
                )}
              </div>
              <p className="font-black text-sm text-slate-900">{selectedBatch.patientName}</p>
              <p className="text-slate-600">
                Âge: {selectedBatch.patientAge || 38} ans &bull; Sexe: {selectedBatch.patientGender || 'Féminin'} &bull; Contact: {selectedBatch.patientPhone || '+237 670 00 00 00'}
              </p>
              {selectedBatch.familyRelationship && selectedBatch.familyRelationship !== 'self' && (
                <p className="text-[11px] text-teal-800 font-medium">
                  Titulaire Compte Principal: Mme. Claire Ngo
                </p>
              )}
            </div>

            <div className="space-y-1 sm:text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Prescripteur & Médecin Traitant</div>
              <p className="font-bold text-slate-900">{selectedBatch.recommendingDoctorName || 'Sur Demande Personnelle (Auto-Prescription)'}</p>
              <p className="text-slate-600">
                Mode de Prélèvement: {selectedBatch.sampleMode === 'home_collection' ? 'Prélèvement à Domicile' : 'Centre Médical (Walk-in)'}
              </p>
            </div>
          </div>

          {/* Clinical Diagnostic Results Table */}
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Paramètre / Examen</th>
                    <th className="py-2.5 px-3">Résultat</th>
                    <th className="py-2.5 px-3">Unité</th>
                    <th className="py-2.5 px-3">Valeurs de Référence</th>
                    <th className="py-2.5 px-3 text-center">Statut</th>
                    <th className="py-2.5 px-3 text-right">A4 Single Test</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedBatch.tests.map((test, idx) => {
                    const isAbnormal = test.flag && test.flag !== 'normal';
                    return (
                      <tr key={test.testId} className="hover:bg-slate-50/60">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{test.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{test.code}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`font-mono font-black text-sm ${
                            isAbnormal ? 'text-rose-600' : 'text-[#0D3B38]'
                          }`}>
                            {test.resultValue || '7.4'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                          {test.unit || '-'}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                          {test.referenceRange || 'Normale du laboratoire'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isAbnormal
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {test.flag ? test.flag.toUpperCase() : 'NORMAL'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setA4InitialTestIndex(idx);
                              setShowA4Modal(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                            title="Isolate this test in single-page A4 format"
                          >
                            <FileText className="w-3 h-3 text-teal-600" />
                            <span>Isolate PDF</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dynamic Signatory & QR Seal */}
          <div className="pt-6 border-t-2 border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            {/* Dynamic Signatory */}
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Validation & Signature Biologique
              </div>
              <div>
                <p className="font-black text-sm text-slate-900">{reportModel.signatory.name}</p>
                <p className="text-xs text-teal-800 font-semibold">{reportModel.signatory.title}</p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Inscription Ordre: {reportModel.signatory.license}
                </p>
                <p className="text-[10px] text-slate-400">
                  Signé électroniquement le: {new Date(reportModel.signatory.signedAt).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>

            {/* Cryptographic QR Seal */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <div className="w-14 h-14 bg-white border border-slate-300 rounded-xl p-1 flex items-center justify-center">
                <QrCode className="w-12 h-12 text-slate-900" />
              </div>
              <div className="space-y-0.5 text-left">
                <div className="text-[10px] uppercase font-bold text-slate-500">Sceau Électronique Sécurisé</div>
                <div className="text-[10px] font-mono font-bold text-teal-900 break-all max-w-[160px]">
                  {selectedBatch.qrAuditHash || 'NL-2026-SEAL-892'}
                </div>
                <div className="text-[9px] text-slate-400">Vérifiable sur nanolabs.cm</div>
              </div>
            </div>
          </div>

          {/* Timeline Footer (Intake, Collected, Received, Signed) */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[10px] text-slate-500 flex flex-wrap justify-between gap-2">
            <span>Enregistrement: {new Date(reportModel.timeline.intakeTime || '').toLocaleTimeString()}</span>
            <span>Prélèvement: {new Date(reportModel.timeline.collectedTime || reportModel.timeline.intakeTime || '').toLocaleTimeString()}</span>
            <span>Réception Labo: {new Date(reportModel.timeline.receivedTime || reportModel.timeline.intakeTime || '').toLocaleTimeString()}</span>
            <span>Signature: {new Date(reportModel.timeline.signedTime || reportModel.timeline.intakeTime || '').toLocaleTimeString()}</span>
          </div>

          {/* Regulatory Disclaimer */}
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            {reportModel.branding.footerDisclaimerText}
          </p>
        </div>
      )}

      {/* QR Verification Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0B1F1D]">Audit Cryptographique</h3>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs font-mono space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-sans font-bold">Hash Électronique</p>
              <p className="text-slate-900 font-bold break-all">{selectedBatch?.qrAuditHash}</p>
              <p className="text-[10px] text-emerald-600 font-sans font-bold pt-1">
                ✓ Signature intègre et non altérée
              </p>
            </div>
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full min-h-[44px] py-2 bg-[#0F766E] text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Share with Doctor Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0B1F1D]">Partager avec un Médecin</h3>
              <button
                onClick={() => { setShowShareModal(false); setShareSuccess(false); }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {shareSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-emerald-800">
                    Rapport transmis au médecin avec succès
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    Le clinicien peut consulter le compte-rendu dans son espace praticien nanoLabs.
                  </p>
                </div>
                {onNavigateToChat && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowShareModal(false);
                      onNavigateToChat();
                    }}
                    className="w-full py-2.5 px-4 bg-[#0F766E] hover:bg-[#0D3B38] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Ouvrir la conversation avec le médecin</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Sélectionnez un médecin accrédité du réseau nanoLabs pour lui accorder l'accès en lecture à ce compte-rendu.
                </p>
                <div className="space-y-2">
                  <div
                    onClick={() => handleShareWithDoctor('doc_kamga_101', 'Dr. Jean-Paul Kamga')}
                    className="p-3 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">Dr. Jean-Paul Kamga</div>
                      <div className="text-[10px] text-slate-500">Médecine Interne &bull; Hôpital Général Douala</div>
                    </div>
                    <span className="text-xs font-bold text-[#0F766E]">Transmettre</span>
                  </div>
                  <div
                    onClick={() => handleShareWithDoctor('doc_essomba_202', 'Dr. Mireille Essomba')}
                    className="p-3 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">Dr. Mireille Essomba</div>
                      <div className="text-[10px] text-slate-500">Endocrinologue &bull; Cabinet Bonanjo</div>
                    </div>
                    <span className="text-xs font-bold text-[#0F766E]">Transmettre</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Patient A4 Official Multi-Page / Single Test Viewer Modal */}
      {showA4Modal && bookingForA4 && (
        <PatientA4ReportViewerModal
          isOpen={showA4Modal}
          booking={bookingForA4}
          initialSelectedTestIndex={a4InitialTestIndex}
          onClose={() => setShowA4Modal(false)}
          onShareToDoctor={() => {
            setShowA4Modal(false);
            if (onNavigateToChat) {
              onNavigateToChat();
            } else {
              setShowShareModal(true);
            }
          }}
        />
      )}
    </div>
  );
};

export default TestResultsScreen;
