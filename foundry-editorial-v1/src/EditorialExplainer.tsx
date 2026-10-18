import React, {useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {LayoutGuard} from './layoutGuard';
import {activeScene, captionsFromWords, validateTimeline} from './timeline';
import type {Scene, Word} from './timeline';

export type EditorialProps = {scenes: Scene[]; words: Word[]; duration: number; audio: string; title: string; edition: string; voiceVolume?: number; auditFrames?: number[]};
import {EDITORIAL_PALETTE as C} from './palette';
const font = 'Arial, sans-serif';
const box = (id:string, zone='content') => ({'data-layout-box':id,'data-layout-zone':zone});
const text = (id:string, zone='content', min=28) => ({...box(id,zone),'data-layout-text':'true','data-layout-min-font':String(min)});

function Heading({scene,local}:{scene:Scene;local:number}) {
  return <>
    <div {...text('chapter')} style={{position:'absolute',left:80,top:200,width:625,height:38,fontSize:28,fontWeight:700,letterSpacing:2,color:C.coral}}>{scene.chapter}</div>
    <div {...text('headline')} style={{position:'absolute',left:76,top:256,width:636,height:184,fontFamily:'Georgia, serif',fontWeight:700,fontSize:76,lineHeight:'82px',letterSpacing:-2,whiteSpace:'pre-line'}}>{scene.title}</div>
    <div {...text('subtitle')} style={{position:'absolute',left:80,top:474,width:620,height:132,fontSize:35,lineHeight:'44px',color:C.muted,opacity:scene.kind==='hero'?interpolate(local,[1.8,2.2],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}):1}}>{scene.subtitle}</div>
  </>;
}

function Illustration({scene, local}:{scene:Scene;local:number}) {
  return <div {...box('illustration')} style={{position:'absolute',left:766,top:196,width:1082,height:640,borderRadius:30,overflow:'hidden',background:'#eee4d3'}}>
    <Img src={staticFile(`images/${scene.image}.png`)} style={{width:'100%',height:'100%',objectFit:'cover',transform:`scale(${interpolate(local,[0,18],[1,1.035],{extrapolateRight:'clamp'})})`}}/>
  </div>;
}

function LeftItems({items, note}:{items:string[];note:string}) {
  return <>
    <div {...box('left-items')} style={{position:'absolute',left:80,top:628,width:620,height:152,display:'flex',flexDirection:'column',gap:12}}>
      {items.slice(0,3).map((item,i)=><div {...text(`left-item-${i}`)} key={item} style={{fontSize:31,lineHeight:'38px',fontWeight:700,display:'flex',alignItems:'center',gap:16}}><span style={{width:7,height:25,background:C.coral,flexShrink:0}}/>{item}</div>)}
    </div>
    {note && <div {...text('note','content',26)} style={{position:'absolute',left:80,top:800,width:620,height:34,fontSize:26,lineHeight:'32px',color:C.muted}}>{note}</div>}
  </>;
}

function Cards({scene, local}:{scene:Scene;local:number}) {
  const growth = scene.kind === 'growth';
  const compare = scene.kind === 'compare';
  const items = scene.items;
  const height = compare ? 254 : 148;
  const top = compare ? 210 : 254;
  return <div {...box('cards')} style={{position:'absolute',left:770,top,width:1078,height:compare ? 560 : 520,display:'flex',flexDirection:'column',gap:22}}>
    {items.map((item,i)=><div {...box(`card-${i}`)} key={item} style={{height,flexShrink:0,border:`2px solid ${C.line}`,borderRadius:24,background:i===0?C.ink:C.white,color:i===0?C.white:C.ink,padding:28,display:'flex',alignItems:'center',gap:30,opacity:local>=i*1.25?1:0}}>
      <div {...text(`card-number-${i}`)} style={{fontFamily:'Georgia, serif',fontSize:60,lineHeight:'72px',width:86,flexShrink:0}}>{growth?'0'+(i+1):compare?['A','B'][i]:String(i+1).padStart(2,'0')}</div>
      <div {...text(`card-text-${i}`)} style={{fontSize:compare?42:38,lineHeight:compare?'52px':'48px',fontWeight:700,flex:1}}>{item}</div>
    </div>)}
  </div>;
}

function Flow({scene, local}:{scene:Scene;local:number}) {
  return <>
    <div {...text('flow-kicker')} style={{position:'absolute',left:80,top:201,width:1768,height:40,fontSize:28,fontWeight:700,color:C.coral,letterSpacing:2}}>{scene.chapter}</div>
    <div {...text('flow-heading')} style={{position:'absolute',left:76,top:269,width:1768,height:108,fontSize:74,fontFamily:'Georgia, serif',fontWeight:700,lineHeight:'88px'}}>{scene.title}</div>
    <div {...text('flow-subtitle')} style={{position:'absolute',left:80,top:410,width:1768,height:58,fontSize:36,lineHeight:'48px',color:C.muted}}>{scene.subtitle}</div>
    <div {...box('flow')} style={{position:'absolute',left:80,top:540,width:1768,height:190,display:'flex',gap:24}}>
      {scene.items.map((item,i)=><div {...box(`step-${i}`)} key={item} style={{flex:1,padding:22,borderRadius:22,background:i===3?C.ink:C.white,color:i===3?C.white:C.ink,border:`2px solid ${C.line}`,opacity:local>=i*.8?1:0}}>
        <div {...text(`step-number-${i}`)} style={{fontSize:28,lineHeight:'36px',opacity:.7,marginBottom:24}}>{String(i+1).padStart(2,'0')}</div>
        <div {...text(`step-text-${i}`)} style={{fontSize:35,lineHeight:'44px',fontWeight:700}}>{item}</div>
      </div>)}
    </div>
    <div {...text('flow-note')} style={{position:'absolute',left:80,top:781,width:1768,height:45,fontSize:30,lineHeight:'40px',color:C.muted}}>{scene.note}</div>
  </>;
}

export const EditorialExplainer: React.FC<EditorialProps> = props => {
  const renderFrame = useCurrentFrame();
  const {fps} = useVideoConfig();
  // A diagnostic contact-sheet movie renders actual selected full-size frames
  // through exactly the same component/guard, without changing final timing.
  const frame = props.auditFrames?.[Math.min(renderFrame,props.auditFrames.length-1)] ?? renderFrame;
  const time = frame/fps;
  const rootRef = useRef<HTMLDivElement>(null);
  useMemo(()=>validateTimeline(props.scenes,props.words,props.duration),[props.scenes,props.words,props.duration]);
  const scene = activeScene(props.scenes, time);
  const index = props.scenes.indexOf(scene);
  const local = time-scene.start;
  const phrases = useMemo(()=>captionsFromWords(props.words),[props.words]);
  const caption = phrases.find(c=>time>=c.start && time<c.end);
  const flow = scene.kind==='flow';
  const cards = ['growth','compare','takeaway','checkpoint'].includes(scene.kind);
  return <AbsoluteFill ref={rootRef} style={{background:C.paper,color:C.ink,fontFamily:font}}>
    <style>{'* { box-sizing: border-box; }'}</style>
    {!props.auditFrames && <Audio src={staticFile(props.audio)} volume={Math.min(4,Math.max(0,props.voiceVolume??1))}/>}
    <div style={{position:'absolute',left:0,top:0,height:10,width:`${100*frame/(props.duration*fps)}%`,background:C.green}}/>
    <div {...text('series-title','header',28)} style={{position:'absolute',left:80,top:82,width:1060,height:48,fontSize:30,fontWeight:700,letterSpacing:.4}}>{props.title}</div>
    <div {...text('edition','header',28)} style={{position:'absolute',right:80,top:84,width:490,height:43,fontSize:28,textAlign:'right',color:C.muted}}>{props.edition}</div>
    <div style={{position:'absolute',left:80,right:80,top:158,height:2,background:C.line}}/>
    {flow ? <Flow scene={scene} local={local}/> : <>
      <Heading scene={scene} local={local}/>
      {cards ? <Cards scene={scene} local={local}/> : <Illustration scene={scene} local={local}/>}
      <LeftItems items={cards || (scene.kind==='hero' && local<3)?[]:scene.items} note={scene.note}/>
    </>}
    <div {...box('caption-rail','caption')} style={{position:'absolute',left:72,top:882,width:1776,height:102,borderRadius:18,background:C.ink,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 34px'}}>
      {caption && <div {...text('caption','caption',44)} style={{fontSize:46,lineHeight:'50px',fontWeight:700,color:C.white,textAlign:'center',maxWidth:1680}}>{caption.words.map((w,i)=><React.Fragment key={`${w.start}-${i}`}><span style={{color:time>=w.start&&time<=w.end?C.activeCaption:C.white}}>{w.text}</span>{i<caption.words.length-1?' ':''}</React.Fragment>)}</div>}
      {!caption && time>150.42 && <div {...text('closing-question','caption',44)} style={{fontSize:46,lineHeight:'54px',fontWeight:700,color:C.white}}>What would you want AI to finish?</div>}
    </div>
    <div {...text('source','footer',24)} style={{position:'absolute',left:80,top:1013,width:1490,height:31,fontSize:24,lineHeight:'30px',color:C.muted}}>{scene.source}</div>
    <div {...text('page','footer',24)} style={{position:'absolute',right:80,top:1013,width:220,height:31,fontSize:24,lineHeight:'30px',textAlign:'right',color:C.muted}}>{String(index+1).padStart(2,'0')} / {String(props.scenes.length).padStart(2,'0')}</div>
    <LayoutGuard rootRef={rootRef} frame={frame} width={1920} height={1080}/>
  </AbsoluteFill>;
};
