import React from 'react';
import { ShieldCheck, X, FileText, CheckCircle2, Printer, HeartHandshake } from 'lucide-react';

interface PatientTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  accepted?: boolean;
}

export const PatientTermsModal: React.FC<PatientTermsModalProps> = ({
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
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Patient Terms & Conditions</h2>
              <p className="text-xs text-slate-400">NanoLabs Patient Account Creation & Health Data Consent</p>
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
              NANOLABS — TERMS AND CONDITIONS FOR PATIENT ACCOUNT CREATION
            </h1>
            <div className="mt-2 space-y-0.5 text-xs text-slate-500">
              <p><strong className="text-slate-700">Effective Date:</strong> August 2026</p>
              <p><strong className="text-slate-700">Operated by:</strong> NanoLabs, Bonapriso, Douala, Cameroon</p>
              <p><strong className="text-slate-700">Contact:</strong> support@nanolabs.cm | +237 670 000 000 / WhatsApp</p>
            </div>
            <div className="mt-3 p-3 bg-teal-50 rounded-xl border border-teal-200/80 text-[11px] text-teal-900">
              Welcome to NanoLabs. Before creating your patient account, please read the following Terms and Conditions carefully.
            </div>
          </div>

          {/* Section 1 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">1</span>
              Acceptance of Terms
            </h3>
            <p className="pl-7">
              By creating a patient account on NanoLabs, you confirm that you:
            </p>
            <ul className="list-disc pl-12 space-y-1">
              <li>Are at least 18 years old, or are creating this account with the consent of a parent/legal guardian if you are a minor;</li>
              <li>Are providing accurate personal information;</li>
              <li>Agree to be bound by these Terms and Conditions and our Privacy Policy.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">2</span>
              What NanoLabs Does for You
            </h3>
            <p className="pl-7">
              Through your NanoLabs account, you can:
            </p>
            <ul className="list-disc pl-12 space-y-1">
              <li>Request laboratory tests at any Facility using NanoLabs;</li>
              <li>Track the status of your sample collection and test progress;</li>
              <li>Receive an estimated time to collect your physical results, or request a <strong>virtual result</strong>, which your lab technician uploads securely as a PDF;</li>
              <li>Access your results from anywhere, on any device, once released by the Facility;</li>
              <li>View and confirm your payment history and the payment method used;</li>
              <li>Communicate directly with the Facility handling your test, where enabled.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">3</span>
              Your Data and Your Privacy
            </h3>
            <div className="pl-7 space-y-2">
              <p>• Your health information is sensitive and personal. NanoLabs and the Facility treat it with strict confidentiality.</p>
              <p>• <strong>Only you and authorized staff who need it to do their specific job can view your information.</strong> For example, front-desk staff may see your appointment details but not your clinical test results; a lab technician sees the test they are performing but not unrelated medical history; billing staff see payment status only. This is strictly enforced through role-based access controls on the platform.</p>
              <p>• Your test results are only released to your account once uploaded and authorized by the Facility. NanoLabs does not alter, interpret, or share your results with anyone else without your authorization or a valid legal basis.</p>
              <p>• Every access to your record is logged, including who viewed it and when, to support accountability.</p>
              <p>• You may request a copy of your data, or request corrections to inaccurate personal information, by contacting the Facility or NanoLabs directly.</p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">4</span>
              Data Integrity
            </h3>
            <div className="pl-7 space-y-2">
              <p>• NanoLabs is committed to maintaining accurate, unaltered records of your test requests, sample collection, and results.</p>
              <p>• Once a result is uploaded by a lab technician, it is recorded with a timestamp and cannot be silently changed; any correction is logged and traceable.</p>
              <p>• If you believe there is an error in your record, you may raise this with the Facility, who can review and correct it through a logged process.</p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">5</span>
              Payments and Fees
            </h3>
            <div className="pl-7 space-y-2">
              <p>• You will be charged for the laboratory services rendered by the Facility, at the price set by the Facility.</p>
              <p>• In addition, a <strong>System Fee of 500 XAF</strong> applies per transaction processed through NanoLabs. This fee supports the platform that manages your test request, sample tracking, and secure result delivery. It will always be shown to you clearly before you confirm payment.</p>
              <p>• NanoLabs will validate your payment and payment method and provide you with a record of the transaction within your account.</p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">6</span>
              Your Responsibilities
            </h3>
            <p className="pl-7">You agree to:</p>
            <ul className="list-disc pl-12 space-y-1">
              <li>Provide accurate personal and contact information;</li>
              <li>Keep your login credentials confidential and not share your account with others;</li>
              <li>Notify the Facility or NanoLabs promptly if you believe your account has been accessed without your permission;</li>
              <li>Use the platform only to request and receive your own laboratory services (or those of a dependent you are legally responsible for).</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">7</span>
              Virtual Results
            </h3>
            <p className="pl-7">
              If you request a virtual result, you consent to your test result being uploaded in PDF format for secure remote viewing. You are responsible for keeping the device and account you use to view results secure. NanoLabs is not responsible for unauthorized access resulting from a compromised personal device, shared login, or a password you have disclosed to someone else.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">8</span>
              Limitations
            </h3>
            <div className="pl-7 space-y-2">
              <p>• NanoLabs is a platform that facilitates communication and record-keeping between you and the Facility. NanoLabs is not the laboratory, does not perform tests, and is not responsible for the clinical accuracy of results — that responsibility belongs to the Facility and its licensed staff.</p>
              <p>• Estimated result times are provided by the Facility and may vary depending on test type and circumstances beyond the Facility&apos;s or NanoLabs&apos; control.</p>
            </div>
          </section>

          {/* Section 9 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">9</span>
              Account Suspension or Termination
            </h3>
            <p className="pl-7">
              NanoLabs or the Facility may suspend or close an account that is used fraudulently, to access another person&apos;s data without authorization, or in violation of these Terms. You may also request closure of your own account at any time.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">10</span>
              Changes to These Terms
            </h3>
            <p className="pl-7">
              These Terms may be updated from time to time. You will be notified of material changes, and continued use of your account after such notice constitutes acceptance.
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">11</span>
              Governing Law
            </h3>
            <p className="pl-7">
              These Terms are governed by the laws of the Republic of Cameroon.
            </p>
          </section>

          {/* Section 12 */}
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">12</span>
              Acknowledgement
            </h3>
            <p className="pl-7">
              By clicking &quot;I Agree&quot; and completing account creation, you confirm that you have read, understood, and agree to these Terms and Conditions and consent to the processing of your health information as described above.
            </p>
          </section>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
            <p className="font-bold text-slate-900">NanoLabs Medical Systems</p>
            <p className="text-slate-600">Bonapriso, Douala, Republic of Cameroon</p>
            <p className="text-slate-500">Contact: support@nanolabs.cm | +237 670 000 000 / WhatsApp</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-teal-600" />
            <span>Official Patient Agreement Document</span>
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

export default PatientTermsModal;
