import React from 'react';
import { 
  Quote, 
//   Linkedin, 
//   Twitter, 
//   Github, 
  Mail, 
  BookOpen,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

export const FounderSection: React.FC = () => {
  const { founder } = siteConfig;

  return (
    <section id="founder" className="py-24 bg-[#0B1F3A]/40 relative overflow-hidden border-t border-white/5">
      {/* Background ambient lighting */}
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#1677FF]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Founder Photo / Portrait Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl bg-gradient-to-tr from-[#1677FF] via-[#00A6A6] to-[#20C997] p-1 shadow-2xl">
              <div className="rounded-[22px] bg-[#07111F] overflow-hidden p-6 sm:p-8 space-y-6">
                {/* Visual Avatar / Profile Photo Container */}
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#0B1F3A] border border-white/10 flex items-center justify-center group">
                  <img
                    src="https://media2.dev.to/dynamic/image/width=320,height=320,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.us-east-2.amazonaws.com%2Fuploads%2Fuser%2Fprofile_image%2F4079159%2F38208a1c-7616-4dcc-b3c3-b6bf35bbb0dc.jpeg"
                    alt={founder.name}
                    className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07111F] via-transparent to-transparent" />
                  
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#20C997]/20 text-[#20C997] border border-[#20C997]/30">
                      Founder & Lead Engineer
                    </span>
                    <h3 className="text-xl font-black text-white mt-1">
                      {founder.name}
                    </h3>
                    <p className="text-xs text-[#AAB7C7]">
                      {founder.role}
                    </p>
                  </div>
                </div>

                {/* Social Links */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  {founder.socials.linkedin && (
                    <a
                      href={founder.socials.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-[#0B1F3A] text-[#AAB7C7] hover:text-white hover:bg-[#1677FF] transition-all"
                      aria-label="LinkedIn"
                    >
                      {/* <Linkedin className="w-4 h-4" /> */}
                    </a>
                  )}
                  {founder.socials.x && (
                    <a
                      href={founder.socials.x}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-[#0B1F3A] text-[#AAB7C7] hover:text-white hover:bg-slate-700 transition-all"
                      aria-label="Twitter / X"
                    >
                      {/* <Twitter className="w-4 h-4" /> */}
                    </a>
                  )}
                  {founder.socials.github && (
                    <a
                      href={founder.socials.github}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-[#0B1F3A] text-[#AAB7C7] hover:text-white hover:bg-slate-700 transition-all"
                      aria-label="GitHub"
                    >
                      {/* <Github className="w-4 h-4" /> */}
                    </a>
                  )}
                  {founder.socials.substack && (
                    <a
                      href={founder.socials.substack}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-[#0B1F3A] text-[#AAB7C7] hover:text-white hover:bg-amber-600 transition-all"
                      aria-label="Substack"
                    >
                      <BookOpen className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Founder Story & Philosophy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#1677FF] uppercase tracking-wider bg-[#1677FF]/10 px-3.5 py-1 rounded-full border border-[#1677FF]/20">
                Founder Origin & Vision
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Built from a problem worth solving.
              </h2>
            </div>

            {/* Founder Quote Card */}
            <div className="p-6 rounded-3xl bg-[#07111F] border border-white/10 space-y-3 relative">
              <Quote className="w-8 h-8 text-[#20C997]/30 absolute top-4 right-4" />
              <p className="text-base sm:text-lg font-medium text-slate-100 italic leading-relaxed">
                "{founder.quote}"
              </p>
              <div className="text-xs text-[#20C997] font-bold">
                — {founder.name}, Founder
              </div>
            </div>

            {/* Narrative Story */}
            <div className="space-y-4 text-sm text-[#AAB7C7] leading-relaxed">
              <p>
                NanoLabs began after Mangi observed inefficiencies around laboratory healthcare during a hospital experience in Cameroon.
              </p>
              <p>
                As a software developer, he began exploring how modern cloud architecture, intuitive UX, and digital security could create a more connected laboratory experience.
              </p>
              <p>
                What began as an observation became NanoLabs — a product being developed around real laboratory workflows, multi-role clinical responsibilities, and the realities of building technology in Cameroon.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-4 text-xs font-bold text-white">
              <span className="flex items-center gap-1.5 text-[#20C997]">
                🇨🇲 Douala & Yaoundé Hubs
              </span>
              <span>•</span>
              <span className="text-slate-300">Building for Africa</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FounderSection;
