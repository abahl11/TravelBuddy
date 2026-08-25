import React, { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import UserProfilePage from './pages/UserProfilePage';
import JourneysPage from './pages/JourneysPage';
import JourneyDetailsPage from './pages/JourneyDetailsPage';
import CreateJourneyPage from './pages/CreateJourneyPage';
import MessagesPage from './pages/MessagesPage';
import AboutPage from './pages/AboutPage';
import SafetyPage from './pages/SafetyPage';
import NotFoundPage from './pages/NotFoundPage';

/** Client-side navigation keeps the old scroll position without this. */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => (
  // Rendering never waits on map configuration: components that use maps
  // handle their own loading state, so a missing key degrades one component
  // instead of blocking the entire app behind a spinner.
  <div className="flex min-h-screen flex-col">
    <ScrollToTop />
    <Header />

    <main className="flex-1">
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="/journeys" element={<JourneysPage />} />
          <Route path="/journeys/:id" element={<JourneyDetailsPage />} />
          <Route path="/users/:id" element={<UserProfilePage />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/create-journey"
            element={
              <PrivateRoute>
                <CreateJourneyPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <PrivateRoute>
                <MessagesPage />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
    </main>

    <Footer />
  </div>
);

export default App;
