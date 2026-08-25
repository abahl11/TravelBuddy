import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import reviewService from '../services/reviewService';
import { getErrorMessage } from '../api/client';
import UserAvatar from '../components/UserAvatar';
import ReviewList from '../components/ReviewList';
import ErrorMessage from '../components/ErrorMessage';
import Loader from '../components/Loader';
import Icon from '../components/Icon';
import { formatShortDate } from '../utils/formatDate';

const EMPTY_PASSWORDS = { password: '', confirmPassword: '' };

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();

  const [form, setForm] = useState({
    username: '',
    email: '',
    fullName: '',
    university: '',
    hometown: '',
    bio: '',
    contactNumber: '',
    profilePicture: '',
    ...EMPTY_PASSWORDS,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Reset the form whenever the signed-in profile changes.
  useEffect(() => {
    if (!user) return;

    setForm({
      username: user.username || '',
      email: user.email || '',
      fullName: user.fullName || '',
      university: user.university || '',
      hometown: user.hometown || '',
      bio: user.bio || '',
      contactNumber: user.contactNumber || '',
      profilePicture: user.profilePicture || '',
      ...EMPTY_PASSWORDS,
    });
  }, [user]);

  const loadReviews = useCallback(async (userId) => {
    try {
      const data = await reviewService.getUserReviews(userId);
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
    } catch {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  // Only re-fetch when the id changes, not on every profile save.
  useEffect(() => {
    if (user?._id) loadReviews(user._id);
  }, [user?._id, loadReviews]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (form.password && form.password !== form.confirmPassword) {
      setError('The two passwords do not match');
      return;
    }

    if (form.password && form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);

      const { confirmPassword, password, ...profile } = form;
      const payload = password ? { ...profile, password } : profile;

      await updateProfile(payload);
      setForm((prev) => ({ ...prev, ...EMPTY_PASSWORDS }));
      setSuccess('Profile updated.');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update your profile'));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <Loader fullScreen />;

  return (
    <div className="bg-ink-50 py-10">
      <div className="container">
        <h1 className="text-3xl sm:text-4xl">Your profile</h1>
        <p className="mt-2 text-ink-500">This is what other students see when you post or join a trip.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <section className="card p-6 text-center">
              <UserAvatar user={user} size="xl" className="mx-auto" />
              <h2 className="mt-4 text-lg">{user.fullName}</h2>
              <p className="text-sm text-ink-500">@{user.username}</p>

              {user.reviewCount > 0 && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">
                  <Icon name="star" filled className="h-4 w-4 text-amber-400" />
                  {user.averageRating?.toFixed(1)} · {user.reviewCount} review
                  {user.reviewCount === 1 ? '' : 's'}
                </p>
              )}

              <dl className="mt-6 space-y-3 border-t border-ink-100 pt-5 text-left text-sm">
                {[
                  { label: 'University', value: user.university },
                  { label: 'Hometown', value: user.hometown },
                  { label: 'Member since', value: formatShortDate(user.createdAt) },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between gap-3">
                    <dt className="text-ink-500">{item.label}</dt>
                    <dd className="truncate text-right font-medium text-ink-900">{item.value || '—'}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="card p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                Reviews about you
              </h2>
              <div className="mt-4">
                {loadingReviews ? (
                  <Loader size="sm" />
                ) : (
                  <ReviewList
                    reviews={reviews}
                    showHeading={false}
                    emptyMessage="Complete a journey and your companions can review you."
                  />
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
              <ErrorMessage error={error} onDismiss={() => setError('')} className="mb-5" />
              {success && <ErrorMessage error={success} variant="success" className="mb-5" />}

              <fieldset className="space-y-5">
                <legend className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                  Account
                </legend>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="username" className="label">
                      Username
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={form.username}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="label">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="fullName" className="label">
                      Full name
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={form.fullName}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="contactNumber" className="label">
                      Contact number <span className="font-normal text-ink-400">(optional)</span>
                    </label>
                    <input
                      id="contactNumber"
                      name="contactNumber"
                      type="tel"
                      value={form.contactNumber}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>

                  <div>
                    <label htmlFor="university" className="label">
                      University
                    </label>
                    <input
                      id="university"
                      name="university"
                      type="text"
                      value={form.university}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="hometown" className="label">
                      Hometown
                    </label>
                    <input
                      id="hometown"
                      name="hometown"
                      type="text"
                      value={form.hometown}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="profilePicture" className="label">
                    Profile picture URL <span className="font-normal text-ink-400">(optional)</span>
                  </label>
                  <input
                    id="profilePicture"
                    name="profilePicture"
                    type="url"
                    value={form.profilePicture}
                    onChange={handleChange}
                    placeholder="https://…"
                    className="input"
                  />
                  <p className="mt-1.5 text-xs text-ink-400">
                    Leave this blank to keep your initials avatar.
                  </p>
                </div>

                <div>
                  <label htmlFor="bio" className="label">
                    Bio <span className="font-normal text-ink-400">(optional)</span>
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows="4"
                    maxLength={500}
                    value={form.bio}
                    onChange={handleChange}
                    placeholder="A line or two so people know who they are travelling with."
                    className="input resize-y"
                  />
                  <p className="mt-1.5 text-right text-xs text-ink-400">{form.bio.length}/500</p>
                </div>
              </fieldset>

              <fieldset className="mt-8 space-y-5 border-t border-ink-100 pt-8">
                <legend className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                  Change password
                </legend>
                <p className="-mt-2 text-sm text-ink-500">Leave both blank to keep your current one.</p>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="password" className="label">
                      New password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="label">
                      Confirm new password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                </div>
              </fieldset>

              <div className="mt-8 flex justify-end border-t border-ink-100 pt-6">
                <button type="submit" className="btn-primary btn-lg" disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
