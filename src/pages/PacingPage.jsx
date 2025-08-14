import React, { useEffect, useState } from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';

// Design System Components
import Button from '@/design-system/components/Button';
import DropdownButton from '@/design-system/components/DropdownButton';
import Checkbox from '@/design-system/components/Checkbox';
import SidebarMenuItem from '@/design-system/components/SidebarMenuItem';
import { useAuth } from '@/hooks/api/useAuth';
import { profileApi } from '@/api/profile';

// Icons
import { Check } from 'lucide-react';

const PacingPage = () => {
  const { colors } = useTheme();
  const { user, profile, refreshProfile } = useAuth();
  
  // State for active section in side menu
  const [activeSection, setActiveSection] = useState('frequency');
  
  // State for each section's data
  const [selectedDays, setSelectedDays] = useState(['monday', 'wednesday', 'friday']);
  const [dailySummaryTime, setDailySummaryTime] = useState('Evening (6-8 PM)');
  const [followUps, setFollowUps] = useState('One more time the same day');
  const [recommendationsTime, setRecommendationsTime] = useState('Morning (8-10 AM)');

  // Initialize from profile pacing_preferences
  useEffect(() => {
    const prefs = profile?.pacing_preferences || null;
    if (!prefs) return;

    if (Array.isArray(prefs.frequency) && prefs.frequency.length > 0) {
      setSelectedDays(prefs.frequency);
    }
    if (typeof prefs.daily_summary_time === 'string' && prefs.daily_summary_time) {
      setDailySummaryTime(prefs.daily_summary_time);
    }
    if (typeof prefs.followups_frequency === 'string' && prefs.followups_frequency) {
      setFollowUps(prefs.followups_frequency);
    }
    if (typeof prefs.recommendations_time === 'string' && prefs.recommendations_time) {
      setRecommendationsTime(prefs.recommendations_time);
    }
  }, [profile?.pacing_preferences]);

  // Saved states for each section
  const [savedStates, setSavedStates] = useState({
    frequency: false,
    dailySummary: false,
    recommendations: false
  });

  const weekdays = [
    { id: 'monday', label: 'M', day: 'Monday' },
    { id: 'tuesday', label: 'T', day: 'Tuesday' },
    { id: 'wednesday', label: 'W', day: 'Wednesday' },
    { id: 'thursday', label: 'T', day: 'Thursday' },
    { id: 'friday', label: 'F', day: 'Friday' },
    { id: 'saturday', label: 'S', day: 'Saturday' },
    { id: 'sunday', label: 'S', day: 'Sunday' }
  ];

  const timeOptions = [
    'Early Morning (6-8 AM)',
    'Morning (8-10 AM)',
    'Late Morning (10-12 PM)',
    'Afternoon (12-2 PM)',
    'Late Afternoon (2-4 PM)',
    'Early Evening (4-6 PM)',
    'Evening (6-8 PM)',
    'Night (8-10 PM)',
    'Late Night (10-12 AM)'
  ];

  const followUpOptions = [
    'No follow-ups',
    'One more time the same day',
    'Two more times the same day'
  ];

  const recommendationOptions = [
    'Early Morning (6-8 AM)',
    'Morning (8-10 AM)',
    'Late Morning (10-12 PM)',
    'Afternoon (12-2 PM)',
    'Late Afternoon (2-4 PM)',
    'Early Evening (4-6 PM)',
    'Evening (6-8 PM)',
    'Night (8-10 PM)',
    'Late Night (10-12 AM)'
  ];



  // Side menu items
  const menuItems = [
    { 
      id: 'frequency', 
      label: 'Frequency'
    },
    { 
      id: 'dailySummary', 
      label: 'Daily Summary'
    },
    { 
      id: 'recommendations', 
      label: 'Recommendations'
    }
  ];

  const toggleDay = (dayId) => {
    setSelectedDays(prev => {
      if (prev.includes(dayId)) {
        return prev.filter(d => d !== dayId);
      } else {
        return [...prev, dayId];
      }
    });
  };

  const handleSave = async (sectionId) => {
    setSavedStates(prev => ({
      ...prev,
      [sectionId]: true
    }));

    try {
      if (!user) return;

      const existing = (profile?.pacing_preferences || {});
      let updatedPrefs = { ...existing };

      if (sectionId === 'frequency') {
        updatedPrefs = { ...existing, frequency: selectedDays };
      } else if (sectionId === 'dailySummary') {
        updatedPrefs = { 
          ...existing, 
          daily_summary_time: dailySummaryTime, 
          followups_frequency: followUps 
        };
      } else if (sectionId === 'recommendations') {
        updatedPrefs = { ...existing, recommendations_time: recommendationsTime };
      }

      await profileApi.updateProfile(user.id, { pacing_preferences: updatedPrefs });
      await refreshProfile();
    } catch (e) {
      // If save fails, briefly show saved state then revert like before
      console.error('Failed to save pacing preferences section', sectionId, e);
    } finally {
      // Reset saved state after 2 seconds to show the save feedback
      setTimeout(() => {
        setSavedStates(prev => ({
          ...prev,
          [sectionId]: false
        }));
      }, 2000);
    }
  };

  // Helper function to create dropdown items from options
  const createDropdownItems = (options, onChange) => {
    return options.map((option) => ({
      id: option,
      label: option,
      onClick: () => onChange(option)
    }));
  };



  const renderSectionContent = () => {
    switch (activeSection) {
      case 'frequency':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[20] }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[4] }}>
              <h3 style={{ ...textStyles.sm.semibold, color: colors.text.default, margin: 0 }}>
                Frequency
              </h3>
              <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0 }}>
                Define when you want to post
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: spacing.spacing[8],
            }}>
              {weekdays.map((day) => (
                <div key={day.id} style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  gap: spacing.spacing[4] 
                }}>
                  <Checkbox
                    checked={selectedDays.includes(day.id)}
                    onChange={() => toggleDay(day.id)}
                  />
                  <span style={{ ...textStyles.sm.medium, color: colors.text.default }}>
                    {day.label}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ alignSelf: 'flex-start' }}>
              <Button
                label={savedStates.frequency ? "Saved!" : "Save"}
                style="primary"
                size="sm"
                leadIcon={savedStates.frequency ? <Check size={16} /> : undefined}
                onClick={() => handleSave('frequency')}
                disabled={savedStates.frequency}
              />
            </div>
          </div>
        );

      case 'dailySummary':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[20] }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[4] }}>
              <h3 style={{ ...textStyles.sm.semibold, color: colors.text.default, margin: 0 }}>
                Daily Summary
              </h3>
              <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0 }}>
                Define when you want us to ask you about your day
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[16] }}>
              <DropdownButton
                label={dailySummaryTime}
                items={createDropdownItems(timeOptions, setDailySummaryTime)}
                size="sm"
              />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
                <h4 style={{ ...textStyles.sm.semibold, color: colors.text.default, margin: 0 }}>
                  Follow-Ups
                </h4>
                <DropdownButton
                  label={followUps}
                  items={createDropdownItems(followUpOptions, setFollowUps)}
                  size="sm"
                />
                <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0 }}>
                  Define how many follow-ups should we make in case you don't respond to our first message
                </p>
              </div>
            </div>

            <div style={{ alignSelf: 'flex-start' }}>
              <Button
                label={savedStates.dailySummary ? "Saved!" : "Save"}
                style="primary"
                size="sm"
                leadIcon={savedStates.dailySummary ? <Check size={16} /> : undefined}
                onClick={() => handleSave('dailySummary')}
                disabled={savedStates.dailySummary}
              />
            </div>
          </div>
        );

      case 'recommendations':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[20] }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[4] }}>
              <h3 style={{ ...textStyles.sm.semibold, color: colors.text.default, margin: 0 }}>
                Recommendations
              </h3>
              <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0 }}>
                Define when you want us to send you your content recommendations
              </p>
            </div>
            
            <DropdownButton
              label={recommendationsTime}
              items={createDropdownItems(recommendationOptions, setRecommendationsTime)}
              size="sm"
            />

            <div style={{ alignSelf: 'flex-start' }}>
              <Button
                label={savedStates.recommendations ? "Saved!" : "Save"}
                style="primary"
                size="sm"
                leadIcon={savedStates.recommendations ? <Check size={16} /> : undefined}
                onClick={() => handleSave('recommendations')}
                disabled={savedStates.recommendations}
              />
            </div>
          </div>
        );



      default:
        return null;
    }
  };

  // Content is wrapped by MainAppChrome; keep transparent
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[48],
    backgroundColor: 'transparent',
  };

  // Title style using awesome serif font, 4xl semi bold (following KnowledgeBasePage pattern)
  const titleStyle = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['4xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
  };

  // Subtitle style - sm medium, text subtle (following KnowledgeBasePage pattern)
  const subtitleStyle = {
    ...textStyles.sm.medium,
    color: colors.text.subtle,
    margin: 0,
    marginTop: spacing.spacing[8],
  };

  return (
    <div style={containerStyles}>
      {/* Header Section */}
      <div>
        <h1 style={titleStyle}>Pacing Settings</h1>
        <p style={subtitleStyle}>
          Customize when and how often we engage with you for optimal productivity
        </p>
      </div>

      {/* Main Content Layout */}
      <div
        style={{
          display: 'flex',
          gap: spacing.spacing[32],
          width: '100%',
        }}
      >
        {/* Left Side Menu */}
        <div
          style={{
            width: '280px',
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.spacing[8],
            flex: 'none', // Prevent shrinking
          }}
        >
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

        {/* Right Content Area - matching ProfilePage structure */}
        <div
          style={{
            flex: 1,
            maxWidth: '480px',
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.spacing[20],
          }}
        >
          <div
            style={{
              backgroundColor: colors.bg.card.default,
              border: `1px solid ${colors.border.default}`,
              borderRadius: cornerRadius.borderRadius.lg,
              boxShadow: getShadow('regular.card', colors, { withBorder: true }),
              padding: spacing.spacing[20],
              height: 'fit-content',
            }}
          >
            {renderSectionContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PacingPage;