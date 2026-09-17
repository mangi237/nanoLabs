/**
 * Live Phlebotomist Transit Tracker & GPS Handler
 * Tracks sample collection transit, cold chain temperature (+4°C),
 * live ETA countdown, and handles disconnect states ("last seen X min ago").
 */

import { TransitSession } from '../types';

const TRANSIT_STORAGE_KEY = 'nanolabs_active_transit_sessions';

export function getActiveTransitSessions(): TransitSession[] {
  try {
    const raw = localStorage.getItem(TRANSIT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveTransitSessions(sessions: TransitSession[]): void {
  try {
    localStorage.setItem(TRANSIT_STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save transit sessions', e);
  }
}

export function getTransitSessionForBatch(batchId: string): TransitSession | undefined {
  const sessions = getActiveTransitSessions();
  return sessions.find((s) => s.batchId === batchId && s.isActive);
}

/**
 * Phlebotomist starts transit trip to patient location.
 */
export function startTransitTrip(params: {
  batchId: string;
  phlebotomistId: string;
  phlebotomistName: string;
  phlebotomistPhone: string;
  patientAddress: string;
  patientLat: number;
  patientLng: number;
  startLat: number;
  startLng: number;
}): TransitSession {
  const now = new Date().toISOString();
  const session: TransitSession = {
    id: `transit_${params.batchId}`,
    batchId: params.batchId,
    phlebotomistId: params.phlebotomistId,
    phlebotomistName: params.phlebotomistName,
    phlebotomistPhone: params.phlebotomistPhone,
    patientAddress: params.patientAddress,
    patientLat: params.patientLat,
    patientLng: params.patientLng,
    currentLat: params.startLat,
    currentLng: params.startLng,
    etaMinutes: 20,
    coldChainTemperatureCelsius: 4.2,
    isActive: true,
    lastPingAt: now,
    startedAt: now
  };

  const sessions = getActiveTransitSessions().filter((s) => s.batchId !== params.batchId);
  sessions.unshift(session);
  saveTransitSessions(sessions);
  return session;
}

/**
 * Phlebotomist ping updates current coordinates, cold-chain temp, and remaining ETA.
 */
export function recordTransitPing(
  batchId: string,
  lat: number,
  lng: number,
  options?: {
    coldChainTemp?: number;
    etaMinutes?: number;
  }
): TransitSession | undefined {
  const sessions = getActiveTransitSessions();
  const index = sessions.findIndex((s) => s.batchId === batchId && s.isActive);
  if (index < 0) return undefined;

  const session = sessions[index];
  session.currentLat = lat;
  session.currentLng = lng;
  session.lastPingAt = new Date().toISOString();
  if (options?.coldChainTemp !== undefined) {
    session.coldChainTemperatureCelsius = options.coldChainTemp;
  }
  if (options?.etaMinutes !== undefined) {
    session.etaMinutes = Math.max(1, options.etaMinutes);
  }

  sessions[index] = session;
  saveTransitSessions(sessions);
  return session;
}

/**
 * Completes a transit trip (sample collected and safely delivered to lab intake).
 */
export function completeTransitTrip(batchId: string): void {
  const sessions = getActiveTransitSessions();
  const index = sessions.findIndex((s) => s.batchId === batchId && s.isActive);
  if (index >= 0) {
    sessions[index].isActive = false;
    sessions[index].completedAt = new Date().toISOString();
    saveTransitSessions(sessions);
  }
}

/**
 * Formats "Last seen X minutes ago" for connection status
 */
export function getLastSeenDescription(lastPingAt: string): string {
  const diffMs = Date.now() - new Date(lastPingAt).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes <= 0) return 'Just now (Live GPS)';
  if (diffMinutes === 1) return '1 minute ago';
  return `${diffMinutes} minutes ago`;
}
