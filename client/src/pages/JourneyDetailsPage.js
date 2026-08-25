import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import journeyService from '../services/journeyService';
import reviewService from '../services/reviewService';
import expenseService from '../services/expenseService';
import messageService from '../services/messageService';
import { getErrorMessage } from '../api/client';
import UserAvatar from '../components/UserAvatar';
import JourneyMap from '../components/JourneyMap';
import ReviewForm from '../components/ReviewForm';
import ReviewList from '../components/ReviewList';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';
import ExpenseSummary from '../components/ExpenseSummary';
import ConfirmDialog from '../components/ConfirmDialog';
import ErrorMessage from '../components/ErrorMessage';
import StatusBadge from '../components/StatusBadge';
import Loader from '../components/Loader';
import Icon, { TRANSPORT_ICONS } from '../components/Icon';
import { formatCurrency } from '../utils/formatCurrency';
import { formatLongDate, isPast } from '../utils/formatDate';

const TRANSPORT_LABELS = {
  bus: 'Bus',
  train: 'Train',
  flight: 'Flight',
  car: 'Car',
  other: 'Other',
};

const idOf = (value) => (typeof value === 'object' && value ? value._id : value);

const JourneyDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [reviewTarget, setReviewTarget] = useState(null);

  const [expenses, setExpenses] = useState([]);
  const [expenseSummary, setExpenseSummary] = useState(null);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const [message, setMessage] = useState('');
  const [messageState, setMessageState] = useState({ sending: false, error: '', success: '' });

  const [confirm, setConfirm] = useState(null);

  const loadJourney = useCallback(async () => {
    try {
      setError(null);
      setJourney(await journeyService.getJourneyById(id));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load this journey'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    loadJourney();
  }, [loadJourney]);

  // Derived roles. Companion entries can reference a deleted user, so every
  // lookup goes through idOf rather than assuming a populated object.
  const roles = useMemo(() => {
    if (!journey) return {};

    const userId = user?._id;
    const companions = journey.companions || [];
    const mine = companions.find((companion) => idOf(companion.user) === userId);

    return {
      isCreator: Boolean(userId) && idOf(journey.creator) === userId,
      myStatus: mine?.status || null,
      isAccepted: mine?.status === 'accepted',
      accepted: companions.filter((companion) => companion.status === 'accepted'),
      pending: companions.filter((companion) => companion.status === 'pending'),
    };
  }, [journey, user]);

  const isParticipant = roles.isCreator || roles.isAccepted;
  const departed = journey ? isPast(journey.departureDate) : false;

  const canJoin =
    Boolean(user) && journey && !roles.isCreator && !roles.myStatus && journey.status === 'open' && !departed;

  // Reviews are public and only meaningful once the trip is done.
  useEffect(() => {
    if (!journey?._id || journey.status !== 'completed') {
      setReviews([]);
      return;
    }

    reviewService
      .getJourneyReviews(journey._id)
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [journey?._id, journey?.status]);

  const loadExpenses = useCallback(async (journeyId) => {
    try {
      setLoadingExpenses(true);
      const [list, summary] = await Promise.all([
        expenseService.getJourneyExpenses(journeyId),
        expenseService.getJourneyExpenseSummary(journeyId),
      ]);
      setExpenses(list);
      setExpenseSummary(summary);
    } catch {
      // The expense endpoints are participant-only; a non-participant simply
      // does not see this section.
      setExpenses([]);
      setExpenseSummary(null);
    } finally {
      setLoadingExpenses(false);
    }
  }, []);

  useEffect(() => {
    if (journey?._id && isParticipant) {
      loadExpenses(journey._id);
    }
  }, [journey?._id, isParticipant, loadExpenses]);

  const runAction = async (name, action) => {
    try {
      setActionError(null);
      setPendingAction(name);
      setJourney(await action());
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setPendingAction(null);
      setConfirm(null);
    }
  };

  const handleJoin = () => runAction('join', () => journeyService.joinJourney(id));

  const handleRespond = (userId, status) =>
    runAction(`respond-${userId}`, () => journeyService.respondToJoinRequest(id, userId, status));

  const handleComplete = () => runAction('complete', () => journeyService.completeJourney(id));

  const handleCancel = () => runAction('cancel', () => journeyService.cancelJourney(id));

  const handleDelete = async () => {
    try {
      setPendingAction('delete');
      await journeyService.deleteJourney(id);
      navigate('/dashboard');
    } catch (err) {
      setActionError(getErrorMessage(err));
      setPendingAction(null);
      setConfirm(null);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!message.trim()) {
      setMessageState({ sending: false, error: 'Write a message first', success: '' });
      return;
    }

    try {
      setMessageState({ sending: true, error: '', success: '' });

      await messageService.sendMessage({
        recipient: idOf(journey.creator),
        content: message,
        journey: journey._id,
      });

      setMessage('');
      setMessageState({ sending: false, error: '', success: 'Message sent.' });
    } catch (err) {
      setMessageState({ sending: false, error: getErrorMessage(err), success: '' });
    }
  };

  const handleExpenseAdded = (expense) => {
    setExpenses((prev) => [expense, ...prev]);
    setShowExpenseForm(false);
    loadExpenses(journey._id);
  };

  const handleSettleExpense = async (expenseId) => {
    try {
      const updated = await expenseService.settleExpense(expenseId);
      setExpenses((prev) => prev.map((item) => (item._id === expenseId ? updated : item)));
      setExpenseSummary(await expenseService.getJourneyExpenseSummary(journey._id));
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      await expenseService.deleteExpense(expenseId);
      setExpenses((prev) => prev.filter((item) => item._id !== expenseId));
      setExpenseSummary(await expenseService.getJourneyExpenseSummary(journey._id));
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleReviewSubmitted = (review) => {
    setReviews((prev) => [review, ...prev]);
    setReviewTarget(null);
  };

  if (loading) return <Loader fullScreen label="Loading journey" />;

  if (error || !journey) {
    return (
      <div className="container py-16">
        <ErrorMessage error={error || 'Journey not found'} />
        <Link to="/journeys" className="btn-secondary mt-6">
          <Icon name="arrowLeft" className="h-4 w-4" />
          Back to journeys
        </Link>
      </div>
    );
  }

  const { origin, destination, departureDate, returnDate, transportMode, estimatedCost, maxCompanions, description, status, creator } =
    journey;

  // Who this user could review: the creator reviews companions, a companion
  // reviews the creator. Anyone already reviewed drops off the list.
  const alreadyReviewed = new Set(
    reviews.filter((review) => idOf(review.reviewer) === user?._id).map((review) => idOf(review.reviewedUser))
  );

  const reviewableUsers =
    status === 'completed' && user
      ? (roles.isCreator
          ? roles.accepted.map((companion) => companion.user)
          : roles.isAccepted
            ? [creator]
            : []
        ).filter((person) => person && !alreadyReviewed.has(idOf(person)))
      : [];

  const facts = [
    { icon: 'calendar', label: 'Departure', value: formatLongDate(departureDate) },
    returnDate && { icon: 'calendar', label: 'Return', value: formatLongDate(returnDate) },
    { icon: TRANSPORT_ICONS[transportMode], label: 'Transport', value: TRANSPORT_LABELS[transportMode] },
    estimatedCost != null && {
      icon: 'wallet',
      label: 'Estimated cost',
      value: `${formatCurrency(estimatedCost)} per person`,
    },
    {
      icon: 'users',
      label: 'Companions',
      value: `${roles.accepted.length} of ${maxCompanions} seats taken`,
    },
  ].filter(Boolean);

  return (
    <div className="bg-ink-50 pb-16">
      <div className="relative overflow-hidden bg-ink-950">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-900 to-ink-950" aria-hidden="true" />
        <div className="absolute inset-0 bg-grid-faint [background-size:32px_32px]" aria-hidden="true" />

        <div className="container relative py-10">
          <Link
            to="/journeys"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white"
          >
            <Icon name="arrowLeft" className="h-4 w-4" />
            All journeys
          </Link>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 text-white/70">
                <Icon name={TRANSPORT_ICONS[transportMode]} className="h-5 w-5" />
                <span className="text-sm font-medium">{TRANSPORT_LABELS[transportMode]}</span>
              </div>
              <h1 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-4xl">
                {origin} <span className="text-white/40">&rarr;</span> {destination}
              </h1>
              <p className="mt-2 text-white/60">{formatLongDate(departureDate)}</p>
            </div>

            <StatusBadge status={status} onDark className="mt-2" />
          </div>
        </div>
      </div>

      <div className="container -mt-6">
        {actionError && (
          <ErrorMessage error={actionError} className="mb-6" onDismiss={() => setActionError(null)} />
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="card p-6">
              <h2 className="text-lg">Journey details</h2>

              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-50 text-ink-500">
                      <Icon name={fact.icon} className="h-4 w-4" />
                    </span>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
                        {fact.label}
                      </dt>
                      <dd className="mt-0.5 text-sm font-medium text-ink-900">{fact.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>

              {description && (
                <div className="mt-6 rounded-xl bg-ink-50 p-4">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{description}</p>
                </div>
              )}
            </section>

            {journey.originCoords?.coordinates?.length > 0 && (
              <section className="card p-6">
                <h2 className="text-lg">Route</h2>
                <div className="mt-4">
                  <JourneyMap journey={journey} />
                </div>
              </section>
            )}

            {isParticipant && (
              <section className="card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg">Shared expenses</h2>
                    <p className="mt-1 text-sm text-ink-500">
                      Track what everyone paid and who owes what.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowExpenseForm((open) => !open)}
                    className={showExpenseForm ? 'btn-secondary btn-sm' : 'btn-primary btn-sm'}
                  >
                    <Icon name={showExpenseForm ? 'x' : 'plus'} className="h-4 w-4" />
                    {showExpenseForm ? 'Cancel' : 'Add expense'}
                  </button>
                </div>

                {showExpenseForm && (
                  <div className="mt-5">
                    <ExpenseForm
                      journey={journey}
                      onExpenseAdded={handleExpenseAdded}
                      onCancel={() => setShowExpenseForm(false)}
                    />
                  </div>
                )}

                <div className="mt-5">
                  {loadingExpenses ? (
                    <Loader label="Loading expenses" />
                  ) : (
                    <ExpenseList
                      expenses={expenses}
                      currentUserId={user?._id}
                      onSettleExpense={handleSettleExpense}
                      onDeleteExpense={handleDeleteExpense}
                    />
                  )}
                </div>
              </section>
            )}

            {status === 'completed' && (
              <section className="card p-6">
                <h2 className="text-lg">Reviews</h2>

                {reviewTarget ? (
                  <div className="mt-5">
                    <ReviewForm
                      journey={journey}
                      reviewedUser={reviewTarget}
                      onReviewSubmitted={handleReviewSubmitted}
                      onCancel={() => setReviewTarget(null)}
                    />
                  </div>
                ) : (
                  reviewableUsers.length > 0 && (
                    <div className="mt-5 rounded-xl border border-ink-100 bg-ink-50 p-4">
                      <p className="text-sm font-medium text-ink-700">Who would you like to review?</p>
                      <div className="mt-3 space-y-2">
                        {reviewableUsers.map((person) => (
                          <div
                            key={idOf(person)}
                            className="flex items-center justify-between rounded-xl bg-white p-3"
                          >
                            <div className="flex items-center gap-3">
                              <UserAvatar user={person} size="sm" />
                              <span className="text-sm font-medium">
                                {person.fullName || person.username}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setReviewTarget(person)}
                              className="btn-secondary btn-sm"
                            >
                              <Icon name="star" className="h-3.5 w-3.5" />
                              Review
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}

                <div className="mt-5">
                  <ReviewList reviews={reviews} showHeading={false} />
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <section className="card p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                Posted by
              </h2>

              <Link to={`/users/${idOf(creator)}`} className="mt-4 flex items-center gap-3 group">
                <UserAvatar user={creator} size="lg" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink-900 group-hover:text-primary-700">
                    {creator?.fullName || creator?.username}
                  </p>
                  <p className="truncate text-sm text-ink-500">{creator?.university}</p>
                  {creator?.reviewCount > 0 && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-ink-600">
                      <Icon name="star" filled className="h-3.5 w-3.5 text-amber-400" />
                      {creator.averageRating?.toFixed(1)} · {creator.reviewCount} review
                      {creator.reviewCount === 1 ? '' : 's'}
                    </p>
                  )}
                </div>
              </Link>

              {creator?.bio && <p className="mt-4 text-sm leading-relaxed text-ink-600">{creator.bio}</p>}
            </section>

            <section className="card p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                  Companions
                </h2>
                <span className="badge-neutral">
                  {roles.accepted.length}/{maxCompanions}
                </span>
              </div>

              {roles.accepted.length === 0 && roles.pending.length === 0 ? (
                <p className="mt-4 text-sm text-ink-500">No one has joined yet.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {[...roles.accepted, ...(roles.isCreator ? roles.pending : [])].map((companion) => (
                    <li
                      key={idOf(companion.user) || companion.joinedAt}
                      className="flex items-center justify-between gap-3 rounded-xl bg-ink-50 p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <UserAvatar user={companion.user} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {companion.user?.fullName || companion.user?.username || 'Removed user'}
                          </p>
                          <p className="truncate text-xs text-ink-500">{companion.user?.university}</p>
                        </div>
                      </div>

                      {roles.isCreator && companion.status === 'pending' ? (
                        <div className="flex shrink-0 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRespond(idOf(companion.user), 'accepted')}
                            disabled={pendingAction === `respond-${idOf(companion.user)}`}
                            className="rounded-lg bg-emerald-600 p-1.5 text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                            aria-label="Accept request"
                          >
                            <Icon name="check" className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRespond(idOf(companion.user), 'rejected')}
                            disabled={pendingAction === `respond-${idOf(companion.user)}`}
                            className="rounded-lg bg-white p-1.5 text-ink-500 ring-1 ring-ink-200 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            aria-label="Decline request"
                          >
                            <Icon name="x" className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <StatusBadge status={companion.status} className="shrink-0" />
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {canJoin && (
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={pendingAction === 'join'}
                  className="btn-primary mt-5 w-full"
                >
                  {pendingAction === 'join' ? 'Sending request…' : 'Ask to join'}
                </button>
              )}

              {!user && (
                <Link to="/login" className="btn-primary mt-5 w-full">
                  Log in to join
                </Link>
              )}

              {roles.myStatus === 'pending' && (
                <p className="alert-warning mt-5">Your request is waiting for approval.</p>
              )}
              {roles.myStatus === 'accepted' && (
                <p className="alert-success mt-5">You are on this journey.</p>
              )}
              {roles.myStatus === 'rejected' && (
                <p className="alert-error mt-5">Your request was declined.</p>
              )}
            </section>

            {roles.isCreator && (
              <section className="card p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                  Manage
                </h2>
                <div className="mt-4 space-y-2">
                  {departed && status !== 'completed' && status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={handleComplete}
                      disabled={pendingAction === 'complete'}
                      className="btn-primary w-full"
                    >
                      <Icon name="check" className="h-4 w-4" />
                      Mark as completed
                    </button>
                  )}

                  {status !== 'completed' && status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() =>
                        setConfirm({
                          title: 'Cancel this journey?',
                          message:
                            'Companions will see it as cancelled and no one else can join. This cannot be undone.',
                          confirmText: 'Cancel journey',
                          onConfirm: handleCancel,
                        })
                      }
                      className="btn-secondary w-full"
                    >
                      Cancel journey
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setConfirm({
                        title: 'Delete this journey?',
                        message:
                          'This permanently removes the journey along with its expenses and reviews.',
                        confirmText: 'Delete',
                        isDestructive: true,
                        onConfirm: handleDelete,
                      })
                    }
                    className="btn-ghost w-full text-red-600 hover:bg-red-50"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                    Delete journey
                  </button>
                </div>
              </section>
            )}

            {isParticipant && expenseSummary && (
              <ExpenseSummary summary={expenseSummary} currentUserId={user?._id} />
            )}

            {user && !roles.isCreator && (
              <section className="card p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                  Message the organiser
                </h2>

                {messageState.success && (
                  <div className="alert-success mt-4">
                    <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      {messageState.success}{' '}
                      <Link to="/messages" className="link">
                        Open conversation
                      </Link>
                    </span>
                  </div>
                )}

                <ErrorMessage error={messageState.error} className="mt-4" />

                <form onSubmit={handleSendMessage} className="mt-4">
                  <textarea
                    value={message}
                    onChange={(event) => {
                      setMessage(event.target.value);
                      setMessageState((prev) => ({ ...prev, error: '' }));
                    }}
                    rows="3"
                    maxLength={2000}
                    placeholder="Hi! Is there still space?"
                    className="input resize-y"
                  />
                  <button
                    type="submit"
                    disabled={messageState.sending}
                    className="btn-primary mt-3 w-full"
                  >
                    <Icon name="send" className="h-4 w-4" />
                    {messageState.sending ? 'Sending…' : 'Send message'}
                  </button>
                </form>
              </section>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={confirm?.onConfirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmText={confirm?.confirmText}
        isDestructive={confirm?.isDestructive}
        isPending={Boolean(pendingAction)}
      />
    </div>
  );
};

export default JourneyDetailsPage;
