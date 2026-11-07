import React from 'react';
import { 
  Activity, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  ArrowUp, 
  CheckCircle2,
  Lock,
  Building2,
  User,
  Stethoscope
} from 'lucide-react';
import { WebsitePageType } from './WebsiteNav';

interface WebsiteFooterProps {
  onSelectPage: (page: WebsitePageType) => void;
  onGoToPortal: (roleHint?: 'patient' | 'doctor' | 'lab') => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

export const WebsiteFooter: React.FC<WebsiteFooterProps> = ({
  onSelectPage,
  onGoToPortal,
  onOpenPrivacy,
  onOpenTerms
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#092826] text-[#F8FAF9] border-t border-[#14B8A6]/20 pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#14B8A6]/15">
          {/* Col 1: Brand & Positioning */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0F766E] flex items-center justify-center border border-[#14B8A6]/40">
                <Activity className="w-5 h-5 text-[#F8FAF9]" />
              </div>
              <span className="text-xl font-black text-[#F8FAF9]">
                nano<span className="text-[#14B8A6]">Labs</span>
              </span>
            </div>

            <p className="text-xs text-[#6B7F7D] max-w-sm leading-relaxed">
              The diagnostic operating system and care network connecting Patients (B2C), Doctor Networks, and Laboratories (B2B) across Cameroon and Central Africa.
            </p>

            <div className="p-3 bg-[#0D3B38] border border-[#14B8A6]/25 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-[#14B8A6] font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Operating Standards & Compliance</span>
              </div>
              <p className="text-[11px] text-[#6B7F7D]">
                5% nanoLabs record management fee on patient portion upon cashier verification. Zero upfront software fee for laboratories. Direct payment to facility. TVA exempt for clinical diagnostic tests.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 text-xs text-[#6B7F7D]">
              <MapPin className="w-4 h-4 text-[#14B8A6]" />
              <span>Douala & Yaounde, Cameroon</span>
            </div>
          </div>

          {/* Col 2: The 3 Audiences */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#14B8A6]">
              Audiences
            </h4>
            <ul className="space-y-2 text-xs text-[#F8FAF9]/80">
              <li>
                <button
                  onClick={() => onSelectPage('for-patients')}
                  className="hover:text-[#14B8A6] transition-colors cursor-pointer text-left"
                >
                  For Patients
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPage('for-doctors')}
                  className="hover:text-[#14B8A6] transition-colors cursor-pointer text-left"
                >
                  For Doctors & Clinics
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPage('for-labs')}
                  className="hover:text-[#14B8A6] transition-colors cursor-pointer text-left"
                >
                  For Laboratories
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPage('how-it-works')}
                  className="hover:text-[#14B8A6] transition-colors cursor-pointer text-left"
                >
                  How It Works (3 Columns)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: System & Commercial */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#14B8A6]">
              Platform & Pricing
            </h4>
            <ul className="space-y-2 text-xs text-[#F8FAF9]/80">
              <li>
                <button
                  onClick={() => onSelectPage('pricing')}
                  className="hover:text-[#14B8A6] transition-colors cursor-pointer text-left"
                >
                  Pricing & 5% Record Fee
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPage('home')}
                  className="hover:text-[#14B8A6] transition-colors cursor-pointer text-left"
                >
                  Home & Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPage('contact')}
                  className="hover:text-[#14B8A6] transition-colors cursor-pointer text-left"
                >
                  Contact & Onboarding
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Portals & Entry Points */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#14B8A6]">
              Portals
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => onGoToPortal('patient')}
                className="w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-left text-xs font-bold text-[#F8FAF9] flex items-center justify-between cursor-pointer"
              >
                <span>Patient Portal</span>
                <User className="w-3.5 h-3.5 text-[#14B8A6]" />
              </button>

              <button
                onClick={() => onGoToPortal('doctor')}
                className="w-full py-2 px-3 rounded-lg bg-[#0D3B38] hover:bg-[#0F766E]/40 text-left text-xs font-bold text-[#14B8A6] flex items-center justify-between cursor-pointer border border-[#14B8A6]/30"
              >
                <span>Doctor Portal</span>
                <Stethoscope className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onGoToPortal('lab')}
                className="w-full py-2 px-3 rounded-lg bg-[#0F766E] hover:bg-[#14B8A6] text-left text-xs font-bold text-[#F8FAF9] flex items-center justify-between cursor-pointer"
              >
                <span>Lab Staff Login</span>
                <Building2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7F7D]">
          <div className="flex flex-wrap items-center gap-4">
            <span>&copy; {new Date().getFullYear()} nanoLabs Hub. All rights reserved.</span>
            {onOpenTerms && (
              <button
                onClick={onOpenTerms}
                className="hover:text-[#F8FAF9] underline cursor-pointer"
              >
                Terms of Service
              </button>
            )}
            {onOpenPrivacy && (
              <button
                onClick={onOpenPrivacy}
                className="hover:text-[#F8FAF9] underline cursor-pointer"
              >
                Privacy & Data Protection
              </button>
            )}
          </div>

          <button
            onClick={scrollToTop}
            className="min-h-[44px] px-3 py-1.5 rounded-lg bg-[#0D3B38] text-[#14B8A6] hover:text-[#F8FAF9] flex items-center gap-1.5 transition-colors cursor-pointer border border-[#14B8A6]/20"
            aria-label="Scroll back to top"
          >
            <span>Back to top</span>
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};
