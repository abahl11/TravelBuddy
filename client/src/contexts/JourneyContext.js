import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import journeyService from '../services/journeyService';
import { getErrorMessage } from '../api/client';
import { useAuth } from './AuthContext';

const JourneyContext = createContext(null);

export const useJourney = () => {
  const context = useContext(JourneyContext);

  if (!context) {
    throw new Error('useJourney must be used inside a JourneyProvider');
  }

  return context;
};

const replaceIn = (list, journey) =>
  list.map((item) => (item._id === journey._id ? journey : item));

export const JourneyProvider = ({ children }) => {
  const { user } = useAuth();

  const [featuredJourneys, setFeaturedJourneys] = useState([]);
  const [userJourneys, setUserJourneys] = useState([]);
  const [joinedJourneys, setJoinedJourneys] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingMine, setLoadingMine] = useState(false);
  const [error, setError] = useState(null);

  const fetchFeaturedJourneys = useCallback(async () => {
    try {
      setLoadingFeatured(true);
      setError(null);
      setFeaturedJourneys(await journeyService.getJourneys({ limit: 6 }));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load journeys'));
    } finally {
      setLoadingFeatured(false);
    }
  }, []);

  const fetchMyJourneys = useCallback(async (userId) => {
    if (!userId) return;

    try {
      setLoadingMine(true);
      setError(null);

      // One round trip each, in parallel — the dashboard needs both.
      const [created, joined] = await Promise.all([
        journeyService.getJourneys({ creator: userId }),
        journeyService.getJourneys({ companion: userId }),
      ]);

      setUserJourneys(created);
      setJoinedJourneys(joined);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load your journeys'));
    } finally {
      setLoadingMine(false);
    }
  }, []);

  const createJourney = useCallback(async (journeyData) => {
    const journey = await journeyService.createJourney(journeyData);
    setUserJourneys((prev) => [journey, ...prev]);
    return journey;
  }, []);

  const updateJourney = useCallback(async (id, journeyData) => {
    const journey = await journeyService.updateJourney(id, journeyData);
    setUserJourneys((prev) => replaceIn(prev, journey));
    setFeaturedJourneys((prev) => replaceIn(prev, journey));
    setJoinedJourneys((prev) => replaceIn(prev, journey));
    return journey;
  }, []);

  const deleteJourney = useCallback(async (id) => {
    await journeyService.deleteJourney(id);
    const without = (list) => list.filter((journey) => journey._id !== id);
    setUserJourneys(without);
    setFeaturedJourneys(without);
    setJoinedJourneys(without);
  }, []);

  const joinJourney = useCallback(async (id) => {
    const journey = await journeyService.joinJourney(id);
    setFeaturedJourneys((prev) => replaceIn(prev, journey));
    setJoinedJourneys((prev) =>
      prev.some((item) => item._id === id) ? replaceIn(prev, journey) : [journey, ...prev]
    );
    return journey;
  }, []);

  const respondToJoinRequest = useCallback(async (journeyId, userId, status) => {
    const journey = await journeyService.respondToJoinRequest(journeyId, userId, status);
    setUserJourneys((prev) => replaceIn(prev, journey));
    setFeaturedJourneys((prev) => replaceIn(prev, journey));
    return journey;
  }, []);

  useEffect(() => {
    fetchFeaturedJourneys();
  }, [fetchFeaturedJourneys]);

  // Reload the personal lists whenever the signed-in user changes, and clear
  // them on sign-out so one account never sees another's journeys.
  useEffect(() => {
    if (user?._id) {
      fetchMyJourneys(user._id);
    } else {
      setUserJourneys([]);
      setJoinedJourneys([]);
    }
  }, [user?._id, fetchMyJourneys]);

  const value = useMemo(
    () => ({
      featuredJourneys,
      userJourneys,
      joinedJourneys,
      loadingFeatured,
      loadingMine,
      error,
      fetchFeaturedJourneys,
      fetchMyJourneys,
      createJourney,
      updateJourney,
      deleteJourney,
      joinJourney,
      respondToJoinRequest,
    }),
    [
      featuredJourneys,
      userJourneys,
      joinedJourneys,
      loadingFeatured,
      loadingMine,
      error,
      fetchFeaturedJourneys,
      fetchMyJourneys,
      createJourney,
      updateJourney,
      deleteJourney,
      joinJourney,
      respondToJoinRequest,
    ]
  );

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
};

export default JourneyContext;
