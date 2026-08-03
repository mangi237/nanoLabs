import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import { useAuth } from '../context/authContext';
import { db, getDocs, collection } from '../services/firebase';
import { Bell, TestTube, AlertTriangle, DollarSign, CheckCircle2, ArrowLeft, Clock } from 'lucide-react';

interface NotificationsScreenProps {
  onBack?: () => void;
  onProfilePress?: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onBack,
  onProfilePress
}) => {
  const { lab } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [lab?.id]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'labs', lab?.id || 'lab-1', 'notifications'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(list);
    } catch (e) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'lab': return <TestTube className="w-5 h-5 text-teal-600" />;
      case 'stock': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'bill': return <DollarSign className="w-5 h-5 text-blue-600" />;
      default: return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Notifications & Activity Log"
        subtitle="Real-time alerts for laboratory events"
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Notifications Desk</h2>
            <p className="text-xs text-slate-500">Live system updates, inventory stock thresholds & clinical results</p>
          </div>
          <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            {notifications.length} Alerts
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
          {notifications.map(n => (
            <div key={n.id} className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors">
              <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{n.title}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default NotificationsScreen;
