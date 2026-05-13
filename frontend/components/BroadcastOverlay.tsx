'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { soundManager } from '@/lib/SoundManager';

interface BroadcastOverlayProps {
  eventType: string; // 'wicket', 'boundary', 'none'
  reaction: string;
}

export default function BroadcastOverlay({ eventType, reaction }: BroadcastOverlayProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (eventType !== 'none') {
      setShow(true);
      if (eventType === 'wicket') soundManager.play('faah');
      else if (eventType === 'boundary') soundManager.play('boundary');
      
      const timer = setTimeout(() => setShow(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [eventType, reaction]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
        >
          {eventType === 'wicket' && (
            <>
              {/* Massive Red Flash */}
              <motion.div 
                className="absolute inset-0 bg-red-600 mix-blend-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.8, 0] }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              {/* Central Text */}
              <motion.div
                initial={{ scale: 0.2, rotate: -10, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ type: 'spring', bounce: 0.6 }}
                className="bg-black/80 p-12 border-4 border-red-500 rounded-3xl backdrop-blur-md shadow-[0_0_100px_rgba(239,68,68,0.8)] flex flex-col items-center"
              >
                <h1 className="text-9xl font-black text-red-500 tracking-tighter" style={{ textShadow: '0 0 40px red' }}>OUT!</h1>
                <p className="text-3xl font-bold text-white mt-4 uppercase italic tracking-widest">{reaction}</p>
              </motion.div>
            </>
          )}

          {eventType === 'boundary' && (
            <>
              <motion.div 
                className="absolute inset-0 bg-blue-500 mix-blend-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 0] }}
                transition={{ duration: 1 }}
              />
              <motion.div
                initial={{ x: '-100%', skewX: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 15 }}
                className="absolute bottom-32 w-full bg-gradient-to-r from-transparent via-[rgb(var(--color-primary))] to-transparent py-6 flex justify-center"
              >
                <h1 className="text-7xl font-black text-white italic tracking-widest drop-shadow-2xl uppercase">
                  BOUNDARY!
                </h1>
              </motion.div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
