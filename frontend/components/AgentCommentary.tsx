'use client';

import { useVibeStore } from '@/lib/store';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function AgentCommentary() {
    const { insights } = useVibeStore();

    return (
        <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[rgb(var(--color-primary))]" />
                <h3 className="text-sm font-semibold text-[rgb(var(--color-muted))] uppercase tracking-wider">
                    AI Insights
                </h3>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {insights.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--color-muted))] text-center py-8">
                        AI insights will appear for match events...
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {insights.map((item, i) => (
                            <motion.div
                                key={`${item.created_at}-${i}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="p-3 rounded-xl bg-[rgba(var(--color-surface),0.4)] border border-[rgba(var(--color-border),0.15)]"
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                    ${item.event_type === 'WICKET' ? 'bg-red-500/20 text-red-400' :
                                            item.event_type === 'SIX' ? 'bg-purple-500/20 text-purple-400' :
                                                item.event_type === 'FOUR' ? 'bg-green-500/20 text-green-400' :
                                                    'bg-blue-500/20 text-blue-400'}`}
                                    >
                                        {item.event_type}
                                    </span>
                                </div>
                                <p className="text-sm text-[rgb(var(--color-text))] leading-relaxed">
                                    {item.text}
                                </p>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
