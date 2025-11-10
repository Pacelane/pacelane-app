-- =====================================================
-- Visualizar Contextos com Relações
-- =====================================================
-- Esta query mostra cada contexto com todos os títulos
-- dos contextos relacionados (tanto como source quanto target)
-- =====================================================

SELECT 
  c.id,
  c.title,
  c.slug,
  c.created_at,
  c.relations_analyzed,
  -- Contextos relacionados (onde este contexto é source)
  COALESCE(
    STRING_AGG(DISTINCT target_ctx.title, ', ' ORDER BY target_ctx.title),
    'Nenhum'
  ) as contextos_relacionados_outgoing,
  -- Contextos relacionados (onde este contexto é target)
  COALESCE(
    STRING_AGG(DISTINCT source_ctx.title, ', ' ORDER BY source_ctx.title),
    'Nenhum'
  ) as contextos_relacionados_incoming,
  -- Todos os contextos relacionados (combinado)
  COALESCE(
    STRING_AGG(
      DISTINCT COALESCE(target_ctx.title, source_ctx.title),
      ', ' 
      ORDER BY COALESCE(target_ctx.title, source_ctx.title)
    ),
    'Nenhum'
  ) as todos_contextos_relacionados,
  -- Contagem de relações
  COUNT(DISTINCT r_outgoing.id) + COUNT(DISTINCT r_incoming.id) as total_relacoes
FROM azami_contexts c
LEFT JOIN azami_relations r_outgoing 
  ON r_outgoing.source_context_id = c.id
LEFT JOIN azami_contexts target_ctx 
  ON target_ctx.id = r_outgoing.target_context_id
LEFT JOIN azami_relations r_incoming 
  ON r_incoming.target_context_id = c.id
LEFT JOIN azami_contexts source_ctx 
  ON source_ctx.id = r_incoming.source_context_id
WHERE c.user_id = '72b290cd-7363-466a-9f30-d552d335d6c4'
GROUP BY c.id, c.title, c.slug, c.created_at, c.relations_analyzed
ORDER BY c.created_at DESC;

-- =====================================================
-- Versão Simplificada (apenas títulos relacionados combinados)
-- =====================================================

SELECT 
  c.id,
  c.title,
  c.created_at,
  COALESCE(
    STRING_AGG(
      DISTINCT related_ctx.title,
      ', ' 
      ORDER BY related_ctx.title
    ),
    'Nenhum contexto relacionado'
  ) as contextos_relacionados
FROM azami_contexts c
LEFT JOIN (
  -- Relações onde este contexto é source
  SELECT source_context_id as context_id, target_context_id as related_id
  FROM azami_relations
  WHERE user_id = '72b290cd-7363-466a-9f30-d552d335d6c4'
  UNION ALL
  -- Relações onde este contexto é target
  SELECT target_context_id as context_id, source_context_id as related_id
  FROM azami_relations
  WHERE user_id = '72b290cd-7363-466a-9f30-d552d335d6c4'
) all_relations ON all_relations.context_id = c.id
LEFT JOIN azami_contexts related_ctx ON related_ctx.id = all_relations.related_id
WHERE c.user_id = '72b290cd-7363-466a-9f30-d552d335d6c4'
GROUP BY c.id, c.title, c.created_at
ORDER BY c.created_at DESC;

-- =====================================================
-- Versão com Detalhes das Relações (tipo e força)
-- =====================================================

SELECT 
  c.id,
  c.title,
  c.created_at,
  STRING_AGG(
    DISTINCT related_ctx.title || 
    CASE 
      WHEN r.relation_type IS NOT NULL 
      THEN ' (' || r.relation_type || ', ' || ROUND(r.relation_strength::numeric, 2) || ')'
      ELSE ''
    END,
    ', ' 
    ORDER BY related_ctx.title
  ) as contextos_relacionados_com_detalhes
FROM azami_contexts c
LEFT JOIN (
  -- Relações onde este contexto é source
  SELECT 
    source_context_id as context_id, 
    target_context_id as related_id,
    relation_type,
    relation_strength
  FROM azami_relations
  WHERE user_id = '72b290cd-7363-466a-9f30-d552d335d6c4'
  UNION ALL
  -- Relações onde este contexto é target
  SELECT 
    target_context_id as context_id, 
    source_context_id as related_id,
    relation_type,
    relation_strength
  FROM azami_relations
  WHERE user_id = '72b290cd-7363-466a-9f30-d552d335d6c4'
) all_relations ON all_relations.context_id = c.id
LEFT JOIN azami_contexts related_ctx ON related_ctx.id = all_relations.related_id
LEFT JOIN azami_relations r ON (
  (r.source_context_id = c.id AND r.target_context_id = related_ctx.id) OR
  (r.target_context_id = c.id AND r.source_context_id = related_ctx.id)
)
WHERE c.user_id = '72b290cd-7363-466a-9f30-d552d335d6c4'
GROUP BY c.id, c.title, c.created_at
ORDER BY c.created_at DESC;




