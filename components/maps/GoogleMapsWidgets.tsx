import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Search, Truck, Building2, Home, Crosshair, Loader2 } from 'lucide-react';

const GMP_ATTRIBUTION_IDS = ['gmp_mcp_codeassist_v1_aistudio'];
const DEFAULT_DOUALA_CENTER = { lat: 4.0511, lng: 9.7679 };

export function toSafeLatLng(
  coords: any,
  fallback: { lat: number; lng: number } = DEFAULT_DOUALA_CENTER
): { lat: number; lng: number } {
  const lat = Number(coords?.lat);
  const lng = Number(coords?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    return { lat, lng };
  }
  return fallback;
}

class MapSafeBoundary extends React.Component<
  { fallback?: React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.warn('Google Map widget fallback engaged:', err);
  }
  render() {
    if (this.state.failed) {
      return (
        this.props.fallback || (
          <div className="w-full h-full min-h-[180px] flex flex-col items-center justify-center p-4 text-center bg-slate-100 text-slate-600 text-xs rounded-2xl border border-slate-200">
            <MapPin className="w-5 h-5 text-teal-700 mb-1.5" />
            <span className="font-semibold text-slate-800">Interactive Map Ready</span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              Select a laboratory card or use live GPS coordinates below.
            </span>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

function checkAndReportQuotaError(err: unknown) {
  const msg = String((err as any)?.message || err || '');
  const code = String((err as any)?.code || (err as any)?.status || '');
  if (
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('OverQuotaMapError') ||
    msg.includes('QuotaExceededError') ||
    msg.includes('429') ||
    code === '429' ||
    code === 'RESOURCE_EXHAUSTED'
  ) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
}

export function calculateHaversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const safeA = toSafeLatLng(a);
  const safeB = toSafeLatLng(b);
  const R = 6371;
  const dLat = ((safeB.lat - safeA.lat) * Math.PI) / 180;
  const dLng = ((safeB.lng - safeA.lng) * Math.PI) / 180;
  const lat1 = (safeA.lat * Math.PI) / 180;
  const lat2 = (safeB.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return Number((2 * R * Math.asin(Math.min(1, Math.sqrt(h)))).toFixed(2));
}

// ---------------------------------------------------------------------------
// 1. LabComparisonMap: Real-time Google Map comparing partner labs & patient GPS
// ---------------------------------------------------------------------------
export interface LabMapMarkerItem {
  id: string;
  name: string;
  address: string;
  coords: { lat: number; lng: number };
  tariffXaf?: number;
  tat?: string;
  phone?: string;
}

interface LabComparisonMapProps {
  labs: LabMapMarkerItem[];
  userCoords?: { lat: number; lng: number } | null;
  selectedLabId?: string;
  onSelectLab?: (labId: string) => void;
}

export const LabComparisonMap: React.FC<LabComparisonMapProps> = ({
  labs,
  userCoords,
  selectedLabId,
  onSelectLab,
}) => {
  const safeUserCoords = userCoords ? toSafeLatLng(userCoords) : null;
  const center = safeUserCoords || toSafeLatLng(labs[0]?.coords, DEFAULT_DOUALA_CENTER);

  return (
    <div className="w-full h-[260px] rounded-3xl overflow-hidden border border-slate-200 shadow-xs relative bg-slate-100">
      <MapSafeBoundary>
        <Map
          defaultCenter={center}
          defaultZoom={13}
          mapId="DEMO_MAP_ID"
          gestureHandling="greedy"
          disableDefaultUI={false}
          internalUsageAttributionIds={GMP_ATTRIBUTION_IDS}
          className="w-full h-full"
        >
          {safeUserCoords && (
            <AdvancedMarker position={safeUserCoords} title="Your Current Location">
              <div className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black shadow-lg border-2 border-white flex items-center gap-1">
                <Crosshair className="w-3 h-3" />
                <span>You</span>
              </div>
            </AdvancedMarker>
          )}

          {labs.map((lab, idx) => {
            const isSelected = lab.id === selectedLabId;
            const safePos = toSafeLatLng(lab.coords, {
              lat: 4.0511 + idx * 0.01,
              lng: 9.7042 + idx * 0.01,
            });
            return (
              <AdvancedMarker
                key={lab.id || `lab-pin-${idx}`}
                position={safePos}
                title={String(lab.name || 'Laboratory')}
                onClick={() => onSelectLab?.(lab.id)}
              >
                <div
                  className={`px-2.5 py-1 rounded-2xl text-[10px] font-extrabold shadow-md border transition-transform cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[#006978] text-white border-white scale-110'
                      : 'bg-white text-slate-900 border-teal-500 hover:scale-105'
                  }`}
                >
                  <Building2 className={`w-3 h-3 ${isSelected ? 'text-cyan-200' : 'text-[#006978]'}`} />
                  <span className="max-w-[120px] truncate">{lab.name || 'Laboratory'}</span>
                  {lab.tariffXaf ? (
                    <span className={`font-mono ${isSelected ? 'text-amber-200' : 'text-teal-700'}`}>
                      {(lab.tariffXaf / 1000).toFixed(1)}k
                    </span>
                  ) : null}
                </div>
              </AdvancedMarker>
            );
          })}
        </Map>
      </MapSafeBoundary>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. HomePickupLocationPicker: Places API (New) Autocomplete + Draggable Pin + Live GPS
// ---------------------------------------------------------------------------
interface HomePickupLocationPickerProps {
  labCoords?: { lat: number; lng: number };
  labName?: string;
  initialCoords?: { lat: number; lng: number };
  initialAddress?: string;
  onLocationChange: (data: {
    coords: { lat: number; lng: number };
    address: string;
    distanceKm: number;
  }) => void;
}

export const HomePickupLocationPicker: React.FC<HomePickupLocationPickerProps> = ({
  labCoords = DEFAULT_DOUALA_CENTER,
  labName = 'Selected Laboratory',
  initialCoords,
  initialAddress = '',
  onLocationChange,
}) => {
  const placesLib = useMapsLibrary('places');
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>(
    initialCoords || { lat: 4.0565, lng: 9.7582 }
  );
  const [searchInput, setSearchInput] = useState<string>(initialAddress);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string>('');
  const sessionTokenRef = useRef<any>(null);

  const emitLocation = useCallback(
    (coords: { lat: number; lng: number }, addressLabel: string) => {
      const dist = calculateHaversineKm(labCoords, coords);
      onLocationChange({
        coords,
        address: addressLabel || `GPS (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`,
        distanceKm: dist,
      });
    },
    [labCoords, onLocationChange]
  );

  // Initialize session token when Places library loads (Places API New)
  useEffect(() => {
    if (placesLib && (placesLib as any).AutocompleteSessionToken && !sessionTokenRef.current) {
      sessionTokenRef.current = new (placesLib as any).AutocompleteSessionToken();
    }
  }, [placesLib]);

  // Programmatic Places API (New) AutocompleteSuggestion
  const handleInputChange = async (value: string) => {
    setSearchInput(value);
    if (!value.trim() || value.trim().length < 3 || !placesLib) {
      setSuggestions([]);
      return;
    }
    try {
      const AutocompleteSuggestion = (placesLib as any).AutocompleteSuggestion;
      if (!AutocompleteSuggestion?.fetchAutocompleteSuggestions) return;

      if (!sessionTokenRef.current && (placesLib as any).AutocompleteSessionToken) {
        sessionTokenRef.current = new (placesLib as any).AutocompleteSessionToken();
      }

      const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: value,
        sessionToken: sessionTokenRef.current,
        region: 'cm',
      });
      setSuggestions(response?.suggestions || []);
    } catch (err) {
      checkAndReportQuotaError(err);
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = async (suggestion: any) => {
    try {
      const placePrediction = suggestion?.placePrediction;
      if (!placePrediction) return;
      const place = placePrediction.toPlace();
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location'],
      });
      // Reset session token after place selection per Places API (New) billing best practice
      if (placesLib && (placesLib as any).AutocompleteSessionToken) {
        sessionTokenRef.current = new (placesLib as any).AutocompleteSessionToken();
      }

      const loc = place.location;
      const lat = typeof loc?.lat === 'function' ? loc.lat() : loc?.lat;
      const lng = typeof loc?.lng === 'function' ? loc.lng() : loc?.lng;
      const formatted =
        place.formattedAddress ||
        place.displayName ||
        placePrediction?.text?.text ||
        searchInput;

      setSuggestions([]);
      setSearchInput(formatted);
      if (typeof lat === 'number' && typeof lng === 'number') {
        const nextCoords = { lat, lng };
        setSelectedCoords(nextCoords);
        emitLocation(nextCoords, formatted);
      }
    } catch (err) {
      checkAndReportQuotaError(err);
    }
  };

  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation is not supported on this device. Tap the map or search your address above.');
      return;
    }
    setIsLocatingGps(true);
    setGpsStatus('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const label = `Live GPS Location (${next.lat.toFixed(5)}, ${next.lng.toFixed(5)})`;
        setSelectedCoords(next);
        setSearchInput(label);
        setIsLocatingGps(false);
        setGpsStatus('Exact live GPS coordinates locked.');
        emitLocation(next, label);
      },
      () => {
        setIsLocatingGps(false);
        setGpsStatus('Location permission blocked in browser preview — tap anywhere on the map or search an address.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="space-y-3">
      {/* Search + Live GPS Controls */}
      <div className="relative">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Search street, neighborhood, or landmark on Google Maps..."
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#006978]"
            />
          </div>
          <button
            type="button"
            onClick={handleUseCurrentGps}
            disabled={isLocatingGps}
            className="px-3.5 py-2.5 bg-[#006978] hover:bg-[#005a66] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors"
          >
            {isLocatingGps ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
            <span>Use My Live GPS</span>
          </button>
        </div>

        {/* Places API (New) Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-12 z-30 bg-white rounded-2xl border border-slate-200 shadow-xl divide-y divide-slate-100 max-h-52 overflow-y-auto">
            {suggestions.map((sug, idx) => {
              const label = sug?.placePrediction?.text?.text || 'Suggested Location';
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(sug)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-teal-50 text-xs text-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#006978] shrink-0" />
                  <span className="truncate font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {gpsStatus && (
        <p className="text-[11px] font-semibold text-[#006978] px-1">{gpsStatus}</p>
      )}

      {/* Interactive Google Map (Click to drop pin) */}
      <div className="w-full h-[250px] rounded-2xl overflow-hidden border border-slate-200 shadow-xs relative bg-slate-100">
        <MapSafeBoundary>
          <Map
            center={toSafeLatLng(selectedCoords)}
            defaultZoom={14}
            mapId="DEMO_MAP_ID"
            gestureHandling="greedy"
            internalUsageAttributionIds={GMP_ATTRIBUTION_IDS}
            onClick={(ev) => {
              const ll = ev.detail?.latLng;
              if (ll) {
                const next = toSafeLatLng({ lat: ll.lat, lng: ll.lng });
                const label =
                  searchInput && !searchInput.startsWith('Pinned') && !searchInput.startsWith('Live GPS')
                    ? searchInput
                    : `Pinned Home Pickup (${next.lat.toFixed(5)}, ${next.lng.toFixed(5)})`;
                setSelectedCoords(next);
                setSearchInput(label);
                emitLocation(next, label);
              }
            }}
            className="w-full h-full"
          >
            {/* Selected Lab Marker */}
            <AdvancedMarker position={toSafeLatLng(labCoords)} title={labName}>
              <Pin background="#0F766E" glyphColor="#FFFFFF" borderColor="#FFFFFF" />
            </AdvancedMarker>

            {/* Patient Home Pickup Marker */}
            <AdvancedMarker position={toSafeLatLng(selectedCoords)} title="Home Sample Pickup Point">
              <div className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black shadow-lg border-2 border-white flex items-center gap-1">
                <Home className="w-3 h-3" />
                <span>Pickup Here</span>
              </div>
            </AdvancedMarker>
          </Map>
        </MapSafeBoundary>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
        <span>Tap anywhere on the map to fine-tune your exact gate or building entrance.</span>
        <span className="font-mono font-bold text-[#006978]">
          {calculateHaversineKm(labCoords, selectedCoords)} km from lab
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. LiveCourierTrackingMap: Modern Routes API (Route.computeRoutes) + Live Courier GPS
// ---------------------------------------------------------------------------
interface RoutePolylineRendererProps {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  onRouteComputed?: (info: { distanceMeters?: number; durationSeconds?: number }) => void;
}

const RoutePolylineRenderer: React.FC<RoutePolylineRendererProps> = ({
  origin,
  destination,
  onRouteComputed,
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!map || !routesLib) return;
    let cancelled = false;

    const drawRoute = async () => {
      try {
        const RouteClass = (routesLib as any).Route;
        if (!RouteClass?.computeRoutes) return;

        const { routes } = await RouteClass.computeRoutes({
          origin,
          destination,
          travelMode: 'DRIVING',
          fields: ['path', 'distanceMeters', 'durationMillis'],
        });

        if (cancelled || !routes?.[0]) return;

        // Clean previous polylines
        polylinesRef.current.forEach((p) => p.setMap(null));
        polylinesRef.current = [];

        if (typeof routes[0].createPolylines === 'function') {
          const lines = routes[0].createPolylines({
            polylineOptions: {
              strokeColor: '#006978',
              strokeOpacity: 0.85,
              strokeWeight: 5,
            },
          });
          lines.forEach((line: any) => line.setMap(map));
          polylinesRef.current = lines;
        }

        onRouteComputed?.({
          distanceMeters: routes[0].distanceMeters,
          durationSeconds: routes[0].durationMillis ? Math.round(routes[0].durationMillis / 1000) : undefined,
        });
      } catch (err) {
        checkAndReportQuotaError(err);
      }
    };

    drawRoute();

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, routesLib, origin.lat, origin.lng, destination.lat, destination.lng]);

  return null;
};

interface LiveCourierTrackingMapProps {
  labCoords: { lat: number; lng: number };
  patientCoords: { lat: number; lng: number };
  phlebotomistCoords?: { lat: number; lng: number } | null;
  labName: string;
  phlebotomistName?: string;
  trackingActive?: boolean;
}

export const LiveCourierTrackingMap: React.FC<LiveCourierTrackingMapProps> = ({
  labCoords,
  patientCoords,
  phlebotomistCoords,
  labName,
  phlebotomistName = 'Mobile Phlebotomist',
  trackingActive = true,
}) => {
  const safeLabCoords = toSafeLatLng(labCoords);
  const safePatientCoords = toSafeLatLng(patientCoords, { lat: 4.0565, lng: 9.7582 });
  const activeCourierPos = phlebotomistCoords ? toSafeLatLng(phlebotomistCoords, safeLabCoords) : safeLabCoords;

  return (
    <div className="w-full h-[300px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative bg-slate-100">
      <MapSafeBoundary>
        <Map
          defaultCenter={activeCourierPos}
          defaultZoom={14}
          mapId="DEMO_MAP_ID"
          gestureHandling="greedy"
          internalUsageAttributionIds={GMP_ATTRIBUTION_IDS}
          className="w-full h-full"
        >
          {trackingActive && (
            <RoutePolylineRenderer origin={activeCourierPos} destination={safePatientCoords} />
          )}

          {/* Laboratory Origin Pin */}
          <AdvancedMarker position={safeLabCoords} title={labName}>
            <div className="px-2.5 py-1 rounded-xl bg-slate-900 text-white text-[10px] font-bold shadow-md border border-white flex items-center gap-1">
              <Building2 className="w-3 h-3 text-teal-400" />
              <span className="max-w-[110px] truncate">{labName}</span>
            </div>
          </AdvancedMarker>

          {/* Patient Home Destination Pin */}
          <AdvancedMarker position={safePatientCoords} title="Patient Home Collection Address">
            <div className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[10px] font-bold shadow-md border-2 border-white flex items-center gap-1">
              <Home className="w-3 h-3" />
              <span>Patient Home</span>
            </div>
          </AdvancedMarker>

          {/* Live Moving Mobile Phlebotomist Marker */}
          {trackingActive && (
            <AdvancedMarker position={activeCourierPos} title={phlebotomistName}>
              <div className="px-3 py-1.5 rounded-full bg-[#006978] text-white text-[10px] font-black shadow-xl border-2 border-cyan-200 flex items-center gap-1.5 animate-bounce">
                <Truck className="w-3.5 h-3.5 text-amber-300" />
                <span>{String(phlebotomistName || 'Courier').split(' ')[0]} • LIVE</span>
              </div>
            </AdvancedMarker>
          )}
        </Map>
      </MapSafeBoundary>
    </div>
  );
};
