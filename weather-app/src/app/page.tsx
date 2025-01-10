'use client'
import { useState, useEffect } from 'react'
import { MapPinIcon, SunIcon, CloudIcon, CloudArrowDownIcon, ArrowPathIcon, Bars3Icon, PlusIcon, MinusCircleIcon, MapIcon } from '@heroicons/react/24/solid'
import { fetchWeatherData } from '@/services/weatherService'
import type { WeatherData, WeatherCondition } from '@/types/weather'
import LocationSearch from './LocationSearch'
import MapSelector from './MapSelector'
import WindDirectionArrow from './WindDirectionArrow'

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
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [is24Hour, setIs24Hour] = useState(false)
  const [isCelsius, setIsCelsius] = useState(true)

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
                  position.coords.longitude,
                  is24Hour
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
      const data = await fetchWeatherData(location.lat, location.lon, is24Hour)
      setWeatherData(data)
    } catch (err) {
      setError('Failed to fetch weather data')
    } finally {
      setLoading(false)
      setIsMenuOpen(false)
    }
  }

  function getWindDescription(speed: number): string {
    if (speed < 5) return 'Light breeze'
    if (speed < 15) return 'Moderate wind'
    if (speed < 25) return 'Strong wind'
    return 'High wind'
  }

  const saveCurrentLocation = (location?: { name: string; lat: number; lon: number }) => {
    const locationToSave = location || {
      name: weatherData?.location || '',
      lat: 0,
      lon: 0
    }

    if (location) {
      // For manually selected locations (map or search)
      const exists = savedLocations.some(
        loc => loc.name === locationToSave.name || areLocationsEqual(loc, locationToSave)
      )

      if (!exists) {
        const updatedLocations = [...savedLocations, locationToSave]
        setSavedLocations(updatedLocations)
        localStorage.setItem('savedLocations', JSON.stringify(updatedLocations))
      }
    } else if (weatherData) {
      // For current location
      navigator.geolocation.getCurrentPosition((position) => {
        const currentLocation = {
          name: weatherData.location,
          lat: position.coords.latitude,
          lon: position.coords.longitude
        }

        const exists = savedLocations.some(
          loc => loc.name === currentLocation.name || areLocationsEqual(loc, currentLocation)
        )

        if (!exists) {
          const updatedLocations = [...savedLocations, currentLocation]
          setSavedLocations(updatedLocations)
          localStorage.setItem('savedLocations', JSON.stringify(updatedLocations))
        }
      })
    }
  }

  const deleteLocation = (locationToDelete: SavedLocation) => {
    const updatedLocations = savedLocations.filter(
      loc => loc.name !== locationToDelete.name
    )
    setSavedLocations(updatedLocations)
    localStorage.setItem('savedLocations', JSON.stringify(updatedLocations))
  }

  const loadWeatherData = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const data = await fetchWeatherData(lat, lon, is24Hour);
      setWeatherData(data);
    } catch (err) {
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

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
                        position.coords.longitude,
                        is24Hour
                      )
                      setWeatherData(data)
                      saveCurrentLocation({
                        name: data.location,
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                      })
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

          <button
            onClick={() => setIsMapOpen(true)}
            className="w-full flex items-center gap-2 p-2 mb-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <MapIcon className="h-4 w-4" />
            <span>Select on Map</span>
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
            <div
              key={index}
              className="w-full flex items-center justify-between p-2 hover:bg-white/10 rounded-lg mb-2 transition-colors"
            >
              <button
                onClick={() => loadLocation(location)}
                className="text-left flex-1"
              >
                {location.name}
              </button>
              <button 
                onClick={() => deleteLocation(location)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                title="Remove from saved locations"
              >
                <MinusCircleIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          {savedLocations.length === 0 && (
            <p className="text-sm opacity-80">No saved locations yet</p>
          )}
        </div>
      )}

      {/* Location and Date */}
      <div className="w-full max-w-md flex items-center justify-between mb-6">
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
              onClick={() => {
                if (weatherData) {
                  const locationToSave = {
                    name: weatherData.location,
                    lat: weatherData.coordinates.lat,
                    lon: weatherData.coordinates.lon
                  };
                  saveCurrentLocation(locationToSave);
                }
              }}
              className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors"
              title="Save this location"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setIs24Hour(!is24Hour)}
              className={`px-2 py-1 rounded-md text-xs transition-colors ${
                is24Hour ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
            >
              {is24Hour ? '24H' : 'AM/PM'}
            </button>
            <button
              onClick={() => setIsCelsius(!isCelsius)}
              className={`px-2 py-1 rounded-md text-xs transition-colors ${
                isCelsius ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
            >
              {isCelsius ? '°C' : '°F'}
            </button>
          </div>
          <p className="text-sm opacity-80">{weatherData.currentDate}</p>
        </div>
      </div>

      {/* Current Temperature */}
      <div className="text-center mb-6">
        <h1 className="text-[156px] font-extralight leading-none mb-4">
          {convertTemp(weatherData.temperature, isCelsius)}°
        </h1>
        <p className="text-sm opacity-80 mb-2">
          Feels like {convertTemp(weatherData.feelslike, isCelsius)}°
        </p>
        <div className="inline-block bg-white/20 backdrop-blur-lg rounded-full px-4 py-2">
          <p className="text-sm font-medium">{weatherData.condition}</p>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 w-full max-w-md mb-6">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="text-center border-r border-white/20">
            <p className="text-sm opacity-80 mb-1">Today</p>
            <div className="flex justify-center gap-4 items-center">
              <div>
                <span>↑{convertTemp(weatherData.todayForecast.high, isCelsius)}°</span>
                <span className="opacity-75"> ↓{convertTemp(weatherData.todayForecast.low, isCelsius)}°</span>
              </div>
              {getMoonPhaseIcon(weatherData.dailyForecast[0].moonPhase)}
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-80 mb-1">Humidity</p>
            <p className="text-sm font-light">{Math.round(weatherData.details.humidity)}%</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="text-center border-r border-white/20">
            <p className="text-sm opacity-80 mb-1">Wind</p>
            <div className="text-sm font-light">
              {getWindDescription(weatherData.details.windSpeed)}
              <br />
              <span className="flex items-center justify-center gap-1">
                {weatherData.details.windSpeed} km/h 
                <WindDirectionArrow 
                  degrees={weatherData.details.windDirection} 
                  className="transition-transform duration-200"
                /> 
                {getWindDirection(weatherData.details.windDirection)}
              </span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-80 mb-1">UV Index</p>
            <p className="text-sm font-light">
              <span className={getUVColor(weatherData.details.uvIndex)}>{weatherData.details.uvIndex}</span>
              <span className="text-white"> - {getUVDescription(weatherData.details.uvIndex)}</span>
              <br />
              <span className="text-xs">
                <span>↑{weatherData.details.maxUV}</span>
                <span className="opacity-70"> ↓{weatherData.details.minUV}</span>
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="text-center border-r border-white/20">
            <p className="text-sm opacity-80 mb-1">Water Temperature</p>
            {weatherData.seaData ? (
              <div className="text-sm font-light">
                <p>{Math.round(weatherData.seaData.temperature)}°</p>
                <p className="text-xs opacity-70 mt-1">{weatherData.seaData.location}</p>
              </div>
            ) : (
              <p className="text-sm font-light">No data</p>
            )}
          </div>
          <div className="text-center">
            <p className="text-sm opacity-80 mb-1">Tides</p>
            {weatherData.seaData?.tides ? (
              <div className="text-sm font-light flex flex-col items-center">
                {weatherData.seaData.tides.map((tide, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <span className={tide.type === 'high' ? 'text-blue-300' : 'text-blue-500'}>
                      {tide.type === 'high' ? 'High' : 'Low'}
                    </span>
                    <span>{formatTime(tide.time, is24Hour)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-light">No data</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="text-center border-r border-white/20">
            <p className="text-sm opacity-80 mb-1">Air Quality</p>
            <div className="text-sm font-light">
              <p>
                <span className={getAQIColor(weatherData.details.airQuality.aqi)}>
                  {weatherData.details.airQuality.aqi}
                </span>
                <span> - {weatherData.details.airQuality.description.split(' ')[0]}</span>
              </p>
              <p className="text-xs opacity-70 mt-1">
                Main pollutant: {weatherData.details.airQuality.dominantPollutant}
              </p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-80 mb-1">Sun</p>
            <div className="text-sm font-light flex flex-col items-center">
              <div className="flex items-center gap-1">
                <span className="text-orange-300">Rise</span>
                <span>{formatTime(weatherData.sunrise, is24Hour)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-orange-500">Set</span>
                <span>{formatTime(weatherData.sunset, is24Hour)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          {weatherData.details.pollen.tree.recommendations.length > 0 && (
            <p className="text-xs opacity-70 mt-1">
              {weatherData.details.pollen.tree.recommendations[0]}
            </p>
          )}
        </div>

      </div>

      {/* Hourly Forecast */}
      <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 w-full max-w-md mb-6">
        <h2 className="text-lg font-medium mb-6">Hourly Forecast</h2>
        <div 
          className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => {
            const ele = e.currentTarget;
            const startX = e.pageX - ele.offsetLeft;
            const scrollLeft = ele.scrollLeft;

            const handleMouseMove = (e: MouseEvent) => {
              const x = e.pageX - ele.offsetLeft;
              const walk = (x - startX) * 2;
              ele.scrollLeft = scrollLeft - walk;
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
          onTouchStart={(e) => {
            const ele = e.currentTarget;
            const touch = e.touches[0];
            const startX = touch.pageX - ele.offsetLeft;
            const scrollLeft = ele.scrollLeft;

            const handleTouchMove = (e: TouchEvent) => {
              const x = e.touches[0].pageX - ele.offsetLeft;
              const walk = (x - startX) * 2;
              ele.scrollLeft = scrollLeft - walk;
            };

            const handleTouchEnd = () => {
              document.removeEventListener('touchmove', handleTouchMove);
              document.removeEventListener('touchend', handleTouchEnd);
            };

            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleTouchEnd);
          }}
        >
          <div className="flex gap-4 min-w-max pb-4">
            {weatherData.hourlyForecast.map((hour, index) => (
              <div key={index} className="flex flex-col items-center w-20">
                <p className="text-sm opacity-80 mb-3 w-full text-center">
                  {formatTime(hour.time, is24Hour, true)}
                </p>
                <div className="flex justify-center w-full">
                  {getWeatherIcon(hour.condition)}
                </div>
                <p className="text-lg font-light mt-3 w-full text-center">
                  {convertTemp(hour.temperature, isCelsius)}°
                </p>
                {hour.precipChance > 0 && (
                  <p className="text-xs opacity-70 mt-1 text-center">
                    {Math.round(hour.precipChance)}% 💧
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tomorrow's Forecast */}
      <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 w-full max-w-md mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium mb-1">Tomorrow</h3>
            <p className="text-sm opacity-80">{weatherData.tomorrowForecast.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <p className="text-sm font-light text-right w-12">
              ↑{convertTemp(weatherData.tomorrowForecast.high, isCelsius)}°
            </p>
            <p className="text-sm font-light text-right w-12 opacity-75">
              ↓{convertTemp(weatherData.tomorrowForecast.low, isCelsius)}°
            </p>
          </div>
        </div>
      </div>

      {/* Daily Forecast */}
      {weatherData.dailyForecast && (
        <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 w-full max-w-md">
          <h2 className="text-lg font-medium mb-6">7-Day Forecast</h2>
          <div className="space-y-4">
            {weatherData.dailyForecast.map((day, index) => (
              <div key={index} className="grid grid-cols-[1fr,auto,auto] gap-4 items-center">
                <div className="flex items-center gap-4">
                  <p className="text-sm w-24">{day.date}</p>
                  <div className="flex items-center gap-2">
                    {getWeatherIcon(day.condition)}
                    <div className="flex flex-col items-center w-8">
                      <span className="text-xs opacity-70">{Math.round(day.precipChance)}%</span>
                      <span className="text-xs">💧</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <p className="text-sm font-light w-12 text-right">
                    ↑{convertTemp(day.high, isCelsius)}°
                  </p>
                  <p className="text-sm font-light w-12 text-right opacity-75">
                    ↓{convertTemp(day.low, isCelsius)}°
                  </p>
                  {getMoonPhaseIcon(day.moonPhase)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isMapOpen && (
        <MapSelector
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          defaultCenter={weatherData ? [weatherData.coordinates.lat, weatherData.coordinates.lon] : undefined}
          onLocationSelect={async (location) => {
            try {
              const data = await fetchWeatherData(location.lat, location.lon, is24Hour);
              const locationData = {
                name: data.location,
                lat: location.lat,
                lon: location.lon
              };
              await loadLocation(locationData);
              saveCurrentLocation(locationData);
              setIsMapOpen(false);
            } catch (error) {
              console.error('Error loading location:', error);
            }
          }}
        />
      )}
    </main>
  )
}

function getConditionTextColor(condition: string) {
  switch (condition.toLowerCase()) {
    case 'sunny': return 'text-[#FFB067] font-bold'
    case 'rainy': return 'text-[#4B95E9] font-bold'
    case 'cloudy': return 'text-[#94A3B8] font-bold'
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
  // Only check if the exact coordinates match
  return loc1.lat === loc2.lat && loc1.lon === loc2.lon;
}

function getUVColor(uvIndex: number): string {
  if (uvIndex >= 11) return 'text-[#800000]';  // Extreme (11+)
  if (uvIndex >= 8) return 'text-[#FF0000]';   // Very High (8-10)
  if (uvIndex >= 6) return 'text-[#FF8C00]';   // High (6-7)
  if (uvIndex >= 3) return 'text-[#FFFE00]';   // Moderate (3-5)
  return 'text-[#009E3A]';                     // Low (0-2)
}

function getUVDescription(uvIndex: number): string {
  if (uvIndex >= 11) return 'Extreme';
  if (uvIndex >= 8) return 'Very High';
  if (uvIndex >= 6) return 'High';
  if (uvIndex >= 3) return 'Moderate';
  return 'Low';
}

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees % 360) / 22.5));
  return directions[index % 16];
}

function getWindDirectionArrow(degrees: number): string {
  // Convert degrees to closest arrow
  const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
  const index = Math.round(degrees / 45) % 8;
  return arrows[index];
}

function getAQIColor(aqi: number): string {
  if (aqi >= 80) return 'text-[#009E3A]';  // Excellent (100-80)
  if (aqi >= 60) return 'text-[#84CF33]';  // Good (79-60)
  if (aqi >= 40) return 'text-[#FFFE00]';  // Moderate (59-40)
  if (aqi >= 20) return 'text-[#FF8C00]';  // Low (39-20)
  if (aqi >= 1) return 'text-[#FF0000]';   // Poor (19-1)
  return 'text-[#800000]';                 // Poor (0)
}

function getPollenLevel(value: number): string {
  if (value <= 2) return 'Low';
  if (value <= 4) return 'Moderate';
  if (value <= 6) return 'High';
  return 'Very High';
}

function getPollenColor(value: number): string {
  if (value <= 2) return 'text-green-400';
  if (value <= 4) return 'text-yellow-400';
  if (value <= 6) return 'text-orange-400';
  return 'text-red-400';
}

function getPollenDescription(type: string, value: number): string {
  const level = getPollenLevel(value);
  return `${type} Pollen: ${level}`;
}

function getPollenLevelEmoji(value: number): string {
  if (value <= 2) return '🟢';
  if (value <= 4) return '🟡';
  if (value <= 6) return '🟠';
  return '🔴';
}

function getMoonPhaseIcon(phase: string) {
  const moonPhase = phase?.toLowerCase() || '';
  
  switch (moonPhase) {
    case 'new moon':
      return '🌑';
    case 'waxing crescent':
      return '🌒';
    case 'first quarter':
      return '🌓';
    case 'waxing gibbous':
      return '🌔';
    case 'full moon':
      return '🌕';
    case 'waning gibbous':
      return '🌖';
    case 'last quarter':
      return '🌗';
    case 'waning crescent':
      return '🌘';
    default:
      return '🌑';
  }
}

function convertTemp(celsius: number, isCelsius: boolean): number {
  return isCelsius ? celsius : Math.round((celsius * 9/5) + 32);
}

function formatTime(time: string, is24Hour: boolean, removeMinutesIfZero: boolean = false): string {
  if (!time) return '';
  
  try {
    let date;
    if (!isNaN(Number(time))) {
      // Handle Unix timestamp
      date = new Date(Number(time) * 1000);
    } else if (time.includes(':')) {
      // Handle time string (HH:MM)
      date = new Date(`2024-01-01 ${time}`);
    } else {
      // Handle ISO string
      date = new Date(time);
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid time';
    }

    if (removeMinutesIfZero && date.getMinutes() === 0) {
      // For times like "7:00 PM" or "19:00", just return "7" or "19"
      return date.toLocaleTimeString('en-US', {
        hour: is24Hour ? '2-digit' : 'numeric',
        hour12: !is24Hour
      }).replace(':00', '');
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: is24Hour ? '2-digit' : 'numeric',
      minute: '2-digit',
      hour12: !is24Hour
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
}