// First-time user detection utilities
// Determines if a user is new to the platform and what setup steps they need

/**
 * Determines if a user is considered a first-time user
 * A first-time user is someone who:
 * - Has no content created (drafts or suggestions)
 * - May have incomplete onboarding
 * - Lacks essential integrations
 * 
 * @param {Object} profile - User profile data
 * @param {Array} savedDrafts - User's saved content drafts
 * @param {Array} contentSuggestions - User's content suggestions
 * @param {Array} knowledgeFiles - User's knowledge base files
 * @returns {boolean} True if user should see first-time experience
 */
export const isFirstTimeUser = (profile, savedDrafts = [], contentSuggestions = [], knowledgeFiles = []) => {
  // If user has created content, they're not a first-time user
  const hasContent = savedDrafts.length > 0 || contentSuggestions.length > 0;
  if (hasContent) {
    return false;
  }

  // If user has significant knowledge base, they're not a first-time user
  const hasKnowledgeBase = knowledgeFiles.length > 3;
  if (hasKnowledgeBase) {
    return false;
  }

  // User is considered first-time if they have no content and limited knowledge base
  return true;
};

/**
 * Checks which onboarding steps are missing or incomplete
 * @param {Object} profile - User profile data
 * @returns {Object} Object with completion status for each step
 */
export const getOnboardingCompletionStatus = (profile) => {
  if (!profile) {
    return {
      linkedinProfile: false,
      contentGuides: false,
      pacingPreferences: false,
      whatsappNumber: false,
      onboardingCompleted: false
    };
  }

  return {
    linkedinProfile: !!(profile.linkedin_profile && profile.linkedin_name),
    contentGuides: !!(profile.content_guides && Array.isArray(profile.content_guides) && profile.content_guides.length > 0),
    pacingPreferences: !!(profile.pacing_preferences && profile.pacing_preferences.pace),
    whatsappNumber: !!(profile.whatsapp_number && profile.whatsapp_number.trim()),
    onboardingCompleted: !!(profile.onboarding_completed)
  };
};

/**
 * Checks which integrations are missing
 * @param {Object} profile - User profile data
 * @param {Array} knowledgeFiles - User's knowledge files (to detect Read.ai integration)
 * @returns {Object} Object with missing integrations
 */
export const getMissingIntegrations = (profile, knowledgeFiles = []) => {
  // Check if Read.ai integration is working (files from meeting transcripts)
  const hasReadAiIntegration = knowledgeFiles.some(file => 
    file.source_type === 'read_ai' || 
    file.file_name?.toLowerCase().includes('meeting') ||
    file.file_name?.toLowerCase().includes('transcript')
  );

  // Check WhatsApp integration (based on phone number)
  const hasWhatsAppIntegration = !!(profile?.whatsapp_number && profile.whatsapp_number.trim());

  return {
    readAi: !hasReadAiIntegration,
    whatsApp: !hasWhatsAppIntegration,
    calendar: true // Google Calendar integration - assuming always needed for first-time users
  };
};

/**
 * Gets the next recommended action for a first-time user
 * @param {Object} profile - User profile data
 * @param {Array} knowledgeFiles - User's knowledge files
 * @returns {string} Next recommended action
 */
export const getNextRecommendedAction = (profile, knowledgeFiles = []) => {
  const onboardingStatus = getOnboardingCompletionStatus(profile);
  const missingIntegrations = getMissingIntegrations(profile, knowledgeFiles);

  // Priority order: Core onboarding → Integrations → Content creation
  if (!onboardingStatus.linkedinProfile) {
    return 'complete_linkedin_profile';
  }
  
  if (!onboardingStatus.pacingPreferences) {
    return 'setup_pacing';
  }
  
  if (missingIntegrations.whatsApp) {
    return 'connect_whatsapp';
  }
  
  if (missingIntegrations.readAi) {
    return 'connect_readai';
  }
  
  if (missingIntegrations.calendar) {
    return 'connect_calendar';
  }
  
  return 'generate_content';
};

/**
 * Gets completion percentage for onboarding
 * @param {Object} profile - User profile data
 * @returns {number} Completion percentage (0-100)
 */
export const getOnboardingProgress = (profile) => {
  const status = getOnboardingCompletionStatus(profile);
  const steps = Object.keys(status);
  const completedSteps = steps.filter(step => status[step]).length;
  
  return Math.round((completedSteps / steps.length) * 100);
};
