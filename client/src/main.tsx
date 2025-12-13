import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "leaflet/dist/leaflet.css";

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

async function initMobileApp() {
  if (Capacitor.isNativePlatform()) {
    if (Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const updateStatusBar = async (matches: boolean) => {
        await StatusBar.setStyle({ 
          style: matches ? Style.Dark : Style.Light 
        });
      };
      
      await updateStatusBar(mediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
        updateStatusBar(e.matches);
      };
      
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else {
        mediaQuery.addListener(handleChange);
      }
    }
  }
}

initMobileApp();

createRoot(document.getElementById("root")!).render(<App />);
