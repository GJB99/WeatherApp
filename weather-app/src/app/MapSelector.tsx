'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { Icon } from 'leaflet'

interface Props {
  onLocationSelect: (location: { lat: number; lon: number }) => void;
  isOpen: boolean;
  onClose: () => void;
  defaultCenter?: [number, number];
}

// Dynamically import the Map component with no SSR
const Map = dynamic(
  () => import('./Map'), 
  { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-800 animate-pulse rounded-xl" />
  }
)

export default function MapSelector({ onLocationSelect, isOpen, onClose, defaultCenter = [51.505, -0.09] }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-6 bg-white/20 backdrop-blur-lg rounded-3xl overflow-hidden">
        <Map 
          defaultCenter={defaultCenter}
          onLocationSelect={onLocationSelect}
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}