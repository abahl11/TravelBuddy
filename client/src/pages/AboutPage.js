import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

const VALUES = [
  {
    icon: 'users',
    title: 'Campus first',
    body: 'Everyone here is a student. Filter by university so the people you match with are the people you would recognise in a lecture hall.',
  },
  {
    icon: 'wallet',
    title: 'Costs, settled',
    body: 'Fares, fuel and tolls get logged against the trip. The app works out who owes whom, so nobody has to chase anyone.',
  },
  {
    icon: 'shield',
    title: 'Accountability',
    body: 'After a completed journey, travellers review each other. Ratings stay attached to the profile, so reputation is earned.',
  },
];

const AboutPage = () => (
  <div>
    <section className="relative overflow-hidden bg-ink-950">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-800 via-primary-950 to-ink-950" aria-hidden="true" />
      <div className="absolute inset-0 bg-grid-faint [background-size:36px_36px]" aria-hidden="true" />

      <div className="container relative py-20 text-center">
        <h1 className="mx-auto max-w-3xl font-display text-4xl font-extrabold text-white sm:text-5xl">
          Getting home should not be a solo problem
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
          Travel Buddy started from a familiar situation: a long weekend, a bus to book, and a group
          chat full of people quietly making the same trip alone.
        </p>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <div className="grid gap-6 md:grid-cols-3">
          {VALUES.map((value) => (
            <div key={value.title} className="card p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                <Icon name={value.icon} className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-lg">{value.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{value.body}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-2xl text-center">
          <h2 className="text-2xl">How matching works</h2>
          <p className="mt-4 leading-relaxed text-ink-600">
            When you post a journey, we store both ends of your route. Picking a city from the
            location suggestions turns a plain text match into a proximity search, so a trip to a
            neighbouring town still shows up. Everything else stays simple: ask to join, the
            organiser accepts or declines, and the seat count updates.
          </p>
          <Link to="/journeys" className="btn-primary mt-8">
            Browse journeys
            <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  </div>
);

export default AboutPage;
