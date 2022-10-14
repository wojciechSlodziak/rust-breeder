export type ScreenCaptureServiceEventType = 'SAPLING-FOUND' | 'STARTED' | 'INITIALIZING' | 'STOPPED' | 'PREVIEW';
export type PreviewData = {
  imgData: ImageData;
  regionIndex: number;
};
export interface ScreenCaptureServiceEventListenerCallback {
  (eventType: ScreenCaptureServiceEventType, data?: string | PreviewData): void;
}
