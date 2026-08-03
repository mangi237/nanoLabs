// // components/lab/LabDashboard.tsx - CORRECTED
// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   TouchableOpacity,
//   Alert,
//   ActivityIndicator,
//   Modal,
//   ScrollView,
//   RefreshControl,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import * as DocumentPicker from "expo-document-picker";
// import { 
//   collection, 
//   query, 
//   where, 
//   onSnapshot, 
//   updateDoc, 
//   doc, 
//   addDoc,
//   Timestamp,
//   orderBy 
// } from "firebase/firestore";
// import { db } from "../../services/firebase";
// import { useAuth } from "../../context/authContext";
// import AnimatedHeader from "../../components/common/AnimateHeader";
// import { Patient, LabTest } from "../../types/Patient";
// import { safeToDate } from "../../utils/safeToDate";

// // Always use Vercel URL
// const getApiUrl = () => {
//   return 'https://ndamclinic.vercel.app/api/upload';
// };

// async function uploadFileToBackend(file: File | Blob): Promise<string | null> {
//   try {
//     const formData = new FormData();
//     formData.append('file', file);

//     const res = await fetch(getApiUrl(), {
//       method: "POST",
//       body: formData,
//     });

//     if (!res.ok) {
//       const errorText = await res.text();
//       console.error('Upload failed:', res.status, errorText);
//       throw new Error(`Upload failed: ${res.status}`);
//     }

//     const data = await res.json();
//     return data.fileUrl;
//   } catch (error) {
//     console.error('Backend upload error:', error);
//     return null;
//   }
// }

// const LabDashboard = () => {
//   const [patients, setPatients] = useState<Patient[]>([]);
//   const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
//   const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
//   const [uploading, setUploading] = useState(false);
//   const [showUploadModal, setShowUploadModal] = useState(false);
//   const [showSuccessModal, setShowSuccessModal] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const { user } = useAuth();

//   const [stats, setStats] = useState({
//     totalPatients: 0,
//     sampleCollected: 0,
//     resultsPending: 0,
//     resultsCompleted: 0,
//   });

//   // Real-time listener for patients with collected samples
//   useEffect(() => {
//     if (!user) return;

//     const patientsQuery = query(
//       collection(db, "patients"),
//       where("status", "in", ["lab-sample-collected"]),
//       orderBy("updatedAt", "desc")
//     );

//     const unsubscribe = onSnapshot(patientsQuery, (snapshot) => {
//       const patientData = snapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       })) as Patient[];

//       setPatients(patientData);
//       calculateStats(patientData);
//     });

//     return () => unsubscribe();
//   }, [user]);

//   const calculateStats = (patientData: Patient[]) => {
//     let sampleCollected = 0;
//     let resultsPending = 0;
//     let resultsCompleted = 0;

//     patientData.forEach((patient) => {
//       if (patient.labTests) {
//         patient.labTests.forEach((test) => {
//           if (test.sampleCollected) {
//             sampleCollected++;
//             if (test.status === 'sample-collected') {
//               resultsPending++;
//             } else if (test.status === 'completed') {
//               resultsCompleted++;
//             }
//           }
//         });
//       }
//     });

//     setStats({
//       totalPatients: patientData.length,
//       sampleCollected,
//       resultsPending,
//       resultsCompleted,
//     });
//   };

//   const onRefresh = () => {
//     setRefreshing(true);
//     setTimeout(() => setRefreshing(false), 1000);
//   };

//   const pickDocument = async () => {
//     if (!selectedPatient || !selectedTest || !user) return;

//     try {
//       const result = await DocumentPicker.getDocumentAsync({
//         type: 'application/pdf',
//         copyToCacheDirectory: true,
//       });

//       if (result.canceled) return;

//       let fileUri: string;
//       let fileName: string;

//       if ('assets' in result && result.assets && result.assets.length > 0) {
//         const pickedFile = result.assets[0];
//         fileUri = pickedFile.uri;
//         fileName = pickedFile.name;
//       } else {
//         console.log('Document picking cancelled');
//         return;
//       }

//       // Create file object
//       const response = await fetch(fileUri);
//       const blob = await response.blob();
//       const file = new File([blob], fileName, { type: 'application/pdf' });

//       setUploading(true);
//       const fileUrl = await uploadFileToBackend(file);

//       if (fileUrl) {
//         // Update the specific lab test with results
//         const patientRef = doc(db, 'patients', selectedPatient.id!);
//         const updatedLabTests = selectedPatient.labTests.map(test => 
//           test.id === selectedTest.id 
//             ? {
//                 ...test,
//                 status: 'completed',
//                 resultFile: {
//                   fileName,
//                   fileUrl,
//                   uploadedAt: Timestamp.now(),
//                   uploadedBy: user.name,
//                 },
//                 completedDate: Timestamp.now(),
//                 technicianName: user.name,
//               }
//             : test
//         );

//         // Check if all tests are completed
//         const allTestsCompleted = updatedLabTests.every(test => 
//           test.status === 'completed'
//         );

//         await updateDoc(patientRef, {
//           labTests: updatedLabTests,
//           status: allTestsCompleted ? 'lab-completed' : 'lab-sample-collected',
//           updatedAt: Timestamp.now(),
//           resultUrls: [
//             ...(selectedPatient.resultUrls || []),
//             {
//               fileName,
//               fileUrl,
//               uploadedAt: Timestamp.now(),
//               uploadedBy: user.name,
//             }
//           ]
//         });

//         // Add to labResults collection for history
//         await addDoc(collection(db, 'labResults'), {
//           patientId: selectedPatient.id,
//           patientName: selectedPatient.name,
//           testId: selectedTest.id,
//           testName: selectedTest.name,
//           fileName,
//           fileUrl,
//           uploadedBy: user.name,
//           uploadedAt: Timestamp.now(),
//           status: 'completed',
//         });

//         setShowUploadModal(false);
//         setShowSuccessModal(true);
//         setSelectedPatient(null);
//         setSelectedTest(null);
//       } else {
//         Alert.alert('Error', 'Failed to upload file to server.');
//       }
//     } catch (error) {
//       console.error('Error picking/uploading document:', error);
//       Alert.alert('Error', 'Failed to pick or upload document.');
//     } finally {
//       setUploading(false);
//     }
//   };

//   const getTestsPendingResults = (patient: Patient): LabTest[] => {
//     if (!patient.labTests) return [];
//     return patient.labTests.filter(test => 
//       test.sampleCollected && test.status === 'sample-collected'
//     );
//   };

//   const getCompletedTests = (patient: Patient): LabTest[] => {
//     if (!patient.labTests) return [];
//     return patient.labTests.filter(test => test.status === 'completed');
//   };

//   const renderStatsCard = (
//     title: string,
//     value: number,
//     subtitle: string,
//     icon: string,
//     color: string
//   ) => (
//     <div style={[styles.statCard, { borderLeftColor: color }]}>
//       <div style={styles.statContent}>
//         <Text style={styles.statValue}>{value}</Text>
//         <Text style={styles.statTitle}>{title}</Text>
//         <Text style={styles.statSubtitle}>{subtitle}</Text>
//       </view
//       <div style={[styles.statIcon, { backgroundColor: color + "20" }]}>
//         <Ionicons name={icon as any} size={24} color={color} />
//       </view
//     </view
//   );

//   const renderPatientItem = ({ item }: { item: Patient }) => {
//     const pendingTests = getTestsPendingResults(item);
//     const completedTests = getCompletedTests(item);
    
//     return (
//       <div style={styles.patientCard}>
//         <div style={styles.patientHeader}>
//           <div style={styles.patientInfo}>
//             <Text style={styles.patientName}>{item.name}</Text>
//             <Text style={styles.patientId}>ID: {item.patientId}</Text>
//             <div style={[
//               styles.statusBadge,
//               { backgroundColor: pendingTests.length === 0 ? '#27AE60' : '#E67E22' }
//             ]}>
//               <Text style={styles.statusText}>
//                 {pendingTests.length === 0 ? 'ALL RESULTS DONE' : `${pendingTests.length} TESTS PENDING`}
//               </Text>
//             </view
//           </view
//         </view

//         <div style={styles.testsSection}>
//           <Text style={styles.sectionTitle}>Tests Awaiting Results:</Text>
//           {pendingTests.length === 0 ? (
//             <Text style={styles.noTestsText}>All tests completed</Text>
//           ) : (
//             pendingTests.map((test, index) => (
//               <TouchableOpacity
//                 key={index}
//                 style={styles.testItem}
//                 onPress={() => {
//                   setSelectedPatient(item);
//                   setSelectedTest(test);
//                   setShowUploadModal(true);
//                 }}
//               >
//                 <div style={styles.testInfo}>
//                   <Text style={styles.testName}>{test.name}</Text>
//                   <Text style={styles.testCategory}>{test.category}</Text>
//                   <Text style={styles.testSamples}>
//                     Samples: {test.samples?.join(', ')}
//                   </Text>
//                 </view
//                 <div style={styles.testActions}>
//                   <TouchableOpacity style={styles.uploadButton}>
//                     <Ionicons name="cloud-upload" size={20} color="white" />
//                     <Text style={styles.uploadButtonText}>Upload Results</Text>
//                   </TouchableOpacity>
//                 </view
//               </TouchableOpacity>
//             ))
//           )}
//         </view

//         {completedTests.length > 0 && (
//           <div style={styles.completedSection}>
//             <Text style={styles.sectionTitle}>Completed Results:</Text>
//             {completedTests.map((test, index) => (
//               <div key={index} style={styles.completedTest}>
//                 <Text style={styles.completedTestName}>{test.name}</Text>
//                 {test.resultFile && (
//                   <TouchableOpacity 
//                     style={styles.viewResultButton}
//                     onPress={() => {
//                       Alert.alert("View Results", "Open lab results?", [
//                         { text: "Cancel", style: "cancel" },
//                         { 
//                           text: "Open", 
//                           onPress: () => window.open(test.resultFile!.url, "_blank") 
//                         },
//                       ]);
//                     }}
//                   >
//                     <Ionicons name="document-text" size={16} color="#2196F3" />
//                     <Text style={styles.viewResultText}>View Results</Text>
//                   </TouchableOpacity>
//                 )}
//               </view
//             ))}
//           </view
//         )}
//       </view
//     );
//   };

//   return (
//     <div style={styles.container}>
//       <AnimatedHeader />
      
//       <ScrollView
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//       >
//         {/* Stats Overview */}
//         <div style={styles.statsContainer}>
//           <div style={styles.statsRow}>
//             {renderStatsCard("Total Patients", stats.totalPatients, "With samples", "people", "#2196F3")}
//             {renderStatsCard("Samples", stats.sampleCollected, "Collected", "water", "#9C27B0")}
//           </view
//           <div style={styles.statsRow}>
//             {renderStatsCard("Pending", stats.resultsPending, "Results needed", "time", "#FF9800")}
//             {renderStatsCard("Completed", stats.resultsCompleted, "Results done", "checkmark-circle", "#4CAF50")}
//           </view
//         </view

//         <Text style={styles.sectionHeader}>Patients Awaiting Results</Text>

//         <FlatList
//           data={patients}
//           renderItem={renderPatientItem}
//           keyExtractor={(item) => item.id!}
//           scrollEnabled={false}
//           ListEmptyComponent={
//             <div style={styles.emptyState}>
//               <Ionicons name="flask-outline" size={60} color="#ccc" />
//               <Text style={styles.emptyText}>No patients awaiting lab results</Text>
//             </view
//           }
//         />
//       </ScrollView>

//       {/* Upload Results Modal */}
//       <Modal visible={showUploadModal} animationType="slide" transparent={true}>
//         <div style={styles.modalContainer}>
//           <div style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Upload Results for {selectedPatient?.name}</Text>
//             <Text style={styles.modalSubtitle}>Patient ID: {selectedPatient?.patientId}</Text>
            
//             {selectedTest && (
//               <div style={styles.testInfoModal}>
//                 <Text style={styles.testNameModal}>{selectedTest.name}</Text>
//                 <Text style={styles.testDetailsModal}>
//                   {selectedTest.category} • ${selectedTest.price?.toFixed(2)}
//                 </Text>
//                 <Text style={styles.testSamplesModal}>
//                   Samples: {selectedTest.samples?.join(', ')}
//                 </Text>
//               </view
//             )}

//             <TouchableOpacity
//               style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
//               onPress={pickDocument}
//               disabled={uploading}
//             >
//               {uploading ? (
//                 <ActivityIndicator color="white" />
//               ) : (
//                 <>
//                   <Ionicons name="document" size={20} color="white" />
//                   <Text style={styles.uploadBtnText}>Select PDF Results</Text>
//                 </>
//               )}
//             </TouchableOpacity>

//             <div style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={styles.cancelBtn}
//                 onPress={() => {
//                   setShowUploadModal(false);
//                   setSelectedPatient(null);
//                   setSelectedTest(null);
//                 }}
//                 disabled={uploading}
//               >
//                 <Text style={styles.cancelBtnText}>Cancel</Text>
//               </TouchableOpacity>
//             </view
//           </view
//         </view
//       </Modal>

//       <Modal visible={showSuccessModal} animationType="fade" transparent={true}>
//         <div style={styles.modalContainer}>
//           <div style={styles.modalContent}>
//             <Ionicons
//               name="checkmark-circle"
//               size={50}
//               color="#4CAF50"
//               style={{ alignSelf: "center" }}
//             />
//             <Text style={styles.modalTitle}>Upload Successful!</Text>
//             <Text style={styles.modalSubtitle}>
//               Lab results have been saved and patient status updated.
//             </Text>
//             <TouchableOpacity
//               style={[styles.uploadBtn, { marginTop: 15 }]}
//               onPress={() => setShowSuccessModal(false)}
//             >
//               <Text style={styles.uploadBtnText}>OK</Text>
//             </TouchableOpacity>
//           </view
//         </view
//       </Modal>
//     </view
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#f5f5f5" },
//   statsContainer: { padding: 15 },
//   statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
//   statCard: {
//     flex: 1,
//     backgroundColor: "white",
//     borderRadius: 12,
//     padding: 15,
//     marginHorizontal: 5,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     borderLeftWidth: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   statContent: { flex: 1 },
//   statValue: { fontSize: 24, fontWeight: "bold", color: "#333" },
//   statTitle: { fontSize: 14, fontWeight: "600", color: "#333", marginTop: 2 },
//   statSubtitle: { fontSize: 12, color: "#666", marginTop: 2 },
//   statIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
//   sectionHeader: { fontSize: 18, fontWeight: "bold", marginHorizontal: 15, marginBottom: 10, color: "#333" },
//   patientCard: {
//     backgroundColor: "white",
//     borderRadius: 12,
//     padding: 15,
//     marginHorizontal: 15,
//     marginBottom: 15,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   patientHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
//   patientInfo: { flex: 1 },
//   patientName: { fontSize: 18, fontWeight: "bold", color: "#333" },
//   patientId: { fontSize: 14, color: "#666", marginTop: 2 },
//   statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start", marginTop: 5 },
//   statusText: { color: "white", fontSize: 12, fontWeight: "600" },
//   testsSection: { marginBottom: 10 },
//   sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8, color: "#333" },
//   noTestsText: { color: "#7F8C8D", fontStyle: "italic", padding: 8 },
//   testItem: { 
//     flexDirection: "row", 
//     justifyContent: "space-between", 
//     alignItems: "center", 
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#F5F5F5",
//   },
//   testInfo: { flex: 1 },
//   testName: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 4 },
//   testCategory: { fontSize: 12, color: "#7F8C8D", marginBottom: 4 },
//   testSamples: { fontSize: 12, color: "#666", fontStyle: "italic" },
//   testActions: { marginLeft: 10 },
//   uploadButton: { 
//     flexDirection: "row", 
//     alignItems: "center", 
//     backgroundColor: "#2196F3", 
//     paddingHorizontal: 12, 
//     paddingVertical: 8, 
//     borderRadius: 8 
//   },
//   uploadButtonText: { color: "white", marginLeft: 5, fontWeight: "600", fontSize: 12 },
//   completedSection: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F5F5F5" },
//   completedTest: { 
//     flexDirection: "row", 
//     justifyContent: "space-between", 
//     alignItems: "center", 
//     paddingVertical: 8 
//   },
//   completedTestName: { fontSize: 14, color: "#666", flex: 1 },
//   viewResultButton: { 
//     flexDirection: "row", 
//     alignItems: "center", 
//     backgroundColor: "#E3F2FD", 
//     paddingHorizontal: 8, 
//     paddingVertical: 4, 
//     borderRadius: 6 
//   },
//   viewResultText: { color: "#2196F3", marginLeft: 4, fontSize: 12, fontWeight: "600" },
//   modalContainer: { flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" },
//   modalContent: { backgroundColor: "white", margin: 20, borderRadius: 12, padding: 20 },
//   modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, textAlign: "center", color: "#333" },
//   modalSubtitle: { fontSize: 14, color: "#666", marginBottom: 20, textAlign: "center" },
//   testInfoModal: { 
//     backgroundColor: "#F8F9FA", 
//     padding: 15, 
//     borderRadius: 10, 
//     marginBottom: 20 
//   },
//   testNameModal: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 5 },
//   testDetailsModal: { fontSize: 14, color: "#666", marginBottom: 5 },
//   testSamplesModal: { fontSize: 12, color: "#7F8C8D" },
//   uploadBtn: { backgroundColor: "#2196F3", paddingVertical: 12, borderRadius: 8, flexDirection: "row", justifyContent: "center", alignItems: "center" },
//   uploadBtnText: { color: "white", fontWeight: "600", marginLeft: 5 },
//   uploadBtnDisabled: { opacity: 0.6 },
//   cancelBtn: { marginTop: 10, backgroundColor: "#ccc", paddingVertical: 12, borderRadius: 8 },
//   cancelBtnText: { color: "#333", textAlign: "center", fontWeight: "600" },
//   modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
//   emptyState: { justifyContent: "center", alignItems: "center", padding: 20 },
//   emptyText: { color: "#ccc", fontSize: 16, marginTop: 10 },
// });

// export default LabDashboard;