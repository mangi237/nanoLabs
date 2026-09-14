import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

interface FAQSectionProps {
  onGoToPortal: (role?: 'patient' | 'doctor' | 'lab') => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ onGoToPortal }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 bg-[#F8FAF9] relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-teal-200 text-xs font-bold text-[#0F766E]">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got questions?</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0B1F1D] tracking-tight">
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
                    ? 'bg-white border-teal-300 shadow-lg'
                    : 'bg-white border-slate-200 hover:border-teal-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-[#0B1F1D]">
                    {faq.question}
                  </span>
                  <div className={`w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-[#0F766E] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 bg-teal-100' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-200">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <span>Still curious?</span>
          <a href="#contact" className="text-[#0F766E] hover:underline font-bold">
            Talk to us
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;