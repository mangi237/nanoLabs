import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, Phone, MapPin, CheckCircle2, Loader2 } from 'lucide-react';
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
    <section id="contact" className="py-24 bg-nl-off relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-bold text-nl-blue uppercase tracking-wider bg-blue-50 px-3.5 py-1 rounded-full border border-blue-100">
                Get in touch
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-nl-ink tracking-tight font-display">
                Let us connect the diagnostic network.
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Whether you are a patient, a doctor, a laboratory, an insurer, or a strategic partner — we would love to hear from you.
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <motion.a
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                href={`mailto:${siteConfig.email}`}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-nl-teal/40 transition-all flex items-center gap-3.5 text-nl-ink group"
              >
                <div className="w-10 h-10 rounded-xl bg-nl-mint text-nl-deep flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Email us</div>
                  <div className="text-xs sm:text-sm font-bold group-hover:text-nl-teal transition-colors">{siteConfig.email}</div>
                </div>
              </motion.a>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center gap-3.5 text-nl-ink">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-nl-blue flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Direct telephone</div>
                  <div className="text-xs sm:text-sm font-bold">{siteConfig.phone}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center gap-3.5 text-nl-ink">
                <div className="w-10 h-10 rounded-xl bg-nl-mint text-nl-deep flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Headquarters & deployment</div>
                  <div className="text-xs sm:text-sm font-bold">{siteConfig.location}</div>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 lg:p-10 shadow-xl"
          >
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 rounded-3xl bg-nl-mint border border-nl-light/40 text-nl-deep flex items-center justify-center mx-auto shadow-lg shadow-teal-900/10"
                >
                  <CheckCircle2 className="w-8 h-8" />
                </motion.div>
                <h3 className="text-2xl font-black text-nl-ink font-display">Message received</h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Thank you for contacting nanoLabs. Our team will review your message and reply to <strong className="text-nl-ink">{email}</strong> promptly.
                </p>
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); setMessage(''); }}
                  className="px-6 py-2.5 rounded-xl bg-nl-off hover:bg-slate-100 border border-slate-200 text-nl-ink text-xs font-bold cursor-pointer transition-all"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-black text-nl-ink mb-2 font-display">Send a direct message</h3>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Full name <span className="text-rose-500">*</span></label>
                    <input
                      type="text" required value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dr. Jean-Paul Mbarga"
                      className="w-full px-4 py-3 rounded-xl bg-nl-off border border-slate-200 text-nl-ink text-xs placeholder:text-slate-400 focus:outline-none focus:border-nl-teal focus:ring-1 focus:ring-nl-teal transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Email address <span className="text-rose-500">*</span></label>
                    <input
                      type="email" required value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. contact@laboratory.cm"
                      className="w-full px-4 py-3 rounded-xl bg-nl-off border border-slate-200 text-nl-ink text-xs placeholder:text-slate-400 focus:outline-none focus:border-nl-teal focus:ring-1 focus:ring-nl-teal transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Organization / Lab</label>
                    <input
                      type="text" value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. Polyclinique Douala"
                      className="w-full px-4 py-3 rounded-xl bg-nl-off border border-slate-200 text-nl-ink text-xs placeholder:text-slate-400 focus:outline-none focus:border-nl-teal transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Country</label>
                    <select
                      value={country} onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-nl-off border border-slate-200 text-nl-ink text-xs focus:outline-none focus:border-nl-teal transition-all"
                    >
                      <option>Cameroon</option>
                      <option>Gabon</option>
                      <option>Chad</option>
                      <option>Congo</option>
                      <option>Central African Republic</option>
                      <option>Equatorial Guinea</option>
                      <option>Nigeria</option>
                      <option>International</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Enquiry type</label>
                    <select
                      value={enquiryType} onChange={(e) => setEnquiryType(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-nl-off border border-slate-200 text-nl-ink text-xs focus:outline-none focus:border-nl-teal transition-all"
                    >
                      <option>Patient</option>
                      <option>Doctor / Physician</option>
                      <option>Laboratory onboarding</option>
                      <option>Insurance / Corporate</option>
                      <option>Investor opportunity</option>
                      <option>Strategic partner</option>
                      <option>Media / Press</option>
                      <option>Employment</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Message <span className="text-rose-500">*</span></label>
                  <textarea
                    required rows={4} value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us how we can help."
                    className="w-full px-4 py-3 rounded-xl bg-nl-off border border-slate-200 text-nl-ink text-xs placeholder:text-slate-400 focus:outline-none focus:border-nl-teal focus:ring-1 focus:ring-nl-teal transition-all resize-none"
                  />
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-nl-deep via-nl-teal to-nl-light text-white font-bold text-xs sm:text-sm shadow-xl shadow-teal-900/20 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Sending message...</span></>
                  ) : (
                    <><Send className="w-4 h-4" /><span>Send message</span></>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;