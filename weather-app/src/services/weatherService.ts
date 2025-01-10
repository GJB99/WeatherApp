import axios from 'axios';
import { WeatherData } from '@/types/weather';
import { fetchAirQualityData, fetchPollenData } from './airQualityService';
import { fetchMarineData } from './marineService';

const WEATHER_API_KEY = process.env.NEXT_PUBLIC_VISUALCROSSING_API_KEY;
const WEATHER_BASE_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline';

export async function fetchWeatherData(latitude: number, longitude: number, is24Hour: boolean): Promise<WeatherData> {
  try {
    if (!WEATHER_API_KEY) {
      throw new Error('Visual Crossing API key is not configured');
    }

    // Get location name using OpenStreetMap's Nominatim
    const locationResponse = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`,
      {
        headers: {
          'User-Agent': 'WeatherApp/1.0'
        }
      }
    );

    // Extract city and country from address components
    const address = locationResponse.data.address;
    const city = address.city || address.town || address.village || address.suburb || address.municipality;
    const cityName = `${city}, ${address.country_code.toUpperCase()}`;

    // Get weather data for today and tomorrow
    const response = await axios.get(
      `${WEATHER_BASE_URL}/${latitude},${longitude}/next7days?unitGroup=metric&include=current,hours,days&key=${WEATHER_API_KEY}`
    );

    const current = response.data.currentConditions;
    const today = response.data.days[0];
    const tomorrow = response.data.days[1];
    const currentHour = new Date().getHours();

    // Format current date
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });

    // Get next 24 hours from current hour
    const nextHours = [];
    for (let i = 0; i < 24; i++) {
      const hourIndex = (currentHour + i) % 24;
      nextHours.push(today.hours[hourIndex]);
      
      // If we need hours from tomorrow
      if (hourIndex + i >= 24) {
        const tomorrowHourIndex = (hourIndex + i) % 24;
        nextHours.push(tomorrow.hours[tomorrowHourIndex]);
      }
    }

    const detailedLocation = await getDetailedLocation(latitude, longitude);

    const airQualityData = await fetchAirQualityData(latitude, longitude);
    const pollenData = await fetchPollenData(latitude, longitude);
    const marineData = await fetchMarineData(latitude, longitude);

    return {
      temperature: current.temp,
      feelslike: current.feelslike,
      condition: mapWeatherCondition(current.conditions, current.temp),
      location: detailedLocation || cityName,
      coordinates: {
        lat: latitude,
        lon: longitude
      },
      currentDate: currentDate,
      sunrise: new Date(`2000-01-01 ${current.sunrise}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      sunset: new Date(`2000-01-01 ${current.sunset}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      todayForecast: {
        high: today.tempmax,
        low: today.tempmin
      },
      details: {
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        windSpeed: Math.round(current.windspeed),
        windDirection: current.winddir,
        uvIndex: current.uvindex,
        maxUV: today.uvindex,
        minUV: 0,
        rainChance: today.precipprob || 0,
        humidity: current.humidity,
        airQuality: airQualityData ?? {
          aqi: 0,
          description: 'Unavailable',
          dominantPollutant: 'N/A',
          pollutants: { co: 0, no2: 0, o3: 0, pm10: 0, pm25: 0 }
        },
        pollen: pollenData || {
          grass: 0,
          tree: 0,
          weed: 0
        }
      },
      tomorrowForecast: {
        high: tomorrow.tempmax,
        low: tomorrow.tempmin,
        description: tomorrow.description,
        condition: mapWeatherCondition(tomorrow.conditions)
      },
      hourlyForecast: nextHours
        .filter((hour: any) => {
          const hourTime = new Date(hour.datetimeEpoch * 1000);
          const currentTime = new Date();
          return hourTime >= currentTime;
        })
        .map((hour: any) => ({
          time: new Date(hour.datetimeEpoch * 1000).toLocaleTimeString('en-US', { 
            hour: is24Hour ? '2-digit' : 'numeric',
            minute: '2-digit',
            hour12: !is24Hour,
            timeZone: response.data.timezone
          }),
          timestamp: hour.datetimeEpoch,
          temperature: hour.temp,
          condition: mapWeatherCondition(hour.conditions, hour.temp),
          precipChance: hour.precipprob || 0
        }))
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, 24),
      dailyForecast: response.data.days.slice(1, 8).map((day: any) => ({
        date: new Date(day.datetimeEpoch * 1000).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        }),
        high: day.tempmax,
        low: day.tempmin,
        condition: mapWeatherCondition(day.conditions),
        precipChance: day.precipprob || 0,
        moonPhase: getMoonPhaseName(day.moonphase),
        moonIllumination: Math.round((day.moonphase < 0.5 ? day.moonphase * 2 : (1 - day.moonphase) * 2) * 100)
      })),
      seaData: marineData
    };
  } catch (error: any) {
    console.error('Error details:', error);
    throw error;
  }
}

function mapWeatherCondition(condition: string, temperature?: number): WeatherData['condition'] {
  const conditions = condition?.toLowerCase() || '';

  if (conditions.includes('clear') || conditions.includes('sun')) return 'sunny';
  if (conditions.includes('rain') || conditions.includes('drizzle') || conditions.includes('thunder')) return 'rainy';
  if (conditions.includes('snow') || conditions.includes('ice') || conditions.includes('sleet')) return 'icy';
  if (conditions.includes('cloud') || conditions.includes('overcast')) return 'cloudy';
  if (conditions.includes('wind')) return 'windy';
  return 'sunny'; // default case
}

function getRainDescription(chance: number): string {
  if (chance < 30) return 'Low chance of rain';
  if (chance < 70) return 'Moderate chance of rain';
  return 'High chance of rain';
}

async function getDetailedLocation(lat: number, lon: number): Promise<string> {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    
    const address = response.data.address;
    
    // Build location string from most specific to least specific
    const parts = [];
    
    // Add suburb/neighborhood if available
    if (address.suburb) {
      parts.push(address.suburb);
    } else if (address.neighbourhood) {
      parts.push(address.neighbourhood);
    }
    
    // Add city district if available
    if (address.city_district) {
      parts.push(address.city_district);
    }
    
    // Always add city/town
    if (address.city) {
      parts.push(address.city);
    } else if (address.town) {
      parts.push(address.town);
    }
    
    return parts.join(', ');
  } catch (error) {
    console.error('Error getting detailed location:', error);
    return null;
  }
}

function getMoonPhaseName(phase: number): string {
  if (phase === 0 || phase === 1) return 'new moon';
  if (phase < 0.25) return 'waxing crescent';
  if (phase === 0.25) return 'first quarter';
  if (phase < 0.5) return 'waxing gibbous';
  if (phase === 0.5) return 'full moon';
  if (phase < 0.75) return 'waning gibbous';
  if (phase === 0.75) return 'last quarter';
  if (phase < 1) return 'waning crescent';
  return 'new moon';
}