import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  MessageSquareLock,
  FileText,
  Clock,
  User,
  FlaskConical,
} from 'lucide-react';
import { useNav } from '../../components/doctor/nav';
import { SubScreenHeader, SectionCard, StatusTag } from '../../components/doctor/ui';
import { DoctorPatientLabDossier } from '../../services/doctorPatientFirestoreService';
import { LabReportPdfViewModal } from '../../components/common/LabReportPdfViewModal';

interface ResultDetailScreenProps {
  dossierId: string;
  initialDossier?: DoctorPatientLabDossier;
}

export const ResultDetailScreen: React.FC<ResultDetailScreenProps> = ({
  dossierId,
  initialDossier,
}) => {
  const { pop, push, dossiers } = useNav();
  const [showSignedPdf, setShowSignedPdf] = useState(false);

  const dossier =
    dossiers.find((d) => d.id === dossierId || d.bookingCode === dossierId) || initialDossier;

  if (!dossier) {
    return (
      <div className="min-h-[100dvh] bg-slate-50">
        <SubScreenHeader title="Diagnostic Dossier" onBack={pop} />
        <div className="max-w-3xl mx-auto p-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <p className="text-sm font-bold text-slate-900">Dossier not found</p>
            <p className="text-xs text-slate-500 mt-1">
              This laboratory record may still be synchronizing from Firestore.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <SubScreenHeader
        title={`Order #${dossier.bookingCode}`}
        subtitle={`${dossier.patientName} · ${dossier.labName}`}
        onBack={pop}
        rightAction={
          dossier.isCertifiedResult && dossier.rawBooking ? (
            <button
              type="button"
              onClick={() => setShowSignedPdf(true)}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Official Signed PDF
            </button>
          ) : undefined
        }
      />

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Patient & Performing Laboratory Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-base font-black text-slate-900">{dossier.patientName}</span>
                {dossier.patientAlias && (
                  <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                    @{dossier.patientAlias}
                  </span>
                )}
                {dossier.patientPid && (
                  <span className="text-xs font-mono text-slate-400">{dossier.patientPid}</span>
                )}
              </div>
              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                Performing Laboratory: <strong className="text-slate-900">{dossier.labName}</strong>
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Updated {new Date(dossier.updatedAt).toLocaleString()}
              </p>
            </div>

            <StatusTag tone={dossier.isCertifiedResult ? 'emerald' : 'amber'}>
              {dossier.stageLabel}
            </StatusTag>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100">
            {dossier.isCertifiedResult && dossier.rawBooking && (
              <button
                type="button"
                onClick={() => setShowSignedPdf(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                Open Signed Laboratory Report PDF
              </button>
            )}

            {dossier.patientId && (
              <button
                type="button"
                onClick={() =>
                  push({
                    name: 'conversation',
                    patientId: dossier.patientId,
                    patientName: dossier.patientName,
                    patientAlias: dossier.patientAlias,
                    patientPid: dossier.patientPid,
                    patientPhone: dossier.patientPhone,
                  })
                }
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <MessageSquareLock className="w-4 h-4" />
                Discuss with Patient (Encrypted)
              </button>
            )}

            {dossier.patientId && (
              <button
                type="button"
                onClick={() =>
                  push({
                    name: 'prescribe',
                    patientId: dossier.patientId,
                    patientName: dossier.patientName,
                    patientAlias: dossier.patientAlias,
                    patientPid: dossier.patientPid,
                    patientPhone: dossier.patientPhone,
                    initialKind: 'medication',
                  })
                }
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FlaskConical className="w-4 h-4 text-teal-600" />
                Follow-up Prescription
              </button>
            )}
          </div>
        </div>

        {/* Requested Tests & Analytical Findings */}
        <SectionCard
          title="Requested Diagnostic Assays & Analytical Values"
          subtitle={
            dossier.isCertifiedResult
              ? 'Official values released by the performing laboratory'
              : 'Live progress — analytical values populate automatically once certified by the laboratory biologist'
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 pr-3">Assay / Parameter</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3">Reference Range</th>
                  <th className="py-2.5 pl-3 text-right">Flag / Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {dossier.tests.map((t, idx) => {
                  const isAbnormal =
                    t.flag &&
                    !['normal', 'n', ''].includes(String(t.flag).toLowerCase());
                  return (
                    <tr key={`${t.name}-${idx}`}>
                      <td className="py-3 pr-3 font-bold text-slate-900">{t.name}</td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                        {t.value ? (
                          <>
                            {t.value} {t.unit || ''}
                          </>
                        ) : (
                          <span className="text-slate-400 font-sans font-normal">
                            Pending lab release
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-500">
                        {t.refRange || '—'}
                      </td>
                      <td className="py-3 pl-3 text-right">
                        {t.value ? (
                          <StatusTag tone={isAbnormal ? 'rose' : 'emerald'}>
                            {t.flag || 'Normal'}
                          </StatusTag>
                        ) : (
                          <StatusTag tone="amber">{t.status}</StatusTag>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Biologist Certification & Remarks */}
        {(dossier.biologistSigned || dossier.biologistRemarks) && (
          <SectionCard title="Medical Biologist Sign-Off & Interpretation">
            <div className="space-y-2">
              {dossier.biologistSigned && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                  Certified &amp; Electronically Signed by{' '}
                  {dossier.biologistName || 'Authorized Medical Biologist'} ({dossier.labName})
                </div>
              )}
              {dossier.biologistRemarks && (
                <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3.5 leading-relaxed">
                  {dossier.biologistRemarks}
                </p>
              )}
            </div>
          </SectionCard>
        )}
      </div>

      {/* Official Biologist-Signed Laboratory Report PDF Viewer */}
      {showSignedPdf && dossier.rawBooking && (
        <LabReportPdfViewModal
          isOpen={showSignedPdf}
          onClose={() => setShowSignedPdf(false)}
          booking={dossier.rawBooking}
        />
      )}
    </div>
  );
};

export default ResultDetailScreen;
