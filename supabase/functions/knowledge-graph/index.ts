import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';
import { updateRelationStatus } from './updateRelationStatus.ts';

// Types
interface CreatePageRequest {
  userId: string;
  title: string;
  content?: string;
  icon?: string;
  source?: 'manual' | 'whatsapp' | 'upload';
  source_metadata?: any;
  page_properties?: any;
}

interface UpdatePageRequest {
  userId: string;
  pageId: string;
  title?: string;
  content?: string;
  icon?: string;
  page_properties?: any;
  is_archived?: boolean;
}

interface ListPagesRequest {
  userId: string;
  page?: number;
  per_page?: number;
  filters?: {
    source?: string | string[];
    is_archived?: boolean;
    has_links?: boolean;
    tags?: string[];
    created_after?: string;
    created_before?: string;
  };
  sort_by?: 'created_at' | 'updated_at' | 'title' | 'last_opened_at';
  order?: 'asc' | 'desc';
}

interface SearchPagesRequest {
  userId: string;
  query: string;
  limit?: number;
}

interface ParseLinksRequest {
  userId: string;
  pageId: string;
  content: string;
}

interface GetBacklinksRequest {
  userId: string;
  pageId: string;
}

interface GetGraphDataRequest {
  userId: string;
  filters?: {
    connected_to?: string; // page_id
    source?: string[];
    limit?: number;
  };
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);
}

function extractContext(content: string, linkPosition: number, contextLength = 200): string {
  const start = Math.max(0, linkPosition - contextLength / 2);
  const end = Math.min(content.length, linkPosition + contextLength / 2);
  return content.substring(start, end).trim();
}

// =====================================================
// MAIN HANDLER
// =====================================================

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Auth header start:', authHeader.substring(0, 20));

    // Extract JWT token from "Bearer <token>"
    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user is authenticated by passing the JWT to getUser
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      console.log('Auth header present:', !!authHeader);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { action, ...body } = await req.json();
    console.log(`Knowledge Graph: ${action} for user ${user.id}`);

    // Route to appropriate handler
    let result;
    switch (action) {
      case 'create-page':
        result = await createPage(supabase, { ...body, userId: user.id } as CreatePageRequest);
        break;
      case 'update-page':
        result = await updatePage(supabase, { ...body, userId: user.id } as UpdatePageRequest);
        break;
      case 'delete-page':
        result = await deletePage(supabase, user.id, body.pageId);
        break;
      case 'get-page':
        result = await getPage(supabase, user.id, body.pageId);
        break;
      case 'list-pages':
        result = await listPages(supabase, { ...body, userId: user.id } as ListPagesRequest);
        break;
      case 'search-pages':
        result = await searchPages(supabase, { ...body, userId: user.id } as SearchPagesRequest);
        break;
      case 'parse-links':
        result = await parseAndCreateLinks(supabase, { ...body, userId: user.id } as ParseLinksRequest);
        break;
      case 'get-backlinks':
        result = await getBacklinks(supabase, { ...body, userId: user.id } as GetBacklinksRequest);
        break;
      case 'get-graph-data':
        result = await getGraphData(supabase, { ...body, userId: user.id } as GetGraphDataRequest);
        break;
      case 'update-relation-status':
        result = await updateRelationStatus(supabase, { ...body, userId: user.id } as UpdateRelationStatusRequest);
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in knowledge-graph:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// =====================================================
// PAGE CRUD OPERATIONS
// =====================================================

async function createPage(supabase: any, request: CreatePageRequest) {
  const { userId, title, content, icon, source = 'manual', source_metadata = {}, page_properties = {} } = request;

  // Generate slug
  const baseSlug = generateSlug(title);
  let slug = baseSlug;
  let attempt = 0;

  // Handle slug conflicts by appending number
  while (attempt < 10) {
    const { data: existing } = await supabase
      .from('knowledge_pages')
      .select('id')
      .eq('user_id', userId)
      .eq('slug', slug)
      .single();

    if (!existing) break;
    
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  // Create page
  const { data, error } = await supabase
    .from('knowledge_pages')
    .insert({
      user_id: userId,
      title,
      slug,
      content: content || '',
      icon,
      source,
      source_metadata,
      page_properties,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating page:', error);
    throw new Error(`Failed to create page: ${error.message}`);
  }

  console.log(`✅ Created page: ${data.id} (${data.title})`);
  return { data, error: null };
}

async function updatePage(supabase: any, request: UpdatePageRequest) {
  const { userId, pageId, ...updates } = request;

  // Verify ownership
  const { data: existing } = await supabase
    .from('knowledge_pages')
    .select('id')
    .eq('id', pageId)
    .eq('user_id', userId)
    .single();

  if (!existing) {
    throw new Error('Page not found or access denied');
  }

  // If updating title, regenerate slug
  if (updates.title) {
    const newSlug = generateSlug(updates.title);
    (updates as any).slug = newSlug;
  }

  // Update page
  const { data, error } = await supabase
    .from('knowledge_pages')
    .update(updates)
    .eq('id', pageId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating page:', error);
    throw new Error(`Failed to update page: ${error.message}`);
  }

  console.log(`✅ Updated page: ${pageId}`);
  return { data, error: null };
}

async function deletePage(supabase: any, userId: string, pageId: string) {
  // Verify ownership
  const { data: existing } = await supabase
    .from('knowledge_pages')
    .select('id')
    .eq('id', pageId)
    .eq('user_id', userId)
    .single();

  if (!existing) {
    throw new Error('Page not found or access denied');
  }

  // Delete page (will cascade delete links and attachments)
  const { error } = await supabase
    .from('knowledge_pages')
    .delete()
    .eq('id', pageId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting page:', error);
    throw new Error(`Failed to delete page: ${error.message}`);
  }

  console.log(`✅ Deleted page: ${pageId}`);
  return { data: { id: pageId, deleted: true }, error: null };
}

async function getPage(supabase: any, userId: string, pageId: string) {
  // Get page with stats
  const { data: page, error: pageError } = await supabase
    .from('knowledge_pages_with_stats')
    .select('*')
    .eq('id', pageId)
    .eq('user_id', userId)
    .single();

  if (pageError || !page) {
    throw new Error('Page not found');
  }

  // Get backlinks
  const { data: backlinks } = await supabase
    .from('knowledge_links')
    .select(`
      id,
      link_text,
      link_context,
      created_at,
      created_by,
      source_page:knowledge_pages!knowledge_links_source_page_id_fkey(
        id,
        title,
        slug,
        icon,
        preview
      )
    `)
    .eq('target_page_id', pageId);

  // Get attachments
  const { data: attachments } = await supabase
    .from('knowledge_attachments')
    .select('*')
    .eq('page_id', pageId)
    .order('created_at', { ascending: false });

  // Update last_opened_at
  await supabase
    .from('knowledge_pages')
    .update({ last_opened_at: new Date().toISOString() })
    .eq('id', pageId)
    .eq('user_id', userId);

  return {
    data: {
      page,
      backlinks: backlinks || [],
      attachments: attachments || [],
    },
    error: null,
  };
}

async function listPages(supabase: any, request: ListPagesRequest) {
  const {
    userId,
    page = 1,
    per_page = 50,
    filters = {},
    sort_by = 'updated_at',
    order = 'desc',
  } = request;

  let query = supabase
    .from('knowledge_pages_with_stats')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  // Apply filters
  if (filters.source) {
    if (Array.isArray(filters.source)) {
      query = query.in('source', filters.source);
    } else {
      query = query.eq('source', filters.source);
    }
  }

  if (filters.is_archived !== undefined) {
    query = query.eq('is_archived', filters.is_archived);
  }

  if (filters.created_after) {
    query = query.gte('created_at', filters.created_after);
  }

  if (filters.created_before) {
    query = query.lte('created_at', filters.created_before);
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.contains('page_properties', { tags: filters.tags });
  }

  // Apply sorting
  query = query.order(sort_by, { ascending: order === 'asc' });

  // Apply pagination
  const from = (page - 1) * per_page;
  const to = from + per_page - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error listing pages:', error);
    throw new Error(`Failed to list pages: ${error.message}`);
  }

  return {
    data: {
      pages: data || [],
      total: count || 0,
      page,
      per_page,
      total_pages: Math.ceil((count || 0) / per_page),
    },
    error: null,
  };
}

async function searchPages(supabase: any, request: SearchPagesRequest) {
  const { userId, query, limit = 20 } = request;

  // Use full-text search
  const { data, error } = await supabase.rpc('search_knowledge_pages', {
    p_user_id: userId,
    p_query: query,
    p_limit: limit,
  });

  if (error) {
    console.error('Error searching pages:', error);
    // Fallback to simple ILIKE search if RPC doesn't exist yet
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('knowledge_pages')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(limit);

    if (fallbackError) {
      throw new Error(`Failed to search pages: ${fallbackError.message}`);
    }

    return { data: { pages: fallbackData || [], total: fallbackData?.length || 0 }, error: null };
  }

  return { data: { pages: data || [], total: data?.length || 0 }, error: null };
}

// =====================================================
// LINK OPERATIONS
// =====================================================

async function parseAndCreateLinks(supabase: any, request: ParseLinksRequest) {
  const { userId, pageId, content } = request;

  // Regex to find [[page-name]] patterns
  const linkRegex = /\[\[([^\]]+)\]\]/g;
  const matches = [...content.matchAll(linkRegex)];

  // Get all existing links from this page
  const { data: existingLinks } = await supabase
    .from('knowledge_links')
    .select('id, target_page_id, link_text, target_page:knowledge_pages!knowledge_links_target_page_id_fkey(id, slug)')
    .eq('source_page_id', pageId);

  const currentLinks = new Set(); // Track target_page_ids that should exist
  const links = [];
  const createdPages = [];

  // Process all links found in content
  for (const match of matches) {
    const linkText = match[1].trim();
    const slug = generateSlug(linkText);

    // Find or create target page
    let { data: targetPage } = await supabase
      .from('knowledge_pages')
      .select('id, title, slug')
      .eq('user_id', userId)
      .eq('slug', slug)
      .single();

    // If page doesn't exist, create it
    if (!targetPage) {
      const { data: newPage } = await supabase
        .from('knowledge_pages')
        .insert({
          user_id: userId,
          title: linkText,
          slug: slug,
          content: '',
          source: 'manual',
        })
        .select()
        .single();

      targetPage = newPage;
      createdPages.push(newPage);
      console.log(`✅ Auto-created page: ${linkText}`);
    }

    // Track this link should exist
    currentLinks.add(targetPage.id);

    // Check if link already exists
    const existingLink = existingLinks?.find(
      l => l.target_page_id === targetPage.id && l.link_text === linkText
    );

    if (existingLink) {
      // Link already exists, update context if needed
      const newContext = extractContext(content, match.index);
      if (newContext !== existingLink.link_context) {
        await supabase
          .from('knowledge_links')
          .update({ link_context: newContext })
          .eq('id', existingLink.id);
      }
      links.push(existingLink);
    } else {
      // Create new link
      const { data: link, error: linkError } = await supabase
        .from('knowledge_links')
        .insert({
          user_id: userId,
          source_page_id: pageId,
          target_page_id: targetPage.id,
          link_text: linkText,
          link_context: extractContext(content, match.index),
          created_by: 'manual',
        })
        .select()
        .single();

      if (!linkError && link) {
        links.push(link);
        console.log(`✅ Created new link: ${linkText}`);
      }
    }
  }

  // Delete links that no longer exist in content
  const linksToDelete = existingLinks?.filter(
    link => !currentLinks.has(link.target_page_id)
  ) || [];

  if (linksToDelete.length > 0) {
    const linkIds = linksToDelete.map(l => l.id);
    const { error: deleteError } = await supabase
      .from('knowledge_links')
      .delete()
      .in('id', linkIds);

    if (!deleteError) {
      console.log(`✅ Deleted ${linksToDelete.length} obsolete links`);
    }
  }

  console.log(`✅ Parsed ${matches.length} links, ${links.length} total links, created ${createdPages.length} new pages, deleted ${linksToDelete.length} old links`);

  return {
    data: {
      links,
      count: links.length,
      created_pages: createdPages,
      deleted_links_count: linksToDelete.length,
    },
    error: null,
  };
}

async function getBacklinks(supabase: any, request: GetBacklinksRequest) {
  const { userId, pageId } = request;

  const { data, error } = await supabase
    .from('knowledge_links')
    .select(`
      id,
      link_text,
      link_context,
      created_at,
      created_by,
      source_page:knowledge_pages!knowledge_links_source_page_id_fkey(
        id,
        title,
        slug,
        icon,
        preview
      )
    `)
    .eq('target_page_id', pageId);

  if (error) {
    console.error('Error getting backlinks:', error);
    throw new Error(`Failed to get backlinks: ${error.message}`);
  }

  return { data: { backlinks: data || [], count: data?.length || 0 }, error: null };
}

// =====================================================
// GRAPH DATA
// =====================================================

async function getGraphData(supabase: any, request: GetGraphDataRequest) {
  const { userId, filters = {} } = request;

  // Get all pages
  let pagesQuery = supabase
    .from('knowledge_pages')
    .select('id, title, slug, icon, source, created_at')
    .eq('user_id', userId)
    .eq('is_archived', false);

  if (filters.source && filters.source.length > 0) {
    pagesQuery = pagesQuery.in('source', filters.source);
  }

  if (filters.limit) {
    pagesQuery = pagesQuery.limit(filters.limit);
  }

  const { data: pages, error: pagesError } = await pagesQuery;

  if (pagesError) {
    throw new Error(`Failed to get pages: ${pagesError.message}`);
  }

  // Get all links
  const { data: links, error: linksError } = await supabase
    .from('knowledge_links')
    .select('id, source_page_id, target_page_id, link_text')
    .eq('user_id', userId);

  if (linksError) {
    throw new Error(`Failed to get links: ${linksError.message}`);
  }

  // Compute link counts for node sizing
  const linkCounts: Record<string, number> = {};
  links.forEach((link: any) => {
    linkCounts[link.source_page_id] = (linkCounts[link.source_page_id] || 0) + 1;
    linkCounts[link.target_page_id] = (linkCounts[link.target_page_id] || 0) + 1;
  });

  // Filter pages if connected_to specified
  let filteredPages = pages;
  if (filters.connected_to) {
    const connectedPageIds = new Set<string>();
    connectedPageIds.add(filters.connected_to);

    links.forEach((link: any) => {
      if (link.source_page_id === filters.connected_to) {
        connectedPageIds.add(link.target_page_id);
      }
      if (link.target_page_id === filters.connected_to) {
        connectedPageIds.add(link.source_page_id);
      }
    });

    filteredPages = pages.filter((p: any) => connectedPageIds.has(p.id));
  }

  // Format nodes for graph visualization
  const nodes = filteredPages.map((page: any) => ({
    id: page.id,
    label: page.title,
    slug: page.slug,
    icon: page.icon,
    size: Math.max(5, (linkCounts[page.id] || 0) * 2),
    source: page.source,
    created_at: page.created_at,
  }));

  // Format edges for graph visualization
  const pageIds = new Set(filteredPages.map((p: any) => p.id));
  const edges = links
    .filter((link: any) => pageIds.has(link.source_page_id) && pageIds.has(link.target_page_id))
    .map((link: any) => ({
      id: link.id,
      source: link.source_page_id,
      target: link.target_page_id,
      label: link.link_text,
    }));

  // Compute stats
  const stats = {
    total_pages: nodes.length,
    total_links: edges.length,
    avg_connections: edges.length > 0 ? (edges.length * 2) / nodes.length : 0,
  };

  return {
    data: {
      nodes,
      edges,
      stats,
    },
    error: null,
  };
}

