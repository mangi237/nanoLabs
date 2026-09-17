import React from 'react';
import { motion } from 'framer-motion';
import { Quote, BookOpen } from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

export const FounderSection: React.FC = () => {
  const { founder } = siteConfig;

  return (
    <section id="founder" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative rounded-3xl bg-gradient-to-tr from-nl-deep via-nl-teal to-nl-light p-1 shadow-2xl">
              <div className="rounded-[22px] bg-white overflow-hidden p-6 sm:p-8 space-y-6">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group">
                  <img
                    src={founder.image}
                    alt={founder.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-nl-ink/85 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-nl-mint text-nl-deep border border-nl-light/40">
                      Founder & Product Architect
                    </span>
                    <h3 className="text-xl font-black text-white mt-1 font-display">{founder.name}</h3>
                    <p className="text-xs text-white/80">{founder.role}</p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  {founder.socials.substack && (
                    <a
                      href={founder.socials.substack}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-nl-off text-slate-600 hover:text-white hover:bg-nl-teal transition-all"
                      aria-label="Substack"
                    >
                      <BookOpen className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-bold text-nl-teal uppercase tracking-wider bg-nl-mint px-3.5 py-1 rounded-full border border-nl-light/30">
                Founder origin & vision
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-nl-ink tracking-tight font-display">
                Built from a problem worth solving.
              </h2>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="p-6 rounded-3xl bg-nl-off border border-slate-200 space-y-3 relative"
            >
              <Quote className="w-8 h-8 text-nl-teal/30 absolute top-4 right-4" />
              <p className="text-base sm:text-lg font-medium text-nl-ink italic leading-relaxed">
                "{founder.quote}"
              </p>
              <div className="text-xs text-nl-teal font-bold">&mdash; {founder.name}, Founder</div>
            </motion.div>

            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <p>nanoLabs began after Mangi observed inefficiencies around laboratory healthcare during a hospital experience in Cameroon.</p>
              <p>As a software engineer, he set out to build a connected diagnostic hub designed around real African clinical workflows — patients, doctors, and laboratories on one platform.</p>
              <p>What started as an observation became nanoLabs: one hub, three doors, one record, and zero financial risk for the platform.</p>
            </div>

            <div className="pt-2 flex items-center gap-4 text-xs font-bold text-nl-ink">
              <span className="flex items-center gap-1.5 text-nl-teal">Douala & Yaoundé hubs</span>
              <span className="text-slate-300">&middot;</span>
              <span className="text-slate-600">Building for CEMAC</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FounderSection;