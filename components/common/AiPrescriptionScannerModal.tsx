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
  Eye
} from 'lucide-react';
import { 
  scanPrescriptionDocument, 
  PrescriptionScanResult, 
  MatchedPrescriptionTest 
} from '../../core/scanner';

interface AiPrescriptionScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedWithTests: (selectedTests: MatchedPrescriptionTest[]) => void;
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
    try {
      const result = await scanPrescriptionDocument(fileOrText || '');
      setScanResult(result);
      // Pre-select all matched tests by default
      const initialSet = new Set<string>(result.matchedTests.map((t) => t.code));
      setSelectedCodes(initialSet);
    } catch (err) {
      console.error('Prescription scanning failed:', err);
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
    onProceedWithTests(confirmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D3B38]/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">AI Clinical Prescription Scanner</h2>
              <p className="text-xs text-white/80">
                Camera / upload &bull; 80+ catalog auto-matcher &bull; Patient verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-[#0B1F1D]">
          {!scanResult && !isScanning && (
            <div className="space-y-5">
              <div className="border-2 border-dashed border-teal-200 bg-teal-50/50 rounded-2xl p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-600/10 text-[#0F766E] mx-auto flex items-center justify-center">
                  <Camera className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">
                    Capture or Upload Clinical Prescription
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Take a clear photo of your doctor's handwritten or printed test order. Our AI extracts test names with confidence ratings and asks you to confirm.
                  </p>
                </div>

                {/* Hidden Real Camera and File Inputs */}
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

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-teal-900/10"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Photo with Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
                  >
                    <Upload className="w-4 h-4 text-teal-600" />
                    <span>Upload Prescription File</span>
                  </button>
                </div>
              </div>

              {capturedImage && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <img src={capturedImage} alt="Prescription" className="w-12 h-12 object-cover rounded-lg border border-slate-300" />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800">Prescription captured</span>
                    <p className="text-[11px] text-slate-500">Ready for automated OCR analysis</p>
                  </div>
                </div>
              )}

              {/* Lighting & Rotation Guidance */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-900">High-Precision Scanning Guidelines</p>
                  <p>
                    Ensure natural lighting with zero glare. Keep the doctor's stamp and signature visible. Rotated or handwritten prescriptions are automatically corrected and parsed.
                  </p>
                </div>
              </div>
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

          {/* Scan Results View */}
          {scanResult && !isScanning && (
            <div className="space-y-5">
              {/* Doctor Header Banner */}
              <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-teal-700 font-medium">Prescriber Detected</p>
                  <p className="text-sm font-bold text-teal-900">{scanResult.detectedDoctorName}</p>
                </div>
                <div className="text-right text-xs text-teal-700">
                  <span>{scanResult.matchedTests.length} tests matched</span>
                </div>
              </div>

              {/* Matched Tests with Confidence Scores */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span className="font-semibold text-slate-700">Detected Tests (Select to Confirm)</span>
                  <span>Confidence Score</span>
                </div>

                <div className="space-y-2">
                  {scanResult.matchedTests.map((test) => {
                    const isSelected = selectedCodes.has(test.code);
                    return (
                      <div
                        key={test.code}
                        onClick={() => toggleTest(test.code)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-white border-teal-600 shadow-sm ring-1 ring-teal-600'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-teal-600 text-white'
                                : 'border border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{test.name}</p>
                            <p className="text-xs text-slate-500">
                              {test.category} &bull; {test.fastingNote} &bull; ~{test.basePriceXaf.toLocaleString()} XAF
                            </p>
                          </div>
                        </div>

                        {/* Confidence Indicator */}
                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                            <CheckCircle2 className="w-3 h-3 text-teal-600" />
                            {test.confidencePct}% match
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Unmatched Phrases: Never Silently Dropped */}
              {scanResult.unmatchedPhrases.length > 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                    <AlertCircle className="w-4 h-4" />
                    <span>Unmatched Clinical Lines — Pick Manually</span>
                  </div>
                  <p className="text-xs text-amber-700">
                    The following text was on the prescription but did not match an exact catalog test code:
                  </p>
                  <ul className="text-xs text-slate-700 space-y-1 pl-4 list-disc">
                    {scanResult.unmatchedPhrases.map((phrase, idx) => (
                      <li key={idx} className="italic font-medium">
                        "{phrase}"
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-slate-500">
                    Our lab receptionist will verify any manual items with the ordering physician during specimen intake.
                  </p>
                </div>
              )}

              {/* Rescan Option */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => handleStartScan()}
                  className="min-h-[44px] px-3 text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rescan / Upload New Image</span>
                </button>
                <span className="text-xs text-slate-500">
                  {selectedCodes.size} of {scanResult.matchedTests.length} tests selected
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {scanResult && (
            <button
              onClick={handleConfirm}
              disabled={selectedCodes.size === 0}
              className={`min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
                selectedCodes.size > 0
                  ? 'bg-[#0F766E] hover:bg-[#0D3B38] text-white shadow-md shadow-teal-900/10'
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
