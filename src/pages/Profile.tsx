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
  SignOut as LogOut,
  TextAlignLeft,
  ListBullets,
  Article,
  Smiley
} from '@phosphor-icons/react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut, refreshProfile } = useAuth();
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



      // Load guides, pillars, goals, and format from profile

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

      // Load goals and target audiences
      if (profile.goals) {
        if (typeof profile.goals === 'object' && profile.goals !== null && !Array.isArray(profile.goals)) {
          // New format: { goals: [], target_audiences: [] }
          if (profile.goals.goals) {
            setSelectedGoals(Array.isArray(profile.goals.goals) ? profile.goals.goals : []);
          } else {
            setSelectedGoals([]);
          }
          if (profile.goals.target_audiences) {
            const audiencesArray = Array.isArray(profile.goals.target_audiences) ? profile.goals.target_audiences : [];
            setTargetAudiences(audiencesArray.length > 0 ? audiencesArray : ['']);
          } else {
            setTargetAudiences(['']);
          }
        } else if (Array.isArray(profile.goals)) {
          // Old format: array of goal strings (backward compatibility)
          setSelectedGoals(profile.goals);
          setTargetAudiences(['']);
        }
      } else {
        // Initialize empty state if no goals
        console.log('Profile: No goals data, initializing empty state');
        setSelectedGoals([]);
        setTargetAudiences(['']); // Always show at least one empty input
      }
      
      // Log current state for debugging
      console.log('Profile: Goals state after loading:', {
        selectedGoals,
        targetAudiences
      });

      // Load content pillars
      if (profile.content_pillars) {
        console.log('Profile: Loading content_pillars:', profile.content_pillars);
        if (typeof profile.content_pillars === 'object' && profile.content_pillars !== null && !Array.isArray(profile.content_pillars)) {
          // New format: { content_types: [], themes: [] }
          console.log('Profile: Detected new format (object)');
          
          // Normalize content types to match Profile.tsx options (handle variations)
          const normalizeContentType = (type: string): string => {
            const mapping: { [key: string]: string } = {
              'How-To': 'How To',
              'How To': 'How To',
              'News Opinions': 'News & Opinions',
              'News & Opinions': 'News & Opinions',
              'Behind the Scenes': 'Behind The Scenes',
              'Behind The Scenes': 'Behind The Scenes',
              'Client Stories': 'Customer Stories',
              'Customer Stories': 'Customer Stories'
            };
            return mapping[type] || type;
          };
          
          if (profile.content_pillars.content_types) {
            // Normalize and filter content types to only include valid options
            const savedTypes = Array.isArray(profile.content_pillars.content_types) 
              ? profile.content_pillars.content_types 
              : [];
            
            const validContentTypes = savedTypes
              .map((savedType: string) => normalizeContentType(savedType))
              .filter((normalized: string) => contentTypesOptions.includes(normalized));
            
            console.log('Profile: Setting content_types:', validContentTypes);
            setSelectedContentTypes(validContentTypes);
          } else {
            setSelectedContentTypes([]);
          }
          
          if (profile.content_pillars.themes) {
            // Filter out any themes that are actually content types
            const savedThemes = Array.isArray(profile.content_pillars.themes) 
              ? profile.content_pillars.themes 
              : [];
            
            const validThemes = savedThemes.filter((theme: string) => {
              const normalized = normalizeContentType(theme);
              return !contentTypesOptions.includes(normalized) && !contentTypesOptions.includes(theme);
            });
            
            console.log('Profile: Setting themes:', validThemes);
            setThemes(validThemes.length > 0 ? validThemes : ['']);
          } else {
            setThemes(['']);
          }
        } else if (Array.isArray(profile.content_pillars)) {
          // Old format: array of strings (from onboarding)
          console.log('Profile: Detected old format (array):', profile.content_pillars);
          // Try to separate content types from themes based on the options
          const pillarsArray = profile.content_pillars;
          
          // Normalize content type names for matching
          const normalizeContentType = (type: string): string => {
            const mapping: { [key: string]: string } = {
              'How-To': 'How To',
              'How To': 'How To',
              'News Opinions': 'News & Opinions',
              'News & Opinions': 'News & Opinions',
              'Behind the Scenes': 'Behind The Scenes',
              'Behind The Scenes': 'Behind The Scenes',
              'Client Stories': 'Customer Stories',
              'Customer Stories': 'Customer Stories'
            };
            return mapping[type] || type;
          };
          
          // Find content types by checking against normalized options
          const foundContentTypes = pillarsArray.filter(p => {
            const normalized = normalizeContentType(p);
            return contentTypesOptions.includes(normalized) || contentTypesOptions.includes(p);
          }).map(p => {
            const normalized = normalizeContentType(p);
            return contentTypesOptions.includes(normalized) ? normalized : p;
          });
          
          // Themes are everything that's not a content type
          const foundThemes = pillarsArray.filter(p => {
            const normalized = normalizeContentType(p);
            return !contentTypesOptions.includes(normalized) && !contentTypesOptions.includes(p);
          });
          
          console.log('Profile: Separated content_types:', foundContentTypes, 'themes:', foundThemes);
          if (foundContentTypes.length > 0) {
            setSelectedContentTypes(foundContentTypes);
          }
          if (foundThemes.length > 0) {
            setThemes(foundThemes);
          } else {
            setThemes(['']);
          }
          // Also set pillars for backward compatibility
          setPillars(pillarsArray.map((pillar, index) => ({ id: index + 1, value: pillar })));
        }
      } else {
        // Initialize empty state if no content_pillars
        setSelectedContentTypes([]);
        setThemes(['']);
      }

      // Load writing format
      console.log('Profile: Loading content_guides:', profile.content_guides);
      if (profile.content_guides) {
        if (typeof profile.content_guides === 'object' && profile.content_guides !== null) {
          if (profile.content_guides.writing_format) {
            console.log('Profile: Setting writing_format:', profile.content_guides.writing_format);
            setSelectedFormat(profile.content_guides.writing_format);
          } else {
            setSelectedFormat('standard');
          }
        } else if (typeof profile.content_guides === 'string') {
          // Handle case where it might be stored as a string
          console.log('Profile: content_guides is a string, trying to parse');
          try {
            const parsed = JSON.parse(profile.content_guides);
            if (parsed.writing_format) {
              setSelectedFormat(parsed.writing_format);
            } else {
              setSelectedFormat('standard');
            }
          } catch (e) {
            console.error('Profile: Failed to parse content_guides:', e);
            setSelectedFormat('standard');
          }
        }
      } else {
        // Initialize default format if no content_guides
        console.log('Profile: No content_guides data, initializing default format');
        setSelectedFormat('standard');
      }
      
      // Log current state for debugging
      console.log('Profile: Writing format state after loading:', selectedFormat);

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

  // Goals & Audiences state
  const goalsOptions = [
    'Brand Recognition',
    'Lead Generation',
    'Recruitment',
    'Thought Leadership',
    'Attract Opportunities',
    'Stay Relevant'
  ];
  
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [targetAudiences, setTargetAudiences] = useState<string[]>(['']); // Always start with at least one empty input

  // Content Pillars state
  const contentTypesOptions = [
    'How To',
    'News & Opinions',
    'Personal Stories',
    'Career Lessons',
    'Behind The Scenes',
    'Customer Stories',
    'Educational',
    'Memes & Humor'
  ];
  
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>(['']);

  // Writing Format state
  const formatOptions = [
    { id: 'standard', label: 'Standard', icon: TextAlignLeft },
    { id: 'formatted', label: 'Formatted', icon: ListBullets },
    { id: 'short', label: 'Short', icon: Article },
    { id: 'emojis', label: 'Emojis', icon: Smiley },
  ];
  
  const [selectedFormat, setSelectedFormat] = useState<string>('standard'); // Default to 'standard' format

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
    pillars: false,
    goals: false,
    format: false
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
    { id: 'goals', label: 'Goals & Audiences' },
    { id: 'pillars', label: 'Content Pillars' },
    { id: 'format', label: 'Writing Format' }
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
      console.log('Profile: Saving section:', sectionId);
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
          const filteredThemes = themes.filter(t => t.trim());
          updateData = {
            content_pillars: {
              content_types: selectedContentTypes,
              themes: filteredThemes
            }
          };
          console.log('Profile: Saving pillars with data:', updateData);
          break;
        case 'format':
          if (!selectedFormat) {
            console.warn('Profile: No format selected, skipping save');
            return;
          }
          updateData = {
            content_guides: {
              writing_format: selectedFormat
            }
          };
          console.log('Profile: Saving format with data:', updateData);
          break;
        case 'goals':
          // Filter out empty target audiences
          const filteredAudiences = targetAudiences.filter(audience => audience.trim().length > 0);
          // Save goals and target audiences in the new format
          updateData = {
            goals: {
              goals: selectedGoals.length > 0 ? selectedGoals : [],
              target_audiences: filteredAudiences.length > 0 ? filteredAudiences : []
            }
          };
          console.log('Profile: Saving goals with data:', updateData);
          break;
        default:
          // For sections not yet connected to backend, just show saved state
          break;
      }

      if (Object.keys(updateData).length > 0) {
        console.log('Profile: Calling updateBasicProfile with:', updateData);
        
        // For content_pillars and content_guides, use Supabase directly
        // since BasicProfileUpdate doesn't include these fields
        if (sectionId === 'pillars' || sectionId === 'format' || sectionId === 'goals') {
          console.log('Profile: Using Supabase directly for:', sectionId);
          const { error: updateError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('user_id', user!.id);
          
          if (updateError) {
            console.error('Profile: Supabase update error:', updateError);
            throw updateError;
          }
          
          console.log('Profile: Supabase update successful');
          // Refresh profile to get updated data
          await refreshProfile();
        } else {
          const result = await updateBasicProfile(updateData);
          console.log('Profile: Update result:', result);
        }
      } else {
        console.warn('Profile: No update data for section:', sectionId);
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

  // Goals helper functions
  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal)
        ? prev.filter((g) => g !== goal)
        : [...prev, goal]
    );
  };

  const handleAudienceChange = (index: number, value: string) => {
    const newAudiences = [...targetAudiences];
    newAudiences[index] = value;
    setTargetAudiences(newAudiences);
  };

  const handleDeleteAudience = (index: number) => {
    const newAudiences = targetAudiences.filter((_, i) => i !== index);
    setTargetAudiences(newAudiences.length > 0 ? newAudiences : ['']);
  };

  const handleAddAudience = () => {
    setTargetAudiences([...targetAudiences, '']);
  };

  // Content Pillars helper functions
  const toggleContentType = (type: string) => {
    setSelectedContentTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleThemeChange = (index: number, value: string) => {
    const newThemes = [...themes];
    newThemes[index] = value;
    setThemes(newThemes);
  };

  const handleDeleteTheme = (index: number) => {
    const newThemes = themes.filter((_, i) => i !== index);
    setThemes(newThemes.length > 0 ? newThemes : ['']);
  };

  const handleAddTheme = () => {
    setThemes([...themes, '']);
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
      case 'goals':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[16] }}>
            <div>
              <h3 style={{ ...textStyles.sm.semibold, color: colors.text.default, margin: 0 }}>
                Your Goals
              </h3>
              <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0 }}>
                What do you want to achieve with your content?
              </p>
            </div>

            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: spacing.spacing[8],
              minHeight: '44px',
              alignItems: 'flex-start'
            }}>
              {goalsOptions.map((goal) => (
                <Chips
                  key={goal}
                  label={goal}
                  size="lg"
                  style="default"
                  selected={selectedGoals.includes(goal)}
                  onClick={() => toggleGoal(goal)}
                />
              ))}
            </div>

            {/* Target Audiences Section */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: spacing.spacing[12],
              marginTop: spacing.spacing[16] 
            }}>
              <p style={{ ...textStyles.sm.medium, color: colors.text.default, margin: 0 }}>
                Your Target Audiences
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
                {targetAudiences.map((audience, index) => (
                  <Input
                    key={index}
                    style="tail-action"
                    size="lg"
                    placeholder={`Target Audience ${index + 1}`}
                    value={audience}
                    onChange={(e) => handleAudienceChange(index, e.target.value)}
                    tailAction={{
                      icon: <Trash size={16} />,
                      onClick: () => handleDeleteAudience(index),
                    }}
                  />
                ))}
                
                <Button
                  style="secondary"
                  size="sm"
                  label="Add Target Audience"
                  leadIcon={<Plus size={16} />}
                  onClick={handleAddAudience}
                />
              </div>
            </div>

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
                Content Types
              </h3>
              <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0 }}>
                What types of content do you want to create?
              </p>
            </div>

            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: spacing.spacing[8],
              minHeight: '44px',
              alignItems: 'flex-start'
            }}>
              {contentTypesOptions.map((type) => (
                <Chips
                  key={type}
                  label={type}
                  size="lg"
                  style="default"
                  selected={selectedContentTypes.includes(type)}
                  onClick={() => toggleContentType(type)}
                />
              ))}
            </div>

            {/* Themes Section */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: spacing.spacing[12],
              marginTop: spacing.spacing[16] 
            }}>
              <p style={{ ...textStyles.sm.medium, color: colors.text.default, margin: 0 }}>
                Themes You Want to Talk About
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
                {themes.map((theme, index) => (
                  <Input
                    key={index}
                    style="tail-action"
                    size="lg"
                    placeholder={`Theme ${index + 1}`}
                    value={theme}
                    onChange={(e) => handleThemeChange(index, e.target.value)}
                    tailAction={{
                      icon: <Trash size={16} />,
                      onClick: () => handleDeleteTheme(index),
                    }}
                  />
                ))}
                
                <Button
                  style="secondary"
                  size="sm"
                  label="Add Theme"
                  leadIcon={<Plus size={16} />}
                  onClick={handleAddTheme}
                />
              </div>
            </div>

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

      case 'format':
        // Get utility text based on selected format
        const getUtilityText = () => {
          switch (selectedFormat) {
            case 'standard':
              return 'Standard posts are written in continuous paragraphs, ideal for longer narratives and reflections.';
            case 'formatted':
              return 'Formatted posts use lists, line breaks, and clear structure to make reading easier.';
            case 'short':
              return 'Short posts are direct and objective, perfect for quick and impactful messages.';
            case 'emojis':
              return 'Posts with emojis add personality and make content more visual and engaging.';
            default:
              return 'Choose the format that best fits your writing style. This will be the default for your LinkedIn posts.';
          }
        };

        // Get post content based on selected format
        const getPostContent = () => {
          switch (selectedFormat) {
            case 'standard':
              return 'Today I want to share an important reflection on product design.\n\nIn recent months, I\'ve been working on challenging projects that taught me a valuable lesson: simplicity is the ultimate sophistication.\n\nWhen we start designing, it\'s tempting to add features and details. But the best products are those that solve complex problems simply.\n\nWhat do you think? How do you apply this principle in your work?';
            case 'formatted':
              return 'Today I want to share 3 important lessons about product design:\n\n→ Simplicity is the ultimate sophistication\n→ Fewer features, more value\n→ Focus on the problem, not the solution\n\nIn recent months, I learned that the best products solve complex problems simply.\n\nWhich of these lessons resonates most with you?';
            case 'short':
              return 'Simplicity is the ultimate sophistication.\n\nIn recent months I learned that the best products solve complex problems simply.\n\nLess is more.';
            case 'emojis':
              return '💡 Today I want to share an important reflection on product design.\n\n✨ In recent months, I\'ve been working on challenging projects that taught me a valuable lesson: simplicity is the ultimate sophistication.\n\n🎯 When we start designing, it\'s tempting to add features and details. But the best products solve complex problems simply.\n\n🚀 Less is more!';
            default:
              return 'Today I want to share an important reflection on product design.\n\nIn recent months, I\'ve been working on challenging projects that taught me a valuable lesson: simplicity is the ultimate sophistication.\n\nWhen we start designing, it\'s tempting to add features and details. But the best products are those that solve complex problems simply.';
          }
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[16] }}>
            <div>
              <h3 style={{ ...textStyles.sm.semibold, color: colors.text.default, margin: 0 }}>
                Writing Format
              </h3>
              <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0 }}>
                Choose the format that best fits your writing style
              </p>
            </div>

            {/* Format selection cards */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'row',
              gap: spacing.spacing[8],
              marginTop: spacing.spacing[12]
            }}>
              {formatOptions.map((format) => {
                const IconComponent = format.icon;
                const isSelected = selectedFormat === format.id;
                
                return (
                  <div
                    key={format.id}
                    style={{
                      flex: 1,
                      padding: spacing.spacing[8],
                      border: `1px solid ${isSelected ? colors.border.teal : colors.border.default}`,
                      borderRadius: cornerRadius.borderRadius.md,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: spacing.spacing[4],
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: isSelected ? colors.bg.badge.teal : 'transparent',
                    }}
                    onClick={() => setSelectedFormat(format.id)}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <IconComponent 
                        size={24} 
                        color={isSelected ? colors.bg.basic.teal.strong : colors.icon.default}
                        weight="regular"
                      />
                    </div>
                    <p style={{ 
                      ...textStyles.xs.medium, 
                      color: colors.text.default, 
                      margin: 0 
                    }}>
                      {format.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Utility text */}
            <p style={{ 
              ...textStyles.xs.normal, 
              color: colors.text.subtle, 
              margin: 0 
            }}>
              {getUtilityText()}
            </p>

            {/* LinkedIn post preview */}
            <div style={{
              backgroundColor: colors.bg.default,
              border: `1px solid ${colors.border.default}`,
              borderRadius: cornerRadius.borderRadius.md,
              padding: spacing.spacing[16],
              boxShadow: getShadow('regular.card', colors, { withBorder: false }),
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.spacing[12],
            }}>
              {/* Profile row */}
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: spacing.spacing[12],
                alignItems: 'center',
              }}>
                <UserAvatar
                  src={personalInfo.avatar}
                  alt={personalInfo.name}
                  size="48px"
                  profile={profile}
                  user={user}
                />
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.spacing[2],
                }}>
                  <p style={{ 
                    ...textStyles.sm.semibold, 
                    color: colors.text.default, 
                    margin: 0 
                  }}>
                    {personalInfo.name || 'Your Name'}
                  </p>
                  <p style={{ 
                    ...textStyles.xs.normal, 
                    color: colors.text.subtle, 
                    margin: 0 
                  }}>
                    {personalInfo.profession || 'Your Profession'}
                  </p>
                </div>
              </div>

              {/* Post content */}
              <p style={{
                ...textStyles.sm.normal,
                color: colors.text.default,
                margin: 0,
                lineHeight: '1.5',
                whiteSpace: 'pre-line',
              }}>
                {getPostContent()}
              </p>
            </div>

            <div style={{ alignSelf: 'flex-start' }}>
              <Button
                label={savedStates.format ? "Saved!" : "Save"}
                style="primary"
                size="sm"
                leadIcon={savedStates.format ? <Check size={16} /> : undefined}
                onClick={() => handleSave('format')}
                disabled={savedStates.format}
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



              {/* Dynamic Sections (Goals, Guides, Pillars, Format) */}
              {(activeSection === 'goals' || activeSection === 'guides' || activeSection === 'pillars' || activeSection === 'format') && (
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