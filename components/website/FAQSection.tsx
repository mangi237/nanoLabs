import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

interface FAQSectionProps {
  onGoToPortal: () => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ onGoToPortal }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 bg-[#0B1F3A]/40 relative overflow-hidden border-t border-white/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0B1F3A] border border-white/10 text-xs font-bold text-[#20C997]">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Frequently asked questions.
          </h2>
          <p className="text-sm sm:text-base text-[#AAB7C7]">
            Everything you need to know about NanoLabs, clinical onboarding, and portal access.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {siteConfig.faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isOpen
                    ? 'bg-[#07111F] border-[#20C997]/40 shadow-xl'
                    : 'bg-[#07111F]/60 border-white/5 hover:border-white/15'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-white">
                    {faq.question}
                  </span>
                  <div className={`w-8 h-8 rounded-xl bg-[#0B1F3A] flex items-center justify-center text-[#20C997] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 bg-[#20C997]/20 text-[#20C997]' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-[#AAB7C7] leading-relaxed border-t border-white/5 animate-in fade-in duration-200">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support Note */}
        <div className="mt-12 text-center text-xs text-[#AAB7C7] flex items-center justify-center gap-2">
          <span>Have a question not listed here?</span>
          <a
            href="#contact"
            className="text-[#20C997] hover:underline font-bold"
          >
            Contact our team →
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
