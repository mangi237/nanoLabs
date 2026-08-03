// components/cashier/BillDetailsModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExtendedBill } from '../../screens/cashier/CashierDashboard';
import { safeToDate } from '../../utils/safeToDate';

interface BillDetailsModalProps {
  visible: boolean;
  bill: ExtendedBill;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

const BillDetailsModal: React.FC<BillDetailsModalProps> = ({
  visible,
  bill,
  onClose,
  onApprove,
  onReject,
}) => {
  const createdDate = safeToDate(bill.createdAt);
  const dueDate = bill.paidAt ? safeToDate(bill.paidAt) : null;
  const isOverdue = dueDate ? dueDate < new Date() : false;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <div style={styles.modalOverlay}>
        <div style={styles.modalContainer}>
          <div style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Bill Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
          </view

          <ScrollView style={styles.modalContent}>
            <div style={styles.billHeader}>
              <div 
                <Text style={styles.patientName}>{bill.patientName}</Text>
                <Text style={styles.patientId}>Patient ID: {bill.patientId.substring(0, 8)}</Text>
              </view
              <div style={[
                styles.statusBadge,
                isOverdue && styles.overdueBadge,
                bill.patientStatus === 'emergency' && styles.emergencyBadge,
              ]}>
                <Text style={styles.statusBadgeText}>
                  {isOverdue ? 'OVERDUE' : bill.patientStatus?.toUpperCase() || 'ACTIVE'}
                </Text>
              </view
            </view

            <div style={styles.amountSection}>
              <Text style={styles.amountLabel}>Amount</Text>
              <Text style={styles.amount}>${bill.amount?.toFixed(2) || '0.00'}</Text>
            </view

            <div style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Bill Information</Text>
              
              <div style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description:</Text>
                <Text style={styles.detailValue}>{bill.description}</Text>
              </view
              
              <div style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category:</Text>
                <div style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{bill.category}</Text>
                </view
              </view
              
              <div style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created:</Text>
                <Text style={styles.detailValue}>
                  {createdDate.toLocaleDateString()} at {createdDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
              </view
              
              {dueDate && (
                <div style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Due Date:</Text>
                  <Text style={[
                    styles.detailValue,
                    isOverdue && styles.overdueText
                  ]}>
                    {dueDate.toLocaleDateString()}
                    {isOverdue && ' (Overdue)'}
                  </Text>
                </view
              )}
              
              <div style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created By:</Text>
                <Text style={styles.detailValue}>{bill.createdByName || 'System'}</Text>
              </view
              
              {bill.notes && (
                <div style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Notes:</Text>
                  <Text style={styles.detailValue}>{bill.notes}</Text>
                </view
              )}
            </view

            {bill.items && bill.items.length > 0 && (
              <div style={styles.itemsSection}>
                <Text style={styles.sectionTitle}>Bill Items</Text>
                {bill.items.map((item, index) => (
                  <div key={index} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemAmount}>${item.amount?.toFixed(2)}</Text>
                  </view
                ))}
              </view
            )}
          </ScrollView>

          <div style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={onReject}
            >
              <Ionicons name="close-circle" size={20} color="white" />
              <Text style={styles.rejectButtonText}>Reject Bill</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={onApprove}
            >
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.approveButtonText}>Approve & Pay</Text>
            </TouchableOpacity>
          </view
        </view
      </view
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  patientId: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
  },
  overdueBadge: {
    backgroundColor: '#FADBD8',
  },
  emergencyBadge: {
    backgroundColor: '#FDEDEC',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E96A9',
  },
  amountSection: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 5,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  detailsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 2,
    textAlign: 'right',
  },
  overdueText: {
    color: '#E74C3C',
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#1E96A9',
    fontWeight: '600',
  },
  itemsSection: {
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  itemName: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27AE60',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
    gap: 10,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E74C3C',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27AE60',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  rejectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  approveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BillDetailsModal;