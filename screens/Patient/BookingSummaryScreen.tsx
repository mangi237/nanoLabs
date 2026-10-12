import React, { useState } from 'react';
import { ArrowLeft, Building2, Home, Calendar, Clock, ChevronRight, CheckCircle2, ShieldCheck, MapPin, Shield, Stethoscope, UserCheck } from 'lucide-react';
import { PartnerLabItem } from './ChooseLabScreen';
import { formatXAF } from '../../shared/money';
import { useAuth } from '../../context/authContext';
import { useFamilyProfile } from '../../context/familyProfileContext';
import { limsService } from '../../services/limsService';
import { ACCREDITED_DOCTORS, DoctorOption } from '../../components/common/DoctorCardSelect';

interface BookingSummaryScreenProps {
  lab: PartnerLabItem;
  tests: { name: string; price: number }[];
  collectionMethod: 'home' | 'lab';
  collectionFee: number;
  labTestTariff: number;
  onBack: () => void;
  onBookingRequested: (bookingData: any) => void;
}

export const BookingSummaryScreen: React.FC<BookingSummaryScreenProps> = ({
  lab,
  tests,
  collectionMethod,
  collectionFee,
  labTestTariff,
  onBack,
  onBookingRequested
}) => {
  const { user } = useAuth();
  const { activeProfile } = useFamilyProfile();

  const [useInsurance, setUseInsurance] = useState<boolean>(true);
  const [appointmentDate, setAppointmentDate] = useState('Today &bull; Immediate Dispatch (Next Available)');
  const [pickupAddress, setPickupAddress] = useState('Akwa Central, Douala');
  const [submitting, setSubmitting] = useState(false);

  // Referral Doctor state
  const [referringDoctorType, setReferringDoctorType] = useState<'accredited' | 'self' | 'other'>('self');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(ACCREDITED_DOCTORS[0].id);
  const [manualDoctorName, setManualDoctorName] = useState<string>('');
  const [manualHospitalName, setManualHospitalName] = useState<string>('');

  const insuranceProvider = user?.insuranceProvider || 'Activa Assurances (NHIS Partner)';
  const policyNumber = user?.insurancePolicyNumber || 'POL-884920';
  const coveragePercent = 80; // 80% Tiers Payant standard in Cameroon

  // Calculations
  const grossTotal = labTestTariff + (collectionMethod === 'home' ? collectionFee : 0);
  const insuranceCovered = useInsurance ? Math.round(labTestTariff * (coveragePercent / 100)) : 0;
  const netPayable = grossTotal - insuranceCovered;

  const handleRequestBooking = async () => {
    try {
      setSubmitting(true);
      const bookingCode = `BK-${Math.floor(100000 + Math.random() * 900000)}`;

      const bookingPayload = {
        bookingCode,
        patientName: activeProfile.fullName,
        patientPhone: (activeProfile as any).phone || user?.phone || '+237 670 000 000',
        patientEmail: user?.email || 'patient@nanolabs.cm',
        patientPid: activeProfile.id || user?.patientId || `PT-${Math.floor(10000 + Math.random() * 90000)}`,
        patientAge: activeProfile.age || 30,
        patientGender: activeProfile.gender || 'Female',
        relationship: activeProfile.relationship,
        labId: lab.id,
        labName: lab.name,
        pickupLocation: collectionMethod === 'home' ? pickupAddress : lab.address,
        homeCollection: collectionMethod === 'home',
        appointmentTime: appointmentDate,
        totalAmount: netPayable,
        grossAmount: grossTotal,
        hasInsurance: useInsurance,
        insuranceProvider: useInsurance ? insuranceProvider : undefined,
        insurancePolicyNumber: useInsurance ? policyNumber : undefined,
        insuranceCoveragePercent: useInsurance ? coveragePercent : 0,
        insuranceCoveredAmount: insuranceCovered,
        paymentStatus: 'unpaid' as const,
        overallStatus: 'Pending' as const,
        receptionistValidated: false, // Waits for Receptionist code authorization
        referringDoctorType,
        referringDoctorName: referringDoctorType === 'accredited' 
          ? ACCREDITED_DOCTORS.find(d => d.id === selectedDoctorId)?.name 
          : referringDoctorType === 'other' 
          ? manualDoctorName.trim() || undefined 
          : 'Self-Referred / None',
        referringDoctorHospital: referringDoctorType === 'accredited'
          ? ACCREDITED_DOCTORS.find(d => d.id === selectedDoctorId)?.hospital
          : referringDoctorType === 'other'
          ? manualHospitalName.trim() || undefined
          : undefined,
        referringDoctorId: referringDoctorType === 'accredited' ? selectedDoctorId : undefined,
        tests: tests.map((t, idx) => ({
          id: `t-${idx}`,
          testName: t.name,
          name: t.name,
          price: Math.round(labTestTariff / (tests.length || 1)),
          status: 'Pending'
        })),
        createdAt: new Date().toISOString()
      };

      const labId = lab.id || user?.labId || 'lab-1';
      const created = await limsService.createBooking({
        labId,
        patientId: bookingPayload.patientPid,
        patientName: bookingPayload.patientName,
        patientAge: bookingPayload.patientAge,
        patientGender: bookingPayload.patientGender as any,
        patientPhone: bookingPayload.patientPhone,
        patientEmail: bookingPayload.patientEmail,
        patientPid: bookingPayload.patientPid,
        pickupLocation: bookingPayload.pickupLocation,
        homeCollection: bookingPayload.homeCollection,
        totalAmount: netPayable,
        selectedTests: bookingPayload.tests
      } as any);

      onBookingRequested(created || bookingPayload);
    } catch (err) {
      console.error('Failed to create booking:', err);
      onBookingRequested({
        bookingCode: `BK-${Math.floor(100000 + Math.random() * 900000)}`,
        patientName: activeProfile.fullName,
        labName: lab.name,
        totalAmount: netPayable,
        grossAmount: grossTotal,
        tests,
        collectionMethod
      });
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
            Booking Summary & Tariff Breakdown
          </h1>
          <p className="text-[11px] text-slate-500">
            For: <strong className="text-slate-800">{activeProfile.fullName}</strong> ({activeProfile.relationshipLabel})
          </p>
        </div>
      </div>

      {/* Lab Card */}
      <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center font-bold shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected Performing Laboratory</span>
            <h3 className="text-base font-black text-slate-900">{lab.name}</h3>
            <span className="text-xs text-slate-500">{lab.distanceKm} km from your location &bull; {lab.city}</span>
          </div>
        </div>
      </div>

      {/* Insurance Toggle Option */}
      <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-[#006978]" />
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">Apply Health Insurance (Tiers-Payant)</h4>
              <p className="text-[11px] text-slate-500">80% covered by caisse, you only pay 20% co-pay</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={useInsurance}
              onChange={(e) => setUseInsurance(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006978]"></div>
          </label>
        </div>

        {useInsurance && (
          <div className="p-3 bg-[#E0F2F1]/50 rounded-2xl border border-[#80CBC4] text-xs space-y-1">
            <div className="flex justify-between font-bold text-[#006978]">
              <span>Caisse Provider:</span>
              <span>{insuranceProvider}</span>
            </div>
            <div className="flex justify-between text-slate-600 font-mono text-[11px]">
              <span>Policy Matricule:</span>
              <span>{policyNumber}</span>
            </div>
          </div>
        )}
      </div>

      {/* Referral Doctor Selection Card */}
      <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <Stethoscope className="w-4 h-4 text-[#006978]" />
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">
              Referring / Prescribing Physician (Optional)
            </h4>
            <p className="text-[11px] text-slate-500">
              Informs the lab so your doctor receives automated reports directly
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setReferringDoctorType('self')}
            className={`py-2 px-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
              referringDoctorType === 'self'
                ? 'border-[#006978] bg-[#E0F2F1] text-[#006978]'
                : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}
          >
            Self-Referred
          </button>
          <button
            type="button"
            onClick={() => setReferringDoctorType('accredited')}
            className={`py-2 px-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
              referringDoctorType === 'accredited'
                ? 'border-[#006978] bg-[#E0F2F1] text-[#006978]'
                : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}
          >
            Platform Doctor
          </button>
          <button
            type="button"
            onClick={() => setReferringDoctorType('other')}
            className={`py-2 px-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
              referringDoctorType === 'other'
                ? 'border-[#006978] bg-[#E0F2F1] text-[#006978]'
                : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}
          >
            External Doctor
          </button>
        </div>

        {referringDoctorType === 'accredited' && (
          <div className="pt-1 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 block">Select from Accredited Doctors Directory:</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-[#006978]"
            >
              {ACCREDITED_DOCTORS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} &bull; {d.specialty} ({d.hospital})
                </option>
              ))}
            </select>
          </div>
        )}

        {referringDoctorType === 'other' && (
          <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Doctor Name:</label>
              <input
                type="text"
                value={manualDoctorName}
                onChange={(e) => setManualDoctorName(e.target.value)}
                placeholder="Dr. Full Name"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Hospital / Clinic:</label>
              <input
                type="text"
                value={manualHospitalName}
                onChange={(e) => setManualHospitalName(e.target.value)}
                placeholder="Clinic or Hospital Name"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tests breakdown with Lab Specific Tariff */}
      <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">
          <span>Requested Tests ({tests.length})</span>
          <span>Laboratory Rate</span>
        </div>

        {tests.map((t, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800">{t.name}</span>
            <span className="font-mono text-slate-600">Tariff by {lab.name}</span>
          </div>
        ))}

        <div className="pt-2 border-t space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600">Lab Diagnostic Tariff:</span>
            <span className="font-mono font-bold text-slate-900">{formatXAF(labTestTariff)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-600">
              Collection ({collectionMethod === 'home' ? `Home Pickup & Courier (${lab.distanceKm} km)` : 'Walk-in Intake'}):
            </span>
            <span className="font-mono font-bold text-slate-900">
              {collectionMethod === 'home' ? `+${formatXAF(collectionFee)}` : 'Free'}
            </span>
          </div>

          {useInsurance && (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Insurance Caisse Share (80%):</span>
              <span className="font-mono">-{formatXAF(insuranceCovered)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Collection Location if Home */}
      {collectionMethod === 'home' && (
        <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#006978]" />
            <span>Phlebotomist Dispatch Address:</span>
          </span>
          <input
            type="text"
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          />
        </div>
      )}

      {/* Grand Total Bar */}
      <div className="p-5 bg-gradient-to-br from-[#E0F2F1] to-[#F2FBFA] border border-[#80CBC4] rounded-3xl flex items-center justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#006978]">
            {useInsurance ? 'Patient Co-Pay Share (Ticket Modérateur)' : 'Total Payable'}
          </span>
          <div className="text-2xl font-black text-[#006978] font-mono mt-0.5">
            {formatXAF(netPayable)}
          </div>
          <span className="text-[10px] text-slate-500">Official invoice generated upon lab reception</span>
        </div>
        <CheckCircle2 className="w-7 h-7 text-[#006978]" />
      </div>

      {/* Request Booking Action */}
      <div className="pt-2">
        <button
          onClick={handleRequestBooking}
          disabled={submitting}
          className="w-full py-4 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>{submitting ? 'Submitting to Lab Reception...' : 'Submit Booking Request'}</span>
        </button>
      </div>
    </div>
  );
};
