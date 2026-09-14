/**
 * GPS & Distance Calculation Module
 * Provides Haversine formula distance calculation and coordinates
 * for partner laboratories across Cameroon.
 */

export interface GeoCoordinates {
    latitude: number;
    longitude: number;
  }
  
  export interface PartnerLabLocation {
    id: string;
    name: string;
    city: string;
    district: string;
    address: string;
    coordinates: GeoCoordinates;
    lat?: number;
    lng?: number;
    phone: string;
    tatHours: number; // Turnaround time in hours
    tatDisplay: string;
    averageTurnaroundHours?: number;
    accredited: boolean;
    baseTestPrice: number; // Base test price for reference
    rating: number;
    sampleCollectionFee: number;
    specialties?: string[];
    accreditationNumber?: string;
    biologistePrincipal?: string;
    pricingMultiplier?: number;
    apiKey?: string;
    isActive?: boolean;
    logoUrl?: string;
  }
  
  // Reference accredited laboratories across major cities in Cameroon
  export const PARTNER_LABS_LOCATIONS: PartnerLabLocation[] = [
    {
      id: 'lab-akwa',
      name: 'Laboratoire Central Akwa',
      city: 'Douala',
      district: 'Akwa',
      address: 'Boulevard de la Liberté, face Direction Orange',
      coordinates: { latitude: 4.0511, longitude: 9.7042 },
      lat: 4.0511,
      lng: 9.7042,
      phone: '+237 699 12 34 56',
      tatHours: 2,
      tatDisplay: '2 hrs TAT',
      averageTurnaroundHours: 2,
      accredited: true,
      baseTestPrice: 4500,
      rating: 4.9,
      sampleCollectionFee: 1500,
      pricingMultiplier: 1.0,
      logoUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=128&auto=format&fit=crop&q=80'
    },
    {
      id: 'lab-bonanjo',
      name: 'Centre Diagnostic Bonanjo',
      city: 'Douala',
      district: 'Bonanjo',
      address: 'Rue de l\'Hôpital Général, près Place du Gouvernement',
      coordinates: { latitude: 4.0435, longitude: 9.6883 },
      lat: 4.0435,
      lng: 9.6883,
      phone: '+237 677 88 99 00',
      tatHours: 3,
      tatDisplay: '3 hrs TAT',
      averageTurnaroundHours: 3,
      accredited: true,
      baseTestPrice: 4000,
      rating: 4.8,
      sampleCollectionFee: 2000,
      pricingMultiplier: 0.9,
      logoUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=128&auto=format&fit=crop&q=80'
    },
    {
      id: 'lab-bastos',
      name: 'Institut de Biologie Médicale Bastos',
      city: 'Yaoundé',
      district: 'Bastos',
      address: 'Avenue Rosa Parks, face Ambassade des USA',
      coordinates: { latitude: 3.8911, longitude: 11.5122 },
      lat: 3.8911,
      lng: 11.5122,
      phone: '+237 655 44 33 22',
      tatHours: 2,
      tatDisplay: '2 hrs TAT',
      averageTurnaroundHours: 2,
      accredited: true,
      baseTestPrice: 5000,
      rating: 4.9,
      sampleCollectionFee: 2500,
      pricingMultiplier: 1.15,
      logoUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=128&auto=format&fit=crop&q=80'
    },
    {
      id: 'lab-pasteur-yde',
      name: 'Laboratoire Pasteur Référence',
      city: 'Yaoundé',
      district: 'Centre Hospitalier',
      address: 'Quartier Administratif, Yaoundé',
      coordinates: { latitude: 3.8667, longitude: 11.5167 },
      lat: 3.8667,
      lng: 11.5167,
      phone: '+237 690 11 22 33',
      tatHours: 4,
      tatDisplay: '4 hrs TAT',
      averageTurnaroundHours: 4,
      accredited: true,
      baseTestPrice: 5500,
      rating: 5.0,
      sampleCollectionFee: 2000,
      pricingMultiplier: 1.25,
      logoUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=128&auto=format&fit=crop&q=80'
    },
    {
      id: 'lab-pilem-baf',
      name: 'PILEM Diagnostic Laboratory',
      city: 'Bafoussam',
      district: 'Ndiangdam',
      address: 'Clinique Dr. NDAM, Route Principale',
      coordinates: { latitude: 5.4778, longitude: 10.4176 },
      lat: 5.4778,
      lng: 10.4176,
      phone: '+237 653 164 511',
      tatHours: 3,
      tatDisplay: '3 hrs TAT',
      averageTurnaroundHours: 3,
      accredited: true,
      baseTestPrice: 3500,
      rating: 4.8,
      sampleCollectionFee: 1500
    },
    {
      id: 'lab-buea-cl',
      name: 'Mount Fako Clinical Diagnostics',
      city: 'Buea',
      district: 'Molyko',
      address: 'Checkpoint Avenue, Molyko, Buea',
      coordinates: { latitude: 4.1560, longitude: 9.2415 },
      lat: 4.1560,
      lng: 9.2415,
      phone: '+237 671 22 33 44',
      tatHours: 3,
      tatDisplay: '3 hrs TAT',
      averageTurnaroundHours: 3,
      accredited: true,
      baseTestPrice: 4000,
      rating: 4.7,
      sampleCollectionFee: 1500
    }
  ];
  
  // Default city center coordinates for graceful manual fallback
  export const CITY_COORDINATES: Record<string, GeoCoordinates> = {
    'Douala': { latitude: 4.0511, longitude: 9.7042 },
    'Yaoundé': { latitude: 3.8667, longitude: 11.5167 },
    'Bafoussam': { latitude: 5.4778, longitude: 10.4176 },
    'Buea': { latitude: 4.1560, longitude: 9.2415 },
    'Limbe': { latitude: 4.0167, longitude: 9.2167 },
    'Garoua': { latitude: 9.3014, longitude: 13.3977 }
  };
  
  /**
   * Calculates great-circle distance between two GPS coordinates using Haversine formula.
   * Supports both GeoCoordinates objects and numeric coordinates (lat1, lon1, lat2, lon2).
   * Returns distance in kilometers (km).
   */
  export function calculateDistanceKm(
    pointA: GeoCoordinates | any,
    pointB?: GeoCoordinates | any,
    lat2?: number,
    lng2?: number
  ): number {
    let latA: number = 0;
    let lngA: number = 0;
    let latB: number = 0;
    let lngB: number = 0;
  
    if (typeof pointA === 'number' && typeof pointB === 'number' && typeof lat2 === 'number' && typeof lng2 === 'number') {
      latA = pointA;
      lngA = pointB;
      latB = lat2;
      lngB = lng2;
    } else if (pointA && pointB) {
      latA = typeof pointA.latitude === 'number' ? pointA.latitude : (pointA.lat ?? 0);
      lngA = typeof pointA.longitude === 'number' ? pointA.longitude : (pointA.lng ?? 0);
      latB = typeof pointB.latitude === 'number' ? pointB.latitude : (pointB.lat ?? 0);
      lngB = typeof pointB.longitude === 'number' ? pointB.longitude : (pointB.lng ?? 0);
    }
  
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((latB - latA) * Math.PI) / 180;
    const dLng = ((lngB - lngA) * Math.PI) / 180;
  
    const a1 = (latA * Math.PI) / 180;
    const a2 = (latB * Math.PI) / 180;
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(a1) * Math.cos(a2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal place
  }
  
  /**
   * Sorts partner laboratories by distance relative to a user's coordinates.
   */
  export function getLabsSortedByDistance(
    userCoords: GeoCoordinates,
    cityFilter?: string
  ): (PartnerLabLocation & { distanceKm: number })[] {
    const list = cityFilter && cityFilter !== 'All Cities'
      ? PARTNER_LABS_LOCATIONS.filter((l) => l.city.toLowerCase() === cityFilter.toLowerCase())
      : PARTNER_LABS_LOCATIONS;
  
    return list
      .map((lab) => ({
        ...lab,
        distanceKm: calculateDistanceKm(userCoords, lab.coordinates)
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }
  
  export const PARTNER_LABS = PARTNER_LABS_LOCATIONS;
  
  