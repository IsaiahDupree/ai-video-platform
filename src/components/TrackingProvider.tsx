'use client';

import { useEffect, createContext, useContext, ReactNode } from 'react';
import { tracking } from '../services/tracking';
import { ITrackingService } from '../types/tracking';

const TrackingContext = createContext<ITrackingService>(tracking);

export const useTracking = () => {
  return useContext(TrackingContext);
};

interface TrackingProviderProps {
  children: ReactNode;
  apiKey?: string;
  host?: string;
  enabled?: boolean;
}

export function TrackingProvider({
  children,
  apiKey,
  host,
  enabled = true,
}: TrackingProviderProps) {
  useEffect(() => {
    const key = apiKey || process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const hostUrl = host || process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (key) {
      tracking.initialize({
        apiKey: key,
        host: hostUrl,
        enabled,
      });
    }
  }, [apiKey, host, enabled]);

  return (
    <TrackingContext.Provider value={tracking}>
      {children}
    </TrackingContext.Provider>
  );
}
