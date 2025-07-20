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
    <div className="w-full max-w-2xl mx-auto p-4">
      {/* Title Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 font-playfair">or if you have a better idea...</h1>
        <p className="text-gray-600">Start with a simple idea and get a first draft</p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-700">Our suggestion for today</h2>
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
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                <p className="text-gray-800 font-medium flex-1 pr-3 text-sm">
                  "{suggestion.title}"
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onWriteContent(suggestion)}
                  className="shrink-0 text-gray-700 border-gray-300 hover:bg-gray-100 text-xs h-7 px-2"
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