import { corsHeaders } from "../_shared/cors.ts";

interface UpdateRelationStatusRequest {
  relationId: string;
  status: 'accepted' | 'rejected';
  userId: string;
}

export async function updateRelationStatus(supabase: any, { relationId, status }: UpdateRelationStatusRequest) {
  if (!relationId || !status) {
    throw new Error('Missing relationId or status');
  }

  const { data, error } = await supabase
    .from('azami_relations')
    .update({ status })
    .eq('id', relationId)
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
