-- =====================================================
-- Knowledge Graph System - Database Schema
-- =====================================================
-- This migration creates the database structure for a 
-- LogSeq-inspired knowledge graph system with pages,
-- bidirectional links, and attachments.
--
-- Tables:
-- 1. knowledge_pages - Individual pages/documents
-- 2. knowledge_links - Bidirectional links between pages
-- 3. knowledge_attachments - Files attached to pages
-- =====================================================

-- =====================================================
-- 1. KNOWLEDGE_PAGES TABLE
-- =====================================================
-- Replaces the concept of "files" with "pages"
-- Each page represents a document/concept in the graph

CREATE TABLE IF NOT EXISTS knowledge_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content fields
  title TEXT NOT NULL,
  slug TEXT NOT NULL, -- URL-friendly version of title (lowercase, hyphens)
  content TEXT, -- Full markdown content
  preview TEXT, -- First 200 chars for search/preview
  icon TEXT, -- Optional emoji icon
  
  -- Source tracking
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'whatsapp', 'upload')),
  source_metadata JSONB DEFAULT '{}'::jsonb, -- buffer_id, conversation_id, original_file_id, etc
  
  -- Metadata
  page_properties JSONB DEFAULT '{}'::jsonb, -- tags, custom fields, AI metadata
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_opened_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Constraints
  UNIQUE(user_id, slug)
);

-- Indexes for performance
CREATE INDEX idx_knowledge_pages_user_id ON knowledge_pages(user_id);
CREATE INDEX idx_knowledge_pages_slug ON knowledge_pages(user_id, slug);
CREATE INDEX idx_knowledge_pages_source ON knowledge_pages(source);
CREATE INDEX idx_knowledge_pages_created ON knowledge_pages(created_at DESC);
CREATE INDEX idx_knowledge_pages_updated ON knowledge_pages(updated_at DESC);
CREATE INDEX idx_knowledge_pages_archived ON knowledge_pages(is_archived) WHERE is_archived = FALSE;

-- Full-text search indexes
CREATE INDEX idx_knowledge_pages_title_search ON knowledge_pages 
  USING gin(to_tsvector('english', title));
CREATE INDEX idx_knowledge_pages_content_search ON knowledge_pages 
  USING gin(to_tsvector('english', COALESCE(content, '')));

-- JSONB indexes for querying properties
CREATE INDEX idx_knowledge_pages_properties ON knowledge_pages 
  USING gin(page_properties);
CREATE INDEX idx_knowledge_pages_source_metadata ON knowledge_pages 
  USING gin(source_metadata);

-- Comments for documentation
COMMENT ON TABLE knowledge_pages IS 'Individual pages/documents in the knowledge graph';
COMMENT ON COLUMN knowledge_pages.slug IS 'URL-friendly identifier generated from title';
COMMENT ON COLUMN knowledge_pages.source IS 'How the page was created: manual, whatsapp, or upload';
COMMENT ON COLUMN knowledge_pages.source_metadata IS 'Metadata about the source (buffer_id, conversation_id, etc)';
COMMENT ON COLUMN knowledge_pages.page_properties IS 'Custom properties, tags, and AI-generated metadata';

-- =====================================================
-- 2. KNOWLEDGE_LINKS TABLE
-- =====================================================
-- Bidirectional links between pages (like [[page-name]])

CREATE TABLE IF NOT EXISTS knowledge_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Link relationship
  source_page_id UUID NOT NULL REFERENCES knowledge_pages(id) ON DELETE CASCADE,
  target_page_id UUID NOT NULL REFERENCES knowledge_pages(id) ON DELETE CASCADE,
  
  -- Link metadata
  link_text TEXT, -- Text used in the link [[link_text]]
  link_context TEXT, -- Surrounding paragraph/context where link appears
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'manual' CHECK (created_by IN ('manual', 'ai_agent')),
  
  -- Prevent duplicate links
  UNIQUE(source_page_id, target_page_id, link_text)
);

-- Indexes for fast backlink queries
CREATE INDEX idx_knowledge_links_source ON knowledge_links(source_page_id);
CREATE INDEX idx_knowledge_links_target ON knowledge_links(target_page_id);
CREATE INDEX idx_knowledge_links_user ON knowledge_links(user_id);
CREATE INDEX idx_knowledge_links_created_by ON knowledge_links(created_by);

-- Composite index for graph traversal
CREATE INDEX idx_knowledge_links_source_target ON knowledge_links(source_page_id, target_page_id);

-- Comments
COMMENT ON TABLE knowledge_links IS 'Bidirectional links between pages in the knowledge graph';
COMMENT ON COLUMN knowledge_links.link_text IS 'The text used inside [[...]] brackets';
COMMENT ON COLUMN knowledge_links.link_context IS 'Context where the link appears for preview';
COMMENT ON COLUMN knowledge_links.created_by IS 'Whether link was created manually or by AI agent';

-- =====================================================
-- 3. KNOWLEDGE_ATTACHMENTS TABLE
-- =====================================================
-- Files attached to pages (images, PDFs, audio, etc)

CREATE TABLE IF NOT EXISTS knowledge_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES knowledge_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- File information
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'pdf', 'audio', 'video', 'document')),
  mime_type TEXT,
  file_size BIGINT,
  
  -- Storage
  gcs_bucket TEXT,
  gcs_path TEXT,
  
  -- Preview/thumbnails
  thumbnail_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_knowledge_attachments_page ON knowledge_attachments(page_id);
CREATE INDEX idx_knowledge_attachments_user ON knowledge_attachments(user_id);
CREATE INDEX idx_knowledge_attachments_type ON knowledge_attachments(file_type);
CREATE INDEX idx_knowledge_attachments_gcs_path ON knowledge_attachments(gcs_path);

-- Comments
COMMENT ON TABLE knowledge_attachments IS 'Files and media attached to knowledge pages';
COMMENT ON COLUMN knowledge_attachments.gcs_path IS 'Path in Google Cloud Storage bucket';

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE knowledge_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_attachments ENABLE ROW LEVEL SECURITY;

-- ===== KNOWLEDGE_PAGES POLICIES =====

CREATE POLICY "Users can view their own pages" 
  ON knowledge_pages
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pages" 
  ON knowledge_pages
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pages" 
  ON knowledge_pages
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pages" 
  ON knowledge_pages
  FOR DELETE 
  USING (auth.uid() = user_id);

-- ===== KNOWLEDGE_LINKS POLICIES =====

CREATE POLICY "Users can view their own links" 
  ON knowledge_links
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own links" 
  ON knowledge_links
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own links" 
  ON knowledge_links
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own links" 
  ON knowledge_links
  FOR DELETE 
  USING (auth.uid() = user_id);

-- ===== KNOWLEDGE_ATTACHMENTS POLICIES =====

CREATE POLICY "Users can view their own attachments" 
  ON knowledge_attachments
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own attachments" 
  ON knowledge_attachments
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attachments" 
  ON knowledge_attachments
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attachments" 
  ON knowledge_attachments
  FOR DELETE 
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION generate_slug IS 'Converts a title to a URL-friendly slug';

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on knowledge_pages
CREATE TRIGGER update_knowledge_pages_updated_at
  BEFORE UPDATE ON knowledge_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-generate slug if not provided
CREATE OR REPLACE FUNCTION auto_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug = generate_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug on insert/update
CREATE TRIGGER auto_slug_on_knowledge_pages
  BEFORE INSERT OR UPDATE ON knowledge_pages
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_slug();

-- Function to auto-generate preview from content
CREATE OR REPLACE FUNCTION auto_generate_preview()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content IS NOT NULL AND NEW.content != '' THEN
    NEW.preview = LEFT(NEW.content, 200);
  ELSIF NEW.title IS NOT NULL THEN
    NEW.preview = NEW.title;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate preview
CREATE TRIGGER auto_preview_on_knowledge_pages
  BEFORE INSERT OR UPDATE ON knowledge_pages
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_preview();

-- =====================================================
-- 6. UTILITY VIEWS
-- =====================================================

-- View for pages with link counts
CREATE OR REPLACE VIEW knowledge_pages_with_stats AS
SELECT 
  p.*,
  COALESCE(outgoing.count, 0) AS outgoing_links_count,
  COALESCE(incoming.count, 0) AS incoming_links_count,
  COALESCE(outgoing.count, 0) + COALESCE(incoming.count, 0) AS total_links_count,
  COALESCE(attachments.count, 0) AS attachments_count
FROM knowledge_pages p
LEFT JOIN (
  SELECT source_page_id, COUNT(*) as count
  FROM knowledge_links
  GROUP BY source_page_id
) outgoing ON p.id = outgoing.source_page_id
LEFT JOIN (
  SELECT target_page_id, COUNT(*) as count
  FROM knowledge_links
  GROUP BY target_page_id
) incoming ON p.id = incoming.target_page_id
LEFT JOIN (
  SELECT page_id, COUNT(*) as count
  FROM knowledge_attachments
  GROUP BY page_id
) attachments ON p.id = attachments.page_id;

COMMENT ON VIEW knowledge_pages_with_stats IS 'Pages with computed statistics (link counts, attachment counts)';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Knowledge Graph schema created successfully!';
  RAISE NOTICE 'Tables created: knowledge_pages, knowledge_links, knowledge_attachments';
  RAISE NOTICE 'RLS policies enabled for all tables';
  RAISE NOTICE 'Helper functions and triggers created';
  RAISE NOTICE 'Ready for data migration from knowledge_files';
END $$;

