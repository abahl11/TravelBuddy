import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import messageService from '../services/messageService';
import UserAvatar from './UserAvatar';
import Icon from './Icon';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/journeys', label: 'Find journeys' },
  { to: '/about', label: 'About' },
];

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef(null);

  // Close both menus on navigation, otherwise they hang over the new page.
  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Click-outside and Escape close the account menu.
  useEffect(() => {
    if (!menuOpen) return undefined;

    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return undefined;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const count = await messageService.getUnreadCount();
        if (!cancelled) setUnread(count);
      } catch {
        /* the badge is optional — never surface this */
      }
    };

    load();
    const timer = setInterval(load, 60000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `relative py-1 text-sm font-medium transition-colors ${
      isActive ? 'text-primary-700' : 'text-ink-600 hover:text-ink-900'
    }`;

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        scrolled
          ? 'border-ink-100 bg-white/85 shadow-sm backdrop-blur-xl'
          : 'border-transparent bg-white/60 backdrop-blur-sm'
      }`}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-glow">
            <Icon name="route" className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-ink-950">
            Travel Buddy
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
          {user && (
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/messages"
                className="relative hidden rounded-xl p-2.5 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 sm:block"
                aria-label={unread ? `Messages, ${unread} unread` : 'Messages'}
              >
                <Icon name="message" className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>

              <Link to="/create-journey" className="btn-primary btn-sm hidden sm:inline-flex">
                <Icon name="plus" className="h-4 w-4" />
                New journey
              </Link>

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-ink-100"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <UserAvatar user={user} size="sm" />
                  <Icon
                    name="chevronDown"
                    className={`hidden h-4 w-4 text-ink-500 transition-transform sm:block ${
                      menuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card-hover animate-fade-up"
                  >
                    <div className="border-b border-ink-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-ink-900">{user.fullName}</p>
                      <p className="truncate text-xs text-ink-500">@{user.username}</p>
                    </div>

                    <div className="p-1.5">
                      {[
                        { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
                        { to: '/profile', icon: 'user', label: 'Your profile' },
                        { to: '/messages', icon: 'message', label: 'Messages' },
                      ].map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          role="menuitem"
                          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-50"
                        >
                          <Icon name={item.icon} className="h-4 w-4 text-ink-400" />
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    <div className="border-t border-ink-100 p-1.5">
                      <button
                        type="button"
                        onClick={handleLogout}
                        role="menuitem"
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Icon name="logout" className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="btn-ghost btn-sm">
                Log in
              </Link>
              <Link to="/register" className="btn-primary btn-sm">
                Get started
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-xl p-2.5 text-ink-600 transition-colors hover:bg-ink-100 md:hidden"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            <Icon name={mobileOpen ? 'x' : 'menu'} className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-ink-100 bg-white md:hidden animate-fade-in">
          <nav className="container flex flex-col py-3">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2.5 text-sm font-medium ${
                    isActive ? 'bg-primary-50 text-primary-700' : 'text-ink-700 hover:bg-ink-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {user ? (
              <>
                <NavLink
                  to="/dashboard"
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/messages"
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
                >
                  Messages {unread > 0 && `(${unread})`}
                </NavLink>
                <Link to="/create-journey" className="btn-primary mt-2">
                  <Icon name="plus" className="h-4 w-4" />
                  New journey
                </Link>
              </>
            ) : (
              <div className="mt-2 flex gap-2">
                <Link to="/login" className="btn-secondary flex-1">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary flex-1">
                  Get started
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
