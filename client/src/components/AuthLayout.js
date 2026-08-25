import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';

const HIGHLIGHTS = [
  { icon: 'users', text: 'Match with students from your own campus' },
  { icon: 'wallet', text: 'Split fares fairly and settle up in app' },
  { icon: 'shield', text: 'Ratings and reviews after every trip' },
];

/** Shared split-screen shell for the login and register pages. */
const AuthLayout = ({ title, subtitle, children, footer }) => (
  <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
    <div className="flex items-center justify-center px-5 py-12 sm:px-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-ink-500">{subtitle}</p>}

        <div className="mt-8">{children}</div>

        {footer && <p className="mt-6 text-center text-sm text-ink-500">{footer}</p>}
      </div>
    </div>

    {/* Decorative panel — hidden on small screens where it would just push the form down. */}
    <div className="relative hidden overflow-hidden bg-ink-950 lg:block">
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-900 to-ink-950"
        aria-hidden="true"
      />
      <div
        className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-accent-500/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-grid-faint [background-size:36px_36px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative flex h-full flex-col justify-center p-14">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-sm">
            <Icon name="route" className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-extrabold text-white">Travel Buddy</span>
        </Link>

        <p className="mt-10 max-w-sm font-display text-3xl font-bold leading-tight text-white">
          The trip home is better with someone in the next seat.
        </p>

        <ul className="mt-10 space-y-4">
          {HIGHLIGHTS.map((item) => (
            <li key={item.text} className="flex items-center gap-3 text-white/80">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Icon name={item.icon} className="h-4 w-4" />
              </span>
              <span className="text-sm">{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

export default AuthLayout;
