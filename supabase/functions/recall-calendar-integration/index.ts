import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface RecallCalendar {
  id: string;
  platform: 'google_calendar' | 'microsoft_outlook';
  oauth_client_id: string;
  oauth_client_secret: string;
  oauth_refresh_token: string;
  oauth_email?: string;
  created_at: string;
  updated_at: string;
}

interface RecallCalendarEvent {
  id: string;
  calendar_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  meeting_url?: string;
  attendees?: Array<{
    email: string;
    display_name?: string;
    response_status?: string;
  }>;
  location?: string;
  is_all_day: boolean;
  created_at: string;
  updated_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get action from URL params or request body
    const url = new URL(req.url);
    let action = url.searchParams.get('action');
    let requestBody: any = null;
    
    if (!action && req.method === 'POST') {
      try {
        requestBody = await req.json();
        action = requestBody.action;
      } catch (e) {
        console.log('Could not parse request body as JSON');
      }
    }

    switch (action) {
      case 'auth-url':
        return await handleAuthUrl(req);
      
      case 'callback':
        return await handleCallback(req, supabase, requestBody);
      
      case 'create-calendar':
        return await handleCreateCalendar(req, supabase, requestBody);
      
      case 'sync-events':
        return await handleSyncEvents(req, supabase);
      
      case 'events':
        return await handleGetEvents(req, supabase);
      
      case 'disconnect':
        return await handleDisconnect(req, supabase);
      
      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid action. Use: auth-url, callback, create-calendar, sync-events, events, or disconnect'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('Error in recall-calendar-integration function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Generate OAuth URL for Google Calendar
async function handleAuthUrl(req: Request) {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI') || 'https://your-domain.com/auth/callback';
  
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID environment variable not set');
  }

  const scopes = [
    'https://www.googleapis.com/auth/calendar.events.readonly',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scopes.join(' '))}` +
    `&response_type=code` +
    `&access_type=offline` +
    `&prompt=consent`;

  return new Response(JSON.stringify({
    success: true,
    authUrl
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handle OAuth callback and create calendar in Recall.ai
async function handleCallback(req: Request, supabase: any, requestBody?: any) {
  const url = new URL(req.url);
  let code = url.searchParams.get('code');
  let state = url.searchParams.get('state');
  
  // If not in URL params, try to get from request body
  if (!code && requestBody) {
    code = requestBody.code;
    state = requestBody.state;
  }
  
  console.log('Callback - code:', code ? 'present' : 'missing');
  console.log('Callback - state:', state ? 'present' : 'missing');
  
  if (!code) {
    throw new Error('Authorization code not provided');
  }

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI') || 'https://your-domain.com/auth/callback';

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  // Exchange code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to exchange code for tokens: ${error}`);
  }

  const tokens = await tokenResponse.json();
  
  // Get user info from the state or extract from tokens
  const userId = state; // This should be the user_id
  
  if (!userId) {
    throw new Error('User ID not provided in state parameter');
  }

  // Get user's email for Recall.ai
  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${tokens.access_token}`,
    },
  });

  if (!userInfoResponse.ok) {
    throw new Error('Failed to fetch user info');
  }

  const userInfo = await userInfoResponse.json();

  // Create calendar in Recall.ai
  const recallApiKey = Deno.env.get('RECALL_API_KEY');
  if (!recallApiKey) {
    throw new Error('RECALL_API_KEY environment variable not set');
  }

  const recallCalendarData = {
    oauth_client_id: clientId,
    oauth_client_secret: clientSecret,
    oauth_refresh_token: tokens.refresh_token,
    oauth_email: userInfo.email,
    platform: 'google_calendar'
  };

  const recallResponse = await fetch('https://us-east-1.recall.ai/api/v2/calendars/', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${recallApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(recallCalendarData),
  });

  if (!recallResponse.ok) {
    const error = await recallResponse.text();
    throw new Error(`Failed to create calendar in Recall.ai: ${error}`);
  }

  const recallCalendar = await recallResponse.json();

  // Store calendar connection in our database
  const { error: calendarError } = await supabase
    .from('user_calendars')
    .upsert({
      user_id: userId,
      calendar_id: recallCalendar.id,
      calendar_name: 'Primary Calendar',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      is_primary: true,
      recall_calendar_id: recallCalendar.id, // Store Recall.ai calendar ID
    });

  if (calendarError) {
    throw new Error(`Failed to store calendar connection: ${calendarError.message}`);
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Calendar connected successfully',
    calendarId: recallCalendar.id,
    calendarName: 'Primary Calendar'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Sync calendar events from Recall.ai
async function handleSyncEvents(req: Request, supabase: any) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Authorization header required');
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    throw new Error('Invalid authorization token');
  }

  // Get user's connected calendars
  const { data: calendars, error: calendarsError } = await supabase
    .from('user_calendars')
    .select('*')
    .eq('user_id', user.id)
    .not('recall_calendar_id', 'is', null);

  if (calendarsError || !calendars?.length) {
    throw new Error('No connected calendars found');
  }

  const recallApiKey = Deno.env.get('RECALL_API_KEY');
  if (!recallApiKey) {
    throw new Error('RECALL_API_KEY environment variable not set');
  }

  let totalEvents = 0;

  for (const userCalendar of calendars) {
    try {
      // Get events from Recall.ai
      const eventsResponse = await fetch(`https://us-east-1.recall.ai/api/v2/calendars/${userCalendar.recall_calendar_id}/events/`, {
        headers: {
          'Authorization': `Token ${recallApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!eventsResponse.ok) {
        throw new Error(`Failed to fetch events from Recall.ai: ${eventsResponse.statusText}`);
      }

      const eventsData = await eventsResponse.json();
      const events = eventsData.results || [];
      
      // Process and store events
      for (const event of events) {
        if (event.id && event.start_time) {
          const eventData = {
            user_id: user.id,
            calendar_id: userCalendar.calendar_id,
            event_id: event.id,
            title: event.title || 'Untitled Event',
            description: event.description || null,
            start_time: event.start_time,
            end_time: event.end_time || event.start_time,
            attendees: event.attendees || [],
            location: event.location || null,
            is_all_day: event.is_all_day || false,
            meeting_url: event.meeting_url || null,
          };

          // Upsert event
          await supabase
            .from('calendar_events')
            .upsert(eventData, { onConflict: 'user_id,event_id' });
        }
      }

      totalEvents += events.length;

      // Update last_sync
      await supabase
        .from('user_calendars')
        .update({ last_sync: new Date().toISOString() })
        .eq('id', userCalendar.id);

    } catch (error) {
      console.error(`Error syncing calendar ${userCalendar.calendar_id}:`, error);
    }
  }

  return new Response(JSON.stringify({
    success: true,
    message: `Synced ${totalEvents} events from ${calendars.length} calendar(s)`,
    totalEvents,
    calendarsCount: calendars.length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Get calendar events for a user
async function handleGetEvents(req: Request, supabase: any) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Authorization header required');
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    throw new Error('Invalid authorization token');
  }

  const url = new URL(req.url);
  let startDate = url.searchParams.get('start');
  let endDate = url.searchParams.get('end');
  let limit = parseInt(url.searchParams.get('limit') || '50');
  
  // If not in URL params, try to get from request body
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      startDate = body.start || startDate;
      endDate = body.end || endDate;
      limit = body.limit || limit;
    } catch (e) {
      console.log('Could not parse events request body');
    }
  }

  let query = supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', user.id)
    .order('start_time', { ascending: true })
    .limit(limit);

  if (startDate) {
    query = query.gte('start_time', startDate);
  }
  if (endDate) {
    query = query.lte('start_time', endDate);
  }

  const { data: events, error: eventsError } = await query;

  if (eventsError) {
    throw new Error(`Failed to fetch events: ${eventsError.message}`);
  }

  return new Response(JSON.stringify({
    success: true,
    events,
    count: events?.length || 0
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Disconnect calendar
async function handleDisconnect(req: Request, supabase: any) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Authorization header required');
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    throw new Error('Invalid authorization token');
  }

  const url = new URL(req.url);
  let calendarId = url.searchParams.get('calendar_id');
  
  // If not in URL params, try to get from request body
  if (!calendarId && req.method === 'POST') {
    try {
      const body = await req.json();
      calendarId = body.calendar_id;
    } catch (e) {
      console.log('Could not parse disconnect request body');
    }
  }

  if (calendarId) {
    // Disconnect specific calendar
    await supabase
      .from('user_calendars')
      .delete()
      .eq('user_id', user.id)
      .eq('calendar_id', calendarId);

    // Remove associated events
    await supabase
      .from('calendar_events')
      .delete()
      .eq('user_id', user.id)
      .eq('calendar_id', calendarId);
  } else {
    // Disconnect all calendars
    await supabase
      .from('user_calendars')
      .delete()
      .eq('user_id', user.id);

    await supabase
      .from('calendar_events')
      .delete()
      .eq('user_id', user.id);
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Calendar disconnected successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Create calendar in Recall.ai (separate endpoint)
async function handleCreateCalendar(req: Request, supabase: any, requestBody?: any) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Authorization header required');
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    throw new Error('Invalid authorization token');
  }

  if (!requestBody) {
    throw new Error('Request body required');
  }

  const { oauth_client_id, oauth_client_secret, oauth_refresh_token, oauth_email, platform } = requestBody;

  if (!oauth_client_id || !oauth_client_secret || !oauth_refresh_token || !platform) {
    throw new Error('Missing required fields: oauth_client_id, oauth_client_secret, oauth_refresh_token, platform');
  }

  const recallApiKey = Deno.env.get('RECALL_API_KEY');
  if (!recallApiKey) {
    throw new Error('RECALL_API_KEY environment variable not set');
  }

  const recallCalendarData = {
    oauth_client_id,
    oauth_client_secret,
    oauth_refresh_token,
    oauth_email,
    platform
  };

  const recallResponse = await fetch('https://us-east-1.recall.ai/api/v2/calendars/', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${recallApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(recallCalendarData),
  });

  if (!recallResponse.ok) {
    const error = await recallResponse.text();
    throw new Error(`Failed to create calendar in Recall.ai: ${error}`);
  }

  const recallCalendar = await recallResponse.json();

  // Store calendar connection in our database
  const { error: calendarError } = await supabase
    .from('user_calendars')
    .upsert({
      user_id: user.id,
      calendar_id: recallCalendar.id,
      calendar_name: 'Primary Calendar',
      access_token: '', // Not needed for Recall.ai
      refresh_token: oauth_refresh_token,
      token_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Long-lived
      is_primary: true,
      recall_calendar_id: recallCalendar.id,
    });

  if (calendarError) {
    throw new Error(`Failed to store calendar connection: ${calendarError.message}`);
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Calendar created successfully in Recall.ai',
    calendar: recallCalendar
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
