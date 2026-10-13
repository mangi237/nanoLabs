import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Building2, 
  Droplet, 
  Info, 
  AlertCircle,
  ChevronRight,
  FlaskConical,
  Heart,
  Activity,
  Flame,
  Shield,
  Coffee
} from 'lucide-react';

export interface PackageTestDetail {
  code: string;
  name: string;
  category: string;
  desc: string;
  sampleType: string;
  tubeColor: string;
  preparation: string;
  turnaroundTime: string;
}

export interface HealthPackageDefinition {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  category: string;
  description: string;
  generalPreparation: string;
  tests: PackageTestDetail[];
}

export const HEALTH_PACKAGES: HealthPackageDefinition[] = [
  {
    id: 'pkg-wellness-full',
    title: 'Comprehensive Annual Wellness Screen',
    subtitle: '7 Multi-Bench Laboratory Investigations',
    icon: 'Sparkles',
    badge: 'Most Popular',
    category: 'Preventative Health',
    description: 'A complete clinical overview of vital metabolic, hematological, hepatic, and renal markers. Designed for routine annual checkups and early symptom detection.',
    generalPreparation: 'Fasting 10 to 12 hours overnight. Plain drinking water is permitted and encouraged.',
    tests: [
      {
        code: 'NFS-01',
        name: 'Complete Blood Count (NFS / CBC)',
        category: 'Hematology',
        desc: 'Measures White Blood Cells, Red Blood Cells, Hemoglobin, Hematocrit, and Platelets for anemia and infection.',
        sampleType: 'Whole Blood',
        tubeColor: 'Purple EDTA Tube',
        preparation: 'No strict fasting needed',
        turnaroundTime: '2-3 hours'
      },
      {
        code: 'GLYC-01',
        name: 'Fasting Blood Sugar (Glycémie à Jeûn)',
        category: 'Biochemistry',
        desc: 'Measures baseline serum glucose to screen for diabetes mellitus and insulin resistance.',
        sampleType: 'Fluoride Plasma',
        tubeColor: 'Grey Fluoride Tube',
        preparation: 'Strict 10-12 hours overnight fast required',
        turnaroundTime: '1-2 hours'
      },
      {
        code: 'LIPID-01',
        name: 'Complete Lipid Profile (Bilan Lipidique)',
        category: 'Biochemistry',
        desc: 'Total Cholesterol, HDL (Good), LDL (Bad), and Triglycerides for cardiovascular atherosclerosis risk assessment.',
        sampleType: 'Serum',
        tubeColor: 'Red / Gold Gel Tube',
        preparation: '12 hours overnight fast, avoid alcohol for 24 hours prior',
        turnaroundTime: '3-4 hours'
      },
      {
        code: 'LFT-01',
        name: 'Liver Function Panel (Bilan Hépatique - SGOT / SGPT)',
        category: 'Biochemistry',
        desc: 'Transaminases (ALT/AST), Alkaline Phosphatase, and Bilirubin to assess liver tissue health and enzyme status.',
        sampleType: 'Serum',
        tubeColor: 'Red / Gold Gel Tube',
        preparation: 'Fasting recommended',
        turnaroundTime: '3 hours'
      },
      {
        code: 'KFT-01',
        name: 'Renal Function Panel (Urée & Créatinine Sérique)',
        category: 'Biochemistry',
        desc: 'Measures kidney clearance, glomerular filtration efficiency, and metabolic waste excretion.',
        sampleType: 'Serum',
        tubeColor: 'Red / Gold Gel Tube',
        preparation: 'Hydrate well with plain water',
        turnaroundTime: '2-3 hours'
      },
      {
        code: 'URIN-01',
        name: 'Urinalysis & Sediment (ECBU / Analyse d\'Urine)',
        category: 'Microbiology & Urines',
        desc: 'Detects microscopic hematuria, proteinuria, leucocytes, nitrates, and urinary tract infection markers.',
        sampleType: 'Midstream Clean Urine',
        tubeColor: 'Sterile Urine Container',
        preparation: 'First morning mid-stream specimen after intimate hygiene',
        turnaroundTime: '2-4 hours'
      },
      {
        code: 'URIC-01',
        name: 'Serum Uric Acid (Acide Urique)',
        category: 'Biochemistry',
        desc: 'Evaluates purine breakdown to screen for hyperuricemia, gout risk, and renal lithiasis.',
        sampleType: 'Serum',
        tubeColor: 'Red / Gold Gel Tube',
        preparation: 'Fasting recommended',
        turnaroundTime: '2 hours'
      }
    ]
  },
  {
    id: 'pkg-metabolic-diabetes',
    title: 'Metabolic & Diabetes Deep Screen',
    subtitle: '5 In-Depth Glycemic & Renal Biomarkers',
    icon: 'Activity',
    badge: 'Chronic Care',
    category: 'Endocrinology',
    description: 'Specialized panel for diabetes diagnosis, glycemic variability monitoring, and screening for diabetic nephropathy and dyslipidemia.',
    generalPreparation: 'Strict 10-12 hours fasting. Continue essential blood pressure medications with water.',
    tests: [
      {
        code: 'GLYC-01',
        name: 'Fasting Blood Glucose (Glycémie à Jeûn)',
        category: 'Biochemistry',
        desc: 'Determines morning basal plasma glucose concentration.',
        sampleType: 'Fluoride Plasma',
        tubeColor: 'Grey Fluoride Tube',
        preparation: '10-12 hours overnight fast',
        turnaroundTime: '1-2 hours'
      },
      {
        code: 'HBA1C-01',
        name: 'Glycated Hemoglobin (HbA1c)',
        category: 'Biochemistry',
        desc: 'Gold-standard biomarker reflecting average blood sugar control over the previous 90-120 days.',
        sampleType: 'Whole Blood',
        tubeColor: 'Purple EDTA Tube',
        preparation: 'Fasting not strictly required',
        turnaroundTime: '2-3 hours'
      },
      {
        code: 'LIPID-01',
        name: 'Complete Lipid Panel',
        category: 'Biochemistry',
        desc: 'Cholesterol, HDL, LDL, and Triglycerides to manage diabetic dyslipidemia.',
        sampleType: 'Serum',
        tubeColor: 'Red / Gold Gel Tube',
        preparation: '12 hours overnight fast',
        turnaroundTime: '3-4 hours'
      },
      {
        code: 'CREAT-01',
        name: 'Serum Creatinine & eGFR Calculation',
        category: 'Biochemistry',
        desc: 'Estimates glomerular filtration rate to screen for early diabetic kidney changes.',
        sampleType: 'Serum',
        tubeColor: 'Red / Gold Gel Tube',
        preparation: 'Hydrate normally',
        turnaroundTime: '2 hours'
      },
      {
        code: 'MICROALB-01',
        name: 'Microalbuminuria (Microalbuminurie Urinaire)',
        category: 'Biochemistry',
        desc: 'Detects microscopic protein leakage in urine for early kidney protection.',
        sampleType: 'Spot Morning Urine',
        tubeColor: 'Sterile Urine Cup',
        preparation: 'Morning first void sample',
        turnaroundTime: '3 hours'
      }
    ]
  },
  {
    id: 'pkg-cardiac-risk',
    title: 'Cardiovascular Risk & Lipid Profile',
    subtitle: '5 Heart & Vascular Health Biomarkers',
    icon: 'Heart',
    badge: 'Cardio Vital',
    category: 'Cardiology',
    description: 'Evaluates atherogenic risk, vascular inflammation, and coronary safety for hypertensive and middle-aged patients.',
    generalPreparation: 'Overnight 12-hour fast. Avoid strenuous workout and tobacco 24h prior.',
    tests: [
      {
        code: 'LIPID-01',
        name: 'Lipid Profile (Cholesterol, HDL, LDL, Triglycerides)',
        category: 'Biochemistry',
        desc: 'Calculates atherogenic ratios and total cardiovascular risk score.',
        sampleType: 'Serum',
        tubeColor: 'Red / Gold Gel Tube',
        preparation: '12 hours fast',
        turnaroundTime: '3 hours'
      },
      {
        code: 'HSCRP-01',
        name: 'High-Sensitivity CRP (hs-CRP Cardio)',
        category: 'Immunology',
        desc: 'Detects low-grade endothelial inflammation predicting cardiovascular events.',
        sampleType: 'Serum',
        tubeColor: 'Red / Gold Gel Tube',
        preparation: 'Normal hydration',
        turnaroundTime: '3-4 hours'
      },
      {
        code: 'IONO-01',
        name: 'Serum Electrolytes / Ionogramme (Na+, K+, Cl-)',
        category: 'Biochemistry',
        desc: 'Monitors sodium and potassium balance essential for cardiac rhythm and hypertension.',
        sampleType: 'Serum',
        tubeColor: 'Red / Gold Gel Tube',
        preparation: 'No hemolysis, avoid fist clenching',
        turnaroundTime: '2 hours'
      },
      {
        code: 'GLYC-01',
        name: 'Fasting Blood Glucose',
        category: 'Biochemistry',
        desc: 'Correlates metabolic syndrome with cardiovascular risk.',
        sampleType: 'Fluoride Plasma',
        tubeColor: 'Grey Fluoride Tube',
        preparation: '10-12 hours fast',
        turnaroundTime: '2 hours'
      },
      {
        code: 'NFS-01',
        name: 'Full Blood Count (NFS)',
        category: 'Hematology',
        desc: 'Platelet indices and hematocrit to evaluate blood viscosity.',
        sampleType: 'Whole Blood',
        tubeColor: 'Purple EDTA Tube',
        preparation: 'Standard protocol',
        turnaroundTime: '2 hours'
      }
    ]
  },
  {
    id: 'pkg-premarital-screen',
    title: 'Pre-Marital & Infectious Disease Screen',
    subtitle: '6 Certified CEMAC Biological Tests',
    icon: 'Shield',
    badge: 'Couples / Health',
    category: 'Infectious & Genetic',
    description: 'Essential diagnostic panel for couples planning marriage or conception. Screens for hemoglobinopathies (Sickle Cell/Drépanocytose) and viral infections.',
    generalPreparation: 'No fasting required. Official identification needed for certified reporting.',
    tests: [
      {
        code: 'ELECTRO-01',
        name: 'Hemoglobin Electrophoresis (Électrophorèse de l\'Hémoglobine)',
        category: 'Hematology',
        desc: 'Identifies HbAA, HbAS, or HbSS to detect sickle cell disease (Drépanocytose) traits.',
        sampleType: 'Whole Blood',
        tubeColor: 'Purple EDTA Tube',
        preparation: 'No fasting needed',
        turnaroundTime: '24 hours'
      },
      {
        code: 'GS-RH-01',
        name: 'ABO Blood Group & Rhesus Factor (Groupe Sanguin)',
        category: 'Immunohematology',
        desc: 'Determines blood group (A, B, AB, O) and Rh compatibility for maternal-fetal safety.',
        sampleType: 'Whole Blood',
        tubeColor: 'Purple EDTA Tube',
        preparation: 'Standard collection',
        turnaroundTime: '2 hours'
      },
      {
        code: 'HIV-01',
        name: 'HIV 1 & 2 Serology (ELISA 4th Gen)',
        category: 'Serology',
        desc: 'Fourth-generation antigen/antibody screening for Human Immunodeficiency Virus.',
        sampleType: 'Serum',
        tubeColor: 'Red / Gold Gel Tube',
        preparation: 'Confidential protocol',
        turnaroundTime: '3 hours'
      },
      {
        code: 'HBSAG-01',
        name: 'Hepatitis B Surface Antigen (Ag HBs)',
        category: 'Serology',
        desc: 'Screens for active Viral Hepatitis B infection and carrier state.',
        sampleType: 'Serum',
        tubeColor: 'Red / Gold Gel Tube',
        preparation: 'Standard protocol',
        turnaroundTime: '3 hours'
      },
      {
        code: 'HCV-01',
        name: 'Hepatitis C Antibody (Ac Anti-VHC)',
        category: 'Serology',
        desc: 'Detects exposure to Viral Hepatitis C.',
        sampleType: 'Serum',
        tubeColor: 'Red / Gold Gel Tube',
        preparation: 'Standard protocol',
        turnaroundTime: '3 hours'
      },
      {
        code: 'VDRL-01',
        name: 'Syphilis Serology (VDRL / TPHA)',
        category: 'Serology',
        desc: 'Screens for Treponema pallidum infection.',
        sampleType: 'Serum',
        tubeColor: 'Red / Gold Gel Tube',
        preparation: 'Standard protocol',
        turnaroundTime: '3 hours'
      }
    ]
  }
];

interface HealthPackageScreenProps {
  onBack: () => void;
  onViewAvailableLabs: (packageTests: string[]) => void;
  initialPackageId?: string;
}

export const HealthPackageScreen: React.FC<HealthPackageScreenProps> = ({
  onBack,
  onViewAvailableLabs,
  initialPackageId = 'pkg-wellness-full'
}) => {
  const [selectedPackageId, setSelectedPackageId] = useState<string>(initialPackageId);
  const activePackage = HEALTH_PACKAGES.find(p => p.id === selectedPackageId) || HEALTH_PACKAGES[0];

  const handleProceedWithPackage = () => {
    onViewAvailableLabs(activePackage.tests.map(t => t.name));
  };

  return (
    <div className="max-w-4xl mx-auto py-3 px-3 sm:px-6 text-slate-900 animate-in fade-in duration-300 space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Diagnostic Health Packages
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Multi-test bundled profiles &bull; Tariffs determined by performing laboratories
          </p>
        </div>
      </div>

      {/* Package Selector Horizontal Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {HEALTH_PACKAGES.map((pkg) => {
          const isSelected = pkg.id === selectedPackageId;
          return (
            <button
              key={pkg.id}
              onClick={() => setSelectedPackageId(pkg.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                isSelected
                  ? 'bg-[#006978] text-white border-[#006978] shadow-md shadow-[#006978]/25 scale-[1.02]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-200' : 'text-[#006978]'}`} />
              <span>{pkg.title}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {pkg.tests.length} tests
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Package Hero Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-[#004D56] via-[#006978] to-[#00838F] text-white rounded-3xl shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-extrabold text-cyan-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{activePackage.badge} &bull; {activePackage.category}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {activePackage.title}
            </h2>
            <p className="text-xs sm:text-sm text-cyan-100/90 leading-relaxed max-w-2xl">
              {activePackage.description}
            </p>
          </div>

          <div className="sm:text-right shrink-0 bg-white/10 p-3.5 rounded-2xl backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-200 block">Bundle Composition</span>
            <span className="text-2xl font-black text-white">{activePackage.tests.length}</span>
            <span className="text-xs font-medium text-cyan-100 block">Individual Investigations</span>
          </div>
        </div>

        {/* General Preparation Callout */}
        <div className="p-3 bg-black/20 rounded-2xl border border-white/10 text-xs text-cyan-100 flex items-start gap-2.5">
          <Coffee className="w-4 h-4 text-cyan-200 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block font-bold">Preparation Guideline for this Package:</strong>
            <span>{activePackage.generalPreparation}</span>
          </div>
        </div>
      </div>

      {/* Laboratories Set Package Tariffs Banner */}
      <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
              Transparent Lab-Specific Pricing
            </h4>
            <p className="text-[11px] text-amber-900 font-medium">
              nanoLabs does not set fixed test tariffs. Each accredited laboratory applies its own certified price and home courier distance fee.
            </p>
          </div>
        </div>
      </div>

      {/* DETAILED BREAKDOWN OF ALL TESTS IN THIS PACKAGE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-[#006978]" />
              <span>All Investigations Included in this Package ({activePackage.tests.length} Tests)</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Review what each laboratory will analyze, specimen requirements, and turnaround times
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {activePackage.tests.map((test, idx) => (
            <div
              key={test.code}
              className="p-4 bg-white border border-slate-200/90 hover:border-[#006978] rounded-2xl shadow-xs space-y-2.5 transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#E0F2F1] text-[#006978] flex items-center justify-center font-black text-xs shrink-0 group-hover:scale-105 transition-transform">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-[#006978] transition-colors leading-snug">
                      {test.name}
                    </h4>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      Code: {test.code} &bull; {test.category}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 border border-emerald-100">
                  <Check className="w-3 h-3 stroke-[3]" />
                  Included
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed pl-9">
                {test.desc}
              </p>

              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px] text-slate-500 pl-9">
                <div className="flex items-center gap-1">
                  <Droplet className="w-3 h-3 text-rose-500 shrink-0" />
                  <span className="truncate">{test.tubeColor}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#006978] shrink-0" />
                  <span>~{test.turnaroundTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Sticky Action CTA */}
      <div className="pt-3 sticky bottom-4 z-20">
        <button
          onClick={handleProceedWithPackage}
          className="w-full py-4 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white font-black text-sm rounded-2xl shadow-xl shadow-[#006978]/30 transition-all cursor-pointer flex items-center justify-center gap-2 group"
        >
          <Building2 className="w-5 h-5 text-cyan-200 group-hover:scale-110 transition-transform" />
          <span>Choose Performing Lab for {activePackage.title} ({activePackage.tests.length} Tests)</span>
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default HealthPackageScreen;
