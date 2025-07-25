import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface ContentSuggestion {
  id: string;
  title: string;
  description?: string;
  suggested_outline?: string;
}

interface ContentSuggestionsProps {
  onWriteContent: (suggestion: ContentSuggestion) => void;
}

export const ContentSuggestions: React.FC<ContentSuggestionsProps> = ({
  onWriteContent
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchSuggestions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_suggestions')
        .select('id, title, description, suggested_outline')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;

      if (data && data.length > 0) {
        setSuggestions(data);
      } else {
        // No suggestions found, generate new ones
        await generateNewSuggestions();
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to load content suggestions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNewSuggestions = async () => {
    if (!user) return;

    try {
      setGenerating(true);
      const { data, error } = await supabase.functions.invoke('generate-content-suggestions', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
        toast({
          title: "Success",
          description: "New content suggestions generated!",
        });
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to generate new suggestions",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [user]);
  return <div className="w-full max-w-2xl mx-auto p-4">
      {/* Title Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 font-playfair">Welcome back Paul!</h1>
        
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-gray-600 hover:text-gray-900 text-xs"
          onClick={generateNewSuggestions}
          disabled={generating}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generating...' : 'New Suggestions'}
        </Button>
        
        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 text-xs">
          <Calendar className="h-3 w-3 mr-1" />
          See Calendar
        </Button>
      </div>

      {/* Content Card */}
      <Card className="border border-gray-200 shadow-sm rounded-lg">
        <CardContent className="p-0">
          {/* Card Header */}
          <div className="flex items-center gap-2 p-3 border-b border-gray-100">
            <div className="flex items-center justify-center w-6 h-6 bg-purple-600 rounded-full">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">For Today</h3>
              <p className="text-xs text-gray-500">Content Suggestions</p>
            </div>
          </div>

          {/* Suggestions List */}
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                Loading suggestions...
              </div>
            ) : suggestions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Sparkles className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No suggestions available. Click "New Suggestions" to generate some!</p>
              </div>
            ) : (
              suggestions.map(suggestion => (
                <div key={suggestion.id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 pr-3">
                    <p className="text-gray-800 font-medium text-sm">
                      "{suggestion.title}"
                    </p>
                    {suggestion.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {suggestion.description}
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onWriteContent(suggestion)} 
                    className="shrink-0 text-gray-700 border-gray-300 hover:bg-gray-100 text-xs h-7 px-2"
                  >
                    Write This
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>;
};