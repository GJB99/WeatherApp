import axios from 'axios';
import { SeaData } from '@/types/weather';

const WEATHERAPI_KEY = process.env.NEXT_PUBLIC_WEATHERAPI_API_KEY;

export async function fetchMarineData(lat: number, lon: number, is24Hour: boolean): Promise<SeaData | undefined> {
  try {
    // First, find the nearest coastal location
    const coastalResponse = await axios.get(
      `http://api.weatherapi.com/v1/search.json?key=${WEATHERAPI_KEY}&q=${lat},${lon}`
    );

    // Filter for coastal locations and get the nearest one
    const coastalLocation = coastalResponse.data.find((loc: any) => 
      loc.country === 'Netherlands' && ['Beach'].some(term => 
        loc.name.toLowerCase().includes(term) || 
        loc.region.toLowerCase().includes(term)
      )
    ) || coastalResponse.data[0]; // Fallback to first result if no coastal location found

    // Get marine data for the coastal location
    const response = await axios.get(
      `http://api.weatherapi.com/v1/marine.json?key=${WEATHERAPI_KEY}&q=${coastalLocation.lat},${coastalLocation.lon}&days=1`
    );

    const currentHour = response.data.forecast.forecastday[0].hour.find((h: any) => {
      const hourTime = new Date(h.time).getHours();
      const currentTime = new Date().getHours();
      return hourTime === currentTime;
    });

    const tidesData = response.data.forecast.forecastday[0].day.tides[0].tide;
    let tides = [];

    if (tidesData) {
      tides = tidesData.map((tide: any) => ({
        time: new Date(tide.tide_time).toLocaleTimeString('en-US', {
          hour: is24Hour ? '2-digit' : 'numeric',
          minute: '2-digit',
          hour12: !is24Hour
        }),
        type: tide.tide_type.toLowerCase(),
        height: parseFloat(tide.tide_height_mt)
      }));
    }

    return {
      temperature: Math.round(currentHour.water_temp_c),
      location: coastalLocation.name,
      tides: tides
    };
  } catch (error) {
    console.error('Error fetching marine data:', error);
    return undefined;
  }
}