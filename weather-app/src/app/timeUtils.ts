export function isNighttime(currentTime: Date, sunriseStr: string, sunsetStr: string, timezone: string): boolean {
  // Convert the current time to the location's timezone
  const locationTime = new Date(currentTime.toLocaleString('en-US', { timeZone: timezone }));
  const today = locationTime.toDateString();
  
  // Parse the times using the same date for proper comparison
  const sunrise = new Date(`${today} ${sunriseStr}`);
  const sunset = new Date(`${today} ${sunsetStr}`);
  
  // Convert all times to minutes since midnight for comparison
  const currentMinutes = locationTime.getHours() * 60 + locationTime.getMinutes();
  const sunriseMinutes = sunrise.getHours() * 60 + sunrise.getMinutes();
  const sunsetMinutes = sunset.getHours() * 60 + sunset.getMinutes();
  
  return currentMinutes < sunriseMinutes || currentMinutes > sunsetMinutes;
}