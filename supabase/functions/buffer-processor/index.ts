import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Types
interface MessageBuffer {
  id: string;
  conversation_id: number;
  user_id: string;
  buffer_start_time: string;
  buffer_end_time?: string;
  last_message_time: string;
  status: 'active' | 'processing' | 'completed';
  message_count: number;
}

interface BufferedMessage {
  id: string;
  buffer_id: string;
  chatwoot_message_id: number;
  content?: string;
  message_type: 'text' | 'audio' | 'image' | 'file';
  content_type?: string;
  attachments: any[];
  sender_info: any;
  conversation_info: any;
  received_at: string;
}

interface AggregatedContext {
  messageCount: number;
  timeSpan: number; // milliseconds
  combinedText: string;
  audioTranscripts: string[];
  attachments: AttachmentInfo[];
  conversationHistory: any[];
  userContext: any;
  urgencyScore: number; // 1-10 based on content analysis
}

interface AttachmentInfo {
  type: string;
  url?: string;
  filename?: string;
  size?: number;
  transcription?: string;
}

interface ProcessingResult {
  shouldRespond: boolean;
  content?: string;
  confidence: number;
  detectedIntent?: string;
  suggestedActions?: string[];
  error?: string;
}

class BufferProcessor {
  private readonly MAX_PROCESSING_TIME_MS = 120000; // 2 minutes
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly AI_PROCESSING_TIMEOUT_MS = 30000; // 30 seconds

  constructor(private supabase: any) {}

  async processScheduledBuffers(): Promise<{
    processed: number;
    failed: number;
    skipped: number;
    results: any[];
  }> {
    const results = {
      processed: 0,
      failed: 0,
      skipped: 0,
      results: []
    };

    try {
      console.log('Starting scheduled buffer processing');
      
      const dueBuffers = await this.getDueBuffers();
      console.log(`Found ${dueBuffers.length} buffers due for processing`);

      for (const buffer of dueBuffers) {
        try {
          const result = await this.processBuffer(buffer.id);
          if (result.success) {
            results.processed++;
          } else {
            results.failed++;
          }
          results.results.push(result);
        } catch (error) {
          console.error(`Error processing buffer ${buffer.id}:`, error);
          await this.handleBufferError(buffer.id, error);
          results.failed++;
          results.results.push({
            bufferId: buffer.id,
            success: false,
            error: error.message
          });
        }
      }

      console.log(`Buffer processing complete. Processed: ${results.processed}, Failed: ${results.failed}, Skipped: ${results.skipped}`);
      return results;

    } catch (error) {
      console.error('Error in processScheduledBuffers:', error);
      throw error;
    }
  }

  private async getDueBuffers(): Promise<MessageBuffer[]> {
    const now = new Date().toISOString();
    
    const { data: dueJobs, error } = await this.supabase
      .from('buffer_processing_jobs')
      .select(`
        buffer_id,
        scheduled_for,
        attempts,
        message_buffer (
          id,
          conversation_id,
          user_id,
          buffer_start_time,
          buffer_end_time,
          last_message_time,
          status,
          message_count
        )
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .lt('attempts', this.MAX_RETRY_ATTEMPTS)
      .order('scheduled_for', { ascending: true })
      .limit(50); // Process max 50 buffers per run

    if (error) {
      throw new Error(`Error fetching due buffers: ${error.message}`);
    }

    return (dueJobs || [])
      .filter(job => job.message_buffer)
      .map(job => job.message_buffer);
  }

  async processBuffer(bufferId: string): Promise<any> {
    console.log(`Processing buffer ${bufferId}`);
    
    try {
      // Mark buffer as processing
      await this.updateBufferStatus(bufferId, 'processing');
      await this.updateJobStatus(bufferId, 'running');

      // Get all messages in buffer
      const messages = await this.getBufferedMessages(bufferId);
      if (messages.length === 0) {
        console.log(`No messages found in buffer ${bufferId}`);
        await this.completeBuffer(bufferId, false, 'No messages in buffer');
        return { bufferId, success: true, action: 'skipped', reason: 'No messages' };
      }

      // Build comprehensive context
      const context = await this.buildAggregatedContext(messages, bufferId);
      
      // Process with AI
      const aiResult = await this.processWithAI(context, messages[0]);
      
      // Send response if needed
      let responseResult = null;
      if (aiResult.shouldRespond && aiResult.content) {
        responseResult = await this.sendResponse(
          messages[0].conversation_info,
          aiResult.content,
          messages[0].sender_info
        );
      }

      // Mark buffer as completed
      await this.completeBuffer(bufferId, aiResult.shouldRespond, aiResult.content);

      console.log(`Successfully processed buffer ${bufferId}: shouldRespond=${aiResult.shouldRespond}`);
      
      return {
        bufferId,
        success: true,
        action: aiResult.shouldRespond ? 'responded' : 'no_response',
        messageCount: messages.length,
        confidence: aiResult.confidence,
        intent: aiResult.detectedIntent,
        responseResult
      };

    } catch (error) {
      console.error(`Error processing buffer ${bufferId}:`, error);
      await this.handleBufferError(bufferId, error);
      throw error;
    }
  }

  private async buildAggregatedContext(messages: BufferedMessage[], bufferId: string): Promise<AggregatedContext> {
    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];
    const timeSpan = new Date(lastMessage.received_at).getTime() - new Date(firstMessage.received_at).getTime();

    // Combine text messages
    const textMessages = messages
      .filter(msg => msg.message_type === 'text' && msg.content)
      .map(msg => msg.content)
      .join('\n');

    // Process audio messages (placeholder for transcription)
    const audioTranscripts = await this.processAudioMessages(
      messages.filter(msg => msg.message_type === 'audio')
    );

    // Process attachments
    const attachments = this.processAttachments(messages);

    // Get conversation history
    const conversationHistory = await this.getRecentHistory(firstMessage.conversation_info.id);

    // Get user context from buffer (which already has the correct user_id)
    const userContext = await this.getUserContextFromBuffer(bufferId);

    // Calculate urgency score
    const urgencyScore = this.calculateUrgencyScore(messages, textMessages);

    return {
      messageCount: messages.length,
      timeSpan,
      combinedText: textMessages,
      audioTranscripts,
      attachments,
      conversationHistory,
      userContext,
      urgencyScore
    };
  }

  private async processAudioMessages(audioMessages: BufferedMessage[]): Promise<string[]> {
    const transcripts: string[] = [];
    
    for (const message of audioMessages) {
      try {
        // Check if we have existing transcription
        const { data: audioFile } = await this.supabase
          .from('audio_files')
          .select('transcription')
          .eq('chatwoot_message_id', message.chatwoot_message_id)
          .single();

        if (audioFile?.transcription) {
          transcripts.push(audioFile.transcription);
        } else {
          // Placeholder for audio transcription service
          transcripts.push('[Audio message - transcription pending]');
        }
      } catch (error) {
        console.error('Error processing audio message:', error);
        transcripts.push('[Audio message - transcription failed]');
      }
    }

    return transcripts;
  }

  private processAttachments(messages: BufferedMessage[]): AttachmentInfo[] {
    const attachments: AttachmentInfo[] = [];

    for (const message of messages) {
      if (message.attachments && Array.isArray(message.attachments)) {
        for (const attachment of message.attachments) {
          attachments.push({
            type: message.message_type,
            url: attachment.data_url || attachment.file_url,
            filename: attachment.file_name || attachment.filename,
            size: attachment.file_size,
            transcription: attachment.transcription
          });
        }
      }
    }

    return attachments;
  }

  private async getRecentHistory(conversationId: number): Promise<any[]> {
    try {
      const { data: conversation } = await this.supabase
        .from('conversations')
        .select('recent_messages')
        .eq('chatwoot_conversation_id', conversationId)
        .single();

      return conversation?.recent_messages || [];
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }

  /**
   * Get user context from the buffer itself (which already has the correct user_id)
   */
  private async getUserContextFromBuffer(bufferId: string): Promise<any> {
    try {
      // Get the buffer which contains the user_id
      const { data: buffer, error } = await this.supabase
        .from('message_buffer')
        .select('user_id')
        .eq('id', bufferId)
        .single();

      if (error || !buffer) {
        console.error('Error getting buffer:', error);
        return { context: 'error', error: error?.message };
      }

      if (!buffer.user_id) {
        console.error('No user_id found in buffer');
        return { context: 'no_user_id' };
      }

      console.log(`✅ Found user ID from buffer: ${buffer.user_id}`);

      // Get additional user context if needed
      try {
        const { data: profile } = await this.supabase
          .from('profiles')
          .select('*')
          .eq('id', buffer.user_id)
          .single();

        return {
          userId: buffer.user_id,
          profile: profile || {}
        };
      } catch (profileError) {
        console.error('Error getting user profile:', profileError);
        // Return user ID even if profile fetch fails
        return {
          userId: buffer.user_id,
          profile: {}
        };
      }
    } catch (error) {
      console.error('Error getting user context from buffer:', error);
      return { context: 'error', error: error.message };
    }
  }

  private async getUserContext(senderId: number): Promise<any> {
    try {
      // Try to get user context from user_bucket_mapping or conversations
      const { data: userMapping } = await this.supabase
        .from('user_bucket_mapping')
        .select('user_id, whatsapp_number, user_name')
        .eq('chatwoot_sender_id', senderId)
        .single();

      if (userMapping) {
        // Get additional user context
        const { data: profile } = await this.supabase
          .from('profiles')
          .select('*')
          .eq('id', userMapping.user_id)
          .single();

        return {
          userId: userMapping.user_id,
          whatsappNumber: userMapping.whatsapp_number,
          userName: userMapping.user_name,
          profile: profile || {}
        };
      }

      return { senderId, context: 'limited' };
    } catch (error) {
      console.error('Error getting user context:', error);
      return { senderId, context: 'error' };
    }
  }

  private calculateUrgencyScore(messages: BufferedMessage[], combinedText: string): number {
    let score = 5; // Base score

    // Increase score for multiple messages in quick succession
    if (messages.length > 3) score += 1;
    if (messages.length > 5) score += 1;

    // Check for urgent keywords
    const urgentKeywords = ['urgent', 'emergency', 'help', 'problem', 'issue', 'asap', 'immediately'];
    const lowerText = combinedText.toLowerCase();
    
    for (const keyword of urgentKeywords) {
      if (lowerText.includes(keyword)) {
        score += 2;
        break;
      }
    }

    // Check for question marks (indicates questions needing response)
    const questionCount = (combinedText.match(/\?/g) || []).length;
    score += Math.min(questionCount, 2);

    return Math.min(score, 10);
  }

  private async processWithAI(context: AggregatedContext, firstMessage: BufferedMessage): Promise<ProcessingResult> {
    try {
      console.log(`Processing ${context.messageCount} messages - storing in knowledge base`);
      
      // Store all content in knowledge base
      await this.storeContentInKnowledgeBase(context, firstMessage);
      
      // Always respond with success message
      return {
        shouldRespond: true,
        content: "✅ Entendi! Seu conteúdo foi armazenado na sua base de conhecimento.",
        confidence: 1.0,
        detectedIntent: 'knowledge_storage',
        suggestedActions: ['stored_in_knowledge_base']
      };
      
    } catch (error) {
      console.error('Knowledge base storage error:', error);
      return {
        shouldRespond: true,
        content: "✅ Recebi sua mensagem. Processando em segundo plano.",
        confidence: 0.8,
        detectedIntent: 'fallback_response',
        error: error.message
      };
    }
  }

  /**
   * Store all buffered content in the knowledge base
   */
  private async storeContentInKnowledgeBase(context: AggregatedContext, firstMessage: BufferedMessage): Promise<void> {
    try {
      const userId = context.userContext?.userId;
      if (!userId) {
        console.log('No user ID found, skipping knowledge base storage');
        return;
      }

      console.log(`📚 Storing buffered content for user ${userId}`);

      // Get all buffered messages for individual processing
      const messages = await this.getBufferedMessages(firstMessage.buffer_id);
      
      // Process each message individually for files and audio
      await this.processIndividualMessages(messages, userId);

      // Create combined text summary
      await this.createCombinedTextSummary(context, firstMessage, userId);

    } catch (error) {
      console.error('❌ Error storing content in knowledge base:', error);
      // Don't throw - we want to continue with the success response even if storage fails
    }
  }

  /**
   * Process each message individually to upload files and audio to knowledge base
   */
  private async processIndividualMessages(messages: BufferedMessage[], userId: string): Promise<void> {
    for (const message of messages) {
      try {
        console.log(`🔍 Processing individual message ${message.chatwoot_message_id} of type ${message.message_type}`);
        
        // Handle different message types
        switch (message.message_type) {
          case 'text':
            await this.processTextMessage(message, userId);
            break;
          case 'audio':
            await this.processAudioMessage(message, userId);
            break;
          case 'image':
            await this.processImageMessage(message, userId);
            break;
          case 'file':
            await this.processFileMessage(message, userId);
            break;
          default:
            console.log(`⚠️ Unknown message type: ${message.message_type}`);
        }
        
        // Mark message as processed
        await this.markMessageAsProcessed(message.id);
        
      } catch (error) {
        console.error(`❌ Error processing message ${message.chatwoot_message_id}:`, error);
        // Continue with other messages even if one fails
      }
    }
  }

  /**
   * Process text messages - store meaningful text content
   */
  private async processTextMessage(message: BufferedMessage, userId: string): Promise<void> {
    if (!message.content || message.content.trim().length < 10) {
      console.log(`⚠️ Skipping short text message: ${message.content}`);
      return;
    }

    const timestamp = new Date(message.received_at).toISOString().split('T')[0];
    const fileName = `WhatsApp Text - ${timestamp} - ${message.chatwoot_message_id}.md`;
    
    const formattedContent = `# WhatsApp Text Message

**From:** ${message.sender_info?.name || 'Unknown'}
**Phone:** ${message.sender_info?.phone_number || 'Unknown'}
**Date:** ${new Date(message.received_at).toLocaleString()}
**Message ID:** ${message.chatwoot_message_id}

## Content

${message.content}

---
*Captured from WhatsApp via Pacelane*`;

    await this.storeInKnowledgeBase(userId, fileName, 'file', formattedContent, null, {
      source: 'whatsapp_text',
      message_id: message.chatwoot_message_id,
      conversation_id: message.conversation_info?.id,
      sender_info: message.sender_info
    });
  }

  /**
   * Process audio messages - get transcription and store both
   */
  private async processAudioMessage(message: BufferedMessage, userId: string): Promise<void> {
    console.log(`🎤 Processing audio message ${message.chatwoot_message_id}`);
    console.log(`📊 Audio message details: attachments=${message.attachments?.length || 0}, content="${message.content || 'none'}", messageType="${message.message_type}"`);
    
    try {
      // Check if we have existing transcription and GCS path
      const { data: audioFile } = await this.supabase
        .from('audio_files')
        .select('transcription, gcs_path, file_name')
        .eq('chatwoot_message_id', message.chatwoot_message_id)
        .single();

      if (audioFile && audioFile.transcription) {
        console.log(`✅ Found existing audio transcription for message ${message.chatwoot_message_id}`);
        
        const timestamp = new Date(message.received_at).toISOString().split('T')[0];
        const fileName = audioFile.file_name || `WhatsApp Audio - ${timestamp} - ${message.chatwoot_message_id}.ogg`;
        
        // Store transcription in knowledge base using the existing GCS path
        await this.storeInKnowledgeBase(userId, fileName, 'audio', audioFile.transcription, audioFile.gcs_path, {
          source: 'whatsapp_audio',
          message_id: message.chatwoot_message_id,
          conversation_id: message.conversation_info?.id,
          sender_info: message.sender_info,
          transcription: audioFile.transcription
        });
      } else {
        console.log(`⚠️ No existing transcription found for audio message ${message.chatwoot_message_id}`);
        
        // Try to process audio from attachments if available
        let audioProcessed = false;
        if (message.attachments && message.attachments.length > 0) {
          for (let i = 0; i < message.attachments.length; i++) {
            const attachment = message.attachments[i];
            // More flexible audio detection - check content_type, file_type, or filename
            const contentType = attachment.content_type || attachment.file_type || '';
            const fileName = attachment.file_name || attachment.filename || '';
            
            const isAudio = contentType.startsWith('audio/') || 
                           contentType === 'audio' ||
                           fileName.match(/\.(ogg|mp3|wav|m4a|aac|opus)$/i) ||
                           message.message_type === 'audio';
            
            console.log(`🔍 Audio detection for attachment ${i}: contentType="${contentType}", fileName="${fileName}", messageType="${message.message_type}", isAudio=${isAudio}`);
            
            if (isAudio) {
              await this.processAudioAttachment(attachment, message, userId, i);
              audioProcessed = true;
            }
          }
        }
        
        // If no audio attachments were processed, create a placeholder
        if (!audioProcessed) {
          console.log(`⚠️ No audio attachments were processed, creating placeholder document for message ${message.chatwoot_message_id}`);
          await this.createAudioPlaceholderDocument(message, userId);
        } else {
          console.log(`✅ Successfully processed ${audioProcessed ? 'some' : 'no'} audio attachments for message ${message.chatwoot_message_id}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing audio message ${message.chatwoot_message_id}:`, error);
      // Create placeholder document on error
      await this.createAudioPlaceholderDocument(message, userId);
    }
  }

  /**
   * Process individual audio attachment
   */
  private async processAudioAttachment(attachment: any, message: BufferedMessage, userId: string, index: number): Promise<void> {
    try {
      const fileName = attachment.file_name || attachment.filename || `audio_${message.chatwoot_message_id}_${index}`;
      
      // Try multiple URL fields and fix incomplete URLs
      let audioUrl = attachment.data_url || attachment.file_url || attachment.url;
      
      // Fix incomplete URLs that start with http:///
      if (audioUrl && audioUrl.startsWith('http:///')) {
        const chatwootBaseUrl = Deno.env.get('CHATWOOT_BASE_URL');
        if (chatwootBaseUrl) {
          // Remove the incomplete http:/// and prepend the Chatwoot base URL
          const relativePath = audioUrl.replace('http:///', '');
          audioUrl = `${chatwootBaseUrl}/${relativePath}`;
          console.log(`🔧 Fixed incomplete audio URL: ${audioUrl}`);
        } else {
          console.log(`⚠️ Incomplete audio URL detected but no CHATWOOT_BASE_URL configured: ${audioUrl}`);
          audioUrl = null;
        }
      }
      
      console.log(`🎤 Processing audio attachment: ${fileName}, URL: ${audioUrl || 'Not available'}`);

      if (audioUrl && this.isDownloadableUrl(audioUrl)) {
        console.log(`⬇️ Attempting to download audio from: ${audioUrl}`);
        
        try {
          // Download the audio file
          const audioData = await this.downloadFile(audioUrl);
          if (audioData) {
            // Determine file extension from content type or URL
            const extension = this.getAudioExtension(attachment.content_type, audioUrl, fileName);
            const finalFileName = fileName.includes('.') ? fileName : `${fileName}.${extension}`;
            
            // Create a File object for upload
            const file = new File([audioData], finalFileName, { 
              type: attachment.content_type || 'audio/ogg' 
            });
            
            // Upload to knowledge base storage
            await this.uploadFileToKnowledgeBase(userId, file, {
              source: 'whatsapp_audio_attachment',
              message_id: message.chatwoot_message_id,
              conversation_id: message.conversation_info?.id,
              sender_info: message.sender_info,
              original_url: audioUrl,
              attachment_index: index,
              needs_transcription: true
            });
            
            console.log(`✅ Successfully processed and uploaded audio: ${finalFileName}`);
          }
        } catch (downloadError) {
          console.error(`❌ Failed to download audio ${fileName}:`, downloadError);
          // Fall back to creating metadata document
          await this.createAudioMetadataDocument(attachment, message, userId, index);
        }
      } else {
        console.log(`⚠️ Audio URL not accessible for ${fileName}, creating metadata document`);
        // Create metadata document when audio can't be downloaded
        await this.createAudioMetadataDocument(attachment, message, userId, index);
      }
    } catch (error) {
      console.error(`❌ Error processing audio attachment:`, error);
    }
  }

  /**
   * Get audio file extension from content type or URL
   */
  private getAudioExtension(contentType?: string, url?: string, fileName?: string): string {
    // Try to get extension from filename first
    if (fileName && fileName.includes('.')) {
      const ext = fileName.split('.').pop()?.toLowerCase();
      if (ext && ['ogg', 'mp3', 'wav', 'm4a', 'aac', 'opus'].includes(ext)) {
        return ext;
      }
    }

    // Try to get from content type
    if (contentType) {
      const typeMap: { [key: string]: string } = {
        'audio/ogg': 'ogg',
        'audio/mpeg': 'mp3',
        'audio/mp3': 'mp3',
        'audio/wav': 'wav',
        'audio/x-wav': 'wav',
        'audio/mp4': 'm4a',
        'audio/aac': 'aac',
        'audio/opus': 'opus'
      };
      return typeMap[contentType.toLowerCase()] || 'ogg';
    }

    // Try to get from URL
    if (url) {
      const urlExt = url.split('.').pop()?.toLowerCase();
      if (urlExt && ['ogg', 'mp3', 'wav', 'm4a', 'aac', 'opus'].includes(urlExt)) {
        return urlExt;
      }
    }

    // Default to ogg (common for WhatsApp)
    return 'ogg';
  }

  /**
   * Create metadata document for audio that couldn't be downloaded
   */
  private async createAudioMetadataDocument(attachment: any, message: BufferedMessage, userId: string, index: number): Promise<void> {
    const timestamp = new Date(message.received_at).toISOString().split('T')[0];
    const fileName = `WhatsApp Audio Metadata - ${timestamp} - ${message.chatwoot_message_id}_${index}.md`;
    
    const content = `# WhatsApp Audio Metadata

**From:** ${message.sender_info?.name || 'Unknown'}
**Phone:** ${message.sender_info?.phone_number || 'Unknown'}
**Date:** ${new Date(message.received_at).toLocaleString()}
**Message ID:** ${message.chatwoot_message_id}

## Audio Information

**Filename:** ${attachment.file_name || attachment.filename || 'Unknown'}
**Type:** ${attachment.content_type || 'audio'}
**Size:** ${attachment.file_size || 'Unknown'}
**URL:** ${attachment.data_url || attachment.file_url || 'Not available'}

## Note
This audio file could not be downloaded automatically. The metadata has been preserved for reference.
Audio transcription may be available separately if the file was processed through other means.

---
*Captured from WhatsApp via Pacelane*`;

    await this.storeInKnowledgeBase(userId, fileName, 'file', content, null, {
      source: 'whatsapp_audio_metadata',
      message_id: message.chatwoot_message_id,
      conversation_id: message.conversation_info?.id,
      sender_info: message.sender_info,
      attachment: attachment,
      attachment_index: index
    });
  }

  /**
   * Create placeholder document for audio without transcription
   */
  private async createAudioPlaceholderDocument(message: BufferedMessage, userId: string): Promise<void> {
    console.log(`📝 Creating audio placeholder document for message ${message.chatwoot_message_id}, user: ${userId}`);
    const timestamp = new Date(message.received_at).toISOString().split('T')[0];
    const fileName = `WhatsApp Audio - ${timestamp} - ${message.chatwoot_message_id}.md`;
    
    const placeholderContent = `# WhatsApp Audio Message

**From:** ${message.sender_info?.name || 'Unknown'}
**Phone:** ${message.sender_info?.phone_number || 'Unknown'}
**Date:** ${new Date(message.received_at).toLocaleString()}
**Message ID:** ${message.chatwoot_message_id}

## Status
Audio message received but transcription is pending or failed.
The audio file may have been processed separately.

## Attachments
${message.attachments && message.attachments.length > 0 ? 
  message.attachments.map((att, i) => `- File ${i + 1}: ${att.file_name || att.filename || 'Unknown'} (${att.content_type || 'Unknown type'})`).join('\n')
  : 'No attachment information available'
}

---
*Captured from WhatsApp via Pacelane*`;

    await this.storeInKnowledgeBase(userId, fileName, 'file', placeholderContent, null, {
      source: 'whatsapp_audio_placeholder',
      message_id: message.chatwoot_message_id,
      conversation_id: message.conversation_info?.id,
      sender_info: message.sender_info,
      attachments: message.attachments
    });
  }

  /**
   * Process image messages - store image information and any captions
   */
  private async processImageMessage(message: BufferedMessage, userId: string): Promise<void> {
    console.log(`🖼️ Processing image message ${message.chatwoot_message_id}`);
    
    // Process each image attachment individually
    if (message.attachments && message.attachments.length > 0) {
      for (let i = 0; i < message.attachments.length; i++) {
        const attachment = message.attachments[i];
        await this.processImageAttachment(attachment, message, userId, i);
      }
    }

    // Also create a summary document
    await this.createImageSummaryDocument(message, userId);
  }

  /**
   * Process individual image attachment
   */
  private async processImageAttachment(attachment: any, message: BufferedMessage, userId: string, index: number): Promise<void> {
    try {
      const fileName = attachment.file_name || attachment.filename || `image_${message.chatwoot_message_id}_${index}`;
      
      // Try multiple URL fields and fix incomplete URLs
      let imageUrl = attachment.data_url || attachment.file_url || attachment.url;
      
      // Fix incomplete URLs that start with http:///
      if (imageUrl && imageUrl.startsWith('http:///')) {
        const chatwootBaseUrl = Deno.env.get('CHATWOOT_BASE_URL');
        if (chatwootBaseUrl) {
          // Remove the incomplete http:/// and prepend the Chatwoot base URL
          const relativePath = imageUrl.replace('http:///', '');
          imageUrl = `${chatwootBaseUrl}/${relativePath}`;
          console.log(`🔧 Fixed incomplete URL: ${imageUrl}`);
        } else {
          console.log(`⚠️ Incomplete URL detected but no CHATWOOT_BASE_URL configured: ${imageUrl}`);
          imageUrl = null;
        }
      }
      
      console.log(`🖼️ Processing image attachment: ${fileName}, URL: ${imageUrl || 'Not available'}`);
      console.log(`🔍 Full attachment data:`, JSON.stringify(attachment, null, 2));

      if (imageUrl && this.isDownloadableUrl(imageUrl)) {
        console.log(`⬇️ Attempting to download image from: ${imageUrl}`);
        
        try {
          // Download the image
          const imageData = await this.downloadFile(imageUrl);
          if (imageData) {
            // Determine file extension from content type or URL
            const extension = this.getImageExtension(attachment.content_type, imageUrl, fileName);
            const finalFileName = fileName.includes('.') ? fileName : `${fileName}.${extension}`;
            
            // Create a File object for upload
            const file = new File([imageData], finalFileName, { 
              type: attachment.content_type || 'image/jpeg' 
            });
            
            // Upload to knowledge base storage
            await this.uploadFileToKnowledgeBase(userId, file, {
              source: 'whatsapp_image_attachment',
              message_id: message.chatwoot_message_id,
              conversation_id: message.conversation_info?.id,
              sender_info: message.sender_info,
              original_url: imageUrl,
              attachment_index: index,
              caption: message.content
            });
            
            console.log(`✅ Successfully processed and uploaded image: ${finalFileName}`);
          }
        } catch (downloadError) {
          console.error(`❌ Failed to download image ${fileName}:`, downloadError);
          // Fall back to creating metadata document
          await this.createImageMetadataDocument(attachment, message, userId, index);
        }
      } else {
        console.log(`⚠️ Image URL not accessible for ${fileName}, creating metadata document`);
        // Create metadata document when image can't be downloaded
        await this.createImageMetadataDocument(attachment, message, userId, index);
      }
    } catch (error) {
      console.error(`❌ Error processing image attachment:`, error);
    }
  }

  /**
   * Get image file extension from content type or URL
   */
  private getImageExtension(contentType?: string, url?: string, fileName?: string): string {
    // Try to get extension from filename first
    if (fileName && fileName.includes('.')) {
      const ext = fileName.split('.').pop()?.toLowerCase();
      if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
        return ext;
      }
    }

    // Try to get from content type
    if (contentType) {
      const typeMap: { [key: string]: string } = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/bmp': 'bmp'
      };
      return typeMap[contentType.toLowerCase()] || 'jpg';
    }

    // Try to get from URL
    if (url) {
      const urlExt = url.split('.').pop()?.toLowerCase();
      if (urlExt && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(urlExt)) {
        return urlExt;
      }
    }

    // Default to jpg
    return 'jpg';
  }

  /**
   * Create metadata document for images that couldn't be downloaded
   */
  private async createImageMetadataDocument(attachment: any, message: BufferedMessage, userId: string, index: number): Promise<void> {
    const timestamp = new Date(message.received_at).toISOString().split('T')[0];
    const fileName = `WhatsApp Image Metadata - ${timestamp} - ${message.chatwoot_message_id}_${index}.md`;
    
    const content = `# WhatsApp Image Metadata

**From:** ${message.sender_info?.name || 'Unknown'}
**Phone:** ${message.sender_info?.phone_number || 'Unknown'}
**Date:** ${new Date(message.received_at).toLocaleString()}
**Message ID:** ${message.chatwoot_message_id}

## Image Information

**Filename:** ${attachment.file_name || attachment.filename || 'Unknown'}
**Type:** ${attachment.content_type || 'image'}
**Size:** ${attachment.file_size || 'Unknown'}
**URL:** ${attachment.data_url || attachment.file_url || 'Not available'}

${message.content ? `**Caption:** ${message.content}` : ''}

## Note
This image could not be downloaded automatically. The metadata has been preserved for reference.

---
*Captured from WhatsApp via Pacelane*`;

    await this.storeInKnowledgeBase(userId, fileName, 'file', content, null, {
      source: 'whatsapp_image_metadata',
      message_id: message.chatwoot_message_id,
      conversation_id: message.conversation_info?.id,
      sender_info: message.sender_info,
      attachment: attachment,
      attachment_index: index
    });
  }

  /**
   * Create summary document for image messages
   */
  private async createImageSummaryDocument(message: BufferedMessage, userId: string): Promise<void> {
    const timestamp = new Date(message.received_at).toISOString().split('T')[0];
    const fileName = `WhatsApp Image Summary - ${timestamp} - ${message.chatwoot_message_id}.md`;
    
    let content = `# WhatsApp Image Message Summary

**From:** ${message.sender_info?.name || 'Unknown'}
**Phone:** ${message.sender_info?.phone_number || 'Unknown'}
**Date:** ${new Date(message.received_at).toLocaleString()}
**Message ID:** ${message.chatwoot_message_id}

## Message Summary
`;

    // Add caption if present
    if (message.content && message.content.trim()) {
      content += `\n**Caption:** ${message.content}\n`;
    }

    // Add attachment information
    if (message.attachments && message.attachments.length > 0) {
      content += `\n## Images (${message.attachments.length})\n`;
      message.attachments.forEach((attachment, index) => {
        content += `\n**Image ${index + 1}:**\n`;
        content += `- Filename: ${attachment.file_name || attachment.filename || 'Unknown'}\n`;
        content += `- Type: ${attachment.content_type || 'image'}\n`;
        content += `- Size: ${attachment.file_size || 'Unknown'}\n`;
      });
    }

    content += `\n---\n*Captured from WhatsApp via Pacelane*`;

    await this.storeInKnowledgeBase(userId, fileName, 'file', content, null, {
      source: 'whatsapp_image_summary',
      message_id: message.chatwoot_message_id,
      conversation_id: message.conversation_info?.id,
      sender_info: message.sender_info,
      attachments: message.attachments
    });
  }

  /**
   * Process file messages - store file information and download if possible
   */
  private async processFileMessage(message: BufferedMessage, userId: string): Promise<void> {
    console.log(`📎 Processing file message ${message.chatwoot_message_id}`);
    
    const timestamp = new Date(message.received_at).toISOString().split('T')[0];
    
    // Process each attachment individually
    if (message.attachments && message.attachments.length > 0) {
      for (let i = 0; i < message.attachments.length; i++) {
        const attachment = message.attachments[i];
        await this.processFileAttachment(attachment, message, userId, i);
      }
    }

    // Also create a summary document
    await this.createFileSummaryDocument(message, userId);
  }

  /**
   * Process individual file attachment
   */
  private async processFileAttachment(attachment: any, message: BufferedMessage, userId: string, index: number): Promise<void> {
    try {
      const fileName = attachment.file_name || attachment.filename || `file_${message.chatwoot_message_id}_${index}`;
      
      // Try multiple URL fields and fix incomplete URLs
      let fileUrl = attachment.data_url || attachment.file_url || attachment.url;
      
      // Fix incomplete URLs that start with http:///
      if (fileUrl && fileUrl.startsWith('http:///')) {
        const chatwootBaseUrl = Deno.env.get('CHATWOOT_BASE_URL');
        if (chatwootBaseUrl) {
          // Remove the incomplete http:/// and prepend the Chatwoot base URL
          const relativePath = fileUrl.replace('http:///', '');
          fileUrl = `${chatwootBaseUrl}/${relativePath}`;
          console.log(`🔧 Fixed incomplete file URL: ${fileUrl}`);
        } else {
          console.log(`⚠️ Incomplete file URL detected but no CHATWOOT_BASE_URL configured: ${fileUrl}`);
          fileUrl = null;
        }
      }
      
      console.log(`📁 Processing file attachment: ${fileName}, URL: ${fileUrl || 'Not available'}`);

      if (fileUrl && this.isDownloadableUrl(fileUrl)) {
        console.log(`⬇️ Attempting to download file from: ${fileUrl}`);
        
        try {
          // Download the file
          const fileData = await this.downloadFile(fileUrl);
          if (fileData) {
            // Create a File object for upload
            const file = new File([fileData], fileName, { 
              type: attachment.content_type || 'application/octet-stream' 
            });
            
            // Upload to knowledge base storage
            await this.uploadFileToKnowledgeBase(userId, file, {
              source: 'whatsapp_file_attachment',
              message_id: message.chatwoot_message_id,
              conversation_id: message.conversation_info?.id,
              sender_info: message.sender_info,
              original_url: fileUrl,
              attachment_index: index
            });
            
            console.log(`✅ Successfully processed and uploaded file: ${fileName}`);
          }
        } catch (downloadError) {
          console.error(`❌ Failed to download file ${fileName}:`, downloadError);
          // Fall back to creating metadata document
          await this.createFileMetadataDocument(attachment, message, userId, index);
        }
      } else {
        console.log(`⚠️ File URL not accessible for ${fileName}, creating metadata document`);
        // Create metadata document when file can't be downloaded
        await this.createFileMetadataDocument(attachment, message, userId, index);
      }
    } catch (error) {
      console.error(`❌ Error processing file attachment:`, error);
    }
  }

  /**
   * Download file from URL
   */
  private async downloadFile(url: string): Promise<Uint8Array | null> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Pacelane-WhatsApp-Bot/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error(`Error downloading file from ${url}:`, error);
      return null;
    }
  }

  /**
   * Check if URL is downloadable
   */
  private isDownloadableUrl(url: string): boolean {
    if (!url) return false;
    
    try {
      const parsedUrl = new URL(url);
      // Allow both HTTP and HTTPS URLs for Chatwoot integration
      return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:';
    } catch {
      return false;
    }
  }

  /**
   * Upload file to knowledge base storage
   */
  private async uploadFileToKnowledgeBase(userId: string, file: File, metadata: any): Promise<void> {
    try {
      console.log(`🔄 Starting upload for file: ${file.name}, size: ${file.size} bytes`);
      
      // Convert File to base64 for the API call - proper binary encoding
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert binary data to base64 properly
      // Use btoa with proper binary string conversion for binary files
      let binaryString = '';
      let base64Content = '';
      const chunkSize = 8192; // Larger chunks for better performance
      
      try {
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.subarray(i, i + chunkSize);
          // Convert each byte to its character representation
          const chunkString = Array.from(chunk, byte => String.fromCharCode(byte)).join('');
          binaryString += chunkString;
        }
        
        // Now encode the complete binary string to base64
        base64Content = btoa(binaryString);
        
        console.log(`📊 Encoded ${uint8Array.length} bytes to ${base64Content.length} base64 characters`);
      } catch (encodeError) {
        console.error(`❌ Failed to encode file ${file.name} to base64:`, encodeError);
        throw new Error(`Base64 encoding failed: ${encodeError.message}`);
      }

      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/knowledge-base-storage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          userId: userId,
          action: 'upload',
          file: {
            name: file.name,
            type: file.type,
            content: base64Content
          },
          metadata: metadata
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ File uploaded to knowledge base: ${file.name}`);
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to upload file ${file.name}: ${response.status} - ${errorText}`);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error(`❌ Error uploading file ${file.name}:`, error);
      throw error; // Re-throw to be handled by caller
    }
  }

  /**
   * Create metadata document for files that couldn't be downloaded
   */
  private async createFileMetadataDocument(attachment: any, message: BufferedMessage, userId: string, index: number): Promise<void> {
    const timestamp = new Date(message.received_at).toISOString().split('T')[0];
    const fileName = `WhatsApp File Metadata - ${timestamp} - ${message.chatwoot_message_id}_${index}.md`;
    
    const content = `# WhatsApp File Metadata

**From:** ${message.sender_info?.name || 'Unknown'}
**Phone:** ${message.sender_info?.phone_number || 'Unknown'}
**Date:** ${new Date(message.received_at).toLocaleString()}
**Message ID:** ${message.chatwoot_message_id}

## File Information

**Filename:** ${attachment.file_name || attachment.filename || 'Unknown'}
**Type:** ${attachment.content_type || 'Unknown'}
**Size:** ${attachment.file_size || 'Unknown'}
**URL:** ${attachment.data_url || attachment.file_url || 'Not available'}

${message.content ? `**Caption:** ${message.content}` : ''}

## Note
This file could not be downloaded automatically. The metadata has been preserved for reference.

---
*Captured from WhatsApp via Pacelane*`;

    await this.storeInKnowledgeBase(userId, fileName, 'file', content, null, {
      source: 'whatsapp_file_metadata',
      message_id: message.chatwoot_message_id,
      conversation_id: message.conversation_info?.id,
      sender_info: message.sender_info,
      attachment: attachment,
      attachment_index: index
    });
  }

  /**
   * Create summary document for file messages
   */
  private async createFileSummaryDocument(message: BufferedMessage, userId: string): Promise<void> {
    const timestamp = new Date(message.received_at).toISOString().split('T')[0];
    const fileName = `WhatsApp File Summary - ${timestamp} - ${message.chatwoot_message_id}.md`;
    
    let content = `# WhatsApp File Message Summary

**From:** ${message.sender_info?.name || 'Unknown'}
**Phone:** ${message.sender_info?.phone_number || 'Unknown'}
**Date:** ${new Date(message.received_at).toLocaleString()}
**Message ID:** ${message.chatwoot_message_id}

## Message Summary
`;

    // Add caption if present
    if (message.content && message.content.trim()) {
      content += `\n**Caption:** ${message.content}\n`;
    }

    // Add attachment information
    if (message.attachments && message.attachments.length > 0) {
      content += `\n## Files (${message.attachments.length})\n`;
      message.attachments.forEach((attachment, index) => {
        content += `\n**File ${index + 1}:**\n`;
        content += `- Filename: ${attachment.file_name || attachment.filename || 'Unknown'}\n`;
        content += `- Type: ${attachment.content_type || 'file'}\n`;
        content += `- Size: ${attachment.file_size || 'Unknown'}\n`;
      });
    }

    content += `\n---\n*Captured from WhatsApp via Pacelane*`;

    await this.storeInKnowledgeBase(userId, fileName, 'file', content, null, {
      source: 'whatsapp_file_summary',
      message_id: message.chatwoot_message_id,
      conversation_id: message.conversation_info?.id,
      sender_info: message.sender_info,
      attachments: message.attachments
    });
  }

  /**
   * Create a combined text summary of all messages in the buffer
   */
  private async createCombinedTextSummary(context: AggregatedContext, firstMessage: BufferedMessage, userId: string): Promise<void> {
    // Combine all text content
    let combinedContent = '';
    if (context.combinedText) {
      combinedContent += context.combinedText;
    }
    
    // Add audio transcriptions
    if (context.audioTranscripts.length > 0) {
      if (combinedContent) combinedContent += '\n\n';
      combinedContent += '--- Audio Transcriptions ---\n';
      combinedContent += context.audioTranscripts.join('\n\n');
    }

    // Add attachment information
    if (context.attachments.length > 0) {
      if (combinedContent) combinedContent += '\n\n';
      combinedContent += '--- Attachments ---\n';
      context.attachments.forEach(att => {
        combinedContent += `File: ${att.filename || 'unnamed'} (${att.type})\n`;
        if (att.transcription) {
          combinedContent += `Transcription: ${att.transcription}\n`;
        }
      });
    }

    if (!combinedContent.trim()) {
      console.log('No meaningful content to store in combined summary');
      return;
    }

    // Create descriptive filename
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `WhatsApp Conversation - ${timestamp} - ${context.messageCount} messages.md`;

    // Format content as markdown
    const formattedContent = `# WhatsApp Conversation Summary - ${new Date().toLocaleDateString()}

**Messages Count:** ${context.messageCount}
**Time Span:** ${Math.round(context.timeSpan / 1000)} seconds
**Processed:** ${new Date().toLocaleString()}
**Conversation ID:** ${firstMessage.conversation_info?.id}

## Content

${combinedContent}

---
*Processed by Pacelane Buffer System*`;

    await this.storeInKnowledgeBase(userId, fileName, 'file', formattedContent, null, {
      source: 'whatsapp_buffer_summary',
      message_count: context.messageCount,
      time_span_seconds: Math.round(context.timeSpan / 1000),
      conversation_id: firstMessage.conversation_info?.id,
      processed_at: new Date().toISOString()
    });
  }

  /**
   * Helper method to store content in knowledge base
   */
  private async storeInKnowledgeBase(
    userId: string, 
    fileName: string, 
    fileType: string, 
    content: string, 
    gcsPath: string | null, 
    metadata: any
  ): Promise<void> {
    try {
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/knowledge-base-storage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          userId: userId,
          action: 'whatsapp_content',
          file_name: fileName,
          file_type: fileType,
          content: content,
          gcs_path: gcsPath,
          metadata: metadata
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Stored in knowledge base: ${fileName}`);
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to store ${fileName} in knowledge base: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error(`❌ Error storing ${fileName} in knowledge base:`, error);
    }
  }

  /**
   * Mark a buffered message as processed
   */
  private async markMessageAsProcessed(messageId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('buffered_messages')
        .update({ processed: true })
        .eq('id', messageId);

      if (error) {
        console.error(`❌ Error marking message ${messageId} as processed:`, error);
      }
    } catch (error) {
      console.error(`❌ Error marking message ${messageId} as processed:`, error);
    }
  }


  private async sendResponse(conversationInfo: any, content: string, senderInfo: any): Promise<any> {
    try {
      const chatwootApiUrl = Deno.env.get('CHATWOOT_BASE_URL');
      const chatwootApiToken = Deno.env.get('CHATWOOT_API_ACCESS_TOKEN'); // Fixed: use same env var as original webhook
      const chatwootAccountId = Deno.env.get('CHATWOOT_ACCOUNT_ID');

      if (!chatwootApiUrl || !chatwootApiToken || !chatwootAccountId) {
        throw new Error('Chatwoot API configuration missing');
      }

      const response = await fetch(
        `${chatwootApiUrl}/api/v1/accounts/${chatwootAccountId}/conversations/${conversationInfo.id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api_access_token': chatwootApiToken
          },
          body: JSON.stringify({
            content: content,
            message_type: 'outgoing'
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Chatwoot API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`Sent response to conversation ${conversationInfo.id}`);
      
      return { success: true, messageId: result.id };
      
    } catch (error) {
      console.error('Error sending response:', error);
      return { success: false, error: error.message };
    }
  }

  private async updateBufferStatus(bufferId: string, status: string): Promise<void> {
    const { error } = await this.supabase
      .from('message_buffer')
      .update({ status })
      .eq('id', bufferId);

    if (error) {
      throw new Error(`Error updating buffer status: ${error.message}`);
    }
  }

  private async updateJobStatus(bufferId: string, status: string): Promise<void> {
    const { error } = await this.supabase
      .from('buffer_processing_jobs')
      .update({ 
        status,
        processed_at: status === 'completed' ? new Date().toISOString() : null
      })
      .eq('buffer_id', bufferId)
      .eq('status', status === 'running' ? 'scheduled' : 'running');

    if (error) {
      console.error(`Error updating job status: ${error.message}`);
    }
  }

  private async completeBuffer(bufferId: string, responded: boolean, content?: string): Promise<void> {
    const now = new Date().toISOString();
    
    // Update buffer
    const { error: bufferError } = await this.supabase
      .from('message_buffer')
      .update({
        status: 'completed',
        processed_at: now,
        buffer_end_time: now
      })
      .eq('id', bufferId);

    if (bufferError) {
      console.error(`Error completing buffer: ${bufferError.message}`);
    }

    // Update job
    const { error: jobError } = await this.supabase
      .from('buffer_processing_jobs')
      .update({
        status: 'completed',
        processed_at: now
      })
      .eq('buffer_id', bufferId);

    if (jobError) {
      console.error(`Error completing job: ${jobError.message}`);
    }

    // Update conversation state
    const { error: convError } = await this.supabase
      .from('conversations')
      .update({
        conversation_state: 'idle',
        active_buffer_id: null
      })
      .eq('active_buffer_id', bufferId);

    if (convError) {
      console.error(`Error updating conversation state: ${convError.message}`);
    }
  }

  private async handleBufferError(bufferId: string, error: any): Promise<void> {
    const { error: updateError } = await this.supabase
      .from('buffer_processing_jobs')
      .update({
        status: 'failed',
        attempts: this.supabase.raw('attempts + 1'),
        error_message: error.message,
        processed_at: new Date().toISOString()
      })
      .eq('buffer_id', bufferId)
      .in('status', ['scheduled', 'running']);

    if (updateError) {
      console.error(`Error updating failed job: ${updateError.message}`);
    }

    // Update buffer status
    await this.updateBufferStatus(bufferId, 'completed');
  }

  private async getBufferedMessages(bufferId: string): Promise<BufferedMessage[]> {
    const { data, error } = await this.supabase
      .from('buffered_messages')
      .select('*')
      .eq('buffer_id', bufferId)
      .eq('processed', false)
      .order('received_at', { ascending: true });

    if (error) {
      throw new Error(`Error getting buffered messages: ${error.message}`);
    }

    return data || [];
  }
}

// Main handler
serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const processor = new BufferProcessor(supabase);
    const url = new URL(req.url);
    
    // Health check
    if (url.pathname.includes('/health') || req.method === 'GET') {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'buffer-processor'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process scheduled buffers
    const results = await processor.processScheduledBuffers();

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        ...results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Buffer processor error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
