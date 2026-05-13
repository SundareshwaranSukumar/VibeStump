'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OracleChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMsg.content, history: messages }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'model', content: data.reply }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', content: 'Network Error.' }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-[rgb(var(--color-primary))] text-black px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(var(--color-primary),0.5)] hover:scale-105 transition-transform"
      >
        💬 Ask Oracle
      </button>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[400px] max-w-full bg-[#0a0f1d]/90 backdrop-blur-2xl border-l border-white/10 z-[110] shadow-2xl flex flex-col"
          >
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/20">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>🤖</span> Search-Enabled Oracle
                </h2>
                <p className="text-xs text-white/50">Ask about stats, players, or history!</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white text-2xl">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-white/40 mt-10 text-sm">
                  Try asking: "Give me the last 5 scores of RCB at Chinnaswamy Stadium."
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-xl max-w-[85%] text-sm ${m.role === 'user' ? 'bg-[rgb(var(--color-primary))] text-black font-medium' : 'bg-white/10 text-white'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && <div className="text-white/50 text-xs flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white/50 animate-ping" /> Analyzing...</div>}
            </div>

            <div className="p-4 border-t border-white/10 bg-black/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
                  placeholder="Ask the Oracle..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <button onClick={sendMessage} className="bg-[rgb(var(--color-primary))] text-black px-4 rounded-lg font-bold">
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
