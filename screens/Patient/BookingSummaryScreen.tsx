import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  MapPin,
  Shield,
  Stethoscope,
  Phone,
  Info,
  Send,
  Gift,
  Tag,
  Loader2,
  Check,
  Clock, 
  UserPlus,
  ShieldCheck,
  Lock,
  AlertCircle
} from 'lucide-react';
import { PartnerLabItem } from './ChooseLabScreen';
import { formatXAF } from '../../shared/money';
import { useAuth } from '../../context/authContext';
import { useFamilyProfile } from '../../context/familyProfileContext';
import { limsService } from '../../services/limsService';
import {
  doctorPatientFirestoreService,
  formatPatientAlias,
  DoctorPatientConnectionRecord,
} from '../../services/doctorPatientFirestoreService';
import { DoctorOption } from '../../components/common/DoctorCardSelect';
import { canLabUseFeature } from '../../utils/labPackages';
import { buildLabWhatsAppOrderUrl } from '../../utils/whatsappGateway';

interface BookingSummaryScreenProps {
  lab: PartnerLabItem;
  tests: { name: string; price: number }[];
  collectionMethod: 'home' | 'lab';
  collectionFee: number;
  labTestTariff: number;
  pickupAddress?: string;
  pickupCoords?: { lat: number; lng: number };
  pickupDistanceKm?: number;
  onBack: () => void;
  onBookingRequested: (bookingData: any) => void;
}

export const BookingSummaryScreen: React.FC<BookingSummaryScreenProps> = ({
  lab,
  tests,
  collectionMethod,
  collectionFee,
  labTestTariff,
  pickupAddress: initialPickupAddress,
  pickupCoords,
  pickupDistanceKm,
  onBack,
  onBookingRequested
}) => {
  const { user } = useAuth();
  const { activeProfile, isDependentActive } = useFamilyProfile();

  // Check real configured insurance on profile/user (never force mock insurance if unconfigured)
  const configuredInsuranceProvider =
    activeProfile?.insuranceProvider || (user as any)?.insuranceProvider || '';
  const configuredPolicyNumber =
    activeProfile?.insurancePolicyNumber || (user as any)?.insurancePolicyNumber || '';
  const hasConfiguredInsurance = Boolean(configuredInsuranceProvider && configuredPolicyNumber);

  const labSupportsInsurance = canLabUseFeature(lab, 'insurance');
  const [useInsurance, setUseInsurance] = useState<boolean>(
    hasConfiguredInsurance && labSupportsInsurance
  );
  const [insuranceProviderInput, setInsuranceProviderInput] = useState<string>(
    configuredInsuranceProvider || 'ASCOMA Cameroun'
  );
  const [policyNumberInput, setPolicyNumberInput] = useState<string>(configuredPolicyNumber);
  const [pickupAddress, setPickupAddress] = useState<string>(initialPickupAddress || '');
  const [submitting, setSubmitting] = useState(false);
  const [submittingStep, setSubmittingStep] = useState<string>('');
  const [bookingError, setBookingError] = useState<string>('');

  // Auto-populate saved insurance whenever useInsurance is toggled or profile changes
  useEffect(() => {
    if (useInsurance) {
      if (configuredInsuranceProvider) {
        setInsuranceProviderInput(configuredInsuranceProvider);
      }
      if (configuredPolicyNumber) {
        setPolicyNumberInput(configuredPolicyNumber);
      }
    }
  }, [useInsurance, configuredInsuranceProvider, configuredPolicyNumber]);

  // Real platform doctors directory from Firestore (zero mock doctors, zero localStorage)
  const [platformDoctors, setPlatformDoctors] = useState<DoctorOption[]>([]);
  const [referringDoctorType, setReferringDoctorType] = useState<'accredited' | 'self' | 'other'>('self');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [manualDoctorName, setManualDoctorName] = useState<string>('');
  const [manualHospitalName, setManualHospitalName] = useState<string>('');
  const [prescriberPromoCode, setPrescriberPromoCode] = useState<string>(() => {
    return (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('nanolabs_prescriber_code') : '') || '';
  });

  // Doctor Connections for patient permission guard
  const [patientConnections, setPatientConnections] = useState<DoctorPatientConnectionRecord[]>([]);
  const [connectingDoctorId, setConnectingDoctorId] = useState<string | null>(null);

  useEffect(() => {
    const pId = isDependentActive ? activeProfile.id : user?.patientId || user?.id || '';
    const unsub = doctorPatientFirestoreService.subscribePatientConnections(
      pId,
      user?.patientId,
      (conns) => {
        setPatientConnections(conns || []);
      }
    );
    return () => unsub();
  }, [user?.id, user?.patientId, activeProfile.id, isDependentActive]);

  const acceptedDoctorIds = new Set(
    patientConnections.filter((c) => c.status === 'accepted').map((c) => c.doctorId)
  );
  const pendingDoctorIds = new Set(
    patientConnections.filter((c) => c.status === 'pending').map((c) => c.doctorId)
  );

  useEffect(() => {
    let mounted = true;
    const loadDoctorsAndScannedPrescription = async () => {
      try {
        const scannedDoc = sessionStorage.getItem('nanolabs_scanned_doctor') || '';
        const scannedHosp = sessionStorage.getItem('nanolabs_scanned_hospital') || '';
        const rxDocId = sessionStorage.getItem('nanolabs_rx_doctor_id') || '';

        const liveDocs = await doctorPatientFirestoreService.listDoctors('');
        const mapped: DoctorOption[] = (liveDocs || []).map((d, i) => ({
          id: d.id || `doc-${i}`,
          name: d.name?.startsWith('Dr') ? d.name : `Dr. ${d.name}`,
          specialty: d.specialty || 'General Medicine',
          hospital: d.hospital || 'Accredited Medical Center',
          phone: d.phone,
          verified: true
        }));

        if (mounted) {
          setPlatformDoctors(mapped);
          if (rxDocId && mapped.some((m) => m.id === rxDocId)) {
            setReferringDoctorType('accredited');
            setSelectedDoctorId(rxDocId);
          } else if (scannedDoc) {
            setReferringDoctorType('other');
            setManualDoctorName(scannedDoc);
            if (scannedHosp) setManualHospitalName(scannedHosp);
          }
        }
      } catch (e) {
        console.warn('Could not load platform doctors:', e);
      }
    };
    loadDoctorsAndScannedPrescription();
    return () => {
      mounted = false;
    };
  }, []);

  const handleConnectDoctor = async (doc: DoctorOption, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setConnectingDoctorId(doc.id);
      const resolvedPatientName = isDependentActive
        ? activeProfile.fullName
        : user?.name || activeProfile.fullName || 'Patient';
      const resolvedAlias = formatPatientAlias(
        (user as any)?.alias || activeProfile?.nickname,
        resolvedPatientName
      );
      const pId = isDependentActive ? activeProfile.id : user?.patientId || user?.id || `PAT-${Date.now()}`;

      await doctorPatientFirestoreService.requestConnection({
        doctorId: doc.id,
        doctorName: doc.name,
        doctorSpecialty: doc.specialty,
        doctorHospital: doc.hospital,
        doctorPhone: doc.phone,
        patientId: pId,
        patientPid: pId,
        patientName: resolvedPatientName,
        patientAlias: resolvedAlias,
        patientPhone: activeProfile.phone || user?.phone || '',
        patientCity: activeProfile.city || (user as any)?.city || 'Douala',
        requestedBy: 'patient',
        note: `Demande de suivi médical et partage de bilan d'analyses de ${resolvedPatientName} (@${resolvedAlias})`
      });
    } catch (err) {
      console.warn('Could not send connection request:', err);
    } finally {
      setConnectingDoctorId(null);
    }
  };

  const coveragePercent = 80;
  const platformFeePercent = 5;
  const platformFeeAmount = Math.round(labTestTariff * (platformFeePercent / 100));
  const homeFee = collectionMethod === 'home' ? collectionFee : 0;
  const grossEstimate = labTestTariff + homeFee;
  const insuranceCovered = useInsurance && policyNumberInput.trim()
    ? Math.round(labTestTariff * (coveragePercent / 100))
    : 0;
  const estimatedPatientShare = Math.max(0, grossEstimate - insuranceCovered);

  const selectedPlatformDoc = platformDoctors.find((d) => d.id === selectedDoctorId);

  const handleRequestBooking = async () => {
    try {
      setBookingError('');
      if (!lab?.id) {
        setBookingError('Please select a registered laboratory before sending your test request.');
        return;
      }

      // DOCTOR CONNECTION GUARD: Verify patient has an accepted mutual connection before sending tests to accredited physician
      if (referringDoctorType === 'accredited') {
        if (!selectedDoctorId) {
          setBookingError('Please select a physician from the registered doctors list, or choose "Self-Referred".');
          return;
        }
        if (!acceptedDoctorIds.has(selectedDoctorId)) {
          setBookingError('Permission denied: You must have an accepted mutual connection with an accredited physician before you can refer lab test results to them. Please click "Follow / Connect" and wait for the doctor to accept, or switch to "Self-Referred".');
          return;
        }
      }

      setSubmitting(true);
      setSubmittingStep('Génération du dossier médical numérique...');

      const uniqueAccountId = user?.id || user?.patientId || `PAT-${Date.now()}`;
      const uniquePid = isDependentActive
        ? activeProfile.id
        : user?.patientId || user?.id || uniqueAccountId;
      const resolvedPatientName = isDependentActive
        ? activeProfile.fullName
        : user?.name || activeProfile.fullName || 'Patient';
      const resolvedAlias = formatPatientAlias(
        (user as any)?.alias || activeProfile?.nickname,
        resolvedPatientName
      );

      const resolvedReferringDoc =
        referringDoctorType === 'accredited'
          ? selectedPlatformDoc?.name || undefined
          : referringDoctorType === 'other'
            ? manualDoctorName.trim() || undefined
            : 'Self-Referred';
      const resolvedHospital =
        referringDoctorType === 'accredited'
          ? selectedPlatformDoc?.hospital || undefined
          : referringDoctorType === 'other'
            ? manualHospitalName.trim() || undefined
            : undefined;

      const insuranceActive = Boolean(useInsurance && policyNumberInput.trim());
      const perTestBasePrice = Math.round(labTestTariff / Math.max(1, tests.length));

      // Gather complete clinical details
      const conditions = [
        ...(activeProfile.chronicConditions || []),
        ...(activeProfile.allergies ? activeProfile.allergies.map(a => `Allergie: ${a}`) : [])
      ].filter(Boolean);
      const clinicalNotes = conditions.length > 0 
        ? conditions.join(', ') 
        : (activeProfile.notes || 'Bilan de routine');

      const created = await limsService.createBooking({
        labId: lab.id,
        labName: lab.name,
        labAddress: lab.address,
        labPhone: lab.phone,
        labLogoUrl: lab.logoUrl,
        patientAccountId: uniqueAccountId,
        dependentProfileId: isDependentActive ? activeProfile.id : undefined,
        patientId: uniquePid,
        patientPid: uniquePid,
        patientName: resolvedPatientName,
        patientAlias: resolvedAlias,
        patientAge: activeProfile.age || (user as any)?.age || 30,
        patientGender: (activeProfile.gender as any) || (user as any)?.gender || 'Female',
        patientPhone: activeProfile.phone || user?.phone || '',
        patientEmail: user?.email || '',
        creatorName: resolvedPatientName,
        clinicalNotes,
        isOnlineBooking: true,
        registrationType: 'online',
        registeredBy: 'Online Patient App',
        receptionistValidated: false,
        referringDoctorId: referringDoctorType === 'accredited' ? selectedDoctorId : undefined,
        referringDoctor: resolvedReferringDoc,
        referringDoctorPromoCode: prescriberPromoCode.trim() ? prescriberPromoCode.trim().toUpperCase() : undefined,
        referralHospital: resolvedHospital,
        hasInsurance: insuranceActive,
        insuranceProvider: insuranceActive ? insuranceProviderInput.trim() : undefined,
        insurancePolicyNumber: insuranceActive ? policyNumberInput.trim() : undefined,
        insuranceCoveragePercent: insuranceActive ? coveragePercent : 0,
        coPayPercent: insuranceActive ? 100 - coveragePercent : 100,
        insuranceCoveredAmount: insuranceActive ? insuranceCovered : 0,
        insuranceClaimAmount: insuranceActive ? insuranceCovered : 0,
        patientCoPayAmount: insuranceActive ? estimatedPatientShare : grossEstimate,
        homeCollection: collectionMethod === 'home',
        pickupLocation: collectionMethod === 'home' ? pickupAddress || 'Pinned GPS Residence' : lab.address,
        userCoords: collectionMethod === 'home' ? pickupCoords : undefined,
        pickupDistanceMeters:
          collectionMethod === 'home' && pickupDistanceKm
            ? Math.round(pickupDistanceKm * 1000)
            : undefined,
        homePickupFee: homeFee,
        platformFeePercent,
        platformFeeAmount,
        selectedTests: tests.map((t, idx) => ({
          id: `t-${Date.now()}-${idx}`,
          name: t.name,
          testName: t.name,
          price: t.price || perTestBasePrice,
          basePrice: t.price || perTestBasePrice,
          totalPrice: t.price || perTestBasePrice
        }))
      });

      sessionStorage.removeItem('nanolabs_scanned_doctor');
      sessionStorage.removeItem('nanolabs_scanned_hospital');
      sessionStorage.removeItem('nanolabs_rx_doctor_id');

      // Automated WhatsApp Dispatch: The system automatically triggers the WhatsApp message with complete clinical payload
      if (lab.phone) {
        setSubmittingStep('Transmission automatisée WhatsApp au laboratoire...');
        try {
          const { waUrl } = buildLabWhatsAppOrderUrl({
            bookingCode: created.bookingCode || created.id,
            patientName: resolvedPatientName,
            patientPhone: activeProfile.phone || user?.phone,
            patientAlias: resolvedAlias,
            patientAge: activeProfile.age || (user as any)?.age || 30,
            patientGender: (activeProfile.gender as any) || (user as any)?.gender || 'Female',
            bloodGroup: activeProfile.bloodGroup || (user as any)?.bloodGroup || 'O+',
            clinicalDetails: clinicalNotes,
            tests: tests.map((t) => ({ name: t.name, price: t.price || perTestBasePrice })),
            totalAmount: labTestTariff,
            homeCollection: collectionMethod === 'home',
            pickupLocation: collectionMethod === 'home' ? pickupAddress : lab.address,
            userCoords: pickupCoords,
            labName: lab.name,
            labPhone: lab.phone,
            insuranceProvider: insuranceActive ? insuranceProviderInput.trim() : undefined,
            insurancePolicyNumber: insuranceActive ? policyNumberInput.trim() : undefined,
            insuranceCoveragePercent: insuranceActive ? coveragePercent : undefined,
            patientCoPayPercent: insuranceActive ? (100 - coveragePercent) : 100,
            referringDoctor: resolvedReferringDoc,
            prescriberPromoCode: prescriberPromoCode.trim() ? prescriberPromoCode.trim().toUpperCase() : undefined,
          });

          // Proactively open automated WhatsApp message window
          window.open(waUrl, '_blank', 'noopener,noreferrer');
        } catch (waErr) {
          console.warn('Automated WhatsApp dispatch warning:', waErr);
        }
      }

      setSubmittingStep('Demande transmise avec succès !');
      setTimeout(() => {
        onBookingRequested(created);
      }, 700);
    } catch (err: any) {
      console.error('Failed to submit online test request:', err);
      setBookingError(
        err?.message || 'Could not submit test request. Please try again or choose another laboratory.'
      );
    } finally {
      setSubmitting(false);
    }
  };

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
            Review & Send Test Request
          </h1>
          <p className="text-[11px] text-slate-500">
            Patient: <strong className="text-slate-800">{activeProfile.fullName}</strong> ({activeProfile.relationshipLabel}) &middot; No pre-payment required now
          </p>
        </div>
      </div>

      {/* Selected Performing Laboratory + Direct Inquiry Phone */}
      <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center font-bold shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400">Selected Performing Laboratory</span>
            <h3 className="text-base font-black text-slate-900">{lab.name}</h3>
            <span className="text-xs text-slate-500">
              {lab.address} &middot; TAT: {lab.turnaroundTime}
            </span>
          </div>
        </div>

        {lab.phone && (
          <a
            href={`tel:${lab.phone.replace(/\s+/g, '')}`}
            className="px-3.5 py-2 bg-[#E0F2F1] hover:bg-[#B2DFDB] text-[#006978] rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 self-start sm:self-center"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="font-mono">{lab.phone}</span>
          </a>
        )}
      </div>

      {/* Insurance Toggle & Details (Gated by Laboratory Package) */}
      <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-[#006978]" />
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">Apply Health Insurance (Tiers-Payant)</h4>
              <p className="text-[11px] text-slate-500">
                {labSupportsInsurance
                  ? `Lab Cashier sees your insurance details and automatically splits your invoice (${coveragePercent}% insurer / ${100 - coveragePercent}% patient)`
                  : `${lab.name} accepts direct Mobile Money / Cash billing only on its current subscription package.`}
              </p>
            </div>
          </div>

          {labSupportsInsurance ? (
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={useInsurance}
                onChange={(e) => setUseInsurance(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006978]"></div>
            </label>
          ) : (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 shrink-0">
              Direct Pay Only
            </span>
          )}
        </div>

        {labSupportsInsurance && useInsurance && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Insurance Provider (Caisse):</label>
              <input
                type="text"
                value={insuranceProviderInput}
                onChange={(e) => setInsuranceProviderInput(e.target.value)}
                placeholder="e.g. ASCOMA, Activa, AXA, Allianz"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Policy / Matricule Number:</label>
              <input
                type="text"
                value={policyNumberInput}
                onChange={(e) => setPolicyNumberInput(e.target.value)}
                placeholder="Enter policy matricule (required for split)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
              />
            </div>
          </div>
        )}
      </div>

      {/* Referring Physician Selection (Zero Mock Doctors) */}
      <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <Stethoscope className="w-4 h-4 text-[#006978]" />
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">
              Referring / Prescribing Physician (Optional)
            </h4>
            <p className="text-[11px] text-slate-500">
              Select a registered platform physician or enter an external doctor's name
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'self', label: 'Self-Referred' },
            { key: 'accredited', label: `Platform Doctor (${platformDoctors.length})` },
            { key: 'other', label: 'External Doctor' }
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setReferringDoctorType(opt.key as any)}
              className={`py-2 px-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                referringDoctorType === opt.key
                  ? 'border-[#006978] bg-[#E0F2F1] text-[#006978]'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {referringDoctorType === 'accredited' && (
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700">
                Registered Platform Physicians ({platformDoctors.length})
              </label>
              <span className="text-[10px] text-slate-500 font-medium">
                Mutual connection required to send results
              </span>
            </div>

            {platformDoctors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {platformDoctors.map((doc) => {
                  const isConnected = acceptedDoctorIds.has(doc.id);
                  const isPending = pendingDoctorIds.has(doc.id);
                  const isSelected = selectedDoctorId === doc.id;
                  const isConnecting = connectingDoctorId === doc.id;

                  return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        if (isConnected) {
                          setSelectedDoctorId(doc.id);
                          setBookingError('');
                        }
                      }}
                      className={`p-3 rounded-2xl border transition-all relative flex flex-col justify-between ${
                        isConnected
                          ? isSelected
                            ? 'border-[#006978] bg-[#E0F2F1]/80 ring-2 ring-[#006978]/30 shadow-xs cursor-pointer'
                            : 'border-slate-200 bg-white hover:border-[#006978]/60 hover:bg-slate-50 cursor-pointer'
                          : 'border-slate-200/80 bg-slate-50/60 opacity-95'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-[#006978] text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              <Stethoscope className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-black text-slate-900 leading-tight">
                                {doc.name}
                              </div>
                              <span className="text-[10px] font-semibold text-[#006978] block">
                                {doc.specialty}
                              </span>
                            </div>
                          </div>

                          {/* Selection indicator if connected */}
                          {isConnected && (
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center border shrink-0 ${
                              isSelected
                                ? 'bg-[#006978] border-[#006978] text-white'
                                : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{doc.hospital}</span>
                        </div>
                      </div>

                      {/* Connection status / Action Button */}
                      <div className="mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[10px]">
                        {isConnected ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Connected &middot; Ready</span>
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Connection Pending...</span>
                          </span>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-slate-400 text-[10px] flex items-center gap-0.5">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>Not Connected</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleConnectDoctor(doc, e)}
                              disabled={isConnecting}
                              className="px-2.5 py-1 rounded-lg bg-[#006978] hover:bg-[#005a66] text-white font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs text-[10px]"
                            >
                              {isConnecting ? (
                                <>
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                  <span>Sending...</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-2.5 h-2.5" />
                                  <span>Follow / Connect</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {isConnected && (
                          <span className="text-[10px] font-bold text-[#006978]">
                            {isSelected ? 'Selected' : 'Click to Select'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                No platform doctors registered yet. Switch to <strong>External Doctor</strong> to type your prescribing physician's name and hospital.
              </p>
            )}

            <div className="p-2.5 bg-sky-50/70 border border-sky-200 rounded-xl flex items-center gap-2 text-[11px] text-sky-900">
              <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>
                To protect medical privacy, tests can only be sent to physicians who have accepted a mutual clinical connection with your profile.
              </span>
            </div>
          </div>
        )}

        {referringDoctorType === 'other' && (
          <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Prescribing Doctor Name:</label>
              <input
                type="text"
                value={manualDoctorName}
                onChange={(e) => setManualDoctorName(e.target.value)}
                placeholder="e.g. Dr. Full Name"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Hospital / Clinic:</label>
              <input
                type="text"
                value={manualHospitalName}
                onChange={(e) => setManualHospitalName(e.target.value)}
                placeholder="Hospital or Clinic Name"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>
          </div>
        )}
      </div>

      {/* Doctor Prescriber & Clinic Referral Code */}
      <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">
                Code Prescripteur Médecin / Promo (Optionnel)
              </h4>
              <p className="text-[11px] text-slate-500">
                Votre médecin ou clinique vous a remis un code de recommandation ?
              </p>
            </div>
          </div>
          {prescriberPromoCode.trim() && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
              Code Appliqué
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={prescriberPromoCode}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setPrescriberPromoCode(val);
                if (typeof sessionStorage !== 'undefined') {
                  sessionStorage.setItem('nanolabs_prescriber_code', val);
                }
              }}
              placeholder="Ex: DOC-9482, CLN-DOUALA..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 focus:outline-hidden focus:border-[#006978]"
            />
          </div>
          {prescriberPromoCode && (
            <button
              type="button"
              onClick={() => {
                setPrescriberPromoCode('');
                if (typeof sessionStorage !== 'undefined') {
                  sessionStorage.removeItem('nanolabs_prescriber_code');
                }
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Effacer
            </button>
          )}
        </div>

        {prescriberPromoCode.trim() && (
          <p className="text-[11px] text-emerald-700 bg-emerald-50/70 border border-emerald-200/80 p-2 rounded-xl flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              Prescripteur lié (<strong>{prescriberPromoCode.trim().toUpperCase()}</strong>) : Gratification partenaire de 500 FCFA créditée au prescripteur dès validation par le laboratoire.
            </span>
          </p>
        )}
      </div>

      {/* Requested Tests & Preliminary Estimate */}
      <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-b border-slate-100 pb-2">
          <span>Requested Diagnostic Tests ({tests.length})</span>
          <span>Preliminary Tariff</span>
        </div>

        {tests.map((t, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800">{t.name}</span>
            <span className="font-mono tabular-nums text-slate-700">
              {formatXAF(Math.round(labTestTariff / Math.max(1, tests.length)))}
            </span>
          </div>
        ))}

        <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600">Primary Lab Tests Subtotal (incl. {platformFeePercent}% nanoLabs platform fee — {formatXAF(platformFeeAmount)}):</span>
            <span className="font-mono tabular-nums font-bold text-slate-900">{formatXAF(labTestTariff)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-600">
              Sample Collection ({collectionMethod === 'home' ? 'Home Pickup via Google Maps' : 'Walk-In at Laboratory'}):
            </span>
            <span className="font-mono tabular-nums font-bold text-slate-900">
              {collectionMethod === 'home' ? `+${formatXAF(homeFee)}` : '0 FCFA'}
            </span>
          </div>

          {insuranceCovered > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Estimated Insurance Coverage ({coveragePercent}%):</span>
              <span className="font-mono tabular-nums">-{formatXAF(insuranceCovered)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Home Pickup Location Confirmation */}
      {collectionMethod === 'home' && (
        <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#006978]" />
              <span>Pinned Google Maps Pickup Location:</span>
            </span>
            {pickupCoords && (
              <span className="font-mono text-[10px] text-slate-500">
                {pickupCoords.lat.toFixed(4)}, {pickupCoords.lng.toFixed(4)}
              </span>
            )}
          </div>
          <input
            type="text"
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          />
        </div>
      )}

      {/* Mandatory Fee & Clinical Add-On Transparency Notice */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1.5 text-xs text-amber-950">
        <div className="flex items-center gap-2 font-extrabold">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Fee Transparency & Official Laboratory Invoicing Notice</span>
        </div>
        <p className="text-[11px] text-amber-900/90 leading-relaxed">
          1. You do <strong>not</strong> pay now. Your request goes first to the <strong>Lab Receptionist</strong> for confirmation, then to the <strong>Lab Cashier</strong>.<br />
          2. A <strong>5% nanoLabs platform fee ({formatXAF(platformFeeAmount)})</strong> is factored into the online tariff calculation.<br />
          3. The final invoice sent by the Lab Cashier may include justifiable clinical fees (such as <em>acte de prélèvement</em>, sterile draw consumables, or specialized transport tubes).
          {lab.phone ? (
            <> For advance tariff or fasting inquiries, call <strong>{lab.name}</strong> at <a href={`tel:${lab.phone.replace(/\s+/g, '')}`} className="underline font-mono font-bold">{lab.phone}</a>.</>
          ) : null}
        </p>
      </div>

      {/* Preliminary Estimate Summary */}
      <div className="p-5 bg-gradient-to-br from-[#E0F2F1] to-[#F2FBFA] border border-[#80CBC4] rounded-3xl flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-[#006978]">
            {insuranceCovered > 0 ? 'Estimated Patient Co-Pay (Before Cashier Invoice)' : 'Preliminary Test Request Estimate'}
          </span>
          <div className="text-2xl font-black text-[#006978] font-mono tabular-nums mt-0.5">
            {formatXAF(estimatedPatientShare)}
          </div>
          <span className="text-[11px] text-slate-600">
            Official payable invoice will be sent to your Home screen after Receptionist & Cashier review
          </span>
        </div>
        <CheckCircle2 className="w-7 h-7 text-[#006978] shrink-0" />
      </div>

      {bookingError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold">
          {bookingError}
        </div>
      )}

      {/* Submit Test Request Button (No Pre-Payment) */}
      <div className="pt-1">
        <button
          onClick={handleRequestBooking}
          disabled={submitting}
          className="w-full py-4 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] disabled:opacity-75 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{submittingStep || 'Traitement asynchrone en cours...'}</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send Test Request to Laboratory (No Payment Now)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
