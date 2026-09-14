import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

interface FAQSectionProps {
  onGoToPortal: (role?: 'patient' | 'doctor' | 'lab') => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ onGoToPortal }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-nl-ink relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-nl-glow/10 border border-nl-glow/30 text-xs font-bold text-nl-glow">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got questions?</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display">
            Frequently asked.
          </h2>
          <p className="text-sm sm:text-base text-white/60">
            Everything about the new nanoLabs: three doors, batch invoicing, and the 5% model.
          </p>
        </div>

        <div className="space-y-3">
          {siteConfig.faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isOpen
                    ? 'bg-nl-black border-nl-glow/50 shadow-xl'
                    : 'bg-nl-black/60 border-white/10 hover:border-white/25'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-white">{faq.question}</span>
                  <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-nl-glow shrink-0 transition-transform ${isOpen ? 'rotate-180 bg-nl-glow/20' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-white/60 leading-relaxed border-t border-white/10">
                        <p>{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center text-xs text-white/50 flex items-center justify-center gap-2">
          <span>Still curious?</span>
          <a href="#contact" className="text-nl-glow hover:underline font-bold">Talk to us</a>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;