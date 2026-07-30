// components/patient/PatientAccessControl.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
}

interface AccessLog {
  id: string;
  staffId: string;
  staffName: string;
  timestamp: Date;
  action: string;
  accessType: 'normal' | 'emergency_override';
}

interface PatientAccessControlProps {
  patientId: string;
  hospitalId: string;
  visible: boolean;
  onClose: () => void;
}

const PatientAccessControl: React.FC<PatientAccessControlProps> = ({
  patientId,
  hospitalId,
  visible,
  onClose
}) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [blockedStaff, setBlockedStaff] = useState<string[]>([]);
  const [approvedStaff, setApprovedStaff] = useState<string[]>([]);
  const [accessLog, setAccessLog] = useState<AccessLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [accessMode, setAccessMode] = useState<'standard' | 'restricted' | 'high-privacy'>('standard');
  const [showAccessLog, setShowAccessLog] = useState(false);

  useEffect(() => {
    if (visible && hospitalId) {
      fetchStaffList();
      fetchPatientPrivacySettings();
      fetchAccessLog();
    }
  }, [visible, hospitalId, patientId]);

  const fetchStaffList = async () => {
    try {
      const staffRef = collection(db, 'hospitals', hospitalId, 'staff');
      const staffSnapshot = await getDocs(staffRef);
      
      const staffData = staffSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Staff[];
      
      setStaffList(staffData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching staff:', error);
      Alert.alert('Error', 'Failed to load staff list');
      setLoading(false);
    }
  };

  const fetchPatientPrivacySettings = async () => {
    try {
      const patientRef = doc(db, 'hospitals', hospitalId, 'patients', patientId);
      
      const unsubscribe = onSnapshot(patientRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBlockedStaff(data.blockedStaff || []);
          setApprovedStaff(data.approvedStaff || []);
          setAccessMode(data.accessMode || 'standard');
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
    }
  };

  const fetchAccessLog = async () => {
    try {
      const accessLogRef = collection(db, 'hospitals', hospitalId, 'patients', patientId, 'accessLog');
      
      const unsubscribe = onSnapshot(accessLogRef, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        })) as AccessLog[];
        
        // Sort by most recent first
        logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setAccessLog(logs);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error fetching access log:', error);
    }
  };

  const handleBlockStaff = async (staffId: string, staffName: string) => {
    try {
      const patientRef = doc(db, 'hospitals', hospitalId, 'patients', patientId);
      
      if (blockedStaff.includes(staffId)) {
        // Unblock staff
        await updateDoc(patientRef, {
          blockedStaff: arrayRemove(staffId)
        });
        Alert.alert('Access Restored', `${staffName} can now access your records`);
      } else {
        // Block staff
        await updateDoc(patientRef, {
          blockedStaff: arrayUnion(staffId)
        });
        Alert.alert(
          'Access Blocked', 
          `${staffName} can no longer access your records.\n\nNote: In medical emergencies, staff can override this restriction. All emergency access is logged and reviewed.`
        );
      }
    } catch (error) {
      console.error('Error updating block list:', error);
      Alert.alert('Error', 'Failed to update access settings');
    }
  };

  const handleApproveStaff = async (staffId: string) => {
    try {
      const patientRef = doc(db, 'hospitals', hospitalId, 'patients', patientId);
      
      if (approvedStaff.includes(staffId)) {
        await updateDoc(patientRef, {
          approvedStaff: arrayRemove(staffId)
        });
      } else {
        await updateDoc(patientRef, {
          approvedStaff: arrayUnion(staffId)
        });
      }
    } catch (error) {
      console.error('Error updating approved list:', error);
      Alert.alert('Error', 'Failed to update access settings');
    }
  };

  const handleChangeAccessMode = async (mode: 'standard' | 'restricted' | 'high-privacy') => {
    try {
      const patientRef = doc(db, 'hospitals', hospitalId, 'patients', patientId);
      await updateDoc(patientRef, {
        accessMode: mode
      });
      
      const modeDescriptions = {
        'standard': 'Role-based access with audit trail',
        'restricted': 'Only approved providers can access',
        'high-privacy': 'Requires your approval for each access'
      };
      
      Alert.alert('Access Mode Updated', modeDescriptions[mode]);
    } catch (error) {
      console.error('Error updating access mode:', error);
      Alert.alert('Error', 'Failed to update access mode');
    }
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      doctor: '#3B82F6',
      nurse: '#10B981',
      analyzer: '#8B5CF6',
      receptionist: '#F59E0B',
      admin: '#EF4444',
      ward: '#06B6D4',
      matron: '#EC4899',
      cashier: '#14B8A6',
      radiology: '#8B5CF6',
      surgeon: '#DC2626',
      emergency: '#F97316',
    };
    return colors[role] || '#6B7280';
  };

  const filteredStaff = staffList.filter(staff =>
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStaffItem = ({ item }: { item: Staff }) => {
    const isBlocked = blockedStaff.includes(item.id);
    const isApproved = approvedStaff.includes(item.id);

    return (
      <View style={[styles.staffCard, isBlocked && styles.blockedCard]}>
        <View style={styles.staffInfo}>
          <View style={styles.staffHeader}>
            <Text style={styles.staffName}>{item.name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
              <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.staffDepartment}>{item.department || 'No Department'}</Text>
          <Text style={styles.staffEmail}>{item.email}</Text>
        </View>

        <View style={styles.actionButtons}>
          {accessMode === 'restricted' && (
            <TouchableOpacity
              style={[styles.approveButton, isApproved && styles.approvedButton]}
              onPress={() => handleApproveStaff(item.id)}
            >
              <Ionicons 
                name={isApproved ? "checkmark-circle" : "checkmark-circle-outline"} 
                size={16} 
                color="white" 
              />
              <Text style={styles.buttonText}>
                {isApproved ? 'Approved' : 'Approve'}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.blockButton, isBlocked && styles.blockedButton]}
            onPress={() => handleBlockStaff(item.id, item.name)}
          >
            <Ionicons 
              name={isBlocked ? "lock-open" : "lock-closed"} 
              size={16} 
              color="white" 
            />
            <Text style={styles.buttonText}>
              {isBlocked ? 'Unblock' : 'Block'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAccessLogItem = ({ item }: { item: AccessLog }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <Text style={styles.logStaffName}>{item.staffName}</Text>
        {item.accessType === 'emergency_override' && (
          <View style={styles.emergencyBadge}>
            <Ionicons name="warning" size={12} color="#EF4444" />
            <Text style={styles.emergencyText}>Emergency</Text>
          </View>
        )}
      </View>
      <Text style={styles.logAction}>{item.action}</Text>
      <View style={styles.logFooter}>
        <Text style={styles.logDate}>
          {item.timestamp.toLocaleDateString()}
        </Text>
        <Text style={styles.logTime}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <Modal visible={visible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Loading privacy settings...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Privacy Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Access Mode Selector */}
          <View style={styles.modeSection}>
            <Text style={styles.sectionTitle}>Access Control Mode</Text>
            <View style={styles.modeButtons}>
              <TouchableOpacity
                style={[styles.modeButton, accessMode === 'standard' && styles.modeButtonActive]}
                onPress={() => handleChangeAccessMode('standard')}
              >
                <Ionicons 
                  name="shield-checkmark" 
                  size={20} 
                  color={accessMode === 'standard' ? '#6366F1' : '#9CA3AF'} 
                />
                <Text style={[styles.modeButtonText, accessMode === 'standard' && styles.modeButtonTextActive]}>
                  Standard
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeButton, accessMode === 'restricted' && styles.modeButtonActive]}
                onPress={() => handleChangeAccessMode('restricted')}
              >
                <Ionicons 
                  name="lock-closed" 
                  size={20} 
                  color={accessMode === 'restricted' ? '#6366F1' : '#9CA3AF'} 
                />
                <Text style={[styles.modeButtonText, accessMode === 'restricted' && styles.modeButtonTextActive]}>
                  Restricted
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeButton, accessMode === 'high-privacy' && styles.modeButtonActive]}
                onPress={() => handleChangeAccessMode('high-privacy')}
              >
                <Ionicons 
                  name="eye-off" 
                  size={20} 
                  color={accessMode === 'high-privacy' ? '#6366F1' : '#9CA3AF'} 
                />
                <Text style={[styles.modeButtonText, accessMode === 'high-privacy' && styles.modeButtonTextActive]}>
                  High Privacy
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, !showAccessLog && styles.tabActive]}
              onPress={() => setShowAccessLog(false)}
            >
              <Text style={[styles.tabText, !showAccessLog && styles.tabTextActive]}>
                Manage Access ({blockedStaff.length} blocked)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, showAccessLog && styles.tabActive]}
              onPress={() => setShowAccessLog(true)}
            >
              <Text style={[styles.tabText, showAccessLog && styles.tabTextActive]}>
                Access Log ({accessLog.length})
              </Text>
            </TouchableOpacity>
          </View>

          {!showAccessLog ? (
            <>
              {/* Search */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search staff by name or role..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Staff List */}
              <FlatList
                data={filteredStaff}
                renderItem={renderStaffItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No staff members found</Text>
                  </View>
                }
              />
            </>
          ) : (
            <>
              {/* Access Log */}
              <FlatList
                data={accessLog}
                renderItem={renderAccessLogItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No access history yet</Text>
                  </View>
                }
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  modeSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  modeButtonTextActive: {
    color: '#6366F1',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#6366F1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#6366F1',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  staffCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  blockedCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  staffInfo: {
    marginBottom: 12,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  staffDepartment: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  staffEmail: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#10B981',
    borderRadius: 8,
  },
  approvedButton: {
    backgroundColor: '#059669',
  },
  blockButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  blockedButton: {
    backgroundColor: '#DC2626',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  logCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logStaffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  emergencyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
  },
  logAction: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  logTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
});

export default PatientAccessControl;