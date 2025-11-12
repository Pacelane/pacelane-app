import React, { useState, useMemo } from 'react';
import { useTheme } from '../services/theme-context.jsx';
import { spacing } from '../design-system/tokens/spacing.js';
import { textStyles } from '../design-system/styles/typography/typography-styles.js';
import { typography } from '../design-system/tokens/typography.js';

// Design System Components
import Button from '../design-system/components/Button.jsx';
import Tabs from '../design-system/components/Tabs.jsx';
import Input from '../design-system/components/Input.jsx';
import DropdownMenu from '../design-system/components/DropdownMenu.jsx';
import EmptyState from '../design-system/components/EmptyState.jsx';

// Icons
import { 
  Search, 
  ChevronDown, 
  CheckCheck,
  Bell,
  FileText,
  Users,
  Gear as Settings,
  CreditCard,
  CheckCircle,
  Warning as AlertTriangle,
  Info
} from '@phosphor-icons/react';

// Mock notification data
const mockNotifications = [
  {
    id: '1',
    title: 'Content published successfully',
    message: 'Your post "10 Marketing Tips" has been published and is now live.',
    category: 'content',
    type: 'success',
    isRead: false,
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    icon: FileText
  },
  {
    id: '2',
    title: 'New team member added',
    message: 'Sarah Johnson has joined your workspace and can now collaborate on projects.',
    category: 'collaboration',
    type: 'info',
    isRead: false,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    icon: Users
  },
  {
    id: '3',
    title: 'Content suggestion available',
    message: 'We\'ve generated 5 new content ideas based on your recent activity.',
    category: 'content',
    type: 'info',
    isRead: true,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    icon: Bell
  },
  {
    id: '4',
    title: 'System maintenance scheduled',
    message: 'Planned maintenance will occur tomorrow from 2-4 AM UTC. No action required.',
    category: 'system',
    type: 'warning',
    isRead: false,
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    icon: Settings
  },
  {
    id: '5',
    title: 'Payment processed',
    message: 'Your monthly subscription payment of $29.99 has been processed successfully.',
    category: 'account',
    type: 'success',
    isRead: true,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    icon: CreditCard
  },
  {
    id: '6',
    title: 'Weekly analytics ready',
    message: 'Your content performance report for this week is now available in the dashboard.',
    category: 'content',
    type: 'info',
    isRead: true,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    icon: FileText
  }
];

// NotificationItem component - inline since it's page-specific
const NotificationItem = ({ notification, onRead }) => {
  const { colors } = useTheme();
  const IconComponent = notification.icon;
  
  const getTypeColor = () => {
    switch (notification.type) {
      case 'success': return colors.icon.success;
      case 'warning': return colors.icon.warning;
      case 'error': return colors.text.destructive;
      default: return colors.icon.default;
    }
  };
  
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };
  
  const containerStyles = {
    display: 'flex',
    gap: spacing.spacing[12],
    padding: spacing.spacing[16],
    backgroundColor: notification.isRead ? 'transparent' : colors.bg.card.subtle,
    borderRadius: '8px',
    border: `1px solid ${colors.border.default}`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    opacity: notification.isRead ? 0.7 : 1
  };
  
  const handleClick = () => {
    if (!notification.isRead) {
      onRead(notification.id);
    }
  };
  
  return (
    <div style={containerStyles} onClick={handleClick}>
      <div style={{ flexShrink: 0, marginTop: spacing.spacing[4] }}>
        <IconComponent size={20} color={getTypeColor()} />
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          gap: spacing.spacing[8]
        }}>
          <h4 style={{
            ...textStyles.sm.semibold,
            color: colors.text.default,
            margin: 0
          }}>
            {notification.title}
          </h4>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8] }}>
            <span style={{
              ...textStyles.xs.medium,
              color: colors.text.muted,
              flexShrink: 0
            }}>
              {formatTimeAgo(notification.timestamp)}
            </span>
            
            {!notification.isRead && (
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: colors.text.accent,
                flexShrink: 0
              }} />
            )}
          </div>
        </div>
        
        <p style={{
          ...textStyles.sm.normal,
          color: colors.text.subtle,
          margin: `${spacing.spacing[4]}px 0 0 0`
        }}>
          {notification.message}
        </p>
      </div>
    </div>
  );
};

/**
 * NotificationsPage component - Notifications management page
 */
const NotificationsPage = () => {
  const { colors } = useTheme();
  
  // State management
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  
  // Get notification counts for tab badges
  const notificationCounts = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.isRead).length;
    return { total, unread };
  }, [notifications]);
  
  // Filter and sort notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;
    
    // Filter by tab
    if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    } else if (activeTab !== 'all') {
      filtered = filtered.filter(n => n.category === activeTab);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(notification => 
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query) ||
        notification.category.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    if (sortBy === 'oldest') {
      filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } else {
      filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    
    return filtered;
  }, [activeTab, searchQuery, sortBy, notifications]);
  
  // Content is wrapped by MainAppChrome 840px container; keep transparent background
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[32],
    backgroundColor: 'transparent',
  };
  
  // Title style using awesome serif font
  const titleStyle = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['4xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0
  };
  
  // Header actions style
  const headerActionsStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.spacing[16],
    flexWrap: 'wrap'
  };
  
  // Search and filter row style
  const searchFilterStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[16],
    flexWrap: 'wrap'
  };
  
  // Notifications list style
  const notificationsListStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[12]
  };
  
  // Empty state style
  const emptyStateStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.spacing[16],
    padding: spacing.spacing[48],
    textAlign: 'center'
  };
  
  // Tab items with badges
  const tabItems = [
    { 
      id: 'all', 
      label: 'All', 
      badge: notificationCounts.total > 0 ? notificationCounts.total.toString() : null 
    },
    { 
      id: 'unread', 
      label: 'Unread', 
      badge: notificationCounts.unread > 0 ? notificationCounts.unread.toString() : null 
    },
    { id: 'content', label: 'Content' },
    { id: 'collaboration', label: 'Team' },
    { id: 'system', label: 'System' },
    { id: 'account', label: 'Account' }
  ];
  
  // Sort options
  const sortOptions = [
    { label: 'Newest first', value: 'newest' },
    { label: 'Oldest first', value: 'oldest' }
  ];
  
  // Event handlers
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSortChange = (item, index) => {
    setSortBy(sortOptions[index].value);
    setShowSortDropdown(false);
  };
  
  const handleMarkAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };
  
  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };
  

  
  return (
    <div style={containerStyles}>
      {/* Page Header */}
      <div>
        <h1 style={titleStyle}>Notifications</h1>
        <p style={{
          ...textStyles.sm.medium,
          color: colors.text.subtle,
          margin: 0,
          marginTop: spacing.spacing[8],
        }}>
          Stay updated with the latest activity and important updates
        </p>
      </div>
      
      {/* Header Actions */}
      <div style={headerActionsStyle}>
        <div style={searchFilterStyle}>
          <Input
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={handleSearchChange}
            leadIcon={<Search size={16} />}
            style={{ minWidth: '300px' }}
          />
          
          <DropdownMenu
            trigger={
              <Button
                style="secondary"
                size="md"
                label={`Sort: ${sortOptions.find(opt => opt.value === sortBy)?.label}`}
                tailIcon={<ChevronDown size={12} />}
              />
            }
            items={sortOptions.map(option => option.label)}
            onItemClick={handleSortChange}
            isOpen={showSortDropdown}
            onOpenChange={setShowSortDropdown}
          />
        </div>
        
        {notificationCounts.unread > 0 && (
          <Button
            style="secondary"
            size="md"
            label="Mark all as read"
            leadIcon={<CheckCheck size={16} />}
            onClick={handleMarkAllAsRead}
          />
        )}
      </div>
      
      {/* Tabs */}
      <Tabs
        items={tabItems}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      
      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div style={notificationsListStyle}>
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={handleMarkAsRead}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={searchQuery 
            ? 'No notifications found' 
            : activeTab === 'unread' 
              ? 'No unread notifications' 
              : 'No notifications yet'
          }
          subtitle={searchQuery 
            ? 'Try adjusting your search terms or filters' 
            : activeTab === 'unread' 
              ? 'All caught up! Check back later for new updates.' 
              : 'When you receive notifications, they\'ll appear here.'
          }
        />
      )}
    </div>
  );
};

export default NotificationsPage;