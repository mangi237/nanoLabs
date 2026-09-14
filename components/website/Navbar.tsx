import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ArrowRight, Menu, X, LogIn, ChevronRight } from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

interface NavbarProps {
  onGoToPortal: (role?: 'patient' | 'doctor' | 'lab') => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onGoToPortal }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Product', href: '#product' },
    { name: 'Ecosystem', href: '#ecosystem' },
    { name: 'How it works', href: '#workflow' },
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
          ? 'bg-nl-black/85 backdrop-blur-xl border-b border-white/10 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 group" aria-label="nanoLabs home">
            <motion.div
              initial={{ rotate: -6 }}
              animate={{ rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-nl-teal via-nl-light to-nl-glow p-0.5 shadow-lg shadow-nl-teal/30"
            >
              <div className="w-full h-full bg-nl-black rounded-[14px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-nl-glow stroke-[2.5]" />
              </div>
            </motion.div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white font-display leading-none">
                nano<span className="text-nl-glow">Labs</span>
              </span>
              <span className="text-[10px] text-white/50 font-medium mt-0.5 hidden sm:inline-block">
                Des analyses. Une meilleure santé.
              </span>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-full backdrop-blur-md">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-xs font-medium text-white/70 hover:text-white px-3 py-2 rounded-full hover:bg-white/10 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => onGoToPortal()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-nl-teal via-nl-light to-nl-glow text-white text-sm font-bold shadow-lg shadow-nl-teal/40 hover:shadow-nl-glow/50 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Go to portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => onGoToPortal()}
              className="px-3.5 py-2 rounded-xl bg-nl-teal text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Portal</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white/5 border border-white/15 text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="lg:hidden bg-nl-ink border-b border-white/10 px-4 pt-4 pb-6 space-y-2"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-sm font-semibold text-white/80 px-4 py-3 rounded-xl bg-white/5 border border-white/10"
              >
                <span>{link.name}</span>
                <ChevronRight className="w-4 h-4 text-nl-glow" />
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;