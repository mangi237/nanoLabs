import React from 'react';
import { ShieldCheck, X, FileText, CheckCircle2, Printer } from 'lucide-react';

interface LabTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  accepted?: boolean;
}

export const LabTermsModal: React.FC<LabTermsModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  accepted = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Laboratory Registration Terms & Conditions</h2>
              <p className="text-xs text-slate-400">NanoLabs Facility Service Agreement • Cameroon</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
              NANOLABS — TERMS AND CONDITIONS FOR LABORATORY REGISTRATION
            </h1>
            <div className="mt-2 space-y-0.5 text-xs text-slate-500">
              <p><strong className="text-slate-700">Effective Date:</strong> August 2026</p>
              <p><strong className="text-slate-700">Operated by:</strong> NanoLabs, Bonapriso, Douala, Cameroon</p>
              <p><strong className="text-slate-700">Contact:</strong> legal@nanolabs.cm | +237 670 000 000 / WhatsApp</p>
            </div>
            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 italic">
              By registering your laboratory, hospital, or clinic (&quot;the Facility&quot;) on the NanoLabs platform, you agree to be bound by the following Terms and Conditions. Please read them carefully before proceeding.
            </div>
          </div>

          {/* Section 1 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">1</span>
              Acceptance of Terms
            </h3>
            <p className="pl-7">
              By creating a Facility account on NanoLabs, the individual completing registration confirms that they:
            </p>
            <ul className="list-disc pl-12 space-y-1">
              <li>Are duly authorized to register the Facility and bind it to this agreement;</li>
              <li>Have the legal right to operate a medical laboratory, hospital, or clinic in Cameroon;</li>
              <li>Agree to comply with all applicable Cameroonian healthcare and data protection laws in their use of the platform.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">2</span>
              Description of Service
            </h3>
            <p className="pl-7">
              NanoLabs is a laboratory management platform that enables the Facility to:
            </p>
            <ul className="list-disc pl-12 space-y-1">
              <li>Digitize patient test requests and eliminate paper-based workflows;</li>
              <li>Track sample collection with accountability logging (who collected, when, from whom);</li>
              <li>Allow patients to create accounts, request tests, and track result status;</li>
              <li>Enable authorized lab staff to upload results (including PDF format) for secure remote access by patients;</li>
              <li>Manage inventory of laboratory supplies and reagents, including low-stock alerts;</li>
              <li>Validate and record patient payments and the payment method used;</li>
              <li>Generate reports and statistics on patient volume, turnaround times, and operational data;</li>
              <li>Apply role-based access so staff only see the information relevant to their function.</li>
            </ul>
            <p className="pl-7 font-semibold text-teal-800 bg-teal-50 p-2.5 rounded-xl border border-teal-200">
              The platform provides full transparent commercial options: Pay-per-test (500 FCFA baseline per confirmed test), Flat Monthly/Annual Subscriptions with unlimited tests and zero per-test penalties, or Lifetime Dedicated Cloud Space with 15,000 FCFA monthly maintenance.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">3</span>
              Commercial Models & System Fee Schedule
            </h3>
            <div className="pl-7 space-y-2">
              <p>The Facility selects one of three commercial billing models during registration or account management:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Model A (Pay-Per-Test):</strong> Zero upfront software license commitment. A baseline fee of <strong>500 FCFA</strong> per completed diagnostic test is billed for cloud processing.</li>
                <li><strong>Model B (Flat Monthly Subscription):</strong> Predictable monthly SaaS subscription (Starter at 25,000 FCFA, Professional at 55,000 FCFA, Business at 120,000 FCFA) with <strong>unlimited diagnostic tests</strong> and 100% of patient revenue retained directly by the Facility.</li>
                <li><strong>Model C (Lifetime Cloud Space + Maintenance):</strong> One-time dedicated cloud tenant allocation with a fixed low monthly maintenance fee of <strong>15,000 FCFA</strong> for security updates, automated backups, and 24/7 SLA.</li>
              </ul>
              <p className="text-xs text-slate-500">NanoLabs provides the Facility with transparent records and cashier audit logs of all transactions.</p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">4</span>
              Data Integrity and Accuracy
            </h3>
            <div className="pl-7 space-y-2">
              <p>• NanoLabs is committed to maintaining the <strong>integrity, accuracy, and completeness</strong> of all data recorded on the platform, including patient records, test results, sample chain-of-custody logs, and inventory records.</p>
              <p>• The Facility is responsible for ensuring that data entered by its staff (test results, patient information, inventory counts) is accurate at the point of entry. NanoLabs cannot verify the clinical accuracy of results uploaded by lab technicians — that responsibility remains with the Facility and its licensed personnel.</p>
              <p>• All record modifications are logged with a timestamp and the identity of the staff member who made the change. Records are not silently overwritten; correction history is preserved for audit purposes.</p>
              <p>• The Facility agrees not to falsify, alter, or misrepresent test results, sample collection times, or patient data on the platform.</p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">5</span>
              Data Protection and Confidentiality
            </h3>
            <div className="pl-7 space-y-2">
              <p>• Patient data accessed through NanoLabs is confidential medical information. The Facility agrees to access, use, and disclose such data strictly in accordance with applicable law and only for legitimate healthcare purposes.</p>
              <p>• NanoLabs applies <strong>role-based access control</strong>: Facility staff accounts are limited to the information necessary for their specific function (e.g., front desk, sample collection, lab technician, billing). No staff role has default access to full patient records beyond what their function requires.</p>
              <p>• The Facility is responsible for the conduct of its own staff who are granted platform access, including ensuring staff do not share login credentials or access patient data outside the scope of their duties.</p>
              <p>• NanoLabs maintains audit logs of data access and will make these available to the Facility upon reasonable request for compliance or investigation purposes.</p>
              <p>• In the event of a data breach affecting the Facility&apos;s patient data, NanoLabs will notify the Facility without undue delay.</p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">6</span>
              Facility Responsibilities
            </h3>
            <p className="pl-7">The Facility agrees to:</p>
            <ul className="list-disc pl-12 space-y-1">
              <li>Provide accurate business and licensing information at registration;</li>
              <li>Ensure only authorized, appropriately trained staff are granted platform accounts;</li>
              <li>Promptly remove platform access for staff who leave the Facility&apos;s employment;</li>
              <li>Use the platform solely for legitimate laboratory and clinical operations;</li>
              <li>Cooperate with NanoLabs on any data integrity or security investigation involving the Facility&apos;s account.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">7</span>
              Sample Collection Accountability
            </h3>
            <p className="pl-7">
              The platform records sample collection events, including the identity of the staff member who collected the sample, timestamp, and patient identifier, to support chain-of-custody accountability. The Facility agrees to ensure staff use this feature accurately and in real time.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">8</span>
              Service Availability
            </h3>
            <p className="pl-7">
              NanoLabs will make reasonable efforts to keep the platform available and performant but does not guarantee uninterrupted access. NanoLabs is not liable for delays or data unavailability caused by internet connectivity issues, power outages, or other circumstances outside its reasonable control. The Facility should maintain appropriate offline/backup procedures for critical operations.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">9</span>
              Limitation of Liability
            </h3>
            <p className="pl-7">
              NanoLabs provides the platform as a management and reporting tool. NanoLabs is not a healthcare provider and is not responsible for clinical decisions, diagnoses, or treatment made using data from the platform. The Facility remains solely responsible for the clinical accuracy and appropriate use of test results.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">10</span>
              Termination
            </h3>
            <p className="pl-7">
              Either party may terminate this agreement with written notice. Upon termination, the Facility&apos;s data will be made available for export for a reasonable period before archival or deletion, in accordance with applicable record-retention requirements.
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">11</span>
              Amendments
            </h3>
            <p className="pl-7">
              NanoLabs may update these Terms from time to time. Facilities will be notified of material changes and continued use of the platform constitutes acceptance of the updated Terms.
            </p>
          </section>

          {/* Section 12 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">12</span>
              Governing Law
            </h3>
            <p className="pl-7">
              These Terms are governed by the laws of the Republic of Cameroon.
            </p>
          </section>

          {/* Section 13 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">13</span>
              Acknowledgement
            </h3>
            <p className="pl-7">
              By clicking &quot;I Agree&quot; and completing registration, the authorized representative confirms they have read, understood, and agree to be bound by these Terms and Conditions on behalf of the Facility.
            </p>
          </section>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
            <p className="font-bold text-slate-900">NanoLabs Medical Systems</p>
            <p className="text-slate-600">Bonapriso, Douala, Republic of Cameroon</p>
            <p className="text-slate-500">Contact: legal@nanolabs.cm | +237 670 000 000 / WhatsApp</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-teal-600" />
            <span>Official Facility Agreement Document</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
            {onAccept && (
              <button
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                I Understand & Agree
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LabTermsModal;
