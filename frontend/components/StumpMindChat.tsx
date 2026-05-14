'use client';

import { chatWithStumpMind } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, MessageCircle, Send, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function StumpMindChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await chatWithStumpMind(msg, history);
      setMessages(prev => [...prev, { role: 'model', content: res.reply || 'No response.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'model', content: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl
                   bg-[rgb(var(--color-primary))] text-white flex items-center justify-center
                   hover:scale-105 active:scale-95 transition-transform"
        aria-label="Open StumpMind"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)]
                       h-[500px] max-h-[calc(100vh-8rem)]
                       glass rounded-2xl shadow-2xl border border-[rgba(var(--color-border),0.3)]
                       flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[rgba(var(--color-border),0.2)] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[rgba(var(--color-primary),0.2)] flex items-center justify-center">
                <Bot className="w-4 h-4 text-[rgb(var(--color-primary))]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[rgb(var(--color-text))]">StumpMind</h3>
                <p className="text-[10px] text-[rgb(var(--color-muted))]">AI Cricket Expert • Powered by Gemini</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--color-primary))] opacity-50" />
                  <p className="text-sm text-[rgb(var(--color-muted))]">
                    Ask me anything about the match, player stats, or cricket history!
                  </p>
                  <div className="mt-4 space-y-2">
                    {['Who has the best bowling average in IPL?', 'Predict the winner of this match', 'Top run scorers this season'].map((q) => (
                      <button
                        key={q}
                        onClick={() => { setInput(q); inputRef.current?.focus(); }}
                        className="block w-full text-left text-xs p-2 rounded-lg
                                   bg-[rgba(var(--color-surface),0.5)] text-[rgb(var(--color-muted))]
                                   hover:text-[rgb(var(--color-text))] transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'model' && (
                    <div className="w-6 h-6 rounded-full bg-[rgba(var(--color-primary),0.2)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3 h-3 text-[rgb(var(--color-primary))]" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                    ${m.role === 'user'
                      ? 'bg-[rgb(var(--color-primary))] text-white rounded-br-md'
                      : 'bg-[rgba(var(--color-surface),0.6)] text-[rgb(var(--color-text))] rounded-bl-md'
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-[rgba(var(--color-surface),0.6)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3 h-3 text-[rgb(var(--color-muted))]" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-[rgba(var(--color-primary),0.2)] flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-[rgb(var(--color-primary))]" />
                  </div>
                  <div className="px-3 py-2 rounded-2xl rounded-bl-md bg-[rgba(var(--color-surface),0.6)]">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-[rgb(var(--color-muted))] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[rgb(var(--color-muted))] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[rgb(var(--color-muted))] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[rgba(var(--color-border),0.2)]">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask StumpMind..."
                  className="flex-1 px-3 py-2 rounded-xl text-sm
                             bg-[rgba(var(--color-surface),0.6)] text-[rgb(var(--color-text))]
                             placeholder:text-[rgb(var(--color-muted))]
                             border border-[rgba(var(--color-border),0.2)]
                             focus:outline-none focus:border-[rgba(var(--color-primary),0.4)]
                             transition-colors"
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="p-2 rounded-xl bg-[rgb(var(--color-primary))] text-white
                             hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
