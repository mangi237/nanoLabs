// // screens/cashier/CashierDashboard.tsx
// import React, { useState, useEffect } from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   ScrollView, 
//   TouchableOpacity, 
//   FlatList,
//   RefreshControl,
//   Alert 
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { 
//   collection, 
//   query, 
//   getDocs, 
//   doc, 
//   updateDoc, 
//   getDoc,
//   where,
//   onSnapshot,
//   Timestamp 
// } from 'firebase/firestore';
// import { db } from '../../services/firebase';
// import AnimatedHeader from '../../components/common/AnimateHeader';
// import { useAuth } from '../../context/authContext';
// import { Bill, Patient } from '../../types/Patient';
// import { safeToDate } from '../../utils/safeToDate';

// export interface ExtendedBill extends Bill {
//   patientId: string;
//   patientName: string;
//   patientStatus: string;
// }

// const CashierDashboard = () => {
//   const [allPatients, setAllPatients] = useState<Patient[]>([]);
//   const [pendingBills, setPendingBills] = useState<ExtendedBill[]>([]);
//   const [refreshing, setRefreshing] = useState(false);
//   const { user } = useAuth();

//   useEffect(() => {
//     const unsubscribe = setupRealTimeListeners();
//     return () => unsubscribe();
//   }, []);

//   const setupRealTimeListeners = () => {
//     if (!user?.hospitalId) return () => {};

//     const patientsRef = collection(db, 'hospitals', user.hospitalId, 'patients');
    
//     const unsubscribe = onSnapshot(patientsRef, (snapshot) => {
//       fetchPendingBills();
//       fetchAllPatients();
//     });

//     return unsubscribe;
//   };

//   const fetchPendingBills = async () => {
//     if (!user?.hospitalId) return;

//     try {
//       const patientsRef = collection(db, 'hospitals', user.hospitalId, 'patients');
//       const patientsSnapshot = await getDocs(patientsRef);

//       const bills: ExtendedBill[] = [];
      
//       // For each patient, check their bills subcollection
//       for (const patientDoc of patientsSnapshot.docs) {
//         const patientData = patientDoc.data();
//         const billsRef = collection(patientDoc.ref, 'bills');
//         const billsSnapshot = await getDocs(billsRef);
        
//         billsSnapshot.forEach(billDoc => {
//           const billData = billDoc.data() as Bill;
//           if (billData.status === 'pending') {
//             bills.push({
//               ...billData,
//               id: billDoc.id,
//               patientId: patientDoc.id,
//               patientName: patientData.name || 'Unknown Patient',
//               patientStatus: patientData.status || 'unknown',
//             });
//           }
//         });
//       }

//       // Sort by date (most recent first)
//       bills.sort((a, b) => {
//         const dateA = safeToDate(a.createdAt);
//         const dateB = safeToDate(b.createdAt);
//         return dateB.getTime() - dateA.getTime();
//       });

//       setPendingBills(bills);
//     } catch (error) {
//       console.error('Error fetching pending bills:', error);
//     }
//   };

//   const fetchAllPatients = async () => {
//     if (!user?.hospitalId) return;

//     try {
//       const patientsRef = collection(db, 'hospitals', user.hospitalId, 'patients');
//       const patientsSnapshot = await getDocs(patientsRef);
      
//       const patients: Patient[] = [];
//       patientsSnapshot.forEach(doc => {
//         patients.push({
//           id: doc.id,
//           ...doc.data()
//         } as Patient);
//       });

//       setAllPatients(patients);
//     } catch (error) {
//       console.error('Error fetching patients:', error);
//     }
//   };

//   const handleApproveBill = async (bill: ExtendedBill) => {
//     if (!user?.hospitalId) return;

//     try {
//       const billRef = doc(db, 'hospitals', user.hospitalId, 'patients', bill.patientId, 'bills', bill.id!);
      
//       await updateDoc(billRef, {
//         status: 'paid',
//         approvedBy: user?.id,
//         approvedAt: Timestamp.now(),
//         paidAt: Timestamp.now(),
//         paidBy: user?.id
//       });

//       // Update patient's outstanding balance in main patient document
//       const patientRef = doc(db, 'hospitals', user.hospitalId, 'patients', bill.patientId);
//       const patientDoc = await getDoc(patientRef);
//       const patientData = patientDoc.data();
      
//       const currentBalance = patientData?.outstandingBalance || 0;
//       const newBalance = Math.max(0, currentBalance - (bill.amount || 0));
      
//       await updateDoc(patientRef, {
//         outstandingBalance: newBalance,
//         lastPaymentDate: Timestamp.now(),
//         updatedAt: Timestamp.now(),
//       });

//       Alert.alert('Success', 'Bill approved and marked as paid');
//     } catch (error) {
//       console.error('Error approving bill:', error);
//       Alert.alert('Error', 'Failed to approve bill');
//     }
//   };

//   const handleRejectBill = async (bill: ExtendedBill) => {
//     Alert.alert(
//       'Reject Bill',
//       'Are you sure you want to reject this bill?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Reject',
//           style: 'destructive',
//           onPress: async () => {
//             if (!user?.hospitalId) return;

//             try {
//               const billRef = doc(db, 'hospitals', user.hospitalId, 'patients', bill.patientId, 'bills', bill.id!);
              
//               await updateDoc(billRef, {
//                 status: 'rejected',
//                 rejectedBy: user?.id,
//                 rejectedAt: Timestamp.now(),
//                 rejectionReason: 'Rejected by cashier'
//               });

//               Alert.alert('Success', 'Bill rejected');
//             } catch (error) {
//               console.error('Error rejecting bill:', error);
//               Alert.alert('Error', 'Failed to reject bill');
//             }
//           },
//         },
//       ]
//     );
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await Promise.all([fetchPendingBills(), fetchAllPatients()]);
//     setRefreshing(false);
//   };

//   const renderBillItem = ({ item }: { item: ExtendedBill }) => {
//     const timestamp = safeToDate(item.createdAt);
//     const isOverdue = item.paidAt ? safeToDate(item.paidAt) < new Date() : false;
    
//     return (
//       <div style={[styles.billItem, isOverdue && styles.overdueBill]}>
//         <div style={styles.billInfo}>
//           <div style={styles.billHeader}>
//             <Text style={styles.billPatient}>{item.patientName}</Text>
//             <div style={[
//               styles.statusBadge,
//               item.patientStatus === 'emergency' && styles.emergencyBadge
//             ]}>
//               <Text style={styles.statusBadgeText}>
//                 {item.patientStatus?.toUpperCase() || 'ACTIVE'}
//               </Text>
//             </view
//           </view
          
//           <Text style={styles.billDescription} numberOfLines={2}>
//             {item.description}
//           </Text>
          
//           <div style={styles.billDetails}>
//             <div style={styles.categoryContainer}>
//               <Text style={styles.billCategory}>{item.category}</Text>
//               {isOverdue && (
//                 <div style={styles.overdueBadge}>
//                   <Text style={styles.overdueText}>OVERDUE</Text>
//                 </view
//               )}
//             </view
//             <Text style={styles.billAmount}>${item.amount?.toFixed(2) || '0.00'}</Text>
//           </view
          
//           <div style={styles.billFooter}>
//             <Text style={styles.billCreator}>
//               Created by: {item.createdByName || 'System'}
//             </Text>
//             <Text style={styles.billDate}>
//               {timestamp.toLocaleDateString()} • {timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
//             </Text>
//           </view
//         </view
        
//         <div style={styles.billActions}>
//           <TouchableOpacity 
//             style={styles.approveButton}
//             onPress={() => handleApproveBill(item)}
//           >
//             <Ionicons name="checkmark-circle" size={18} color="white" />
//             <Text style={styles.approveButtonText}>Approve & Pay</Text>
//           </TouchableOpacity>
//           <TouchableOpacity 
//             style={styles.rejectButton}
//             onPress={() => handleRejectBill(item)}
//           >
//             <Ionicons name="close-circle" size={18} color="white" />
//             <Text style={styles.rejectButtonText}>Reject</Text>
//           </TouchableOpacity>
//         </view
//       </view
//     );
//   };

//   // Filter patients with unpaid bills
//   const patientsWithUnpaidBills = allPatients.filter(patient => {
//     if (!patient.bills || !Array.isArray(patient.bills)) return false;
//     return patient.bills.some(bill => bill.status === 'pending');
//   });

//   return (
//     <div style={styles.container}>
//       <AnimatedHeader />
      
//       <ScrollView
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//         contentContainerStyle={styles.scrollContent}
//       >
//         {/* Summary Cards */}
//         <div style={styles.summaryContainer}>
//           <div style={styles.summaryCard}>
//             <Ionicons name="document-text" size={30} color="#E67E22" />
//             <div 
//               <Text style={styles.summaryNumber}>{pendingBills.length}</Text>
//               <Text style={styles.summaryLabel}>Pending Bills</Text>
//             </view
//           </view
          
//           <div style={styles.summaryCard}>
//             <Ionicons name="people" size={30} color="#27AE60" />
//             <div 
//               <Text style={styles.summaryNumber}>{patientsWithUnpaidBills.length}</Text>
//               <Text style={styles.summaryLabel}>Patients with Bills</Text>
//             </view
//           </view
//         </view

//         {/* Pending Bills Section */}
//         <div style={styles.section}>
//           <Text style={styles.sectionTitle}>Pending Bills for Approval</Text>
          
//           {pendingBills.length === 0 ? (
//             <div style={styles.emptyState}>
//               <Ionicons name="checkmark-done-circle" size={60} color="#BDC3C7" />
//               <Text style={styles.emptyStateTitle}>All Clear!</Text>
//               <Text style={styles.emptyStateText}>
//                 No pending bills requiring approval
//               </Text>
//             </view
//           ) : (
//             <FlatList
//               data={pendingBills}
//               renderItem={renderBillItem}
//               keyExtractor={item => item.id!}
//               scrollEnabled={false}
//               style={styles.billsList}
//             />
//           )}
//         </view

//         {/* Patients with Bills Section */}
//         <div style={styles.section}>
//           <Text style={styles.sectionTitle}>
//             Patients with Unpaid Bills ({patientsWithUnpaidBills.length})
//           </Text>
          
//           {patientsWithUnpaidBills.length === 0 ? (
//             <div style={styles.emptyState}>
//               <Ionicons name="happy-outline" size={60} color="#BDC3C7" />
//               <Text style={styles.emptyStateTitle}>No Outstanding Bills</Text>
//               <Text style={styles.emptyStateText}>
//                 All patients have cleared their bills
//               </Text>
//             </view
//           ) : (
//             patientsWithUnpaidBills.map(patient => {
//               const unpaidBills = patient.bills?.filter(bill => bill.status === 'pending') || [];
//               const totalUnpaid = unpaidBills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
              
//               return (
//                 <div key={patient.id} style={styles.patientCard}>
//                   <div style={styles.patientInfo}>
//                     <Text style={styles.patientName}>{patient.name}</Text>
//                     <Text style={styles.patientId}>ID: {patient.patientId}</Text>
//                     <Text style={styles.unpaidCount}>
//                       {unpaidBills.length} unpaid bill{unpaidBills.length !== 1 ? 's' : ''}
//                     </Text>
//                   </view
//                   <div style={styles.patientAmount}>
//                     <Text style={styles.totalAmount}>${totalUnpaid.toFixed(2)}</Text>
//                     <Text style={styles.patientStatus}>{patient.status}</Text>
//                   </view
//                 </view
//               );
//             })
//           )}
//         </view
//       </ScrollView>
//     </view
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F8F9FA',
//   },
//   scrollContent: {
//     paddingBottom: 20,
//   },
//   summaryContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     padding: 15,
//   },
//   summaryCard: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 15,
//     marginHorizontal: 5,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     gap: 12,
//   },
//   summaryNumber: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#2C3E50',
//   },
//   summaryLabel: {
//     fontSize: 12,
//     color: '#7F8C8D',
//   },
//   section: {
//     backgroundColor: 'white',
//     marginHorizontal: 15,
//     marginTop: 10,
//     borderRadius: 12,
//     padding: 15,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#2C3E50',
//     marginBottom: 15,
//   },
//   billsList: {
//     marginBottom: 10,
//   },
//   billItem: {
//     backgroundColor: 'white',
//     borderRadius: 10,
//     padding: 15,
//     marginBottom: 10,
//     borderWidth: 1,
//     borderColor: '#ECF0F1',
//   },
//   overdueBill: {
//     borderColor: '#FADBD8',
//     backgroundColor: '#FDEDEC',
//   },
//   billInfo: {
//     marginBottom: 15,
//   },
//   billHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   billPatient: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#2C3E50',
//     flex: 1,
//   },
//   statusBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 12,
//     backgroundColor: '#E3F2FD',
//   },
//   emergencyBadge: {
//     backgroundColor: '#FDEDEC',
//   },
//   statusBadgeText: {
//     fontSize: 10,
//     fontWeight: 'bold',
//     color: '#1E96A9',
//   },
//   billDescription: {
//     fontSize: 14,
//     color: '#7F8C8D',
//     marginBottom: 12,
//     lineHeight: 20,
//   },
//   billDetails: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   categoryContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   billCategory: {
//     fontSize: 12,
//     color: '#1E96A9',
//     backgroundColor: '#E3F2FD',
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 12,
//     fontWeight: '600',
//   },
//   overdueBadge: {
//     backgroundColor: '#F1948A',
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 10,
//   },
//   overdueText: {
//     fontSize: 9,
//     color: 'white',
//     fontWeight: 'bold',
//   },
//   billAmount: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#27AE60',
//   },
//   billFooter: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   billCreator: {
//     fontSize: 11,
//     color: '#7F8C8D',
//   },
//   billDate: {
//     fontSize: 11,
//     color: '#BDC3C7',
//   },
//   billActions: {
//     flexDirection: 'row',
//     gap: 10,
//   },
//   approveButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#27AE60',
//     paddingVertical: 10,
//     borderRadius: 8,
//     gap: 6,
//   },
//   rejectButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#E74C3C',
//     paddingVertical: 10,
//     borderRadius: 8,
//     gap: 6,
//   },
//   approveButtonText: {
//     color: 'white',
//     fontSize: 13,
//     fontWeight: '600',
//   },
//   rejectButtonText: {
//     color: 'white',
//     fontSize: 13,
//     fontWeight: '600',
//   },
//   emptyState: {
//     alignItems: 'center',
//     padding: 40,
//   },
//   emptyStateTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#2C3E50',
//     marginTop: 15,
//     marginBottom: 5,
//   },
//   emptyStateText: {
//     fontSize: 14,
//     color: '#7F8C8D',
//     textAlign: 'center',
//     lineHeight: 20,
//   },
//   patientCard: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     backgroundColor: '#F8F9FA',
//     padding: 15,
//     borderRadius: 10,
//     marginBottom: 10,
//   },
//   patientInfo: {
//     flex: 1,
//   },
//   patientName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#2C3E50',
//     marginBottom: 4,
//   },
//   patientId: {
//     fontSize: 12,
//     color: '#7F8C8D',
//     marginBottom: 4,
//   },
//   unpaidCount: {
//     fontSize: 13,
//     color: '#E74C3C',
//     fontWeight: '500',
//   },
//   patientAmount: {
//     alignItems: 'flex-end',
//   },
//   totalAmount: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#2C3E50',
//     marginBottom: 8,
//   },
//   patientStatus: {
//     fontSize: 12,
//     color: '#7F8C8D',
//     backgroundColor: '#ECF0F1',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 6,
//   },
// });

// export default CashierDashboard;