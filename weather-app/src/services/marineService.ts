import axios from 'axios';

const STORMGLASS_API_KEY = process.env.NEXT_PUBLIC_STORMGLASS_API_KEY;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CachedMarineData {
  data: {
    temperature: number;
    location: string;
    tides: Array<{
      time: string;
      type: string;
      height: number;
    }>;
  };
  timestamp: number;
}

export async function fetchMarineData(lat: number, lon: number) {
  try {
    // Check local storage first
    const cacheKey = `marine-data-${lat.toFixed(2)}-${lon.toFixed(2)}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      const parsed: CachedMarineData = JSON.parse(cachedData);
      const now = Date.now();
      
      // If cache is still valid (less than 24 hours old)
      if (now - parsed.timestamp < CACHE_DURATION) {
        console.log('Using cached marine data');
        return parsed.data;
      }
    }

    // If no cache or expired, fetch new data
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const start = now.toISOString();
    const end = tomorrow.toISOString();

    const [tideResponse, tempResponse] = await Promise.all([
      axios.get(
        `https://api.stormglass.io/v2/tide/extremes/point?lat=${lat}&lng=${lon}&start=${start}&end=${end}`,
        { headers: { 'Authorization': STORMGLASS_API_KEY } }
      ),
      axios.get(
        `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lon}&params=waterTemperature&start=${start}&end=${start}`,
        { headers: { 'Authorization': STORMGLASS_API_KEY } }
      )
    ]);

    const tides = tideResponse.data.data.map((data: any) => ({
      time: new Date(data.time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      type: data.type,
      height: data.height
    }));

    const waterTemp = tempResponse.data.hours[0].waterTemperature.sg;
    
    const marineData = {
      temperature: Math.round(waterTemp),
      location: 'Nearest coast',
      tides: tides.slice(0, 2)
    };

    // Cache the new data
    const cacheData: CachedMarineData = {
      data: marineData,
      timestamp: Date.now()
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log('Cached new marine data');

    return marineData;
  } catch (error) {
    console.error('Error fetching marine data:', error);
    return null;
  }
}