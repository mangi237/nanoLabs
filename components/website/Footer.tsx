import React from 'react';
import {
  Activity,
  BookOpen,
  LogIn,
} from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

interface FooterProps {
  onGoToPortal: (role?: 'patient' | 'doctor' | 'lab') => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onGoToPortal, onOpenTerms, onOpenPrivacy }) => {
  return (
    <footer className="bg-[#0B1F1D] text-slate-300 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F766E] to-[#14B8A6] p-0.5 shadow-md">
                <div className="w-full h-full bg-[#0B1F1D] rounded-[10px] flex items-center justify-center">
                  <Activity className="w-4 h-4 text-[#14B8A6] stroke-[2.5]" />
                </div>
              </div>
              <div>
                <span className="text-xl font-black text-white">
                  nano<span className="text-[#14B8A6]">Labs</span>
                </span>
                <span className="block text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                  B2B2C Diagnostic Hub
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              One hub. Every test. Every lab. Every result. Connecting patients, doctors, and laboratories across Cameroon and CEMAC.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href={siteConfig.founder.socials.substack || '#'}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-white/5 text-slate-300 hover:text-white hover:bg-[#0F766E] transition-colors"
                aria-label="Substack"
              >
                <BookOpen className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Product
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#product" className="hover:text-white transition-colors">Patient App</a></li>
              <li><a href="#product" className="hover:text-white transition-colors">Doctor App</a></li>
              <li><a href="#product" className="hover:text-white transition-colors">Lab App</a></li>
              <li><a href="#ecosystem" className="hover:text-white transition-colors">Ecosystem</a></li>
              <li><a href="#workflow" className="hover:text-white transition-colors">How It Works</a></li>
              <li>
                <button
                  onClick={() => onGoToPortal()}
                  className="text-[#14B8A6] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Enter portal</span>
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Company
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#africa" className="hover:text-white transition-colors">Cameroon & Africa</a></li>
              <li><a href="#founder" className="hover:text-white transition-colors">Founder story</a></li>
              <li><a href="#why" className="hover:text-white transition-colors">Why nanoLabs</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Legal & trust
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onOpenPrivacy}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Privacy policy
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenTerms}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Terms of service
                </button>
              </li>
              <li><span className="text-[#14B8A6]">Append-only audit chain</span></li>
              <li><span className="text-slate-400">TVA exempt on lab tests</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-slate-400">
            &copy; {new Date().getFullYear()} nanoLabs. All rights reserved.
          </div>

          <div className="flex items-center gap-2 font-bold text-white bg-white/5 px-3 py-1 rounded-full border border-white/10">
            <span>Built in Cameroon</span>
            <span className="text-slate-500">&middot;</span>
            <span className="text-[#14B8A6]">Designed for Africa</span>
          </div>
        </div>
      </div>

      <div
        className="w-full overflow-hidden pointer-events-none select-none flex justify-center items-center mt-6 -mb-6"
        aria-hidden="true"
      >
        <span
          className="text-[12vw] font-black uppercase tracking-widest text-transparent opacity-10 leading-none whitespace-nowrap"
          style={{ WebkitTextStroke: '2px rgba(255, 255, 255, 0.3)' }}
        >
          NANOLABS
        </span>
      </div>
    </footer>
  );
};

export default Footer;