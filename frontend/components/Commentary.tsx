'use client';

import { useVibeStore } from '@/lib/store';
import { AnimatePresence, motion } from 'framer-motion';

export default function Commentary() {
  const { commentary } = useVibeStore();

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-[rgb(var(--color-muted))] uppercase tracking-wider mb-4">
        Live Commentary
      </h3>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {commentary.length === 0 ? (
          <div className="text-sm text-[rgb(var(--color-muted))] text-center py-8">
            Waiting for match events...
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {commentary.map((item, i) => (
              <motion.div
                key={`${item.created_at}-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                  item.event_type === 'WICKET'
                    ? 'bg-red-500/10 border-l-2 border-red-400'
                    : item.event_type === 'SIX'
                    ? 'bg-purple-500/10 border-l-2 border-purple-400'
                    : item.event_type === 'FOUR'
                    ? 'bg-green-500/10 border-l-2 border-green-400'
                    : 'bg-[rgba(var(--color-surface),0.3)]'
                }`}
              >
                <EventDot type={item.event_type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[rgb(var(--color-text))]">{item.text}</p>
                  <span className="text-[10px] text-[rgb(var(--color-muted))] mt-1 block">
                    {formatTime(item.created_at)}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function EventDot({ type }: { type: string }) {
  const colors: Record<string, string> = {
    WICKET: 'bg-red-400',
    SIX: 'bg-purple-400',
    FOUR: 'bg-green-400',
    RUNS: 'bg-blue-400',
    NONE: 'bg-[rgb(var(--color-muted))]',
  };

  return (
    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${colors[type] || colors.NONE}`} />
  );
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'Z');
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}
