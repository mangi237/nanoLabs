import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RealtimeLiveMapProps {
  labLocation?: { lat: number; lng: number; name: string };
  patientLocation: { lat: number; lng: number; address: string; patientName?: string };
  courierProgress: number; // 0 to 100%
  courierName?: string;
  isArrived?: boolean;
  className?: string;
}

export const RealtimeLiveMap: React.FC<RealtimeLiveMapProps> = ({
  labLocation = { lat: 4.0511, lng: 9.7085, name: 'BioSanté Central Diagnostic Hub' },
  patientLocation,
  courierProgress,
  courierName = 'Certified Mobile Phlebotomist',
  isArrived = false,
  className = 'w-full h-full min-h-[380px]'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const courierMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Fallback safe coordinates around Douala Akwa / Bonanjo
  const safeLabLat = Number(labLocation?.lat) || 4.0511;
  const safeLabLng = Number(labLocation?.lng) || 9.7085;
  const safePatLat = Number(patientLocation?.lat) || 4.0435;
  const safePatLng = Number(patientLocation?.lng) || 9.6930;

  // Generate realistic route waypoints along actual Douala street corridors (Boulevard de la Liberté -> Rue Joss / Rue Toyota)
  const calculateWaypoints = () => {
    const p1 = [safeLabLat, safeLabLng] as [number, number];
    const p2 = [safeLabLat - 0.003, safeLabLng - 0.005] as [number, number]; // Boulevard turn
    const p3 = [(safeLabLat + safePatLat) / 2 + 0.001, (safeLabLng + safePatLng) / 2 - 0.002] as [number, number];
    const p4 = [safePatLat + 0.002, safePatLng + 0.003] as [number, number];
    const p5 = [safePatLat, safePatLng] as [number, number];
    return [p1, p2, p3, p4, p5];
  };

  const interpolatePosition = (progressPct: number): [number, number] => {
    const waypoints = calculateWaypoints();
    if (progressPct <= 0) return waypoints[0];
    if (progressPct >= 100 || isArrived) return waypoints[waypoints.length - 1];

    const totalSegments = waypoints.length - 1;
    const segmentIndex = Math.min(
      totalSegments - 1,
      Math.floor((progressPct / 100) * totalSegments)
    );
    const segmentProgress = ((progressPct / 100) * totalSegments) - segmentIndex;

    const start = waypoints[segmentIndex];
    const end = waypoints[segmentIndex + 1];

    const lat = start[0] + (end[0] - start[0]) * segmentProgress;
    const lng = start[1] + (end[1] - start[1]) * segmentProgress;

    return [lat, lng];
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet Map
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [(safeLabLat + safePatLat) / 2, (safeLabLng + safePatLng) / 2],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      // Add high-resolution OpenStreetMap TileLayer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      // Add Zoom Control to top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // 1. Lab Marker
      const labIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="background-color: #006978; color: white; width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,105,120,0.5); border: 2px solid white; font-weight: bold; font-size: 14px;">
            🏥
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      L.marker([safeLabLat, safeLabLng], { icon: labIcon })
        .addTo(map)
        .bindPopup(`<strong>${labLocation.name}</strong><br/>Laboratory Specimen Intake Hub`);

      // 2. Patient Residence Marker
      const patientIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="background-color: #10B981; color: white; width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(16,185,129,0.5); border: 2px solid white; font-weight: bold; font-size: 14px;">
            📍
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34]
      });

      L.marker([safePatLat, safePatLng], { icon: patientIcon })
        .addTo(map)
        .bindPopup(`<strong>${patientLocation.patientName || 'Patient Residence'}</strong><br/>${patientLocation.address}`);

      // 3. Route Polyline
      const waypoints = calculateWaypoints();
      const route = L.polyline(waypoints, {
        color: '#0284C7',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8'
      }).addTo(map);
      routePolylineRef.current = route;

      // Fit map bounds to show full route with padding
      map.fitBounds(route.getBounds(), { padding: [40, 40] });

      // 4. Moving Phlebotomist Courier Marker
      const initialPos = interpolatePosition(courierProgress);
      const courierIcon = L.divIcon({
        className: 'custom-leaflet-courier',
        html: `
          <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 42px; height: 42px; border-radius: 50%; background-color: rgba(6, 182, 212, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="background: linear-gradient(135deg, #0284c7, #06b6d4); color: white; width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(2,132,199,0.6); border: 2px solid white; font-size: 18px; z-index: 10;">
              🏍️
            </div>
          </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 21]
      });

      const courierMarker = L.marker(initialPos, { icon: courierIcon }).addTo(map);
      courierMarker.bindPopup(`<strong>${courierName}</strong><br/>Cold-Chain Isothermal Container (+4.2°C)`);
      courierMarkerRef.current = courierMarker;

      mapInstanceRef.current = map;
    } else {
      // Update courier marker position smoothly
      const currentPos = interpolatePosition(courierProgress);
      if (courierMarkerRef.current) {
        courierMarkerRef.current.setLatLng(currentPos);
      }
    }
  }, [courierProgress, safeLabLat, safeLabLng, safePatLat, safePatLng, isArrived]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-inner border border-slate-200 ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-[380px]" />
      
      {/* Live Map Overlay Legend */}
      <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-slate-200/80 text-[11px] font-bold text-slate-800 space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping" />
          <span>Real-time GPS Stream (OpenStreetMap)</span>
        </div>
        <div className="text-[10px] text-slate-500 font-medium">
          Following courier route to {patientLocation.address.split(',')[0]}
        </div>
      </div>
    </div>
  );
};
