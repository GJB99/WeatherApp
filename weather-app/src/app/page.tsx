'use client'
import { useState, useEffect } from 'react'
import { MapPinIcon } from '@heroicons/react/24/solid'
import { fetchWeatherData } from '@/services/weatherService'
import type { WeatherData } from '@/types/weather'

export default function Home() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getWeatherData = async () => {
      setLoading(true)
      try {
        if (typeof window !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                const data = await fetchWeatherData(
                  position.coords.latitude,
                  position.coords.longitude
                )
                setWeatherData(data)
              } catch (err) {
                setError('Failed to fetch weather data')
                console.error(err)
              }
            },
            () => setError('Location access denied')
          )
        } else {
          setError('Geolocation is not supported')
        }
      } catch (err) {
        setError('Failed to fetch weather data')
      } finally {
        setLoading(false)
      }
    }

    getWeatherData()
  }, [])

  const getBackgroundColor = (condition: string) => {
    switch (condition) {
      case 'sunny': return 'bg-[#FF7E45]'
      case 'rainy': return 'bg-[#4B95E9]'
      case 'icy': return 'bg-[#E8F1F2]'
      case 'overcast': return 'bg-gray-500'
      case 'windy': return 'bg-gray-300'
      default: return 'bg-[#FF7E45]'
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>
  if (error) return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>
  if (!weatherData) return null

  return (
    <main className={`min-h-screen ${getBackgroundColor(weatherData.condition)} p-4`}>
      <div className="max-w-md mx-auto text-white">
        <div className="flex items-center gap-2 mb-8">
          <MapPinIcon className="h-6 w-6" />
          <h1 className="text-2xl font-semibold">{weatherData.location}</h1>
        </div>

        <div className="text-center mb-8">
          <span className="text-8xl font-light">
            {Math.round(weatherData.temperature)}°
          </span>
        </div>

        <div className="text-center mb-8">
          <span className="text-xl capitalize">{weatherData.condition}</span>
        </div>

        <div className="bg-white/20 rounded-xl p-4">
          <div className="flex justify-between">
            {weatherData.hourlyForecast.map((forecast, index) => (
              <div key={index} className="text-center">
                <div className="text-sm">{forecast.time}</div>
                <div className="text-lg font-semibold">{Math.round(forecast.temperature)}°</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}