-- Script para limpar anthropic_skill_id e forçar recriação da skill
-- Use este script quando houver erro de display_title duplicado na API da Anthropic
-- 
-- INSTRUÇÕES:
-- 1. Substitua 'USER_ID_AQUI' pelo user_id do usuário afetado
-- 2. Execute este script no Supabase SQL Editor
-- 3. Depois, execute o spider-agent novamente para criar uma nova skill com display_title único

-- Limpar anthropic_skill_id para forçar recriação da skill
UPDATE public.user_content_skills
SET anthropic_skill_id = NULL
WHERE user_id = 'USER_ID_AQUI'; -- ⚠️ SUBSTITUA PELO USER_ID CORRETO

-- Verificar se foi atualizado corretamente
SELECT 
  user_id,
  anthropic_skill_id,
  updated_at
FROM public.user_content_skills
WHERE user_id = 'USER_ID_AQUI'; -- ⚠️ SUBSTITUA PELO USER_ID CORRETO



