import React, { createContext, useContext, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
   * Map help types to support event types for the Slack webhook
   */
  const mapHelpTypeToEventType = (helpType) => {
    const typeMapping = {
      'question': 'general_support',
      'bug': 'bug_report',
      'feature': 'feature_request',
      'account': 'authentication_issue',
      'billing': 'billing_issue',
      'other': 'general_support'
    };
    return typeMapping[helpType] || 'general_support';
  };

  /**
   * Determine severity based on help type and content
   */
  const determineSeverity = (helpType, subject, message) => {
    // Critical keywords that indicate high severity
    const criticalKeywords = ['crash', 'down', 'broken', 'error', 'failed', 'cannot', 'urgent'];
    const highKeywords = ['bug', 'issue', 'problem', 'not working'];
    
    const content = `${subject} ${message}`.toLowerCase();
    
    // Bug reports and account issues are generally higher priority
    if (helpType === 'bug') {
      if (criticalKeywords.some(keyword => content.includes(keyword))) {
        return 'high';
      }
      return 'medium';
    }
    
    if (helpType === 'account' || helpType === 'billing') {
      return 'medium';
    }
    
    // Check for critical keywords in any help type
    if (criticalKeywords.some(keyword => content.includes(keyword))) {
      return 'high';
    }
    
    // Check for high keywords
    if (highKeywords.some(keyword => content.includes(keyword))) {
      return 'medium';
    }
    
    // Feature requests and general questions are low priority
    return 'low';
  };

  /**
   * Get current user information from Supabase
   */
  const getCurrentUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return null;
      }

      // Try to get user profile for additional info
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      return {
        id: session.user.id,
        email: session.user.email,
        profile: profile || {}
      };
    } catch (error) {
      console.warn('Could not get current user:', error);
      return null;
    }
  };

  /**
   * Submits a help request to the customer support Slack webhook
   * @param {Object} helpData - The help request data
   * @param {string} helpData.subject - Subject of the help request
   * @param {string} helpData.message - Detailed message
   * @param {string} helpData.type - Type of help (bug, feature, question, etc.)
   */
  const submitHelpRequest = async (helpData) => {
    try {
      console.log('Submitting help request:', helpData);

      // Get current user information
      const currentUser = await getCurrentUser();
      
      // Map help type to support event type
      const eventType = mapHelpTypeToEventType(helpData.type);
      
      // Determine severity automatically
      const severity = determineSeverity(helpData.type, helpData.subject, helpData.message);
      
      // Build the support ticket payload
      const supportTicket = {
        event_type: eventType,
        severity: severity,
        title: helpData.subject,
        description: helpData.message,
        user_id: currentUser?.id || null,
        user_email: currentUser?.email || null,
        metadata: {
          help_type: helpData.type,
          source: 'help_modal',
          user_profile: currentUser?.profile || {},
          submitted_at: new Date().toISOString()
        },
        user_context: {
          page_url: helpContext.page || window.location.pathname,
          user_agent: helpContext.userAgent || navigator.userAgent,
          timestamp: helpContext.timestamp || new Date().toISOString(),
          session_id: currentUser?.id ? `session_${currentUser.id}_${Date.now()}` : null,
          ...helpContext // Include any additional context
        }
      };

      console.log('Sending support ticket to Slack webhook:', supportTicket);

      // Call the customer support Slack webhook
      const { data, error } = await supabase.functions.invoke('customer-support-slack', {
        body: supportTicket
      });

      if (error) {
        console.error('Support ticket submission error:', error);
        throw new Error(error.message || 'Failed to submit help request');
      }

      if (!data || !data.success) {
        console.error('Support ticket submission failed:', data);
        throw new Error(data?.message || 'Failed to submit help request');
      }

      console.log('Support ticket submitted successfully:', data);
      
      // Close modal after successful submission
      closeHelp();
      
      return { 
        success: true, 
        ticketId: data.ticketId,
        message: 'Your help request has been submitted successfully. We\'ll get back to you soon!'
      };
      
    } catch (error) {
      console.error('Failed to submit help request:', error);
      
      // Provide user-friendly error message
      let userFriendlyError = 'Failed to submit help request. Please try again.';
      
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        userFriendlyError = 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes('authentication')) {
        userFriendlyError = 'Authentication error. Please sign in and try again.';
      } else if (error.message?.includes('validation')) {
        userFriendlyError = 'Please check your input and try again.';
      }
      
      return { 
        success: false, 
        error: userFriendlyError
      };
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
