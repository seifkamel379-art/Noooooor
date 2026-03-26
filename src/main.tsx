import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Prevent browser refresh (F5, Ctrl+R)
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (
    e.key === 'F5' ||
    (e.ctrlKey && (e.key === 'r' || e.key === 'R'))
  ) {
    e.preventDefault();
  }
  // Prevent Ctrl+/- zoom and Ctrl+0 reset zoom
  if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '_' || e.key === '0')) {
    e.preventDefault();
  }
});

// Prevent Ctrl+scroll zoom
document.addEventListener('wheel', (e: WheelEvent) => {
  if (e.ctrlKey) {
    e.preventDefault();
  }
}, { passive: false });

// Prevent pinch zoom on mobile (touchpad or touch screen)
document.addEventListener('touchmove', (e: TouchEvent) => {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(<App />);
