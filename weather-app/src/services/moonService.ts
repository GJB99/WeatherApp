import axios from 'axios';
import { MoonPhase } from '@/types/weather';

interface ApiMoonPhase {
  date: string;
  phase: string;
  illumination: number;
}

export async function fetchMoonPhases(lat: number, lon: number) {
  try {
    const response = await axios.get(
      `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}/next7days?unitGroup=metric&include=days&key=${process.env.NEXT_PUBLIC_VISUALCROSSING_API_KEY}`
    );

    return response.data.days.map((phase: ApiMoonPhase) => ({
      date: new Date(phase.datetime).toLocaleDateString('en-US', { weekday: 'short' }),
      phase: getMoonPhaseName(phase.moonphase),
      illumination: Math.round((phase.moonphase < 0.5 ? phase.moonphase * 2 : (1 - phase.moonphase) * 2) * 100)
    }));
  } catch (error) {
    console.error('Error fetching moon phases:', error);
    return [];
  }
}

function getMoonPhaseName(phase: number): string {
  if (phase === 0) return 'new moon';
  if (phase < 0.25) return 'waxing crescent';
  if (phase === 0.25) return 'first quarter';
  if (phase < 0.5) return 'waxing gibbous';
  if (phase === 0.5) return 'full moon';
  if (phase < 0.75) return 'waning gibbous';
  if (phase === 0.75) return 'last quarter';
  if (phase < 1) return 'waning crescent';
  return 'new moon';
}