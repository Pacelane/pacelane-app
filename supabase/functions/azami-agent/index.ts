import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AzamiContext {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  content: string;
  preview: string;
  source_type: string;
  source_metadata: any;
  relations_analyzed: boolean;
  created_at: string;
}

interface AzamiRelation {
  source_context_id: string;
  target_context_id: string;
  relation_type: string;
  relation_strength: number;
  relation_description: string;
  llm_analysis: any;
}

class AzamiAgent {
  private supabase: any;
  private anthropicApiKey: string;

  constructor(supabase: any) {
    this.supabase = supabase;
    this.anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY') || '';
    
    if (!this.anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
  }

  /**
   * Process batch for user - analyze relations between existing contexts
   */
  async processBatchForUser(
    userId: string,
    options: { windowStart: Date; windowEnd: Date; executionId: string }
  ): Promise<{
    contextsProcessed: number;
    relationsFound: number;
    messagesAnalyzed: number;
  }> {
    console.log(`🔍 Azami Agent: Processing for user ${userId}`);

    // 1. Buscar contextos não analisados do usuário
    const { data: contexts, error: contextsError } = await this.supabase
      .from('azami_contexts')
      .select('*')
      .eq('user_id', userId)
      .eq('relations_analyzed', false)
      .order('created_at', { ascending: true });

    if (contextsError) {
      throw new Error(`Failed to fetch contexts: ${contextsError.message}`);
    }

    if (!contexts || contexts.length === 0) {
      console.log(`ℹ️ No contexts to analyze for user ${userId}`);
      return {
        contextsProcessed: 0,
        relationsFound: 0,
        messagesAnalyzed: 0,
      };
    }

    console.log(`📚 Found ${contexts.length} contexts to analyze`);

    let contextsProcessed = 0;
    let relationsFound = 0;

    // 2. Processar cada contexto
    for (const context of contexts) {
      try {
        console.log(`\n📖 Analyzing context: "${context.title}" (${context.id})`);

        // Analisar relações com outros contextos
        const relations = await this.analyzeRelations(context.id, userId);
        
        // Criar links "see also"
        if (relations.length > 0) {
          await this.createRelations(relations, userId);
          relationsFound += relations.length;
          console.log(`  ✅ Found ${relations.length} relations`);
        } else {
          console.log(`  ℹ️ No relations found`);
        }

        // Marcar contexto como analisado
        const { error: updateError } = await this.supabase
          .from('azami_contexts')
          .update({ 
            relations_analyzed: true,
            processed_at: new Date().toISOString(),
          })
          .eq('id', context.id);

        if (updateError) {
          console.error(`  ⚠️ Error marking context as analyzed:`, updateError);
        } else {
          contextsProcessed++;
          console.log(`  ✅ Context marked as analyzed`);
        }

      } catch (error) {
        console.error(`  ❌ Error processing context ${context.id}:`, error);
        // Continuar com próximo contexto mesmo se houver erro
      }
    }

    console.log(`\n✨ Processing complete: ${contextsProcessed} contexts processed, ${relationsFound} relations found`);

    return {
      contextsProcessed,
      relationsFound,
      messagesAnalyzed: 0, // Não processamos mensagens ainda, apenas contextos manuais
    };
  }

  /**
   * Analisar relações entre contextos usando Claude LLM
   */
  async analyzeRelations(contextId: string, userId: string): Promise<AzamiRelation[]> {
    // Buscar contexto atual
    const { data: currentContext, error: currentError } = await this.supabase
      .from('azami_contexts')
      .select('*')
      .eq('id', contextId)
      .single();

    if (currentError || !currentContext) {
      throw new Error(`Failed to fetch context ${contextId}: ${currentError?.message}`);
    }

    // Buscar outros contextos do usuário (já analisados ou não)
    const { data: otherContexts, error: otherContextsError } = await this.supabase
      .from('azami_contexts')
      .select('id, title, preview, content')
      .eq('user_id', userId)
      .neq('id', contextId)
      .order('created_at', { ascending: false })
      .limit(50); // Limitar para análise eficiente

    if (otherContextsError) {
      throw new Error(`Failed to fetch other contexts: ${otherContextsError.message}`);
    }

    if (!otherContexts || otherContexts.length === 0) {
      console.log(`  ℹ️ No other contexts to compare with`);
      return [];
    }

    console.log(`  🔍 Comparing with ${otherContexts.length} other contexts`);

    // Preparar contexto para LLM (limitar tamanho)
    const currentContent = currentContext.content.substring(0, 2000);
    const currentPreview = currentContext.preview || currentContent.substring(0, 200);

    // Chamar Claude para análise de relações com Output Consistency
    const prompt = `Você é o Azami, um agente bibliotecário especializado em identificar relações semânticas entre contextos.

CONTEXTO ATUAL:
Título: ${currentContext.title}
Preview: ${currentPreview}
Conteúdo: ${currentContent}

OUTROS CONTEXTOS DISPONÍVEIS:
${otherContexts.map((ctx, i) => `
${i + 1}. ID: ${ctx.id}
   Título: ${ctx.title}
   Preview: ${ctx.preview || ctx.content.substring(0, 200)}
`).join('\n')}

TAREFA:
Imagine que você está criando uma seção "Veja Também" para o contexto atual. Sua tarefa é avaliar criticamente: "Será que este outro contexto merece ser mencionado aqui? Será que vale a pena o usuário ver esse conteúdo relacionado?"

⚠️ REGRA DE OURO: A relação deve ser CONCRETA e ESPECÍFICA, não abstrata ou genérica.

PERGUNTAS CRÍTICAS (TODAS devem ser respondidas com SIM):
1. Os contextos compartilham CONCEITOS, TERMOS ou IDEIAS ESPECÍFICAS (não apenas temas abstratos)?
2. Um contexto DISCUTE DIRETAMENTE o que o outro apresenta?
3. Um contexto é NECESSÁRIO para entender completamente o outro?
4. A relação é CLARA e ÓBVIA para qualquer leitor, sem precisar "forçar" a conexão?

❌ NÃO CRIE RELAÇÕES SE:
- A conexão é apenas através de temas abstratos genéricos (ex: "ambos falam de processos", "ambos lidam com incerteza")
- A relação requer raciocínio complexo ou "forçado" para ser entendida
- Os contextos apenas compartilham um tema muito amplo (ex: "ambos são sobre empresas", "ambos falam de tecnologia")
- A justificativa é vaga ou genérica (ex: "complementa", "relacionado", "similar")
- A relação é baseada em analogias ou metáforas distantes

✅ CRIE RELAÇÕES APENAS SE:
- Os contextos discutem o MESMO CONCEITO ESPECÍFICO (ex: ambos falam de "cohort analysis", ambos explicam "DAU vs MAU")
- Um contexto REFERENCIA ou MENCIONA diretamente o outro
- Um contexto é continuação lógica do outro (ex: um introduz um conceito, outro aprofunda)
- Os contextos compartilham TERMOS TÉCNICOS, MÉTRICAS ou CONCEITOS IDÊNTICOS

TIPOS DE RELAÇÃO:
- "semantic": Relações semânticas profundas (MESMO conceito específico, ideias idênticas ou muito próximas)
- "topical": MESMO tópico ESPECÍFICO (não apenas tema geral)
- "temporal": Sequência lógica direta (um leva naturalmente ao outro)
- "referential": Um contexto menciona ou referencia EXPLICITAMENTE o outro

CRITÉRIOS DE FORÇA (SEJA MUITO RIGOROSO):
- 0.8-1.0: Relação muito forte - Contextos discutem o MESMO CONCEITO/IDÉIA ESPECÍFICA de forma direta
- 0.68-0.79: Relação forte - Contextos compartilham conceitos específicos importantes, conexão clara e óbvia
- < 0.68: NÃO INCLUIR - Conexão muito fraca, abstrata ou forçada

REGRAS DE SELEÇÃO:
- Seja MUITO CONSERVADOR: Quando em dúvida, NÃO inclua
- Inclua apenas relações com strength >= 0.68 E que sejam CONCRETAS e ESPECÍFICAS
- Máximo de 5 relações por contexto (prefira 0 relações a relações forçadas)
- A relação deve ser CLARA e ÓBVIA - se você precisa "forçar" a conexão, não crie
- Evite relações baseadas em analogias, metáforas ou temas abstratos genéricos
- Se a justificativa é vaga ("complementa", "relacionado", "similar"), NÃO inclua

EXEMPLOS DE RELAÇÕES CORRETAS:

✅ BOM - Relação concreta e específica:
Contexto A: "Análise de retenção usando métricas de cohort, focando em DAU e MAU"
Contexto B: "Como calcular DAU e MAU para análise de retenção de usuários"
Relação: strength 0.85 - Ambos discutem especificamente DAU e MAU para análise de retenção

✅ BOM - Relação referencial:
Contexto A: "Menciona o conceito de Net Dollar Retention introduzido em outro documento"
Contexto B: "Explica detalhadamente o conceito de Net Dollar Retention"
Relação: strength 0.75 - Um referencia diretamente o outro

❌ RUIM - Relação abstrata/forçada (NÃO incluir):
Contexto A: "Produtos de IA são não-determinísticos"
Contexto B: "Feedbacks frequentes ajudam a lidar com incerteza em processos"
Relação: strength 0.52 - Conexão muito abstrata ("ambos lidam com incerteza"), não compartilham conceitos específicos
DECISÃO: NÃO INCLUIR - A relação é forçada e não adiciona valor real

❌ RUIM - Relação genérica (NÃO incluir):
Contexto A: "Como estruturar feedbacks em empresas"
Contexto B: "Definição de produtos de IA"
Relação: strength 0.45 - Apenas compartilham tema muito amplo ("processos organizacionais"), sem conceitos específicos em comum
DECISÃO: NÃO INCLUIR

REGRAS FINAIS:
- Retorne APENAS JSON válido, sem markdown, sem texto adicional
- Inclua APENAS relações com strength >= 0.68 E que sejam concretas/específicas
- Máximo de 5 relações (prefira qualidade absoluta sobre quantidade)
- Use IDs exatos da lista acima
- Descrições devem explicar POR QUE a relação é relevante com CONCEITOS ESPECÍFICOS (1-2 frases)
- Se não houver relações relevantes e concretas, retorne array vazio: []

FORMATO DE SAÍDA:
[
  {
    "context_id": "",
    "relation_type": "",
    "relation_strength": 0.0,
    "relation_description": ""
  }
]`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2000,
          temperature: 0.2, // Reduzido de 0.3 para 0.2 para maior consistência
          system: 'You are Azami, a librarian agent specialized in identifying semantic relations between contexts. Always return valid JSON arrays only, no markdown code blocks, no explanations, no additional text. Be precise and consistent.',
          messages: [
            {
              role: 'user',
              content: prompt
            },
            // Removido prefill - pode causar problemas com alguns modelos
          ]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`  ❌ Claude API error: ${response.status}`, errorText);
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Log para debug
      console.log(`  📊 Claude response structure:`, JSON.stringify({
        hasContent: !!data.content,
        contentLength: data.content?.length,
        firstContentType: data.content?.[0]?.type,
        stopReason: data.stop_reason,
        model: data.model
      }));

      // Extrair texto da resposta
      let aiResponse: string | null = null;
      
      if (data.content && Array.isArray(data.content)) {
        // Procurar por blocos de texto
        const textBlock = data.content.find((block: any) => block.type === 'text');
        if (textBlock) {
          aiResponse = textBlock.text;
        } else {
          // Se não encontrar texto, tentar o primeiro bloco
          aiResponse = data.content[0]?.text || null;
        }
      }

      if (!aiResponse) {
        console.error(`  ❌ Claude response data:`, JSON.stringify(data, null, 2));
        throw new Error(`No response from Claude. Response structure: ${JSON.stringify(data)}`);
      }

      // Extrair JSON da resposta (pode vir com markdown code blocks ou texto adicional)
      let jsonText = aiResponse.trim();
      
      // Remover markdown code blocks se presentes
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '').trim();
      }
      
      // Tentar extrair JSON se houver texto antes/depois
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      const relations = JSON.parse(jsonText);

      if (!Array.isArray(relations)) {
        console.error(`  ⚠️ Invalid response format, expected array, got:`, typeof relations);
        return [];
      }

      // Filtrar relações válidas e mapear para formato esperado
      // Threshold de 0.68 - relações devem ser concretas e específicas
      // Além disso, vamos ser ainda mais rigorosos: apenas relações >= 0.68
      const validRelations: AzamiRelation[] = relations
        .filter(rel => 
          rel.context_id && 
          rel.relation_type && 
          typeof rel.relation_strength === 'number' &&
          rel.relation_strength >= 0.68 // Aumentado para 0.68 para evitar relações "no limite" como 0.52
        )
        .map(rel => ({
          source_context_id: contextId,
          target_context_id: rel.context_id,
          relation_type: rel.relation_type,
          relation_strength: Math.min(Math.max(rel.relation_strength, 0.0), 1.0), // Clamp between 0 and 1
          relation_description: rel.relation_description || '',
          llm_analysis: rel
        }));

      return validRelations;

    } catch (error) {
      console.error(`  ❌ Error calling Claude:`, error);
      throw error;
    }
  }

  /**
   * Criar relações na tabela
   * Evita relações bidirecionais redundantes: se A→B já existe, só cria B→A se for muito mais forte
   */
  async createRelations(relations: AzamiRelation[], userId: string): Promise<void> {
    if (relations.length === 0) {
      return;
    }

    // Verificar relações existentes para evitar bidirecionais redundantes
    const relationsToInsert: any[] = [];
    
    for (const rel of relations) {
      // Verificar se já existe relação inversa (target→source)
      const { data: existingInverse } = await this.supabase
        .from('azami_relations')
        .select('relation_strength')
        .eq('source_context_id', rel.target_context_id)
        .eq('target_context_id', rel.source_context_id)
        .single();

      if (existingInverse) {
        // Relação inversa já existe - só criar se esta for significativamente mais forte
        const strengthDiff = rel.relation_strength - existingInverse.relation_strength;
        const STRENGTH_THRESHOLD = 0.15; // Diferença mínima de 0.15 para criar bidirecional
        
        if (strengthDiff > STRENGTH_THRESHOLD) {
          // Esta relação é significativamente mais forte, criar e remover a inversa
          console.log(`  🔄 Replacing weaker inverse relation (${existingInverse.relation_strength} → ${rel.relation_strength})`);
          
          // Remover relação inversa mais fraca
          await this.supabase
            .from('azami_relations')
            .delete()
            .eq('source_context_id', rel.target_context_id)
            .eq('target_context_id', rel.source_context_id);
          
          relationsToInsert.push({
            user_id: userId,
            source_context_id: rel.source_context_id,
            target_context_id: rel.target_context_id,
            relation_type: rel.relation_type,
            relation_strength: rel.relation_strength,
            relation_description: rel.relation_description,
            llm_analysis: rel.llm_analysis,
          });
        } else {
          console.log(`  ⏭️ Skipping bidirectional relation (existing: ${existingInverse.relation_strength}, new: ${rel.relation_strength})`);
        }
      } else {
        // Não há relação inversa, criar normalmente
        relationsToInsert.push({
          user_id: userId,
          source_context_id: rel.source_context_id,
          target_context_id: rel.target_context_id,
          relation_type: rel.relation_type,
          relation_strength: rel.relation_strength,
          relation_description: rel.relation_description,
          llm_analysis: rel.llm_analysis,
        });
      }
    }

    if (relationsToInsert.length === 0) {
      console.log(`  ℹ️ No new relations to insert (all were bidirectional duplicates)`);
      return;
    }

    // Inserir relações (ignorar duplicatas via UNIQUE constraint)
    const { error: insertError } = await this.supabase
      .from('azami_relations')
      .upsert(relationsToInsert, {
        onConflict: 'source_context_id,target_context_id',
        ignoreDuplicates: false,
      });

    if (insertError) {
      console.error(`  ⚠️ Error inserting relations:`, insertError);
      throw new Error(`Failed to insert relations: ${insertError.message}`);
    }

    console.log(`  ✅ Inserted ${relationsToInsert.length} relations (${relations.length - relationsToInsert.length} skipped as bidirectional)`);
  }
}

// Main handler
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Criar Supabase client com service role (para permitir qualquer usuário)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Parse request body - espera apenas user_id
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🚀 Azami Agent: Processing for user ${user_id}`);

    // Criar registro de execução
    const { data: execution, error: executionError } = await supabase
      .from('azami_executions')
      .insert({
        user_id: user_id,
        execution_type: 'manual',
        status: 'running',
        window_start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Últimas 24h
        window_end: new Date().toISOString(),
      })
      .select()
      .single();

    if (executionError) {
      throw new Error(`Failed to create execution record: ${executionError.message}`);
    }

    // Processar batch para o usuário
    const azamiAgent = new AzamiAgent(supabase);
    const result = await azamiAgent.processBatchForUser(user_id, {
      windowStart: new Date(execution.window_start),
      windowEnd: new Date(execution.window_end),
      executionId: execution.id,
    });

    // Atualizar execução
    const { error: updateError } = await supabase
      .from('azami_executions')
      .update({
        status: 'completed',
        contexts_processed: result.contextsProcessed,
        relations_found: result.relationsFound,
        messages_analyzed: result.messagesAnalyzed,
        result: result,
        completed_at: new Date().toISOString(),
      })
      .eq('id', execution.id);

    if (updateError) {
      console.error('Error updating execution:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        execution_id: execution.id,
        result: {
          contexts_processed: result.contextsProcessed,
          relations_found: result.relationsFound,
          messages_analyzed: result.messagesAnalyzed,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in azami-agent function:', error);
    
    // Atualizar execução como falha se houver execution_id
    // (não podemos fazer isso aqui facilmente sem passar execution_id)
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

