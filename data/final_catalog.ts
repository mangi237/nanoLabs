// src/data/final_catalog.ts

// ============================================================
// 1. INTERFACES
// ============================================================

export interface DescriptiveExamField {
    id: string;
    sectionHeader?: string;
    subHeader?: string;
    label: string;
    suggestedNormalWording?: string;
    observation: string;
  }
  
  export interface DescriptiveExamTemplate {
    testId: string;
    testName: string;
    category: string;
    sampleType: string;
    fields: DescriptiveExamField[];
  }
  
  export interface TestSubParameter {
    id: string;
    name: string;
    unit: string;
    sectionHeader?: string;
    subHeader?: string;
    refRangeMale: string;
    refRangeFemale: string;
    refRangeChild: string;
    refRangeWords?: string;
    maleMin?: number;
    maleMax?: number;
    femaleMin?: number;
    femaleMax?: number;
    childMin?: number;
    childMax?: number;
    defaultValue?: string;
    value?: string;
    resultInWords?: string;
    patientValue?: string;
    isAbnormal?: boolean;
    printOnReport?: boolean;
    parameterType?: 'numeric' | 'text' | 'formula' | 'heading' | 'select';
    formulaIdentifier?: string;
    computationFormula?: string;
    options?: string[];
    method?: string;
    notes?: string;
    comments?: string;
    flag?: 'Normal' | 'Low' | 'High' | 'Borderline';
    interpretation?: string;
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
    refRangeWords?: string;
    maleMin?: number;
    maleMax?: number;
    femaleMin?: number;
    femaleMax?: number;
    childMin?: number;
    childMax?: number;
    reagentsRequired?: Array<{ reagentId: string; reagentName: string; quantityRequired: number; }>;
    conditions?: string;
    basePrice: number;
    cote?: string;
    samplingActCode?: string;
    samplingFee?: number;
    turnaroundTime: string;
    description: string;
    method?: string;
    tubeColor?: string;
    requiredReagents?: any[];
    subParameters?: TestSubParameter[];
    descriptiveTemplate?: DescriptiveExamTemplate;
    resultType?: 'quantitative' | 'qualitative' | 'descriptive' | 'mixed';
    hierarchicalParams?: Array<{ name: string; unit?: string; refRange?: string; section?: string; defaultValue?: string; }>;
    antibiogram?: Array<{ antibiotic: string; discPotency?: string; zoneMm?: string; sensitivity: 'S' | 'I' | 'R'; }>;
  }
  
  // ============================================================
  // 2. DESCRIPTIVE EXAM TEMPLATES
  // ============================================================
  
  export const CERVICO_VAGINAL_TEMPLATE: DescriptiveExamTemplate = {
    testId: 'micro-cvc',
    testName: 'Prélèvement Cervico-Vaginal (High Vaginal / Cervical Swab)',
    category: 'Microbiology',
    sampleType: 'Cervical / Endocervical Swab',
    fields: [
      { id: 'col-macro', sectionHeader: 'PRELEVEMENT AU NIVEAU DU COL UTERIN', label: 'Macroscopie', suggestedNormalWording: 'Col sans signes inflammatoires, entrouvert et laissant sourdre une glaire peu abondante', observation: '' },
      { id: 'col-gram-cell', subHeader: 'Coloration de Gram', label: 'Cellules épithéliales', suggestedNormalWording: 'Nombreuses', observation: '' },
      { id: 'col-gram-poly', subHeader: 'Coloration de Gram', label: 'Polynucléaires', suggestedNormalWording: 'Quelques polynucléaires plus ou moins altérés', observation: '' },
      { id: 'col-gram-neisseria', subHeader: 'Coloration de Gram', label: 'Diplocoques Gram négatif type Neisseriae', suggestedNormalWording: 'Non observés', observation: '' },
      { id: 'col-gram-cocci', subHeader: 'Coloration de Gram', label: 'Autres Cocci', suggestedNormalWording: 'Absence de cocci Gram positif', observation: '' },
      { id: 'col-gram-bacilles', subHeader: 'Coloration de Gram', label: 'Bacilles', suggestedNormalWording: 'Absence de bacille Gram négatif', observation: '' },
      { id: 'col-culture-gono', subHeader: 'Culture bactériologique', label: 'Gonoculture', suggestedNormalWording: 'Stérile après 48 heures d\'incubation', observation: '' },
      { id: 'col-culture-myco', subHeader: 'Culture bactériologique', label: 'Recherche directe de Mycoplasme', suggestedNormalWording: 'Négative', observation: '' },
      { id: 'cds-macro', sectionHeader: 'PRELEVEMENT AU NIVEAU DU CUL DE SAC', label: 'Macroscopie', suggestedNormalWording: 'Leucorrhées blanchâtres et peu abondantes', observation: '' },
      { id: 'cds-trichomonas', sectionHeader: 'PRELEVEMENT AU NIVEAU DU CUL DE SAC', label: 'Recherche de Trichomonas vaginalis', suggestedNormalWording: 'Négative', observation: '' },
      { id: 'cds-ph', sectionHeader: 'PRELEVEMENT AU NIVEAU DU CUL DE SAC', label: 'pH', suggestedNormalWording: '', observation: '' },
      { id: 'cds-gram-cell', subHeader: 'Coloration de Gram', label: 'Cellules épithéliales', suggestedNormalWording: 'Rares', observation: '' },
      { id: 'cds-gram-doderlin', subHeader: 'Coloration de Gram', label: 'Flore de Döderlin', suggestedNormalWording: 'Flore normale', observation: '' },
      { id: 'cds-gram-poly', subHeader: 'Coloration de Gram', label: 'Polynucléaires', suggestedNormalWording: 'Absence de polynucléaires plus ou moins altérés', observation: '' },
      { id: 'cds-gram-cocci', subHeader: 'Coloration de Gram', label: 'Cocci', suggestedNormalWording: 'Absence de cocci Gram positif', observation: '' },
      { id: 'cds-gram-bacilles', subHeader: 'Coloration de Gram', label: 'Bacilles', suggestedNormalWording: 'Absence de bacilles Gram négative', observation: '' },
      { id: 'cds-culture-cocci', subHeader: 'Culture bactériologique', label: 'Culture et identification des Cocci', suggestedNormalWording: 'Stérile après 48 heures d\'incubation', observation: '' },
      { id: 'cds-culture-bacilles', subHeader: 'Culture bactériologique', label: 'Culture et identification des bacilles', suggestedNormalWording: 'Stérile après 48 heures d\'incubation', observation: '' },
      { id: 'parois-cyto', sectionHeader: 'PRELEVEMENT AU NIVEAU DES PAROIS VAGINALES', label: 'Cytologie', suggestedNormalWording: 'Rares cellules épithéliales, absence de leucocytes, absence cocci, absence de bacilles et absence de levures', observation: '' },
      { id: 'parois-gram', sectionHeader: 'PRELEVEMENT AU NIVEAU DES PAROIS VAGINALES', label: 'Coloration de Gram montre', suggestedNormalWording: 'Rares cellules épithéliales, absence de polynucléaires plus ou moins altérés, absence cocci Gram positif, absence de bacilles Gram négative et absence de cellules lévuriformes', observation: '' },
      { id: 'parois-sabouraud', sectionHeader: 'PRELEVEMENT AU NIVEAU DES PAROIS VAGINALES', label: 'Culture sur Sabouraud Chloramphénicol', suggestedNormalWording: 'Stérile après 48 heures d\'incubation', observation: '' },
      { id: 'parois-isoles', sectionHeader: 'PRELEVEMENT AU NIVEAU DES PAROIS VAGINALES', label: 'ONT ETE ISOLES ET IDENTIFIES', suggestedNormalWording: 'Néant', observation: '' },
    ]
  };
  
  export const ECBU_TEMPLATE: DescriptiveExamTemplate = {
    testId: 'micro-ecbu',
    testName: 'Examen Cytobactériologique des Urines (ECBU)',
    category: 'Microbiology',
    sampleType: 'Midstream Urine (Stérile)',
    fields: [
      { id: 'ecbu-macro', sectionHeader: 'EXAMEN MACROSCOPIQUE', label: 'Aspect', suggestedNormalWording: 'Limpide, jaune pâle', observation: '' },
      { id: 'ecbu-odeur', sectionHeader: 'EXAMEN MACROSCOPIQUE', label: 'Odeur', suggestedNormalWording: 'Inodore', observation: '' },
      { id: 'ecbu-ph', sectionHeader: 'EXAMEN MACROSCOPIQUE', label: 'pH', suggestedNormalWording: '5.0 - 7.0', observation: '' },
      { id: 'ecbu-leucyturie', sectionHeader: 'EXAMEN MICROSCOPIQUE (Cytologie Quantitative)', label: 'Leucocyturie', suggestedNormalWording: 'Non significative (< 10 000/mL)', observation: '' },
      { id: 'ecbu-hematurie', sectionHeader: 'EXAMEN MICROSCOPIQUE (Cytologie Quantitative)', label: 'Hématurie', suggestedNormalWording: 'Non significative (< 5 000/mL)', observation: '' },
      { id: 'ecbu-cell-ephit', sectionHeader: 'EXAMEN MICROSCOPIQUE (Cytologie Quantitative)', label: 'Cellules épithéliales', suggestedNormalWording: 'Peu nombreuses', observation: '' },
      { id: 'ecbu-cylindres', sectionHeader: 'EXAMEN MICROSCOPIQUE (Cytologie Quantitative)', label: 'Cylindres', suggestedNormalWording: 'Absents', observation: '' },
      { id: 'ecbu-cristaux', sectionHeader: 'EXAMEN MICROSCOPIQUE (Cytologie Quantitative)', label: 'Cristaux', suggestedNormalWording: 'Absents', observation: '' },
      { id: 'ecbu-gram', subHeader: 'Coloration de Gram', label: 'Bactéries observées', suggestedNormalWording: 'Absence de bactérie', observation: '' },
      { id: 'ecbu-gram-levures', subHeader: 'Coloration de Gram', label: 'Levures', suggestedNormalWording: 'Absence de levure', observation: '' },
      { id: 'ecbu-culture', sectionHeader: 'CULTURE ET IDENTIFICATION', label: 'Résultat de culture', suggestedNormalWording: 'Stérile après 48 heures d\'incubation', observation: '' },
      { id: 'ecbu-germe', sectionHeader: 'CULTURE ET IDENTIFICATION', label: 'Germe isolé', suggestedNormalWording: 'Néant', observation: '' },
      { id: 'ecbu-count', sectionHeader: 'CULTURE ET IDENTIFICATION', label: 'Numération (CFU/mL)', suggestedNormalWording: '< 10^3 CFU/mL (Significatif si ≥ 10^5)', observation: '' },
      { id: 'ecbu-abx', sectionHeader: 'ANTIBIOGRAMME', label: 'Antibiogramme', suggestedNormalWording: 'Non réalisé (culture négative)', observation: '' },
      { id: 'ecbu-interpretation', sectionHeader: 'INTERPRÉTATION BIOLOGIQUE', label: 'Conclusion', suggestedNormalWording: 'Urine normale - Absence d\'infection urinaire', observation: '' },
    ]
  };
  
  export const STOOL_PARASITOLOGY_TEMPLATE: DescriptiveExamTemplate = {
    testId: 'micro-kop',
    testName: 'Examen Parasitologique des Selles (KOP / O&P)',
    category: 'Microbiology',
    sampleType: 'Fresh Stool (Selles fraîches)',
    fields: [
      { id: 'cop-macro', sectionHeader: 'EXAMEN MACROSCOPIQUE', label: 'Consistance', suggestedNormalWording: 'Moulée (normale)', observation: '' },
      { id: 'cop-couleur', sectionHeader: 'EXAMEN MACROSCOPIQUE', label: 'Couleur', suggestedNormalWording: 'Brunâtre', observation: '' },
      { id: 'cop-mucus', sectionHeader: 'EXAMEN MACROSCOPIQUE', label: 'Mucus', suggestedNormalWording: 'Absent', observation: '' },
      { id: 'cop-sang', sectionHeader: 'EXAMEN MACROSCOPIQUE', label: 'Sang', suggestedNormalWording: 'Absent', observation: '' },
      { id: 'cop-micro', sectionHeader: 'EXAMEN MICROSCOPIQUE (Examen direct)', label: 'Cellules épithéliales', suggestedNormalWording: 'Rares', observation: '' },
      { id: 'cop-pus', sectionHeader: 'EXAMEN MICROSCOPIQUE (Examen direct)', label: 'Leucocytes / Pus', suggestedNormalWording: 'Rares', observation: '' },
      { id: 'cop-hematies', sectionHeader: 'EXAMEN MICROSCOPIQUE (Examen direct)', label: 'Hématies', suggestedNormalWording: 'Absentes', observation: '' },
      { id: 'cop-cristaux', sectionHeader: 'EXAMEN MICROSCOPIQUE (Examen direct)', label: 'Cristaux (Charcot-Leyden)', suggestedNormalWording: 'Absents', observation: '' },
      { id: 'cop-eggs', subHeader: 'Recherche d\'Œufs et Parasites', label: 'Œufs d\'helminthes', suggestedNormalWording: 'Néant', observation: '' },
      { id: 'cop-kystes', subHeader: 'Recherche d\'Œufs et Parasites', label: 'Kystes de protozoaires', suggestedNormalWording: 'Néant', observation: '' },
      { id: 'cop-trophozoites', subHeader: 'Recherche d\'Œufs et Parasites', label: 'Trophozoïtes', suggestedNormalWording: 'Néant', observation: '' },
      { id: 'cop-larves', subHeader: 'Recherche d\'Œufs et Parasites', label: 'Larves (Strongyloides)', suggestedNormalWording: 'Néant', observation: '' },
      { id: 'cop-levures', subHeader: 'Recherche d\'Œufs et Parasites', label: 'Levures (Candida)', suggestedNormalWording: 'Absentes', observation: '' },
      { id: 'cop-ethistolytica', subHeader: 'Recherche spécifique', label: 'Entamoeba histolytica / dispar', suggestedNormalWording: 'Non mise en évidence', observation: '' },
      { id: 'cop-giardia', subHeader: 'Recherche spécifique', label: 'Giardia intestinalis', suggestedNormalWording: 'Non mis en évidence', observation: '' },
      { id: 'cop-oxyures', subHeader: 'Recherche spécifique', label: 'Enterobius vermicularis (Oxyures)', suggestedNormalWording: 'Non mis en évidence', observation: '' },
      { id: 'cop-conclusion', sectionHeader: 'CONCLUSION BIOLOGIQUE', label: 'Interprétation', suggestedNormalWording: 'Examen parasitologique négatif', observation: '' },
    ]
  };
  
  export const BLOOD_SMEAR_TEMPLATE: DescriptiveExamTemplate = {
    testId: 'hem-frottis',
    testName: 'Frottis Sanguin avec Coloration de Giemsa',
    category: 'Hematology',
    sampleType: 'Whole Blood (EDTA)',
    fields: [
      { id: 'fs-macro', sectionHeader: 'EXAMEN MACROSCOPIQUE', label: 'Aspect', suggestedNormalWording: 'Sang non coagulé, pas de caillot', observation: '' },
      { id: 'fs-morpho', sectionHeader: 'EXAMEN MORPHOLOGIQUE', label: 'Hématies', suggestedNormalWording: 'Normochromes, normocytaires', observation: '' },
      { id: 'fs-aniso', subHeader: 'Anomalies érythrocytaires', label: 'Anisocytose', suggestedNormalWording: 'Absente', observation: '' },
      { id: 'fs-poikilo', subHeader: 'Anomalies érythrocytaires', label: 'Poïkilocytose', suggestedNormalWording: 'Absente', observation: '' },
      { id: 'fs-poly', subHeader: 'Anomalies érythrocytaires', label: 'Polychromatophilie', suggestedNormalWording: 'Absente', observation: '' },
      { id: 'fs-schisto', subHeader: 'Anomalies érythrocytaires', label: 'Schizocytes / Hématies fragmentées', suggestedNormalWording: 'Absents', observation: '' },
      { id: 'fs-inclusions', subHeader: 'Anomalies érythrocytaires', label: 'Inclusions (Corps de Jolly, basophilie...)', suggestedNormalWording: 'Absentes', observation: '' },
      { id: 'fs-parasites', subHeader: 'Anomalies érythrocytaires', label: 'Parasites intraérythrocytaires (Plasmodium)', suggestedNormalWording: 'Absents', observation: '' },
      { id: 'fs-leu', subHeader: 'Leucocytes', label: 'Leucocytes (Morphologie)', suggestedNormalWording: 'Morphologie normale', observation: '' },
      { id: 'fs-granules', subHeader: 'Leucocytes', label: 'Granulations toxiques', suggestedNormalWording: 'Absentes', observation: '' },
      { id: 'fs-lympho', subHeader: 'Leucocytes', label: 'Lymphocytes réactionnels', suggestedNormalWording: 'Absents', observation: '' },
      { id: 'fs-plaquettes', sectionHeader: 'EXAMEN PLAQUETTAIRE', label: 'Plaquettes (Estimation)', suggestedNormalWording: 'Présentes, non agglutinées (estimation correcte)', observation: '' },
      { id: 'fs-plq-clumps', subHeader: 'EXAMEN PLAQUETTAIRE', label: 'Agrégats plaquettaires', suggestedNormalWording: 'Absents', observation: '' },
      { id: 'fs-conclusion', sectionHeader: 'CONCLUSION', label: 'Impression Diagnostique', suggestedNormalWording: 'Frottis sanguin normal', observation: '' },
    ]
  };
  
  export const MALARIA_SMEAR_TEMPLATE: DescriptiveExamTemplate = {
    testId: 'para-malaria',
    testName: 'Goutte Épaisse & Frottis Mince (Recherche de Plasmodium)',
    category: 'Urinalysis & Parasitology',
    sampleType: 'Capillary or Venous Blood (EDTA)',
    fields: [
      { id: 'mal-smear', sectionHeader: 'EXAMEN DIRECT', label: 'Présence de Plasmodium', suggestedNormalWording: 'Négatif (Absence de parasite)', observation: '' },
      { id: 'mal-espece', sectionHeader: 'EXAMEN DIRECT', label: 'Espèce', suggestedNormalWording: 'N/A (Non applicable)', observation: '' },
      { id: 'mal-gameto', sectionHeader: 'EXAMEN DIRECT', label: 'Gamétocytes', suggestedNormalWording: 'Absents', observation: '' },
      { id: 'mal-densite', subHeader: 'Densité parasitaire', label: 'Parasites/µL', suggestedNormalWording: '0 (Négatif)', observation: '' },
      { id: 'mal-plus', subHeader: 'Densité parasitaire', label: 'Système de croix (+)', suggestedNormalWording: 'Négatif', observation: '' },
      { id: 'mal-impression', sectionHeader: 'CONCLUSION', label: 'Interprétation', suggestedNormalWording: 'Négatif pour le paludisme - Absence de Plasmodium spp.', observation: '' },
    ]
  };
  
  export const THROAT_SWAB_TEMPLATE: DescriptiveExamTemplate = {
    testId: 'micro-throat',
    testName: 'Prélèvement de Gorge (Culture et Sensibilité)',
    category: 'Microbiology',
    sampleType: 'Throat Swab',
    fields: [
      { id: 'thr-macro', sectionHeader: 'EXAMEN MACROSCOPIQUE', label: 'Aspect de l\'écouvillon', suggestedNormalWording: 'Ecouvillon blanc, sans pus', observation: '' },
      { id: 'thr-gram-cocci', subHeader: 'Coloration de Gram', label: 'Cocci Gram positif (streptocoques)', suggestedNormalWording: 'Absents', observation: '' },
      { id: 'thr-gram-bacilles', subHeader: 'Coloration de Gram', label: 'Bacilles', suggestedNormalWording: 'Absents', observation: '' },
      { id: 'thr-gram-levures', subHeader: 'Coloration de Gram', label: 'Levures', suggestedNormalWording: 'Absentes', observation: '' },
      { id: 'thr-culture', subHeader: 'Culture', label: 'Culture', suggestedNormalWording: 'Stérile après 48 heures', observation: '' },
      { id: 'thr-germe', subHeader: 'Culture', label: 'Germe isolé', suggestedNormalWording: 'Néant', observation: '' },
      { id: 'thr-abx', subHeader: 'Antibiogramme', label: 'Antibiogramme', suggestedNormalWording: 'Non réalisé (culture négative)', observation: '' },
      { id: 'thr-conclusion', sectionHeader: 'CONCLUSION', label: 'Interprétation', suggestedNormalWording: 'Absence de flore pathogène - Prélèvement normal', observation: '' },
    ]
  };
  
  export const SPERMOGRAMME_TEMPLATE: DescriptiveExamTemplate = {
    testId: 'horm-spermogramme',
    testName: 'Spermogramme (Analyse du Sperme)',
    category: 'Hormones & Tumor Markers',
    sampleType: 'Fresh Semen (after 3-5 days abstinence)',
    fields: [
      { id: 'sp-macro', sectionHeader: 'EXAMEN MACROSCOPIQUE', label: 'Volume', suggestedNormalWording: '≥ 1.5 mL (Normal)', observation: '' },
      { id: 'sp-ph', sectionHeader: 'EXAMEN MACROSCOPIQUE', label: 'pH', suggestedNormalWording: '7.2 - 8.0', observation: '' },
      { id: 'sp-liquefaction', sectionHeader: 'EXAMEN MACROSCOPIQUE', label: 'Liquéfaction', suggestedNormalWording: 'Complète en < 30 minutes', observation: '' },
      { id: 'sp-viscosite', sectionHeader: 'EXAMEN MACROSCOPIQUE', label: 'Viscosité', suggestedNormalWording: 'Normale', observation: '' },
      { id: 'sp-couleur', sectionHeader: 'EXAMEN MACROSCOPIQUE', label: 'Couleur', suggestedNormalWording: 'Opalescente', observation: '' },
      { id: 'sp-mobilite', sectionHeader: 'EXAMEN MICROSCOPIQUE', label: 'Mobilité progressive (PR)', suggestedNormalWording: '≥ 32% (OMS)', observation: '' },
      { id: 'sp-morpho', sectionHeader: 'EXAMEN MICROSCOPIQUE', label: 'Morphologie normale', suggestedNormalWording: '≥ 4% (OMS)', observation: '' },
      { id: 'sp-vitalite', sectionHeader: 'EXAMEN MICROSCOPIQUE', label: 'Vitalité', suggestedNormalWording: '≥ 58% (OMS)', observation: '' },
      { id: 'sp-agglutination', sectionHeader: 'EXAMEN MICROSCOPIQUE', label: 'Agglutinations', suggestedNormalWording: 'Absentes', observation: '' },
      { id: 'sp-leu', sectionHeader: 'EXAMEN MICROSCOPIQUE', label: 'Leucocytes', suggestedNormalWording: '< 1 million/mL', observation: '' },
      { id: 'sp-count', sectionHeader: 'NUMÉRATION', label: 'Concentration (millions/mL)', suggestedNormalWording: '≥ 15 millions/mL (OMS)', observation: '' },
      { id: 'sp-total', sectionHeader: 'NUMÉRATION', label: 'Nombre total (millions)', suggestedNormalWording: '≥ 39 millions (OMS)', observation: '' },
      { id: 'sp-conclusion', sectionHeader: 'CONCLUSION BIOLOGIQUE', label: 'Interprétation', suggestedNormalWording: 'Spermogramme normal (selon les critères OMS)', observation: '' },
    ]
  };
  
  export const WIDAL_TEMPLATE: DescriptiveExamTemplate = {
    testId: 'sero-widal',
    testName: 'Widal et Félix (Agglutination Typhoïde)',
    category: 'Serology / Immunology',
    sampleType: 'Serum',
    fields: [
      { id: 'widal-to', subHeader: 'Agglutination', label: 'S. Typhi O (TO)', suggestedNormalWording: '< 1:80 (Négatif)', observation: '' },
      { id: 'widal-th', subHeader: 'Agglutination', label: 'S. Typhi H (TH)', suggestedNormalWording: '< 1:80 (Négatif)', observation: '' },
      { id: 'widal-ao', subHeader: 'Agglutination', label: 'S. Paratyphi AO', suggestedNormalWording: '< 1:80 (Négatif)', observation: '' },
      { id: 'widal-bo', subHeader: 'Agglutination', label: 'S. Paratyphi BO', suggestedNormalWording: '< 1:80 (Négatif)', observation: '' },
      { id: 'widal-conclusion', sectionHeader: 'CONCLUSION', label: 'Interprétation', suggestedNormalWording: 'Négatif - Sérologie typhoïdique non significative', observation: '' },
    ]
  };
  
  export const URINALYSIS_TEMPLATE: DescriptiveExamTemplate = {
    testId: 'uri-routine',
    testName: 'Examen Cytobactériologique des Urines - Bandelette & Culot',
    category: 'Urinalysis & Parasitology',
    sampleType: 'Midstream Urine',
    fields: [
      { id: 'uri-macro-color', sectionHeader: 'EXAMEN MACROSCOPIQUE', label: 'Couleur', suggestedNormalWording: 'Jaune paille', observation: '' },
      { id: 'uri-macro-appearance', sectionHeader: 'EXAMEN MACROSCOPIQUE', label: 'Aspect', suggestedNormalWording: 'Limpide', observation: '' },
      { id: 'uri-chem-ph', subHeader: 'Bandelette Multitests', label: 'pH', suggestedNormalWording: '5.0 - 7.0', observation: '' },
      { id: 'uri-chem-densite', subHeader: 'Bandelette Multitests', label: 'Densité', suggestedNormalWording: '1.005 - 1.030', observation: '' },
      { id: 'uri-chem-proteines', subHeader: 'Bandelette Multitests', label: 'Protéines', suggestedNormalWording: 'Négatif', observation: '' },
      { id: 'uri-chem-glucose', subHeader: 'Bandelette Multitests', label: 'Glucose', suggestedNormalWording: 'Négatif', observation: '' },
      { id: 'uri-chem-corpsc', subHeader: 'Bandelette Multitests', label: 'Corps cétoniques', suggestedNormalWording: 'Négatif', observation: '' },
      { id: 'uri-chem-bili', subHeader: 'Bandelette Multitests', label: 'Bilirubine', suggestedNormalWording: 'Négatif', observation: '' },
      { id: 'uri-chem-uro', subHeader: 'Bandelette Multitests', label: 'Urobilinogène', suggestedNormalWording: 'Négatif', observation: '' },
      { id: 'uri-chem-sang', subHeader: 'Bandelette Multitests', label: 'Sang', suggestedNormalWording: 'Négatif', observation: '' },
      { id: 'uri-chem-leu', subHeader: 'Bandelette Multitests', label: 'Leucocytes (Estérase)', suggestedNormalWording: 'Négatif', observation: '' },
      { id: 'uri-chem-nitrites', subHeader: 'Bandelette Multitests', label: 'Nitrites', suggestedNormalWording: 'Négatif', observation: '' },
      { id: 'uri-micro-pus', subHeader: 'Microscopie (Sédiment)', label: 'Leucocytes (Pus)', suggestedNormalWording: '0 - 5 / champ (HPF)', observation: '' },
      { id: 'uri-micro-rbc', subHeader: 'Microscopie (Sédiment)', label: 'Hématies', suggestedNormalWording: '0 - 2 / champ (HPF)', observation: '' },
      { id: 'uri-micro-epi', subHeader: 'Microscopie (Sédiment)', label: 'Cellules épithéliales', suggestedNormalWording: 'Peu nombreuses (contamination rare)', observation: '' },
      { id: 'uri-micro-cyl', subHeader: 'Microscopie (Sédiment)', label: 'Cylindres', suggestedNormalWording: 'Absents', observation: '' },
      { id: 'uri-micro-cristaux', subHeader: 'Microscopie (Sédiment)', label: 'Cristaux', suggestedNormalWording: 'Rares cristaux d\'oxalate de calcium', observation: '' },
      { id: 'uri-micro-levures', subHeader: 'Microscopie (Sédiment)', label: 'Levures / Mycélium', suggestedNormalWording: 'Absents', observation: '' },
      { id: 'uri-micro-bacteries', subHeader: 'Microscopie (Sédiment)', label: 'Bactéries', suggestedNormalWording: 'Rares (non significatif)', observation: '' },
      { id: 'uri-micro-trichomonas', subHeader: 'Microscopie (Sédiment)', label: 'Trichomonas vaginalis', suggestedNormalWording: 'Absent', observation: '' },
      { id: 'uri-conclusion', sectionHeader: 'CONCLUSION', label: 'Interprétation', suggestedNormalWording: 'Aucune anomalie urinaire décelée', observation: '' },
    ]
  };
  
  export const BLOOD_CULTURE_TEMPLATE: DescriptiveExamTemplate = {
    testId: 'micro-bloodculture',
    testName: 'Hémoculture (Culture Aérobie et Anaérobie)',
    category: 'Microbiology',
    sampleType: 'Blood (2 flacons: Aérobie + Anaérobie)',
    fields: [
      { id: 'bc-macro', sectionHeader: 'EXAMEN DIRECT', label: 'Examen direct (Coloration de Gram)', suggestedNormalWording: 'Stérile - Absence de bactérie à l\'examen direct', observation: '' },
      { id: 'bc-culture', sectionHeader: 'CULTURE', label: 'Culture aérobie', suggestedNormalWording: 'Stérile après 7 jours d\'incubation', observation: '' },
      { id: 'bc-culture-ana', sectionHeader: 'CULTURE', label: 'Culture anaérobie', suggestedNormalWording: 'Stérile après 7 jours d\'incubation', observation: '' },
      { id: 'bc-germe', sectionHeader: 'IDENTIFICATION', label: 'Bactérie identifiée', suggestedNormalWording: 'Néant', observation: '' },
      { id: 'bc-abx', sectionHeader: 'ANTIBIOGRAMME', label: 'Sensibilité aux antibiotiques', suggestedNormalWording: 'Non réalisé (culture négative)', observation: '' },
      { id: 'bc-conclusion', sectionHeader: 'CONCLUSION', label: 'Interprétation', suggestedNormalWording: 'Négatif - Absence de bactériémie', observation: '' },
    ]
  };
  
  export const URETHRAL_SWAB_TEMPLATE: DescriptiveExamTemplate = {
    testId: 'micro-urethral',
    testName: 'Prélèvement Urétraux (PU) - Examen Cytobactériologique',
    category: 'Microbiology',
    sampleType: 'Urethral Discharge / Swab',
    fields: [
      { id: 'pu-macro', sectionHeader: 'EXAMEN MACROSCOPIQUE', label: 'Aspect de l\'écouvillon', suggestedNormalWording: 'Écouvillon peu chargé, sans pus', observation: '' },
      { id: 'pu-gram-diplo', subHeader: 'Coloration de Gram', label: 'Diplocoques Gram négatif intra-extra-cellulaires (Neisseria gonorrhoeae)', suggestedNormalWording: 'Absents', observation: '' },
      { id: 'pu-gram-leu', subHeader: 'Coloration de Gram', label: 'Polynucléaires (PNN)', suggestedNormalWording: 'Absents / < 5 par champ', observation: '' },
      { id: 'pu-gram-levures', subHeader: 'Coloration de Gram', label: 'Levures', suggestedNormalWording: 'Absentes', observation: '' },
      { id: 'pu-wet-trich', subHeader: 'Examen à l\'état frais (Wet Mount)', label: 'Trichomonas vaginalis', suggestedNormalWording: 'Absent', observation: '' },
      { id: 'pu-myco', subHeader: 'Culture spécifique', label: 'Mycoplasma / Ureaplasma', suggestedNormalWording: 'Négative', observation: '' },
      { id: 'pu-culture', subHeader: 'Culture', label: 'Culture & identification (Thayer-Martin / Chocolate agar)', suggestedNormalWording: 'Stérile après 48 heures', observation: '' },
      { id: 'pu-abx', subHeader: 'Antibiogramme', label: 'Antibiogramme', suggestedNormalWording: 'Non réalisé (culture négative)', observation: '' },
      { id: 'pu-conclusion', sectionHeader: 'CONCLUSION', label: 'Interprétation', suggestedNormalWording: 'Absence de gonocoque ou de Mycoplasme pathogène', observation: '' },
    ]
  };
  
  export const PUS_WOUND_TEMPLATE: DescriptiveExamTemplate = {
    testId: 'micro-pus',
    testName: 'Pus & Exsudats de Plaies - Culture & Sensibilité',
    category: 'Microbiology',
    sampleType: 'Pus / Wound Aspirate / Swab',
    fields: [
      { id: 'pw-macro', sectionHeader: 'EXAMEN MACROSCOPIQUE', label: 'Aspect', suggestedNormalWording: 'Pus jaunâtre, pas de mauvaise odeur', observation: '' },
      { id: 'pw-gram-cocci', subHeader: 'Coloration de Gram', label: 'Cocci Gram positif (staphylocoques/streptocoques)', suggestedNormalWording: 'Absents', observation: '' },
      { id: 'pw-gram-bacilles', subHeader: 'Coloration de Gram', label: 'Bacilles Gram négatif', suggestedNormalWording: 'Absents', observation: '' },
      { id: 'pw-culture', subHeader: 'Culture', label: 'Culture aérobie', suggestedNormalWording: 'Stérile après 48 heures', observation: '' },
      { id: 'pw-culture-ana', subHeader: 'Culture', label: 'Culture anaérobie', suggestedNormalWording: 'Stérile après 48 heures', observation: '' },
      { id: 'pw-germe', sectionHeader: 'IDENTIFICATION', label: 'Germe identifié', suggestedNormalWording: 'Néant', observation: '' },
      { id: 'pw-abx', sectionHeader: 'ANTIBIOGRAMME', label: 'Antibiogramme', suggestedNormalWording: 'Non réalisé (culture négative)', observation: '' },
      { id: 'pw-conclusion', sectionHeader: 'CONCLUSION', label: 'Interprétation', suggestedNormalWording: 'Absence d\'infection bactérienne de la plaie', observation: '' },
    ]
  };
  
  export const CSF_LCR_TEMPLATE: DescriptiveExamTemplate = {
    testId: 'micro-csf',
    testName: 'Liquide Céphalo-Rachidien (LCR) - Examen Cytobactériologique',
    category: 'Microbiology',
    sampleType: 'Cerebrospinal Fluid (CSF)',
    fields: [
      { id: 'csf-macro', sectionHeader: 'EXAMEN MACROSCOPIQUE', label: 'Aspect', suggestedNormalWording: 'Limpide, transparent comme "eau de roche"', observation: '' },
      { id: 'csf-couleur', sectionHeader: 'EXAMEN MACROSCOPIQUE', label: 'Couleur', suggestedNormalWording: 'Incolore', observation: '' },
      { id: 'csf-pandy', subHeader: 'Réaction de Pandy', label: 'Protéines (Pandy test)', suggestedNormalWording: 'Négative (-)', observation: '' },
      { id: 'csf-cell', sectionHeader: 'EXAMEN CYTOMÉTRIQUE', label: 'Cellules / mm³', suggestedNormalWording: '0 - 2 Leucocytes/mm³', observation: '' },
      { id: 'csf-formula', subHeader: 'Formule cytologique', label: 'Polynucléaires (PNN)', suggestedNormalWording: '< 10% (Normal)', observation: '' },
      { id: 'csf-formula-lym', subHeader: 'Formule cytologique', label: 'Lymphocytes', suggestedNormalWording: '> 90% (Normal)', observation: '' },
      { id: 'csf-bio-glu', subHeader: 'Biochimie', label: 'Glucose', suggestedNormalWording: '≥ 60% de la glycémie sanguine (2/3)', observation: '' },
      { id: 'csf-bio-prot', subHeader: 'Biochimie', label: 'Protéines totales', suggestedNormalWording: '0.15 - 0.40 g/L', observation: '' },
      { id: 'csf-gram', subHeader: 'Coloration de Gram', label: 'Bactéries (Diplocoques / Bacilles)', suggestedNormalWording: 'Absentes', observation: '' },
      { id: 'csf-encre', subHeader: 'Encre de Chine', label: 'Cryptococcus neoformans (Levures encapsulées)', suggestedNormalWording: 'Absentes', observation: '' },
      { id: 'csf-culture', subHeader: 'Culture', label: 'Culture (gélose chocolat / Sabouraud)', suggestedNormalWording: 'Stérile après 48 heures', observation: '' },
      { id: 'csf-conclusion', sectionHeader: 'CONCLUSION', label: 'Interprétation', suggestedNormalWording: 'LCR normal - Absence de méningite bactérienne ou cryptococcique', observation: '' },
    ]
  };
  
  export const SYPHILIS_SERO_TEMPLATE: DescriptiveExamTemplate = {
    testId: 'sero-syphilis',
    testName: 'Sérologie Syphilis (VDRL / RPR & TPHA)',
    category: 'Serology / Immunology',
    sampleType: 'Serum',
    fields: [
      { id: 'sy-vdrl-q', subHeader: 'VDRL / RPR', label: 'Qualitative (Non-Tréponémique)', suggestedNormalWording: 'Non-Réactif (Négatif)', observation: '' },
      { id: 'sy-vdrl-t', subHeader: 'VDRL / RPR', label: 'Titre quantitatif (Dilution)', suggestedNormalWording: 'Négatif (< 1:1)', observation: '' },
      { id: 'sy-tpha', subHeader: 'TPHA (Confirmation Tréponémique)', label: 'TPHA (Tréponème pallidum Hemagglutination)', suggestedNormalWording: 'Non-Réactif (Négatif)', observation: '' },
      { id: 'sy-conclusion', sectionHeader: 'CONCLUSION', label: 'Interprétation', suggestedNormalWording: 'Sérologie syphilitique négative - Absence d\'infection', observation: '' },
    ]
  };
  
  export const RAPID_SEROLOGY_TEMPLATE: DescriptiveExamTemplate = {
    testId: 'sero-rapid',
    testName: 'Panneau Sérologique Rapide (HIV, HBsAg, HCV, Syphilis)',
    category: 'Serology / Immunology',
    sampleType: 'Serum / Plasma',
    fields: [
      { id: 'rapid-hiv', sectionHeader: 'PANNEAU RAPIDE', label: 'HIV 1 & 2 (Ag/Ab)', suggestedNormalWording: 'Non-Réactif', observation: '' },
      { id: 'rapid-hbsag', sectionHeader: 'PANNEAU RAPIDE', label: 'HBsAg (Hépatite B)', suggestedNormalWording: 'Non-Réactif', observation: '' },
      { id: 'rapid-hcv', sectionHeader: 'PANNEAU RAPIDE', label: 'HCV (Hépatite C)', suggestedNormalWording: 'Non-Réactif', observation: '' },
      { id: 'rapid-syph', sectionHeader: 'PANNEAU RAPIDE', label: 'Syphilis (RPR / Card Test)', suggestedNormalWording: 'Non-Réactif', observation: '' },
      { id: 'rapid-conclusion', sectionHeader: 'CONCLUSION', label: 'Interprétation', suggestedNormalWording: 'Toutes sérologies négatives', observation: '' },
    ]
  };
  
  export const DERMATO_MYCOLOGY_TEMPLATE: DescriptiveExamTemplate = {
    testId: 'micro-myco',
    testName: 'Examen Mycologique (Peau, Ongles, Cheveux)',
    category: 'Microbiology',
    sampleType: 'Skin Scrapings / Nail Clippings / Hair',
    fields: [
      { id: 'dm-type', sectionHeader: 'PRELEVEMENT', label: 'Type de prélèvement', suggestedNormalWording: 'Raclage de la peau / Fragment d\'ongle / Cheveux', observation: '' },
      { id: 'dm-koh', subHeader: 'Éclaircissement KOH 10-20%', label: 'Filaments mycéliens', suggestedNormalWording: 'Absents', observation: '' },
      { id: 'dm-spores', subHeader: 'Éclaircissement KOH 10-20%', label: 'Spores / Arthroconidies', suggestedNormalWording: 'Absentes', observation: '' },
      { id: 'dm-culture', subHeader: 'Culture sur Sabouraud-Actidione', label: 'Culture (Dermatophytes vs Levures)', suggestedNormalWording: 'Stérile après 3 semaines', observation: '' },
      { id: 'dm-organisme', subHeader: 'Identification', label: 'Organisme isolé', suggestedNormalWording: 'Néant', observation: '' },
      { id: 'dm-conclusion', sectionHeader: 'CONCLUSION', label: 'Interprétation', suggestedNormalWording: 'Examen mycologique négatif', observation: '' },
    ]
  };
  
  // ============================================================
  // 3. COMPLETE MASTER TESTS CATALOG
  // ============================================================
  
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
      resultType: 'quantitative',
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
      resultType: 'quantitative'
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
      resultType: 'qualitative',
      subParameters: [
        { id: 'abo_group', name: 'ABO Blood Group', unit: '', refRangeMale: 'A / B / AB / O', refRangeFemale: 'A / B / AB / O', refRangeChild: 'A / B / AB / O' },
        { id: 'rh_factor', name: 'Rhesus (Rh) D Factor', unit: '', refRangeMale: 'Positive (+) / Negative (-)', refRangeFemale: 'Positive (+) / Negative (-)', refRangeChild: 'Positive (+) / Negative (-)' },
        { id: 'forward_grouping', name: 'Forward / Cell Grouping', unit: '', refRangeMale: 'Anti-A / Anti-B Agglutination Pattern', refRangeFemale: 'Anti-A / Anti-B Agglutination Pattern', refRangeChild: 'Anti-A / Anti-B Agglutination Pattern' },
        { id: 'reverse_grouping', name: 'Reverse / Serum Grouping', unit: '', refRangeMale: 'A1 / B Reagent Red Cells', refRangeFemale: 'A1 / B Reagent Red Cells', refRangeChild: 'A1 / B Reagent Red Cells' }
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
      resultType: 'quantitative'
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
      resultType: 'quantitative'
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
      resultType: 'quantitative'
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
      resultType: 'quantitative'
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
      resultType: 'quantitative'
    },
    {
      id: 'hem-09',
      code: 'FR-SANG',
      name: 'Frottis Sanguin (Examen Microscopique)',
      category: 'Hematology',
      sampleType: 'Whole Blood (EDTA Tube)',
      units: 'Descriptive',
      refRangeMale: 'Normal',
      refRangeFemale: 'Normal',
      refRangeChild: 'Normal',
      conditions: 'No special preparation needed.',
      basePrice: 5000,
      turnaroundTime: '2 hours',
      description: 'Microscopic examination of peripheral blood smear for cellular morphology and abnormalities.',
      resultType: 'descriptive',
      descriptiveTemplate: BLOOD_SMEAR_TEMPLATE
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
      resultType: 'quantitative'
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
      resultType: 'quantitative'
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
      resultType: 'quantitative',
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
      resultType: 'quantitative',
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
      resultType: 'quantitative',
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
      resultType: 'quantitative',
      subParameters: [
        { id: 'sodium', name: 'Sodium (Na+)', unit: 'mEq/L', refRangeMale: '135 - 145', refRangeFemale: '135 - 145', refRangeChild: '138 - 145', maleMin: 135, maleMax: 145, femaleMin: 135, femaleMax: 145, childMin: 138, childMax: 145 },
        { id: 'potassium', name: 'Potassium (K+)', unit: 'mEq/L', refRangeMale: '3.5 - 5.1', refRangeFemale: '3.5 - 5.1', refRangeChild: '3.6 - 5.4', maleMin: 3.5, maleMax: 5.1, femaleMin: 3.5, femaleMax: 5.1, childMin: 3.6, childMax: 5.4 },
        { id: 'chloride', name: 'Chloride (Cl-)', unit: 'mEq/L', refRangeMale: '98 - 107', refRangeFemale: '98 - 107', refRangeChild: '98 - 108', maleMin: 98, maleMax: 107, femaleMin: 98, femaleMax: 107, childMin: 98, childMax: 108 },
        { id: 'bicarbonate', name: 'Bicarbonate (HCO3-)', unit: 'mEq/L', refRangeMale: '22 - 29', refRangeFemale: '22 - 29', refRangeChild: '20 - 28', maleMin: 22, maleMax: 29, femaleMin: 22, femaleMax: 29, childMin: 20, childMax: 28 }
      ]
    },
  
    // ========================================================
    // 3. MICROBIOLOGY
    // ========================================================
    {
      id: 'mb-01',
      code: 'CVC-01',
      name: 'Prélèvement Cervico-Vaginal (CVC / PCV)',
      category: 'Microbiology',
      sampleType: 'Cervical / Endocervical Swab',
      units: 'Descriptive',
      refRangeMale: 'N/A',
      refRangeFemale: 'Normal flora',
      refRangeChild: 'N/A',
      conditions: 'Abstinence sexuelle 3 jours avant. Pas de toilette intime la veille et le jour. Pas de traitement local dans les 72 heures précédentes.',
      basePrice: 15000,
      turnaroundTime: '3 days',
      description: 'Examen cytobactériologique d\'un prélèvement cervical-vaginal, incluant examen direct, coloration de Gram, culture et recherche de germes spécifiques.',
      resultType: 'descriptive',
      descriptiveTemplate: CERVICO_VAGINAL_TEMPLATE
    },
    {
      id: 'mb-02',
      code: 'ECBU-01',
      name: 'Examen Cytobactériologique des Urines (ECBU)',
      category: 'Microbiology',
      sampleType: 'Midstream Urine (Stérile)',
      units: 'Descriptive & Quantitative',
      refRangeMale: '< 10,000 CFU/mL (Sterile / Commensal Flora)',
      refRangeFemale: '< 10,000 CFU/mL (Sterile / Commensal Flora)',
      refRangeChild: '< 10,000 CFU/mL (Sterile / Commensal Flora)',
      conditions: 'Strict midstream urine after vulvar/penile washing. Minimum 3 hours urinary retention in bladder.',
      basePrice: 12000,
      turnaroundTime: '3 days',
      description: 'Quantitative bacteriological evaluation of UTI, bacterial colony counting, species identification, and antibiotic sensitivity profiling.',
      resultType: 'descriptive',
      descriptiveTemplate: ECBU_TEMPLATE
    },
    {
      id: 'mb-03',
      code: 'KOP-01',
      name: 'Examen Parasitologique des Selles (KOP / O&P)',
      category: 'Microbiology',
      sampleType: 'Fresh Stool',
      units: 'Descriptive',
      refRangeMale: 'No ova, cysts, trophozoites, or intestinal parasites seen',
      refRangeFemale: 'No ova, cysts, trophozoites, or intestinal parasites seen',
      refRangeChild: 'No ova, cysts, trophozoites, or intestinal parasites seen',
      conditions: 'Pass fresh stool into clean disinfectant-free cup. Deliver to lab within 1 hour.',
      basePrice: 3500,
      turnaroundTime: '2 hours',
      description: 'Direct saline & Lugol iodine microscopic search for helminth eggs, Entamoeba histolytica/coli cysts, and Giardia trophozoites.',
      resultType: 'descriptive',
      descriptiveTemplate: STOOL_PARASITOLOGY_TEMPLATE
    },
    {
      id: 'mb-04',
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
      resultType: 'descriptive',
      descriptiveTemplate: {
        testId: 'mb-afb',
        testName: 'Recherche de Bacilles Acido-Alcoolo-Résistants (BAAR)',
        category: 'Microbiology',
        sampleType: 'Sputum / Urine',
        fields: [
          { id: 'afb-smear1', sectionHeader: 'EXAMEN DIRECT', label: 'Échantillon 1', suggestedNormalWording: 'Négatif (Absence de BAAR)', observation: '' },
          { id: 'afb-smear2', sectionHeader: 'EXAMEN DIRECT', label: 'Échantillon 2', suggestedNormalWording: 'Négatif (Absence de BAAR)', observation: '' },
          { id: 'afb-grade', subHeader: 'Échelle de lecture', label: 'Grade (1+, 2+, 3+)', suggestedNormalWording: 'Négatif (0)', observation: '' },
          { id: 'afb-conclusion', sectionHeader: 'CONCLUSION', label: 'Interprétation', suggestedNormalWording: 'Négatif - Absence de Mycobactérie (TB)', observation: '' },
        ]
      }
    },
    {
      id: 'mb-05',
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
      resultType: 'descriptive',
      descriptiveTemplate: {
        testId: 'mb-coproculture',
        testName: 'Coproculture (Culture des Selles)',
        category: 'Microbiology',
        sampleType: 'Fresh Stool',
        fields: [
          { id: 'cc-macro', sectionHeader: 'EXAMEN MACROSCOPIQUE', label: 'Aspect', suggestedNormalWording: 'Selles molles', observation: '' },
          { id: 'cc-gram', subHeader: 'Examen direct', label: 'Flore', suggestedNormalWording: 'Flore mixte normale', observation: '' },
          { id: 'cc-culture', subHeader: 'Culture', label: 'Culture', suggestedNormalWording: 'Stérile après 72 heures', observation: '' },
          { id: 'cc-germe', subHeader: 'Culture', label: 'Germe pathogène', suggestedNormalWording: 'Néant', observation: '' },
          { id: 'cc-abx', subHeader: 'Antibiogramme', label: 'Antibiogramme', suggestedNormalWording: 'Non réalisé (culture négative)', observation: '' },
          { id: 'cc-conclusion', sectionHeader: 'CONCLUSION', label: 'Interprétation', suggestedNormalWording: 'Absence de bactérie entéropathogène', observation: '' },
        ]
      }
    },
    {
      id: 'mb-06',
      code: 'HEMO-CULT',
      name: 'Hémoculture (Blood Culture)',
      category: 'Microbiology',
      sampleType: 'Blood (2 flacons: Aérobie + Anaérobie)',
      units: 'Descriptive',
      refRangeMale: 'Stérile après 7 jours',
      refRangeFemale: 'Stérile après 7 jours',
      refRangeChild: 'Stérile après 7 jours',
      conditions: 'Strict aseptic technique. Draw blood BEFORE antibiotics administration.',
      basePrice: 20000,
      turnaroundTime: '7 days',
      description: 'Detection of bacteremia and sepsis through aerobic and anaerobic blood culture.',
      resultType: 'descriptive',
      descriptiveTemplate: BLOOD_CULTURE_TEMPLATE
    },
    {
      id: 'mb-07',
      code: 'THROAT-SWAB',
      name: 'Prélèvement de Gorge (Throat Swab Culture)',
      category: 'Microbiology',
      sampleType: 'Throat Swab',
      units: 'Descriptive',
      refRangeMale: 'No pathogenic growth',
      refRangeFemale: 'No pathogenic growth',
      refRangeChild: 'No pathogenic growth',
      conditions: 'No antibiotics for 7 days. Best to collect before brushing teeth.',
      basePrice: 8000,
      turnaroundTime: '2 days',
      description: 'Detection of Group A Streptococcus and other pharyngeal pathogens.',
      resultType: 'descriptive',
      descriptiveTemplate: THROAT_SWAB_TEMPLATE
    },
    {
      id: 'mb-08',
      code: 'PU-01',
      name: 'Prélèvement Urétral (PU) - Examen Direct',
      category: 'Microbiology',
      sampleType: 'Urethral Swab',
      units: 'Descriptive',
      refRangeMale: 'Negative',
      refRangeFemale: 'N/A',
      refRangeChild: 'N/A',
      conditions: 'Morning discharge before first urination or minimum 3-4 hours without urinating prior to collection.',
      basePrice: 5000,
      turnaroundTime: '2 hours',
      description: 'Microscopic detection of Neisseria gonorrhoeae, Trichomonas, and leukocytes.',
      resultType: 'descriptive',
      descriptiveTemplate: URETHRAL_SWAB_TEMPLATE
    },
    {
      id: 'mb-09',
      code: 'PU-CULT',
      name: 'Prélèvement Urétral + Culture & Antibiogramme',
      category: 'Microbiology',
      sampleType: 'Urethral Swab',
      units: 'Descriptive',
      refRangeMale: 'No pathogenic growth',
      refRangeFemale: 'N/A',
      refRangeChild: 'N/A',
      conditions: 'Minimum 3 hours without urinating. No antibiotics for 10-14 days.',
      basePrice: 15000,
      turnaroundTime: '3 days',
      description: 'Culture and sensitivity of urethral pathogens.',
      resultType: 'descriptive',
      descriptiveTemplate: URETHRAL_SWAB_TEMPLATE
    },
    {
      id: 'mb-10',
      code: 'PUS-01',
      name: 'Pus / Wound Exudate - Culture & Sensibilité',
      category: 'Microbiology',
      sampleType: 'Pus / Wound Aspirate',
      units: 'Descriptive',
      refRangeMale: 'No growth',
      refRangeFemale: 'No growth',
      refRangeChild: 'No growth',
      conditions: 'Sample taken from deep base of wound prior to antiseptic cleansing.',
      basePrice: 15000,
      turnaroundTime: '3 days',
      description: 'Identification of pyogenic bacteria with antibiogram.',
      resultType: 'descriptive',
      descriptiveTemplate: PUS_WOUND_TEMPLATE
    },
    {
      id: 'mb-11',
      code: 'CSF-01',
      name: 'Liquide Céphalo-Rachidien (LCR) - Examen Cytobactériologique',
      category: 'Microbiology',
      sampleType: 'Cerebrospinal Fluid',
      units: 'Descriptive',
      refRangeMale: 'Negative',
      refRangeFemale: 'Negative',
      refRangeChild: 'Negative',
      conditions: 'Sterile lumbar puncture. Immediate transport to lab.',
      basePrice: 20000,
      turnaroundTime: '3 days',
      description: 'Emergency evaluation for meningitis (bacterial, viral, fungal).',
      resultType: 'descriptive',
      descriptiveTemplate: CSF_LCR_TEMPLATE
    },
    {
      id: 'mb-12',
      code: 'MYCO-01',
      name: 'Examen Mycologique (Peau, Ongles, Cheveux)',
      category: 'Microbiology',
      sampleType: 'Skin Scrapings / Nails / Hair',
      units: 'Descriptive',
      refRangeMale: 'Negative',
      refRangeFemale: 'Negative',
      refRangeChild: 'Negative',
      conditions: 'No application of topical antifungals for 7 days prior.',
      basePrice: 10000,
      turnaroundTime: '3 weeks',
      description: 'KOH prep and culture for dermatophytes and yeasts.',
      resultType: 'descriptive',
      descriptiveTemplate: DERMATO_MYCOLOGY_TEMPLATE
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
      resultType: 'qualitative'
    },
    {
      id: 'sero-02',
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
      resultType: 'descriptive',
      descriptiveTemplate: WIDAL_TEMPLATE
    },
    {
      id: 'sero-03',
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
      resultType: 'quantitative'
    },
    {
      id: 'sero-04',
      code: 'SYPH-01',
      name: 'Sérologie Syphilis (VDRL / RPR & TPHA)',
      category: 'Serology / Immunology',
      sampleType: 'Serum',
      units: 'Titer / Qualitative',
      refRangeMale: 'Non-Reactive',
      refRangeFemale: 'Non-Reactive',
      refRangeChild: 'Non-Reactive',
      conditions: 'No special preparation needed.',
      basePrice: 6500,
      turnaroundTime: '1 hour',
      description: 'Comprehensive syphilis screening and confirmation.',
      resultType: 'descriptive',
      descriptiveTemplate: SYPHILIS_SERO_TEMPLATE
    },
    {
      id: 'sero-05',
      code: 'RAPID-PANEL',
      name: 'Panneau Sérologique Rapide (HIV, HBsAg, HCV, Syphilis)',
      category: 'Serology / Immunology',
      sampleType: 'Serum / Plasma',
      units: 'Qualitative',
      refRangeMale: 'Non-Reactive',
      refRangeFemale: 'Non-Reactive',
      refRangeChild: 'Non-Reactive',
      conditions: 'No special preparation needed.',
      basePrice: 12000,
      turnaroundTime: '45 mins',
      description: 'Rapid screening panel for major infectious diseases.',
      resultType: 'descriptive',
      descriptiveTemplate: RAPID_SEROLOGY_TEMPLATE
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
      resultType: 'quantitative',
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
      resultType: 'quantitative'
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
      resultType: 'quantitative'
    },
    {
      id: 'horm-04',
      code: 'SPERMO-01',
      name: 'Spermogramme (Analyse du Sperme)',
      category: 'Hormones & Tumor Markers',
      sampleType: 'Fresh Semen (after 3-5 days abstinence)',
      units: 'Descriptive & Quantitative',
      refRangeMale: 'See sub-parameters',
      refRangeFemale: 'N/A',
      refRangeChild: 'N/A',
      conditions: 'Abstinence 3-5 days. Report collected at lab in sterile container.',
      basePrice: 12000,
      turnaroundTime: '2 hours',
      description: 'Complete semen analysis according to WHO 2010 criteria, evaluating volume, count, motility, and morphology.',
      resultType: 'descriptive',
      descriptiveTemplate: SPERMOGRAMME_TEMPLATE
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
      resultType: 'descriptive',
      descriptiveTemplate: URINALYSIS_TEMPLATE,
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
      resultType: 'descriptive',
      descriptiveTemplate: MALARIA_SMEAR_TEMPLATE,
      subParameters: [
        { id: 'parasite_species', name: 'Plasmodium Species', unit: '', refRangeMale: 'None seen (Negative) / P. falciparum / P. vivax', refRangeFemale: 'None seen (Negative) / P. falciparum / P. vivax', refRangeChild: 'None seen (Negative) / P. falciparum / P. vivax' },
        { id: 'trophozoite_density', name: 'Trophozoite Density', unit: 'parasites/µL', refRangeMale: '0 (Negative)', refRangeFemale: '0 (Negative)', refRangeChild: '0 (Negative)', maleMin: 0, maleMax: 0, femaleMin: 0, femaleMax: 0, childMin: 0, childMax: 0 },
        { id: 'plus_system_density', name: 'Semiquantitative Density (+ System)', unit: '', refRangeMale: 'Negative (0) / + / ++ / +++ / ++++', refRangeFemale: 'Negative (0) / + / ++ / +++ / ++++', refRangeChild: 'Negative (0) / + / ++ / +++ / ++++' },
        { id: 'gametocytes', name: 'Sexual Forms (Gametocytes)', unit: '', refRangeMale: 'Absent', refRangeFemale: 'Absent', refRangeChild: 'Absent' },
        { id: 'smear_impression', name: 'Thick & Thin Smear Impression', unit: '', refRangeMale: 'Negative for Malaria Parasite', refRangeFemale: 'Negative for Malaria Parasite', refRangeChild: 'Negative for Malaria Parasite' }
      ]
    },
  
    // ========================================================
    // ADDITIONAL OFFICIAL LAB TESTS (From OFFICIAL_MASTER_TEST_CATALOG)
    // ========================================================
    {
      id: 'ofc-01',
      code: 'MB-APPEND-01',
      name: 'Pap Smear (Cervical Cytology / Papanicolaou Stain)',
      category: 'Microbiology',
      sampleType: 'Cervical / Endocervical Swab',
      units: 'Qualitative',
      refRangeMale: 'N/A',
      refRangeFemale: 'Negative for intraepithelial lesions',
      refRangeChild: 'N/A',
      conditions: 'No sexual intercourse, vaginal douches, or intravaginal medications for 48 hours prior. Perform outside menstrual bleeding period.',
      basePrice: 15000,
      turnaroundTime: '10 days',
      description: 'Cytological screening for cervical dysplasia, pre-cancerous intraepithelial lesions, and HPV cytopathic changes.',
      resultType: 'descriptive',
      descriptiveTemplate: CERVICO_VAGINAL_TEMPLATE
    },
    {
      id: 'ofc-02',
      code: 'MB-APPEND-02',
      name: 'Mycoplasma & Ureaplasma Culture',
      category: 'Microbiology',
      sampleType: 'Genital Swab / First Void Urine',
      units: 'Qualitative',
      refRangeMale: 'Negative',
      refRangeFemale: 'Negative',
      refRangeChild: 'N/A',
      conditions: 'Endocervical, urethral swab, or first-void morning urine. No antibiotics for 10-14 days.',
      basePrice: 15000,
      turnaroundTime: '48 hours',
      description: 'Specific diagnosis of urogenital mycoplasmas with antimicrobial susceptibility.',
      resultType: 'descriptive',
      descriptiveTemplate: URETHRAL_SWAB_TEMPLATE
    },
    {
      id: 'ofc-03',
      code: 'MB-APPEND-03',
      name: 'Microfilaria Blood Examination (Loa Loa / Mansonella)',
      category: 'Microbiology',
      sampleType: 'Venous / Capillary Blood',
      units: 'Descriptive',
      refRangeMale: 'Negative',
      refRangeFemale: 'Negative',
      refRangeChild: 'Negative',
      conditions: 'For diurnal Loa loa: sampling MUST occur between 10:00 AM and 3:00 PM.',
      basePrice: 3500,
      turnaroundTime: '2 hours',
      description: 'Quantification and morphological differentiation of circulating microfilariae.',
      resultType: 'descriptive'
    },
    {
      id: 'ofc-04',
      code: 'MB-APPEND-04',
      name: 'Scotch Tape Technique (Graham Test / Pinworm)',
      category: 'Microbiology',
      sampleType: 'Perianal Adhesive Tape Slide',
      units: 'Descriptive',
      refRangeMale: 'Negative',
      refRangeFemale: 'Negative',
      refRangeChild: 'Negative',
      conditions: 'Collect early in the morning before 10:00 AM, before taking a bath, showering, or passing stool.',
      basePrice: 3000,
      turnaroundTime: '1.5 hours',
      description: 'Detection of Enterobius vermicularis eggs on perianal skin folds.',
      resultType: 'descriptive',
      descriptiveTemplate: STOOL_PARASITOLOGY_TEMPLATE
    },
    {
      id: 'ofc-05',
      code: 'MB-APPEND-05',
      name: 'Semen Culture (Spermoculture & Sensitivity)',
      category: 'Microbiology',
      sampleType: 'Sterile Semen Ejaculate',
      units: 'Descriptive',
      refRangeMale: 'No pathogenic growth',
      refRangeFemale: 'N/A',
      refRangeChild: 'N/A',
      conditions: 'Strict 3-5 days of sexual abstinence. Collect entire ejaculate into sterile cup.',
      basePrice: 15000,
      turnaroundTime: '3 days',
      description: 'Screening for asymptomatic or chronic male reproductive tract infections.',
      resultType: 'descriptive'
    },
    {
      id: 'ofc-06',
      code: 'MB-APPEND-06',
      name: 'Post Coital Test (Huhner Test)',
      category: 'Microbiology',
      sampleType: 'Endocervical Mucus',
      units: 'Descriptive',
      refRangeMale: 'N/A',
      refRangeFemale: 'Normal',
      refRangeChild: 'N/A',
      conditions: 'Scheduled strictly during pre-ovulatory peak (day 12-14 of cycle).',
      basePrice: 10000,
      turnaroundTime: '2 hours',
      description: 'Investigation of cervical factor infertility and sperm survival inside cervical secretions.',
      resultType: 'descriptive'
    },
    {
      id: 'ofc-07',
      code: 'HEM-APPEND-01',
      name: 'Direct Coombs Test (Direct Antiglobulin Test)',
      category: 'Hematology',
      sampleType: 'EDTA Whole Blood',
      units: 'Qualitative',
      refRangeMale: 'Negative',
      refRangeFemale: 'Negative',
      refRangeChild: 'Negative',
      conditions: 'Fresh venous EDTA whole blood, processed promptly without hemolysis.',
      basePrice: 6000,
      turnaroundTime: '2 hours',
      description: 'Detection of antibodies or complement proteins bound directly to red blood cell surface.',
      resultType: 'qualitative'
    },
    {
      id: 'ofc-08',
      code: 'HEM-APPEND-02',
      name: 'Fibrinogen Dosage (Factor I)',
      category: 'Hematology',
      sampleType: 'Citrated Plasma',
      units: 'g/L',
      refRangeMale: '1.8 - 3.5',
      refRangeFemale: '1.8 - 3.5',
      refRangeChild: '1.5 - 3.0',
      maleMin: 1.8, maleMax: 3.5, femaleMin: 1.8, femaleMax: 3.5, childMin: 1.5, childMax: 3.0,
      conditions: 'Sodium citrate blood tube (light blue top). Rapid centrifugation and separation of plasma.',
      basePrice: 7000,
      turnaroundTime: '2 hours',
      description: 'Quantitative measurement of plasma fibrinogen for coagulation disorders and DIC screening.',
      resultType: 'quantitative'
    },
    {
      id: 'ofc-09',
      code: 'BIO-APPEND-01',
      name: 'Oral Glucose Tolerance Test (OGTT - 75g WHO)',
      category: 'Biochemistry',
      sampleType: 'Fluoride Plasma (0h, 1h, 2h)',
      units: 'mg/dL',
      refRangeMale: '0h: < 100 | 1h: < 180 | 2h: < 140',
      refRangeFemale: '0h: < 100 | 1h: < 180 | 2h: < 140',
      refRangeChild: '0h: < 100 | 1h: < 180 | 2h: < 140',
      conditions: 'Normal carbohydrate diet for 3 days prior. 10-12h overnight fast.',
      basePrice: 8000,
      turnaroundTime: '3 hours',
      description: 'Definitive diagnostic test for gestational diabetes mellitus and impaired glucose tolerance.',
      resultType: 'quantitative'
    },
    {
      id: 'ofc-10',
      code: 'BIO-APPEND-02',
      name: 'Serum Protein Electrophoresis (SPEP)',
      category: 'Biochemistry',
      sampleType: 'Serum',
      units: 'g/dL',
      refRangeMale: 'Albumin: 3.5-5.2 | Alpha1: 0.2-0.4 | Alpha2: 0.5-0.9 | Beta1: 0.4-0.7 | Gamma: 0.7-1.7',
      refRangeFemale: 'Albumin: 3.5-5.2 | Alpha1: 0.2-0.4 | Alpha2: 0.5-0.9 | Beta1: 0.4-0.7 | Gamma: 0.7-1.7',
      refRangeChild: 'Albumin: 3.8-5.4 | Alpha1: 0.2-0.4 | Alpha2: 0.5-0.9 | Beta1: 0.4-0.7 | Gamma: 0.7-1.7',
      conditions: 'Fasting unhemolyzed venous serum.',
      basePrice: 15000,
      turnaroundTime: '24 hours',
      description: 'Separation of serum proteins into 5-6 fractions for detection of monoclonal gammopathies.',
      resultType: 'quantitative'
    },
    {
      id: 'ofc-11',
      code: 'BIO-APPEND-03',
      name: '24-Hour Proteinuria',
      category: 'Biochemistry',
      sampleType: '24-Hour Urine',
      units: 'g/24h',
      refRangeMale: '< 0.15',
      refRangeFemale: '< 0.15',
      refRangeChild: '< 0.15',
      conditions: 'Collect ALL urine passed over exactly 24 hours. Keep container refrigerated.',
      basePrice: 4000,
      turnaroundTime: '3 hours',
      description: 'Gold-standard quantitative assessment of renal protein loss in nephrotic syndrome.',
      resultType: 'quantitative'
    },
    {
      id: 'ofc-12',
      code: 'SERO-APPEND-01',
      name: 'Hepatitis C Viral RNA RT-PCR (HCV Viral Load)',
      category: 'Serology / Immunology',
      sampleType: 'EDTA Plasma',
      units: 'IU/mL',
      refRangeMale: 'Not detected',
      refRangeFemale: 'Not detected',
      refRangeChild: 'Not detected',
      conditions: 'EDTA tube. Plasma must be separated within 2-4 hours and frozen immediately.',
      basePrice: 65000,
      turnaroundTime: '7-10 days',
      description: 'Quantification of HCV RNA to confirm active replication and verify Sustained Virologic Response.',
      resultType: 'quantitative'
    },
    {
      id: 'ofc-13',
      code: 'SERO-APPEND-02',
      name: 'Hepatitis B Viral DNA PCR (HBV Viral Load)',
      category: 'Serology / Immunology',
      sampleType: 'EDTA Plasma',
      units: 'IU/mL',
      refRangeMale: 'Not detected',
      refRangeFemale: 'Not detected',
      refRangeChild: 'Not detected',
      conditions: 'Fresh EDTA whole blood or plasma. Separate plasma within 4 hours.',
      basePrice: 50000,
      turnaroundTime: '7-10 days',
      description: 'Quantification of circulating Hepatitis B virus genomic DNA to evaluate viral replication.',
      resultType: 'quantitative'
    },
    {
      id: 'ofc-14',
      code: 'SERO-APPEND-03',
      name: 'Anti-Phospholipid Antibodies (aPL Panel)',
      category: 'Serology / Immunology',
      sampleType: 'Citrated Plasma & Serum',
      units: 'Qualitative',
      refRangeMale: 'Negative',
      refRangeFemale: 'Negative',
      refRangeChild: 'Negative',
      conditions: 'Venous blood drawn in citrate and serum tubes. Avoid heparin therapy at sampling.',
      basePrice: 25000,
      turnaroundTime: '3 days',
      description: 'Diagnostic workup for Antiphospholipid Syndrome (APS), unexplained thrombosis, and recurrent fetal loss.',
      resultType: 'qualitative'
    },
    {
      id: 'ofc-15',
      code: 'HORM-APPEND-01',
      name: 'Procalcitonin (PCT - Severe Sepsis Marker)',
      category: 'Hormones & Tumor Markers',
      sampleType: 'Serum / Plasma',
      units: 'ng/mL',
      refRangeMale: '< 0.5',
      refRangeFemale: '< 0.5',
      refRangeChild: '< 0.5',
      maleMin: 0, maleMax: 0.5, femaleMin: 0, femaleMax: 0.5, childMin: 0, childMax: 0.5,
      conditions: 'Venous blood in serum or lithium heparin tube.',
      basePrice: 25000,
      turnaroundTime: '2 hours',
      description: 'Specific biomarker for severe systemic bacterial infection, bacteremia, and septic shock.',
      resultType: 'quantitative'
    },
    {
      id: 'ofc-16',
      code: 'HORM-APPEND-02',
      name: 'BNP / NT-proBNP (B-Type Natriuretic Peptide)',
      category: 'Hormones & Tumor Markers',
      sampleType: 'EDTA Plasma',
      units: 'pg/mL',
      refRangeMale: '< 100',
      refRangeFemale: '< 100',
      refRangeChild: '< 100',
      conditions: 'Venous blood drawn in EDTA tube. Immediate cold processing.',
      basePrice: 25000,
      turnaroundTime: '2 hours',
      description: 'Emergency cardiac biomarker for rapid triage and diagnosis of acute decompensated congestive heart failure.',
      resultType: 'quantitative'
    },
    {
      id: 'ofc-17',
      code: 'HORM-APPEND-03',
      name: 'D-Dimer (Quantitative D-Dimer)',
      category: 'Hormones & Tumor Markers',
      sampleType: 'Citrated Plasma',
      units: 'ng/mL (DDU)',
      refRangeMale: '< 500',
      refRangeFemale: '< 500',
      refRangeChild: '< 500',
      conditions: 'Sodium citrate tube (light blue top), filled to mark. Immediate centrifugation.',
      basePrice: 15000,
      turnaroundTime: '2 hours',
      description: 'Emergency exclusion test for deep vein thrombosis (DVT) and pulmonary embolism (PE).',
      resultType: 'quantitative'
    },
    {
      id: 'ofc-18',
      code: 'HORM-APPEND-04',
      name: 'Troponin I (High Sensitivity hs-cTnI)',
      category: 'Hormones & Tumor Markers',
      sampleType: 'Serum / Heparin Plasma',
      units: 'ng/L',
      refRangeMale: '< 26 (99th percentile)',
      refRangeFemale: '< 16 (99th percentile)',
      refRangeChild: '< 16 (99th percentile)',
      conditions: 'Venous blood drawn in serum or lithium heparin tube. Emergency stat processing.',
      basePrice: 15000,
      turnaroundTime: '1 hour',
      description: 'Emergency gold-standard cardiac necrosis biomarker for acute myocardial infarction triage.',
      resultType: 'quantitative'
    },
    {
      id: 'ofc-19',
      code: 'HORM-APPEND-05',
      name: 'Vitamin D (Total 25-OH Vitamin D)',
      category: 'Hormones & Tumor Markers',
      sampleType: 'Serum (Light Protected)',
      units: 'ng/mL',
      refRangeMale: '30 - 100 (Sufficient) | 20-29 (Insufficient) | <20 (Deficient)',
      refRangeFemale: '30 - 100 (Sufficient) | 20-29 (Insufficient) | <20 (Deficient)',
      refRangeChild: '30 - 100 (Sufficient) | 20-29 (Insufficient) | <20 (Deficient)',
      conditions: 'Fasting venous serum. Tube protected from light.',
      basePrice: 25000,
      turnaroundTime: '24 hours',
      description: 'Quantitative assessment of total body vitamin D nutritional sufficiency for bone health.',
      resultType: 'quantitative'
    },
    {
      id: 'ofc-20',
      code: 'HORM-APPEND-06',
      name: 'Cortisol (Serum Cortisol - Morning 8 AM)',
      category: 'Hormones & Tumor Markers',
      sampleType: 'Serum',
      units: 'µg/dL',
      refRangeMale: '5.0 - 25.0 (8 AM)',
      refRangeFemale: '5.0 - 25.0 (8 AM)',
      refRangeChild: '5.0 - 25.0 (8 AM)',
      conditions: 'Morning blood drawn strictly between 7:30 AM and 8:30 AM. Patient must rest quietly for 20-30 minutes before blood draw.',
      basePrice: 15000,
      turnaroundTime: '24 hours',
      description: 'Adrenal glucocorticoid assessment for Cushing syndrome and Addison disease.',
      resultType: 'quantitative'
    }
  ];