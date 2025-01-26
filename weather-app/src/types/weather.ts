import { AirQualityData, PollenData } from './pollen';

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
  timezone: string;
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
    airQuality: AirQualityData;
    pollen: PollenData;
  };
  tomorrowForecast: {
    high: number;
    low: number;
    description: string;
    condition: WeatherCondition;
  };
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecast[];
  seaData?: SeaData;
  moonPhases?: MoonPhase[];
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
  moonPhase: string;
  moonIllumination: number;
}

export type WeatherCondition = 'sunny' | 'rainy' | 'icy' | 'overcast' | 'windy' | 'cloudy' | 'clear';

export interface SeaData {
  temperature: number;
  waveHeight: number;
  waveDirection: number;
  wavePeriod: number;
  swellHeight: number;
  swellDirection: number;
  swellPeriod: number;
  units: {
    waveHeight: string;
    direction: string;
    period: string;
  };
}

interface MoonPhase {
  date: string;
  phase: string;
  moonIllumination: number;
}