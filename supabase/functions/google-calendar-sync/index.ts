import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { google } from 'https://esm.sh/googleapis@128.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface GoogleCalendarAuth {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  location?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'auth-url':
        return await handleAuthUrl(req);
      
      case 'callback':
        return await handleCallback(req, supabase);
      
      case 'sync':
        return await handleSync(req, supabase);
      
      case 'events':
        return await handleGetEvents(req, supabase);
      
      case 'disconnect':
        return await handleDisconnect(req, supabase);
      
      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid action. Use: auth-url, callback, sync, events, or disconnect'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('Error in google-calendar-sync function:', error);
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
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events.readonly'
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

// Handle OAuth callback and store tokens
async function handleCallback(req: Request, supabase: any) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // Could include user_id
  
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
  // For now, we'll need the user_id to be passed in the state
  const userId = state; // This should be the user_id
  
  if (!userId) {
    throw new Error('User ID not provided in state parameter');
  }

  // Get user's primary calendar
  const calendar = google.calendar({ version: 'v3' });
  const calendarResponse = await calendar.calendarList.list({
    access_token: tokens.access_token,
  });

  const primaryCalendar = calendarResponse.data.items?.find(cal => cal.primary);
  
  if (!primaryCalendar) {
    throw new Error('No primary calendar found');
  }

  // Store calendar connection
  const { error: calendarError } = await supabase
    .from('user_calendars')
    .upsert({
      user_id: userId,
      calendar_id: primaryCalendar.id!,
      calendar_name: primaryCalendar.summary || 'Primary Calendar',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      is_primary: true,
    });

  if (calendarError) {
    throw new Error(`Failed to store calendar connection: ${calendarError.message}`);
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Calendar connected successfully',
    calendarId: primaryCalendar.id,
    calendarName: primaryCalendar.summary
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Sync calendar events
async function handleSync(req: Request, supabase: any) {
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
    .eq('user_id', user.id);

  if (calendarsError || !calendars?.length) {
    throw new Error('No connected calendars found');
  }

  let totalEvents = 0;
  const calendar = google.calendar({ version: 'v3' });

  for (const userCalendar of calendars) {
    // Check if token needs refresh
    if (new Date(userCalendar.token_expiry) <= new Date()) {
      const refreshedTokens = await refreshAccessToken(userCalendar.refresh_token);
      
      // Update tokens in database
      await supabase
        .from('user_calendars')
        .update({
          access_token: refreshedTokens.access_token,
          token_expiry: new Date(Date.now() + refreshedTokens.expires_in * 1000).toISOString(),
        })
        .eq('id', userCalendar.id);

      userCalendar.access_token = refreshedTokens.access_token;
    }

    // Get events from the last 30 days and next 30 days
    const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    try {
      const eventsResponse = await calendar.events.list({
        calendarId: userCalendar.calendar_id,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        access_token: userCalendar.access_token,
      });

      const events = eventsResponse.data.items || [];
      
      // Process and store events
      for (const event of events) {
        if (event.id && event.start) {
          const eventData = {
            user_id: user.id,
            calendar_id: userCalendar.calendar_id,
            event_id: event.id,
            title: event.summary || 'Untitled Event',
            description: event.description || null,
            start_time: event.start.dateTime || event.start.date,
            end_time: event.end?.dateTime || event.end?.date || event.start.dateTime || event.start.date,
            attendees: event.attendees || [],
            location: event.location || null,
            is_all_day: !event.start.dateTime,
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
  const startDate = url.searchParams.get('start');
  const endDate = url.searchParams.get('end');
  const limit = parseInt(url.searchParams.get('limit') || '50');

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
  const calendarId = url.searchParams.get('calendar_id');

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

// Helper function to refresh access token
async function refreshAccessToken(refreshToken: string) {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  return await response.json();
}
