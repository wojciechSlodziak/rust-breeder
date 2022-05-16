export interface ScreenCaptureServiceEventListenerCallback {
  (eventType: 'SAPLING-FOUND' | 'STARTED' | 'STOPPED', data?: string): void;
}
