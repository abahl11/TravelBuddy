import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationAutocomplete from './LocationAutocomplete';
import Icon from './Icon';
import { todayForInput } from '../utils/formatDate';

/**
 * Home page search. Sends whatever the user gave us to /journeys as query
 * params; coordinates are included only when a suggestion was actually picked,
 * which is what upgrades the server-side search from text match to proximity.
 */
const SearchBar = ({ className = '' }) => {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [coords, setCoords] = useState(null);
  const [departureDate, setDepartureDate] = useState('');
  const [university, setUniversity] = useState('');

  const handlePlaceSelect = (place) => {
    setCoords(place ? { lat: place.lat, lng: place.lng } : null);
  };

  const handleDestinationText = (text) => {
    setDestination(text);
    // Free text no longer matches the previously selected pin.
    setCoords(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const params = new URLSearchParams();

    if (destination) params.set('destination', destination);
    if (coords) {
      params.set('lat', coords.lat);
      params.set('lng', coords.lng);
    }
    if (departureDate) params.set('departureDate', departureDate);
    if (university) params.set('university', university);

    navigate(`/journeys?${params.toString()}`);
  };

  return (
    <div className={`container relative z-20 ${className}`}>
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-ink-100 bg-white p-5 shadow-card-hover sm:p-6"
      >
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr_auto]">
          <div>
            <label htmlFor="search-destination" className="label">
              Where to?
            </label>
            <LocationAutocomplete
              id="search-destination"
              placeholder="Delhi, Mumbai, Chandigarh…"
              value={destination}
              onTextChange={handleDestinationText}
              onPlaceSelect={handlePlaceSelect}
            />
          </div>

          <div>
            <label htmlFor="search-date" className="label">
              When
            </label>
            <input
              id="search-date"
              type="date"
              min={todayForInput()}
              value={departureDate}
              onChange={(event) => setDepartureDate(event.target.value)}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="search-university" className="label">
              University
            </label>
            <input
              id="search-university"
              type="text"
              placeholder="Any campus"
              value={university}
              onChange={(event) => setUniversity(event.target.value)}
              className="input"
            />
          </div>

          <div className="flex items-end">
            <button type="submit" className="btn-primary h-[42px] w-full md:w-auto">
              <Icon name="search" className="h-4 w-4" />
              Search
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
