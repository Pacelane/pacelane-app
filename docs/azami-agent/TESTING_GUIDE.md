# Azami Agent - Guia de Teste

## Visão Geral

O Azami Agent é um sistema bibliotecário que identifica relações semânticas entre contextos usando LLM. Este guia mostra como testar o sistema manualmente.

## Pré-requisitos

1. Migration executada: `20250130000000_create_azami_agent_tables.sql`
2. Edge function deployada: `azami-agent`
3. Variável de ambiente configurada: `ANTHROPIC_API_KEY`

## Passo 1: Popular Tabela Manualmente

### Opção A: Via Supabase Studio

1. Acesse Supabase Studio → Table Editor → `azami_contexts`
2. Clique em "Insert row"
3. Preencha os campos:
   - `user_id`: UUID do seu usuário
   - `title`: Título do contexto (ex: "User Retention Analysis")
   - `slug`: URL-friendly (ex: "user-retention-analysis")
   - `content`: Conteúdo markdown completo
   - `preview`: Primeiros 200 caracteres
   - `source_type`: 'whatsapp_text' (ou outro tipo válido)
   - `source_metadata`: `{"manual_input": true}`
   - `relations_analyzed`: `false`

### Opção B: Via SQL

```sql
INSERT INTO azami_contexts (
  user_id,
  title,
  slug,
  content,
  preview,
  source_type,
  source_metadata,
  relations_analyzed
) VALUES (
  'uuid-do-usuario',
  'User Retention Analysis',
  'user-retention-analysis',
  '# User Retention Analysis

Este contexto discute análise de retenção de usuários usando cohort analysis.
Métricas importantes: DAU, MAU, churn rate, retention curves.
',
  'Este contexto discute análise de retenção de usuários usando cohort analysis.',
  'whatsapp_text',
  '{"manual_input": true}',
  false
);
```

**Dica**: Crie 2-3 contextos relacionados para testar a detecção de relações.

## Passo 2: Executar Azami Agent

### Via cURL

```bash
# Comando básico
curl -X POST 'https://plbgeabtrkdhbrnjonje.supabase.co/functions/v1/azami-agent' \
  -H 'Authorization: Bearer sb_publishable_9XiJGnQZVp6xOqGUCA4CXQ_QzCQwyzu' \
  -H 'apikey: sb_publishable_9XiJGnQZVp6xOqGUCA4CXQ_QzCQwyzu' \
  -H 'Content-Type: application/json' \
  --data '{"user_id": "72b290cd-7363-466a-9f30-d552d335d6c4"}'

# Ou com variáveis (para reutilizar)
PROJECT_REF="plbgeabtrkdhbrnjonje"
API_KEY="sb_publishable_9XiJGnQZVp6xOqGUCA4CXQ_QzCQwyzu"
USER_ID="72b290cd-7363-466a-9f30-d552d335d6c4"

curl -X POST "https://${PROJECT_REF}.supabase.co/functions/v1/azami-agent" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "apikey: ${API_KEY}" \
  -H 'Content-Type: application/json' \
  --data "{\"user_id\": \"${USER_ID}\"}"
```

### Onde encontrar as variáveis

- **PROJECT_REF**: Supabase Studio → Settings → General → Reference ID
- **SERVICE_ROLE_KEY**: Supabase Studio → Settings → API → Service Role Key
- **USER_ID**: Supabase Studio → Authentication → Users → copiar ID do usuário

## Passo 3: Ver Logs

Acompanhe o processamento:

1. Supabase Studio → Edge Functions → `azami-agent` → Logs
2. Procure por mensagens como:
   - `🔍 Azami Agent: Processing for user`
   - `📚 Found X contexts to analyze`
   - `📖 Analyzing context: "Title"`
   - `✅ Found X relations`

## Passo 4: Verificar Resultados

### Ver contextos processados

```sql
SELECT 
  id,
  title,
  relations_analyzed,
  processed_at
FROM azami_contexts
WHERE user_id = 'uuid-do-usuario'
ORDER BY created_at DESC;
```

### Ver relações encontradas

```sql
SELECT 
  r.id,
  r.relation_type,
  r.relation_strength,
  r.relation_description,
  sc.title as source_title,
  tc.title as target_title
FROM azami_relations r
JOIN azami_contexts sc ON sc.id = r.source_context_id
JOIN azami_contexts tc ON tc.id = r.target_context_id
WHERE r.user_id = 'uuid-do-usuario'
ORDER BY r.relation_strength DESC;
```

### Ver execuções

```sql
SELECT 
  id,
  execution_type,
  status,
  contexts_processed,
  relations_found,
  started_at,
  completed_at
FROM azami_executions
WHERE user_id = 'uuid-do-usuario'
ORDER BY started_at DESC;
```

## Exemplo de Fluxo Completo

```bash
# 1. Popular contexto manualmente (via SQL ou Studio)
# 2. Executar Azami Agent
curl -X POST "https://xxx.supabase.co/functions/v1/azami-agent" \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer xxx' \
  --data-raw '{"user_id": "uuid"}'

# 3. Verificar resposta (deve retornar JSON com success: true)
# 4. Verificar relações criadas
# 5. Adicionar mais contextos e executar novamente
```

## Troubleshooting

### Erro: "user_id is required"
- Verifique se está enviando `user_id` no body JSON

### Erro: "ANTHROPIC_API_KEY is not set"
- Configure a variável de ambiente no Supabase Studio → Edge Functions → azami-agent → Settings

### Nenhuma relação encontrada
- Verifique se há pelo menos 2 contextos do mesmo usuário
- Contextos devem ter conteúdo relacionado semanticamente
- Verifique logs para ver o que o LLM retornou

### Relações não aparecem
- Verifique se `relations_analyzed = true` nos contextos
- Verifique se as relações foram inseridas em `azami_relations`
- Verifique se `relation_strength >= 0.3` (relações fracas são filtradas)

## Próximos Passos

Após validar o backend funcionando:
1. Adicionar mais contextos e testar diferentes tipos de relações
2. Validar qualidade das relações encontradas
3. Implementar frontend para visualização do grafo

