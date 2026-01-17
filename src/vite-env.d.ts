/// <reference types="vite/client" />

interface Window {
  turnstile?: {
    render: (
      container: HTMLElement,
      options: { sitekey: string; callback: (token: string) => void }
    ) => string;
    reset?: (widgetId?: string) => void;
  };
}
