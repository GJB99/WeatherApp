import axios from 'axios';

interface MarineResponse {
  hourly: {
    time: string[];
    wave_height: number[];
    water_temperature: number[];
  };
  utc_offset_seconds: number;
}

export async function fetchMarineData(lat: number, lon: number, is24Hour: boolean) {
  try {
    const response = await axios.get<MarineResponse>(
      `https://marine-api.open-meteo.com/v1/marine?` +
      `latitude=${lat}&longitude=${lon}` +
      `&hourly=wave_height,water_temperature` +
      `&timezone=auto`
    );

    // Get current hour's data
    const currentHour = new Date().getHours();
    const currentIndex = response.data.hourly.time.findIndex(time => {
      const hour = new Date(time).toLocaleTimeString('en-US', {
        hour: is24Hour ? '2-digit' : 'numeric',
        hour12: !is24Hour
      });
      return new Date(time).getHours() === currentHour;
    });

    if (currentIndex === -1) {
      throw new Error('Could not find current hour data');
    }

    return {
      temperature: Math.round(response.data.hourly.water_temperature[currentIndex]),
      location: "Coastal Waters",
      waveHeight: Math.round(response.data.hourly.wave_height[currentIndex] * 10) / 10
    };
  } catch (error) {
    console.error('Error fetching marine data:', error);
    return undefined;
  }
}