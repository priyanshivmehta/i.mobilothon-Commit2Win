'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

interface Driver {
  id: string;
  name: string;
  lat: number;
  lng: number;
  attentionScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  vehicleId: string;
  route: string;
  speed: number;
  lastAlert: string;
}

interface FleetMapProps {
  drivers: Driver[];
  onDriverSelect: (driver: Driver) => void;
}

// CSS animation styles (added globally at runtime)
const addMarkerAnimationStyles = () => {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes pulseGlow {
      0% { box-shadow: 0 0 8px rgba(255, 0, 0, 0.5); transform: scale(1); }
      50% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.9); transform: scale(1.08); }
      100% { box-shadow: 0 0 8px rgba(255, 0, 0, 0.5); transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
};

// Create colored, animated circular icons
const getDriverIcon = (driver: Driver) => {
  const color =
    driver.riskLevel === 'high'
      ? '#ef4444' // red
      : driver.riskLevel === 'medium'
      ? '#facc15' // yellow
      : '#22c55e'; // green

  const glow = color + '55'; // translucent glow
  const isHighRisk = driver.riskLevel === 'high';

  const html = `
    <div
      style="
        position: relative;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid white;
        box-shadow: 0 0 10px ${glow};
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.25s ease;
        ${isHighRisk ? 'animation: pulseGlow 2s infinite;' : ''}
      "
    >
      <div
        style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
        "
      ></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -40],
  });
};

const FleetMap: React.FC<FleetMapProps> = ({ drivers, onDriverSelect }) => {
  useEffect(() => {
    // Fix default Leaflet icon warnings
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    addMarkerAnimationStyles(); // inject animation CSS dynamically
  }, []);

  return (
    <div className="rounded-xl overflow-hidden shadow-lg border border-white/10 backdrop-blur-sm">
      <MapContainer
        center={[21.1702, 72.8311]} // Surat
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '500px', width: '100%' }}
        className="rounded-xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {drivers.map((driver) => (
          <Marker
            key={driver.id}
            position={[driver.lat, driver.lng]}
            icon={getDriverIcon(driver)}
            eventHandlers={{
              click: () => onDriverSelect(driver),
            }}
          >
            <Popup>
              <div className="text-sm font-medium">
                <div className="font-semibold text-gray-800">
                  {driver.name}
                </div>
                <div className="text-gray-600 text-xs">
                  {driver.vehicleId} — {driver.route}
                </div>
                <div className="text-xs mt-1">
                  <span
                    className={`font-semibold ${
                      driver.riskLevel === 'high'
                        ? 'text-red-500'
                        : driver.riskLevel === 'medium'
                        ? 'text-yellow-500'
                        : 'text-green-500'
                    }`}
                  >
                    {driver.riskLevel.toUpperCase()}
                  </span>{' '}
                  risk
                </div>
                <div className="text-xs text-gray-500">
                  Speed: {driver.speed} km/h
                </div>
                <div className="text-xs text-gray-500">
                  Score: {driver.attentionScore}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Last alert: {driver.lastAlert}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default FleetMap;
