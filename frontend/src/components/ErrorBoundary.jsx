import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary — catches render-time errors and shows a friendly fallback.
 * Prevents the whole app from going blank on unexpected errors.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production, send to error tracking (e.g. Sentry)
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-md w-full card text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-3 text-left text-xs bg-slate-100 dark:bg-slate-800 rounded-lg p-3 overflow-auto text-red-500 max-h-40">
                {this.state.error.toString()}
              </pre>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
}
