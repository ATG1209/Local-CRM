console.log("=== INDEX.TSX LOADED ===");

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import './index.css';

console.log("index.tsx: Mounting React app...");

const rootElement = document.getElementById('root');
console.log("rootElement:", rootElement);

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
console.log("React root created");

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

console.log("=== RENDER CALLED ===");