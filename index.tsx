import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import "./style.css"; // Ensure @tailwind directives are imported here
// import ErrorBoundary from './components/common/ErrorBoundary.tsx';
const rootElement = document.getElementById('root');
const noop = () => {};
console.log = noop;
console.info = noop;
console.debug = noop;
if (!rootElement) {
  throw new Error("Failed to find the root mounting element inside index.html");
}

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
<App/>
  </React.StrictMode>
);