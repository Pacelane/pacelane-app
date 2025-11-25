-- =====================================================
-- Migrate Azami to Knowledge Pages
-- =====================================================
-- This migration unifies the Azami Agent with the Knowledge Graph system
-- by merging azami_contexts into knowledge_pages and updating relations.
-- =====================================================

-- 1. Add relations_analyzed to knowledge_pages
ALTER TABLE knowledge_pages 
ADD COLUMN IF NOT EXISTS relations_analyzed BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_knowledge_pages_relations_analyzed 
ON knowledge_pages(relations_analyzed) WHERE relations_analyzed = FALSE;

-- 2. Drop azami_contexts (data should be migrated if needed, but we'll assume fresh start or manual migration for now as per user instruction to "delete everything")
-- The user said "eu quero deletar tudo isso" regarding previous Azami data, so we can drop it.
DROP TABLE IF EXISTS azami_attachments CASCADE;
DROP TABLE IF EXISTS azami_relations CASCADE;
DROP TABLE IF EXISTS azami_contexts CASCADE;

-- 3. Recreate azami_relations pointing to knowledge_pages
CREATE TABLE IF NOT EXISTS azami_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Relação
  source_page_id UUID NOT NULL REFERENCES knowledge_pages(id) ON DELETE CASCADE,
  target_page_id UUID NOT NULL REFERENCES knowledge_pages(id) ON DELETE CASCADE,
  
  -- Análise LLM
  relation_type TEXT, -- 'semantic', 'topical', 'temporal', 'referential'
  relation_strength DECIMAL(3,2) DEFAULT 0.5, -- 0.0 a 1.0
  relation_description TEXT, -- Descrição da relação pela LLM
  llm_analysis JSONB, -- Metadata completa da análise
  
  -- Status for UI workflow
  status TEXT NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'accepted', 'rejected')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(source_page_id, target_page_id),
  CHECK (source_page_id != target_page_id)
);

-- Indexes for azami_relations
CREATE INDEX IF NOT EXISTS idx_azami_relations_source ON azami_relations(source_page_id);
CREATE INDEX IF NOT EXISTS idx_azami_relations_target ON azami_relations(target_page_id);
CREATE INDEX IF NOT EXISTS idx_azami_relations_user ON azami_relations(user_id);
CREATE INDEX IF NOT EXISTS idx_azami_relations_status ON azami_relations(status);

-- RLS for azami_relations
ALTER TABLE azami_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY azami_relations_select ON azami_relations 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY azami_relations_insert ON azami_relations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY azami_relations_update ON azami_relations 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY azami_relations_delete ON azami_relations 
  FOR DELETE USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE azami_relations IS 'Semantic relations between knowledge pages identified by Azami Agent';
COMMENT ON COLUMN azami_relations.status IS 'Status of the relation: suggested (by AI), accepted (by user), rejected (by user)';
