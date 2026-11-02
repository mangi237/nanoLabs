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
  Send
} from 'lucide-react';
import { PartnerLabItem } from './ChooseLabScreen';
import { formatXAF } from '../../shared/money';
import { useAuth } from '../../context/authContext';
import { useFamilyProfile } from '../../context/familyProfileContext';
import { limsService } from '../../services/limsService';
import { DoctorOption } from '../../components/common/DoctorCardSelect';
import { canLabUseFeature } from '../../utils/labPackages';

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
  const { activeProfile } = useFamilyProfile();

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
  const [pickupAddress, setPickupAddress] = useState<string>(
    initialPickupAddress || 'Boulevard de la Liberté, Akwa, Douala'
  );
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string>('');

  // Real platform doctors directory (zero mock doctors)
  const [platformDoctors, setPlatformDoctors] = useState<DoctorOption[]>([]);
  const [referringDoctorType, setReferringDoctorType] = useState<'accredited' | 'self' | 'other'>('self');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [manualDoctorName, setManualDoctorName] = useState<string>('');
  const [manualHospitalName, setManualHospitalName] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    const loadDoctorsAndScannedPrescription = async () => {
      try {
        const scannedDoc = sessionStorage.getItem('nanolabs_scanned_doctor') || '';
        const scannedHosp = sessionStorage.getItem('nanolabs_scanned_hospital') || '';
        if (scannedDoc) {
          setReferringDoctorType('other');
          setManualDoctorName(scannedDoc);
          if (scannedHosp) setManualHospitalName(scannedHosp);
        }

        const liveDocs = await limsService.searchAllAccreditedDoctors('');
        const mapped: DoctorOption[] = (liveDocs || []).map((d: any, i: number) => ({
          id: d.id || `doc-${i}`,
          name: d.name?.startsWith('Dr.') ? d.name : `Dr. ${d.name}`,
          specialty: d.specialty || 'General Medicine',
          hospital: d.hospitalAffiliation || d.hospital || 'Accredited Medical Center',
          verified: true
        }));

        try {
          const rawLocal = localStorage.getItem('nanolabs_registered_doctors');
          if (rawLocal) {
            const parsed = JSON.parse(rawLocal);
            if (Array.isArray(parsed)) {
              parsed.forEach((ld: any, idx: number) => {
                if (!mapped.some((m) => m.id === ld.id || m.name === ld.name)) {
                  mapped.push({
                    id: ld.id || `doc-local-${idx}`,
                    name: ld.name?.startsWith('Dr.') ? ld.name : `Dr. ${ld.name}`,
                    specialty: ld.specialty || 'General Medicine',
                    hospital: ld.hospital || 'Medical Center',
                    verified: true
                  });
                }
              });
            }
          }
        } catch {}

        if (mounted) {
          setPlatformDoctors(mapped);
          if (mapped.length > 0) {
            setSelectedDoctorId(mapped[0].id);
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
      setSubmitting(true);
      const patientPid =
        activeProfile.id || user?.patientId || user?.id || `PT-${Math.floor(10000 + Math.random() * 90000)}`;
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

      const created = await limsService.createBooking({
        labId: lab.id || 'lab-1',
        labName: lab.name,
        labAddress: lab.address,
        labPhone: lab.phone,
        labLogoUrl: lab.logoUrl,
        patientId: patientPid,
        patientPid,
        patientName: activeProfile.fullName || user?.name || 'Patient',
        patientAge: activeProfile.age || 30,
        patientGender: (activeProfile.gender as any) || 'Female',
        patientPhone: activeProfile.phone || user?.phone || '+237 670 00 00 00',
        patientEmail: user?.email || '',
        creatorName: activeProfile.fullName || user?.name || 'Online Patient',
        isOnlineBooking: true,
        registrationType: 'online',
        registeredBy: 'Online Patient App',
        receptionistValidated: false,
        referringDoctorId: referringDoctorType === 'accredited' ? selectedDoctorId : undefined,
        referringDoctor: resolvedReferringDoc,
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
        pickupLocation: collectionMethod === 'home' ? pickupAddress : lab.address,
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
          price: perTestBasePrice,
          basePrice: perTestBasePrice,
          totalPrice: perTestBasePrice
        }))
      });

      sessionStorage.removeItem('nanolabs_scanned_doctor');
      sessionStorage.removeItem('nanolabs_scanned_hospital');
      onBookingRequested(created);
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
          <div className="pt-1 space-y-1.5">
            {platformDoctors.length > 0 ? (
              <>
                <label className="text-[11px] font-bold text-slate-600 block">
                  Registered Platform Physicians:
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-[#006978]"
                >
                  {platformDoctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} &middot; {d.specialty} ({d.hospital})
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                No platform doctors registered yet. Switch to <strong>External Doctor</strong> to type your prescribing physician's name and hospital.
              </p>
            )}
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
          className="w-full py-4 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>{submitting ? 'Sending Test Request to Receptionist...' : 'Send Test Request to Laboratory (No Payment Now)'}</span>
        </button>
      </div>
    </div>
  );
};
