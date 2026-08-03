import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection } from '../../services/firebase';
import { Calendar, Plus, Clock, MapPin, User, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface AppointmentScreenProps {
  onBack?: () => void;
  onNavigateBook?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const AppointmentScreen: React.FC<AppointmentScreenProps> = ({
  onBack,
  onNavigateBook,
  onNotificationPress,
  onProfilePress
}) => {
  const { lab } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, [lab?.id]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'labs', lab?.id || 'lab-1', 'appointments'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAppointments(list);
    } catch (e) {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Scheduled Appointments"
        subtitle="Manage upcoming medical screenings & consultations"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Clinical Appointments</h2>
            <p className="text-xs text-slate-500">Scheduled times for sample collection & doctor reviews</p>
          </div>

          {onNavigateBook && (
            <button
              onClick={onNavigateBook}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Book New Appointment
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map(app => (
            <div
              key={app.id}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{app.title}</h3>
                    <p className="text-xs text-teal-600 font-medium">{app.doctorName || 'Dr. Alexis Vance'}</p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  {app.status || 'Scheduled'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100 font-medium">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{app.date || '2026-08-10'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{app.time || '10:00 AM'}</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{app.location || 'nanoLabs Central Diagnostics'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AppointmentScreen;
