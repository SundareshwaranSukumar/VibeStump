import ClientProviders from '@/components/ClientProviders';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VibeStump — Agentic Premier League',
  description: 'AI-powered live IPL dashboard with real-time scores, commentary, and insights. Powered by Google Gemini.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
