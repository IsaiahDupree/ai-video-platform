import type { Metadata } from 'next';
import { TrackingProvider } from '@/components/TrackingProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Video Platform - Ad Studio',
  description: 'AI-powered video generation platform with static ad studio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TrackingProvider>{children}</TrackingProvider>
      </body>
    </html>
  );
}
