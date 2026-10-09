import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import type { ChatMessage } from '@/types';
import { generateAIResponse, getWelcomeMessage, createMessage, quickPrompts } from '@/lib/aiAssistant';

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([createMessage('ai', getWelcomeMessage())]);
    }
  }, [open, messages.length]);

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

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-accent-500 hover:bg-accent-400 text-navy-900 font-semibold px-5 py-3.5 shadow-lg shadow-accent-500/30 transition-all hover:scale-105 active:scale-95"
        >
          <Bot className="h-5 w-5" />
          <span className="hidden sm:inline text-sm">AI Assistant</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-0 right-0 sm:bottom-5 sm:right-5 z-50 w-full sm:w-96 h-[100dvh] sm:h-[32rem] sm:max-h-[80vh] flex flex-col rounded-none sm:rounded-2xl bg-navy-800 border border-navy-600/40 shadow-2xl animate-slide-up overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-navy-700 to-navy-800 border-b border-navy-600/40">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">LoanSure AI Assistant</h3>
                <p className="text-[10px] text-accent-400">Online · Informational guidance</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-navy-300 hover:text-white p-1">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
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
              <div className="flex justify-start">
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
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
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
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-navy-600/40 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ask about loans, EMI, eligibility..."
              className="flex-1 rounded-lg bg-navy-800/60 border border-navy-500/40 px-3.5 py-2.5 text-sm text-white placeholder:text-navy-300/60 focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400/30"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="rounded-lg bg-accent-500 hover:bg-accent-400 text-navy-900 p-2.5 transition-colors disabled:opacity-50"
            >
              <Send className="h-4.5 w-4.5" width={18} height={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
