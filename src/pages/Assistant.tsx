import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, RotateCcw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import type { ChatMessage } from '@/types';
import { generateAIResponse, getWelcomeMessage, createMessage, quickPrompts } from '@/lib/aiAssistant';

export default function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([createMessage('ai', getWelcomeMessage())]);
    }
  }, [messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg = createMessage('user', text);
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const aiText = generateAIResponse(text);
      const aiMsg = createMessage('ai', aiText);
      setMessages((prev) => [...prev, aiMsg]);
      setTyping(false);
    }, 800 + Math.random() * 600);
  };

  const clearChat = () => {
    setMessages([createMessage('ai', getWelcomeMessage())]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">AI Loan Assistant</h2>
          <p className="text-sm text-navy-300">Get guidance on loans, eligibility, EMI and documents</p>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-1.5 text-sm text-navy-300 hover:text-accent-400 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Clear Chat
        </button>
      </div>

      <Card className="flex flex-col h-[calc(100vh-16rem)] min-h-[400px]">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-navy-600/40 bg-gradient-to-r from-navy-700/50 to-transparent">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">LoanSure AI Assistant</h3>
            <p className="text-[10px] text-accent-400">Online · Informational guidance only</p>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'ai' && (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-accent-500 text-navy-900 rounded-br-sm'
                    : 'bg-navy-700 text-navy-100 rounded-bl-sm border border-navy-600/40'
                }`}
              >
                {msg.text}
                <span className={`block text-[9px] mt-1 ${msg.sender === 'user' ? 'text-navy-700' : 'text-navy-400'}`}>
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-navy-700 border border-navy-600/40 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                <span className="typing-dot h-2 w-2 rounded-full bg-accent-400" />
                <span className="typing-dot h-2 w-2 rounded-full bg-accent-400" />
                <span className="typing-dot h-2 w-2 rounded-full bg-accent-400" />
              </div>
            </div>
          )}
        </div>

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div className="px-5 py-3 border-t border-navy-600/40">
            <p className="text-xs text-navy-300 mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-xs rounded-full bg-navy-700 border border-navy-500/40 px-3 py-1.5 text-navy-100 hover:border-accent-400 hover:text-accent-400 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-5 py-4 border-t border-navy-600/40 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask about loans, EMI, eligibility..."
            className="flex-1 rounded-lg bg-navy-800/60 border border-navy-500/40 px-4 py-2.5 text-sm text-white placeholder:text-navy-300/60 focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400/30"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            className="rounded-lg bg-accent-500 hover:bg-accent-400 text-navy-900 p-2.5 transition-colors disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </Card>

      <div className="rounded-xl bg-navy-700/40 border border-navy-500/20 px-4 py-3">
        <p className="text-xs text-navy-300">
          LoanSure AI provides informational estimates only. The AI is not a bank or lender and cannot guarantee loan approval. Final decisions are made by individual lenders.
        </p>
      </div>
    </div>
  );
}
