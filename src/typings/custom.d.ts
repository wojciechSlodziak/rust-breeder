declare module 'worker-loader!*' {
  class WebpackWorker extends Worker {
    constructor();
  }

  export default WebpackWorker;
}

declare const enableGtag: Function;

interface Window {
  adsbygoogle: { [key: string]: unknown }[];
}
