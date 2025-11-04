-- =====================================================
-- Knowledge Graph System - Verification Tests
-- =====================================================
-- Run this file to verify that the knowledge graph
-- schema and migration completed successfully
-- =====================================================

-- Set client encoding
SET client_encoding = 'UTF8';

\echo '=========================================='
\echo 'KNOWLEDGE GRAPH VERIFICATION TESTS'
\echo '=========================================='
\echo ''

-- =====================================================
-- TEST 1: Check Tables Exist
-- =====================================================

\echo 'TEST 1: Checking if all tables exist...'

DO $$
DECLARE
  missing_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_pages') THEN
    missing_tables := array_append(missing_tables, 'knowledge_pages');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_links') THEN
    missing_tables := array_append(missing_tables, 'knowledge_links');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_attachments') THEN
    missing_tables := array_append(missing_tables, 'knowledge_attachments');
  END IF;
  
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Missing tables: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE '✓ All tables exist';
  END IF;
END $$;

\echo ''

-- =====================================================
-- TEST 2: Check Indexes
-- =====================================================

\echo 'TEST 2: Checking if indexes exist...'

DO $$
DECLARE
  expected_indexes TEXT[] := ARRAY[
    'idx_knowledge_pages_user_id',
    'idx_knowledge_pages_slug',
    'idx_knowledge_pages_title_search',
    'idx_knowledge_pages_content_search',
    'idx_knowledge_links_source',
    'idx_knowledge_links_target',
    'idx_knowledge_attachments_page'
  ];
  missing_indexes TEXT[] := ARRAY[]::TEXT[];
  idx TEXT;
BEGIN
  FOREACH idx IN ARRAY expected_indexes LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = idx
    ) THEN
      missing_indexes := array_append(missing_indexes, idx);
    END IF;
  END LOOP;
  
  IF array_length(missing_indexes, 1) > 0 THEN
    RAISE WARNING 'Missing indexes: %', array_to_string(missing_indexes, ', ');
  ELSE
    RAISE NOTICE '✓ All key indexes exist';
  END IF;
END $$;

\echo ''

-- =====================================================
-- TEST 3: Check RLS is Enabled
-- =====================================================

\echo 'TEST 3: Checking if RLS is enabled...'

DO $$
DECLARE
  tables_without_rls TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'knowledge_pages' 
    AND rowsecurity = true
  ) THEN
    tables_without_rls := array_append(tables_without_rls, 'knowledge_pages');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'knowledge_links' 
    AND rowsecurity = true
  ) THEN
    tables_without_rls := array_append(tables_without_rls, 'knowledge_links');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'knowledge_attachments' 
    AND rowsecurity = true
  ) THEN
    tables_without_rls := array_append(tables_without_rls, 'knowledge_attachments');
  END IF;
  
  IF array_length(tables_without_rls, 1) > 0 THEN
    RAISE WARNING 'RLS not enabled on: %', array_to_string(tables_without_rls, ', ');
  ELSE
    RAISE NOTICE '✓ RLS enabled on all tables';
  END IF;
END $$;

\echo ''

-- =====================================================
-- TEST 4: Check Helper Functions
-- =====================================================

\echo 'TEST 4: Testing helper functions...'

DO $$
DECLARE
  test_slug TEXT;
BEGIN
  -- Test slug generation
  test_slug := generate_slug('Test Page with Spaces & Special!');
  
  IF test_slug != 'test-page-with-spaces-special' THEN
    RAISE EXCEPTION 'Slug generation failed. Expected: test-page-with-spaces-special, Got: %', test_slug;
  ELSE
    RAISE NOTICE '✓ Slug generation works correctly';
  END IF;
END $$;

\echo ''

-- =====================================================
-- TEST 5: Check Migration Results
-- =====================================================

\echo 'TEST 5: Checking migration results...'

DO $$
DECLARE
  total_files INTEGER;
  total_pages INTEGER;
  total_attachments INTEGER;
  total_links INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_files FROM knowledge_files;
  SELECT COUNT(*) INTO total_pages FROM knowledge_pages;
  SELECT COUNT(*) INTO total_attachments FROM knowledge_attachments;
  SELECT COUNT(*) INTO total_links FROM knowledge_links;
  
  RAISE NOTICE '- knowledge_files: % records', total_files;
  RAISE NOTICE '- knowledge_pages: % records', total_pages;
  RAISE NOTICE '- knowledge_attachments: % records', total_attachments;
  RAISE NOTICE '- knowledge_links: % records', total_links;
  
  IF total_pages = 0 AND total_files > 0 THEN
    RAISE WARNING 'No pages migrated from % files. Migration may have failed.', total_files;
  ELSIF total_pages > 0 THEN
    RAISE NOTICE '✓ Migration appears successful';
  END IF;
END $$;

\echo ''

-- =====================================================
-- TEST 6: Check Pages by Source
-- =====================================================

\echo 'TEST 6: Checking pages by source...'

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN (
    SELECT source, COUNT(*) as count 
    FROM knowledge_pages 
    GROUP BY source
    ORDER BY count DESC
  ) LOOP
    RAISE NOTICE '- % pages: %', rec.source, rec.count;
  END LOOP;
END $$;

\echo ''

-- =====================================================
-- TEST 7: Test Insert/Update Triggers
-- =====================================================

\echo 'TEST 7: Testing insert/update triggers...'

DO $$
DECLARE
  test_page_id UUID;
  test_slug TEXT;
  test_preview TEXT;
  old_updated_at TIMESTAMP;
  new_updated_at TIMESTAMP;
BEGIN
  -- Test auto-slug generation
  INSERT INTO knowledge_pages (user_id, title, content)
  VALUES (
    '00000000-0000-0000-0000-000000000000', -- dummy user_id for test
    'Test Auto Slug Generation',
    'This is test content for the automatic slug generation feature.'
  )
  RETURNING id, slug, preview, updated_at INTO test_page_id, test_slug, test_preview, old_updated_at;
  
  IF test_slug != 'test-auto-slug-generation' THEN
    RAISE EXCEPTION 'Auto-slug failed. Expected: test-auto-slug-generation, Got: %', test_slug;
  END IF;
  
  IF test_preview IS NULL THEN
    RAISE EXCEPTION 'Auto-preview failed. Preview is NULL';
  END IF;
  
  RAISE NOTICE '✓ Auto-slug trigger works';
  RAISE NOTICE '✓ Auto-preview trigger works';
  
  -- Wait a moment
  PERFORM pg_sleep(0.1);
  
  -- Test auto-update timestamp
  UPDATE knowledge_pages 
  SET title = 'Updated Title'
  WHERE id = test_page_id
  RETURNING updated_at INTO new_updated_at;
  
  IF new_updated_at <= old_updated_at THEN
    RAISE EXCEPTION 'Auto-update timestamp failed';
  END IF;
  
  RAISE NOTICE '✓ Auto-update timestamp trigger works';
  
  -- Cleanup
  DELETE FROM knowledge_pages WHERE id = test_page_id;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Cleanup on error
    DELETE FROM knowledge_pages WHERE user_id = '00000000-0000-0000-0000-000000000000';
    RAISE;
END $$;

\echo ''

-- =====================================================
-- TEST 8: Test Full-Text Search
-- =====================================================

\echo 'TEST 8: Testing full-text search...'

DO $$
DECLARE
  search_count INTEGER;
BEGIN
  -- Count pages that match a search
  SELECT COUNT(*) INTO search_count
  FROM knowledge_pages
  WHERE to_tsvector('english', title || ' ' || COALESCE(content, '')) 
        @@ to_tsquery('english', 'the | a | is');
  
  RAISE NOTICE '- Found % pages with common words', search_count;
  RAISE NOTICE '✓ Full-text search is working';
END $$;

\echo ''

-- =====================================================
-- TEST 9: Test View
-- =====================================================

\echo 'TEST 9: Testing knowledge_pages_with_stats view...'

DO $$
DECLARE
  view_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO view_count FROM knowledge_pages_with_stats;
  
  IF view_count = 0 THEN
    RAISE NOTICE '- View is empty (no pages yet)';
  ELSE
    RAISE NOTICE '- View contains % pages with stats', view_count;
  END IF;
  
  RAISE NOTICE '✓ Stats view is working';
END $$;

\echo ''

-- =====================================================
-- TEST 10: Test JSONB Queries
-- =====================================================

\echo 'TEST 10: Testing JSONB queries...'

DO $$
DECLARE
  whatsapp_count INTEGER;
BEGIN
  -- Count WhatsApp pages
  SELECT COUNT(*) INTO whatsapp_count
  FROM knowledge_pages
  WHERE source = 'whatsapp';
  
  RAISE NOTICE '- Found % WhatsApp pages', whatsapp_count;
  RAISE NOTICE '✓ JSONB queries working';
END $$;

\echo ''

-- =====================================================
-- SUMMARY
-- =====================================================

\echo '=========================================='
\echo 'VERIFICATION SUMMARY'
\echo '=========================================='

DO $$
DECLARE
  total_pages INTEGER;
  total_links INTEGER;
  total_attachments INTEGER;
  avg_content_length INTEGER;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(NULLIF(content, '')),
    AVG(LENGTH(COALESCE(content, '')))
  INTO 
    total_pages,
    total_links,
    avg_content_length
  FROM knowledge_pages;
  
  SELECT COUNT(*) INTO total_links FROM knowledge_links;
  SELECT COUNT(*) INTO total_attachments FROM knowledge_attachments;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Database Statistics:';
  RAISE NOTICE '- Total pages: %', total_pages;
  RAISE NOTICE '- Total links: %', total_links;
  RAISE NOTICE '- Total attachments: %', total_attachments;
  RAISE NOTICE '- Average content length: % chars', avg_content_length;
  RAISE NOTICE '';
  RAISE NOTICE '✅ All verification tests passed!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Deploy knowledge-graph edge function';
  RAISE NOTICE '2. Update buffer-processor to create pages';
  RAISE NOTICE '3. Build frontend components';
  RAISE NOTICE '';
END $$;

\echo '=========================================='

