import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useProfile } from '@/hooks/api/useProfile';
import { useTheme } from '@/services/theme-context';
import { supabase } from '@/integrations/supabase/client';

// Design System Components
// Sidebar is provided by MainAppChrome
import Button from '@/design-system/components/Button';
import Input from '@/design-system/components/Input';
import TextArea from '@/design-system/components/TextArea';
import SidebarMenuItem from '@/design-system/components/SidebarMenuItem';
import Chips from '@/design-system/components/Chips';
import EmptyState from '@/design-system/components/EmptyState';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';

// Icons
import { 
  Plus,
  Trash2,
  Check,
  X,
  Sparkles,
  Info
} from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, saving, updateBasicProfile } = useProfile();
  const { colors } = useTheme();
  
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
    whatsapp: '',
    bio: '',
    city: '',
    country: ''
  });

  // Company Information state - connected to real profile data
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    industry: '',
    avatar: '',
    about: ''
  });

  // Load profile data into state when profile loads
  useEffect(() => {
    if (profile) {
      setPersonalInfo({
        name: profile.display_name || profile.linkedin_name || '',
        profession: profile.linkedin_headline || '',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&crop=face',
        linkedinUrl: profile.linkedin_profile || '',
        whatsapp: profile.whatsapp_number || profile.phone_number || '',
        bio: profile.linkedin_about || '',
        city: '',
        country: ''
      });

      setCompanyInfo({
        name: profile.linkedin_company || '',
        industry: profile.linkedin_headline || '',
        avatar: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=96&h=96&fit=crop&crop=center',
        about: ''
      });

      // Load goals, guides, pillars, and inspirations from profile
      if (profile.goals) {
        const goalsArray = Array.isArray(profile.goals) ? profile.goals : [];
        setGoals(goalsArray.map((goal, index) => ({ id: index + 1, value: goal })));
      }

      if (profile.guides) {
        const guidesArray = Array.isArray(profile.guides) ? profile.guides : [];
        setGuides(guidesArray.map((guide, index) => ({ id: index + 1, value: guide })));
      }

      if (profile.content_pillars) {
        const pillarsArray = Array.isArray(profile.content_pillars) ? profile.content_pillars : [];
        setPillars(pillarsArray.map((pillar, index) => ({ id: index + 1, value: pillar })));
      }

      if (profile.inspirations) {
        const inspirationsArray = Array.isArray(profile.inspirations) ? profile.inspirations : [];
        setInspirations(inspirationsArray.map((inspiration, index) => ({ id: index + 1, value: inspiration })));
      }
    }
  }, [profile]);

  // Dynamic lists state - will be connected to profile fields
  const [inspirations, setInspirations] = useState([
    { id: 1, value: '' }
  ]);

  const [goals, setGoals] = useState([
    { id: 1, value: '' }
  ]);

  const [guides, setGuides] = useState([
    { id: 1, value: '' }
  ]);

  const [pillars, setPillars] = useState([
    { id: 1, value: '' }
  ]);

  // New item input states
  const [newGoal, setNewGoal] = useState('');
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
    whatsapp: false,
    bio: false,
    address: false,
    companyProfile: false,
    companyAbout: false,
    inspirations: false,
    targetPersona: false,
    competitors: false,
    goals: false,
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

  const getUserAvatar = () => {
    return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face';
  };

  // Side menu items
  const menuItems = [
    { id: 'personal', label: 'Personal Information' },
    { id: 'company', label: 'Company Information' },
    { id: 'inspirations', label: 'Inspirations' },
    { id: 'goals', label: 'Goals' },
    { id: 'guides', label: 'Guides' },
    { id: 'pillars', label: 'Pillars' }
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
      case 'goals': return goals;
      case 'guides': return guides;
      case 'pillars': return pillars;
      default: return [];
    }
  };

  const getSetterFunction = (listType) => {
    switch (listType) {
      case 'inspirations': return setInspirations;
      case 'goals': return setGoals;
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
        case 'whatsapp':
          updateData = {
            whatsapp_number: personalInfo.whatsapp
          };
          break;
        case 'goals':
          updateData = {
            goals: goals.filter(g => g.value.trim()).map(g => g.value)
          };
          break;
        case 'guides':
          updateData = {
            guides: guides.filter(g => g.value.trim()).map(g => g.value)
          };
          break;
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

  // Goals chips functions
  const addGoalChip = () => {
    if (newGoal.trim()) {
      const newId = Math.max(...goals.map(goal => goal.id), 0) + 1;
      setGoals(prev => [...prev, { id: newId, value: newGoal.trim() }]);
      setNewGoal('');
    }
  };

  const removeGoalChip = (goalId) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addGoalChip();
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

  const handleCompanyInfoChange = (field, value) => {
    setCompanyInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Avatar component
  const Avatar = ({ src, alt, size = '64px' }) => (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden', // Ensures any image overflow is hidden
        border: `2px solid ${colors.border.default}`,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bg.subtle, // Fallback background color
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          display: 'block',
        }}
      />
    </div>
  );

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
      case 'goals':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[16] }}>
            <div>
              <h3 style={{ ...textStyles.sm.semibold, color: colors.text.default, margin: 0 }}>
                Goals
              </h3>
              <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0 }}>
                What are your key objectives and aspirations?
              </p>
            </div>

            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: spacing.spacing[8],
              minHeight: '44px',
              alignItems: 'flex-start'
            }}>
              {goals.filter(goal => goal.value.trim()).map((goal) => (
                <Chips
                  key={goal.id}
                  label={goal.value}
                  style="default"
                  size="lg"
                  selected={true}
                  leadingIcon={<X size={16} />}
                  onClick={() => removeGoalChip(goal.id)}
                />
              ))}
              {goals.filter(goal => goal.value.trim()).length === 0 && (
                <EmptyState
                  title="No goals set yet"
                  fullSpace={true}
                />
              )}
            </div>

            <Input
              placeholder="Enter a new goal..."
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyPress={handleKeyPress}
              style="tail-action"
              tailAction={{
                icon: <Plus size={14} />,
                onClick: addGoalChip,
                disabled: !newGoal.trim()
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
              onClick={() => console.log('Generate goal ideas')}
            />

            <div style={{ alignSelf: 'flex-start' }}>
              <Button
                label={savedStates.goals ? "Saved!" : "Save"}
                style="primary"
                size="sm"
                leadIcon={savedStates.goals ? <Check size={16} /> : undefined}
                onClick={() => handleSave('goals')}
                disabled={savedStates.goals}
              />
            </div>
          </div>
        );

      case 'guides':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[16] }}>
            <div>
              <h3 style={{ ...textStyles.sm.semibold, color: colors.text.default, margin: 0 }}>
                Guides
              </h3>
              <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0 }}>
                What values and principles guide your content creation?
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
                  title="No guides defined yet"
                  fullSpace={true}
                />
              )}
            </div>

            <Input
              placeholder="Enter a new guide..."
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
              onClick={() => console.log('Generate guide ideas')}
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
                Pillars
              </h3>
              <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0 }}>
                What are the core pillars that define your approach?
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
                  title="No pillars established yet"
                  fullSpace={true}
                />
              )}
            </div>

            <Input
              placeholder="Enter a new pillar..."
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
              onClick={() => console.log('Generate pillar ideas')}
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
          <div>
            <h1 style={titleStyle}>Profile Settings</h1>
            <p style={subtitleStyle}>
              Manage your personal information, company details, and content preferences
                </p>
              </div>

          {/* Main Content Layout */}
          <div style={{ display: 'flex', gap: spacing.spacing[32], width: '100%' }}>
            {/* Left Side Menu */}
            <div style={{
              width: '280px',
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.spacing[8],
              flex: 'none',
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
              maxWidth: '480px',
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
                      <Avatar
                        src={personalInfo.avatar}
                        alt={personalInfo.name}
                        size="64px"
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

                  {/* WhatsApp Card */}
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
                      WhatsApp Number
                    </h4>
                    <Input
                      placeholder="+55 11 99999-9999"
                      value={personalInfo.whatsapp}
                      onChange={(e) => handlePersonalInfoChange('whatsapp', e.target.value)}
                      style="default"
                    />
                    <p style={{
                      ...textStyles.xs.normal,
                      color: colors.text.muted,
                      margin: 0,
                    }}>
                      Use international format: +55 11 99999-9999 (Brazil) or +1 555 123-4567 (US)
                    </p>
                    <div style={{ alignSelf: 'flex-start' }}>
                      <Button
                        label={savedStates.whatsapp ? "Saved!" : "Save"}
                        style="primary"
                        size="sm"
                        leadIcon={savedStates.whatsapp ? <Check size={16} /> : undefined}
                        onClick={() => handleSave('whatsapp')}
                        disabled={savedStates.whatsapp || saving}
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

                  {/* Address Card */}
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
                      Address
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[12] }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[4] }}>
                        <label style={{
                          ...textStyles.xs.medium,
                          color: colors.text.default,
                          margin: 0
                        }}>
                          City
                        </label>
                        <Input
                          placeholder="Enter your city"
                          value={personalInfo.city}
                          onChange={(e) => handlePersonalInfoChange('city', e.target.value)}
                          style="default"
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[4] }}>
                        <label style={{
                          ...textStyles.xs.medium,
                          color: colors.text.default,
                          margin: 0
                        }}>
                          Country
                        </label>
                        <Input
                          placeholder="Enter your country"
                          value={personalInfo.country}
                          onChange={(e) => handlePersonalInfoChange('country', e.target.value)}
                          style="default"
                        />
                      </div>
                    </div>
                    <div style={{ alignSelf: 'flex-start' }}>
                      <Button
                        label={savedStates.address ? "Saved!" : "Save"}
                        style="primary"
                        size="sm"
                        leadIcon={savedStates.address ? <Check size={16} /> : undefined}
                        onClick={() => handleSave('address')}
                        disabled={savedStates.address}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Company Information Cards */}
              {activeSection === 'company' && (
                <>
                  {/* Company Profile Card */}
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
                      <Avatar
                        src={companyInfo.avatar}
                        alt={companyInfo.name}
                        size="64px"
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
                            {companyInfo.name || 'Your Company'}
                          </h2>
                          <p style={{
                            ...textStyles.sm.normal,
                            color: colors.text.subtle,
                            margin: 0,
                            marginTop: spacing.spacing[4],
                          }}>
                            {companyInfo.industry || 'Industry'}
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
                          <Input
                            placeholder="Company Name"
                            value={companyInfo.name}
                            onChange={(e) => handleCompanyInfoChange('name', e.target.value)}
                            style="default"
                          />
                          <Input
                            placeholder="Industry / Field"
                            value={companyInfo.industry}
                            onChange={(e) => handleCompanyInfoChange('industry', e.target.value)}
                            style="default"
                          />
                        </div>
                      </div>
                    </div>
                    <div style={{ alignSelf: 'flex-start' }}>
                      <Button 
                        label={savedStates.companyProfile ? "Saved!" : "Save"}
                        style="primary"
                        size="sm"
                        leadIcon={savedStates.companyProfile ? <Check size={16} /> : undefined}
                        onClick={() => handleSave('companyProfile')}
                        disabled={savedStates.companyProfile}
                      />
                    </div>
                  </div>

                  {/* About Company Card */}
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
                      About the Company
                    </h4>
                    <TextArea
                      placeholder="Tell us about your company..."
                      value={companyInfo.about}
                      onChange={(e) => handleCompanyInfoChange('about', e.target.value)}
                      rows={3}
                      autoResize={true}
                      minRows={3}
                      maxRows={6}
                    />
                    <div style={{ alignSelf: 'flex-start' }}>
                      <Button
                        label={savedStates.companyAbout ? "Saved!" : "Save"}
                        style="primary"
                        size="sm"
                        leadIcon={savedStates.companyAbout ? <Check size={16} /> : undefined}
                        onClick={() => handleSave('companyAbout')}
                        disabled={savedStates.companyAbout}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Dynamic Sections (Goals, Guides, Pillars) */}
              {(activeSection === 'goals' || activeSection === 'guides' || activeSection === 'pillars') && (
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

              {/* Inspirations Section */}
              {activeSection === 'inspirations' && (
                <>
                  {/* Inspirations List Card */}
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
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
                        {inspirations.map((item) => (
                          <Input
                            key={item.id}
                            placeholder="Enter someone who inspires you..."
                            value={item.value}
                            onChange={(e) => updateListItem('inspirations', setInspirations, item.id, e.target.value)}
                            style="tail-action"
                            tailAction={{
                              icon: <Trash2 size={14} />,
                              onClick: () => removeListItem('inspirations', setInspirations, item.id)
                            }}
                          />
                        ))}
                        
                        <div style={{ marginTop: spacing.spacing[8] }}>
                          <Button
                            label="Add Inspirations"
                            style="secondary"
                            size="sm"
                            leadIcon={<Plus size={14} />}
                            onClick={() => addListItem('inspirations', setInspirations)}
                          />
                        </div>
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

                  {/* Target Persona Card */}
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
                    {/* Header */}
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

                    {/* TextArea */}
                    <TextArea
                      placeholder="Describe your target persona..."
                      value={targetPersona}
                      onChange={(e) => setTargetPersona(e.target.value)}
                      rows={4}
                      autoResize={true}
                      minRows={4}
                      maxRows={8}
                    />

                    {/* Save Button */}
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

                  {/* Competitors Card */}
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
                    {/* Header */}
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

                    {/* Competitors List */}
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

                    {/* Save Button */}
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
              )}
            </div>
          </div>

          {/* Sign Out Section */}
          <div style={{ paddingTop: spacing.spacing[32], borderTop: `1px solid ${colors.border.default}` }}>
            <Button
              label="Sign Out"
              style="destructive"
              size="md"
              onClick={handleSignOut}
            />
          </div>
    </div>
  );
};

export default Profile;