import api from '../api/client';

/**
 * @param {Object} filters - destination, lat, lng, radius, departureDate,
 *   university, creator, companion, transportMode, status, includePast, limit.
 */
const getJourneys = async (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });

  const { data } = await api.get(`/journeys?${params.toString()}`);
  return data;
};

const getJourneyById = async (id) => {
  const { data } = await api.get(`/journeys/${id}`);
  return data;
};

const createJourney = async (journeyData) => {
  const { data } = await api.post('/journeys', journeyData);
  return data;
};

const updateJourney = async (id, journeyData) => {
  const { data } = await api.put(`/journeys/${id}`, journeyData);
  return data;
};

const deleteJourney = async (id) => {
  const { data } = await api.delete(`/journeys/${id}`);
  return data;
};

const joinJourney = async (id) => {
  const { data } = await api.post(`/journeys/${id}/join`);
  return data;
};

const respondToJoinRequest = async (journeyId, userId, status) => {
  const { data } = await api.put(`/journeys/${journeyId}/companions/${userId}`, { status });
  return data;
};

const completeJourney = async (id) => {
  const { data } = await api.put(`/journeys/${id}/complete`);
  return data;
};

const cancelJourney = async (id) => {
  const { data } = await api.put(`/journeys/${id}/cancel`);
  return data;
};

const getNearbyJourneys = async ({ lat, lng, radius = 50 }) => {
  const { data } = await api.get('/journeys/nearby', { params: { lat, lng, radius } });
  return data;
};

const getUniversityJourneys = async () => {
  const { data } = await api.get('/journeys/university');
  return data;
};

const journeyService = {
  getJourneys,
  getJourneyById,
  createJourney,
  updateJourney,
  deleteJourney,
  joinJourney,
  respondToJoinRequest,
  completeJourney,
  cancelJourney,
  getNearbyJourneys,
  getUniversityJourneys,
};

export default journeyService;
