import React from 'react';
import Icon from '../components/Icon';

const TIPS = [
  {
    title: 'Check the profile first',
    body: 'Look at their university, how long they have been on Travel Buddy, and what previous companions said in reviews.',
  },
  {
    title: 'Talk before you commit',
    body: 'Use the in-app messages to agree the meeting point, timing and how you plan to split the cost — before the day.',
  },
  {
    title: 'Tell someone your plan',
    body: 'Share the journey page with a friend or family member, along with who you are travelling with.',
  },
  {
    title: 'Meet somewhere public',
    body: 'Station concourses, campus gates and bus stands are all good. Avoid arranging a first meeting somewhere isolated.',
  },
  {
    title: 'Trust your instincts',
    body: 'If something feels off, you are never obliged to travel. Decline the request or withdraw from the journey.',
  },
  {
    title: 'Settle costs in the app',
    body: 'Logging expenses keeps the maths transparent and means no one has to argue about who paid for what.',
  },
];

const SafetyPage = () => (
  <div className="bg-ink-50 py-14">
    <div className="container max-w-4xl">
      <span className="badge-neutral">Safety</span>
      <h1 className="mt-4 text-3xl sm:text-4xl">Travelling with someone new</h1>
      <p className="mt-4 max-w-2xl text-ink-500">
        Most trips are uneventful, and a few habits keep them that way.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {TIPS.map((tip, index) => (
          <div key={tip.title} className="card p-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 font-display text-sm font-bold text-primary-700">
              {index + 1}
            </span>
            <h2 className="mt-4 text-base font-semibold">{tip.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">{tip.body}</p>
          </div>
        ))}
      </div>

      <div className="alert-info mt-10">
        <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Travel Buddy connects students but does not vet them, supervise journeys, or provide
          insurance. Use the same judgement you would when arranging any trip with someone you have
          not met.
        </p>
      </div>
    </div>
  </div>
);

export default SafetyPage;
