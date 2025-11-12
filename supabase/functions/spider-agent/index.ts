import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.20.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Clean content to extract only the LinkedIn post text.
 * Removes introductory phrases and explanatory text, keeping only the actual post content.
 */
function cleanLinkedInPostContent(content: string): string {
  if (!content) return '';
  
  let cleaned = content.trim();
  
  // Remove common introductory phrases (case-insensitive)
  const introPatterns = [
    /^I'll help you create.*?LinkedIn post[.:\s]*/i,
    /^Here's your LinkedIn post[.:\s]*/i,
    /^Here is your LinkedIn post[.:\s]*/i,
    /^Based on.*?, here's.*?LinkedIn post[.:\s]*/i,
    /^I've created.*?LinkedIn post[.:\s]*/i,
    /^Your LinkedIn post[.:\s]*/i,
    /^LinkedIn post[.:\s]*/i,
    /^Here's the post[.:\s]*/i,
    /^Here is the post[.:\s]*/i,
  ];
  
  for (const pattern of introPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Remove content after common separators (colons, line breaks)
  // Extract content after first colon if it appears early in the text (likely intro)
  const colonIndex = cleaned.indexOf(':');
  if (colonIndex > 0 && colonIndex < 100) {
    // If colon appears early, likely an introduction
    cleaned = cleaned.substring(colonIndex + 1).trim();
  }
  
  // Remove trailing explanatory text (common patterns)
  const trailingPatterns = [
    /\s*This post.*$/i,
    /\s*I hope this helps.*$/i,
    /\s*Let me know.*$/i,
    /\s*Feel free.*$/i,
  ];
  
  for (const pattern of trailingPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Clean up multiple consecutive line breaks
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Remove leading/trailing whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check Anthropic API key
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    // Initialize Anthropic SDK
    const anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    });

    // Check authentication - accept apikey header (publishable key) or Authorization header
    const authHeader = req.headers.get('Authorization');
    const apikeyHeader = req.headers.get('apikey');
    let isServiceRole = false;
    
    // Check if it's a service role call
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      if (token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
        isServiceRole = true;
        console.log('🔑 Service role call detected');
      }
    }
    
    // Accept apikey header (publishable key) for testing - this is what Supabase Studio provides
    if (!authHeader && !apikeyHeader) {
      console.warn('⚠️  No authentication header provided - proceeding anyway (service role used internally)');
    } else if (apikeyHeader) {
      console.log('🔑 API key provided in apikey header');
    }

    // Initialize Supabase client - always use service role for internal operations
    // This allows the function to work regardless of the authentication method used
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      throw new Error(`Invalid JSON in request body: ${error.message}`);
    }

    const { userId } = requestBody || {};

    if (!userId) {
      throw new Error('userId is required in request body');
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new Error('userId must be a valid UUID');
    }

    console.log(`Processing request for user: ${userId}`);

    // Step 1: Get or create user's content skill
    const { data: skillData, error: skillError } = await supabase
      .from('user_content_skills')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (skillError || !skillData) {
      throw new Error(`Skill configuration not found for user ${userId}. Please create it in user_content_skills table.`);
    }

    // Validate that all required skill fields are present and not empty
    const requiredFields = ['target_audience', 'content_objectives', 'content_pillars', 'user_summary'];
    const missingFields = requiredFields.filter(field => !skillData[field] || skillData[field].trim() === '');
    
    if (missingFields.length > 0) {
      throw new Error(`Skill configuration is incomplete. Missing or empty fields: ${missingFields.join(', ')}. Please complete the configuration in user_content_skills table.`);
    }

    console.log('Skill configuration found:', {
      hasAnthropicSkillId: !!skillData.anthropic_skill_id,
      targetAudience: skillData.target_audience?.substring(0, 50) + '...',
      allFieldsPresent: requiredFields.every(field => skillData[field] && skillData[field].trim() !== ''),
    });

    // Step 2: Create or reuse Anthropic skill
    let skillId = skillData.anthropic_skill_id;
    let usedExistingSkill = true;

    if (!skillId) {
      console.log('Creating new Anthropic skill for user:', userId);
      
      // Create SKILL.md content
      // IMPORTANT: The skill name in the frontmatter must match the directory name
      const baseSkillName = `linkedin-content-creation-${userId.replace(/-/g, '')}`;
      const skillContent = `---
name: ${baseSkillName}
description: Skill personalizada para criação de conteúdo LinkedIn para o usuário
---

# LinkedIn Content Creation Skill

## Público-Alvo
${skillData.target_audience}

## Objetivos de Conteúdo
${skillData.content_objectives}

## Pilares de Conteúdo
${skillData.content_pillars}

## Resumo do Usuário
${skillData.user_summary}

## Instruções

Use estas informações para criar conteúdo LinkedIn personalizado que:

1. **Respeite o Público-Alvo**: Todo conteúdo deve ser direcionado especificamente para o público-alvo definido acima. Considere linguagem, tom, exemplos e referências que ressoem com esse público.

2. **Alinhe com Objetivos**: O conteúdo deve avançar os objetivos definidos. Cada post deve ter um propósito claro e mensurável relacionado aos objetivos.

3. **Siga os Pilares**: Mantenha consistência com os pilares de conteúdo estabelecidos. Use os pilares como guia para temas e abordagens.

4. **Reflita a Personalidade**: O conteúdo deve refletir o resumo e experiência do usuário, mantendo autenticidade e credibilidade.

5. **Contexto dos Posts Recentes**: Ao analisar posts recentes do usuário, mantenha consistência de tom, estilo e temas, mas traga novidade e valor.

6. **Input do WhatsApp**: Use o input do WhatsApp como ponto de partida ou inspiração, mas transforme em conteúdo LinkedIn profissional e bem estruturado.`;

      // Create skill via Anthropic Skills API
      // Skills API requires files to be uploaded via FormData
      // According to docs: https://docs.claude.com/en/api/skills/create-skill
      // IMPORTANT: All files must be in the same top-level directory
      // The SKILL.md file must be at the root of that directory
      // Example from docs: -F "files[]=@excel-skill/SKILL.md;filename=excel-skill/SKILL.md"
      // This means we need a top-level directory name in the filename path
      try {
        // Generate unique display_title with retry logic for duplicate titles
        let skillIdCreated = false;
        let attempt = 0;
        const maxAttempts = 3;
        
        while (!skillIdCreated && attempt < maxAttempts) {
          try {
            // Use FormData API - Deno supports this natively
            // The third parameter of append() specifies the filename with path
            const formData = new FormData();
            
            // Generate display_title - add timestamp/hash for uniqueness if retrying
            let displayTitle = `LinkedIn Content Creation - ${userId.substring(0, 8)}`;
            if (attempt > 0) {
              // Add timestamp to make it unique on retry
              const timestamp = Date.now().toString(36).substring(0, 6);
              displayTitle = `LinkedIn Content Creation - ${userId.substring(0, 8)}-${timestamp}`;
            }
            formData.append('display_title', displayTitle);
            
            // Add files[] field - CRITICAL: filename must include a top-level directory
            // The format must be: "directory-name/SKILL.md"
            // IMPORTANT: The directory name MUST match the skill name in SKILL.md frontmatter
            // The directory name is the "top-level folder" and SKILL.md is at the root of that directory
            const skillBlob = new Blob([skillContent], { type: 'text/markdown' });
            // Use the skill name as the directory name (must match the name in SKILL.md frontmatter)
            // Example: skill name is "linkedin-content-creation-72b290cd7363466a9f30d552d335d6c4"
            // Directory must be: "linkedin-content-creation-72b290cd7363466a9f30d552d335d6c4/SKILL.md"
            const skillFileName = `${baseSkillName}/SKILL.md`;
            formData.append('files[]', skillBlob, skillFileName);

            console.log(`Creating skill with FormData (attempt ${attempt + 1}/${maxAttempts}):`, {
              displayTitle: displayTitle,
              skillName: baseSkillName,
              fileName: skillFileName,
              fileSize: skillContent.length,
            });

            const skillResponse = await fetch('https://api.anthropic.com/v1/skills', {
              method: 'POST',
              headers: {
                'x-api-key': anthropicApiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-beta': 'skills-2025-10-02',
                // Don't set Content-Type - let fetch set it automatically with boundary
              },
              body: formData,
            });

            if (!skillResponse.ok) {
              const errorText = await skillResponse.text();
              console.error('Anthropic Skills API error:', errorText);
              
              // Check if it's a duplicate display_title error
              let isDuplicateTitleError = false;
              try {
                const errorJson = JSON.parse(errorText);
                isDuplicateTitleError = errorJson?.error?.message?.includes('display_title') || 
                                       errorJson?.error?.message?.includes('reuse') ||
                                       errorJson?.error?.message?.includes('existing display_title');
              } catch (parseError) {
                // If error is not JSON, check if error text contains duplicate title keywords
                isDuplicateTitleError = errorText.includes('display_title') || 
                                       errorText.includes('reuse') ||
                                       errorText.includes('existing display_title');
              }
              
              if (isDuplicateTitleError && attempt < maxAttempts - 1) {
                console.log(`Duplicate display_title detected, retrying with unique title (attempt ${attempt + 1}/${maxAttempts})...`);
                attempt++;
                continue; // Retry with new unique title
              }
              
              throw new Error(`Failed to create skill: ${skillResponse.status} - ${errorText}`);
            }

            const skillResult = await skillResponse.json();
            skillId = skillResult.id;
            usedExistingSkill = false;
            skillIdCreated = true;

            console.log('Skill created successfully:', skillId);

            // Save skill ID to database
            const { error: updateError } = await supabase
              .from('user_content_skills')
              .update({ anthropic_skill_id: skillId })
              .eq('user_id', userId);

            if (updateError) {
              console.error('Error saving skill ID:', updateError);
              // Continue anyway, we have the skill ID
            }
          } catch (error) {
            // If it's the last attempt, throw the error
            if (attempt >= maxAttempts - 1) {
              console.error('Error creating skill (max attempts reached):', error);
              throw new Error(`Failed to create Anthropic skill: ${error.message}`);
            }
            // Otherwise, continue to retry
            attempt++;
          }
        }
        
        if (!skillIdCreated) {
          throw new Error(`Failed to create Anthropic skill after ${maxAttempts} attempts`);
        }
      } catch (error) {
        console.error('Error creating skill:', error);
        throw new Error(`Failed to create Anthropic skill: ${error.message}`);
      }
    } else {
      console.log('Reusing existing skill:', skillId);
    }

    // Step 3: Get user posts and WhatsApp input (with id)
    const [postsResult, whatsappResult] = await Promise.all([
      supabase
        .from('user_posts_test')
        .select('post_content')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('whatsapp_input_test')
        .select('id, input_content')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
    ]);

    if (postsResult.error || !postsResult.data) {
      throw new Error(`Posts not found for user ${userId}. Please create an entry in user_posts_test table.`);
    }

    if (whatsappResult.error || !whatsappResult.data) {
      throw new Error(`WhatsApp input not found for user ${userId}. Please create an entry in whatsapp_input_test table.`);
    }

    const postsContent = postsResult.data.post_content?.trim() || '';
    const whatsappContent = whatsappResult.data.input_content?.trim() || '';
    const whatsappInputId = whatsappResult.data.id;

    // Validate that content is not empty
    if (!postsContent || postsContent.length === 0) {
      throw new Error(`Posts content is empty for user ${userId}. Please provide post content in user_posts_test table.`);
    }

    if (!whatsappContent || whatsappContent.length === 0) {
      throw new Error(`WhatsApp input is empty for user ${userId}. Please provide input content in whatsapp_input_test table.`);
    }

    // Validate minimum content length
    const MIN_CONTENT_LENGTH = 10;
    if (postsContent.length < MIN_CONTENT_LENGTH) {
      throw new Error(`Posts content is too short (minimum ${MIN_CONTENT_LENGTH} characters). Please provide more content in user_posts_test table.`);
    }

    if (whatsappContent.length < MIN_CONTENT_LENGTH) {
      throw new Error(`WhatsApp input is too short (minimum ${MIN_CONTENT_LENGTH} characters). Please provide more content in whatsapp_input_test table.`);
    }

    console.log('Retrieved content:', {
      postsLength: postsContent.length,
      whatsappLength: whatsappContent.length,
      whatsappInputId: whatsappInputId,
    });

    // Step 4: Process with agent using the skill
    const systemPrompt = `You are a LinkedIn content creation assistant. A personalized skill is loaded in the container at SKILL.md with information about:
- Target audience
- Content objectives
- Content pillars
- User summary

Read the skill file to understand the user's preferences, then create LinkedIn content that aligns with them.`;

    const userMessage = `Transform the WhatsApp input into a LinkedIn post using the following context:

**Recent Posts (REFERENCE ONLY - for tone and style):**
${postsContent}

**IMPORTANT:** The recent posts above are ONLY for reference to understand:
- Writing tone and voice
- Format and structure patterns
- How paragraphs are organized
- Engagement style

DO NOT copy, mix, or reuse content from these posts. They are just style examples.

**WhatsApp Input (THE ACTUAL CONTENT TO TRANSFORM):**
${whatsappContent}

**Instructions:**
1. Read the SKILL.md file from the container to understand my target audience, objectives, and content pillars
2. Transform the WhatsApp input into a LinkedIn post that:
   - Uses the WhatsApp input as the BASE CONTENT (transform it, don't ignore it)
   - Matches my target audience, objectives, and content pillars (from SKILL.md)
   - Follows the TONE and STYLE of my recent posts (but uses NEW content from WhatsApp input)
   - Is professional, engaging, and valuable
   - Does NOT copy or mix content from the recent posts examples
3. Output ONLY the LinkedIn post content text - nothing else

After reading the skill, generate the post content directly based on the WhatsApp input, using the style from recent posts but creating entirely new content.`;

    // Create message with skill in container using REST API directly
    // (SDK may not fully support container/skills yet)
    let response;
    try {
      const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'code-execution-2025-08-25,skills-2025-10-02,files-api-2025-04-14',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2000,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userMessage,
            },
          ],
          tools: [
            {
              name: 'code_execution',
              type: 'code_execution_20250825',
            },
          ],
          container: {
            skills: [
              {
                skill_id: skillId,
                type: 'custom', // Skills created via API are 'custom' type
                version: 'latest', // Use latest version
              },
            ],
          },
        }),
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('Anthropic API error:', errorText);
        throw new Error(`Failed to generate content: ${apiResponse.status} - ${errorText}`);
      }

      response = await apiResponse.json();
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw new Error(`Failed to generate content with Anthropic: ${error.message || 'Unknown error'}`);
    }

    // Check if model used a tool - if so, continue conversation with tool result
    let content = '';
    const toolUseBlocks = response.content?.filter((block: any) => block.type === 'tool_use') || [];
    
    if (toolUseBlocks.length > 0) {
      // Model used a tool - continue conversation with tool results
      console.log('Model used tool, continuing conversation with tool results...');
      
      // Build tool results - for code_execution server tool, the API executes automatically
      // but we still need to continue the conversation to get the final content
      const toolResults = toolUseBlocks.map((toolUse: any) => {
        if (toolUse.name === 'code_execution') {
          // The code_execution tool is a server tool, so execution happens automatically
          // We acknowledge the tool use and ask for content generation
          return {
            type: 'code_execution_tool_result',
            tool_use_id: toolUse.id,
            content: [
              {
                type: 'code_execution_result',
                stdout: 'Skill file read successfully. The skill information is now available.',
                stderr: '',
                return_code: 0,
                content: [],
              },
            ],
          };
        }
        return null;
      }).filter((result: any) => result !== null);
      
      // Continue conversation with tool results
      const followUpResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'code-execution-2025-08-25,skills-2025-10-02,files-api-2025-04-14',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2000,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userMessage,
            },
            {
              role: 'assistant',
              content: response.content,
            },
            {
              role: 'user',
              content: [
                ...toolResults,
                {
                  type: 'text',
                  text: 'Now generate the LinkedIn post content based on the skill information. Output ONLY the post content text - nothing else.',
                },
              ],
            },
          ],
          tools: [
            {
              name: 'code_execution',
              type: 'code_execution_20250825',
            },
          ],
          tool_choice: {
            type: 'none', // Don't use tools anymore - just generate content
          },
          container: {
            skills: [
              {
                skill_id: skillId,
                type: 'custom',
                version: 'latest',
              },
            ],
          },
        }),
      });

      if (!followUpResponse.ok) {
        const errorText = await followUpResponse.text();
        console.error('Anthropic API error on follow-up:', errorText);
        throw new Error(`Failed to generate content: ${followUpResponse.status} - ${errorText}`);
      }

      response = await followUpResponse.json();
    }

    // Extract content from response
    if (response.content && response.content.length > 0) {
      // Find text content blocks
      const textBlocks = response.content.filter((block: any) => block.type === 'text');
      if (textBlocks.length > 0) {
        content = textBlocks.map((block: any) => block.text || '').join('\n\n').trim();
      } else {
        // If no text blocks, check for tool_use (model might still be using tools)
        const toolUseBlocks = response.content.filter((block: any) => block.type === 'tool_use');
        if (toolUseBlocks.length > 0) {
          // Model is still trying to use tools - extract the message
          const textContent = response.content.find((block: any) => block.type === 'text');
          content = textContent?.text?.trim() || 'Processing...';
        } else {
          console.warn('Unexpected content type:', response.content[0]?.type);
          content = JSON.stringify(response.content[0]);
        }
      }
    }

    if (!content || content.length === 0) {
      throw new Error('No content generated from Claude. The response was empty.');
    }

    // Validate minimum generated content length
    if (content.length < 50) {
      console.warn('Generated content is very short:', content.length, 'characters');
    }

    // Clean the content to extract only the LinkedIn post
    const cleanedContent = cleanLinkedInPostContent(content);
    
    if (!cleanedContent || cleanedContent.length === 0) {
      throw new Error('Failed to extract LinkedIn post content from response.');
    }

    console.log('Content generated successfully:', {
      originalLength: content.length,
      cleanedLength: cleanedContent.length,
    });

    // Step 5: Save generated post to database
    const { data: generatedPost, error: insertError } = await supabase
      .from('generated_posts')
      .insert({
        user_id: userId,
        content: cleanedContent,
        whatsapp_input_id: whatsappInputId,
        status: 'draft',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving generated post to database:', insertError);
      throw new Error(`Failed to save generated post: ${insertError.message}`);
    }

    console.log('Generated post saved to database:', generatedPost.id);

    return new Response(JSON.stringify({
      success: true,
      content: cleanedContent,
      generatedPostId: generatedPost.id,
      skillId: skillId,
      usedExistingSkill: usedExistingSkill,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in spider-agent function:', error);
    
    // Determine appropriate HTTP status code
    let statusCode = 500;
    if (error.message?.includes('not found') || error.message?.includes('missing')) {
      statusCode = 404;
    } else if (error.message?.includes('required') || error.message?.includes('Invalid')) {
      statusCode = 400;
    }

    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Internal server error',
      details: error.message || undefined,
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

