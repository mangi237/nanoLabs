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
import { MyDoctorsScreen, DoctorDirectoryItem } from './MyDoctorsScreen';
import { DoctorProfileScreen } from './DoctorProfileScreen';
import { DoctorChatScreen } from './DoctorChatScreen';
import { AppointmentsScreen } from './AppointmentsScreen';
import { PatientProfileScreen } from './ProfileScreen';
import { SuccessScreen } from './SuccessScreen';
import { PrescriptionScanScreen } from './PrescriptionScanScreen';
import { HealthBookletScreen } from './HealthBookletScreen';
import { NanoLabsAIScreen } from './NanoLabsAIScreen';
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
  | 'nanolabs_ai';

const PatientAppInner: React.FC = () => {
  const { logout } = useAuth();
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
  const [pickupAddress, setPickupAddress] = useState<string>('Boulevard de la Liberté, Akwa, Douala');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [pickupDistanceKm, setPickupDistanceKm] = useState<number>(2.3);
  const [calculatedLabTariff, setCalculatedLabTariff] = useState<number>(8000);
  const [currentBooking, setCurrentBooking] = useState<any | null>(null);
  const [selectedResult, setSelectedResult] = useState<PatientResultItem>(DEFAULT_RESULT_TEMPLATE);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorDirectoryItem | null>(null);

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
      case 'welcome':
        return (
          <WelcomeScreen
            onGetStarted={() => setCurrentView('insurance_setup')}
            onSkipToHome={() => setCurrentView('home')}
          />
        );

      case 'insurance_setup':
        return (
          <InsuranceSetupScreen
            onBack={() => setCurrentView('welcome')}
            onContinue={() => setCurrentView('home')}
            onSkip={() => setCurrentView('home')}
          />
        );

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
            onNavigateBooklet={() => setCurrentView('booklet')}
            onNavigateLabs={() => setCurrentView('choose_lab')}
            onNavigateDoctors={() => {
              setCurrentTab('doctors');
              setCurrentView('doctors');
            }}
            onNavigateInsurance={() => setCurrentView('my_insurance')}
            onNavigateTracking={(booking) => {
              if (booking) setCurrentBooking(booking);
              setCurrentTab('tracking');
              setCurrentView('tracking_live');
            }}
            onNavigateAudit={(booking) => {
              if (booking) setCurrentBooking(booking);
              setCurrentView('audit_timeline');
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
            onNavigateInvoice={(booking) => {
              setCurrentBooking(booking);
              setCurrentView('invoice');
            }}
            onNavigateResults={() => {
              setCurrentView('results');
            }}
          />
        );

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
              setSelectedTestsList(tests.map((t) => ({ name: t.name, price: 4500 })));
              setCurrentView('choose_lab');
            }}
            onSelectPackage={() => setCurrentView('package_detail')}
            onOpenAIHelp={() => setCurrentView('nanolabs_ai')}
          />
        );

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
              const found = POPULAR_CATALOG_TESTS.find((t) =>
                t.name.toLowerCase().includes(tName.toLowerCase())
              );
              if (found) setSelectedTest(found);
            }}
          />
        );

      case 'package_detail':
        return (
          <HealthPackageScreen
            onBack={() => setCurrentView('home')}
            onViewAvailableLabs={(pkgTests) => {
              setSelectedTestsList(pkgTests.map((name) => ({ name, price: 5000 })));
              setCurrentView('choose_lab');
            }}
          />
        );

      case 'my_insurance':
        return (
          <MyInsuranceScreen
            onBack={() => setCurrentView('home')}
            onUpdateInfo={() => setCurrentView('insurance_setup')}
          />
        );

      case 'choose_lab':
        return (
          <ChooseLabScreen
            onBack={() => setCurrentView('home')}
            selectedTestsNames={selectedTestsList.map((t) => t.name)}
            onSelectLab={(lab, calculatedTariff, calculatedCourier) => {
              setSelectedLab(lab);
              setCalculatedLabTariff(calculatedTariff);
              setCollectionFee(calculatedCourier);
              setCurrentView('collection_method');
            }}
          />
        );

      case 'lab_profile':
        return (
          <LabProfileScreen
            lab={selectedLab}
            onBack={() => setCurrentView('choose_lab')}
            onSelectLab={(lab) => {
              setSelectedLab(lab);
              setCurrentView('collection_method');
            }}
            selectedTests={selectedTestsList.map((t) => t.name)}
          />
        );

      case 'collection_method':
        return (
          <CollectionMethodScreen
            lab={selectedLab}
            onBack={() => setCurrentView('choose_lab')}
            initialMethod={collectionMethod}
            onContinue={(method, fee, distanceKm, address, coords) => {
              setCollectionMethod(method);
              setCollectionFee(method === 'home' ? fee : 0);
              setPickupDistanceKm(distanceKm);
              setPickupAddress(address);
              setPickupCoords(coords);
              setCurrentView('booking_summary');
            }}
          />
        );

      case 'booking_summary':
        return (
          <BookingSummaryScreen
            lab={selectedLab}
            tests={selectedTestsList}
            collectionMethod={collectionMethod}
            collectionFee={collectionFee}
            labTestTariff={calculatedLabTariff}
            pickupAddress={pickupAddress}
            pickupCoords={pickupCoords}
            pickupDistanceKm={pickupDistanceKm}
            onBack={() => setCurrentView('collection_method')}
            onBookingRequested={(booking) => {
              // Do NOT jump to invoice! Test request goes to Receptionist first; patient tracks live status on Home screen.
              setCurrentBooking(booking);
              setCurrentTab('home');
              setCurrentView('home');
            }}
          />
        );

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

      case 'invoice':
        return (
          <InvoiceScreen
            booking={currentBooking}
            bookingId={currentBooking?.id}
            labId={currentBooking?.labId || selectedLab?.id}
            labName={currentBooking?.labName || selectedLab?.name}
            invoiceNumber={currentBooking?.invoiceNumber || (currentBooking as any)?.invoiceCode || 'INV-2026-001'}
            totalAmount={currentBooking?.totalAmount || calculatedLabTariff}
            testsAmount={currentBooking?.testsAmount}
            homePickupFee={currentBooking?.homePickupFee}
            homeDeliveryFee={currentBooking?.homeDeliveryFee}
            addOns={currentBooking?.addOns || []}
            tests={currentBooking?.tests || selectedTestsList}
            labPaymentDetails={(currentBooking as any)?.labPaymentDetails}
            bookingCode={currentBooking?.bookingCode || 'BK-000000'}
            onBack={() => setCurrentView('home')}
            onPaymentConfirmedByPatient={(txRef, method) => {
              // Keep paymentStatus as 'unpaid' until Lab Cashier verifies under Pending Confirmation!
              if (currentBooking) {
                setCurrentBooking({
                  ...currentBooking,
                  paymentProofSubmitted: true,
                  invoiceStatus: 'payment_submitted',
                  transactionReference: txRef,
                  paymentMethod: method
                });
              }
              setCurrentTab('home');
              setCurrentView('home');
            }}
            onPayLater={() => setCurrentView('home')}
          />
        );

      case 'tracking_live':
        return (
          <LiveTrackingScreen
            booking={currentBooking}
            onBack={() => {
              setCurrentTab('home');
              setCurrentView('home');
            }}
            onSampleDeliveredToLab={() => {
              setCurrentView('audit_timeline');
            }}
            distanceKm={selectedLab?.distanceKm || 1.8}
            labName={currentBooking?.labName || selectedLab?.name || ''}
          />
        );

      case 'sample_collected':
        return (
          <SampleCollectedScreen
            onBack={() => setCurrentView('tracking_live')}
            onViewJourney={() => setCurrentView('audit_timeline')}
          />
        );

      case 'audit_timeline':
        return (
          <AuditTimelineScreen
            booking={currentBooking}
            onBack={() => {
              setCurrentTab('home');
              setCurrentView('home');
            }}
            onViewResults={() => {
              setCurrentView('results');
            }}
            onShareWithDoctor={() => {
              setCurrentTab('doctors');
              setCurrentView('doctors');
            }}
            labName={currentBooking?.labName || selectedLab?.name || ''}
            bookingCode={currentBooking?.bookingCode || ''}
          />
        );

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

      case 'doctor_profile': {
        if (!selectedDoctor) {
          return (
            <MyDoctorsScreen
              onBack={() => setCurrentView('home')}
              onSelectDoctor={(doc) => {
                setSelectedDoctor(doc);
                setCurrentView('doctor_profile');
              }}
              onViewAppointments={() => setCurrentView('appointments')}
            />
          );
        }
        let isDocConnected = false;
        let isDocPending = false;
        try {
          const profileId = activeProfile?.id || 'self';
          const connRaw = localStorage.getItem(`nanolabs_connected_doctors_${profileId}`);
          const connList: string[] = connRaw ? JSON.parse(connRaw) : [];
          isDocConnected = connList.includes(selectedDoctor.id);

          const pendRaw = localStorage.getItem(`nanolabs_outgoing_doc_reqs_${profileId}`);
          const pendList: string[] = pendRaw ? JSON.parse(pendRaw) : [];
          isDocPending = pendList.includes(selectedDoctor.id);
        } catch {}

        return (
          <DoctorProfileScreen
            doctor={selectedDoctor}
            onBack={() => setCurrentView('doctors')}
            onBookAppointment={() => setCurrentView('appointments')}
            onOpenChat={() => setCurrentView('doctor_chat')}
            isConnected={isDocConnected}
            isRequestPending={isDocPending}
            onSendRequest={(doc) => {
              try {
                const profileId = activeProfile?.id || 'self';
                const key = `nanolabs_outgoing_doc_reqs_${profileId}`;
                const raw = localStorage.getItem(key);
                const list: string[] = raw ? JSON.parse(raw) : [];
                if (!list.includes(doc.id)) {
                  list.push(doc.id);
                  localStorage.setItem(key, JSON.stringify(list));
                }
              } catch (e) {
                console.warn(e);
              }
            }}
          />
        );
      }

      case 'doctor_chat':
        if (!selectedDoctor) {
          return (
            <MyDoctorsScreen
              onBack={() => setCurrentView('home')}
              onSelectDoctor={(doc) => {
                setSelectedDoctor(doc);
                setCurrentView('doctor_profile');
              }}
            />
          );
        }
        return (
          <DoctorChatScreen
            doctor={selectedDoctor}
            onBack={() => setCurrentView('doctor_profile')}
          />
        );

      case 'appointments':
        return (
          <AppointmentsScreen
            onBack={() => setCurrentView('doctors')}
            onBookAppointment={() => setCurrentView('doctors')}
          />
        );

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

      case 'success':
        return (
          <SuccessScreen
            onBackToHome={() => {
              setCurrentTab('home');
              setCurrentView('home');
            }}
          />
        );

      case 'scan':
        return (
          <PrescriptionScanScreen
            onProceedToBooking={(matchedTests?: any[]) => {
              if (Array.isArray(matchedTests) && matchedTests.length > 0) {
                setSelectedTestsList(
                  matchedTests.map((t: any) => ({
                    name: t.name || t.testName || 'Diagnostic Test',
                    price: Number(t.basePriceXaf || t.price) || 4500
                  }))
                );
              }
              setCurrentView('choose_lab');
            }}
            onBack={() => setCurrentView('home')}
          />
        );

      case 'booklet':
        return <HealthBookletScreen />;

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
            onNavigateTracking={(booking) => {
              if (booking) setCurrentBooking(booking);
              setCurrentTab('tracking');
              setCurrentView('tracking_live');
            }}
            onNavigateAudit={(booking) => {
              if (booking) setCurrentBooking(booking);
              setCurrentView('audit_timeline');
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
