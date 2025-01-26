import axios from 'axios';
import { PollenTypeInfo } from '@/types/pollen';

interface AirQualityResponse {
  current: {
    time: number;
    european_aqi: number;
    us_aqi: number;
    pm10: number;
    pm2_5: number;
    carbon_monoxide: number;
    nitrogen_dioxide: number;
    sulphur_dioxide: number;
    ozone: number;
    dust: number;
    alder_pollen: number;
    birch_pollen: number;
    grass_pollen: number;
    mugwort_pollen: number;
    olive_pollen: number;
    ragweed_pollen: number;
  };
}

export async function fetchAirQualityData(lat: number, lon: number) {
  try {
    const response = await axios.get<AirQualityResponse>(
      `https://air-quality-api.open-meteo.com/v1/air-quality?` +
      `latitude=${lat}&longitude=${lon}` +
      `&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust`
    );

    const data = response.data.current;
    
    // Map pollutants to our existing structure
    const pollutants = {
      co: data.carbon_monoxide || 0,
      no2: data.nitrogen_dioxide || 0,
      o3: data.ozone || 0,
      pm10: data.pm10 || 0,
      pm25: data.pm2_5 || 0
    };
    
    // Find the dominant pollutant
    const dominantPollutant = Object.entries(pollutants)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0]
      .toUpperCase();

    return {
      aqi: data.european_aqi || 0,
      description: getAQIDescription(data.european_aqi || 0),
      dominantPollutant,
      pollutants
    };
  } catch (error) {
    console.error('Error fetching air quality data:', error);
    return {
      aqi: 0,
      description: 'Unknown',
      dominantPollutant: 'Unknown',
      pollutants: {
        co: 0,
        no2: 0,
        o3: 0,
        pm10: 0,
        pm25: 0
      }
    };
  }
}

export function getAQIDescription(aqi: number): string {
  if (aqi <= 20) return 'Good';
  if (aqi <= 40) return 'Fair';
  if (aqi <= 60) return 'Moderate';
  if (aqi <= 80) return 'Poor';
  if (aqi <= 100) return 'Very Poor';
  return 'Extremely Poor';
}

export function getAQIColor(aqi: number): string {
  if (aqi <= 20) return 'text-green-400';   // Good
  if (aqi <= 40) return 'text-yellow-300';  // Fair
  if (aqi <= 60) return 'text-orange-400';  // Moderate
  if (aqi <= 80) return 'text-red-400';     // Poor
  if (aqi <= 100) return 'text-red-500';    // Very Poor
  return 'text-purple-500';                 // Extremely Poor
}

export async function fetchPollenData(lat: number, lon: number) {
  try {
    const response = await axios.get(
      `https://air-quality-api.open-meteo.com/v1/air-quality?` +
      `latitude=${lat}&longitude=${lon}` +
      `&current=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen`
    );

    const data = response.data.current;

    const getPollenCategory = (value: number) => {
      if (value >= 50) return 'Very High';
      if (value >= 35) return 'High';
      if (value >= 20) return 'Moderate';
      return 'Low';
    };

    const createPollenInfo = (value: number) => ({
      value: value || 0,
      category: getPollenCategory(value || 0),
      inSeason: value > 0,
      recommendations: []
    });

    return {
      grass: createPollenInfo(data.grass_pollen),
      tree: createPollenInfo(Math.max(data.birch_pollen || 0, data.alder_pollen || 0)),
      weed: createPollenInfo(Math.max(data.mugwort_pollen || 0, data.ragweed_pollen || 0))
    };
  } catch (error) {
    console.error('Error fetching pollen data:', error);
    return {
      grass: { value: 0, category: 'Unknown', inSeason: false, recommendations: [] },
      tree: { value: 0, category: 'Unknown', inSeason: false, recommendations: [] },
      weed: { value: 0, category: 'Unknown', inSeason: false, recommendations: [] }
    };
  }
}