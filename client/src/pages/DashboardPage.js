import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useJourney } from '../contexts/JourneyContext';
import JourneyCard from '../components/JourneyCard';
import JourneyCardSkeleton from '../components/JourneyCardSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import Icon from '../components/Icon';
import { isPast } from '../utils/formatDate';

const TABS = [
  { id: 'created', label: 'Posted by you' },
  { id: 'joined', label: 'Joined' },
  { id: 'past', label: 'Past trips' },
];

const DashboardPage = () => {
  const { user } = useAuth();
  const { userJourneys, joinedJourneys, loadingMine, error } = useJourney();
  const [tab, setTab] = useState('created');

  const { created, joined, past, pendingRequests } = useMemo(() => {
    const isUpcoming = (journey) =>
      !isPast(journey.departureDate) && journey.status !== 'completed' && journey.status !== 'cancelled';

    // A journey the user joined but was declined for is not "theirs" any more.
    const activeJoined = joinedJourneys.filter((journey) =>
      journey.companions?.some(
        (companion) =>
          (companion.user?._id || companion.user) === user?._id && companion.status !== 'rejected'
      )
    );

    return {
      created: userJourneys.filter(isUpcoming),
      joined: activeJoined.filter(isUpcoming),
      past: [...userJourneys, ...activeJoined].filter((journey) => !isUpcoming(journey)),
      // Requests waiting on this user's decision, across everything they posted.
      pendingRequests: userJourneys.reduce(
        (count, journey) =>
          count + (journey.companions?.filter((companion) => companion.status === 'pending').length || 0),
        0
      ),
    };
  }, [userJourneys, joinedJourneys, user?._id]);

  const lists = { created, joined, past };
  const current = lists[tab] || [];

  const stats = [
    { label: 'Journeys posted', value: userJourneys.length, icon: 'route' },
    { label: 'Journeys joined', value: joined.length, icon: 'users' },
    { label: 'Awaiting your reply', value: pendingRequests, icon: 'clock', highlight: pendingRequests > 0 },
    {
      label: 'Your rating',
      value: user?.reviewCount ? `${user.averageRating?.toFixed(1)} ★` : '—',
      icon: 'star',
    },
  ];

  return (
    <div className="bg-ink-50 pb-16">
      <div className="border-b border-ink-100 bg-white">
        <div className="container py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-ink-500">Welcome back</p>
              <h1 className="mt-1 text-3xl sm:text-4xl">{user?.fullName?.split(' ')[0] || 'there'}</h1>
            </div>
            <Link to="/create-journey" className="btn-primary">
              <Icon name="plus" className="h-4 w-4" />
              Post a journey
            </Link>
          </div>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`rounded-2xl border p-4 ${
                  stat.highlight ? 'border-accent-200 bg-accent-50' : 'border-ink-100 bg-ink-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    name={stat.icon}
                    className={`h-4 w-4 ${stat.highlight ? 'text-accent-600' : 'text-ink-400'}`}
                  />
                  <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">
                    {stat.label}
                  </dt>
                </div>
                <dd className="mt-2 font-display text-2xl font-bold text-ink-950">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="container py-8">
        {error && <ErrorMessage error={error} className="mb-6" />}

        <div className="flex flex-wrap gap-2" role="tablist">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                tab === item.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50'
              }`}
            >
              {item.label}
              <span className={`ml-1.5 ${tab === item.id ? 'text-white/70' : 'text-ink-400'}`}>
                {lists[item.id].length}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          {loadingMine ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((key) => (
                <JourneyCardSkeleton key={key} />
              ))}
            </div>
          ) : current.length === 0 ? (
            <EmptyState
              icon={tab === 'joined' ? 'users' : 'route'}
              title={
                tab === 'created'
                  ? 'You have not posted a journey yet'
                  : tab === 'joined'
                    ? 'You have not joined a journey yet'
                    : 'No past trips yet'
              }
              description={
                tab === 'created'
                  ? 'Post where you are heading and let people on your campus join you.'
                  : tab === 'joined'
                    ? 'Browse open journeys and ask to join one that matches your route.'
                    : 'Completed and cancelled journeys will show up here.'
              }
              actionLabel={tab === 'created' ? 'Post a journey' : tab === 'joined' ? 'Find journeys' : undefined}
              actionTo={tab === 'created' ? '/create-journey' : tab === 'joined' ? '/journeys' : undefined}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {current.map((journey) => (
                <JourneyCard key={journey._id} journey={journey} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
