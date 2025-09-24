import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@/services/theme-context';
import { useAuth } from '@/hooks/api/useAuth';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { stroke } from '@/design-system/tokens/stroke';
import { getBichaurinhoAvatarUrl, getUserDisplayName } from '@/utils/avatarUtils';

/**
 * UserAvatar - A design system component for displaying user avatars
 * Automatically handles fallback to Bichaurinho avatars with white background
 * when no custom avatar is available
 * 
 * @param {Object} props
 * @param {string} [props.size] - Avatar size ('xs', 'sm', 'md', 'lg', 'xl' or pixel value)
 * @param {string} [props.src] - Custom avatar URL (overrides all other sources)
 * @param {Object} [props.profile] - User profile object
 * @param {Object} [props.user] - User object
 * @param {string} [props.alt] - Alt text for accessibility
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.style] - Custom styles
 */
const UserAvatar = ({ 
  size = 'md', 
  src = null, 
  profile = null, 
  user = null, 
  alt = null, 
  className = '', 
  style = {},
  ...rest 
}) => {
  const { colors } = useTheme();
  const { user: authUser, profile: authProfile } = useAuth();
  
  // Use provided props or fall back to auth context
  const currentUser = user || authUser;
  const currentProfile = profile || authProfile;
  
  // Size mapping
  const sizeMap = {
    xs: '16px',
    sm: '24px', 
    md: '32px',
    lg: '48px',
    xl: '64px',
  };
  
  // Determine pixel size
  const pixelSize = sizeMap[size] || size;
  
  // Determine avatar source
  const getAvatarSrc = () => {
    // 1. Use explicit src prop if provided
    if (src) return src;
    
    // 2. Check for custom uploaded avatar
    if (currentProfile?.avatar_url) return currentProfile.avatar_url;
    
    // 3. Check for OAuth provider avatar
    if (currentUser?.user_metadata?.avatar_url) return currentUser.user_metadata.avatar_url;
    
    // 4. Fallback to Bichaurinho avatar
    return getBichaurinhoAvatarUrl();
  };
  
  const avatarSrc = getAvatarSrc();
  const isBichaurinho = avatarSrc.includes('bichaurinhos');
  
  // Determine alt text
  const getAltText = () => {
    if (alt) return alt;
    const displayName = getUserDisplayName(currentProfile, currentUser);
    return `${displayName}'s avatar`;
  };
  
  // Avatar container styles
  const containerStyles = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: pixelSize,
    height: pixelSize,
    borderRadius: cornerRadius.borderRadius.full,
    overflow: 'hidden',
    border: `${stroke.default} solid ${colors.border.default}`,
    backgroundColor: isBichaurinho ? '#FFFFFF' : colors.bg.subtle,
    flexShrink: 0,
    ...style,
  };
  
  // Image styles
  const imageStyles = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
    display: 'block',
  };
  
  // Special styles for Bichaurinho avatars
  const bichaurinhoStyles = isBichaurinho ? {
    ...imageStyles,
    padding: '10%', // Add padding for Bichaurinho to not touch edges
    width: '80%',
    height: '80%',
    objectFit: 'contain', // Use contain instead of cover for SVGs
  } : imageStyles;
  
  return (
    <div
      className={className}
      style={containerStyles}
      {...rest}
    >
      <img
        src={avatarSrc}
        alt={getAltText()}
        style={bichaurinhoStyles}
        onError={(e) => {
          // Fallback to default Bichaurinho if image fails to load
          if (!e.target.src.includes('bichaurinhos')) {
            e.target.src = getBichaurinhoAvatarUrl();
          }
        }}
      />
    </div>
  );
};

UserAvatar.propTypes = {
  size: PropTypes.oneOfType([
    PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
    PropTypes.string, // For custom pixel values like '48px'
  ]),
  src: PropTypes.string,
  profile: PropTypes.object,
  user: PropTypes.object, 
  alt: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default UserAvatar;
