import { ExamTemplate, PatientExamResult } from '../types/examTemplate';
import { db, collection, getDocs, doc, setDoc } from './firebase';

export const STANDARD_EXAM_TEMPLATES: ExamTemplate[] = [
  {
    templateId: 'tpl-pv-exam',
    examCode: 'PV_EXAM',
    title: 'Prélèvement Vaginal (Examen Cyto-Bactériologique)',
    category: 'Bacteriology & Cytology',
    sections: [
      {
        sectionId: 'sec-pv-macro',
        sectionTitle: 'EXAMEN MACROSCOPIQUE',
        parameters: [
          {
            parameterId: 'pv-aspect',
            label: 'Aspect des sécrétions',
            inputType: 'DROPDOWN',
            options: ['Normal / Blanchâtre', 'Jaunâtre', 'Verdâtre', 'Grisâtre', 'Hémorragique', 'Légèrement trouble'],
            defaultValue: 'Normal / Blanchâtre'
          },
          {
            parameterId: 'pv-abondance',
            label: 'Abondance',
            inputType: 'DROPDOWN',
            options: ['Modérée', 'Abondante', 'Faible', 'Très abondante'],
            defaultValue: 'Modérée'
          },
          {
            parameterId: 'pv-odeur',
            label: 'Odeur',
            inputType: 'DROPDOWN',
            options: ['Normale / Inodore', 'Amine positive (poisson avarié)', 'Fétide', 'Acre'],
            defaultValue: 'Normale / Inodore'
          },
          {
            parameterId: 'pv-sniff',
            label: 'Sniff Test (KOH 10%)',
            inputType: 'TOGGLE',
            options: ['Négatif', 'Positif'],
            referenceRange: 'Négatif',
            defaultValue: 'Négatif'
          },
          {
            parameterId: 'pv-ph',
            label: 'pH vaginal',
            inputType: 'NUMERIC',
            unit: 'pH',
            referenceRange: '3.8 - 4.5',
            defaultValue: '4.0'
          }
        ]
      },
      {
        sectionId: 'sec-pv-cyto',
        sectionTitle: 'EXAMEN CYTOLOGIQUE DIRECT (État frais)',
        parameters: [
          {
            parameterId: 'pv-cell-epith',
            label: 'Cellules épithéliales',
            inputType: 'DROPDOWN',
            options: ['Nombreuses', 'Quelques', 'Rares', 'Absence'],
            defaultValue: 'Nombreuses'
          },
          {
            parameterId: 'pv-leuco',
            label: 'Leucocytes / Pyocytes',
            inputType: 'DROPDOWN',
            options: ['Rares (< 10 / champ)', 'Absence', 'Modérés (10-25 / champ)', 'Nombreux (> 25 / champ)'],
            referenceRange: '< 10 / champ',
            defaultValue: 'Rares (< 10 / champ)'
          },
          {
            parameterId: 'pv-hematies',
            label: 'Hématies',
            inputType: 'DROPDOWN',
            options: ['Absence', 'Rares (< 5 / champ)', 'Présence modérée'],
            referenceRange: 'Absence',
            defaultValue: 'Absence'
          },
          {
            parameterId: 'pv-trichomonas',
            label: 'Trichomonas vaginalis',
            inputType: 'TOGGLE',
            options: ['Absence', 'Présence (formes mobiles observées)'],
            referenceRange: 'Absence',
            defaultValue: 'Absence'
          },
          {
            parameterId: 'pv-levures',
            label: 'Levures / Spores / Filaments mycéliens',
            inputType: 'TOGGLE',
            options: ['Absence', 'Présence de spores bourgeonnantes'],
            referenceRange: 'Absence',
            defaultValue: 'Absence'
          },
          {
            parameterId: 'pv-clue-cells',
            label: 'Clue Cells (Cellules cibles)',
            inputType: 'TOGGLE',
            options: ['Absence', 'Présence'],
            referenceRange: 'Absence',
            defaultValue: 'Absence'
          }
        ]
      },
      {
        sectionId: 'sec-pv-bact',
        sectionTitle: 'EXAMEN BACTÉRIOLOGIQUE (Coloration de Gram)',
        parameters: [
          {
            parameterId: 'pv-flore',
            label: 'Flore de Döderlein (Lactobacilles)',
            inputType: 'DROPDOWN',
            options: ['Abondante (Flore normale Grade I)', 'Intermédiaire (Grade II)', 'Absente / Raréfiée (Vaginose Grade III)'],
            referenceRange: 'Abondante (Grade I)',
            defaultValue: 'Abondante (Flore normale Grade I)'
          },
          {
            parameterId: 'pv-cocci-pos',
            label: 'Cocci à Gram positif',
            inputType: 'DROPDOWN',
            options: ['Absence', 'Rares en amas', 'Quelques en chaînettes', 'Nombreux'],
            referenceRange: 'Absence',
            defaultValue: 'Absence'
          },
          {
            parameterId: 'pv-bacille-neg',
            label: 'Bacilles à Gram négatif',
            inputType: 'DROPDOWN',
            options: ['Absence', 'Rares', 'Nombreux'],
            referenceRange: 'Absence',
            defaultValue: 'Absence'
          },
          {
            parameterId: 'pv-diplocoques',
            label: 'Diplocoques Gram négatif (Neisseria)',
            inputType: 'TOGGLE',
            options: ['Absence', 'Présence de diplocoques intra/extra-leucocytaires'],
            referenceRange: 'Absence',
            defaultValue: 'Absence'
          },
          {
            parameterId: 'pv-nugent',
            label: 'Score de Nugent',
            inputType: 'NUMERIC',
            referenceRange: '0 - 3 (Normal)',
            defaultValue: '1'
          }
        ]
      },
      {
        sectionId: 'sec-pv-culture',
        sectionTitle: 'CULTURE ET IDENTIFICATION',
        parameters: [
          {
            parameterId: 'pv-milieux',
            label: 'Culture sur milieux usuels (48h à 37°C)',
            inputType: 'FREE_TEXT',
            defaultValue: 'Culture stérile après 48 heures d incubation à 37°C.'
          },
          {
            parameterId: 'pv-isolement',
            label: 'Germe isolé',
            inputType: 'DROPDOWN',
            options: [
              'Absence de germe pathogène isolé',
              'Candida albicans',
              'Gardnerella vaginalis',
              'Streptocoque du groupe B (S. agalactiae)',
              'Staphylococcus aureus',
              'Escherichia coli'
            ],
            defaultValue: 'Absence de germe pathogène isolé'
          }
        ]
      }
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    templateId: 'tpl-ecbu',
    examCode: 'ECBU',
    title: 'Examen Cyto-Bactériologique des Urines (ECBU)',
    category: 'Bacteriology & Urology',
    sections: [
      {
        sectionId: 'sec-ecbu-macro',
        sectionTitle: 'EXAMEN MACROSCOPIQUE',
        parameters: [
          {
            parameterId: 'ecbu-aspect',
            label: 'Aspect des urines',
            inputType: 'DROPDOWN',
            options: ['Limpide', 'Légèrement trouble', 'Trouble', 'Hématique'],
            defaultValue: 'Limpide'
          },
          {
            parameterId: 'ecbu-couleur',
            label: 'Couleur',
            inputType: 'DROPDOWN',
            options: ['Jaune ambré', 'Jaune pâle', 'Rougeâtre', 'Brunâtre'],
            defaultValue: 'Jaune ambré'
          },
          {
            parameterId: 'ecbu-depot',
            label: 'Culot / Dépôt',
            inputType: 'TOGGLE',
            options: ['Absence', 'Présence de dépôt'],
            referenceRange: 'Absence',
            defaultValue: 'Absence'
          }
        ]
      },
      {
        sectionId: 'sec-ecbu-cyto',
        sectionTitle: 'CYTOLOGIE QUANTITATIVE (Cellule de Malassez)',
        parameters: [
          {
            parameterId: 'ecbu-leuco',
            label: 'Leucocytes urinaires',
            inputType: 'NUMERIC',
            unit: 'éléments/mm³',
            referenceRange: '< 10 éléments/mm³ (< 10 000 / mL)',
            defaultValue: '3'
          },
          {
            parameterId: 'ecbu-hematies',
            label: 'Hématies urinaires',
            inputType: 'NUMERIC',
            unit: 'éléments/mm³',
            referenceRange: '< 10 éléments/mm³ (< 10 000 / mL)',
            defaultValue: '2'
          },
          {
            parameterId: 'ecbu-cristaux',
            label: 'Cristaux / Cylindres urinaires',
            inputType: 'FREE_TEXT',
            referenceRange: 'Absence',
            defaultValue: 'Absence de cylindre ou cristaux pathologiques.'
          }
        ]
      },
      {
        sectionId: 'sec-ecbu-bact',
        sectionTitle: 'BACTÉRIOLOGIE DIRECTE & CULTURE',
        parameters: [
          {
            parameterId: 'ecbu-gram',
            label: 'Coloration de Gram au direct',
            inputType: 'FREE_TEXT',
            defaultValue: 'Absence de germe visible à l examen direct.'
          },
          {
            parameterId: 'ecbu-numeration',
            label: 'Numération de germes (UFC/mL)',
            inputType: 'DROPDOWN',
            options: [
              '< 10^3 UFC/mL (Culture Stérile)',
              '10^3 - 10^4 UFC/mL (Seuil douteux)',
              '> 10^5 UFC/mL (Bactériurie significative)'
            ],
            referenceRange: '< 10^3 UFC/mL',
            defaultValue: '< 10^3 UFC/mL (Culture Stérile)'
          },
          {
            parameterId: 'ecbu-germe',
            label: 'Conclusion / Germe identifié',
            inputType: 'FREE_TEXT',
            defaultValue: 'Culture stérile après 24 heures d incubation.'
          }
        ]
      }
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    templateId: 'tpl-copro',
    examCode: 'COPRO',
    title: 'Coprologie Parasitaire & Examen des Selles',
    category: 'Parasitology',
    sections: [
      {
        sectionId: 'sec-copro-macro',
        sectionTitle: 'EXAMEN MACROSCOPIQUE',
        parameters: [
          {
            parameterId: 'copro-consistance',
            label: 'Consistance',
            inputType: 'DROPDOWN',
            options: ['Moulée', 'Pâteuse', 'Liquide', 'Hétérogène'],
            defaultValue: 'Moulée'
          },
          {
            parameterId: 'copro-couleur',
            label: 'Couleur',
            inputType: 'DROPDOWN',
            options: ['Brune normale', 'Jaunâtre', 'Verdâtre', 'Noirâtre / Méléna'],
            defaultValue: 'Brune normale'
          },
          {
            parameterId: 'copro-glaires',
            label: 'Glaires et Mucus',
            inputType: 'TOGGLE',
            options: ['Absence', 'Présence'],
            referenceRange: 'Absence',
            defaultValue: 'Absence'
          },
          {
            parameterId: 'copro-sang',
            label: 'Sang macroscopique',
            inputType: 'TOGGLE',
            options: ['Absence', 'Présence'],
            referenceRange: 'Absence',
            defaultValue: 'Absence'
          }
        ]
      },
      {
        sectionId: 'sec-copro-micro',
        sectionTitle: 'EXAMEN MICROSCOPIQUE DIRECT ET APRÈS CONCENTRATION (Ritchie)',
        parameters: [
          {
            parameterId: 'copro-kystes',
            label: 'Kystes de protozoaires (Entamoeba / Giardia)',
            inputType: 'DROPDOWN',
            options: ['Absence de kyste décelé', 'Kystes d Entamoeba histolytica', 'Kystes de Giardia intestinalis', 'Kystes d Entamoeba coli'],
            referenceRange: 'Absence',
            defaultValue: 'Absence de kyste décelé'
          },
          {
            parameterId: 'copro-helminthes',
            label: 'Oeufs d helminthes (Ascaris / Ankylostome / Trichuris)',
            inputType: 'DROPDOWN',
            options: ['Absence d oeuf d helminthe', 'Oeufs d Ascaris lumbricoides', 'Oeufs d Ankylostoma', 'Oeufs de Trichuris trichiura'],
            referenceRange: 'Absence',
            defaultValue: 'Absence d oeuf d helminthe'
          },
          {
            parameterId: 'copro-leuco',
            label: 'Leucocytes / Hématies fécales',
            inputType: 'TOGGLE',
            options: ['Absence', 'Présence modérée'],
            referenceRange: 'Absence',
            defaultValue: 'Absence'
          }
        ]
      }
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    templateId: 'tpl-nfs',
    examCode: 'NFS',
    title: 'Hémogramme Complet (NFS Formule Sanguine)',
    category: 'Hematology',
    sections: [
      {
        sectionId: 'sec-nfs-eryth',
        sectionTitle: 'LIGNÉE ÉRYTHROCYTAIRE (GR & Hémoglobine)',
        parameters: [
          {
            parameterId: 'nfs-hb',
            label: 'Hémoglobine (Hb)',
            inputType: 'NUMERIC',
            unit: 'g/dL',
            referenceRange: '12.0 - 16.5 g/dL',
            defaultValue: '14.2'
          },
          {
            parameterId: 'nfs-ht',
            label: 'Hématocrite (Ht)',
            inputType: 'NUMERIC',
            unit: '%',
            referenceRange: '37.0 - 48.0 %',
            defaultValue: '42.0'
          },
          {
            parameterId: 'nfs-gr',
            label: 'Globules Rouges (GR)',
            inputType: 'NUMERIC',
            unit: 'M/µL',
            referenceRange: '4.0 - 5.5 M/µL',
            defaultValue: '4.80'
          },
          {
            parameterId: 'nfs-vgm',
            label: 'VGM (Volume Globulaire Moyen)',
            inputType: 'NUMERIC',
            unit: 'fL',
            referenceRange: '80.0 - 98.0 fL',
            defaultValue: '88.0'
          },
          {
            parameterId: 'nfs-tcmh',
            label: 'TCMH',
            inputType: 'NUMERIC',
            unit: 'pg',
            referenceRange: '27.0 - 33.0 pg',
            defaultValue: '29.5'
          }
        ]
      },
      {
        sectionId: 'sec-nfs-leuco',
        sectionTitle: 'LIGNÉE LEUCOCYTAIRE (GB & Formule Leucocytaire)',
        parameters: [
          {
            parameterId: 'nfs-gb',
            label: 'Globules Blancs Totaux (GB)',
            inputType: 'NUMERIC',
            unit: '/mm³',
            referenceRange: '4 000 - 10 000 /mm³',
            defaultValue: '6 400'
          },
          {
            parameterId: 'nfs-pnn',
            label: 'Polynucléaires Neutrophiles',
            inputType: 'NUMERIC',
            unit: '%',
            referenceRange: '45 - 70 %',
            defaultValue: '58'
          },
          {
            parameterId: 'nfs-lympho',
            label: 'Lymphocytes',
            inputType: 'NUMERIC',
            unit: '%',
            referenceRange: '20 - 40 %',
            defaultValue: '32'
          },
          {
            parameterId: 'nfs-mono',
            label: 'Monocytes',
            inputType: 'NUMERIC',
            unit: '%',
            referenceRange: '2 - 10 %',
            defaultValue: '6'
          },
          {
            parameterId: 'nfs-eosino',
            label: 'Polynucléaires Éosinophiles',
            inputType: 'NUMERIC',
            unit: '%',
            referenceRange: '1 - 5 %',
            defaultValue: '3'
          }
        ]
      },
      {
        sectionId: 'sec-nfs-plaq',
        sectionTitle: 'LIGNÉE THROMBOCYTAIRE (Plaquettes)',
        parameters: [
          {
            parameterId: 'nfs-plaquettes',
            label: 'Numération Plaquettes',
            inputType: 'NUMERIC',
            unit: '/mm³',
            referenceRange: '150 000 - 450 000 /mm³',
            defaultValue: '245 000'
          }
        ]
      }
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

export const examTemplateService = {
  /**
   * Look up template for an exam code (case-insensitive and alias-aware)
   */
  async getTemplateByExamCode(examCode: string): Promise<ExamTemplate | null> {
    const normalized = (examCode || '').trim().toUpperCase();

    // 1. Check local storage overrides
    try {
      const stored = localStorage.getItem(`exam_template_${normalized}`);
      if (stored) {
        return JSON.parse(stored) as ExamTemplate;
      }
    } catch {}

    // 2. Check Firestore
    try {
      const snap = await getDocs(collection(db, 'exam_templates'));
      for (const d of snap.docs) {
        const data = d.data() as ExamTemplate;
        if (
          data.examCode?.toUpperCase() === normalized ||
          data.templateId?.toUpperCase() === normalized
        ) {
          return { ...data, templateId: d.id };
        }
      }
    } catch {}

    // 3. Fallback to standard library
    const match = STANDARD_EXAM_TEMPLATES.find(
      t =>
        t.examCode.toUpperCase() === normalized ||
        normalized.includes(t.examCode.toUpperCase()) ||
        t.examCode.toUpperCase().includes(normalized) ||
        (normalized.includes('VAGIN') && t.examCode === 'PV_EXAM') ||
        (normalized.includes('URIN') && t.examCode === 'ECBU') ||
        (normalized.includes('SELLE') && t.examCode === 'COPRO') ||
        (normalized.includes('HEMO') && t.examCode === 'NFS')
    );

    return match || null;
  },

  /**
   * Save a customized or new template linked to an Exam Code
   */
  async saveTemplate(template: ExamTemplate): Promise<{ success: boolean }> {
    const cleanCode = template.examCode.trim().toUpperCase();
    const updated = {
      ...template,
      examCode: cleanCode,
      updatedAt: new Date().toISOString()
    };

    // Save locally
    try {
      localStorage.setItem(`exam_template_${cleanCode}`, JSON.stringify(updated));
    } catch {}

    // Save to Firestore
    try {
      await setDoc(doc(db, 'exam_templates', template.templateId || `tpl-${cleanCode.toLowerCase()}`), updated, { merge: true });
    } catch (err) {
      console.warn('Firestore template save note:', err);
    }

    return { success: true };
  },

  /**
   * Save patient exam result
   */
  async savePatientResult(result: PatientExamResult): Promise<{ success: boolean; resultId: string }> {
    const resultId = result.resultId || `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const payload: PatientExamResult = {
      ...result,
      resultId,
      autoSavedAt: new Date().toISOString()
    };

    // Save locally
    try {
      localStorage.setItem(`exam_result_${result.bookingId}_${result.examCode}`, JSON.stringify(payload));
    } catch {}

    // Save to Firestore
    try {
      await setDoc(doc(db, 'patient_exam_results', resultId), payload, { merge: true });
    } catch (err) {
      console.warn('Firestore result save note:', err);
    }

    return { success: true, resultId };
  },

  /**
   * Get patient result for a booking and examCode
   */
  async getPatientResult(bookingId: string, examCode: string): Promise<PatientExamResult | null> {
    try {
      const local = localStorage.getItem(`exam_result_${bookingId}_${examCode}`);
      if (local) return JSON.parse(local);
    } catch {}
    return null;
  }
};
