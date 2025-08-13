import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CalendarService } from '../services/calendarService';
import { useToast } from '../design-system/components/Toast.jsx';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../design-system/components/Card.jsx';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export const GoogleCalendarCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Google Calendar authorization...');

  // Debug logging
  console.log('GoogleCalendarCallback component mounted');
  console.log('Search params:', searchParams.toString());

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`Authorization failed: ${error}`);
        }

        if (!code) {
          throw new Error('Authorization code not received');
        }

        if (!state) {
          throw new Error('State parameter missing');
        }

        setMessage('Connecting to Google Calendar...');

        const result = await CalendarService.handleCallback(code, state);
        
        if (result.success) {
          // Immediately sync events so tables are populated for the user
          try {
            setMessage('Syncing your calendar events...');
            await CalendarService.syncCalendar();
          } catch (_) {}

          setStatus('success');
          setMessage('Google Calendar connected successfully!');
          
          toast({
            title: "Calendar Connected",
            description: "Your Google Calendar has been connected successfully.",
          });

          // Redirect after a short delay
          setTimeout(() => {
            navigate('/product-home');
          }, 2000);
        } else {
          throw new Error(result.error || 'Failed to connect calendar');
        }
      } catch (error: any) {
        console.error('Calendar callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to connect Google Calendar');
        
        toast({
          title: "Connection Failed",
          description: error.message || 'Failed to connect Google Calendar',
          variant: "destructive",
        });

        // Redirect to dashboard after a delay even on error
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle>Google Calendar Integration</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Processing your authorization...'}
            {status === 'success' && 'Successfully connected!'}
            {status === 'error' && 'Connection failed'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            {message}
          </p>
          {status !== 'loading' && (
            <p className="text-center text-xs text-muted-foreground mt-4">
              Redirecting you back to the dashboard...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleCalendarCallback;
