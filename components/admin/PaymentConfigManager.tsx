import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  DollarSign, 
  Building2, 
  ShieldCheck, 
  Check, 
  Save, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  QrCode,
  Lock,
  Zap,
  Sliders,
  Sparkles,
  Layers,
  ArrowRight,
  Globe
} from 'lucide-react';

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  category: 'mobile_money' | 'cash' | 'bank' | 'card' | 'insurance_grant';
  provider: string;
  enabled: boolean;
  environment: 'live' | 'test';
  merchantName: string;
  merchantIdOrPhone: string;
  apiKeyOrSecret?: string;
  instructions: string;
  currency: string;
  acceptedCurrencies: string[];
  autoVerify: boolean;
  notes?: string;
}

export const DEFAULT_PAYMENT_CONFIGS: PaymentGatewayConfig[] = [
  {
    id: 'momo-mtn',
    name: 'MTN Mobile Money Cameroon',
    category: 'mobile_money',
    provider: 'MTN MoMo API v2',
    enabled: true,
    environment: 'live',
    merchantName: 'nanoLabs Clinical Diagnostics Ltd',
    merchantIdOrPhone: '+237 677 88 99 00',
    apiKeyOrSecret: 'momo_live_sec_8923a109bf',
    instructions: 'Patients dial *126# to confirm transaction or authorize via MoMo App prompt.',
    currency: 'XAF',
    acceptedCurrencies: ['XAF'],
    autoVerify: true,
    notes: 'Instant web-push notification sent to patient phone upon order submission.'
  },
  {
    id: 'orange-money',
    name: 'Orange Money Cameroon',
    category: 'mobile_money',
    provider: 'Orange Money WebPay',
    enabled: true,
    environment: 'live',
    merchantName: 'nanoLabs Clinical Diagnostics Ltd',
    merchantIdOrPhone: '+237 699 11 22 33',
    apiKeyOrSecret: 'om_token_991823abce',
    instructions: 'Patients authorize via *150*50# or Orange Money Cameroon mobile app.',
    currency: 'XAF',
    acceptedCurrencies: ['XAF'],
    autoVerify: true,
    notes: 'Integrated with Orange Cameroon Web Payment Gateway.'
  },
  {
    id: 'cash-desk',
    name: 'In-Clinic Physical Cash / POS',
    category: 'cash',
    provider: 'Laboratory Cashier Gatekeeper',
    enabled: true,
    environment: 'live',
    merchantName: 'nanoLabs Front Desk Till #1',
    merchantIdOrPhone: 'CASHIER-MAIN-DESK',
    instructions: 'Patient settles physical CFA Francs banknote at cashier counter before phlebotomy sampling.',
    currency: 'XAF',
    acceptedCurrencies: ['XAF'],
    autoVerify: true,
    notes: 'Gatekeeper cash enforcement: unlocked barcode status issued automatically upon full receipt settlement.'
  },
  {
    id: 'bank-wire',
    name: 'Direct Bank Transfer / SEPA / Wire',
    category: 'bank',
    provider: 'Afriland First Bank Cameroon',
    enabled: true,
    environment: 'live',
    merchantName: 'OMEVISION LTD / nanoLabs Healthcare',
    merchantIdOrPhone: 'CM21 10005 00012 01234567890 45',
    apiKeyOrSecret: 'AFRICMCA',
    instructions: 'Transfer reference must contain the Patient Booking Code (e.g. PID-10023). Send proof to billing@nanolabs.cm.',
    currency: 'XAF',
    acceptedCurrencies: ['XAF', 'EUR', 'USD'],
    autoVerify: false,
    notes: 'Requires cashier or billing accountant slip verification.'
  },
  {
    id: 'card-stripe',
    name: 'International Credit / Debit Cards (Visa, Mastercard)',
    category: 'card',
    provider: 'Stripe Global / UBA Merchant POS',
    enabled: false,
    environment: 'test',
    merchantName: 'nanoLabs Telehealth Global Portal',
    merchantIdOrPhone: 'pk_test_51K99LabDiagnosticCenter',
    instructions: 'Accepts international Visa, Mastercard, and American Express for diaspora or insured patients.',
    currency: 'XAF',
    acceptedCurrencies: ['XAF', 'EUR', 'USD'],
    autoVerify: true,
    notes: '3D Secure (3DS2) enabled for fraud prevention.'
  },
  {
    id: 'corporate-grant',
    name: 'Corporate Welfare & Health Insurance Grants',
    category: 'insurance_grant',
    provider: 'Direct Employer / Third-Party Payer Scheme',
    enabled: true,
    environment: 'live',
    merchantName: 'nanoLabs Partner Network COTE Engine',
    merchantIdOrPhone: 'HMO-BENEFIT-DESK',
    instructions: 'Co-pay computed according to insurance COTE matrix (e.g. 80% HMO coverage, 20% patient co-pay).',
    currency: 'XAF',
    acceptedCurrencies: ['XAF'],
    autoVerify: true,
    notes: 'Enforces Cameroon CNPS, Ascoma, Saar, Activa, and Gras Savoye validation rules.'
  }
];

export const PaymentConfigManager: React.FC = () => {
  const [configs, setConfigs] = useState<PaymentGatewayConfig[]>(() => {
    try {
      const saved = localStorage.getItem('nanoLabs_admin_payment_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PAYMENT_CONFIGS;
  });

  const [selectedId, setSelectedId] = useState<string>(DEFAULT_PAYMENT_CONFIGS[0].id);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'mobile_money' | 'cash' | 'bank' | 'card'>('all');

  const activeConfig = configs.find(c => c.id === selectedId) || configs[0];

  const handleUpdateActive = (updates: Partial<PaymentGatewayConfig>) => {
    setConfigs(prev => prev.map(c => c.id === activeConfig.id ? { ...c, ...updates } : c));
  };

  const handleToggleEnable = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  };

  const handleSaveAll = () => {
    localStorage.setItem('nanoLabs_admin_payment_config', JSON.stringify(configs));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all payment gateways to original recommended settings?')) {
      setConfigs(DEFAULT_PAYMENT_CONFIGS);
      localStorage.setItem('nanoLabs_admin_payment_config', JSON.stringify(DEFAULT_PAYMENT_CONFIGS));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const filtered = configs.filter(c => {
    if (activeFilter === 'all') return true;
    return c.category === activeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
            <CreditCard className="w-3.5 h-3.5" />
            Financial & Checkout Engine
          </div>
          <h2 className="text-2xl font-black tracking-tight">Payment Gateways & Settlement Accounts</h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Configure billing channels, merchant API credentials, mobile money accounts (MTN MoMo & Orange Money), cashier cash-desk rules, and banking wire instructions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-white/10"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Defaults
          </button>
          <button
            onClick={handleSaveAll}
            className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-teal-500/20 cursor-pointer"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                Settings Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Gateway Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Left List + Right Configuration Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Method Selector List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Payment Methods ({configs.filter(c => c.enabled).length}/{configs.length} active)
            </h3>
            <div className="flex items-center gap-1">
              {(['all', 'mobile_money', 'cash', 'bank'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    activeFilter === tab
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {tab === 'mobile_money' ? 'MOMO' : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {filtered.map(item => {
              const isSelected = item.id === activeConfig.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-teal-50/70 border-teal-500 shadow-md ring-2 ring-teal-500/20'
                      : 'bg-white border-slate-200 hover:border-teal-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      item.category === 'mobile_money' 
                        ? 'bg-amber-100 text-amber-800'
                        : item.category === 'cash'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.category === 'card'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {item.category === 'mobile_money' ? (
                        <Smartphone className="w-5 h-5" />
                      ) : item.category === 'cash' ? (
                        <DollarSign className="w-5 h-5" />
                      ) : item.category === 'card' ? (
                        <CreditCard className="w-5 h-5" />
                      ) : (
                        <Building2 className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900 truncate">{item.name}</h4>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                          item.environment === 'live' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.environment}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                        {item.merchantIdOrPhone || item.provider}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggleEnable(item.id, e)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        item.enabled ? 'bg-teal-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          item.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Summary Card */}
          <div className="bg-slate-900 text-slate-300 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-white">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Direct Settlement Policy
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Payments collected via Mobile Money and Bank Wire flow directly into the laboratory's designated accounts. nanoLabs charges 0% commission on direct diagnostic settlements.
            </p>
          </div>
        </div>

        {/* Right Column: Detailed Configuration Form */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{activeConfig.name}</h3>
                  <div className="text-xs text-slate-500 font-mono">Provider: {activeConfig.provider}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-2 cursor-pointer">
                  <span>Method Active</span>
                  <input
                    type="checkbox"
                    checked={activeConfig.enabled}
                    onChange={(e) => handleUpdateActive({ enabled: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                </label>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Merchant / Account Name
                  </label>
                  <input
                    type="text"
                    value={activeConfig.merchantName}
                    onChange={(e) => handleUpdateActive({ merchantName: e.target.value })}
                    placeholder="e.g. nanoLabs Clinical Diagnostics Ltd"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {activeConfig.category === 'mobile_money' 
                      ? 'Merchant / Recipient Phone' 
                      : activeConfig.category === 'bank'
                      ? 'IBAN / RIB / Account Number'
                      : 'Terminal / Gateway ID'}
                  </label>
                  <input
                    type="text"
                    value={activeConfig.merchantIdOrPhone}
                    onChange={(e) => handleUpdateActive({ merchantIdOrPhone: e.target.value })}
                    placeholder="+237 677 00 00 00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Environment Mode
                  </label>
                  <select
                    value={activeConfig.environment}
                    onChange={(e) => handleUpdateActive({ environment: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="live">Live Production</option>
                    <option value="test">Sandbox / Testing Mode</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Primary Currency
                  </label>
                  <select
                    value={activeConfig.currency}
                    onChange={(e) => handleUpdateActive({ currency: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="XAF">Central African CFA Franc (XAF)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="USD">US Dollar (USD)</option>
                  </select>
                </div>
              </div>

              {/* {activeConfig.apiKeyOrSecret !== undefined && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>API Key / Secret Token / Swift Code</span>
                    <span className="text-[10px] font-mono text-slate-400">Encrypted AES-256</span>
                  </label>
                  <input
                    type="password"
                    value={activeConfig.apiKeyOrSecret}
                    onChange={(e) => handleUpdateActive({ apiKeyOrSecret: e.target.value })}
                    placeholder="Enter live or sandbox key..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              )} */}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Patient & Cashier Checkout Instructions
                </label>
                <textarea
                  rows={3}
                  value={activeConfig.instructions}
                  onChange={(e) => handleUpdateActive({ instructions: e.target.value })}
                  placeholder="Instructions displayed on checkout dialogs..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Internal Administrative Notes
                </label>
                <input
                  type="text"
                  value={activeConfig.notes || ''}
                  onChange={(e) => handleUpdateActive({ notes: e.target.value })}
                  placeholder="e.g. Verified by Chief Accountant on Sept 2026"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Changes are saved automatically to your local session</span>
                </div>

                <button
                  onClick={handleSaveAll}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfigManager;
