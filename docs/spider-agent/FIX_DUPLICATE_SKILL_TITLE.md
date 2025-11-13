# Como Resolver Erro de Display Title Duplicado no Spider Agent

## Problema

Quando você cria uma skill do Spider Agent para um usuário, mas depois muda o `user_id` nas tabelas, pode ocorrer o seguinte erro:

```
Skill cannot reuse an existing display_title: LinkedIn Content Creation - 72b290cd...
```

Isso acontece porque:
1. A skill foi criada na API da Anthropic com um `display_title` baseado no `user_id` original
2. Quando você muda o `user_id` nas tabelas e tenta criar a skill novamente, o código tenta usar o mesmo `display_title`
3. A API da Anthropic não permite `display_title` duplicados

## Solução

### Passo 1: Limpar o anthropic_skill_id

Execute o script SQL para limpar o `anthropic_skill_id` do usuário afetado:

```sql
-- Substitua 'USER_ID_AQUI' pelo user_id do usuário afetado
UPDATE public.user_content_skills
SET anthropic_skill_id = NULL
WHERE user_id = 'USER_ID_AQUI';
```

**Ou use o script pronto:**
1. Abra o arquivo `supabase/migrations/fix_duplicate_skill_display_title.sql`
2. Substitua `'USER_ID_AQUI'` pelo `user_id` correto
3. Execute no Supabase SQL Editor

### Passo 2: O código agora trata automaticamente

O código do `spider-agent` foi melhorado para:

1. **Detectar erros de display_title duplicado** automaticamente
2. **Gerar um display_title único** adicionando um timestamp quando necessário
3. **Tentar novamente** até 3 vezes com títulos únicos diferentes

**Como funciona:**
- Primeira tentativa: `LinkedIn Content Creation - 72b290cd`
- Se der erro de duplicado, segunda tentativa: `LinkedIn Content Creation - 72b290cd-a1b2c3` (com timestamp)
- Se ainda der erro, terceira tentativa: `LinkedIn Content Creation - 72b290cd-d4e5f6` (com novo timestamp)

### Passo 3: Testar novamente

Depois de limpar o `anthropic_skill_id`, execute o spider-agent novamente:

```bash
# Exemplo de chamada
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/spider-agent \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID_AQUI"}'
```

## Melhorias Implementadas

### 1. Retry Logic com Títulos Únicos
- O código agora tenta criar a skill até 3 vezes
- Cada tentativa usa um `display_title` único (com timestamp se necessário)
- Detecta automaticamente erros de `display_title` duplicado

### 2. Logs Melhorados
- Logs mostram qual tentativa está sendo feita
- Logs mostram o `display_title` sendo usado em cada tentativa
- Facilita debugging quando há problemas

### 3. Tratamento de Erros
- Erros de `display_title` duplicado são tratados especificamente
- Outros erros são propagados normalmente
- Mensagens de erro mais claras

## Prevenção Futura

Para evitar esse problema no futuro:

1. **Sempre use o user_id correto desde o início** ao criar skills
2. **Se precisar mudar o user_id**, limpe o `anthropic_skill_id` primeiro
3. **O código agora trata automaticamente** casos de duplicação, mas é melhor evitar

## Notas Técnicas

- O `display_title` na API da Anthropic deve ser único globalmente
- A skill antiga na API da Anthropic não é deletada automaticamente (não há API para isso)
- O código usa um timestamp em base36 para gerar títulos únicos quando necessário
- O `skill_name` no frontmatter do SKILL.md não precisa ser único (apenas o `display_title`)



