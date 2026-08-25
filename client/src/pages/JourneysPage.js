import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import journeyService from '../services/journeyService';
import { getErrorMessage } from '../api/client';
import JourneyCard from '../components/JourneyCard';
import JourneyCardSkeleton from '../components/JourneyCardSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import LocationAutocomplete from '../components/LocationAutocomplete';
import Icon from '../components/Icon';
import { todayForInput } from '../utils/formatDate';

const TRANSPORT_OPTIONS = [
  { value: '', label: 'Any transport' },
  { value: 'bus', label: 'Bus' },
  { value: 'train', label: 'Train' },
  { value: 'flight', label: 'Flight' },
  { value: 'car', label: 'Car' },
  { value: 'other', label: 'Other' },
];

const EMPTY_FILTERS = {
  destination: '',
  departureDate: '',
  university: '',
  transportMode: '',
  lat: '',
  lng: '',
};

const JourneysPage = () => {
  // The URL is the single source of truth for the active filters, so a search
  // is shareable and the back button works.
  const [searchParams, setSearchParams] = useSearchParams();
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeFilters = useMemo(
    () => ({
      destination: searchParams.get('destination') || '',
      departureDate: searchParams.get('departureDate') || '',
      university: searchParams.get('university') || '',
      transportMode: searchParams.get('transportMode') || '',
      lat: searchParams.get('lat') || '',
      lng: searchParams.get('lng') || '',
    }),
    [searchParams]
  );

  const [draft, setDraft] = useState(activeFilters);

  // Keep the form in step when the URL changes from elsewhere (home search,
  // browser back, a shared link).
  useEffect(() => setDraft(activeFilters), [activeFilters]);

  const fetchJourneys = useCallback(async (filters) => {
    try {
      setLoading(true);
      setError(null);
      setJourneys(await journeyService.getJourneys(filters));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load journeys'));
      setJourneys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJourneys(activeFilters);
  }, [activeFilters, fetchJourneys]);

  const applyFilters = (event) => {
    event.preventDefault();

    const next = {};
    Object.entries(draft).forEach(([key, value]) => {
      if (value) next[key] = value;
    });

    setSearchParams(next);
  };

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setSearchParams({});
  };

  const activeCount = Object.entries(activeFilters).filter(
    ([key, value]) => value && key !== 'lat' && key !== 'lng'
  ).length;

  return (
    <div className="bg-ink-50">
      <div className="border-b border-ink-100 bg-white">
        <div className="container py-10">
          <h1 className="text-3xl sm:text-4xl">Find travel companions</h1>
          <p className="mt-3 max-w-xl text-ink-500">
            Browse trips with seats still open, or narrow it down to your route and dates.
          </p>
        </div>
      </div>

      <div className="container py-8">
        <form onSubmit={applyFilters} className="card p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-4">
            <div>
              <label htmlFor="filter-destination" className="label">
                Destination
              </label>
              <LocationAutocomplete
                id="filter-destination"
                placeholder="Where are you going?"
                value={draft.destination}
                onTextChange={(destination) =>
                  setDraft((prev) => ({ ...prev, destination, lat: '', lng: '' }))
                }
                onPlaceSelect={(place) =>
                  setDraft((prev) => ({
                    ...prev,
                    lat: place ? place.lat : '',
                    lng: place ? place.lng : '',
                  }))
                }
              />
            </div>

            <div>
              <label htmlFor="filter-date" className="label">
                Departure date
              </label>
              <input
                id="filter-date"
                type="date"
                min={todayForInput()}
                value={draft.departureDate}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, departureDate: event.target.value }))
                }
                className="input"
              />
            </div>

            <div>
              <label htmlFor="filter-university" className="label">
                University
              </label>
              <input
                id="filter-university"
                type="text"
                placeholder="Any campus"
                value={draft.university}
                onChange={(event) => setDraft((prev) => ({ ...prev, university: event.target.value }))}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="filter-transport" className="label">
                Transport
              </label>
              <select
                id="filter-transport"
                value={draft.transportMode}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, transportMode: event.target.value }))
                }
                className="select"
              >
                {TRANSPORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="submit" className="btn-primary">
              <Icon name="search" className="h-4 w-4" />
              Apply filters
            </button>
            {activeCount > 0 && (
              <button type="button" onClick={clearFilters} className="btn-ghost">
                Clear {activeCount} filter{activeCount === 1 ? '' : 's'}
              </button>
            )}
            {activeFilters.lat && (
              <span className="badge-completed">
                <Icon name="mapPin" className="h-3 w-3" />
                Searching nearby
              </span>
            )}
          </div>
        </form>

        {error && <ErrorMessage error={error} className="mt-6" />}

        <div className="mt-8">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((key) => (
                <JourneyCardSkeleton key={key} />
              ))}
            </div>
          ) : journeys.length === 0 ? (
            <EmptyState
              icon="search"
              title="No journeys match your search"
              description={
                activeCount > 0
                  ? 'Try widening the dates or clearing a filter — or post the trip yourself and let others join you.'
                  : 'Nothing has been posted yet. Be the first to add a journey.'
              }
              actionLabel="Post a journey"
              actionTo="/create-journey"
            />
          ) : (
            <>
              <p className="mb-5 text-sm text-ink-500">
                {journeys.length} journey{journeys.length === 1 ? '' : 's'} found
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {journeys.map((journey) => (
                  <JourneyCard key={journey._id} journey={journey} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JourneysPage;
