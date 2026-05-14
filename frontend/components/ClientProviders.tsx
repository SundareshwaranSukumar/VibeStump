'use client';

import StumpMindChat from './StumpMindChat';

/**
 * ClientProviders — wraps the entire app tree so the StumpMindChat
 * floating chatbot is available on every page (home, team, player, etc.).
 */
export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <StumpMindChat />
    </>
  );
}
