import axios from 'axios';
import { MoonPhase, MoonAPIResponse } from '@/types/moon';

export async function fetchMoonPhases(startDate: string, days: number = 7) {
  try {
    const response = await axios.get<MoonAPIResponse>(
      `https://aa.usno.navy.mil/api/moon/phases/date?date=${startDate}&ndays=${days}`
    );

    return response.data.phases.map((phase: MoonPhase) => ({
      date: new Date(phase.date).toLocaleDateString('en-US', { weekday: 'short' }),
      phase: phase.phase,
      moonIllumination: phase.moonIllumination
    }));
  } catch (error) {
    console.error('Error fetching moon phases:', error);
    return null;
  }
}