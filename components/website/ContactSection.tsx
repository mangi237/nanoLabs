import React, { useState } from 'react';
import {
  Send,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

export const ContactSection: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [country, setCountry] = useState('Cameroon');
  const [enquiryType, setEnquiryType] = useState('Patient');
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

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 900);
  };

  return (
    <section id="contact" className="py-24 bg-[#F8FAF9] relative overflow-hidden">
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#0F766E]/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#1677FF] uppercase tracking-wider bg-blue-50 px-3.5 py-1 rounded-full border border-blue-100">
                Get in touch
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-[#0B1F1D] tracking-tight">
                Let's connect the diagnostic network.
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Whether you are a patient, a doctor, a laboratory, an insurer, or a strategic partner — we would love to hear from you.
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <a
                href={`mailto:${siteConfig.email}`}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-300 transition-all flex items-center gap-3.5 text-[#0B1F1D] group"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Email us</div>
                  <div className="text-xs sm:text-sm font-bold text-[#0B1F1D] group-hover:text-[#0F766E] transition-colors">{siteConfig.email}</div>
                </div>
              </a>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center gap-3.5 text-[#0B1F1D]">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1677FF] flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Direct telephone</div>
                  <div className="text-xs sm:text-sm font-bold text-[#0B1F1D]">{siteConfig.phone}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center gap-3.5 text-[#0B1F1D]">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Headquarters & deployment</div>
                  <div className="text-xs sm:text-sm font-bold text-[#0B1F1D]">{siteConfig.location}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 lg:p-10 shadow-xl">
            {submitted ? (
              <div className="text-center py-12 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center mx-auto shadow-lg shadow-teal-900/10">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-[#0B1F1D]">
                  Message received
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Thank you for contacting nanoLabs. Our team will review your message and reply to <strong className="text-[#0B1F1D]">{email}</strong> promptly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#F8FAF9] hover:bg-slate-100 border border-slate-200 text-[#0B1F1D] text-xs font-bold cursor-pointer transition-all"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-black text-[#0B1F1D] mb-2">
                  Send a direct message
                </h3>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Full name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dr. Jean-Paul Mbarga"
                      className="w-full px-4 py-3 rounded-xl bg-[#F8FAF9] border border-slate-200 text-[#0B1F1D] text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Email address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. contact@laboratory.cm"
                      className="w-full px-4 py-3 rounded-xl bg-[#F8FAF9] border border-slate-200 text-[#0B1F1D] text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Organization / Lab
                    </label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. Polyclinique Douala"
                      className="w-full px-4 py-3 rounded-xl bg-[#F8FAF9] border border-slate-200 text-[#0B1F1D] text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Country
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#F8FAF9] border border-slate-200 text-[#0B1F1D] text-xs focus:outline-none focus:border-[#0F766E] transition-all"
                    >
                      <option value="Cameroon">Cameroon</option>
                      <option value="Gabon">Gabon</option>
                      <option value="Chad">Chad</option>
                      <option value="Congo">Congo</option>
                      <option value="Central African Republic">Central African Republic</option>
                      <option value="Equatorial Guinea">Equatorial Guinea</option>
                      <option value="Nigeria">Nigeria</option>
                      <option value="International">International</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Enquiry type
                    </label>
                    <select
                      value={enquiryType}
                      onChange={(e) => setEnquiryType(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#F8FAF9] border border-slate-200 text-[#0B1F1D] text-xs focus:outline-none focus:border-[#0F766E] transition-all"
                    >
                      <option value="Patient">Patient</option>
                      <option value="Doctor">Doctor / Physician</option>
                      <option value="Laboratory">Laboratory onboarding</option>
                      <option value="Insurer">Insurance / Corporate</option>
                      <option value="Investor">Investor opportunity</option>
                      <option value="Strategic Partner">Strategic partner</option>
                      <option value="Media">Media / Press</option>
                      <option value="Employment">Employment</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us how we can help."
                    className="w-full px-4 py-3 rounded-xl bg-[#F8FAF9] border border-slate-200 text-[#0B1F1D] text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0D3B38] via-[#0F766E] to-[#14B8A6] text-white font-bold text-xs sm:text-sm shadow-xl shadow-teal-900/20 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send message</span>
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