import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Building2,
  MapPin,
  Phone,
  Truck,
  FlaskConical,
  Loader2,
  Clock,
} from 'lucide-react';
import { useNav } from '../../components/doctor/nav';
import { SectionCard, EmptyStateCard, StatusTag } from '../../components/doctor/ui';
import { doctorPatientFirestoreService } from '../../services/doctorPatientFirestoreService';

export const LabsScreen: React.FC = () => {
  const { push } = useNav();
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const list = await doctorPatientFirestoreService.listRealLabs();
      if (active) {
        setLabs(list);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filteredLabs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return labs;
    return labs.filter(
      (l) =>
        String(l.name || '').toLowerCase().includes(q) ||
        String(l.city || '').toLowerCase().includes(q) ||
        String(l.address || '').toLowerCase().includes(q)
    );
  }, [labs, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">
          Registered Partner Laboratories
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Live directory of accredited clinical laboratories registered on Firestore. Select any laboratory to transmit diagnostic test requests for your patients.
        </p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search registered laboratories by name, city, or district..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
        />
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading registered laboratories...</p>
        </div>
      ) : filteredLabs.length === 0 ? (
        <SectionCard>
          <EmptyStateCard
            icon={<Building2 className="w-5 h-5" />}
            title="No Registered Laboratories Found"
            description={
              searchQuery.trim()
                ? `No registered laboratory matched "${searchQuery.trim()}".`
                : 'Once laboratories register on the platform, they appear here automatically.'
            }
          />
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLabs.map((lab) => {
            const supportsMobilePhlebotomy = Boolean(
              lab.needsMobilePhlebotomist ||
                lab.homeCollectionEnabled ||
                lab.mobilePhlebotomyEnabled
            );

            return (
              <div
                key={lab.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-teal-300 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {lab.logoUrl ? (
                        <img
                          src={lab.logoUrl}
                          alt={lab.name}
                          className="w-11 h-11 rounded-xl object-contain border border-slate-200 bg-slate-50 p-1 shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                          {lab.name}
                        </h2>
                        <p className="text-xs text-slate-500 truncate">
                          {lab.city || 'Cameroon'}
                          {lab.licenseNumber ? ` · Lic. ${lab.licenseNumber}` : ''}
                        </p>
                      </div>
                    </div>
                    <StatusTag tone="teal">Active Lab</StatusTag>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    {(lab.address || lab.city) && (
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{[lab.address, lab.city].filter(Boolean).join(', ')}</span>
                      </p>
                    )}
                    {lab.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{lab.phone}</span>
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{lab.openingHours || 'Mon – Sat · 07:00 – 18:00'}</span>
                    </p>
                    {supportsMobilePhlebotomy && (
                      <p className="flex items-center gap-2 text-teal-700 font-semibold">
                        <Truck className="w-3.5 h-3.5 shrink-0" />
                        <span>Home Specimen Pickup Supported</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      push({
                        name: 'prescribe',
                        initialKind: 'lab_tests',
                        preselectedLabId: lab.id,
                        preselectedLabName: lab.name,
                      })
                    }
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    Order Tests at This Lab
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LabsScreen;
