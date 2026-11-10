import React, { useState, useEffect } from 'react';
import {
  Building2,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  Camera,
  ArrowRight,
  ShieldCheck,
  Send,
  Loader2,
  Check,
  X,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { db, ensureFirebaseAuth, collection, getDocs, doc, updateDoc, setDoc } from '../../services/firebase';
import { cleanFirestoreData } from '../../utils/sanitizeData';

interface PartnerOrderActionScreenProps {
  orderCode: string;
  orderKey?: string;
  onGoToLogin: () => void;
  onGoToWebsite: () => void;
}

export const PartnerOrderActionScreen: React.FC<PartnerOrderActionScreenProps> = ({
  orderCode,
  orderKey,
  onGoToLogin,
  onGoToWebsite,
}) => {
  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Invoice / Pricing modification fields
  const [testAmount, setTestAmount] = useState<number>(0);
  const [prelevementFee, setPrelevementFee] = useState<number>(1000);
  const [homePickupFee, setHomePickupFee] = useState<number>(0);
  const [cashierNotes, setCashierNotes] = useState('');

  // Result Upload State (Photo / Document snap or PDF)
  const [reportFileBase64, setReportFileBase64] = useState<string>('');
  const [reportFileName, setReportFileName] = useState<string>('');
  const [biologistName, setBiologistName] = useState<string>('Biologiste de Garde');
  const [biologistRemarks, setBiologistRemarks] = useState<string>('Examens validés conformes.');
  const [reportTab, setReportTab] = useState<'upload' | 'manual'>('upload');
  const [manualResults, setManualResults] = useState<Record<string, { value: string; unit: string; flag: string }>>({});

  useEffect(() => {
    let active = true;
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        await ensureFirebaseAuth();

        const cleanCode = String(orderCode || '').trim();
        if (!cleanCode) {
          setErrorMsg('Code de commande manquant ou invalide.');
          setLoading(false);
          return;
        }

        // Query labs to locate this booking
        const labsSnap = await getDocs(collection(db, 'labs'));
        let foundBooking: any = null;

        const upperCode = cleanCode.toUpperCase();
        for (const labDoc of labsSnap.docs) {
          try {
            const bSnap = await getDocs(collection(db, 'labs', labDoc.id, 'bookings'));
            for (const bDoc of bSnap.docs) {
              const data = bDoc.data();
              const bCode = String(data.bookingCode || '').trim().toUpperCase();
              const bId = String(bDoc.id || '').trim().toUpperCase();
              const dataId = String(data.id || '').trim().toUpperCase();
              if (bCode === upperCode || bId === upperCode || dataId === upperCode) {
                foundBooking = {
                  ...data,
                  id: bDoc.id,
                  labDocId: labDoc.id,
                  labName: data.labName || labDoc.data().name || 'Laboratoire Partenaire',
                };
                break;
              }
            }
            if (foundBooking) break;
          } catch {}
        }

        // Local ledger fallback
        if (!foundBooking) {
          try {
            const raw = localStorage.getItem('nanolabs_bookings_ledger');
            if (raw) {
              const list = JSON.parse(raw);
              const matched = list.find((b: any) => {
                const bCode = String(b.bookingCode || '').trim().toUpperCase();
                const bId = String(b.id || '').trim().toUpperCase();
                return bCode === upperCode || bId === upperCode;
              });
              if (matched) {
                foundBooking = {
                  ...matched,
                  labDocId: matched.labId || 'lab-1',
                  labName: matched.labName || 'Laboratoire Partenaire',
                };
              }
            }
          } catch {}
        }

        if (active) {
          if (foundBooking) {
            setBooking(foundBooking);
            setTestAmount(foundBooking.testsAmount || foundBooking.totalAmount || 0);
            setHomePickupFee(foundBooking.homePickupFee || 0);

            // Restore saved extra prelevement fee
            const existingPrelevement = Array.isArray(foundBooking.addOns)
              ? foundBooking.addOns.find((a: any) => 
                  a?.name?.toLowerCase().includes('prélèvement') || 
                  a?.name?.toLowerCase().includes('prelevement') ||
                  a?.name?.toLowerCase().includes('ponction')
                )?.price
              : undefined;

            if (typeof existingPrelevement === 'number') {
              setPrelevementFee(existingPrelevement);
            } else if (typeof foundBooking.prelevementFee === 'number') {
              setPrelevementFee(foundBooking.prelevementFee);
            }

            if (foundBooking.cashierNotes) {
              setCashierNotes(foundBooking.cashierNotes);
            }
            if (foundBooking.biologistName) {
              setBiologistName(foundBooking.biologistName);
            }
            if (foundBooking.biologistRemarks) {
              setBiologistRemarks(foundBooking.biologistRemarks);
            }
            if (foundBooking.pdfReportUrl) {
              setReportFileBase64(foundBooking.pdfReportUrl);
            }
            if (foundBooking.externalReportName) {
              setReportFileName(foundBooking.externalReportName);
            }

            const initialMap: Record<string, { value: string; unit: string; flag: string }> = {};
            (foundBooking.tests || []).forEach((t: any) => {
              const k = t.testName || t.name;
              initialMap[k] = {
                value: t.resultValue || '',
                unit: t.units || '',
                flag: t.resultFlag || 'Normal',
              };
            });
            setManualResults(initialMap);
          } else {
            setErrorMsg(`Commande #${cleanCode} introuvable ou déjà archivée.`);
          }
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setErrorMsg(err?.message || 'Erreur lors du chargement de la commande.');
          setLoading(false);
        }
      }
    };

    fetchOrder();
    return () => {
      active = false;
    };
  }, [orderCode]);

  // Handle Photo/PDF Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Veuillez sélectionner un fichier ou une photo de moins de 10 Mo.');
      return;
    }

    setReportFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReportFileBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // 1. Confirm Test Request & Set Final Invoice Quote
  const handleConfirmAndSendInvoice = async () => {
    if (!booking) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      await ensureFirebaseAuth();
      const now = new Date().toISOString();
      const finalTestsAmount = Number(testAmount) || 0;
      const finalPrelevement = Number(prelevementFee) || 0;
      const finalPickup = Number(homePickupFee) || 0;
      const finalTotal = finalTestsAmount + finalPrelevement + finalPickup;

      const addOns = [];
      if (finalPrelevement > 0) {
        addOns.push({
          name: 'Acte de prélèvement & matériel stérile',
          price: finalPrelevement,
          justification: 'Consommables stériles de ponction veineuse',
        });
      }

      const invoiceCode = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const updates = cleanFirestoreData({
        receptionistValidated: true,
        receptionistValidatedAt: now,
        invoiceGenerated: true,
        invoiceGeneratedAt: now,
        invoiceNumber: invoiceCode,
        invoiceStatus: 'issued',
        totalAmount: finalTotal,
        testsAmount: finalTestsAmount,
        homePickupFee: finalPickup,
        addOns,
        cashierNotes: cashierNotes.trim() || 'Facture émise par le laboratoire partenaire.',
        updatedAt: now,
      });

      const ref = doc(db, 'labs', booking.labDocId, 'bookings', booking.id);
      await updateDoc(ref, updates);

      setBooking({ ...booking, ...updates });
      setActionSuccess(`Facture #${invoiceCode} (${finalTotal.toLocaleString()} FCFA) transmise au patient avec succès !`);
      setTimeout(() => setActionSuccess(null), 6000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Échec de la validation du devis.');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Mark Sample Drawn / Collected
  const handleMarkSampleCollected = async () => {
    if (!booking) return;
    setSubmitting(true);
    try {
      await ensureFirebaseAuth();
      const now = new Date().toISOString();
      const updates = cleanFirestoreData({
        sampleCollected: true,
        sampleCollectedAt: now,
        overallStatus: 'In_Lab_Testing',
        updatedAt: now,
      });
      const ref = doc(db, 'labs', booking.labDocId, 'bookings', booking.id);
      await updateDoc(ref, updates);
      setBooking({ ...booking, ...updates });
      setActionSuccess('Échantillon marqué comme prélevé et en cours d\'analyse au banc !');
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur de mise à jour.');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Release Certified Report to Patient and Doctor (Drop PDF / Photo)
  const handleReleaseResults = async () => {
    if (!booking) return;
    if (reportTab === 'upload' && !reportFileBase64) {
      alert('Veuillez joindre une photo ou un PDF du rapport d\'analyse signé.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await ensureFirebaseAuth();
      const now = new Date().toISOString();

      const updatedTests = (booking.tests || []).map((t: any) => {
        const k = t.testName || t.name;
        const entry = manualResults[k];
        return {
          ...t,
          status: 'Completed',
          resultValue: entry?.value || 'Certifié conforme',
          units: entry?.unit || t.units || '',
          resultFlag: entry?.flag || 'Normal',
          validatedAt: now,
        };
      });

      const updates = cleanFirestoreData({
        tests: updatedTests,
        biologistSigned: true,
        biologistName: biologistName.trim() || 'Biologiste Médical',
        biologistSignedAt: now,
        biologistRemarks: biologistRemarks.trim() || 'Rapport validé électroniquement.',
        resultsReleased: true,
        resultsReleasedAt: now,
        overallStatus: 'Completed',
        pdfReportUrl: reportFileBase64 || null,
        externalReportName: reportFileName || null,
        updatedAt: now,
      });

      const ref = doc(db, 'labs', booking.labDocId, 'bookings', booking.id);
      await updateDoc(ref, updates);

      setBooking({ ...booking, ...updates });
      setActionSuccess('Résultat officiel certifié et transmis instantanément au patient et à son médecin traitant !');
      setTimeout(() => setActionSuccess(null), 8000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Échec de transmission des résultats.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <Loader2 className="w-10 h-10 animate-spin text-teal-400 mb-3" />
        <h2 className="text-lg font-bold">Ouverture du dossier d&apos;analyse...</h2>
        <p className="text-xs text-slate-400 mt-1">Connexion sécurisée directe (Passerelle nanoLabs Partenaire)</p>
      </div>
    );
  }

  if (errorMsg && !booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Commande Introuvable</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{errorMsg}</p>
          <button
            type="button"
            onClick={onGoToWebsite}
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  const isConfirmed = Boolean(booking.receptionistValidated);
  const isInvoiceReady = Boolean(booking.invoiceGenerated);
  const isPaid = booking.paymentStatus === 'paid' || booking.invoiceStatus === 'paid';
  const isSampleDrawn = Boolean(booking.sampleCollected);
  const isReleased = Boolean(booking.biologistSigned || booking.overallStatus === 'Completed');

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      {/* Top Banner */}
      <header className="sticky top-0 z-30 bg-[#062220] text-white px-4 py-3.5 border-b border-teal-800/40 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">{booking.labName}</span>
                <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 text-[10px] font-bold uppercase tracking-wider border border-teal-400/20">
                  Passerelle Partenaire
                </span>
              </div>
              <p className="text-[11px] text-teal-200/80">
                Commande <strong>#{booking.bookingCode}</strong> &bull; Traitement direct sans logiciel
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onGoToLogin}
            className="text-xs text-teal-200 hover:text-white underline font-semibold cursor-pointer shrink-0"
          >
            Connexion Staff
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center gap-2.5 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Patient and Sample Summary Card */}
        <section className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Patient &amp; Prescription</span>
              <h1 className="text-lg font-black text-slate-900">
                {booking.patientName}{' '}
                {booking.patientAlias && (
                  <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    @{booking.patientAlias}
                  </span>
                )}
              </h1>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                {booking.patientPhone && (
                  <a href={`tel:${booking.patientPhone}`} className="inline-flex items-center gap-1 font-semibold text-slate-700 underline">
                    <Phone className="w-3.5 h-3.5" /> {booking.patientPhone}
                  </a>
                )}
                {booking.referringDoctor && (
                  <span>Médecin prescripteur: <strong>{booking.referringDoctor}</strong></span>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isReleased 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : isInvoiceReady
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {isReleased ? '✓ Résultats Certifiés' : isInvoiceReady ? 'Facture Émise' : 'En Attente de Confirmation'}
              </span>
            </div>
          </div>

          {/* Requested Assays */}
          <div>
            <h3 className="text-xs font-extrabold text-slate-700 mb-2">Examens prescrits demandés ({booking.tests?.length || 0}) :</h3>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/60">
              {(booking.tests || []).map((t: any, idx: number) => (
                <div key={idx} className="p-3 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{t.testName || t.name}</span>
                  <span className="font-mono text-slate-600">
                    {(t.price || 4500).toLocaleString()} FCFA
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Home Pickup / Walk-in Details */}
          {/* Home Pickup / Walk-in Details */}
          <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 flex items-start gap-2.5 text-xs text-teal-950">
            <MapPin className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {booking.homeCollection ? 'Prélèvement à domicile demandé par le patient' : 'Prélèvement au guichet du laboratoire'}
              </p>
              <p className="text-[11px] text-teal-900/80 mt-0.5">
                {booking.pickupLocation || booking.labAddress || 'Douala, Cameroun'}
              </p>
            </div>
          </div>

          {/* Insurance & Payment Model Section for Partner Lab Desk */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-slate-50 border border-blue-200/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                Modèle de Paiement &amp; Prise en Charge Patient
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                booking.useInsurance || booking.insuranceProvider
                  ? 'bg-blue-600 text-white border-blue-700'
                  : 'bg-slate-200 text-slate-800 border-slate-300'
              }`}>
                {booking.useInsurance || booking.insuranceProvider ? 'Tiers-Payant Assureur' : 'Comptant / Direct Labo'}
              </span>
            </div>

            {booking.useInsurance || booking.insuranceProvider ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-blue-100 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Compagnie d&apos;Assurance</span>
                  <span className="font-black text-slate-900 text-sm">
                    {booking.insuranceProvider || booking.selectedInsurerCode || 'Ascoma Assurances'}
                  </span>
                  {booking.policyHolder && (
                    <span className="text-[10px] text-slate-500 block truncate">Ayant droit: {booking.policyHolder}</span>
                  )}
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-blue-100 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">N° Police / Matricule Assuré</span>
                  <span className="font-black text-blue-800 font-mono text-sm">
                    {booking.policyNumber || booking.insurancePolicyNumber || booking.matricule || 'POL-CAM-99214'}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold block">✓ Couverture active</span>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-blue-100 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Taux de Prise en Charge</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-black text-slate-900 text-base">
                      {booking.coveragePercent || booking.insuranceCoveragePercent || 80}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      (Ticket modérateur patient : {100 - (Number(booking.coveragePercent || booking.insuranceCoveragePercent) || 80)}%)
                    </span>
                  </div>
                  <span className="text-[10px] text-blue-700 font-medium block">
                    Percevoir uniquement le ticket modérateur auprès du patient
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-bold text-slate-900 block">Paiement Direct (Sans Assurance)</span>
                  <span className="text-[11px] text-slate-500">
                    Le patient règle la totalité de sa facture directement au comptoir du laboratoire (Espèces ou Mobile Money Orange/MTN).
                  </span>
                </div>
                <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-1 rounded-lg text-slate-800">
                  Total : {(booking.totalAmount || testAmount).toLocaleString()} FCFA
                </span>
              </div>
            )}
          </div>
        </section>

        {/* STEP 1: Fast Invoice & Reception Confirmation */}
        <section className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Confirmation &amp; Devis / Facturation</h3>
                <p className="text-xs text-slate-500">Fixez les montants réels de vos examens selon votre grille tarifaire</p>
              </div>
            </div>
            {isInvoiceReady && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <Check className="w-4 h-4" /> Facture transmise (#{booking.invoiceNumber})
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Montant Analyses (FCFA)</label>
              <input
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Prélèvement / Aiguille (FCFA)</label>
              <input
                type="number"
                value={prelevementFee}
                onChange={(e) => setPrelevementFee(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Frais Déplacement Domicile (FCFA)</label>
              <input
                type="number"
                value={homePickupFee}
                onChange={(e) => setHomePickupFee(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Instructions ou préparation du patient (jeûne, horaire...)</label>
            <input
              type="text"
              value={cashierNotes}
              onChange={(e) => setCashierNotes(e.target.value)}
              placeholder="Ex: Être à jeun strict depuis 22h la veille, venir entre 7h et 10h."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-600">
              Total patient : <strong className="text-slate-900 text-sm">{(Number(testAmount) + Number(prelevementFee) + Number(homePickupFee)).toLocaleString()} FCFA</strong>
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirmAndSendInvoice}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isInvoiceReady ? 'Mettre à jour la facture du patient' : 'Confirmer & Envoyer la facture au patient'}
            </button>
          </div>
        </section>

        {/* STEP 2: Specimen Collection Handover */}
        <section className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Prélèvement de l&apos;Échantillon</h3>
                <p className="text-xs text-slate-500">Signalez au patient que le sang / prélèvement a été effectué</p>
              </div>
            </div>
            {isSampleDrawn && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <Check className="w-4 h-4" /> Échantillon prélevé
              </span>
            )}
          </div>

          {!isSampleDrawn ? (
            <button
              type="button"
              disabled={submitting}
              onClick={handleMarkSampleCollected}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 text-teal-600" />
              Marquer comme &quot;Échantillon Prélevé &amp; En Analyse&quot;
            </button>
          ) : (
            <p className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              ✓ Échantillon reçu et enregistré en laboratoire le {new Date(booking.sampleCollectedAt || Date.now()).toLocaleString()}.
            </p>
          )}
        </section>

        {/* STEP 3: Zero-Friction Report Drop (Snap photo of existing printed result or upload PDF) */}
        <section className="bg-white border-2 border-teal-200 rounded-3xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#006978] text-white flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Dépôt du Résultat &amp; Certification (Sans Saisie Complexe)
                </h3>
                <p className="text-xs text-slate-500">
                  Prenez simplement en photo votre feuille de résultat signée ou déposez votre PDF existant
                </p>
              </div>
            </div>

            {isReleased && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Déjà Certifié
              </span>
            )}
          </div>

          {/* Toggle between Fast Photo/PDF Drop vs Value typing */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setReportTab('upload')}
              className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                reportTab === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-teal-600" />
              Photo / PDF du résultat signé (Recommandé)
            </button>
            <button
              type="button"
              onClick={() => setReportTab('manual')}
              className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                reportTab === 'manual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              Saisie rapide des chiffres
            </button>
          </div>

          {reportTab === 'upload' ? (
            <div className="space-y-3">
              <label className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-50/80 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
                <div className="w-12 h-12 rounded-2xl bg-white border border-teal-200 text-teal-700 flex items-center justify-center mb-2 shadow-xs">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-xs font-extrabold text-slate-900">
                  {reportFileName ? `Fichier prêt : ${reportFileName}` : 'Prendre en photo le résultat papier OU joindre le PDF'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Prenez en photo votre feuille avec le tampon et la signature de votre biologiste (Max 10 Mo)
                </p>
              </label>

              {reportFileBase64 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                  <span className="font-semibold truncate">✓ Document chargé ({reportFileName})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setReportFileBase64('');
                      setReportFileName('');
                    }}
                    className="text-rose-600 font-bold hover:underline"
                  >
                    Changer
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">Renseignez directement la valeur trouvée pour chaque examen :</p>
              {(booking.tests || []).map((t: any, idx: number) => {
                const k = t.testName || t.name;
                const cur = manualResults[k] || { value: '', unit: '', flag: 'Normal' };
                return (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <span className="font-bold text-slate-900 self-center">{k}</span>
                    <input
                      type="text"
                      placeholder="Résultat (ex: 1.15)"
                      value={cur.value}
                      onChange={(e) =>
                        setManualResults((prev) => ({
                          ...prev,
                          [k]: { ...cur, value: e.target.value },
                        }))
                      }
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold"
                    />
                    <select
                      value={cur.flag}
                      onChange={(e) =>
                        setManualResults((prev) => ({
                          ...prev,
                          [k]: { ...cur, flag: e.target.value },
                        }))
                      }
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Pathologique (Élevé)">Pathologique (Élevé)</option>
                      <option value="Pathologique (Bas)">Pathologique (Bas)</option>
                      <option value="Positif">Positif (+)</option>
                      <option value="Négatif">Négatif (-)</option>
                    </select>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nom du Biologiste Signataire :</label>
              <input
                type="text"
                value={biologistName}
                onChange={(e) => setBiologistName(e.target.value)}
                placeholder="Dr. Nom du biologiste"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Remarques ou Interprétation :</label>
              <input
                type="text"
                value={biologistRemarks}
                onChange={(e) => setBiologistRemarks(e.target.value)}
                placeholder="Ex: Bilan sans anomalie patente"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleReleaseResults}
            className="w-full py-3.5 px-4 rounded-2xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-md transition"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
            {isReleased ? 'Mettre à jour le résultat officiel' : 'Certifier & Transmettre le résultat au patient et au médecin'}
          </button>
        </section>
      </main>
    </div>
  );
};

export default PartnerOrderActionScreen;
