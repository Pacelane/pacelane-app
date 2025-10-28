# WhatsApp Messaging via Chatwoot - Implementation Guide

## Overview

This guide explains how to implement WhatsApp messaging in any application using Chatwoot's API. The implementation allows you to send WhatsApp messages to users programmatically through Chatwoot, which handles the WhatsApp Business API integration.

## Architecture

```
Your App → Chatwoot API → WhatsApp Business API → User's WhatsApp
```

**Key Concept**: You send messages to Chatwoot via REST API, and Chatwoot forwards them to WhatsApp.

---

## Prerequisites

### 1. Chatwoot Setup

Before implementing, ensure you have:

- ✅ **Chatwoot instance** running (self-hosted or cloud)
- ✅ **WhatsApp Business API** connected to Chatwoot
- ✅ **Active conversations** with users (Chatwoot conversation IDs)
- ✅ **API Access Token** with proper permissions
- ✅ **Account ID** from your Chatwoot instance

### 2. Required Information

You'll need to collect:

1. **Chatwoot Base URL**: Your Chatwoot instance URL
2. **API Access Token**: Generated from Chatwoot settings
3. **Account ID**: Found in Chatwoot settings
4. **Conversation ID**: The ID of the conversation with the user

---

## Environment Variables

Use these **exact variable names** for consistency:

```bash
# Chatwoot API Configuration
CHATWOOT_BASE_URL=https://your-chatwoot-instance.com
CHATWOOT_API_ACCESS_TOKEN=your_api_access_token_here
CHATWOOT_ACCOUNT_ID=1
```

### Getting Your Credentials

#### **API Access Token**
1. Log into Chatwoot
2. Go to **Settings** → **Profile** → **Access Token**
3. Click **"Add new token"**
4. Copy the generated token (starts with a long alphanumeric string)

#### **Account ID**
1. Log into Chatwoot
2. Go to **Settings** → **Accounts**
3. Your Account ID is visible in the URL or account list (usually `1` for single-account setups)

#### **Base URL**
- Your Chatwoot instance URL without trailing slash
- Example: `https://app.chatwoot.com` or `https://chatwoot.yourdomain.com`

---

## Core Implementation

### HTTP Request Details

**Endpoint:**
```
POST {CHATWOOT_BASE_URL}/api/v1/accounts/{ACCOUNT_ID}/conversations/{CONVERSATION_ID}/messages
```

**Headers:**
```
Content-Type: application/json
api_access_token: {CHATWOOT_API_ACCESS_TOKEN}
```

**Request Body:**
```json
{
  "content": "Your message text here",
  "message_type": "outgoing"
}
```

**Response:**
```json
{
  "id": 12345,
  "content": "Your message text here",
  "message_type": "outgoing",
  "created_at": 1699564800,
  "conversation_id": 123,
  "sender": {
    "id": 1,
    "name": "Your Bot"
  }
}
```

---

## Implementation Examples

### 1. JavaScript/TypeScript (Node.js)

```typescript
// whatsapp-messenger.ts

interface WhatsAppConfig {
  chatwootBaseUrl: string;
  chatwootApiToken: string;
  chatwootAccountId: string;
}

interface SendMessageParams {
  conversationId: number;
  content: string;
}

interface SendMessageResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

class WhatsAppMessenger {
  private config: WhatsAppConfig;

  constructor() {
    this.config = {
      chatwootBaseUrl: process.env.CHATWOOT_BASE_URL || '',
      chatwootApiToken: process.env.CHATWOOT_API_ACCESS_TOKEN || '',
      chatwootAccountId: process.env.CHATWOOT_ACCOUNT_ID || '1'
    };

    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.chatwootBaseUrl) {
      throw new Error('CHATWOOT_BASE_URL is not configured');
    }
    if (!this.config.chatwootApiToken) {
      throw new Error('CHATWOOT_API_ACCESS_TOKEN is not configured');
    }
    if (!this.config.chatwootAccountId) {
      throw new Error('CHATWOOT_ACCOUNT_ID is not configured');
    }
  }

  /**
   * Send a WhatsApp message via Chatwoot
   */
  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    try {
      console.log(`Sending WhatsApp message to conversation ${params.conversationId}`);

      const url = `${this.config.chatwootBaseUrl}/api/v1/accounts/${this.config.chatwootAccountId}/conversations/${params.conversationId}/messages`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': this.config.chatwootApiToken
        },
        body: JSON.stringify({
          content: params.content,
          message_type: 'outgoing'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chatwoot API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ Message sent successfully. Message ID: ${result.id}`);

      return {
        success: true,
        messageId: result.id
      };

    } catch (error: any) {
      console.error('❌ Error sending WhatsApp message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send a message with error handling and retries
   */
  async sendMessageWithRetry(
    params: SendMessageParams,
    maxRetries: number = 3
  ): Promise<SendMessageResult> {
    let lastError: string = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Attempt ${attempt}/${maxRetries}`);

      const result = await this.sendMessage(params);

      if (result.success) {
        return result;
      }

      lastError = result.error || 'Unknown error';

      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    return {
      success: false,
      error: `Failed after ${maxRetries} attempts: ${lastError}`
    };
  }
}

// Usage Example
async function main() {
  const messenger = new WhatsAppMessenger();

  // Send a simple message
  const result = await messenger.sendMessage({
    conversationId: 123,
    content: 'Hello! Your content is ready. Check your dashboard to view it.'
  });

  if (result.success) {
    console.log('Message sent successfully!');
  } else {
    console.error('Failed to send message:', result.error);
  }
}

export default WhatsAppMessenger;
```

### 2. Python

```python
# whatsapp_messenger.py

import os
import requests
import time
from typing import Dict, Optional

class WhatsAppMessenger:
    """Send WhatsApp messages via Chatwoot API"""
    
    def __init__(self):
        self.base_url = os.getenv('CHATWOOT_BASE_URL')
        self.api_token = os.getenv('CHATWOOT_API_ACCESS_TOKEN')
        self.account_id = os.getenv('CHATWOOT_ACCOUNT_ID', '1')
        
        self._validate_config()
    
    def _validate_config(self) -> None:
        """Validate required environment variables"""
        if not self.base_url:
            raise ValueError('CHATWOOT_BASE_URL is not configured')
        if not self.api_token:
            raise ValueError('CHATWOOT_API_ACCESS_TOKEN is not configured')
        if not self.account_id:
            raise ValueError('CHATWOOT_ACCOUNT_ID is not configured')
    
    def send_message(
        self,
        conversation_id: int,
        content: str
    ) -> Dict[str, any]:
        """
        Send a WhatsApp message via Chatwoot
        
        Args:
            conversation_id: Chatwoot conversation ID
            content: Message text to send
            
        Returns:
            Dict with 'success', 'message_id', and 'error' keys
        """
        try:
            print(f"Sending WhatsApp message to conversation {conversation_id}")
            
            url = f"{self.base_url}/api/v1/accounts/{self.account_id}/conversations/{conversation_id}/messages"
            
            headers = {
                'Content-Type': 'application/json',
                'api_access_token': self.api_token
            }
            
            payload = {
                'content': content,
                'message_type': 'outgoing'
            }
            
            response = requests.post(url, json=payload, headers=headers)
            
            if response.status_code != 200:
                raise Exception(f"Chatwoot API error: {response.status_code} - {response.text}")
            
            result = response.json()
            print(f"✅ Message sent successfully. Message ID: {result['id']}")
            
            return {
                'success': True,
                'message_id': result['id']
            }
            
        except Exception as e:
            print(f"❌ Error sending WhatsApp message: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def send_message_with_retry(
        self,
        conversation_id: int,
        content: str,
        max_retries: int = 3
    ) -> Dict[str, any]:
        """
        Send message with automatic retries
        
        Args:
            conversation_id: Chatwoot conversation ID
            content: Message text to send
            max_retries: Maximum number of retry attempts
            
        Returns:
            Dict with result of send operation
        """
        last_error = ''
        
        for attempt in range(1, max_retries + 1):
            print(f"Attempt {attempt}/{max_retries}")
            
            result = self.send_message(conversation_id, content)
            
            if result['success']:
                return result
            
            last_error = result.get('error', 'Unknown error')
            
            if attempt < max_retries:
                # Exponential backoff: 2s, 4s, 8s
                wait_time = 2 ** attempt
                print(f"Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
        
        return {
            'success': False,
            'error': f"Failed after {max_retries} attempts: {last_error}"
        }

# Usage Example
if __name__ == "__main__":
    messenger = WhatsAppMessenger()
    
    # Send a message
    result = messenger.send_message(
        conversation_id=123,
        content="Hello! Your content is ready. Check your dashboard to view it."
    )
    
    if result['success']:
        print("Message sent successfully!")
    else:
        print(f"Failed to send message: {result['error']}")
```

### 3. PHP

```php
<?php
// WhatsAppMessenger.php

class WhatsAppMessenger {
    private $baseUrl;
    private $apiToken;
    private $accountId;
    
    public function __construct() {
        $this->baseUrl = getenv('CHATWOOT_BASE_URL');
        $this->apiToken = getenv('CHATWOOT_API_ACCESS_TOKEN');
        $this->accountId = getenv('CHATWOOT_ACCOUNT_ID') ?: '1';
        
        $this->validateConfig();
    }
    
    private function validateConfig() {
        if (empty($this->baseUrl)) {
            throw new Exception('CHATWOOT_BASE_URL is not configured');
        }
        if (empty($this->apiToken)) {
            throw new Exception('CHATWOOT_API_ACCESS_TOKEN is not configured');
        }
        if (empty($this->accountId)) {
            throw new Exception('CHATWOOT_ACCOUNT_ID is not configured');
        }
    }
    
    /**
     * Send a WhatsApp message via Chatwoot
     * 
     * @param int $conversationId Chatwoot conversation ID
     * @param string $content Message text to send
     * @return array Result with 'success', 'message_id', and 'error' keys
     */
    public function sendMessage($conversationId, $content) {
        try {
            error_log("Sending WhatsApp message to conversation {$conversationId}");
            
            $url = "{$this->baseUrl}/api/v1/accounts/{$this->accountId}/conversations/{$conversationId}/messages";
            
            $headers = [
                'Content-Type: application/json',
                'api_access_token: ' . $this->apiToken
            ];
            
            $payload = json_encode([
                'content' => $content,
                'message_type' => 'outgoing'
            ]);
            
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode !== 200) {
                throw new Exception("Chatwoot API error: {$httpCode} - {$response}");
            }
            
            $result = json_decode($response, true);
            error_log("✅ Message sent successfully. Message ID: {$result['id']}");
            
            return [
                'success' => true,
                'message_id' => $result['id']
            ];
            
        } catch (Exception $e) {
            error_log("❌ Error sending WhatsApp message: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Send message with automatic retries
     */
    public function sendMessageWithRetry($conversationId, $content, $maxRetries = 3) {
        $lastError = '';
        
        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            error_log("Attempt {$attempt}/{$maxRetries}");
            
            $result = $this->sendMessage($conversationId, $content);
            
            if ($result['success']) {
                return $result;
            }
            
            $lastError = $result['error'] ?? 'Unknown error';
            
            if ($attempt < $maxRetries) {
                // Exponential backoff
                $waitTime = pow(2, $attempt);
                error_log("Waiting {$waitTime}s before retry...");
                sleep($waitTime);
            }
        }
        
        return [
            'success' => false,
            'error' => "Failed after {$maxRetries} attempts: {$lastError}"
        ];
    }
}

// Usage Example
$messenger = new WhatsAppMessenger();

$result = $messenger->sendMessage(
    123,
    "Hello! Your content is ready. Check your dashboard to view it."
);

if ($result['success']) {
    echo "Message sent successfully!\n";
} else {
    echo "Failed to send message: {$result['error']}\n";
}
?>
```

### 4. cURL (Command Line)

```bash
#!/bin/bash
# send-whatsapp-message.sh

# Configuration from environment variables
CHATWOOT_BASE_URL="${CHATWOOT_BASE_URL}"
CHATWOOT_API_ACCESS_TOKEN="${CHATWOOT_API_ACCESS_TOKEN}"
CHATWOOT_ACCOUNT_ID="${CHATWOOT_ACCOUNT_ID:-1}"

# Parameters
CONVERSATION_ID=$1
MESSAGE_CONTENT=$2

if [ -z "$CONVERSATION_ID" ] || [ -z "$MESSAGE_CONTENT" ]; then
    echo "Usage: $0 <conversation_id> <message_content>"
    exit 1
fi

# Validate configuration
if [ -z "$CHATWOOT_BASE_URL" ]; then
    echo "Error: CHATWOOT_BASE_URL is not set"
    exit 1
fi

if [ -z "$CHATWOOT_API_ACCESS_TOKEN" ]; then
    echo "Error: CHATWOOT_API_ACCESS_TOKEN is not set"
    exit 1
fi

# Build API URL
API_URL="${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${CONVERSATION_ID}/messages"

# Send message
echo "Sending message to conversation ${CONVERSATION_ID}..."

response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "api_access_token: ${CHATWOOT_API_ACCESS_TOKEN}" \
  -d "{
    \"content\": \"${MESSAGE_CONTENT}\",
    \"message_type\": \"outgoing\"
  }")

# Extract response body and status code
http_code=$(echo "$response" | tail -n 1)
response_body=$(echo "$response" | sed '$d')

# Check result
if [ "$http_code" -eq 200 ]; then
    echo "✅ Message sent successfully!"
    echo "Response: $response_body"
    exit 0
else
    echo "❌ Failed to send message (HTTP $http_code)"
    echo "Response: $response_body"
    exit 1
fi
```

**Usage:**
```bash
chmod +x send-whatsapp-message.sh
./send-whatsapp-message.sh 123 "Hello! Your content is ready."
```

---

## Finding Conversation IDs

### Method 1: From Chatwoot UI

1. Open Chatwoot
2. Navigate to the conversation
3. Look at the URL: `https://chatwoot.com/app/accounts/1/conversations/{CONVERSATION_ID}`
4. The number at the end is your conversation ID

### Method 2: Via API

```bash
# List all conversations
curl -X GET "${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations" \
  -H "api_access_token: ${CHATWOOT_API_ACCESS_TOKEN}"
```

### Method 3: Store During Webhook

When you receive messages via webhook, store the `conversation_id`:

```typescript
// In your webhook handler
app.post('/chatwoot-webhook', (req, res) => {
  const { conversation, sender } = req.body;
  
  // Store conversation ID mapped to user
  await database.saveUserConversation({
    userId: sender.custom_attributes?.user_id,
    conversationId: conversation.id,
    whatsappPhone: sender.phone_number
  });
  
  res.json({ success: true });
});
```

---

## Common Use Cases

### 1. Notification System

```typescript
// Send notification when task completes
async function notifyUserTaskComplete(userId: string, taskName: string) {
  // Get user's conversation ID
  const conversationId = await getUserConversationId(userId);
  
  if (!conversationId) {
    console.log(`No WhatsApp conversation found for user ${userId}`);
    return;
  }
  
  const messenger = new WhatsAppMessenger();
  
  const message = `🎉 Task completed!\n\n` +
    `Your task "${taskName}" has been completed successfully.\n\n` +
    `Check your dashboard for details.`;
  
  await messenger.sendMessage({
    conversationId,
    content: message
  });
}
```

### 2. Order Updates

```typescript
// Send order status update
async function sendOrderUpdate(userId: string, orderData: any) {
  const conversationId = await getUserConversationId(userId);
  
  if (!conversationId) return;
  
  const messenger = new WhatsAppMessenger();
  
  const message = `📦 Order Update\n\n` +
    `Order #${orderData.id}\n` +
    `Status: ${orderData.status}\n` +
    `Expected delivery: ${orderData.deliveryDate}\n\n` +
    `Track your order: ${orderData.trackingUrl}`;
  
  await messenger.sendMessageWithRetry({
    conversationId,
    content: message
  });
}
```

### 3. Error Notifications

```typescript
// Notify user of error
async function notifyUserOfError(userId: string, errorType: string) {
  const conversationId = await getUserConversationId(userId);
  
  if (!conversationId) return;
  
  const messenger = new WhatsAppMessenger();
  
  const message = `⚠️ Action Required\n\n` +
    `We encountered an issue: ${errorType}\n\n` +
    `Please check your dashboard or reply here for assistance.`;
  
  await messenger.sendMessage({
    conversationId,
    content: message
  });
}
```

---

## Testing

### 1. Test Environment Setup

```bash
# Set test environment variables
export CHATWOOT_BASE_URL="https://your-test-chatwoot.com"
export CHATWOOT_API_ACCESS_TOKEN="test_token_here"
export CHATWOOT_ACCOUNT_ID="1"
```

### 2. Simple Test Script

```typescript
// test-whatsapp.ts
import WhatsAppMessenger from './whatsapp-messenger';

async function testWhatsAppMessaging() {
  console.log('🧪 Testing WhatsApp Messaging...\n');
  
  const messenger = new WhatsAppMessenger();
  
  // Test 1: Send simple message
  console.log('Test 1: Sending simple message');
  const result1 = await messenger.sendMessage({
    conversationId: 123, // Replace with your test conversation ID
    content: 'Test message from integration'
  });
  console.log('Result:', result1);
  console.log('');
  
  // Test 2: Send with retry
  console.log('Test 2: Sending with retry logic');
  const result2 = await messenger.sendMessageWithRetry({
    conversationId: 123,
    content: 'Test message with retry'
  });
  console.log('Result:', result2);
  console.log('');
  
  // Test 3: Error handling (invalid conversation ID)
  console.log('Test 3: Testing error handling');
  const result3 = await messenger.sendMessage({
    conversationId: 999999,
    content: 'This should fail'
  });
  console.log('Result:', result3);
}

testWhatsAppMessaging();
```

### 3. Manual Testing with cURL

```bash
# Test sending a message
curl -X POST "${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/123/messages" \
  -H "Content-Type: application/json" \
  -H "api_access_token: ${CHATWOOT_API_ACCESS_TOKEN}" \
  -d '{
    "content": "Test message from cURL",
    "message_type": "outgoing"
  }'
```

---

## Troubleshooting

### Issue 1: "401 Unauthorized"

**Cause**: Invalid or expired API token

**Solution**:
```bash
# Verify your token
echo $CHATWOOT_API_ACCESS_TOKEN

# Generate a new token in Chatwoot:
# Settings → Profile → Access Token → Add new token
```

### Issue 2: "404 Not Found"

**Cause**: Invalid conversation ID or account ID

**Solution**:
```bash
# List all conversations to verify IDs
curl -X GET "${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations" \
  -H "api_access_token: ${CHATWOOT_API_ACCESS_TOKEN}"
```

### Issue 3: "Message not appearing in WhatsApp"

**Cause**: Conversation is not a WhatsApp conversation

**Solution**:
- Verify the conversation is from a WhatsApp inbox
- Check Chatwoot logs for delivery status
- Ensure WhatsApp Business API is properly connected

### Issue 4: "Connection Timeout"

**Cause**: Network issues or Chatwoot instance down

**Solution**:
```bash
# Test connectivity
curl -I $CHATWOOT_BASE_URL

# Check Chatwoot health
curl -X GET "${CHATWOOT_BASE_URL}/api"
```

### Issue 5: "Rate Limit Exceeded"

**Cause**: Too many requests

**Solution**:
- Implement exponential backoff (see retry examples)
- Add delays between messages
- Queue messages for batch processing

---

## Best Practices

### 1. Error Handling

Always wrap API calls in try-catch blocks:

```typescript
try {
  await messenger.sendMessage({...});
} catch (error) {
  // Log error
  console.error('WhatsApp send error:', error);
  
  // Notify admin
  await notifyAdmin('WhatsApp messaging failed', error);
  
  // Fallback mechanism
  await sendEmailNotification(user);
}
```

### 2. Retry Logic

Implement exponential backoff for transient failures:

```typescript
const maxRetries = 3;
const baseDelay = 1000; // 1 second

for (let i = 0; i < maxRetries; i++) {
  const result = await sendMessage();
  if (result.success) break;
  
  if (i < maxRetries - 1) {
    await delay(baseDelay * Math.pow(2, i));
  }
}
```

### 3. Rate Limiting

Respect API rate limits:

```typescript
// Simple rate limiter
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestsPerMinute = 60;
  
  async enqueue(fn: () => Promise<any>) {
    this.queue.push(fn);
    if (!this.processing) {
      await this.processQueue();
    }
  }
  
  private async processQueue() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        await fn();
        await this.delay(60000 / this.requestsPerMinute);
      }
    }
    
    this.processing = false;
  }
  
  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 4. Message Formatting

Use clear, concise messages:

```typescript
// Good ✅
const message = `🎉 Success!\n\n` +
  `Your order #12345 has been confirmed.\n\n` +
  `Delivery: Tomorrow, 2-4 PM`;

// Bad ❌
const message = `success order12345 confirmed delivery tomorrow 2pm-4pm`;
```

### 5. Logging

Implement comprehensive logging:

```typescript
logger.info('WhatsApp message sent', {
  conversationId,
  messageId: result.messageId,
  userId,
  timestamp: new Date().toISOString()
});

logger.error('WhatsApp send failed', {
  conversationId,
  error: error.message,
  userId,
  retryAttempt: attemptNumber
});
```

### 6. Monitoring

Track key metrics:

- **Success Rate**: % of messages sent successfully
- **Average Response Time**: Time to send message
- **Error Rate**: % of failed sends
- **Retry Rate**: % of messages requiring retries

---

## Security Considerations

### 1. Protect API Credentials

```typescript
// ❌ Never hardcode credentials
const token = "abc123...";

// ✅ Always use environment variables
const token = process.env.CHATWOOT_API_ACCESS_TOKEN;
```

### 2. Validate Input

```typescript
function sendMessage(conversationId: number, content: string) {
  // Validate conversation ID
  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    throw new Error('Invalid conversation ID');
  }
  
  // Validate content
  if (!content || content.trim().length === 0) {
    throw new Error('Message content cannot be empty');
  }
  
  // Limit message length
  if (content.length > 4096) {
    throw new Error('Message too long (max 4096 characters)');
  }
  
  // Proceed with sending...
}
```

### 3. User Privacy

```typescript
// Don't log sensitive user data
logger.info('Message sent', {
  conversationId,
  messageLength: content.length, // Log length, not content
  userId: hashUserId(userId) // Hash user IDs
});
```

---

## Advanced Features

### 1. Send Media/Attachments

```typescript
// Send image
async function sendImage(conversationId: number, imageUrl: string, caption: string) {
  const response = await fetch(
    `${baseUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': apiToken
      },
      body: JSON.stringify({
        content: caption,
        message_type: 'outgoing',
        attachments: [{
          file_url: imageUrl,
          file_type: 'image'
        }]
      })
    }
  );
}
```

### 2. Private Notes (Internal)

```typescript
// Send internal note (not visible to user)
async function sendPrivateNote(conversationId: number, note: string) {
  const response = await fetch(
    `${baseUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': apiToken
      },
      body: JSON.stringify({
        content: note,
        message_type: 'outgoing',
        private: true // Makes it internal
      })
    }
  );
}
```

### 3. Message Templates

```typescript
// Use message templates for consistency
const templates = {
  welcome: (name: string) => 
    `👋 Welcome ${name}!\n\nThank you for joining us.`,
  
  orderConfirmed: (orderId: string) =>
    `✅ Order #${orderId} confirmed!\n\nWe'll notify you when it ships.`,
  
  error: (errorType: string) =>
    `⚠️ Issue detected: ${errorType}\n\nOur team is working on it.`
};

// Usage
await sendMessage(conversationId, templates.welcome("John"));
```

---

## Complete Integration Example

Here's a full example of integrating WhatsApp messaging into an application:

```typescript
// app/services/whatsapp-service.ts

import { WhatsAppMessenger } from './whatsapp-messenger';

class WhatsAppService {
  private messenger: WhatsAppMessenger;
  
  constructor() {
    this.messenger = new WhatsAppMessenger();
  }
  
  /**
   * Get conversation ID for a user
   */
  private async getConversationId(userId: string): Promise<number | null> {
    // Look up conversation ID from your database
    const user = await db.users.findById(userId);
    return user?.whatsappConversationId || null;
  }
  
  /**
   * Send content ready notification
   */
  async notifyContentReady(userId: string, contentData: any): Promise<boolean> {
    const conversationId = await this.getConversationId(userId);
    
    if (!conversationId) {
      console.log(`No WhatsApp conversation for user ${userId}`);
      return false;
    }
    
    const message = `🎉 Your content is ready!\n\n` +
      `📝 ${contentData.title}\n\n` +
      `Open the app to view and publish your content.\n\n` +
      `💡 Tip: You can edit before publishing.`;
    
    const result = await this.messenger.sendMessageWithRetry({
      conversationId,
      content: message
    });
    
    return result.success;
  }
  
  /**
   * Send error notification
   */
  async notifyError(userId: string, errorMessage: string): Promise<boolean> {
    const conversationId = await this.getConversationId(userId);
    
    if (!conversationId) return false;
    
    const message = `⚠️ We encountered an issue\n\n` +
      `${errorMessage}\n\n` +
      `Please try again or contact support if the issue persists.`;
    
    const result = await this.messenger.sendMessage({
      conversationId,
      content: message
    });
    
    return result.success;
  }
  
  /**
   * Send custom message
   */
  async sendCustomMessage(userId: string, content: string): Promise<boolean> {
    const conversationId = await this.getConversationId(userId);
    
    if (!conversationId) return false;
    
    const result = await this.messenger.sendMessage({
      conversationId,
      content
    });
    
    return result.success;
  }
}

export default new WhatsAppService();
```

**Usage in your application:**

```typescript
// When content generation completes
import whatsappService from '@/services/whatsapp-service';

async function onContentGenerationComplete(userId: string, content: any) {
  // Save content to database
  await saveContent(content);
  
  // Notify user via WhatsApp
  await whatsappService.notifyContentReady(userId, {
    title: content.title,
    id: content.id
  });
}

// When error occurs
async function onContentGenerationError(userId: string, error: Error) {
  await whatsappService.notifyError(userId, error.message);
}
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Environment variables are set correctly
- [ ] API token has proper permissions
- [ ] Error handling is comprehensive
- [ ] Logging is in place
- [ ] Rate limiting is implemented
- [ ] Retry logic is configured
- [ ] Testing has been performed
- [ ] Monitoring is set up
- [ ] Fallback mechanisms exist
- [ ] Documentation is updated

---

## Support & Resources

### Chatwoot API Documentation
- **API Reference**: https://www.chatwoot.com/developers/api/
- **Webhooks**: https://www.chatwoot.com/docs/product/channels/api/webhooks

### Common Questions

**Q: How do I get the conversation ID?**  
A: Either store it when receiving webhooks, or fetch it from the Chatwoot API by listing conversations.

**Q: Can I send media files?**  
A: Yes, use the `attachments` field in the request body with a public file URL.

**Q: Are there rate limits?**  
A: Yes, but they depend on your Chatwoot setup. Implement retry logic and rate limiting.

**Q: How do I handle message delivery failures?**  
A: Use the retry logic examples provided, and implement fallback notifications (email, SMS).

---

## Conclusion

You now have everything you need to implement WhatsApp messaging via Chatwoot in any application. The key steps are:

1. ✅ Set up environment variables
2. ✅ Implement the HTTP request to Chatwoot API
3. ✅ Handle errors and retries
4. ✅ Map users to conversation IDs
5. ✅ Send messages programmatically

**Remember**: Always use the same environment variable names (`CHATWOOT_BASE_URL`, `CHATWOOT_API_ACCESS_TOKEN`, `CHATWOOT_ACCOUNT_ID`) for consistency across projects.

Good luck with your implementation! 🚀

