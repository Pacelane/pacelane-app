/**
 * TypeScript types for Knowledge Graph System
 * Corresponds to Supabase tables: knowledge_pages, knowledge_links, knowledge_attachments
 */

// =====================================================
// KNOWLEDGE PAGES
// =====================================================

export type PageSource = 'manual' | 'whatsapp' | 'upload';

export interface KnowledgePage {
  id: string;
  user_id: string;
  
  // Content
  title: string;
  slug: string;
  content: string | null;
  preview: string | null;
  icon: string | null;
  
  // Source tracking
  source: PageSource;
  source_metadata: PageSourceMetadata;
  
  // Properties
  page_properties: PageProperties;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_opened_at: string | null;
  
  // Status
  is_archived: boolean;
}

export interface PageSourceMetadata {
  // For pages from WhatsApp
  buffer_id?: string;
  conversation_id?: number;
  message_count?: number;
  time_span_seconds?: number;
  processed_at?: string;
  
  // For pages from file uploads
  original_file_id?: string;
  file_type?: string;
  gcs_bucket?: string;
  gcs_path?: string;
  file_hash?: string;
  original_url?: string;
  file_size?: number;
  content_extracted?: boolean;
  extraction_metadata?: any;
  original_metadata?: any;
  transcription_status?: string;
  transcribed_at?: string;
  
  // Extensible for future sources
  [key: string]: any;
}

export interface PageProperties {
  // Common properties
  tags?: string[];
  custom_fields?: Record<string, any>;
  
  // AI-generated metadata (future)
  ai_metadata?: {
    extracted_concepts?: string[];
    suggested_links?: string[];
    embedding_generated?: boolean;
    sentiment?: string;
    [key: string]: any;
  };
  
  // From migration
  file_type?: string;
  has_attachment?: boolean;
  migrated_from_knowledge_files?: boolean;
  migrated_at?: string;
  
  // Extensible
  [key: string]: any;
}

// For creating new pages
export interface CreatePageInput {
  title: string;
  content?: string;
  icon?: string;
  source?: PageSource;
  source_metadata?: Partial<PageSourceMetadata>;
  page_properties?: Partial<PageProperties>;
}

// For updating pages
export interface UpdatePageInput {
  title?: string;
  content?: string;
  icon?: string;
  page_properties?: Partial<PageProperties>;
  is_archived?: boolean;
}

// Page with computed statistics
export interface PageWithStats extends KnowledgePage {
  outgoing_links_count: number;
  incoming_links_count: number;
  total_links_count: number;
  attachments_count: number;
}

// =====================================================
// KNOWLEDGE LINKS
// =====================================================

export type LinkCreatedBy = 'manual' | 'ai_agent';

export interface KnowledgeLink {
  id: string;
  user_id: string;
  
  // Relationship
  source_page_id: string;
  target_page_id: string;
  
  // Metadata
  link_text: string | null;
  link_context: string | null;
  
  // Tracking
  created_at: string;
  created_by: LinkCreatedBy;
}

// For creating links
export interface CreateLinkInput {
  source_page_id: string;
  target_page_id: string;
  link_text?: string;
  link_context?: string;
  created_by?: LinkCreatedBy;
}

// Link with page information (for backlinks display)
export interface LinkWithPage extends KnowledgeLink {
  source_page?: Pick<KnowledgePage, 'id' | 'title' | 'slug' | 'icon' | 'preview'>;
  target_page?: Pick<KnowledgePage, 'id' | 'title' | 'slug' | 'icon' | 'preview'>;
}

// =====================================================
// KNOWLEDGE ATTACHMENTS
// =====================================================

export type AttachmentType = 'image' | 'pdf' | 'audio' | 'video' | 'document';

export interface KnowledgeAttachment {
  id: string;
  page_id: string;
  user_id: string;
  
  // File info
  filename: string;
  file_type: AttachmentType;
  mime_type: string | null;
  file_size: number | null;
  
  // Storage
  gcs_bucket: string | null;
  gcs_path: string | null;
  
  // Preview
  thumbnail_url: string | null;
  
  // Timestamp
  created_at: string;
}

// For creating attachments
export interface CreateAttachmentInput {
  page_id: string;
  filename: string;
  file_type: AttachmentType;
  mime_type?: string;
  file_size?: number;
  gcs_bucket?: string;
  gcs_path?: string;
  thumbnail_url?: string;
}

// =====================================================
// GRAPH VISUALIZATION
// =====================================================

// Node for graph visualization
export interface GraphNode {
  id: string;
  label: string;
  slug: string;
  size: number; // Based on number of connections
  source: PageSource;
  created_at: string;
  icon?: string;
  
  // For visual customization
  color?: string;
  x?: number;
  y?: number;
}

// Edge for graph visualization
export interface GraphEdge {
  id: string;
  source: string; // page_id
  target: string; // page_id
  label?: string;
  
  // For visual customization
  color?: string;
  width?: number;
}

// Complete graph data
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// =====================================================
// API RESPONSES
// =====================================================

export interface ListPagesResponse {
  pages: KnowledgePage[];
  total: number;
  page: number;
  per_page: number;
}

export interface SuggestedLink {
  id: string;
  source_page_id: string;
  target_page_id: string;
  relation_type: string;
  relation_strength: number;
  relation_description: string;
  status: 'suggested' | 'accepted' | 'rejected';
  source_page?: KnowledgePage;
  target_page?: KnowledgePage;
}

export interface GetPageResponse {
  page: KnowledgePage;
  content: string;
  backlinks: LinkWithPage[];
  suggested_links: SuggestedLink[];
  attachments: KnowledgeAttachment[];
}

export interface SearchPagesResponse {
  pages: KnowledgePage[];
  total: number;
}

export interface GetGraphDataResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    total_pages: number;
    total_links: number;
    avg_connections: number;
  };
}

export interface ParseLinksResponse {
  links: KnowledgeLink[];
  count: number;
  created_pages: KnowledgePage[]; // Pages that were auto-created
}

// =====================================================
// FILTERS AND SORTING
// =====================================================

export interface PageFilters {
  source?: PageSource | PageSource[];
  is_archived?: boolean;
  has_links?: boolean;
  tags?: string[];
  created_after?: string;
  created_before?: string;
}

export type PageSortBy = 
  | 'created_at' 
  | 'updated_at' 
  | 'title' 
  | 'last_opened_at'
  | 'total_links';

export type SortOrder = 'asc' | 'desc';

export interface PageSortOptions {
  sort_by: PageSortBy;
  order: SortOrder;
}

// =====================================================
// ERROR TYPES
// =====================================================

export interface KnowledgeGraphError {
  error: string;
  details?: string;
  code?: string;
}

