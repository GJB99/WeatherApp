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
    uvIndex: number;
    rainChance: number;
    humidity: number;
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
}

export interface DailyForecast {
  date: string;
  high: number;
  low: number;
  condition: WeatherCondition;
}

export type WeatherCondition = 'sunny' | 'rainy' | 'icy' | 'overcast' | 'windy' | 'cloudy';