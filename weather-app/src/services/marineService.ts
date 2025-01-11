import axios from 'axios';

const WEATHERAPI_KEY = process.env.NEXT_PUBLIC_WEATHERAPI_API_KEY;

interface WeatherLocation {
  name: string;
  country: string;
  region: string;
  lat: number;
  lon: number;
}

interface HourForecast {
  time: string;
  water_temp_c: number;
}

interface TideForecast {
  tide_time: string;
  tide_type: string;
  tide_height_mt: string;
}

interface MarineResponse {
  forecast: {
    forecastday: Array<{
      hour: HourForecast[];
      day: {
        tides: Array<{
          tide: TideForecast[];
        }>;
      };
    }>;
  };
}

interface TideInfo {
  time: string;
  type: 'high' | 'low';
  height: number;
}

export async function fetchMarineData(lat: number, lon: number, is24Hour: boolean) {
  try {
    const coastalResponse = await axios.get(
      `http://api.weatherapi.com/v1/search.json?key=${WEATHERAPI_KEY}&q=${lat},${lon}`
    );

    const coastalLocation = coastalResponse.data.find((loc: WeatherLocation) => 
      loc.country === 'Netherlands' && ['Beach'].some(term => 
        loc.name.toLowerCase().includes(term) || 
        loc.region.toLowerCase().includes(term)
      )
    ) || coastalResponse.data[0];

    const response = await axios.get<MarineResponse>(
      `http://api.weatherapi.com/v1/marine.json?key=${WEATHERAPI_KEY}&q=${coastalLocation.lat},${coastalLocation.lon}&days=1`
    );

    const currentHour = response.data.forecast.forecastday[0].hour.find((h: HourForecast) => {
      const hourTime = new Date(h.time).getHours();
      const currentTime = new Date().getHours();
      return hourTime === currentTime;
    });

    if (!currentHour) {
      throw new Error('Could not find current hour data');
    }

    const tidesData = response.data.forecast.forecastday[0].day.tides[0].tide;
    const tides: TideInfo[] = [];

    if (tidesData) {
      tides.push(...tidesData.map((tide: TideForecast) => ({
        time: new Date(tide.tide_time).toLocaleTimeString('en-US', {
          hour: is24Hour ? '2-digit' : 'numeric',
          minute: '2-digit',
          hour12: !is24Hour
        }),
        type: tide.tide_type.toLowerCase() as 'high' | 'low',
        height: parseFloat(tide.tide_height_mt)
      })));
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