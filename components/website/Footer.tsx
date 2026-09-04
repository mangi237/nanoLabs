import React from 'react';
import { 
  Activity, 
  // Linkedin, 
  // Twitter, 
  // Github, 
  BookOpen, 
  ArrowRight, 
  Shield, 
  Heart,
  LogIn
} from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

interface FooterProps {
  onGoToPortal: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onGoToPortal, onOpenTerms, onOpenPrivacy }) => {
  return (
    <footer className="bg-[#050C16] text-[#AAB7C7] border-t border-white/10 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Col 1: Brand & Slogan */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1677FF] to-[#20C997] p-0.5 shadow-md">
                <div className="w-full h-full bg-[#07111F] rounded-[10px] flex items-center justify-center">
                  <Activity className="w-4 h-4 text-[#20C997] stroke-[2.5]" />
                </div>
              </div>
              <span className="text-xl font-black text-white">
                nano<span className="text-[#20C997]">Labs</span>
              </span>
            </div>

            <p className="text-xs text-[#AAB7C7] max-w-sm leading-relaxed">
              Building connected laboratory infrastructure from Cameroon. Connecting laboratories, patients, doctors and results through one digital ecosystem.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href={siteConfig.founder.socials.linkedin || '#'}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-[#0B1F3A] text-slate-400 hover:text-white hover:bg-[#1677FF] transition-colors"
                aria-label="LinkedIn"
              >
            
              </a>
              <a
                href={siteConfig.founder.socials.x || '#'}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-[#0B1F3A] text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                aria-label="X / Twitter"
              >
               
              </a>
              <a
                href={siteConfig.founder.socials.github || '#'}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-[#0B1F3A] text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                aria-label="GitHub"
              >
            
              </a>
              <a
                href={siteConfig.founder.socials.substack || '#'}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-[#0B1F3A] text-slate-400 hover:text-white hover:bg-amber-600 transition-colors"
                aria-label="Substack"
              >
                <BookOpen className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Product & Platform */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Product
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#product" className="hover:text-white transition-colors">Clinical Suite</a></li>
              <li><a href="#ecosystem" className="hover:text-white transition-colors">Connected Ecosystem</a></li>
              <li><a href="#workflow" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#impact" className="hover:text-white transition-colors">Impact & Turnaround</a></li>
              <li>
                <button
                  onClick={onGoToPortal}
                  className="text-[#20C997] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Enter Portal</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Company & Story */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Company
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#africa" className="hover:text-white transition-colors">Cameroon & Africa 🇨🇲</a></li>
              <li><a href="#founder" className="hover:text-white transition-colors">Founder Story</a></li>
              <li><a href="#traction" className="hover:text-white transition-colors">Milestones & Journey</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Frequently Asked</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Col 4: Legal & Trust */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Legal & Trust
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onOpenPrivacy}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenTerms}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li><span className="text-[#20C997]">AES-256 Envelope Security</span></li>
              <li><span className="text-slate-400">HL7 FHIR Interoperability</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits & Cameroon Pride */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-slate-400">
            © {new Date().getFullYear()} NanoLabs HealthCare Inc. All rights reserved.
          </div>

          <div className="flex items-center gap-2 font-bold text-white bg-[#0B1F3A] px-3 py-1 rounded-full border border-white/10">
            <span>Built in Cameroon</span>
            <span>🇨🇲</span>
            <span className="text-slate-400">•</span>
            <span className="text-[#20C997]">Designed for Africa</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
