import React, { useState, useEffect } from 'react';
import {
  Activity,
  ArrowRight,
  Menu,
  X,
  LogIn,
  ChevronRight,
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
    { name: 'Why nanoLabs', href: '#why' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm py-3'
          : 'bg-white/80 backdrop-blur-md border-b border-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">

          <a
            href="#"
            className="flex items-center gap-3 focus:outline-none"
            aria-label="nanoLabs home"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0D3B38] via-[#0F766E] to-[#14B8A6] p-0.5 shadow-md shadow-teal-900/10">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#0F766E] stroke-[2.5]" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-[#0B1F1D] leading-none">
                nano<span className="text-[#0F766E]">Labs</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5 hidden sm:inline-block">
                Diagnostic Hub · Cameroon
              </span>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-[#0D3B38] px-3 py-2 rounded-full hover:bg-slate-50 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => onGoToPortal()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0D3B38] via-[#0F766E] to-[#14B8A6] text-white text-sm font-bold shadow-lg shadow-teal-900/20 hover:shadow-teal-700/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Go to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => onGoToPortal()}
              className="px-3.5 py-2 rounded-xl bg-[#0D3B38] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Portal</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-4 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-200">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between text-sm font-semibold text-slate-700 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100"
            >
              <span>{link.name}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
          ))}
        </div>
      )}
    </header>
  );
};

export default Navbar;