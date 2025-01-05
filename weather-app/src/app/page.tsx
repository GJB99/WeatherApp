'use client'
import { useState, useEffect } from 'react'
import { MapPinIcon, SunIcon, CloudIcon, CloudArrowDownIcon, ArrowPathIcon } from '@heroicons/react/24/solid'
import { fetchWeatherData } from '@/services/weatherService'
import type { WeatherData, WeatherCondition } from '@/types/weather'

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

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#4B95E9] text-white">
      <p className="text-xl">Loading your weather data...</p>
    </div>
  )
  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-[#4B95E9] text-white">
      <p className="text-xl">{error}</p>
    </div>
  )
  if (!weatherData) return null

  return (
    <main className={`min-h-screen ${getBackgroundColor(weatherData.condition)} text-white flex flex-col items-center pt-8`}>
      {/* Location and Date */}
      <div className="w-full px-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-5 w-5" />
            <p className="text-sm">{weatherData.location}</p>
          </div>
          <p className="text-sm">{weatherData.currentDate}</p>
        </div>
      </div>

      {/* Current Temperature */}
      <div className="text-center mb-8">
        <h1 className="text-[120px] font-light leading-none">{Math.round(weatherData.temperature)}°C</h1>
        <div className="inline-block bg-white/20 px-4 py-1 rounded-full">
          <p className="text-sm font-light">{weatherData.condition}</p>
        </div>
      </div>

      {/* Today's Forecast */}
      <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-4 w-[90%] max-w-md mb-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm opacity-80">Today</p>
            <p className="text-sm">↑{Math.round(weatherData.todayForecast.high)}° ↓{Math.round(weatherData.todayForecast.low)}°</p>
          </div>
          <div className="text-center col-span-2">
            <p className="text-sm opacity-80">{weatherData.details.time}</p>
            <p className="text-sm">{weatherData.details.windSpeed}km/h</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-80">UV {weatherData.details.uvIndex}</p>
            <p className="text-sm">{getRainDescription(weatherData.details.rainChance)}</p>
          </div>
        </div>
      </div>

      {/* Hourly Forecast */}
      <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 w-[90%] max-w-md mb-4">
        <h2 className="text-lg font-medium mb-4">Hourly Forecast</h2>
        <div className="grid grid-cols-4 gap-6">
          {weatherData.hourlyForecast.map((hour, index) => (
            <div key={index} className="text-center">
              <p className="text-sm mb-2">{hour.time}</p>
              {getWeatherIcon(hour.condition)}
              <p className="text-lg mt-2">{Math.round(hour.temperature)}°</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tomorrow's Forecast */}
      <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-4 w-[90%] max-w-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Tomorrow</h3>
            <p className="text-sm opacity-80">{weatherData.tomorrowForecast.description}</p>
          </div>
          <div className="text-right">
            <p className="text-sm">↑{Math.round(weatherData.tomorrowForecast.high)}° ↓{Math.round(weatherData.tomorrowForecast.low)}°</p>
          </div>
        </div>
      </div>
    </main>
  )
}

function getBackgroundColor(condition: string) {
  switch (condition.toLowerCase()) {
    case 'sunny': return 'bg-[#FF7E45]'
    case 'rainy': return 'bg-[#4B95E9]'
    case 'icy': return 'bg-[#E8F1F2] text-gray-800'
    case 'overcast': return 'bg-gray-500'
    case 'windy': return 'bg-gray-300 text-gray-800'
    default: return 'bg-[#4B95E9]'
  }
}

function getRainDescription(chance: number): string {
  if (chance < 30) return 'Low chance of rain'
  if (chance < 70) return 'Moderate chance of rain'
  return 'High chance of rain'
}

function getWeatherIcon(condition: WeatherCondition) {
  const iconClass = "h-8 w-8"
  switch (condition.toLowerCase()) {
    case 'sunny':
      return <SunIcon className={iconClass} />
    case 'rainy':
      return <CloudArrowDownIcon className={iconClass} />
    case 'cloudy':
      return <CloudIcon className={iconClass} />
    case 'icy':
      return <CloudArrowDownIcon className={iconClass} />
    case 'windy':
      return <ArrowPathIcon className={iconClass} />
    default:
      return <CloudIcon className={iconClass} />
  }
}