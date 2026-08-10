import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { collection, getDocs, updateDoc, doc } from '../../services/firebase';
import { db } from '../../services/firebase';
import { authService } from '../../services/authService';
import { auditService } from '../../services/auditService';
import { 
  Microscope, 
  CheckCircle2, 
  Clock, 
  Search, 
  RefreshCw, 
  Syringe, 
  User, 
  Key, 
  X,
  Lock,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  FlaskConical,
  Plus,
  Trash2,
  Package,
  Layers
} from 'lucide-react';
import SearchableSpecimenSelect from '../../components/common/SearchableSpecimenSelect';

interface AnalyzerViewProps {
  onBack?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onRoleSwitcherPress?: () => void;
}

interface MaterialUsageItem {
  inventoryId: string;
  quantityUsed: number;
}

export const AnalyzerView: React.FC<AnalyzerViewProps> = ({
  onBack,
  onNotificationPress,
  onProfilePress,
  onRoleSwitcherPress
}) => {
  const { lab, user } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'collected'>('pending');
  
  // Modal & Access Code State
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Materials & Chemicals Used State
  const [usedMaterialsCheckbox, setUsedMaterialsCheckbox] = useState(false);
  const [materialsUsedList, setMaterialsUsedList] = useState<MaterialUsageItem[]>([]);

  const fetchTestsAndInventory = async () => {
    try {
      setLoading(true);
      const targetLabId = lab?.id || 'lab-1';

      // 1. Fetch Patients & Tests
      const patientsSnapshot = await getDocs(collection(db, 'labs', targetLabId, 'patients'));
      const allTests: any[] = [];

      patientsSnapshot.docs.forEach(docSnap => {
        const patientData = docSnap.data();
        if (patientData.labTests && Array.isArray(patientData.labTests)) {
          patientData.labTests.forEach((test: any) => {
            const isPaid = test.paymentStatus === 'paid' || test.paid === true;
            allTests.push({
              ...test,
              patientId: docSnap.id,
              patientName: patientData.name || patientData.fullName || 'Patient Record',
              patientCode: patientData.patientId || patientData.accessCode || 'P-1000',
              age: patientData.age,
              gender: patientData.gender,
              isPaid
            });
          });
        }
      });

      setTests(allTests);

      // 2. Fetch Laboratory Inventory / Chemicals
      const invSnap = await getDocs(collection(db, 'labs', targetLabId, 'inventory'));
      const invItems = invSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setInventoryList(invItems);
    } catch (err) {
      console.error('Error fetching sample collection tests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTestsAndInventory();
  }, [lab?.id]);

  const handleOpenCollectModal = async (test: any) => {
    if (!test.isPaid) {
      alert('Cannot collect sample: Patient payment has not been verified by Cashier yet.');
      return;
    }
    setSelectedTest(test);
    setAccessCodeInput('');
    setVerifyError('');
    setUsedMaterialsCheckbox(false);
    
    // Default initial material if inventory exists
    if (inventoryList.length > 0) {
      setMaterialsUsedList([{ inventoryId: inventoryList[0].id, quantityUsed: 1 }]);
    } else {
      setMaterialsUsedList([]);
    }
    
    setShowCollectModal(true);

    // Cryptographically sealed Audit Log: Log sample collector viewing patient accessioning card
    try {
      await auditService.logPatientAccess({
        labId: lab?.id || 'lab-1',
        labName: lab?.name || 'nanoLabs Facility',
        patientId: test.patientId || test.id,
        patientName: test.patientName || test.name || 'Patient Record',
        patientCode: test.patientCode || test.patientId,
        action: 'COLLECT_SAMPLE',
        performedBy: {
          id: user?.id || 'staff',
          name: user?.name || 'Sample Collector',
          role: user?.role || 'analyzer',
          email: user?.email
        },
        testId: test.id,
        testName: test.testName || test.name,
        details: 'Accessed patient sample collection requisition & materials intake'
      });
    } catch (err) {
      console.warn('Audit log error (non-blocking):', err);
    }
  };

  const handleAddMaterialRow = () => {
    if (inventoryList.length === 0) return;
    setMaterialsUsedList(prev => [
      ...prev,
      { inventoryId: inventoryList[0]?.id || '', quantityUsed: 1 }
    ]);
  };

  const handleRemoveMaterialRow = (index: number) => {
    setMaterialsUsedList(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleMaterialChange = (index: number, field: keyof MaterialUsageItem, value: any) => {
    setMaterialsUsedList(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleConfirmCollectionWithCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setVerifyError('');

    if (!accessCodeInput.trim()) {
      setVerifyError('Sample Collector / Analyzer access code is required.');
      return;
    }

    // Validate materials if checked
    let validatedMaterials: any[] = [];
    if (usedMaterialsCheckbox) {
      if (materialsUsedList.length === 0) {
        setVerifyError('Please select at least one material or uncheck the materials box.');
        return;
      }

      for (const row of materialsUsedList) {
        const invItem = inventoryList.find(i => i.id === row.inventoryId);
        if (!invItem) {
          setVerifyError('Invalid inventory item selected.');
          return;
        }
        if (!row.quantityUsed || Number(row.quantityUsed) <= 0) {
          setVerifyError(`Please enter a valid positive quantity used for ${invItem.name}.`);
          return;
        }
        const currentQty = Number(invItem.quantity) || 0;
        const requestedQty = Number(row.quantityUsed);
        if (requestedQty > currentQty) {
          setVerifyError(`Insufficient stock for "${invItem.name}". Only ${currentQty} ${invItem.unit || 'units'} available.`);
          return;
        }

        validatedMaterials.push({
          inventoryId: invItem.id,
          name: invItem.name,
          category: invItem.category || 'Reagent',
          unit: invItem.unit || 'Units',
          quantityUsed: requestedQty,
          stockBefore: currentQty,
          stockAfter: Math.max(0, currentQty - requestedQty),
          usedAt: new Date().toISOString()
        });
      }
    }

    setProcessingId(`${selectedTest.patientId}-${selectedTest.id}`);
    try {
      // Validate staff code
      const authCheck = await authService.verifyStaffActionCode(
        accessCodeInput, 
        ['analyzer', 'labtech', 'superadmin', 'admin', 'receptionist'],
        user?.accessCode
      );

      if (!authCheck.authorized) {
        setVerifyError(authCheck.error || 'Invalid Sample Collector / Analyzer access code.');
        setProcessingId(null);
        return;
      }

      const targetLabId = lab?.id || 'lab-1';
      const staffName = authCheck.staffName || user?.name || 'Sample Collector';

      // 1. Decrement Inventory in Firestore for each consumed material
      if (usedMaterialsCheckbox && validatedMaterials.length > 0) {
        for (const item of validatedMaterials) {
          const invRef = doc(db, 'labs', targetLabId, 'inventory', item.inventoryId);
          await updateDoc(invRef, {
            quantity: item.stockAfter,
            lastConsumedBy: staffName,
            lastConsumedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }

      // 2. Update Patient Test Record
      const patientRef = doc(db, 'labs', targetLabId, 'patients', selectedTest.patientId);
      const patientsSnap = await getDocs(collection(db, 'labs', targetLabId, 'patients'));
      const targetDoc = patientsSnap.docs.find(d => d.id === selectedTest.patientId);

      if (targetDoc) {
        const patientData = targetDoc.data();
        const updatedTests = (patientData.labTests || []).map((t: any) => {
          if (t.id === selectedTest.id) {
            return {
              ...t,
              status: 'collected',
              sampleCollected: true,
              collectedDate: new Date().toISOString().split('T')[0],
              collectedBy: staffName,
              collectorCode: accessCodeInput,
              materialsUsed: usedMaterialsCheckbox ? validatedMaterials : (t.materialsUsed || null)
            };
          }
          return t;
        });

        await updateDoc(patientRef, { 
          labTests: updatedTests,
          updatedAt: new Date().toISOString()
        });

        // Cryptographically sealed Audit Log: Specimen collection and inventory deduction
        await auditService.logPatientAccess({
          labId: targetLabId,
          labName: lab?.name || 'nanoLabs Facility',
          patientId: selectedTest.patientId || selectedTest.id,
          patientName: selectedTest.patientName || selectedTest.name || 'Patient Record',
          patientCode: selectedTest.patientCode || selectedTest.patientId,
          action: 'COLLECT_SAMPLE',
          performedBy: {
            id: user?.id || 'staff',
            name: staffName || user?.name || 'Sample Collector',
            role: user?.role || 'analyzer',
            email: user?.email
          },
          testId: selectedTest.id,
          testName: selectedTest.testName || selectedTest.name,
          details: `Specimen physically collected & accessioned into laboratory${usedMaterialsCheckbox && validatedMaterials.length > 0 ? ` (${validatedMaterials.length} materials/reagents deducted)` : ''}`
        });
      }

      setShowCollectModal(false);
      await fetchTestsAndInventory();
    } catch (err: any) {
      console.error('Failed to collect specimen and deduct inventory:', err);
      setVerifyError(err?.message || 'Failed to confirm sample collection.');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCollection = tests.filter(t => t.status === 'requested' || (!t.sampleCollected && t.status !== 'completed'));
  const collectedSamples = tests.filter(t => t.sampleCollected || t.status === 'collected' || t.status === 'completed');

  const filteredTests = (activeTab === 'pending' ? pendingCollection : collectedSamples).filter(t => 
    t.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.patientCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Analyzer & Sample Collection Station"
        subtitle="Collect biological specimens, track chemical/reagent usage & accession lab samples"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
        onRoleSwitcherPress={onRoleSwitcherPress}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-purple-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {/* Branded Lab Gradient Banner */}
        <div 
          style={{
            background: `linear-gradient(135deg, ${lab?.primaryColor || '#7e22ce'}, ${lab?.secondaryColor || '#4338ca'})`
          }}
          className="rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6"
        >
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-white/90 border border-white/20">
              <Microscope className="w-3.5 h-3.5" />
              Phlebotomy & Specimen Accession Analyzer Station
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {lab?.name || 'nanoLabs Health Center'}
            </h2>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              Accession paid patient diagnostic tests, log consumed reagents with real-time stock deduction, and barcode specimens for analysis.
            </p>
          </div>

          {/* Big Circled Logo at right side */}
          <div className="shrink-0 self-center sm:self-auto">
            {lab?.logoUrl ? (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white/40 bg-white/10 backdrop-blur-md shadow-2xl p-1 flex items-center justify-center overflow-hidden">
                <img
                  src={lab.logoUrl}
                  alt={lab.name || 'Lab Logo'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-full object-cover bg-white"
                />
              </div>
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white/40 bg-white/20 backdrop-blur-md shadow-2xl flex items-center justify-center text-white">
                <Microscope className="w-10 h-10 stroke-[2.5]" />
              </div>
            )}
          </div>
        </div>

        {/* Top Control Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
              <Microscope className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Specimen Collection & Analyzer Station</h2>
              <p className="text-xs text-slate-500">
                Accession paid patient tests, log consumed reagents & automatically reduce inventory stock accurately
              </p>
            </div>
          </div>

          <button 
            onClick={() => { setRefreshing(true); fetchTestsAndInventory(); }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-purple-600' : ''}`} />
            Refresh Queue & Stock
          </button>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-purple-50/80 border border-purple-200/80 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600 shrink-0">
              <Syringe className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{pendingCollection.length}</div>
              <div className="text-xs font-bold text-purple-800">Pending Collection</div>
              <p className="text-[11px] text-purple-700/80 mt-0.5">Patients queued for specimen sampling</p>
            </div>
          </div>

          <div className="bg-blue-50/80 border border-blue-200/80 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{collectedSamples.length}</div>
              <div className="text-xs font-bold text-blue-800">Specimens Accessioned</div>
              <p className="text-[11px] text-blue-700/80 mt-0.5">Samples verified with reagent logs</p>
            </div>
          </div>

          <div className="bg-teal-50/80 border border-teal-200/80 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-700 shrink-0">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{inventoryList.length}</div>
              <div className="text-xs font-bold text-teal-800">Connected Reagents & Stock</div>
              <p className="text-[11px] text-teal-700/80 mt-0.5">Live items in inventory manager</p>
            </div>
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending Collection ({pendingCollection.length})
            </button>
            <button
              onClick={() => setActiveTab('collected')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'collected'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Collected Samples ({collectedSamples.length})
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search patient, test or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
          </div>
        </div>

        {/* Content Table/List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Loading specimen workqueue & inventory...
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="py-16 text-center px-4 space-y-2">
              <Syringe className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">No tests found</p>
              <p className="text-xs text-slate-500">
                {activeTab === 'pending' 
                  ? 'No patients waiting for sample collection right now.' 
                  : 'No historical specimen logs recorded.'}
              </p>
            </div>
          ) : (
            filteredTests.map((test) => {
              const testKey = `${test.patientId}-${test.id}`;

              return (
                <div key={testKey} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{test.testName || test.name}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        {test.category || 'Specimen Test'}
                      </span>

                      {!test.isPaid && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Unpaid (Cashier Verification Needed)
                        </span>
                      )}

                      {test.materialsUsed && Array.isArray(test.materialsUsed) && test.materialsUsed.length > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                          <FlaskConical className="w-3 h-3 text-teal-600" />
                          {test.materialsUsed.length} Reagents/Materials Deducted
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {test.patientName} ({test.patientCode})
                      </span>
                      {test.age && <span>• {test.age} yrs, {test.gender}</span>}
                      {test.collectedBy && <span>• Collected by: {test.collectedBy}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {test.sampleCollected || test.status === 'collected' || test.status === 'completed' ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        Specimen Accessioned
                      </span>
                    ) : !test.isPaid ? (
                      <button
                        disabled
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-semibold cursor-not-allowed border border-slate-200"
                        title="Cashier payment verification required before sample collection"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Awaiting Payment
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenCollectModal(test)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                      >
                        <Syringe className="w-4 h-4" />
                        Collect Specimen & Log Materials
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Access Code & Materials Verification Modal */}
      {showCollectModal && selectedTest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="p-5 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <ShieldCheck className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Analyzer Confirmation & Substance Log</h3>
                  <p className="text-purple-200 text-xs">Accession specimen & update live inventory</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCollectModal(false)}
                className="text-purple-200 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCollectionWithCode} className="p-6 space-y-4 text-xs">
              {/* Test summary info */}
              <div className="bg-purple-50/80 p-3.5 rounded-2xl border border-purple-200 text-purple-900 space-y-1">
                <div className="font-bold text-sm">{selectedTest.testName || selectedTest.name}</div>
                <div>Patient: <strong>{selectedTest.patientName} ({selectedTest.patientCode})</strong></div>
                <div className="text-[11px] text-purple-700 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Payment Status: Verified by Cashier (Paid)
                </div>
              </div>

              {verifyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              {/* CRITICAL FEATURE: Material / Chemical usage Checkbox */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={usedMaterialsCheckbox}
                    onChange={(e) => setUsedMaterialsCheckbox(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">
                      Did you use any laboratory materials, chemicals, or reagents for this test?
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Check this box to select substances from the inventory manager. The quantities used will be deducted accurately from laboratory stock.
                    </span>
                  </div>
                </label>

                {/* Conditional Material Dropdowns & Quantities */}
                {usedMaterialsCheckbox && (
                  <div className="pt-3 border-t border-slate-200 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-950 text-[11px] uppercase tracking-wider flex items-center gap-1">
                        <FlaskConical className="w-3.5 h-3.5 text-purple-700" />
                        Select Consumed Chemicals & Quantity
                      </span>
                      <button
                        type="button"
                        onClick={handleAddMaterialRow}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-100/70 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Add Another Substance
                      </button>
                    </div>

                    {inventoryList.length === 0 ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                        No inventory records found in this lab. You can add chemicals in Inventory Management.
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                        {materialsUsedList.map((row, idx) => {
                          const currentSelectedInv = inventoryList.find(i => i.id === row.inventoryId);
                          const currentStock = currentSelectedInv?.quantity ?? 0;
                          const currentUnit = currentSelectedInv?.unit ?? 'units';
                          const isLow = currentStock <= (currentSelectedInv?.reorderLevel || 5);

                          return (
                            <div 
                              key={idx} 
                              className="p-3 bg-white rounded-xl border border-purple-200/80 shadow-2xs space-y-2"
                            >
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <SearchableSpecimenSelect
                                    items={inventoryList}
                                    value={row.inventoryId}
                                    onChange={(newInvId) => handleMaterialChange(idx, 'inventoryId', newInvId)}
                                    label={`Specimen, Chemical or Reagent #${idx + 1}`}
                                    placeholder="Search specimen/tube/chemical..."
                                  />
                                </div>

                                <div className="w-32">
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                    Quantity Used
                                  </label>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="any"
                                      min="0.01"
                                      max={currentStock}
                                      value={row.quantityUsed}
                                      onChange={(e) => handleMaterialChange(idx, 'quantityUsed', parseFloat(e.target.value) || 0)}
                                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                  </div>
                                </div>

                                {materialsUsedList.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMaterialRow(idx)}
                                    className="p-2 mt-5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl cursor-pointer"
                                    title="Remove this material"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>

                              {/* Live deduction forecast */}
                              {currentSelectedInv && (
                                <div className="flex items-center justify-between text-[10px] pt-1 text-slate-500 border-t border-slate-100">
                                  <span>Unit: <strong>{currentUnit}</strong></span>
                                  <span>
                                    Stock change: <strong className="text-slate-700">{currentStock}</strong> ➔ <strong className="text-purple-700 font-bold">{Math.max(0, currentStock - (row.quantityUsed || 0))} {currentUnit}</strong>
                                  </span>
                                  {isLow && (
                                    <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                      ⚠️ Low Stock
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Staff Access Code Authorization */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-purple-600" />
                  Enter Analyzer / Collector Access Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="e.g. ANALYZER123 or TECH123"
                  value={accessCodeInput}
                  onChange={(e) => setAccessCodeInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Use your staff code (e.g. ANALYZER123, SAMPLE123, TECH123) to sign specimen accession and deduct chemical stocks.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === `${selectedTest.patientId}-${selectedTest.id}`}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {processingId === `${selectedTest.patientId}-${selectedTest.id}` ? 'Authorizing & Updating Stock...' : 'Confirm Accession & Save Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyzerView;

