-- =====================================================
-- SIMPLE MIGRATION: knowledge_files → knowledge_pages
-- For manual uploads with extracted content
-- =====================================================

-- First, let's see what we're working with
DO $$
BEGIN
  RAISE NOTICE '=== STARTING MIGRATION ===';
  RAISE NOTICE 'Total files: %', (SELECT COUNT(*) FROM knowledge_files);
  RAISE NOTICE 'Files with extracted content: %', (SELECT COUNT(*) FROM knowledge_files WHERE extracted_content IS NOT NULL);
END $$;

-- =====================================================
-- Step 1: Migrate manual uploads to knowledge_pages
-- =====================================================

INSERT INTO knowledge_pages (
  id, -- Preserve original ID for easier tracking
  user_id,
  title,
  slug,
  content,
  preview,
  source,
  page_properties,
  created_at,
  updated_at
)
SELECT 
  kf.id,
  kf.user_id,
  
  -- Title: use filename
  kf.name AS title,
  
  -- Slug: sanitize filename
  LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(kf.name, '[^a-zA-Z0-9\s-]', '', 'g'), 
      '\s+', 
      '-', 
      'g'
    )
  ) AS slug,
  
  -- Content: extracted text or placeholder
  CASE 
    WHEN kf.extracted_content IS NOT NULL AND kf.extracted_content != '' 
      THEN kf.extracted_content
    WHEN kf.transcription IS NOT NULL AND kf.transcription != ''
      THEN '## 🎤 Audio Transcription\n\n' || kf.transcription
    ELSE 'Content is being processed...'
  END AS content,
  
  -- Preview: first 200 chars
  LEFT(
    COALESCE(
      kf.extracted_content, 
      kf.transcription, 
      kf.name
    ), 
    200
  ) AS preview,
  
  -- Source: upload (manual) or link
  CASE 
    WHEN kf.type = 'link' THEN 'link'
    ELSE 'upload'
  END AS source,
  
  -- Page properties: preserve all original metadata
  jsonb_build_object(
    'original_file_type', kf.type,
    'original_file_size', kf.size,
    'original_url', kf.url,
    'original_storage_path', kf.storage_path,
    'original_gcs_bucket', kf.gcs_bucket,
    'original_gcs_path', kf.gcs_path,
    'original_file_hash', kf.file_hash,
    'extraction_metadata', kf.extraction_metadata,
    'transcription_status', kf.transcription_status,
    'transcription_error', kf.transcription_error,
    'transcribed_at', kf.transcribed_at,
    'metadata', kf.metadata
  ) AS page_properties,
  
  kf.created_at,
  kf.updated_at

FROM knowledge_files kf
ON CONFLICT (id) DO NOTHING;

-- Log results
DO $$
BEGIN
  RAISE NOTICE '=== PAGES CREATED ===';
  RAISE NOTICE 'Total pages: %', (SELECT COUNT(*) FROM knowledge_pages);
END $$;

-- =====================================================
-- Step 2: Create attachments for binary files
-- =====================================================

INSERT INTO knowledge_attachments (
  page_id,
  user_id,
  filename,
  file_type,
  mime_type,
  file_size,
  gcs_bucket,
  gcs_path,
  thumbnail_url,
  created_at
)
SELECT 
  kf.id AS page_id, -- Page has same ID as original file
  kf.user_id,
  kf.name AS filename,
  -- Map knowledge_files.type to knowledge_attachments.file_type
  CASE kf.type
    WHEN 'file' THEN 'document' -- Map 'file' to 'document'
    WHEN 'image' THEN 'image'
    WHEN 'audio' THEN 'audio'
    WHEN 'video' THEN 'video'
    ELSE 'document' -- Default fallback
  END AS file_type,
  COALESCE(
    kf.metadata->>'mime_type',
    CASE kf.type
      WHEN 'image' THEN 'image/jpeg'
      WHEN 'audio' THEN 'audio/mpeg'
      WHEN 'video' THEN 'video/mp4'
      WHEN 'file' THEN 'application/pdf'
      ELSE 'application/octet-stream'
    END
  ) AS mime_type,
  kf.size AS file_size,
  kf.gcs_bucket,
  kf.gcs_path,
  kf.url AS thumbnail_url,
  kf.created_at

FROM knowledge_files kf
WHERE kf.type IN ('image', 'audio', 'video', 'file')
  AND kf.gcs_path IS NOT NULL
ON CONFLICT DO NOTHING;

-- Log results
DO $$
BEGIN
  RAISE NOTICE '=== ATTACHMENTS CREATED ===';
  RAISE NOTICE 'Total attachments: %', (SELECT COUNT(*) FROM knowledge_attachments);
END $$;

-- =====================================================
-- Step 3: Verification
-- =====================================================

DO $$
DECLARE
  v_files_count INT;
  v_pages_count INT;
  v_attachments_count INT;
BEGIN
  SELECT COUNT(*) INTO v_files_count FROM knowledge_files;
  SELECT COUNT(*) INTO v_pages_count FROM knowledge_pages;
  SELECT COUNT(*) INTO v_attachments_count FROM knowledge_attachments;
  
  RAISE NOTICE '=== MIGRATION COMPLETE ===';
  RAISE NOTICE 'Original files: %', v_files_count;
  RAISE NOTICE 'Pages created: %', v_pages_count;
  RAISE NOTICE 'Attachments created: %', v_attachments_count;
  
  IF v_pages_count = v_files_count THEN
    RAISE NOTICE '✅ SUCCESS: All files migrated to pages';
  ELSE
    RAISE WARNING '⚠️  Mismatch: % files vs % pages', v_files_count, v_pages_count;
  END IF;
END $$;

-- Sample the results
SELECT 
  'MIGRATED PAGES' as info,
  id,
  title,
  slug,
  source,
  LENGTH(content) as content_length,
  created_at
FROM knowledge_pages
ORDER BY created_at DESC
LIMIT 5;

SELECT 
  'ATTACHMENTS' as info,
  ka.id,
  ka.filename,
  ka.file_type,
  ka.file_size,
  kp.title as page_title
FROM knowledge_attachments ka
JOIN knowledge_pages kp ON kp.id = ka.page_id
ORDER BY ka.created_at DESC
LIMIT 5;

