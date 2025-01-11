'use client'
import { useState } from 'react'
import { MapContainer, TileLayer, useMapEvents, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapSelectorProps {
  onLocationSelect: (location: { lat: number; lon: number }) => Promise<void>;
  onClose: () => void;
  defaultCenter?: [number, number];
}

function MapEvents({ onLocationSelect, setSelectedPosition, setIsLoading }: { 
  onLocationSelect: (location: { lat: number; lon: number }) => Promise<void>;
  setSelectedPosition: (pos: [number, number]) => void;
  setIsLoading: (loading: boolean) => void;
}) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setSelectedPosition([lat, lng]);
      setIsLoading(true);
      try {
        await onLocationSelect({ lat, lon: lng });
      } finally {
        setIsLoading(false);
      }
    },
  });
  return null;
}

export default function MapSelector({ onLocationSelect, onClose, defaultCenter = [52.3676, 4.9041] }: MapSelectorProps) {
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>(defaultCenter);
  const [isLoading, setIsLoading] = useState(false);
  const [icon] = useState(() => 
    L.icon({
      iconUrl: '/images/leaflet/marker-icon.png',
      shadowUrl: '/images/leaflet/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative h-[80vh] w-[90vw] rounded-lg bg-white p-4 shadow-lg">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 disabled:opacity-50"
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
          <MapEvents 
            onLocationSelect={onLocationSelect} 
            setSelectedPosition={setSelectedPosition}
            setIsLoading={setIsLoading}
          />
          <Marker position={selectedPosition} icon={icon} />
        </MapContainer>
      </div>
    </div>
  );
}