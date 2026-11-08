import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from './components/common/ErrorBoundary';
import './style.css';
const root = createRoot(document.getElementById('root')!);
import('./App').then(({ default: App }) => {
  root.render(<StrictMode><ErrorBoundary><App /></ErrorBoundary></StrictMode>);
}).catch(error => {
  root.render(<main className="max-w-xl mx-auto p-8 space-y-4"><h1 className="text-2xl font-bold">nanoLabs could not start</h1><p role="alert">{error instanceof Error ? error.message : 'The application configuration could not be loaded.'}</p><button onClick={() => window.location.reload()} className="underline">Retry</button></main>);
});
