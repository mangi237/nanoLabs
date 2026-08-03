import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Button } from 'react-native';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';

const RecordLabResultModal = ({ visible, onClose, patientId }) => {
  const [testName, setTestName] = useState('');
  const [result, setResult] = useState('');

  const handleRecord = async () => {
    await addDoc(collection(db, 'labResults'), {
      patientId,
      testName,
      result,
      createdAt: new Date(),
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide">
      <div 
        <Text>Record Lab Result</Text>
        <TextInput placeholder="Test Name" value={testName} onChangeText={setTestName} />
        <TextInput placeholder="Result" value={result} onChangeText={setResult} />
        <TouchableOpacity title="Record" onPress={handleRecord} />
        <TouchableOpacity title="Cancel" onPress={onClose} />
      </view
    </Modal>
  );
};

export default RecordLabResultModal;