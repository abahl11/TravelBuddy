import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';

/** Consistent "nothing here yet" panel, with an optional next step. */
const EmptyState = ({ icon = 'compass', title, description, actionLabel, actionTo, onAction }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-14 text-center">
    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
      <Icon name={icon} className="h-7 w-7" />
    </span>
    <h3 className="mt-5 text-lg font-semibold">{title}</h3>
    {description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500">{description}</p>}

    {actionLabel && actionTo && (
      <Link to={actionTo} className="btn-primary mt-6">
        {actionLabel}
      </Link>
    )}
    {actionLabel && !actionTo && onAction && (
      <button type="button" onClick={onAction} className="btn-primary mt-6">
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
