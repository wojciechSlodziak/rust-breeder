export interface ScreenCaptureServiceEventListenerCallback {
  (eventType: 'SAPLING-FOUND' | 'STARTED' | 'INITIALIZING' | 'STOPPED', data?: string): void;
}
