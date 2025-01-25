import axios from 'axios';

interface MarineResponse {
  hourly: {
    time: string[];
    wave_height: number[];
    sea_surface_temperature: number[];
  };
  utc_offset_seconds: number;
}

export async function fetchMarineData(lat: number, lon: number) {
  try {
    const response = await axios.get<MarineResponse>(
      `https://marine-api.open-meteo.com/v1/marine?` +
      `latitude=${lat}&longitude=${lon}` +
      `&hourly=wave_height,sea_surface_temperature` +
      `&timezone=auto`
    );

    // Get current hour's data
    const now = new Date();
    const currentUTCHour = now.getUTCHours();
    const currentIndex = response.data.hourly.time.findIndex(time => 
      new Date(time).getUTCHours() === currentUTCHour
    );

    if (currentIndex === -1) {
      throw new Error('Could not find current hour data');
    }

    return {
      temperature: Math.round(response.data.hourly.sea_surface_temperature[currentIndex]),
      location: "Coastal Waters",
      waveHeight: Math.round(response.data.hourly.wave_height[currentIndex] * 10) / 10
    };
  } catch (error) {
    console.error('Error fetching marine data:', error);
    return undefined;
  }
}