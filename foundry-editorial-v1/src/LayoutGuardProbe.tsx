/** Isolated diagnostic composition: negative controls must fail actual rendering. */
import React, {useRef} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {LayoutGuard} from './layoutGuard';

export const LayoutGuardProbe: React.FC<{kind: 'clean' | 'overlap' | 'overflow'}> = ({kind}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const frame = useCurrentFrame();
  if (!['clean', 'overlap', 'overflow'].includes(kind)) throw new Error('Unknown layout diagnostic kind');
  return <AbsoluteFill ref={rootRef} style={{background: '#fff', color: '#111', fontFamily: 'Arial, sans-serif'}}>
    <div data-layout-box="first" data-layout-zone="content" data-layout-text="true"
      style={{position: 'absolute', left: 100, top: 200, width: 500, height: 100, fontSize: 48, lineHeight: '64px', whiteSpace: 'nowrap', background: '#ddd'}}>
      {kind === 'overflow' ? 'This intentionally oversized text must never pass the layout guard.' : 'Layout control'}
    </div>
    {kind === 'overlap' && <div data-layout-box="second" data-layout-zone="content"
      style={{position: 'absolute', left: 550, top: 250, width: 500, height: 100, background: '#ecc'}}/>}
    <LayoutGuard rootRef={rootRef} frame={frame}/>
  </AbsoluteFill>;
};
