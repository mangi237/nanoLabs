import React, { createContext, useContext, useState } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<string, string>> = {
  en: {
    select_your_lab: "Select Your Lab",
    choose_lab_to_continue: "Choose a laboratory center to continue to login",
    search_lab: "Search laboratory name or location...",
    no_labs_found: "No laboratory found",
    try_different_search: "Try searching with a different key phrase",
    admin_dashboard: "Admin Control Center",
    patients: "Patients",
    staff: "Staff Members",
    tests: "Tests",
    revenue: "Revenue",
    quick_actions: "Quick Actions",
    test_catalog: "Test Catalog",
    inventory: "Inventory",
    reports: "Reports & Analytics",
    total_patients: "Total Patients",
    total_tests: "Total Tests",
    completed: "Completed",
    pending: "Pending",
    revenue_summary: "Revenue Summary",
    total_revenue: "Total Revenue",
    pending_revenue: "Pending Revenue",
    recent_activity: "Recent Activity",
    no_recent_activity: "No recent activity recorded",
    search_patients: "Search patients by name, ID or phone number...",
    no_patients_found: "No patients found",
    add_item: "Add Inventory Item",
    no_inventory_items: "No inventory items available",
    edit_item: "Edit Inventory Item",
    add_inventory_item: "Add Inventory Item",
    item_name: "Item Name",
    category: "Category",
    quantity: "Quantity",
    reorder_level: "Reorder Threshold Level",
    supplier: "Supplier Vendor",
    cancel: "Cancel",
    save: "Save",
    confirm_delete: "Confirm Deletion",
    delete_item_confirm: "Are you sure you want to delete this inventory item?",
    delete: "Delete",
    no_staff: "No staff members registered",
    add_staff: "Add Staff Member",
    add_test: "Add Catalog Test",
    no_tests_in_catalog: "No tests currently in catalog",
    add_new_test: "Add New Test",
    edit_test: "Edit Test Details",
    test_name: "Test Name",
    price: "Price",
    description: "Description",
    welcome: "Welcome back",
    total_tests_stats: "Total Tests",
    processing: "Processing",
    my_tests: "My Tests",
    transfer: "Transfer Records",
    share: "Share Results",
    profile: "Profile Settings",
    recent_tests: "Recent Test Requests",
    no_tests_yet: "No lab test records found",
    visit_lab_for_tests: "Visit our laboratory to request your medical tests",
    view_all: "View All Records",
    loading: "Loading information...",
    pending_collection: "Pending Sample Collection",
    collect: "Collect Sample",
    collected: "Sample Collected",
    no_pending_tests: "No pending sample collections",
    active: "Active",
    confirm: "Confirm",
    no_patients: "No pending patient registrations"
  },
  fr: {
    select_your_lab: "Sélectionnez Votre Laboratoire",
    choose_lab_to_continue: "Choisissez un centre de laboratoire pour continuer",
    search_lab: "Rechercher un nom de laboratoire ou lieu...",
    no_labs_found: "Aucun laboratoire trouvé",
    try_different_search: "Essayez une autre recherche",
    admin_dashboard: "Tableau de Bord Administration",
    patients: "Patients",
    staff: "Membres du Personnel",
    tests: "Analyses",
    revenue: "Chiffre d'Affaires",
    quick_actions: "Actions Rapides",
    test_catalog: "Catalogue des Tests",
    inventory: "Gestion de Stock",
    reports: "Rapports et Analyses",
    total_patients: "Total des Patients",
    total_tests: "Total des Analyses",
    completed: "Terminé",
    pending: "En Attente",
    revenue_summary: "Résumé des Revenus",
    total_revenue: "Revenu Total",
    pending_revenue: "Revenu En Attente",
    recent_activity: "Activité Récente",
    no_recent_activity: "Aucune activité récente",
    search_patients: "Rechercher par nom, ID ou téléphone...",
    no_patients_found: "Aucun patient trouvé",
    add_item: "Ajouter un Article",
    no_inventory_items: "Aucun article en stock",
    edit_item: "Modifier l'Article",
    add_inventory_item: "Ajouter au Stock",
    item_name: "Nom de l'Article",
    category: "Catégorie",
    quantity: "Quantité",
    reorder_level: "Seuil de Réapprovisionnement",
    supplier: "Fournisseur",
    cancel: "Annuler",
    save: "Enregistrer",
    confirm_delete: "Confirmer la Suppression",
    delete_item_confirm: "Êtes-vous sûr de vouloir supprimer cet article ?",
    delete: "Supprimer",
    no_staff: "Aucun membre du personnel enregistré",
    add_staff: "Ajouter un Membre",
    add_test: "Ajouter un Test",
    no_tests_in_catalog: "Aucun test dans le catalogue",
    add_new_test: "Nouveau Test Catalogue",
    edit_test: "Modifier le Test",
    test_name: "Nom du Test",
    price: "Prix",
    description: "Description",
    welcome: "Bienvenue",
    total_tests_stats: "Total des Tests",
    processing: "En Cours",
    my_tests: "Mes Analyses",
    transfer: "Transférer les Dossiers",
    share: "Partager Résultats",
    profile: "Paramètres de Profil",
    recent_tests: "Analyses Récentes",
    no_tests_yet: "Aucun résultat d'analyse trouvé",
    visit_lab_for_tests: "Rendez-vous à notre laboratoire pour effectuer vos examens",
    view_all: "Tout Afficher",
    loading: "Chargement en cours...",
    pending_collection: "Prélèvements en Attente",
    collect: "Prélever",
    collected: "Prélèvement Effectué",
    no_pending_tests: "Aucun prélèvement en attente",
    active: "Actif",
    confirm: "Confirmer",
    no_patients: "Aucune inscription en attente"
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState('en');

  const t = (key: string): string => {
    // If exact key found, return translated string
    if (translations[language]?.[key]) {
      return translations[language][key];
    }
    if (translations.en?.[key]) {
      return translations.en[key];
    }
    // Fallback: replace underscores with spaces and capitalize words nicely
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
