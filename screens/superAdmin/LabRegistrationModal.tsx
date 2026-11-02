import React, { useState } from 'react';
import {
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  Award,
  User,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Truck,
  Sparkles,
  Check,
  Lock,
} from 'lucide-react';
import { db, addDoc, collection } from '../../services/firebase';
import { cleanFirestoreData, validatePhoneNumber } from '../../utils/sanitizeData';
import { LAB_PACKAGE_LIST, LAB_PACKAGES, LabPackageId } from '../../utils/labPackages';

interface LabRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLabCreated?: () => void;
}

const field =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition';
const label = 'block text-sm font-semibold text-slate-700 mb-1.5';

const makeAccessCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export const LabRegistrationModal: React.FC<LabRegistrationModalProps> = ({
  isOpen,
  onClose,
  onLabCreated,
}) => {
  const [form, setForm] = useState<{
    labName: string;
    city: string;
    address: string;
    phone: string;
    email: string;
    licenseNumber: string;
    managerName: string;
    managerEmail: string;
    planId: LabPackageId;
    needsMobilePhlebotomist: boolean;
    ratePer100m: number;
  }>({
    labName: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    licenseNumber: '',
    managerName: '',
    managerEmail: '',
    planId: 'december_promo',
    needsMobilePhlebotomist: false,
    ratePer100m: 60,
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState<{
    labId: string;
    labName: string;
    accessCode: string;
    planName: string;
    needsMobilePhlebotomist: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const selectedPkg = LAB_PACKAGES[form.planId] || LAB_PACKAGES.december_promo;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.labName.trim().length < 3) return setError('Enter the official name of the laboratory.');
    if (!form.city.trim()) return setError('Enter the city where the lab operates.');
    const pv = validatePhoneNumber(form.phone);
    if (!pv.isValid) return setError(pv.errorMessage || 'Enter a valid 9-digit phone number.');
    if (!form.email.includes('@')) return setError('Enter a valid laboratory contact email.');
    if (!form.licenseNumber.trim()) return setError('Enter your Ministry of Public Health license or accreditation number.');
    if (form.managerName.trim().length < 2) return setError('Enter the name of the lab director or administrator.');
    if (!acceptedTerms) return setError('Please confirm you are authorised to register this facility.');

    setSaving(true);
    try {
      const accessCode = 'ADM-' + makeAccessCode();
      const now = new Date().toISOString();
      const pkg = LAB_PACKAGES[form.planId] || LAB_PACKAGES.december_promo;
      const mobilePhlebEnabled = Boolean(form.needsMobilePhlebotomist);

      const labFeatures = mobilePhlebEnabled
        ? ['Home pickup', 'Walk-in collection', 'Accredited']
        : ['Walk-in collection', 'Accredited'];

      const labRecord = cleanFirestoreData({
        name: form.labName.trim(),
        city: form.city.trim(),
        location: form.city.trim(),
        address: form.address.trim() || form.city.trim(),
        phone: pv.formatted,
        phoneDigits: pv.digits,
        email: form.email.trim().toLowerCase(),
        licenseNumber: form.licenseNumber.trim(),
        directorName: form.managerName.trim(),
        adminEmail: (form.managerEmail || form.email).trim().toLowerCase(),
        plan: pkg.id,
        planId: pkg.id,
        planName: pkg.name,
        pricingModel: 'flat_subscription',
        subscriptionTier: pkg.legacyTier,
        subscriptionPrice: pkg.priceMonthlyXaf,
        maxTestsPerMonth: pkg.maxTestsPerMonth,
        maxStaff: pkg.maxStaff,
        staffLimit: pkg.maxStaff,
        includedFeatures: pkg.includedFeatures,
        needsMobilePhlebotomist: mobilePhlebEnabled,
        supportsHomePickup: mobilePhlebEnabled,
        ratePer100m: mobilePhlebEnabled ? Number(form.ratePer100m) || 60 : 0,
        features: labFeatures,
        currency: 'FCFA',
        currencySymbol: 'FCFA',
        primaryColor: '#0F766E',
        status: 'active',
        subscriptionStartDate: now,
        createdAt: now,
        updatedAt: now,
      });

      const labDoc = await addDoc(collection(db, 'labs'), labRecord);

      const initialAdminRoles = mobilePhlebEnabled
        ? ['admin', 'receptionist', 'cashier', 'mobile_phlebotomist', 'analyzer', 'lab_tech', 'biologist']
        : ['admin', 'receptionist', 'cashier', 'analyzer', 'lab_tech', 'biologist'];

      await addDoc(
        collection(db, 'labs', labDoc.id, 'staff'),
        cleanFirestoreData({
          name: form.managerName.trim(),
          email: (form.managerEmail || form.email).trim().toLowerCase(),
          phone: pv.formatted,
          role: 'admin',
          primaryRole: 'admin',
          roles: initialAdminRoles,
          accessCode,
          initialCode: accessCode,
          labId: labDoc.id,
          labName: form.labName.trim(),
          status: 'active',
          mustChangePassword: false,
          createdAt: now,
        })
      );

      try {
        localStorage.setItem(
          'nanolabs_active_lab',
          JSON.stringify({ id: labDoc.id, ...labRecord })
        );
      } catch {}

      setSubmitted({
        labId: labDoc.id,
        labName: form.labName.trim(),
        accessCode,
        planName: `${pkg.name} (${pkg.priceLabel})`,
        needsMobilePhlebotomist: mobilePhlebEnabled,
      });
    } catch (err: any) {
      setError(err?.message || 'Could not submit your registration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const copyCode = () => {
    if (!submitted) return;
    navigator.clipboard.writeText(submitted.accessCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const done = () => {
    onLabCreated?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl border border-slate-200/80 my-auto max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {submitted ? 'Laboratory Registered' : 'Register a Laboratory'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {submitted
                ? 'Save your administrator access code below — your subscription package and service rules are active.'
                : 'Select your operating package, mobile phlebotomist preference, and facility credentials.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {submitted ? (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{submitted.labName} is ready</p>
                  <p className="text-emerald-800/80 mt-0.5">
                    Active Package: <strong>{submitted.planName}</strong> •{' '}
                    {submitted.needsMobilePhlebotomist
                      ? 'Mobile Phlebotomist Home Sample Pickup Enabled'
                      : 'Walk-In Collection Only (Mobile Phlebotomist Disabled)'}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 text-sm">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-slate-500">Administrator access code</span>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="inline-flex items-center gap-2 font-mono font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
                  >
                    {submitted.accessCode}
                    <Copy className="w-4 h-4" />
                    {copied && <span className="text-xs font-sans text-emerald-600">Copied</span>}
                  </button>
                </div>
                <div className="px-4 py-3 text-xs text-slate-500">
                  Keep this code private. Select <strong>{submitted.labName}</strong> under Laboratory Staff on the sign-in screen and enter this code. Logo, test prices, and staff accounts are configured inside the admin dashboard.
                </div>
              </div>

              <button
                type="button"
                onClick={done}
                className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-2xl text-sm transition cursor-pointer"
              >
                Done & Go to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className={label}>Laboratory name</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={form.labName}
                    onChange={set('labName')}
                    placeholder="Centre Médical d'Analyses BioSanté"
                    className={`${field} pl-11`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>City</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={set('city')}
                      placeholder="Douala, Yaoundé, Bafoussam…"
                      className={`${field} pl-11`}
                    />
                  </div>
                </div>
                <div>
                  <label className={label}>Street / neighbourhood</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={set('address')}
                    placeholder="Akwa, Rue Castelnau"
                    className={field}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Official phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={set('phone')}
                      placeholder="699 00 00 00"
                      className={`${field} pl-11`}
                    />
                  </div>
                </div>
                <div>
                  <label className={label}>Official email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={set('email')}
                      placeholder="contact@biosante.cm"
                      className={`${field} pl-11`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={label}>MINSANTE license / accreditation number</label>
                <div className="relative">
                  <Award className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={form.licenseNumber}
                    onChange={set('licenseNumber')}
                    placeholder="MINSANTE/LAB/2025/0412"
                    className={`${field} pl-11`}
                  />
                </div>
              </div>

              {/* Opt-In Mobile Phlebotomist Configuration */}
              <div
                onClick={() =>
                  setForm((f) => ({ ...f, needsMobilePhlebotomist: !f.needsMobilePhlebotomist }))
                }
                className={`p-4 rounded-2xl border-2 transition cursor-pointer select-none ${
                  form.needsMobilePhlebotomist
                    ? 'border-teal-600 bg-teal-50/70'
                    : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        form.needsMobilePhlebotomist
                          ? 'bg-teal-700 text-white'
                          : 'bg-white border border-slate-200 text-slate-500'
                      }`}
                    >
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-900">
                          Need Mobile Phlebotomist (Home Sample Pickup)?
                        </p>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            form.needsMobilePhlebotomist
                              ? 'bg-teal-700 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {form.needsMobilePhlebotomist ? 'Enabled for this Lab' : 'Walk-In Only'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Enable this ONLY if your laboratory dispatches mobile phlebotomists to collect samples at patients&apos; homes or offices. If unchecked, patients will book Walk-In visits only and the Mobile Phlebotomist desk will stay hidden.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.needsMobilePhlebotomist}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, needsMobilePhlebotomist: e.target.checked }))
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-500"
                  />
                </div>

                {form.needsMobilePhlebotomist && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 pt-3 border-t border-teal-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <span className="text-xs font-semibold text-teal-900">
                      Home pickup distance tariff (FCFA per 100 meters):
                    </span>
                    <input
                      type="number"
                      min={10}
                      max={1000}
                      value={form.ratePer100m}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, ratePer100m: Number(e.target.value) || 60 }))
                      }
                      className="w-32 px-3 py-1.5 bg-white border border-teal-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-slate-100">
                <div>
                  <label className={label}>Lab director / administrator</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={form.managerName}
                      onChange={set('managerName')}
                      placeholder="Dr. Jean-Paul Biya"
                      className={`${field} pl-11`}
                    />
                  </div>
                </div>
                <div>
                  <label className={label}>Administrator email</label>
                  <input
                    type="email"
                    value={form.managerEmail}
                    onChange={set('managerEmail')}
                    placeholder="Same as above if blank"
                    className={field}
                  />
                </div>
              </div>

              {/* Subscription Packages with December 15,000 XAF Special + Strict Quota Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">
                    Select Subscription Package (Strictly Enforced)
                  </label>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    December Promo Live
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {LAB_PACKAGE_LIST.map((p) => {
                    const active = form.planId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, planId: p.id }))}
                        className={`text-left p-4 rounded-2xl border-2 transition cursor-pointer relative ${
                          active
                            ? p.isPromo
                              ? 'border-amber-500 bg-amber-50/70'
                              : 'border-teal-600 bg-teal-50/60'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        {p.badge && (
                          <span
                            className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md mb-1.5 ${
                              p.isPromo
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-teal-700 text-white'
                            }`}
                          >
                            {p.badge}
                          </span>
                        )}
                        <p className="text-sm font-bold text-slate-900">{p.name}</p>
                        <p
                          className={`text-sm font-extrabold font-mono mt-0.5 ${
                            p.isPromo ? 'text-amber-800' : 'text-teal-700'
                          }`}
                        >
                          {p.priceLabel}
                        </p>
                        <p className="text-xs text-slate-600 mt-1 font-medium">{p.detail}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Package Capabilities Preview */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      Included in {selectedPkg.name} ({selectedPkg.priceLabel}):
                    </span>
                  </div>
                  <div className="space-y-1">
                    {selectedPkg.includedBullets.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                    {selectedPkg.excludedBullets.map((item, idx) => (
                      <div key={`ex-${idx}`} className="flex items-start gap-2 text-slate-400">
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 rounded border-slate-300 text-teal-700 focus:ring-teal-500"
                />
                <span>
                  I am authorised to register this clinical laboratory, accept the selected package limits, and confirm the accreditation details above are accurate.
                </span>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registering laboratory…
                  </>
                ) : (
                  `Register Laboratory (${selectedPkg.priceLabel})`
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabRegistrationModal;
