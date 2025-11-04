-- =====================================================
-- Knowledge Graph - Search Helper Function
-- =====================================================
-- Creates a PostgreSQL function for full-text search
-- on knowledge_pages
-- =====================================================

CREATE OR REPLACE FUNCTION search_knowledge_pages(
  p_user_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  slug TEXT,
  content TEXT,
  preview TEXT,
  icon TEXT,
  source TEXT,
  source_metadata JSONB,
  page_properties JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  last_opened_at TIMESTAMP WITH TIME ZONE,
  is_archived BOOLEAN,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kp.id,
    kp.user_id,
    kp.title,
    kp.slug,
    kp.content,
    kp.preview,
    kp.icon,
    kp.source,
    kp.source_metadata,
    kp.page_properties,
    kp.created_at,
    kp.updated_at,
    kp.last_opened_at,
    kp.is_archived,
    ts_rank(
      to_tsvector('english', kp.title || ' ' || COALESCE(kp.content, '')),
      to_tsquery('english', p_query)
    ) as rank
  FROM knowledge_pages kp
  WHERE kp.user_id = p_user_id
    AND kp.is_archived = FALSE
    AND to_tsvector('english', kp.title || ' ' || COALESCE(kp.content, ''))
        @@ to_tsquery('english', p_query)
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_knowledge_pages IS 'Full-text search on knowledge pages with ranking';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_knowledge_pages TO authenticated;

