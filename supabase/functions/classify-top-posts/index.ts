// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Post {
  content: string;
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
  };
}

interface ClassificationResult {
  categoryId: number;
  categoryName: string;
  summary: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { posts } = await req.json();

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return new Response(JSON.stringify({ error: "No posts provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    const model = Deno.env.get("ANTHROPIC_MODEL") || "claude-haiku-4-5-20251001";

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sort posts by engagement score (likes + comments + shares)
    const scored = (posts as Post[])
      .map((p) => {
        const likes = p.engagement?.likes || 0;
        const comments = p.engagement?.comments || 0;
        const shares = p.engagement?.shares || 0;
        const score = likes + comments + shares;
        return { ...p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const schema = {
      type: "object",
      properties: {
        categoryId: { type: "integer", enum: [1, 2, 3, 4, 5, 6, 7, 8] },
        categoryName: { type: "string" },
        summary: { type: "string" },
      },
      required: ["categoryId", "categoryName", "summary"],
      additionalProperties: false,
    };

    const categories = [
      "1. Atualidades & Mercado — notícias, tendências, curadoria, dados, pesquisas.",
      "2. Educacional — ensinar, tutoriais, passo a passo, técnicos, cases.",
      "3. Opinativo / Thought Leadership — opiniões, hot takes, análises, provocações.",
      "4. Conteúdo Pessoal / Storytelling — histórias de vida/carreira, bastidores, lições.",
      "5. Updates Profissionais — mudanças de carreira, conquistas, certificações, agradecimentos.",
      "6. Updates de Negócio / Build in Public — lançamentos, métricas, projetos, bastidores da empresa, cultura.",
      "7. Social / Comunidade — perguntas, pedidos de opinião, eventos, vagas/recrutamento.",
      "8. Promocional / Comercial — campanhas, ofertas, demos, divulgação de produtos/serviços/webinars.",
    ].join("\n");

    const postsText = scored
      .map((p, idx) => {
        const text = (p.content || "").slice(0, 600);
        const likes = p.engagement?.likes || 0;
        const comments = p.engagement?.comments || 0;
        const shares = p.engagement?.shares || 0;
        return `Post ${idx + 1}: "${text}"\nLikes: ${likes}, Comments: ${comments}, Shares: ${shares}`;
      })
      .join("\n\n");

    const prompt = `
Classifique o conjunto de posts em UMA das 8 categorias abaixo. Use apenas o schema JSON pedido.

Categorias:
${categories}

Posts (top até 5):
${postsText}

Regras:
- Escolha apenas uma categoriaId (1-8).
- summary = frase curta sobre o tema escolhido, no máximo 140 caracteres, sem quebra de linha.
`;

    const anthropicUrl = "https://api.anthropic.com/v1/messages";
    const body = {
      model,
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      output_format: {
        type: "json_schema",
        schema,
      },
    };

    let response: Response;
    try {
      response = await fetch(anthropicUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "structured-outputs-2025-11-13",
        },
        body: JSON.stringify(body),
      });
    } catch (fetchErr) {
      console.error("Anthropic fetch error:", fetchErr);
      return new Response(JSON.stringify({ error: `Anthropic fetch failed: ${(fetchErr as Error).message}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic non-200:", response.status, errText);
      return new Response(JSON.stringify({ error: `Anthropic error: ${response.status} ${errText}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await response.json();
    const text = aiJson?.content?.[0]?.text;
    let parsed: ClassificationResult | null = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = null;
    }

    if (!parsed) {
      return new Response(JSON.stringify({ error: "Failed to parse model response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log classification result for observability
    console.log("classify-top-posts result:", {
      categoryId: parsed.categoryId,
      categoryName: parsed.categoryName,
      summary: parsed.summary,
    });

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("classify-top-posts error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

