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
import SidebarMenuItem from '@/design-system/components/SidebarMenuItem';
import Chips from '@/design-system/components/Chips';
import EmptyState from '@/design-system/components/EmptyState';
import UserAvatar from '@/design-system/components/UserAvatar';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';

// Icons
import { 
  Plus,
  Trash,
  Check,
  X,
  Sparkle as Sparkles,
  Info,
  SignOut as LogOut
} from '@phosphor-icons/react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, saving, updateBasicProfile } = useProfile();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  
  // Sidebar state
  // Sidebar handled by layout
  
  // State for active section in side menu
  const [activeSection, setActiveSection] = useState('personal');
  
  // Personal Information state - connected to real profile data
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    profession: '',
    avatar: '',
    linkedinUrl: '',
    bio: ''
  });



  // Load inspirations from separate table
  const loadInspirations = async () => {
    if (!user) return;

    try {
      const { data: inspirationsData, error } = await supabase
        .from('inspirations')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading inspirations:', error);
        return;
      }

      if (inspirationsData && inspirationsData.length > 0) {
        // Convert inspirations table data to format expected by Profile component
        const inspirationValues = inspirationsData.map(insp => {
          // Extract username from LinkedIn URL for display
          const username = insp.linkedin_url?.split('/in/')?.pop() || insp.linkedin_url;
          return username;
        });
        setInspirations(inspirationValues.map((inspiration, index) => ({ 
          id: index + 1, 
          value: inspiration 
        })));
      }
    } catch (error) {
      console.error('Error loading inspirations:', error);
    }
  };

  // Save inspirations to separate table
  const saveInspirationsToTable = async () => {
    if (!user) return;

    try {
      // First, delete existing inspirations for this user
      const { error: deleteError } = await supabase
        .from('inspirations')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Filter out empty inspirations and create LinkedIn URL objects
      const validInspirations = inspirations
        .filter(insp => insp.value.trim())
        .map(insp => {
          const username = insp.value.trim();
          // Ensure it's a proper LinkedIn URL
          const linkedinUrl = username.startsWith('http') 
            ? username 
            : `https://linkedin.com/in/${username}`;
          
          return {
            user_id: user.id,
            linkedin_url: linkedinUrl
          };
        });

      // Insert new inspirations if any exist
      if (validInspirations.length > 0) {
        const { error: insertError } = await supabase
          .from('inspirations')
          .insert(validInspirations);

        if (insertError) throw insertError;
      }

      console.log('Inspirations saved successfully');
    } catch (error) {
      console.error('Error saving inspirations:', error);
      throw error;
    }
  };

  // Load profile data into state when profile loads
  useEffect(() => {
    if (profile) {
      setPersonalInfo({
        name: profile.display_name || profile.linkedin_name || '',
        profession: profile.linkedin_headline || '',
        avatar: null, // Will use Bichaurinho avatar as fallback
        linkedinUrl: profile.linkedin_profile || '',
        bio: profile.linkedin_about || ''
      });



      // Load guides, pillars, and inspirations from profile

      // Check both 'guides' and 'content_guides' columns for backward compatibility
      const guidesData = profile.guides || profile.content_guides;
      if (guidesData) {
        const guidesArray = Array.isArray(guidesData) ? guidesData : [];
        setGuides(guidesArray.map((guide, index) => ({ id: index + 1, value: guide })));
        
        // If data was in content_guides, migrate it to guides column
        if (!profile.guides && profile.content_guides) {
          console.log('Profile: Migrating content_guides to guides column');
          // The next save will put it in the correct 'guides' column
        }
      }

      if (profile.content_pillars) {
        const pillarsArray = Array.isArray(profile.content_pillars) ? profile.content_pillars : [];
        setPillars(pillarsArray.map((pillar, index) => ({ id: index + 1, value: pillar })));
      }

      // Load inspirations from separate table
      loadInspirations();
    }
  }, [profile]);

  // Load inspirations when user changes
  useEffect(() => {
    if (user) {
      loadInspirations();
    }
  }, [user]);

  // Dynamic lists state - will be connected to profile fields
  const [inspirations, setInspirations] = useState([
    { id: 1, value: '' }
  ]);

  const [guides, setGuides] = useState([
    { id: 1, value: '' }
  ]);

  const [pillars, setPillars] = useState([
    { id: 1, value: '' }
  ]);

  // New item input states
  const [newPillar, setNewPillar] = useState('');
  const [newGuide, setNewGuide] = useState('');

  // Target persona and competitors
  const [targetPersona, setTargetPersona] = useState('');
  const [competitors, setCompetitors] = useState([
    { id: 1, url: '' }
  ]);

  // Saved states for each section
  const [savedStates, setSavedStates] = useState({
    profile: false,
    bio: false,
    inspirations: false,
    targetPersona: false,
    competitors: false,
    guides: false,
    pillars: false
  });

  // Get user display info
  const getUserName = () => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.linkedin_name) return profile.linkedin_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };



  // Side menu items
  const menuItems = [
    { id: 'personal', label: 'Personal Information' },
    // { id: 'inspirations', label: 'Inspirations' }, // Commented out per PCL-106
    { id: 'guides', label: 'Tone of Voice' },
    { id: 'pillars', label: 'Editorial Topics' }
  ];

  // Generic functions for managing dynamic lists
  const addListItem = (listType, setterFunction) => {
    const currentList = getCurrentList(listType);
    const newId = Math.max(...currentList.map(item => item.id), 0) + 1;
    setterFunction(prev => [...prev, { id: newId, value: '' }]);
  };

  const removeListItem = (listType, setterFunction, id) => {
    setterFunction(prev => prev.filter(item => item.id !== id));
  };

  const updateListItem = (listType, setterFunction, id, value) => {
    setterFunction(prev => 
      prev.map(item => 
        item.id === id ? { ...item, value } : item
      )
    );
  };

  const getCurrentList = (listType) => {
    switch (listType) {
      case 'inspirations': return inspirations;
      case 'guides': return guides;
      case 'pillars': return pillars;
      default: return [];
    }
  };

  const getSetterFunction = (listType) => {
    switch (listType) {
      case 'inspirations': return setInspirations;
      case 'guides': return setGuides;
      case 'pillars': return setPillars;
      default: return () => {};
    }
  };

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


        case 'guides':
          updateData = {
            guides: guides.filter(g => g.value.trim()).map(g => g.value)
          };
          break;
        case 'inspirations':
          // Handle inspirations separately since they're in a different table
          await saveInspirationsToTable();
          setSavedStates(prev => ({ ...prev, inspirations: true }));
          setTimeout(() => setSavedStates(prev => ({ ...prev, inspirations: false })), 2000);
          return; // Exit early since we handle the saved state above
        case 'pillars':
          updateData = {
            content_pillars: pillars.filter(p => p.value.trim()).map(p => p.value)
          };
          break;
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



  // Guides chips functions
  const addGuideChip = () => {
    if (newGuide.trim()) {
      const newId = Math.max(...guides.map(guide => guide.id), 0) + 1;
      setGuides(prev => [...prev, { id: newId, value: newGuide.trim() }]);
      setNewGuide('');
    }
  };

  const removeGuideChip = (guideId) => {
    setGuides(prev => prev.filter(guide => guide.id !== guideId));
  };

  const handleGuideKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addGuideChip();
    }
  };

  // Pillars chips functions
  const addPillarChip = () => {
    if (newPillar.trim()) {
      const newId = Math.max(...pillars.map(pillar => pillar.id), 0) + 1;
      setPillars(prev => [...prev, { id: newId, value: newPillar.trim() }]);
      setNewPillar('');
    }
  };

  const removePillarChip = (pillarId) => {
    setPillars(prev => prev.filter(pillar => pillar.id !== pillarId));
  };

  const handlePillarKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPillarChip();
    }
  };

  // Competitors management functions
  const removeCompetitor = (competitorId) => {
    setCompetitors(prev => prev.filter(comp => comp.id !== competitorId));
  };

  const addCompetitor = () => {
    const newId = Math.max(...competitors.map(comp => comp.id), 0) + 1;
    setCompetitors(prev => [...prev, { id: newId, url: '' }]);
  };

  const updateCompetitor = (competitorId, url) => {
    setCompetitors(prev => 
      prev.map(comp => 
        comp.id === competitorId ? { ...comp, url } : comp
      )
    );
  };

  const handlePersonalInfoChange = (field, value) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: value
    }));
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

  // Render different section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'guides':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[16] }}>
            <div>
              <h3 style={{ ...textStyles.sm.semibold, color: colors.text.default, margin: 0 }}>
                Tone of Voice
              </h3>
              <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0 }}>
                Define the personality and style that should come through in your content
              </p>
            </div>

            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: spacing.spacing[8],
              minHeight: '44px',
              alignItems: 'flex-start'
            }}>
              {guides.filter(guide => guide.value.trim()).map((guide) => (
                <Chips
                  key={guide.id}
                  label={guide.value}
                  style="default"
                  size="lg"
                  selected={true}
                  leadingIcon={<X size={16} />}
                  onClick={() => removeGuideChip(guide.id)}
                />
              ))}
              {guides.filter(guide => guide.value.trim()).length === 0 && (
                <EmptyState
                  title="No tone of voice elements defined yet"
                  fullSpace={true}
                />
              )}
            </div>

            <Input
              placeholder="Enter a tone of voice element (e.g., Professional, Friendly, Authoritative)..."
              value={newGuide}
              onChange={(e) => setNewGuide(e.target.value)}
              onKeyPress={handleGuideKeyPress}
              style="tail-action"
              tailAction={{
                icon: <Plus size={14} />,
                onClick: addGuideChip,
                disabled: !newGuide.trim()
              }}
            />

            {/* Divider */}
            <div style={{
              width: '100%',
              height: '1px',
              backgroundColor: colors.border.default
            }} />

            {/* Give me some ideas button */}
            <Button
              label="Give me some ideas"
              style="dashed"
              size="md"
              leadIcon={<Sparkles size={16} />}
              tailIcon={<Info size={16} />}
              onClick={() => console.log('Generate tone of voice ideas')}
            />

            <div style={{ alignSelf: 'flex-start' }}>
              <Button
                label={savedStates.guides ? "Saved!" : "Save"}
                style="primary"
                size="sm"
                leadIcon={savedStates.guides ? <Check size={16} /> : undefined}
                onClick={() => handleSave('guides')}
                disabled={savedStates.guides}
              />
            </div>
          </div>
        );

      case 'pillars':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[16] }}>
            <div>
              <h3 style={{ ...textStyles.sm.semibold, color: colors.text.default, margin: 0 }}>
                Editorial Topics
              </h3>
              <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0 }}>
                What are the main topics and themes you want to cover in your content?
              </p>
            </div>

            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: spacing.spacing[8],
              minHeight: '44px',
              alignItems: 'flex-start'
            }}>
              {pillars.filter(pillar => pillar.value.trim()).map((pillar) => (
                <Chips
                  key={pillar.id}
                  label={pillar.value}
                  style="default"
                  size="lg"
                  selected={true}
                  leadingIcon={<X size={16} />}
                  onClick={() => removePillarChip(pillar.id)}
                />
              ))}
              {pillars.filter(pillar => pillar.value.trim()).length === 0 && (
                <EmptyState
                  title="No editorial topics defined yet"
                  fullSpace={true}
                />
              )}
            </div>

            <Input
              placeholder="Enter a content topic (e.g., Technology Trends, Industry Insights, Leadership)..."
              value={newPillar}
              onChange={(e) => setNewPillar(e.target.value)}
              onKeyPress={handlePillarKeyPress}
              style="tail-action"
              tailAction={{
                icon: <Plus size={14} />,
                onClick: addPillarChip,
                disabled: !newPillar.trim()
              }}
            />

            {/* Divider */}
            <div style={{
              width: '100%',
              height: '1px',
              backgroundColor: colors.border.default
            }} />

            {/* Give me some ideas button */}
            <Button
              label="Give me some ideas"
              style="dashed"
              size="md"
              leadIcon={<Sparkles size={16} />}
              tailIcon={<Info size={16} />}
              onClick={() => console.log('Generate editorial topic ideas')}
            />

            <div style={{ alignSelf: 'flex-start' }}>
              <Button
                label={savedStates.pillars ? "Saved!" : "Save"}
                style="primary"
                size="sm"
                leadIcon={savedStates.pillars ? <Check size={16} /> : undefined}
                onClick={() => handleSave('pillars')}
                disabled={savedStates.pillars}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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

          {/* Main Content Layout */}
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: spacing.spacing[32], 
            width: '100%' 
          }}>
            {/* Left Side Menu */}
            <div style={{
              width: isMobile ? '100%' : '280px',
              display: 'flex',
              flexDirection: isMobile ? 'row' : 'column',
              gap: spacing.spacing[8],
              flex: 'none',
              overflowX: isMobile ? 'auto' : 'visible',
              paddingBottom: isMobile ? spacing.spacing[8] : 0,
            }}>
              {menuItems.map((item) => (
                <SidebarMenuItem
                  key={item.id}
                  variant="default"
                  state={activeSection === item.id ? 'active' : 'default'}
                  label={item.label}
                  onClick={() => setActiveSection(item.id)}
                />
              ))}
                    </div>
                    
            {/* Right Content Area */}
            <div style={{
              flex: 1,
              maxWidth: isMobile ? 'none' : '480px',
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.spacing[20],
            }}>
              {/* Personal Information Cards */}
              {activeSection === 'personal' && (
                <>
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
                          <p style={{
                            ...textStyles.sm.normal,
                            color: colors.text.subtle,
                            margin: 0,
                            marginTop: spacing.spacing[4],
                          }}>
                            {personalInfo.profession || 'Your Profession'}
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
                          <Input
                            placeholder="Full Name"
                            value={personalInfo.name}
                            onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
                            style="default"
                          />
                          <Input 
                            placeholder="Professional Title"
                            value={personalInfo.profession}
                            onChange={(e) => handlePersonalInfoChange('profession', e.target.value)}
                            style="default"
                          />
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
                    <h4 style={{ ...textStyles.sm.semibold, color: colors.text.default, margin: 0 }}>
                      Bio
                    </h4>
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


                </>
              )}



              {/* Dynamic Sections (Guides, Pillars) */}
              {(activeSection === 'guides' || activeSection === 'pillars') && (
                <div style={{
                  backgroundColor: colors.bg.card.default,
                  border: `1px solid ${colors.border.default}`,
                  borderRadius: cornerRadius.borderRadius.lg,
                  boxShadow: getShadow('regular.card', colors, { withBorder: true }),
                  padding: spacing.spacing[24],
                }}>
                  {renderSectionContent()}
                </div>
              )}

              {/* Inspirations Section - Commented out per PCL-106 */}
              {/* {activeSection === 'inspirations' && (
                <>
                  {/* Inspirations List Card *//*}
                  <div style={{ 
                    backgroundColor: colors.bg.card.default,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: cornerRadius.borderRadius.lg,
                    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
                    padding: spacing.spacing[24],
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[20] }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[4] }}>
                        <h3 style={{ ...textStyles.sm.semibold, color: colors.text.default, margin: 0 }}>
                          Inspirations
                        </h3>
                        <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0 }}>
                          Who are the people that inspire your work and thinking?
                        </p>
                      </div>
                      
                      {/* Show inputs or empty state *//*}
                      {inspirations.length === 0 ? (
                        <EmptyState
                          title="No inspirations added yet"
                          fullSpace={true}
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[12] }}>
                          {inspirations.map((item) => (
                            <div key={item.id} style={{ 
                              display: 'flex', 
                              gap: spacing.spacing[8], 
                              alignItems: 'flex-end' 
                            }}>
                              <div style={{ flex: 1 }}>
                                <Input
                                  placeholder="Enter someone who inspires you..."
                                  value={item.value}
                                  onChange={(e) => updateListItem('inspirations', setInspirations, item.id, e.target.value)}
                                  style="default"
                                  size="lg"
                                />
                              </div>
                              <Button
                                label=""
                                style="ghost"
                                size="lg"
                                leadIcon={<Trash2 size={16} />}
                                onClick={() => removeListItem('inspirations', setInspirations, item.id)}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div style={{ width: '100%' }}>
                        <Button
                          label="Add Another Inspiration"
                          style="secondary"
                          size="sm"
                          leadIcon={<Plus size={16} />}
                          onClick={() => addListItem('inspirations', setInspirations)}
                          className="w-full"
                        />
                      </div>

                      <div style={{ alignSelf: 'flex-start' }}>
                        <Button
                          label={savedStates.inspirations ? "Saved!" : "Save"}
                          style="primary"
                          size="sm"
                          leadIcon={savedStates.inspirations ? <Check size={16} /> : undefined}
                          onClick={() => handleSave('inspirations')}
                          disabled={savedStates.inspirations}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Target Persona Card *//*}
                  <div style={{ 
                    backgroundColor: colors.bg.card.default,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: cornerRadius.borderRadius.lg,
                    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
                    padding: spacing.spacing[24],
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.spacing[16],
                  }}>
                    {/* Header *//*}
                    <div>
                      <h3 style={{ 
                        ...textStyles.sm.semibold, 
                        color: colors.text.default, 
                        margin: 0 
                      }}>
                        Target Persona
                      </h3>
                      <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0 }}>
                        Describe your ideal audience and who you're creating content for
                      </p>
                    </div>

                    {/* TextArea *//*}
                    <TextArea
                      placeholder="Describe your target persona..."
                      value={targetPersona}
                      onChange={(e) => setTargetPersona(e.target.value)}
                      rows={4}
                      autoResize={true}
                      minRows={4}
                      maxRows={8}
                    />

                    {/* Save Button *//*}
                    <div style={{ alignSelf: 'flex-start' }}>
                      <Button
                        label={savedStates.targetPersona ? "Saved!" : "Save"}
                        style="primary"
                        size="sm"
                        leadIcon={savedStates.targetPersona ? <Check size={16} /> : undefined}
                        onClick={() => handleSave('targetPersona')}
                        disabled={savedStates.targetPersona}
                      />
                    </div>
                  </div>

                  {/* Competitors Card *//*}
                  <div style={{ 
                    backgroundColor: colors.bg.card.default,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: cornerRadius.borderRadius.lg,
                    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
                    padding: spacing.spacing[24],
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.spacing[16]
                  }}>
                    {/* Header *//*}
                    <div>
                      <h3 style={{ 
                        ...textStyles.sm.semibold, 
                        color: colors.text.default, 
                        margin: 0 
                      }}>
                        Competitors
                      </h3>
                      <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0 }}>
                        Keep track of competitor websites and industry leaders
                      </p>
                    </div>

                    {/* Competitors List *//*}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
                      {competitors.map((competitor) => (
                        <Input
                          key={competitor.id}
                          placeholder="Enter competitor website URL..."
                          value={competitor.url}
                          onChange={(e) => updateCompetitor(competitor.id, e.target.value)}
                          style="tail-action"
                          tailAction={{
                            icon: <Trash2 size={14} />,
                            onClick: () => removeCompetitor(competitor.id)
                          }}
                        />
                      ))}
                      
                      <div style={{ marginTop: spacing.spacing[8] }}>
                        <Button
                          label="Add Competitors"
                          style="secondary"
                          size="sm"
                          leadIcon={<Plus size={14} />}
                          onClick={addCompetitor}
                        />
                      </div>
                    </div>

                    {/* Save Button *//*}
                    <div style={{ alignSelf: 'flex-start' }}>
                      <Button
                        label={savedStates.competitors ? "Saved!" : "Save"}
                        style="primary"
                        size="sm"
                        leadIcon={savedStates.competitors ? <Check size={16} /> : undefined}
                        onClick={() => handleSave('competitors')}
                        disabled={savedStates.competitors}
                      />
                    </div>
                  </div>
                </>
              )} */}
            </div>
          </div>
    </div>
  );
};

export default Profile;