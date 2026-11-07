import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Zap, 
  Users, 
  FileText, 
  CreditCard, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Check,
  AlertTriangle,
  QrCode,
  Layers,
  Sparkles
} from 'lucide-react';
import { WebsitePageType } from '../WebsiteNav';

interface ForLabsPageProps {
  onSelectPage: (page: WebsitePageType) => void;
  onGoToPortal: (roleHint?: 'patient' | 'doctor' | 'lab') => void;
}

export const ForLabsPage: React.FC<ForLabsPageProps> = ({
  onSelectPage,
  onGoToPortal
}) => {
  const roles = [
    { title: 'Reception Desk', desc: 'Patient intake, identity verification, insurance manual inspection, and walk-in scheduling.' },
    { title: 'Phlebotomy Station', desc: 'Specimen barcoding, tube color identification, centrifugation tracking, and sample integrity checks.' },
    { title: 'Lab Technologist Bench', desc: 'Bench analytical result entry, analyzer imports, reference range comparison, and critical flag highlights.' },
    { title: 'Biologist Validation', desc: 'Clinical review, automated abnormal highlights, custom medical interpretations, and digital signing.' },
    { title: 'Cashier Workspace', desc: 'Direct collection, split co-pays, insurance claim tracking, and shift balancing with zero leakage.' },
    { title: 'Reagent Inventory', desc: 'Real-time consumable tracking, lot numbers, test kit yields, and expiration countdown alerts.' },
    { title: 'Laboratory Director', desc: 'Staff access governance, catalog test pricing, turnaround time analytics, and financial reporting.' },
    { title: 'Super Administrator', desc: 'Tenant provisioning, global compliance oversight, and monthly 5% record fee settlement reporting.' }
  ];

  return (
    <div className="space-y-16 py-8">
      {/* Hero */}
      <section className="text-center max-w-3xl mx-auto px-4 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#0F766E] text-xs font-bold">
          <Building2 className="w-3.5 h-3.5 text-[#14B8A6]" />
          <span>Laboratory Information Management System (LIMS)</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-[#0B1F1D] tracking-tight">
          Modernize Your Diagnostic Laboratory in Minutes
        </h1>
        <p className="text-sm sm:text-base text-[#6B7F7D] max-w-2xl mx-auto leading-relaxed">
          The complete operating system for diagnostic laboratories and hospital pathology departments in Central Africa. Zero upfront software fees, 100% direct revenue retention, and full role-based workspaces.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onGoToPortal('lab')}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-[#0F766E] hover:bg-[#14B8A6] text-[#F8FAF9] text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
          >
            <span>Laboratory Staff Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSelectPage('pricing')}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 shadow-sm transition-colors cursor-pointer"
          >
            <span>Learn About the 5% Model</span>
          </button>
        </div>
      </section>

      {/* Pillars for Laboratories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0B1F1D]">100% Direct Lab Revenue</h3>
            <p className="text-xs text-[#6B7F7D] leading-relaxed">
              All money goes directly to your laboratory. Whether patients pay by cash, Mobile Money, Orange Money, or corporate insurance, nanoLabs never touches your payment rails.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#0F766E] flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0B1F1D]">0 XAF Software Setup Cost</h3>
            <p className="text-xs text-[#6B7F7D] leading-relaxed">
              No expensive upfront licenses or local server installations. Runs smoothly on existing desktop computers, laptops, and tablets with zero capital expenditure.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0F766E] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0B1F1D]">Cashier Revenue Protection</h3>
            <p className="text-xs text-[#6B7F7D] leading-relaxed">
              Stop front-desk revenue leakage. Every registered test is cryptographically tied to a verified cashier receipt, eliminating unaccounted tests and shift discrepancies.
            </p>
          </div>
        </div>
      </section>

      {/* Two Onboarding Models: Full LIMS vs Zero-Installation WhatsApp Gateway */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 space-y-6">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#14B8A6]">
              Intégration Flexible &bull; Adapté à Vos Réalités
            </span>
            <h2 className="text-2xl sm:text-3xl font-black">
              Deux Façons de Collaborer avec nanoLabs
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Vous avez déjà un logiciel interne ou un registre de paillasse ? Aucun problème : vous n&apos;êtes pas obligés de changer vos habitudes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Option A */}
            <div className="bg-slate-800/80 rounded-2xl p-6 border border-teal-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-extrabold uppercase tracking-wide">
                  Option 1 &bull; Sans Installation
                </span>
                <span className="text-xs font-bold text-slate-400">0 Logiciel Requis</span>
              </div>
              <h3 className="text-lg font-bold text-white">Passerelle WhatsApp &amp; Paillasse Autonome</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Recevez directement les demandes de tests des patients et ordonnances des médecins sur votre <strong>numéro WhatsApp officiel</strong>. Confirmez votre tarif de paillasse en 1 clic, encaissez 100% au comptoir, et transmettez le PDF signé par votre biologiste.
              </p>
              <div className="space-y-1.5 text-xs text-teal-200">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Idéal pour les laboratoires déjà équipés d&apos;un logiciel propre</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Aucun mot de passe ni formation d&apos;équipe requise</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Lien d&apos;action direct pour déposer le compte-rendu PDF officiel</span>
                </div>
              </div>
            </div>

            {/* Option B */}
            <div className="bg-slate-800/80 rounded-2xl p-6 border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-extrabold uppercase tracking-wide">
                  Option 2 &bull; Système Complet
                </span>
                <span className="text-xs font-bold text-slate-400">8 Postes de Travail</span>
              </div>
              <h3 className="text-lg font-bold text-white">LIMS Hospitalier &amp; Rôles Dédiés</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Modernisez l&apos;intégralité de vos opérations quotidiennes : accueil &amp; identitovigilance, salle de prélèvement, bancs de technicien, validation biologique, caisse &amp; tiers-payant, et inventaire des réactifs.
              </p>
              <div className="space-y-1.5 text-xs text-cyan-200">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Séparation stricte des tâches et traçabilité inviolable</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Gestion des prises en charge d&apos;assurance (CEMAC)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Génération automatique des PDF avec signature biologiste</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8 Granular Role-Based Workspaces */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
            Granular Workflows
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0B1F1D] mt-1">
            8 Specialized Clinical &amp; Operational Roles
          </h2>
          <p className="text-xs text-[#6B7F7D] mt-2">
            Each staff member accesses strictly the tools required for their daily duties, maintaining clinical data integrity and strict privacy boundaries.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((r, i) => (
            <div
              key={r.title}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#14B8A6] shadow-sm transition-all space-y-2"
            >
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#0F766E] font-black text-xs flex items-center justify-center">
                {i + 1}
              </div>
              <h4 className="text-sm font-bold text-[#0B1F1D]">{r.title}</h4>
              <p className="text-xs text-[#6B7F7D] leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Biologist Signing & Lab Reports Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0D3B38] text-[#F8FAF9] rounded-3xl p-6 sm:p-10 border border-[#14B8A6]/25 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#14B8A6]">
              Clinical Liability &amp; Branding
            </span>
            <h3 className="text-2xl sm:text-3xl font-black">
              Lab-Branded Reports with Dynamic Biologist Signatures
            </h3>
            <p className="text-xs sm:text-sm text-[#6B7F7D] leading-relaxed">
              Every released diagnostic report is completely customized with your laboratory's official header, contact details, and accreditation badges. Biologist names and ONMC registration numbers are dynamically inserted upon digital sign-off.
            </p>
            <div className="space-y-2 text-xs text-teal-100">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#14B8A6]" />
                <span>Encrypted PDF format with anti-tamper cryptographic QR code</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#14B8A6]" />
                <span>Direct PDF download or WhatsApp/SMS release to patients</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#14B8A6]" />
                <span>Complete preservation of clinical responsibility and facility identity</span>
              </div>
            </div>
          </div>

          <div className="bg-[#092826] p-6 rounded-2xl border border-[#14B8A6]/30 space-y-4">
            <div className="border-b border-[#14B8A6]/20 pb-3 flex items-center justify-between">
              <span className="text-xs font-bold text-teal-200">Official Report Preview</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                VALIDATED
              </span>
            </div>
            <div className="bg-[#0D3B38] p-4 rounded-xl space-y-3 text-xs border border-[#14B8A6]/20">
              <div className="text-center pb-2 border-b border-[#14B8A6]/20">
                <div className="font-black text-sm text-white">CENTRE MÉDICAL &amp; LABORATOIRE ESPÉRANCE</div>
                <div className="text-[10px] text-[#6B7F7D]">Akwa, Douala &bull; Tél: +237 699 00 00 00 &bull; Agrément MINSANTE</div>
              </div>
              <div className="flex justify-between text-[11px] text-teal-100">
                <span>Patient: M. Jean-Paul K. (42 ans)</span>
                <span>Date: {new Date().toLocaleDateString()}</span>
              </div>
              <div className="pt-2 border-t border-[#14B8A6]/20 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#6B7F7D]">Biologiste Médical Validateur:</div>
                  <div className="font-bold text-white text-[11px]">Dr. Suzanne M. (ONMC #4829)</div>
                </div>
                <div className="w-8 h-8 rounded bg-[#092826] border border-[#14B8A6]/40 flex items-center justify-center text-[10px] font-mono text-[#14B8A6]">
                  QR
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lab Onboarding Action */}
      <section className="text-center max-w-2xl mx-auto px-4 space-y-4">
        <h3 className="text-xl font-bold text-[#0B1F1D]">
          Register Your Laboratory in Under 60 Seconds
        </h3>
        <p className="text-xs text-[#6B7F7D]">
          Start immediately with zero upfront capital commitment. All test revenue is retained directly by your facility.
        </p>
        <button
          onClick={() => onGoToPortal('lab')}
          className="min-h-[44px] px-6 py-3 rounded-xl bg-[#0F766E] hover:bg-[#14B8A6] text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-2 shadow-md"
        >
          <span>Self-Register Facility Online</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
};
