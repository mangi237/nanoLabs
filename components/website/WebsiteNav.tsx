import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Menu, 
  X, 
  ArrowRight, 
  User, 
  Stethoscope, 
  Building2, 
  Shield, 
  ChevronRight,
  HelpCircle,
  CreditCard,
  PhoneCall,
  Sparkles
} from 'lucide-react';

export type WebsitePageType = 
  | 'home' 
  | 'how-it-works' 
  | 'for-patients' 
  | 'for-doctors' 
  | 'for-labs' 
  | 'pricing' 
  | 'contact';

interface WebsiteNavProps {
  activePage: WebsitePageType;
  onSelectPage: (page: WebsitePageType) => void;
  onGoToPortal: (roleHint?: 'patient' | 'doctor' | 'lab') => void;
}

export const WebsiteNav: React.FC<WebsiteNavProps> = ({
  activePage,
  onSelectPage,
  onGoToPortal
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: { id: WebsitePageType; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'for-patients', label: 'For Patients' },
    { id: 'for-doctors', label: 'For Doctors' },
    { id: 'for-labs', label: 'For Labs' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'contact', label: 'Contact' }
  ];

  const handleNavClick = (page: WebsitePageType) => {
    onSelectPage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0D3B38]/95 backdrop-blur-md border-b border-[#14B8A6]/20 shadow-xl py-2.5'
            : 'bg-[#0D3B38] border-b border-[#14B8A6]/15 py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-2.5 group focus:outline-none cursor-pointer text-left"
              aria-label="nanoLabs Home"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0F766E] border border-[#14B8A6]/40 flex items-center justify-center shadow-md group-hover:bg-[#14B8A6] transition-colors">
                <Activity className="w-5 h-5 text-[#F8FAF9]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-tight text-[#F8FAF9]">
                    nano<span className="text-[#14B8A6]">Labs</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/30 uppercase tracking-wider">
                    Hub
                  </span>
                </div>
                <span className="text-[10px] text-[#6B7F7D] font-medium hidden sm:inline-block">
                  Patient &bull; Doctor &bull; Laboratory
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 bg-[#092826] border border-[#14B8A6]/20 px-3 py-1.5 rounded-full">
              {navItems.map(item => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#0F766E] text-[#F8FAF9] shadow-sm'
                        : 'text-[#F8FAF9]/80 hover:text-[#F8FAF9] hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Desktop Portal Entry Buttons (44px min tap targets) */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => onGoToPortal('patient')}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-[#F8FAF9] text-xs font-bold border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Patient Portal"
              >
                <User className="w-3.5 h-3.5 text-[#14B8A6]" />
                <span>Patient Portal</span>
              </button>

              <button
                onClick={() => onGoToPortal('doctor')}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#092826] hover:bg-[#0F766E]/40 text-[#14B8A6] text-xs font-bold border border-[#14B8A6]/30 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Doctor Portal"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Doctor Portal</span>
              </button>

              <button
                onClick={() => onGoToPortal('lab')}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#14B8A6] text-[#F8FAF9] text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                title="Laboratory Login"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Lab Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile Hamburger Button (Strict 44px tap target) */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                onClick={() => onGoToPortal('patient')}
                className="min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl bg-[#0F766E] text-[#F8FAF9] text-xs font-bold flex items-center justify-center cursor-pointer"
                aria-label="Patient Portal"
              >
                <User className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-[#092826] text-[#F8FAF9] border border-[#14B8A6]/30 flex items-center justify-center cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-[#14B8A6]" /> : <Menu className="w-5 h-5 text-[#F8FAF9]" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu (Mobile-first, 44px tap targets) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-16 right-0 bottom-0 w-[85%] max-w-sm bg-[#0D3B38] border-l border-[#14B8A6]/20 shadow-2xl p-5 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-4">
              <div className="pb-3 border-b border-[#14B8A6]/20">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#14B8A6]">
                  Navigation Menu
                </p>
                <p className="text-xs text-[#6B7F7D]">
                  nanoLabs Consumer & B2B Healthcare Hub
                </p>
              </div>

              {/* Navigation links with 44px touch targets */}
              <div className="space-y-1">
                {navItems.map(item => {
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full min-h-[44px] px-4 py-3 rounded-xl text-left text-sm font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#0F766E] text-[#F8FAF9]'
                          : 'text-[#F8FAF9]/80 hover:bg-white/5 hover:text-[#F8FAF9]'
                      }`}
                    >
                      <span>{item.label}</span>
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-[#F8FAF9]' : 'text-[#6B7F7D]'}`} />
                    </button>
                  );
                })}
              </div>

              {/* Portal Entry Section */}
              <div className="pt-4 border-t border-[#14B8A6]/20 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#14B8A6]">
                  Portals & Access
                </p>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onGoToPortal('patient');
                  }}
                  className="w-full min-h-[44px] px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-[#F8FAF9] text-xs font-bold border border-white/15 flex items-center gap-2.5 cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#14B8A6]" />
                  <div className="text-left">
                    <div>Patient Portal</div>
                    <div className="text-[10px] text-[#6B7F7D] font-normal">Bookings, results & booklet</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onGoToPortal('doctor');
                  }}
                  className="w-full min-h-[44px] px-4 py-3 rounded-xl bg-[#092826] hover:bg-[#0F766E]/40 text-[#14B8A6] text-xs font-bold border border-[#14B8A6]/30 flex items-center gap-2.5 cursor-pointer"
                >
                  <Stethoscope className="w-4 h-4" />
                  <div className="text-left">
                    <div>Doctor Portal</div>
                    <div className="text-[10px] text-[#6B7F7D] font-normal">Prescriptions & patient results</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onGoToPortal('lab');
                  }}
                  className="w-full min-h-[44px] px-4 py-3 rounded-xl bg-[#0F766E] hover:bg-[#14B8A6] text-[#F8FAF9] text-xs font-bold flex items-center justify-between shadow-md cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4" />
                    <div className="text-left">
                      <div>Laboratory Login</div>
                      <div className="text-[10px] text-teal-200 font-normal">LIMS bench & cashier</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile Footer Info */}
            <div className="pt-4 border-t border-[#14B8A6]/20 text-[11px] text-[#6B7F7D] space-y-1">
              <p>Built for Cameroon & Central Africa</p>
              <p className="text-[10px] text-[#6B7F7D]/70">Zero emojis &bull; Mobile-first &bull; 5% Record Fee</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
