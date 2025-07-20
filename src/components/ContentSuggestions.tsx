import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Sparkles } from 'lucide-react';

interface ContentSuggestion {
  id: string;
  title: string;
}

interface ContentSuggestionsProps {
  onWriteContent: (suggestion: ContentSuggestion) => void;
}

export const ContentSuggestions: React.FC<ContentSuggestionsProps> = ({ onWriteContent }) => {
  const suggestions: ContentSuggestion[] = [
    {
      id: '1',
      title: 'How to run a Primary Research using AI'
    },
    {
      id: '2',
      title: '5 Steps to create better Affinity Maps'
    },
    {
      id: '3',
      title: 'Design Systems: How to use tokens in the context of Cursor Rules'
    }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-gray-700">Our suggestion for today</h2>
        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
          <Calendar className="h-4 w-4 mr-2" />
          See Calendar
        </Button>
      </div>

      {/* Content Card */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-0">
          {/* Card Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-100">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-600 rounded-full">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">For Today</h3>
              <p className="text-sm text-gray-500">Content Suggestions</p>
            </div>
          </div>

          {/* Suggestions List */}
          <div className="divide-y divide-gray-100">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-lg mx-2 transition-colors duration-200">
                <p className="text-gray-800 font-medium flex-1 pr-4">
                  "{suggestion.title}"
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onWriteContent(suggestion)}
                  className="shrink-0 text-gray-700 border-gray-300 hover:bg-gray-100"
                >
                  Write This
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};