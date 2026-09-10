import React from 'react';
import { Users, Code, Stethoscope, Sparkles } from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

export const TeamSection: React.FC = () => {
  const teamMembers = [
    {
      name: siteConfig.founder.name,
      role: 'Founder & System Architect',
      bio: 'Leading product architecture, multi-tenant LIMS core, offline-sync protocols, and developer operations.',
      badge: 'Engineering & Product'
    },
    {
      name: 'Clinical Advisory Board',
      role: 'Medical Biologists & Pathologists',
      bio: 'Practicing laboratory directors ensuring ONMC compliance, validation workflows, reference ranges, and quality standards.',
      badge: 'Clinical Governance'
    },
    {
      name: 'Operations & Lab Success',
      role: 'Deployment & Training',
      bio: 'Supporting on-site laboratory staff onboarding, barcode scanner integrations, and customer satisfaction.',
      badge: 'Lab Operations'
    }
  ];

  return (
    <section className="py-20 bg-[#041C18] relative overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-[#2DD4BF] uppercase tracking-wider bg-[#2DD4BF]/10 px-3.5 py-1 rounded-full border border-[#2DD4BF]/20">
            People Behind The Mission
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            The people building NanoLabs.
          </h2>
          <p className="text-xs sm:text-sm text-[#93B4AF]">
            Combining software craftsmanship with deep clinical and operational expertise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {teamMembers.map((member, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-[#0A2C27]/50 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-xl space-y-3"
            >
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#2DD4BF]">
                {member.badge}
              </span>
              <h3 className="text-base font-black text-white">{member.name}</h3>
              <div className="text-xs font-bold text-[#0EA5E9]">{member.role}</div>
              <p className="text-xs text-[#93B4AF] leading-relaxed">
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
