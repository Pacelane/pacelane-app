import React, { useEffect, useState } from 'react';
import { useTheme } from '@/services/theme-context';
import { useTranslation } from '@/services/i18n-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';

// Design System Components
import Button from '@/design-system/components/Button';
// PCL-110: Commented out unused imports
// import DropdownButton from '@/design-system/components/DropdownButton';
import Checkbox from '@/design-system/components/Checkbox';
// import SidebarMenuItem from '@/design-system/components/SidebarMenuItem';
// import InlineTip from '@/design-system/components/InlineTip';
import { useAuth } from '@/hooks/api/useAuth';
import { profileApi } from '@/api/profile';
import { PacingService } from '@/services/pacingService';

// Icons
import { Check } from '@phosphor-icons/react';

const PacingPage = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();
  const isMobile = useIsMobile();
  
  // State for active section in side menu - PCL-110: Commenting out sidebar functionality
  // const [activeSection, setActiveSection] = useState('frequency');
  
  // State for each section's data
  const [selectedDays, setSelectedDays] = useState(['monday', 'wednesday', 'friday']);
  // PCL-110: Commented out unused state for other sections
  // const [dailySummaryTime, setDailySummaryTime] = useState('6:00 PM');
  // const [recommendationsTime, setRecommendationsTime] = useState('Morning (8-10 AM)');

  // Initialize from profile pacing_preferences - PCL-110: Only frequency now
  useEffect(() => {
    const prefs = profile?.pacing_preferences || null;
    if (!prefs) return;

    if (Array.isArray(prefs.frequency) && prefs.frequency.length > 0) {
      setSelectedDays(prefs.frequency);
    }
    // PCL-110: Commented out unused state updates
    // if (typeof prefs.daily_summary_time === 'string' && prefs.daily_summary_time) {
    //   setDailySummaryTime(prefs.daily_summary_time);
    // }
    // if (typeof prefs.recommendations_time === 'string' && prefs.recommendations_time) {
    //   setRecommendationsTime(prefs.recommendations_time);
    // }
  }, [profile?.pacing_preferences]);

  // Active pacing schedule id
  const [activeScheduleId, setActiveScheduleId] = useState(null);

  // Load user's active schedule to mirror selections - PCL-110: Only frequency now
  useEffect(() => {
    const loadSchedule = async () => {
      if (!user) return;
      const { data, error } = await PacingService.getUserPacingSchedules(user.id);
      if (!error && data && data.length > 0) {
        const schedule = data[0];
        setActiveScheduleId(schedule.id);
        if (Array.isArray(schedule.selected_days)) {
          setSelectedDays(schedule.selected_days);
        }
        // PCL-110: Commented out unused time preference update
        // if (typeof schedule.preferred_time === 'string' && schedule.preferred_time) {
        //   setRecommendationsTime(schedule.preferred_time);
        // }
      } else {
        setActiveScheduleId(null);
      }
    };
    loadSchedule();
  }, [user?.id]);

  const computeFrequencyFromDays = (days) => {
    if (!Array.isArray(days)) return 'weekly';
    if (days.length >= 5) return 'daily';
    if (days.length <= 2) return 'bi-weekly';
    return 'weekly';
  };

  const ensureScheduleAndSync = async (partial) => {
    if (!user) return;
    try {
      if (activeScheduleId) {
        await PacingService.updatePacingSchedule(activeScheduleId, partial);
      } else {
        const scheduleData = {
          frequency: partial.frequency || computeFrequencyFromDays(selectedDays),
          selected_days: partial.selected_days || selectedDays,
          // PCL-110: Removed reference to recommendationsTime since it's not used
          preferred_time: partial.preferred_time || 'Morning (8-10 AM)', // Default fallback
          is_active: true,
        };
        const result = await PacingService.createPacingSchedule(user.id, scheduleData);
        if (result?.data?.id) setActiveScheduleId(result.data.id);
      }
    } catch (e) {
      console.error('Failed to sync pacing schedule', e);
    }
  };

  // Saved states for each section - PCL-110: Only frequency now
  const [savedStates, setSavedStates] = useState({
    frequency: false,
    // PCL-110: Commented out unused sections
    // dailySummary: false,
    // recommendations: false
  });

  const weekdays = [
    { id: 'monday', label: t('pacing.settings.days.mondayShort'), day: t('pacing.settings.days.monday') },
    { id: 'tuesday', label: t('pacing.settings.days.tuesdayShort'), day: t('pacing.settings.days.tuesday') },
    { id: 'wednesday', label: t('pacing.settings.days.wednesdayShort'), day: t('pacing.settings.days.wednesday') },
    { id: 'thursday', label: t('pacing.settings.days.thursdayShort'), day: t('pacing.settings.days.thursday') },
    { id: 'friday', label: t('pacing.settings.days.fridayShort'), day: t('pacing.settings.days.friday') },
    { id: 'saturday', label: t('pacing.settings.days.saturdayShort'), day: t('pacing.settings.days.saturday') },
    { id: 'sunday', label: t('pacing.settings.days.sundayShort'), day: t('pacing.settings.days.sunday') }
  ];

  // PCL-110: Commented out unused option arrays
  // const timeOptions = [
  //   '9:00 AM',
  //   '2:00 PM', 
  //   '6:00 PM'
  // ];

  // const recommendationOptions = [
  //   'Early Morning (6-8 AM)',
  //   'Morning (8-10 AM)',
  //   'Late Morning (10-12 PM)',
  //   'Afternoon (12-2 PM)',
  //   'Late Afternoon (2-4 PM)',
  //   'Early Evening (4-6 PM)',
  //   'Evening (6-8 PM)',
  //   'Night (8-10 PM)',
  //   'Late Night (10-12 AM)'
  // ];



  // Side menu items - PCL-110: Commenting out menu items
  // const menuItems = [
  //   { 
  //     id: 'frequency', 
  //     label: 'Frequency'
  //   },
  //   { 
  //     id: 'dailySummary', 
  //     label: 'Daily Summary'
  //   },
  //   { 
  //     id: 'recommendations', 
  //     label: 'Recommendations'
  //   }
  // ];

  const toggleDay = (dayId) => {
    setSelectedDays(prev => {
      if (prev.includes(dayId)) {
        return prev.filter(d => d !== dayId);
      } else {
        return [...prev, dayId];
      }
    });
  };

  // PCL-110: Simplified handleSave to only handle frequency
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
        await ensureScheduleAndSync({
          selected_days: selectedDays,
          frequency: computeFrequencyFromDays(selectedDays),
        });
      }
      // PCL-110: Commented out unused sections
      // else if (sectionId === 'dailySummary') {
      //   updatedPrefs = { 
      //     ...existing, 
      //     daily_summary_time: dailySummaryTime
      //   };
      // } else if (sectionId === 'recommendations') {
      //   updatedPrefs = { ...existing, recommendations_time: recommendationsTime };
      //   await ensureScheduleAndSync({ preferred_time: recommendationsTime });
      // }

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

  // PCL-110: Commented out unused helper function
  // const createDropdownItems = (options, onChange) => {
  //   return options.map((option) => ({
  //     id: option,
  //     label: option,
  //     onClick: () => onChange(option)
  //   }));
  // };



  // PCL-110: Simplified to show only frequency content
  const renderFrequencyContent = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[20] }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[4] }}>
          <h3 style={{ ...textStyles.sm.semibold, color: colors.text.default, margin: 0 }}>
            {t('pacing.settings.frequency.title')}
          </h3>
          <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0 }}>
            {t('pacing.settings.frequency.subtitle')}
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
            label={savedStates.frequency ? t('pacing.settings.buttons.saved') : t('pacing.settings.buttons.save')}
            style="primary"
            size="sm"
            leadIcon={savedStates.frequency ? <Check size={16} /> : undefined}
            onClick={() => handleSave('frequency')}
            disabled={savedStates.frequency}
          />
        </div>
      </div>
    );
  };

  // PCL-110: Commented out the original renderSectionContent function
  // const renderSectionContent = () => {
  //   switch (activeSection) {
  //     case 'frequency':
  //       return (
  //         <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[20] }}>
  //           <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[4] }}>
  //             <h3 style={{ ...textStyles.sm.semibold, color: colors.text.default, margin: 0 }}>
  //               Frequency
  //             </h3>
  //             <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0 }}>
  //               Define when you want to post
  //             </p>
  //           </div>
  //           
  //           <div style={{
  //             display: 'flex',
  //             flexWrap: 'wrap',
  //             gap: spacing.spacing[8],
  //           }}>
  //             {weekdays.map((day) => (
  //               <div key={day.id} style={{ 
  //                 display: 'flex', 
  //                 flexDirection: 'column',
  //                 alignItems: 'center', 
  //                 gap: spacing.spacing[4] 
  //               }}>
  //                 <Checkbox
  //                   checked={selectedDays.includes(day.id)}
  //                   onChange={() => toggleDay(day.id)}
  //                 />
  //                 <span style={{ ...textStyles.sm.medium, color: colors.text.default }}>
  //                   {day.label}
  //                 </span>
  //               </div>
  //             ))}
  //           </div>

  //           <div style={{ alignSelf: 'flex-start' }}>
  //             <Button
  //               label={savedStates.frequency ? "Saved!" : "Save"}
  //               style="primary"
  //               size="sm"
  //               leadIcon={savedStates.frequency ? <Check size={16} /> : undefined}
  //               onClick={() => handleSave('frequency')}
  //               disabled={savedStates.frequency}
  //             />
  //           </div>
  //         </div>
  //       );

  //     case 'dailySummary':
  //       return (
  //         <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[20] }}>
  //           <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[4] }}>
  //             <h3 style={{ ...textStyles.sm.semibold, color: colors.text.default, margin: 0 }}>
  //               Daily Summary
  //             </h3>
  //             <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0 }}>
  //               Define when you want us to ask you about your day
  //             </p>
  //           </div>
  //           
  //           <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[12] }}>
  //             <InlineTip style={{ fontSize: typography.desktop.size.xs }}>
  //               We'll ask about how your day went and give you the opportunity to add more context about what happened. This helps us focus on what matters when creating your content.
  //             </InlineTip>
  //             
  //             <DropdownButton
  //               label={dailySummaryTime}
  //               items={createDropdownItems(timeOptions, setDailySummaryTime)}
  //               size="sm"
  //             />
  //           </div>

  //           <div style={{ alignSelf: 'flex-start' }}>
  //             <Button
  //               label={savedStates.dailySummary ? "Saved!" : "Save"}
  //               style="primary"
  //               size="sm"
  //               leadIcon={savedStates.dailySummary ? <Check size={16} /> : undefined}
  //               onClick={() => handleSave('dailySummary')}
  //               disabled={savedStates.dailySummary}
  //             />
  //           </div>
  //         </div>
  //       );

  //     case 'recommendations':
  //       return (
  //         <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[20] }}>
  //           <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[4] }}>
  //             <h3 style={{ ...textStyles.sm.semibold, color: colors.text.default, margin: 0 }}>
  //               Recommendations
  //             </h3>
  //             <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0 }}>
  //               Define when you want us to send you your content recommendations
  //             </p>
  //           </div>
  //           
  //           <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[12] }}>
  //             <InlineTip style={{ fontSize: typography.desktop.size.xs }}>
  //               We'll send you personalized content suggestions based on your goals, interests, and recent activities to help spark your next post ideas.
  //             </InlineTip>
  //             
  //             <DropdownButton
  //               label={recommendationsTime}
  //               items={createDropdownItems(recommendationOptions, setRecommendationsTime)}
  //               size="sm"
  //             />
  //           </div>

  //           <div style={{ alignSelf: 'flex-start' }}>
  //             <Button
  //               label={savedStates.recommendations ? "Saved!" : "Save"}
  //               style="primary"
  //               size="sm"
  //               leadIcon={savedStates.recommendations ? <Check size={16} /> : undefined}
  //               onClick={() => handleSave('recommendations')}
  //               disabled={savedStates.recommendations}
  //             />
  //           </div>
  //         </div>
  //       );



  //     default:
  //       return null;
  //   }
  // };

  // Content is wrapped by MainAppChrome; keep transparent
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[48],
    backgroundColor: 'transparent',
  };

  // Title style using awesome serif font, 3xl normal (following KnowledgeBasePage pattern)
  const titleStyle = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['3xl'],
    fontWeight: typography.desktop.weight.normal,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
  };


  return (
    <div style={containerStyles}>
      {/* Header Section */}
      <div>
        <h1 style={titleStyle}>{t('pacing.settings.title')}</h1>
      </div>

      {/* Frequency Card - aligned with header */}
      <div
        style={{
          width: '100%',
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
          {renderFrequencyContent()}
        </div>
      </div>
    </div>
  );
};

export default PacingPage;