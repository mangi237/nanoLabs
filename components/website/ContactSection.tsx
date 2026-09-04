import React, { useState } from 'react';
import { 
  Send, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Loader2, 
  Building2, 
  Globe2,
  Sparkles
} from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

export const ContactSection: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [country, setCountry] = useState('Cameroon');
  const [enquiryType, setEnquiryType] = useState('Laboratory');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all required fields (Name, Email, Message).');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate reliable dispatch
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 900);
  };

  return (
    <section id="contact" className="py-24 bg-[#07111F] relative overflow-hidden border-t border-white/5">
      {/* Background Lighting */}
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#00A6A6]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Contact Intro & Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#1677FF] uppercase tracking-wider bg-[#1677FF]/10 px-3.5 py-1 rounded-full border border-[#1677FF]/20">
                Get In Touch
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Let's build better laboratory infrastructure.
              </h2>
              <p className="text-sm text-[#AAB7C7] leading-relaxed">
                Whether you run a medical laboratory, manage a clinical diagnostic center, are looking to partner, or explore investment opportunities — we'd love to connect.
              </p>
            </div>

            {/* Direct Contact Cards */}
            <div className="space-y-3 pt-4">
              <a
                href={`mailto:${siteConfig.email}`}
                className="p-4 rounded-2xl bg-[#0B1F3A]/60 border border-white/10 hover:border-[#20C997]/40 transition-all flex items-center gap-3.5 text-white group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#20C997]/20 text-[#20C997] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#AAB7C7]">Email Us Directly</div>
                  <div className="text-xs sm:text-sm font-bold text-white group-hover:text-[#20C997] transition-colors">{siteConfig.email}</div>
                </div>
              </a>

              <div className="p-4 rounded-2xl bg-[#0B1F3A]/60 border border-white/10 flex items-center gap-3.5 text-white">
                <div className="w-10 h-10 rounded-xl bg-[#1677FF]/20 text-[#1677FF] flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#AAB7C7]">Direct Telephone</div>
                  <div className="text-xs sm:text-sm font-bold text-white">{siteConfig.phone}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0B1F3A]/60 border border-white/10 flex items-center gap-3.5 text-white">
                <div className="w-10 h-10 rounded-xl bg-[#7C5CFC]/20 text-[#7C5CFC] flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#AAB7C7]">Headquarters & Deployment</div>
                  <div className="text-xs sm:text-sm font-bold text-white">{siteConfig.location} 🇨🇲</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="lg:col-span-7 rounded-3xl bg-[#0B1F3A]/60 border border-white/15 p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl">
            {submitted ? (
              <div className="text-center py-12 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-3xl bg-[#20C997]/20 border border-[#20C997]/30 text-[#20C997] flex items-center justify-center mx-auto shadow-lg shadow-[#20C997]/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-white">
                  Message Received
                </h3>
                <p className="text-xs sm:text-sm text-[#AAB7C7] max-w-md mx-auto leading-relaxed">
                  Thank you for contacting NanoLabs. Our clinical deployment team will review your message and reply to <strong className="text-white">{email}</strong> promptly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#07111F] hover:bg-[#07111F]/80 border border-white/10 text-white text-xs font-bold cursor-pointer transition-all"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-black text-white mb-2">
                  Send a Direct Message
                </h3>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 font-medium">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dr. Jean-Paul Mbarga"
                      className="w-full px-4 py-3 rounded-xl bg-[#07111F] border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-[#20C997] focus:ring-1 focus:ring-[#20C997] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. contact@laboratory.cm"
                      className="w-full px-4 py-3 rounded-xl bg-[#07111F] border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-[#20C997] focus:ring-1 focus:ring-[#20C997] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Organization / Lab
                    </label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. Polyclinique Douala"
                      className="w-full px-4 py-3 rounded-xl bg-[#07111F] border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-[#20C997] focus:ring-1 focus:ring-[#20C997] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Country
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#07111F] border border-white/10 text-white text-xs focus:outline-none focus:border-[#20C997] transition-all"
                    >
                      <option value="Cameroon">Cameroon 🇨🇲</option>
                      <option value="Nigeria">Nigeria 🇳🇬</option>
                      <option value="Gabon">Gabon 🇬🇦</option>
                      <option value="Chad">Chad 🇹🇩</option>
                      <option value="Congo">Congo 🇨🇬</option>
                      <option value="Ivory Coast">Ivory Coast 🇨🇮</option>
                      <option value="Senegal">Senegal 🇸🇳</option>
                      <option value="International">International</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Enquiry Type
                    </label>
                    <select
                      value={enquiryType}
                      onChange={(e) => setEnquiryType(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#07111F] border border-white/10 text-white text-xs focus:outline-none focus:border-[#20C997] transition-all"
                    >
                      <option value="Laboratory">Laboratory Onboarding</option>
                      <option value="Hospital">Hospital / Clinic Network</option>
                      <option value="Doctor">Doctor / Physician Partner</option>
                      <option value="Investor">Investor Opportunity</option>
                      <option value="Strategic Partner">Strategic Partner</option>
                      <option value="Media">Media / Press</option>
                      <option value="Employment">Employment</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Message <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your laboratory, clinic, or partnership interest..."
                    className="w-full px-4 py-3 rounded-xl bg-[#07111F] border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-[#20C997] focus:ring-1 focus:ring-[#20C997] transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#1677FF] via-[#00A6A6] to-[#20C997] text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-[#1677FF]/25 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
