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
    facility: 'Clinical Facility'
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
    facility: 'Établissement de Santé'
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

  // Optional: still set the cookie for any third-party widgets that read it,
  // but DO NOT touch the select or force a change event.
  const setGoogleTranslateCookie = (lang: string) => {
    if (typeof document === 'undefined') return;
    try {
      const targetVal = `/en/${lang}`;
      document.cookie = `googtrans=${targetVal}; path=/;`;
      // domain variants if you really need them
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