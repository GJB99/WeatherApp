'use client'
import { useState, useEffect } from 'react'
import { MapPinIcon, SunIcon, CloudIcon, CloudArrowDownIcon, ArrowPathIcon, Bars3Icon, PlusIcon, MinusCircleIcon } from '@heroicons/react/24/solid'
import { fetchWeatherData } from '@/services/weatherService'
import type { WeatherData, WeatherCondition } from '@/types/weather'
import LocationSearch from './LocationSearch'

interface SavedLocation {
  name: string;
  lat: number;
  lon: number;
}

export default function Home() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('savedLocations')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

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

  const loadLocation = async (location: SavedLocation) => {
    setLoading(true)
    try {
      const data = await fetchWeatherData(location.lat, location.lon)
      setWeatherData(data)
    } catch (err) {
      setError('Failed to fetch weather data')
    } finally {
      setLoading(false)
      setIsMenuOpen(false)
    }
  }

  const saveCurrentLocation = (location?: { name: string; lat: number; lon: number }) => {
    const locationToSave = location || {
      name: weatherData?.location || '',
      lat: 0,
      lon: 0
    }

    if (location || (weatherData && navigator.geolocation)) {
      const saveLocation = () => {
        // Check if location already exists
        const exists = savedLocations.some(
          loc => loc.name === locationToSave.name || areLocationsEqual(loc, locationToSave)
        )

        if (!exists) {
          const updatedLocations = [...savedLocations, locationToSave]
          setSavedLocations(updatedLocations)
          localStorage.setItem('savedLocations', JSON.stringify(updatedLocations))
        }
      }

      if (location) {
        saveLocation()
      } else {
        navigator.geolocation.getCurrentPosition((position) => {
          locationToSave.lat = position.coords.latitude
          locationToSave.lon = position.coords.longitude
          saveLocation()
        })
      }
    }
  }

  const deleteLocation = (locationToDelete: SavedLocation) => {
    const updatedLocations = savedLocations.filter(
      loc => loc.name !== locationToDelete.name
    )
    setSavedLocations(updatedLocations)
    localStorage.setItem('savedLocations', JSON.stringify(updatedLocations))
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-white">
      <p className="text-xl">Loading your weather data...</p>
    </div>
  )
  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-white">
      <p className="text-xl">{error}</p>
    </div>
  )
  if (!weatherData) return null

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-white flex flex-col items-center px-4 pt-8 relative">
      {/* Menu Button */}
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)} 
        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Locations Menu */}
      {isMenuOpen && (
        <div className="absolute top-16 right-4 bg-white/20 backdrop-blur-lg rounded-3xl p-4 w-64 z-10">
          <h3 className="text-lg font-medium mb-4">Saved Locations</h3>
          
          {/* Current Location Button */}
          <button
            onClick={async () => {
              if (navigator.geolocation) {
                setLoading(true)
                navigator.geolocation.getCurrentPosition(
                  async (position) => {
                    try {
                      const data = await fetchWeatherData(
                        position.coords.latitude,
                        position.coords.longitude
                      )
                      setWeatherData(data)
                      setIsMenuOpen(false)
                    } catch (err) {
                      setError('Failed to fetch weather data')
                    } finally {
                      setLoading(false)
                    }
                  },
                  () => setError('Location access denied')
                )
              }
            }}
            className="w-full flex items-center gap-2 p-2 mb-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <MapPinIcon className="h-4 w-4" />
            <span>Current Location</span>
          </button>

          <div className="mb-4">
            <LocationSearch 
              onLocationSelect={(location) => {
                loadLocation(location)
                saveCurrentLocation(location)
              }} 
            />
          </div>
          {savedLocations.map((location, index) => (
            <button
              key={index}
              onClick={() => loadLocation(location)}
              className="w-full text-left p-2 hover:bg-white/10 rounded-lg mb-2 transition-colors"
            >
              {location.name}
            </button>
          ))}
          {savedLocations.length === 0 && (
            <p className="text-sm opacity-80">No saved locations yet</p>
          )}
        </div>
      )}

      {/* Location and Date */}
      <div className="w-full max-w-md flex items-center justify-between mb-12">
        <div className="flex items-center gap-2">
          <MapPinIcon className="h-5 w-5" />
          <p className="text-base">{weatherData.location}</p>
          {savedLocations.some(loc => loc.name === weatherData.location) ? (
            <button 
              onClick={() => deleteLocation({ name: weatherData.location, lat: 0, lon: 0 })}
              className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors"
              title="Remove from saved locations"
            >
              <MinusCircleIcon className="h-4 w-4" />
            </button>
          ) : (
            <button 
              onClick={() => saveCurrentLocation()}
              className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors"
              title="Save this location"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-sm opacity-80">{weatherData.currentDate}</p>
      </div>

      {/* Current Temperature */}
      <div className="text-center mb-12">
        <h1 className="text-[156px] font-extralight leading-none mb-4">{Math.round(weatherData.temperature)}°</h1>
        <div className="inline-block bg-white/20 px-6 py-2 rounded-full">
          <p className={`text-base capitalize ${getConditionTextColor(weatherData.condition)}`}>
            {weatherData.condition}
          </p>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 w-full max-w-md mb-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center border-r border-white/20">
            <p className="text-sm opacity-80 mb-1">Today</p>
            <p className="text-sm font-light">
              ↑{Math.round(weatherData.todayForecast.high)}° ↓{Math.round(weatherData.todayForecast.low)}°
            </p>
          </div>
          <div className="text-center border-r border-white/20">
            <p className="text-sm opacity-80 mb-1">{weatherData.details.time}</p>
            <p className="text-sm font-light">{weatherData.details.windSpeed} km/h</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-80 mb-1">UV {weatherData.details.uvIndex}</p>
            <p className="text-sm font-light">{getRainDescription(weatherData.details.rainChance)}</p>
          </div>
        </div>
      </div>

      {/* Hourly Forecast */}
      <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 w-full max-w-md mb-6">
        <h2 className="text-lg font-medium mb-6">Hourly Forecast</h2>
        <div className="grid grid-cols-4 gap-8">
          {weatherData.hourlyForecast.map((hour, index) => (
            <div key={index} className="text-center">
              <p className="text-sm mb-3 opacity-80">{hour.time}</p>
              {getWeatherIcon(hour.condition)}
              <p className="text-lg font-light mt-3">{Math.round(hour.temperature)}°</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tomorrow's Forecast */}
      <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium mb-1">Tomorrow</h3>
            <p className="text-sm opacity-80">{weatherData.tomorrowForecast.description}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-light">
              ↑{Math.round(weatherData.tomorrowForecast.high)}° ↓{Math.round(weatherData.tomorrowForecast.low)}°
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

function getConditionTextColor(condition: string) {
  switch (condition.toLowerCase()) {
    case 'sunny': return 'text-[#FFB067] font-bold'
    case 'rainy': return 'text-[#4B95E9] font-bold'
    case 'cloudy': return 'text-[#718096] font-bold'
    case 'windy': return 'text-[#718096] font-bold'
    default: return 'text-white font-bold'
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

function areLocationsEqual(loc1: SavedLocation, loc2: SavedLocation): boolean {
  // Check if locations are within 5km of each other
  const R = 6371; // Earth's radius in km
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLon = (loc2.lon - loc1.lon) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance < 5; // Returns true if locations are within 5km
}