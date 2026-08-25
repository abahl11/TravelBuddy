import React from 'react';
import Icon from './Icon';

const VARIANTS = {
  error: 'alert-error',
  success: 'alert-success',
  info: 'alert-info',
  warning: 'alert-warning',
};

const ICONS = {
  error: 'alert',
  success: 'check',
  info: 'info',
  warning: 'alert',
};

/** Renders nothing when there is no message, so callers can drop it in freely. */
const ErrorMessage = ({ error, variant = 'error', className = '', onDismiss }) => {
  if (!error) return null;

  const message = typeof error === 'string' ? error : 'An error occurred. Please try again.';

  return (
    <div className={`${VARIANTS[variant] || VARIANTS.error} ${className}`} role="alert">
      <Icon name={ICONS[variant]} className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
          <Icon name="x" className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
