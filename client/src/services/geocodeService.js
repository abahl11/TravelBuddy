import api from '../api/client';

/**
 * City suggestions, via our own API so the Geoapify key stays server-side.
 *
 * @param {string} query
 * @param {{ signal?: AbortSignal, limit?: number }} [options]
 * @returns {Promise<{ configured: boolean, results: Array }>}
 */
const autocomplete = async (query, { signal, limit = 5 } = {}) => {
  const { data } = await api.get('/geocode/autocomplete', {
    params: { q: query, limit },
    signal,
  });

  return { configured: Boolean(data?.configured), results: data?.results || [] };
};

const geocodeService = { autocomplete };

export default geocodeService;
