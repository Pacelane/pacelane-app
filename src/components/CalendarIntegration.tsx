import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, RefreshCw, Link, Unlink, Clock, Users, MapPin } from 'lucide-react';
import { CalendarService, CalendarConnection, CalendarEvent } from '@/services/calendarService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface CalendarIntegrationProps {
  onMeetingSelect?: (meeting: CalendarEvent) => void;
}

export const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({ onMeetingSelect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectedCalendars, setConnectedCalendars] = useState<CalendarConnection[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<CalendarEvent[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<CalendarEvent[]>([]);
  const [hasCalendars, setHasCalendars] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkCalendarStatus();
    if (hasCalendars) {
      loadCalendarData();
    }
  }, [hasCalendars]);

  const checkCalendarStatus = async () => {
    const hasConnected = await CalendarService.hasConnectedCalendars();
    setHasCalendars(hasConnected);
    if (hasConnected) {
      loadConnectedCalendars();
    }
  };

  const loadConnectedCalendars = async () => {
    const result = await CalendarService.getConnectedCalendars();
    if (result.success && result.calendars) {
      setConnectedCalendars(result.calendars);
    }
  };

  const loadCalendarData = async () => {
    const upcoming = await CalendarService.getUpcomingMeetings(5);
    const recent = await CalendarService.getRecentMeetings(5);
    setUpcomingMeetings(upcoming);
    setRecentMeetings(recent);
  };

  const handleConnectCalendar = async () => {
    setIsConnecting(true);
    try {
      const result = await CalendarService.getAuthUrl();
      if (result.success && result.authUrl) {
        // Store user ID in localStorage for the callback
        const user = JSON.parse(localStorage.getItem('supabase.auth.token') || '{}');
        const userId = user?.currentSession?.user?.id;
        
        if (userId) {
          // Add user ID to state parameter for OAuth callback
          const authUrl = new URL(result.authUrl);
          authUrl.searchParams.set('state', userId);
          
          // Redirect in the same window instead of popup for better OAuth handling
          window.location.href = authUrl.toString();
          
          toast({
            title: "Calendar Connection",
            description: "Please complete the Google Calendar authorization in the new window.",
          });
        } else {
          throw new Error('User not authenticated');
        }
      } else {
        throw new Error(result.error || 'Failed to get auth URL');
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || 'Failed to connect to Google Calendar',
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSyncCalendar = async () => {
    setIsSyncing(true);
    try {
      const result = await CalendarService.syncCalendar();
      if (result.success) {
        toast({
          title: "Calendar Synced",
          description: result.message,
        });
        await loadCalendarData();
        await loadConnectedCalendars();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message || 'Failed to sync calendar',
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectCalendar = async (calendarId?: string) => {
    try {
      const result = await CalendarService.disconnectCalendar(calendarId);
      if (result.success) {
        toast({
          title: "Calendar Disconnected",
          description: result.message,
        });
        await checkCalendarStatus();
        setConnectedCalendars([]);
        setUpcomingMeetings([]);
        setRecentMeetings([]);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: "Disconnect Failed",
        description: error.message || 'Failed to disconnect calendar',
        variant: "destructive",
      });
    }
  };

  const handleMeetingSelect = (meeting: CalendarEvent) => {
    if (onMeetingSelect) {
      onMeetingSelect(meeting);
    }
  };

  const formatMeetingTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start.toDateString() === end.toDateString()) {
      return `${format(start, 'MMM d, yyyy')} at ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
    } else {
      return `${format(start, 'MMM d, yyyy h:mm a')} - ${format(end, 'MMM d, yyyy h:mm a')}`;
    }
  };

  if (!hasCalendars) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Integration
          </CardTitle>
          <CardDescription>
            Connect your Google Calendar to generate content based on your meetings and schedule.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleConnectCalendar} 
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Link className="h-4 w-4 mr-2" />
                Connect Google Calendar
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connected Calendars */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Connected Calendars
          </CardTitle>
          <CardDescription>
            Your connected Google Calendar accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {connectedCalendars.map((calendar) => (
              <div key={calendar.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium">{calendar.calendar_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Last synced: {format(new Date(calendar.last_sync), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  {calendar.is_primary && (
                    <Badge variant="secondary">Primary</Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDisconnectCalendar(calendar.calendar_id)}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSyncCalendar} disabled={isSyncing}>
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => handleDisconnectCalendar()}
            >
              <Unlink className="h-4 w-4 mr-2" />
              Disconnect All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Meetings */}
      {upcomingMeetings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Meetings
            </CardTitle>
            <CardDescription>
              Select a meeting to generate content from
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingMeetings.map((meeting) => (
                <div 
                  key={meeting.id} 
                  className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleMeetingSelect(meeting)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{meeting.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatMeetingTime(meeting.start_time, meeting.end_time)}
                      </p>
                      {meeting.description && (
                        <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                          {meeting.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {meeting.attendees && meeting.attendees.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {meeting.attendees.length} attendees
                          </span>
                        )}
                        {meeting.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {meeting.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Generate Content
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Meetings */}
      {recentMeetings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Meetings
            </CardTitle>
            <CardDescription>
              Generate follow-up content from recent meetings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMeetings.map((meeting) => (
                <div 
                  key={meeting.id} 
                  className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleMeetingSelect(meeting)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{meeting.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatMeetingTime(meeting.start_time, meeting.end_time)}
                      </p>
                      {meeting.description && (
                        <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                          {meeting.description}
                        </p>
                      )}
                    </div>
                    <Button size="sm" variant="outline">
                      Generate Follow-up
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
