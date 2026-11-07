import React, { useState, useEffect, useMemo } from 'react';
import {
  FlaskConical,
  Pill,
  Search,
  Plus,
  Trash2,
  Building2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useNav } from '../../components/doctor/nav';
import { SubScreenHeader, SectionCard } from '../../components/doctor/ui';
import {
  doctorPatientFirestoreService,
  FirestorePatientSummary,
} from '../../services/doctorPatientFirestoreService';
import { OFFICIAL_MASTER_TEST_CATALOG } from '../../data/officialTestCatalog';

interface PrescriptionScreenProps {
  initialPatientId?: string;
  initialPatientName?: string;
  initialPatientAlias?: string;
  initialPatientPid?: string;
  initialPatientPhone?: string;
  initialKind?: 'lab_tests' | 'medication';
  preselectedLabId?: string;
  preselectedLabName?: string;
}

export const PrescriptionScreen: React.FC<PrescriptionScreenProps> = ({
  initialPatientId = '',
  initialPatientName = '',
  initialPatientAlias = '',
  initialPatientPid = '',
  initialPatientPhone = '',
  initialKind = 'lab_tests',
  preselectedLabId = '',
  preselectedLabName = '',
}) => {
  const { user } = useAuth();
  const { pop, push, connections, refreshDossiers } = useNav();

  const [kind, setKind] = useState<'lab_tests' | 'medication'>(initialKind);

  // Selected Patient State
  const [patientId, setPatientId] = useState(initialPatientId);
  const [patientName, setPatientName] = useState(initialPatientName);
  const [patientAlias, setPatientAlias] = useState(initialPatientAlias);
  const [patientPid, setPatientPid] = useState(initialPatientPid);
  const [patientPhone, setPatientPhone] = useState(initialPatientPhone);

  const [patientQuery, setPatientQuery] = useState('');
  const [patientMatches, setPatientMatches] = useState<FirestorePatientSummary[]>([]);

  // Lab Tests State
  const [testSearch, setTestSearch] = useState('');
  const [selectedTests, setSelectedTests] = useState<
    Array<{ code: string; name: string; price: number; category: string }>
  >([]);
  const [realLabs, setRealLabs] = useState<any[]>([]);
  const [selectedLabId, setSelectedLabId] = useState(preselectedLabId);
  const [selectedLabName, setSelectedLabName] = useState(preselectedLabName);
  const [sendDirectlyToLab, setSendDirectlyToLab] = useState(Boolean(preselectedLabId));

  // Medication State
  const [medications, setMedications] = useState<
    Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions: string;
    }>
  >([{ name: '', dosage: '', frequency: 'Twice daily', duration: '5 days', instructions: '' }]);

  const [clinicalNotes, setClinicalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [doneResult, setDoneResult] = useState<{ bookingCode?: string } | null>(null);

  const connectedPatients = useMemo(
    () => connections.filter((c) => c.status === 'accepted'),
    [connections]
  );

  useEffect(() => {
    let active = true;
    doctorPatientFirestoreService.listRealLabs().then((labs) => {
      if (active) setRealLabs(labs);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const q = patientQuery.trim();
    if (!q) {
      setPatientMatches([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const list = await doctorPatientFirestoreService.searchPatientsForDoctor(q);
      if (!cancelled) setPatientMatches(list);
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [patientQuery]);

  const filteredCatalog = useMemo(() => {
    const q = testSearch.trim().toLowerCase();
    if (!q) return OFFICIAL_MASTER_TEST_CATALOG.slice(0, 12);
    return OFFICIAL_MASTER_TEST_CATALOG.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.aliases.some((a) => a.toLowerCase().includes(q))
    ).slice(0, 16);
  }, [testSearch]);

  const toggleTest = (item: { id: string; name: string; price: number; category: string }) => {
    setSelectedTests((prev) => {
      const exists = prev.some((x) => x.code === item.id || x.name === item.name);
      if (exists) {
        return prev.filter((x) => x.code !== item.id && x.name !== item.name);
      }
      return [
        ...prev,
        { code: item.id, name: item.name, price: item.price, category: item.category },
      ];
    });
  };

  const handleLabChange = (id: string) => {
    setSelectedLabId(id);
    const match = realLabs.find((l) => l.id === id);
    setSelectedLabName(match?.name || '');
    if (!id) setSendDirectlyToLab(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user?.id) {
      setErrorMsg('Authenticated physician session required.');
      return;
    }
    if (!patientId || !patientName) {
      setErrorMsg('Please select a patient first.');
      return;
    }

    if (kind === 'lab_tests' && selectedTests.length === 0) {
      setErrorMsg('Select at least one diagnostic laboratory test.');
      return;
    }

    if (kind === 'lab_tests' && sendDirectlyToLab && !selectedLabId) {
      setErrorMsg('Select a registered partner laboratory to transmit directly.');
      return;
    }

    const cleanMeds = medications.filter((m) => m.name.trim());
    if (kind === 'medication' && cleanMeds.length === 0) {
      setErrorMsg('Enter at least one medication.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await doctorPatientFirestoreService.createPrescriptionAndNotifyPatient({
        doctorId: user.id,
        doctorName: user.name || 'Dr. Physician',
        patientId,
        patientPid: patientPid || patientId,
        patientName,
        patientAlias,
        patientPhone,
        kind,
        prescribedTests: kind === 'lab_tests' ? selectedTests : undefined,
        recommendedLabId: selectedLabId || undefined,
        recommendedLabName: selectedLabName || undefined,
        sendDirectlyToLab: kind === 'lab_tests' ? sendDirectlyToLab : false,
        medications: kind === 'medication' ? cleanMeds : undefined,
        clinicalNotes: clinicalNotes.trim(),
      });

      await refreshDossiers();
      setDoneResult({ bookingCode: res.bookingCode });
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not dispatch clinical order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (doneResult) {
    return (
      <div className="min-h-[100dvh] bg-slate-50">
        <SubScreenHeader title="Clinical Order Dispatched" onBack={pop} encryptedBadge />
        <div className="max-w-xl mx-auto p-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-slate-900">
              {kind === 'lab_tests'
                ? 'Diagnostic Lab Order Sent'
                : 'Encrypted Prescription Delivered'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Delivered to <strong>{patientName}</strong> via AES-256-GCM encrypted clinical chat.
              {doneResult.bookingCode
                ? ` Also transmitted directly to ${selectedLabName}'s Receptionist Queue (Order #${doneResult.bookingCode}).`
                : kind === 'lab_tests'
                  ? ' The patient can book these tests in 1 tap at their preferred laboratory.'
                  : ''}
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() =>
                  push({
                    name: 'conversation',
                    patientId,
                    patientName,
                    patientAlias,
                    patientPid,
                    patientPhone,
                  })
                }
                className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer"
              >
                Open Encrypted Chat
              </button>
              <button
                type="button"
                onClick={pop}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <SubScreenHeader
        title={kind === 'lab_tests' ? 'Order Diagnostic Lab Tests' : 'Prescribe Medication'}
        subtitle="Encrypted clinical transmission to patient & partner laboratory"
        onBack={pop}
        encryptedBadge
      />

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Order Mode Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-white border border-slate-200 rounded-2xl p-1.5">
          <button
            type="button"
            onClick={() => setKind('lab_tests')}
            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
              kind === 'lab_tests'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            Diagnostic Lab Tests
          </button>
          <button
            type="button"
            onClick={() => setKind('medication')}
            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
              kind === 'medication'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Pill className="w-4 h-4" />
            Medication Rx
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Step 1: Select Patient */}
        <SectionCard title="1. Recipient Patient">
          {patientId ? (
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-teal-50/70 border border-teal-200">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {patientName}{' '}
                  {patientAlias && (
                    <span className="font-mono text-xs text-teal-700">@{patientAlias}</span>
                  )}
                </p>
                <p className="text-xs text-slate-500 font-mono">{patientPid || patientId}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPatientId('');
                  setPatientName('');
                  setPatientAlias('');
                  setPatientPid('');
                }}
                className="text-xs font-bold text-teal-800 hover:underline cursor-pointer"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {connectedPatients.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Select from Connected Patients
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {connectedPatients.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setPatientId(c.patientId);
                          setPatientName(c.patientName);
                          setPatientAlias(c.patientAlias);
                          setPatientPid(c.patientPid);
                          setPatientPhone(c.patientPhone || '');
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:border-teal-400 hover:bg-teal-50 text-xs font-bold text-slate-800 cursor-pointer"
                      >
                        {c.patientName} (@{c.patientAlias})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Or Search Registered Patient by @alias / PAT-ID
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={patientQuery}
                    onChange={(e) => setPatientQuery(e.target.value)}
                    placeholder="Type @alias, PAT-XXXXXX, or patient name..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm"
                  />
                </div>
                {patientMatches.length > 0 && (
                  <div className="mt-2 border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                    {patientMatches.slice(0, 6).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPatientId(p.id);
                          setPatientName(p.displayNameForSearch || p.name);
                          setPatientAlias(p.alias);
                          setPatientPid(p.patientId);
                          setPatientPhone(p.phone || '');
                          setPatientQuery('');
                        }}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-teal-50 flex items-center justify-between text-xs cursor-pointer"
                      >
                        <span className="font-bold text-slate-900">
                          {p.displayNameForSearch} (@{p.alias})
                        </span>
                        <span className="font-mono text-slate-400">{p.patientId}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Step 2A: Diagnostic Lab Tests */}
        {kind === 'lab_tests' && (
          <>
            <SectionCard
              title={`2. Diagnostic Assays (${selectedTests.length} selected)`}
              subtitle="Select clinical assays for the patient to book or for direct transmission to a laboratory"
            >
              {selectedTests.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-slate-100">
                  {selectedTests.map((t) => (
                    <span
                      key={t.code}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-xs font-bold text-teal-900"
                    >
                      {t.name}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedTests((prev) => prev.filter((x) => x.code !== t.code))
                        }
                        className="text-teal-700 hover:text-rose-600 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="relative mb-3">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                  placeholder="Search diagnostic assays (e.g. Full Blood Count, HbA1c, Malaria, Lipid Profile)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-base sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {filteredCatalog.map((item) => {
                  const active = selectedTests.some((x) => x.code === item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleTest(item)}
                      className={`text-left p-3 rounded-xl border transition-colors cursor-pointer flex items-start justify-between gap-2 ${
                        active
                          ? 'border-teal-500 bg-teal-50/70'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-500">{item.category}</p>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-600 shrink-0">
                        {item.price.toLocaleString()} XAF
                      </span>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              title="3. Partner Laboratory Routing (Optional)"
              subtitle="Leave blank to let the patient choose any registered laboratory, or select a specific registered laboratory"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    value={selectedLabId}
                    onChange={(e) => handleLabChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm text-slate-900"
                  >
                    <option value="">Patient chooses preferred registered laboratory</option>
                    {realLabs.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.city || 'Cameroon'})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedLabId && (
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendDirectlyToLab}
                      onChange={(e) => setSendDirectlyToLab(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-xs text-slate-700 leading-relaxed">
                      <strong>Transmit order directly to {selectedLabName}&apos;s Receptionist Queue</strong>{' '}
                      in addition to notifying the patient in encrypted chat.
                    </span>
                  </label>
                )}
              </div>
            </SectionCard>
          </>
        )}

        {/* Step 2B: Medications */}
        {kind === 'medication' && (
          <SectionCard
            title="2. Medication Regimen"
            action={
              <button
                type="button"
                onClick={() =>
                  setMedications((prev) => [
                    ...prev,
                    {
                      name: '',
                      dosage: '',
                      frequency: 'Twice daily',
                      duration: '5 days',
                      instructions: '',
                    },
                  ])
                }
                className="text-xs font-bold text-teal-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Drug
              </button>
            }
          >
            <div className="space-y-4">
              {medications.map((med, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Medication #{idx + 1}</span>
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setMedications((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) =>
                        setMedications((prev) =>
                          prev.map((m, i) => (i === idx ? { ...m, name: e.target.value } : m))
                        )
                      }
                      placeholder="Medication name (e.g. Amoxicillin)"
                      className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-xs"
                    />
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) =>
                        setMedications((prev) =>
                          prev.map((m, i) => (i === idx ? { ...m, dosage: e.target.value } : m))
                        )
                      }
                      placeholder="Dosage (e.g. 500mg)"
                      className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-xs"
                    />
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={(e) =>
                        setMedications((prev) =>
                          prev.map((m, i) => (i === idx ? { ...m, frequency: e.target.value } : m))
                        )
                      }
                      placeholder="Frequency (e.g. Every 8 hours)"
                      className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-xs"
                    />
                    <input
                      type="text"
                      value={med.duration}
                      onChange={(e) =>
                        setMedications((prev) =>
                          prev.map((m, i) => (i === idx ? { ...m, duration: e.target.value } : m))
                        )
                      }
                      placeholder="Duration (e.g. 7 days)"
                      className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Clinical Indication / Notes */}
        <SectionCard title="Clinical Indication & Patient Instructions">
          <textarea
            rows={3}
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder="Fasting requirements, clinical suspicion, or follow-up guidance..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </SectionCard>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Lock className="w-4 h-4" />
          )}
          {kind === 'lab_tests'
            ? sendDirectlyToLab
              ? `Transmit Order to ${selectedLabName || 'Lab'} & Notify Patient`
              : 'Send Encrypted Lab Test Request to Patient'
            : 'Send Encrypted Medication Prescription'}
        </button>
      </form>
    </div>
  );
};

export default PrescriptionScreen;
