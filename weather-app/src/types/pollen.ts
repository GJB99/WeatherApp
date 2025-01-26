export interface PollenTypeInfo {
  value: number;
  category: 'Very High' | 'High' | 'Moderate' | 'Low' | 'Unknown';
  inSeason: boolean;
  recommendations: string[];
}

export interface PollenData {
  grass: PollenTypeInfo;
  tree: PollenTypeInfo;
  weed: PollenTypeInfo;
}

export interface AirQualityData {
  aqi: number;
  description: string;
  dominantPollutant: string;
  pollutants: {
    co: number;
    no2: number;
    o3: number;
    pm10: number;
    pm25: number;
  };
}

export interface PollenAPIResponse {
  dailyInfo: Array<{
    pollenTypeInfo: PollenTypeInfo[];
  }>;
}