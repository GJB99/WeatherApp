import { fetchWeatherApi } from 'openmeteo';
import { PollenTypeInfo } from '@/types/pollen';

export async function fetchAirQualityData(lat: number, lon: number) {
  try {
    const params = {
      latitude: lat,
      longitude: lon,
      current: ["european_aqi", "us_aqi", "pm10", "pm2_5", "carbon_monoxide", "nitrogen_dioxide", "sulphur_dioxide", "ozone"],
      forecast_days: 1
    };
    
    const responses = await fetchWeatherApi("https://air-quality-api.open-meteo.com/v1/air-quality", params);
    const response = responses[0];
    const current = response.current()!;

    // Map the indices to their respective values
    const europeanAqi = current.variables(0)?.value() || 0;
    const pm10 = current.variables(2)?.value() || 0;
    const pm25 = current.variables(3)?.value() || 0;
    const co = current.variables(4)?.value() || 0;
    const no2 = current.variables(5)?.value() || 0;
    const so2 = current.variables(6)?.value() || 0;
    const o3 = current.variables(7)?.value() || 0;

    const pollutants = {
      co,
      no2,
      o3,
      pm10,
      pm25
    };

    // Find the dominant pollutant
    const dominantPollutant = Object.entries(pollutants)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0]
      .toUpperCase();

    return {
      aqi: europeanAqi,
      description: getAQIDescription(europeanAqi),
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

export async function fetchPollenData(lat: number, lon: number) {
  try {
    const params = {
      latitude: lat,
      longitude: lon,
      current: ["alder_pollen", "birch_pollen", "grass_pollen", "mugwort_pollen", "olive_pollen", "ragweed_pollen"],
      forecast_days: 1
    };
    
    const responses = await fetchWeatherApi("https://air-quality-api.open-meteo.com/v1/air-quality", params);
    const response = responses[0];
    const current = response.current()!;

    const getPollenCategory = (value: number): PollenTypeInfo['category'] => {
      if (value >= 50) return 'Very High';
      if (value >= 35) return 'High';
      if (value >= 20) return 'Moderate';
      return 'Low';
    };

    const createPollenInfo = (value: number): PollenTypeInfo => ({
      value: value || 0,
      category: getPollenCategory(value || 0),
      inSeason: value > 0,
      recommendations: []
    });

    // Map the indices to their respective values
    const alderPollen = current.variables(0)?.value() || 0;
    const birchPollen = current.variables(1)?.value() || 0;
    const grassPollen = current.variables(2)?.value() || 0;
    const mugwortPollen = current.variables(3)?.value() || 0;
    const ragweedPollen = current.variables(5)?.value() || 0;

    return {
      grass: createPollenInfo(grassPollen),
      tree: createPollenInfo(Math.max(alderPollen, birchPollen)),
      weed: createPollenInfo(Math.max(mugwortPollen, ragweedPollen))
    };
  } catch (error) {
    console.error('Error fetching pollen data:', error);
    return {
      grass: { value: 0, category: 'Low' as const, inSeason: false, recommendations: [] },
      tree: { value: 0, category: 'Low' as const, inSeason: false, recommendations: [] },
      weed: { value: 0, category: 'Low' as const, inSeason: false, recommendations: [] }
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