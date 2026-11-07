import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Search, 
  Plus, 
  Barcode, 
  CreditCard, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Check, 
  ArrowRight,
  RefreshCw,
  Clock
} from 'lucide-react';
import { MASTER_TEST_DICTIONARY } from '../../core/scanner';
import { CEMAC_INSURERS } from '../auth/InsuranceSetupScreen';
import { groupIntoBatch } from '../../shared/batchGrouping';
import { generateInvoiceForBatch } from '../../services/invoiceService';
import { saveBatch } from '../../services/batchService';
import { formatXAF, splitInsurance, applyPlatformFee } from '../../shared/money';
import { PLATFORM_FEE_PCT } from '../../shared/percentage';
import { useAuth } from '../../context/authContext';

export const ReceptionIntakeScreen: React.FC = () => {
  const { user } = useAuth();

  // Patient Info
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('32');
  const [patientGender, setPatientGender] = useState<'M' | 'F'>('F');

  // Selected Tests
  const [selectedTests, setSelectedTests] = useState<any[]>([
    MASTER_TEST_DICTIONARY[0] // NFS
  ]);
  const [testSearch, setTestSearch] = useState('');

  // Sample Tube Barcode
  const [tubeBarcode, setTubeBarcode] = useState(`TUBE-${Date.now().toString().slice(-6)}`);

  // Insurance Card Scanning / Manual Entry
  const [hasInsurance, setHasInsurance] = useState(false);
  const [insurerName, setInsurerName] = useState('Ascoma Assurances');
  const [policyNumber, setPolicyNumber] = useState('ASC-2026-9021');
  const [coveragePercent, setCoveragePercent] = useState(80);

  // Success state
  const [createdBatchId, setCreatedBatchId] = useState<string | null>(null);

  const toggleTest = (test: any) => {
    if (selectedTests.some((t) => t.code === test.code)) {
      setSelectedTests(selectedTests.filter((t) => t.code !== test.code));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const handleGenerateBarcode = () => {
    setTubeBarcode(`TUBE-${Date.now().toString().slice(-6)}`);
  };

  const testsSubtotal = selectedTests.reduce((acc, t) => acc + (t.basePrice || 0), 0);
  const actualCoverage = hasInsurance ? coveragePercent : 0;
  const { coveredAmount, patientShare } = splitInsurance(testsSubtotal, actualCoverage);
  const platformFee = applyPlatformFee(patientShare);
  const patientTotalDue = patientShare + platformFee;

  const handleCreateIntake = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTests.length === 0 || !patientName || !patientPhone) return;

    const patientInfo = {
      id: `pat_${Date.now()}`,
      name: patientName,
      phone: patientPhone,
      age: Number(patientAge) || 30,
      gender: patientGender
    };

    const labInfo = {
      id: user?.labId || 'lab_central_douala',
      name: 'Laboratoire Central Akwa - Douala'
    };

    const batch = groupIntoBatch(selectedTests, labInfo, patientInfo, {
      sampleMode: 'walk_in',
      tubeBarcode
    });

    saveBatch(batch);

    const invoice = generateInvoiceForBatch(batch, {
      insuranceProviderName: hasInsurance ? insurerName : undefined,
      insurancePolicyNumber: hasInsurance ? policyNumber : undefined,
      insuranceCoveragePercent: actualCoverage,
      homeCollectionFee: 0
    });

    batch.invoiceId = invoice.id;
    saveBatch(batch);

    setCreatedBatchId(batch.id);
  };

  const filteredTests = MASTER_TEST_DICTIONARY.filter(
    (t) =>
      t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
      t.code.toLowerCase().includes(testSearch.toLowerCase()) ||
      t.frenchName?.toLowerCase().includes(testSearch.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-[#0B1F1D] tracking-tight">
          Patient Intake & Specimen Barcoding
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7F7D]">
          Reception desk intake: register walk-in patients, barcode tubes, verify insurance eligibility, and dispatch to phlebotomy.
        </p>
      </div>

      {createdBatchId ? (
        <div className="p-8 bg-white rounded-3xl border border-teal-200 shadow-xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-[#0B1F1D]">
              Intake Registered & Specimen Batch Dispatched
            </h2>
            <p className="text-xs text-[#6B7F7D]">
              Batch assigned barcode: <strong className="font-mono text-[#0D3B38]">{tubeBarcode}</strong>
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-sm mx-auto text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Patient:</span>
              <strong className="text-slate-900">{patientName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tests:</span>
              <strong className="text-slate-900">{selectedTests.length} investigations</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Patient Share (Cashier Due):</span>
              <strong className="font-mono text-[#0F766E] font-bold">{formatXAF(patientTotalDue)}</strong>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => window.print()}
              className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Specimen Label & Intake Slip</span>
            </button>
            <button
              onClick={() => {
                setCreatedBatchId(null);
                setPatientName('');
                setPatientPhone('');
                handleGenerateBarcode();
              }}
              className="min-h-[44px] px-6 py-2 bg-[#0F766E] text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Register Next Patient
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreateIntake} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT 2 COLS: PATIENT & SPECIMEN BARCODE */}
            <div className="lg:col-span-2 space-y-6">
              {/* Patient Demographics */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <User className="w-4 h-4 text-[#0F766E]" />
                  <span>1. Patient Registration & Identity</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. M. Daniel Ngono"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+237 6..."
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-hidden focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Age</label>
                    <input
                      type="number"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-hidden focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Gender</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPatientGender('F')}
                        className={`min-h-[40px] rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          patientGender === 'F' ? 'border-[#0F766E] bg-teal-50 text-[#0D3B38]' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        Female (F)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPatientGender('M')}
                        className={`min-h-[40px] rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          patientGender === 'M' ? 'border-[#0F766E] bg-teal-50 text-[#0D3B38]' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        Male (M)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specimen Tube Barcode Box */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-2">
                    <Barcode className="w-4 h-4 text-[#0F766E]" />
                    <span>2. Specimen Tube Barcode Assignment</span>
                  </h2>

                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    className="text-xs font-bold text-[#0F766E] flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Assigned Laboratory Barcode</div>
                    <div className="text-lg font-mono font-black text-[#0D3B38] tracking-wider">
                      {tubeBarcode}
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-center">
                    <div className="font-mono text-xs font-bold text-slate-800 tracking-widest px-4 py-2 border-y-2 border-slate-800">
                      ||| | |||| | ||| | ||
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Selection */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                    3. Select Laboratory Tests ({selectedTests.length})
                  </h2>

                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search test..."
                      value={testSearch}
                      onChange={(e) => setTestSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredTests.map((test) => {
                    const isSelected = selectedTests.some((t) => t.code === test.code);
                    return (
                      <div
                        key={test.code}
                        onClick={() => toggleTest(test)}
                        className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'border-[#0F766E] bg-teal-50/50 shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{test.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{test.code}</div>
                        </div>
                        <span className="font-mono font-bold text-slate-700 shrink-0">
                          {formatXAF(test.basePrice)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT COL: INSURANCE & CASHIER TOTAL */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4 sticky top-20">
                <h3 className="text-sm font-black text-[#0B1F1D] uppercase tracking-wide pb-2 border-b border-slate-100">
                  Intake & Financial Summary
                </h3>

                {/* Insurance Card Verification */}
                <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#0D3B38]">
                    <span>CEMAC Health Insurance</span>
                    <input
                      type="checkbox"
                      checked={hasInsurance}
                      onChange={(e) => setHasInsurance(e.target.checked)}
                      className="accent-[#0F766E] cursor-pointer"
                    />
                  </div>

                  {hasInsurance && (
                    <div className="space-y-2 pt-1 text-xs">
                      <select
                        value={insurerName}
                        onChange={(e) => setInsurerName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden"
                      >
                        {CEMAC_INSURERS.map((ins) => (
                          <option key={ins.code} value={ins.name}>
                            {ins.name}
                          </option>
                        ))}
                      </select>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600">Card / Policy N°</label>
                        <input
                          type="text"
                          value={policyNumber}
                          onChange={(e) => setPolicyNumber(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg text-xs font-mono font-bold text-slate-800"
                        />
                      </div>

                      <div className="flex justify-between items-center text-[11px] font-bold text-teal-800">
                        <span>Approved Co-pay Coverage:</span>
                        <span>{coveragePercent}%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tariff Math Breakdown */}
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Tests Subtotal ({selectedTests.length})</span>
                    <span className="font-mono font-bold text-slate-900">{formatXAF(testsSubtotal)}</span>
                  </div>

                  <div className="flex justify-between text-[11px] text-emerald-700">
                    <span>TVA Exempt (Article 128)</span>
                    <span className="font-mono font-bold">0 XAF</span>
                  </div>

                  {hasInsurance && (
                    <div className="flex justify-between text-emerald-700 pt-1 border-t border-slate-100">
                      <span>Insurance Portion ({coveragePercent}%)</span>
                      <span className="font-mono font-bold">-{formatXAF(coveredAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-100">
                    <span>Patient Out-of-Pocket</span>
                    <span className="font-mono">{formatXAF(patientShare)}</span>
                  </div>

                  <div className="flex justify-between text-teal-800 text-[11px] font-bold">
                    <span>nanoLabs Fee ({PLATFORM_FEE_PCT}%)</span>
                    <span className="font-mono">+{formatXAF(platformFee)}</span>
                  </div>
                </div>

                {/* Final Cashier Total Due */}
                <div className="p-3.5 bg-[#0D3B38] text-white rounded-2xl space-y-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-teal-300">
                    Amount Due at Cashier Desk
                  </div>
                  <div className="text-xl font-black font-mono">
                    {formatXAF(patientTotalDue)}
                  </div>
                  <p className="text-[10px] text-teal-100/80">
                    5% fee applied to patient share only.
                  </p>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={selectedTests.length === 0 || !patientName || !patientPhone}
                  className="w-full min-h-[44px] py-3 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:from-[#0D3B38] hover:to-[#0F766E] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Register Intake & Dispatch</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default ReceptionIntakeScreen;
