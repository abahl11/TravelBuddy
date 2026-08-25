import api from '../api/client';

const createReview = async (reviewData) => {
  const { data } = await api.post('/reviews', reviewData);
  return data;
};

const getUserReviews = async (userId) => {
  const { data } = await api.get(`/reviews/user/${userId}`);
  return data;
};

const getReviewsByUser = async (userId) => {
  const { data } = await api.get(`/reviews/by-user/${userId}`);
  return data;
};

const getJourneyReviews = async (journeyId) => {
  const { data } = await api.get(`/reviews/journey/${journeyId}`);
  return data;
};

const deleteReview = async (reviewId) => {
  const { data } = await api.delete(`/reviews/${reviewId}`);
  return data;
};

const reviewService = {
  createReview,
  getUserReviews,
  getReviewsByUser,
  getJourneyReviews,
  deleteReview,
};

export default reviewService;
