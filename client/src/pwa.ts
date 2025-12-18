export function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.log("Service worker registration failed:", err);
    });
  });
}

export function checkForUpdate() {
  if (!("serviceWorker" in navigator)) return;
  
  navigator.serviceWorker.getRegistration().then((reg) => {
    if (reg) {
      reg.update();
    }
  });
}
