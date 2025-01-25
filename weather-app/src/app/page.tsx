'use client'
import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { 
  MapPinIcon, 
  MapIcon, 
  Bars3Icon, 
  MinusCircleIcon, 
  PlusIcon 
} from '@heroicons/react/24/solid'
import { fetchWeatherData } from '@/services/weatherService'
import type { WeatherData, WeatherCondition } from '@/types/weather'
import LocationSearch from './LocationSearch'
import WindDirectionArrow from './WindDirectionArrow'
import { isNighttime } from './timeUtils'
import { getAQIColor } from '@/services/airQualityService'

// Dynamically import MapSelector with ssr disabled
const MapSelector = dynamic(
  () => import('./MapSelector'),
  { ssr: false }
)

interface SavedLocation {
  name: string;
  lat: number;
  lon: number;
}

export default function Home() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [is24Hour, setIs24Hour] = useState(false);
  const [isCelsius, setIsCelsius] = useState(true);
  const [currentTime, setCurrentTime] = useState('')

  // Initialize state from localStorage only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('savedLocations')
      if (saved) {
        setSavedLocations(JSON.parse(saved))
      }
    }
  }, [])

  // Update localStorage when savedLocations changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('savedLocations', JSON.stringify(savedLocations))
    }
  }, [savedLocations])

  const saveCurrentLocation = useCallback((location?: { name: string; lat: number; lon: number }) => {
    if (typeof window === 'undefined') return;

    const locationToSave = location || {
      name: weatherData?.location || '',
      lat: weatherData?.coordinates.lat || 0,
      lon: weatherData?.coordinates.lon || 0
    }

    // Skip if we don't have valid coordinates
    if (!locationToSave.lat && !locationToSave.lon) return;

    const exists = savedLocations.some(loc => 
      areLocationsEqual(loc, locationToSave) || 
      loc.name === locationToSave.name
    );

    if (!exists) {
      setSavedLocations(prev => [...prev, locationToSave]);
    }
  }, [weatherData, savedLocations])

  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setInitialLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const data = await fetchWeatherData(
        position.coords.latitude,
        position.coords.longitude,
        is24Hour
      );
      setWeatherData(data);

      const locationData = {
        name: data.location,
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };

      const exists = savedLocations.some(loc => 
        areLocationsEqual(loc, locationData) || 
        loc.name === locationData.name
      );

      if (!exists) {
        setSavedLocations(prev => [...prev, locationData]);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Failed to get location');
    } finally {
      setInitialLoading(false);
    }
  }, [is24Hour, savedLocations]);

  // Initial load effect
  useEffect(() => {
    const initialLoad = async () => {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported');
        setInitialLoading(false);
        return;
      }
      
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const data = await fetchWeatherData(
          position.coords.latitude,
          position.coords.longitude,
          is24Hour
        );
        setWeatherData(data);
        
        if (savedLocations.length === 0) {
          const locationData = {
            name: data.location,
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          setSavedLocations([locationData]);
        }
      } catch (error) {
        console.error('Failed to fetch weather data:', error);
        setError('Failed to fetch weather data');
      } finally {
        setInitialLoading(false);
      }
    };

    if (initialLoading) {
      initialLoad();
    }
  }, [initialLoading]); // Only run when initialLoading changes

  const loadLocation = useCallback(async (location: SavedLocation) => {
    try {
      const data = await fetchWeatherData(location.lat, location.lon, is24Hour);
      setWeatherData(data);
      setError(null);
    } catch (error) {
      console.error('Error loading location:', error);
      setError('Failed to load location data');
    }
  }, [is24Hour]);

  function getWindDescription(speed: number): string {
    if (speed < 5) return 'Light breeze'
    if (speed < 15) return 'Moderate wind'
    if (speed < 25) return 'Strong wind'
    return 'High wind'
  }

  const deleteLocation = (locationToDelete: SavedLocation) => {
    const updatedLocations = savedLocations.filter(
      loc => loc.name !== locationToDelete.name
    )
    setSavedLocations(updatedLocations)
  }

  // Add effect for updating time
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour: is24Hour ? '2-digit' : 'numeric',
        minute: '2-digit',
        hour12: !is24Hour
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [is24Hour]);

  useEffect(() => {
    if (!initialLoading && savedLocations.length > 0) {
      loadLocation(savedLocations[0]);
    }
  }, [initialLoading, loadLocation, savedLocations.length]);

  if (initialLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-white">
      <p className="text-xl">Loading your weather data...</p>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-white">
      <p className="text-xl">{error}</p>
    </div>
  );

  if (!weatherData) return null;

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
            onClick={getCurrentLocation}
            className="flex items-center gap-2 w-full p-2 hover:bg-white/10 rounded-lg mb-2"
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
          <p className="text-sm opacity-80">
            {currentTime}
          </p>
        </div>
      </div>

      {/* Current Temperature */}
      <div className="text-center mb-6">
        <h1 className="text-[156px] font-extralight leading-none mb-4">
          {convertTemp(weatherData.temperature, isCelsius)}°
        </h1>
        <div className="text-center">
          <p className="text-sm font-light">
            Feels like {convertTemp(weatherData.feelslike, isCelsius)}°
          </p>
        </div>
        <div className="inline-flex flex-col items-center gap-1 bg-white/20 backdrop-blur-lg rounded-full px-4 py-2 mt-2">
          <div className="flex items-center gap-2">
            {getMainConditionEmoji(
              weatherData.condition, 
              weatherData.sunrise, 
              weatherData.sunset, 
              weatherData.timezone
            )}
            <span>{weatherData.condition}</span>
          </div>
          {weatherData.condition === 'cloudy' && (
            <p className="text-xs opacity-70">
              {getRainDescription(weatherData.details.rainChance)}
            </p>
          )}
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
            <p className="text-sm opacity-80 mb-1">Wave Height</p>
            {weatherData.seaData?.waveHeight ? (
              <div className="text-sm font-light">
                <p>{weatherData.seaData.waveHeight}m</p>
                <p className="text-xs opacity-70 mt-1">Current</p>
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
                <span className="text-white"> - {weatherData.details.airQuality.description.split(' ')[0]}</span>
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
                  {getMainConditionEmoji(
                    hour.condition, 
                    weatherData.sunrise, 
                    weatherData.sunset, 
                    weatherData.timezone
                  )}
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
                    {getDailyForecastIcon(day.condition)}
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
              setWeatherData(data);
              saveCurrentLocation(locationData);
              setIsMapOpen(false);
            } catch (error) {
              console.error('Error loading location:', error);
              setError('Failed to load location data');
            }
          }}
        />
      )}
    </main>
  )
}

function getRainDescription(chance: number): string {
  if (chance < 30) return 'Low chance of rain'
  if (chance < 70) return 'Moderate chance of rain'
  return 'High chance of rain'
}

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees % 360) / 22.5));
  return directions[index % 16];
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

const getMainConditionEmoji = (condition: WeatherCondition, sunriseTime?: string, sunsetTime?: string, timezone?: string) => {
  if (typeof window !== 'undefined' && sunriseTime && sunsetTime && timezone) {
    const currentTime = new Date();
    const isNight = isNighttime(currentTime, sunriseTime, sunsetTime, timezone);

    if ((condition === 'sunny' || condition === 'clear') && isNight) {
      return '🌙'; // Moon for night
    }
  }

  switch (condition) {
    case 'sunny':
    case 'clear':
      return '☀️';
    case 'rainy':
      return '🌧️';
    case 'cloudy':
      return '☁️';
    case 'icy':
      return '❄️';
    case 'windy':
      return '💨';
    default:
      return '☀️';
  }
};

const getDailyForecastIcon = (condition: WeatherCondition) => {
  switch (condition) {
    case 'sunny':
    case 'clear':
      return '☀️';  // Always show sun for daily forecast
    case 'rainy':
      return '🌧️';
    case 'cloudy':
      return '☁️';
    case 'icy':
      return '❄️';
    case 'windy':
      return '💨';
    default:
      return '☀️';
  }
};

function areLocationsEqual(loc1: SavedLocation, loc2: SavedLocation): boolean {
  // Compare coordinates with some tolerance for floating-point differences
  const tolerance = 0.0001;
  return Math.abs(loc1.lat - loc2.lat) < tolerance && 
         Math.abs(loc1.lon - loc2.lon) < tolerance;
}

function getUVColor(uv: number): string {
  if (uv >= 11) return 'text-purple-400';  // Extreme
  if (uv >= 8) return 'text-red-500';      // Very High
  if (uv >= 6) return 'text-orange-400';   // High
  if (uv >= 3) return 'text-yellow-300';   // Moderate
  return 'text-green-400';                 // Low
}

function getUVDescription(uv: number): string {
  if (uv >= 11) return 'Extreme';
  if (uv >= 8) return 'Very High';
  if (uv >= 6) return 'High';
  if (uv >= 3) return 'Moderate';
  return 'Low';
}