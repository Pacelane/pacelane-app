-- =====================================================
-- KNOWLEDGE FILES ANALYSIS
-- Run this locally to understand the existing data structure
-- =====================================================

-- 1. Count files by type
SELECT 
  type,
  COUNT(*) as count,
  SUM(CASE WHEN transcription IS NOT NULL THEN 1 ELSE 0 END) as has_transcription,
  SUM(CASE WHEN extracted_content IS NOT NULL THEN 1 ELSE 0 END) as has_extracted_content
FROM knowledge_files
GROUP BY type
ORDER BY count DESC;

-- 2. Check metadata structure (WhatsApp vs manual uploads)
SELECT 
  type,
  metadata->>'source' as source,
  metadata->>'buffer_id' as buffer_id,
  COUNT(*) as count
FROM knowledge_files
GROUP BY type, metadata->>'source', metadata->>'buffer_id'
ORDER BY count DESC;

-- 3. Sample audio files with transcription
SELECT 
  id,
  name,
  type,
  transcription_status,
  LENGTH(transcription) as transcription_length,
  LENGTH(extracted_content) as extracted_content_length,
  metadata
FROM knowledge_files
WHERE type = 'audio'
LIMIT 5;

-- 4. Sample text/PDFs with extracted content
SELECT 
  id,
  name,
  type,
  content_extracted,
  LENGTH(extracted_content) as content_length,
  metadata
FROM knowledge_files
WHERE type IN ('file', 'link')
LIMIT 5;

-- 5. Check for grouped files (same buffer_id)
SELECT 
  metadata->>'buffer_id' as buffer_id,
  COUNT(*) as files_in_buffer,
  STRING_AGG(DISTINCT type, ', ') as file_types,
  MIN(created_at) as first_file,
  MAX(created_at) as last_file
FROM knowledge_files
WHERE metadata->>'buffer_id' IS NOT NULL
GROUP BY metadata->>'buffer_id'
HAVING COUNT(*) > 1
ORDER BY files_in_buffer DESC
LIMIT 10;

-- 6. Total summary
SELECT 
  COUNT(*) as total_files,
  COUNT(DISTINCT user_id) as total_users,
  SUM(CASE WHEN metadata->>'source' = 'whatsapp_text' THEN 1 ELSE 0 END) as whatsapp_files,
  SUM(CASE WHEN metadata->>'source' IS NULL THEN 1 ELSE 0 END) as manual_uploads,
  SUM(CASE WHEN transcription IS NOT NULL THEN 1 ELSE 0 END) as transcribed_audios,
  SUM(CASE WHEN extracted_content IS NOT NULL THEN 1 ELSE 0 END) as extracted_files
FROM knowledge_files;



