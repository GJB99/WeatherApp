import axios from 'axios';

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

export async function fetchAirQualityData(lat: number, lon: number) {
  try {
    const response = await axios.post(
      `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_API_KEY}`,
      {
        location: {
          latitude: lat,
          longitude: lon
        }
      }
    );

    console.log('Air quality response:', response.data);

    if (!response.data?.indexes?.[0]) {
      console.error('No air quality index data in response');
      return null;
    }

    const index = response.data.indexes[0];
    
    return {
      aqi: index.aqi,
      description: index.category || getAQIDescription(index.aqi),
      dominantPollutant: index.dominantPollutant?.toUpperCase() || 'N/A',
      pollutants: {
        co: 0,
        no2: 0,
        o3: 0,
        pm10: 0,
        pm25: 0
      }
    };
  } catch (error) {
    console.error('Error fetching air quality data:', error.response?.data || error);
    return null;
  }
}

function getAQIDescription(aqi: number): string {
  if (aqi >= 80) return 'Excellent';
  if (aqi >= 60) return 'Good';
  if (aqi >= 40) return 'Moderate';
  if (aqi >= 20) return 'Low';
  if (aqi >= 1) return 'Poor';
  return 'Poor';
}

function getAQIColor(aqi: number): string {
  if (aqi >= 80) return 'text-[#009E3A]';  // Excellent (100-80)
  if (aqi >= 60) return 'text-[#84CF33]';  // Good (79-60)
  if (aqi >= 40) return 'text-[#FFFE00]';  // Moderate (59-40)
  if (aqi >= 20) return 'text-[#FF8C00]';  // Low (39-20)
  if (aqi >= 1) return 'text-[#FF0000]';   // Poor (19-1)
  return 'text-[#800000]';                 // Poor (0)
}

export async function fetchPollenData(lat: number, lon: number) {
  try {
    const response = await axios.get(
      `https://pollen.googleapis.com/v1/forecast:lookup?key=${GOOGLE_API_KEY}&location.latitude=${lat}&location.longitude=${lon}&days=1`
    );

    console.log('Pollen response:', response.data);

    if (!response.data?.dailyInfo?.[0]) {
      console.error('No pollen data in response');
      return null;
    }

    const dailyInfo = response.data.dailyInfo[0];
    const pollenTypes = dailyInfo.pollenTypeInfo || [];
    
    const getPollenInfo = (type: string) => {
      const info = pollenTypes.find(p => p.code === type);
      return {
        value: info?.indexInfo?.value || 0,
        category: info?.indexInfo?.category || 'Unknown',
        inSeason: info?.inSeason || false,
        recommendations: info?.healthRecommendations || []
      };
    };

    return {
      grass: getPollenInfo('GRASS'),
      tree: getPollenInfo('TREE'),
      weed: getPollenInfo('WEED')
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