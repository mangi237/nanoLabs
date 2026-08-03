// // screens/analyzer/AnalyzerDashboard.tsx - CORRECTED
// import React, { useState, useEffect } from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   FlatList, 
//   TouchableOpacity, 
//   Alert, 
//   Modal,
//   TextInput,
//   ScrollView,
//   RefreshControl
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { 
//   collection, 
//   query, 
//   where, 
//   onSnapshot, 
//   updateDoc, 
//   doc, 
//   Timestamp,
//   orderBy 
// } from 'firebase/firestore';
// import { db } from '../../services/firebase';
// import { Patient, LabTest } from '../../types/Patient';
// import { useAuth } from '../../context/authContext';
// import AnimatedHeader from '../../components/common/AnimateHeader';
// import { safeToDate } from '../../utils/safeToDate';

// const AnalyzerDashboard = ({ navigation }: any) => {
//   const [patients, setPatients] = useState<Patient[]>([]);
//   const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
//   const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
//   const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
//   const [showCollectionModal, setShowCollectionModal] = useState(false);
//   const [collectionNotes, setCollectionNotes] = useState('');
//   const [refreshing, setRefreshing] = useState(false);
//   const [activeTab, setActiveTab] = useState<'pending' | 'collected'>('pending');

//   const { user } = useAuth();

//   // Real-time listener for patients needing lab work
//   useEffect(() => {
//     if (!user) return;

//     const patientsQuery = query(
//       collection(db, 'patients'),
//       where('status', 'in', ['lab-pending', 'lab-sample-collected']),
//       orderBy('updatedAt', 'desc')
//     );

//     const unsubscribe = onSnapshot(patientsQuery, (snapshot) => {
//       const patientData = snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       })) as Patient[];
      
//       setPatients(patientData);
//       filterPatients(patientData, activeTab);
//     });

//     return () => unsubscribe();
//   }, [user, activeTab]);

//   const filterPatients = (patientList: Patient[], tab: 'pending' | 'collected') => {
//     const filtered = patientList.filter(patient => {
//       if (!patient.labTests || patient.labTests.length === 0) return false;
      
//       if (tab === 'pending') {
//         // Show patients with at least one test where sampleCollected is false
//         return patient.labTests.some(test => !test.sampleCollected);
//       } else {
//         // Show patients with all tests sampleCollected true but not all completed
//         return patient.labTests.every(test => test.sampleCollected) && 
//                patient.labTests.some(test => test.status === 'sample-collected');
//       }
//     });
    
//     setFilteredPatients(filtered);
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     // Real-time listener will handle updates
//     setTimeout(() => setRefreshing(false), 1000);
//   };

//   const handlePatientSelect = (patient: Patient) => {
//     navigation.navigate('PatientDetails', { patient });
//   };

//   const handleTestCollection = (patient: Patient, test: LabTest) => {
//     setSelectedPatient(patient);
//     setSelectedTest(test);
//     setShowCollectionModal(true);
//   };

//   const confirmSampleCollection = async () => {
//     if (!selectedPatient || !selectedTest || !user) return;

//     try {
//       const patientRef = doc(db, 'patients', selectedPatient.id!);
      
//       // Update the specific lab test
//       const updatedLabTests = selectedPatient.labTests.map(test => 
//         test.id === selectedTest.id 
//           ? {
//               ...test,
//               sampleCollected: true,
//               sampleCollectedBy: user.id,
//               sampleCollectedByName: user.name,
//               sampleCollectedDate: Timestamp.now(),
//               status: 'sample-collected'
//             }
//           : test
//       );

//       // Check if all tests are collected
//       const allTestsCollected = updatedLabTests.every(test => test.sampleCollected);
      
//       await updateDoc(patientRef, {
//         labTests: updatedLabTests,
//         status: allTestsCollected ? 'lab-sample-collected' : 'lab-pending',
//         updatedAt: Timestamp.now(),
//       });

//       // If all tests collected, update their status
//       if (allTestsCollected) {
//         const fullyUpdatedTests = updatedLabTests.map(test => ({
//           ...test,
//           status: 'sample-collected'
//         }));
        
//         await updateDoc(patientRef, {
//           labTests: fullyUpdatedTests,
//         });
//       }

//       Alert.alert('Success', 'Sample collection confirmed! The lab technician has been notified.');
//       setShowCollectionModal(false);
//       setSelectedPatient(null);
//       setSelectedTest(null);
//       setCollectionNotes('');
//     } catch (error) {
//       console.error('Error confirming sample collection:', error);
//       Alert.alert('Error', 'Failed to confirm sample collection');
//     }
//   };

//   const getTestsRequiringCollection = (patient: Patient) => {
//     if (!patient.labTests) return [];
//     return patient.labTests.filter(test => !test.sampleCollected);
//   };

//   const getCollectedTests = (patient: Patient) => {
//     if (!patient.labTests) return [];
//     return patient.labTests.filter(test => test.sampleCollected);
//   };

//   const renderPatientItem = ({ item }: { item: Patient }) => {
//     const pendingTests = getTestsRequiringCollection(item);
//     const collectedTests = getCollectedTests(item);
    
//     return (
//       <div style={styles.patientCard}>
//         <TouchableOpacity 
//           style={styles.patientHeader}
//           onPress={() => handlePatientSelect(item)}
//         >
//           <div style={styles.patientInfo}>
//             <Text style={styles.patientName}>{item.name}</Text>
//             <Text style={styles.patientId}>ID: {item.patientId}</Text>
//             <div style={[
//               styles.statusBadge,
//               { backgroundColor: item.labTests?.some(test => test.status === 'requested') ? '#E67E22' : '#3498DB' }
//             ]}>
//               {/* <Text style={styles.statusText}>
//                 {item.status === '' ? 'SAMPLES NEEDED' : 'SAMPLES COLLECTED'}
//               </Text> */}
//             </div>
//           </div>
//           <Ionicons name="chevron-forward" size={24} color="#7F8C8D" />
//         </TouchableOpacity>

//         <div style={styles.testsSection}>
//           <Text style={styles.sectionTitle}>Tests Required:</Text>
//           {item.labTests?.map((test, index) => (
//             <div key={index} style={styles.testItem}>
//               <div style={styles.testInfo}>
//                 <Text style={styles.testName}>{test.name}</Text>
//                 <Text style={styles.testCategory}>{test.category}</Text>
//               </div>
//               <div style={styles.testActions}>
//                 {!test.sampleCollected ? (
//                   <TouchableOpacity 
//                     style={styles.collectButton}
//                     onPress={() => handleTestCollection(item, test)}
//                   >
//                     <Ionicons name="checkmark-circle" size={16} color="white" />
//                     <Text style={styles.collectButtonText}>Collect Sample</Text>
//                   </TouchableOpacity>
//                 ) : (
//                   <div style={styles.collectedBadge}>
//                     <Ionicons name="checkmark-done" size={16} color="#27AE60" />
//                     <Text style={styles.collectedText}>COLLECTED</Text>
//                   </div>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>

//         <div style={styles.samplesSection}>
//           <Text style={styles.sectionTitle}>Samples:</Text>
//           <div style={styles.samplesContainer}>
//             {item.labTests?.flatMap(test => test.samples || []).map((sample, index) => {
//               const isCollected = collectedTests.some(test => 
//                 test.samples?.includes(sample)
//               );
              
//               return (
//                 <div
//                   key={index}
//                   style={[
//                     styles.sampleChip,
//                     isCollected && styles.sampleCollected
//                   ]}
//                 >
//                   <Text style={styles.sampleText}>{sample}</Text>
//                   {isCollected && (
//                     <Ionicons name="checkmark" size={14} color="#27AE60" />
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         <div style={styles.summarySection}>
//           <Text style={styles.summaryText}>
//             {collectedTests.length} of {item.labTests?.length || 0} samples collected
//           </Text>
//           {pendingTests.length === 0 && (
//             <TouchableOpacity 
//               style={styles.forwardButton}
//               onPress={() => {
//                 Alert.alert(
//                   'Forward to Lab',
//                   'All samples collected. Forward to lab technician for processing?',
//                   [
//                     { text: 'Cancel', style: 'cancel' },
//                     { 
//                       text: 'Forward', 
//                       onPress: () => {
//                         // This could trigger a notification or update status
//                         Alert.alert('Success', 'Patient forwarded to lab technician.');
//                       }
//                     }
//                   ]
//                 );
//               }}
//             >
//               <Ionicons name="arrow-forward" size={16} color="white" />
//               <Text style={styles.forwardButtonText}>Forward to Lab</Text>
//             </TouchableOpacity>
//           )}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div style={styles.container}>
//       <AnimatedHeader  />
      
//       {/* Tab Navigation */}
//       <div style={styles.tabContainer}>
//         <TouchableOpacity 
//           style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
//           onPress={() => {
//             setActiveTab('pending');
//             filterPatients(patients, 'pending');
//           }}
//         >
//           <Ionicons 
//             name="timer-outline" 
//             size={20} 
//             color={activeTab === 'pending' ? 'white' : '#7F8C8D'} 
//           />
//           <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
//             Pending Collection
//           </Text>
//           <div style={styles.tabBadge}>
//             <Text style={styles.tabBadgeText}>
//               {filteredPatients.filter(p => 
//                 p.labTests?.some(t => !t.sampleCollected)
//               ).length}
//             </Text>
//           </div>
//         </TouchableOpacity>
        
//         <TouchableOpacity 
//           style={[styles.tab, activeTab === 'collected' && styles.activeTab]}
//           onPress={() => {
//             setActiveTab('collected');
//             filterPatients(patients, 'collected');
//           }}
//         >
//           <Ionicons 
//             name="checkmark-circle-outline" 
//             size={20} 
//             color={activeTab === 'collected' ? 'white' : '#7F8C8D'} 
//           />
//           <Text style={[styles.tabText, activeTab === 'collected' && styles.activeTabText]}>
//             Collected
//           </Text>
//         </TouchableOpacity>
//       </div>

//       <ScrollView 
//         style={styles.content}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//       >
//         {/* Stats Overview */}
//         <div style={styles.statsContainer}>
//           <div style={styles.statCard}>
//             <Ionicons name="people" size={24} color="#3498DB" />
//             <Text style={styles.statNumber}>{filteredPatients.length}</Text>
//             <Text style={styles.statLabel}>Patients</Text>
//           </div>
          
//           <div style={styles.statCard}>
//             <Ionicons name="flask" size={24} color="#E67E22" />
//             <Text style={styles.statNumber}>
//               {filteredPatients.reduce((total, patient) => 
//                 total + (patient.labTests?.filter(t => !t.sampleCollected).length || 0), 0
//               )}
//             </Text>
//             <Text style={styles.statLabel}>Tests Pending</Text>
//           </div>
          
//           <div style={styles.statCard}>
//             <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
//             <Text style={styles.statNumber}>
//               {filteredPatients.reduce((total, patient) => 
//                 total + (patient.labTests?.filter(t => t.sampleCollected).length || 0), 0
//               )}
//             </Text>
//             <Text style={styles.statLabel}>Samples Collected</Text>
//           </div>
//         </div>

//         {/* Patients List */}
//         <div style={styles.patientsSection}>
//           <Text style={styles.sectionHeader}>
//             {activeTab === 'pending' ? 'Patients Needing Sample Collection' : 'Patients with Samples Collected'}
//           </Text>
          
//           <FlatList
//             data={filteredPatients}
//             renderItem={renderPatientItem}
//             keyExtractor={item => item.id!}
//             scrollEnabled={false}
//             ListEmptyComponent={
//               <div style={styles.emptyState}>
//                 <Ionicons 
//                   name={activeTab === 'pending' ? "checkmark-done-circle" : "flask-outline"} 
//                   size={60} 
//                   color="#BDC3C7" 
//                 />
//                 <Text style={styles.emptyText}>
//                   {activeTab === 'pending' 
//                     ? 'No patients requiring sample collection' 
//                     : 'No samples collected yet'
//                   }
//                 </Text>
//               </div>
//             }
//           />
//         </div>
//       </ScrollView>

//       {/* Sample Collection Modal */}
//       <Modal visible={showCollectionModal} animationType="slide" transparent={true}>
//         <div style={styles.modalContainer}>
//           <div style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Confirm Sample Collection</Text>
            
//             {selectedPatient && selectedTest && (
//               <>
//                 <div style={styles.modalPatientInfo}>
//                   <Text style={styles.modalPatientName}>{selectedPatient.name}</Text>
//                   <Text style={styles.modalTestName}>{selectedTest.name}</Text>
//                   <Text style={styles.modalTestDetails}>
//                     {selectedTest.samples?.join(', ')} • ${selectedTest.price?.toFixed(2)}
//                   </Text>
//                 </div>

//                 <Text style={styles.inputLabel}>Collection Notes (Optional)</Text>
//                 <TextInput
//                   style={[styles.input, styles.textArea]}
//                   value={collectionNotes}
//                   onChangeText={setCollectionNotes}
//                   placeholder="Add any notes about the sample collection..."
//                   multiline
//                   numberOfLines={3}
//                 />

//                 <div style={styles.modalButtons}>
//                   <TouchableOpacity 
//                     style={styles.cancelButton}
//                     onPress={() => {
//                       setShowCollectionModal(false);
//                       setSelectedPatient(null);
//                       setSelectedTest(null);
//                       setCollectionNotes('');
//                     }}
//                   >
//                     <Text style={styles.cancelButtonText}>Cancel</Text>
//                   </TouchableOpacity>
                  
//                   <TouchableOpacity 
//                     style={styles.confirmButton}
//                     onPress={confirmSampleCollection}
//                   >
//                     <Ionicons name="checkmark-circle" size={20} color="white" />
//                     <Text style={styles.confirmButtonText}>Confirm Collection</Text>
//                   </TouchableOpacity>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       </Modal>
//     </div>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F8F9FA',
//   },
//   tabContainer: {
//     flexDirection: 'row',
//     backgroundColor: 'white',
//     marginHorizontal: 16,
//     marginTop: 16,
//     borderRadius: 12,
//     padding: 8,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   tab: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 12,
//     borderRadius: 8,
//     gap: 8,
//   },
//   activeTab: {
//     backgroundColor: '#1E96A9',
//   },
//   tabText: {
//     fontSize: 14,
//     color: '#7F8C8D',
//     fontWeight: '600',
//   },
//   activeTabText: {
//     color: 'white',
//   },
//   tabBadge: {
//     backgroundColor: '#E74C3C',
//     borderRadius: 10,
//     minWidth: 20,
//     height: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 4,
//   },
//   tabBadgeText: {
//     color: 'white',
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
//   content: {
//     flex: 1,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     padding: 16,
//     gap: 12,
//   },
//   statCard: {
//     flex: 1,
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 16,
//     alignItems: 'center',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   statNumber: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#2C3E50',
//     marginVertical: 4,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#7F8C8D',
//     textAlign: 'center',
//   },
//   patientsSection: {
//     padding: 16,
//   },
//   sectionHeader: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#2C3E50',
//     marginBottom: 16,
//   },
//   patientCard: {
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 16,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   patientHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 16,
//   },
//   patientInfo: {
//     flex: 1,
//   },
//   patientName: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#2C3E50',
//     marginBottom: 4,
//   },
//   patientId: {
//     fontSize: 14,
//     color: '#7F8C8D',
//     marginBottom: 8,
//   },
//   statusBadge: {
//     alignSelf: 'flex-start',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 12,
//   },
//   statusText: {
//     color: 'white',
//     fontSize: 11,
//     fontWeight: 'bold',
//   },
//   testsSection: {
//     marginBottom: 16,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#2C3E50',
//     marginBottom: 8,
//   },
//   testItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F8F9FA',
//   },
//   testInfo: {
//     flex: 1,
//   },
//   testName: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#2C3E50',
//     marginBottom: 2,
//   },
//   testCategory: {
//     fontSize: 12,
//     color: '#7F8C8D',
//   },
//   testActions: {
//     marginLeft: 12,
//   },
//   collectButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#27AE60',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 8,
//     gap: 6,
//   },
//   collectButtonText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   collectedBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#E8F5E8',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 8,
//     gap: 6,
//   },
//   collectedText: {
//     color: '#27AE60',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   samplesSection: {
//     marginBottom: 16,
//   },
//   samplesContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//   },
//   sampleChip: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F8F9FA',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 12,
//     gap: 6,
//   },
//   sampleCollected: {
//     backgroundColor: '#E8F5E8',
//   },
//   sampleText: {
//     fontSize: 12,
//     color: '#2C3E50',
//   },
//   summarySection: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingTop: 12,
//     borderTopWidth: 1,
//     borderTopColor: '#F8F9FA',
//   },
//   summaryText: {
//     fontSize: 14,
//     color: '#7F8C8D',
//   },
//   forwardButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#1E96A9',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 8,
//     gap: 6,
//   },
//   forwardButtonText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   emptyState: {
//     alignItems: 'center',
//     padding: 40,
//   },
//   emptyText: {
//     color: '#BDC3C7',
//     fontSize: 16,
//     textAlign: 'center',
//     marginTop: 12,
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     padding: 20,
//   },
//   modalContent: {
//     backgroundColor: 'white',
//     borderRadius: 16,
//     padding: 24,
//     width: '100%',
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#2C3E50',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   modalPatientInfo: {
//     backgroundColor: '#F8F9FA',
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 20,
//   },
//   modalPatientName: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#2C3E50',
//     marginBottom: 4,
//   },
//   modalTestName: {
//     fontSize: 16,
//     color: '#34495E',
//     marginBottom: 4,
//   },
//   modalTestDetails: {
//     fontSize: 14,
//     color: '#7F8C8D',
//   },
//   inputLabel: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#2C3E50',
//     marginBottom: 8,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#D5D8DC',
//     borderRadius: 8,
//     padding: 12,
//     fontSize: 16,
//     marginBottom: 20,
//   },
//   textArea: {
//     minHeight: 80,
//     textAlignVertical: 'top',
//   },
//   modalButtons: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   cancelButton: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: '#ECF0F1',
//     borderRadius: 10,
//     alignItems: 'center',
//   },
//   cancelButtonText: {
//     color: '#7F8C8D',
//     fontWeight: '600',
//     fontSize: 16,
//   },
//   confirmButton: {
//     flex: 2,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 16,
//     backgroundColor: '#27AE60',
//     borderRadius: 10,
//     gap: 8,
//   },
//   confirmButtonText: {
//     color: 'white',
//     fontWeight: '600',
//     fontSize: 16,
//   },
// });

// export default AnalyzerDashboard;