-- =====================================================
-- Knowledge Graph Data Migration
-- =====================================================
-- Migrates existing knowledge_files to knowledge_pages
-- Preserves all data and metadata
-- Creates attachments for binary files
-- =====================================================

-- =====================================================
-- 1. MIGRATE FILES TO PAGES
-- =====================================================

DO $$
DECLARE
  migrated_count INTEGER := 0;
  attachment_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting migration of knowledge_files to knowledge_pages...';
  
  -- Insert pages from files that have extracted content
  INSERT INTO knowledge_pages (
    user_id,
    title,
    slug,
    content,
    preview,
    source,
    source_metadata,
    created_at,
    updated_at
  )
  SELECT 
    kf.user_id,
    kf.name AS title,
    -- Generate slug from name
    lower(
      regexp_replace(
        regexp_replace(kf.name, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      )
    ) AS slug,
    -- Use extracted content or placeholder
    COALESCE(
      kf.extracted_content,
      CASE 
        WHEN kf.type = 'link' THEN 'Link: ' || COALESCE(kf.url, '')
        WHEN kf.type = 'audio' THEN COALESCE(kf.transcription, 'Audio file (transcription pending)')
        ELSE 'Content being processed...'
      END
    ) AS content,
    -- Generate preview
    LEFT(
      COALESCE(
        kf.extracted_content,
        kf.transcription,
        kf.name
      ),
      200
    ) AS preview,
    -- Map source
    CASE 
      WHEN kf.metadata->>'source' = 'whatsapp' THEN 'whatsapp'::TEXT
      WHEN kf.metadata->>'source' = 'whatsapp_text' THEN 'whatsapp'::TEXT
      WHEN kf.metadata->>'source' = 'whatsapp_audio' THEN 'whatsapp'::TEXT
      WHEN kf.metadata->>'source' = 'whatsapp_buffer_summary' THEN 'whatsapp'::TEXT
      ELSE 'upload'::TEXT
    END AS source,
    -- Preserve original metadata
    jsonb_build_object(
      'original_file_id', kf.id::TEXT,
      'file_type', kf.type,
      'gcs_bucket', kf.gcs_bucket,
      'gcs_path', kf.gcs_path,
      'file_hash', kf.file_hash,
      'original_url', kf.url,
      'file_size', kf.size,
      'content_extracted', kf.content_extracted,
      'extraction_metadata', kf.extraction_metadata,
      'original_metadata', kf.metadata,
      'transcription_status', kf.transcription_status,
      'transcribed_at', kf.transcribed_at
    ) AS source_metadata,
    kf.created_at,
    kf.updated_at
  FROM knowledge_files kf
  -- Only migrate files we haven't migrated yet
  WHERE NOT EXISTS (
    SELECT 1 FROM knowledge_pages kp 
    WHERE kp.source_metadata->>'original_file_id' = kf.id::TEXT
  )
  -- Handle potential slug conflicts by adding suffix
  ON CONFLICT (user_id, slug) DO UPDATE
  SET slug = EXCLUDED.slug || '-' || substr(md5(random()::text), 1, 8);
  
  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % files to pages', migrated_count;
  
  -- =====================================================
  -- 2. CREATE ATTACHMENTS FOR BINARY FILES
  -- =====================================================
  
  -- For files that are images, audio, video, or documents,
  -- create attachment records linked to their pages
  INSERT INTO knowledge_attachments (
    page_id,
    user_id,
    filename,
    file_type,
    mime_type,
    file_size,
    gcs_bucket,
    gcs_path,
    created_at
  )
  SELECT 
    kp.id AS page_id,
    kf.user_id,
    kf.name AS filename,
    -- Map file types
    CASE 
      WHEN kf.type = 'image' THEN 'image'::TEXT
      WHEN kf.type = 'audio' THEN 'audio'::TEXT
      WHEN kf.type = 'video' THEN 'video'::TEXT
      WHEN kf.type IN ('file', 'document') THEN 'document'::TEXT
      ELSE 'document'::TEXT
    END AS file_type,
    COALESCE(kf.metadata->>'mime_type', 'application/octet-stream') AS mime_type,
    kf.size AS file_size,
    kf.gcs_bucket,
    kf.gcs_path,
    kf.created_at
  FROM knowledge_files kf
  JOIN knowledge_pages kp ON kp.source_metadata->>'original_file_id' = kf.id::TEXT
  WHERE kf.type IN ('image', 'audio', 'video', 'file', 'document')
    AND kf.gcs_path IS NOT NULL
    -- Don't create duplicates
    AND NOT EXISTS (
      SELECT 1 FROM knowledge_attachments ka
      WHERE ka.page_id = kp.id AND ka.gcs_path = kf.gcs_path
    );
  
  GET DIAGNOSTICS attachment_count = ROW_COUNT;
  RAISE NOTICE 'Created % attachment records', attachment_count;
  
  -- =====================================================
  -- 3. ENRICH PAGE PROPERTIES FROM METADATA
  -- =====================================================
  
  -- Add tags and properties from original metadata
  UPDATE knowledge_pages kp
  SET page_properties = jsonb_build_object(
    'tags', COALESCE(
      CASE 
        WHEN kp.source = 'whatsapp' THEN jsonb_build_array('whatsapp', 'inbox')
        ELSE jsonb_build_array('imported')
      END,
      '[]'::jsonb
    ),
    'file_type', kp.source_metadata->>'file_type',
    'has_attachment', EXISTS(
      SELECT 1 FROM knowledge_attachments ka WHERE ka.page_id = kp.id
    ),
    'migrated_from_knowledge_files', true,
    'migrated_at', NOW()
  )
  WHERE kp.source_metadata->>'original_file_id' IS NOT NULL
    AND (kp.page_properties IS NULL OR kp.page_properties = '{}'::jsonb);
  
  RAISE NOTICE 'Enriched page properties';
  
  -- =====================================================
  -- 4. MIGRATION SUMMARY
  -- =====================================================
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Pages created: %', migrated_count;
  RAISE NOTICE 'Attachments created: %', attachment_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify data in knowledge_pages table';
  RAISE NOTICE '2. Test RLS policies';
  RAISE NOTICE '3. Deploy knowledge-graph edge function';
  RAISE NOTICE '4. Update frontend to use new tables';
  RAISE NOTICE '==========================================';
  
END $$;

-- =====================================================
-- 5. CREATE VERIFICATION QUERIES
-- =====================================================

-- Query to verify migration
DO $$
DECLARE
  total_files INTEGER;
  total_pages INTEGER;
  total_attachments INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_files FROM knowledge_files;
  SELECT COUNT(*) INTO total_pages FROM knowledge_pages;
  SELECT COUNT(*) INTO total_attachments FROM knowledge_attachments;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Verification:';
  RAISE NOTICE '- knowledge_files: % records', total_files;
  RAISE NOTICE '- knowledge_pages: % records', total_pages;
  RAISE NOTICE '- knowledge_attachments: % records', total_attachments;
END $$;

