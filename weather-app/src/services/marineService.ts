import axios from 'axios';
import { SeaData } from '@/types/weather';

interface MarineResponse {
  hourly: {
    time: string[];
    wave_height: number[];
    wave_direction: number[];
    wave_period: number[];
    swell_wave_height: number[];
    swell_wave_direction: number[];
    swell_wave_period: number[];
    sea_surface_temperature: number[];
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
      `&hourly=sea_surface_temperature,wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period` +
      `&timezone=auto`
    );

    // Get current hour's data using precise time matching
    const now = new Date();
    const currentTime = now.toISOString().slice(0, 13); // Get YYYY-MM-DDTHH format
    const currentIndex = response.data.hourly.time.findIndex(t => t.startsWith(currentTime));

    if (currentIndex === -1) return undefined;

    return {
      temperature: response.data.hourly.sea_surface_temperature[currentIndex],
      waveHeight: response.data.hourly.wave_height[currentIndex],
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