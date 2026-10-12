import { forwardRef, useRef, useState } from 'react';
import { Image as ImageIcon, Volume2, Film } from 'lucide-react';
import type { ReactNode, TextareaHTMLAttributes } from 'react';
import type { MediaAsset } from '../../data/videoCourseware/model';

// Keep a native textarea for selection, IME, undo and paste. Its mirror only paints
// reference colours and replaces the @ glyph with a same-width media icon.
// It is hidden from accessibility and never receives input.
export default forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & {assets:MediaAsset[]}>(function MentionTextArea({assets,className='',onScroll,onSelect,onChange,...props},ref){
 const [selecting,setSelecting]=useState(false);
 const mirror=useRef<HTMLDivElement>(null);
 const names=[...new Set(assets.map(a=>'@'+a.name))].sort((a,b)=>b.length-a.length);
 const value=String(props.value||'');
 const parts:ReactNode[]=[];let offset=0,plain=0;
 while(offset<value.length){const name=names.find(n=>value.startsWith(n,offset));if(!name){offset++;continue;}if(plain<offset)parts.push(value.slice(plain,offset));const kind=assets.find(a=>'@'+a.name===name)?.kind;const Icon=kind==='audio'?Volume2:kind==='video'?Film:ImageIcon;parts.push(<span className="se-inline-mention" data-media-kind={kind} key={offset}><span className="se-mention-type-icon"><span>@</span><Icon aria-hidden="true"/></span>{name.slice(1)}</span>);offset+=name.length;plain=offset;}
 parts.push(value.slice(plain)+'\n');
 return <div className={'se-mention-field '+className+(selecting?' is-selecting':'')}><div className="se-mention-input"><div ref={mirror} aria-hidden="true" className="se-mention-mirror">{parts}</div><textarea {...props} ref={ref} onSelect={e=>{setSelecting(e.currentTarget.selectionStart!==e.currentTarget.selectionEnd);onSelect?.(e);}} onChange={e=>{setSelecting(e.currentTarget.selectionStart!==e.currentTarget.selectionEnd);onChange?.(e);}} onScroll={e=>{if(mirror.current){mirror.current.scrollTop=e.currentTarget.scrollTop;mirror.current.scrollLeft=e.currentTarget.scrollLeft;}onScroll?.(e);}}/></div></div>;
});
