import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, Sparkles, Smartphone, Stethoscope, Building2 } from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

interface ProductShowcaseProps {
  onGoToPortal: (role?: 'patient' | 'doctor' | 'lab') => void;
}

const tabIcons: Record<string, any> = {
  patient: Smartphone,
  doctor: Stethoscope,
  lab: Building2,
};

export const ProductShowcase: React.FC<ProductShowcaseProps> = ({ onGoToPortal }) => {
  const [activeTab, setActiveTab] = useState<string>('patient');
  const current = siteConfig.productTabs.find((t) => t.id === activeTab) || siteConfig.productTabs[0];

  return (
    <section id="product" className="py-24 bg-nl-off relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-nl-teal/30 text-xs font-bold text-nl-deep">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Three apps, one platform</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-nl-ink tracking-tight font-display">
            Meet nanoLabs.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            One hub with three doors. Everything designed mobile-first for the way Cameroon books, pays, and shares.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-8 justify-start lg:justify-center">
          {siteConfig.productTabs.map((tab) => {
            const Icon = tabIcons[tab.id] || Smartphone;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 border ${
                  isActive
                    ? 'bg-gradient-to-r from-nl-deep to-nl-teal text-white border-transparent shadow-lg shadow-teal-900/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-nl-teal/40 hover:text-nl-deep'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-nl-teal'}`} />
                <span>{tab.label}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 lg:p-10 shadow-xl">
          <div className="lg:col-span-5 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="space-y-3"
              >
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-nl-mint text-nl-deep border border-nl-light/30 uppercase tracking-wider">
                  {current.roleAttribution}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-nl-ink tracking-tight font-display">
                  {current.tagline}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{current.description}</p>

                <div className="space-y-2.5 pt-3">
                  {current.keyHighlights.map((h, i) => (
                    <motion.div
                      key={h}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-3 text-xs text-slate-700"
                    >
                      <div className="w-5 h-5 rounded-full bg-nl-mint flex items-center justify-center text-nl-deep shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium leading-tight">{h}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => onGoToPortal()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-nl-deep to-nl-teal text-white font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer hover:scale-[1.03] transition-transform"
              >
                <span>Open in portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 relative">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative mx-auto max-w-[380px]"
            >
              <div className="absolute -inset-6 bg-gradient-to-tr from-nl-teal/15 via-nl-light/10 to-nl-blue/10 rounded-[3rem] blur-3xl pointer-events-none" />
              <div className="relative rounded-[2.5rem] bg-gradient-to-b from-slate-100 to-white p-3 shadow-2xl border border-slate-200">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-900 rounded-full z-10" />
                <div className="rounded-[2rem] overflow-hidden relative bg-white">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={current.mockupImage}
                      src={current.mockupImage}
                      alt={current.label}
                      initial={{ opacity: 0, scale: 1.03 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.6 }}
                      className="w-full h-auto block"
                    />
                  </AnimatePresence>
                </div>
              </div>

              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="hidden sm:flex absolute -top-6 -left-8 p-3 rounded-2xl bg-white border border-nl-teal/30 shadow-xl items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-nl-teal" />
                <span className="text-[10px] font-bold text-nl-ink">{current.label}</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;