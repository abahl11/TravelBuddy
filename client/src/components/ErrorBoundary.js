import React from 'react';
import Icon from './Icon';

/**
 * Catches render-time crashes so one broken page shows a recovery screen
 * instead of unmounting the whole app to a blank white document.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <Icon name="alert" className="h-7 w-7" />
        </span>
        <h1 className="mt-6 text-2xl">Something went wrong</h1>
        <p className="mt-3 max-w-md text-ink-500">
          This page hit an unexpected error. Reloading usually clears it.
        </p>
        <button type="button" onClick={() => window.location.reload()} className="btn-primary mt-8">
          Reload the page
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
