import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from './Icon';

const HeroSection = () => {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden bg-ink-950">
      {/* Layered gradients instead of a background image file — nothing to 404. */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary-800 via-primary-950 to-ink-950"
        aria-hidden="true"
      />
      <div
        className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-primary-500/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-grid-faint [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        aria-hidden="true"
      />

      <div className="container relative py-20 sm:py-28">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm animate-fade-in">
            <Icon name="sparkle" className="h-3.5 w-3.5" />
            Built for students, by students
          </span>

          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl lg:text-6xl animate-fade-up">
            Never make the trip
            <span className="block bg-gradient-to-r from-accent-300 to-accent-500 bg-clip-text text-transparent">
              home alone again.
            </span>
          </h1>

          <p
            className="mt-6 max-w-xl text-lg leading-relaxed text-white/70 animate-fade-up"
            style={{ animationDelay: '80ms' }}
          >
            Match with people from your campus heading the same way, on the same day. Share the
            ride, split the cost, and keep each other company.
          </p>

          <div
            className="mt-9 flex flex-col gap-3 sm:flex-row animate-fade-up"
            style={{ animationDelay: '160ms' }}
          >
            {user ? (
              <>
                <Link to="/create-journey" className="btn-accent btn-lg">
                  <Icon name="plus" className="h-5 w-5" />
                  Post your journey
                </Link>
                <Link
                  to="/journeys"
                  className="btn-lg border border-white/25 bg-white/5 text-white backdrop-blur-sm hover:bg-white/15"
                >
                  Browse journeys
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-accent btn-lg">
                  Create free account
                  <Icon name="arrowRight" className="h-5 w-5" />
                </Link>
                <Link
                  to="/journeys"
                  className="btn-lg border border-white/25 bg-white/5 text-white backdrop-blur-sm hover:bg-white/15"
                >
                  Browse journeys
                </Link>
              </>
            )}
          </div>

          <dl
            className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-8 animate-fade-up"
            style={{ animationDelay: '240ms' }}
          >
            {[
              { value: 'Same campus', label: 'Verified students' },
              { value: 'Split fairly', label: 'Costs settled in app' },
              { value: 'Rated', label: 'Reviews after every trip' },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="font-display text-base font-bold text-white sm:text-lg">{stat.value}</dt>
                <dd className="mt-1 text-xs text-white/50">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
