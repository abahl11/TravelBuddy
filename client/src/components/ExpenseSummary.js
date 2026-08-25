import React from 'react';
import UserAvatar from './UserAvatar';
import Icon from './Icon';
import { formatCurrency } from '../utils/formatCurrency';

const ExpenseSummary = ({ summary, currentUserId }) => {
  if (!summary) return null;

  const { totalExpenses, balances = [], settlements = [], expenseCount, currency = 'INR' } = summary;

  const mine = balances.find((balance) => balance.user._id === currentUserId);
  const owed = mine ? mine.netBalance : 0;

  return (
    <section className="card overflow-hidden">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-700 to-primary-950 p-5 text-white">
        <div className="absolute inset-0 bg-grid-faint [background-size:22px_22px]" aria-hidden="true" />
        <p className="relative text-xs font-semibold uppercase tracking-wide text-white/60">
          Total spent
        </p>
        <p className="relative mt-1 font-display text-3xl font-extrabold">
          {formatCurrency(totalExpenses, currency)}
        </p>
        <p className="relative mt-1 text-xs text-white/60">
          across {expenseCount} expense{expenseCount === 1 ? '' : 's'}
        </p>
      </div>

      {mine && (
        <div className="border-b border-ink-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Your balance</p>
          <p
            className={`mt-1.5 font-display text-xl font-bold ${
              Math.abs(owed) < 0.01
                ? 'text-ink-600'
                : owed > 0
                  ? 'text-emerald-600'
                  : 'text-red-600'
            }`}
          >
            {Math.abs(owed) < 0.01
              ? 'All settled up'
              : owed > 0
                ? `You are owed ${formatCurrency(owed, currency)}`
                : `You owe ${formatCurrency(Math.abs(owed), currency)}`}
          </p>
        </div>
      )}

      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Everyone</p>
        <ul className="mt-3 space-y-2.5">
          {balances.map((balance) => (
            <li key={balance.user._id} className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <UserAvatar user={balance.user} size="xs" />
                <span className="truncate text-sm">
                  {balance.user.fullName || balance.user.username}
                </span>
              </span>
              <span
                className={`shrink-0 text-sm font-semibold ${
                  Math.abs(balance.netBalance) < 0.01
                    ? 'text-ink-400'
                    : balance.netBalance > 0
                      ? 'text-emerald-600'
                      : 'text-red-600'
                }`}
              >
                {balance.netBalance > 0 ? '+' : ''}
                {formatCurrency(balance.netBalance, currency)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {settlements.length > 0 && (
        <div className="border-t border-ink-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
            Simplest way to settle
          </p>
          <ul className="mt-3 space-y-2.5">
            {settlements.map((settlement, index) => (
              <li
                // Settlements have no id of their own; the pair plus index is stable
                // for a given render of this summary.
                key={`${settlement.from._id}-${settlement.to._id}-${index}`}
                className="flex items-center justify-between gap-2 rounded-xl bg-ink-50 p-2.5"
              >
                <span className="flex min-w-0 items-center gap-1.5 text-xs">
                  <UserAvatar user={settlement.from} size="xs" />
                  <span className="truncate">{settlement.from.fullName || settlement.from.username}</span>
                  <Icon name="arrowRight" className="h-3 w-3 shrink-0 text-ink-400" />
                  <UserAvatar user={settlement.to} size="xs" />
                  <span className="truncate">{settlement.to.fullName || settlement.to.username}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-ink-900">
                  {formatCurrency(settlement.amount, currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default ExpenseSummary;
