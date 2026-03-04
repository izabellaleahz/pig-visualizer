import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { preloadData } from './utils/api';

// Start preloading data immediately (runs in background)
preloadData();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
// Build cache invalidation: 1770136390
