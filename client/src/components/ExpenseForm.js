import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import expenseService from '../services/expenseService';
import { getErrorMessage } from '../api/client';
import UserAvatar from './UserAvatar';
import ErrorMessage from './ErrorMessage';
import Icon from './Icon';
import { CURRENCY_SYMBOLS, formatCurrency } from '../utils/formatCurrency';
import { formatDateForInput } from '../utils/formatDate';

const CATEGORIES = [
  { value: 'transportation', label: 'Transport' },
  { value: 'accommodation', label: 'Stay' },
  { value: 'food', label: 'Food' },
  { value: 'activities', label: 'Activities' },
  { value: 'other', label: 'Other' },
];

const SPLIT_TYPES = [
  { value: 'equal', label: 'Split equally' },
  { value: 'exact', label: 'Exact amounts' },
  { value: 'percentage', label: 'By percentage' },
];

const idOf = (value) => (typeof value === 'object' && value ? value._id : value);

const round2 = (value) => Math.round(value * 100) / 100;

const ExpenseForm = ({ journey, onExpenseAdded, onCancel }) => {
  const { user } = useAuth();

  // Everyone actually travelling: the creator plus accepted companions.
  const people = useMemo(() => {
    const accepted = (journey.companions || [])
      .filter((companion) => companion.status === 'accepted' && companion.user)
      .map((companion) => companion.user);

    return [journey.creator, ...accepted].filter(Boolean);
  }, [journey]);

  const [form, setForm] = useState({
    description: '',
    amount: '',
    currency: 'INR',
    category: 'transportation',
    splitType: 'equal',
    date: formatDateForInput(new Date()),
    notes: '',
  });

  const [selected, setSelected] = useState(() => people.map((person) => idOf(person)));
  const [shares, setShares] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const amount = Number(form.amount) || 0;
  const isEqual = form.splitType === 'equal';
  const isPercentage = form.splitType === 'percentage';

  // Seed the per-person inputs with an even split whenever the basis changes,
  // so a custom split starts from something sensible rather than zeroes.
  useEffect(() => {
    if (isEqual || selected.length === 0) return;

    const even = isPercentage ? 100 / selected.length : amount / selected.length;

    setShares(
      Object.fromEntries(selected.map((id) => [id, even ? String(round2(even)) : '']))
    );
  }, [form.splitType, selected, amount, isEqual, isPercentage]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleParticipant = (personId) => {
    setSelected((prev) =>
      prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId]
    );
  };

  const shareTotal = selected.reduce((sum, id) => sum + (Number(shares[id]) || 0), 0);
  const target = isPercentage ? 100 : amount;
  const remainder = round2(target - shareTotal);
  const splitBalances = isEqual || Math.abs(remainder) < 0.01;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.description.trim()) {
      setError('Add a short description');
      return;
    }

    if (!(amount > 0)) {
      setError('Enter an amount greater than zero');
      return;
    }

    if (selected.length === 0) {
      setError('Select at least one person to split this with');
      return;
    }

    if (!splitBalances) {
      setError(
        isPercentage
          ? `Percentages must add up to 100 (currently ${round2(shareTotal)})`
          : `Shares must add up to ${formatCurrency(amount, form.currency)} (currently ${formatCurrency(shareTotal, form.currency)})`
      );
      return;
    }

    const participants = selected.map((id) => ({
      user: id,
      // The server recomputes equal shares; sending them keeps the payload
      // consistent for the other two modes.
      share: isEqual ? round2(amount / selected.length) : Number(shares[id]) || 0,
    }));

    try {
      setLoading(true);

      const expense = await expenseService.createExpense({
        journey: journey._id,
        description: form.description.trim(),
        amount,
        currency: form.currency,
        category: form.category,
        date: form.date,
        splitType: form.splitType,
        participants,
        notes: form.notes.trim() || undefined,
      });

      onExpenseAdded?.(expense);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to add the expense'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-ink-100 bg-ink-50/60 p-5">
      <ErrorMessage error={error} className="mb-4" onDismiss={() => setError('')} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="expense-description" className="label">
            What was it for?
          </label>
          <input
            id="expense-description"
            name="description"
            type="text"
            value={form.description}
            onChange={handleChange}
            placeholder="Cab to the station"
            maxLength={140}
            className="input"
            required
          />
        </div>

        <div>
          <label htmlFor="expense-amount" className="label">
            Amount
          </label>
          <div className="flex">
            <select
              name="currency"
              value={form.currency}
              onChange={handleChange}
              aria-label="Currency"
              className="input w-20 rounded-r-none border-r-0 text-center"
            >
              {Object.entries(CURRENCY_SYMBOLS).map(([code, symbol]) => (
                <option key={code} value={code}>
                  {symbol}
                </option>
              ))}
            </select>
            <input
              id="expense-amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              className="input rounded-l-none"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="expense-date" className="label">
            Date
          </label>
          <input
            id="expense-date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="expense-category" className="label">
            Category
          </label>
          <select
            id="expense-category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className="select"
          >
            {CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="expense-split" className="label">
            How to split
          </label>
          <select
            id="expense-split"
            name="splitType"
            value={form.splitType}
            onChange={handleChange}
            className="select"
          >
            {SPLIT_TYPES.map((split) => (
              <option key={split.value} value={split.value}>
                {split.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <span className="label">Split between</span>
        <div className="space-y-2">
          {people.map((person) => {
            const personId = idOf(person);
            const checked = selected.includes(personId);

            return (
              <div
                key={personId}
                className={`flex items-center gap-3 rounded-xl border bg-white p-3 transition-colors ${
                  checked ? 'border-primary-200' : 'border-ink-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleParticipant(personId)}
                  className="h-4 w-4 rounded border-ink-300 text-primary-600 focus:ring-primary-500"
                  aria-label={`Include ${person.fullName || person.username}`}
                />
                <UserAvatar user={person} size="xs" />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {person.fullName || person.username}
                  {personId === user?._id && <span className="text-ink-400"> (you)</span>}
                </span>

                {checked &&
                  (isEqual ? (
                    <span className="shrink-0 text-sm font-medium text-ink-600">
                      {selected.length > 0 && amount > 0
                        ? formatCurrency(amount / selected.length, form.currency)
                        : '—'}
                    </span>
                  ) : (
                    <div className="relative w-28 shrink-0">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={shares[personId] ?? ''}
                        onChange={(event) =>
                          setShares((prev) => ({ ...prev, [personId]: event.target.value }))
                        }
                        aria-label={`Share for ${person.fullName || person.username}`}
                        className="input py-1.5 pr-7 text-right text-sm"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">
                        {isPercentage ? '%' : CURRENCY_SYMBOLS[form.currency]}
                      </span>
                    </div>
                  ))}
              </div>
            );
          })}
        </div>

        {!isEqual && selected.length > 0 && (
          <p className={`mt-2 text-xs ${splitBalances ? 'text-emerald-600' : 'text-amber-600'}`}>
            {splitBalances
              ? 'Shares add up correctly.'
              : isPercentage
                ? `${round2(remainder)}% left to assign`
                : `${formatCurrency(remainder, form.currency)} left to assign`}
          </p>
        )}
      </div>

      <div className="mt-5">
        <label htmlFor="expense-notes" className="label">
          Notes <span className="font-normal text-ink-400">(optional)</span>
        </label>
        <textarea
          id="expense-notes"
          name="notes"
          rows="2"
          maxLength={500}
          value={form.notes}
          onChange={handleChange}
          placeholder="Anything worth remembering about this cost"
          className="input resize-y"
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row-reverse">
        <button type="submit" className="btn-primary" disabled={loading}>
          <Icon name="plus" className="h-4 w-4" />
          {loading ? 'Adding…' : 'Add expense'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
