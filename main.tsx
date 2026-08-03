import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import "./src/style.css"; // Clean relative path

// Grab the root DOM container safely
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Failed to find the root element. Ensure index.html contains a <div  id='root'></div>");
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
