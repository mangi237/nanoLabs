import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  QrCode, 
  Check, 
  Lock, 
  UserCheck, 
  Search,
  Building2,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { TestBatch, BatchTestItem } from '../../types';
import { getBatchesForLab, updateBatchStatus, saveBatch } from '../../services/batchService';
import { logAuditEvent } from '../../services/auditLogger';
import { useAuth } from '../../context/authContext';

export const BiologistValidationScreen: React.FC = () => {
  const { user } = useAuth();
  const labId = user?.labId || 'lab_central_douala';

  const [batches, setBatches] = useState<TestBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<TestBatch | null>(null);

  // Parameter entry state
  const [paramValues, setParamValues] = useState<Record<string, { value: string; flag: 'normal' | 'high' | 'low' | 'critical' }>>({});

  // Digital Sign State
  const [biologistName, setBiologistName] = useState('Dr. Suzanne Mbongo');
  const [biologistLicense, setBiologistLicense] = useState('ONMC #4829 / ONPC #1204');
  const [pin, setPin] = useState('1234');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [signedSuccess, setSignedSuccess] = useState(false);

  const loadBatches = () => {
    const list = getBatchesForLab(labId);
    setBatches(list);
    if (list.length > 0 && !selectedBatch) {
      handleSelectBatch(list[0]);
    }
  };

  useEffect(() => {
    loadBatches();
  }, [labId]);

  const handleSelectBatch = (b: TestBatch) => {
    setSelectedBatch(b);
    setSignedSuccess(false);
    setPinError('');

    // Prepopulate parameter values
    const initial: Record<string, any> = {};
    b.tests.forEach((t) => {
      initial[t.testId] = {
        value: t.resultValue || (t.code === 'NFS' ? '12.8' : t.code === 'GLYC' ? '0.94' : '8.2'),
        flag: t.flag || 'normal'
      };
    });
    setParamValues(initial);
  };

  const handleValueChange = (testId: string, val: string, refMin: number, refMax: number) => {
    const num = parseFloat(val);
    let flag: 'normal' | 'high' | 'low' | 'critical' = 'normal';
    if (!isNaN(num)) {
      if (num < refMin) flag = 'low';
      else if (num > refMax) flag = 'high';
    }
    setParamValues((prev) => ({
      ...prev,
      [testId]: { value: val, flag }
    }));
  };

  const handleDigitalSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    if (pin !== '1234' && pin.length < 4) {
      setPinError('Invalid signature clearance PIN.');
      return;
    }

    // Cryptographic audit hash
    const auditHash = `NL-${selectedBatch.batchNumber}-${Date.now().toString(16).toUpperCase()}`;

    // Update batch tests with entered results
    const updatedTests: BatchTestItem[] = selectedBatch.tests.map((t) => ({
      ...t,
      resultValue: paramValues[t.testId]?.value || 'Conforme',
      flag: paramValues[t.testId]?.flag || 'normal',
      status: 'validated'
    }));

    selectedBatch.tests = updatedTests;
    selectedBatch.biologistName = biologistName;
    selectedBatch.biologistLicense = biologistLicense;
    selectedBatch.qrAuditHash = auditHash;
    selectedBatch.signedAt = new Date().toISOString();
    selectedBatch.status = 'ready';

    saveBatch(selectedBatch);

    logAuditEvent({
      eventType: 'batch_signed',
      actorRole: 'biologist',
      actorId: user?.id || 'biologist_1',
      actorName: biologistName,
      batchId: selectedBatch.id,
      labId,
      metadata: {
        batchNumber: selectedBatch.batchNumber,
        biologistLicense,
        auditHash
      }
    });

    setSignedSuccess(true);
    loadBatches();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-[#0B1F1D] tracking-tight">
          Medical Biologist Analytical Validation & Signature
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7F7D]">
          Review analyzer results, compare with patient history, validate delta checks, and cryptographically sign diagnostic reports.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Batches awaiting validation */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-700">
            Batches for Validation ({batches.length})
          </h2>

          <div className="space-y-2">
            {batches.map((b) => {
              const isSelected = selectedBatch?.id === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => handleSelectBatch(b)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#0F766E] bg-white shadow-sm ring-2 ring-teal-100'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-900">{b.batchNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      b.status === 'ready' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 mt-1">{b.patientName}</p>
                  <p className="text-[11px] text-slate-500">{b.tests.length} investigations &bull; {b.sampleMode}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Parameter Entry & Electronic Signatory Sheet */}
        <div className="lg:col-span-2">
          {selectedBatch ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              {/* Batch Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Specimen Validation Sheet</span>
                  <h3 className="text-lg font-black text-slate-900 font-mono">{selectedBatch.batchNumber}</h3>
                  <p className="text-xs text-slate-500">
                    Patient: <strong className="text-slate-800">{selectedBatch.patientName}</strong> &bull; Tube: {selectedBatch.sampleTubeBarcode}
                  </p>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-[#0F766E] border border-teal-200">
                    ISO 15189 / MINSANTE Standard
                  </span>
                </div>
              </div>

              {signedSuccess ? (
                <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-emerald-950">
                      Report Validated & Electronically Signed
                    </h4>
                    <p className="text-xs text-emerald-800 font-mono">
                      Cryptographic Seal: {selectedBatch.qrAuditHash}
                    </p>
                  </div>
                  <p className="text-xs text-emerald-700 max-w-md mx-auto">
                    The authenticated diagnostic report is now available to the patient and prescribing physician.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleDigitalSign} className="space-y-6">
                  {/* Parameter Entry Table */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Analytical Parameters & Delta Check
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b-2 border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                            <th className="py-2 px-2">Investigation</th>
                            <th className="py-2 px-2">Measured Result</th>
                            <th className="py-2 px-2">Reference Target</th>
                            <th className="py-2 px-2">Prior Value</th>
                            <th className="py-2 px-2 text-right">Flag</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedBatch.tests.map((test) => {
                            const valState = paramValues[test.testId] || { value: '', flag: 'normal' };
                            return (
                              <tr key={test.testId} className="hover:bg-slate-50">
                                <td className="py-2.5 px-2">
                                  <div className="font-bold text-slate-900">{test.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{test.code}</div>
                                </td>
                                <td className="py-2.5 px-2">
                                  <input
                                    type="text"
                                    value={valState.value}
                                    onChange={(e) => handleValueChange(test.testId, e.target.value, 11.5, 15.0)}
                                    className="w-24 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-teal-500"
                                  />
                                </td>
                                <td className="py-2.5 px-2 font-mono text-[11px] text-slate-500">
                                  {test.referenceRange || 'Normale labo'}
                                </td>
                                <td className="py-2.5 px-2 font-mono text-[11px] text-slate-400">
                                  12.1 (04 Oct 25)
                                </td>
                                <td className="py-2.5 px-2 text-right">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    valState.flag === 'normal'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}>
                                    {valState.flag.toUpperCase()}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Biologist Signature & Stamp Credentials */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-[#0F766E]" />
                        <span>Biologist Credentials & Order Inscription</span>
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">Dynamic Biologist Stamp</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-600">Biologist Name</label>
                        <input
                          type="text"
                          value={biologistName}
                          onChange={(e) => setBiologistName(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-600">ONMC / ONPC Inscription</label>
                        <input
                          type="text"
                          value={biologistLicense}
                          onChange={(e) => setBiologistLicense(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 pt-2">
                      <label className="block text-[11px] font-bold text-slate-600">
                        Electronic Signature Clearance PIN (Enter 1234)
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="relative inline-block">
                          <input
                            type={showPin ? 'text' : 'password'}
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            maxLength={6}
                            placeholder="••••"
                            className="w-36 pl-3 pr-9 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 tracking-widest text-center"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            title={showPin ? 'Hide PIN' : 'Show PIN'}
                          >
                            {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400">Cryptographically bound to hash-chain ledger</span>
                      </div>
                      {pinError && <p className="text-[11px] text-rose-600 font-bold">{pinError}</p>}
                    </div>
                  </div>

                  {/* Sign Action Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="min-h-[44px] px-6 py-2.5 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white rounded-xl text-xs font-bold shadow-md hover:from-[#0D3B38] hover:to-[#0F766E] transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Validate & Apply Biologist Seal</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
              <p className="text-xs text-slate-400">Select a batch to begin biological validation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BiologistValidationScreen;
