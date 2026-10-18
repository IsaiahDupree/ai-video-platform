import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, cancelRender, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {validateProps} from './contract';
import type {TutorialProps} from './contract';
const C = {background:'#0e0f11',card:'#1b1d20',ivory:'#f6f0e7',muted:'#b5b7bb',orange:'#f28c28'};

/** Real media only. Missing narration, screenshots, props or overflowing text fails. */
export const RangeOpsOnboarding: React.FC<Record<string, unknown>> = input => {
  validateProps(input);
  const props: TutorialProps = input;
  const frame = useCurrentFrame();
  const time = frame / 30;
  const root = useRef<HTMLDivElement>(null);
  const sceneIndex = Math.max(0, props.scenes.findIndex(s => time >= s.start && time < s.end));
  const scene = props.scenes[sceneIndex];
  const local = time-scene.start;
  const art = scene.mediaKind === 'illustration';
  const alpha = interpolate(local,[0,0.2],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  useLayoutEffect(() => {
    for (const item of Array.from(root.current?.querySelectorAll<HTMLElement>('[data-check-text]') ?? [])) {
      if (item.scrollHeight > item.clientHeight + 2 || item.scrollWidth > item.clientWidth + 2) {
        cancelRender(new Error(`RangeOps text overflow at frame ${frame}: ${item.dataset.checkText}`));
      }
    }
  },[frame,sceneIndex]);
  return <AbsoluteFill ref={root} style={{background:C.background,color:C.ivory,fontFamily:'Arial, sans-serif'}}>
    <style>{'* { box-sizing: border-box; }'}</style>
    <Audio src={staticFile(props.audio)}/>
    <div style={{position:'absolute',left:56,right:56,top:45,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div style={{fontSize:30,fontWeight:700,letterSpacing:2,color:C.orange}}>RANGEOPS</div>
      <div style={{fontSize:25,color:C.muted}}>GETTING STARTED · {sceneIndex+1} / {props.scenes.length}</div>
    </div>
    <div data-check-text="heading" style={{position:'absolute',left:56,right:56,top:104,height:128,fontSize:52,fontWeight:700,lineHeight:'60px',letterSpacing:-1,display:'flex',alignItems:'center'}}>{scene.title}</div>
    <div style={{position:'absolute',left:42,right:42,top:248,bottom:190,display:'flex',alignItems:'center',justifyContent:'center',background:C.card,borderRadius:28,overflow:'hidden',opacity:alpha}}>
      {scene.mediaKind === 'screen_recording'
        ? <Sequence key={scene.id} from={Math.round(scene.start*30)} durationInFrames={Math.ceil((scene.end-scene.start)*30)} layout="none"><OffthreadVideo src={staticFile(scene.media)} muted startFrom={0} style={{width:'100%',height:'100%',objectFit:'contain'}}/></Sequence>
        : <Img key={scene.id} src={staticFile(scene.media)} onError={() => cancelRender(new Error(`Missing staged media: ${scene.media}`))} style={{width:'100%',height:'100%',objectFit:'contain',transform:art?`scale(${interpolate(local,[0,Math.max(1,scene.end-scene.start)],[1,1.025],{extrapolateRight:'clamp'})})`:undefined}}/>}
    </div>
    <div style={{position:'absolute',left:56,right:56,bottom:151,height:30,fontSize:22,color:C.muted,display:'flex',justifyContent:'space-between'}}>
      <span>{scene.provenanceLabel}</span><span>{art?'':props.captureBuild}</span>
    </div>
    <div data-check-text="overlay" style={{position:'absolute',left:56,right:56,bottom:94,height:42,fontSize:31,lineHeight:'39px',color:C.orange,fontWeight:700,textAlign:'center'}}>{scene.overlay}</div>
    <div style={{position:'absolute',left:56,right:56,bottom:30,height:4,display:'flex',gap:10}}>{props.scenes.map((s,i)=><div key={s.id} style={{height:4,flex:1,background:i<=sceneIndex?C.orange:'#34373c',borderRadius:3}}/>)}</div>
  </AbsoluteFill>;
};
