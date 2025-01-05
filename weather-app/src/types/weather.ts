export interface WeatherData {
  temperature: number;
  condition: 'sunny' | 'rainy' | 'icy' | 'overcast' | 'windy';
  location: string;
  hourlyForecast: HourlyForecast[];
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  condition: 'sunny' | 'rainy' | 'icy' | 'overcast' | 'windy';
} 