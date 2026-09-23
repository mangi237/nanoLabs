export interface ClinicalParameter {
    name: string;
    defaultValue: string;
    unit: string;
    normalRange: string;
    interpretation?: string;
  }
  
  export interface ClinicalTemplate {
    id: string;
    code: string;
    name: string;
    category: 'Hematology' | 'Biochemistry' | 'Serology' | 'Microbiology' | 'Parasitology' | 'Endocrinology' | 'Urinalysis' | 'Hemostasis' | 'Cardiac' | 'Immunology';
    specimen: string;
    turnaroundTime: string;
    defaultConclusion: string;
    parameters: ClinicalParameter[];
    html: string;
    analyzerTemplateText?: string;
    isCustom?: boolean;
    updatedAt?: string;
  }
  
  const buildHtmlTable = (title: string, headers: string[], rows: { param: string; result: string; unit: string; normal: string }[], conclusion: string): string => {
    const rowHtml = rows.map(r => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 6px 10px; font-weight: 600;">${r.param}</td>
        <td style="padding: 6px 10px; text-align: center; font-weight: 700; color: #0f766e;">${r.result}</td>
        <td style="padding: 6px 10px;">${r.unit}</td>
        <td style="padding: 6px 10px; color: #64748b;">${r.normal}</td>
      </tr>`).join('');
  
    return `
  <div style="margin-bottom: 8px; font-size: 13px; font-weight: bold; color: #0f172a; text-transform: uppercase;">
    ${title}
  </div>
  <table style="width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 12px; font-family: inherit;">
    <thead>
      <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
        <th style="padding: 6px 10px; font-weight: bold; color: #0f172a;">${headers[0] || 'PARAMÈTRE ANALYSÉ'}</th>
        <th style="padding: 6px 10px; font-weight: bold; color: #0f172a; text-align: center;">${headers[1] || 'RÉSULTAT'}</th>
        <th style="padding: 6px 10px; font-weight: bold; color: #0f172a;">${headers[2] || 'UNITÉ'}</th>
        <th style="padding: 6px 10px; font-weight: bold; color: #0f172a;">${headers[3] || 'VALEURS USUELLES'}</th>
      </tr>
    </thead>
    <tbody>
      ${rowHtml}
    </tbody>
  </table>
  <div style="margin-top: 14px; padding: 10px 14px; background-color: #f8fafc; border-left: 3px solid #0f766e; border-radius: 6px; font-size: 11px;">
    <strong>Conclusion Biologique :</strong> ${conclusion}
  </div>`;
  };
  
  export const INITIAL_CLINICAL_TEMPLATES: ClinicalTemplate[] = [
    // 1. Hematology - FBC
    {
      id: 'fbc',
      code: 'HEM-01',
      name: 'Complete Blood Count (NFS / Hémogramme)',
      category: 'Hematology',
      specimen: 'Sang total sur EDTA (Tube Violet)',
      turnaroundTime: '1 hour',
      defaultConclusion: 'Hémogramme d\'aspect normocytaire normochrome équilibré. Absence d\'anémie. Formule leucocytaire sans anomalie quantitative ni qualitative. Plaquettes satisfaisantes.',
      parameters: [
        { name: 'Hémoglobine (Hb)', defaultValue: '13.6', unit: 'g/dL', normalRange: '12.0 - 16.0' },
        { name: 'Hématocrite (Ht)', defaultValue: '41.2', unit: '%', normalRange: '37.0 - 48.0' },
        { name: 'Globules Rouges (Hématies)', defaultValue: '4.65', unit: 'M/µL', normalRange: '4.00 - 5.40' },
        { name: 'VGM', defaultValue: '88.6', unit: 'fL', normalRange: '80.0 - 98.0' },
        { name: 'TCMH', defaultValue: '29.2', unit: 'pg', normalRange: '27.0 - 33.0' },
        { name: 'CCMH', defaultValue: '33.0', unit: 'g/dL', normalRange: '32.0 - 36.0' },
        { name: 'Globules Blancs (Leucocytes)', defaultValue: '6,800', unit: '/mm³', normalRange: '4,000 - 10,000' },
        { name: 'Polynucléaires Neutrophiles', defaultValue: '58 % (3,944)', unit: '%', normalRange: '40 - 75 % (2000 - 7500)' },
        { name: 'Lymphocytes', defaultValue: '32 % (2,176)', unit: '%', normalRange: '20 - 45 % (1000 - 4000)' },
        { name: 'Monocytes', defaultValue: '6 % (408)', unit: '%', normalRange: '2 - 10 % (200 - 1000)' },
        { name: 'Polynucléaires Éosinophiles', defaultValue: '3 % (204)', unit: '%', normalRange: '1 - 5 % (40 - 500)' },
        { name: 'Plaquettes Sanguines', defaultValue: '265,000', unit: '/mm³', normalRange: '150,000 - 450,000' }
      ],
      html: buildHtmlTable(
        'HÉMOGRAMME COMPLET (NFS Automatisée 5 Populations)',
        ['PARAMÈTRE ANALYSÉ', 'RÉSULTAT', 'UNITÉ', 'VALEURS USUELLES'],
        [
          { param: 'Hémoglobine (Hb)', result: '13.6', unit: 'g/dL', normal: '12.0 - 16.0' },
          { param: 'Hématocrite (Ht)', result: '41.2', unit: '%', normal: '37.0 - 48.0' },
          { param: 'Globules Rouges (Hématies)', result: '4.65', unit: 'M/µL', normal: '4.00 - 5.40' },
          { param: 'VGM (Volume Globulaire Moyen)', result: '88.6', unit: 'fL', normal: '80.0 - 98.0' },
          { param: 'TCMH', result: '29.2', unit: 'pg', normal: '27.0 - 33.0' },
          { param: 'CCMH', result: '33.0', unit: 'g/dL', normal: '32.0 - 36.0' },
          { param: 'Globules Blancs (Leucocytes)', result: '6,800', unit: '/mm³', normal: '4,000 - 10,000' },
          { param: '- Polynucléaires Neutrophiles', result: '58 % (3,944 /mm³)', unit: '%', normal: '40 - 75 % (2000 - 7500)' },
          { param: '- Lymphocytes', result: '32 % (2,176 /mm³)', unit: '%', normal: '20 - 45 % (1000 - 4000)' },
          { param: '- Monocytes', result: '6 % (408 /mm³)', unit: '%', normal: '2 - 10 % (200 - 1000)' },
          { param: '- Polynucléaires Éosinophiles', result: '3 % (204 /mm³)', unit: '%', normal: '1 - 5 % (40 - 500)' },
          { param: 'Plaquettes Sanguines', result: '265,000', unit: '/mm³', normal: '150,000 - 450,000' }
        ],
        'Hémogramme d\'aspect normocytaire normochrome équilibré. Absence d\'anémie. Formule leucocytaire sans anomalie quantitative ni qualitative. Plaquettes satisfaisantes.'
      )
    },
  
    // 2. Serology - Widal & Felix
    {
      id: 'widal',
      code: 'SER-01',
      name: 'Widal & Félix Serodiagnosis (Fièvre Typhoïde)',
      category: 'Serology',
      specimen: 'Sérum (Tube Sec Rouge / Jaune)',
      turnaroundTime: '2 hours',
      defaultConclusion: 'Sérologie Widal et Félix en faveur de l\'absence d\'infection typhique ou paratyphique active récente. Titres inférieurs aux seuils pathologiques en zone d\'endémie.',
      parameters: [
        { name: 'Salmonella typhi O (Somatique)', defaultValue: '1/40', unit: 'Titre', normalRange: '< 1/160' },
        { name: 'Salmonella typhi H (Flagellaire)', defaultValue: '1/80', unit: 'Titre', normalRange: '< 1/160' },
        { name: 'Salmonella paratyphi A', defaultValue: 'Négatif (< 1/20)', unit: 'Titre', normalRange: '< 1/80' },
        { name: 'Salmonella paratyphi B', defaultValue: 'Négatif (< 1/20)', unit: 'Titre', normalRange: '< 1/80' }
      ],
      html: buildHtmlTable(
        'SÉRODIAGNOSTIC DE WIDAL ET FÉLIX (Agglutination en micro-plaque)',
        ['ANTIGÈNES TESTÉS', 'TITRE OBSERVÉ', 'SEUIL SIGNIFICATIF', 'VALEUR DE RÉFÉRENCE'],
        [
          { param: 'Salmonella typhi O (Somatic)', result: '1/40', unit: 'Titre', normal: 'Seuil : ≥ 1/160' },
          { param: 'Salmonella typhi H (Flagellar)', result: '1/80', unit: 'Titre', normal: 'Seuil : ≥ 1/160' },
          { param: 'Salmonella paratyphi A (O / H)', result: 'Négatif (< 1/20)', unit: 'Titre', normal: 'Seuil : ≥ 1/80' },
          { param: 'Salmonella paratyphi B (O / H)', result: 'Négatif (< 1/20)', unit: 'Titre', normal: 'Seuil : ≥ 1/80' }
        ],
        'Sérologie Widal et Félix en faveur de l\'absence d\'infection typhique ou paratyphique évolutive récente. Titres inférieurs aux seuils pathologiques en zone d\'endémie.'
      )
    },
  
    // 3. Biochemistry - Lipid Profile
    {
      id: 'lipid',
      code: 'BIO-01',
      name: 'Lipid Profile (Bilan Lipidique Complet)',
      category: 'Biochemistry',
      specimen: 'Sérum à jeun 12h (Tube Sec ou Hépariné)',
      turnaroundTime: '2 hours',
      defaultConclusion: 'Bilan lipidique équilibré. Paramètres dans les limites de référence. Risque athérogène bas.',
      parameters: [
        { name: 'Cholestérol Total', defaultValue: '1.84', unit: 'g/L', normalRange: '< 2.00 g/L (5.2 mmol/L)' },
        { name: 'Triglycérides', defaultValue: '1.12', unit: 'g/L', normalRange: '< 1.50 g/L (1.7 mmol/L)' },
        { name: 'HDL-Cholestérol', defaultValue: '0.58', unit: 'g/L', normalRange: '> 0.40 g/L (H) / > 0.50 (F)' },
        { name: 'LDL-Cholestérol (Friedewald)', defaultValue: '1.04', unit: 'g/L', normalRange: '< 1.30 g/L' },
        { name: 'Rapport Cholestérol Total / HDL', defaultValue: '3.17', unit: 'Indice', normalRange: '< 4.50' }
      ],
      html: buildHtmlTable(
        'BILAN LIPIDIQUE COMPLET (Enzymatique Colorimétrique)',
        ['FRACTION LIPIDIQUE', 'RÉSULTAT', 'UNITÉ', 'CIBLE THÉRAPEUTIQUE'],
        [
          { param: 'Cholestérol Total', result: '1.84', unit: 'g/L (4.75 mmol/L)', normal: '< 2.00 g/L' },
          { param: 'Triglycérides', result: '1.12', unit: 'g/L (1.27 mmol/L)', normal: '< 1.50 g/L' },
          { param: 'HDL-Cholestérol ("Bon")', result: '0.58', unit: 'g/L (1.50 mmol/L)', normal: '> 0.40 g/L (H) / > 0.50 g/L (F)' },
          { param: 'LDL-Cholestérol (Calcul Friedewald)', result: '1.04', unit: 'g/L (2.69 mmol/L)', normal: '< 1.30 g/L' },
          { param: 'Rapport Cholestérol Total / HDL', result: '3.17', unit: 'Indice', normal: '< 4.50 (Faible risque)' }
        ],
        'Bilan lipidique équilibré. Paramètres dans les limites de référence. Risque athérogène bas.'
      )
    },
  
    // 4. Parasitology - Malaria Search
    {
      id: 'malaria',
      code: 'PAR-01',
      name: 'Malaria Search (Goutte Épaisse & Frottis)',
      category: 'Parasitology',
      specimen: 'Sang capillaire ou EDTA',
      turnaroundTime: '45 minutes',
      defaultConclusion: 'Absence d\'hématozoaires de paludisme sur l\'ensemble des 200 champs microscopiques examinés.',
      parameters: [
        { name: 'Goutte Épaisse (Giemsa)', defaultValue: 'NÉGATIVE', unit: 'Examen', normalRange: 'Absence d\'hématozoaires' },
        { name: 'Frottis Sanguin Mince', defaultValue: 'Absence de trophozoïtes', unit: 'Examen', normalRange: 'Négatif' },
        { name: 'Densité Parasitaire', defaultValue: '0', unit: 'parasites/µL', normalRange: '0 parasite / µL' },
        { name: 'TDR Paludisme (Pf/Pan)', defaultValue: 'NÉGATIF', unit: 'Immunochromatographie', normalRange: 'Négatif' }
      ],
      html: buildHtmlTable(
        'RECHERCHE DE PALUDISME (Goutte Épaisse + Frottis Giemsa)',
        ['EXAMEN MICROSCOPIQUE', 'RÉSULTAT', 'MÉTHODE', 'VALEUR DE RÉFÉRENCE'],
        [
          { param: 'Goutte Épaisse (Coloration Giemsa)', result: 'NÉGATIVE', unit: 'Microscopie x1000', normal: 'Absence d\'hématozoaires' },
          { param: 'Frottis Sanguin Mince', result: 'Absence de Plasmodium', unit: 'Différenciation d\'espèces', normal: 'Négatif' },
          { param: 'Densité Parasitaire', result: '0 parasite / µL de sang', unit: 'Numération absolue', normal: '0 parasite / µL' },
          { param: 'Test de Diagnostic Rapide (TDR Pf/Pan)', result: 'NÉGATIF', unit: 'Antigène HRP2/pLDH', normal: 'Négatif' }
        ],
        'Absence d\'hématozoaires de paludisme sur l\'ensemble des 200 champs microscopiques examinés.'
      )
    },
  
    // 5. Microbiology - Urinalysis / ECBU
    {
      id: 'urinalysis',
      code: 'MIC-01',
      name: 'Urinalysis & Culture (ECBU Complet)',
      category: 'Microbiology',
      specimen: 'Urine du matin mi-jet stérile',
      turnaroundTime: '24 - 48 hours',
      defaultConclusion: 'ECBU stérile. Absence de leucocyturie significative ni de bactériurie. Flore normale.',
      parameters: [
        { name: 'Leucocytes urinaires', defaultValue: '3,000', unit: '/mL (3 /mm³)', normalRange: '< 10,000 /mL' },
        { name: 'Hématies urinaires', defaultValue: '1,500', unit: '/mL (1 /mm³)', normalRange: '< 10,000 /mL' },
        { name: 'Cellules Épithéliales', defaultValue: 'Quelques', unit: 'Champ', normalRange: 'Rares' },
        { name: 'Cylindres / Cristaux', defaultValue: 'Absence', unit: 'Champ', normalRange: 'Absence' },
        { name: 'Coloration de Gram', defaultValue: 'Absence de germe', unit: 'Examen direct', normalRange: 'Absence' },
        { name: 'Culture à 37°C', defaultValue: 'STÉRILE (< 10³ UFC/mL)', unit: 'UFC/mL', normalRange: '< 10³ UFC/mL' }
      ],
      html: buildHtmlTable(
        'EXAMEN CYTOBACTÉRIOLOGIQUE DES URINES (ECBU)',
        ['PARAMÈTRE CYTOLOGIQUE & BACTÉRIOLOGIQUE', 'RÉSULTAT', 'UNITÉ', 'VALEURS NORMALES'],
        [
          { param: 'Leucocytes', result: '3,000 / mL (3 / mm³)', unit: '/mL', normal: '< 10,000 / mL' },
          { param: 'Hématies (Globules rouges)', result: '1,500 / mL (1 / mm³)', unit: '/mL', normal: '< 10,000 / mL' },
          { param: 'Cellules Épithéliales', result: 'Quelques', unit: 'Champ', normal: 'Rares ou quelques' },
          { param: 'Cylindres & Cristaux', result: 'Absence', unit: 'Champ', normal: 'Absence' },
          { param: 'Examen direct (Coloration de Gram)', result: 'Absence de germes visibles', unit: 'Direct', normal: 'Absence' },
          { param: 'Culture bactériologique (48h)', result: 'Culture STÉRILE (< 10³ UFC/mL)', unit: 'UFC/mL', normal: '< 10³ UFC/mL' }
        ],
        'ECBU stérile. Absence de leucocyturie pathologique ni de bactériurie active.'
      )
    },
  
    // 6. Biochemistry - Renal Function Panel
    {
      id: 'renal',
      code: 'BIO-02',
      name: 'Renal Function Panel (Bilan Rénal / Créatinine / Urée / DFG)',
      category: 'Biochemistry',
      specimen: 'Sérum (Tube Sec)',
      turnaroundTime: '2 hours',
      defaultConclusion: 'Fonction rénale normale avec DFG préservé. Absence de rétention azotée.',
      parameters: [
        { name: 'Créatinine Sérique', defaultValue: '8.4', unit: 'mg/L (74 µmol/L)', normalRange: '6.0 - 11.0 mg/L' },
        { name: 'DFG (CKD-EPI)', defaultValue: '98', unit: 'mL/min/1.73m²', normalRange: '> 90 mL/min' },
        { name: 'Urée Sérique', defaultValue: '0.28', unit: 'g/L (4.6 mmol/L)', normalRange: '0.15 - 0.45 g/L' },
        { name: 'Acide Urique', defaultValue: '46', unit: 'mg/L', normalRange: '25 - 60 mg/L' }
      ],
      html: buildHtmlTable(
        'BILAN FONCTIONNEL RÉNAL',
        ['PARAMÈTRE BIOLOGIQUE', 'RÉSULTAT', 'UNITÉ', 'VALEURS USUELLES'],
        [
          { param: 'Créatinine Sérique', result: '8.4', unit: 'mg/L (74 µmol/L)', normal: '6.0 - 11.0 mg/L (Homme 7-12, Femme 5-10)' },
          { param: 'Débit de Filtration Glomérulaire (DFG - CKD-EPI)', result: '98', unit: 'mL/min/1.73m²', normal: '> 90 (Fonction normale)' },
          { param: 'Urée Sérique', result: '0.28', unit: 'g/L (4.6 mmol/L)', normal: '0.15 - 0.45 g/L' },
          { param: 'Acide Urique', result: '46', unit: 'mg/L (274 µmol/L)', normal: '25 - 60 mg/L (Femme 20-50, Homme 30-70)' }
        ],
        'Fonction rénale normale avec clairance estimée optimale. Absence d\'insuffisance rénale.'
      )
    },
  
    // 7. Biochemistry - Liver Function Panel (Bilan Hépatique)
    {
      id: 'liver',
      code: 'BIO-03',
      name: 'Liver Function Panel (Bilan Hépatique / Transaminases)',
      category: 'Biochemistry',
      specimen: 'Sérum (Tube Sec)',
      turnaroundTime: '2 hours',
      defaultConclusion: 'Bilan hépatique normal. Absence de cytolyse hépatique ni de cholestase.',
      parameters: [
        { name: 'ASAT (SGOT)', defaultValue: '22', unit: 'UI/L', normalRange: '< 38 UI/L' },
        { name: 'ALAT (SGPT)', defaultValue: '26', unit: 'UI/L', normalRange: '< 41 UI/L' },
        { name: 'Gamma-GT (GGT)', defaultValue: '28', unit: 'UI/L', normalRange: '9 - 48 UI/L' },
        { name: 'Phosphatases Alcalines (PAL)', defaultValue: '68', unit: 'UI/L', normalRange: '40 - 129 UI/L' },
        { name: 'Bilirubine Totale', defaultValue: '7.2', unit: 'mg/L (12.3 µmol/L)', normalRange: '< 12.0 mg/L' },
        { name: 'Bilirubine Conjuguée (Directe)', defaultValue: '1.8', unit: 'mg/L (3.1 µmol/L)', normalRange: '< 3.0 mg/L' }
      ],
      html: buildHtmlTable(
        'BILAN HÉPATIQUE COMPLET (Cytolyse & Cholestase)',
        ['ENZYME / FRACTION HÉPATIQUE', 'RÉSULTAT', 'UNITÉ', 'VALEURS DE RÉFÉRENCE'],
        [
          { param: 'ASAT (SGOT)', result: '22', unit: 'UI/L à 37°C', normal: '< 38 UI/L (Femme < 32)' },
          { param: 'ALAT (SGPT)', result: '26', unit: 'UI/L à 37°C', normal: '< 41 UI/L (Femme < 33)' },
          { param: 'Gamma-Glutamyl Transférase (GGT)', result: '28', unit: 'UI/L', normal: '9 - 48 UI/L' },
          { param: 'Phosphatases Alcalines (PAL)', result: '68', unit: 'UI/L', normal: '40 - 129 UI/L' },
          { param: 'Bilirubine Totale', result: '7.2', unit: 'mg/L', normal: '2.0 - 12.0 mg/L' },
          { param: 'Bilirubine Directe (Conjuguée)', result: '1.8', unit: 'mg/L', normal: '< 3.0 mg/L' }
        ],
        'Absence de cytolyse hépatique (ASAT et ALAT dans les normes). Pas de signe biologique de cholestase.'
      )
    },
  
    // 8. Biochemistry - Fasting Blood Sugar & HbA1c
    {
      id: 'glucose_hba1c',
      code: 'BIO-04',
      name: 'Glycemia & HbA1c (Glycémie à jeun & Hémoglobine Glyquée)',
      category: 'Biochemistry',
      specimen: 'Plasma fluoré (Tube Gris) + Sang total EDTA',
      turnaroundTime: '2 hours',
      defaultConclusion: 'Glycémie à jeun normale. Hémoglobine glyquée satisfaisante témoignant d\'un bon équilibre glycémique trimestriel.',
      parameters: [
        { name: 'Glycémie à Jeun', defaultValue: '0.88', unit: 'g/L (4.88 mmol/L)', normalRange: '0.70 - 1.10 g/L' },
        { name: 'Hémoglobine Glyquée (HbA1c)', defaultValue: '5.4', unit: '% (DCCT/NGSP)', normalRange: '4.0 - 5.7 % (Normal)' },
        { name: 'Glycémie Moyenne Estimée (eAG)', defaultValue: '108', unit: 'mg/dL', normalRange: '< 117 mg/dL' }
      ],
      html: buildHtmlTable(
        'BILAN D\'EXPLORATION DU DIABÈTE (Glycémie & HbA1c HPLC)',
        ['PARAMÈTRE ANALYSÉ', 'RÉSULTAT', 'UNITÉ', 'SEUILS DIAGNOSTIQUES & RÉFÉRENCE'],
        [
          { param: 'Glycémie Veineuse à Jeun', result: '0.88', unit: 'g/L (4.88 mmol/L)', normal: 'Normale : 0.70 - 1.10 g/L | Diabète : ≥ 1.26 g/L' },
          { param: 'Hémoglobine Glyquée (HbA1c)', result: '5.4', unit: '% (35 mmol/mol)', normal: 'Normal : < 5.7 % | Pré-diabète : 5.7-6.4 % | Diabète : ≥ 6.5 %' },
          { param: 'Glycémie Moyenne Estimée (eAG)', result: '108', unit: 'mg/dL (1.08 g/L)', normal: '< 117 mg/dL' }
        ],
        'Profil glucidique normal. Absence d\'intolérance glucidique ou de diabète sucré.'
      )
    },
  
    // 9. Hemostasis / Coagulation - PT / INR / aPTT
    {
      id: 'coagulation',
      code: 'HEM-02',
      name: 'Coagulation Profile (TP / INR / TCA / Fibrinogène)',
      category: 'Hemostasis',
      specimen: 'Plasma citraté (Tube Bleu clair 3.2%)',
      turnaroundTime: '1 hour 30 min',
      defaultConclusion: 'Bilan d\'hémostase normal. Temps de Quick et TCA dans les limites normales. Taux de prothrombine satisfaisant.',
      parameters: [
        { name: 'Taux de Prothrombine (TP)', defaultValue: '94', unit: '%', normalRange: '70 - 100 %' },
        { name: 'INR (International Normalized Ratio)', defaultValue: '1.04', unit: 'Ratio', normalRange: '0.85 - 1.20 (Non traité)' },
        { name: 'Temps de Céphaline Activée (TCA)', defaultValue: '31.2', unit: 'secondes', normalRange: 'Témoin ± 4s (28 - 38s)' },
        { name: 'Ratio Malade / Témoin (TCA)', defaultValue: '1.02', unit: 'Ratio', normalRange: '0.85 - 1.20' },
        { name: 'Fibrinogène', defaultValue: '3.15', unit: 'g/L', normalRange: '2.00 - 4.00 g/L' }
      ],
      html: buildHtmlTable(
        'BILAN D\'HÉMOSTASE & COAGULATION (Chronométrique)',
        ['TEST DE COAGULATION', 'RÉSULTAT', 'UNITÉ', 'VALEURS DE RÉFÉRENCE'],
        [
          { param: 'Taux de Prothrombine (TP)', result: '94', unit: '%', normal: '70 - 100 %' },
          { param: 'INR', result: '1.04', unit: 'Indice', normal: '0.85 - 1.20 (Cible AVK : 2.0 - 3.0)' },
          { param: 'Temps de Céphaline Activée (TCA)', result: '31.2', unit: 'secondes (Témoin 30.5s)', normal: 'Ratio M/T < 1.20' },
          { param: 'Fibrinogène Dosé (Méthode Clauss)', result: '3.15', unit: 'g/L', normal: '2.00 - 4.00 g/L' }
        ],
        'Hémostase normale. Absence de coagulopathie constitutionnelle ou acquise décelée.'
      )
    },
  
    // 10. Serology - HIV 1/2 Combo ELISA
    {
      id: 'hiv_combo',
      code: 'SER-02',
      name: 'HIV 1/2 Antigen & Antibodies Combo (Sérodiagnostic VIH 1 & 2 4ème Génération)',
      category: 'Serology',
      specimen: 'Sérum (Tube Sec)',
      turnaroundTime: '2 hours',
      defaultConclusion: 'Sérologie VIH 1 et 2 NÉGATIVE (Absence d\'anticorps anti-VIH 1/2 et absence d\'antigène p24).',
      parameters: [
        { name: 'VIH 1/2 Combo (Ac anti-VIH1/2 + Ag p24)', defaultValue: 'NÉGATIF (Ratio : 0.12)', unit: 'Électrochimiluminescence', normalRange: 'Ratio < 0.90 Négatif' },
        { name: 'TDR Confirmation (Determine / Stat-Pak)', defaultValue: 'NÉGATIF', unit: 'Immunochromatographie', normalRange: 'Négatif' }
      ],
      html: buildHtmlTable(
        'DÉPISTAGE SÉROLOGIQUE DU VIH 1 ET 2 (Test Combiné Ag p24 + Ac 4ème Génération)',
        ['ANALYSE SÉROLOGIQUE', 'RÉSULTAT', 'MÉTHODOLOGIE', 'INTERPRÉTATION & VALEURS USUELLES'],
        [
          { param: 'Antigène p24 + Anticorps Anti-VIH 1 et 2', result: 'NÉGATIF (Index : 0.14)', unit: 'CMIA / Chemiluminescence', normal: 'Négatif si Index < 0.90 | Douteux : 0.90-1.00 | Positif : ≥ 1.00' },
          { param: 'Test Rapide Discriminatif (Algorithme National)', result: 'NON RÉACTIF', unit: 'Test Rapide Déterminatif', normal: 'Négatif' }
        ],
        'Absence d\'infection par le VIH décelable à ce jour. Respecter la fenêtre sérologique de 6 semaines en cas d\'exposition récente.'
      )
    },
  
    // 11. Serology - Hepatitis B (HBsAg & Markers)
    {
      id: 'hepatitis_b',
      code: 'SER-03',
      name: 'Hepatitis B Surface Antigen (Ag HBs & Profil Sérologique VHB)',
      category: 'Serology',
      specimen: 'Sérum (Tube Sec)',
      turnaroundTime: '2 hours',
      defaultConclusion: 'Ag HBs NÉGATIF. Absence de portage de l\'antigène de surface du virus de l\'hépatite B.',
      parameters: [
        { name: 'Antigène HBs (Ag HBs)', defaultValue: 'NÉGATIF (0.18 UI/mL)', unit: 'UI/mL', normalRange: '< 0.05 UI/mL (Négatif)' },
        { name: 'Anticorps anti-HBs (Titre protecteur)', defaultValue: '142.5', unit: 'mUI/mL', normalRange: '> 10 mUI/mL (Immunité protectrice post-vaccinale)' }
      ],
      html: buildHtmlTable(
        'DÉPISTAGE DE L\'HÉPATITE VIRALE B (Ag HBs & Ac Anti-HBs)',
        ['MARQUEUR SÉROLOGIQUE VHB', 'RÉSULTAT', 'UNITÉ / TECHNIQUE', 'INTERPRÉTATION BIOLOGIQUE'],
        [
          { param: 'Antigène HBs (HBsAg Qualitatif & Quantitatif)', result: 'NÉGATIF (Index 0.18)', unit: 'Chemiluminescence CLIA', normal: 'Négatif (Index < 0.90)' },
          { param: 'Anticorps anti-HBs (Titre Sérologique)', result: '142.5', unit: 'mUI/mL', normal: '> 10 mUI/mL : Titre protecteur (Sujet immunisé / vacciné)' }
        ],
        'Ag HBs négatif. Présence d\'anticorps anti-HBs protecteurs en faveur d\'une bonne immunité vaccinale efficace.'
      )
    },
  
    // 12. Serology - Hepatitis C (Anti-HCV)
    {
      id: 'hepatitis_c',
      code: 'SER-04',
      name: 'Hepatitis C Antibodies (Sérologie de l\'Hépatite C - Ac Anti-VHC)',
      category: 'Serology',
      specimen: 'Sérum (Tube Sec)',
      turnaroundTime: '2 hours',
      defaultConclusion: 'Sérologie VHC NÉGATIVE. Absence d\'anticorps détectables contre le virus de l\'hépatite C.',
      parameters: [
        { name: 'Anticorps anti-VHC (HCV Ab)', defaultValue: 'NÉGATIF (Index 0.08)', unit: 'Index', normalRange: '< 0.90 Négatif' }
      ],
      html: buildHtmlTable(
        'SÉROLOGIE DU VIRUS DE L\'HÉPATITE C (Ac Anti-VHC 3ème Génération)',
        ['TEST SÉROLOGIQUE', 'RÉSULTAT', 'MÉTHODE', 'SEUIL D\'INTERPRÉTATION'],
        [
          { param: 'Anticorps Totaux Anti-VHC (IgG + IgM)', result: 'NÉGATIF (Ratio 0.08)', unit: 'ELISA / CLIA', normal: 'Index < 0.90 : Négatif | ≥ 1.00 : Positif' }
        ],
        'Sérologie VHC négative. Pas d\'argument biologique en faveur d\'un contact avec le virus de l\'hépatite C.'
      )
    },
  
    // 13. Serology - Syphilis (VDRL / TPHA)
    {
      id: 'syphilis',
      code: 'SER-05',
      name: 'Syphilis Serology (VDRL & TPHA / Treponema Pallidum)',
      category: 'Serology',
      specimen: 'Sérum (Tube Sec)',
      turnaroundTime: '2 hours',
      defaultConclusion: 'Sérologie tréponémique NÉGATIVE (VDRL Négatif, TPHA Négatif). Absence de tréponématose active ou guérie.',
      parameters: [
        { name: 'VDRL / RPR', defaultValue: 'NÉGATIF', unit: 'Agglutination au charbon', normalRange: 'Négatif' },
        { name: 'TPHA (Hémagglutination)', defaultValue: 'NÉGATIF (< 1/80)', unit: 'Titre', normalRange: '< 1/80 (Négatif)' }
      ],
      html: buildHtmlTable(
        'SÉROLOGIE DE LA SYPHILIS (Association VDRL / RPR et TPHA)',
        ['RÉACTION SÉROLOGIQUE', 'RÉSULTAT', 'UNITÉ / DILUTION', 'VALEUR DE RÉFÉRENCE'],
        [
          { param: 'VDRL (Réaction réaginique non tréponémique)', result: 'NÉGATIF', unit: 'Cardiolipide / Charbon', normal: 'Négatif' },
          { param: 'TPHA (Hémagglutination tréponémique spécifique)', result: 'NÉGATIF (< 1/80)', unit: 'Titre d\'agglutination', normal: '< 1/80 (Non réactif)' }
        ],
        'Sérologie de la syphilis négative. Absence d\'infection tréponémique.'
      )
    },
  
    // 14. Biochemistry - Electrolytes Panel (Ionogramme Sanguin)
    {
      id: 'electrolytes',
      code: 'BIO-05',
      name: 'Electrolytes Panel (Ionogramme Sanguin Na / K / Cl / Ca / Bicarbonates)',
      category: 'Biochemistry',
      specimen: 'Sérum ou Plasma hépariné',
      turnaroundTime: '1 hour 30 min',
      defaultConclusion: 'Ionogramme sanguin équilibré. Absence de trouble hydro-électrolytique.',
      parameters: [
        { name: 'Sodium (Na+)', defaultValue: '141', unit: 'mmol/L (mEq/L)', normalRange: '136 - 145 mmol/L' },
        { name: 'Potassium (K+)', defaultValue: '4.2', unit: 'mmol/L', normalRange: '3.5 - 5.1 mmol/L' },
        { name: 'Chlorures (Cl-)', defaultValue: '103', unit: 'mmol/L', normalRange: '98 - 107 mmol/L' },
        { name: 'Calcium Total', defaultValue: '96', unit: 'mg/L (2.40 mmol/L)', normalRange: '88 - 104 mg/L' },
        { name: 'Bicarbonates (CO2 Total)', defaultValue: '25', unit: 'mmol/L', normalRange: '22 - 29 mmol/L' },
        { name: 'Trou Anionique', defaultValue: '13', unit: 'mmol/L', normalRange: '8 - 16 mmol/L' }
      ],
      html: buildHtmlTable(
        'IONOGRAMME SANGUIN COMPLET (Électrode Sélective ISE)',
        ['ÉLECTROLYTE ANALYSÉ', 'RÉSULTAT', 'UNITÉ', 'INTERVALLE DE RÉFÉRENCE'],
        [
          { param: 'Sodium Sérique (Na+)', result: '141', unit: 'mmol/L', normal: '136 - 145 mmol/L' },
          { param: 'Potassium Sérique (K+)', result: '4.2', unit: 'mmol/L', normal: '3.5 - 5.1 mmol/L' },
          { param: 'Chlorures (Cl-)', result: '103', unit: 'mmol/L', normal: '98 - 107 mmol/L' },
          { param: 'Calcium Sérique Total', result: '96', unit: 'mg/L (2.40 mmol/L)', normal: '88 - 104 mg/L (2.20 - 2.60 mmol/L)' },
          { param: 'Bicarbonates / Réserve Alcaline', result: '25', unit: 'mmol/L', normal: '22 - 29 mmol/L' },
          { param: 'Trou Anionique Plasmatique', result: '13', unit: 'mmol/L', normal: '8 - 16 mmol/L' }
        ],
        'Équilibre hydro-électrolytique et acido-basique conservé.'
      )
    },
  
    // 15. Biochemistry - CRP Quantitative (Protéine C-Réactive)
    {
      id: 'crp',
      code: 'BIO-06',
      name: 'C-Reactive Protein (CRP Quantitative Ultra-Sensible)',
      category: 'Biochemistry',
      specimen: 'Sérum (Tube Sec)',
      turnaroundTime: '1 hour',
      defaultConclusion: 'CRP normale (< 6.0 mg/L). Absence de syndrome inflammatoire biologique aigu.',
      parameters: [
        { name: 'Protéine C-Réactive (CRP)', defaultValue: '2.4', unit: 'mg/L', normalRange: '< 6.0 mg/L' }
      ],
      html: buildHtmlTable(
        'DOSAGE QUANTITATIF DE LA PROTÉINE C-RÉACTIVE (Immunoturbidimétrie)',
        ['PARAMÈTRE INFLAMMATOIRE', 'RÉSULTAT', 'UNITÉ', 'VALEUR UScontainerUELLE'],
        [
          { param: 'Protéine C-Réactive (CRP Ultra-Sensible)', result: '2.4', unit: 'mg/L', normal: '< 6.0 mg/L (Absence de syndrome inflammatoire)' }
        ],
        'CRP dans les limites de la normale. Pas de syndrome inflammatoire biologique évolutif.'
      )
    },
  
    // 16. Hematology - Erythrocyte Sedimentation Rate (VS)
    {
      id: 'esr',
      code: 'HEM-03',
      name: 'Erythrocyte Sedimentation Rate (VS / Vitesse de Sédimentation)',
      category: 'Hematology',
      specimen: 'Sang citraté (Tube Noir 4:1)',
      turnaroundTime: '2 hours',
      defaultConclusion: 'Vitesse de sédimentation normale. Absence d\'inflammation infraclinique.',
      parameters: [
        { name: '1ère Heure', defaultValue: '8', unit: 'mm', normalRange: '< 15 mm (Homme) / < 20 mm (Femme)' },
        { name: '2ème Heure', defaultValue: '18', unit: 'mm', normalRange: '< 30 mm' },
        { name: 'Indice de Katz', defaultValue: '8.5', unit: 'Indice', normalRange: '< 12' }
      ],
      html: buildHtmlTable(
        'VITESSE DE SÉDIMENTATION DES HÉMATIES (Méthode Westergren)',
        ['PÉRIODE DE MESURE', 'RÉSULTAT', 'UNITÉ', 'VALEURS DE RÉFÉRENCE'],
        [
          { param: 'Vitesse de Sédimentation - 1ère Heure', result: '8', unit: 'mm', normal: 'Homme : 2 - 15 mm | Femme : 3 - 20 mm' },
          { param: 'Vitesse de Sédimentation - 2ème Heure', result: '18', unit: 'mm', normal: '< 30 mm' },
          { param: 'Indice de Katz ((1h + 2h/2)/2)', result: '8.5', unit: 'Indice', normal: '< 12' }
        ],
        'Vitesse de sédimentation normale.'
      )
    },
  
    // 17. Endocrinology - Thyroid Panel (TSH / FT4 / FT3)
    {
      id: 'thyroid',
      code: 'END-01',
      name: 'Thyroid Function Panel (Bilan Thyroïdien TSH & FT4 & FT3)',
      category: 'Endocrinology',
      specimen: 'Sérum (Tube Sec)',
      turnaroundTime: '3 hours',
      defaultConclusion: 'Euthyroïdie biologique. TSH et fractions libres d\'hormones thyroïdiennes normales.',
      parameters: [
        { name: 'TSH Ultra-Sensible (3ème Génération)', defaultValue: '1.85', unit: 'µUI/mL (mUI/L)', normalRange: '0.35 - 4.50 µUI/mL' },
        { name: 'T4 Libre (FT4)', defaultValue: '14.2', unit: 'pmol/L (1.10 ng/dL)', normalRange: '10.5 - 22.0 pmol/L' },
        { name: 'T3 Libre (FT3)', defaultValue: '4.8', unit: 'pmol/L', normalRange: '3.1 - 6.8 pmol/L' }
      ],
      html: buildHtmlTable(
        'BILAN D\'EXPLORATION THYROÏDIENNE (Chemiluminescence CLIA)',
        ['HORMONE THYROÏDIENNE', 'RÉSULTAT', 'UNITÉ', 'INTERVALLE DE RÉFÉRENCE'],
        [
          { param: 'TSH Ultra-Sensible (Thyroid Stimulating Hormone)', result: '1.85', unit: 'µUI/mL', normal: '0.35 - 4.50 µUI/mL' },
          { param: 'T4 Libre (Thyroxine Libre / FT4)', result: '14.2', unit: 'pmol/L (1.10 ng/dL)', normal: '10.5 - 22.0 pmol/L' },
          { param: 'T3 Libre (Triiodothyronine Libre / FT3)', result: '4.8', unit: 'pmol/L', normal: '3.1 - 6.8 pmol/L' }
        ],
        'Fonction thyroïdienne biologiquement normale (euthyroïdie).'
      )
    },
  
    // 18. Endocrinology - Beta-hCG (Diagnostic de Grossesse)
    {
      id: 'bhcg',
      code: 'END-02',
      name: 'Beta-hCG Quantitative (Dosage de la Bêta-hCG Sérique)',
      category: 'Endocrinology',
      specimen: 'Sérum (Tube Sec)',
      turnaroundTime: '1 hour 30 min',
      defaultConclusion: 'Bêta-hCG négative (< 2.0 UI/L) en faveur de l\'absence de grossesse évolutive.',
      parameters: [
        { name: 'Bêta-hCG Sérique Totale', defaultValue: '< 2.0', unit: 'UI/L (mUI/mL)', normalRange: '< 5.0 UI/L (Non enceinte)' }
      ],
      html: buildHtmlTable(
        'DOSAGE QUANTITATIF DE LA BÊTA-hCG PLASMATIQUE',
        ['MARQUEUR DE GROSSESSE', 'RÉSULTAT', 'UNITÉ', 'SEUILS & CINÉTIQUE GESTATIONNELLE'],
        [
          { param: 'Bêta-hCG Plasmatique', result: '< 2.0', unit: 'UI/L (mUI/mL)', normal: 'Non enceinte : < 5.0 UI/L | 3-4 SA : 9-130 | 4-5 SA : 75-2600 | 5-6 SA : 850-20800' }
        ],
        'Taux sérique de Bêta-hCG inférieur au seuil de positivité. Absence de grossesse en cours.'
      )
    },
  
    // 19. Endocrinology - PSA Total & Libre (Bilan Prostatique)
    {
      id: 'psa',
      code: 'END-03',
      name: 'PSA Total & Free (Antigène Spécifique de la Prostate)',
      category: 'Endocrinology',
      specimen: 'Sérum (Tube Sec)',
      turnaroundTime: '2 hours',
      defaultConclusion: 'Taux de PSA Total normal (< 4.0 ng/mL). Rapport PSA Libre / Total satisfaisant.',
      parameters: [
        { name: 'PSA Total', defaultValue: '1.24', unit: 'ng/mL (µg/L)', normalRange: '< 4.00 ng/mL' },
        { name: 'PSA Libre', defaultValue: '0.36', unit: 'ng/mL', normalRange: 'Variable' },
        { name: 'Rapport PSA Libre / PSA Total', defaultValue: '29', unit: '%', normalRange: '> 15 % (Faible risque)' }
      ],
      html: buildHtmlTable(
        'MARQUEURS PROSTATIQUES : PSA TOTAL & LIBRE (Électrochimiluminescence ECLIA)',
        ['PARAMÈTRE PROSTATIQUE', 'RÉSULTAT', 'UNITÉ', 'VALEURS USUELLES & RISQUE'],
        [
          { param: 'PSA Total (Prostate Specific Antigen)', result: '1.24', unit: 'ng/mL', normal: '< 4.00 ng/mL (Tranche 40-49 ans : < 2.5 ; 50-59 ans : < 3.5)' },
          { param: 'PSA Libre', result: '0.36', unit: 'ng/mL', normal: '-' },
          { param: 'Rapport PSA Libre / Total', result: '29', unit: '%', normal: '> 15 % : en faveur d\'une hypertrophie bénigne ou tissu sain' }
        ],
        'Taux de PSA Total physiologique sans suspicion biologique d\'affection prostatique maligne.'
      )
    },
  
    // 20. Parasitology - Stool Examination (Coprologie Parasitaire)
    {
      id: 'stool',
      code: 'PAR-02',
      name: 'Stool Parasitology (Examen Parasitologique des Selles)',
      category: 'Parasitology',
      specimen: 'Selles fraîches (Flacon stérile)',
      turnaroundTime: '2 hours',
      defaultConclusion: 'Examen coprologique négatif. Absence de kystes, d\'œufs ou de formes végétatives de protozoaires ou helminthes.',
      parameters: [
        { name: 'Aspect macroscopique', defaultValue: 'Consistance normale, moulée, couleur brune, sans glaire ni sang', unit: 'Visuel', normalRange: 'Moulée, brune' },
        { name: 'Examen direct au sérum physiologique', defaultValue: 'Absence de parasites mobiles', unit: 'Microscopie x400', normalRange: 'Absence' },
        { name: 'Examen après coloration au Lugol', defaultValue: 'Absence de kystes amibiens', unit: 'Microscopie', normalRange: 'Absence' },
        { name: 'Technique d\'enrichissement (Ritchie / Telemann)', defaultValue: 'Absence d\'œufs d\'helminthes', unit: 'Concentration', normalRange: 'Absence' }
      ],
      html: buildHtmlTable(
        'EXAMEN PARASITOLOGIQUE DES SELLES (EPS)',
        ['ÉLÉMENT PARASITAIRE RECHERCHÉ', 'RÉSULTAT', 'TECHNIQUE', 'VALEUR NORMALE'],
        [
          { param: 'Aspect Macro et Consistance', result: 'Moulée, homogène, brun franc', unit: 'Macroscopique', normal: 'Normal, sans glaire' },
          { param: 'Protozoaires (Kystes & Trophozoïtes)', result: 'Absence d\'Entamoeba histolytica ni Giardia lamblia', unit: 'Examen direct & Lugol', normal: 'Absence' },
          { param: 'Helminthes (Œufs & Larves)', result: 'Absence d\'Ascaris, Ankylostomes, Trichuris', unit: 'Méthode de Ritchie', normal: 'Absence' },
          { param: 'Hématies & Leucocytes fécaux', result: 'Absence', unit: 'Microscopie', normal: 'Absence' }
        ],
        'Coprologie parasitaire sans anomalie. Absence de parasitisme intestinal décelé.'
      )
    },
  
    // 21. Microbiology - Vaginal Swab (Prélèvement Vaginal / PV)
    {
      id: 'vaginal_swab',
      code: 'MIC-02',
      name: 'Vaginal Swab Culture & Smear (Prélèvement Vaginal / PV)',
      category: 'Microbiology',
      specimen: 'Écouvillon endocervical & vaginal',
      turnaroundTime: '24 - 48 hours',
      defaultConclusion: 'Flore vaginale de Döderlein équilibrée (Score de Nugent 0-3). Absence de Trichomonas, de levures ou de vaginite bactérienne.',
      parameters: [
        { name: 'Cellules épithéliales', defaultValue: 'Nombreuses', unit: 'Champ', normalRange: 'Présentes' },
        { name: 'Leucocytes', defaultValue: 'Rares (< 5/champ)', unit: 'Champ', normalRange: 'Rares' },
        { name: 'Trichomonas vaginalis', defaultValue: 'Absence', unit: 'État frais', normalRange: 'Absence' },
        { name: 'Levures (Candida albicans)', defaultValue: 'Absence de spores ni pseudo-filaments', unit: 'État frais / Gram', normalRange: 'Absence' },
        { name: 'Clue Cells', defaultValue: 'Absence', unit: 'Gram', normalRange: 'Absence' },
        { name: 'Flore bactérienne', defaultValue: 'Bacilles de Döderlein abondants (Lactobacillus)', unit: 'Score de Nugent', normalRange: 'Flore normale Stade I' },
        { name: 'Culture à 37°C', defaultValue: 'Absence de germe pathogène (Streptocoque B, Gardnerella, etc.)', unit: 'Milieux sélectifs', normalRange: 'Absence de pathogènes' }
      ],
      html: buildHtmlTable(
        'PRÉLÈVEMENT GÉNITAL VAGINAL (Examen Direct & Culture)',
        ['EXAMEN BACTÉRIOLOGIQUE & MYCOLOGIQUE', 'RÉSULTAT', 'MÉTHODE', 'VALEUR DE RÉFÉRENCE'],
        [
          { param: 'Examen à l\'état frais', result: 'Absence de Trichomonas vaginalis mobiles', unit: 'Microscopie', normal: 'Négatif' },
          { param: 'Examen direct après Gram (Flore de Döderlein)', result: 'Score de Nugent : 2 (Flore normale équilibrée)', unit: 'Score de Nugent', normal: 'Score 0 à 3 (Normal)' },
          { param: 'Recherche de Clue-cells & Gardnerella', result: 'Absence de clue cells', unit: 'Gram', normal: 'Absence' },
          { param: 'Recherche de levures (Candida)', result: 'Absence de blastospores et de pseudomycélium', unit: 'Gram / Sabouraud', normal: 'Absence' },
          { param: 'Culture bactérienne (48h)', result: 'Culture stérile en germes pathogènes opportunistes', unit: 'Milieux usuels', normal: 'Absence de pathogène' }
        ],
        'Flore vaginale normale et équilibrée dominée par les bacilles de Döderlein. Absence de vaginite ou de vaginose.'
      )
    },
  
    // 22. Cardiac - Troponin I & CK-MB
    {
      id: 'cardiac_enzymes',
      code: 'BIO-07',
      name: 'Cardiac Markers (Troponine I Ultra-Sensible & CK-MB)',
      category: 'Cardiac',
      specimen: 'Plasma hépariné ou Sérum',
      turnaroundTime: '45 minutes',
      defaultConclusion: 'Troponine I ultra-sensible normale (< 14 ng/L). Absence d\'argument biologique pour une nécrose myocardique aiguë récente.',
      parameters: [
        { name: 'Troponine I Ultra-Sensible (hs-cTnI)', defaultValue: '3.8', unit: 'ng/L (pg/mL)', normalRange: '< 14 ng/L (99e percentile)' },
        { name: 'CK-MB (Fraction myocardique)', defaultValue: '12', unit: 'UI/L', normalRange: '< 24 UI/L' },
        { name: 'CPK Totale (Créatine Phosphokinase)', defaultValue: '84', unit: 'UI/L', normalRange: '38 - 174 UI/L' }
      ],
      html: buildHtmlTable(
        'MARQUEURS DE NÉCROSE MYOCARDIQUE D\'URGENCE',
        ['MARQUEUR CARDIAQUE', 'RÉSULTAT', 'UNITÉ', 'SEUIL DÉCISIONNEL & NORMALES'],
        [
          { param: 'Troponine I Ultra-Sensible (hs-TnI)', result: '3.8', unit: 'ng/L (pg/mL)', normal: '< 14 ng/L (Femme < 11, Homme < 16)' },
          { param: 'Créatine Kinase MB (CK-MB Masse)', result: '12', unit: 'UI/L', normal: '< 24 UI/L (< 5 ng/mL)' },
          { param: 'Créatine Phosphokinase Totale (CPK)', result: '84', unit: 'UI/L', normal: '38 - 174 UI/L' }
        ],
        'Marqueurs de nécrose myocardique négatifs. Absence d\'élévation pathologique de la troponine.'
      )
    },
  
    // 23. Hematology - Hemoglobin Electrophoresis (Électrophorèse de l'Hémoglobine)
    {
      id: 'hb_electrophoresis',
      code: 'HEM-04',
      name: 'Hemoglobin Electrophoresis (Électrophorèse de l\'Hémoglobine / Drépanocytose)',
      category: 'Hematology',
      specimen: 'Sang total EDTA',
      turnaroundTime: '24 hours',
      defaultConclusion: 'Profil électrophorétique normal de type AA. Absence d\'hémoglobine anormale (absence de fraction S ou C).',
      parameters: [
        { name: 'Hémoglobine A (Hb A1)', defaultValue: '97.2', unit: '%', normalRange: '96.0 - 98.5 %' },
        { name: 'Hémoglobine A2 (Hb A2)', defaultValue: '2.4', unit: '%', normalRange: '1.5 - 3.5 %' },
        { name: 'Hémoglobine Fœtale (Hb F)', defaultValue: '0.4', unit: '%', normalRange: '< 1.5 %' },
        { name: 'Hémoglobine S (Hb S)', defaultValue: '0.0', unit: '%', normalRange: '0.0 % (Absence)' },
        { name: 'Test d\'Emmel (Falciformation)', defaultValue: 'NÉGATIF', unit: 'Microscopie', normalRange: 'Négatif' }
      ],
      html: buildHtmlTable(
        'ÉLECTROPHORÈSE DE L\'HÉMOGLOBINE (HPLC / Capillaire pH alcalin)',
        ['FRACTION D\'HÉMOGLOBINE', 'POURCENTAGE DOSÉ', 'TECHNIQUE', 'VALEURS DE RÉFÉRENCE'],
        [
          { param: 'Hémoglobine A (Hb A)', result: '97.2', unit: '%', normal: '96.0 - 98.5 %' },
          { param: 'Hémoglobine A2 (Hb A2)', result: '2.4', unit: '%', normal: '1.5 - 3.5 %' },
          { param: 'Hémoglobine F (Hb F)', result: '0.4', unit: '%', normal: '< 1.5 %' },
          { param: 'Hémoglobine S (Drépanocytose)', result: 'ABSENTE (0.0 %)', unit: 'Électrophorèse', normal: 'Absence' },
          { param: 'Test de Falciformation (Test d\'Emmel)', result: 'NÉGATIF', unit: 'Réactif réducteur', normal: 'Négatif' }
        ],
        'Tracé électrophorétique normal de profil Hb AA chez l\'adulte. Absence d\'hémoglobinopathie.'
      )
    },
  
    // 24. Biochemistry - Ferritin & Iron Panel (Bilan Martial)
    {
      id: 'iron_ferritin',
      code: 'BIO-08',
      name: 'Iron & Ferritin Panel (Bilan Martial / Fer Sérique & Ferritine)',
      category: 'Biochemistry',
      specimen: 'Sérum le matin à jeun (Tube Sec)',
      turnaroundTime: '2 hours',
      defaultConclusion: 'Réserves martiales satisfaisantes. Absence de carence en fer ni de surcharge en fer.',
      parameters: [
        { name: 'Ferritine Sérique', defaultValue: '115', unit: 'ng/mL (µg/L)', normalRange: '30 - 300 ng/mL' },
        { name: 'Fer Sérique', defaultValue: '105', unit: 'µg/dL (18.8 µmol/L)', normalRange: '60 - 160 µg/dL' },
        { name: 'Capacité Totale de Fixation (CTFT)', defaultValue: '310', unit: 'µg/dL', normalRange: '250 - 400 µg/dL' },
        { name: 'Coefficient de Saturation de la Transferrine', defaultValue: '33.8', unit: '%', normalRange: '20 - 45 %' }
      ],
      html: buildHtmlTable(
        'EXPLORATION DU MÉTABOLISME DU FER (Bilan Martial)',
        ['PARAMÈTRE MARTIAL', 'RÉSULTAT', 'UNITÉ', 'INTERVALLE DE RÉFÉRENCE'],
        [
          { param: 'Ferritine Sérique (Chemiluminescence)', result: '115', unit: 'ng/mL', normal: 'Homme : 30 - 300 | Femme : 20 - 200' },
          { param: 'Fer Sérique', result: '105', unit: 'µg/dL (18.8 µmol/L)', normal: '60 - 160 µg/dL' },
          { param: 'Capacité Totale de Fixation de la Transferrine', result: '310', unit: 'µg/dL', normal: '250 - 400 µg/dL' },
          { param: 'Coefficient de Saturation de la Transferrine (CST)', result: '33.8', unit: '%', normal: '20 - 45 %' }
        ],
        'Réserves en fer normales. Absence de carence martiale.'
      )
    },
  
    // 25. Tumor Markers - AFP, CEA & CA 125
    {
      id: 'tumor_markers',
      code: 'BIO-09',
      name: 'Tumor Markers (Marqueurs Tumoraux AFP / ACE / CA-125)',
      category: 'Biochemistry',
      specimen: 'Sérum (Tube Sec)',
      turnaroundTime: '3 hours',
      defaultConclusion: 'Marqueurs tumoraux dans les limites usuelles de référence.',
      parameters: [
        { name: 'Antigène Carcino-Embryonnaire (ACE / CEA)', defaultValue: '1.6', unit: 'ng/mL', normalRange: '< 5.0 ng/mL (Non fumeur)' },
        { name: 'Alpha-Fœtoprotéine (AFP)', defaultValue: '2.8', unit: 'UI/mL (ng/mL)', normalRange: '< 7.0 UI/mL' },
        { name: 'CA 125 (Ovaire)', defaultValue: '12.4', unit: 'U/mL', normalRange: '< 35.0 U/mL' }
      ],
      html: buildHtmlTable(
        'DOSAGE DES MARQUEURS TUMORAUX PLASMATIQUES (ECLIA)',
        ['MARQUEUR BIOLOGIQUE', 'RÉSULTAT', 'UNITÉ', 'VALEURS USUELLES CHEZ L\'ADULTE'],
        [
          { param: 'Antigène Carcino-Embryonnaire (ACE)', result: '1.6', unit: 'ng/mL', normal: '< 5.0 ng/mL (Non-fumeur < 3.0)' },
          { param: 'Alpha-Fœtoprotéine (AFP)', result: '2.8', unit: 'UI/mL', normal: '< 7.0 UI/mL' },
          { param: 'Antigène Carbohydrate CA 125', result: '12.4', unit: 'U/mL', normal: '< 35.0 U/mL' }
        ],
        'Dosages normaux des marqueurs tumoraux.'
      )
    },
  
    // 26. Serology - Helicobacter pylori Ag / Ab
    {
      id: 'hpylori',
      code: 'SER-06',
      name: 'Helicobacter Pylori (Antigène Fécal ou Sérologie H. pylori)',
      category: 'Serology',
      specimen: 'Selles ou Sérum',
      turnaroundTime: '1 hour',
      defaultConclusion: 'Recherche d\'antigène fécal d\'Helicobacter pylori NÉGATIVE. Absence d\'infection gastroduodénale évolutive.',
      parameters: [
        { name: 'Antigène fécal Helicobacter pylori', defaultValue: 'NÉGATIF', unit: 'Immunochromatographie haute sensibilité', normalRange: 'Négatif' },
        { name: 'Anticorps IgG anti-Helicobacter pylori', defaultValue: '< 0.4', unit: 'Index', normalRange: '< 0.9 Index' }
      ],
      html: buildHtmlTable(
        'DÉPISTAGE D\'HELICOBACTER PYLORI',
        ['TEST RÉALISÉ', 'RÉSULTAT', 'NATURE DU SPÉCIMEN', 'INTERPRÉTATION BIOLOGIQUE'],
        [
          { param: 'Recherche d\'Antigène Fécal d\'Helicobacter pylori', result: 'NÉGATIF', unit: 'Selles fraîches', normal: 'Négatif (Absence d\'infection active)' },
          { param: 'Anticorps sériques IgG anti-H. pylori', result: 'Négatif (< 0.4 U/mL)', unit: 'Sérum', normal: '< 0.9 U/mL' }
        ],
        'Absence d\'infection active à Helicobacter pylori décelée.'
      )
    },
  
    // 27. Serology - Toxoplasmosis (Toxoplasmose IgG & IgM)
    {
      id: 'toxoplasmosis',
      code: 'SER-07',
      name: 'Toxoplasmosis Serology (Sérologie de la Toxoplasmose IgG / IgM)',
      category: 'Serology',
      specimen: 'Sérum (Tube Sec)',
      turnaroundTime: '2 hours',
      defaultConclusion: 'Sérologie en faveur d\'une immunité ancienne acquise protectrice. Absence d\'infection récente évolutive (IgM négatives).',
      parameters: [
        { name: 'Anticorps IgG anti-Toxoplasma gondii', defaultValue: '128.0', unit: 'UI/mL', normalRange: '> 8.0 UI/mL : Positif (Immunité)' },
        { name: 'Anticorps IgM anti-Toxoplasma gondii', defaultValue: '0.12 (NÉGATIF)', unit: 'Index', normalRange: '< 0.8 Index (Négatif)' }
      ],
      html: buildHtmlTable(
        'SÉROLOGIE DE LA TOXOPLASMOSE (Titrage CLIA IgG & IgM)',
        ['IMMUNOGLOBULINE DOSÉE', 'RÉSULTAT', 'UNITÉ', 'SEUIL D\'IMMUNITÉ & SIGNIFICATION'],
        [
          { param: 'Toxoplasmose - Titre IgG', result: '128.0', unit: 'UI/mL', normal: 'Négatif < 7.0 | Positif ≥ 8.0 UI/mL (Immunité présente)' },
          { param: 'Toxoplasmose - Titre IgM', result: 'NÉGATIF (Ratio 0.12)', unit: 'Index', normal: 'Négatif si Index < 0.8' }
        ],
        'Présence d\'anticorps IgG avec absence d\'IgM. Profil sérologique témoignant d\'une immunité ancienne protectrice sans risque foetal actuel.'
      )
    },
  
    // 28. Serology - Rubella (Rubéole IgG & IgM)
    {
      id: 'rubella',
      code: 'SER-08',
      name: 'Rubella Serology (Sérologie de la Rubéole IgG / IgM)',
      category: 'Serology',
      specimen: 'Sérum (Tube Sec)',
      turnaroundTime: '2 hours',
      defaultConclusion: 'Immunité rubéolique protectrice acquise (IgG positives, IgM négatives). Absence de primo-infection récente.',
      parameters: [
        { name: 'Anticorps IgG anti-Rubéole', defaultValue: '85.4', unit: 'UI/mL', normalRange: '> 10.0 UI/mL : Immunisé' },
        { name: 'Anticorps IgM anti-Rubéole', defaultValue: '0.18 (NÉGATIF)', unit: 'Index', normalRange: '< 0.8 Index (Négatif)' }
      ],
      html: buildHtmlTable(
        'SÉROLOGIE DE LA RUBÉOLE',
        ['MARQUEUR D\'IMMUNITÉ', 'RÉSULTAT', 'UNITÉ', 'INTERPRÉTATION'],
        [
          { param: 'Rubéole IgG', result: '85.4', unit: 'UI/mL', normal: 'Taux protecteur si > 10.0 UI/mL' },
          { param: 'Rubéole IgM', result: 'NÉGATIF (0.18)', unit: 'Index', normal: 'Négatif' }
        ],
        'Sujet immunisé vis-à-vis du virus de la rubéole.'
      )
    },
  
    // 29. Microbiology - Semen Analysis (Spermogramme & Spermocytogramme)
    {
      id: 'semen_analysis',
      code: 'MIC-03',
      name: 'Semen Analysis (Spermogramme & Spermocytogramme OMS 6ème Édition)',
      category: 'Microbiology',
      specimen: 'Sperme après abstinence 3 à 5 jours',
      turnaroundTime: '4 hours',
      defaultConclusion: 'Normozoospermie. Paramètres volumétriques, de concentration, de mobilité et de morphologie conformes aux critères OMS.',
      parameters: [
        { name: 'Volume émis', defaultValue: '3.4', unit: 'mL', normalRange: '≥ 1.4 mL' },
        { name: 'pH', defaultValue: '7.8', unit: 'pH', normalRange: '≥ 7.2' },
        { name: 'Concentration en spermatozoïdes', defaultValue: '48.0', unit: 'Millions/mL', normalRange: '≥ 16.0 M/mL' },
        { name: 'Nombre total par éjaculat', defaultValue: '163.2', unit: 'Millions', normalRange: '≥ 39.0 Millions' },
        { name: 'Mobilité progressive (a + b)', defaultValue: '54', unit: '%', normalRange: '≥ 30 %' },
        { name: 'Vitalité (Éosine)', defaultValue: '78', unit: '%', normalRange: '≥ 54 %' },
        { name: 'Formes typiques (Spermocytogramme David)', defaultValue: '28', unit: '%', normalRange: '≥ 4 % (Critère strict de Kruger)' }
      ],
      html: buildHtmlTable(
        'SPERMOGRAMME & SPERMOCYTOGRAMME (Critères OMS 6ème Édition)',
        ['PARAMÈTRE SÉMINAL', 'RÉSULTAT', 'UNITÉ', 'VALEURS USUELLES OMS'],
        [
          { param: 'Volume de l\'éjaculat', result: '3.4', unit: 'mL', normal: '≥ 1.4 mL' },
          { param: 'pH', result: '7.8', unit: 'Unité pH', normal: '≥ 7.2' },
          { param: 'Numération / Concentration', result: '48.0', unit: 'Millions / mL', normal: '≥ 16.0 Millions / mL' },
          { param: 'Numération Totale', result: '163.2', unit: 'Millions / éjaculat', normal: '≥ 39.0 Millions' },
          { param: 'Mobilité Progressive Rapide & Lente (PR)', result: '54', unit: '%', normal: '≥ 30 %' },
          { param: 'Vitalité des spermatozoïdes', result: '78', unit: '%', normal: '≥ 54 %' },
          { param: 'Morphologie (Formes normales typiques)', result: '28', unit: '%', normal: '≥ 4 %' }
        ],
        'Normozoospermie. L\'ensemble des paramètres séminaux répondent aux critères d\'évaluation de la fertilité masculine.'
      )
    },
  
    // 30. Microbiology - Sputum AFB / Tuberculosis (Examen des Crachats BAAR)
    {
      id: 'sputum_afb',
      code: 'MIC-04',
      name: 'Sputum AFB / Tuberculosis Search (Recherche de BAAR dans les Crachats)',
      category: 'Microbiology',
      specimen: 'Expectoration matinale (Crachat)',
      turnaroundTime: '2 hours',
      defaultConclusion: 'Absence de Bacilles Acido-Alcoolo-Résistants (BAAR) sur les 100 champs examinés après coloration de Ziehl-Neelsen.',
      parameters: [
        { name: 'Aspect macroscopique', defaultValue: 'Muco-purulent', unit: 'Aspect', normalRange: 'Muqueux' },
        { name: 'Coloration de Ziehl-Neelsen (Échantillon 1)', defaultValue: 'NÉGATIF (0 BAAR/100 champs)', unit: 'Microscopie x1000', normalRange: 'Absence de BAAR' },
        { name: 'Coloration de Ziehl-Neelsen (Échantillon 2)', defaultValue: 'NÉGATIF (0 BAAR/100 champs)', unit: 'Microscopie x1000', normalRange: 'Absence de BAAR' }
      ],
      html: buildHtmlTable(
        'RECHERCHE DE MYCOBACTÉRIES / BAAR (Coloration de Ziehl-Neelsen)',
        ['ÉCHANTILLON ANALYSÉ', 'RÉSULTAT', 'MICROSCOPIE', 'VALEUR DE RÉFÉRENCE'],
        [
          { param: 'Échantillon N°1 (Expectoration sur place)', result: 'NÉGATIF (0 BAAR observés)', unit: '100 champs examinés', normal: 'Absence de BAAR' },
          { param: 'Échantillon N°2 (Expectoration matinale réveil)', result: 'NÉGATIF (0 BAAR observés)', unit: '100 champs examinés', normal: 'Absence de BAAR' }
        ],
        'Absence de bacilles acido-alcoolo-résistants décelables au frottis direct. Pas d\'argument pour une tuberculose pulmonaire bacillifère.'
      )
    },
  
    // 31. Endocrinology - Prolactin & Fertility Panel (Prolactine & Gonadotrophines)
    {
      id: 'fertility_panel',
      code: 'END-04',
      name: 'Fertility Hormone Panel (FSH / LH / Prolactine / Œstradiol)',
      category: 'Endocrinology',
      specimen: 'Sérum à J3 du cycle (Tube Sec)',
      turnaroundTime: '3 hours',
      defaultConclusion: 'Dosages hormonaux hypophyso-gonadiques dans les limites physiologiques pour la phase folliculaire.',
      parameters: [
        { name: 'FSH (Hormone Folliculo-Stimulante)', defaultValue: '6.4', unit: 'UI/L', normalRange: 'Phase folliculaire : 3.5 - 12.5 UI/L' },
        { name: 'LH (Hormone Lutéinisante)', defaultValue: '5.2', unit: 'UI/L', normalRange: 'Phase folliculaire : 2.4 - 12.6 UI/L' },
        { name: 'Prolactine', defaultValue: '14.8', unit: 'ng/mL (µg/L)', normalRange: 'Femme non enceinte : 4.8 - 23.3 ng/mL' },
        { name: '17-Bêta-Œstradiol', defaultValue: '45', unit: 'pg/mL', normalRange: 'Phase folliculaire : 25 - 160 pg/mL' }
      ],
      html: buildHtmlTable(
        'BILAN HORMONAL DE LA FERTILITÉ (Phase Folliculaire J3)',
        ['HORMONE DOSÉE', 'RÉSULTAT', 'UNITÉ', 'VALEURS DE RÉFÉRENCE'],
        [
          { param: 'FSH Plasmatique', result: '6.4', unit: 'UI/L', normal: 'Folliculaire : 3.5 - 12.5 | Pic : 4.7 - 21.5 | Ménopause : > 25.0' },
          { param: 'LH Plasmatique', result: '5.2', unit: 'UI/L', normal: 'Folliculaire : 2.4 - 12.6 | Pic ovulatoire : 14.0 - 95.6' },
          { param: 'Prolactine', result: '14.8', unit: 'ng/mL', normal: 'Femme : 4.8 - 23.3 ng/mL (Homme : 4.0 - 15.2)' },
          { param: '17-Bêta-Œstradiol', result: '45', unit: 'pg/mL', normal: 'Phase folliculaire : 25 - 160 pg/mL' }
        ],
        'Axe gonadotrope sans anomalie décelable.'
      )
    },
  
    // 32. Biochemistry - Amylase & Lipase (Bilan Pancréatique)
    {
      id: 'pancreas',
      code: 'BIO-10',
      name: 'Pancreatic Enzymes (Lipase & Amylase Sérique)',
      category: 'Biochemistry',
      specimen: 'Sérum (Tube Sec)',
      turnaroundTime: '1 hour 30 min',
      defaultConclusion: 'Enzymes pancréatiques normales. Absence de signe biologique de pancréatite aiguë.',
      parameters: [
        { name: 'Lipasémie', defaultValue: '34', unit: 'UI/L à 37°C', normalRange: '13 - 60 UI/L' },
        { name: 'Amylasémie', defaultValue: '58', unit: 'UI/L', normalRange: '28 - 100 UI/L' }
      ],
      html: buildHtmlTable(
        'ENZYMES DU BILAN PANCRÉATIQUE',
        ['ENZYME ANALYSÉE', 'RÉSULTAT', 'UNITÉ', 'VALEURS USUELLES'],
        [
          { param: 'Lipase Sérique (Spécifique du pancréas)', result: '34', unit: 'UI/L', normal: '13 - 60 UI/L (Pathologique si > 3x normale)' },
          { param: 'Amylase Sérique Totale', result: '58', unit: 'UI/L', normal: '28 - 100 UI/L' }
        ],
        'Taux enzymatiques normaux. Pas d\'argument pour une atteinte pancréatique.'
      )
    },
  
    // 33. Blank Canvas Template
    {
      id: 'blank',
      code: 'GEN-01',
      name: 'Blank Clean Sheet (Page Vierge Personnalisée)',
      category: 'Microbiology',
      specimen: 'Tout spécimen',
      turnaroundTime: 'Sur demande',
      defaultConclusion: 'Examen conforme aux exigences cliniques.',
      parameters: [],
      html: `
  <p style="font-size: 13px; line-height: 1.6; color: #334155;">
    <strong>RÉSULTAT DE L'EXAMEN :</strong>
  </p>
  <p style="font-size: 13px; line-height: 1.6; color: #334155;">
    Tapez directement votre compte-rendu médical ici ou insérez un tableau personnalisé...
  </p>`
    }
  ];
  
  const STORAGE_KEY = 'nanolabs_clinical_templates_store';
  
  export const clinicalTemplatesService = {
    getAllTemplates: (): ClinicalTemplate[] => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length >= 30) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Error reading clinical templates store:', e);
      }
      return INITIAL_CLINICAL_TEMPLATES;
    },
  
    getTemplateById: (id: string): ClinicalTemplate | undefined => {
      const list = clinicalTemplatesService.getAllTemplates();
      return list.find(t => t.id === id);
    },
  
    saveTemplate: (template: ClinicalTemplate): ClinicalTemplate[] => {
      const current = clinicalTemplatesService.getAllTemplates();
      const index = current.findIndex(t => t.id === template.id);
      const updated = [...current];
      const timestamp = new Date().toISOString();
      const toSave = { ...template, isCustom: true, updatedAt: timestamp };
  
      if (index >= 0) {
        updated[index] = toSave;
      } else {
        updated.push(toSave);
      }
  
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save clinical templates to localStorage:', e);
      }
      return updated;
    },
  
    deleteTemplate: (id: string): ClinicalTemplate[] => {
      const current = clinicalTemplatesService.getAllTemplates();
      const filtered = current.filter(t => t.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      } catch (e) {}
      return filtered;
    },
  
    resetToDefaults: (): ClinicalTemplate[] => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CLINICAL_TEMPLATES));
      } catch (e) {}
      return INITIAL_CLINICAL_TEMPLATES;
    }
  };
  