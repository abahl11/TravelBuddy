import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from './Icon';

const REASONS = [
  { icon: 'wallet', title: 'Split every cost', text: 'Fares, fuel and tolls, settled fairly in app.' },
  { icon: 'shield', title: 'Know who you travel with', text: 'Ratings and reviews after every trip.' },
  { icon: 'users', title: 'Campus first', text: 'Match with people from your own university.' },
];

const CallToAction = () => {
  const { user } = useAuth();

  return (
    <section className="section">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-ink-950 px-6 py-16 sm:px-14">
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary-800 via-primary-950 to-ink-950"
            aria-hidden="true"
          />
          <div
            className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent-500/25 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl text-white sm:text-4xl">
                Your next trip home starts with one post.
              </h2>
              <p className="mt-4 max-w-md text-white/70">
                It takes under a minute. Add where you are going and when, and let the people
                heading your way come to you.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {user ? (
                  <Link to="/create-journey" className="btn-accent btn-lg">
                    <Icon name="plus" className="h-5 w-5" />
                    Post a journey
                  </Link>
                ) : (
                  <Link to="/register" className="btn-accent btn-lg">
                    Get started free
                    <Icon name="arrowRight" className="h-5 w-5" />
                  </Link>
                )}
              </div>
            </div>

            <ul className="space-y-4">
              {REASONS.map((reason) => (
                <li
                  key={reason.title}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                    <Icon name={reason.icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-white">{reason.title}</p>
                    <p className="mt-0.5 text-sm text-white/60">{reason.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
