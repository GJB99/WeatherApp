export interface WeatherData {
  temperature: number;
  condition: WeatherCondition;
  location: string;
  currentDate: string;
  todayForecast: {
    high: number;
    low: number;
  };
  details: {
    time: string;
    windSpeed: number;
    uvIndex: number;
    rainChance: number;
  };
  tomorrowForecast: {
    high: number;
    low: number;
    description: string;
    condition: WeatherCondition;
  };
  hourlyForecast: HourlyForecast[];
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  condition: WeatherCondition;
}

export type WeatherCondition = 'sunny' | 'rainy' | 'icy' | 'overcast' | 'windy' | 'cloudy';