import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface ConversationSelectorProps {
  currentConversationId: string | null;
  onConversationChange: (conversationId: string | null) => void;
  onNewConversation: () => void;
}

export const ConversationSelector: React.FC<ConversationSelectorProps> = ({
  currentConversationId,
  onConversationChange,
  onNewConversation
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversations')
        .select('id, title, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const formatTitle = (title: string) => {
    if (!title || title.trim() === '') return 'Untitled Conversation';
    return title.length > 30 ? `${title.substring(0, 30)}...` : title;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <Select 
        value={currentConversationId || 'new'} 
        onValueChange={(value) => {
          if (value === 'new') {
            onNewConversation();
          } else {
            onConversationChange(value);
          }
        }}
      >
        <SelectTrigger className="flex-1 bg-white border-gray-200">
          <SelectValue>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                {currentConversationId 
                  ? formatTitle(conversations.find(c => c.id === currentConversationId)?.title || 'Current Chat')
                  : 'New Conversation'
                }
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
          <SelectItem value="new" className="hover:bg-gray-50">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-600" />
              <span>New Conversation</span>
            </div>
          </SelectItem>
          {conversations.length > 0 && (
            <>
              <div className="px-2 py-1 text-xs font-medium text-gray-500 border-t border-gray-100 mt-1">
                Recent Conversations
              </div>
              {conversations.map((conversation) => (
                <SelectItem key={conversation.id} value={conversation.id} className="hover:bg-gray-50">
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {formatTitle(conversation.title)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(conversation.updated_at)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
      <Button 
        size="icon" 
        variant="outline" 
        onClick={onNewConversation}
        className="h-10 w-10 border-gray-200 hover:bg-gray-50"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};