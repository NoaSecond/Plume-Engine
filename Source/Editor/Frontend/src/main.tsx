import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './ThemeContext'
import { LanguageProvider } from './LanguageContext'

  // Aggressive Zoom Blocking (Runs before React)
  ; (function () {
    const handler = (e: any) => {
      // 1. Block Ctrl+Wheel
      if (e.type === 'wheel') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          // Allow propagation so specific components (ContentBrowser) can handle it
        }
      }
      // 2. Block Key shortcuts (Ctrl + +/-/0)
      else if (e.type === 'keydown') {
        if (e.ctrlKey || e.metaKey) {
          const key = e.key;
          const code = e.code;
          if (
            key === '+' || key === '-' || key === '=' || key === '0' ||
            code === 'NumpadAdd' || code === 'NumpadSubtract' || code === 'Equal' || code === 'Minus' || code === 'Digit0'
          ) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          }
        }
      }
      // 3. Block pinch gestures (Trackpad/Touch)
      else if (e.type === 'gesturestart' || e.type === 'gesturechange' || e.type === 'gestureend') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
      // 4. Block Touch pinch
      else if (e.type === 'touchmove') {
        if (e.touches && e.touches.length > 1) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      }
    };

    const options = { passive: false, capture: true };
    window.addEventListener('wheel', handler, options);
    window.addEventListener('keydown', handler, options);
    window.addEventListener('gesturestart', handler, options);
    window.addEventListener('gesturechange', handler, options);
    window.addEventListener('gestureend', handler, options);
    window.addEventListener('touchmove', handler, options);
  })();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
