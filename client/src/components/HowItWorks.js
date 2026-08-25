import React from 'react';
import Icon from './Icon';

const STEPS = [
  {
    icon: 'user',
    title: 'Create your profile',
    description: 'Sign up with your university and hometown so the right people can find you.',
  },
  {
    icon: 'search',
    title: 'Find a match',
    description: 'Search by destination and date, or post your own trip and let others join.',
  },
  {
    icon: 'message',
    title: 'Agree the plan',
    description: 'Message before you commit. Accept the companions you are comfortable with.',
  },
  {
    icon: 'wallet',
    title: 'Travel and settle up',
    description: 'Split fares in the app, then leave a review so the next person knows too.',
  },
];

const HowItWorks = () => (
  <section className="section">
    <div className="container">
      <div className="mx-auto max-w-2xl text-center">
        <span className="badge-neutral">How it works</span>
        <h2 className="mt-4 text-3xl sm:text-4xl">Four steps from alone to accompanied</h2>
        <p className="mt-4 text-ink-500">
          No group chats to trawl through, no asking around. Post where you are going and let the
          matching happen.
        </p>
      </div>

      <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="card relative p-6">
            <span className="absolute right-5 top-5 font-display text-4xl font-extrabold text-ink-100">
              {index + 1}
            </span>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
              <Icon name={step.icon} className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-base font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">{step.description}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

export default HowItWorks;
