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
  onNavigateBooklet?: () => void;
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
  onNavigateBooklet,
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

        // Check if there is an active (in-progress) order that has been confirmed by lab
        const active = matching.find(b => 
          b.overallStatus !== 'Completed' && 
          (b.paymentStatus === 'paid' || (b.status as any) === 'confirmed' || (b.overallStatus as any) === 'confirmed' || (b.overallStatus as any) === 'In Progress' || b.overallStatus === 'In_Lab_Testing' || b.overallStatus === 'Ready_For_Pickup')
        );
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

  const patientDisplayName = user?.name || user?.fullName || (activeProfile.fullName !== 'Patient' && !activeProfile.fullName.includes('Claire') ? activeProfile.fullName : 'Valued Patient');

  return (
    <div className="max-w-4xl mx-auto py-2 text-slate-900 animate-in fade-in duration-300 space-y-6">
      {/* 1. TOP STATUS & GREETING BAR (REAL PATIENT NAME) */}
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
            Welcome back, {patientDisplayName}
          </h1>
        </div>

        <button
          onClick={onNavigateProfile}
          className="relative focus:outline-hidden cursor-pointer"
          title="View profile"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#006978] text-white flex items-center justify-center font-black text-base shadow-xs border-2 border-white">
            {patientDisplayName.charAt(0).toUpperCase()}
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

      {/* 3. QUICK ACTION 4 ICONS (Zero text underneath - clean icon badges) */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
        <button
          onClick={onNavigateTests}
          title="Diagnostic Tests Catalog"
          className="flex items-center justify-center p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#006978] hover:bg-[#E0F2F1]/30 transition-all cursor-pointer shadow-xs group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
            <FlaskConical className="w-6 h-6" />
          </div>
        </button>

        <button
          onClick={onNavigatePackage}
          title="Health Packages & Bundles"
          className="flex items-center justify-center p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#006978] hover:bg-[#E0F2F1]/30 transition-all cursor-pointer shadow-xs group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
            <Package className="w-6 h-6" />
          </div>
        </button>

        <button
          onClick={onNavigateLabs}
          title="Accredited Partner Laboratories"
          className="flex items-center justify-center p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#006978] hover:bg-[#E0F2F1]/30 transition-all cursor-pointer shadow-xs group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
            <Building2 className="w-6 h-6" />
          </div>
        </button>

        <button
          onClick={onNavigateDoctors}
          title="ONMC Verified Physicians & Specialists"
          className="flex items-center justify-center p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#006978] hover:bg-[#E0F2F1]/30 transition-all cursor-pointer shadow-xs group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
            <Stethoscope className="w-6 h-6" />
          </div>
        </button>
      </div>

      {/* 4. ACTIVE ORDER / PHLEBOTOMIST TRACKING CARD (ONLY IF CONFIRMED & ACTIVE) */}
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

      {/* 7. DIAGNOSTIC HEALTH PACKAGES (MULTI-TEST BUNDLES) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Bundled Health Packages
            </h3>
            <p className="text-[11px] text-slate-500">Tap any package to inspect all included clinical tests</p>
          </div>
          <button
            onClick={onNavigatePackage}
            className="text-xs font-bold text-[#006978] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>Explore packages</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: 'pkg-wellness-full',
              title: 'Comprehensive Annual Wellness',
              testsCount: 7,
              tag: 'Most Popular',
              desc: 'CBC, Glycemia, Lipids, Liver Panel, Kidney Panel, Urinalysis & Uric Acid'
            },
            {
              id: 'pkg-cardio-metabolic',
              title: 'Cardiovascular & Metabolic Risk',
              testsCount: 5,
              tag: 'Heart & Lipids',
              desc: 'High-Sensitivity CRP, Lipid Panel, HbA1c, Fasting Blood Sugar, Creatinine'
            },
            {
              id: 'pkg-premarital',
              title: 'Premarital & Infectious Screen',
              testsCount: 6,
              tag: 'Pre-nuptial',
              desc: 'Hemoglobin Electrophoresis, Blood Grouping, HIV 1/2, HBsAg, HCV, VDRL'
            }
          ].map((pkg) => (
            <div
              key={pkg.id}
              onClick={onNavigatePackage}
              className="p-4 bg-gradient-to-br from-white to-[#E0F2F1]/30 hover:to-[#E0F2F1]/60 border border-slate-200/90 hover:border-[#006978] rounded-3xl shadow-xs transition-all cursor-pointer flex flex-col justify-between gap-3 group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-[#E0F2F1] text-[#006978] text-[10px] font-black rounded-full">
                    {pkg.tag}
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-500">
                    {pkg.testsCount} Tests Included
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#006978] transition-colors">
                  {pkg.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  {pkg.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#006978]">
                <span>View all tests</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8. QUICK PRESCRIPTION SCANNER SHORTCUT */}
      <div className="pt-1">
        <button
          onClick={onNavigateScan}
          className="w-full p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-xs text-left transition-all cursor-pointer group flex items-center justify-between"
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
      </div>
    </div>
  );
};
