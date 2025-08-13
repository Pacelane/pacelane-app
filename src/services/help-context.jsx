import React, { createContext, useContext, useState } from 'react';

/**
 * Help Context - Manages help modal state across the application
 * 
 * Features:
 * - Global help modal state management
 * - Help request submission handling
 * - Context data for pre-filling forms (page info, user context)
 * 
 * Usage:
 * - Wrap your app with HelpProvider
 * - Use useHelp() hook to access help functions
 * - Call openHelp() from any help button to show the modal
 */

const HelpContext = createContext();

export const useHelp = () => {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
};

export const HelpProvider = ({ children }) => {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [helpContext, setHelpContext] = useState({});

  /**
   * Opens the help modal with optional context data
   * @param {Object} context - Additional context to pre-fill the form
   * @param {string} context.page - Current page name
   * @param {string} context.section - Specific section within the page
   * @param {string} context.action - What the user was trying to do
   */
  const openHelp = (context = {}) => {
    // Automatically capture current page from URL
    const currentPage = window.location.pathname;
    
    setHelpContext({
      page: currentPage,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ...context,
    });
    
    setIsHelpModalOpen(true);
  };

  /**
   * Closes the help modal and clears context
   */
  const closeHelp = () => {
    setIsHelpModalOpen(false);
    setHelpContext({});
  };

  /**
   * Submits a help request
   * @param {Object} helpData - The help request data
   * @param {string} helpData.subject - Subject of the help request
   * @param {string} helpData.message - Detailed message
   * @param {string} helpData.type - Type of help (bug, feature, question, etc.)
   * @param {string} helpData.priority - Priority level
   */
  const submitHelpRequest = async (helpData) => {
    try {
      // Here you would integrate with your help desk system
      // For now, we'll just log it and show a success state
      
      const fullHelpRequest = {
        ...helpData,
        context: helpContext,
        submittedAt: new Date().toISOString(),
      };

      // TODO: Replace with actual API call to your help desk system
      console.log('Help request submitted:', fullHelpRequest);
      
      // For demo purposes, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close modal after successful submission
      closeHelp();
      
      // You could also show a toast notification here
      return { success: true };
      
    } catch (error) {
      console.error('Failed to submit help request:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    isHelpModalOpen,
    helpContext,
    openHelp,
    closeHelp,
    submitHelpRequest,
  };

  return (
    <HelpContext.Provider value={value}>
      {children}
    </HelpContext.Provider>
  );
};

export default HelpProvider;
