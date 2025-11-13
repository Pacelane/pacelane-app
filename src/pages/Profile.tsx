import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useProfile } from '@/hooks/api/useProfile';
import { useTheme } from '@/services/theme-context';
import { useTranslation } from '@/services/i18n-context';
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
  const { user, signOut } = useAuth();
  const { profile, saving, updateBasicProfile } = useProfile();
  const { colors } = useTheme();
  const { t } = useTranslation();
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

  // ========================================
  // MOCK DATA - DELETE AFTER BACKEND IMPLEMENTATION
  // ========================================
  // TODO: Replace all mock data with actual backend data once the backend is ready
  // This mock data is placed here for easy deletion - search for "MOCK DATA" comment
  
  // Goals & Audiences mock data
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    'Reconhecimento de Marca',
    'Liderança de Pensamento'
  ]);
  
  const [targetAudiences, setTargetAudiences] = useState<string[]>([
    'Founders and entrepreneurs',
    'Product managers and designers'
  ]);

  // Content Pillars mock data
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([
    'Como Fazer',
    'Lições de Carreira',
    'Educacional'
  ]);
  
  const [themes, setThemes] = useState<string[]>([
    'Product Design',
    'UX Research',
    'Design Systems'
  ]);

  // Writing Format mock data
  const [selectedFormat, setSelectedFormat] = useState<string>('formatted');

  // ========================================
  // END MOCK DATA
  // ========================================

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
    { id: 'personal', label: t('profile.sections.personal') },
    { id: 'goals', label: t('profile.sections.goalsAudiences') },
    { id: 'pillars', label: t('profile.sections.contentPillars') },
    { id: 'format', label: t('profile.sections.writingFormat') }
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

        case 'goals':
          // TODO: Connect to backend when ready
          // updateData = {
          //   goals: selectedGoals,
          //   target_audiences: targetAudiences.filter(a => a.trim())
          // };
          break;

        case 'pillars':
          // TODO: Connect to backend when ready
          // updateData = {
          //   content_types: selectedContentTypes,
          //   content_themes: themes.filter(t => t.trim())
          // };
          break;

        case 'format':
          // TODO: Connect to backend when ready
          // updateData = {
          //   writing_format: selectedFormat
          // };
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
    fontSize: typography.desktop.size['3xl'],
    fontWeight: typography.desktop.weight.normal,
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

  // Goals options (from onboarding)
  const goalsOptions = [
    'Reconhecimento de Marca',
    'Geração de Leads',
    'Recrutamento',
    'Liderança de Pensamento',
    'Atrair oportunidades',
    'Manter-se Relevante',
  ];

  // Content types options (from onboarding)
  const contentTypesOptions = [
    'Como Fazer',
    'Opiniões sobre Notícias',
    'Histórias Pessoais',
    'Lições de Carreira',
    'Bastidores',
    'Histórias de Clientes',
    'Educacional',
    'Memes & Humor',
  ];

  // Format options (from onboarding)
  const formatOptions = [
    { id: 'standard', label: 'Padrão', icon: TextAlignLeft },
    { id: 'formatted', label: 'Formatado', icon: ListBullets },
    { id: 'short', label: 'Curto', icon: Article },
    { id: 'emojis', label: 'Emojis', icon: Smiley },
  ];

  // Toggle goal selection
  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal)
        ? prev.filter((g) => g !== goal)
        : [...prev, goal]
    );
  };

  // Handle target audience changes
  const handleAudienceChange = (index: number, value: string) => {
    const newAudiences = [...targetAudiences];
    newAudiences[index] = value;
    setTargetAudiences(newAudiences);
  };

  const handleDeleteAudience = (index: number) => {
    const newAudiences = targetAudiences.filter((_, i) => i !== index);
    setTargetAudiences(newAudiences);
  };

  const handleAddAudience = () => {
    setTargetAudiences([...targetAudiences, '']);
  };

  // Toggle content type selection
  const toggleContentType = (type: string) => {
    setSelectedContentTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  // Handle theme changes
  const handleThemeChange = (index: number, value: string) => {
    const newThemes = [...themes];
    newThemes[index] = value;
    setThemes(newThemes);
  };

  const handleDeleteTheme = (index: number) => {
    const newThemes = themes.filter((_, i) => i !== index);
    setThemes(newThemes);
  };

  const handleAddTheme = () => {
    setThemes([...themes, '']);
  };

  // Render different section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'goals':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[16] }}>
            <div>
              <h3 style={{ ...textStyles.sm.semibold, color: colors.text.default, margin: 0 }}>
                Seus Objetivos
              </h3>
              <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0 }}>
                O que você busca alcançar com seu conteúdo?
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
                Seus Públicos-Alvo
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
                {targetAudiences.map((audience, index) => (
                  <Input
                    key={index}
                    style="tail-action"
                    size="lg"
                    placeholder={`${t('profile.fields.targetAudience')} ${index + 1}`}
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
                  label={t('profile.buttons.addTargetAudience')}
                  leadIcon={<Plus size={16} />}
                  onClick={handleAddAudience}
                />
              </div>
            </div>

            <div style={{ alignSelf: 'flex-start' }}>
              <Button
                label={savedStates.goals ? t('profile.buttons.saved') : t('profile.buttons.save')}
                style="primary"
                size="sm"
                leadIcon={savedStates.goals ? <Check size={16} /> : undefined}
                onClick={() => handleSave('goals')}
                disabled={savedStates.goals}
              />
            </div>
          </div>
        );

      case 'pillars':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[16] }}>
            <div>
              <h3 style={{ ...textStyles.sm.semibold, color: colors.text.default, margin: 0 }}>
                Tipos de Conteúdo
              </h3>
              <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0 }}>
                Que tipos de conteúdo você quer criar?
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
                Temas Sobre os Quais Você Quer Falar
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
                {themes.map((theme, index) => (
                  <Input
                    key={index}
                    style="tail-action"
                    size="lg"
                    placeholder={`${t('profile.fields.theme')} ${index + 1}`}
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
                  label={t('profile.buttons.addTheme')}
                  leadIcon={<Plus size={16} />}
                  onClick={handleAddTheme}
                />
              </div>
            </div>

            <div style={{ alignSelf: 'flex-start' }}>
              <Button
                label={savedStates.pillars ? t('profile.buttons.saved') : t('profile.buttons.save')}
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
              return 'Posts padrão são escritos em parágrafos corridos, ideais para narrativas e reflexões mais longas.';
            case 'formatted':
              return 'Posts formatados usam listas, quebras de linha e estrutura clara para facilitar a leitura.';
            case 'short':
              return 'Posts curtos são diretos e objetivos, perfeitos para mensagens rápidas e impactantes.';
            case 'emojis':
              return 'Posts com emojis adicionam personalidade e tornam o conteúdo mais visual e engajador.';
            default:
              return 'Escolha o formato que melhor se adapta ao seu estilo de escrita. Este será o padrão para seus posts no LinkedIn.';
          }
        };

        // Get post content based on selected format
        const getPostContent = () => {
          switch (selectedFormat) {
            case 'standard':
              return 'Hoje quero compartilhar uma reflexão importante sobre design de produtos.\n\nNos últimos meses, tenho trabalhado em projetos desafiadores que me ensinaram uma lição valiosa: a simplicidade é a sofisticação máxima.\n\nQuando começamos a projetar, é tentador adicionar recursos e detalhes. Mas os melhores produtos são aqueles que resolvem problemas complexos de forma simples.\n\nO que você acha? Como você aplica esse princípio no seu trabalho?';
            case 'formatted':
              return 'Hoje quero compartilhar 3 lições importantes sobre design de produtos:\n\n→ A simplicidade é a sofisticação máxima\n→ Menos recursos, mais valor\n→ Foque no problema, não na solução\n\nNos últimos meses, aprendi que os melhores produtos são aqueles que resolvem problemas complexos de forma simples.\n\nQual dessas lições ressoa mais com você?';
            case 'short':
              return 'A simplicidade é a sofisticação máxima.\n\nNos últimos meses aprendi que os melhores produtos resolvem problemas complexos de forma simples.\n\nMenos é mais.';
            case 'emojis':
              return '💡 Hoje quero compartilhar uma reflexão importante sobre design de produtos.\n\n✨ Nos últimos meses, tenho trabalhado em projetos desafiadores que me ensinaram uma lição valiosa: a simplicidade é a sofisticação máxima.\n\n🎯 Quando começamos a projetar, é tentador adicionar recursos e detalhes. Mas os melhores produtos são aqueles que resolvem problemas complexos de forma simples.\n\n🚀 Menos é mais!';
            default:
              return 'Hoje quero compartilhar uma reflexão importante sobre design de produtos.\n\nNos últimos meses, tenho trabalhado em projetos desafiadores que me ensinaram uma lição valiosa: a simplicidade é a sofisticação máxima.\n\nQuando começamos a projetar, é tentador adicionar recursos e detalhes. Mas os melhores produtos são aqueles que resolvem problemas complexos de forma simples.';
          }
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[16] }}>
            <div>
              <h3 style={{ ...textStyles.sm.semibold, color: colors.text.default, margin: 0 }}>
                Formato de Escrita
              </h3>
              <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0 }}>
                Escolha o formato que melhor se adapta ao seu estilo de escrita
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
                    {personalInfo.name || 'Seu Nome'}
                  </p>
                  <p style={{ 
                    ...textStyles.xs.normal, 
                    color: colors.text.subtle, 
                    margin: 0 
                  }}>
                    {personalInfo.profession || 'Sua Profissão'}
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
                label={savedStates.format ? t('profile.buttons.saved') : t('profile.buttons.save')}
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
              <h1 style={titleStyle}>{t('profile.title')}</h1>
            </div>
            <div style={{ 
              alignSelf: isMobile ? 'flex-start' : 'flex-start',
              flexShrink: 0
            }}>
              <Button
                label={t('profile.buttons.signOut')}
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
                            fontFamily: typography.fontFamily.geist,
                            fontSize: typography.desktop.size['2xl'],
                            fontWeight: typography.desktop.weight.semibold,
                            color: colors.text.default,
                            margin: 0,
                          }}>
                            {personalInfo.name || 'Seu Nome'}
                          </h2>
                          <p style={{
                            ...textStyles.sm.normal,
                            color: colors.text.subtle,
                            margin: 0,
                            marginTop: spacing.spacing[4],
                          }}>
                            {personalInfo.profession || 'Sua Profissão'}
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
                          <Input
                            placeholder={t('profile.placeholders.fullName')}
                            value={personalInfo.name}
                            onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
                            style="default"
                          />
                          <Input 
                            placeholder={t('profile.placeholders.profession')}
                            value={personalInfo.profession}
                            onChange={(e) => handlePersonalInfoChange('profession', e.target.value)}
                            style="default"
                          />
                          <Input 
                            placeholder={t('profile.placeholders.linkedIn')}
                            value={personalInfo.linkedinUrl}
                            onChange={(e) => handlePersonalInfoChange('linkedinUrl', e.target.value)}
                            style="default"
                          />
                        </div>
                      </div>
                    </div>
                    <div style={{ alignSelf: 'flex-start' }}>
                      <Button
                        label={savedStates.profile ? t('profile.buttons.saved') : t('profile.buttons.save')}
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
                      {t('profile.fields.bio')}
                    </h4>
                    <TextArea
                      placeholder={t('profile.placeholders.bio')}
                      value={personalInfo.bio}
                      onChange={(e) => handlePersonalInfoChange('bio', e.target.value)}
                      rows={3}
                      autoResize={true}
                      minRows={3}
                      maxRows={6}
                    />
                    <div style={{ alignSelf: 'flex-start' }}>
                      <Button
                        label={savedStates.bio ? t('profile.buttons.saved') : t('profile.buttons.save')}
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



              {/* Dynamic Sections (Goals, Pillars, Format) */}
              {(activeSection === 'goals' || activeSection === 'pillars' || activeSection === 'format') && (
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
                      placeholder={t('profile.placeholders.persona')}
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
                        label={savedStates.targetPersona ? t('profile.buttons.saved') : t('profile.buttons.save')}
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
                          placeholder={t('profile.placeholders.competitor')}
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
                          label={t('profile.buttons.addCompetitor')}
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
                        label={savedStates.competitors ? t('profile.buttons.saved') : t('profile.buttons.save')}
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