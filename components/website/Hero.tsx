import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ChevronDown, ShieldCheck, Lock, MapPin, Clock,
  Navigation, CheckCircle2, Scan, Sparkles, FlaskConical, Stethoscope,
} from 'lucide-react';

interface HeroProps {
  onGoToPortal: (role?: 'patient' | 'doctor' | 'lab') => void;
}

const phoneScreens = [
  { src: '/assets/phone-live-tracking.png', label: 'Live tracking' },
  { src: '/assets/phone-nanoscan-result.png', label: 'nanoScan AI' },
  { src: '/assets/phone-lab-compare.png', label: 'Lab compare' },
];

const labs = [
  { name: 'Biolab Douala', dist: '1.2 km', tat: '45 min', price: '6 500 XAF' },
  { name: 'CMA Cité des Palmiers', dist: '2.8 km', tat: '1 h 15', price: '7 200 XAF' },
  { name: 'Modern Lab', dist: '3.1 km', tat: '2 h', price: '5 800 XAF' },
];

export const Hero: React.FC<HeroProps> = ({ onGoToPortal }) => {
  const [screenIndex, setScreenIndex] = useState(0);
  const [activeLab, setActiveLab] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setScreenIndex((i) => (i + 1) % phoneScreens.length), 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-24 overflow-hidden bg-white">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-gradient-to-br from-nl-teal/10 via-nl-light/8 to-nl-blue/6 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0F766E 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="hidden lg:flex absolute top-40 left-12 p-3 rounded-2xl bg-white border border-nl-teal/20 shadow-lg items-center gap-2"
      >
        <FlaskConical className="w-4 h-4 text-nl-teal" />
        <span className="text-[10px] font-bold text-slate-700">Sample tracking</span>
      </motion.div>

      <motion.div
        animate={{ y: [0, 12, 0], rotate: [0, 3, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="hidden lg:flex absolute top-64 right-10 p-3 rounded-2xl bg-white border border-nl-teal/20 shadow-lg items-center gap-2"
      >
        <Stethoscope className="w-4 h-4 text-nl-teal" />
        <span className="text-[10px] font-bold text-slate-700">Doctor network</span>
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-nl-mint border border-nl-light/40 text-xs font-semibold text-nl-deep"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nl-teal opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-nl-deep" />
              </span>
              <span>Live in Douala & Yaoundé</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-nl-ink leading-[1.05] font-display"
            >
              One hub. Every test.
              <br />
              <span className="bg-gradient-to-r from-nl-deep via-nl-teal to-nl-light bg-clip-text text-transparent">
                Every lab. Every result.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl"
            >
              Book a lab test from your phone. Scan your prescription with AI. Compare nearby labs. Pay with MTN MoMo or Orange Money. Watch your sample move. Get a lab-branded report the moment it is signed.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2"
            >
              <button
                onClick={() => onGoToPortal('patient')}
                className="px-7 py-4 rounded-2xl bg-gradient-to-r from-nl-deep via-nl-teal to-nl-light text-white font-bold text-sm shadow-xl shadow-teal-900/20 hover:shadow-teal-700/30 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Book a test</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#product"
                className="px-6 py-4 rounded-2xl bg-white border border-slate-200 text-nl-ink font-semibold text-sm hover:border-nl-teal/40 hover:bg-nl-off transition-all flex items-center justify-center gap-2"
              >
                <span>See how it works</span>
                <ChevronDown className="w-4 h-4 text-nl-teal" />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-4 text-xs font-medium text-slate-600"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-nl-teal" />
                Insurance verified at lab intake
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-nl-teal" />
                Append-only audit chain
              </span>
              <span className="flex items-center gap-1.5">
                <Scan className="w-4 h-4 text-nl-teal" />
                AI prescription scan
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="pt-6 space-y-2 max-w-md"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-nl-teal mb-2">
                Nearby labs · tap to compare
              </div>
              {labs.map((lab, i) => (
                <button
                  key={lab.name}
                  onClick={() => setActiveLab(i)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all ${
                    activeLab === i
                      ? 'bg-nl-mint border-nl-teal/50 shadow-md shadow-teal-900/10'
                      : 'bg-white border-slate-200 hover:border-nl-teal/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-nl-ink">{lab.name}</span>
                    {activeLab === i && <CheckCircle2 className="w-4 h-4 text-nl-teal" />}
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-nl-teal" /> {lab.dist}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-nl-teal" /> {lab.tat}
                    </span>
                    <span className="font-bold text-nl-ink">{lab.price}</span>
                  </div>
                </button>
              ))}
            </motion.div>
          </div>

          <div className="lg:col-span-6 relative flex justify-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-full max-w-[360px]"
            >
              <div className="absolute -inset-8 bg-gradient-to-tr from-nl-teal/20 via-nl-light/15 to-nl-blue/10 rounded-[3rem] blur-3xl pointer-events-none" />

              <div className="relative rounded-[2.5rem] bg-gradient-to-b from-slate-100 to-white p-3 shadow-[0_40px_100px_rgba(15,118,110,0.2)] border border-slate-200">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-900 rounded-full z-10" />
                <div className="rounded-[2rem] bg-white overflow-hidden relative border border-slate-100">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={screenIndex}
                      src={phoneScreens[screenIndex].src}
                      alt={phoneScreens[screenIndex].label}
                      initial={{ opacity: 0, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.7 }}
                      className="w-full h-auto block"
                    />
                  </AnimatePresence>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-md">
                    {phoneScreens.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          screenIndex === i ? 'w-5 bg-nl-teal' : 'w-1.5 bg-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="hidden sm:flex absolute -top-4 -left-10 p-3 rounded-2xl bg-white border border-nl-teal/30 shadow-xl items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-xl bg-nl-mint flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-nl-teal" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-nl-ink">Insurance split</div>
                  <div className="text-[10px] text-slate-500">80% / 20% copay</div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="hidden sm:flex absolute -bottom-4 -right-8 p-3 rounded-2xl bg-white border border-nl-teal/30 shadow-xl items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-xl bg-nl-mint flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-nl-teal" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-nl-ink">Batch invoice</div>
                  <div className="text-[10px] text-slate-500">5% on patient portion</div>
                </div>
              </motion.div>

              <div className="hidden sm:flex absolute top-1/2 -left-14 -translate-y-1/2 p-3 rounded-2xl bg-white border border-nl-teal/30 shadow-xl items-center gap-2.5">
                <Navigation className="w-4 h-4 text-nl-teal" />
                <div className="text-[10px] font-bold text-slate-600">Live GPS</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;