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
  onGoToPortal: () => void;
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
          ? 'bg-[#07111F]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl py-3'
          : 'bg-transparent py-5'
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
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1677FF] via-[#00A6A6] to-[#20C997] p-0.5 shadow-lg shadow-[#1677FF]/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-[#07111F] rounded-[14px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#20C997] stroke-[2.5]" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-white font-sans">
                  nano<span className="text-[#20C997]">Labs</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1677FF]/20 text-[#1677FF] border border-[#1677FF]/30 tracking-wider">
                  OS
                </span>
              </div>
              <span className="text-[10px] text-[#AAB7C7] font-medium hidden sm:inline-block">
                Cameroon • HealthTech
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#0B1F3A]/60 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-xs font-semibold text-[#AAB7C7] hover:text-white px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right Action: Huge Prominent Portal Button */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={onGoToPortal}
              id="nav-go-to-portal-btn"
              className="relative group px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1677FF] via-[#00A6A6] to-[#20C997] text-white text-xs font-extrabold shadow-lg shadow-[#1677FF]/25 hover:shadow-xl hover:shadow-[#00A6A6]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
              <span className="tracking-wide uppercase text-[11px]">Continue to Portal</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Mobile Hamburger */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={onGoToPortal}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#1677FF] to-[#00A6A6] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Portal</span>
              <ArrowRight className="w-3 h-3" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-[#0B1F3A] border border-white/10 text-white hover:bg-[#0B1F3A]/80 transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#07111F]/95 backdrop-blur-2xl border-b border-white/10 px-4 pt-4 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-[#AAB7C7] hover:text-white px-3 py-2.5 rounded-xl bg-[#0B1F3A]/60 border border-white/5 flex items-center justify-between"
              >
                <span>{link.name}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#20C997]" />
              </a>
            ))}
          </div>

          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onGoToPortal();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1677FF] via-[#00A6A6] to-[#20C997] text-white text-sm font-extrabold shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>CONTINUE TO PORTAL →</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
