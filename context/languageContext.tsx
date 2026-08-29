import React, { createContext, useContext, useState, useEffect } from 'react';
// Remove the import of initDomObserver / translateDOM / MEDICAL_AND_UI_TRANSLATIONS
// if you no longer need the DOM-mutation approach.
// Keep MEDICAL_AND_UI_TRANSLATIONS only if you still want the fallback inside t().

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<string, string>> = {
  en: {
    welcome: 'Welcome',
    login: 'Login',
    sign_in: 'Sign In',
    register: 'Register',
    patient: 'Patient',
    staff: 'Staff',
    dashboard: 'Dashboard',
    test_results: 'Test Results',
    appointments: 'Appointments',
    settings: 'Settings',
    logout: 'Logout',
    select_language: 'Select Language',
    language: 'Language',
    english: 'English',
    french: 'Français',
    referring_doctor: 'Referring Doctor',
    accredited_doctor: 'Accredited Doctor',
    self_referred: 'None / Self-Referred',
    other_doctor: 'Other Doctor',
    insurance_provider: 'Insurance Provider',
    policy_number: 'Policy Number',
    coverage: 'Coverage',
    receptionist: 'Reception Desk',
    cashier: 'Cashier Desk',
    analyzer: 'Phlebotomy / Sample Desk',
    lab_tech: 'Laboratory Technologist',
    biologist: 'Clinical Biologist',
    admin: 'Lab Administrator',
    superadmin: 'Super Administrator',
    pending_validation: 'Pending Check-In',
    pending_payment: 'Pending Payment',
    pending_collection: 'Pending Collection',
    in_lab_testing: 'In Lab Testing',
    completed: 'Completed & Released',
    ready_for_pickup: 'Ready For Pickup',
    status: 'Status',
    live_sync: 'Live Sync Active',
    unpaid: 'Unpaid',
    paid: 'Paid',
    search: 'Search',
    filter: 'Filter',
    actions: 'Actions',
    patient_id: 'Patient ID / PID',
    access_code: 'Access Code / PIN',
    invoice: 'Medical Invoice',
    receipt: 'Official Receipt',
    diagnostic_report: 'Official Diagnostic Report',
    send_email: 'Send via Email',
    email_dispatched: 'Email Dispatched',
    new_patient: 'Register Walk-In Patient',
    book_test: 'Order Tests',
    sample_collected: 'Sample Collected',
    save_results: 'Authorize Findings',
    turnaround_time: 'Turnaround Time',
    facility: 'Clinical Facility',
    
    // Login Screen Texts
    portal_title: 'nanoLabs Portal',
    portal_subtitle: 'Sign in with your staff credentials or patient passcode',
    founder_story: 'Founder Story',
    looking_for_lab: 'Looking for a lab around you?',
    browse_accredited: 'Browse accredited diagnostic centers',
    search_lab_btn: 'Search',
    assigned_lab_label: 'Assigned Laboratory / Center',
    search_to_select: 'Search to select',
    search_or_select_placeholder: 'Search or Select Laboratory (Optional)',
    search_input_placeholder: 'Search laboratory name, city, or address...',
    no_lab_found: 'No laboratory found matching your search.',
    type_lab_to_search: 'Type laboratory name to search...',
    access_code_label: 'Access Code / Passcode / OTP *',
    staff_and_patients: 'Staff & Patients',
    access_code_placeholder: 'Enter access code or email OTP',
    access_code_hint: 'Staff: Enter your email setup OTP or private password. Patients: Enter your registration passcode.',
    sign_in_btn: 'Sign In to Portal',
    authenticating: 'Authenticating Credentials...',
    new_patient_prompt: 'New patient? Register your profile here',
    register_lab_btn: 'Register New Diagnostic Facility',
    
    // Carousel Slide Translations
    slide_mission_tag: 'Clinical Network',
    slide_mission_title: 'Precision Diagnostics & Healthcare Network',
    slide_mission_subtitle: 'Connecting patients, medical clinicians, and accredited laboratories across Cameroon & Central Africa.',
    slide_mission_desc: 'nanoLabs provides high-accuracy diagnostic orchestration with unified digital booklets, automated analyzer feeds, and zero-leakage patient confidentiality.',
    stat_network_facilities: 'Network Facilities',
    stat_diagnostic_tests: 'Diagnostic Tests',
    stat_uptime_sla: 'Uptime SLA',

    slide_founder_tag: 'Founder & Vision',
    slide_founder_title: 'Pioneering Decentralized Health Intelligence',
    slide_founder_subtitle: 'Founded with a singular commitment: fast, transparent, and dignified healthcare for every patient.',
    slide_founder_desc: 'Engineered by 16-year-old visionary Mangi Lerine Laslie Jr, nanoLabs eliminates administrative friction in diagnostic medicine, providing rapid test turnarounds and ironclad confidentiality.',
    stat_founded: 'Founded',
    stat_founder_age: 'Visionary Age',
    stat_patient_trust: 'Patient Trust',

    slide_security_tag: 'Zero-Knowledge Security',
    slide_security_title: 'Bank-Grade Cryptographic Medical Ledger',
    slide_security_subtitle: 'Every patient record, invoice, and diagnostic result is protected with AES-256 field-level encryption.',
    slide_security_desc: 'Strict Role-Based Access Control (RBAC) ensures financial staff never see clinical test data, and lab technicians only access their assigned clinical tests.',
    stat_encryption: 'Encryption',
    stat_rbac_roles: 'RBAC Roles',
    stat_compliance: 'HIPAA & GDPR',

    slide_speed_tag: 'Real-Time Workflow',
    slide_speed_title: 'Automated Phlebotomy to Report Release',
    slide_speed_subtitle: 'Seamless orchestration between Admissions, Cashier, Specimen Desk, and Lab Technologists.',
    slide_speed_desc: 'Track specimen tubes with automated barcode identifiers, perform digital verification, and publish QR-authenticated clinical booklets instantly.',
    stat_avg_turnaround: 'Avg Turnaround',
    stat_barcode_sync: 'Barcode Sync',
    stat_digital_booklets: 'Digital Booklets',

    // Founder Story & About Modal
    about_nanolabs_title: 'About nanoLabs Health Care',
    about_nanolabs_subtitle: 'Next-Generation Zero-Knowledge Laboratory Operating System',
    founder_name: 'Mangi Lerine Laslie Jr',
    founder_role_sub: 'Visionary Founder & Lead Architect',
    founder_system_tag: 'nanoLabs Health Care OS',
    founder_age_badge: 'Founder at 16',
    founder_bio_full: 'Engineered from the ground up by 16-year-old visionary Mangi Lerine Laslie Jr, nanoLabs was created to eliminate administrative friction in diagnostic medicine, accelerate test turnaround times, and establish ironclad cryptographic privacy for patients and medical practitioners across Cameroon and Central Africa.',
    guarantees_title: 'Enhanced Security & Architecture Guarantees',
    zk_title: 'Zero-Knowledge Staff Governance',
    zk_desc: 'Administrators assign job roles only. Employees receive cryptographically hashed OTPs and set permanent private passwords that even administrators cannot access.',
    isolation_title: 'Role-Isolated Portal Security',
    isolation_desc: 'Strict separation of duties. Cashiers handle billing without clinical access; Phlebotomists accession samples; Lab Techs verify results under AES-GCM encryption.',
    ai_title: 'nanoLabs AI Diagnostic Assist',
    ai_desc: 'Privacy-preserving AI summarization of facility throughput, stock reorder forecasting, and multi-department operational audits with zero patient PII exposure.',
    billing_title: 'Automated Invoicing & Co-Pay',
    billing_desc: 'Split-billing supporting 100% and partial insurance policies, MTN Mobile Money, Orange Money, Cash, and instant cryptographic receipts.',
    close_return: 'Close & Return to Login'
  },
  fr: {
    welcome: 'Bienvenue',
    login: 'Connexion',
    sign_in: 'Se Connecter',
    register: 'Inscription',
    patient: 'Patient',
    staff: 'Personnel Médical',
    dashboard: 'Tableau de bord',
    test_results: 'Résultats d\'analyses',
    appointments: 'Rendez-vous',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    select_language: 'Choisir la langue',
    language: 'Langue',
    english: 'English',
    french: 'Français',
    referring_doctor: 'Médecin Prescripteur',
    accredited_doctor: 'Médecin Agréé',
    self_referred: 'Aucun / Auto-prescrit',
    other_doctor: 'Autre Médecin',
    insurance_provider: 'Assureur / Mutuelle',
    policy_number: 'Numéro de police / Matricule',
    coverage: 'Taux de couverture',
    receptionist: 'Accueil & Enregistrement',
    cashier: 'Caisse & Facturation',
    analyzer: 'Prélèvement / Échantillonnage',
    lab_tech: 'Technicien de Laboratoire',
    biologist: 'Biologiste / Pathologiste',
    admin: 'Administrateur du Laboratoire',
    superadmin: 'Super Administrateur',
    pending_validation: 'En Attente de Validation',
    pending_payment: 'En Attente de Paiement',
    pending_collection: 'En Attente de Prélèvement',
    in_lab_testing: 'Analyse en Cours',
    completed: 'Validé & Publié',
    ready_for_pickup: 'Prêt pour Retrait',
    status: 'Statut',
    live_sync: 'Synchronisation en Direct',
    unpaid: 'Non Payé',
    paid: 'Payé',
    search: 'Rechercher',
    filter: 'Filtrer',
    actions: 'Actions',
    patient_id: 'Identifiant Patient / PID',
    access_code: 'Code d\'Accès / PIN',
    invoice: 'Facture Médicale',
    receipt: 'Reçu de Paiement',
    diagnostic_report: 'Rapport d\'Analyses Médicales',
    send_email: 'Envoyer par E-mail',
    email_dispatched: 'E-mail Transmis',
    new_patient: 'Enregistrer un Patient',
    book_test: 'Prescrire des Examens',
    sample_collected: 'Échantillon Pratique',
    save_results: 'Valider les Résultats',
    turnaround_time: 'Délai d\'Exécution',
    facility: 'Établissement de Santé',

    // Login Screen Texts in French
    portal_title: 'Portail nanoLabs',
    portal_subtitle: 'Connectez-vous avec vos identifiants professionnels ou votre code patient',
    founder_story: 'Histoire du Fondateur',
    looking_for_lab: 'Vous cherchez un laboratoire près de chez vous ?',
    browse_accredited: 'Consultez les centres de diagnostic agréés',
    search_lab_btn: 'Rechercher',
    assigned_lab_label: 'Laboratoire / Centre Assigné',
    search_to_select: 'Rechercher pour sélectionner',
    search_or_select_placeholder: 'Rechercher ou sélectionner un laboratoire (Optionnel)',
    search_input_placeholder: 'Rechercher par nom, ville ou adresse...',
    no_lab_found: 'Aucun laboratoire trouvé correspondant à votre recherche.',
    type_lab_to_search: 'Saisissez le nom du laboratoire pour rechercher...',
    access_code_label: 'Code d\'Accès / Mot de Passe / OTP *',
    staff_and_patients: 'Personnel & Patients',
    access_code_placeholder: 'Entrez votre code d\'accès ou code OTP',
    access_code_hint: 'Personnel: Entrez votre code de configuration ou mot de passe privé. Patients: Entrez votre code d\'accès.',
    sign_in_btn: 'Se Connecter au Portail',
    authenticating: 'Vérification des identifiants...',
    new_patient_prompt: 'Nouveau patient ? Enregistrez votre profil ici',
    register_lab_btn: 'Enregistrer un Nouveau Laboratoire',

    // Carousel Slide Translations in French
    slide_mission_tag: 'Réseau Clinique',
    slide_mission_title: 'Réseau Médical de Diagnostic de Précision',
    slide_mission_subtitle: 'Connecter les patients, les médecins prescripteurs et les laboratoires accrédités au Cameroun et en Afrique centrale.',
    slide_mission_desc: 'nanoLabs assure l\'orchestration diagnostique de haute précision avec livrets numériques unifiés, flux d\'automates et confidentialité absolue du patient.',
    stat_network_facilities: 'Établissements Réseau',
    stat_diagnostic_tests: 'Analyses Médicales',
    stat_uptime_sla: 'Disponibilité',

    slide_founder_tag: 'Fondateur & Vision',
    slide_founder_title: 'Pionnier de l\'Intelligence Médicale Décentralisée',
    slide_founder_subtitle: 'Fondé avec un engagement singulier : des soins rapides, transparents et dignes pour chaque patient.',
    slide_founder_desc: 'Conçu par le visionnaire de 16 ans Mangi Lerine Laslie Jr, nanoLabs élimine les lourdeurs administratives en biologie médicale, réduisant les délais et garantissant la sécurité des données.',
    stat_founded: 'Fondation',
    stat_founder_age: 'Âge du Visionnaire',
    stat_patient_trust: 'Confiance Patients',

    slide_security_tag: 'Sécurité Zéro-Connaissance',
    slide_security_title: 'Registre Médical Cryptographique de Niveau Bancaire',
    slide_security_subtitle: 'Chaque dossier patient, facture et résultat d\'analyse est protégé par un chiffrement AES-256.',
    slide_security_desc: 'Le contrôle d\'accès strict par rôle (RBAC) garantit que le personnel financier n\'accède jamais aux analyses cliniques, et les techniciens uniquement à leurs dossiers.',
    stat_encryption: 'Chiffrement',
    stat_rbac_roles: 'Niveaux RBAC',
    stat_compliance: 'Conformité HIPAA/RGPD',

    slide_speed_tag: 'Flux en Temps Réel',
    slide_speed_title: 'Du Prélèvement à la Publication du Rapport',
    slide_speed_subtitle: 'Orchestration fluide entre Accueil, Caisse, Salle de Prélèvement et Technologistes de Laboratoire.',
    slide_speed_desc: 'Suivez les tubes d\'échantillons avec codes-barres automatisés, effectuez la validation numérique et publiez instantanément des livrets certifiés par QR code.',
    stat_avg_turnaround: 'Délai Moyen',
    stat_barcode_sync: 'Synchro Code-barres',
    stat_digital_booklets: 'Livrets Numériques',

    // Founder Story & About Modal in French
    about_nanolabs_title: 'À propos de nanoLabs Health Care',
    about_nanolabs_subtitle: 'Système d\'Exploitation de Laboratoire Médical Nouvelle Génération',
    founder_name: 'Mangi Lerine Laslie Jr',
    founder_role_sub: 'Fondateur Visionnaire & Architecte Principal',
    founder_system_tag: 'nanoLabs Health Care OS',
    founder_age_badge: 'Fondateur à 16 ans',
    founder_bio_full: 'Développé de A à Z par le jeune visionnaire de 16 ans Mangi Lerine Laslie Jr, nanoLabs a été créé pour éliminer les lenteurs administratives dans le diagnostic médical, accélérer les délais d\'analyse et établir une confidentialité cryptographique inviolable pour les patients et professionnels de santé au Cameroun et en Afrique.',
    guarantees_title: 'Garanties d\'Architecture & Sécurité Renforcées',
    zk_title: 'Gouvernance du Personnel Zéro-Connaissance',
    zk_desc: 'Les administrateurs attribuent uniquement les rôles. Les employés reçoivent un code OTP haché et définissent un mot de passe permanent privé, inaccessible même aux administrateurs.',
    isolation_title: 'Isolation Stricte des Portails par Rôle',
    isolation_desc: 'Séparation stricte des tâches. Les caissiers gèrent la facturation sans accès médical; les préleveurs réceptionnent les échantillons; les techniciens valident les résultats sous chiffrement AES.',
    ai_title: 'nanoLabs Assistant IA & Audit',
    ai_desc: 'Synthèse par IA préservant la vie privée sur le débit du laboratoire, la prévision des stocks de réactifs et l\'audit opérationnel multi-départements sans exposition de données personnelles.',
    billing_title: 'Facturation & Tiers-Payant Automatisés',
    billing_desc: 'Gestion des assurances et mutuelles (100% ou co-paiement), MTN Mobile Money, Orange Money, Espèces et reçus cryptographiques instantanés.',
    close_return: 'Fermer & Retourner à la Connexion'
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    try {
      return localStorage.getItem('nanolabs_language') || 'en';
    } catch {
      return 'en';
    }
  });

  const setGoogleTranslateCookie = (lang: string) => {
    if (typeof document === 'undefined') return;
    try {
      const targetVal = `/en/${lang}`;
      document.cookie = `googtrans=${targetVal}; path=/;`;
      if (window.location.hostname) {
        document.cookie = `googtrans=${targetVal}; path=/; domain=${window.location.hostname};`;
      }
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (select && select.value !== lang) {
        select.value = lang;
        select.dispatchEvent(new Event('change'));
      }
    } catch {
      // ignore
    }
  };

  const setLanguage = (lang: string) => {
    if (lang === language) return;          // prevent unnecessary work
    setLanguageState(lang);
    try {
      localStorage.setItem('nanolabs_language', lang);
    } catch {
      // ignore
    }
    setGoogleTranslateCookie(lang);         // safe – no reload trigger
    // ❌ DO NOT call initDomObserver(lang) here
  };

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  // Only run once on mount (or when language really changes) – no DOM observer
  useEffect(() => {
    setGoogleTranslateCookie(language);
    // ❌ DO NOT call initDomObserver(language)
  }, [language]);

  const t = (key: string): string => {
    if (translations[language]?.[key]) {
      return translations[language][key];
    }
    // Keep this only if you still want the medical dictionary fallback
    // if (MEDICAL_AND_UI_TRANSLATIONS[key] && language === 'fr') {
    //   return MEDICAL_AND_UI_TRANSLATIONS[key];
    // }
    if (translations.en?.[key]) {
      return translations.en[key];
    }
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);