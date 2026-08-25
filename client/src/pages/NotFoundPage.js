import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

const NotFoundPage = () => (
  <div className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
      <Icon name="compass" className="h-8 w-8" />
    </span>
    <p className="mt-6 font-display text-6xl font-extrabold text-ink-950">404</p>
    <h1 className="mt-3 text-2xl">This page went off the map</h1>
    <p className="mt-3 max-w-md text-ink-500">
      The page you are looking for may have moved, or never existed. Let us get you back on route.
    </p>
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Link to="/" className="btn-primary">
        Back to home
      </Link>
      <Link to="/journeys" className="btn-secondary">
        Browse journeys
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
