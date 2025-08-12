// API Layer - Centralized exports
// Import all your APIs from this single file for cleaner imports

// ========== API EXPORTS ==========
export { authApi } from './auth';
export { profileApi } from './profile';
export { contentApi } from './content';
export { inspirationsApi } from './inspirations';
export { templatesApi } from './templates';

// Re-export analytics functions (until we create a service layer for it)
export * from './analytics';

// ========== SCHEMA EXPORTS ==========
export * from './schemas';

// ========== CONVENIENCE EXPORTS ==========

// Auth API
export const {
  signIn,
  signUp, 
  signInWithGoogle,
  signOut,
  getCurrentSession,
  onAuthStateChange
} = authApi;

// Profile API  
export const {
  fetchProfile,
  updateBasicProfile,
  setupLinkedInProfile,
  updateLinkedInProfile,
  saveContentPillars,
  savePacingPreferences,
  saveContactInfo,
  completeOnboarding,
  updateProfile
} = profileApi;

// Content API
export const {
  loadKnowledgeFiles,
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  addLink,
  loadSavedDrafts,
  saveDraft,
  updateDraft,
  deleteDraft,
  loadContentSuggestions,
  generateContentSuggestions,
  sendChatMessage
} = contentApi;

// Inspirations API
export const {
  loadInspirations,
  addInspiration,
  removeInspiration,
  checkUrlExists,
  validateLinkedInUrl,
  formatLinkedInUrl,
  testScraping
} = inspirationsApi;

// Templates API
export const {
  loadTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate
} = templatesApi;
