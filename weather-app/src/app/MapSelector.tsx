'use client'
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

interface MapSelectorProps {
  onLocationSelect: (location: { lat: number; lon: number }) => void;
  onClose: () => void;
  defaultCenter?: [number, number];
}

function MapEvents({ onLocationSelect, onClose }: { 
  onLocationSelect: (location: { lat: number; lon: number }) => void;
  onClose: () => void;
}) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect({ lat, lon: lng });
      onClose();
    },
  });
  return null;
}

export default function MapSelector({ onLocationSelect, onClose, defaultCenter = [52.3676, 4.9041] }: MapSelectorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative h-[80vh] w-[90vw] rounded-lg bg-white p-4 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
        <MapContainer
          center={defaultCenter}
          zoom={13}
          className="h-full w-full rounded-lg"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapEvents onLocationSelect={onLocationSelect} onClose={onClose} />
        </MapContainer>
      </div>
    </div>
  );
}