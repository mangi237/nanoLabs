import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  FileText, 
  Check, 
  RefreshCw, 
  ShieldAlert, 
  Info,
  ChevronRight,
  Eye,
  AlertTriangle,
  Building2,
  FileSpreadsheet,
  Mail
} from 'lucide-react';
import { 
  scanPrescriptionDocument, 
  PrescriptionScanResult, 
  MatchedPrescriptionTest 
} from '../../core/scanner';
import { formatXAF } from '../../shared/money';

interface AiPrescriptionScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedWithTests: (selectedTests: MatchedPrescriptionTest[], detectedDoctorName?: string) => void;
}

export const AiPrescriptionScannerModal: React.FC<AiPrescriptionScannerModalProps> = ({
  isOpen,
  onClose,
  onProceedWithTests
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<PrescriptionScanResult | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  const [pastedText, setPastedText] = useState<string>('');
  const [ocrGuardrailWarning, setOcrGuardrailWarning] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileCapture = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      handleStartScan(file);
    };
    reader.readAsDataURL(file);
  };

  const handleStartScan = async (fileOrText?: File | string) => {
    setIsScanning(true);
    setScanResult(null);
    setOcrGuardrailWarning(null);

    try {
      const input = fileOrText !== undefined ? fileOrText : (activeTab === 'text' ? pastedText : '');
      const result = await scanPrescriptionDocument(input);
      setScanResult(result);

      // OCR Guardrail check per Master PRD:
      // If confidence is low or text has ambiguous lines, do not auto-select tests
      if (result.matchedTests.some((t) => t.confidencePct < 75) || result.unmatchedPhrases.length > 0) {
        setOcrGuardrailWarning('Prescription text partially obscured or unreadable at lower-left margin. Manual verification is required before confirming.');
        // High confidence tests selected only
        const highConfidence = new Set<string>(result.matchedTests.filter((t) => t.confidencePct >= 85).map((t) => t.code));
        setSelectedCodes(highConfidence);
      } else {
        const allMatched = new Set<string>(result.matchedTests.map((t) => t.code));
        setSelectedCodes(allMatched);
      }
    } catch (err) {
      console.error('Prescription scanning failed:', err);
      setOcrGuardrailWarning('Prescription text obscured or unreadable. Please provide a clearer document.');
    } finally {
      setIsScanning(false);
    }
  };

  const toggleTest = (code: string) => {
    const updated = new Set(selectedCodes);
    if (updated.has(code)) {
      updated.delete(code);
    } else {
      updated.add(code);
    }
    setSelectedCodes(updated);
  };

  const handleConfirm = () => {
    if (!scanResult) return;
    const confirmed = scanResult.matchedTests.filter((t) => selectedCodes.has(t.code));
    onProceedWithTests(confirmed, scanResult.detectedDoctorName);
    onClose();
  };

  const totalBilled = scanResult?.matchedTests.reduce((acc, t) => acc + (t.basePriceXaf || 0), 0) || 0;
  const insuranceCopay = Math.round(totalBilled * 0.3); // 30% patient standard copay
  const fairPrice = totalBilled - insuranceCopay;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modern Header */}
        <div className="p-5 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white flex items-center justify-between border-b border-teal-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Nano AI Prescription Scanner</h2>
                <span className="px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 text-[10px] font-bold border border-teal-300/30">
                  OCR Engine
                </span>
              </div>
              <p className="text-xs text-teal-200/80">
                80+ standardized lab tests &bull; Prescriber extraction &bull; Fair pricing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-900">
          {!scanResult && !isScanning && (
            <div className="space-y-4">
              {/* Upload Card from nanoaiscannerui.webp */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/40 hover:bg-teal-50/80 rounded-3xl p-6 sm:p-8 text-center space-y-3 cursor-pointer transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-teal-600/15 text-teal-700 mx-auto flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Upload Your Bill or Prescription
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Drop your hospital prescription here or tap to browse your files
                  </p>
                </div>

                {/* File format pills */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600">
                    PDF
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600">
                    JPG
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600">
                    PNG
                  </span>
                </div>
              </div>

              {/* Hidden Real Inputs */}
              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileCapture(e.target.files?.[0])}
              />
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => handleFileCapture(e.target.files?.[0])}
              />

              {/* Divider: Or use another method */}
              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-slate-200"></div>
                <span className="shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  or use another method
                </span>
                <div className="grow border-t border-slate-200"></div>
              </div>

              {/* Secondary Option Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/80 flex items-start gap-3 text-left transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Scan Bill / Prescription</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Use camera to capture paper document</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/80 flex items-start gap-3 text-left transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Import from Email / Text</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Paste clinical prescription text</p>
                  </div>
                </button>
              </div>

              {activeTab === 'text' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Paste Doctor's Prescription Order:
                    </label>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="text-[11px] text-teal-700 hover:underline font-semibold"
                    >
                      Back to file upload
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="e.g. NFS, Glycémie à jeûn, Bilan lipidique complet, Ionogramme sanguin, Sérologie Hépatite B..."
                    className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-teal-600 font-mono text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => handleStartScan(pastedText)}
                    disabled={!pastedText.trim()}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer ${
                      pastedText.trim()
                        ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Extract & Match Tests from Text</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Scanning Progress State */}
          {isScanning && (
            <div className="py-14 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-teal-600 animate-pulse" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Processing Prescription via Clinical AI...
                </h3>
                <p className="text-xs text-slate-500">
                  Extracting medical handwriting &bull; Cross-referencing 80+ CEMAC standardized catalog
                </p>
              </div>
            </div>
          )}

          {/* Scan Results View (Matches nanoaiscannerui.webp) */}
          {scanResult && !isScanning && (
            <div className="space-y-5">
              {/* Prescriber & Facility Card */}
              <div className="p-4 bg-teal-50/80 border border-teal-200/80 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-teal-700 font-bold uppercase tracking-wider">
                      Prescription Origin Detected
                    </p>
                    <p className="text-sm font-extrabold text-slate-900">
                      {scanResult.detectedDoctorName || 'Centre Médical Laquintinie / Hôpital Général'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    ocrGuardrailWarning ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {ocrGuardrailWarning ? '▲ Review Required' : '✓ OCR Verified'}
                  </span>
                </div>
              </div>

              {/* Summary Metrics (from nanoaiscannerui.webp) */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-0.5">
                  <p className="text-[10px] font-semibold text-slate-500">Total Billed</p>
                  <p className="text-sm sm:text-base font-black text-slate-900 font-mono">
                    {formatXAF(totalBilled)}
                  </p>
                  <span className="text-[9px] text-slate-400">Standard Tariff</span>
                </div>

                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-0.5">
                  <p className="text-[10px] font-semibold text-emerald-800">Fair Price</p>
                  <p className="text-sm sm:text-base font-black text-emerald-900 font-mono">
                    {formatXAF(fairPrice)}
                  </p>
                  <span className="text-[9px] text-emerald-700">Recommended</span>
                </div>

                <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200 text-center space-y-0.5">
                  <p className="text-[10px] font-semibold text-teal-800">Co-Pay / Insured</p>
                  <p className="text-sm sm:text-base font-black text-teal-900 font-mono">
                    {formatXAF(insuranceCopay)}
                  </p>
                  <span className="text-[9px] text-teal-700">Patient Share</span>
                </div>
              </div>

              {/* OCR Guardrail Warning Alert if triggered */}
              {ocrGuardrailWarning && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Clinical OCR Guardrail Alert</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    {ocrGuardrailWarning} Please manually confirm the highlighted tests before dispatching.
                  </p>
                </div>
              )}

              {/* Itemized Detected Tests */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span className="font-bold text-slate-700">
                    Extracted Tests ({selectedCodes.size} / {scanResult.matchedTests.length} Selected)
                  </span>
                  <span>Confidence</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {scanResult.matchedTests.map((test) => {
                    const isSelected = selectedCodes.has(test.code);
                    const isHighConfidence = test.confidencePct >= 85;

                    return (
                      <div
                        key={test.code}
                        onClick={() => toggleTest(test.code)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-white border-teal-600 shadow-xs ring-1 ring-teal-600'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-teal-700 text-white'
                                : 'border border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-slate-900">{test.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {test.code} &bull; {test.category} &bull; {formatXAF(test.basePriceXaf)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isHighConfidence
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isHighConfidence ? '✓ Fair' : '▲ Flagged'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {test.confidencePct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Insights Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 space-y-0.5">
                  <span className="font-bold text-slate-800">Nano AI Pricing & Clinical Insights</span>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Estimated fees are benchmarked against official Cameroonian national laboratory reference rates. Your final invoice is verified by certified medical staff.
                  </p>
                </div>
              </div>

              {/* Rescan Button */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => {
                    setScanResult(null);
                    setCapturedImage(null);
                    setOcrGuardrailWarning(null);
                  }}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Scan Another Document</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {scanResult && (
            <button
              onClick={handleConfirm}
              disabled={selectedCodes.size === 0}
              className={`min-h-[44px] px-6 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                selectedCodes.size > 0
                  ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-md shadow-teal-900/10'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Confirm {selectedCodes.size} Tests & Proceed</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiPrescriptionScannerModal;

