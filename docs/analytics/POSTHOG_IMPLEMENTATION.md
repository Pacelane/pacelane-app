# PostHog Analytics Implementation

This document describes the PostHog analytics implementation in the Pacelane app.

## Overview

PostHog is integrated to track key user interactions and provide insights into app usage. All analytics events are centralized in a service for easy management.

## Architecture

### PostHog Service (`src/services/postHogService.ts`)

Centralized service that manages all PostHog event tracking:

- **Event Names**: All event names are defined in `POSTHOG_EVENTS` constant
- **Tracking Methods**: Specific methods for each type of event
- **Error Handling**: Graceful fallback when PostHog is not available

### Key Events Tracked

#### Content Creation Events
- `content_creation_started` - When user starts creating content (blank or template)
- `content_creation_completed` - When user finishes creating content
- `template_selected` - When user selects a template

#### AI Chat Events
- `ai_chat_message_sent` - When user sends message to AI assistant
- `ai_chat_response_received` - When AI responds to user message
- `ai_suggestion_applied` - When user applies AI suggestion (quick actions)

#### Knowledge Base Events
- `knowledge_base_file_added` - When user uploads file to knowledge base
- `knowledge_base_text_added` - When user adds URL/text to knowledge base
- `knowledge_base_item_deleted` - When user deletes knowledge base item

#### User Authentication Events
- `user_signed_out` - When user signs out (handled in useAuth hook)

## Implementation Details

### Initialization

PostHog is initialized in `src/main.tsx`:

```typescript
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { postHogService } from '@/services/postHogService'

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  person_profiles: 'identified_only',
})

// Initialize PostHog service with the posthog instance
postHogService.setPostHogInstance(posthog)
```

### User Identification

Users are identified when their profile is loaded in the `useAuth` hook:

```typescript
// Identify user with PostHog when profile is available
if (posthog && profile) {
  posthog.identify(userId, {
    email: profile.email,
    name: profile.full_name,
    onboarding_completed: profile.onboarding_completed,
    created_at: profile.created_at,
  });
}
```

### Event Tracking Usage

Components use the PostHog service through the `usePostHogService` hook:

```typescript
import { usePostHogService } from '@/services/postHogService';

const MyComponent = () => {
  const postHogService = usePostHogService();
  
  const handleAction = () => {
    // Track the event
    postHogService.trackContentCreationStarted('template', 'template-id');
  };
};
```

## Environment Variables

Required environment variables (already configured):

```env
VITE_PUBLIC_POSTHOG_KEY=phc_7SYPTAXrNDyWbhMZza1YLNy32xXRYecYHLPuMA8VBO0
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## Testing

### Development Testing

Use the verification utility to test events:

```typescript
import { testPostHogEvents } from '@/utils/postHogVerification';

// In browser console or component
testPostHogEvents();
```

Or directly in browser console:
```javascript
window.testPostHogEvents();
```

### Event Verification

1. Open PostHog dashboard
2. Navigate to Events tab
3. Look for the tracked events after user interactions
4. Verify event properties are correctly populated

## Adding New Events

To add new events:

1. **Add event name** to `POSTHOG_EVENTS` in `postHogService.ts`
2. **Create tracking method** in `PostHogService` class
3. **Call the method** in the appropriate component
4. **Test the event** using the verification utility

Example:

```typescript
// 1. Add to POSTHOG_EVENTS
export const POSTHOG_EVENTS = {
  // ... existing events
  NEW_FEATURE_USED: 'new_feature_used',
} as const;

// 2. Add method to PostHogService
trackNewFeatureUsed(featureType: string) {
  this.trackEvent(POSTHOG_EVENTS.NEW_FEATURE_USED, {
    feature_type: featureType,
  });
}

// 3. Use in component
const handleNewFeature = () => {
  postHogService.trackNewFeatureUsed('awesome_feature');
};
```

## Best Practices

1. **Centralized Events**: All events go through the PostHog service
2. **Descriptive Names**: Use clear, descriptive event names
3. **Consistent Properties**: Use consistent property names across similar events
4. **Error Handling**: Service handles cases where PostHog is not available
5. **Privacy**: Only track necessary data, respect user privacy
6. **Testing**: Always test new events before deployment

## Troubleshooting

### Events Not Appearing

1. Check browser console for PostHog errors
2. Verify environment variables are set correctly
3. Ensure PostHog service is initialized properly
4. Check if events are being called in the code

### User Not Identified

1. Check if user profile is loaded before identification
2. Verify the `useAuth` hook is working correctly
3. Look for PostHog identification logs in console

### Performance Considerations

- PostHog events are tracked asynchronously
- Service gracefully handles missing PostHog instance
- Events include only necessary data to minimize payload size
