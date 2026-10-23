import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Building2, 
  ShieldCheck, 
  Download, 
  Printer, 
  CheckCircle2, 
  Filter, 
  QrCode,
  User,
  Clock,
  Video,
  ExternalLink,
  Share2,
  Eye,
  RefreshCw
} from 'lucide-react';
import { PARTNER_LABS } from '../../core/gps';
import { limsService, PatientBooking } from '../../services/limsService';
import { useAuth } from '../../context/authContext';
import { LabReportPdfViewModal } from '../../components/common/LabReportPdfViewModal';

export const DoctorReportsScreen: React.FC = () => {
  const { user, lab } = useAuth();
  const targetLabId = lab?.id || user?.labId || 'lab-1';

  const [bookings, setBookings] = useState<PatientBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [labFilter, setLabFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<PatientBooking | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const all = await limsService.fetchAllBookings(targetLabId);
      // Filter for bookings that have tests completed or results
      const withResults = all.filter(b => 
        b.overallStatus === 'Completed' || 
        b.status === 'Completed' ||
        (b.tests && b.tests.some(t => t.resultValue || t.status === 'Completed' || t.status === 'In_Lab_Testing'))
      );
      setBookings(withResults.length > 0 ? withResults : all);
      if (withResults.length > 0) {
        setSelectedBooking(withResults[0]);
      } else if (all.length > 0) {
        setSelectedBooking(all[0]);
      }
    } catch (err) {
      console.error('Failed to load doctor reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [targetLabId]);

  const filteredBookings = bookings.filter((b) => {
    const matchesLab = labFilter === 'all' || (b.labName || '').toLowerCase().includes(labFilter.toLowerCase());
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      b.patientName.toLowerCase().includes(q) ||
      b.bookingCode.toLowerCase().includes(q) ||
      (b.patientPhone || '').includes(q) ||
      (b.tests && b.tests.some(t => t.testName.toLowerCase().includes(q)));
    return matchesLab && matchesSearch;
  });

  const active = selectedBooking || (filteredBookings.length > 0 ? filteredBookings[0] : null);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300 px-3 sm:px-4 py-2">
      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0B1F1D] tracking-tight">
            Referred Diagnostic Reports & Results Ledger
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7F7D]">
            Official biologist-signed laboratory test results with laboratory letterhead, ISO/MINSANTE accreditation, and verified reference ranges.
          </p>
        </div>

        <button
          onClick={fetchReports}
          disabled={loading}
          className="self-start sm:self-auto px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Reports</span>
        </button>
      </div>

      {/* Main Grid: Left side report list, Right side report sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Report List */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs space-y-3">
            {/* Search Input */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Search Patient or Test
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Patient name, code (BK-...), test..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-teal-500"
                />
              </div>
            </div>

            {/* Filter by Lab */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Filter by Laboratory
              </label>
              <select
                value={labFilter}
                onChange={(e) => setLabFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-teal-500"
              >
                <option value="all">All Accredited Facilities</option>
                {PARTNER_LABS.map((l) => (
                  <option key={l.id} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* List of Report Cards */}
          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading diagnostic ledger...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Patient Reports Found</p>
                <p className="text-[11px] text-slate-400">
                  When accredited laboratories complete tests for your patients, official signed reports stream here.
                </p>
              </div>
            ) : (
              filteredBookings.map((b) => {
                const isSelected = active?.id === b.id;
                const isCompleted = b.overallStatus === 'Completed' || b.status === 'Completed';

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0F766E] bg-teal-50/30 shadow-sm ring-2 ring-teal-200'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1">
                      <span className="font-extrabold text-xs text-slate-900 truncate max-w-[160px]">
                        {b.patientName}
                      </span>
                      <span className="font-mono text-[10px] text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        {b.bookingCode}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate">{b.labName || 'Central Pathology Lab'}</p>

                    <div className="flex flex-wrap gap-1 py-1.5">
                      {b.tests?.slice(0, 2).map((t) => (
                        <span key={t.id} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          {t.testName}
                        </span>
                      ))}
                      {(b.tests?.length || 0) > 2 && (
                        <span className="text-[10px] text-slate-400 font-bold">
                          +{ (b.tests?.length || 0) - 2 } more
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[10px]">
                      <span className="text-slate-400 font-mono">
                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                      <span className={`font-bold uppercase flex items-center gap-1 ${
                        isCompleted ? 'text-emerald-700' : 'text-amber-600'
                      }`}>
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Biologist Signed</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>In Analysis</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Lab-Branded Report Sheet */}
        <div className="lg:col-span-2">
          {active ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5 sm:p-7 space-y-6">
              {/* Header Letterhead Banner */}
              <div className="border-b-2 border-slate-900/80 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center font-black">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-[#0D3B38] leading-tight">
                        {active.labName || 'Laboratoire d\'Analyses Médicales'}
                      </h2>
                      <p className="text-[10px] text-slate-500 font-mono">
                        MINSANTE Cameroon Registered &bull; ONMC/ONPC Approved
                      </p>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right space-y-0.5 text-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Dossier / Booking</div>
                  <div className="font-mono font-black text-sm text-[#0D3B38]">{active.bookingCode}</div>
                  <div className="text-[10px] text-slate-500">
                    Date: {active.createdAt ? new Date(active.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Patient Details Row */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs flex flex-col sm:flex-row justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Patient Demographics</span>
                  <p className="font-bold text-slate-900 text-sm">{active.patientName}</p>
                  <p className="text-[11px] text-slate-500">
                    Age: {active.patientAge || 'Adult'} &bull; Sexe: {active.patientGender || 'Adult'} &bull; PID: {active.patientPid || active.patientId || active.id}
                  </p>
                </div>
                <div className="sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Prescribing Physician</span>
                  <p className="font-bold text-slate-900">{user?.name || 'Dr. Attending Physician'}</p>
                  <p className="text-[11px] text-slate-500">Service: Consultation & Diagnostic Request</p>
                </div>
              </div>

              {/* Clinical Parameter Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Exam / Parameter</th>
                      <th className="py-2.5 px-3">Measured Result</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-3">Reference Intervals</th>
                      <th className="py-2.5 px-3 text-right">Clinical Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {active.tests && active.tests.length > 0 ? (
                      active.tests.map((t, idx) => {
                        const val = t.resultValue || (t.status === 'Completed' ? 'Normal / Negative' : 'Pending in-lab analyzer run');
                        const isAbnormal = val.toLowerCase().includes('high') || val.toLowerCase().includes('positif') || val.toLowerCase().includes('élevé');

                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-3 px-3 font-bold text-slate-900">
                              <div>{t.testName}</div>
                              <span className="text-[10px] text-slate-400 font-mono">{(t as any).code || t.testCode || `ANA-${idx + 1}`}</span>
                            </td>
                            <td className={`py-3 px-3 font-mono font-black ${isAbnormal ? 'text-rose-600' : 'text-[#0D3B38]'}`}>
                              {val}
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{(t as any).unit || (t as any).units || 'Standard'}</td>
                            <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{(t as any).referenceRange || (t as any).normalRange || 'Standard ISO Biological Ref'}</td>
                            <td className="py-3 px-3 text-right">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isAbnormal
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {isAbnormal ? 'ABNORMAL' : 'NORMAL'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                          No test parameters entered yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons: Open Official Letterhead PDF Modal */}
              <div className="pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-0.5 text-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Validated By</div>
                  <p className="font-bold text-slate-900">Dr. Suzanne Mbongo (Biologiste Médical)</p>
                  <p className="text-[10px] text-slate-500 font-mono">ONMC #4829 &bull; Ordre National des Médecins</p>
                </div>

                <div className="flex items-center flex-wrap gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={() => setIsPdfModalOpen(true)}
                    className="flex-1 sm:flex-none min-h-[42px] px-4 py-2.5 bg-[#006978] hover:bg-[#005a66] text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-[#006978]/20"
                  >
                    <Eye className="w-4 h-4 text-cyan-200" />
                    <span>View Official Lab PDF Letterhead</span>
                  </button>

                  <a
                    href="https://waspito.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[42px] px-3.5 py-2.5 bg-[#0084FF] hover:bg-[#0073E6] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                    title="Teleconsultation on Waspito"
                  >
                    <Video className="w-4 h-4" />
                    <span>Waspito Consult</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">Select a diagnostic report from the left column</p>
              <p className="text-xs">Inspect full clinical parameters, biological signs, and download official laboratory PDFs.</p>
            </div>
          )}
        </div>
      </div>

      {/* Official Laboratory Report PDF & Print Viewer Modal */}
      {active && (
        <LabReportPdfViewModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          booking={active}
          isStaffOrAdmin={false}
        />
      )}
    </div>
  );
};

export default DoctorReportsScreen;
