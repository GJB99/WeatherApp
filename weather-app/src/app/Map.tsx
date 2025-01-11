'use client'
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Props {
  defaultCenter: [number, number];
  onLocationSelect: (location: { lat: number; lon: number }) => void;
}

function MapEvents({ onLocationSelect, setClickedPosition }: { 
  onLocationSelect: (location: { lat: number; lon: number }) => void;
  setClickedPosition: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      setClickedPosition([e.latlng.lat, e.latlng.lng])
      onLocationSelect({ lat: e.latlng.lat, lon: e.latlng.lng })
    }
  })
  return null
}

const Map = ({ defaultCenter, onLocationSelect }: Props) => {
  const [previewPosition, setPreviewPosition] = useState<[number, number] | null>(null)
  const [clickedPosition, setClickedPosition] = useState<[number, number] | null>(null)
  const [icon, setIcon] = useState<L.Icon | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIcon(
      L.icon({
        iconUrl: '/images/leaflet/marker-icon.png',
        shadowUrl: '/images/leaflet/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    )
    const timer = setTimeout(() => setIsReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  if (!icon || !isReady) return <div className="h-full w-full bg-gray-800 animate-pulse rounded-xl" />

  return (
    <div className="h-full w-full">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        whenReady={() => setIsReady(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={defaultCenter} icon={icon} />
        <MapEvents 
          onLocationSelect={onLocationSelect} 
          setClickedPosition={setClickedPosition}
        />
        {previewPosition && !clickedPosition && <Marker position={previewPosition} icon={icon} opacity={0.5} />}
        {clickedPosition && <Marker position={clickedPosition} icon={icon} />}
      </MapContainer>
    </div>
  )
}

export default Map