import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  X, 
  Sparkles, 
  Check, 
  RefreshCw, 
  FlaskConical, 
  Lock, 
  Microscope, 
  HelpCircle,
  CheckCircle2,
  SlidersHorizontal,
  Key
} from 'lucide-react';

interface HumanVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  title?: string;
  subtitle?: string;
}

export const HumanVerificationModal: React.FC<HumanVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  title = 'Human Operator Security Verification',
  subtitle = 'Zero-Bot interactive diagnostic challenge to authorize facility creation'
}) => {
  const [sliderValue, setSliderValue] = useState(0);
  const [targetSlider, setTargetSlider] = useState(78);
  const [sliderPassed, setSliderPassed] = useState(false);
  
  // Math logic challenge
  const [num1, setNum1] = useState(14);
  const [num2, setNum2] = useState(7);
  const [userMathAnswer, setUserMathAnswer] = useState('');
  const [mathPassed, setMathPassed] = useState(false);

  // Selected specimen tube
  const [selectedTube, setSelectedTube] = useState<string | null>(null);
  const [requiredSpecimen, setRequiredSpecimen] = useState<'EDTA (Lavender)' | 'Serum (Red/Gold)' | 'Citrate (Light Blue)' | 'Heparin (Green)'>('EDTA (Lavender)');

  const [errorMessage, setErrorMessage] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      resetChallenge();
    }
  }, [isOpen]);

  const resetChallenge = () => {
    const randomTarget = Math.floor(65 + Math.random() * 30);
    setTargetSlider(randomTarget);
    setSliderValue(0);
    setSliderPassed(false);

    const a = Math.floor(10 + Math.random() * 20);
    const b = Math.floor(3 + Math.random() * 9);
    setNum1(a);
    setNum2(b);
    setUserMathAnswer('');
    setMathPassed(false);

    const specimens: ('EDTA (Lavender)' | 'Serum (Red/Gold)' | 'Citrate (Light Blue)' | 'Heparin (Green)')[ ] = [
      'EDTA (Lavender)', 'Serum (Red/Gold)', 'Citrate (Light Blue)', 'Heparin (Green)'
    ];
    const picked = specimens[Math.floor(Math.random() * specimens.length)];
    setRequiredSpecimen(picked);
    setSelectedTube(null);
    setErrorMessage('');
  };

  if (!isOpen) return null;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderValue(val);
    if (Math.abs(val - targetSlider) <= 4) {
      setSliderPassed(true);
    } else {
      setSliderPassed(false);
    }
  };

  const handleConfirmVerification = () => {
    setErrorMessage('');

    // 1. Check Slider
    if (!sliderPassed) {
      setErrorMessage(`Please drag the specimen slider into the green target zone (${targetSlider}%).`);
      return;
    }

    // 2. Check Math
    // if (parseInt(userMathAnswer.trim(), 10) !== (num1 + num2)) {
    //   setErrorMessage(`Diagnostic arithmetic answer is incorrect. Please calculate: ${num1} + ${num2}`);
    //   return;
    // }

    // 3. Check Specimen Match
    // if (selectedTube !== requiredSpecimen) {
    //   setErrorMessage(`Please select the requested "${requiredSpecimen}" specimen collection tube.`);
    //   return;
    // }

    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      onVerified();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150 my-auto space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold animate-shake">
            {errorMessage}
          </div>
        )}

        {/* STEP 1: Specimen Alignment Slider */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
              1. Calibrate Specimen Centrifuge Slider:
            </span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded-md text-[10px] ${
              sliderPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {sliderPassed ? '✅ Target Locked' : `Target: ${targetSlider}%`}
            </span>
          </div>

          <div className="relative pt-2 pb-1">
            {/* Target indicator line */}
            <div 
              className="absolute top-0 bottom-0 w-3 bg-emerald-400/40 rounded-full border border-emerald-500 pointer-events-none"
              style={{ left: `calc(${targetSlider}% - 6px)` }}
            />
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={handleSliderChange}
              className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
            />
          </div>
          <p className="text-[10px] text-slate-500">
            Slide until the tracker aligns with the green calibration threshold.
          </p>
        </div>

      

     
        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={resetChallenge}
            className="p-2 text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Challenge</span>
          </button>

          <button
            type="button"
            onClick={handleConfirmVerification}
            disabled={verifying}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
          >
            {verifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying Biometrics...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Authorize & Provision Lab</span>
              </>
            )}
          </button>
        </div>

      </div>
   </div>
  );
};

export default HumanVerificationModal;
