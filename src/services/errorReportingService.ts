/**
 * Error Reporting Service - Automatically sends error reports to customer support
 * 
 * This service provides utilities to automatically report errors to the customer
 * support Slack channel via the customer-support-slack Edge Function.
 * 
 * Features:
 * - Automatic error reporting with context
 * - User-friendly error categorization
 * - Severity determination based on error type
 * - Integration with existing error boundaries
 * - Support for manual error reporting
 */

import { supabase } from '@/integrations/supabase/client';

export interface ErrorReportData {
  error: Error | string;
  context?: {
    page?: string;
    action?: string;
    component?: string;
    userId?: string;
    userEmail?: string;
    additionalData?: Record<string, any>;
  };
  severity?: 'low' | 'medium' | 'high' | 'critical';
  eventType?: string;
}

export class ErrorReportingService {
  // Circuit breaker to prevent infinite error loops
  private static errorReportingFailed = false;
  private static lastErrorReport = 0;
  private static readonly ERROR_REPORT_COOLDOWN = 30000; // 30 seconds

  /**
   * Check if error reporting should be skipped due to circuit breaker
   */
  private static shouldSkipErrorReporting(): boolean {
    const now = Date.now();
    
    // If error reporting failed recently, skip for cooldown period
    if (this.errorReportingFailed && (now - this.lastErrorReport) < this.ERROR_REPORT_COOLDOWN) {
      return true;
    }
    
    // Reset circuit breaker after cooldown
    if (this.errorReportingFailed && (now - this.lastErrorReport) >= this.ERROR_REPORT_COOLDOWN) {
      this.errorReportingFailed = false;
    }
    
    return false;
  }

  /**
   * Mark error reporting as failed to trigger circuit breaker
   */
  private static markErrorReportingFailed(): void {
    this.errorReportingFailed = true;
    this.lastErrorReport = Date.now();
  }

  /**
   * Get current user information for error reporting
   */
  private static async getCurrentUser(): Promise<{ id: string; email: string } | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return null;
      }

      return {
        id: session.user.id,
        email: session.user.email || 'unknown@example.com'
      };
    } catch (error) {
      console.warn('Could not get current user for error reporting:', error);
      return null;
    }
  }

  /**
   * Determine error severity based on error type and content
   */
  private static determineSeverity(error: Error | string, context?: ErrorReportData['context']): 'low' | 'medium' | 'high' | 'critical' {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorName = typeof error === 'string' ? '' : error.name;
    
    // Critical errors that break core functionality
    const criticalPatterns = [
      'ChunkLoadError',
      'Network request failed',
      'Authentication failed',
      'Database connection',
      'Payment processing',
      'cannot read property',
      'is not a function',
      'out of memory'
    ];

    // High severity errors that significantly impact user experience
    const highPatterns = [
      'TypeError',
      'ReferenceError', 
      'SyntaxError',
      'Failed to fetch',
      'timeout',
      'permission denied',
      'unauthorized',
      'content generation',
      'file upload'
    ];

    // Medium severity errors
    const mediumPatterns = [
      'validation',
      'invalid input',
      'not found',
      'rate limit',
      'quota exceeded'
    ];

    const content = `${errorName} ${errorMessage}`.toLowerCase();

    if (criticalPatterns.some(pattern => content.includes(pattern.toLowerCase()))) {
      return 'critical';
    }

    if (highPatterns.some(pattern => content.includes(pattern.toLowerCase()))) {
      return 'high';
    }

    if (mediumPatterns.some(pattern => content.includes(pattern.toLowerCase()))) {
      return 'medium';
    }

    // Default to medium for unclassified errors
    return 'medium';
  }

  /**
   * Determine event type based on error characteristics
   */
  private static determineEventType(error: Error | string, context?: ErrorReportData['context']): string {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorName = typeof error === 'string' ? '' : error.name;
    
    // Map error patterns to event types
    if (errorName === 'ChunkLoadError' || errorMessage.includes('Loading chunk')) {
      return 'system_error';
    }

    if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
      return 'authentication_issue';
    }

    if (errorMessage.includes('content generation') || errorMessage.includes('AI')) {
      return 'content_generation_failure';
    }

    if (errorMessage.includes('integration') || errorMessage.includes('webhook') || errorMessage.includes('API')) {
      return 'integration_failure';
    }

    if (context?.component || context?.page) {
      return 'user_error';
    }

    return 'system_error';
  }

  /**
   * Generate a user-friendly error title
   */
  private static generateErrorTitle(error: Error | string, context?: ErrorReportData['context']): string {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorName = typeof error === 'string' ? '' : error.name;
    
    // Create contextual titles
    if (context?.component) {
      return `Error in ${context.component}: ${errorName || 'Unknown Error'}`;
    }

    if (context?.page) {
      return `Page Error on ${context.page}: ${errorName || 'Unknown Error'}`;
    }

    if (context?.action) {
      return `Error during ${context.action}: ${errorName || 'Unknown Error'}`;
    }

    // Fallback to error name or generic title
    if (errorName) {
      return `${errorName}: ${errorMessage.substring(0, 50)}${errorMessage.length > 50 ? '...' : ''}`;
    }

    return `System Error: ${errorMessage.substring(0, 50)}${errorMessage.length > 50 ? '...' : ''}`;
  }

  /**
   * Build comprehensive error description
   */
  private static buildErrorDescription(error: Error | string, context?: ErrorReportData['context']): string {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? null : error.stack;
    
    let description = `**Error Message:** ${errorMessage}\n\n`;
    
    if (context?.action) {
      description += `**User Action:** ${context.action}\n\n`;
    }

    if (context?.component) {
      description += `**Component:** ${context.component}\n\n`;
    }

    if (context?.page) {
      description += `**Page:** ${context.page}\n\n`;
    }

    if (context?.additionalData) {
      description += `**Additional Context:** ${JSON.stringify(context.additionalData, null, 2)}\n\n`;
    }

    if (stack) {
      description += `**Stack Trace:**\n\`\`\`\n${stack}\n\`\`\``;
    }

    return description;
  }

  /**
   * Report an error to the customer support system
   */
  static async reportError(errorData: ErrorReportData): Promise<{ success: boolean; ticketId?: string; error?: string }> {
    // Check circuit breaker
    if (this.shouldSkipErrorReporting()) {
      console.warn('Error reporting skipped due to circuit breaker (recent failures detected)');
      return { 
        success: false, 
        error: 'Error reporting temporarily disabled due to recent failures' 
      };
    }

    try {
      const { error, context, severity, eventType } = errorData;
      
      // Get current user
      const currentUser = await this.getCurrentUser();
      
      // Determine error characteristics
      const finalSeverity = severity || this.determineSeverity(error, context);
      const finalEventType = eventType || this.determineEventType(error, context);
      
      // Generate title and description
      const title = this.generateErrorTitle(error, context);
      const description = this.buildErrorDescription(error, context);
      
      // Build support ticket payload
      const supportTicket = {
        event_type: finalEventType,
        severity: finalSeverity,
        title: title,
        description: description,
        user_id: currentUser?.id || context?.userId || null,
        user_email: currentUser?.email || context?.userEmail || null,
        metadata: {
          source: 'automatic_error_reporting',
          error_type: typeof error === 'string' ? 'string' : error.name,
          component: context?.component,
          action: context?.action,
          additional_data: context?.additionalData,
          reported_at: new Date().toISOString()
        },
        error_details: {
          error_message: typeof error === 'string' ? error : error.message,
          stack_trace: typeof error === 'string' ? null : error.stack,
          error_name: typeof error === 'string' ? null : error.name,
          timestamp: new Date().toISOString()
        },
        user_context: {
          page_url: context?.page || window.location.pathname,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          viewport_size: `${window.innerWidth}x${window.innerHeight}`,
          session_id: currentUser?.id ? `session_${currentUser.id}_${Date.now()}` : null
        }
      };

      console.log('Reporting error to customer support:', supportTicket);

      // Send to customer support webhook
      const { data, error: submitError } = await supabase.functions.invoke('customer-support-slack', {
        body: supportTicket
      });

      if (submitError) {
        console.error('Error reporting failed:', submitError);
        this.markErrorReportingFailed(); // Trigger circuit breaker
        return { 
          success: false, 
          error: submitError.message || 'Failed to report error' 
        };
      }

      if (!data || !data.success) {
        console.error('Error reporting unsuccessful:', data);
        this.markErrorReportingFailed(); // Trigger circuit breaker
        return { 
          success: false, 
          error: data?.message || 'Failed to report error' 
        };
      }

      console.log('Error reported successfully:', data);
      return { 
        success: true, 
        ticketId: data.ticketId 
      };

    } catch (reportingError) {
      console.error('Error in error reporting service:', reportingError);
      this.markErrorReportingFailed(); // Trigger circuit breaker
      return { 
        success: false, 
        error: 'Failed to submit error report' 
      };
    }
  }

  /**
   * Report a JavaScript error automatically
   */
  static async reportJavaScriptError(
    error: Error,
    componentName?: string,
    userAction?: string,
    additionalData?: Record<string, any>
  ): Promise<{ success: boolean; ticketId?: string; error?: string }> {
    return this.reportError({
      error,
      context: {
        component: componentName,
        action: userAction,
        page: window.location.pathname,
        additionalData
      }
    });
  }

  /**
   * Report a network/API error
   */
  static async reportNetworkError(
    error: Error | string,
    endpoint?: string,
    method?: string,
    statusCode?: number,
    additionalData?: Record<string, any>
  ): Promise<{ success: boolean; ticketId?: string; error?: string }> {
    return this.reportError({
      error,
      context: {
        action: `${method || 'REQUEST'} ${endpoint || 'Unknown endpoint'}`,
        page: window.location.pathname,
        additionalData: {
          endpoint,
          method,
          statusCode,
          ...additionalData
        }
      },
      eventType: 'integration_failure',
      severity: statusCode && statusCode >= 500 ? 'high' : 'medium'
    });
  }

  /**
   * Report a content generation error
   */
  static async reportContentGenerationError(
    error: Error | string,
    context?: {
      platform?: string;
      contentType?: string;
      userId?: string;
      additionalData?: Record<string, any>;
    }
  ): Promise<{ success: boolean; ticketId?: string; error?: string }> {
    return this.reportError({
      error,
      context: {
        action: `Content generation for ${context?.platform || 'unknown platform'}`,
        page: window.location.pathname,
        userId: context?.userId,
        additionalData: {
          platform: context?.platform,
          contentType: context?.contentType,
          ...context?.additionalData
        }
      },
      eventType: 'content_generation_failure',
      severity: 'high'
    });
  }

  /**
   * Report an authentication error
   */
  static async reportAuthError(
    error: Error | string,
    action?: string,
    additionalData?: Record<string, any>
  ): Promise<{ success: boolean; ticketId?: string; error?: string }> {
    return this.reportError({
      error,
      context: {
        action: action || 'Authentication',
        page: window.location.pathname,
        additionalData
      },
      eventType: 'authentication_issue',
      severity: 'high'
    });
  }

  /**
   * Set up global error handlers for automatic error reporting
   */
  static setupGlobalErrorHandling(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Don't report certain types of errors that are expected
      const reason = event.reason?.message || event.reason;
      if (typeof reason === 'string') {
        const ignoredPatterns = [
          'ResizeObserver loop limit exceeded',
          'Non-Error promise rejection captured',
          'Loading chunk',
          'customer-support-slack',
          'Error reporting failed',
          'Failed to report error',
          'FunctionsHttpError'
        ];
        
        if (ignoredPatterns.some(pattern => reason.includes(pattern))) {
          return;
        }
      }

      this.reportError({
        error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        context: {
          action: 'Unhandled promise rejection',
          page: window.location.pathname
        },
        severity: 'high'
      }).catch(console.error);
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('Global JavaScript error:', event.error);
      
      // Don't report certain script errors
      if (event.filename && (
        event.filename.includes('extension') ||
        event.filename.includes('chrome-extension') ||
        event.filename.includes('moz-extension')
      )) {
        return;
      }

      this.reportError({
        error: event.error || new Error(event.message),
        context: {
          action: 'JavaScript error',
          page: window.location.pathname,
          additionalData: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        },
        severity: 'medium'
      }).catch(console.error);
    });

    console.log('Global error reporting handlers set up');
  }
}

// Export a default instance for convenience
export const errorReporting = ErrorReportingService;
