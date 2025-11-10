-- =====================================================
-- Azami Agent - Database Schema
-- =====================================================
-- This migration creates the database structure for the
-- Azami Agent, a librarian system that processes user contexts
-- and identifies semantic relations between them.
-- =====================================================

-- =====================================================
-- 1. AZAMI_CONTEXTS TABLE
-- =====================================================
-- Stores context files (equivalent to .md pages)
CREATE TABLE IF NOT EXISTS azami_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identificação
  title TEXT NOT NULL,
  slug TEXT NOT NULL, -- URL-friendly do título
  
  -- Conteúdo
  content TEXT NOT NULL, -- Conteúdo markdown completo
  preview TEXT, -- Primeiros 200 caracteres para preview
  
  -- Metadata
  source_type TEXT NOT NULL CHECK (source_type IN ('whatsapp_audio', 'whatsapp_text', 'whatsapp_link', 'whatsapp_file')),
  source_metadata JSONB DEFAULT '{}'::jsonb, -- buffer_id, message_ids, conversation_id, etc
  
  -- Processamento
  processed_at TIMESTAMP WITH TIME ZONE,
  relations_analyzed BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, slug)
);

-- =====================================================
-- 2. AZAMI_RELATIONS TABLE
-- =====================================================
-- Links "see also" entre contextos
CREATE TABLE IF NOT EXISTS azami_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Relação
  source_context_id UUID NOT NULL REFERENCES azami_contexts(id) ON DELETE CASCADE,
  target_context_id UUID NOT NULL REFERENCES azami_contexts(id) ON DELETE CASCADE,
  
  -- Análise LLM
  relation_type TEXT, -- 'semantic', 'topical', 'temporal', 'referential'
  relation_strength DECIMAL(3,2) DEFAULT 0.5, -- 0.0 a 1.0
  relation_description TEXT, -- Descrição da relação pela LLM
  llm_analysis JSONB, -- Metadata completa da análise
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(source_context_id, target_context_id),
  CHECK (source_context_id != target_context_id)
);

-- =====================================================
-- 3. AZAMI_ATTACHMENTS TABLE
-- =====================================================
-- Arquivos referenciados (PDFs, imagens)
CREATE TABLE IF NOT EXISTS azami_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_id UUID NOT NULL REFERENCES azami_contexts(id) ON DELETE CASCADE,
  
  -- Arquivo
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT,
  storage_path TEXT,
  
  -- Conteúdo extraído
  content_extracted BOOLEAN DEFAULT FALSE,
  extracted_content TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. AZAMI_EXECUTIONS TABLE
-- =====================================================
-- Rastreamento de execuções do Azami
CREATE TABLE IF NOT EXISTS azami_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Execução
  execution_type TEXT NOT NULL CHECK (execution_type IN ('batch', 'manual')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  
  -- Processamento
  contexts_processed INTEGER DEFAULT 0,
  relations_found INTEGER DEFAULT 0,
  messages_analyzed INTEGER DEFAULT 0,
  
  -- Janela de tempo
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Resultado
  result JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Índices para azami_contexts
CREATE INDEX IF NOT EXISTS idx_azami_contexts_user_id ON azami_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_azami_contexts_slug ON azami_contexts(user_id, slug);
CREATE INDEX IF NOT EXISTS idx_azami_contexts_created_at ON azami_contexts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_azami_contexts_relations_analyzed ON azami_contexts(relations_analyzed) WHERE relations_analyzed = FALSE;

-- Índices para azami_relations (grafo)
CREATE INDEX IF NOT EXISTS idx_azami_relations_source ON azami_relations(source_context_id);
CREATE INDEX IF NOT EXISTS idx_azami_relations_target ON azami_relations(target_context_id);
CREATE INDEX IF NOT EXISTS idx_azami_relations_user ON azami_relations(user_id);
CREATE INDEX IF NOT EXISTS idx_azami_relations_strength ON azami_relations(relation_strength DESC);

-- Índices para azami_attachments
CREATE INDEX IF NOT EXISTS idx_azami_attachments_context ON azami_attachments(context_id);

-- Índices para azami_executions
CREATE INDEX IF NOT EXISTS idx_azami_executions_user ON azami_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_azami_executions_status ON azami_executions(status) WHERE status = 'running';
CREATE INDEX IF NOT EXISTS idx_azami_executions_window ON azami_executions(window_start, window_end);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- RLS para azami_contexts
ALTER TABLE azami_contexts ENABLE ROW LEVEL SECURITY;
CREATE POLICY azami_contexts_select ON azami_contexts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY azami_contexts_insert ON azami_contexts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY azami_contexts_update ON azami_contexts FOR UPDATE USING (auth.uid() = user_id);

-- RLS para azami_relations
ALTER TABLE azami_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY azami_relations_select ON azami_relations FOR SELECT USING (auth.uid() = user_id);

-- RLS para azami_attachments
ALTER TABLE azami_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY azami_attachments_select ON azami_attachments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM azami_contexts 
    WHERE azami_contexts.id = azami_attachments.context_id 
    AND azami_contexts.user_id = auth.uid()
  )
);

-- RLS para azami_executions
ALTER TABLE azami_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY azami_executions_select ON azami_executions FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_azami_contexts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_azami_contexts_updated_at
  BEFORE UPDATE ON azami_contexts
  FOR EACH ROW
  EXECUTE FUNCTION update_azami_contexts_updated_at();

-- Function to auto-generate slug from title
CREATE OR REPLACE FUNCTION auto_generate_azami_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.title IS NOT NULL AND (NEW.slug IS NULL OR NEW.slug = '') THEN
    NEW.slug = lower(regexp_replace(regexp_replace(NEW.title, '[àáâãäå]', 'a', 'gi'), '[^a-zA-Z0-9]+', '-', 'g'));
    -- Remove trailing hyphens
    NEW.slug = regexp_replace(NEW.slug, '-+$', '');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar slug automaticamente
CREATE TRIGGER trigger_auto_generate_azami_slug
  BEFORE INSERT OR UPDATE ON azami_contexts
  FOR EACH ROW
  WHEN (NEW.title IS NOT NULL)
  EXECUTE FUNCTION auto_generate_azami_slug();

-- Function to auto-generate preview from content
CREATE OR REPLACE FUNCTION auto_generate_azami_preview()
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

-- Trigger para gerar preview automaticamente
CREATE TRIGGER trigger_auto_generate_azami_preview
  BEFORE INSERT OR UPDATE ON azami_contexts
  FOR EACH ROW
  WHEN (NEW.content IS NOT NULL OR NEW.title IS NOT NULL)
  EXECUTE FUNCTION auto_generate_azami_preview();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE azami_contexts IS 'Context files (equivalent to .md pages) created by Azami Agent';
COMMENT ON TABLE azami_relations IS 'Semantic relations between contexts identified by LLM analysis';
COMMENT ON TABLE azami_attachments IS 'Files attached to contexts (PDFs, images, etc)';
COMMENT ON TABLE azami_executions IS 'Execution tracking for Azami Agent runs';

COMMENT ON COLUMN azami_contexts.slug IS 'URL-friendly version of title (lowercase, hyphens)';
COMMENT ON COLUMN azami_contexts.preview IS 'First 200 characters of content for preview/search';
COMMENT ON COLUMN azami_contexts.source_metadata IS 'Metadata about source (buffer_id, message_ids, conversation_id, manual_input, etc)';
COMMENT ON COLUMN azami_relations.relation_strength IS 'Strength of relation from 0.0 to 1.0';
COMMENT ON COLUMN azami_relations.relation_type IS 'Type of relation: semantic, topical, temporal, referential';

