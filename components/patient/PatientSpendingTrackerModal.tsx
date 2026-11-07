import React, { useState, useMemo } from 'react';
import {
  X,
  TrendingUp,
  Building2,
  PieChart,
  ShieldCheck,
  Receipt,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  DollarSign,
  Download,
  Share2,
  Users
} from 'lucide-react';
import { formatXAF } from '../../shared/money';
import { MedicalReceiptModal } from '../common/MedicalReceiptModal';
import { useFamilyProfile } from '../../context/familyProfileContext';

interface PatientSpendingTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: any[];
}

export const PatientSpendingTrackerModal: React.FC<PatientSpendingTrackerModalProps> = ({
  isOpen,
  onClose,
  bookings
}) => {
  const { familyMembers, activeProfile } = useFamilyProfile();
  const [timeframe, setTimeframe] = useState<'all' | 'year' | 'month'>('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<any | null>(null);

  if (!isOpen) return null;

  // Filter bookings based on timeframe & family member
  const filteredBookings = useMemo(() => {
    const now = new Date();
    const currentMonthPrefix = now.toISOString().slice(0, 7); // YYYY-MM
    const currentYearPrefix = String(now.getFullYear()); // YYYY

    return bookings.filter((b) => {
      // Must be paid or confirmed
      const isPaidOrCompleted =
        b.paymentStatus === 'paid' ||
        b.overallStatus === 'Completed' ||
        b.biologistSigned;

      if (!isPaidOrCompleted) return false;

      // Family member filter
      if (selectedMemberId !== 'all') {
        const belongsToMember =
          b.dependentProfileId === selectedMemberId ||
          b.familyProfileId === selectedMemberId ||
          b.patientId === selectedMemberId;
        if (!belongsToMember) return false;
      }

      // Timeframe filter
      const dateStr = b.paidAt || b.createdAt || '';
      if (timeframe === 'month') {
        return dateStr.startsWith(currentMonthPrefix);
      }
      if (timeframe === 'year') {
        return dateStr.startsWith(currentYearPrefix);
      }
      return true;
    });
  }, [bookings, timeframe, selectedMemberId]);

  // Aggregate financial metrics
  const {
    totalPatientPaid,
    totalInsuranceCovered,
    totalPlatformFees,
    totalGrossVolume,
    labSpendingMap,
    categorySpendingMap
  } = useMemo(() => {
    let patientPaid = 0;
    let insuranceCovered = 0;
    let platformFees = 0;
    let grossVolume = 0;

    const labMap = new Map<
      string,
      {
        name: string;
        address?: string;
        phone?: string;
        ordersCount: number;
        spent: number;
      }
    >();

    const catMap = new Map<string, { count: number; spent: number }>();

    filteredBookings.forEach((b) => {
      const netPaid = Number(b.actualPaidAmount ?? b.patientCoPayAmount ?? b.totalAmount) || 0;
      const insCovered = Number(b.insuranceCoveredAmount || b.insuranceClaimAmount) || 0;
      const pFee = Number(b.platformFeeAmount) || Math.round(netPaid * 0.05);
      const gross = netPaid + insCovered;

      patientPaid += netPaid;
      insuranceCovered += insCovered;
      platformFees += pFee;
      grossVolume += gross;

      // Lab aggregation
      const labName = b.labName || 'Laboratoire d\'analyses';
      const prevLab = labMap.get(labName) || {
        name: labName,
        address: b.labAddress,
        phone: b.labPhone,
        ordersCount: 0,
        spent: 0
      };
      prevLab.ordersCount += 1;
      prevLab.spent += netPaid;
      if (!prevLab.address && b.labAddress) prevLab.address = b.labAddress;
      if (!prevLab.phone && b.labPhone) prevLab.phone = b.labPhone;
      labMap.set(labName, prevLab);

      // Category aggregation
      const tests = Array.isArray(b.tests) ? b.tests : [];
      if (tests.length === 0) {
        const cat = 'Analyses Générales';
        const prevCat = catMap.get(cat) || { count: 0, spent: 0 };
        prevCat.count += 1;
        prevCat.spent += netPaid;
        catMap.set(cat, prevCat);
      } else {
        const perTestAmount = Math.round(netPaid / tests.length);
        tests.forEach((t: any) => {
          const cat = t.category || 'Biochimie & Hématologie';
          const prevCat = catMap.get(cat) || { count: 0, spent: 0 };
          prevCat.count += 1;
          prevCat.spent += perTestAmount;
          catMap.set(cat, prevCat);
        });
      }
    });

    return {
      totalPatientPaid: patientPaid,
      totalInsuranceCovered: insuranceCovered,
      totalPlatformFees: platformFees,
      totalGrossVolume: grossVolume,
      labSpendingMap: Array.from(labMap.values()).sort((a, b) => b.spent - a.spent),
      categorySpendingMap: Array.from(catMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.spent - a.spent)
    };
  }, [filteredBookings]);

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex min-h-full items-start sm:items-center justify-center p-2.5 sm:p-4">
        <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92dvh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-[#006978] to-[#004d40] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                <TrendingUp className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  Suivi des Dépenses de Santé &amp; Analyses
                </h2>
                <p className="text-xs text-teal-100">
                  Transparence totale sur vos règlements de bilans médicaux et dépenses par laboratoire
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Timeframe & Filter Bar */}
          <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            {/* Timeframe Pills */}
            <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
              {[
                { id: 'all', label: 'Tout l\'Historique' },
                { id: 'year', label: `Année ${new Date().getFullYear()}` },
                { id: 'month', label: 'Ce Mois' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeframe(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    timeframe === t.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Family Profile Member Filter */}
            {familyMembers.length > 1 && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:outline-hidden focus:border-[#006978]"
                >
                  <option value="all">Tous les bénéficiaires ({familyMembers.length})</option>
                  {familyMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.relationshipLabel})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-slate-900">
            {/* Key KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Out of pocket spent */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Dépenses Sorties de Poche
                </span>
                <p className="text-2xl font-black text-[#006978] font-mono tabular-nums">
                  {formatXAF(totalPatientPaid)}
                </p>
                <span className="text-[10px] text-slate-500">
                  {filteredBookings.length} lot(s) d&apos;analyses réglé(s)
                </span>
              </div>

              {/* Card 2: Insurance savings */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Économies Tiers-Payant
                </span>
                <p className="text-2xl font-black text-emerald-700 font-mono tabular-nums">
                  {formatXAF(totalInsuranceCovered)}
                </p>
                <span className="text-[10px] text-emerald-800 font-medium">
                  Prise en charge par votre assurance
                </span>
              </div>

              {/* Card 3: Platform mediation fee (5% per batch) */}
              <div className="p-4 bg-cyan-50/70 border border-cyan-200 rounded-2xl shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-cyan-900 uppercase tracking-wider block">
                  Frais nanoLabs (5% / Lot)
                </span>
                <p className="text-2xl font-black text-cyan-800 font-mono tabular-nums">
                  {formatXAF(totalPlatformFees)}
                </p>
                <span className="text-[10px] text-cyan-900 font-medium">
                  5% équitable par lot d&apos;analyses
                </span>
              </div>

              {/* Card 4: Gross Clinical Diagnostic Value */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Valeur Totale des Analyses
                </span>
                <p className="text-2xl font-black text-slate-800 font-mono tabular-nums">
                  {formatXAF(totalGrossVolume)}
                </p>
                <span className="text-[10px] text-slate-500">
                  Tarifs officiels de paillasse
                </span>
              </div>
            </div>

            {/* SPENDING BREAKDOWN PER LABORATORY */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#006978] flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Répartition des Dépenses par Laboratoire
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Consultez exactement combien a été réglé à chaque établissement agréé
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono text-slate-500">
                  {labSpendingMap.length} laboratoire(s)
                </span>
              </div>

              {labSpendingMap.length > 0 ? (
                <div className="space-y-3 pt-1">
                  {labSpendingMap.map((lab) => {
                    const pctOfTotal = totalPatientPaid > 0
                      ? Math.round((lab.spent / totalPatientPaid) * 100)
                      : 0;

                    return (
                      <div
                        key={lab.name}
                        className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 hover:bg-slate-100/70 transition"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-extrabold text-slate-900 text-sm block">
                              {lab.name}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {lab.address || 'Douala, Cameroun'} &middot; {lab.ordersCount} lot(s) de tests
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="font-mono tabular-nums font-black text-slate-900 text-sm block">
                              {formatXAF(lab.spent)}
                            </span>
                            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                              {pctOfTotal}% du budget santé
                            </span>
                          </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#006978] to-[#14B8A6] h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(4, pctOfTotal)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Aucun historique de dépense disponible pour la période sélectionnée.
                </p>
              )}
            </div>

            {/* SPENDING BY CLINICAL SPECIALTY */}
            {categorySpendingMap.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-800 flex items-center justify-center">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Dépenses par Spécialité Médicale
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Biologie clinique, biochimie, hématologie et sérologie
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {categorySpendingMap.map((cat) => (
                    <div
                      key={cat.name}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800 block">{cat.name}</span>
                        <span className="text-[10px] text-slate-500">{cat.count} analyse(s)</span>
                      </div>
                      <span className="font-mono tabular-nums font-black text-slate-900">
                        {formatXAF(cat.spent)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ITEMISED TRANSACTION LEDGER WITH INSTANT RECEIPT VIEW */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Historique Détaillé des Bilans Réglés ({filteredBookings.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Reçus officiels de caisse et traçabilité pour remboursement
                    </p>
                  </div>
                </div>
              </div>

              {filteredBookings.length > 0 ? (
                <div className="divide-y divide-slate-100 text-xs">
                  {filteredBookings.map((b) => {
                    const netPaid = Number(b.actualPaidAmount ?? b.patientCoPayAmount ?? b.totalAmount) || 0;
                    const dateFormatted = b.paidAt
                      ? new Date(b.paidAt).toLocaleDateString('fr-FR')
                      : b.createdAt
                        ? new Date(b.createdAt).toLocaleDateString('fr-FR')
                        : 'Récent';

                    return (
                      <div
                        key={b.id || b.bookingCode}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition p-2 rounded-xl"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-slate-900">
                              #{b.bookingCode || b.invoiceNumber || 'ORD'}
                            </span>
                            <span>&middot;</span>
                            <span className="font-extrabold text-[#006978]">
                              {b.labName || 'Laboratoire Partenaire'}
                            </span>
                            <span>&middot;</span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              {dateFormatted}
                            </span>
                            {b.hasInsurance && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Assurance {b.insuranceProvider}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-1">
                            {Array.isArray(b.tests)
                              ? b.tests.map((t: any) => t.testName || t.name).join(', ')
                              : 'Lot d\'analyses de laboratoire'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <div className="sm:text-right">
                            <span className="font-mono tabular-nums font-black text-slate-900 text-sm block">
                              {formatXAF(netPaid)}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-semibold">
                              Payé au laboratoire
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedReceiptBooking(b)}
                            className="px-3 py-1.5 bg-[#006978] hover:bg-[#005a66] text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Reçu</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Aucun bilan d&apos;analyse réglé pour les critères sélectionnés.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
            <span className="text-slate-500">
              nanoLabs Diagnostic Gateway &bull; Modèle équitable 5% par lot d&apos;analyses
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Medical Receipt Modal for Instant Proof */}
      {selectedReceiptBooking && (
        <MedicalReceiptModal
          isOpen={Boolean(selectedReceiptBooking)}
          onClose={() => setSelectedReceiptBooking(null)}
          booking={selectedReceiptBooking}
        />
      )}
    </>
  );
};
