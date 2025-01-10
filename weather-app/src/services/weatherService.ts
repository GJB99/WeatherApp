import axios from 'axios';
import { WeatherData } from '@/types/weather';

const WEATHER_API_KEY = process.env.NEXT_PUBLIC_VISUALCROSSING_API_KEY;
const WEATHER_BASE_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline';

export async function fetchWeatherData(latitude: number, longitude: number): Promise<WeatherData> {
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

    // Get next 12 hours from current hour, in 3-hour chunks
    const nextHours = [];
    for (let i = 0; i < 12; i += 3) {
      const hourIndex = (currentHour + i) % 24;
      nextHours.push(today.hours[hourIndex]);
    }

    return {
      temperature: current.temp,
      feelslike: current.feelslike,
      condition: mapWeatherCondition(current.conditions, current.temp),
      location: cityName,
      coordinates: {
        lat: latitude,
        lon: longitude
      },
      currentDate: currentDate,
      sunrise: current.sunrise,
      sunset: current.sunset,
      todayForecast: {
        high: today.tempmax,
        low: today.tempmin
      },
      details: {
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        windSpeed: Math.round(current.windspeed),
        uvIndex: current.uvindex,
        rainChance: today.precipprob || 0,
        humidity: current.humidity
      },
      tomorrowForecast: {
        high: tomorrow.tempmax,
        low: tomorrow.tempmin,
        description: tomorrow.description,
        condition: mapWeatherCondition(tomorrow.conditions)
      },
      hourlyForecast: nextHours.map((hour: any) => ({
        time: new Date(hour.datetimeEpoch * 1000).toLocaleTimeString('en-US', { 
          hour: 'numeric',
          hour12: true
        }),
        temperature: hour.temp,
        condition: mapWeatherCondition(hour.conditions, hour.temp)
      })),
      dailyForecast: response.data.days.slice(1, 8).map((day: any) => ({
        date: new Date(day.datetimeEpoch * 1000).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        }),
        high: day.tempmax,
        low: day.tempmin,
        condition: mapWeatherCondition(day.conditions)
      }))
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