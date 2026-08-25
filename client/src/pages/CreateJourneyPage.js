import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useJourney } from '../contexts/JourneyContext';
import { getErrorMessage } from '../api/client';
import LocationAutocomplete from '../components/LocationAutocomplete';
import ErrorMessage from '../components/ErrorMessage';
import Icon, { TRANSPORT_ICONS } from '../components/Icon';
import { todayForInput } from '../utils/formatDate';

const TRANSPORT_MODES = [
  { value: 'bus', label: 'Bus' },
  { value: 'train', label: 'Train' },
  { value: 'flight', label: 'Flight' },
  { value: 'car', label: 'Car' },
  { value: 'other', label: 'Other' },
];

const INITIAL_FORM = {
  origin: '',
  originCoords: null,
  destination: '',
  destinationCoords: null,
  departureDate: '',
  returnDate: '',
  transportMode: 'bus',
  estimatedCost: '',
  maxCompanions: 3,
  description: '',
  visibility: 'public',
};

const CreateJourneyPage = () => {
  const navigate = useNavigate();
  const { createJourney } = useJourney();

  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleChange = (event) => setField(event.target.name, event.target.value);

  const validate = () => {
    const errors = {};

    if (!form.origin.trim()) errors.origin = 'Where are you leaving from?';
    if (!form.destination.trim()) errors.destination = 'Where are you going?';
    if (!form.departureDate) errors.departureDate = 'Pick a departure date';

    if (form.departureDate && form.returnDate && form.returnDate < form.departureDate) {
      errors.returnDate = 'The return cannot be before the departure';
    }

    if (form.estimatedCost && Number(form.estimatedCost) < 0) {
      errors.estimatedCost = 'Cost cannot be negative';
    }

    const companions = Number(form.maxCompanions);
    if (!Number.isInteger(companions) || companions < 1 || companions > 20) {
      errors.maxCompanions = 'Choose between 1 and 20 companions';
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!validate()) return;

    try {
      setLoading(true);

      // Coordinates are optional: without a Maps key the journey is still
      // created, it just does not appear in proximity searches.
      const journey = await createJourney({
        ...form,
        estimatedCost: form.estimatedCost === '' ? null : Number(form.estimatedCost),
        maxCompanions: Number(form.maxCompanions),
        returnDate: form.returnDate || null,
      });

      navigate(`/journeys/${journey._id}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create the journey'));
      setLoading(false);
    }
  };

  const inputClass = (field) => `input ${fieldErrors[field] ? 'input-error' : ''}`;

  return (
    <div className="bg-ink-50 py-10">
      <div className="container max-w-3xl">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
          <Icon name="arrowLeft" className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="card mt-5 overflow-hidden">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary-700 to-primary-950 px-6 py-8 sm:px-8">
            <div className="absolute inset-0 bg-grid-faint [background-size:26px_26px]" aria-hidden="true" />
            <h1 className="relative text-2xl text-white sm:text-3xl">Post a journey</h1>
            <p className="relative mt-2 text-sm text-white/70">
              Tell people where you are heading. Anyone with a matching route can ask to join.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 p-6 sm:p-8">
            {error && <ErrorMessage error={error} onDismiss={() => setError(null)} />}

            <fieldset className="space-y-5">
              <legend className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                Route
              </legend>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="origin" className="label">
                    Leaving from
                  </label>
                  <LocationAutocomplete
                    id="origin"
                    placeholder="Your starting point"
                    value={form.origin}
                    onTextChange={(origin) => {
                      setField('origin', origin);
                      setField('originCoords', null);
                    }}
                    onPlaceSelect={(place) =>
                      setField('originCoords', place ? { lat: place.lat, lng: place.lng } : null)
                    }
                    required
                  />
                  {fieldErrors.origin && <p className="mt-1.5 text-xs text-red-600">{fieldErrors.origin}</p>}
                </div>

                <div>
                  <label htmlFor="destination" className="label">
                    Going to
                  </label>
                  <LocationAutocomplete
                    id="destination"
                    placeholder="Your destination"
                    value={form.destination}
                    onTextChange={(destination) => {
                      setField('destination', destination);
                      setField('destinationCoords', null);
                    }}
                    onPlaceSelect={(place) =>
                      setField('destinationCoords', place ? { lat: place.lat, lng: place.lng } : null)
                    }
                    required
                  />
                  {fieldErrors.destination && (
                    <p className="mt-1.5 text-xs text-red-600">{fieldErrors.destination}</p>
                  )}
                </div>
              </div>

              <div>
                <span className="label">How are you travelling?</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {TRANSPORT_MODES.map((mode) => {
                    const selected = form.transportMode === mode.value;

                    return (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => setField('transportMode', mode.value)}
                        aria-pressed={selected}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all ${
                          selected
                            ? 'border-primary-500 bg-primary-50 text-primary-700 ring-4 ring-primary-500/10'
                            : 'border-ink-200 text-ink-600 hover:border-ink-300 hover:bg-ink-50'
                        }`}
                      >
                        <Icon name={TRANSPORT_ICONS[mode.value]} className="h-5 w-5" />
                        {mode.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-5 border-t border-ink-100 pt-8">
              <legend className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                When
              </legend>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="departureDate" className="label">
                    Departure date
                  </label>
                  <input
                    id="departureDate"
                    name="departureDate"
                    type="date"
                    min={todayForInput()}
                    value={form.departureDate}
                    onChange={handleChange}
                    className={inputClass('departureDate')}
                    required
                  />
                  {fieldErrors.departureDate && (
                    <p className="mt-1.5 text-xs text-red-600">{fieldErrors.departureDate}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="returnDate" className="label">
                    Return date <span className="font-normal text-ink-400">(optional)</span>
                  </label>
                  <input
                    id="returnDate"
                    name="returnDate"
                    type="date"
                    min={form.departureDate || todayForInput()}
                    value={form.returnDate}
                    onChange={handleChange}
                    className={inputClass('returnDate')}
                  />
                  {fieldErrors.returnDate && (
                    <p className="mt-1.5 text-xs text-red-600">{fieldErrors.returnDate}</p>
                  )}
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-5 border-t border-ink-100 pt-8">
              <legend className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                Details
              </legend>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="estimatedCost" className="label">
                    Estimated cost per person <span className="font-normal text-ink-400">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink-400">
                      &#8377;
                    </span>
                    <input
                      id="estimatedCost"
                      name="estimatedCost"
                      type="number"
                      min="0"
                      step="10"
                      inputMode="numeric"
                      placeholder="0"
                      value={form.estimatedCost}
                      onChange={handleChange}
                      className={`${inputClass('estimatedCost')} pl-8`}
                    />
                  </div>
                  {fieldErrors.estimatedCost && (
                    <p className="mt-1.5 text-xs text-red-600">{fieldErrors.estimatedCost}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="maxCompanions" className="label">
                    Companions wanted
                  </label>
                  <input
                    id="maxCompanions"
                    name="maxCompanions"
                    type="number"
                    min="1"
                    max="20"
                    value={form.maxCompanions}
                    onChange={handleChange}
                    className={inputClass('maxCompanions')}
                    required
                  />
                  {fieldErrors.maxCompanions && (
                    <p className="mt-1.5 text-xs text-red-600">{fieldErrors.maxCompanions}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="description" className="label">
                  Anything else? <span className="font-normal text-ink-400">(optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="4"
                  maxLength={1000}
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Timing, meeting point, luggage space, how you plan to split the cost…"
                  className="input resize-y"
                />
                <p className="mt-1.5 text-right text-xs text-ink-400">
                  {form.description.length}/1000
                </p>
              </div>

              <div>
                <label htmlFor="visibility" className="label">
                  Who can see this?
                </label>
                <select
                  id="visibility"
                  name="visibility"
                  value={form.visibility}
                  onChange={handleChange}
                  className="select"
                >
                  <option value="public">Everyone on Travel Buddy</option>
                  <option value="university">Anyone searching my university</option>
                  <option value="private">Only me and people I accept</option>
                </select>
              </div>
            </fieldset>

            <div className="flex flex-col gap-3 border-t border-ink-100 pt-6 sm:flex-row-reverse">
              <button type="submit" className="btn-primary btn-lg" disabled={loading}>
                {loading ? 'Posting…' : 'Post journey'}
              </button>
              <Link to="/dashboard" className="btn-secondary btn-lg">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateJourneyPage;
