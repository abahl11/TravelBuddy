import React, { useState } from 'react';
import InitialsAvatar, { AVATAR_SIZES } from './InitialsAvatar';

/**
 * Shows the profile picture when there is one, and falls back to initials both
 * when the field is empty and when the image fails to load.
 */
const UserAvatar = ({ user, size = 'md', className = '' }) => {
  const [failed, setFailed] = useState(false);
  const name = user?.fullName || user?.username;

  if (!user?.profilePicture || failed) {
    return <InitialsAvatar name={name} size={size} className={className} />;
  }

  return (
    <img
      src={user.profilePicture}
      alt={name || 'User'}
      onError={() => setFailed(true)}
      loading="lazy"
      className={`shrink-0 rounded-full bg-ink-100 object-cover ring-1 ring-black/5 ${
        AVATAR_SIZES[size] || AVATAR_SIZES.md
      } ${className}`}
    />
  );
};

export default UserAvatar;
