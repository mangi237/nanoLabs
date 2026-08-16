export interface TestSubParameter {
    id: string;
    name: string;
    unit: string;
    refRangeMale: string;
    refRangeFemale: string;
    refRangeChild: string;
    maleMin?: number;
    maleMax?: number;
    femaleMin?: number;
    femaleMax?: number;
    childMin?: number;
    childMax?: number;
    defaultValue?: string;
  }
  
  export interface MasterTestItem {
    id: string;
    code: string;
    name: string;
    category: 'Hematology' | 'Biochemistry' | 'Microbiology' | 'Serology / Immunology' | 'Hormones & Tumor Markers' | 'Urinalysis & Parasitology' | 'Cytopathology & Fluids';
    sampleType: string;
    units: string;
    refRangeMale: string;
    refRangeFemale: string;
    refRangeChild: string;
    maleMin?: number;
    maleMax?: number;
    femaleMin?: number;
    femaleMax?: number;
    childMin?: number;
    childMax?: number;
    reagentsRequired?: Array<{
      reagentId: string;
      reagentName: string;
      quantityRequired: number; // e.g. 1 mL or 1 test unit
    }>;
    conditions?: string; // Patient preparation & reasons for withdrawal / test rules
    basePrice: number; // Price in XAF / FCFA
    turnaroundTime: string;
    description: string;
    tubeColor?: string;
    requiredReagents?: any[];
    subParameters?: TestSubParameter[];
  }
  
  export const MASTER_TESTS_CATALOG: MasterTestItem[] = [
    // ========================================================
    // 1. HEMATOLOGY
    // ========================================================
    {
      id: 'hem-01',
      code: 'CBC-01',
      name: 'Complete Blood Count (CBC) with Absolute Count',
      category: 'Hematology',
      sampleType: 'Whole Blood (EDTA Tube)',
      units: 'Various',
      refRangeMale: 'See sub-parameters',
      refRangeFemale: 'See sub-parameters',
      refRangeChild: 'See sub-parameters',
      conditions: 'Fasting not strictly required. Avoid strenuous physical exercise before blood draw.',
      basePrice: 8500,
      turnaroundTime: '2 hours',
      description: 'Comprehensive quantitative analysis of cellular blood components including RBC, WBC differential, Hemoglobin, Hematocrit, and Platelets.',
      reagentsRequired: [
        { reagentId: 'reag-cbc-diluent', reagentName: 'Hematology Cell Counter Diluent', quantityRequired: 1 },
        { reagentId: 'reag-cbc-lyse', reagentName: 'Lytic Reagent (Hemoglobin Lyse)', quantityRequired: 1 }
      ],
      subParameters: [
        { id: 'hb', name: 'Hemoglobin (Hb)', unit: 'g/dL', refRangeMale: '13.0 - 17.0', refRangeFemale: '12.0 - 15.5', refRangeChild: '11.0 - 14.5', maleMin: 13.0, maleMax: 17.0, femaleMin: 12.0, femaleMax: 15.5, childMin: 11.0, childMax: 14.5 },
        { id: 'rbc', name: 'Total RBC Count', unit: 'mill/cumm', refRangeMale: '4.5 - 5.5', refRangeFemale: '4.0 - 5.0', refRangeChild: '3.8 - 4.8', maleMin: 4.5, maleMax: 5.5, femaleMin: 4.0, femaleMax: 5.0, childMin: 3.8, childMax: 4.8 },
        { id: 'pcv', name: 'Packed Cell Volume (PCV / Hematocrit)', unit: '%', refRangeMale: '40.0 - 50.0', refRangeFemale: '36.0 - 46.0', refRangeChild: '34.0 - 44.0', maleMin: 40.0, maleMax: 50.0, femaleMin: 36.0, femaleMax: 46.0, childMin: 34.0, childMax: 44.0 },
        { id: 'mcv', name: 'Mean Corpuscular Volume (MCV)', unit: 'fL', refRangeMale: '83.0 - 101.0', refRangeFemale: '83.0 - 101.0', refRangeChild: '78.0 - 98.0', maleMin: 83.0, maleMax: 101.0, femaleMin: 83.0, femaleMax: 101.0, childMin: 78.0, childMax: 98.0 },
        { id: 'mch', name: 'Mean Corpuscular Hemoglobin (MCH)', unit: 'pg', refRangeMale: '27.0 - 32.0', refRangeFemale: '27.0 - 32.0', refRangeChild: '25.0 - 31.0', maleMin: 27.0, maleMax: 32.0, femaleMin: 27.0, femaleMax: 32.0, childMin: 25.0, childMax: 31.0 },
        { id: 'mchc', name: 'MCHC', unit: 'g/dL', refRangeMale: '32.5 - 34.5', refRangeFemale: '32.5 - 34.5', refRangeChild: '32.0 - 34.0', maleMin: 32.5, maleMax: 34.5, femaleMin: 32.5, femaleMax: 34.5, childMin: 32.0, childMax: 34.0 },
        { id: 'rdw', name: 'Red Cell Distribution Width (RDW)', unit: '%', refRangeMale: '11.6 - 14.0', refRangeFemale: '11.6 - 14.0', refRangeChild: '11.5 - 14.5', maleMin: 11.6, maleMax: 14.0, femaleMin: 11.6, femaleMax: 14.0, childMin: 11.5, childMax: 14.5 },
        { id: 'wbc', name: 'Total WBC Count', unit: 'cumm', refRangeMale: '4000 - 11000', refRangeFemale: '4000 - 11000', refRangeChild: '5000 - 13000', maleMin: 4000, maleMax: 11000, femaleMin: 4000, femaleMax: 11000, childMin: 5000, childMax: 13000 },
        { id: 'neutrophils', name: 'Neutrophils', unit: '%', refRangeMale: '50 - 62', refRangeFemale: '50 - 62', refRangeChild: '40 - 60', maleMin: 50, maleMax: 62, femaleMin: 50, femaleMax: 62, childMin: 40, childMax: 60 },
        { id: 'lymphocytes', name: 'Lymphocytes', unit: '%', refRangeMale: '20 - 40', refRangeFemale: '20 - 40', refRangeChild: '25 - 50', maleMin: 20, maleMax: 40, femaleMin: 20, femaleMax: 40, childMin: 25, childMax: 50 },
        { id: 'eosinophils', name: 'Eosinophils', unit: '%', refRangeMale: '0 - 6', refRangeFemale: '0 - 6', refRangeChild: '0 - 5', maleMin: 0, maleMax: 6, femaleMin: 0, femaleMax: 6, childMin: 0, childMax: 5 },
        { id: 'monocytes', name: 'Monocytes', unit: '%', refRangeMale: '0 - 10', refRangeFemale: '0 - 10', refRangeChild: '2 - 10', maleMin: 0, maleMax: 10, femaleMin: 0, femaleMax: 10, childMin: 2, childMax: 10 },
        { id: 'basophils', name: 'Basophils', unit: '%', refRangeMale: '0 - 2', refRangeFemale: '0 - 2', refRangeChild: '0 - 2', maleMin: 0, maleMax: 2, femaleMin: 0, femaleMax: 2, childMin: 0, childMax: 2 },
        { id: 'platelets', name: 'Platelet Count', unit: 'cumm', refRangeMale: '150000 - 410000', refRangeFemale: '150000 - 410000', refRangeChild: '150000 - 450000', maleMin: 150000, maleMax: 410000, femaleMin: 150000, femaleMax: 410000, childMin: 150000, childMax: 450000 }
      ]
    },
    {
      id: 'hem-02',
      code: 'ESR-01',
      name: 'Erythrocyte Sedimentation Rate (ESR)',
      category: 'Hematology',
      sampleType: 'Whole Blood (Sodium Citrate Tube)',
      units: 'mm/1st hr',
      refRangeMale: '0 - 15',
      refRangeFemale: '0 - 20',
      refRangeChild: '0 - 10',
      maleMin: 0, maleMax: 15, femaleMin: 0, femaleMax: 20, childMin: 0, childMax: 10,
      conditions: 'No special preparation needed.',
      basePrice: 3000,
      turnaroundTime: '1.5 hours',
      description: 'Nonspecific marker of acute and chronic inflammation, infection, and tissue necrosis.',
      reagentsRequired: [
        { reagentId: 'reag-citrate', reagentName: 'Sodium Citrate Anticoagulant 3.8%', quantityRequired: 1 }
      ]
    },
    {
      id: 'hem-03',
      code: 'BG-01',
      name: 'ABO & Rhesus (Rh) Blood Grouping',
      category: 'Hematology',
      sampleType: 'Whole Blood (EDTA or Clot Activator)',
      units: 'Qualitative',
      refRangeMale: 'ABO / Rh Type',
      refRangeFemale: 'ABO / Rh Type',
      refRangeChild: 'ABO / Rh Type',
      conditions: 'No special preparation needed.',
      basePrice: 3500,
      turnaroundTime: '30 mins',
      description: 'Determination of ABO blood group and Rhesus D factor antigen status on erythrocyte surface.',
      reagentsRequired: [
        { reagentId: 'reag-anti-a', reagentName: 'Anti-A Monoclonal Sera', quantityRequired: 1 },
        { reagentId: 'reag-anti-b', reagentName: 'Anti-B Monoclonal Sera', quantityRequired: 1 },
        { reagentId: 'reag-anti-d', reagentName: 'Anti-D (Rh) Monoclonal Sera', quantityRequired: 1 }
      ]
    },
    {
      id: 'hem-04',
      code: 'HB-ELEC',
      name: 'Hemoglobin Electrophoresis (Sickle Cell Screen)',
      category: 'Hematology',
      sampleType: 'Whole Blood (EDTA Tube)',
      units: '% Pattern',
      refRangeMale: 'Hb AA (>95% A1, <3.5% A2, <1% F)',
      refRangeFemale: 'Hb AA (>95% A1, <3.5% A2, <1% F)',
      refRangeChild: 'Hb AA (>95% A1, <3.5% A2, <2% F)',
      conditions: 'No blood transfusion within 3 months prior to testing.',
      basePrice: 15000,
      turnaroundTime: '24 hours',
      description: 'Separation and quantification of normal and abnormal hemoglobin variants (Hb A, S, C, F, A2) for hemoglobinopathy diagnosis.',
      reagentsRequired: [
        { reagentId: 'reag-cellulose-buf', reagentName: 'Alkaline Electrophoresis Buffer', quantityRequired: 1 }
      ]
    },
    {
      id: 'hem-05',
      code: 'PT-INR',
      name: 'Prothrombin Time (PT) & INR',
      category: 'Hematology',
      sampleType: 'Citrated Plasma (Light Blue Tube)',
      units: 'Seconds / Ratio',
      refRangeMale: '11.0 - 13.5 sec (INR: 0.8 - 1.2)',
      refRangeFemale: '11.0 - 13.5 sec (INR: 0.8 - 1.2)',
      refRangeChild: '11.0 - 13.5 sec (INR: 0.8 - 1.2)',
      conditions: 'Draw exactly to the fill mark on sodium citrate tube. Record anticoagulant therapy (Warfarin/Coumadin).',
      basePrice: 8000,
      turnaroundTime: '2 hours',
      description: 'Assessment of extrinsic and common coagulation pathways; monitoring of oral anticoagulant treatment.',
      reagentsRequired: [
        { reagentId: 'reag-thromboplastin', reagentName: 'Thromboplastin Reagent with Calcium', quantityRequired: 1 }
      ]
    },
    {
      id: 'hem-06',
      code: 'APTT-01',
      name: 'Activated Partial Thromboplastin Time (aPTT)',
      category: 'Hematology',
      sampleType: 'Citrated Plasma (Light Blue Tube)',
      units: 'Seconds',
      refRangeMale: '25.0 - 35.0',
      refRangeFemale: '25.0 - 35.0',
      refRangeChild: '25.0 - 38.0',
      maleMin: 25.0, maleMax: 35.0, femaleMin: 25.0, femaleMax: 35.0, childMin: 25.0, childMax: 38.0,
      conditions: 'Proper anticoagulant ratio 9:1. Record Unfractionated Heparin therapy.',
      basePrice: 8500,
      turnaroundTime: '2 hours',
      description: 'Evaluation of intrinsic coagulation pathway factors (VIII, IX, XI, XII); monitoring heparin therapy.',
      reagentsRequired: [
        { reagentId: 'reag-aptt-activator', reagentName: 'aPTT Ellagic Acid Activator + CaCl2', quantityRequired: 1 }
      ]
    },
    {
      id: 'hem-07',
      code: 'RETIC-01',
      name: 'Reticulocyte Count',
      category: 'Hematology',
      sampleType: 'Whole Blood (EDTA Tube)',
      units: '%',
      refRangeMale: '0.5 - 2.5',
      refRangeFemale: '0.5 - 2.5',
      refRangeChild: '0.5 - 3.5',
      maleMin: 0.5, maleMax: 2.5, femaleMin: 0.5, femaleMax: 2.5, childMin: 0.5, childMax: 3.5,
      conditions: 'Fresh blood sample tested within 4 hours of collection.',
      basePrice: 6000,
      turnaroundTime: '3 hours',
      description: 'Measures immature erythrocytes to evaluate bone marrow erythropoietic response in anemia.',
      reagentsRequired: [
        { reagentId: 'reag-supravital', reagentName: 'New Methylene Blue Stain', quantityRequired: 1 }
      ]
    },
    {
      id: 'hem-08',
      code: 'BLEED-CLOT',
      name: 'Bleeding Time (BT) & Clotting Time (CT)',
      category: 'Hematology',
      sampleType: 'Capillary Blood (Finger Prick)',
      units: 'Minutes',
      refRangeMale: 'BT: 2 - 7 mins | CT: 4 - 10 mins',
      refRangeFemale: 'BT: 2 - 7 mins | CT: 4 - 10 mins',
      refRangeChild: 'BT: 2 - 7 mins | CT: 4 - 10 mins',
      conditions: 'No Aspirin, NSAIDs, or antiplatelet medication for 7 days prior.',
      basePrice: 4000,
      turnaroundTime: '30 mins',
      description: 'Bedside functional screening test for vascular response, platelet function, and intrinsic coagulation speed.',
      reagentsRequired: [
        { reagentId: 'reag-filter-paper', reagentName: 'Whatman Filter Paper Circles', quantityRequired: 1 }
      ]
    },
  
    // ========================================================
    // 2. BIOCHEMISTRY
    // ========================================================
    {
      id: 'bio-01',
      code: 'FBS-01',
      name: 'Fasting Blood Sugar (FBS / Glucose)',
      category: 'Biochemistry',
      sampleType: 'Fluoride Plasma / Serum',
      units: 'mg/dL',
      refRangeMale: '70 - 99',
      refRangeFemale: '70 - 99',
      refRangeChild: '60 - 100',
      maleMin: 70, maleMax: 99, femaleMin: 70, femaleMax: 99, childMin: 60, childMax: 100,
      conditions: 'Overnight fasting of 8-12 hours required before blood draw. Water permitted.',
      basePrice: 3000,
      turnaroundTime: '1 hour',
      description: 'Primary screening and diagnostic biomarker for Diabetes Mellitus and carbohydrate metabolic disorders.',
      reagentsRequired: [
        { reagentId: 'reag-god-pod', reagentName: 'Glucose Oxidase (GOD-POD) Reagent', quantityRequired: 1 }
      ]
    },
    {
      id: 'bio-02',
      code: 'HBA1C-01',
      name: 'Glycated Hemoglobin (HbA1c)',
      category: 'Biochemistry',
      sampleType: 'Whole Blood (EDTA Tube)',
      units: '%',
      refRangeMale: '< 5.7 (Prediabetes: 5.7 - 6.4, Diabetes: >= 6.5)',
      refRangeFemale: '< 5.7 (Prediabetes: 5.7 - 6.4, Diabetes: >= 6.5)',
      refRangeChild: '< 5.7',
      maleMin: 4.0, maleMax: 5.6, femaleMin: 4.0, femaleMax: 5.6, childMin: 4.0, childMax: 5.6,
      conditions: 'Fasting not required. Reflects average glycemic control over preceding 2-3 months.',
      basePrice: 12000,
      turnaroundTime: '3 hours',
      description: 'Gold-standard biomarker for long-term glycemic control and monitoring in diabetic patients.',
      reagentsRequired: [
        { reagentId: 'reag-hba1c-latex', reagentName: 'HbA1c Immunoturbidimetric Latex Kit', quantityRequired: 1 }
      ]
    },
    {
      id: 'bio-03',
      code: 'LIPID-01',
      name: 'Lipid Profile (Full Panel)',
      category: 'Biochemistry',
      sampleType: 'Serum (Yellow SST Tube)',
      units: 'mg/dL',
      refRangeMale: 'See sub-parameters',
      refRangeFemale: 'See sub-parameters',
      refRangeChild: 'See sub-parameters',
      conditions: 'Strict 10-12 hours overnight fasting. Avoid fatty meals or alcohol 24 hours prior.',
      basePrice: 15000,
      turnaroundTime: '2 hours',
      description: 'Comprehensive cardiovascular risk assessment quantifying Total Cholesterol, Triglycerides, HDL, LDL, and VLDL.',
      reagentsRequired: [
        { reagentId: 'reag-chol-enz', reagentName: 'Cholesterol Esterase / Oxidase Reagent', quantityRequired: 1 },
        { reagentId: 'reag-trig-enz', reagentName: 'GPO-PAP Triglycerides Reagent', quantityRequired: 1 }
      ],
      subParameters: [
        { id: 'cholesterol', name: 'Total Cholesterol', unit: 'mg/dL', refRangeMale: '< 200', refRangeFemale: '< 200', refRangeChild: '< 170', maleMin: 120, maleMax: 200, femaleMin: 120, femaleMax: 200, childMin: 100, childMax: 170 },
        { id: 'triglycerides', name: 'Triglycerides', unit: 'mg/dL', refRangeMale: '< 150', refRangeFemale: '< 150', refRangeChild: '< 100', maleMin: 40, maleMax: 150, femaleMin: 40, femaleMax: 150, childMin: 30, childMax: 100 },
        { id: 'hdl', name: 'HDL Cholesterol (Good)', unit: 'mg/dL', refRangeMale: '> 40', refRangeFemale: '> 50', refRangeChild: '> 45', maleMin: 40, maleMax: 90, femaleMin: 50, femaleMax: 90, childMin: 45, childMax: 90 },
        { id: 'ldl', name: 'LDL Cholesterol (Bad)', unit: 'mg/dL', refRangeMale: '< 100', refRangeFemale: '< 100', refRangeChild: '< 100', maleMin: 50, maleMax: 100, femaleMin: 50, femaleMax: 100, childMin: 50, childMax: 100 },
        { id: 'vldl', name: 'VLDL Cholesterol', unit: 'mg/dL', refRangeMale: '5 - 30', refRangeFemale: '5 - 30', refRangeChild: '5 - 25', maleMin: 5, maleMax: 30, femaleMin: 5, femaleMax: 30, childMin: 5, childMax: 25 }
      ]
    },
    {
      id: 'bio-04',
      code: 'LFT-01',
      name: 'Liver Function Tests (LFT Full Panel)',
      category: 'Biochemistry',
      sampleType: 'Serum (Yellow SST Tube)',
      units: 'Various',
      refRangeMale: 'See sub-parameters',
      refRangeFemale: 'See sub-parameters',
      refRangeChild: 'See sub-parameters',
      conditions: 'Fasting 8 hours recommended. Avoid alcohol and hepatotoxic drugs prior to sampling.',
      basePrice: 18000,
      turnaroundTime: '3 hours',
      description: 'Biochemical assessment of hepatic parenchymal integrity, biliary tract patency, and synthetic liver capacity.',
      reagentsRequired: [
        { reagentId: 'reag-alt-ast', reagentName: 'ALT / AST Kinetic UV Reagent', quantityRequired: 1 },
        { reagentId: 'reag-bili-diazo', reagentName: 'Bilirubin Diazo Reagent Kit', quantityRequired: 1 }
      ],
      subParameters: [
        { id: 'total_bili', name: 'Total Bilirubin', unit: 'mg/dL', refRangeMale: '0.2 - 1.2', refRangeFemale: '0.2 - 1.2', refRangeChild: '0.2 - 1.0', maleMin: 0.2, maleMax: 1.2, femaleMin: 0.2, femaleMax: 1.2, childMin: 0.2, childMax: 1.0 },
        { id: 'direct_bili', name: 'Direct Bilirubin (Conjugated)', unit: 'mg/dL', refRangeMale: '0.0 - 0.3', refRangeFemale: '0.0 - 0.3', refRangeChild: '0.0 - 0.2', maleMin: 0.0, maleMax: 0.3, femaleMin: 0.0, femaleMax: 0.3, childMin: 0.0, childMax: 0.2 },
        { id: 'sgot_ast', name: 'SGOT / AST', unit: 'U/L', refRangeMale: '10 - 40', refRangeFemale: '10 - 35', refRangeChild: '15 - 50', maleMin: 10, maleMax: 40, femaleMin: 10, femaleMax: 35, childMin: 15, childMax: 50 },
        { id: 'sgpt_alt', name: 'SGPT / ALT', unit: 'U/L', refRangeMale: '7 - 56', refRangeFemale: '7 - 45', refRangeChild: '10 - 40', maleMin: 7, maleMax: 56, femaleMin: 7, femaleMax: 45, childMin: 10, childMax: 40 },
        { id: 'alp', name: 'Alkaline Phosphatase (ALP)', unit: 'U/L', refRangeMale: '44 - 147', refRangeFemale: '44 - 147', refRangeChild: '110 - 350', maleMin: 44, maleMax: 147, femaleMin: 44, femaleMax: 147, childMin: 110, childMax: 350 },
        { id: 'total_protein', name: 'Total Protein', unit: 'g/dL', refRangeMale: '6.0 - 8.3', refRangeFemale: '6.0 - 8.3', refRangeChild: '6.0 - 8.0', maleMin: 6.0, maleMax: 8.3, femaleMin: 6.0, femaleMax: 8.3, childMin: 6.0, childMax: 8.0 },
        { id: 'albumin', name: 'Albumin', unit: 'g/dL', refRangeMale: '3.5 - 5.2', refRangeFemale: '3.5 - 5.2', refRangeChild: '3.8 - 5.4', maleMin: 3.5, maleMax: 5.2, femaleMin: 3.5, femaleMax: 5.2, childMin: 3.8, childMax: 5.4 }
      ]
    },
    {
      id: 'bio-05',
      code: 'RFT-01',
      name: 'Renal Function Tests (Urea, Creatinine, Uric Acid)',
      category: 'Biochemistry',
      sampleType: 'Serum (Yellow SST Tube)',
      units: 'mg/dL',
      refRangeMale: 'See sub-parameters',
      refRangeFemale: 'See sub-parameters',
      refRangeChild: 'See sub-parameters',
      conditions: 'Maintain normal hydration. Avoid cooked meat binge before creatinine test.',
      basePrice: 15000,
      turnaroundTime: '2 hours',
      description: 'Quantitative evaluation of glomerular filtration efficiency and nitrogenous waste clearance.',
      reagentsRequired: [
        { reagentId: 'reag-urea-urease', reagentName: 'Urease GLDH Kinetic Reagent', quantityRequired: 1 },
        { reagentId: 'reag-creat-jaffe', reagentName: 'Jaffe Alkaline Picrate Creatinine Reagent', quantityRequired: 1 }
      ],
      subParameters: [
        { id: 'serum_urea', name: 'Serum Urea (BUN)', unit: 'mg/dL', refRangeMale: '15 - 45', refRangeFemale: '15 - 40', refRangeChild: '10 - 36', maleMin: 15, maleMax: 45, femaleMin: 15, femaleMax: 40, childMin: 10, childMax: 36 },
        { id: 'serum_creatinine', name: 'Serum Creatinine', unit: 'mg/dL', refRangeMale: '0.7 - 1.3', refRangeFemale: '0.6 - 1.1', refRangeChild: '0.3 - 0.7', maleMin: 0.7, maleMax: 1.3, femaleMin: 0.6, femaleMax: 1.1, childMin: 0.3, childMax: 0.7 },
        { id: 'uric_acid', name: 'Uric Acid', unit: 'mg/dL', refRangeMale: '3.5 - 7.2', refRangeFemale: '2.6 - 6.0', refRangeChild: '2.0 - 5.5', maleMin: 3.5, maleMax: 7.2, femaleMin: 2.6, femaleMax: 6.0, childMin: 2.0, childMax: 5.5 }
      ]
    },
    {
      id: 'bio-06',
      code: 'ELEC-01',
      name: 'Serum Electrolytes (Na+, K+, Cl-, HCO3-)',
      category: 'Biochemistry',
      sampleType: 'Serum or Heparinized Plasma',
      units: 'mEq/L',
      refRangeMale: 'See sub-parameters',
      refRangeFemale: 'See sub-parameters',
      refRangeChild: 'See sub-parameters',
      conditions: 'Avoid hemolysis; prompt serum separation from clot required.',
      basePrice: 14000,
      turnaroundTime: '2 hours',
      description: 'Quantitative measurement of major intravascular cations and anions controlling fluid and acid-base equilibrium.',
      reagentsRequired: [
        { reagentId: 'reag-ise-calib', reagentName: 'ISE Electrolyte Standard Calibrator Fluid', quantityRequired: 1 }
      ],
      subParameters: [
        { id: 'sodium', name: 'Sodium (Na+)', unit: 'mEq/L', refRangeMale: '135 - 145', refRangeFemale: '135 - 145', refRangeChild: '138 - 145', maleMin: 135, maleMax: 145, femaleMin: 135, femaleMax: 145, childMin: 138, childMax: 145 },
        { id: 'potassium', name: 'Potassium (K+)', unit: 'mEq/L', refRangeMale: '3.5 - 5.1', refRangeFemale: '3.5 - 5.1', refRangeChild: '3.6 - 5.4', maleMin: 3.5, maleMax: 5.1, femaleMin: 3.5, femaleMax: 5.1, childMin: 3.6, childMax: 5.4 },
        { id: 'chloride', name: 'Chloride (Cl-)', unit: 'mEq/L', refRangeMale: '98 - 107', refRangeFemale: '98 - 107', refRangeChild: '98 - 108', maleMin: 98, maleMax: 107, femaleMin: 98, femaleMax: 107, childMin: 98, childMax: 108 },
        { id: 'bicarbonate', name: 'Bicarbonate (HCO3-)', unit: 'mEq/L', refRangeMale: '22 - 29', refRangeFemale: '22 - 29', refRangeChild: '20 - 28', maleMin: 22, maleMax: 29, femaleMin: 22, femaleMax: 29, childMin: 20, childMax: 28 }
      ]
    },
    {
      id: 'bio-07',
      code: 'CALC-PHOS',
      name: 'Calcium & Inorganic Phosphorus',
      category: 'Biochemistry',
      sampleType: 'Serum (Yellow SST Tube)',
      units: 'mg/dL',
      refRangeMale: 'Ca: 8.5 - 10.5 | Phos: 2.5 - 4.5',
      refRangeFemale: 'Ca: 8.5 - 10.5 | Phos: 2.5 - 4.5',
      refRangeChild: 'Ca: 9.0 - 11.0 | Phos: 4.0 - 7.0',
      conditions: 'Morning fasting blood sample preferred.',
      basePrice: 9000,
      turnaroundTime: '2 hours',
      description: 'Biomarkers for bone mineral homeostasis, parathyroid gland status, and chronic kidney disease bone disorders.',
      reagentsRequired: [
        { reagentId: 'reag-arsenazo', reagentName: 'Arsenazo III Calcium Reagent', quantityRequired: 1 }
      ]
    },
    {
      id: 'bio-08',
      code: 'AMYLASE-LIP',
      name: 'Serum Amylase & Lipase (Pancreatic Enzymes)',
      category: 'Biochemistry',
      sampleType: 'Serum (Yellow SST Tube)',
      units: 'U/L',
      refRangeMale: 'Amylase: 30 - 110 | Lipase: 10 - 140',
      refRangeFemale: 'Amylase: 30 - 110 | Lipase: 10 - 140',
      refRangeChild: 'Amylase: 20 - 90 | Lipase: 10 - 100',
      conditions: 'Avoid alcoholic beverages and morphine/opioids prior to test.',
      basePrice: 16000,
      turnaroundTime: '2 hours',
      description: 'Diagnostic biomarkers for acute pancreatitis, salivary gland disease, and pancreatic duct obstruction.',
      reagentsRequired: [
        { reagentId: 'reag-substrate-amylase', reagentName: 'CNPG3 Substrate Enzymatic Reagent', quantityRequired: 1 }
      ]
    },
  
    // ========================================================
    // 3. MICROBIOLOGY
    // ========================================================
    {
      id: 'mb-01',
      code: 'STOOL-CULT',
      name: 'Stool Culture & Sensitivity (Coproculture)',
      category: 'Microbiology',
      sampleType: 'Fresh Stool (Feces)',
      units: 'Qualitative',
      refRangeMale: 'No pathogenic bacterial growth after 72h',
      refRangeFemale: 'No pathogenic bacterial growth after 72h',
      refRangeChild: 'No pathogenic bacterial growth after 72h',
      conditions: 'Collect fresh stool in sterile container. No antibiotic therapy for 7-10 days prior to sample collection.',
      basePrice: 15000,
      turnaroundTime: '3 days',
      description: 'Isolation and identification of enteric pathogens (Salmonella, Shigella, Campylobacter, E. coli) with antimicrobial susceptibility disk diffusion.',
      reagentsRequired: [
        { reagentId: 'reag-mcconkey', reagentName: 'MacConkey Agar Plate', quantityRequired: 1 },
        { reagentId: 'reag-ss-agar', reagentName: 'Salmonella-Shigella (SS) Agar Plate', quantityRequired: 1 }
      ]
    },
    {
      id: 'mb-02',
      code: 'AFB-ZN',
      name: 'AFB Microscopic Examination (Ziehl-Neelsen / TB)',
      category: 'Microbiology',
      sampleType: 'Deep Sputum / Early Morning Urine',
      units: 'Smear Grade',
      refRangeMale: 'Negative for Acid-Fast Bacilli',
      refRangeFemale: 'Negative for Acid-Fast Bacilli',
      refRangeChild: 'Negative for Acid-Fast Bacilli',
      conditions: 'Early morning deep cough sputum before eating or brushing teeth. Sterile cup.',
      basePrice: 5000,
      turnaroundTime: '3 hours',
      description: 'Microscopic screening for Mycobacterium tuberculosis using Ziehl-Neelsen carbol fuchsin staining under 1000x oil immersion.',
      reagentsRequired: [
        { reagentId: 'reag-carbol-fuchsin', reagentName: 'Carbol Fuchsin Acid-Fast Staining Kit', quantityRequired: 1 }
      ]
    },
    {
      id: 'mb-04',
      code: 'ECBU-01',
      name: 'Urine Culture & Sensitivity (ECBU / Urinoculture)',
      category: 'Microbiology',
      sampleType: 'Midstream Clean-Catch Urine',
      units: 'CFU/mL & Antibiogram',
      refRangeMale: '< 10,000 CFU/mL (Sterile / Commensal Flora)',
      refRangeFemale: '< 10,000 CFU/mL (Sterile / Commensal Flora)',
      refRangeChild: '< 10,000 CFU/mL (Sterile / Commensal Flora)',
      conditions: 'Strict midstream urine after vulvar/penile washing. Minimum 3 hours urinary retention in bladder.',
      basePrice: 12000,
      turnaroundTime: '3 days',
      description: 'Quantitative bacteriological evaluation of UTI, bacterial colony counting, species identification, and antibiotic sensitivity profiling.',
      reagentsRequired: [
        { reagentId: 'reag-cled-agar', reagentName: 'CLED Agar Culture Plate', quantityRequired: 1 },
        { reagentId: 'reag-abx-disks', reagentName: 'Antibiogram Disk Diffusion Dispenser Set', quantityRequired: 1 }
      ]
    },
    {
      id: 'mb-05',
      code: 'STOOL-MICRO',
      name: 'Stool Examination (Direct Wet Mount & Concentration)',
      category: 'Microbiology',
      sampleType: 'Fresh Stool',
      units: 'Qualitative',
      refRangeMale: 'No ova, cysts, trophozoites, or intestinal parasites seen',
      refRangeFemale: 'No ova, cysts, trophozoites, or intestinal parasites seen',
      refRangeChild: 'No ova, cysts, trophozoites, or intestinal parasites seen',
      conditions: 'Pass fresh stool into clean disinfectant-free cup. Deliver to lab within 1 hour.',
      basePrice: 3500,
      turnaroundTime: '2 hours',
      description: 'Direct saline & Lugol iodine microscopic search for helminth eggs, Entamoeba histolytica/coli cysts, and Giardia trophozoites.',
      reagentsRequired: [
        { reagentId: 'reag-lugol-iodine', reagentName: 'Lugol Iodine Solution 2%', quantityRequired: 1 }
      ]
    },
  
    // ========================================================
    // 4. SEROLOGY & IMMUNOLOGY
    // ========================================================
    {
      id: 'sero-01',
      code: 'HIV-SCREEN',
      name: 'HIV 1 & 2 Rapid Antibodies / Antigen Test',
      category: 'Serology / Immunology',
      sampleType: 'Serum / Whole Blood',
      units: 'Qualitative',
      refRangeMale: 'Non-Reactive (Negative)',
      refRangeFemale: 'Non-Reactive (Negative)',
      refRangeChild: 'Non-Reactive (Negative)',
      conditions: 'Voluntary confidential counseling. No special physical preparation required.',
      basePrice: 3000,
      turnaroundTime: '30 mins',
      description: 'Immunoenzymatic cassette screening for HIV-1/2 antibodies and p24 antigen.',
      reagentsRequired: [
        { reagentId: 'reag-hiv-cassette', reagentName: 'HIV 1/2 Ag/Ab Combo Test Strip', quantityRequired: 1 }
      ]
    },
    {
      id: 'sero-02',
      code: 'HEPB-AG',
      name: 'Hepatitis B Surface Antigen (HBsAg)',
      category: 'Serology / Immunology',
      sampleType: 'Serum / Plasma',
      units: 'Qualitative / Index',
      refRangeMale: 'Non-Reactive (Negative)',
      refRangeFemale: 'Non-Reactive (Negative)',
      refRangeChild: 'Non-Reactive (Negative)',
      conditions: 'No special preparation needed.',
      basePrice: 4000,
      turnaroundTime: '45 mins',
      description: 'Biomarker for active or chronic Hepatitis B viral infection.',
      reagentsRequired: [
        { reagentId: 'reag-hbsag-cassette', reagentName: 'HBsAg Rapid Test Cassette', quantityRequired: 1 }
      ]
    },
    {
      id: 'sero-03',
      code: 'HEPC-AB',
      name: 'Hepatitis C Antibodies (Anti-HCV)',
      category: 'Serology / Immunology',
      sampleType: 'Serum / Plasma',
      units: 'Qualitative',
      refRangeMale: 'Non-Reactive (Negative)',
      refRangeFemale: 'Non-Reactive (Negative)',
      refRangeChild: 'Non-Reactive (Negative)',
      conditions: 'No special preparation needed.',
      basePrice: 5000,
      turnaroundTime: '45 mins',
      description: 'Screening for exposure and immune response against Hepatitis C virus.',
      reagentsRequired: [
        { reagentId: 'reag-hcv-cassette', reagentName: 'Anti-HCV Immunochromatographic Cassette', quantityRequired: 1 }
      ]
    },
    {
      id: 'sero-04',
      code: 'SYPH-VDRL',
      name: 'Syphilis Serology (VDRL / TPHA / RPR)',
      category: 'Serology / Immunology',
      sampleType: 'Serum',
      units: 'Titer / Qualitative',
      refRangeMale: 'Non-Reactive',
      refRangeFemale: 'Non-Reactive',
      refRangeChild: 'Non-Reactive',
      conditions: 'No special preparation needed.',
      basePrice: 4000,
      turnaroundTime: '1 hour',
      description: 'Nontreponemal RPR/VDRL card test with TPHA confirmation for Treponema pallidum infection.',
      reagentsRequired: [
        { reagentId: 'reag-rpr-antigen', reagentName: 'RPR Carbon Antigen Suspension', quantityRequired: 1 }
      ]
    },
    {
      id: 'sero-05',
      code: 'WIDAL-01',
      name: 'Widal & Felix Test (Typhoid Agglutination)',
      category: 'Serology / Immunology',
      sampleType: 'Serum (Clot Activator)',
      units: 'Titer Ratio',
      refRangeMale: 'TO & TH < 1:80 (Negative)',
      refRangeFemale: 'TO & TH < 1:80 (Negative)',
      refRangeChild: 'TO & TH < 1:80 (Negative)',
      conditions: 'Record previous typhoid vaccination status.',
      basePrice: 4500,
      turnaroundTime: '1 hour',
      description: 'Slide/tube agglutination search for anti-Salmonella enterica serovar Typhi O and H antibodies.',
      reagentsRequired: [
        { reagentId: 'reag-widal-kit', reagentName: 'Salmonella O, H, AO, BO Febrile Antigens', quantityRequired: 1 }
      ]
    },
    {
      id: 'sero-06',
      code: 'CRP-01',
      name: 'C-Reactive Protein (CRP Quantitative)',
      category: 'Serology / Immunology',
      sampleType: 'Serum (Yellow SST Tube)',
      units: 'mg/L',
      refRangeMale: '< 6.0',
      refRangeFemale: '< 6.0',
      refRangeChild: '< 5.0',
      maleMin: 0, maleMax: 6.0, femaleMin: 0, femaleMax: 6.0, childMin: 0, childMax: 5.0,
      conditions: 'No special preparation needed.',
      basePrice: 7500,
      turnaroundTime: '1 hour',
      description: 'Acute phase reactant protein produced by the liver in response to tissue injury, acute bacterial infection, and cardiovascular inflammation.',
      reagentsRequired: [
        { reagentId: 'reag-crp-latex', reagentName: 'CRP Immunoturbidimetric Latex Kit', quantityRequired: 1 }
      ]
    },
    {
      id: 'sero-07',
      code: 'ASO-01',
      name: 'Antistreptolysin O (ASO Titer)',
      category: 'Serology / Immunology',
      sampleType: 'Serum',
      units: 'IU/mL',
      refRangeMale: '< 200',
      refRangeFemale: '< 200',
      refRangeChild: '< 150',
      conditions: 'No special preparation needed.',
      basePrice: 6500,
      turnaroundTime: '1 hour',
      description: 'Quantification of antibodies against streptolysin O produced by Group A beta-hemolytic Streptococci (rheumatic fever / post-streptococcal glomerulonephritis).',
      reagentsRequired: [
        { reagentId: 'reag-aso-latex', reagentName: 'ASO Latex Reagent Set', quantityRequired: 1 }
      ]
    },
  
    // ========================================================
    // 5. HORMONES & TUMOR MARKERS
    // ========================================================
    {
      id: 'horm-01',
      code: 'THYROID-01',
      name: 'Thyroid Function Panel (FT3, FT4, TSH)',
      category: 'Hormones & Tumor Markers',
      sampleType: 'Serum (Yellow SST Tube)',
      units: 'Various',
      refRangeMale: 'TSH: 0.35 - 4.94 uIU/mL | FT4: 0.70 - 1.48 ng/dL | FT3: 1.71 - 3.71 pg/mL',
      refRangeFemale: 'TSH: 0.35 - 4.94 uIU/mL | FT4: 0.70 - 1.48 ng/dL | FT3: 1.71 - 3.71 pg/mL',
      refRangeChild: 'TSH: 0.70 - 5.90 uIU/mL | FT4: 0.80 - 1.60 ng/dL | FT3: 2.00 - 4.20 pg/mL',
      conditions: 'Morning blood collection. Record thyroid medication dose (Levothyroxine) if taking.',
      basePrice: 28000,
      turnaroundTime: '6 hours',
      description: 'Comprehensive chemiluminescent immunoassay evaluating thyroid endocrine regulation.',
      reagentsRequired: [
        { reagentId: 'reag-tsh-clia', reagentName: 'TSH Chemiluminescence Cartridge', quantityRequired: 1 },
        { reagentId: 'reag-ft4-clia', reagentName: 'FT4 CLIA Reagent Pack', quantityRequired: 1 }
      ],
      subParameters: [
        { id: 'tsh', name: 'Thyroid Stimulating Hormone (TSH)', unit: 'uIU/mL', refRangeMale: '0.35 - 4.94', refRangeFemale: '0.35 - 4.94', refRangeChild: '0.70 - 5.90', maleMin: 0.35, maleMax: 4.94, femaleMin: 0.35, femaleMax: 4.94, childMin: 0.70, childMax: 5.90 },
        { id: 'ft4', name: 'Free Thyroxine (FT4)', unit: 'ng/dL', refRangeMale: '0.70 - 1.48', refRangeFemale: '0.70 - 1.48', refRangeChild: '0.80 - 1.60', maleMin: 0.70, maleMax: 1.48, femaleMin: 0.70, femaleMax: 1.48, childMin: 0.80, childMax: 1.60 },
        { id: 'ft3', name: 'Free Triiodothyronine (FT3)', unit: 'pg/mL', refRangeMale: '1.71 - 3.71', refRangeFemale: '1.71 - 3.71', refRangeChild: '2.00 - 4.20', maleMin: 1.71, maleMax: 3.71, femaleMin: 1.71, femaleMax: 3.71, childMin: 2.00, childMax: 4.20 }
      ]
    },
    {
      id: 'horm-02',
      code: 'PSA-TOTAL',
      name: 'Prostate Specific Antigen (PSA Total)',
      category: 'Hormones & Tumor Markers',
      sampleType: 'Serum (Yellow SST Tube)',
      units: 'ng/mL',
      refRangeMale: '< 4.0 (Age 40-49: <2.5, 50-59: <3.5, 60-69: <4.5)',
      refRangeFemale: 'N/A (Male test only)',
      refRangeChild: 'N/A',
      maleMin: 0, maleMax: 4.0,
      conditions: 'No ejaculation or prostate massage/biopsy within 48 hours prior to blood draw.',
      basePrice: 15000,
      turnaroundTime: '4 hours',
      description: 'Prostate-derived glycoprotein biomarker for prostatic hypertrophy and prostate cancer screening.',
      reagentsRequired: [
        { reagentId: 'reag-psa-elisa', reagentName: 'Total PSA Enzyme Immunoassay Kit', quantityRequired: 1 }
      ]
    },
    {
      id: 'horm-03',
      code: 'BETA-HCG',
      name: 'Beta-hCG (Quantitative Serum Pregnancy Test)',
      category: 'Hormones & Tumor Markers',
      sampleType: 'Serum (Yellow SST Tube)',
      units: 'mIU/mL',
      refRangeMale: '< 2.0',
      refRangeFemale: 'Non-pregnant: < 5.0 | Gestational ranges per week',
      refRangeChild: '< 2.0',
      conditions: 'Record first day of last menstrual period (LMP).',
      basePrice: 9000,
      turnaroundTime: '2 hours',
      description: 'Quantitative human chorionic gonadotropin measurement for early pregnancy confirmation, gestational dating, and trophoblastic tumor screening.',
      reagentsRequired: [
        { reagentId: 'reag-hcg-clia', reagentName: 'Quantitative Beta-hCG CLIA Kit', quantityRequired: 1 }
      ]
    },
  
    // ========================================================
    // 6. URINALYSIS & PARASITOLOGY
    // ========================================================
    {
      id: 'uri-01',
      code: 'URINE-ROUTINE',
      name: 'Urinalysis (Routine Physical, Chemical & Microscopic)',
      category: 'Urinalysis & Parasitology',
      sampleType: 'Midstream Urine',
      units: 'Qualitative & Count/HPF',
      refRangeMale: 'See sub-parameters',
      refRangeFemale: 'See sub-parameters',
      refRangeChild: 'See sub-parameters',
      conditions: 'First morning midstream clean-catch urine sample preferred. Test within 1 hour.',
      basePrice: 3000,
      turnaroundTime: '1 hour',
      description: 'Complete 10-parameter dipstick chemical analysis + centrifuged sediment microscopy (Pus cells, RBCs, Epithelial cells, Crystals, Casts).',
      reagentsRequired: [
        { reagentId: 'reag-urine-strips', reagentName: '10-Parameter Urine Dipstick Strips', quantityRequired: 1 }
      ],
      subParameters: [
        { id: 'color', name: 'Color', unit: '', refRangeMale: 'Pale Yellow to Amber', refRangeFemale: 'Pale Yellow to Amber', refRangeChild: 'Pale Yellow to Amber' },
        { id: 'appearance', name: 'Appearance / Clarity', unit: '', refRangeMale: 'Clear', refRangeFemale: 'Clear', refRangeChild: 'Clear' },
        { id: 'ph', name: 'pH', unit: 'pH units', refRangeMale: '5.0 - 8.0', refRangeFemale: '5.0 - 8.0', refRangeChild: '5.0 - 8.0' },
        { id: 'sp_gravity', name: 'Specific Gravity', unit: 'g/mL', refRangeMale: '1.005 - 1.030', refRangeFemale: '1.005 - 1.030', refRangeChild: '1.005 - 1.025' },
        { id: 'protein', name: 'Protein (Albumin)', unit: 'mg/dL', refRangeMale: 'Negative', refRangeFemale: 'Negative', refRangeChild: 'Negative' },
        { id: 'glucose', name: 'Glucose', unit: 'mg/dL', refRangeMale: 'Negative', refRangeFemale: 'Negative', refRangeChild: 'Negative' },
        { id: 'ketones', name: 'Ketones', unit: '', refRangeMale: 'Negative', refRangeFemale: 'Negative', refRangeChild: 'Negative' },
        { id: 'leukocytes', name: 'Leukocyte Esterase', unit: '', refRangeMale: 'Negative', refRangeFemale: 'Negative', refRangeChild: 'Negative' },
        { id: 'nitrite', name: 'Nitrite', unit: '', refRangeMale: 'Negative', refRangeFemale: 'Negative', refRangeChild: 'Negative' },
        { id: 'pus_cells', name: 'Pus Cells (WBCs)', unit: '/HPF', refRangeMale: '0 - 5', refRangeFemale: '0 - 5', refRangeChild: '0 - 3', maleMin: 0, maleMax: 5, femaleMin: 0, femaleMax: 5, childMin: 0, childMax: 3 },
        { id: 'red_cells', name: 'Red Blood Cells (RBCs)', unit: '/HPF', refRangeMale: '0 - 2', refRangeFemale: '0 - 2', refRangeChild: '0 - 1', maleMin: 0, maleMax: 2, femaleMin: 0, femaleMax: 2, childMin: 0, childMax: 1 }
      ]
    },
    {
      id: 'para-01',
      code: 'MALARIA-GE',
      name: 'Malaria Thick & Thin Blood Smear (Goutte Épaisse / GE)',
      category: 'Urinalysis & Parasitology',
      sampleType: 'Whole Blood (EDTA or Capillary)',
      units: 'Trophozoites/uL',
      refRangeMale: 'No Plasmodium parasites seen (Negative)',
      refRangeFemale: 'No Plasmodium parasites seen (Negative)',
      refRangeChild: 'No Plasmodium parasites seen (Negative)',
      conditions: 'Collect blood during fever spike if possible. Giemsa stain.',
      basePrice: 3000,
      turnaroundTime: '1 hour',
      description: 'Gold-standard microscopic identification of Plasmodium species (falciparum, vivax, malariae) and parasite density quantification per microliter.',
      reagentsRequired: [
        { reagentId: 'reag-giemsa', reagentName: 'Giemsa Stain Solution 10%', quantityRequired: 1 }
      ]
    }
  ];
  