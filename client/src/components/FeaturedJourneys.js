import React from 'react';
import { Link } from 'react-router-dom';
import { useJourney } from '../contexts/JourneyContext';
import JourneyCard from './JourneyCard';
import JourneyCardSkeleton from './JourneyCardSkeleton';
import EmptyState from './EmptyState';
import ErrorMessage from './ErrorMessage';
import Icon from './Icon';

/**
 * Reads from JourneyContext rather than fetching again, so the home page makes
 * one request for this list instead of two.
 */
const FeaturedJourneys = () => {
  const { featuredJourneys, loadingFeatured, error } = useJourney();

  return (
    <section className="section bg-white">
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="badge-neutral">Leaving soon</span>
            <h2 className="mt-4 text-3xl sm:text-4xl">Journeys looking for company</h2>
            <p className="mt-3 max-w-xl text-ink-500">
              Trips posted by students with seats still open.
            </p>
          </div>

          <Link to="/journeys" className="btn-secondary">
            See all
            <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>

        {error && <ErrorMessage error={error} className="mt-8" />}

        <div className="mt-10">
          {loadingFeatured ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((key) => (
                <JourneyCardSkeleton key={key} />
              ))}
            </div>
          ) : featuredJourneys.length === 0 ? (
            <EmptyState
              icon="route"
              title="No journeys posted yet"
              description="Be the first to post a trip — someone on your campus is probably heading the same way."
              actionLabel="Post a journey"
              actionTo="/create-journey"
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredJourneys.slice(0, 6).map((journey) => (
                <JourneyCard key={journey._id} journey={journey} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedJourneys;
