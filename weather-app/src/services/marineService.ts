import axios from 'axios';
import { SeaData } from '@/types/weather';

interface MarineResponse {
  hourly: {
    time: string[];
    wave_height: number[];
    wave_direction: number[];
    wave_period: number[];
    wind_wave_height: number[];
    wind_wave_direction: number[];
    wind_wave_period: number[];
    swell_wave_height: number[];
    swell_wave_direction: number[];
    swell_wave_period: number[];
  };
  hourly_units: {
    wave_height: string;
    wave_direction: string;
    wave_period: string;
  };
  utc_offset_seconds: number;
}

export async function fetchMarineData(lat: number, lon: number): Promise<SeaData | undefined> {
  try {
    const response = await axios.get<MarineResponse>(
      `https://marine-api.open-meteo.com/v1/marine?` +
      `latitude=${lat}&longitude=${lon}` +
      `&hourly=wave_height,wave_direction,wave_period,` +
      `wind_wave_height,wind_wave_direction,wind_wave_period,` +
      `swell_wave_height,swell_wave_direction,swell_wave_period` +
      `&timezone=auto`
    );

    // Get current hour's data
    const now = new Date();
    const hours = now.getHours();
    
    // Find the closest time in the hourly data
    const currentIndex = response.data.hourly.time.findIndex(time => {
      const timeHours = new Date(time).getHours();
      return timeHours === hours;
    });

    if (currentIndex === -1) return undefined;

    // Verify if we have valid wave height data
    const waveHeight = response.data.hourly.wave_height[currentIndex];

    // Only return data if we have wave height
    if (waveHeight === null) return undefined;

    return {
      temperature: 0, // Set to 0 since it's not available
      waveHeight: waveHeight,
      waveDirection: response.data.hourly.wave_direction[currentIndex],
      wavePeriod: response.data.hourly.wave_period[currentIndex],
      swellHeight: response.data.hourly.swell_wave_height[currentIndex],
      swellDirection: response.data.hourly.swell_wave_direction[currentIndex],
      swellPeriod: response.data.hourly.swell_wave_period[currentIndex],
      units: {
        waveHeight: response.data.hourly_units.wave_height,
        direction: response.data.hourly_units.wave_direction,
        period: response.data.hourly_units.wave_period
      }
    };
  } catch (error) {
    console.error('Error fetching marine data:', error);
    return undefined;
  }
}