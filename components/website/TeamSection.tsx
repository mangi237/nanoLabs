import React from 'react';
import { siteConfig } from '../../data/siteConfig';

export const TeamSection: React.FC = () => {
  const teamMembers = [
    {
      name: siteConfig.founder.name,
      role: 'Founder & System Architect',
      bio: 'Leading product architecture, the multi-lab booking engine, batch-based invoicing, live tracking, and the append-only audit chain.',
      badge: 'Engineering & Product'
    },
    {
      name: 'Clinical Advisory Board',
      role: 'Medical Biologists & Pathologists',
      bio: 'Practicing laboratory directors ensuring ONMC compliance, validation workflows, reference ranges, and report signing standards.',
      badge: 'Clinical Governance'
    },
    {
      name: 'Operations & Lab Success',
      role: 'Deployment & Training',
      bio: 'Supporting on-site laboratory staff onboarding, cashier verification flows, phlebotomist transit training, and customer satisfaction.',
      badge: 'Lab Operations'
    }
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider bg-teal-50 px-3.5 py-1 rounded-full border border-teal-200">
            People behind the mission
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#0B1F1D] tracking-tight">
            The people building nanoLabs.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Combining software craftsmanship with deep clinical and operational expertise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {teamMembers.map((member, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-[#F8FAF9] border border-slate-200 hover:border-teal-300 transition-all duration-300 hover:shadow-xl space-y-3"
            >
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-[#0F766E]">
                {member.badge}
              </span>
              <h3 className="text-base font-black text-[#0B1F1D]">{member.name}</h3>
              <div className="text-xs font-bold text-[#1677FF]">{member.role}</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;