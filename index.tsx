import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import "./style.css"; // Ensure @tailwind directives are imported here

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Failed to find the root mounting element inside index.html");
}

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);