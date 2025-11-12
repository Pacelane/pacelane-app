import React, { useState, useEffect } from 'react';
import Button from '../design-system/components/Button.jsx';
import Badge from '../design-system/components/Badge.jsx';
import Tabs from '../design-system/components/Tabs.jsx';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../design-system/components/Card.jsx';
import { 
  Brain, 
  Calendar, 
  CheckCircle, 
  Clock, 
  ChatSquare as MessageSquare, 
  TrendingUp, 
  Users, 
  VideoCamera as VideoIcon,
  WarningCircle as AlertCircle,
  FileText,
  Target
} from '@phosphor-icons/react';
import { ReadAIService, ReadAIMeeting, ReadAIActionItem, MeetingInsights } from '../services/readAiService';
import { useToast } from '../design-system/components/Toast.jsx';
import { format } from 'date-fns';

interface ReadAiIntegrationProps {
  onMeetingSelect?: (meeting: ReadAIMeeting) => void;
}

export const ReadAiIntegration: React.FC<ReadAiIntegrationProps> = ({ onMeetingSelect }) => {
  const [meetings, setMeetings] = useState<ReadAIMeeting[]>([]);
  const [actionItems, setActionItems] = useState<ReadAIActionItem[]>([]);
  const [insights, setInsights] = useState<MeetingInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('meetings');

  const tabsConfig = [
    { id: 'meetings', label: 'Recent Meetings' },
    { id: 'action-items', label: 'Action Items' },
    { id: 'insights', label: 'Insights' }
  ];
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [meetingsResult, actionItemsResult, insightsResult] = await Promise.all([
        ReadAIService.getMeetings({ limit: 10 }),
        ReadAIService.getActionItems({ status: 'open', limit: 20 }),
        ReadAIService.getMeetingInsights({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
        })
      ]);

      if (meetingsResult.success) {
        setMeetings(meetingsResult.meetings || []);
      }

      if (actionItemsResult.success) {
        setActionItems(actionItemsResult.actionItems || []);
      }

      if (insightsResult.success) {
        setInsights(insightsResult.insights || null);
      }
    } catch (error: any) {
      toast({
        title: "Error Loading Data",
        description: error.message || 'Failed to load Read.ai data',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMeetingSelect = (meeting: ReadAIMeeting) => {
    if (onMeetingSelect) {
      onMeetingSelect(meeting);
    }
  };

  const updateActionItemStatus = async (actionItemId: string, status: string) => {
    try {
      const result = await ReadAIService.updateActionItem(actionItemId, { status: status as any });
      
      if (result.success) {
        toast({
          title: "Action Item Updated",
          description: `Status changed to ${status}`,
        });
        loadData(); // Reload to get updated data
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || 'Failed to update action item',
        variant: "destructive",
      });
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'zoom':
        return <VideoIcon className="h-4 w-4" />;
      case 'teams':
        return <MessageSquare className="h-4 w-4" />;
      case 'meet':
        return <VideoIcon className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Read.ai Meeting Intelligence
          </CardTitle>
          <CardDescription>Loading meeting insights...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (meetings.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Read.ai Meeting Intelligence
          </CardTitle>
          <CardDescription>
            No meeting data available. Make sure Read.ai is processing your meetings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Connect Read.ai to start getting meeting insights</p>
            <Button onClick={loadData}>
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Meeting Intelligence Overview */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Meetings</p>
                  <p className="text-2xl font-bold">{insights.totalMeetings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Duration</p>
                  <p className="text-2xl font-bold">{formatDuration(insights.totalDuration)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Action Items</p>
                  <p className="text-2xl font-bold">{insights.actionItemsStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold">
                    {insights.actionItemsStats.total > 0 
                      ? Math.round((insights.actionItemsStats.completed / insights.actionItemsStats.total) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Meeting Intelligence Dashboard
          </CardTitle>
          <CardDescription>
            AI-powered insights from your meetings for content generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            tabs={tabsConfig}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            style="pill"
            type="fixed"
          />

          <div style={{ marginTop: '24px' }}>
            {activeTab === 'meetings' && (
              <div className="space-y-4">
                {meetings.map((meeting) => (
                  <Card 
                    key={meeting.id} 
                    className="hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleMeetingSelect(meeting)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getPlatformIcon(meeting.platform)}
                            <h4 className="font-medium">{meeting.title}</h4>
                            <Badge variant="outline">{meeting.platform}</Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {format(new Date(meeting.start_time), 'MMM d, yyyy h:mm a')} • {formatDuration(meeting.duration_minutes)}
                          </p>
                          
                          {meeting.summary_text && (
                            <p className="text-sm mb-3 line-clamp-2">
                              {meeting.summary_text}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {meeting.participants?.length || 0} participants
                            </span>
                            
                            {meeting.topics && meeting.topics.length > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {meeting.topics.length} topics
                              </span>
                            )}
                            
                            {meeting.action_items && meeting.action_items.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {meeting.action_items.length} action items
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          Generate Content
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === 'action-items' && (
              <div className="space-y-4">
                {actionItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{item.title}</h4>
                            <Badge variant={getPriorityColor(item.priority)}>
                              {item.priority}
                            </Badge>
                            {item.due_date && (
                              <Badge variant="outline">
                                Due: {format(new Date(item.due_date), 'MMM d')}
                              </Badge>
                            )}
                          </div>
                          
                          {item.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {item.assignee_name && (
                              <span>Assigned to: {item.assignee_name}</span>
                            )}
                            {item.confidence_score && (
                              <span>Confidence: {Math.round(item.confidence_score)}%</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateActionItemStatus(item.id, 'in_progress')}
                          >
                            In Progress
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => updateActionItemStatus(item.id, 'completed')}
                          >
                            Complete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === 'insights' && insights && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Platform Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(insights.platformBreakdown).map(([platform, count]) => (
                          <div key={platform} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon(platform)}
                              <span className="capitalize">{platform}</span>
                            </div>
                            <span className="font-medium">{count} meetings</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Action Items Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-green-600">Completed</span>
                          <span className="font-medium">{insights.actionItemsStats.completed}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-yellow-600">Pending</span>
                          <span className="font-medium">{insights.actionItemsStats.pending}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-red-600">Overdue</span>
                          <span className="font-medium">{insights.actionItemsStats.overdue}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {insights.topTopics.length > 0 && (
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-lg">Top Discussion Topics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {insights.topTopics.slice(0, 6).map((topic) => (
                            <div key={topic.id} className="p-3 border rounded-lg">
                              <h5 className="font-medium mb-1">{topic.title}</h5>
                              <p className="text-sm text-muted-foreground mb-2">
                                {formatDuration(Math.round(topic.duration_seconds / 60))}
                              </p>
                              {topic.keywords && topic.keywords.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {topic.keywords.slice(0, 3).map((keyword, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {keyword}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
