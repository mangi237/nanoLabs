export interface OfficialTestDefinition {
    id: string;
    name: string;
    aliases: string[];
    category: 'Microbiology' | 'Hematology' | 'Serology / Immunology' | 'Biochemistry' | 'Hormones & Tumor Markers';
    method: string;
    conditions: string; // Conditions of withdrawal / patient preparation
    turnaroundTime: string; // Time to return results / TAT
    price: number; // Official base price in XAF (FCFA)
    sampleType: string;
    description: string;
  }
  
  export const OFFICIAL_CATEGORIES = [
    'Microbiology',
    'Hematology',
    'Serology / Immunology',
    'Biochemistry',
    'Hormones & Tumor Markers'
  ] as const;
  
  export type OfficialCategory = typeof OFFICIAL_CATEGORIES[number];
  
  export const OFFICIAL_MASTER_TEST_CATALOG: OfficialTestDefinition[] = [
    // ==========================================
    // 1. MICROBIOLOGY
    // ==========================================
    {
      id: 'mb-01',
      name: 'Stool Culture (Coproculture)',
      aliases: ['Coproculture', 'Stool culture and sensitivity', 'Fecal culture'],
      category: 'Microbiology',
      method: 'Microbiological culture & selective agar isolation + Antibiogram',
      conditions: 'Fresh stool sample collected in a sterile container. No antibiotics 7-10 days prior to sample collection.',
      turnaroundTime: '3 days after sampling',
      price: 15000,
      sampleType: 'Stool (Feces)',
      description: 'Isolation and identification of enteric bacterial pathogens (Salmonella, Shigella, Campylobacter, E. coli) with antimicrobial susceptibility profiling.'
    },
    {
      id: 'mb-02',
      name: 'AFB (Acid-Fast Bacilli / Tuberculosis - Ziehl-Neelsen)',
      aliases: ['AFB', 'Acid fast bacilli', 'TB Sputum', 'Ziehl Neelsen', 'BK', 'Bacille de Koch'],
      category: 'Microbiology',
      method: 'Ziehl-Neelsen acid-fast staining & high-power oil immersion microscopy',
      conditions: 'Early morning deep cough sputum before eating or brushing (3 consecutive mornings recommended), or early morning urine in sterile bottle.',
      turnaroundTime: '3 hours after sampling',
      price: 5000,
      sampleType: 'Deep Sputum / Early Morning Urine',
      description: 'Rapid microscopic screening for Mycobacterium tuberculosis and other acid-fast mycobacteria.'
    },
    {
      id: 'mb-03',
      name: 'Fluid Analysis / Cytology / Culture (Pleural, Ascitic, Synovial, Pericardial)',
      aliases: ['Body fluid analysis', 'Pleural fluid', 'Ascitic fluid', 'Synovial fluid', 'Peritoneal fluid'],
      category: 'Microbiology',
      method: 'Direct cytology, Gram stain, Biochemical cell count & Microbiological culture',
      conditions: 'Strict sterile medical puncture by treating physician. Collected in sterile tube + EDTA tube for cell differential.',
      turnaroundTime: '3 days after sampling',
      price: 15000,
      sampleType: 'Sterile Body Fluid',
      description: 'Comprehensive microscopic examination, cellular differential count, chemical proteins/glucose, and microbiological culture of body cavity fluids.'
    },
    {
      id: 'mb-04',
      name: 'Urine Culture & Sensitivity (ECBU / Urinoculture)',
      aliases: ['ECBU', 'Urine culture', 'Urinoculture', 'Urine antibiogram', 'CBU'],
      category: 'Microbiology',
      method: 'Quantitative calibrated loop culture on CLED/MacConkey agar + Antibiogram',
      conditions: 'Strict midstream clean-catch urine into sterile cup after careful genital hygiene. Minimum 3 hours without urinating (early morning sample ideal). No antibiotics for 5-10 days.',
      turnaroundTime: '3 days after sampling',
      price: 12000,
      sampleType: 'Midstream Urine',
      description: 'Quantitative bacteriological evaluation of urinary tract infection (UTI), colony count (CFU/mL), pathogen identification, and antibiotic sensitivity disk diffusion.'
    },
    {
      id: 'mb-05',
      name: 'Stool Examination (Direct Wet Mount & Concentration)',
      aliases: ['Stool exam', 'Stool microscopy', 'Parasitology stool', 'Koprologie', 'Stool for ova and parasites', 'O&P'],
      category: 'Microbiology',
      method: 'Direct saline & Lugol wet mount + Formalin-ether Ritchie concentration microscopy',
      conditions: 'Fresh stool passed into a clean, dry, disinfectant-free container. Deliver to laboratory within 1 hour of passage.',
      turnaroundTime: '2 hours after sampling',
      price: 3500,
      sampleType: 'Fresh Stool',
      description: 'Microscopic identification of intestinal helminths, protozoan cysts, trophozoites (Entamoeba, Giardia), ova, and fecal leukocytes.'
    },
    {
      id: 'mb-06',
      name: 'Pap Smear (Cervical Cytology / Papanicolaou Stain)',
      aliases: ['Pap smear', 'Cervical cytology', 'Fcv', 'Frottis cervico-vaginal', 'Papanicolaou'],
      category: 'Microbiology',
      method: 'Papanicolaou cytology multi-staining & Bethesda microscopic classification',
      conditions: 'No sexual intercourse, vaginal douches, or intravaginal medications for 48 hours prior. Perform outside menstrual bleeding period (ideally mid-cycle).',
      turnaroundTime: '10 days after sampling',
      price: 15000,
      sampleType: 'Cervical / Endocervical Swab',
      description: 'Cytological screening for cervical dysplasia, pre-cancerous intraepithelial lesions, HPV cytopathic changes, and inflammatory cervical conditions.'
    },
    {
      id: 'mb-07',
      name: 'Blood Culture (Hemoculture - Aerobic & Anaerobic)',
      aliases: ['Blood culture', 'Hemoculture', 'Bactec', 'Blood culture and sensitivity'],
      category: 'Microbiology',
      method: 'Automated continuous monitoring / manual biphasic broth culture & subculture',
      conditions: 'Strict skin asepsis (alcohol + povidone iodine). Draw during febrile peak/chills before starting any systemic antibiotic therapy.',
      turnaroundTime: '5 to 7 days after sampling',
      price: 20000,
      sampleType: 'Venous Blood (Blood Culture Bottles)',
      description: 'Detection of bacteremia, septicemia, endocarditis, and systemic bloodstream bacterial and fungal pathogens with full antimicrobial susceptibility.'
    },
    {
      id: 'mb-08',
      name: 'Hemoparasite (Malaria / Thick & Thin Blood Film)',
      aliases: ['Malaria', 'GE', 'Goutte epaisse', 'Thick film', 'Thin film', 'Plasmodium', 'Hemoparasites', 'Blood parasite'],
      category: 'Microbiology',
      method: 'Giemsa-stained thick film & thin film microscopic parasite density count',
      conditions: 'Capillary finger prick or venous EDTA blood drawn during temperature spike or suspicion of malaria attack.',
      turnaroundTime: '1 hour 30 minutes',
      price: 2000,
      sampleType: 'Capillary / EDTA Whole Blood',
      description: 'Gold-standard identification of Plasmodium species (P. falciparum, P. vivax, P. malariae, P. ovale) and quantitative parasite load determination (trophozoites/μL).'
    },
    {
      id: 'mb-09',
      name: 'CSF (Cerebrospinal Fluid) Analysis, Cytology & Culture',
      aliases: ['CSF', 'LCR', 'Liquide cephalo-rachidien', 'Spinal fluid', 'Lumbar puncture fluid'],
      category: 'Microbiology',
      method: 'Immediate cell count (cytocentrifuge), Gram/India ink stain, biochemical glucose/protein & enriched culture',
      conditions: 'Sterile lumbar puncture performed by medical practitioner in sterile tubes. Immediate transport to laboratory at room temperature.',
      turnaroundTime: '3 days after sampling (Immediate cytology/biochemistry in 2 hours)',
      price: 20000,
      sampleType: 'Cerebrospinal Fluid (CSF)',
      description: 'Emergency evaluation for acute bacterial, viral, or fungal meningitis (Cryptococcus, Pneumococcus, Meningococcus) with quantitative cytochemistry.'
    },
    {
      id: 'mb-10',
      name: 'Mycoplasma & Ureaplasma Culture & Identification',
      aliases: ['Mycoplasma', 'Ureaplasma', 'Mycoplasma hominis', 'Ureaplasma urealyticum', 'PPLO'],
      category: 'Microbiology',
      method: 'Differential liquid metabolic broth culture & quantitative titration',
      conditions: 'Endocervical, urethral swab, or first-void morning urine. No antibiotics for 10-14 days. Minimum 3 hours without urinating.',
      turnaroundTime: '48 hours after sampling',
      price: 15000,
      sampleType: 'Genital Swab / First Void Urine',
      description: 'Specific diagnosis of urogenital mycoplasmas (Ureaplasma urealyticum and Mycoplasma hominis) with targeted antimicrobial susceptibility testing.'
    },
    {
      id: 'mb-11',
      name: 'Vaginal Swab (Direct Microscopic Examination)',
      aliases: ['Vaginal swab', 'PV direct', 'Prelèvement vaginal direct', 'Wet mount vaginal'],
      category: 'Microbiology',
      method: 'Direct saline wet mount, KOH amine whiff test, & Gram staining',
      conditions: 'No vaginal douching, intravaginal ovules, or sexual intercourse for 24-48 hours. Not during menses.',
      turnaroundTime: '2 hours after sampling',
      price: 5000,
      sampleType: 'Vaginal Discharge / Swab',
      description: 'Immediate microscopic assessment for Trichomonas vaginalis, Candida yeast pseudo-hyphae, bacterial vaginosis clue cells, and Nugent score flora balance.'
    },
    {
      id: 'mb-12',
      name: 'Vaginal Swab + Complete Culture & Sensitivity',
      aliases: ['PV culture', 'Vaginal culture and sensitivity', 'Prelèvement vaginal complet'],
      category: 'Microbiology',
      method: 'Gram stain, Chocolate/Blood agar culture, biochemical identification & Antibiogram',
      conditions: 'No vaginal antiseptic lavage, ovules, or intercourse for 48 hours. No antibiotics for 10 days.',
      turnaroundTime: '3 days after sampling',
      price: 15000,
      sampleType: 'Endocervical & Vaginal Swab',
      description: 'Comprehensive bacteriological culture for aerobic and anaerobic pathogens (Group B Streptococcus, Gardnerella, Enterobacteriaceae) with full sensitivity panel.'
    },
    {
      id: 'mb-13',
      name: 'Throat Swab Culture & Sensitivity',
      aliases: ['Throat swab', 'Pharyngeal swab', 'Prélèvement de gorge', 'Throat culture'],
      category: 'Microbiology',
      method: 'Blood agar culture & bacitracin/catalase identification + Antibiogram',
      conditions: 'Fasting or minimum 2 hours after meal. Avoid antiseptic mouthwashes, sprays, or gargles before sampling. No systemic antibiotics for 7 days.',
      turnaroundTime: '3 days after sampling',
      price: 12000,
      sampleType: 'Posterior Pharyngeal & Tonsillar Swab',
      description: 'Screening for Group A Beta-Hemolytic Streptococcus (Streptococcus pyogenes) and other pharyngeal bacterial pathogens causing acute pharyngotonsillitis.'
    },
    {
      id: 'mb-14',
      name: 'Urethral Swab (Direct Microscopic Examination)',
      aliases: ['Urethral swab', 'PU direct', 'Prélèvement urétral direct', 'Gram stain urethra'],
      category: 'Microbiology',
      method: 'Direct saline wet mount & Gram stain light microscopy',
      conditions: 'Morning discharge before first urination (or minimum 3 to 4 hours without urinating prior to collection).',
      turnaroundTime: '2 hours after sampling',
      price: 5000,
      sampleType: 'Urethral Exudate / Swab',
      description: 'Direct microscopic detection of intracellular Gram-negative diplococci (Neisseria gonorrhoeae), Trichomonas vaginalis, and polymorphonuclear leukocyte count.'
    },
    {
      id: 'mb-15',
      name: 'Urethral Swab + Culture & Sensitivity',
      aliases: ['PU culture', 'Urethral culture and sensitivity', 'Prélèvement urétral complet'],
      category: 'Microbiology',
      method: 'Thayer-Martin / Chocolate agar culture & Antibiogram',
      conditions: 'Minimum 3 hours without urinating. No antibiotics for 10-14 days.',
      turnaroundTime: '3 days after sampling',
      price: 15000,
      sampleType: 'Urethral Swab',
      description: 'Bacteriological culture for Neisseria gonorrhoeae, common uropathogens, and opportunistic bacteria with antimicrobial susceptibility.'
    },
    {
      id: 'mb-16',
      name: 'Pus / Wound Exudate + Culture & Sensitivity',
      aliases: ['Pus culture', 'Wound swab', 'Abscess culture', 'Prélèvement de pus', 'Exudate culture'],
      category: 'Microbiology',
      method: 'Gram stain, Aerobic/Anaerobic culture & disk diffusion Antibiogram',
      conditions: 'Sample taken from deep base of wound or aspirated using sterile syringe prior to antiseptic cleansing or antibiotic treatment.',
      turnaroundTime: '3 days after sampling',
      price: 15000,
      sampleType: 'Pus / Wound Aspirate / Swab',
      description: 'Identification of pyogenic bacteria (Staphylococcus aureus, MRSA, Pseudomonas aeruginosa, Streptococcus) with comprehensive antibiogram.'
    },
    {
      id: 'mb-17',
      name: 'Microfilaria Blood Examination (Loa Loa / Mansonella)',
      aliases: ['Microfilaria', 'Loa loa', 'Mansonella', 'Filariose', 'Goutte épaisse filaires'],
      category: 'Microbiology',
      method: 'Calibrated thick blood film & saponin hemolysed Knott concentration',
      conditions: 'For diurnal Loa loa: sampling MUST occur between 10:00 AM and 3:00 PM (or stand under natural warm sun for 1 hour before blood withdrawal).',
      turnaroundTime: '2 hours after sampling',
      price: 3500,
      sampleType: 'Venous / Capillary Blood',
      description: 'Quantification and morphological differentiation of circulating microfilariae of Loa loa, Mansonella perstans, and Wuchereria bancrofti.'
    },
    {
      id: 'mb-18',
      name: 'Scotch Tape Technique (Graham Test / Pinworm / Oxyures)',
      aliases: ['Scotch tape', 'Graham test', 'Oxyure', 'Enterobius vermicularis', 'Pinworm test'],
      category: 'Microbiology',
      method: 'Cellophane adhesive tape perianal application & direct microscopy',
      conditions: 'Collect early in the morning before 10:00 AM, before taking a bath, showering, or passing stool.',
      turnaroundTime: '1 hour 30 minutes',
      price: 3000,
      sampleType: 'Perianal Adhesive Tape Slide',
      description: 'Detection of Enterobius vermicularis (pinworm / oxyuris) asymmetric eggs and Taenia proglottids deposited on perianal skin folds.'
    },
    {
      id: 'mb-19',
      name: 'Semen Culture (Spermoculture & Sensitivity)',
      aliases: ['Spermoculture', 'Semen culture', 'Sperm culture and sensitivity'],
      category: 'Microbiology',
      method: 'Quantitative enriched agar culture & disk diffusion Antibiogram',
      conditions: 'Strict 3 to 5 days of sexual abstinence. Urinate first, wash hands and glans with soap/water, collect entire ejaculate by masturbation into sterile cup.',
      turnaroundTime: '3 days after sampling',
      price: 15000,
      sampleType: 'Sterile Semen Ejaculate',
      description: 'Screening for asymptomatic or chronic male reproductive tract infections (Chlamydia, Mycoplasma, Enterococcus, Gram-negatives) causing male subfertility.'
    },
    {
      id: 'mb-20',
      name: 'Semen Analysis (Spermogram & Spermocytogram - WHO Standards)',
      aliases: ['Spermogram', 'Spermocytogram', 'Semen analysis', 'Seminogram', 'Sperm test'],
      category: 'Microbiology',
      method: 'Macroscopic liquefaction/viscosity, Makler chamber microscopic count, motility grading & Bryan/Papanicolaou morphology',
      conditions: 'Strict 3 to 5 days of sexual abstinence. Collect by masturbation directly in lab or transport at body temperature within 30 minutes.',
      turnaroundTime: '4 hours after sampling',
      price: 12000,
      sampleType: 'Fresh Semen Ejaculate',
      description: 'Comprehensive fertility evaluation assessing semen volume, sperm concentration, progressive motility (A+B), vitality percentage, and morphological anomalies.'
    },
    {
      id: 'mb-21',
      name: 'Post Coital Test (Huhner Test / Cervical Mucus Penetration)',
      aliases: ['Huhner test', 'Post coital test', 'Test de Huhner', 'PCT'],
      category: 'Microbiology',
      method: 'Endocervical mucus microscopic examination for sperm survival and motility',
      conditions: 'Scheduled strictly during pre-ovulatory peak (day 12-14 of cycle). Sexual intercourse 6 to 10 hours prior to appointment without contraception or vaginal douche.',
      turnaroundTime: '2 hours after sampling',
      price: 10000,
      sampleType: 'Endocervical Mucus',
      description: 'Investigation of cervical factor infertility, mucus receptivity (Insler score), and forward progressive sperm survival inside cervical secretions.'
    },
  
    // ==========================================
    // 2. HEMATOLOGY
    // ==========================================
    {
      id: 'hem-01',
      name: 'Hemoglobin Electrophoresis (Hb Electrophoresis)',
      aliases: ['Hemoglobin electrophoresis', 'Hb electrophoresis', 'Electrophorese de l hemoglobine', 'Sickle cell test', 'Drepanocytose', 'Hb SS', 'Hb AS'],
      category: 'Hematology',
      method: 'Alkaline cellulose acetate electrophoresis & high-performance liquid chromatography (HPLC)',
      conditions: 'Venous blood drawn in EDTA tube (purple top). No blood transfusions within the preceding 3 months.',
      turnaroundTime: '24 hours (1 day)',
      price: 10000,
      sampleType: 'EDTA Whole Blood',
      description: 'Qualitative and quantitative characterization of hemoglobin variants (Hb A, Hb S, Hb C, Hb F, Hb A2) for sickle cell disease, trait, and thalassemias.'
    },
    {
      id: 'hem-02',
      name: 'Blood Group & Rhesus Factor (ABO-Rh)',
      aliases: ['Blood group', 'Groupe sanguin', 'Rhesus', 'ABO Rh', 'Blood typing'],
      category: 'Hematology',
      method: 'Beth-Vincent (forward cellular) & Simonin (reverse serum) dual hemagglutination',
      conditions: 'Venous blood drawn in EDTA tube. No special dietary fasting required.',
      turnaroundTime: '1 hour after sampling',
      price: 2500,
      sampleType: 'EDTA Whole Blood',
      description: 'Definitive determination of ABO blood group (A, B, AB, O) and Rh(D) status with confirmation of irregular agglutinins.'
    },
    {
      id: 'hem-03',
      name: 'Full Blood Count (FBC / CBC + 5-Part Differential)',
      aliases: ['Full blood count', 'FBC', 'CBC', 'NFS', 'Numeration formule sanguine', 'Complete blood count', 'Hemogram'],
      category: 'Hematology',
      method: '5-part automated impedance & laser flow cytometry + blood smear review',
      conditions: 'Venous EDTA blood (purple tube). Fasting preferred but not strictly mandatory.',
      turnaroundTime: '1 hour 30 minutes',
      price: 4500,
      sampleType: 'EDTA Whole Blood',
      description: 'Complete hematological profiling including RBC, Hemoglobin, Hematocrit, MCV, MCH, MCHC, Platelet count, and 5-part WBC differential (Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils).'
    },
    {
      id: 'hem-04',
      name: 'Direct Coombs Test (Direct Antiglobulin Test / DU)',
      aliases: ['Direct Coombs', 'Coombs direct', 'DU test', 'Direct antiglobulin test', 'DAT'],
      category: 'Hematology',
      method: 'Broad-spectrum anti-human globulin agglutination reaction',
      conditions: 'Fresh venous EDTA whole blood, processed promptly without hemolysis.',
      turnaroundTime: '2 hours after sampling',
      price: 6000,
      sampleType: 'EDTA Whole Blood',
      description: 'Detection of antibodies or complement proteins bound directly to red blood cell surface in hemolytic disease of the newborn and autoimmune hemolytic anemia.'
    },
    {
      id: 'hem-05',
      name: 'Reticulocyte Count (Reticulocytes)',
      aliases: ['Reticulocytes', 'Retic count', 'Taux de reticulocytes'],
      category: 'Hematology',
      method: 'Brilliant cresyl blue supravital microscopic count / Automated flow cytometry',
      conditions: 'Venous EDTA blood sample.',
      turnaroundTime: '2 hours after sampling',
      price: 5000,
      sampleType: 'EDTA Whole Blood',
      description: 'Evaluation of bone marrow erythropoietic activity and regeneration capacity in anemia classification (regenerative vs non-regenerative).'
    },
    {
      id: 'hem-06',
      name: 'Prothrombin Time (PT / INR / Quick Time)',
      aliases: ['Prothrombin time', 'PT', 'INR', 'Taux de prothrombine', 'TP', 'Quick time'],
      category: 'Hematology',
      method: 'Chronometric coagulation on citrated platelet-poor plasma using recombinant thromboplastin',
      conditions: 'Sodium citrate tube (light blue top), strictly filled to mark (1:9 anticoagulant ratio). Avoid prolonged tourniquet application.',
      turnaroundTime: '2 hours after sampling',
      price: 6000,
      sampleType: 'Citrated Plasma',
      description: 'Assessment of extrinsic coagulation pathway factors (II, V, VII, X) and oral vitamin K antagonist anticoagulant monitoring.'
    },
    {
      id: 'hem-07',
      name: 'Fibrinogen Dosage (Factor I)',
      aliases: ['Fibrinogen', 'Fibrinogene', 'Factor I', 'Clauss fibrinogen'],
      category: 'Hematology',
      method: 'Clauss chronometric thrombin clotting time method',
      conditions: 'Sodium citrate blood tube (light blue top). Rapid centrifugation and separation of plasma.',
      turnaroundTime: '2 hours after sampling',
      price: 7000,
      sampleType: 'Citrated Plasma',
      description: 'Quantitative measurement of plasma fibrinogen for coagulation disorders, DIC screening, and acute phase inflammatory response.'
    },
    {
      id: 'hem-08',
      name: 'aPTT (Activated Partial Thromboplastin Time / TCA)',
      aliases: ['aPTT', 'PTT', 'TCA', 'Temps de cephaline activee', 'Partial thromboplastin time'],
      category: 'Hematology',
      method: 'Optical / Mechanical chronometric coagulation measurement on citrated plasma',
      conditions: 'Sodium citrate tube (light blue top). Draw without tissue trauma, centrifuge promptly.',
      turnaroundTime: '2 hours after sampling',
      price: 6000,
      sampleType: 'Citrated Plasma',
      description: 'Evaluation of intrinsic and common coagulation pathways (factors VIII, IX, XI, XII), hemophilia screening, and unfractionated heparin monitoring.'
    },
    {
      id: 'hem-09',
      name: 'Erythrocyte Sedimentation Rate (ESR / VS)',
      aliases: ['ESR', 'VS', 'Vitesse de sedimentation', 'Sed rate', 'Sedimentation rate'],
      category: 'Hematology',
      method: 'Westergren vertical column sedimentation reading at 1 hour / Automated infrared photometer',
      conditions: 'Sodium citrate or EDTA blood tube. Fasting sample preferred.',
      turnaroundTime: '1 hour 30 minutes',
      price: 2500,
      sampleType: 'Citrated / EDTA Whole Blood',
      description: 'Non-specific marker of systemic inflammation, infection, autoimmune disorders, and plasma protein alteration.'
    },
  
    // ==========================================
    // 3. SEROLOGY / IMMUNOLOGY
    // ==========================================
    {
      id: 'ser-01',
      name: 'HCV ELISA (Hepatitis C Virus Antibody)',
      aliases: ['HCV ELISA', 'Hepatitis C', 'Anti HCV', 'Hep C ELISA', 'Serologie VHC'],
      category: 'Serology / Immunology',
      method: '4th Generation Microplate Enzyme-Linked Immunosorbent Assay (ELISA) / Chemiluminescence',
      conditions: 'Venous blood drawn in serum gel tube (red/gold top). 8-hour fast preferred.',
      turnaroundTime: '24 hours',
      price: 10000,
      sampleType: 'Serum',
      description: 'High-specificity detection of antibodies directed against Hepatitis C core and non-structural viral proteins.'
    },
    {
      id: 'ser-02',
      name: 'HBsAg ELISA (Hepatitis B Surface Antigen)',
      aliases: ['HBsAg ELISA', 'AgHBs ELISA', 'HBs antigen', 'Hepatitis B ELISA', 'Australie antigen'],
      category: 'Serology / Immunology',
      method: 'High-sensitivity sandwich ELISA / Chemiluminescence immunoassay (CLIA)',
      conditions: 'Venous blood in serum tube. Fasting morning sample preferred.',
      turnaroundTime: '24 hours',
      price: 8000,
      sampleType: 'Serum',
      description: 'Primary diagnostic marker for acute or chronic Hepatitis B virus infection with quantitative detection limit.'
    },
    {
      id: 'ser-03',
      name: 'ASLO (Anti-Streptolysin O Titre)',
      aliases: ['ASLO', 'ASO', 'Anti streptolysine O', 'Antistreptolysin'],
      category: 'Serology / Immunology',
      method: 'Quantitative latex-enhanced immunoturbidimetry',
      conditions: 'Venous blood in serum tube. Avoid hemolyzed sample.',
      turnaroundTime: '2 hours after sampling',
      price: 5000,
      sampleType: 'Serum',
      description: 'Measurement of neutralizing antibodies to streptolysin O for post-streptococcal sequelae (rheumatic fever, glomerulonephritis).'
    },
    {
      id: 'ser-04',
      name: 'CA-125 (Ovarian Cancer Tumor Marker)',
      aliases: ['CA-125', 'CA 125', 'Cancer antigen 125', 'Marqueur CA 125'],
      category: 'Serology / Immunology',
      method: 'Chemiluminescent Microparticle Immunoassay (CMIA)',
      conditions: 'Venous serum tube. Avoid sampling during active menstruation, early pregnancy, or acute pelvic inflammatory disease.',
      turnaroundTime: '24 hours',
      price: 20000,
      sampleType: 'Serum',
      description: 'Tumor marker utilized in diagnosis, therapeutic response monitoring, and recurrence surveillance of epithelial ovarian cancer and endometriosis.'
    },
    {
      id: 'ser-05',
      name: 'CA 15-3 (Breast Cancer Tumor Marker)',
      aliases: ['CA 15-3', 'CA 15.3', 'Cancer antigen 15-3', 'Marqueur mammaire'],
      category: 'Serology / Immunology',
      method: 'Electrochemiluminescence Immunoassay (ECLIA)',
      conditions: 'Venous blood in serum tube.',
      turnaroundTime: '24 hours',
      price: 20000,
      sampleType: 'Serum',
      description: 'Circulating mucin-like glycoprotein marker used primarily to monitor therapy and disease course in metastatic breast adenocarcinoma.'
    },
    {
      id: 'ser-06',
      name: 'CA 19-9 (Pancreatic & Gastrointestinal Tumor Marker)',
      aliases: ['CA 19-9', 'CA 19.9', 'Gastrointestinal cancer marker', 'Marqueur pancreatique'],
      category: 'Serology / Immunology',
      method: 'Electrochemiluminescence Immunoassay (ECLIA)',
      conditions: 'Venous serum tube.',
      turnaroundTime: '24 hours',
      price: 20000,
      sampleType: 'Serum',
      description: 'Serum carbohydrate antigen used in evaluation and therapeutic monitoring of pancreatic, biliary tract, and colorectal carcinomas.'
    },
    {
      id: 'ser-07',
      name: 'C-Reactive Protein (CRP - High Sensitivity Quantitative)',
      aliases: ['CRP', 'C reactive protein', 'Proteine C reactive', 'hs-CRP'],
      category: 'Serology / Immunology',
      method: 'High-sensitivity particle-enhanced immunoturbidimetry',
      conditions: 'Venous serum tube.',
      turnaroundTime: '2 hours after sampling',
      price: 5000,
      sampleType: 'Serum',
      description: 'Rapid, sensitive acute-phase reactant quantifying systemic bacterial infection, tissue injury, and inflammatory flare-ups.'
    },
    {
      id: 'ser-08',
      name: 'CEA (Carcinoembryonic Antigen)',
      aliases: ['CEA', 'ACE', 'Antigene carcino embryonnaire', 'Carcinoembryonic antigen'],
      category: 'Serology / Immunology',
      method: 'Electrochemiluminescence Immunoassay (ECLIA)',
      conditions: 'Venous serum. Patient smoking history should be noted on request.',
      turnaroundTime: '24 hours',
      price: 18000,
      sampleType: 'Serum',
      description: 'Oncofetal oncogenic glycoprotein marker for monitoring colorectal, gastric, medullary thyroid, and lung carcinomas.'
    },
    {
      id: 'ser-09',
      name: 'Chlamydia IgG (Chlamydia Trachomatis IgG)',
      aliases: ['Chlamydia IgG', 'Anti Chlamydia IgG', 'Serologie Chlamydia IgG'],
      category: 'Serology / Immunology',
      method: 'Microplate Enzyme-Linked Immunosorbent Assay (ELISA)',
      conditions: 'Venous blood in serum tube.',
      turnaroundTime: '24 hours',
      price: 12000,
      sampleType: 'Serum',
      description: 'Serological assessment of chronic, past, or ascending Chlamydia trachomatis infection associated with tubal factor subfertility.'
    },
    {
      id: 'ser-10',
      name: 'Chlamydia IgM (Chlamydia Trachomatis IgM)',
      aliases: ['Chlamydia IgM', 'Anti Chlamydia IgM', 'Serologie Chlamydia IgM'],
      category: 'Serology / Immunology',
      method: 'Microplate Enzyme-Linked Immunosorbent Assay (ELISA)',
      conditions: 'Venous blood in serum tube.',
      turnaroundTime: '24 hours',
      price: 12000,
      sampleType: 'Serum',
      description: 'Serological indicator of primary or acute Chlamydia trachomatis infection.'
    },
    {
      id: 'ser-11',
      name: 'Chlamydia Trachomatis PCR (Molecular DNA Amplification)',
      aliases: ['Chlamydia PCR', 'Chlamydia DNA', 'PCR Chlamydia trachomatis'],
      category: 'Serology / Immunology',
      method: 'Real-Time Quantitative Polymerase Chain Reaction (RT-PCR)',
      conditions: 'Endocervical swab, urethral swab, or first-catch morning urine (15-20 mL). No urination 2 hours before sampling. No antibiotics for 10-14 days.',
      turnaroundTime: '3 days after sampling',
      price: 35000,
      sampleType: 'Genital Swab / First-Catch Urine',
      description: 'Gold-standard nucleic acid amplification test (NAAT) offering highest sensitivity and specificity for Chlamydia trachomatis.'
    },
    {
      id: 'ser-12',
      name: 'Chlamydia Trachomatis IgA',
      aliases: ['Chlamydia IgA', 'Anti Chlamydia IgA'],
      category: 'Serology / Immunology',
      method: 'Enzyme-Linked Immunosorbent Assay (ELISA)',
      conditions: 'Venous serum tube.',
      turnaroundTime: '24 hours',
      price: 14000,
      sampleType: 'Serum',
      description: 'Marker of mucosal secretory immune response indicating active or persistent mucosal chlamydial infection.'
    },
    {
      id: 'ser-13',
      name: 'Beta-HCG (Quantitative Total Serum HCG)',
      aliases: ['Beta HCG', 'B-HCG', 'Dosage Beta HCG', 'Quantitative pregnancy', 'hCG quantitative', 'Beta HCG plasmatique'],
      category: 'Serology / Immunology',
      method: 'Electrochemiluminescence Immunoassay (ECLIA)',
      conditions: 'Venous blood in serum tube. Fasting not mandatory.',
      turnaroundTime: '2 hours after sampling',
      price: 10000,
      sampleType: 'Serum',
      description: 'Exact quantitative measurement of human chorionic gonadotropin for confirming pregnancy, gestational dating, ectopic pregnancy triage, and gestational trophoblastic monitoring.'
    },
    {
      id: 'ser-14',
      name: 'Ferritin (Serum Ferritin)',
      aliases: ['Ferritin', 'Ferritine', 'Serum ferritin', 'Iron storage'],
      category: 'Serology / Immunology',
      method: 'Chemiluminescent Microparticle Immunoassay (CMIA)',
      conditions: 'Morning fasting blood sample preferred. No iron supplements or injections for 48 hours prior to test.',
      turnaroundTime: '4 hours after sampling',
      price: 12000,
      sampleType: 'Serum',
      description: 'Gold-standard assessment of total body iron stores for differentiating iron deficiency anemia from chronic disease anemia and hemochromatosis.'
    },
    {
      id: 'ser-15',
      name: 'Rheumatoid Factor (RF / Waaler-Rose)',
      aliases: ['Rheumatoid factor', 'Facteur rhumatoide', 'FR', 'Waaler Rose', 'Latex RF'],
      category: 'Serology / Immunology',
      method: 'Latex agglutination & turbidimetric autoantibody titration',
      conditions: 'Venous blood in serum tube.',
      turnaroundTime: '2 hours after sampling',
      price: 5000,
      sampleType: 'Serum',
      description: 'Autoantibody testing for the clinical diagnosis and ACR classification of rheumatoid arthritis and Sjogren syndrome.'
    },
    {
      id: 'ser-16',
      name: 'HERPES Simplex Virus 1 & 2 IgG (HSV 1/2 IgG)',
      aliases: ['Herpes IgG', 'HSV IgG', 'HSV 1 2 IgG', 'Serologie Herpes IgG'],
      category: 'Serology / Immunology',
      method: 'Type-specific glycoprotein G (gG1/gG2) ELISA',
      conditions: 'Venous blood in serum tube.',
      turnaroundTime: '24 hours',
      price: 15000,
      sampleType: 'Serum',
      description: 'Specific differentiation of past exposure and latent antibody immunity to Herpes Simplex Virus Type 1 (oral) and Type 2 (genital).'
    },
    {
      id: 'ser-17',
      name: 'HERPES Simplex Virus 1 & 2 IgM (HSV 1/2 IgM)',
      aliases: ['Herpes IgM', 'HSV IgM', 'HSV 1 2 IgM', 'Serologie Herpes IgM'],
      category: 'Serology / Immunology',
      method: 'Type-specific capture ELISA',
      conditions: 'Venous blood in serum tube.',
      turnaroundTime: '24 hours',
      price: 15000,
      sampleType: 'Serum',
      description: 'Diagnosis of acute primary herpes infection or active clinical reactivation.'
    },
    {
      id: 'ser-18',
      name: 'Hepatitis B Viral DNA PCR (HBV Viral Load)',
      aliases: ['HBV DNA', 'Charge virale VHB', 'Hepatitis B PCR', 'HBV viral load', 'ADN VHB'],
      category: 'Serology / Immunology',
      method: 'Quantitative Real-Time Polymerase Chain Reaction (qPCR - TaqMan)',
      conditions: 'Fresh EDTA whole blood or plasma. Separate plasma within 4 hours and store at -20°C if delayed.',
      turnaroundTime: '7 to 10 days after sampling',
      price: 50000,
      sampleType: 'EDTA Plasma',
      description: 'Quantification of circulating Hepatitis B virus genomic DNA (IU/mL) to evaluate viral replication, indication for antiviral therapy, and resistance emergence.'
    },
    {
      id: 'ser-19',
      name: 'HBsAb (Anti-HBs Quantitative Antibody / Post-Vaccine Titer)',
      aliases: ['HBsAb', 'Anti HBs', 'Ac anti HBs', 'Hepatitis B vaccine antibody', 'Post vaccination Anti-HBs'],
      category: 'Serology / Immunology',
      method: 'Electrochemiluminescence Immunoassay (ECLIA) quantitative titer (mIU/mL)',
      conditions: 'Venous blood in serum tube.',
      turnaroundTime: '24 hours',
      price: 10000,
      sampleType: 'Serum',
      description: 'Quantitative assessment of protective immunity against Hepatitis B following vaccination (>10 mIU/mL) or natural recovery.'
    },
    {
      id: 'ser-20',
      name: 'HBeAg (Hepatitis B e-Antigen)',
      aliases: ['HBeAg', 'AgHBe', 'HBe antigen', 'Hepatitis B e antigen'],
      category: 'Serology / Immunology',
      method: 'Chemiluminescent Microparticle Immunoassay (CMIA)',
      conditions: 'Venous blood in serum tube.',
      turnaroundTime: '24 hours',
      price: 12000,
      sampleType: 'Serum',
      description: 'Marker of high viral infectivity and active intrahepatic viral replication in chronic Hepatitis B.'
    },
    {
      id: 'ser-21',
      name: 'HBeAb (Anti-HBe Antibody)',
      aliases: ['HBeAb', 'Anti HBe', 'Ac anti HBe'],
      category: 'Serology / Immunology',
      method: 'Chemiluminescent Microparticle Immunoassay (CMIA)',
      conditions: 'Venous blood in serum tube.',
      turnaroundTime: '24 hours',
      price: 12000,
      sampleType: 'Serum',
      description: 'Seroconversion marker indicating cessation of active wild-type viral replication and favorable phase transition.'
    },
    {
      id: 'ser-22',
      name: 'HBcAb IgM (Anti-HBc IgM / Acute Hepatitis B Core Antibody)',
      aliases: ['HBcAb IgM', 'Anti HBc IgM', 'Ac anti HBc IgM', 'Core IgM'],
      category: 'Serology / Immunology',
      method: 'Capture ELISA / CMIA',
      conditions: 'Venous blood in serum tube.',
      turnaroundTime: '24 hours',
      price: 12000,
      sampleType: 'Serum',
      description: 'Definitive diagnostic marker for acute Hepatitis B infection or acute flare during the window period when HBsAg may be negative.'
    },
    {
      id: 'ser-23',
      name: 'Hepatitis B Total Anti-HBc (Total Core Antibodies IgG + IgM)',
      aliases: ['Total Anti HBc', 'Anti HBc total', 'Ac anti HBc totaux', 'HBcAb total'],
      category: 'Serology / Immunology',
      method: 'Competitive ELISA / CMIA',
      conditions: 'Venous blood in serum tube.',
      turnaroundTime: '24 hours',
      price: 12000,
      sampleType: 'Serum',
      description: 'Lifelong marker of exposure to natural Hepatitis B virus (positive in chronic carriers and resolved infections, negative in vaccinated persons).'
    },
    {
      id: 'ser-24',
      name: 'Hepatitis C Viral RNA RT-PCR (HCV Viral Load)',
      aliases: ['HCV RNA', 'Charge virale VHC', 'Hepatitis C PCR', 'HCV viral load', 'ARN VHC'],
      category: 'Serology / Immunology',
      method: 'Quantitative Reverse Transcription Real-Time PCR (RT-qPCR)',
      conditions: 'EDTA tube. Plasma must be separated within 2 to 4 hours and frozen immediately.',
      turnaroundTime: '7 to 10 days after sampling',
      price: 65000,
      sampleType: 'EDTA Plasma',
      description: 'Quantification of HCV RNA to confirm active replication prior to Direct-Acting Antiviral (DAA) therapy and verify Sustained Virologic Response (SVR).'
    },
    {
      id: 'ser-25',
      name: 'Hepatitis C Genotyping (HCV Genotype 1-6)',
      aliases: ['HCV Genotype', 'Genotypage VHC', 'Hepatitis C genotype'],
      category: 'Serology / Immunology',
      method: 'Real-Time RT-PCR & Line Probe Assay hybridization',
      conditions: 'HCV RNA positive EDTA plasma.',
      turnaroundTime: '10 to 14 days after sampling',
      price: 65000,
      sampleType: 'EDTA Plasma',
      description: 'Identification of specific Hepatitis C viral genotypes (1a, 1b, 2, 3, 4, 5, 6) for individualized pan-genotypic regimen guidance.'
    },
    {
      id: 'ser-26',
      name: 'Hepatitis Delta Total Antibodies (Anti-HDV)',
      aliases: ['Anti HDV', 'Hepatitis Delta', 'Delta antibodies', 'Serologie Delta'],
      category: 'Serology / Immunology',
      method: 'Microplate ELISA',
      conditions: 'Serum tube. HBsAg positive patients only.',
      turnaroundTime: '3 days after sampling',
      price: 25000,
      sampleType: 'Serum',
      description: 'Screening for Hepatitis D coinfection or superinfection in HBsAg carriers.'
    },
    {
      id: 'ser-27',
      name: 'Hepatitis Delta Viral RNA PCR (HDV RNA)',
      aliases: ['HDV RNA', 'PCR Delta', 'Charge virale Delta', 'HDV PCR'],
      category: 'Serology / Immunology',
      method: 'Real-Time RT-PCR',
      conditions: 'Fresh frozen plasma / serum.',
      turnaroundTime: '10 days after sampling',
      price: 60000,
      sampleType: 'Plasma / Serum',
      description: 'Molecular quantification of Hepatitis D viral load for monitoring disease activity and pegylated interferon response.'
    },
    {
      id: 'ser-28',
      name: 'Hepatitis E Serology (HEV IgG / IgM)',
      aliases: ['Hepatitis E', 'Anti HEV', 'HEV IgG', 'HEV IgM', 'Serologie VHE'],
      category: 'Serology / Immunology',
      method: 'Enzyme-Linked Immunosorbent Assay (ELISA)',
      conditions: 'Venous blood in serum tube.',
      turnaroundTime: '3 days after sampling',
      price: 25000,
      sampleType: 'Serum',
      description: 'Serological diagnosis of acute enterically transmitted Hepatitis E virus, critical in pregnant patients presenting with acute jaundice.'
    },
    {
      id: 'ser-29',
      name: 'Helicobacter Pylori (Serology / Stool Antigen)',
      aliases: ['H pylori', 'Helicobacter pylori', 'H. pylori stool antigen', 'H pylori serology', 'HP'],
      category: 'Serology / Immunology',
      method: 'Monoclonal antibody immunochromatography (Stool) / Rapid ELISA (Serum)',
      conditions: 'For stool antigen: fresh stool specimen; no antibiotics or proton-pump inhibitors (PPIs) for 2 weeks. For serum: fasting preferred.',
      turnaroundTime: '1 hour 30 minutes',
      price: 5000,
      sampleType: 'Stool Antigen / Venous Serum',
      description: 'Detection of active gastric Helicobacter pylori infection associated with peptic ulcer disease and chronic gastritis.'
    },
    {
      id: 'ser-30',
      name: 'Rubella IgG (Rubella Immunity Antibody)',
      aliases: ['Rubella IgG', 'Rubeole IgG', 'Serologie Rubeole IgG', 'Rubella titer'],
      category: 'Serology / Immunology',
      method: 'Electrochemiluminescence Immunoassay (ECLIA)',
      conditions: 'Venous serum tube.',
      turnaroundTime: '24 hours',
      price: 10000,
      sampleType: 'Serum',
      description: 'Pre-conception and antenatal screening to verify maternal immune protection against congenital rubella syndrome.'
    },
    {
      id: 'ser-31',
      name: 'Rubella IgM (Acute Rubella Antibody)',
      aliases: ['Rubella IgM', 'Rubeole IgM', 'Serologie Rubeole IgM'],
      category: 'Serology / Immunology',
      method: 'Capture Electrochemiluminescence Immunoassay (ECLIA)',
      conditions: 'Venous serum tube.',
      turnaroundTime: '24 hours',
      price: 10000,
      sampleType: 'Serum',
      description: 'Diagnosis of recent primary rubella infection during pregnancy or post-rash evaluation.'
    },
    {
      id: 'ser-32',
      name: 'Toxoplasmosis IgG (Toxoplasma Gondii IgG)',
      aliases: ['Toxoplasmosis IgG', 'Toxoplasmose IgG', 'Toxo IgG', 'Serologie Toxo IgG'],
      category: 'Serology / Immunology',
      method: 'Electrochemiluminescence Immunoassay (ECLIA) quantitative titer (IU/mL)',
      conditions: 'Venous serum tube.',
      turnaroundTime: '24 hours',
      price: 10000,
      sampleType: 'Serum',
      description: 'Antenatal serological screening to determine past exposure and immune status against Toxoplasma gondii.'
    },
    {
      id: 'ser-33',
      name: 'Toxoplasmosis IgM (Acute Toxoplasma Antibody)',
      aliases: ['Toxoplasmosis IgM', 'Toxoplasmose IgM', 'Toxo IgM', 'Serologie Toxo IgM'],
      category: 'Serology / Immunology',
      method: 'Capture Electrochemiluminescence Immunoassay (ECLIA)',
      conditions: 'Venous serum tube.',
      turnaroundTime: '24 hours',
      price: 10000,
      sampleType: 'Serum',
      description: 'Evaluation of acute primary maternal toxoplasmosis infection requiring fetal risk assessment and avidity testing.'
    },
    {
      id: 'ser-34',
      name: 'TPHA (Treponema Pallidum Hemagglutination Assay / Syphilis)',
      aliases: ['TPHA', 'Treponema pallidum', 'Syphilis TPHA', 'Serologie Syphilis'],
      category: 'Serology / Immunology',
      method: 'Specific Treponema pallidum indirect red cell hemagglutination',
      conditions: 'Venous blood in serum tube.',
      turnaroundTime: '2 hours after sampling',
      price: 4000,
      sampleType: 'Serum',
      description: 'Specific treponemal confirmatory test for Treponema pallidum antibodies in syphilis screening.'
    },
    {
      id: 'ser-35',
      name: 'VDRL / RPR (Syphilis Non-Treponemal Reagin Flocculation)',
      aliases: ['VDRL', 'RPR', 'Syphilis VDRL', 'Reagin test', 'BW'],
      category: 'Serology / Immunology',
      method: 'Cardiolipin-lecithin micro-flocculation carbon particle test with quantitative endpoint titer',
      conditions: 'Venous blood in serum tube.',
      turnaroundTime: '1 hour 30 minutes',
      price: 2500,
      sampleType: 'Serum',
      description: 'Non-treponemal test for active syphilis screening and post-treatment monitoring.'
    },
    {
      id: 'ser-36',
      name: 'Salmonella Stool Antigen / Widal & Felix Serology',
      aliases: ['Salmonella antigen', 'Widal', 'Widal and Felix', 'Typhoid test', 'Serodiagnostic de Widal', 'Salmonellose'],
      category: 'Serology / Immunology',
      method: 'Rapid monoclonal stool immunochromatography & Slide/tube somatic (O) and flagellar (H) agglutination',
      conditions: 'Fresh stool specimen or venous serum tube.',
      turnaroundTime: '2 hours after sampling',
      price: 4000,
      sampleType: 'Stool / Serum',
      description: 'Diagnostic screening for typhoid and paratyphoid enteric fever (Salmonella enterica serovars Typhi and Paratyphi).'
    },
    {
      id: 'ser-37',
      name: 'Pregnancy Test Blood (Serum Rapid hCG)',
      aliases: ['Pregnancy blood test', 'Test de grossesse sanguin', 'Serum pregnancy test', 'Blood hCG rapid'],
      category: 'Serology / Immunology',
      method: 'High-sensitivity immunochromatography (detection limit 10-25 mIU/mL)',
      conditions: 'Venous blood in serum or heparin tube.',
      turnaroundTime: '30 minutes',
      price: 3000,
      sampleType: 'Serum / Plasma',
      description: 'Rapid qualitative confirmation of pregnancy via venous blood with earlier detection than standard urine testing.'
    },
    {
      id: 'ser-38',
      name: 'Pregnancy Test Urine (hCG Urine Strip)',
      aliases: ['Pregnancy test urine', 'Test de grossesse urinaire', 'Urine hCG'],
      category: 'Serology / Immunology',
      method: 'Lateral flow colloidal gold immunochromatography',
      conditions: 'First-morning urine specimen (highest hCG concentration). Avoid excessive fluid intake prior to sampling.',
      turnaroundTime: '15 minutes',
      price: 1500,
      sampleType: 'Urine',
      description: 'Instant qualitative screening for human chorionic gonadotropin in urine.'
    },
  
    // ==========================================
    // 4. BIOCHEMISTRY
    // ==========================================
    {
      id: 'bio-01',
      name: 'Uric Acid (Serum Uric Acid / Uricemia)',
      aliases: ['Uric acid', 'Acide urique', 'Uricemia', 'Gout test', 'Urate'],
      category: 'Biochemistry',
      method: 'Enzymatic colorimetric Uricase / PAP method',
      conditions: '12-hour overnight fast. Abstain from alcohol and high-purine foods (red meat, seafood) for 24 hours.',
      turnaroundTime: '2 hours after sampling',
      price: 3500,
      sampleType: 'Serum',
      description: 'Quantification of purine metabolism for diagnosis and management of gout, hyperuricemia, and renal lithiasis.'
    },
    {
      id: 'bio-02',
      name: 'Albumin (Serum Albumin)',
      aliases: ['Albumin', 'Albumine', 'Albuminemie', 'Serum albumin'],
      category: 'Biochemistry',
      method: 'Bromocresol green (BCG) dye-binding spectrophotometry',
      conditions: 'Fasting venous serum.',
      turnaroundTime: '2 hours after sampling',
      price: 3500,
      sampleType: 'Serum',
      description: 'Assessment of hepatic synthesis function, nutritional status, and oncotic pressure regulation in nephrotic and chronic liver diseases.'
    },
    {
      id: 'bio-03',
      name: 'Amylase (Serum & Urine Amylase)',
      aliases: ['Amylase', 'Serum amylase', 'Amylasemie', 'Pancreatic amylase'],
      category: 'Biochemistry',
      method: 'Enzymatic colorimetric CNPG3 kinetic rate reaction',
      conditions: 'Fasting venous serum. Avoid narcotics/opiates prior to testing.',
      turnaroundTime: '2 hours after sampling',
      price: 6000,
      sampleType: 'Serum / Spot Urine',
      description: 'Emergency diagnostic biomarker for acute pancreatitis, pancreatic duct obstruction, and parotitis.'
    },
    {
      id: 'bio-04',
      name: 'Anti-Phospholipid Antibodies (aPL / Lupus Anticoagulant Panel)',
      aliases: ['Anti phospholipid', 'aPL', 'Antiphospholipides', 'Lupus anticoagulant', 'Anticardiolipin'],
      category: 'Biochemistry',
      method: 'ELISA (Anti-Cardiolipin IgG/IgM + Anti-Beta2-Glycoprotein I) & DRVVT Coagulation',
      conditions: 'Venous blood drawn in citrate and serum tubes. Avoid heparin therapy at sampling.',
      turnaroundTime: '3 days after sampling',
      price: 25000,
      sampleType: 'Citrated Plasma & Serum',
      description: 'Diagnostic workup for Antiphospholipid Syndrome (APS), unexplained venous/arterial thrombosis, and recurrent fetal loss.'
    },
    {
      id: 'bio-05',
      name: 'Apolipoprotein A1 (Apo-A1)',
      aliases: ['Apolipoprotein A1', 'Apo A1', 'ApoA1', 'Apolipoproteine A1'],
      category: 'Biochemistry',
      method: 'Particle-enhanced immunoturbidimetry',
      conditions: 'Strict 12-hour overnight fast.',
      turnaroundTime: '24 hours',
      price: 10000,
      sampleType: 'Serum',
      description: 'Major protein component of HDL particles; anti-atherogenic cardiovascular risk stratification marker.'
    },
    {
      id: 'bio-06',
      name: 'Apolipoprotein B (Apo-B)',
      aliases: ['Apolipoprotein B', 'Apo B', 'ApoB', 'Apolipoproteine B'],
      category: 'Biochemistry',
      method: 'Particle-enhanced immunoturbidimetry',
      conditions: 'Strict 12-hour overnight fast.',
      turnaroundTime: '24 hours',
      price: 10000,
      sampleType: 'Serum',
      description: 'Direct measurement of total atherogenic particle number (VLDL, IDL, LDL) providing superior cardiovascular risk estimation over LDL alone.'
    },
    {
      id: 'bio-07',
      name: 'Urine Strip (Multistix 10 Parameter Dipstick)',
      aliases: ['Urine strip', 'Bandelette urinaire', 'BU', 'Multistix', 'Urinalysis dipstick', 'Urine 10 parameters'],
      category: 'Biochemistry',
      method: 'Automated dry-chemistry reflectance photometry (10 parameters: Leukocytes, Nitrites, Urobilinogen, Protein, pH, Blood, Specific Gravity, Ketones, Bilirubin, Glucose)',
      conditions: 'Midstream clean-catch urine collected in clean dry container. Tested within 1 hour.',
      turnaroundTime: '30 minutes',
      price: 2000,
      sampleType: 'Fresh Urine',
      description: 'Rapid, point-of-care screening for kidney disease, urinary tract infections, diabetes, proteinuria, hematuria, and metabolic disorders.'
    },
    {
      id: 'bio-08',
      name: 'Bilirubin (Total, Direct & Indirect / T+D+I)',
      aliases: ['Bilirubin', 'Bilirubine', 'Total bilirubin', 'Direct bilirubin', 'Bilirubine totale directe', 'Bilirubin TDI', 'Jaundice test'],
      category: 'Biochemistry',
      method: 'Jendrassik-Grof diazotization photometric colorimetry',
      conditions: 'Fasting venous serum. Crucial: protect blood tube strictly from direct ambient light.',
      turnaroundTime: '2 hours after sampling',
      price: 4500,
      sampleType: 'Serum (Light-Protected)',
      description: 'Differential diagnostic evaluation of unconjugated vs conjugated hyperbilirubinemia in jaundice, hemolytic crises, and hepatobiliary obstruction.'
    },
    {
      id: 'bio-09',
      name: 'Calcium (Serum Total Calcium / Calcemia)',
      aliases: ['Calcium', 'Calcemia', 'Total calcium', 'Calcimie', 'Calcium serique'],
      category: 'Biochemistry',
      method: 'Arsenazo III / O-Cresolphthalein Complexone photometric colorimetry',
      conditions: 'Fasting morning serum. Avoid prolonged fist clenching or excessive tourniquet stasis during draw.',
      turnaroundTime: '2 hours after sampling',
      price: 3500,
      sampleType: 'Serum',
      description: 'Evaluation of bone metabolism, parathyroid disorders, renal osteodystrophy, and neuromuscular irritability.'
    },
    {
      id: 'bio-10',
      name: 'Chloride (Serum Chloride / Chloridemia)',
      aliases: ['Chloride', 'Chloridemia', 'Chlorure', 'Serum Cl', 'Electrolyte Cl'],
      category: 'Biochemistry',
      method: 'Ion Selective Electrode (ISE) direct potentiometry',
      conditions: 'Fasting venous serum or heparinized plasma.',
      turnaroundTime: '2 hours after sampling',
      price: 3500,
      sampleType: 'Serum / Plasma',
      description: 'Assessment of extracellular fluid volume, acid-base equilibrium, and anion gap calculations.'
    },
    {
      id: 'bio-11',
      name: 'Total Cholesterol (Serum Cholesterol)',
      aliases: ['Total cholesterol', 'Cholesterol total', 'Cholesterolemie', 'TC'],
      category: 'Biochemistry',
      method: 'Enzymatic CHOD-PAP colorimetry',
      conditions: 'Strict 12-hour overnight fasting (water allowed).',
      turnaroundTime: '2 hours after sampling',
      price: 3000,
      sampleType: 'Serum',
      description: 'Primary baseline parameter for assessing cardiovascular atherogenic risk and metabolic profile.'
    },
    {
      id: 'bio-12',
      name: 'HDL Cholesterol (High-Density Lipoprotein / "Good" Cholesterol)',
      aliases: ['HDL', 'HDL cholesterol', 'Bon cholesterol', 'High density lipoprotein'],
      category: 'Biochemistry',
      method: 'Direct homogenous clearance enzymatic assay without precipitation',
      conditions: 'Strict 12-hour overnight fast.',
      turnaroundTime: '2 hours after sampling',
      price: 4000,
      sampleType: 'Serum',
      description: 'Measurement of anti-atherogenic protective cholesterol involved in reverse cholesterol transport.'
    },
    {
      id: 'bio-13',
      name: 'LDL Cholesterol (Low-Density Lipoprotein / "Bad" Cholesterol)',
      aliases: ['LDL', 'LDL cholesterol', 'Mauvais cholesterol', 'Low density lipoprotein'],
      category: 'Biochemistry',
      method: 'Direct surfactant enzymatic clearance assay / Friedewald calculation',
      conditions: 'Strict 12-hour overnight fast.',
      turnaroundTime: '2 hours after sampling',
      price: 4000,
      sampleType: 'Serum',
      description: 'Principal target for lipid-lowering therapeutic interventions in coronary artery disease prevention.'
    },
    {
      id: 'bio-14',
      name: 'Urea Clearance (Creatinine & Urea Clearance Sync)',
      aliases: ['Urea clearance', 'Clairance de l uree', 'Renal clearance'],
      category: 'Biochemistry',
      method: 'Synchronized kinetic UV blood & urine urease assay',
      conditions: 'Fasting blood draw + timed 2-hour or 24-hour urine collection. Measure exact total urine volume.',
      turnaroundTime: '4 hours after sampling',
      price: 8000,
      sampleType: 'Serum + Timed Urine',
      description: 'Evaluation of glomerular filtration and fractional nitrogen excretion.'
    },
    {
      id: 'bio-15',
      name: 'Creatinine Clearance (24-Hour Urine & Cockcroft-Gault / eGFR)',
      aliases: ['Creatinine clearance', 'Clairance de la creatinine', 'eGFR', '24hr urine creatinine', 'DFG'],
      category: 'Biochemistry',
      method: 'Compensated kinetic Jaffe / Enzymatic reaction with timed urinary excretion math',
      conditions: 'Venous blood sample + exact 24-hour urine collection (discard first morning void, collect all subsequent urine including next day first morning void in large container kept cool). Record patient body weight and height.',
      turnaroundTime: '4 hours after sampling',
      price: 8000,
      sampleType: 'Serum + 24-Hour Urine',
      description: 'Accurate measured glomerular filtration rate (GFR) to stage chronic kidney disease and guide renally-cleared drug dosages.'
    },
    {
      id: 'bio-16',
      name: 'Creatinine (Serum Creatinine / Creatininemia)',
      aliases: ['Creatinine', 'Creatininemie', 'Serum creatinine', 'Creat', 'Kidney function'],
      category: 'Biochemistry',
      method: 'Kinetic compensated Jaffe IDMS-traceable / Enzymatic method',
      conditions: 'Fasting preferred. Avoid strenuous unaccustomed weightlifting or excessive cooked red meat intake 24h prior.',
      turnaroundTime: '2 hours after sampling',
      price: 3500,
      sampleType: 'Serum',
      description: 'Core biochemical marker of glomerular renal excretory function and acute kidney injury.'
    },
    {
      id: 'bio-17',
      name: 'Serum Protein Electrophoresis (SPEP / Electrophorese des Proteines)',
      aliases: ['SPEP', 'Protein electrophoresis', 'Electrophorese des proteines', 'Proteines seriques', 'Monoclonal spike', 'Myelome'],
      category: 'Biochemistry',
      method: 'Automated capillary zone electrophoresis / Agarose gel densitometry',
      conditions: 'Fasting unhemolyzed venous serum.',
      turnaroundTime: '24 hours',
      price: 15000,
      sampleType: 'Serum',
      description: 'Separation of serum proteins into 5-6 fractions (Albumin, Alpha-1, Alpha-2, Beta-1, Beta-2, Gamma) for detection of monoclonal gammopathies (multiple myeloma, MGUS) and nephrotic/inflammatory profiles.'
    },
    {
      id: 'bio-18',
      name: 'Gamma GT (GGT / Gamma-Glutamyl Transferase)',
      aliases: ['Gamma GT', 'GGT', 'Gamma glutamyl transferase', 'Gamma glutamyl transpeptidase'],
      category: 'Biochemistry',
      method: 'IFCC kinetic enzymatic photometric UV (L-gamma-glutamyl-3-carboxy-4-nitroanilide)',
      conditions: 'Fasting venous serum. Abstain strictly from alcoholic beverages for 48 hours prior.',
      turnaroundTime: '2 hours after sampling',
      price: 4000,
      sampleType: 'Serum',
      description: 'Sensitive enzyme marker for hepatobiliary cholestasis, biliary tree obstruction, and chronic alcohol induction.'
    },
    {
      id: 'bio-19',
      name: 'Fasting Blood Glucose (Glycemia / FBG)',
      aliases: ['Fasting blood glucose', 'Glycemie a jeun', 'FBG', 'Blood sugar', 'Glycemia', 'Glucose fasting'],
      category: 'Biochemistry',
      method: 'Enzymatic hexokinase / Glucose Oxidase (GOD-PAP) spectrophotometry',
      conditions: 'Strict 8 to 12 hours overnight fasting (plain water is permitted).',
      turnaroundTime: '1 hour after sampling',
      price: 2000,
      sampleType: 'Fluoride Plasma / Serum',
      description: 'Primary diagnostic standard for diabetes mellitus, impaired fasting glucose, and hypoglycemia screening.'
    },
    {
      id: 'bio-20',
      name: 'Postprandial / Random Blood Glucose',
      aliases: ['Postprandial glucose', 'Glycemie post prandiale', 'GPP', 'Random blood sugar', 'PPBS'],
      category: 'Biochemistry',
      method: 'Enzymatic GOD-PAP spectrophotometry',
      conditions: 'Sample taken exactly 2 hours after starting a standard balanced meal.',
      turnaroundTime: '1 hour after sampling',
      price: 2000,
      sampleType: 'Fluoride Plasma / Serum',
      description: 'Assessment of postprandial glycemic excursions and glycemic response to carbohydrate load.'
    },
    {
      id: 'bio-21',
      name: 'GOT & GPT (AST & ALT / Transaminases)',
      aliases: ['Transaminases', 'ASAT ALAT', 'GOT GPT', 'AST ALT', 'SGOT SGPT', 'Liver enzymes'],
      category: 'Biochemistry',
      method: 'IFCC UV kinetic method with pyridoxal phosphate activation',
      conditions: 'Fasting venous serum. Avoid heavy muscular exertion 24h before draw.',
      turnaroundTime: '2 hours after sampling',
      price: 5000,
      sampleType: 'Serum',
      description: 'Essential liver cytolysis biomarkers for acute hepatitis, toxic liver injury, non-alcoholic steatohepatitis (NASH), and cirrhosis.'
    },
    {
      id: 'bio-22',
      name: 'G6PD (Glucose-6-Phosphate Dehydrogenase Quantitative)',
      aliases: ['G6PD', 'Glucose 6 phosphate dehydrogenase', 'Favisme', 'Favism'],
      category: 'Biochemistry',
      method: 'Quantitative UV enzymatic spectrophotometric kinetic assay',
      conditions: 'EDTA or heparin whole blood. Avoid testing immediately after acute hemolytic crisis or recent blood transfusion (<2-3 months).',
      turnaroundTime: '24 hours',
      price: 12000,
      sampleType: 'EDTA Whole Blood',
      description: 'Quantitative diagnosis of G6PD erythrocyte enzyme deficiency before initiating oxidant medications (Primaquine, Dapsone, Rasburicase).'
    },
    {
      id: 'bio-23',
      name: 'Oral Glucose Tolerance Test (OGTT - 75g WHO 2-Hour Panel)',
      aliases: ['OGTT', 'HGPO', 'Hyperglycemie provoquee', 'Glucose tolerance test', 'Gestational diabetes OGTT'],
      category: 'Biochemistry',
      method: 'Serial calibrated enzymatic blood glucose determinations (0h, 1h, 2h)',
      conditions: 'Normal carbohydrate diet for 3 days prior. 10-12h overnight fast. Ingest 75g anhydrous glucose dissolved in 250mL water in 5 minutes. Remain seated, quiet, and non-smoking during the entire 2-hour duration.',
      turnaroundTime: '3 hours',
      price: 8000,
      sampleType: 'Fluoride Plasma (0h, 1h, 2h)',
      description: 'Definitive diagnostic test for gestational diabetes mellitus and impaired glucose tolerance (IGT).'
    },
    {
      id: 'bio-24',
      name: 'Complete Ionogram (Na+, K+, Cl-, Mg2+, Total Ca2+, Inorganic Phosphorus)',
      aliases: ['Complete ionogram', 'Ionogramme complet', 'Electrolytes complete', 'Iono complet', 'Iono 6 parameters'],
      category: 'Biochemistry',
      method: 'Direct Ion Selective Electrode (ISE) & Arsenazo/Phosphomolybdate Spectrophotometry',
      conditions: 'Fasting venous serum. Avoid hemolysis; rapid centrifugation.',
      turnaroundTime: '2 hours after sampling',
      price: 12000,
      sampleType: 'Serum',
      description: 'Comprehensive electrolyte balance profiling essential for renal failure, cardiac arrhythmia, dehydration, and intensive care management.'
    },
    {
      id: 'bio-25',
      name: 'Simple Ionogram (Na+, K+, Cl- / Basic Electrolytes)',
      aliases: ['Simple ionogram', 'Ionogramme simple', 'Basic electrolytes', 'Iono simple', 'Na K Cl'],
      category: 'Biochemistry',
      method: 'Direct Ion Selective Electrode (ISE) potentiometry',
      conditions: 'Fasting venous serum. Prompt centrifugation to prevent pseudohyperkalemia.',
      turnaroundTime: '2 hours after sampling',
      price: 7000,
      sampleType: 'Serum',
      description: 'Fundamental electrolyte evaluation monitoring Sodium, Potassium, and Chloride for fluid-electrolyte homeostasis.'
    },
    {
      id: 'bio-26',
      name: 'LDH (Lactate Dehydrogenase)',
      aliases: ['LDH', 'Lactate dehydrogenase', 'Lactico deshydrogenase'],
      category: 'Biochemistry',
      method: 'IFCC UV kinetic rate assay (Pyruvate to Lactate)',
      conditions: 'Venous serum. Crucial: strictly avoid any red blood cell hemolysis.',
      turnaroundTime: '2 hours after sampling',
      price: 5000,
      sampleType: 'Serum (Unhemolyzed)',
      description: 'General cellular necrosis and tissue turnover marker in hemolysis, hematological malignancies (lymphoma), and pulmonary embolism.'
    },
    {
      id: 'bio-27',
      name: 'Lipase (Serum Lipase)',
      aliases: ['Lipase', 'Lipasemie', 'Serum lipase', 'Pancreatic lipase'],
      category: 'Biochemistry',
      method: 'Enzymatic colorimetric rate method (1,2-o-dilauryl-rac-glycero-3-glutaric acid ester)',
      conditions: 'Fasting venous serum.',
      turnaroundTime: '2 hours after sampling',
      price: 7000,
      sampleType: 'Serum',
      description: 'Highest sensitivity and specificity enzymatic diagnostic biomarker for acute pancreatitis.'
    },
    {
      id: 'bio-28',
      name: 'Total Lipids (Serum Total Lipids)',
      aliases: ['Total lipids', 'Lipides totaux', 'Total fat'],
      category: 'Biochemistry',
      method: 'Sulfophosphovanillin colorimetric reaction',
      conditions: 'Strict 12-hour overnight fast.',
      turnaroundTime: '2 hours after sampling',
      price: 4000,
      sampleType: 'Serum',
      description: 'Measurement of circulating lipid fractions.'
    },
    {
      id: 'bio-29',
      name: 'Magnesium (Serum Magnesium / Magnesemia)',
      aliases: ['Magnesium', 'Magnesemie', 'Serum Mg', 'Magnesio'],
      category: 'Biochemistry',
      method: 'Calmagite / Xylidyl blue colorimetric spectrophotometry',
      conditions: 'Fasting venous serum.',
      turnaroundTime: '2 hours after sampling',
      price: 4000,
      sampleType: 'Serum',
      description: 'Diagnosis of hypomagnesemia and hypermagnesemia in refractory hypokalemia, muscle spasms, arrhythmias, and eclampsia therapy.'
    },
    {
      id: 'bio-30',
      name: 'Alkaline Phosphatase (ALP / Phosphatase Alcaline - PAL)',
      aliases: ['Alkaline phosphatase', 'PAL', 'Phosphatases alcalines', 'ALP'],
      category: 'Biochemistry',
      method: 'IFCC kinetic p-nitrophenyl phosphate photometric assay with AMP buffer',
      conditions: 'Fasting venous serum.',
      turnaroundTime: '2 hours after sampling',
      price: 4000,
      sampleType: 'Serum',
      description: 'Enzyme marker for bone turnover diseases (Paget disease, osteomalacia, bone metastases) and biliary tract obstruction.'
    },
    {
      id: 'bio-31',
      name: 'Phosphorus (Serum Inorganic Phosphorus / Phosphatemia)',
      aliases: ['Phosphorus', 'Phosphatemia', 'Phosphore', 'Phosphatemie', 'Inorganic phosphate'],
      category: 'Biochemistry',
      method: 'UV Ammonium Phosphomolybdate complex spectrophotometry',
      conditions: 'Morning fasting venous serum (phosphorus exhibits circadian fluctuation).',
      turnaroundTime: '2 hours after sampling',
      price: 3500,
      sampleType: 'Serum',
      description: 'Evaluation of mineral and bone disorder in chronic kidney disease, hypoparathyroidism, and vitamin D deficiency.'
    },
    {
      id: 'bio-32',
      name: 'Potassium (Serum Potassium / Kalemia - K+)',
      aliases: ['Potassium', 'Kalemia', 'Kaliemie', 'Serum K', 'K+'],
      category: 'Biochemistry',
      method: 'Direct Ion Selective Electrode (ISE) potentiometry',
      conditions: 'Venous blood drawn without prolonged tourniquet stasis; release tourniquet before blood enters tube; avoid fist pumping to prevent false hyperkalemia.',
      turnaroundTime: '1 hour 30 minutes',
      price: 3000,
      sampleType: 'Serum',
      description: 'Critical electrolyte regulating myocardial conduction, neuromuscular excitability, and cardiac rhythm stability.'
    },
    {
      id: 'bio-33',
      name: 'Lipid Profile (Full Lipid Panel: TC, HDL, LDL, VLDL, Triglycerides, TC/HDL Ratio)',
      aliases: ['Lipid profile', 'Bilan lipidique', 'Lipid panel', 'Cholesterol panel', 'EAL', 'Exploration anomalie lipidique'],
      category: 'Biochemistry',
      method: 'Full enzymatic colorimetric & homogenous clearance panel + calculated ratios',
      conditions: 'Strict 12 to 14 hours overnight fasting (water permitted). Abstain from alcohol 48 hours prior.',
      turnaroundTime: '2 hours after sampling',
      price: 10000,
      sampleType: 'Serum',
      description: 'Complete dyslipidemia evaluation providing Total Cholesterol, HDL-C, LDL-C, Triglycerides, VLDL, Non-HDL cholesterol, and atherogenic ratios.'
    },
    {
      id: 'bio-34',
      name: 'Total Protein (Serum Total Protein / Proteinemia)',
      aliases: ['Total protein', 'Proteines totales', 'Proteinemie', 'Serum total proteins'],
      category: 'Biochemistry',
      method: 'Biuret colorimetric photometric reaction',
      conditions: 'Fasting venous serum.',
      turnaroundTime: '2 hours after sampling',
      price: 3000,
      sampleType: 'Serum',
      description: 'Measurement of total circulating albumin and globulin fractions for assessing hydration status, liver disease, and systemic inflammation.'
    },
    {
      id: 'bio-35',
      name: '24-Hour Proteinuria (24hr Urinary Protein Excretion)',
      aliases: ['24hr proteinuria', 'Proteinurie des 24 heures', 'Proteinuria 24h', 'Albuminuria 24h'],
      category: 'Biochemistry',
      method: 'Pyrogallol red-molybdate colorimetric assay / Turbidimetry on timed 24-hour collection',
      conditions: 'Collect ALL urine passed over exactly 24 hours in large clean container. Keep container refrigerated or cool. Record exact total volume.',
      turnaroundTime: '3 hours after sampling',
      price: 4000,
      sampleType: '24-Hour Urine',
      description: 'Gold-standard quantitative assessment of renal protein loss in nephrotic syndrome, glomerulonephritis, and preeclampsia.'
    },
    {
      id: 'bio-36',
      name: 'Sodium (Serum Sodium / Natremia - Na+)',
      aliases: ['Sodium', 'Natremia', 'Natremie', 'Serum Na', 'Na+'],
      category: 'Biochemistry',
      method: 'Direct Ion Selective Electrode (ISE) potentiometry',
      conditions: 'Fasting venous serum.',
      turnaroundTime: '1 hour 30 minutes',
      price: 3000,
      sampleType: 'Serum',
      description: 'Primary extracellular cation determining plasma osmolality, hydration states (hyponatremia vs hypernatremia), and fluid volume regulation.'
    },
    {
      id: 'bio-37',
      name: 'Triglycerides (Serum Triglycerides / TG)',
      aliases: ['Triglycerides', 'Triglyceridimie', 'TG', 'Serum TG'],
      category: 'Biochemistry',
      method: 'Enzymatic GPO-PAP colorimetry with free glycerol blanking',
      conditions: 'Strict 12-hour overnight fast. Abstain strictly from alcohol for 24-48 hours prior.',
      turnaroundTime: '2 hours after sampling',
      price: 3500,
      sampleType: 'Serum',
      description: 'Assessment of cardiovascular disease risk and acute pancreatitis risk in extreme hypertriglyceridemia.'
    },
    {
      id: 'bio-38',
      name: 'Urea (Serum Urea / Blood Urea Nitrogen - BUN)',
      aliases: ['Urea', 'Uree', 'Uremie', 'BUN', 'Blood urea nitrogen', 'Uree sanguine'],
      category: 'Biochemistry',
      method: 'Urease-GLDH kinetic UV enzymatic method',
      conditions: 'Fasting venous serum.',
      turnaroundTime: '2 hours after sampling',
      price: 3000,
      sampleType: 'Serum',
      description: 'Primary end-product of protein catabolism assessing renal clearance capacity and hydration status (prerenal azotemia).'
    },
  
    // ==========================================
    // 5. HORMONES & TUMOR MARKERS
    // ==========================================
    {
      id: 'horm-01',
      name: 'Alpha-Fetoprotein (AFP)',
      aliases: ['Alpha fetoprotein', 'AFP', 'Alpha foetoproteine', 'Marqueur hepatique AFP'],
      category: 'Hormones & Tumor Markers',
      method: 'Electrochemiluminescence Immunoassay (ECLIA)',
      conditions: 'Venous blood in serum tube.',
      turnaroundTime: '24 hours',
      price: 15000,
      sampleType: 'Serum',
      description: 'Tumor marker for primary hepatocellular carcinoma (HCC) in cirrhotic patients and non-seminomatous testicular germ cell tumors.'
    },
    {
      id: 'horm-02',
      name: 'BNP / NT-proBNP (B-Type Natriuretic Peptide)',
      aliases: ['BNP', 'NT proBNP', 'proBNP', 'Brain natriuretic peptide', 'Marqueur cardiaque BNP'],
      category: 'Hormones & Tumor Markers',
      method: 'Chemiluminescent Microparticle Immunoassay (CMIA) / High-sensitivity ECLIA',
      conditions: 'Venous blood drawn in EDTA tube. Immediate cold processing.',
      turnaroundTime: '2 hours after sampling',
      price: 25000,
      sampleType: 'EDTA Plasma',
      description: 'Emergency cardiac biomarker for rapid triage and diagnosis of acute decompensated congestive heart failure (CHF) vs pulmonary dyspnea.'
    },
    {
      id: 'horm-03',
      name: 'Cortisol (Serum Cortisol - Morning 8 AM / Evening 4 PM)',
      aliases: ['Cortisol', 'Cortisolemie', 'Cortisol 8h', 'Stress hormone', 'Hydrocortisone'],
      category: 'Hormones & Tumor Markers',
      method: 'Electrochemiluminescence Immunoassay (ECLIA)',
      conditions: 'Morning blood drawn strictly between 7:30 AM and 8:30 AM (or afternoon at 4:00 PM for diurnal rhythm). Patient must rest quietly in waiting room for 20-30 minutes before blood draw; stress-free state.',
      turnaroundTime: '24 hours',
      price: 15000,
      sampleType: 'Serum',
      description: 'Adrenal glucocorticoid assessment for Cushing syndrome (hypercortisolemia) and Addison disease / adrenal insufficiency.'
    },
    {
      id: 'horm-04',
      name: 'CPK (Creatine Phosphokinase - Total / CK)',
      aliases: ['CPK', 'CK', 'Creatine kinase', 'Creatine phosphokinase', 'CK totale'],
      category: 'Hormones & Tumor Markers',
      method: 'IFCC UV kinetic photometric rate method (N-acetylcysteine activated)',
      conditions: 'Fasting venous serum. Abstain from heavy strenuous physical exercise or intramuscular injections for 48 hours prior.',
      turnaroundTime: '2 hours after sampling',
      price: 6000,
      sampleType: 'Serum',
      description: 'Enzyme marker of skeletal muscle damage (rhabdomyolysis, myositis, muscular dystrophies) and myocardial injury.'
    },
    {
      id: 'horm-05',
      name: 'CPK-MB (Creatine Kinase Myocardial Isoenzyme)',
      aliases: ['CPK MB', 'CK MB', 'CKMB', 'Creatine kinase MB'],
      category: 'Hormones & Tumor Markers',
      method: 'Immunoinhibition kinetic UV / ECLIA mass assay',
      conditions: 'Fasting venous serum.',
      turnaroundTime: '2 hours after sampling',
      price: 8000,
      sampleType: 'Serum',
      description: 'Cardiospecific isoenzyme for assessing myocardial injury and infarct size.'
    },
    {
      id: 'horm-06',
      name: 'D-Dimer (Quantitative D-Dimer)',
      aliases: ['D Dimer', 'D Dimere', 'D dimers', 'D-dimeres', 'Thrombosis test'],
      category: 'Hormones & Tumor Markers',
      method: 'Latex-enhanced high-sensitivity quantitative immunoturbidimetry / ELFA',
      conditions: 'Sodium citrate tube (light blue top), filled to mark. Immediate centrifugation.',
      turnaroundTime: '2 hours after sampling',
      price: 15000,
      sampleType: 'Citrated Plasma',
      description: 'Emergency exclusion test for deep vein thrombosis (DVT) and pulmonary embolism (PE), and monitoring Disseminated Intravascular Coagulation (DIC).'
    },
    {
      id: 'horm-07',
      name: 'FSH (Follicle Stimulating Hormone)',
      aliases: ['FSH', 'Follicle stimulating hormone', 'Hormone folliculo stimulante'],
      category: 'Hormones & Tumor Markers',
      method: 'Electrochemiluminescence Immunoassay (ECLIA)',
      conditions: 'Venous blood in serum tube. For females: specify exact day of menstrual cycle (Day 2 to 4 of menses for ovarian reserve baseline).',
      turnaroundTime: '24 hours',
      price: 12000,
      sampleType: 'Serum',
      description: 'Pituitary gonadotropin evaluating ovarian reserve, premature ovarian failure, menopause confirmation, and male spermatogenesis status.'
    },
    {
      id: 'horm-08',
      name: 'Glycated Hemoglobin (HbA1c / Hemoglobin A1c)',
      aliases: ['HbA1c', 'Glycated hemoglobin', 'Hemoglobine glyquee', 'Hemoglobin A1c', 'A1c', 'Diabetic control'],
      category: 'Hormones & Tumor Markers',
      method: 'Certified NGSP/IFCC High-Performance Liquid Chromatography (HPLC) / Enzymatic assay',
      conditions: 'Venous blood drawn in EDTA tube (purple top). Fasting is NOT mandatory.',
      turnaroundTime: '2 hours after sampling',
      price: 8000,
      sampleType: 'EDTA Whole Blood',
      description: 'Gold-standard 3-month retrospective glycemic control evaluation for diabetes management.'
    },
    {
      id: 'horm-09',
      name: 'LH (Luteinizing Hormone)',
      aliases: ['LH', 'Luteinizing hormone', 'Hormone luteinisante'],
      category: 'Hormones & Tumor Markers',
      method: 'Electrochemiluminescence Immunoassay (ECLIA)',
      conditions: 'Venous serum tube. Note phase of menstrual cycle.',
      turnaroundTime: '24 hours',
      price: 12000,
      sampleType: 'Serum',
      description: 'Evaluation of ovulation induction, polycystic ovary syndrome (LH/FSH ratio), and hypogonadotropic hypogonadism.'
    },
    {
      id: 'horm-10',
      name: 'Estradiol (17-Beta Estradiol / E2)',
      aliases: ['Estradiol', 'Oestradiol', 'E2', '17 beta estradiol', 'Estrogen'],
      category: 'Hormones & Tumor Markers',
      method: 'Electrochemiluminescence Immunoassay (ECLIA)',
      conditions: 'Venous serum tube. Specify cycle phase or menopausal status.',
      turnaroundTime: '24 hours',
      price: 12000,
      sampleType: 'Serum',
      description: 'Assessment of ovarian follicular function, fertility monitoring in assisted reproductive therapy, and amenorrhea evaluation.'
    },
    {
      id: 'horm-11',
      name: 'Free PSA (Free Prostate-Specific Antigen)',
      aliases: ['Free PSA', 'PSA libre', 'Free prostate specific antigen', 'PSA free'],
      category: 'Hormones & Tumor Markers',
      method: 'Electrochemiluminescence Immunoassay (ECLIA)',
      conditions: 'Venous serum. No digital rectal exam (DRE), prostate biopsy, cycling, or sexual ejaculation for 48 hours prior.',
      turnaroundTime: '24 hours',
      price: 15000,
      sampleType: 'Serum',
      description: 'Calculated Free/Total PSA ratio to differentiate benign prostatic hyperplasia (BPH) from prostate carcinoma in borderline total PSA range (4-10 ng/mL).'
    },
    {
      id: 'horm-12',
      name: 'Total PSA (Total Prostate-Specific Antigen)',
      aliases: ['Total PSA', 'PSA total', 'PSA', 'Prostate specific antigen', 'Prostate test'],
      category: 'Hormones & Tumor Markers',
      method: 'Electrochemiluminescence Immunoassay (ECLIA)',
      conditions: 'Venous serum. No prostate massage, transrectal ultrasound, catheterization, or ejaculation for 48 hours prior.',
      turnaroundTime: '24 hours',
      price: 12000,
      sampleType: 'Serum',
      description: 'Primary screening and monitoring tumor marker for prostate adenocarcinoma and benign prostatic hyperplasia.'
    },
    {
      id: 'horm-13',
      name: 'Procalcitonin (PCT - Severe Sepsis Marker)',
      aliases: ['Procalcitonin', 'Procalcitonine', 'PCT', 'Sepsis marker'],
      category: 'Hormones & Tumor Markers',
      method: 'Time-Resolved Amplified Cryptate Emission (TRACE) / CMIA',
      conditions: 'Venous blood in serum or lithium heparin tube.',
      turnaroundTime: '2 hours after sampling',
      price: 25000,
      sampleType: 'Serum / Plasma',
      description: 'Specific biomarker for severe systemic bacterial infection, bacteremia, and septic shock, guiding antibiotic initiation and de-escalation.'
    },
    {
      id: 'horm-14',
      name: 'Progesterone (Serum Progesterone)',
      aliases: ['Progesterone', 'Progesteronemie', 'Luteal progesterone'],
      category: 'Hormones & Tumor Markers',
      method: 'Electrochemiluminescence Immunoassay (ECLIA)',
      conditions: 'Venous serum tube. Usually drawn at mid-luteal phase (Day 21 of standard 28-day cycle) or in early pregnancy.',
      turnaroundTime: '24 hours',
      price: 12000,
      sampleType: 'Serum',
      description: 'Confirmation of ovulation (luteal adequacy) and early pregnancy corpus luteum viability.'
    },
    {
      id: 'horm-15',
      name: 'Prolactin (Serum Prolactin / Prolactinemia)',
      aliases: ['Prolactin', 'Prolactine', 'Prolactinemie', 'PRL'],
      category: 'Hormones & Tumor Markers',
      method: 'Electrochemiluminescence Immunoassay (ECLIA)',
      conditions: 'Morning fasting blood drawn between 8:00 AM and 10:00 AM. Patient must rest quietly in the lab for 20-30 minutes before venipuncture; stress-free and non-stimulated breasts.',
      turnaroundTime: '24 hours',
      price: 12000,
      sampleType: 'Serum',
      description: 'Evaluation of galactorrhea, pituitary prolactinoma adenomas, hyperprolactinemic amenorrhea, and male erectile dysfunction.'
    },
    {
      id: 'horm-16',
      name: 'Vitamin D (Total 25-Hydroxy Vitamin D / 25-OH D3 + D2)',
      aliases: ['Vitamin D', 'Vitamine D', '25 OH Vitamin D', '25-hydroxyvitamin D', 'Calcidiol', 'Vit D3'],
      category: 'Hormones & Tumor Markers',
      method: 'Direct competitive Chemiluminescence Immunoassay (CLIA) / LC-MS/MS',
      conditions: 'Fasting venous serum. Tube protected from light.',
      turnaroundTime: '24 hours',
      price: 25000,
      sampleType: 'Serum (Light Protected)',
      description: 'Quantitative assessment of total body vitamin D nutritional sufficiency for bone health, osteopenia, rickets, and immune balance.'
    },
    {
      id: 'horm-17',
      name: 'T3 Total (Triiodothyronine Total)',
      aliases: ['T3 Total', 'Triiodothyronine', 'T3 totale', 'Thyroid T3'],
      category: 'Hormones & Tumor Markers',
      method: 'Electrochemiluminescence Immunoassay (ECLIA)',
      conditions: 'Fasting venous serum.',
      turnaroundTime: '24 hours',
      price: 10000,
      sampleType: 'Serum',
      description: 'Thyroid hormone evaluation in suspected T3-thyrotoxicosis and peripheral thyroid hormone metabolism.'
    },
    {
      id: 'horm-18',
      name: 'FT3 (Free Triiodothyronine / T3 Libre)',
      aliases: ['FT3', 'Free T3', 'T3 libre', 'Free triiodothyronine'],
      category: 'Hormones & Tumor Markers',
      method: 'Electrochemiluminescence Immunoassay (ECLIA)',
      conditions: 'Fasting morning serum. If taking thyroid medication, take morning dose after blood draw.',
      turnaroundTime: '24 hours',
      price: 10000,
      sampleType: 'Serum',
      description: 'Measurement of active unbound circulating triiodothyronine independent of binding protein variations.'
    },
    {
      id: 'horm-19',
      name: 'T4 Total (Thyroxine Total)',
      aliases: ['T4 Total', 'Thyroxine', 'T4 totale', 'Thyroid T4'],
      category: 'Hormones & Tumor Markers',
      method: 'Electrochemiluminescence Immunoassay (ECLIA)',
      conditions: 'Fasting venous serum.',
      turnaroundTime: '24 hours',
      price: 10000,
      sampleType: 'Serum',
      description: 'Total thyroxine hormone measurement for thyroid gland production capacity.'
    },
    {
      id: 'horm-20',
      name: 'FT4 (Free Thyroxine / T4 Libre)',
      aliases: ['FT4', 'Free T4', 'T4 libre', 'Free thyroxine'],
      category: 'Hormones & Tumor Markers',
      method: 'Electrochemiluminescence Immunoassay (ECLIA)',
      conditions: 'Morning fasting venous serum.',
      turnaroundTime: '24 hours',
      price: 10000,
      sampleType: 'Serum',
      description: 'Primary diagnostic standard for primary, secondary hyperthyroidism, and hypothyroidism alongside TSH.'
    },
    {
      id: 'horm-21',
      name: 'Testosterone Total (Serum Total Testosterone)',
      aliases: ['Testosterone', 'Total testosterone', 'Testosterone totale', 'Androgen test'],
      category: 'Hormones & Tumor Markers',
      method: 'Electrochemiluminescence Immunoassay (ECLIA)',
      conditions: 'Venous blood drawn strictly in morning between 7:00 AM and 10:00 AM (testosterone exhibits diurnal morning peak).',
      turnaroundTime: '24 hours',
      price: 15000,
      sampleType: 'Serum',
      description: 'Evaluation of male hypogonadism, andropause, erectile dysfunction, and female hyperandrogenism (PCOS, hirsutism).'
    },
    {
      id: 'horm-22',
      name: 'Troponin I (High Sensitivity hs-cTnI / Cardiac Troponin)',
      aliases: ['Troponin I', 'Troponine I', 'hs-cTnI', 'Cardiac troponin', 'Heart attack test'],
      category: 'Hormones & Tumor Markers',
      method: 'High-Sensitivity Chemiluminescent Microparticle Immunoassay (hs-cTnI)',
      conditions: 'Venous blood drawn in serum or lithium heparin tube. Emergency stat processing.',
      turnaroundTime: '1 hour after sampling',
      price: 15000,
      sampleType: 'Serum / Heparin Plasma',
      description: 'Emergency gold-standard cardiac necrosis biomarker for acute myocardial infarction (NSTEMI / STEMI) triage.'
    },
    {
      id: 'horm-23',
      name: 'TSH (Thyroid Stimulating Hormone - 3rd Gen Ultrasensitive)',
      aliases: ['TSH', 'TSH ultrasensible', 'Thyrotropin', 'Thyroid stimulating hormone', 'TSHus'],
      category: 'Hormones & Tumor Markers',
      method: '3rd Generation Ultrasensitive Electrochemiluminescence Immunoassay (ECLIA)',
      conditions: 'Morning fasting serum sample preferred. Avoid high-dose Biotin supplements for 48 hours prior.',
      turnaroundTime: '4 hours after sampling',
      price: 8000,
      sampleType: 'Serum',
      description: 'First-line screening and monitoring parameter for primary thyroid dysfunction (hypothyroidism and hyperthyroidism).'
    }
  ];
  
  /**
   * Intelligent category matching helper:
   * Finds the exact official category for any test name or keyword query typed by a user.
   */
  export function findCategoryForTestName(query: string): OfficialCategory {
    if (!query || !query.trim()) return 'Hematology';
    const clean = query.trim().toLowerCase();
  
    // 1. Direct match on official catalog
    const match = OFFICIAL_MASTER_TEST_CATALOG.find(t => {
      if (t.name.toLowerCase().includes(clean) || clean.includes(t.name.toLowerCase())) return true;
      return t.aliases.some(a => a.toLowerCase().includes(clean) || clean.includes(a.toLowerCase()));
    });
  
    if (match) return match.category;
  
    // 2. Keyword heuristic mapping
    if (
      clean.includes('stool') ||
      clean.includes('culture') ||
      clean.includes('afb') ||
      clean.includes('tb') ||
      clean.includes('sputum') ||
      clean.includes('ecbu') ||
      clean.includes('urinoculture') ||
      clean.includes('swab') ||
      clean.includes('vaginal') ||
      clean.includes('urethral') ||
      clean.includes('pus') ||
      clean.includes('microfilaria') ||
      clean.includes('tape') ||
      clean.includes('sperm') ||
      clean.includes('semen') ||
      clean.includes('huhner') ||
      clean.includes('pap') ||
      clean.includes('csf') ||
      clean.includes('mycoplasma') ||
      clean.includes('malaria') ||
      clean.includes('ge') ||
      clean.includes('goutte')
    ) {
      return 'Microbiology';
    }
  
    if (
      clean.includes('blood count') ||
      clean.includes('fbc') ||
      clean.includes('cbc') ||
      clean.includes('nfs') ||
      clean.includes('hemoglobin') ||
      clean.includes('electrophoresis') ||
      clean.includes('blood group') ||
      clean.includes('rhesus') ||
      clean.includes('coombs') ||
      clean.includes('reticulocyte') ||
      clean.includes('prothrombin') ||
      clean.includes('pt') ||
      clean.includes('inr') ||
      clean.includes('fibrinogen') ||
      clean.includes('aptt') ||
      clean.includes('tca') ||
      clean.includes('esr') ||
      clean.includes('vs')
    ) {
      return 'Hematology';
    }
  
    if (
      clean.includes('elisa') ||
      clean.includes('hepatitis') ||
      clean.includes('hbv') ||
      clean.includes('hcv') ||
      clean.includes('hbs') ||
      clean.includes('hbe') ||
      clean.includes('hbc') ||
      clean.includes('delta') ||
      clean.includes('chlamydia') ||
      clean.includes('herpes') ||
      clean.includes('rubella') ||
      clean.includes('toxo') ||
      clean.includes('syphilis') ||
      clean.includes('tpha') ||
      clean.includes('vdrl') ||
      clean.includes('widal') ||
      clean.includes('crp') ||
      clean.includes('aslo') ||
      clean.includes('rf') ||
      clean.includes('waaler') ||
      clean.includes('pylori') ||
      clean.includes('pregnancy') ||
      clean.includes('grossesse') ||
      clean.includes('ca-125') ||
      clean.includes('ca 15-3') ||
      clean.includes('ca 19-9') ||
      clean.includes('cea')
    ) {
      return 'Serology / Immunology';
    }
  
    if (
      clean.includes('uric') ||
      clean.includes('albumin') ||
      clean.includes('amylase') ||
      clean.includes('apolipoprotein') ||
      clean.includes('strip') ||
      clean.includes('bilirubin') ||
      clean.includes('calcium') ||
      clean.includes('chloride') ||
      clean.includes('cholesterol') ||
      clean.includes('hdl') ||
      clean.includes('ldl') ||
      clean.includes('lipid') ||
      clean.includes('urea') ||
      clean.includes('creatinine') ||
      clean.includes('spep') ||
      clean.includes('gamma') ||
      clean.includes('ggt') ||
      clean.includes('glucose') ||
      clean.includes('glycemia') ||
      clean.includes('glycemie') ||
      clean.includes('got') ||
      clean.includes('gpt') ||
      clean.includes('ast') ||
      clean.includes('alt') ||
      clean.includes('g6pd') ||
      clean.includes('ogtt') ||
      clean.includes('hgpo') ||
      clean.includes('ionogram') ||
      clean.includes('iono') ||
      clean.includes('ldh') ||
      clean.includes('lipase') ||
      clean.includes('magnesium') ||
      clean.includes('phosphatase') ||
      clean.includes('phosphorus') ||
      clean.includes('potassium') ||
      clean.includes('protein') ||
      clean.includes('sodium') ||
      clean.includes('triglyceride')
    ) {
      return 'Biochemistry';
    }
  
    if (
      clean.includes('tsh') ||
      clean.includes('t3') ||
      clean.includes('t4') ||
      clean.includes('thyroid') ||
      clean.includes('testosterone') ||
      clean.includes('prolactin') ||
      clean.includes('progesterone') ||
      clean.includes('fsh') ||
      clean.includes('lh') ||
      clean.includes('estradiol') ||
      clean.includes('psa') ||
      clean.includes('cortisol') ||
      clean.includes('hba1c') ||
      clean.includes('vitamin d') ||
      clean.includes('bnp') ||
      clean.includes('troponin') ||
      clean.includes('procalcitonin') ||
      clean.includes('d-dimer') ||
      clean.includes('dimer') ||
      clean.includes('cpk') ||
      clean.includes('afp')
    ) {
      return 'Hormones & Tumor Markers';
    }
  
    return 'Hematology';
  }
  
  /**
   * Filter official catalog by search text and optional category
   */
  export function searchOfficialCatalog(query: string, categoryFilter?: string): OfficialTestDefinition[] {
    let list = OFFICIAL_MASTER_TEST_CATALOG;
  
    if (categoryFilter && categoryFilter !== 'All') {
      list = list.filter(t => t.category === categoryFilter);
    }
  
    if (!query || !query.trim()) {
      return list;
    }
  
    const q = query.toLowerCase().trim();
    return list.filter(t => 
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.method.toLowerCase().includes(q) ||
      t.conditions.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.aliases.some(a => a.toLowerCase().includes(q))
    );
  }
  