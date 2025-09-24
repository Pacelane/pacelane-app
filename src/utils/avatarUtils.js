// Avatar Utilities
// Utility functions for generating user avatars using Bichaurinho mascots

// Import all Bichaurinho variants for direct access
import bichaurinho1 from '@/assets/bichaurinhos/bichaurinhos-1.svg';
import bichaurinho2 from '@/assets/bichaurinhos/bichaurinhos-2.svg';
import bichaurinho3 from '@/assets/bichaurinhos/bichaurinhos-3.svg';
import bichaurinho4 from '@/assets/bichaurinhos/bichaurinhos-4.svg';
import bichaurinho5 from '@/assets/bichaurinhos/bichaurinhos-5.svg';
import bichaurinho6 from '@/assets/bichaurinhos/bichaurinhos-6.svg';
import bichaurinho7 from '@/assets/bichaurinhos/bichaurinhos-7.svg';
import bichaurinho8 from '@/assets/bichaurinhos/bichaurinhos-8.svg';
import bichaurinho9 from '@/assets/bichaurinhos/bichaurinhos-9.svg';
import bichaurinho10 from '@/assets/bichaurinhos/bichaurinhos-10.svg';
import bichaurinho11 from '@/assets/bichaurinhos/bichaurinhos-11.svg';
import bichaurinho12 from '@/assets/bichaurinhos/bichaurinhos-12.svg';
import bichaurinho13 from '@/assets/bichaurinhos/bichaurinhos-13.svg';
import bichaurinho14 from '@/assets/bichaurinhos/bichaurinhos-14.svg';
import bichaurinho15 from '@/assets/bichaurinhos/bichaurinhos-15.svg';
import bichaurinho16 from '@/assets/bichaurinhos/bichaurinhos-16.svg';
import bichaurinho17 from '@/assets/bichaurinhos/bichaurinhos-17.svg';
import bichaurinho18 from '@/assets/bichaurinhos/bichaurinhos-18.svg';
import bichaurinho19 from '@/assets/bichaurinhos/bichaurinhos-19.svg';
import bichaurinho20 from '@/assets/bichaurinhos/bichaurinhos-20.svg';
import bichaurinho21 from '@/assets/bichaurinhos/bichaurinhos-21.svg';
import bichaurinho22 from '@/assets/bichaurinhos/bichaurinhos-22.svg';
import bichaurinho23 from '@/assets/bichaurinhos/bichaurinhos-23.svg';
import bichaurinho24 from '@/assets/bichaurinhos/bichaurinhos-24.svg';
import bichaurinho25 from '@/assets/bichaurinhos/bichaurinhos-25.svg';
import bichaurinho26 from '@/assets/bichaurinhos/bichaurinhos-26.svg';
import bichaurinho27 from '@/assets/bichaurinhos/bichaurinhos-27.svg';
import bichaurinho28 from '@/assets/bichaurinhos/bichaurinhos-28.svg';
import bichaurinho29 from '@/assets/bichaurinhos/bichaurinhos-29.svg';
import bichaurinho30 from '@/assets/bichaurinhos/bichaurinhos-30.svg';
import bichaurinho31 from '@/assets/bichaurinhos/bichaurinhos-31.svg';
import bichaurinho32 from '@/assets/bichaurinhos/bichaurinhos-32.svg';
import bichaurinhoDefault from '@/assets/bichaurinhos/bichaurinhos.svg';

// Map variants to their imported SVGs
const bichaurinhoVariants = {
  1: bichaurinho1,
  2: bichaurinho2,
  3: bichaurinho3,
  4: bichaurinho4,
  5: bichaurinho5,
  6: bichaurinho6,
  7: bichaurinho7,
  8: bichaurinho8,
  9: bichaurinho9,
  10: bichaurinho10,
  11: bichaurinho11,
  12: bichaurinho12,
  13: bichaurinho13,
  14: bichaurinho14,
  15: bichaurinho15,
  16: bichaurinho16,
  17: bichaurinho17,
  18: bichaurinho18,
  19: bichaurinho19,
  20: bichaurinho20,
  21: bichaurinho21,
  22: bichaurinho22,
  23: bichaurinho23,
  24: bichaurinho24,
  25: bichaurinho25,
  26: bichaurinho26,
  27: bichaurinho27,
  28: bichaurinho28,
  29: bichaurinho29,
  30: bichaurinho30,
  31: bichaurinho31,
  32: bichaurinho32,
  default: bichaurinhoDefault,
};

/**
 * Get a random Bichaurinho variant number (1-32)
 * Changes each time the user opens the app by using a session-based seed
 */
export const getRandomBichaurinhoVariant = () => {
  // Create a seed based on the current session
  // This ensures the avatar stays consistent during the session but changes on app restart
  let sessionSeed = sessionStorage.getItem('bichaurinho-avatar-seed');
  
  if (!sessionSeed) {
    // Generate a new seed for this session
    sessionSeed = Math.floor(Math.random() * 32) + 1;
    sessionStorage.setItem('bichaurinho-avatar-seed', sessionSeed.toString());
  }
  
  return parseInt(sessionSeed, 10);
};

/**
 * Get the Bichaurinho avatar URL for a given variant
 * This function returns the SVG URL that can be used in img src
 */
export const getBichaurinhoAvatarUrl = (variant = null) => {
  const selectedVariant = variant || getRandomBichaurinhoVariant();
  
  // Get the imported SVG URL
  const svgUrl = bichaurinhoVariants[selectedVariant] || bichaurinhoVariants.default;
  return svgUrl;
};

/**
 * Get user avatar URL - prioritizes custom avatar, falls back to Bichaurinho
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
  
  // Fallback to Bichaurinho avatar
  // For now, return a simple path - we'll enhance this with the canvas approach later
  const variant = getRandomBichaurinhoVariant();
  return getBichaurinhoAvatarUrl(variant);
};

/**
 * Reset the session avatar seed to get a new random Bichaurinho
 * Useful for testing or manual refresh functionality
 */
export const resetAvatarSeed = () => {
  sessionStorage.removeItem('bichaurinho-avatar-seed');
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
