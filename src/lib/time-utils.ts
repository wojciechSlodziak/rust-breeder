export function timeMsToTimeString(timeMs: number): string {
  const hours = Math.floor(timeMs / 3600000);
  const minutes = Math.floor((timeMs % 3600000) / 60000);
  const seconds = (timeMs % 60000) / 1000;
  const hoursPart = hours > 0 ? `${hours}h:` : '';
  const minutesPart = hours > 0 || minutes > 0 ? `${minutes < 10 ? '0' : ''}${minutes}m:` : '';
  return `${hoursPart}${minutesPart}${seconds.toFixed(0)}s`;
}
