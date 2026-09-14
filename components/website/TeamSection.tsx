import React from 'react';
import { motion } from 'framer-motion';
import { siteConfig } from '../../data/siteConfig';

export const TeamSection: React.FC = () => {
  const team = [
    { name: siteConfig.founder.name, role: 'Founder & System Architect', bio: 'Leading product architecture, the multi-lab booking engine, batch-based invoicing, live tracking, and the append-only audit chain.', badge: 'Engineering & Product' },
    { name: 'Clinical Advisory Board', role: 'Medical Biologists & Pathologists', bio: 'Practicing laboratory directors ensuring ONMC compliance, validation workflows, reference ranges, and report signing standards.', badge: 'Clinical Governance' },
    { name: 'Operations & Lab Success', role: 'Deployment & Training', bio: 'Supporting on-site laboratory staff onboarding, cashier verification flows, phlebotomist transit training, and customer satisfaction.', badge: 'Lab Operations' },
  ];

  return (
    <section className="py-20 bg-nl-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-nl-glow uppercase tracking-wider bg-nl-glow/10 px-3.5 py-1 rounded-full border border-nl-glow/20">
            People behind the mission
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-display">
            The people building nanoLabs.
          </h2>
          <p className="text-xs sm:text-sm text-white/60">
            Combining software craftsmanship with deep clinical and operational expertise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {team.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="p-6 rounded-3xl bg-nl-ink border border-white/10 hover:border-nl-glow/40 transition-all duration-300 hover:shadow-xl space-y-3"
            >
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-nl-glow/15 text-nl-glow">{m.badge}</span>
              <h3 className="text-base font-black text-white font-display">{m.name}</h3>
              <div className="text-xs font-bold text-nl-light">{m.role}</div>
              <p className="text-xs text-white/60 leading-relaxed">{m.bio}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;