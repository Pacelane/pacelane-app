import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Send } from 'lucide-react';
interface ChatInterfaceProps {
  onSendMessage: (message: string) => void;
}
export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onSendMessage
}) => {
  const [message, setMessage] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };
  return <div className="flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 font-playfair">or if you have a better idea...</h1>
          <p className="text-gray-600">Start with a simple idea and get a first draft</p>
        </div>
        
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center gap-2 p-4 border rounded-lg bg-white shadow-sm">
            <Button type="button" variant="ghost" size="icon" className="shrink-0">
              <Plus className="h-5 w-5" />
            </Button>
            
            <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Create new post about..." className="flex-1 border-none shadow-none focus-visible:ring-0 text-base" />
            
            <Button type="submit" size="icon" className="shrink-0 bg-blue-600 hover:bg-blue-700">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>;
};