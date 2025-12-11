import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Global error hooks to aid runtime debugging (will log ReferenceErrors such as missing globals)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (ev) => {
    // ev.error may be undefined in some browsers; use message + filename/lineno
    console.error('[GlobalError]', ev.message || ev.error?.message || 'Unknown error', ev.error || ev);
  });
  window.addEventListener('unhandledrejection', (ev) => {
    console.error('[UnhandledRejection]', ev.reason || ev);
  });

  // Defensive default: if some third-party/minified code expects `deletedIds` to exist as an array,
  // provide an empty array to avoid ReferenceError at runtime. This is intentionally non-invasive.
  if (typeof window.deletedIds === 'undefined') {
    try { window.deletedIds = []; } catch (e) { /* ignore in strict environments */ }
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
