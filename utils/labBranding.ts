// src/utils/labBranding.ts
// Centralized, robust manager for Laboratory Logo and Official Header / Letterhead branding.
// Guarantees rock-solid persistence across page refreshes and real-time synchronization across all screens.

import { useState, useEffect } from 'react';

const STORAGE_KEYS = {
  ACTIVE_LOGO: 'nanolabs_active_lab_logo',
  ACTIVE_HEADER: 'nanolabs_active_lab_header',
  LAB_PREFIX: 'lab_logo_',
  HEADER_PREFIX: 'lab_header_'
};

export const getActiveLabLogo = (lab?: any): string | null => {
  if (typeof window === 'undefined') return lab?.logoUrl || null;
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.ACTIVE_LOGO);
    if (cached && cached.trim().length > 0) return cached;
    if (lab?.id) {
      const byId = localStorage.getItem(`${STORAGE_KEYS.LAB_PREFIX}${lab.id}`);
      if (byId && byId.trim().length > 0) return byId;
    }
    if (lab?.logoUrl && lab.logoUrl.trim().length > 0) return lab.logoUrl;
    if (lab?.logo && lab.logo.trim().length > 0) return lab.logo;
  } catch {
    // fallback
  }
  return lab?.logoUrl || null;
};

export const setActiveLabLogo = (logoUrl: string, labId?: string): void => {
  if (typeof window === 'undefined') return;
  try {
    if (logoUrl && logoUrl.trim().length > 0) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_LOGO, logoUrl);
      if (labId) {
        localStorage.setItem(`${STORAGE_KEYS.LAB_PREFIX}${labId}`, logoUrl);
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_LOGO);
      if (labId) {
        localStorage.removeItem(`${STORAGE_KEYS.LAB_PREFIX}${labId}`);
      }
    }

    // Dispatch global event for all listeners
    window.dispatchEvent(new CustomEvent('nanolabs_logo_updated', { detail: { logoUrl, labId } }));
  } catch (err) {
    console.warn('Failed to save active lab logo:', err);
  }
};

export const getActiveLabHeader = (lab?: any): string | null => {
  if (typeof window === 'undefined') return lab?.headerImageUrl || null;
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.ACTIVE_HEADER);
    if (cached && cached.trim().length > 0) return cached;
    if (lab?.id) {
      const byId = localStorage.getItem(`${STORAGE_KEYS.HEADER_PREFIX}${lab.id}`);
      if (byId && byId.trim().length > 0) return byId;
    }
    if (lab?.headerImageUrl && lab.headerImageUrl.trim().length > 0) return lab.headerImageUrl;
  } catch {}
  return lab?.headerImageUrl || null;
};

export const setActiveLabHeader = (headerUrl: string, labId?: string): void => {
  if (typeof window === 'undefined') return;
  try {
    if (headerUrl && headerUrl.trim().length > 0) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_HEADER, headerUrl);
      if (labId) {
        localStorage.setItem(`${STORAGE_KEYS.HEADER_PREFIX}${labId}`, headerUrl);
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_HEADER);
      if (labId) {
        localStorage.removeItem(`${STORAGE_KEYS.HEADER_PREFIX}${labId}`);
      }
    }

    // Dispatch global event for all listeners
    window.dispatchEvent(new CustomEvent('nanolabs_header_updated', { detail: { headerUrl, labId } }));
  } catch (err) {
    console.warn('Failed to save active lab header:', err);
  }
};

export const useLabBranding = (lab?: any) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(() => getActiveLabLogo(lab));
  const [headerUrl, setHeaderUrl] = useState<string | null>(() => getActiveLabHeader(lab));

  useEffect(() => {
    setLogoUrl(getActiveLabLogo(lab));
    setHeaderUrl(getActiveLabHeader(lab));

    const handleLogoUpdate = (e: any) => {
      const newLogo = e.detail?.logoUrl !== undefined ? e.detail.logoUrl : getActiveLabLogo(lab);
      setLogoUrl(newLogo);
    };

    const handleHeaderUpdate = (e: any) => {
      const newHeader = e.detail?.headerUrl !== undefined ? e.detail.headerUrl : getActiveLabHeader(lab);
      setHeaderUrl(newHeader);
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.ACTIVE_LOGO) {
        setLogoUrl(e.newValue);
      } else if (e.key === STORAGE_KEYS.ACTIVE_HEADER) {
        setHeaderUrl(e.newValue);
      }
    };

    window.addEventListener('nanolabs_logo_updated', handleLogoUpdate);
    window.addEventListener('nanolabs_header_updated', handleHeaderUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('nanolabs_logo_updated', handleLogoUpdate);
      window.removeEventListener('nanolabs_header_updated', handleHeaderUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [lab?.id, lab?.logoUrl, lab?.headerImageUrl]);

  return {
    logoUrl,
    headerUrl,
    setLogo: (url: string) => setActiveLabLogo(url, lab?.id),
    setHeader: (url: string) => setActiveLabHeader(url, lab?.id)
  };
};
