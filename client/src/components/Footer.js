import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';

// Every destination here is a real route in App.js — no dead links.
const SECTIONS = [
  {
    title: 'Product',
    links: [
      { to: '/journeys', label: 'Find journeys' },
      { to: '/create-journey', label: 'Post a journey' },
      { to: '/dashboard', label: 'Dashboard' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About' },
      { to: '/safety', label: 'Safety tips' },
    ],
  },
];

const Footer = () => (
  <footer className="mt-auto border-t border-ink-100 bg-white">
    <div className="container py-14">
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
              <Icon name="route" className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-extrabold text-ink-950">Travel Buddy</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-500">
            Find fellow students heading the same way. Share the ride, split the cost, and never
            travel home alone again.
          </p>
        </div>

        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h4 className="text-sm font-semibold text-ink-900">{section.title}</h4>
            <ul className="mt-4 space-y-2.5">
              {section.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-ink-500 transition-colors hover:text-primary-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-ink-100 pt-6 sm:flex-row">
        <p className="text-xs text-ink-400">
          &copy; {new Date().getFullYear()} Travel Buddy. Built for students.
        </p>
        <p className="text-xs text-ink-400">Travel smart. Travel together.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
