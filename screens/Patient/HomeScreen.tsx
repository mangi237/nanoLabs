import React, { useState, useEffect } from 'react';
import { 
  Search, 
  FlaskConical, 
  Package, 
  Building2, 
  Stethoscope, 
  ShieldCheck, 
  ChevronRight, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Camera, 
  BookOpen, 
  Navigation,
  Sparkles,
  CreditCard,
  User,
  Inbox
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useFamilyProfile } from '../../context/familyProfileContext';
import { formatXAF } from '../../shared/money';
import { POPULAR_CATALOG_TESTS, TestCatalogItem } from './SearchTestsScreen';

interface HomeScreenProps {
  onNavigateScan: () => void;
  onNavigateBook: () => void;
  onNavigateTests: () => void;
  onNavigatePackage: () => void;
  onNavigateLabs: () => void;
  onNavigateDoctors: () => void;
  onNavigateInsurance: () => void;
  onNavigateTracking: () => void;
  onNavigateProfile: () => void;
  onSelectTest: (test: TestCatalogItem) => void;
  onOpenBatch?: (batchId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateScan,
  onNavigateBook,
  onNavigateTests,
  onNavigatePackage,
  onNavigateLabs,
  onNavigateDoctors,
  onNavigateInsurance,
  onNavigateTracking,
  onNavigateProfile,
  onSelectTest,
  onOpenBatch
}) => {
  const { user } = useAuth();
  const { activeProfile, isDependentActive } = useFamilyProfile();

  const [activeBooking, setActiveBooking] = useState<any | null>(null);
  const [profileBookings, setProfileBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch real bookings specifically for this active family member profile
  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        setLoading(true);
        const { limsService } = await import('../../services/limsService');
        const labId = user?.labId || 'lab-1';
        const allBookings = await limsService.fetchAllBookings(labId);

        // Filter bookings strictly for the active family member
        const matching = allBookings.filter(b => {
          const matchPid = b.patientPid === activeProfile.id || b.patientId === activeProfile.id;
          const matchName = b.patientName?.toLowerCase().trim() === activeProfile.fullName.toLowerCase().trim();
          return matchPid || matchName;
        });

        setProfileBookings(matching);

        // Check if there is an active (in-progress) order
        const active = matching.find(b => b.overallStatus !== 'Completed');
        setActiveBooking(active || null);
      } catch (err) {
        console.warn('Error fetching family member bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, [user, activeProfile]);

  // Real spend calculations for this family member by lab
  const spendByLab: Record<string, number> = {};
  let totalMemberSpend = 0;

  profileBookings.forEach(b => {
    if (b.paymentStatus === 'paid') {
      const labKey = b.labName || 'Performing Lab';
      const amount = Number(b.totalAmount) || 0;
      spendByLab[labKey] = (spendByLab[labKey] || 0) + amount;
      totalMemberSpend += amount;
    }
  });

  const popularTests = POPULAR_CATALOG_TESTS.slice(0, 4);

  const getSalutation = () => {
    const gender = (activeProfile.gender || user?.gender || '').toLowerCase();
    if (gender.includes('fem') || gender.includes('wom') || gender === 'f') return 'Mme.';
    if (gender.includes('mal') || gender.includes('man') || gender === 'm') return 'Sir';
    return 'M./Mme.';
  };

  return (
    <div className="max-w-4xl mx-auto py-2 text-slate-900 animate-in fade-in duration-300 space-y-6">
      {/* 1. TOP STATUS & GREETING BAR */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            Health Portal &bull; CEMAC Diagnostic Hub 👋
            {isDependentActive && (
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                {activeProfile.relationshipLabel} Dossier
              </span>
            )}
          </span>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Good morning {getSalutation()} {activeProfile.fullName}
          </h1>
        </div>

        <button
          onClick={onNavigateProfile}
          className="relative focus:outline-hidden cursor-pointer"
          title="View profile"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#006978] text-white flex items-center justify-center font-black text-base shadow-xs border-2 border-white">
            {activeProfile.fullName.charAt(0).toUpperCase()}
          </div>
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 absolute bottom-0 right-0 border-2 border-white" />
        </button>
      </div>

      {/* 2. SEARCH BAR (Tests or Labs without fixed prices) */}
      <div
        onClick={onNavigateTests}
        className="relative bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-3 cursor-pointer hover:border-[#006978] transition-all"
      >
        <Search className="w-4 h-4 text-slate-400" />
        <span className="text-xs sm:text-sm font-medium text-slate-400 select-none">
          Search tests or health packages across partner laboratories...
        </span>
      </div>

      {/* 3. QUICK ACTION 4 ICONS (Modern Grid) */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        <button
          onClick={onNavigateTests}
          className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-3xl bg-white border border-slate-200 hover:border-[#006978] hover:bg-[#E0F2F1]/30 transition-all cursor-pointer shadow-xs group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
            <FlaskConical className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-slate-800 group-hover:text-[#006978]">
            Tests
          </span>
        </button>

        <button
          onClick={onNavigatePackage}
          className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-3xl bg-white border border-slate-200 hover:border-[#006978] hover:bg-[#E0F2F1]/30 transition-all cursor-pointer shadow-xs group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
            <Package className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-slate-800 group-hover:text-[#006978]">
            Packages
          </span>
        </button>

        <button
          onClick={onNavigateLabs}
          className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-3xl bg-white border border-slate-200 hover:border-[#006978] hover:bg-[#E0F2F1]/30 transition-all cursor-pointer shadow-xs group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-slate-800 group-hover:text-[#006978]">
            Labs
          </span>
        </button>

        <button
          onClick={onNavigateDoctors}
          className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-3xl bg-white border border-slate-200 hover:border-[#006978] hover:bg-[#E0F2F1]/30 transition-all cursor-pointer shadow-xs group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
            <Stethoscope className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-slate-800 group-hover:text-[#006978]">
            Doctors
          </span>
        </button>
      </div>

      {/* 4. ACTIVE ORDER / PHLEBOTOMIST TRACKING CARD (IF ACTIVE ORDER) */}
      {activeBooking ? (
        <div
          onClick={onNavigateTracking}
          className="p-5 bg-gradient-to-br from-[#006978] via-[#005a66] to-[#004D56] text-white rounded-3xl shadow-lg flex items-center justify-between gap-3 cursor-pointer hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center font-bold shrink-0">
              <Navigation className="w-6 h-6 text-cyan-200 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-200">
                Active Order Tracking
              </span>
              <h3 className="text-base font-extrabold text-white">
                {activeBooking.labName || 'BioSanté Lab'} &bull; #{activeBooking.bookingCode}
              </h3>
              <p className="text-xs text-cyan-100 font-medium">
                {activeBooking.homeCollection 
                  ? 'Phlebotomist traveling to address &bull; Click to view live map' 
                  : 'Intake reception confirmed &bull; Ready at laboratory'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-cyan-200 shrink-0" />
        </div>
      ) : null}

      {/* 5. REAL SPEND & LAB BREAKDOWN FOR THIS FAMILY MEMBER */}
      <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <CreditCard className="w-4 h-4 text-[#006978]" />
            <span>Diagnostic Spend Summary ({activeProfile.fullName})</span>
          </div>
          <span className="font-mono text-sm font-black text-[#006978]">
            {formatXAF(totalMemberSpend)}
          </span>
        </div>

        {Object.keys(spendByLab).length > 0 ? (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-400 block">Spent by laboratory:</span>
            {Object.entries(spendByLab).map(([labName, amount]) => (
              <div key={labName} className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#006978]" />
                  <span>{labName}</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{formatXAF(amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-2 text-xs text-slate-400 flex items-center gap-2">
            <Inbox className="w-4 h-4 text-slate-300" />
            <span>No paid tests yet for this member. Book your first diagnostic test to see ledger records.</span>
          </div>
        )}
      </div>

      {/* 6. INSURANCE STATUS BANNER */}
      <div
        onClick={onNavigateInsurance}
        className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between cursor-pointer hover:border-[#006978] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">Health Insurance & Tiers-Payant</h4>
            <p className="text-[11px] text-slate-500">Apply approved caisse to cover 80% of test tariffs</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </div>

      {/* 7. POPULAR TESTS DIRECTORY (NO FIXED PRICES SHOWN UPFRONT) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Frequently Requested Tests
          </h3>
          <button
            onClick={onNavigateTests}
            className="text-xs font-bold text-[#006978] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>View all tests</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {popularTests.map((t) => (
            <div
              key={t.id}
              onClick={() => onSelectTest(t)}
              className="p-4 bg-white hover:border-[#006978] border border-slate-200 rounded-3xl shadow-xs flex items-center justify-between gap-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-[#E0F2F1] text-slate-600 group-hover:text-[#006978] flex items-center justify-center font-bold transition-colors shrink-0">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-[#006978]">
                    {t.name}
                  </h4>
                  <p className="text-[11px] text-slate-400">{t.duration} &bull; {t.category}</p>
                </div>
              </div>

              <span className="text-xs font-bold text-[#006978] flex items-center gap-0.5 shrink-0">
                Choose Lab <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 8. QUICK SHORTCUTS (DESKTOP & MOBILE RESPONSIVE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <button
          onClick={onNavigateScan}
          className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-xs text-left transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-[#006978]" />
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#006978]">Scan Doctor's Prescription</h4>
              <p className="text-[10px] text-slate-400">AI digitizes doctor notes & extracts tests</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={onNavigatePackage}
          className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-xs text-left transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-[#006978]" />
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#006978]">Health Booklet & Carnet</h4>
              <p className="text-[10px] text-slate-400">Vaccination records & clinical history</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
};
