import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CalendarService } from '@/services/calendarService';
import { CheckCircle, XCircle, ArrowsClockwise as RefreshCw } from '@phosphor-icons/react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { typography } from '@/design-system/tokens/typography';
import { getShadow } from '@/design-system/tokens/shadows';

export const GoogleCalendarCallback: React.FC = () => {
  const { colors } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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

          // Redirect after a short delay - let ProtectedRoute handle onboarding check
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

        // Redirect to dashboard after a delay even on error
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <RefreshCw size={32} weight="regular" style={{ animation: 'spin 1s linear infinite', color: colors.icon.default }} />;
      case 'success':
        return <CheckCircle size={32} weight="fill" color={colors.icon.success} />;
      case 'error':
        return <XCircle size={32} weight="fill" color={colors.icon.destructive} />;
      default:
        return null;
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.default,
    padding: spacing.spacing[24],
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '448px',
    backgroundColor: colors.bg.card.default,
    borderRadius: cornerRadius.borderRadius.lg,
    padding: spacing.spacing[32],
    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
  };

  const headerStyle = {
    textAlign: 'center' as const,
    marginBottom: spacing.spacing[24],
  };

  const titleStyle = {
    fontFamily: typography.fontFamily['instrument-serif'],
    fontSize: typography.desktop.size['3xl'],
    fontWeight: typography.desktop.weight.normal,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
    marginBottom: spacing.spacing[8],
  };

  const descriptionStyle = {
    fontSize: typography.desktop.size.sm,
    fontWeight: typography.desktop.weight.medium,
    lineHeight: typography.desktop.lineHeight.leading5,
    color: colors.text.subtle,
    margin: 0,
  };

  const messageStyle = {
    fontSize: typography.desktop.size.sm,
    fontWeight: typography.desktop.weight.normal,
    lineHeight: typography.desktop.lineHeight.leading5,
    color: colors.text.muted,
    textAlign: 'center' as const,
    margin: 0,
  };

  const redirectStyle = {
    fontSize: typography.desktop.size.xs,
    fontWeight: typography.desktop.weight.normal,
    lineHeight: typography.desktop.lineHeight.leading4,
    color: colors.text.muted,
    textAlign: 'center' as const,
    margin: 0,
    marginTop: spacing.spacing[16],
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={{ marginBottom: spacing.spacing[16] }}>
            {getIcon()}
          </div>
          <h1 style={titleStyle}>Google Calendar Integration</h1>
          <p style={descriptionStyle}>
            {status === 'loading' && 'Processing your authorization...'}
            {status === 'success' && 'Successfully connected!'}
            {status === 'error' && 'Connection failed'}
          </p>
        </div>
        <div>
          <p style={messageStyle}>
            {message}
          </p>
          {status !== 'loading' && (
            <p style={redirectStyle}>
              Redirecting you back to the dashboard...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleCalendarCallback;
