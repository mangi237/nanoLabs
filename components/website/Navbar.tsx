import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ArrowRight, 
  Menu, 
  X, 
  Shield, 
  Sparkles, 
  LogIn,
  ChevronRight,
  Globe,
  Layers,
  FileText
} from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

interface NavbarProps {
  onGoToPortal: (role?: 'patient' | 'doctor' | 'lab') => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onGoToPortal, onOpenTerms, onOpenPrivacy }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Product', href: '#product' },
    { name: 'Ecosystem', href: '#ecosystem' },
    { name: 'How It Works', href: '#workflow' },
    { name: 'Cameroon & Africa', href: '#africa' },
    { name: 'Impact', href: '#impact' },
    { name: 'Founder', href: '#founder' },
    { name: 'Traction', href: '#traction' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-sm py-3'
          : 'bg-[#F8FAF9]/80 backdrop-blur-md border-b border-slate-200/40 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <a
            href="#"
            className="flex items-center gap-3 group focus:outline-none"
            aria-label="NanoLabs Home"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0D3B38] via-[#0F766E] to-[#14B8A6] p-0.5 shadow-md shadow-teal-900/10 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#0F766E] stroke-[2.5]" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-[#0B1F1D] font-sans">
                  nano<span className="text-[#0F766E]">Labs</span>
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200 tracking-wider">
                  OS
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold hidden sm:inline-block">
                Central Africa &bull; Diagnostic Network
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/90 border border-slate-200/80 px-3.5 py-1.5 rounded-full shadow-2xs backdrop-blur-md">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-xs font-semibold text-slate-600 hover:text-[#0D3B38] px-3 py-1.5 rounded-full hover:bg-slate-100/80 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right Action: Clean Portal Entrance Buttons with glowing GO TO PORTAL CTA */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => onGoToPortal('patient')}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-teal-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Patient Portal
            </button>
            <button
              onClick={() => onGoToPortal('doctor')}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-teal-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Doctor Portal
            </button>
            <button
              onClick={() => onGoToPortal()}
              id="nav-go-to-portal-btn"
              className="relative group px-4 py-2 rounded-xl bg-gradient-to-r from-[#0D3B38] via-[#0F766E] to-[#14B8A6] hover:from-[#082624] hover:to-[#0F766E] text-white text-xs font-black shadow-lg shadow-teal-500/25 ring-2 ring-teal-400/40 hover:ring-teal-400 flex items-center gap-2 cursor-pointer transition-all animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-200" />
              <span className="tracking-wide">GO TO PORTAL</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Mobile Hamburger */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => onGoToPortal('patient')}
              className="px-3 py-1.5 rounded-xl bg-teal-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Portal</span>
              <ArrowRight className="w-3 h-3" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/98 backdrop-blur-2xl border-b border-slate-200 px-4 pt-4 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200 shadow-xl">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-slate-700 hover:text-[#0D3B38] px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between"
              >
                <span>{link.name}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </a>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onGoToPortal('patient');
              }}
              className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>PATIENT PORTAL →</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onGoToPortal('doctor');
              }}
              className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>DOCTOR PORTAL →</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onGoToPortal('lab');
              }}
              className="w-full py-2.5 rounded-xl bg-teal-800 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>LABORATORY & STAFF LIMS →</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
