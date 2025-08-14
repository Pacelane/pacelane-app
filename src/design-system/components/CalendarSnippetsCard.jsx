import React from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { shadows, getShadow } from '@/design-system/tokens/shadows';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { typography } from '@/design-system/tokens/typography';
import Button from '@/design-system/components/Button';
import InlineTip from '@/design-system/components/InlineTip';
import { Clock, Users, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import googleCalendarLogo from '@/assets/images/google-calendar-logo.png';
import readaiLogo from '@/assets/images/readai-logo.webp';

const CalendarSnippetsCard = ({
  title = "Past Meetings",
  subtitle = "Turn your recent meetings into content",
  meetings = [],
  onMeetingClick = () => {},
  onViewAllClick = () => {},
  style = {},
  className = ''
}) => {
  const { colors } = useTheme();

  // Use only provided meetings; show empty state when none
  const displayMeetings = Array.isArray(meetings) ? meetings : [];

  // Card container styles
  const cardStyles = {
    backgroundColor: colors.bg.card.default,
    borderRadius: cornerRadius.borderRadius.xl,
    border: `1px solid ${colors.border.default}`,
    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
    padding: spacing.spacing[24],
    width: '100%',
    boxSizing: 'border-box',
    ...style
  };

  // Header styles
  const headerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.spacing[20]
  };

  const titleContainerStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[12]
  };

  const iconContainerStyles = {
    width: '32px',
    height: '32px',
    borderRadius: cornerRadius.borderRadius.md,
    backgroundColor: colors.bg.state.soft,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const titleStyle = {
    ...textStyles['2xl'].semibold,
    fontFamily: 'Awesome Serif VAR',
    color: colors.text.default,
    margin: 0
  };

  const subtitleStyle = {
    ...textStyles.sm.normal,
    color: colors.text.subtle,
    margin: 0,
    marginTop: spacing.spacing[2]
  };

  // Meeting item styles
  const meetingItemStyles = {
    padding: spacing.spacing[16],
    borderRadius: cornerRadius.borderRadius.md,
    border: `1px solid ${colors.border.default}`,
    backgroundColor: colors.bg.card.default,
    minWidth: '260px',
    width: '260px',
    flexShrink: 0,
    boxShadow: getShadow('regular.card', colors, { withBorder: true })
  };



  const meetingHeaderStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginBottom: spacing.spacing[12]
  };

  const dateHeaderStyle = {
    ...textStyles.sm.semibold,
    fontFamily: typography.fontFamily['awesome-serif'],
    color: colors.text.subtle,
    margin: 0,
    marginBottom: spacing.spacing[4]
  };

  const meetingTitleStyle = {
    ...textStyles.sm.semibold,
    color: colors.text.default,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  };

  const meetingMetaStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[12],
    marginBottom: spacing.spacing[16]
  };

  const metaItemStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[4],
    ...textStyles.xs.normal,
    color: colors.text.muted
  };

  const snippetStyle = {
    ...textStyles.xs.normal,
    color: colors.text.subtle,
    lineHeight: '1.4',
    margin: 0
  };

  const viewAllButtonStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[4],
    background: 'none',
    border: 'none',
    color: colors.text.subtle,
    cursor: 'pointer',
    fontSize: '14px',
    padding: 0,
    transition: 'color 0.2s ease'
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format date for card header (e.g., "Jan 14")
  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };


  const [scrollPosition, setScrollPosition] = React.useState(0);
  const scrollContainerRef = React.useRef(null);
  
  // Drag state
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, scrollLeft: 0 });

  // Scroll handlers
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = 280; // Width of one meeting card + gap
      const newPosition = Math.max(0, scrollPosition - scrollAmount);
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = 280; // Width of one meeting card + gap
      const maxScroll = container.scrollWidth - container.clientWidth;
      const newPosition = Math.min(maxScroll, scrollPosition + scrollAmount);
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setScrollPosition(scrollContainerRef.current.scrollLeft);
    }
  };

  // Drag handlers
  const handleMouseDown = (e) => {
    if (!scrollContainerRef.current) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.pageX - scrollContainerRef.current.offsetLeft,
      scrollLeft: scrollContainerRef.current.scrollLeft
    });
    
    // Prevent text selection during drag
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !scrollContainerRef.current) return;
    
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - dragStart.x) * 2; // Scroll speed multiplier
    const newScrollLeft = dragStart.scrollLeft - walk;
    
    scrollContainerRef.current.scrollLeft = newScrollLeft;
    setScrollPosition(newScrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Add global mouse events for dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // Check if arrows should be visible
  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = scrollContainerRef.current 
    ? scrollPosition < (scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth)
    : false;

  return (
    <div style={cardStyles} className={className}>
      {/* Header */}
      <div style={headerStyles}>
        <div style={titleContainerStyles}>
          <div style={iconContainerStyles}>
            <img 
              src={googleCalendarLogo}
              alt="Google Calendar"
              style={{
                width: '16px',
                height: '16px',
                objectFit: 'contain'
              }}
            />
          </div>
          <div>
            <h3 style={titleStyle}>{title}</h3>
            <p style={subtitleStyle}>{subtitle}</p>
          </div>
        </div>

      </div>

      {/* Read.ai Connection Tip */}
      <InlineTip 
        icon={
          <img 
            src={readaiLogo}
            alt="Read.ai"
            style={{
              width: '24px',
              height: '24px',
              objectFit: 'contain'
            }}
          />
        }
        style={{ 
          marginBottom: spacing.spacing[20],
          gap: spacing.spacing[16] // Increase gap between icon and content
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          width: '100%',
          gap: spacing.spacing[16]
        }}>
          <span>
            <strong>Connect Read.ai</strong> to automatically capture meeting transcriptions and create higher-quality content with context from your conversations
          </span>
          <Button
            size="xs"
            style="primary"
            label="Connect"
            onClick={() => {
              // TODO: Handle Read.ai connection
              console.log('Connect Read.ai clicked');
            }}
          />
        </div>
      </InlineTip>

      {/* Meetings List with Scroll Controls */}
      <div style={{ position: 'relative' }}>
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            style={{
              position: 'absolute',
              left: '-12px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              width: '32px',
              height: '32px',
              borderRadius: cornerRadius.borderRadius.full,
              backgroundColor: colors.bg.card.default,
              border: `1px solid ${colors.border.default}`,
              boxShadow: getShadow('component.default', colors),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = colors.bg.card.subtle;
              e.target.style.transform = 'translateY(-50%) scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = colors.bg.card.default;
              e.target.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <ChevronLeft size={16} color={colors.icon.default} />
          </button>
        )}

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            style={{
              position: 'absolute',
              right: '-12px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              width: '32px',
              height: '32px',
              borderRadius: cornerRadius.borderRadius.full,
              backgroundColor: colors.bg.card.default,
              border: `1px solid ${colors.border.default}`,
              boxShadow: getShadow('component.default', colors),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = colors.bg.card.subtle;
              e.target.style.transform = 'translateY(-50%) scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = colors.bg.card.default;
              e.target.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <ChevronRight size={16} color={colors.icon.default} />
          </button>
        )}

        {/* Fade Overlays */}
        {canScrollLeft && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '40px',
              background: `linear-gradient(to right, ${colors.bg.card.default} 0%, transparent 100%)`,
              zIndex: 1,
              pointerEvents: 'none'
            }}
          />
        )}
        {canScrollRight && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '40px',
              background: `linear-gradient(to left, ${colors.bg.card.default} 0%, transparent 100%)`,
              zIndex: 1,
              pointerEvents: 'none'
            }}
          />
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          style={{
            display: 'flex',
            gap: spacing.spacing[16],
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitScrollbar: { display: 'none' },
            paddingBottom: spacing.spacing[4],
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none' // Prevent text selection during drag
          }}
        >
          {displayMeetings.map((meeting) => (
            <div
              key={meeting.id}
              style={{
                ...meetingItemStyles,
                pointerEvents: isDragging ? 'none' : 'auto' // Disable interactions while dragging
              }}
            >
              {/* Meeting Header */}
              <div style={meetingHeaderStyles}>
                <h5 style={dateHeaderStyle}>{formatDateHeader(meeting.date)}</h5>
                <h4 style={meetingTitleStyle}>{meeting.title}</h4>
              </div>

              {/* Meeting Meta */}
              <div style={meetingMetaStyles}>
                <div style={metaItemStyles}>
                  <Clock size={12} color={colors.icon.muted} />
                  <span>{meeting.time}</span>
                </div>
                <div style={metaItemStyles}>
                  <Users size={12} color={colors.icon.muted} />
                  <span>{meeting.attendees} attendees</span>
                </div>
              </div>

              {/* Generate Content Button */}
              <Button
                size="xs"
                style="secondary"
                label="Generate Content"
                leadIcon={<Sparkles size={12} />}
                onClick={() => onMeetingClick(meeting)}
                fullWidth
              />
            </div>
          ))}
        </div>
      </div>

      {/* Empty State (if no meetings) */}
      {displayMeetings.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: spacing.spacing[32],
          color: colors.text.muted
        }}>
          <img 
            src={googleCalendarLogo}
            alt="Google Calendar"
            style={{
              width: '24px',
              height: '24px',
              objectFit: 'contain',
              marginBottom: spacing.spacing[8],
              opacity: 0.6
            }}
          />
          <div style={{ ...textStyles.sm.normal, marginBottom: spacing.spacing[4] }}>
            No recent meetings found
          </div>
          <div style={{ ...textStyles.xs.normal }}>
            Your meeting recordings will appear here
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarSnippetsCard;
