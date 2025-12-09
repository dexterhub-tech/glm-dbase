
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { preloadAuthData, hasStoredSession } from './utils/authPreload'

// Check for stored session synchronously
const hasSession = hasStoredSession();
console.log(`[Main] Stored session check: ${hasSession ? 'Found' : 'Not found'}`);

// Start preloading auth data as early as possible
const preloadPromise = preloadAuthData();

// Render the app immediately
const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Log when preload completes
preloadPromise.then(result => {
  console.log('[Main] Auth preload completed:', result);
}).catch(error => {
  console.error('[Main] Auth preload error:', error);
});
