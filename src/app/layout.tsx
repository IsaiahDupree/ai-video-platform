import type { Metadata } from 'next';
import { TrackingProvider } from '@/components/TrackingProvider';
import { MetaPixel } from '@/components/MetaPixel';
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
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

  return (
    <html lang="en">
      <head>
        <MetaPixel pixelId={metaPixelId} />
      </head>
      <body>
        <TrackingProvider>{children}</TrackingProvider>
      </body>
    </html>
  );
}
