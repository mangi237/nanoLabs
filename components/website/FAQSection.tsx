import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

interface FAQSectionProps {
  onGoToPortal: (role?: 'patient' | 'doctor' | 'lab') => void;
}

export const FAQSection: React.FC<FAQSectionProps> = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-nl-mint border border-nl-light/30 text-xs font-bold text-nl-deep">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got questions?</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-nl-ink tracking-tight font-display">
            Frequently asked.
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
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
                    ? 'bg-white border-nl-teal/50 shadow-lg'
                    : 'bg-nl-off border-slate-200 hover:border-nl-teal/30'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-nl-ink">{faq.question}</span>
                  <div className={`w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-nl-teal shrink-0 transition-transform ${isOpen ? 'rotate-180 bg-nl-mint' : ''}`}>
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
                      <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                        <p>{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <span>Still curious?</span>
          <a href="#contact" className="text-nl-teal hover:underline font-bold">Talk to us</a>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;