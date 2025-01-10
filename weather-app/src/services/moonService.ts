import axios from 'axios';

export async function fetchMoonPhases(startDate: string, days: number = 7) {
  try {
    const response = await axios.get(
      `https://aa.usno.navy.mil/api/moon/phases/date?date=${startDate}&ndays=${days}`
    );

    return response.data.phases.map(phase => ({
      date: new Date(phase.date).toLocaleDateString('en-US', { weekday: 'short' }),
      phase: phase.phase,
      illumination: phase.illumination
    }));
  } catch (error) {
    console.error('Error fetching moon phases:', error);
    return null;
  }
}