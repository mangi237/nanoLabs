import React, { useState } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Plus, 
  Trash2, 
  ArrowRight, 
  FileText, 
  ShieldCheck,
  Check,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { scanPrescriptionDocument, MASTER_TEST_DICTIONARY } from '../../services/prescriptionOCR';
import { MatchedPrescriptionTest } from '../../core/scanner';
import { formatXAF } from '../../shared/money';

interface PrescriptionScanScreenProps {
  onProceedToBooking: (selectedTests: any[]) => void;
  onBack?: () => void;
}

export const PrescriptionScanScreen: React.FC<PrescriptionScanScreenProps> = ({
  onProceedToBooking,
  onBack
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [matchedTests, setMatchedTests] = useState<MatchedPrescriptionTest[]>([]);
  const [unmatchedLines, setUnmatchedLines] = useState<string[]>([]);
  const [selectedTests, setSelectedTests] = useState<MatchedPrescriptionTest[]>([]);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [showManualPicker, setShowManualPicker] = useState(false);

  const handleRunScan = async (sourceTextOrFile: string | File) => {
    setIsScanning(true);
    try {
      const result = await scanPrescriptionDocument(sourceTextOrFile);
      setMatchedTests(result.matchedTests);
      setUnmatchedLines(result.unmatchedLines);
      setSelectedTests(result.matchedTests); // default select all matched
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setScannedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    handleRunScan(file);
  };

  const toggleTestSelection = (test: MatchedPrescriptionTest) => {
    if (selectedTests.some((t) => t.code === test.code)) {
      setSelectedTests(selectedTests.filter((t) => t.code !== test.code));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const handleAddManualTest = (code: string) => {
    const test = MASTER_TEST_DICTIONARY.find((t) => t.code === code);
    if (!test) return;
    const item: MatchedPrescriptionTest = {
      testId: test.code,
      code: test.code,
      name: test.name,
      frenchName: test.frenchName,
      category: test.category,
      basePrice: test.basePrice,
      basePriceXaf: test.basePrice,
      confidenceScore: 100,
      confidencePct: 100,
      extractedSnippet: 'Manually selected',
      matchedPhrase: test.name,
    };
    if (!selectedTests.some((t) => t.code === item.code)) {
      setSelectedTests([...selectedTests, item]);
      setMatchedTests([...matchedTests, item]);
    }
    setShowManualPicker(false);
  };

  const filteredManualTests = MASTER_TEST_DICTIONARY.filter(
    (t) =>
      t.name.toLowerCase().includes(manualSearchQuery.toLowerCase()) ||
      t.frenchName.toLowerCase().includes(manualSearchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(manualSearchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0B1F1D] tracking-tight">
            AI Prescription Scanner
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7F7D]">
            Upload or photograph a doctor's ordonnance to automatically detect and match lab tests.
          </p>
        </div>
      </div>

      {/* Real Camera & Document Capture Area */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Direct Camera Capture */}
          <label className="border-2 border-dashed border-teal-200 hover:border-teal-500 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-teal-50/40 hover:bg-teal-50/80 min-h-[200px]">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center mb-3 shadow-md">
              <Camera className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-900">Take Photo with Camera</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Opens device camera to snap prescription in natural lighting.
            </p>
          </label>

          {/* Document / File Upload */}
          <label className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-slate-100/80 min-h-[200px]">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center mb-3">
              <Upload className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-900">Browse Image or PDF</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Select image from gallery or scanned PDF from your device.
            </p>
          </label>
        </div>

        {scannedImage && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
            <img src={scannedImage} alt="Captured Prescription" className="w-16 h-16 object-cover rounded-xl border border-slate-300" />
            <div>
              <span className="text-xs font-bold text-slate-900">Prescription Acquired</span>
              <p className="text-xs text-slate-500">Image successfully queued for neural OCR & catalog verification.</p>
            </div>
          </div>
        )}

        {isScanning && (
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-center gap-3 text-xs font-bold text-[#0F766E] animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Scanning prescription lines & cross-referencing CEMAC test catalog...</span>
          </div>
        )}
      </div>

      {/* OCR Scan Results */}
      {matchedTests.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0B1F1D]">
                Detected Medical Tests ({matchedTests.length})
              </h2>
              <p className="text-xs text-[#6B7F7D]">
                Verify matched tests below before continuing to accredited laboratory booking.
              </p>
            </div>
            <span className="px-3 py-1 bg-teal-50 border border-teal-200 rounded-full text-xs font-bold text-[#0F766E]">
              {selectedTests.length} Selected
            </span>
          </div>

          {/* Matched Test List */}
          <div className="space-y-2">
            {matchedTests.map((item) => {
              const isSelected = selectedTests.some((t) => t.code === item.code);
              return (
                <div
                  key={item.code}
                  onClick={() => toggleTestSelection(item)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-teal-50/50 border-[#0F766E] shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-[#0F766E] border-[#0F766E] text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0B1F1D] truncate">
                          {item.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                          {item.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7F7D] truncate">
                        {item.frenchName} &bull; <span className="capitalize">{item.category}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-[#0D3B38]">
                      {formatXAF(item.basePrice ?? item.basePriceXaf)}
                    </span>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-teal-700 font-bold mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-[#14B8A6]" />
                      <span>{item.confidenceScore ?? item.confidencePct}% confidence</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unmatched Lines Warning / Manual Picker Button */}
          {unmatchedLines.length > 0 && (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Unmatched prescription terms detected ({unmatchedLines.length})</span>
              </div>
              <p className="text-[11px] text-amber-700">
                Handwriting or non-standard terms could not be automatically verified:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {unmatchedLines.map((line, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-white border border-amber-200 rounded-xl text-[11px] font-mono text-amber-900"
                  >
                    "{line}"
                  </span>
                ))}
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowManualPicker(true)}
                  className="min-h-[40px] px-3.5 py-1.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5 text-amber-700" />
                  <span>Pick from Master Catalog Manually</span>
                </button>
              </div>
            </div>
          )}

          {/* Proceed to Booking Action */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Selected: <strong className="text-slate-900">{selectedTests.length} tests</strong> &bull; Estimated Tariff: <strong className="text-[#0F766E]">{formatXAF(selectedTests.reduce((acc, t) => acc + (t.basePrice ?? t.basePriceXaf ?? 0), 0))}</strong>
            </div>
            <button
              type="button"
              disabled={selectedTests.length === 0}
              onClick={() => onProceedToBooking(selectedTests)}
              className="min-h-[44px] px-6 py-2.5 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-2 hover:from-[#0D3B38] hover:to-[#0F766E] transition-all"
            >
              <span>Proceed to Laboratory Selection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Manual Picker Modal */}
      {showManualPicker && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0B1F1D]">
                Pick Tests from Master Catalog
              </h3>
              <button
                onClick={() => setShowManualPicker(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by test name, french title or code..."
                value={manualSearchQuery}
                onChange={(e) => setManualSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-teal-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredManualTests.map((t) => (
                <div
                  key={t.code}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{t.name}</div>
                    <div className="text-[11px] text-slate-500">{t.frenchName || t.name} ({t.code})</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddManualTest(t.code)}
                    className="min-h-[36px] px-3 py-1 bg-[#0F766E] text-white rounded-lg text-xs font-bold hover:bg-[#0D3B38] cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionScanScreen;
