/**
 * Lab-Branded Report Renderer
 * Generates verified laboratory clinical diagnostic report models:
 * - Dynamic laboratory letterhead
 * - Dynamic medical biologist signatory
 * - Sample chain-of-custody timeline footer
 * - Cryptographic QR verification audit hash
 */

import { TestBatch } from '../types';
import { getLabBranding, LabBrandingConfig } from './reportBranding';

export interface RenderedReportData {
  branding: LabBrandingConfig;
  batch: TestBatch;
  qrCodeValue: string;
  verificationUrl: string;
  timeline: {
    intakeTime?: string;
    collectedTime?: string;
    receivedTime?: string;
    signedTime?: string;
  };
  signatory: {
    name: string;
    title: string;
    license: string;
    signedAt: string;
  };
}

export function buildReportModel(batch: TestBatch): RenderedReportData {
  const branding = getLabBranding(batch.labId);
  const qrAuditHash = batch.qrAuditHash || `NL-${batch.id}-${Date.now().toString(36).toUpperCase()}`;

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://nanolabs.cm';
  const verificationUrl = `${currentHost}/?verify=${qrAuditHash}&batch=${batch.id}`;

  const signatory = {
    name: batch.biologistName || branding.defaultSignatoryName,
    title: branding.defaultSignatoryTitle,
    license: batch.biologistLicense || branding.defaultSignatoryOnmcLicense,
    signedAt: batch.signedAt || new Date().toISOString()
  };

  return {
    branding,
    batch,
    qrCodeValue: verificationUrl,
    verificationUrl,
    timeline: {
      intakeTime: batch.createdAt,
      collectedTime: batch.collectedAt,
      receivedTime: batch.receivedAt,
      signedTime: batch.signedAt
    },
    signatory
  };
}
