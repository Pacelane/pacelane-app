// Templates API - Handles content templates
// This manages both system templates and user-created templates

import { supabase } from '@/integrations/supabase/client';

// ========== TYPE DEFINITIONS ==========

export interface Template {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  content: string;
  category: string;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ========== API FUNCTIONS ==========

/**
 * Get templates available to user (system + user templates)
 * @param userId - User ID
 * @returns Promise with templates list
 */
export const fetchUserTemplates = async (userId: string) => {
  console.log('TemplatesAPI: Fetching templates for user:', userId);

  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .or(`user_id.eq.${userId},is_system.eq.true`)
      .eq('is_active', true)
      .order('is_system', { ascending: false }) // System templates first
      .order('created_at', { ascending: false });

    if (error) {
      console.error('TemplatesAPI: Templates fetch error:', error);
      return { 
        data: null, 
        error: { 
          message: error.message,
          details: error.details || '',
          hint: error.hint || '',
          code: error.code || ''
        }
      };
    }

    console.log('TemplatesAPI: Templates fetched successfully:', data?.length);
    return { data: data || [], error: null };

  } catch (err) {
    console.error('TemplatesAPI: Unexpected error in fetchUserTemplates:', err);
    return { 
      data: null, 
      error: { 
        message: err instanceof Error ? err.message : 'Failed to fetch templates',
        details: err instanceof Error ? err.stack || '' : '',
        hint: '',
        code: ''
      }
    };
  }
};

/**
 * Get system templates only
 * @returns Promise with system templates
 */
export const fetchSystemTemplates = async () => {
  console.log('TemplatesAPI: Fetching system templates');

  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('is_system', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('TemplatesAPI: System templates fetch error:', error);
      return { 
        data: null, 
        error: { 
          message: error.message,
          details: error.details || '',
          hint: error.hint || '',
          code: error.code || ''
        }
      };
    }

    console.log('TemplatesAPI: System templates fetched successfully:', data?.length);
    return { data: data || [], error: null };

  } catch (err) {
    console.error('TemplatesAPI: Unexpected error in fetchSystemTemplates:', err);
    return { 
      data: null, 
      error: { 
        message: err instanceof Error ? err.message : 'Failed to fetch system templates',
        details: err instanceof Error ? err.stack || '' : '',
        hint: '',
        code: ''
      }
    };
  }
};

/**
 * Get a specific template by ID
 * @param templateId - Template ID
 * @returns Promise with template data
 */
export const getTemplateById = async (templateId: string) => {
  console.log('TemplatesAPI: Fetching template by ID:', templateId);

  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('TemplatesAPI: Template fetch error:', error);
      return { 
        data: null, 
        error: { 
          message: error.message,
          details: error.details || '',
          hint: error.hint || '',
          code: error.code || ''
        }
      };
    }

    console.log('TemplatesAPI: Template fetched successfully:', data?.title);
    return { data, error: null };

  } catch (err) {
    console.error('TemplatesAPI: Unexpected error in getTemplateById:', err);
    return { 
      data: null, 
      error: { 
        message: err instanceof Error ? err.message : 'Failed to fetch template',
        details: err instanceof Error ? err.stack || '' : '',
        hint: '',
        code: ''
      }
    };
  }
}; 