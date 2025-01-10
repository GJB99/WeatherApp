'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import ErrorBoundary from './ErrorBoundary'

interface Props {
  onLocationSelect: (location: { lat: number; lon: number }) => void;
  isOpen: boolean;
  onClose: () => void;
  defaultCenter?: [number, number];
}

const MapWithNoSSR = dynamic(
  () => import('./MapComponent'),
  {
    loading: () => <div className="h-[400px] bg-white/10 rounded-xl animate-pulse"></div>,
    ssr: false
  }
)

export default function MapSelector({ onLocationSelect, isOpen, onClose, defaultCenter = [51.505, -0.09] }: Props) {
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
          <ErrorBoundary>
            <MapWithNoSSR
              defaultCenter={defaultCenter}
              onLocationSelect={onLocationSelect}
            />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}