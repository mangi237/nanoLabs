import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getLocales} from 'expo-localization';

type Language = 'en' | 'fr' ;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: any) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const locales = getLocales();
// const currentLocale = locales[0].languageCode;
const currentLocale = getLocales()[0].languageTag || 'en-US';
// Translations
const translations = {
  en: {
    app_name: 'nanoLabs',
    welcome: 'Welcome',
    login: 'Login',
    logout: 'Logout',
    access_code: 'Access Code',
    lab_id: 'Lab ID',
    select_your_lab: 'Select Your Lab',
    search_lab: 'Search lab...',
    no_labs_found: 'No labs found',
    login_to_your_lab: 'Login to your lab',
    new_patient_register_here: 'New patient? Register here',
    patient_registration: 'Patient Registration',
    create_your_account: 'Create your account to get started',
    start_registration: 'Start Registration',
    error: 'Error',
    fill_all_fields: 'Please fill all fields',
    invalid_credentials: 'Invalid credentials',
    register: 'Register',
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    status: 'Status',
    date: 'Date',
    time: 'Time',
    amount: 'Amount',
    actions: 'Actions',
    dashboard: 'Dashboard',
    settings: 'Settings',
    profile: 'Profile',
    notifications: 'Notifications',
    patients: 'Patients',
    tests: 'Tests',
    billing: 'Billing',
    reports: 'Reports',
    inventory: 'Inventory',
    staff: 'Staff',
    pending: 'Pending',
    completed: 'Completed',
    processing: 'Processing',
    collected: 'Sample Collected',
    requested: 'Requested',
    paid: 'Paid',
    virtual_results: 'Virtual Results',
    transfer: 'Transfer',
    share_results: 'Share Results',
    choose_lab_to_continue: 'Choose a lab to continue',
    try_different_search: 'Try a different search term',
    registration_complete: 'Registration Complete!',
    waiting_for_confirmation: 'Waiting for confirmation from receptionist',
    go_to_receptionist: 'Please visit the receptionist to confirm your registration',
  },
  fr: {
    app_name: 'nanoLabs',
    welcome: 'Bienvenue',
    login: 'Connexion',
    logout: 'Déconnexion',
    access_code: "Code d'accès",
    lab_id: 'ID Laboratoire',
    select_your_lab: 'Sélectionnez votre laboratoire',
    search_lab: 'Rechercher un laboratoire...',
    no_labs_found: 'Aucun laboratoire trouvé',
    login_to_your_lab: 'Connectez-vous à votre laboratoire',
    new_patient_register_here: 'Nouveau patient ? Inscrivez-vous ici',
    patient_registration: 'Inscription du patient',
    create_your_account: 'Créez votre compte pour commencer',
    start_registration: "Commencer l'inscription",
    error: 'Erreur',
    fill_all_fields: 'Veuillez remplir tous les champs',
    invalid_credentials: 'Identifiants invalides',
    register: "S'inscrire",
    confirm: 'Confirmer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    search: 'Rechercher',
    filter: 'Filtrer',
    status: 'Statut',
    date: 'Date',
    time: 'Heure',
    amount: 'Montant',
    actions: 'Actions',
    dashboard: 'Tableau de bord',
    settings: 'Paramètres',
    profile: 'Profil',
    notifications: 'Notifications',
    patients: 'Patients',
    tests: 'Tests',
    billing: 'Facturation',
    reports: 'Rapports',
    inventory: 'Inventaire',
    staff: 'Personnel',
    pending: 'En attente',
    completed: 'Terminé',
    processing: 'En cours',
    collected: 'Échantillon collecté',
    requested: 'Demandé',
    paid: 'Payé',
    virtual_results: 'Résultats virtuels',
    transfer: 'Transfert',
    share_results: 'Partager les résultats',
    choose_lab_to_continue: 'Choisissez un laboratoire pour continuer',
    try_different_search: 'Essayez un autre terme de recherche',
    registration_complete: 'Inscription terminée !',
    waiting_for_confirmation: "En attente de confirmation du réceptionniste",
    go_to_receptionist: 'Veuillez vous rendre au réceptionniste pour confirmer votre inscription',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem('appLanguage');
      if (savedLang) {
        setLanguage(savedLang as Language);
      } else {
        const deviceLang = currentLocale.split('-')[0];
        setLanguage(deviceLang === 'fr' ? 'fr' : 'en');
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const t = (key: string, params?: any): string => {
    const translation = translations[language];
    let text = translation[key as keyof typeof translation] || key;
    
    if (params) {
      Object.keys(params).forEach(param => {
        text = text.replace(`{{${param}}}`, params[param]);
      });
    }
    
    return text;
  };

 

  const value = {
    language,
    setLanguage: async (lang: Language) => {
      setLanguage(lang);
      await AsyncStorage.setItem('appLanguage', lang);
    },
    t,
    isRTL: false,
 
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};