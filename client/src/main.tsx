import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

async function initMobileApp() {
  if (Capacitor.isNativePlatform()) {
    await SplashScreen.hide();
    
    if (Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android') {
      await StatusBar.setStyle({ style: Style.Light });
    }
  }
}

initMobileApp();

createRoot(document.getElementById("root")!).render(<App />);
