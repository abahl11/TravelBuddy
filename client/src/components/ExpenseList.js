import React from 'react';
import UserAvatar from './UserAvatar';
import EmptyState from './EmptyState';
import Icon from './Icon';
import { formatCurrency } from '../utils/formatCurrency';
import { formatShortDate } from '../utils/formatDate';

const CATEGORY_META = {
  transportation: { icon: 'car', label: 'Transport', tint: 'bg-primary-50 text-primary-700' },
  accommodation: { icon: 'mapPin', label: 'Stay', tint: 'bg-violet-50 text-violet-700' },
  food: { icon: 'wallet', label: 'Food', tint: 'bg-emerald-50 text-emerald-700' },
  activities: { icon: 'sparkle', label: 'Activities', tint: 'bg-amber-50 text-amber-700' },
  other: { icon: 'compass', label: 'Other', tint: 'bg-ink-100 text-ink-700' },
};

const SPLIT_LABELS = {
  equal: 'Split equally',
  exact: 'Split by amount',
  percentage: 'Split by percentage',
};

const idOf = (value) => (typeof value === 'object' && value ? value._id : value);

const ExpenseList = ({ expenses, onSettleExpense, onDeleteExpense, currentUserId }) => {
  if (!expenses || expenses.length === 0) {
    return (
      <EmptyState
        icon="wallet"
        title="No expenses yet"
        description="Add the first cost and everyone's share is worked out automatically."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {expenses.map((expense) => {
        const meta = CATEGORY_META[expense.category] || CATEGORY_META.other;
        const isPayer = idOf(expense.paidBy) === currentUserId;
        const mine = expense.participants?.find(
          (participant) => idOf(participant.user) === currentUserId
        );
        const settled = expense.status === 'settled';

        return (
          <li key={expense._id} className="rounded-2xl border border-ink-100 bg-white p-4">
            <div className="flex items-start gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.tint}`}
              >
                <Icon name={meta.icon} className="h-5 w-5" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <p className="font-semibold text-ink-900">{expense.description}</p>
                  <p className="shrink-0 font-display text-lg font-bold text-ink-950">
                    {formatCurrency(expense.amount, expense.currency)}
                  </p>
                </div>

                <p className="mt-0.5 text-xs text-ink-500">
                  {meta.label} · {formatShortDate(expense.date)} · {SPLIT_LABELS[expense.splitType]}
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-xs text-ink-600">
                    <UserAvatar user={expense.paidBy} size="xs" />
                    Paid by{' '}
                    <span className="font-medium text-ink-800">
                      {isPayer ? 'you' : expense.paidBy?.fullName || expense.paidBy?.username}
                    </span>
                  </span>

                  <div className="flex items-center gap-2">
                    {settled ? (
                      <span className="badge-open">
                        <Icon name="check" className="h-3 w-3" />
                        Settled
                      </span>
                    ) : mine?.paid ? (
                      <span className="badge-open">Your share is paid</span>
                    ) : mine ? (
                      <button
                        type="button"
                        onClick={() => onSettleExpense?.(expense._id)}
                        className="btn-primary btn-sm"
                      >
                        Mark my share paid
                      </button>
                    ) : (
                      <span className="badge-neutral">Not your expense</span>
                    )}

                    {isPayer && onDeleteExpense && (
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(expense._id)}
                        className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${expense.description}`}
                      >
                        <Icon name="trash" className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {expense.notes && (
                  <p className="mt-3 rounded-lg bg-ink-50 p-2.5 text-xs italic text-ink-600">
                    {expense.notes}
                  </p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default ExpenseList;
