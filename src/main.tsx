import { StrictMode, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { preloadData } from './utils/api';

// Error boundary to catch and display runtime errors
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
          <h1 style={{ color: 'red' }}>App Error</h1>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error.message}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8em', color: '#666' }}>
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Start preloading data immediately (runs in background)
preloadData();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
