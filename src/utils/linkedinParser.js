/**
 * LinkedIn URL Parsing Utilities
 * 
 * Handles auto-detection and parsing of LinkedIn URLs to extract usernames/handles.
 * Supports both full URLs and plain usernames.
 */

/**
 * Detects if the input looks like a LinkedIn URL
 * @param {string} input - The user input to check
 * @returns {boolean} - True if it looks like a LinkedIn URL
 */
export const isLinkedInUrl = (input) => {
  if (!input || typeof input !== 'string') return false;
  
  const trimmed = input.trim().toLowerCase();
  
  // Check for various LinkedIn URL patterns
  return (
    trimmed.includes('linkedin.com/in/') ||
    trimmed.includes('linkedin.com/pub/') ||
    trimmed.includes('www.linkedin.com/in/') ||
    trimmed.includes('www.linkedin.com/pub/') ||
    trimmed.startsWith('https://linkedin.com/in/') ||
    trimmed.startsWith('http://linkedin.com/in/') ||
    trimmed.startsWith('https://www.linkedin.com/in/') ||
    trimmed.startsWith('http://www.linkedin.com/in/')
  );
};

/**
 * Extracts LinkedIn username/handle from various input formats
 * @param {string} input - The user input (URL or username)
 * @returns {object} - { username: string, isUrl: boolean, originalInput: string }
 */
export const parseLinkedInInput = (input) => {
  if (!input || typeof input !== 'string') {
    return {
      username: '',
      isUrl: false,
      originalInput: input || '',
      isValid: false
    };
  }

  const trimmed = input.trim();
  const isUrl = isLinkedInUrl(trimmed);

  if (!isUrl) {
    // Input is already just a username - validate it
    const cleanUsername = trimmed.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
    return {
      username: cleanUsername,
      isUrl: false,
      originalInput: trimmed,
      isValid: isValidLinkedInUsername(cleanUsername)
    };
  }

  // Input is a URL - extract the username
  try {
    // Handle various URL formats
    let urlToParse = trimmed;
    
    // Add protocol if missing
    if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
      urlToParse = 'https://' + urlToParse;
    }

    const url = new URL(urlToParse);
    const pathname = url.pathname;

    // Extract username from path patterns like:
    // /in/username/
    // /in/username
    // /pub/username/
    // /pub/username/dir/
    const patterns = [
      /^\/in\/([^\/\?#]+)/,
      /^\/pub\/([^\/\?#]+)/
    ];

    for (const pattern of patterns) {
      const match = pathname.match(pattern);
      if (match && match[1]) {
        const username = match[1].trim();
        return {
          username,
          isUrl: true,
          originalInput: trimmed,
          isValid: isValidLinkedInUsername(username)
        };
      }
    }

    // If no pattern matches, return invalid
    return {
      username: '',
      isUrl: true,
      originalInput: trimmed,
      isValid: false
    };

  } catch (error) {
    // Invalid URL format
    return {
      username: '',
      isUrl: true,
      originalInput: trimmed,
      isValid: false
    };
  }
};

/**
 * Validates LinkedIn username format
 * @param {string} username - The username to validate
 * @returns {boolean} - True if valid LinkedIn username format
 */
export const isValidLinkedInUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  
  const trimmed = username.trim();
  
  // LinkedIn username rules:
  // - 3-100 characters
  // - Letters, numbers, hyphens, underscores
  // - Cannot start or end with hyphen or underscore
  // - Cannot have consecutive hyphens or underscores
  const linkedinUsernameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-_]*[a-zA-Z0-9])?$/;
  
  return (
    trimmed.length >= 3 &&
    trimmed.length <= 100 &&
    linkedinUsernameRegex.test(trimmed) &&
    !trimmed.includes('--') &&
    !trimmed.includes('__') &&
    !trimmed.includes('-_') &&
    !trimmed.includes('_-')
  );
};

/**
 * Formats a LinkedIn username into a full URL
 * @param {string} username - The LinkedIn username
 * @returns {string} - Full LinkedIn URL
 */
export const formatLinkedInUrl = (username) => {
  if (!username || typeof username !== 'string') return '';
  
  const trimmed = username.trim().replace(/^\/+|\/+$/g, '');
  return `https://www.linkedin.com/in/${trimmed}/`;
};

/**
 * Gets user-friendly display text for LinkedIn input
 * @param {string} input - The user input
 * @returns {object} - { displayText: string, extractedUsername: string, wasUrl: boolean }
 */
export const getLinkedInDisplayInfo = (input) => {
  const parsed = parseLinkedInInput(input);
  
  if (!parsed.isValid) {
    return {
      displayText: input || '',
      extractedUsername: '',
      wasUrl: parsed.isUrl,
      isValid: false
    };
  }

  return {
    displayText: parsed.isUrl 
      ? `Detected: ${parsed.username}` 
      : parsed.username,
    extractedUsername: parsed.username,
    wasUrl: parsed.isUrl,
    isValid: true
  };
};

// Test cases for development
export const testLinkedInParser = () => {
  const testCases = [
    // Valid usernames
    'samueldevyver',
    'john-doe',
    'jane_smith',
    'user123',
    
    // Valid URLs
    'https://www.linkedin.com/in/samueldevyver?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app',
    'https://linkedin.com/in/john-doe/',
    'www.linkedin.com/in/jane_smith',
    'linkedin.com/in/user123',
    
    // Invalid cases
    '',
    'ab', // too short
    '-invalid', // starts with hyphen
    'invalid-', // ends with hyphen
    'invalid--user', // consecutive hyphens
    'https://facebook.com/user', // wrong domain
  ];

  console.log('LinkedIn Parser Test Results:');
  testCases.forEach(testCase => {
    const result = parseLinkedInInput(testCase);
    const display = getLinkedInDisplayInfo(testCase);
    console.log(`Input: "${testCase}"`);
    console.log(`  Parsed:`, result);
    console.log(`  Display:`, display);
    console.log('---');
  });
};
