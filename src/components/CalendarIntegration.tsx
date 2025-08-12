import React, { useState, useEffect } from 'react';
import Button from '../design-system/components/Button.jsx';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../design-system/components/Card.jsx';
import Badge from '../design-system/components/Badge.jsx';
import Toggle from '../design-system/components/Toggle.jsx';
import { Calendar, RefreshCw, Link, Unlink, Clock, Users, MapPin } from 'lucide-react';
import { CalendarService, CalendarConnection, CalendarEvent } from '../services/calendarService';
import { useToast } from '../design-system/components/Toast.jsx';
import { format } from 'date-fns';
import { useAuth } from '../hooks/api/useAuth';

// Design System Tokens
import { useTheme } from '../services/theme-context';
import { spacing } from '../design-system/tokens/spacing';
import { textStyles } from '../design-system/styles/typography/typography-styles';
import { cornerRadius } from '../design-system/tokens/corner-radius';
import { shadows, getShadow } from '../design-system/tokens/shadows';

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
  const { user, loading } = useAuth();
  const { colors } = useTheme();

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
      if (loading) {
        throw new Error('Authentication loading...');
      }
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const result = await CalendarService.getAuthUrl();
      if (result.success && result.authUrl) {
        // Add user ID to state parameter for OAuth callback
        const authUrl = new URL(result.authUrl);
        authUrl.searchParams.set('state', user.id);
        
        // Redirect in the same window instead of popup for better OAuth handling
        window.location.href = authUrl.toString();
        
        toast({
          title: "Calendar Connection",
          description: "Please complete the Google Calendar authorization in the new window.",
        });
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
      <Card style={{ width: '100%' }}>
        <CardHeader>
          <CardTitle style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8] }}>
            <Calendar size={20} />
            Google Calendar Integration
          </CardTitle>
          <CardDescription>
            Connect your Google Calendar to generate content based on your meetings and schedule.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleConnectCalendar} 
            disabled={isConnecting || loading || !user}
            style={{ width: '100%' }}
          >
            {isConnecting ? (
              <>
                <RefreshCw size={16} style={{ marginRight: spacing.spacing[8] }} />
                Connecting...
              </>
            ) : (
              <>
                <Link size={16} style={{ marginRight: spacing.spacing[8] }} />
                Connect Google Calendar
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[24] }}>
      {/* Connected Calendars */}
      <Card>
        <CardHeader>
          <CardTitle style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8] }}>
            <Calendar size={20} />
            Connected Calendars
          </CardTitle>
          <CardDescription>
            Your connected Google Calendar accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[12] }}>
            {connectedCalendars.map((calendar) => (
              <div 
                key={calendar.id} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: spacing.spacing[12],
                  border: `1px solid ${colors.border.default}`,
                  borderRadius: cornerRadius.borderRadius.lg,
                  backgroundColor: colors.bg.card.subtle
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[12] }}>
                  <Calendar size={16} style={{ color: colors.icon.highlight }} />
                  <div>
                    <p style={{ ...textStyles.sm.medium, color: colors.text.default }}>
                      {calendar.calendar_name}
                    </p>
                    <p style={{ ...textStyles.xs.normal, color: colors.text.subtle }}>
                      Last synced: {format(new Date(calendar.last_sync), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  {calendar.is_primary && (
                    <Badge variant="secondary">Primary</Badge>
                  )}
                </div>
                <Button
                  style="secondary"
                  size="sm"
                  onClick={() => handleDisconnectCalendar(calendar.calendar_id)}
                >
                  <Unlink size={16} style={{ marginRight: spacing.spacing[8] }} />
                  Disconnect
                </Button>
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: spacing.spacing[8], marginTop: spacing.spacing[16] }}>
            <Button onClick={handleSyncCalendar} disabled={isSyncing}>
              {isSyncing ? (
                <>
                  <RefreshCw size={16} style={{ marginRight: spacing.spacing[8] }} />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw size={16} style={{ marginRight: spacing.spacing[8] }} />
                  Sync Now
                </>
              )}
            </Button>
            
            <Button 
              style="secondary"
              onClick={() => handleDisconnectCalendar()}
            >
              <Unlink size={16} style={{ marginRight: spacing.spacing[8] }} />
              Disconnect All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Meetings */}
      {upcomingMeetings.length > 0 && (
        <Card>
                  <CardHeader>
          <CardTitle style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8] }}>
            <Clock size={20} />
            Upcoming Meetings
          </CardTitle>
          <CardDescription>
            Select a meeting to generate content from
          </CardDescription>
        </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[12] }}>
              {upcomingMeetings.map((meeting) => (
                <div 
                  key={meeting.id} 
                  style={{
                    padding: spacing.spacing[12],
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: cornerRadius.borderRadius.lg,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: colors.bg.card.subtle
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bg.card.default;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bg.card.subtle;
                  }}
                  onClick={() => handleMeetingSelect(meeting)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ ...textStyles.sm.medium, color: colors.text.default }}>
                        {meeting.title}
                      </h4>
                      <p style={{ ...textStyles.xs.normal, color: colors.text.subtle }}>
                        {formatMeetingTime(meeting.start_time, meeting.end_time)}
                      </p>
                      {meeting.description && (
                        <p style={{ 
                          ...textStyles.xs.normal, 
                          marginTop: spacing.spacing[8], 
                          color: colors.text.subtle,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {meeting.description}
                        </p>
                      )}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: spacing.spacing[16], 
                        marginTop: spacing.spacing[8] 
                      }}>
                        {meeting.attendees && meeting.attendees.length > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[4] }}>
                            <Users size={12} />
                            <span style={{ ...textStyles.xs.normal, color: colors.text.subtle }}>
                              {meeting.attendees.length} attendees
                            </span>
                          </span>
                        )}
                        {meeting.location && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[4] }}>
                            <MapPin size={12} />
                            <span style={{ ...textStyles.xs.normal, color: colors.text.subtle }}>
                              {meeting.location}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" style="secondary">
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
          <CardTitle style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8] }}>
            <Clock size={20} />
            Recent Meetings
          </CardTitle>
          <CardDescription>
            Generate follow-up content from recent meetings
          </CardDescription>
        </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[12] }}>
              {recentMeetings.map((meeting) => (
                <div 
                  key={meeting.id} 
                  style={{
                    padding: spacing.spacing[12],
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: cornerRadius.borderRadius.lg,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: colors.bg.card.subtle
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bg.card.default;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bg.card.subtle;
                  }}
                  onClick={() => handleMeetingSelect(meeting)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ ...textStyles.sm.medium, color: colors.text.default }}>
                        {meeting.title}
                      </h4>
                      <p style={{ ...textStyles.xs.normal, color: colors.text.subtle }}>
                        {formatMeetingTime(meeting.start_time, meeting.end_time)}
                      </p>
                      {meeting.description && (
                        <p style={{ 
                          ...textStyles.xs.normal, 
                          marginTop: spacing.spacing[8], 
                          color: colors.text.subtle,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {meeting.description}
                        </p>
                      )}
                    </div>
                    <Button size="sm" style="secondary">
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
