import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  ShieldCheck, 
  Key, 
  CheckCircle2, 
  User, 
  MapPin, 
  Phone,
  Power
} from 'lucide-react';
import { PARTNER_LABS } from '../../core/gps';

export const LabManagementScreen: React.FC = () => {
  const [labs, setLabs] = useState([
    ...PARTNER_LABS.map((l) => ({
      ...l,
      accreditationNumber: 'MINSANTE/DOP/2024-082',
      biologistePrincipal: 'Dr. Suzanne Mbongo (Ph.D, ONMC #4829)',
      pricingMultiplier: 1.0,
      apiKey: `nl_live_${l.id}_${Date.now().toString(16)}`,
      isActive: true
    }))
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabName, setNewLabName] = useState('');
  const [newLabCity, setNewLabCity] = useState('Douala');
  const [newLabAddress, setNewLabAddress] = useState('');
  const [newBiologist, setNewBiologist] = useState('');
  const [newPhone, setNewPhone] = useState('+237 6');
  const [newOffersHomePickup, setNewOffersHomePickup] = useState(true);
  const [newOffersHomeDelivery, setNewOffersHomeDelivery] = useState(true);
  const [newRatePer100m, setNewRatePer100m] = useState(60);
  const [newSampleFee, setNewSampleFee] = useState(1500);

  const toggleLabStatus = (id: string) => {
    const updated = labs.map((lab) => (lab.id === id ? { ...lab, isActive: !lab.isActive } : lab));
    setLabs(updated);
    try {
      localStorage.setItem('nanolabs_custom_partner_labs', JSON.stringify(updated));
    } catch {}
  };

  const handleAddLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabName) return;

    const newLab = {
      id: `lab_${Date.now()}`,
      name: newLabName,
      city: newLabCity,
      district: 'Central',
      address: newLabAddress,
      coordinates: { latitude: 4.0511, longitude: 9.7085 },
      phone: newPhone,
      tatHours: 4,
      tatDisplay: '4 hrs TAT',
      accredited: true,
      baseTestPrice: 4000,
      rating: 4.8,
      sampleCollectionFee: Number(newSampleFee) || 1500,
      offersHomePickup: newOffersHomePickup,
      offersHomeDelivery: newOffersHomeDelivery,
      homePickupRatePer100m: Number(newRatePer100m) || 60,
      homeDeliveryFee: 1200,
      lat: 4.0511,
      lng: 9.7085,
      specialties: ['Clinical Biology', 'Immuno-serology'],
      averageTurnaroundHours: 4,
      accreditationNumber: 'MINSANTE/DOP/2026-PENDING',
      biologistePrincipal: newBiologist || 'Dr. Attending Biologist',
      pricingMultiplier: 1.0,
      apiKey: `nl_live_lab_${Date.now().toString(16)}`,
      isActive: true
    };

    const updated = [...labs, newLab];
    setLabs(updated);
    try {
      localStorage.setItem('nanolabs_custom_partner_labs', JSON.stringify(updated));
    } catch {}
    setShowAddModal(false);
    setNewLabName('');
    setNewLabAddress('');
    setNewBiologist('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0B1F1D] tracking-tight">
            Accredited Partner Laboratories Management
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7F7D]">
            Onboard clinical facilities, manage MINSANTE accreditation, assign chief biologists, and configure API access keys.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="min-h-[44px] px-4 py-2.5 bg-[#0F766E] hover:bg-[#0D3B38] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Laboratory</span>
        </button>
      </div>

      {/* Add Lab Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">
                Onboard Accredited Laboratory
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddLab} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Laboratory Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Centre d'Analyses Médicales de Bonapriso"
                  value={newLabName}
                  onChange={(e) => setNewLabName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">City</label>
                  <select
                    value={newLabCity}
                    onChange={(e) => setNewLabCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                  >
                    <option value="Douala">Douala</option>
                    <option value="Yaoundé">Yaoundé</option>
                    <option value="Bafoussam">Bafoussam</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Phone</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Physical Address</label>
                <input
                  type="text"
                  placeholder="Street / Quarter..."
                  value={newLabAddress}
                  onChange={(e) => setNewLabAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Biologiste Principal (Directeur)</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Marc Mbassi (Ph.D, ONMC #...)"
                  value={newBiologist}
                  onChange={(e) => setNewBiologist(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                />
              </div>

              {/* Home Services & Pricing Configuration */}
              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200/80 space-y-3">
                <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wide block">
                  Home Pickup & Delivery Logistics
                </span>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={newOffersHomePickup}
                      onChange={(e) => setNewOffersHomePickup(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Offers Home Sample Pickup</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={newOffersHomeDelivery}
                      onChange={(e) => setNewOffersHomeDelivery(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Offers Hardcopy Report Delivery</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pickup Rate per 100m (FCFA)</label>
                    <input
                      type="number"
                      value={newRatePer100m}
                      onChange={(e) => setNewRatePer100m(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                      placeholder="e.g. 60"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">{newRatePer100m * 10} FCFA / km</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Prélèvement / Extraction Fee (FCFA)</label>
                    <input
                      type="number"
                      value={newSampleFee}
                      onChange={(e) => setNewSampleFee(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                      placeholder="e.g. 1500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="min-h-[40px] px-4 py-2 text-slate-600 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-5 py-2 bg-[#0F766E] text-white rounded-xl font-bold text-xs cursor-pointer"
                >
                  Save Partner Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Labs List */}
      <div className="space-y-4">
        {labs.map((lab) => (
          <div
            key={lab.id}
            className={`bg-white rounded-3xl border p-6 shadow-xs transition-all space-y-4 ${
              lab.isActive ? 'border-slate-200/80' : 'border-slate-200 opacity-60 bg-slate-50'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">{lab.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lab.city} &bull; {lab.address}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleLabStatus(lab.id)}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    lab.isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{lab.isActive ? 'Active Network Lab' : 'Suspended'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Biologiste Principal</span>
                <p className="font-bold text-slate-800 truncate">{lab.biologistePrincipal}</p>
                <p className="text-[10px] text-slate-500 font-mono">{lab.accreditationNumber}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">API Integration Key</span>
                <p className="font-mono text-[11px] text-slate-700 truncate">{lab.apiKey}</p>
                <p className="text-[10px] text-teal-800 font-semibold">HL7 / ASTM Direct Interface</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Contractual Terms</span>
                <p className="font-bold text-slate-800">5% Platform Record Fee</p>
                <p className="text-[10px] text-emerald-700 font-semibold">TVA Exonérée (Article 128)</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LabManagementScreen;
