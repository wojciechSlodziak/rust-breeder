export function playAudio(audioElementName: string, volume: number) {
  const audioElement = document.getElementById(audioElementName);
  if (audioElement) {
    const headshotAudio = audioElement.cloneNode() as HTMLElement & {
      volume: string;
      play: () => void;
    };
    if (headshotAudio) {
      headshotAudio.volume = volume.toString();
      headshotAudio.play();
    }
  }
}

export function isScanningAvailable() {
  return navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices;
}
