/**
 * Transcript Service
 * Handles parsing, validation, and processing of meeting transcripts from various tools
 */

export interface TranscriptData {
  title: string;
  transcript: string;
  source: string;
  participants?: string[];
  duration?: number;
  detectedFormat?: TranscriptFormat;
}

export interface TranscriptFormat {
  tool: string;
  pattern: RegExp;
  speakerPattern: RegExp;
  timestampPattern?: RegExp;
  confidence: number;
}

export interface ParsedTranscript {
  originalText: string;
  cleanedText: string;
  participants: string[];
  segments: TranscriptSegment[];
  detectedFormat: TranscriptFormat | null;
  metadata: {
    wordCount: number;
    estimatedDuration: number;
    participantCount: number;
    hasTimestamps: boolean;
  };
}

export interface TranscriptSegment {
  speaker: string;
  text: string;
  timestamp?: string;
  startTime?: number; // in seconds
}

// Known transcript formats from various tools
const TRANSCRIPT_FORMATS: TranscriptFormat[] = [
  {
    tool: 'Fireflies.ai',
    pattern: /^[A-Za-z\s]+:\s+.+$/gm,
    speakerPattern: /^([A-Za-z\s]+):\s+(.+)$/,
    confidence: 0.9
  },
  {
    tool: 'Fathom',
    pattern: /^\[[\d:]+\]\s+[A-Za-z\s]+:\s+.+$/gm,
    speakerPattern: /^\[([\d:]+)\]\s+([A-Za-z\s]+):\s+(.+)$/,
    timestampPattern: /^\[([\d:]+)\]/,
    confidence: 0.95
  },
  {
    tool: 'Otter.ai',
    pattern: /^[A-Za-z\s]+\s+\([\d:]+\):\s+.+$/gm,
    speakerPattern: /^([A-Za-z\s]+)\s+\(([\d:]+)\):\s+(.+)$/,
    timestampPattern: /\(([\d:]+)\)/,
    confidence: 0.9
  },
  {
    tool: 'Zoom',
    pattern: /^[A-Za-z\s]+:\s+.+$/gm,
    speakerPattern: /^([A-Za-z\s]+):\s+(.+)$/,
    confidence: 0.8
  },
  {
    tool: 'Microsoft Teams',
    pattern: /^[\d:]+\s+[A-Za-z\s]+:\s+.+$/gm,
    speakerPattern: /^([\d:]+)\s+([A-Za-z\s]+):\s+(.+)$/,
    timestampPattern: /^([\d:]+)/,
    confidence: 0.85
  },
  {
    tool: 'Google Meet',
    pattern: /^[A-Za-z\s]+\s+[\d:]+\s+.+$/gm,
    speakerPattern: /^([A-Za-z\s]+)\s+([\d:]+)\s+(.+)$/,
    timestampPattern: /([\d:]+)/,
    confidence: 0.8
  },
  {
    tool: 'Generic',
    pattern: /^.+:\s+.+$/gm,
    speakerPattern: /^([^:]+):\s+(.+)$/,
    confidence: 0.6
  }
];

export class TranscriptService {
  /**
   * Validate transcript content
   */
  static validateTranscript(transcript: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!transcript || !transcript.trim()) {
      errors.push('Transcript cannot be empty');
      return { isValid: false, errors };
    }

    const trimmed = transcript.trim();

    if (trimmed.length < 100) {
      errors.push('Transcript is too short. Please provide at least 100 characters of meeting content.');
    }

    if (trimmed.length > 50000) {
      errors.push('Transcript is too long. Please provide a transcript under 50,000 characters.');
    }

    // Check if it looks like a transcript (has some speaker indicators)
    const hasSpeakerPatterns = TRANSCRIPT_FORMATS.some(format => 
      format.pattern.test(trimmed)
    );

    if (!hasSpeakerPatterns) {
      errors.push('This doesn\'t appear to be a meeting transcript. Please ensure it includes speaker names and dialogue.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Detect transcript format from content
   */
  static detectFormat(transcript: string): TranscriptFormat | null {
    let bestMatch: TranscriptFormat | null = null;
    let bestScore = 0;

    for (const format of TRANSCRIPT_FORMATS) {
      const matches = transcript.match(format.pattern);
      if (matches) {
        const score = (matches.length / transcript.split('\n').length) * format.confidence;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = format;
        }
      }
    }

    return bestScore > 0.3 ? bestMatch : null;
  }

  /**
   * Parse transcript into structured format
   */
  static parseTranscript(transcript: string): ParsedTranscript {
    const detectedFormat = this.detectFormat(transcript);
    const segments: TranscriptSegment[] = [];
    const participants = new Set<string>();

    if (detectedFormat) {
      const lines = transcript.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        const match = trimmedLine.match(detectedFormat.speakerPattern);
        if (match) {
          let speaker: string;
          let text: string;
          let timestamp: string | undefined;

          if (detectedFormat.tool === 'Fathom') {
            timestamp = match[1];
            speaker = match[2].trim();
            text = match[3].trim();
          } else if (detectedFormat.tool === 'Otter.ai') {
            speaker = match[1].trim();
            timestamp = match[2];
            text = match[3].trim();
          } else if (detectedFormat.tool === 'Microsoft Teams') {
            timestamp = match[1];
            speaker = match[2].trim();
            text = match[3].trim();
          } else if (detectedFormat.tool === 'Google Meet') {
            speaker = match[1].trim();
            timestamp = match[2];
            text = match[3].trim();
          } else {
            // Generic or simple formats
            speaker = match[1].trim();
            text = match[2].trim();
          }

          // Clean up speaker name
          speaker = this.cleanSpeakerName(speaker);
          participants.add(speaker);

          segments.push({
            speaker,
            text,
            timestamp,
            startTime: timestamp ? this.parseTimestamp(timestamp) : undefined
          });
        }
      }
    }

    // Create cleaned text without speaker labels for content generation
    const cleanedText = segments.map(segment => segment.text).join('\n\n');

    // Calculate metadata
    const wordCount = cleanedText.split(/\s+/).length;
    const estimatedDuration = Math.ceil(wordCount / 150 * 60); // ~150 words per minute
    const hasTimestamps = segments.some(segment => segment.timestamp);

    return {
      originalText: transcript,
      cleanedText,
      participants: Array.from(participants),
      segments,
      detectedFormat,
      metadata: {
        wordCount,
        estimatedDuration,
        participantCount: participants.size,
        hasTimestamps
      }
    };
  }

  /**
   * Clean speaker names (remove extra whitespace, normalize format)
   */
  private static cleanSpeakerName(speaker: string): string {
    return speaker
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.)\s*/i, '')
      .replace(/\s+(Host|Guest|Participant)$/i, '');
  }

  /**
   * Parse timestamp string to seconds
   */
  private static parseTimestamp(timestamp: string): number | undefined {
    const timeMatch = timestamp.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const seconds = parseInt(timeMatch[3] || '0', 10);
      
      // If hours > 23, assume it's minutes:seconds format
      if (hours > 23) {
        return hours * 60 + minutes;
      } else {
        return hours * 3600 + minutes * 60 + seconds;
      }
    }
    return undefined;
  }

  /**
   * Generate content creation prompt from transcript
   */
  static generateContentPrompt(parsedTranscript: ParsedTranscript, title?: string): string {
    const { cleanedText, participants, metadata } = parsedTranscript;
    
    const prompt = `Create engaging social media content based on this meeting transcript:

Meeting: ${title || 'Team Meeting'}
Participants: ${participants.join(', ')}
Duration: ~${Math.floor(metadata.estimatedDuration / 60)} minutes
Word Count: ${metadata.wordCount.toLocaleString()} words

Key Discussion Points:
${cleanedText}

Please create content that:
- Highlights the most important insights and decisions
- Makes complex topics accessible to a broader audience  
- Maintains a professional yet engaging tone
- Includes relevant hashtags and calls-to-action
- Respects confidentiality (avoid sensitive details)`;

    return prompt;
  }

  /**
   * Extract key topics and themes from transcript
   */
  static extractKeyTopics(parsedTranscript: ParsedTranscript): string[] {
    const { cleanedText } = parsedTranscript;
    const topics = new Set<string>();

    // Simple keyword extraction (in a real implementation, you might use NLP)
    const commonBusinessTerms = [
      'strategy', 'goals', 'objectives', 'timeline', 'budget', 'revenue',
      'growth', 'market', 'customer', 'product', 'feature', 'launch',
      'team', 'hiring', 'performance', 'metrics', 'analytics', 'data',
      'project', 'milestone', 'deadline', 'priority', 'roadmap', 'vision'
    ];

    const words = cleanedText.toLowerCase().split(/\s+/);
    
    for (const term of commonBusinessTerms) {
      if (words.some(word => word.includes(term))) {
        topics.add(term.charAt(0).toUpperCase() + term.slice(1));
      }
    }

    return Array.from(topics).slice(0, 8); // Return top 8 topics
  }

  /**
   * Format transcript for knowledge base storage
   */
  static formatForKnowledgeBase(transcriptData: TranscriptData, parsedTranscript: ParsedTranscript): string {
    const { title, source } = transcriptData;
    const { participants, metadata, detectedFormat } = parsedTranscript;

    const formattedContent = `# ${title}

**Source:** ${source === 'manual_paste' ? 'Manual Upload' : source}
**Format:** ${detectedFormat?.tool || 'Unknown'}
**Participants:** ${participants.join(', ')}
**Duration:** ~${Math.floor(metadata.estimatedDuration / 60)} minutes
**Word Count:** ${metadata.wordCount.toLocaleString()} words

## Meeting Content

${parsedTranscript.cleanedText}

## Key Topics
${this.extractKeyTopics(parsedTranscript).map(topic => `- ${topic}`).join('\n')}

---
*This transcript was processed and formatted for content creation purposes.*`;

    return formattedContent;
  }
}

export default TranscriptService;
