export interface WeatherData {
  temperature: number;
  feelslike: number;
  condition: WeatherCondition;
  location: string;
  currentDate: string;
  sunrise: string;
  sunset: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  todayForecast: {
    high: number;
    low: number;
  };
  details: {
    time: string;
    windSpeed: number;
    windDirection: number;
    uvIndex: number;
    maxUV: number;
    minUV: number;
    rainChance: number;
    humidity: number;
    airQuality: {
      aqi: number;
      description: string;
      pollutants: {
        co: number;
        no2: number;
        o3: number;
        pm10: number;
        pm25: number;
      };
    };
    pollen: {
      grass: {
        value: number;
        category: string;
        inSeason: boolean;
        recommendations: string[];
      };
      tree: {
        value: number;
        category: string;
        inSeason: boolean;
        recommendations: string[];
      };
      weed: {
        value: number;
        category: string;
        inSeason: boolean;
        recommendations: string[];
      };
    };
  };
  tomorrowForecast: {
    high: number;
    low: number;
    description: string;
    condition: WeatherCondition;
  };
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecast[];
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  condition: WeatherCondition;
  precipChance: number;
}

export interface DailyForecast {
  date: string;
  high: number;
  low: number;
  condition: WeatherCondition;
  precipChance: number;
}

export type WeatherCondition = 'sunny' | 'rainy' | 'icy' | 'overcast' | 'windy' | 'cloudy';