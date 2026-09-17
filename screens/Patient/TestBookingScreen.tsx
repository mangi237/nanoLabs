import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Check, 
  Trash2, 
  MapPin, 
  Building2, 
  Clock, 
  CreditCard, 
  ShieldCheck, 
  Truck, 
  Navigation,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Users,
  UserPlus,
  Heart
} from 'lucide-react';
import { MASTER_TEST_DICTIONARY } from '../../core/scanner';
import { PARTNER_LABS, calculateDistanceKm } from '../../core/gps';
import { CEMAC_INSURERS, InsuranceSetupScreen } from '../auth/InsuranceSetupScreen';
import { groupIntoBatch } from '../../shared/batchGrouping';
import { generateInvoiceForBatch } from '../../services/invoiceService';
import { saveBatch } from '../../services/batchService';
import { formatXAF, splitInsurance, applyPlatformFee } from '../../shared/money';
import { PLATFORM_FEE_PCT } from '../../shared/percentage';
import { SampleMode, FamilyMemberProfile } from '../../types';
import { useAuth } from '../../context/authContext';
import { useFamilyProfile } from '../../context/familyProfileContext';
import { FamilyMemberModal } from '../../components/patient/FamilyMemberModal';

interface TestBookingScreenProps {
  initialSelectedTests?: any[];
  onBookingSuccess?: (batchId: string) => void;
  onBookingComplete?: (batchId: string) => void;
  onCancel?: () => void;
}

export const TestBookingScreen: React.FC<TestBookingScreenProps> = ({
  initialSelectedTests = [],
  onBookingSuccess,
  onBookingComplete,
  onCancel
}) => {
  const { user } = useAuth();
  const { 
    familyMembers, 
    activeProfile, 
    switchActiveProfile, 
    createFamilyMember 
  } = useFamilyProfile();

  const [selectedTests, setSelectedTests] = useState<any[]>(initialSelectedTests);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  
  // Sample Mode: Walk-in vs Home Collection
  const [sampleMode, setSampleMode] = useState<SampleMode>('walk_in');
  const [homeAddress, setHomeAddress] = useState('Akwa, Douala (Face Direction Générale MTN)');
  
  // Selected Lab
  const [selectedLabId, setSelectedLabId] = useState('lab_central_douala');
  
  // Insurance
  const [useInsurance, setUseInsurance] = useState(true);
  const [selectedInsurerCode, setSelectedInsurerCode] = useState(activeProfile?.insuranceProvider || 'ASCOMA');
  const [policyNumber, setPolicyNumber] = useState(activeProfile?.insurancePolicyNumber || 'ASC-2026-8921');
  const [policyHolder, setPolicyHolder] = useState(
    activeProfile?.isDependentOnPrimaryInsurance 
      ? `${user?.name || 'Mme. Claire Ngo'} (Principal)` 
      : activeProfile?.fullName || 'Mme. Claire Ngo'
  );
  const [coveragePercent, setCoveragePercent] = useState(activeProfile?.insuranceCoveragePercent ?? 80);
  const [showInsuranceSetupModal, setShowInsuranceSetupModal] = useState(false);

  // Sync when activeProfile changes
  useEffect(() => {
    if (activeProfile) {
      if (activeProfile.insuranceProvider) {
        setUseInsurance(true);
        setSelectedInsurerCode(activeProfile.insuranceProvider);
        setPolicyNumber(activeProfile.insurancePolicyNumber || 'ASC-2026-8921');
        setCoveragePercent(activeProfile.insuranceCoveragePercent ?? 80);
      }
      setPolicyHolder(
        activeProfile.isDependentOnPrimaryInsurance
          ? `${user?.name || 'Mme. Claire Ngo'} (Ayant-Droit / Principal)`
          : activeProfile.fullName
      );
    }
  }, [activeProfile, user]);

  // User location (defaults to Douala Akwa)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: 4.0511,
    lng: 9.7085
  });

  const categories = [
    { id: 'all', label: 'All Specialties' },
    { id: 'hematology', label: 'Hematology' },
    { id: 'biochemistry', label: 'Biochemistry' },
    { id: 'parasitology', label: 'Parasitology' },
    { id: 'microbiology', label: 'Microbiology' }
  ];

  const filteredCatalog = MASTER_TEST_DICTIONARY.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.frenchName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || t.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const toggleTest = (test: any) => {
    if (selectedTests.some((t) => t.code === test.code)) {
      setSelectedTests(selectedTests.filter((t) => t.code !== test.code));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const selectedLab = PARTNER_LABS.find((l) => l.id === selectedLabId) || PARTNER_LABS[0];

  // Financial Breakdown calculations
  const testsSubtotal = selectedTests.reduce((acc, t) => acc + (t.basePrice || t.price || 0), 0);
  const homeFee = sampleMode === 'home_collection' ? 2500 : 0;
  const grossTotal = testsSubtotal + homeFee;

  const actualCoveragePct = useInsurance ? coveragePercent : 0;
  const { coveredAmount, patientShare } = splitInsurance(grossTotal, actualCoveragePct);
  const platformFee = applyPlatformFee(patientShare);
  const totalPatientDue = patientShare + platformFee;

  const handleConfirmBooking = () => {
    if (selectedTests.length === 0) return;

    const patientInfo = {
      id: activeProfile?.id || user?.id || 'patient_demo',
      name: activeProfile?.fullName || user?.name || 'Mme. Claire Ngo',
      phone: user?.phone || '+237 670 11 22 33'
    };

    const labInfo = {
      id: selectedLab.id,
      name: selectedLab.name
    };

    // Group into canonical batch
    const batch = groupIntoBatch(selectedTests, labInfo, patientInfo, {
      sampleMode,
      notes: sampleMode === 'home_collection' ? `Home address: ${homeAddress}` : undefined
    });

    // Attach family profile metadata
    if (activeProfile) {
      batch.familyProfileId = activeProfile.id;
      batch.familyRelationship = activeProfile.relationship;
      batch.patientAge = activeProfile.age;
      batch.patientGender = activeProfile.gender === 'female' ? 'F' : 'M';
      batch.patientPhone = user?.phone || '+237 670 11 22 33';
      if (activeProfile.allergies && activeProfile.allergies.length > 0) {
        batch.notes = (batch.notes ? batch.notes + ' | ' : '') + `Allergies: ${activeProfile.allergies.join(', ')}`;
      }
    }

    // Save batch
    saveBatch(batch);

    // Generate Invoice with dependent metadata
    const invoice = generateInvoiceForBatch(batch, {
      insuranceProviderName: useInsurance ? selectedInsurerCode : undefined,
      insurancePolicyNumber: useInsurance ? policyNumber : undefined,
      insuranceCoveragePercent: actualCoveragePct,
      homeCollectionFee: homeFee,
      familyProfileId: activeProfile?.id,
      beneficiaryName: activeProfile?.fullName,
      policyHolderName: activeProfile?.isDependentOnPrimaryInsurance 
        ? `${user?.name || 'Mme. Claire Ngo'} (Principal Subscriber)`
        : activeProfile?.fullName
    });

    batch.invoiceId = invoice.id;
    saveBatch(batch);

    if (onBookingSuccess) {
      onBookingSuccess(batch.id);
    } else if (onBookingComplete) {
      onBookingComplete(batch.id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-[#0B1F1D] tracking-tight">
          Book Laboratory Diagnostic Tests
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7F7D]">
          Select laboratory investigations, choose an accredited facility, and schedule walk-in or home collection.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: TEST SELECTION & LAB CONFIGURATION */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. BENEFICIARY / FAMILY MEMBER SELECTOR */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-[#0B1F1D] uppercase tracking-wide flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0F766E]" />
                  <span>1. Patient Beneficiary (Who is this test for?)</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Book under your own name or manage tests for your children and elderly parents
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMemberModalOpen(true)}
                className="text-xs font-bold text-[#0F766E] hover:text-[#0D3B38] bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Dependent</span>
              </button>
            </div>

            {/* Family Members Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {familyMembers.map((member) => {
                const isSelected = member.id === activeProfile?.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => switchActiveProfile(member.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                      isSelected
                        ? 'border-[#0F766E] bg-teal-50/70 shadow-xs ring-2 ring-[#0F766E]/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        member.relationship === 'mother' || member.relationship === 'grandparent'
                          ? 'bg-indigo-600 text-white'
                          : member.relationship === 'child' || member.relationship === 'son' || member.relationship === 'daughter'
                          ? 'bg-amber-600 text-white'
                          : 'bg-[#0F766E] text-white'
                      }`}>
                        {member.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-[#0B1F1D] truncate">
                            {member.fullName}
                          </p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${
                            member.relationship === 'self'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {member.relationship === 'self' ? 'Self' : member.relationshipLabel.split(' ')[0]}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {member.age} yrs &bull; {member.gender === 'female' ? 'Female' : 'Male'} &bull; {member.bloodGroup || 'Blood N/A'}
                        </p>

                        {/* Safety alerts */}
                        {member.allergies && member.allergies.length > 0 && (
                          <p className="text-[10px] text-rose-700 font-semibold truncate mt-0.5">
                            Allergy: {member.allergies.join(', ')}
                          </p>
                        )}
                        {member.chronicConditions && member.chronicConditions.length > 0 && (
                          <p className="text-[10px] text-indigo-700 font-semibold truncate">
                            {member.chronicConditions.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'border-[#0F766E] bg-[#0F766E] text-white' : 'border-slate-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active profile notice */}
            {activeProfile && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-600">
                  Lab reports and specimen tube barcodes will be registered under: <strong className="text-[#0D3B38]">{activeProfile.fullName}</strong>
                </span>
                <span className="text-[11px] font-bold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded-md shrink-0">
                  {activeProfile.isDependentOnPrimaryInsurance ? 'Covered as Ayant-Droit' : activeProfile.insuranceProvider || 'Direct Cashier Co-Pay'}
                </span>
              </div>
            )}
          </div>

          {/* Sample Mode Toggle */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <label className="block text-xs font-bold text-[#0B1F1D] uppercase tracking-wide">
              2. Select Sampling Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSampleMode('walk_in')}
                className={`min-h-[48px] p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  sampleMode === 'walk_in'
                    ? 'border-[#0F766E] bg-teal-50/50 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  sampleMode === 'walk_in' ? 'bg-[#0F766E] text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Walk-in at Center</div>
                  <div className="text-[11px] text-slate-500">Visit lab sampling desk</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSampleMode('home_collection')}
                className={`min-h-[48px] p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  sampleMode === 'home_collection'
                    ? 'border-[#0F766E] bg-teal-50/50 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  sampleMode === 'home_collection' ? 'bg-[#0F766E] text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Home Phlebotomy</div>
                  <div className="text-[11px] text-slate-500">Insulated cold-box dispatch</div>
                </div>
              </button>
            </div>

            {sampleMode === 'home_collection' && (
              <div className="pt-2 space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">
                  Phlebotomist Dispatch Address & Landmark *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                    placeholder="Enter residence address and landmark..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-teal-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Partner Lab Selection */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#0B1F1D] uppercase tracking-wide">
                2. Select Performing Laboratory
              </label>
              <span className="text-[11px] text-teal-700 font-bold flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                <span>Ranked by GPS Distance</span>
              </span>
            </div>

            <div className="space-y-2">
              {PARTNER_LABS.map((lab) => {
                const labLat = lab.lat ?? lab.coordinates?.latitude ?? 4.0511;
                const labLng = lab.lng ?? lab.coordinates?.longitude ?? 9.7042;
                const dist = calculateDistanceKm(userCoords.lat, userCoords.lng, labLat, labLng);
                const isSelected = lab.id === selectedLabId;
                return (
                  <div
                    key={lab.id}
                    onClick={() => setSelectedLabId(lab.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#0F766E] bg-teal-50/40 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#0F766E] text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0B1F1D] truncate">{lab.name}</div>
                        <div className="text-[11px] text-[#6B7F7D] truncate">
                          {lab.city} &bull; {lab.address}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-[#0F766E] font-mono">{dist} km</span>
                      <div className="text-[10px] text-slate-500 font-semibold">{lab.averageTurnaroundHours ?? lab.tatHours}h avg TAT</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Test Catalog Browser */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="block text-xs font-bold text-[#0B1F1D] uppercase tracking-wide">
                3. Add Clinical Tests ({selectedTests.length} selected)
              </label>
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-teal-500"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`min-h-[32px] px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-[#0D3B38] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Test Cards List */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {filteredCatalog.map((test) => {
                const isSelected = selectedTests.some((t) => t.code === test.code);
                return (
                  <div
                    key={test.code}
                    onClick={() => toggleTest(test)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#0F766E] bg-teal-50/50'
                        : 'border-slate-200 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {test.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {test.frenchName || test.name} {test.sampleType ? `• ${test.sampleType}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {formatXAF(test.basePrice)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COL: FINANCIAL BREAKDOWN & CO-PAY PREVIEW */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4 sticky top-20">
            <h3 className="text-sm font-black text-[#0B1F1D] uppercase tracking-wide pb-2 border-b border-slate-100">
              Diagnostic Co-Pay Preview
            </h3>

            {/* Insurance Settings Box */}
            <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#0D3B38]">
                <span>Health Insurance</span>
                <input
                  type="checkbox"
                  checked={useInsurance}
                  onChange={(e) => setUseInsurance(e.target.checked)}
                  className="accent-[#0F766E] cursor-pointer"
                />
              </div>

              {useInsurance && (
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={selectedInsurerCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        setSelectedInsurerCode(code);
                        const ins = CEMAC_INSURERS.find((i) => i.code === code);
                        if (ins && ins.coverageTiers?.length) {
                          setCoveragePercent(ins.coverageTiers[0].defaultPercent);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden"
                    >
                      {CEMAC_INSURERS.map((ins) => (
                        <option key={ins.code} value={ins.code}>
                          {ins.name} ({ins.coverageTiers?.[0]?.defaultPercent || 80}%)
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setShowInsuranceSetupModal(true)}
                      className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                    >
                      Policy Details
                    </button>
                  </div>

                  <div className="p-2 bg-white/80 rounded-lg border border-teal-200 text-[11px] space-y-0.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Policy #:</span>
                      <span className="font-mono font-bold text-slate-800">{policyNumber}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Beneficiary:</span>
                      <span className="font-bold text-slate-800">{policyHolder}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#0F766E] font-medium">
                    Verified manually by cashier at intake. 0% fee on insurance share.
                  </p>
                </div>
              )}
            </div>

            {/* Selected Test Lines Summary */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Tests Subtotal ({selectedTests.length})</span>
                <span className="font-mono font-bold text-slate-900">{formatXAF(testsSubtotal)}</span>
              </div>

              {sampleMode === 'home_collection' && (
                <div className="flex justify-between text-slate-600">
                  <span>Home Collection Dispatch</span>
                  <span className="font-mono font-bold text-slate-900">{formatXAF(homeFee)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                <span>Gross Tariff (TVA 0% Exempt)</span>
                <span className="font-mono">{formatXAF(grossTotal)}</span>
              </div>
            </div>

            {/* Co-Pay Calculation Box */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Insurance Share ({actualCoveragePct}%)</span>
                <span className="font-mono font-bold text-emerald-700">-{formatXAF(coveredAmount)}</span>
              </div>

              <div className="flex justify-between text-slate-700">
                <span>Patient Out-of-Pocket Share</span>
                <span className="font-mono font-bold">{formatXAF(patientShare)}</span>
              </div>

              <div className="flex justify-between text-teal-800 font-bold text-[11px] pt-1 border-t border-slate-200/60">
                <span>nanoLabs Record Fee ({PLATFORM_FEE_PCT}%)</span>
                <span className="font-mono">+{formatXAF(platformFee)}</span>
              </div>
            </div>

            {/* Final Cashier Total Due */}
            <div className="p-3.5 bg-[#0D3B38] text-white rounded-2xl space-y-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-teal-300">
                Total Due at Cashier Counter
              </div>
              <div className="text-xl font-black font-mono">
                {formatXAF(totalPatientDue)}
              </div>
              <p className="text-[10px] text-teal-100/80">
                100% paid to lab desk via Cash, MTN MoMo, or Orange Money.
              </p>
            </div>

            {/* Submit Action Button */}
            <button
              type="button"
              disabled={selectedTests.length === 0}
              onClick={handleConfirmBooking}
              className="w-full min-h-[44px] py-3 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:from-[#0D3B38] hover:to-[#0F766E] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Confirm & Dispatch Batch</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Insurance Setup Modal Overlay */}
      {showInsuranceSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl">
            <InsuranceSetupScreen
              initialPatientName={policyHolder}
              onSave={(data) => {
                if (data.hasInsurance) {
                  setUseInsurance(true);
                  if (data.provider) {
                    const match = CEMAC_INSURERS.find((i) => i.name.toLowerCase().includes(data.provider!.toLowerCase()) || i.code.toLowerCase().includes(data.provider!.toLowerCase()));
                    if (match) setSelectedInsurerCode(match.code);
                  }
                  if (data.policyNumber) setPolicyNumber(data.policyNumber);
                  if (data.policyHolder) setPolicyHolder(data.policyHolder);
                  if (data.coveragePercent) setCoveragePercent(data.coveragePercent);
                } else {
                  setUseInsurance(false);
                }
                setShowInsuranceSetupModal(false);
              }}
              onSkip={() => setShowInsuranceSetupModal(false)}
            />
          </div>
        </div>
      )}
      {/* Family Member Creation Modal */}
      <FamilyMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onSave={(data) => {
          const created = createFamilyMember(data);
          switchActiveProfile(created.id);
          setIsAddMemberModalOpen(false);
        }}
        primaryUserName={user?.name || 'Mme. Claire Ngo'}
        primaryUserInsurance={selectedInsurerCode}
      />
    </div>
  );
};

export default TestBookingScreen;
