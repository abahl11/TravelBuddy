import React, { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMaps } from '../contexts/MapsContext';
import Icon from './Icon';

/**
 * Converts the API's GeoJSON Point ([lng, lat]) into Leaflet's [lat, lng].
 * The order differs between the two, which is a classic source of maps that
 * silently render in the wrong hemisphere.
 */
const toLatLng = (point) => {
  const coordinates = point?.coordinates;

  if (!Array.isArray(coordinates) || coordinates.length !== 2) return null;

  const [lng, lat] = coordinates;

  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
};

/**
 * Leaflet's default marker icon resolves its PNGs by relative URL, which
 * breaks under a bundler. A divIcon avoids the problem entirely and lets the
 * pins match the rest of the design.
 */
const pinIcon = (label, color) =>
  L.divIcon({
    className: '',
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:28px;height:28px;border-radius:9999px;
      background:${color};color:#fff;
      font:600 12px/1 Inter,system-ui,sans-serif;
      box-shadow:0 2px 8px rgba(16,24,40,.35);
      border:2px solid #fff;">${label}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const ORIGIN_ICON = pinIcon('A', '#1f41f5');
const DESTINATION_ICON = pinIcon('B', '#f06407');

/** Frames both endpoints once the map instance exists. */
const FitBounds = ({ bounds }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 11 });
    }
  }, [map, bounds]);

  return null;
};

const Fallback = ({ message }) => (
  <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-200 bg-ink-50 text-center">
    <Icon name="mapPin" className="h-6 w-6 text-ink-400" />
    <p className="px-6 text-sm text-ink-500">{message}</p>
  </div>
);

const JourneyMap = ({ journey }) => {
  const { canShowMap, tileUrl, loaded } = useMaps();

  const origin = useMemo(() => toLatLng(journey?.originCoords), [journey]);
  const destination = useMemo(() => toLatLng(journey?.destinationCoords), [journey]);

  const path = useMemo(() => {
    const routeCoordinates = journey?.route?.coordinates;

    if (Array.isArray(routeCoordinates) && routeCoordinates.length >= 2) {
      return routeCoordinates
        .filter((pair) => Array.isArray(pair) && pair.length === 2)
        .map(([lng, lat]) => [lat, lng]);
    }

    return origin && destination ? [origin, destination] : [];
  }, [journey, origin, destination]);

  const bounds = useMemo(
    () => (origin && destination ? L.latLngBounds([origin, destination]) : null),
    [origin, destination]
  );

  if (!origin || !destination) {
    return <Fallback message="This journey was created without map coordinates." />;
  }

  // Config has not arrived yet — show a placeholder rather than a broken map.
  if (!loaded) {
    return <div className="skeleton h-[380px] w-full rounded-2xl" />;
  }

  if (!canShowMap) {
    return <Fallback message="Map preview is unavailable — no map tile key is configured." />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 shadow-card">
      <MapContainer
        center={origin}
        zoom={6}
        bounds={bounds}
        scrollWheelZoom={false}
        style={{ height: '380px', width: '100%' }}
      >
        <TileLayer
          url={tileUrl}
          // MapTiler's terms require visible attribution for both them and OSM.
          attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          tileSize={512}
          zoomOffset={-1}
          minZoom={2}
        />

        <FitBounds bounds={bounds} />

        <Marker position={origin} icon={ORIGIN_ICON}>
          <Popup>{journey.origin}</Popup>
        </Marker>

        <Marker position={destination} icon={DESTINATION_ICON}>
          <Popup>{journey.destination}</Popup>
        </Marker>

        {path.length >= 2 && (
          <Polyline positions={path} pathOptions={{ color: '#1f41f5', weight: 4, opacity: 0.85 }} />
        )}
      </MapContainer>
    </div>
  );
};

export default JourneyMap;
