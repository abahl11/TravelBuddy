import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate, getDaysUntil } from '../utils/formatDate';
import UserAvatar from './UserAvatar';
import Icon, { TRANSPORT_ICONS } from './Icon';
import StatusBadge from './StatusBadge';
import { formatCurrency } from '../utils/formatCurrency';

const TRANSPORT_LABELS = {
  bus: 'Bus',
  train: 'Train',
  flight: 'Flight',
  car: 'Car',
  other: 'Other',
};

const JourneyCard = ({ journey }) => {
  const {
    _id,
    origin,
    destination,
    departureDate,
    transportMode = 'other',
    estimatedCost,
    creator,
    companions = [],
    maxCompanions,
    status,
  } = journey;

  // Only accepted companions occupy a seat; pending requests do not.
  const accepted = companions.filter((companion) => companion.status === 'accepted');
  const seatsLeft = Math.max(0, maxCompanions - accepted.length);
  const countdown = getDaysUntil(departureDate);

  return (
    <article className="card-interactive group flex flex-col overflow-hidden">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-950 p-5">
        <div className="absolute inset-0 bg-grid-faint [background-size:22px_22px]" aria-hidden="true" />
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />

        <div className="relative flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <Icon name={TRANSPORT_ICONS[transportMode]} className="h-3.5 w-3.5" />
            {TRANSPORT_LABELS[transportMode]}
          </span>
          <StatusBadge status={status} onDark />
        </div>

        <div className="relative mt-5 flex items-center gap-3 text-white">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/60">From</p>
            <p className="truncate font-semibold">{origin}</p>
          </div>
          <Icon name="arrowRight" className="h-4 w-4 shrink-0 text-white/50" />
          <div className="min-w-0 flex-1 text-right">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/60">To</p>
            <p className="truncate font-semibold">{destination}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-600">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="calendar" className="h-4 w-4 text-ink-400" />
            {formatDate(departureDate)}
          </span>
          {countdown && (
            <span className="inline-flex items-center gap-1.5 text-ink-500">
              <Icon name="clock" className="h-4 w-4 text-ink-400" />
              {countdown}
            </span>
          )}
        </div>

        {estimatedCost ? (
          <p className="mt-3 text-sm text-ink-600">
            <span className="font-semibold text-ink-900">{formatCurrency(estimatedCost)}</span>
            <span className="text-ink-400"> estimated per person</span>
          </p>
        ) : null}

        <div className="mt-4 flex items-center gap-3 border-t border-ink-100 pt-4">
          <UserAvatar user={creator} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-900">
              {creator?.fullName || creator?.username || 'Unknown'}
            </p>
            <p className="truncate text-xs text-ink-500">{creator?.university || 'Student'}</p>
          </div>
          {creator?.reviewCount > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-ink-600">
              <Icon name="star" filled className="h-3.5 w-3.5 text-amber-400" />
              {creator.averageRating?.toFixed(1)}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {accepted.slice(0, 3).map((companion) => (
                <UserAvatar
                  key={companion.user?._id || companion.joinedAt}
                  user={companion.user}
                  size="xs"
                  className="ring-2 ring-white"
                />
              ))}
            </div>
            <span className="text-xs text-ink-500">
              {seatsLeft > 0 ? `${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} left` : 'Full'}
            </span>
          </div>

          <Link
            to={`/journeys/${_id}`}
            className="btn-secondary btn-sm group-hover:border-primary-300 group-hover:bg-primary-50 group-hover:text-primary-700"
          >
            View
            <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default JourneyCard;
