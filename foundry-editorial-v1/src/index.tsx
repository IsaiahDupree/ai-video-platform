import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {EditorialExplainer} from './EditorialExplainer';
import {LayoutGuardProbe} from './LayoutGuardProbe';
import approvedExample from '../examples/ai-demand-2026-10-04.json';
const Root = () => <>
  <Composition id="EditorialExplainer" component={EditorialExplainer} width={1920} height={1080} fps={30} durationInFrames={4626} defaultProps={approvedExample} calculateMetadata={({props})=>({durationInFrames:props.auditFrames?.length ?? Math.ceil(props.duration*30)})}/>
  <Composition id="LayoutGuardProbe" component={LayoutGuardProbe} width={1920} height={1080} fps={30} durationInFrames={1} defaultProps={{kind: 'clean' as const}}/>
</>;
registerRoot(Root);
