/**
 * Knowledge Graph API Layer
 * Communicates with the knowledge-graph edge function
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  KnowledgePage,
  CreatePageInput,
  UpdatePageInput,
  ListPagesResponse,
  SearchPagesResponse,
  GetPageResponse,
  GetGraphDataResponse,
  ParseLinksResponse,
  PageFilters,
  PageSortOptions,
} from '@/types/knowledgeGraph';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/knowledge-graph`;

async function callEdgeFunction(action: string, body: any = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action,
      ...body,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const knowledgeGraphApi = {
  // ==================== PAGES ====================
  
  async createPage(input: CreatePageInput): Promise<{ data: KnowledgePage; error: null }> {
    return callEdgeFunction('create-page', input);
  },

  async updatePage(pageId: string, updates: UpdatePageInput): Promise<{ data: KnowledgePage; error: null }> {
    return callEdgeFunction('update-page', { pageId, ...updates });
  },

  async deletePage(pageId: string): Promise<{ data: { id: string; deleted: boolean }; error: null }> {
    return callEdgeFunction('delete-page', { pageId });
  },

  async getPage(pageId: string): Promise<GetPageResponse> {
    return callEdgeFunction('get-page', { pageId });
  },

  async listPages(
    page: number = 1,
    per_page: number = 50,
    filters?: PageFilters,
    sort?: PageSortOptions
  ): Promise<ListPagesResponse> {
    const result = await callEdgeFunction('list-pages', {
      page,
      per_page,
      filters,
      ...(sort && { sort_by: sort.sort_by, order: sort.order }),
    });
    return result.data;
  },

  async searchPages(query: string, limit: number = 20): Promise<SearchPagesResponse> {
    const result = await callEdgeFunction('search-pages', { query, limit });
    return result.data;
  },

  // ==================== LINKS ====================

  async parseLinks(pageId: string, content: string): Promise<ParseLinksResponse> {
    const result = await callEdgeFunction('parse-links', { pageId, content });
    return result.data;
  },

  async getBacklinks(pageId: string) {
    const result = await callEdgeFunction('get-backlinks', { pageId });
    return result.data;
  },

  // ==================== GRAPH ====================

  async getGraphData(filters?: {
    connected_to?: string;
    source?: string[];
    limit?: number;
  }): Promise<GetGraphDataResponse> {
    const result = await callEdgeFunction('get-graph-data', { filters });
    return result.data;
  },
};

