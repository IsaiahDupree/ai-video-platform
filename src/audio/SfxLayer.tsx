import React, { useMemo } from 'react';
import { Sequence, staticFile, Audio } from 'remotion';
import type { AudioEvents, SfxManifest } from './sfx-context-pack';

interface SfxLayerProps {
  events: AudioEvents;
  manifest: SfxManifest;
  basePath?: string;
}

export const SfxLayer: React.FC<SfxLayerProps> = ({ 
  events, 
  manifest, 
  basePath = 'sfx/' 
}) => {
  const sfxEvents = useMemo(
    () => events.events.filter((e) => e.type === 'sfx' && e.sfxId),
    [events.events]
  );

  const manifestMap = useMemo(
    () => new Map(manifest.items.map((it) => [it.id, it])),
    [manifest.items]
  );

  return (
    <>
      {sfxEvents.map((e, idx) => {
        if (!e.sfxId) return null;
        
        const item = manifestMap.get(e.sfxId);
        if (!item) {
          console.warn(`SfxLayer: Unknown sfxId "${e.sfxId}"`);
          return null;
        }

        const src = staticFile(`${basePath}${item.file}`);
        const vol = e.volume ?? 1;

        return (
          <Sequence key={`${e.sfxId}-${e.frame}-${idx}`} from={e.frame}>
            <Audio src={src} volume={vol} />
          </Sequence>
        );
      })}
    </>
  );
};

export default SfxLayer;
