# Database Migrations

This document lists all database migration files in the `supabase/migrations/` directory.

## Migration Files

The migrations are listed in chronological order based on their timestamp prefixes:

### Initial Schema & Core Setup
1. `20250724012300_initial_schema.sql` - Initial database schema setup
2. `20250724013843_add_storage_bucket.sql` - Storage bucket configuration
3. `20250724020522_add_knowledge_files.sql` - Knowledge files table
4. `20250724020556_add_storage_policies.sql` - Storage security policies

### Feature Tables
5. `20250724020523_add_customer_support_tickets.sql` - Customer support system
6. `20250724020524_add_linkedin_posts_tone_analysis.sql` - LinkedIn content analysis
7. `20250724020526_add_rag_corpora_table.sql` - RAG (Retrieval-Augmented Generation) corpora
8. `20250724130828_add_insights.sql` - User insights tracking
9. `20250724153106_add_content_guides.sql` - Content creation guides
10. `20250724160401_add_goals.sql` - User goals and objectives
11. `20250725002457_add_inspirations.sql` - Content inspiration sources
12. `20250725013506_add_pacing_preferences.sql` - Pacing configuration preferences
13. `20250725013507_add_whatsapp_notification_tracking.sql` - WhatsApp notification system
14. `20250725020000_add_meeting_notes_and_audio.sql` - Meeting notes and audio files

### Cron Jobs & Scheduling
15. `20250724020528_remove_evening_pacing_cron.sql` - Remove evening pacing cron
16. `20250724020529_verify_cron_schedule.sql` - Cron schedule verification
17. `20250808000003_add_pacing_cron_jobs.sql` - Pacing cron jobs setup
18. `20250808000005_add_http_cron_function.sql` - HTTP cron function
19. `20250808000006_add_pacing_scheduling.sql` - Pacing scheduling system
20. `20250923000002_setup_buffer_processing_cron.sql` - Buffer processing cron

### Bug Fixes & Constraint Updates
21. `20250801030000_fix_user_id_constraint.sql` - User ID constraint fix
22. `20250801030001_fix_content_constraint.sql` - Content constraint fix
23. `20250801030002_fix_user_id_type.sql` - User ID type correction
24. `20250801030003_update_audio_files_for_whatsapp.sql` - WhatsApp audio file updates
25. `20250811010001_fix_read_ai_user_id_constraint.sql` - Read.ai user ID constraint fix

### Activity & Analytics
26. `20250803120000_add_activity_tracking.sql` - User activity tracking
27. `20250803130000_optimize_whatsapp_integration.sql` - WhatsApp integration optimization

### Onboarding & User Management
28. `20250803140000_add_onboarding_columns.sql` - Onboarding flow columns
29. `20250814000000_add_email_to_profiles.sql` - Email field in profiles

### Content & AI Features
30. `20250101020000_enhanced_content_suggestions.sql` - Enhanced content suggestions (v1)
31. `20250105000000_create_generated_posts_table.sql` - Generated posts storage
32. `20250803150000_enhanced_content_suggestions.sql` - Enhanced content suggestions (v2)
33. `20250808000000_pcl_13a_agent_tables.sql` - Agent system tables
34. `20251104110232_create_content_skills_tables.sql` - Content skills tracking

### Storage & Cloud Integration
35. `20250803160000_add_gcs_columns_to_knowledge_files.sql` - Google Cloud Storage integration
36. `20250803170000_add_user_bucket_mapping.sql` - User bucket mapping

### Third-Party Integrations
37. `20250803170001_add_chatwoot_conversations_table.sql` - Chatwoot integration
38. `20250811000000_add_google_calendar_integration.sql` - Google Calendar integration
39. `20250811010000_add_read_ai_integration.sql` - Read.ai meeting integration
40. `20250127_add_recall_calendar_id.sql` - Recall calendar integration (v1)
41. `20250812000000_add_recall_calendar_id.sql` - Recall calendar integration (v2)

### Pacing System Redesign
42. `20250808000001_add_pacing_config.sql` - Pacing configuration
43. `20250808000002_add_simplified_flow_columns.sql` - Simplified flow columns
44. `20250808000007_redesign_pacing_scheduler_queues.sql` - Scheduler queue redesign

### Notification System
45. `20250814000001_enhance_pacing_notification_system.sql` - Enhanced notifications
46. `20250923000001_add_message_buffer_system.sql` - Message buffer system

### Transcription Features
47. `20251014000000_add_transcription_to_knowledge_files.sql` - Transcription support
48. `20251014000001_add_transcription_retry_logic.sql` - Transcription retry logic

### Knowledge Graph System
49. `20251029000000_knowledge_graph_schema.sql` - Knowledge graph schema
50. `20251029000001_migrate_knowledge_files_to_pages.sql` - Knowledge files migration
51. `20251029000002_add_search_function.sql` - Knowledge graph search function
52. `20251029000003_migrate_existing_files_simple.sql` - Existing files migration

### Analysis & Maintenance
53. `analysis_knowledge_files.sql` - Knowledge files analysis
54. `fix_duplicate_skill_display_title.sql` - Fix duplicate skill titles

## Total Migrations
**54 migration files** in total

## Migration Naming Convention

Migrations follow the timestamp-based naming convention:
```
YYYYMMDDHHMMSS_description.sql
```

Example: `20250724012300_initial_schema.sql`

## Running Migrations

To apply all migrations:
```bash
supabase db push
```

To create a new migration:
```bash
supabase migration new migration_name
```

To reset the database and rerun all migrations:
```bash
supabase db reset
```

## Notes

- Migrations are applied in chronological order based on their timestamp prefix
- Each migration should be idempotent and include appropriate rollback logic
- Test migrations locally before deploying to production
- Some migrations have dependencies on previous migrations
- The knowledge graph migrations (20251029*) represent a significant schema change

---

*Last updated: November 12, 2025*

