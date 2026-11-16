/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

interface Window {
  particlesJS?: (tagId: string, params: Record<string, any>) => void;
  pJSDom?: any[];
  pdfjsLib?: any;
  TetrisMusic?: {
    start: () => void;
    stop: () => void;
    toggle: () => void;
    isPlaying: () => boolean;
  };
}
