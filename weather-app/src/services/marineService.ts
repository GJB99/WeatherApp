import axios from 'axios';

const WEATHERAPI_KEY = process.env.NEXT_PUBLIC_WEATHERAPI_API_KEY;

export async function fetchMarineData(lat: number, lon: number) {
  try {
    const response = await axios.get(
      `http://api.weatherapi.com/v1/marine.json?key=${WEATHERAPI_KEY}&q=${lat},${lon}&days=1`
    );

    const currentHour = response.data.forecast.forecastday[0].hour.find((h: any) => {
      const hourTime = new Date(h.time).getHours();
      const currentTime = new Date().getHours();
      return hourTime === currentTime;
    });

    // Get tides data directly from the forecast
    const tidesData = response.data.forecast.forecastday[0].day.tides[0].tide;
    let tides = [];

    if (tidesData) {
      tides = tidesData.map((tide: any) => ({
        time: new Date(tide.tide_time).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        type: tide.tide_type.toLowerCase(),
        height: parseFloat(tide.tide_height_mt)
      }));
    }

    return {
      temperature: Math.round(currentHour.water_temp_c),
      location: 'Nearest coast',
      tides: tides
    };
  } catch (error) {
    console.error('Error fetching marine data:', error);
    return null;
  }
}