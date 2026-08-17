import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection } from '../../services/firebase';
import { limsService, PatientBooking } from '../../services/limsService';
import { 
  Microscope, 
  Search, 
  CheckCircle2, 
  TestTube, 
  Check, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  FileText,
  Users,
  FlaskConical,
  Droplets,
  Syringe,
  CheckSquare
} from 'lucide-react';

const COMMON_SAMPLE_MATRICES = [
  'Whole Blood (EDTA Purple Top Tube)',
  'Serum (SST Gold Top Clot Activator Tube)',
  'Plasma (Sodium Citrate Light Blue Tube)',
  'Fluoride Oxalate Glucose Plasma (Grey Top Tube)',
  'Midstream Clean-Catch Urine Container',
  'Fresh Stool Specimen Container',
  'Cervical / Endocervical Swab Tube',
  'Deep Sputum Sterile Bottle',
  'CSF / Sterile Body Fluid Tube'
];

interface AnalyzerViewProps {
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onRoleSwitcherPress?: () => void;
}

export const AnalyzerView: React.FC<AnalyzerViewProps> = ({ onNotificationPress , onProfilePress, onRoleSwitcherPress}) => {
  const { user, lab } = useAuth();
  const targetLabId = lab?.id || user?.labId || 'lab-1';

  const [bookings, setBookings] = useState<PatientBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected Booking Modal State
  const [selectedBooking, setSelectedBooking] = useState<PatientBooking | null>(null);
  const [checkedMatrices, setCheckedMatrices] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [targetLabId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const allBookings = await limsService.fetchAllBookings(targetLabId);
      // Filter for PAID bookings awaiting sample collection
      setBookings(allBookings.filter(b => b.paymentStatus === 'paid'));
    } catch (e) {
      console.error('Error fetching phlebotomy queue:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBooking = (b: PatientBooking) => {
    setSelectedBooking(b);
    // Pre-check sample matrices based on test requirements
    const required = new Set<string>();
    b.tests.forEach(t => {
      if (t.sampleTypeRequired) required.add(t.sampleTypeRequired);
    });
    setCheckedMatrices(Array.from(required));
  };

  const toggleMatrix = (matrix: string) => {
    if (checkedMatrices.includes(matrix)) {
      setCheckedMatrices(checkedMatrices.filter(m => m !== matrix));
    } else {
      setCheckedMatrices([...checkedMatrices, matrix]);
    }
  };

  const handleConfirmCollection = async () => {
    if (!selectedBooking) return;
    if (checkedMatrices.length === 0) {
      alert('Please check off at least one sample matrix physically drawn/collected.');
      return;
    }

    setIsSubmitting(true);
    try {
      await limsService.completeSampleCollection({
        labId: targetLabId,
        bookingId: selectedBooking.id,
        collectedSamples: checkedMatrices,
        collectorName: user?.name || 'Phlebotomist Collector'
      });

      setSelectedBooking(null);
      await fetchData();
    } catch (e) {
      console.error('Error completing sample collection:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCollection = bookings.filter(b => b.overallStatus === 'Pending_Collection');
  const filteredQueue = pendingCollection.filter(b => 
    b.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Header
        title="Phlebotomist & Sample Collection Workstation"
        subtitle="Step 3: Draw physical specimens, select sample matrices & label tubes. (No reagent interaction)"
        onProfilePress={onProfilePress}
        onRoleSwitcherPress={onRoleSwitcherPress}
        onNotificationPress={onNotificationPress}
      />

      {/* Mandatory LIMS Rule Banner */}
      <div className="bg-purple-900/90 text-white p-4 rounded-2xl border border-purple-700 shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0 font-bold">
            <Syringe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">Phlebotomy Mandatory Specimen Selection</h3>
            <p className="text-xs text-purple-100/80">
              Phlebotomists check off exact physical sample matrices drawn & label tubes with marker pens. No chemical reagents are logged at this stage.
            </p>
          </div>
        </div>

        <div className="text-right text-xs shrink-0 font-mono font-bold text-purple-200 bg-purple-950/60 px-3 py-1.5 rounded-xl border border-purple-800">
          Paid Queue: {pendingCollection.length}
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search paid patient name or Booking ID (BK-...)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Phlebotomy Digital Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-purple-600" />
            Paid Specimen Collection Queue ({filteredQueue.length})
          </h3>
          <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Payment Verified
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading phlebotomy queue...</div>
        ) : filteredQueue.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">No patients waiting for specimen collection.</p>
            <p className="text-slate-500">When the cashier marks an invoice as paid, the patient automatically appears here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredQueue.map((booking) => (
              <div key={booking.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      {booking.patientName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      {booking.bookingCode}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      PAID
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                    <span>Age/Sex: <strong>{booking.patientAge || 28} Yrs • {booking.patientGender || 'Male'}</strong></span>
                    <span>Ref Doctor: <strong>{booking.doctorName || 'Dr. Hiren Shah'}</strong></span>
                    <span>Tests: <strong className="text-purple-700 font-bold">{booking.tests.length} tests</strong></span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {booking.tests.map(t => (
                      <span key={t.id} className="px-2 py-0.5 bg-purple-50 text-purple-900 rounded-md text-[10px] border border-purple-200 font-medium">
                        {t.testName} ({t.sampleTypeRequired})
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleOpenBooking(booking)}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Syringe className="w-4 h-4" />
                  Collect Specimen Matrices
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SAMPLE MATRIX CHECKLIST MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative my-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Physical Specimen Matrix Checklist</h3>
                  <p className="text-xs text-purple-300">{selectedBooking.patientName} • {selectedBooking.bookingCode}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-2 text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              
              <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-1">
                <div className="text-slate-400">Ordered Tests for Booklet:</div>
                <div className="flex flex-wrap gap-1">
                  {selectedBooking.tests.map(t => (
                    <span key={t.id} className="px-2 py-0.5 bg-purple-950 border border-purple-500/40 text-purple-200 rounded-md font-medium">
                      {t.testName} <span className="text-[10px] text-slate-400">({t.sampleTypeRequired})</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-300 font-extrabold uppercase tracking-wider text-[11px]">
                  Check off physical sample matrices gathered:
                </label>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {COMMON_SAMPLE_MATRICES.map((matrix) => {
                    const isChecked = checkedMatrices.includes(matrix);
                    return (
                      <div
                        key={matrix}
                        onClick={() => toggleMatrix(matrix)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                          isChecked 
                            ? 'bg-purple-950/80 border-purple-500 text-white font-bold' 
                            : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                            isChecked ? 'bg-purple-500 border-purple-400 text-slate-950' : 'border-slate-600'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span>{matrix}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-amber-950/60 border border-amber-500/30 rounded-xl text-[11px] text-amber-200">
                ⚠️ <strong>Crucial LIMS Rule:</strong> Hand-label all drawn physical tubes with a marker pen before passing to the Lab Technician portal.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmCollection}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Saving Collection...' : 'Complete Collection ➔ Send to Lab Tech'}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
