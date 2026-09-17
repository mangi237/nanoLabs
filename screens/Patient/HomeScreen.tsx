import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  PlusCircle, 
  Camera, 
  Stethoscope, 
  FileText, 
  ChevronRight, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  Users,
  UserPlus,
  Heart
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { TestBatch, BatchStatus } from '../../types';
import { getBatchesForPatient } from '../../services/batchService';
import { formatXAF } from '../../shared/money';
import { useFamilyProfile } from '../../context/familyProfileContext';
import { FamilyMemberModal } from '../../components/patient/FamilyMemberModal';

interface PatientHomeScreenProps {
  onNavigateBook: () => void;
  onNavigateScan: () => void;
  onNavigateConsult?: () => void;
  onNavigateBatch?: (batchId: string) => void;
  onNavigateResults?: (batchId?: string) => void;
  onNavigateBooklet?: () => void;
  onOpenBatch?: (batchId: string) => void;
}

export const HomeScreen: React.FC<PatientHomeScreenProps> = ({
  onNavigateBook,
  onNavigateScan,
  onNavigateConsult,
  onNavigateBatch,
  onNavigateResults,
  onNavigateBooklet,
  onOpenBatch
}) => {
  const { user } = useAuth();
  const { 
    familyMembers, 
    activeProfile, 
    switchActiveProfile, 
    createFamilyMember 
  } = useFamilyProfile();

  const [batches, setBatches] = useState<TestBatch[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const patientId = user?.id || 'demo_patient';
    let loaded = getBatchesForPatient(patientId);

    // If no batches yet, provide realistic active & past batches
    if (loaded.length === 0) {
      const demoBatch: TestBatch = {
        id: 'batch_demo_live',
        batchNumber: 'BCH-202609-8412',
        patientId,
        patientName: user?.name || 'Mme. Claire Ngo',
        labId: 'lab_central_douala',
        labName: 'Laboratoire Central Akwa - Douala',
        sampleMode: 'home_collection',
        status: 'in_transit',
        tests: [
          { testId: 't1', code: 'NFS', name: 'Numération Formule Sanguine (NFS)', category: 'hematology', sampleType: 'Whole Blood (EDTA)', basePrice: 4500, status: 'pending' },
          { testId: 't2', code: 'GLYC', name: 'Glycémie à Jeûn', category: 'biochemistry', sampleType: 'Fluoride Plasma', basePrice: 2000, status: 'pending' },
          { testId: 't3', code: 'LIPID', name: 'Bilan Lipidique Complet', category: 'biochemistry', sampleType: 'Serum', basePrice: 8500, status: 'pending' }
        ],
        sampleTubeBarcode: 'TUBE-BCH-202609-8412',
        paymentStatus: 'verified',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date().toISOString()
      };
      loaded = [demoBatch];
    }
    setBatches(loaded);
  }, [user]);

  const activeBatch = batches.find((b) => b.status !== 'ready');
  const pastBatches = batches.filter((b) => b.status === 'ready');

  const getStepNumber = (status: BatchStatus): number => {
    switch (status) {
      case 'intake': return 1;
      case 'collected': return 2;
      case 'in_transit': return 3;
      case 'received':
      case 'analysis':
      case 'validation': return 4;
      case 'signed':
      case 'ready': return 5;
      default: return 1;
    }
  };

  const currentStep = activeBatch ? getStepNumber(activeBatch.status) : 0;

  const steps = [
    { num: 1, label: 'Intake' },
    { num: 2, label: 'Collected' },
    { num: 3, label: 'In Transit' },
    { num: 4, label: 'Analysis' },
    { num: 5, label: 'Ready' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-[#0D3B38] via-[#0F766E] to-[#14B8A6] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-semibold text-teal-100">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
            <span>CEMAC Health Diagnostic Hub</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
            Hello, {user?.name?.split(' ')[0] || 'Patient'}
          </h1>
          <p className="text-xs sm:text-sm text-teal-50/90 leading-relaxed">
            Welcome to your unified clinical portal. Order lab tests with home phlebotomy dispatch, track real-time transit, and receive accredited lab reports.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateBook}
              className="min-h-[44px] px-5 py-2.5 bg-white text-[#0D3B38] hover:bg-teal-50 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-[#0F766E]" />
              <span>Book Diagnostic Test</span>
            </button>
            <button
              onClick={onNavigateScan}
              className="min-h-[44px] px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/25 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
            >
              <Camera className="w-4 h-4 text-teal-200" />
              <span>Scan Prescription</span>
            </button>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
      </div>

      {/* FAMILY & DEPENDENT ACCOUNTS SECTION */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-[#0B1F1D]">
                Family Health Accounts & Dependents
              </h2>
            </div>
            <p className="text-xs text-[#6B7F7D] mt-0.5">
              One account managing independent medical records for your mother, children, and spouse.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="min-h-[44px] px-4 py-2 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] hover:from-[#0D3B38] hover:to-[#0F766E] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Family Member</span>
          </button>
        </div>

        {/* Member cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {familyMembers.map((member) => {
            const isActive = member.id === activeProfile?.id;
            const isSelf = member.relationship === 'self';
            return (
              <div
                key={member.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  isActive
                    ? 'border-[#0F766E] bg-teal-50/60 shadow-xs ring-2 ring-[#0F766E]/20'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        member.avatarColor === 'indigo'
                          ? 'bg-indigo-600 text-white'
                          : member.avatarColor === 'amber'
                          ? 'bg-amber-600 text-white'
                          : 'bg-[#0F766E] text-white'
                      }`}>
                        {member.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0B1F1D] truncate" title={member.fullName}>
                          {member.fullName}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {member.relationshipLabel} &bull; {member.age} yrs
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Medical specifics */}
                  <div className="space-y-1 text-[10px]">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Blood Group:</span>
                      <span className="font-mono font-bold text-slate-800">{member.bloodGroup || 'N/A'}</span>
                    </div>

                    {member.chronicConditions && member.chronicConditions.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {member.chronicConditions.map((c, i) => (
                          <span key={i} className="text-[9px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded-sm truncate max-w-full">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}

                    {member.allergies && member.allergies.length > 0 && (
                      <div className="text-[10px] text-rose-700 font-medium truncate">
                        Allergies: {member.allergies.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => switchActiveProfile(member.id)}
                    className={`flex-1 min-h-[36px] px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer text-center ${
                      isActive
                        ? 'bg-[#0D3B38] text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isActive ? 'Active Record' : 'Switch to this Record'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      switchActiveProfile(member.id);
                      onNavigateBook();
                    }}
                    title={`Book test for ${member.fullName}`}
                    className="min-h-[36px] px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-[#0F766E] text-[11px] font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Book Test
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Batch Progress Card */}
      {activeBatch && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase bg-teal-50 text-[#0F766E] border border-teal-200">
                  {activeBatch.batchNumber}
                </span>
                <span className="text-xs font-semibold text-slate-500 capitalize">
                  &bull; {activeBatch.sampleMode.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-base font-bold text-[#0B1F1D]">
                {activeBatch.labName}
              </h2>
            </div>

            <button
              onClick={() => onNavigateBatch?.(activeBatch.id)}
              className="min-h-[44px] px-4 py-2 text-xs font-bold text-[#0F766E] hover:text-[#0D3B38] bg-teal-50 hover:bg-teal-100/60 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>View Tracking & Batch</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Stepper */}
          <div className="py-2">
            <div className="grid grid-cols-5 gap-2 relative">
              {steps.map((step) => {
                const isPassed = currentStep >= step.num;
                const isCurrent = currentStep === step.num;
                return (
                  <div key={step.num} className="flex flex-col items-center text-center space-y-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-[#0F766E] text-white ring-4 ring-teal-100 shadow-xs'
                          : isPassed
                          ? 'bg-[#14B8A6] text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {step.num}
                    </div>
                    <span
                      className={`text-[11px] leading-tight ${
                        isCurrent
                          ? 'font-bold text-[#0D3B38]'
                          : isPassed
                          ? 'font-medium text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Status Callout */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              {activeBatch.sampleMode === 'home_collection' ? (
                <Truck className="w-4 h-4 text-[#0F766E]" />
              ) : (
                <Building2 className="w-4 h-4 text-[#0F766E]" />
              )}
              <span className="font-semibold text-slate-700">
                {activeBatch.status === 'in_transit'
                  ? 'Phlebotomist en route with insulated cold-box'
                  : activeBatch.status === 'analysis'
                  ? 'Specimen loaded on certified automated analyzers'
                  : activeBatch.status === 'collected'
                  ? 'Sample tube sealed and barcoded'
                  : 'Order registered at laboratory intake desk'}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-teal-800 border border-slate-200 shrink-0">
              {activeBatch.paymentStatus === 'verified' ? 'Payment Verified' : 'Co-Pay Pending'}
            </span>
          </div>
        </div>
      )}

      {/* Quick Action Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Action 1: Book Test */}
        <div
          onClick={onNavigateBook}
          className="p-5 bg-white rounded-3xl border border-slate-200/80 hover:border-teal-300 transition-all cursor-pointer group shadow-xs space-y-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center group-hover:scale-105 transition-transform">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0B1F1D] group-hover:text-[#0F766E] transition-colors">
              Book Diagnostic Tests
            </h3>
            <p className="text-xs text-[#6B7F7D] mt-1">
              Select tests across hematology, biochemistry & bacteriology. Walk-in or home sampling.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-[#0F766E] pt-1">
            <span>Browse Catalog</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Action 2: AI Prescription Scanner */}
        <div
          onClick={onNavigateScan}
          className="p-5 bg-white rounded-3xl border border-slate-200/80 hover:border-teal-300 transition-all cursor-pointer group shadow-xs space-y-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0B1F1D] group-hover:text-[#0F766E] transition-colors">
              AI Prescription Scanner
            </h3>
            <p className="text-xs text-[#6B7F7D] mt-1">
              Photograph doctor handwriting. Our OCR algorithm matches tests automatically with confidence scores.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-[#0F766E] pt-1">
            <span>Scan Ordonnance</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Action 3: Doctor Consultation */}
        <div
          onClick={onNavigateConsult}
          className="p-5 bg-white rounded-3xl border border-slate-200/80 hover:border-teal-300 transition-all cursor-pointer group shadow-xs space-y-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0B1F1D] group-hover:text-[#0F766E] transition-colors">
              Consult a Doctor
            </h3>
            <p className="text-xs text-[#6B7F7D] mt-1">
              Connect with certified physicians for telemedicine video, clinic bookings, or Waspito integration.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-[#0F766E] pt-1">
            <span>Find Physician</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Digital Health Booklet Teaser */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
              Lifelong Record
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
              Biomarker Tracking
            </span>
          </div>
          <h3 className="text-base font-bold text-[#0B1F1D]">
            Unified Digital Health Booklet
          </h3>
          <p className="text-xs text-[#6B7F7D] max-w-xl">
            All historical blood, urine, and pathology results consolidated in one longitudinal chart. Monitor glycemic trends, lipid panels, and hemograms across years.
          </p>
        </div>

        <button
          onClick={onNavigateBooklet}
          className="min-h-[44px] px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shrink-0 shadow-xs"
        >
          <FileText className="w-4 h-4" />
          <span>Open Health Booklet</span>
        </button>
      </div>

      {/* Family Member Modal */}
      <FamilyMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={(data) => {
          const created = createFamilyMember(data);
          switchActiveProfile(created.id);
          setIsAddModalOpen(false);
        }}
        primaryUserName={user?.name || 'Mme. Claire Ngo'}
        primaryUserInsurance="Ascoma Assurances"
      />
    </div>
  );
};

export default HomeScreen;
