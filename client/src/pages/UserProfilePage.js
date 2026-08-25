import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import { getErrorMessage } from '../api/client';
import UserAvatar from '../components/UserAvatar';
import ReviewList from '../components/ReviewList';
import ErrorMessage from '../components/ErrorMessage';
import Loader from '../components/Loader';
import Icon from '../components/Icon';
import { formatShortDate } from '../utils/formatDate';

/** Public profile — the page a creator's name links to from a journey. */
const UserProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await authService.getPublicProfile(id);
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load this profile'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <Loader fullScreen label="Loading profile" />;

  if (error || !profile) {
    return (
      <div className="container py-16">
        <ErrorMessage error={error || 'Profile not found'} />
        <Link to="/journeys" className="btn-secondary mt-6">
          <Icon name="arrowLeft" className="h-4 w-4" />
          Back to journeys
        </Link>
      </div>
    );
  }

  const isSelf = currentUser?._id === profile._id;

  return (
    <div className="bg-ink-50 py-10">
      <div className="container max-w-4xl">
        <div className="card overflow-hidden">
          <div className="relative h-28 bg-gradient-to-br from-primary-700 to-primary-950">
            <div className="absolute inset-0 bg-grid-faint [background-size:24px_24px]" aria-hidden="true" />
          </div>

          <div className="px-6 pb-6">
            <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <UserAvatar user={profile} size="xl" className="ring-4 ring-white" />
                <div className="pb-1">
                  <h1 className="text-2xl">{profile.fullName}</h1>
                  <p className="text-sm text-ink-500">@{profile.username}</p>
                </div>
              </div>

              {!isSelf && currentUser && (
                <Link to={`/messages?with=${profile._id}`} className="btn-secondary">
                  <Icon name="message" className="h-4 w-4" />
                  Message
                </Link>
              )}
              {isSelf && (
                <Link to="/profile" className="btn-secondary">
                  Edit profile
                </Link>
              )}
            </div>

            {profile.bio && <p className="mt-5 leading-relaxed text-ink-600">{profile.bio}</p>}

            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-ink-100 pt-5 text-sm">
              {[
                { icon: 'globe', label: 'University', value: profile.university },
                { icon: 'mapPin', label: 'Hometown', value: profile.hometown },
                { icon: 'clock', label: 'Member since', value: formatShortDate(profile.createdAt) },
                profile.reviewCount > 0 && {
                  icon: 'star',
                  label: 'Rating',
                  value: `${profile.averageRating?.toFixed(1)} from ${profile.reviewCount} review${
                    profile.reviewCount === 1 ? '' : 's'
                  }`,
                },
              ]
                .filter(Boolean)
                .map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <Icon name={item.icon} className="h-4 w-4 text-ink-400" />
                    <dt className="sr-only">{item.label}</dt>
                    <dd className="text-ink-700">{item.value}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>

        <div className="mt-6">
          <ReviewList
            reviews={profile.reviews}
            title={`Reviews about ${profile.fullName?.split(' ')[0] || profile.username}`}
            emptyMessage="No one has reviewed this traveller yet."
          />
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
