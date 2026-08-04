import React, { useState } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { db, addDoc, collection } from '../../services/firebase';
import { sendEmail } from '../../services/emailService';
import { Calendar, Clock, User, MapPin, FileText, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

interface BookAppointmentScreenProps {
  onBack?: () => void;
  onSuccess?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const BookAppointmentScreen: React.FC<BookAppointmentScreenProps> = ({
  onBack,
  onSuccess,
  onNotificationPress,
  onProfilePress
}) => {
  const { user, lab } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    title: 'Laboratory Diagnostic Screening',
    date: '2026-08-10',
    time: '09:30 AM',
    doctorName: 'Dr. Alexis Vance',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.title.trim() || !formData.date.trim()) {
      setErrorMessage('Please specify an appointment title and preferred date.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'labs', lab?.id || 'lab-1', 'appointments'), {
        ...formData,
        patientName: user?.name || 'Valued Patient',
        patientId: user?.id || 'pat-1',
        status: 'scheduled',
        location: lab?.name || 'nanoLabs Central Diagnostics',
        createdAt: new Date().toISOString()
      });

      // Send appointment confirmation email if email available
      if (user?.email) {
        sendEmail(
          user.email,
          `Appointment Confirmation: ${formData.title} - nanoLabs`,
          `Dear ${user.name || 'Patient'},\n\nYour appointment has been successfully scheduled!\n\nService: ${formData.title}\nDate: ${formData.date}\nTime: ${formData.time}\nLocation: ${lab?.name || 'nanoLabs Central Diagnostics'}\n\nThank you for choosing nanoLabs!`
        ).catch(e => console.warn('Appointment email error:', e));
      }

      if (onSuccess) onSuccess();
      else if (onBack) onBack();
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Book Appointment"
        subtitle="Schedule a consultation or test appointment"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Appointment Request Form</h2>
            <p className="text-xs text-slate-500">Select preferred medical service timing</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Purpose / Test Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Time</label>
                <input
                  type="text"
                  required
                  placeholder="09:30 AM"
                  value={formData.time}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Attending Physician / Specialist</label>
              <input
                type="text"
                value={formData.doctorName}
                onChange={e => setFormData({ ...formData, doctorName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Notes / Symptoms</label>
              <textarea
                rows={3}
                placeholder="Mention any relevant symptoms or instructions..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Booking Appointment...
                </>
              ) : (
                <>
                  Confirm Appointment Booking
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default BookAppointmentScreen;
