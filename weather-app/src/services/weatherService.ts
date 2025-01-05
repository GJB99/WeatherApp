import axios from 'axios';
import { WeatherData } from '@/types/weather';

const WEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GOOGLE_BASE_URL = 'https://airquality.googleapis.com/v1';

export async function fetchWeatherData(latitude: number, longitude: number): Promise<WeatherData> {
  try {
    const response = await axios.get(
      `${WEATHER_BASE_URL}/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,daily,alerts&units=metric&appid=${WEATHER_API_KEY}`
    );

    const current = response.data.current;
    const hourly = response.data.hourly;

    // Get location name using OpenWeather Geocoding API
    const geoResponse = await axios.get(
      `http://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${WEATHER_API_KEY}`
    );
    const locationName = geoResponse.data[0] ? 
      `${geoResponse.data[0].name}, ${geoResponse.data[0].country}` : 
      'Unknown Location';

    return {
      temperature: current.temp,
      condition: mapWeatherCondition(current.weather[0].main),
      location: locationName,
      hourlyForecast: hourly.slice(0, 4).map((hour: any) => ({
        time: new Date(hour.dt * 1000).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        temperature: hour.temp,
        condition: mapWeatherCondition(hour.weather[0].main)
      }))
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw error;
  }
}

export async function fetchAirQuality(latitude: number, longitude: number): Promise<any> {
  try {
    const response = await axios.post(
      `${GOOGLE_BASE_URL}/currentConditions:lookup?key=${GOOGLE_API_KEY}`,
      {
        location: {
          latitude: latitude,
          longitude: longitude
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching air quality:', error);
    throw error;
  }
}

function mapWeatherCondition(condition: string): WeatherData['condition'] {
  switch (condition.toLowerCase()) {
    case 'clear':
      return 'sunny';
    case 'rain':
    case 'drizzle':
    case 'thunderstorm':
      return 'rainy';
    case 'snow':
      return 'icy';
    case 'clouds':
      return 'overcast';
    default:
      return 'windy';
  }
}