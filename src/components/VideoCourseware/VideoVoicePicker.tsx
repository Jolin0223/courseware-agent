import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Baby, Venus, Mars, Check, ChevronDown, RotateCcw } from 'lucide-react';
import { demoVoiceOptions } from '../../data/augustDemoData';
import { videoVoices, videoVoiceLanguages, videoVoiceCategories } from '../../data/videoCourseware/voiceCatalog';
import type { VideoVoice, VoiceLanguage, VoiceCategory } from '../../data/videoCourseware/voiceCatalog';
import './videoVoicePicker.css';

type Position = {left:number;width:number;maxHeight:number;top?:number;bottom?:number};

export default function VideoVoicePicker({selectedVoice,assetName,disabled,onRegenerate}:{selectedVoice?:string;assetName:string;disabled?:boolean;onRegenerate:(voice:VideoVoice)=>void}) {
 const [position,setPosition]=useState<Position|null>(null);
 const [language,setLanguage]=useState<VoiceLanguage>('zh-CN');
 const [category,setCategory]=useState<VoiceCategory>('child');
 const trigger=useRef<HTMLButtonElement>(null),panel=useRef<HTMLDivElement>(null);
 const menuId=useId();
 // Read old aliases for preselection; always emit an exact provider Voice ID.
 const providerId=demoVoiceOptions.find(v=>v.id===selectedVoice)?.platformVoiceId||selectedVoice;
 const current=videoVoices.find(v=>v.id===providerId);
 const voices=videoVoices.filter(v=>v.language===language&&v.category===category);
 useEffect(()=>{
  if(!position)return;
  const outside=(event:PointerEvent)=>{if(!trigger.current?.contains(event.target as Node)&&!panel.current?.contains(event.target as Node))setPosition(null);};
  const key=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setPosition(null);trigger.current?.focus({preventScroll:true});}
   // Return keyboard navigation to the resource editor when leaving the dropdown.
   if(event.key==='Tab'&&panel.current?.contains(event.target as Node)){
    const buttons=Array.from(panel.current.querySelectorAll<HTMLButtonElement>('button'));
    const index=buttons.indexOf(document.activeElement as HTMLButtonElement);
    if((event.shiftKey&&index===0)||(!event.shiftKey&&index===buttons.length-1)){
     event.preventDefault();event.stopPropagation();setPosition(null);trigger.current?.focus({preventScroll:true});
    }
   }
  };
  const scroll=(event:Event)=>{if(!panel.current?.contains(event.target as Node))setPosition(null);};
  const resize=()=>setPosition(null);
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key,true);document.addEventListener('scroll',scroll,true);window.addEventListener('resize',resize);
  panel.current?.querySelector<HTMLButtonElement>('[role="menuitem"][data-current="true"], [role="menuitem"]')?.focus({preventScroll:true});
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key,true);document.removeEventListener('scroll',scroll,true);window.removeEventListener('resize',resize);};
 },[position]);
 function toggle(){
  if(position){setPosition(null);return;}
  setLanguage(current?.language||'zh-CN');setCategory(current?.category||'child');
  const r=trigger.current!.getBoundingClientRect(),width=Math.min(420,innerWidth-24);
  const below=innerHeight-r.bottom-18,above=r.top-18,up=below<320&&above>below;
  setPosition({left:Math.max(12,Math.min(r.right-width,innerWidth-width-12)),width,maxHeight:Math.max(80,Math.min(350,up?above:below)),...(up?{bottom:innerHeight-r.top+6}:{top:r.bottom+6})});
 }
 return <><button ref={trigger} className="vvp-trigger" disabled={disabled} aria-haspopup="menu" aria-expanded={Boolean(position)} aria-controls={position?menuId:undefined} onClick={toggle}><RotateCcw size={13}/>重新合成<ChevronDown size={12}/></button>
  {position&&createPortal(<div ref={panel} className="vvp-dropdown" style={position}>
   <div className="vvp-languages" role="group" aria-label="配音语言">
    {videoVoiceLanguages.map(l=><button key={l.id} className={language===l.id?'selected':''} aria-pressed={language===l.id} onClick={()=>setLanguage(l.id)}>{l.name}</button>)}
   </div>
   <div className="vvp-categories" role="group" aria-label="音色类型">
    {videoVoiceCategories.map(c=><button key={c.id} className={category===c.id?'selected':''} aria-pressed={category===c.id} onClick={()=>setCategory(c.id)}>{c.id==='child'?<Baby size={16} aria-hidden="true"/>:c.id==='female'?<Venus size={16} aria-hidden="true"/>:<Mars size={16} aria-hidden="true"/>}{c.name}<span>{videoVoices.filter(v=>v.language===language&&v.category===c.id).length}</span></button>)}
   </div>
   <div id={menuId} className="vvp-list" role="menu" aria-label={`为${assetName}选择音色并重新合成`} onKeyDown={e=>{
    if(!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();const buttons=Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button')),index=buttons.indexOf(document.activeElement as HTMLButtonElement);
    buttons[e.key==='Home'?0:e.key==='End'?buttons.length-1:Math.max(0,Math.min(buttons.length-1,index+(e.key==='ArrowDown'?2:e.key==='ArrowUp'?-2:e.key==='ArrowRight'?1:-1)))]?.focus();
   }}>
    {voices.map(v=><button key={v.id} role="menuitem" data-current={current?.id===v.id} className={'vvp-option'+(current?.id===v.id?' selected':'')} onClick={()=>{setPosition(null);onRegenerate(v);}}>
     <span className="vvp-copy"><strong>{v.name}</strong><small>{v.description}</small></span>{current?.id===v.id&&<span className="vvp-current">当前<Check size={13}/></span>}
    </button>)}
   </div>
  </div>,document.body)}
 </>;
}
