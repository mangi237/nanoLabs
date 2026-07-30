import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet } from 'react-native';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const MedicationList = ({ patientId }: { patientId: string }) => {
  const [medications, setMedications] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    name: '',
    prescription: '',
    timeToTake: '',
    duration: '',
  });

  useEffect(() => {
    const q = query(collection(db, 'medications'), where('patientId', '==', patientId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMedications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [patientId]);

  const handleAddMedication = async () => {
    await addDoc(collection(db, 'medications'), {
      patientId,
      ...form,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setForm({ name: '', prescription: '', timeToTake: '', duration: '' });
    setModalVisible(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>Add Medication</Text>
      </TouchableOpacity>
      <FlatList
        data={medications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.title}>{item.name}</Text>
            <Text>Prescription: {item.prescription}</Text>
            <Text>Time: {item.timeToTake}</Text>
            <Text>Duration: {item.duration}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30 }}>No medications</Text>}
      />
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Medication</Text>
            <TextInput style={styles.input} placeholder="Medication Name" value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} />
            <TextInput style={styles.input} placeholder="Prescription" value={form.prescription} onChangeText={v => setForm(f => ({ ...f, prescription: v }))} />
            <TextInput style={styles.input} placeholder="Time to Take" value={form.timeToTake} onChangeText={v => setForm(f => ({ ...f, timeToTake: v }))} />
            <TextInput style={styles.input} placeholder="Duration" value={form.duration} onChangeText={v => setForm(f => ({ ...f, duration: v }))} />
            <TouchableOpacity style={styles.saveButton} onPress={handleAddMedication}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  addButton: { backgroundColor: '#27AE60', padding: 12, borderRadius: 8, margin: 10, alignItems: 'center' },
  addButtonText: { color: 'white', fontWeight: 'bold' },
  item: { backgroundColor: 'white', padding: 15, margin: 10, borderRadius: 10, elevation: 2 },
  title: { fontWeight: 'bold', fontSize: 16 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', borderRadius: 15, padding: 20, width: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#D5D8DC', borderRadius: 8, padding: 12, marginBottom: 10 },
  saveButton: { backgroundColor: '#27AE60', borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: 'white', fontWeight: 'bold' },
  cancelButton: { backgroundColor: '#ECF0F1', borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 10 },
  cancelButtonText: { color: '#2C3E50', fontWeight: 'bold' },
});

export default MedicationList;