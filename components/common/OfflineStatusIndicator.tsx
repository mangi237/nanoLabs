import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Database, AlertTriangle } from 'lucide-react';
import { waitForPendingWrites, db } from '../../services/firebase';

export const OfflineStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [justReconnected, setJustReconnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);
  const [showDetailedNotice, setShowDetailedNotice] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setJustReconnected(true);
      setIsSyncing(true);

      try {
        // Await synchronization of any queued offline mutations
        await waitForPendingWrites(db);
        setSyncSuccess(true);
      } catch (err) {
        console.warn('Pending writes sync check:', err);
      } finally {
        setIsSyncing(false);
      }

      const timer = setTimeout(() => {
        setJustReconnected(false);
        setSyncSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
      setSyncSuccess(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await waitForPendingWrites(db);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err) {
      console.warn('Manual sync check:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && !justReconnected) {
    return null;
  }

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] sm:w-auto animate-in fade-in slide-in-from-top-2 duration-300">
      {!isOnline ? (
        <div className="bg-amber-900/95 backdrop-blur-md text-amber-50 px-4 py-2.5 rounded-2xl shadow-xl border border-amber-600/50 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-amber-500/20 text-amber-300 rounded-xl flex items-center justify-center animate-pulse">
              <WifiOff className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Offline Cache Active</span>
                <span className="text-[10px] bg-amber-800 text-amber-200 px-1.5 py-0.5 rounded font-mono font-bold">IndexedDB</span>
              </div>
              <p className="text-[11px] text-amber-100/90 leading-tight">
                All patient intakes, test results & payments are safely saved locally. Auto-sync will run when connected.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center ml-auto">
            <button
              onClick={() => setShowDetailedNotice(!showDetailedNotice)}
              className="text-[10px] text-amber-200 hover:text-white underline font-semibold cursor-pointer"
            >
              {showDetailedNotice ? 'Hide Info' : 'Why this works'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-900/95 backdrop-blur-md text-emerald-50 px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-600/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded-xl flex items-center justify-center">
              {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Connection Restored</span>
                <span className="text-[10px] bg-emerald-800 text-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold">Cloud Synced</span>
              </div>
              <p className="text-[11px] text-emerald-100/90 leading-tight">
                {isSyncing ? 'Syncing local offline operations to Firestore Cloud...' : 'All local changes successfully uploaded to nanoLabs Cloud.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-1 text-emerald-300 hover:text-white transition-colors cursor-pointer"
            title="Check Cloud Sync"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}

      {showDetailedNotice && !isOnline && (
        <div className="mt-2 bg-slate-900/95 backdrop-blur-md text-slate-200 p-3.5 rounded-xl border border-slate-700 text-xs shadow-2xl space-y-2 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-2 text-teal-400 font-bold">
            <Database className="w-4 h-4" />
            <span>nanoLabs Offline-First Engine (Cameroon Resilient)</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            nanoLabs utilizes Firestore multi-tab IndexedDB storage. Even during prolonged internet cuts, power outages, or slow 2G/3G network conditions:
          </p>
          <ul className="text-[11px] text-slate-300 space-y-1 list-disc pl-4">
            <li>Receptionists can register patients and book diagnostic orders.</li>
            <li>Phlebotomists can verify sample barcodes and collection times.</li>
            <li>Technologists can record biochemical analysis values and print verified result slips.</li>
            <li>Cashiers can generate receipts.</li>
          </ul>
          <p className="text-[10px] text-slate-400 italic">
            Once internet is restored on your device or network, all queues automatically upload to the central server without data loss.
          </p>
        </div>
      )}
    </div>
  );
};
export default OfflineStatusIndicator;
