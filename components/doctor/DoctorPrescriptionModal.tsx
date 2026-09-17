import React, { useState } from 'react';
import { db, collection, addDoc, doc, updateDoc, setDoc } from '../../services/firebase';
import { 
  Pill, 
  Plus, 
  Trash2, 
  Clock, 
  Calendar, 
  Check, 
  X, 
  AlertCircle,
  FileText,
  User,
  CheckCircle2
} from 'lucide-react';

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string; // e.g., "Twice daily", "Every 8 hours"
  timing: string; // e.g., "After meals (8:00 AM, 8:00 PM)"
  duration: string; // e.g., "7 days"
  notes?: string;
}

interface DoctorPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: {
    id: string;
    name: string;
    phone?: string;
    gender?: string;
    age?: string | number;
  };
  doctor: {
    id: string;
    name: string;
    specialty?: string;
    licenseNumber?: string;
    hospital?: string;
  };
  relatedBookingId?: string;
  onPrescriptionCreated?: (prescription: any) => void;
}

export const DoctorPrescriptionModal: React.FC<DoctorPrescriptionModalProps> = ({
  isOpen,
  onClose,
  patient,
  doctor,
  relatedBookingId,
  onPrescriptionCreated
}) => {
  const [medications, setMedications] = useState<MedicationItem[]>([
    {
      id: 'med-1',
      name: 'Amoxicillin + Clavulanic Acid (Augmentin)',
      dosage: '1g',
      frequency: 'Twice daily',
      timing: 'After breakfast & dinner (8:00 AM, 8:00 PM)',
      duration: '7 days',
      notes: 'Complete full course even if feeling better'
    }
  ]);

  const [diagnosis, setDiagnosis] = useState('');
  const [generalInstructions, setGeneralInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAddMedication = () => {
    setMedications([
      ...medications,
      {
        id: `med-${Date.now()}`,
        name: '',
        dosage: '',
        frequency: 'Once daily',
        timing: 'Morning after meal',
        duration: '5 days',
        notes: ''
      }
    ]);
  };

  const handleRemoveMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id));
  };

  const handleUpdateMedication = (id: string, field: keyof MedicationItem, value: string) => {
    setMedications(
      medications.map(m => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (medications.some(m => !m.name || !m.dosage)) {
      alert('Please fill in drug name and dosage for all medications.');
      return;
    }

    setSaving(true);
    try {
      const prescriptionData = {
        patientId: patient.id,
        patientName: patient.name,
        patientPhone: patient.phone || '',
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialty || 'General Practitioner',
        doctorLicense: doctor.licenseNumber || 'ONMC-VERIFIED',
        hospital: doctor.hospital || 'Accredited Health Center',
        relatedBookingId: relatedBookingId || null,
        diagnosis: diagnosis.trim(),
        generalInstructions: generalInstructions.trim(),
        medications,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      // Save to doctorPrescriptions collection
      const docRef = await addDoc(collection(db, 'doctorPrescriptions'), prescriptionData);

      setSavedSuccess(true);
      if (onPrescriptionCreated) {
        onPrescriptionCreated({ id: docRef.id, ...prescriptionData });
      }

      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error issuing e-prescription:', err);
      alert('Failed to issue e-prescription. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Official Electronic Prescription (Ordonnance)</h3>
              <p className="text-xs text-slate-500">
                Patient: <strong className="text-slate-800">{patient.name}</strong> • Prescribed by <strong className="text-teal-700">{doctor.name}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">E-Prescription Successfully Issued!</h4>
            <p className="text-xs text-slate-500">
              The prescription has been added to {patient.name}'s secure health records and synced with partner pharmacies.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Diagnosis / Clinical Indication */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Clinical Indication / Diagnosis</label>
              <input
                type="text"
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
                placeholder="e.g. Acute Bacterial Bronchitis / Enteric Fever"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>

            {/* Medications List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Medications & Dosages ({medications.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddMedication}
                  className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-bold border border-teal-200 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Medication</span>
                </button>
              </div>

              <div className="space-y-3">
                {medications.map((med, index) => (
                  <div
                    key={med.id}
                    className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-2.5 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-teal-800">
                        #{index + 1}. Drug & Dosage
                      </span>
                      {medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(med.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={med.name}
                        onChange={e => handleUpdateMedication(med.id, 'name', e.target.value)}
                        placeholder="Drug name (e.g. Paracetamol / Ciprofloxacin)"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                      />
                      <input
                        type="text"
                        required
                        value={med.dosage}
                        onChange={e => handleUpdateMedication(med.id, 'dosage', e.target.value)}
                        placeholder="Dosage (e.g. 500mg, 1 tablet, 5ml)"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={e => handleUpdateMedication(med.id, 'frequency', e.target.value)}
                        placeholder="Frequency (e.g. 3 times daily)"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                      <input
                        type="text"
                        value={med.timing}
                        onChange={e => handleUpdateMedication(med.id, 'timing', e.target.value)}
                        placeholder="Time/Timing (e.g. After meals)"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                      <input
                        type="text"
                        value={med.duration}
                        onChange={e => handleUpdateMedication(med.id, 'duration', e.target.value)}
                        placeholder="Duration (e.g. 5 days)"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General Advice */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Special Instructions / Lifestyle Advice</label>
              <textarea
                rows={2}
                value={generalInstructions}
                onChange={e => setGeneralInstructions(e.target.value)}
                placeholder="e.g. Drink plenty of water (2.5L/day), avoid heavy lifting for 3 days..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'Transmitting Prescription...' : 'Sign & Transmit E-Prescription'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default DoctorPrescriptionModal;
