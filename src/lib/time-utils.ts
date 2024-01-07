export function timeMsToTimeString(timeMs: number): string {
  const hours = Math.floor(timeMs / 3600000);
  const minutes = Math.floor((timeMs % 3600000) / 60000);
  const seconds = (timeMs % 60000) / 1000;
  const hoursPart = hours > 0 ? `${hours}h:` : '';
  const minutesPart = hours > 0 || minutes > 0 ? `${hours > 0 && minutes < 10 ? '0' : ''}${minutes}m:` : '';
  const secondsPart = `${(hours > 0 || minutes > 0) && seconds < 10 ? '0' : ''}${Math.floor(seconds)}s`;
  return `${hoursPart}${minutesPart}${secondsPart}`;
}
