import { apiJson, idempotentRequest, reportApiError } from './apiClient';
export interface BookingSelection { labId: string; testIds: string[]; homeCollection: boolean; pickupLocation?: string; insuranceProvider?: string; insurancePolicyNumber?: string; dependentProfileId?: string; }
export const bookingApi = {
  async list(labId?: string): Promise<any[]> { return (await apiJson(`/api/bookings${labId ? `?labId=${encodeURIComponent(labId)}` : ''}`)).bookings; },
  async quote(selection: BookingSelection) { return (await apiJson('/api/bookings/quote', selection)).quote; },
  async create(selection: BookingSelection, quoteFingerprint: string) { return (await idempotentRequest('/api/bookings', { ...selection, quoteFingerprint })).booking; },
  async act(booking: any, action: any) { return (await idempotentRequest(`/api/labs/${encodeURIComponent(booking.labId)}/bookings/${encodeURIComponent(booking.id)}/actions`, action)).booking; },
  async share(booking: any) { return apiJson(`/api/labs/${encodeURIComponent(booking.labId)}/bookings/${encodeURIComponent(booking.id)}/shares`, {}); },
  subscribe(labId: string | undefined, update: (bookings: any[]) => void, error = reportApiError) {
    let active = true; let pending = false;
    const refresh = async () => { if (pending) return; pending = true; try { const rows = await this.list(labId); if (active) update(rows); } catch (err) { if (active) error(err); } finally { pending = false; } };
    void refresh(); const interval = window.setInterval(refresh, 10000);
    window.addEventListener('nanolabs_booking_updated', refresh);
    return () => { active = false; clearInterval(interval); window.removeEventListener('nanolabs_booking_updated', refresh); };
  }
};
