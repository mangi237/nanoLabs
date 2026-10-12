import React, { useState } from 'react';
import { PatientLayout, PatientNavTab } from '../../components/layouts/PatientLayout';
import { HomeScreen } from './HomeScreen';
import { WelcomeScreen } from './WelcomeScreen';
import { InsuranceSetupScreen } from './InsuranceSetupScreen';
import { SearchTestsScreen, TestCatalogItem, POPULAR_CATALOG_TESTS } from './SearchTestsScreen';
import { TestDetailScreen } from './TestDetailScreen';
import { HealthPackageScreen } from './HealthPackageScreen';
import { MyInsuranceScreen } from './MyInsuranceScreen';
import { ChooseLabScreen, PartnerLabItem, DEFAULT_PARTNER_LABS } from './ChooseLabScreen';
import { LabProfileScreen } from './LabProfileScreen';
import { CollectionMethodScreen } from './CollectionMethodScreen';
import { BookingSummaryScreen } from './BookingSummaryScreen';
import { LabAcceptedScreen } from './LabAcceptedScreen';
import { InvoiceScreen } from './InvoiceScreen';
import { LiveTrackingScreen } from './LiveTrackingScreen';
import { SampleCollectedScreen } from './SampleCollectedScreen';
import { AuditTimelineScreen } from './AuditTimelineScreen';
import { MyResultsScreen, PatientResultItem, DEFAULT_RESULT_TEMPLATE } from './MyResultsScreen';
import { CBCResultDetailScreen } from './CBCResultDetailScreen';
import { MyDoctorsScreen, DoctorDirectoryItem, REAL_DOCTORS_DIRECTORY } from './MyDoctorsScreen';
import { DoctorProfileScreen } from './DoctorProfileScreen';
import { DoctorChatScreen } from './DoctorChatScreen';
import { AppointmentsScreen } from './AppointmentsScreen';
import { PatientProfileScreen } from './ProfileScreen';
import { SuccessScreen } from './SuccessScreen';
import { PrescriptionScanScreen } from './PrescriptionScanScreen';
import { HealthBookletScreen } from './HealthBookletScreen';
import { NanoLabsAIScreen } from './NanoLabsAIScreen';
import { PhlebotomistPickupScreen } from './PhlebotomistPickupScreen';
import { useAuth } from '../../context/authContext';
import { FamilyProfileProvider, useFamilyProfile } from '../../context/familyProfileContext';

export type PatientScreenView =
  | 'welcome'
  | 'insurance_setup'
  | 'home'
  | 'search_tests'
  | 'test_detail'
  | 'package_detail'
  | 'my_insurance'
  | 'choose_lab'
  | 'lab_profile'
  | 'collection_method'
  | 'booking_summary'
  | 'lab_accepted'
  | 'invoice'
  | 'tracking_live'
  | 'sample_collected'
  | 'audit_timeline'
  | 'results'
  | 'result_detail'
  | 'doctors'
  | 'doctor_profile'
  | 'doctor_chat'
  | 'appointments'
  | 'profile'
  | 'success'
  | 'scan'
  | 'booklet'
  | 'nanolabs_ai'
  | 'phlebotomist_pickup';

const PatientAppInner: React.FC = () => {
  const { logout, user } = useAuth();
  const { activeProfile } = useFamilyProfile();

  const [currentTab, setCurrentTab] = useState<PatientNavTab>('home');
  const [currentView, setCurrentView] = useState<PatientScreenView>('home');

  // Flow State
  const [selectedTest, setSelectedTest] = useState<TestCatalogItem>(POPULAR_CATALOG_TESTS[0]);
  const [selectedLab, setSelectedLab] = useState<PartnerLabItem>(DEFAULT_PARTNER_LABS[0]);
  const [selectedTestsList, setSelectedTestsList] = useState<{ name: string; price: number }[]>([
    { name: 'Complete Blood Count (CBC)', price: 4500 },
    { name: 'Malaria Test (Thick smear)', price: 3500 }
  ]);
  const [collectionMethod, setCollectionMethod] = useState<'home' | 'lab'>('home');
  const [collectionFee, setCollectionFee] = useState<number>(2000);
  const [calculatedLabTariff, setCalculatedLabTariff] = useState<number>(8000);
  const [currentBooking, setCurrentBooking] = useState<any | null>(null);
  const [selectedResult, setSelectedResult] = useState<PatientResultItem>(DEFAULT_RESULT_TEMPLATE);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorDirectoryItem>(REAL_DOCTORS_DIRECTORY[0]);

  // Handle Tab Navigation from Glassy Floating Dock
  const handleTabChange = (tab: PatientNavTab) => {
    setCurrentTab(tab);
    switch (tab) {
      case 'home':
        setCurrentView('home');
        break;
      case 'tests':
        setCurrentView('search_tests');
        break;
      case 'tracking':
        setCurrentView('tracking_live');
        break;
      case 'doctors':
        setCurrentView('doctors');
        break;
      case 'profile':
        setCurrentView('profile');
        break;
      default:
        setCurrentView('home');
    }
  };

  const renderContent = () => {
    switch (currentView) {
      // 1. Welcome / Onboarding Screen
      case 'welcome':
        return (
          <WelcomeScreen
            onGetStarted={() => setCurrentView('insurance_setup')}
            onSkipToHome={() => setCurrentView('home')}
          />
        );

      // 2. Set Up Your Insurance Screen
      case 'insurance_setup':
        return (
          <InsuranceSetupScreen
            onBack={() => setCurrentView('welcome')}
            onContinue={() => setCurrentView('home')}
            onSkip={() => setCurrentView('home')}
          />
        );

      // 3. Home Screen
      case 'home':
        return (
          <HomeScreen
            onNavigateScan={() => setCurrentView('scan')}
            onNavigateBook={() => setCurrentView('choose_lab')}
            onNavigateTests={() => {
              setCurrentTab('tests');
              setCurrentView('search_tests');
            }}
            onNavigatePackage={() => setCurrentView('package_detail')}
            onNavigateLabs={() => setCurrentView('choose_lab')}
            onNavigateDoctors={() => {
              setCurrentTab('doctors');
              setCurrentView('doctors');
            }}
            onNavigateInsurance={() => setCurrentView('my_insurance')}
            onNavigateTracking={() => {
              setCurrentTab('tracking');
              setCurrentView('tracking_live');
            }}
            onNavigateProfile={() => {
              setCurrentTab('profile');
              setCurrentView('profile');
            }}
            onSelectTest={(test) => {
              setSelectedTest(test);
              setCurrentView('test_detail');
            }}
            onOpenBatch={() => {
              setCurrentTab('tracking');
              setCurrentView('tracking_live');
            }}
          />
        );

      // 4. Search Tests Screen (Without fixed platform prices)
      case 'search_tests':
        return (
          <SearchTestsScreen
            onBack={() => {
              setCurrentTab('home');
              setCurrentView('home');
            }}
            onSelectTest={(test) => {
              setSelectedTest(test);
              setCurrentView('test_detail');
            }}
            onSelectMultipleTests={(tests) => {
              setSelectedTestsList(tests.map(t => ({ name: t.name, price: 4500 })));
              setCurrentView('choose_lab');
            }}
            onSelectPackage={() => setCurrentView('package_detail')}
            onOpenAIHelp={() => setCurrentView('nanolabs_ai')}
          />
        );

      // 5. Test Details Screen
      case 'test_detail':
        return (
          <TestDetailScreen
            test={selectedTest}
            onBack={() => setCurrentView('search_tests')}
            onViewAvailableLabs={(test) => {
              setSelectedTestsList([{ name: test.name, price: 4500 }]);
              setCurrentView('choose_lab');
            }}
            onSelectRelatedTest={(tName) => {
              const found = POPULAR_CATALOG_TESTS.find(t => t.name.toLowerCase().includes(tName.toLowerCase()));
              if (found) setSelectedTest(found);
            }}
          />
        );

      // 6. Health Check Package Screen
      case 'package_detail':
        return (
          <HealthPackageScreen
            onBack={() => setCurrentView('home')}
            onViewAvailableLabs={(pkgTests) => {
              setSelectedTestsList(pkgTests.map(name => ({ name, price: 5000 })));
              setCurrentView('choose_lab');
            }}
          />
        );

      // 7. My Insurance Screen
      case 'my_insurance':
        return (
          <MyInsuranceScreen
            onBack={() => setCurrentView('home')}
            onUpdateInfo={() => setCurrentView('insurance_setup')}
          />
        );

      // 8. Choose Laboratory Screen (Lab determines price + distance fee)
      case 'choose_lab':
        return (
          <ChooseLabScreen
            onBack={() => setCurrentView('home')}
            selectedTestsNames={selectedTestsList.map(t => t.name)}
            onSelectLab={(lab, calculatedTariff, calculatedCourier) => {
              setSelectedLab(lab);
              setCalculatedLabTariff(calculatedTariff);
              setCollectionFee(calculatedCourier);
              setCurrentView('collection_method');
            }}
          />
        );

      // 9. Lab Profile Screen
      case 'lab_profile':
        return (
          <LabProfileScreen
            lab={selectedLab}
            onBack={() => setCurrentView('choose_lab')}
            onSelectLab={(lab) => {
              setSelectedLab(lab);
              setCurrentView('collection_method');
            }}
            selectedTests={selectedTestsList.map(t => t.name)}
          />
        );

      // 10. Collection Method Screen
      case 'collection_method':
        return (
          <CollectionMethodScreen
            onBack={() => setCurrentView('choose_lab')}
            initialMethod={collectionMethod}
            onContinue={(method, fee) => {
              setCollectionMethod(method);
              setCollectionFee(method === 'home' ? collectionFee : 0);
              setCurrentView('booking_summary');
            }}
          />
        );

      // 11. Booking Summary Screen (Insurance selection + Lab Tariff calculation)
      case 'booking_summary':
        return (
          <BookingSummaryScreen
            lab={selectedLab}
            tests={selectedTestsList}
            collectionMethod={collectionMethod}
            collectionFee={collectionFee}
            labTestTariff={calculatedLabTariff}
            onBack={() => setCurrentView('collection_method')}
            onBookingRequested={(booking) => {
              setCurrentBooking(booking);
              setCurrentView('invoice');
            }}
          />
        );

      // 12. Lab Accepted Screen
      case 'lab_accepted':
        return (
          <LabAcceptedScreen
            booking={currentBooking}
            onBack={() => setCurrentView('home')}
            onViewInvoice={() => setCurrentView('invoice')}
            onTrackPhlebotomist={() => {
              setCurrentTab('tracking');
              setCurrentView('tracking_live');
            }}
          />
        );

      // 13. Official Invoice Screen (Patient pays with 3rd-party app & clicks confirm payment)
      case 'invoice':
        return (
          <InvoiceScreen
            labName={selectedLab?.name}
            invoiceNumber="INV-2847"
            totalAmount={currentBooking?.totalAmount || calculatedLabTariff}
            bookingCode={currentBooking?.bookingCode || 'BK-991204'}
            onBack={() => setCurrentView('booking_summary')}
            onPaymentConfirmedByPatient={(txRef, method) => {
              // Cashier verifies payment -> notification -> phlebotomist dispatched with live GPS!
              setCurrentTab('tracking');
              setCurrentView('tracking_live');
            }}
            onPayLater={() => setCurrentView('home')}
          />
        );

      // 14. Live GPS Tracking Screen (Phlebotomist moving, stops when specimen reaches lab)
      case 'tracking_live':
        return (
          <LiveTrackingScreen
            onBack={() => {
              setCurrentTab('home');
              setCurrentView('home');
            }}
            onSampleDeliveredToLab={() => {
              // Once sample reaches lab, GPS stops & transitions to in-lab audit!
              setCurrentView('audit_timeline');
            }}
            onOpenRiderView={() => setCurrentView('phlebotomist_pickup')}
            phlebotomistName="M. Tchinda"
            etaMinutes={12}
            distanceKm={selectedLab?.distanceKm || 2.4}
            labName={selectedLab?.name || 'BioSanté Lab'}
          />
        );

      // 15. Sample Collected Screen
      case 'sample_collected':
        return (
          <SampleCollectedScreen
            onBack={() => setCurrentView('tracking_live')}
            onViewJourney={() => setCurrentView('audit_timeline')}
          />
        );

      // 16. In-Lab Stage Progression & Audit Screen
      case 'audit_timeline':
        return (
          <AuditTimelineScreen
            onBack={() => {
              setCurrentTab('home');
              setCurrentView('home');
            }}
            onViewResults={() => {
              setCurrentTab('tracking');
              setCurrentView('results');
            }}
            onShareWithDoctor={() => {
              setCurrentTab('doctors');
              setCurrentView('doctor_chat');
            }}
            onRequestHomeDelivery={() => {
              // Confirmed
            }}
            labName={selectedLab?.name || 'BioSanté Lab'}
            bookingCode={currentBooking?.bookingCode || 'BK-991204'}
          />
        );

      // 17. My Results Screen (Real Data for Active Profile)
      case 'results':
        return (
          <MyResultsScreen
            onBack={() => {
              setCurrentTab('home');
              setCurrentView('home');
            }}
            onSelectResult={(res) => {
              setSelectedResult(res);
              setCurrentView('result_detail');
            }}
          />
        );

      // 18. Result Details Screen (CBC / Lab Report)
      case 'result_detail':
        return (
          <CBCResultDetailScreen
            result={selectedResult}
            onBack={() => setCurrentView('results')}
            onAskAI={(res) => {
              setSelectedResult(res);
              setCurrentView('nanolabs_ai');
            }}
          />
        );

      // 19. My Doctors Directory Screen
      case 'doctors':
        return (
          <MyDoctorsScreen
            onBack={() => {
              setCurrentTab('home');
              setCurrentView('home');
            }}
            onSelectDoctor={(doc) => {
              setSelectedDoctor(doc);
              setCurrentView('doctor_profile');
            }}
            onViewAppointments={() => setCurrentView('appointments')}
          />
        );

      // 20. Doctor Profile Screen
      case 'doctor_profile':
        return (
          <DoctorProfileScreen
            doctor={selectedDoctor}
            onBack={() => setCurrentView('doctors')}
            onBookAppointment={() => setCurrentView('appointments')}
            onOpenChat={() => setCurrentView('doctor_chat')}
          />
        );

      // 21. Doctor Teleconsultation Chat Screen
      case 'doctor_chat':
        return (
          <DoctorChatScreen
            doctor={selectedDoctor}
            onBack={() => setCurrentView('doctor_profile')}
          />
        );

      // 22. Appointments Screen
      case 'appointments':
        return (
          <AppointmentsScreen
            onBack={() => setCurrentView('doctors')}
            onBookAppointment={() => setCurrentView('doctors')}
          />
        );

      // 23. Profile Screen
      case 'profile':
        return (
          <PatientProfileScreen
            onBack={() => {
              setCurrentTab('home');
              setCurrentView('home');
            }}
            onNavigateInsurance={() => setCurrentView('my_insurance')}
            onNavigateHealthRecords={() => setCurrentView('results')}
            onLogout={logout}
          />
        );

      // 24. Success Screen
      case 'success':
        return (
          <SuccessScreen
            onBackToHome={() => {
              setCurrentTab('home');
              setCurrentView('home');
            }}
          />
        );

      // Scan Prescription
      case 'scan':
        return (
          <PrescriptionScanScreen
            onProceedToBooking={() => setCurrentView('choose_lab')}
          />
        );

      // Carnet de Santé / Health Booklet
      case 'booklet':
        return <HealthBookletScreen />;

      // Rider Phlebotomist Pickup Screen (Mobile dispatch preview)
      case 'phlebotomist_pickup':
        return (
          <PhlebotomistPickupScreen
            booking={currentBooking}
            onBack={() => setCurrentView('tracking_live')}
            onConfirmPickup={() => {
              setCurrentView('audit_timeline');
            }}
          />
        );

      // NanoLabs AI Diagnostic Consultation & Result Interpretation (Gemini)
      case 'nanolabs_ai':
        return (
          <NanoLabsAIScreen
            onBack={() => {
              setCurrentTab('home');
              setCurrentView('home');
            }}
            initialTestReport={selectedResult}
          />
        );

      default:
        return (
          <HomeScreen
            onNavigateScan={() => setCurrentView('scan')}
            onNavigateBook={() => setCurrentView('choose_lab')}
            onNavigateTests={() => {
              setCurrentTab('tests');
              setCurrentView('search_tests');
            }}
            onNavigatePackage={() => setCurrentView('package_detail')}
            onNavigateLabs={() => setCurrentView('choose_lab')}
            onNavigateDoctors={() => {
              setCurrentTab('doctors');
              setCurrentView('doctors');
            }}
            onNavigateInsurance={() => setCurrentView('my_insurance')}
            onNavigateTracking={() => {
              setCurrentTab('tracking');
              setCurrentView('tracking_live');
            }}
            onNavigateProfile={() => {
              setCurrentTab('profile');
              setCurrentView('profile');
            }}
            onSelectTest={(test) => {
              setSelectedTest(test);
              setCurrentView('test_detail');
            }}
          />
        );
    }
  };

  return (
    <PatientLayout
      currentTab={currentTab}
      onTabChange={handleTabChange}
      onLogout={logout}
      onOpenAI={() => setCurrentView('nanolabs_ai')}
      hideBottomNav={currentView === 'welcome' || currentView === 'success'}
    >
      {renderContent()}
    </PatientLayout>
  );
};

export const PatientApp: React.FC = () => {
  return (
    <FamilyProfileProvider>
      <PatientAppInner />
    </FamilyProfileProvider>
  );
};

export default PatientApp;
