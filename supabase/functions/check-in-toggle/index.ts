import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let body: { participantId?: string; action?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { participantId, action } = body
  if (!participantId || (action !== 'check' && action !== 'uncheck')) {
    return json({ error: 'participantId and action ("check" | "uncheck") are required' }, 400)
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const wantChecked = action === 'check'

  // The .eq('checked_in', !wantChecked) clause is what makes this atomic: the
  // row only matches (and gets updated) if it's still in the expected prior
  // state. A concurrent request that already flipped it loses this race and
  // gets back zero rows instead of silently double-applying the change.
  const { data, error } = await supabase
    .from('participants')
    .update({
      checked_in: wantChecked,
      checked_in_at: wantChecked ? new Date().toISOString() : null,
    })
    .eq('id', participantId)
    .eq('checked_in', !wantChecked)
    .select()
    .maybeSingle()

  if (error) {
    return json({ error: error.message }, 500)
  }

  if (!data) {
    return json(
      { error: wantChecked ? 'Already checked by another device' : 'Already unchecked by another device' },
      409,
    )
  }

  return json({ success: true, checked: wantChecked, participant: data })
})
