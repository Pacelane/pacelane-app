// Avatar Utilities
// Utility functions for generating user avatars with default fallback

// Import default profile picture
import defaultAvatar from '@/assets/images/pfp-avatar.png';

/**
 * Get user avatar URL - prioritizes custom avatar, falls back to default avatar
 * This is the main function that should be used throughout the app
 */
export const getUserAvatarUrl = (profile = null, user = null) => {
  // Check if user has a custom avatar uploaded
  if (profile?.avatar_url) {
    return profile.avatar_url;
  }
  
  // Check if user has an avatar from OAuth provider
  if (user?.user_metadata?.avatar_url) {
    return user.user_metadata.avatar_url;
  }
  
  // Fallback to default avatar
  return defaultAvatar;
};

/**
 * Get user display name from profile/user data
 * This is a helper function commonly used alongside avatar generation
 */
export const getUserDisplayName = (profile = null, user = null) => {
  if (profile?.display_name) return profile.display_name;
  if (profile?.linkedin_name) return profile.linkedin_name;
  if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
  if (user?.user_metadata?.name) return user.user_metadata.name;
  if (user?.email) return user.email.split('@')[0];
  return 'User';
};
