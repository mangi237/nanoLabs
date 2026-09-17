import React from 'react';
import { motion } from 'framer-motion';
import { Activity, BookOpen, LogIn } from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

interface FooterProps {
  onGoToPortal: (role?: 'patient' | 'doctor' | 'lab') => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onGoToPortal, onOpenTerms, onOpenPrivacy }) => {
  return (
    <footer className="bg-nl-off text-slate-700 border-t border-slate-200 pt-16 pb-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-200">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nl-deep to-nl-light p-0.5 shadow-md">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                  <Activity className="w-4 h-4 text-nl-teal" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <span className="text-xl font-black text-nl-ink font-display">
                  nano<span className="text-nl-teal">Labs</span>
                </span>
                <span className="block text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                  B2B2C Diagnostic Hub
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
              One hub. Every test. Every lab. Every result. Connecting patients, doctors, and laboratories across Cameroon and CEMAC.
            </p>

            <div className="flex items-center gap-3 pt-2">
              {siteConfig.founder.socials.substack && (
                <a
                  href={siteConfig.founder.socials.substack}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-white hover:bg-nl-teal transition-colors"
                  aria-label="Substack"
                >
                  <BookOpen className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-nl-ink">Product</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#product" className="hover:text-nl-teal transition-colors">Patient App</a></li>
              <li><a href="#product" className="hover:text-nl-teal transition-colors">Doctor App</a></li>
              <li><a href="#product" className="hover:text-nl-teal transition-colors">Lab App</a></li>
              <li><a href="#ecosystem" className="hover:text-nl-teal transition-colors">Ecosystem</a></li>
              <li><a href="#workflow" className="hover:text-nl-teal transition-colors">How It Works</a></li>
              <li>
                <button onClick={() => onGoToPortal()} className="text-nl-teal font-bold hover:underline flex items-center gap-1 cursor-pointer">
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Enter portal</span>
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-nl-ink">Company</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#africa" className="hover:text-nl-teal transition-colors">Cameroon & Africa</a></li>
              <li><a href="#founder" className="hover:text-nl-teal transition-colors">Founder story</a></li>
              <li><a href="#why" className="hover:text-nl-teal transition-colors">Why nanoLabs</a></li>
              <li><a href="#faq" className="hover:text-nl-teal transition-colors">FAQ</a></li>
              <li><a href="#contact" className="hover:text-nl-teal transition-colors">Contact</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-nl-ink">Legal & trust</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={onOpenPrivacy} className="hover:text-nl-teal transition-colors cursor-pointer text-left">
                  Privacy policy
                </button>
              </li>
              <li>
                <button onClick={onOpenTerms} className="hover:text-nl-teal transition-colors cursor-pointer text-left">
                  Terms of service
                </button>
              </li>
              <li><span className="text-nl-teal">Append-only audit chain</span></li>
              <li><span className="text-slate-500">TVA exempt on lab tests</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-slate-500">
            &copy; {new Date().getFullYear()} nanoLabs. All rights reserved.
          </div>
          <div className="flex items-center gap-2 font-bold text-nl-ink bg-white px-3 py-1 rounded-full border border-slate-200">
            <span>Built in Cameroon</span>
            <span className="text-slate-300">&middot;</span>
            <span className="text-nl-teal">Designed for Africa</span>
          </div>
        </div>
      </div>

      <motion.div
        aria-hidden="true"
        className="w-full overflow-hidden pointer-events-none select-none flex justify-center items-center mt-6 -mb-6"
        animate={{ x: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span
          className="text-[12vw] font-black uppercase tracking-widest text-transparent opacity-[0.06] leading-none whitespace-nowrap"
          style={{ WebkitTextStroke: '2px rgba(15, 118, 110, 0.4)' }}
        >
          NANOLABS
        </span>
      </motion.div>
    </footer>
  );
};

export default Footer;