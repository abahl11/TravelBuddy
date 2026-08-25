import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import geocodeService from '../services/geocodeService';
import { useMaps } from '../contexts/MapsContext';
import Icon from './Icon';
import { Spinner } from './Loader';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

/**
 * City input with suggestions from our own /api/geocode proxy.
 *
 * Built as a plain combobox rather than a vendor widget, which means: no third
 * party script to load, no z-index fight with a dropdown appended to <body>,
 * full keyboard support, and the API key stays on the server.
 *
 * Typing free text is always allowed. The parent receives coordinates only
 * when a suggestion is actually chosen, and a journey without coordinates is
 * still valid — it just does not join proximity searches.
 */
const LocationAutocomplete = ({
  onPlaceSelect,
  placeholder = 'Search for a city',
  value = '',
  onTextChange,
  id,
  required = false,
}) => {
  const { geocodingEnabled, loaded } = useMaps();

  const generatedId = useId();
  const inputId = id || generatedId;
  const listboxId = `${inputId}-listbox`;

  const [internalValue, setInternalValue] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);
  const abortRef = useRef(null);
  // Suppresses the search that would otherwise fire from programmatically
  // setting the input value right after a selection.
  const skipNextSearchRef = useRef(false);
  const onPlaceSelectRef = useRef(onPlaceSelect);

  const isControlled = typeof onTextChange === 'function';
  const inputValue = isControlled ? value : internalValue;

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
  }, [onPlaceSelect]);

  useEffect(() => {
    if (!isControlled) setInternalValue(value);
  }, [value, isControlled]);

  const setText = useCallback(
    (text) => {
      if (isControlled) {
        onTextChange(text);
      } else {
        setInternalValue(text);
      }
    },
    [isControlled, onTextChange]
  );

  // Debounced lookup. Each run cancels the previous request so out-of-order
  // responses cannot overwrite newer suggestions.
  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return undefined;
    }

    const query = (inputValue || '').trim();

    if (!geocodingEnabled || query.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setLoading(true);
        const { results } = await geocodeService.autocomplete(query, { signal: controller.signal });

        if (controller.signal.aborted) return;

        setSuggestions(results);
        setActiveIndex(-1);
        if (results.length > 0) setOpen(true);
      } catch {
        // Aborted, offline, or upstream trouble — the field stays typeable.
        if (!controller.signal.aborted) setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [inputValue, geocodingEnabled]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Close when focus or a click lands outside the component.
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const handleChange = (event) => {
    setText(event.target.value);
    setOpen(true);
    // Editing after a pick invalidates the coordinates that came with it.
    onPlaceSelectRef.current?.(null);
  };

  const selectSuggestion = (suggestion) => {
    if (!suggestion) return;

    skipNextSearchRef.current = true;
    setText(suggestion.label);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);

    onPlaceSelectRef.current?.({
      name: suggestion.name,
      formattedAddress: suggestion.label,
      lat: suggestion.lat,
      lng: suggestion.lng,
      placeId: suggestion.id,
    });
  };

  const handleKeyDown = (event) => {
    if (!open || suggestions.length === 0) {
      if (event.key === 'ArrowDown' && suggestions.length > 0) {
        setOpen(true);
        event.preventDefault();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
        break;
      case 'Enter':
        // Only swallow Enter when a suggestion is highlighted, so the form can
        // still be submitted from this field otherwise.
        if (activeIndex >= 0) {
          event.preventDefault();
          selectSuggestion(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        setOpen(false);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  };

  const showList = open && suggestions.length > 0;

  return (
    <div className="relative" ref={containerRef}>
      <Icon
        name="mapPin"
        className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-400"
      />

      <input
        id={inputId}
        type="text"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className="input pl-10 pr-10"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
      />

      {loading && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
          <Spinner size="sm" className="h-4 w-4 border" />
        </span>
      )}

      {showList && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-[1200] mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-ink-200 bg-white py-1 shadow-card-hover"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              id={`${listboxId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              // onMouseDown, not onClick: blur would close the list first.
              onMouseDown={(event) => {
                event.preventDefault();
                selectSuggestion(suggestion);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={`flex cursor-pointer items-start gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${
                index === activeIndex ? 'bg-primary-50' : ''
              }`}
            >
              <Icon name="mapPin" className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
              <span className="min-w-0">
                <span className="block truncate font-medium text-ink-900">{suggestion.name}</span>
                {suggestion.context && (
                  <span className="block truncate text-xs text-ink-500">{suggestion.context}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {loaded && !geocodingEnabled && (
        <p className="mt-1.5 text-xs text-ink-400">
          Type a city name. Location suggestions are not configured.
        </p>
      )}
    </div>
  );
};

export default LocationAutocomplete;
