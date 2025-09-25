import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useProfile } from '@/hooks/api/useProfile';
import { useTheme } from '@/services/theme-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

// Design System Components
// Sidebar is provided by MainAppChrome
import Button from '@/design-system/components/Button';
import Input from '@/design-system/components/Input';
import TextArea from '@/design-system/components/TextArea';
// Removed unused imports per PCL-264, PCL-265, PCL-266
// import SidebarMenuItem from '@/design-system/components/SidebarMenuItem';
// import Chips from '@/design-system/components/Chips';
// import EmptyState from '@/design-system/components/EmptyState';
import UserAvatar from '@/design-system/components/UserAvatar';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';

// Icons
import { 
  // Plus, // Removed per PCL-265, PCL-266
  // Trash2, // Removed per PCL-265, PCL-266
  Check,
  // X, // Removed per PCL-265, PCL-266
  // Sparkles, // Removed per PCL-265, PCL-266
  // Info, // Removed per PCL-265, PCL-266
  LogOut,
  RefreshCw
} from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, saving, updateBasicProfile } = useProfile();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  
  // Sidebar state
  // Sidebar handled by layout
  
  // State for active section in side menu - REMOVED per PCL-264
  // const [activeSection, setActiveSection] = useState('personal');
  
  // Personal Information state - connected to real profile data
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    profession: '',
    avatar: '',
    linkedinUrl: '',
    bio: ''
  });



  // Load inspirations from separate table - REMOVED per PCL-265, PCL-266
  // const loadInspirations = async () => { ... }
  // const saveInspirationsToTable = async () => { ... }

  // Extract LinkedIn bio from nested JSON structure
  const extractLinkedInBio = (profile) => {
    // With the new edge function, linkedin_about should be automatically populated
    // But we still keep the extraction logic as a fallback for existing data
    
    // Primary: Use the flattened field (populated by edge function)
    if (profile?.linkedin_about) {
      return profile.linkedin_about;
    }
    
    // Fallback: Extract from nested structure for older data
    if (!profile?.linkedin_data) return '';
    
    // Try to get bio from the nested structure: linkedin_data.last_scrape_raw.basic_info.about
    const lastScrapeRaw = profile.linkedin_data.last_scrape_raw;
    if (lastScrapeRaw?.basic_info?.about) {
      return lastScrapeRaw.basic_info.about;
    }
    
    // Fallback to summary.about if available
    if (profile.linkedin_data.summary?.about) {
      return profile.linkedin_data.summary.about;
    }
    
    return '';
  };

  // Load profile data into state when profile loads
  useEffect(() => {
    if (profile) {
      // Extract LinkedIn bio from nested structure
      const linkedinBio = extractLinkedInBio(profile);
      
      setPersonalInfo({
        name: profile.display_name || profile.linkedin_name || '',
        profession: profile.linkedin_headline || '',
        avatar: null, // Will use Bichaurinho avatar as fallback
        linkedinUrl: profile.linkedin_profile || '',
        bio: linkedinBio
      });

      // Removed loading of guides, pillars, and inspirations per PCL-265, PCL-266
    }
  }, [profile]);

  // Removed inspirations loading useEffect per PCL-265, PCL-266

  // Dynamic lists state - REMOVED per PCL-265, PCL-266
  // const [inspirations, setInspirations] = useState([{ id: 1, value: '' }]);
  // const [guides, setGuides] = useState([{ id: 1, value: '' }]);
  // const [pillars, setPillars] = useState([{ id: 1, value: '' }]);
  // const [newPillar, setNewPillar] = useState('');
  // const [newGuide, setNewGuide] = useState('');
  // const [targetPersona, setTargetPersona] = useState('');
  // const [competitors, setCompetitors] = useState([{ id: 1, url: '' }]);

  // Saved states for each section
  const [savedStates, setSavedStates] = useState({
    profile: false,
    bio: false
    // Removed unused sections per PCL-265, PCL-266: inspirations, targetPersona, competitors, guides, pillars
  });

  // Get user display info
  const getUserName = () => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.linkedin_name) return profile.linkedin_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };



  // Side menu items - REMOVED per PCL-264
  // const menuItems = [
  //   { id: 'personal', label: 'Personal Information' },
  //   // { id: 'inspirations', label: 'Inspirations' }, // Commented out per PCL-106
  //   { id: 'guides', label: 'Tone of Voice' },
  //   { id: 'pillars', label: 'Editorial Topics' }
  // ];

  // Generic functions for managing dynamic lists - REMOVED per PCL-265, PCL-266
  // const addListItem = (listType, setterFunction) => { ... }
  // const removeListItem = (listType, setterFunction, id) => { ... }
  // const updateListItem = (listType, setterFunction, id, value) => { ... }
  // const getCurrentList = (listType) => { ... }
  // const getSetterFunction = (listType) => { ... }

  // Save functions for different sections
  const handleSave = async (sectionId) => {
    try {
      let updateData = {};

      switch (sectionId) {
        case 'profile':
          updateData = {
            display_name: personalInfo.name,
            linkedin_profile: personalInfo.linkedinUrl
          };
          break;
        case 'bio':
          updateData = {
            linkedin_about: personalInfo.bio
          };
          break;
        // Removed unused cases per PCL-265, PCL-266: guides, inspirations, pillars
        default:
          // For sections not yet connected to backend, just show saved state
          break;
      }

      if (Object.keys(updateData).length > 0) {
        await updateBasicProfile(updateData);
      }

      setSavedStates(prev => ({
        ...prev,
        [sectionId]: true
      }));
      
      // Reset saved state after 2 seconds
      setTimeout(() => {
        setSavedStates(prev => ({
          ...prev,
          [sectionId]: false
        }));
      }, 2000);

    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  // Sidebar event handlers
  const handleMenuItemClick = (menuId: string) => {
    switch (menuId) {
      case 'home':
        navigate('/product-home');
        break;
      case 'profile':
        // Already on profile
        break;
      case 'knowledge':
        navigate('/knowledge');
        break;
      case 'history':
        navigate('/posts');
        break;
      default:
        console.log('Navigation for:', menuId);
    }
  };

  const handleCreateNewClick = () => {
    navigate('/content-editor');
  };

  const handleAvatarClick = () => {
    // Already on profile
  };

  const handleSignOut = async () => {
    const result = await signOut();
    if (!result.error) {
      navigate('/signin');
    }
  };



  // Guides, Pillars, and Competitors functions - REMOVED per PCL-265, PCL-266
  // const addGuideChip = () => { ... }
  // const removeGuideChip = (guideId) => { ... }
  // const handleGuideKeyPress = (e) => { ... }
  // const addPillarChip = () => { ... }
  // const removePillarChip = (pillarId) => { ... }
  // const handlePillarKeyPress = (e) => { ... }
  // const removeCompetitor = (competitorId) => { ... }
  // const addCompetitor = () => { ... }
  // const updateCompetitor = (competitorId, url) => { ... }

  const handlePersonalInfoChange = (field, value) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Auto-populate bio from LinkedIn data
  const handleAutoPopulateBio = () => {
    if (!profile) return;
    
    const linkedinBio = extractLinkedInBio(profile);
    if (linkedinBio) {
      setPersonalInfo(prev => ({
        ...prev,
        bio: linkedinBio
      }));
    }
  };

  // Check if LinkedIn bio is available and different from current bio
  const hasLinkedInBio = () => {
    if (!profile) return false;
    const linkedinBio = extractLinkedInBio(profile);
    return linkedinBio && linkedinBio !== personalInfo.bio;
  };





  // Main content container is wrapped by MainAppChrome 840px container

  // Content container styles - MainAppChrome provides the 840px container
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[48],
    backgroundColor: 'transparent', // MainAppChrome provides background
  };

  // Title and subtitle styles
  const titleStyle = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['4xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
  };

  const subtitleStyle = {
    ...textStyles.sm.medium,
    color: colors.text.subtle,
    margin: 0,
    marginTop: spacing.spacing[8],
  };

  // Render different section content - REMOVED per PCL-265, PCL-266
  // const renderSectionContent = () => { ... }

  return (
    <div style={containerStyles}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'flex-start', 
            justifyContent: isMobile ? 'flex-start' : 'space-between',
            gap: isMobile ? spacing.spacing[16] : 0
          }}>
            <div>
              <h1 style={titleStyle}>Profile Settings</h1>
              <p style={subtitleStyle}>
                Manage your personal information, company details, and content preferences
              </p>
            </div>
            <div style={{ 
              alignSelf: isMobile ? 'flex-start' : 'flex-start',
              flexShrink: 0
            }}>
              <Button
                label="Sign Out"
                style="secondary"
                size="sm"
                leadIcon={<LogOut size={16} />}
                onClick={handleSignOut}
              />
            </div>
          </div>

          {/* Main Content - Simplified Layout (Sidebar removed per PCL-264) */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: spacing.spacing[20], 
            width: '100%',
            maxWidth: isMobile ? 'none' : '480px', // Maintain previous content width
            margin: 0 // Left-aligned content
          }}>
            {/* Profile Card */}
            <div style={{
              backgroundColor: colors.bg.card.default,
              border: `1px solid ${colors.border.default}`,
              borderRadius: cornerRadius.borderRadius.lg,
              boxShadow: getShadow('regular.card', colors, { withBorder: true }),
              padding: spacing.spacing[20],
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.spacing[12],
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.spacing[16] }}>
                <UserAvatar
                  src={personalInfo.avatar}
                  alt={personalInfo.name}
                  size="64px"
                  profile={profile}
                  user={user}
                />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.spacing[12] }}>
                  <div>
                    <h2 style={{
                      fontFamily: typography.fontFamily['awesome-serif'],
                      fontSize: typography.desktop.size['2xl'],
                      fontWeight: typography.desktop.weight.semibold,
                      color: colors.text.default,
                      margin: 0,
                    }}>
                      {personalInfo.name || 'Your Name'}
                    </h2>
                    {/* Professional title removed per PCL-267 */}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
                    <Input
                      placeholder="Full Name"
                      value={personalInfo.name}
                      onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
                      style="default"
                    />
                    {/* Professional Title input removed per PCL-267 */}
                    <Input 
                      placeholder="LinkedIn URL"
                      value={personalInfo.linkedinUrl}
                      onChange={(e) => handlePersonalInfoChange('linkedinUrl', e.target.value)}
                      style="default"
                    />
                  </div>
                </div>
              </div>
              <div style={{ alignSelf: 'flex-start' }}>
                <Button
                  label={savedStates.profile ? "Saved!" : "Save"}
                  style="primary"
                  size="sm"
                  leadIcon={savedStates.profile ? <Check size={16} /> : undefined}
                  onClick={() => handleSave('profile')}
                  disabled={savedStates.profile || saving}
                />
              </div>
            </div>

            {/* Bio Card */}
            <div style={{
              backgroundColor: colors.bg.card.default,
              border: `1px solid ${colors.border.default}`,
              borderRadius: cornerRadius.borderRadius.lg,
              boxShadow: getShadow('regular.card', colors, { withBorder: true }),
              padding: spacing.spacing[20],
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.spacing[12],
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                gap: spacing.spacing[12]
              }}>
                <h4 style={{ ...textStyles.sm.semibold, color: colors.text.default, margin: 0 }}>
                  Bio
                </h4>
                {hasLinkedInBio() && (
                  <Button
                    label="Import from LinkedIn"
                    style="secondary"
                    size="2xs"
                    leadIcon={<RefreshCw size={12} />}
                    onClick={handleAutoPopulateBio}
                  />
                )}
              </div>
              <TextArea
                placeholder="Tell us about yourself..."
                value={personalInfo.bio}
                onChange={(e) => handlePersonalInfoChange('bio', e.target.value)}
                rows={3}
                autoResize={true}
                minRows={3}
                maxRows={6}
              />
              <div style={{ alignSelf: 'flex-start' }}>
                <Button
                  label={savedStates.bio ? "Saved!" : "Save"}
                  style="primary"
                  size="sm"
                  leadIcon={savedStates.bio ? <Check size={16} /> : undefined}
                  onClick={() => handleSave('bio')}
                  disabled={savedStates.bio}
                />
              </div>
            </div>
          </div>
    </div>
  );
};

export default Profile;