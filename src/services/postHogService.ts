// PostHog Analytics Service
// Centralized place for all PostHog event tracking
// This makes it easy to manage and update analytics events

import { PostHog } from 'posthog-js';

// Event names - centralized for easy maintenance
export const POSTHOG_EVENTS = {
  // Content Creation Events
  CONTENT_CREATION_STARTED: 'content_creation_started',
  CONTENT_CREATION_COMPLETED: 'content_creation_completed',
  TEMPLATE_SELECTED: 'template_selected',
  
  // AI Chat Events
  AI_CHAT_MESSAGE_SENT: 'ai_chat_message_sent',
  AI_CHAT_RESPONSE_RECEIVED: 'ai_chat_response_received',
  AI_SUGGESTION_APPLIED: 'ai_suggestion_applied',
  
  // Knowledge Base Events
  KNOWLEDGE_BASE_FILE_ADDED: 'knowledge_base_file_added',
  KNOWLEDGE_BASE_TEXT_ADDED: 'knowledge_base_text_added',
  KNOWLEDGE_BASE_ITEM_DELETED: 'knowledge_base_item_deleted',
  
  // User Authentication Events (already handled in useAuth)
  USER_SIGNED_OUT: 'user_signed_out',
} as const;

export class PostHogService {
  private posthog: PostHog | null = null;

  constructor(posthogInstance?: PostHog) {
    this.posthog = posthogInstance || null;
  }

  // Set PostHog instance (called from components using usePostHog hook)
  setPostHogInstance(posthogInstance: PostHog) {
    this.posthog = posthogInstance;
  }

  // Generic event tracking method
  private trackEvent(eventName: string, properties?: Record<string, any>) {
    if (this.posthog) {
      this.posthog.capture(eventName, properties);
      console.log(`PostHog: Event tracked - ${eventName}`, properties);
    } else {
      console.warn(`PostHog: Instance not available for event - ${eventName}`);
    }
  }

  // Content Creation Events
  trackContentCreationStarted(method: 'blank' | 'template', templateId?: string) {
    this.trackEvent(POSTHOG_EVENTS.CONTENT_CREATION_STARTED, {
      creation_method: method,
      template_id: templateId,
    });
  }

  trackContentCreationCompleted(contentType: string, wordCount?: number) {
    this.trackEvent(POSTHOG_EVENTS.CONTENT_CREATION_COMPLETED, {
      content_type: contentType,
      word_count: wordCount,
    });
  }

  trackTemplateSelected(templateId: string, templateName: string) {
    this.trackEvent(POSTHOG_EVENTS.TEMPLATE_SELECTED, {
      template_id: templateId,
      template_name: templateName,
    });
  }

  // AI Chat Events
  trackAiChatMessageSent(messageLength: number, context?: string) {
    this.trackEvent(POSTHOG_EVENTS.AI_CHAT_MESSAGE_SENT, {
      message_length: messageLength,
      context: context,
    });
  }

  trackAiChatResponseReceived(responseLength: number, responseTime?: number) {
    this.trackEvent(POSTHOG_EVENTS.AI_CHAT_RESPONSE_RECEIVED, {
      response_length: responseLength,
      response_time_ms: responseTime,
    });
  }

  trackAiSuggestionApplied(suggestionType: string) {
    this.trackEvent(POSTHOG_EVENTS.AI_SUGGESTION_APPLIED, {
      suggestion_type: suggestionType,
    });
  }

  // Knowledge Base Events
  trackKnowledgeBaseFileAdded(fileType: string, fileSize?: number, source?: string) {
    this.trackEvent(POSTHOG_EVENTS.KNOWLEDGE_BASE_FILE_ADDED, {
      file_type: fileType,
      file_size: fileSize,
      source: source, // 'whatsapp', 'upload', 'readai', etc.
    });
  }

  trackKnowledgeBaseTextAdded(textLength: number, source?: string) {
    this.trackEvent(POSTHOG_EVENTS.KNOWLEDGE_BASE_TEXT_ADDED, {
      text_length: textLength,
      source: source,
    });
  }

  trackKnowledgeBaseItemDeleted(itemType: 'file' | 'text') {
    this.trackEvent(POSTHOG_EVENTS.KNOWLEDGE_BASE_ITEM_DELETED, {
      item_type: itemType,
    });
  }
}

// Create singleton instance
export const postHogService = new PostHogService();

// Hook for components to use PostHog service
export const usePostHogService = () => {
  return postHogService;
};
