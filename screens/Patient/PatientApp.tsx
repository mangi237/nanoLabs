import React, { useState } from 'react';
import { PatientLayout, PatientNavTab } from '../../components/Layout/PatientLayout';
import { HomeScreen } from './HomeScreen';
import { PrescriptionScanScreen } from './PrescriptionScanScreen';
import { TestBookingScreen } from './TestBookingScreen';
import { BatchDetailScreen } from './BatchDetailScreen';
import { TestResultsScreen } from './TestResultsScreen';
import { HealthBookletScreen } from './HealthBookletScreen';
import { PatientProfileScreen } from './ProfileScreen';
import { DoctorPatientChatHub } from '../../components/chat/DoctorPatientChatHub';
import { useAuth } from '../../context/authContext';
import { FamilyProfileProvider } from '../../context/familyProfileContext';

export type PatientScreenView = PatientNavTab | 'scan' | 'batch_detail';

export const PatientApp: React.FC = () => {
  const { logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<PatientNavTab>('home');
  const [currentView, setCurrentView] = useState<PatientScreenView>('home');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('batch_demo_live');

  const handleTabChange = (tab: PatientNavTab) => {
    setCurrentTab(tab);
    setCurrentView(tab);
  };

  const handleOpenBatch = (batchId: string) => {
    setSelectedBatchId(batchId);
    setCurrentView('batch_detail');
  };

  const handleNavigateScan = () => {
    setCurrentView('scan');
  };

  const handleNavigateBook = () => {
    setCurrentTab('book');
    setCurrentView('book');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <HomeScreen
            onNavigateScan={handleNavigateScan}
            onNavigateBook={handleNavigateBook}
            onOpenBatch={handleOpenBatch}
          />
        );
      case 'scan':
        return (
          <PrescriptionScanScreen
            onProceedToBooking={(tests) => {
              setCurrentTab('book');
              setCurrentView('book');
            }}
          />
        );
      case 'book':
        return (
          <TestBookingScreen
            onBookingComplete={(batchId) => {
              setSelectedBatchId(batchId);
              setCurrentView('batch_detail');
            }}
          />
        );
      case 'batch_detail':
        return (
          <BatchDetailScreen
            batchId={selectedBatchId}
            onBack={() => setCurrentView('home')}
            onViewResults={() => {
              setCurrentTab('results');
              setCurrentView('results');
            }}
          />
        );
      case 'results':
        return (
          <TestResultsScreen 
            onSelectBatch={handleOpenBatch} 
            onNavigateToChat={() => {
              setCurrentTab('chat');
              setCurrentView('chat');
            }}
          />
        );
      case 'chat':
        return (
          <div className="max-w-5xl mx-auto py-4">
            <DoctorPatientChatHub
              currentRole="patient"
              onNavigateToBooking={(prescribedTests) => {
                setCurrentTab('book');
                setCurrentView('book');
              }}
              onOpenReportModal={() => {
                setCurrentTab('results');
                setCurrentView('results');
              }}
            />
          </div>
        );
      case 'booklet':
        return <HealthBookletScreen />;
      case 'profile':
        return <PatientProfileScreen onLogout={logout} />;
      default:
        return (
          <HomeScreen
            onNavigateScan={handleNavigateScan}
            onNavigateBook={handleNavigateBook}
            onOpenBatch={handleOpenBatch}
          />
        );
    }
  };

  return (
    <FamilyProfileProvider>
      <PatientLayout
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onLogout={logout}
        onOpenBatch={handleOpenBatch}
      >
        {renderContent()}
      </PatientLayout>
    </FamilyProfileProvider>
  );
};


export default PatientApp;
