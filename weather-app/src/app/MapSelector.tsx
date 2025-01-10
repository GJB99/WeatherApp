'use client'
import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icons in Next.js
const icon = L.icon({
  iconUrl: '/images/leaflet/marker-icon.png',
  shadowUrl: '/images/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface Props {
  onLocationSelect: (location: { lat: number; lon: number }) => void;
  isOpen: boolean;
  onClose: () => void;
  defaultCenter?: [number, number];
}

function MapEvents({ onLocationSelect, setPreviewPosition }: { 
  onLocationSelect: (location: { lat: number; lon: number }) => void;
  setPreviewPosition: (pos: [number, number] | null) => void;
}) {
  const map = useMapEvents({
    click(e) {
      onLocationSelect({ lat: e.latlng.lat, lon: e.latlng.lng })
    },
    mousemove(e) {
      setPreviewPosition([e.latlng.lat, e.latlng.lng])
    },
    mouseout() {
      setPreviewPosition(null)
    }
  })
  return null
}

export default function MapSelector({ onLocationSelect, isOpen, onClose, defaultCenter = [51.505, -0.09] }: Props) {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null)
  const [previewPosition, setPreviewPosition] = useState<[number, number] | null>(null)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Select Location</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            ✕
          </button>
        </div>
        <div className="h-[400px] rounded-xl overflow-hidden">
          <MapContainer
            center={defaultCenter}
            zoom={15}
            className="h-full w-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapEvents
              onLocationSelect={(loc) => {
                setSelectedPosition([loc.lat, loc.lon])
                onLocationSelect(loc)
              }}
              setPreviewPosition={setPreviewPosition}
            />
            {previewPosition && !selectedPosition && (
              <Marker 
                position={previewPosition} 
                icon={icon} 
                opacity={0.5} 
              />
            )}
            {selectedPosition && (
              <Marker position={selectedPosition} icon={icon} />
            )}
          </MapContainer>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}