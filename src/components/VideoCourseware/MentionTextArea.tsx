import { forwardRef, useRef, useState } from 'react';
import type { ReactNode, TextareaHTMLAttributes } from 'react';
import type { MediaAsset } from '../../data/videoCourseware/model';

// Keep a native textarea for selection, IME, undo and paste. Its mirror only paints
// reference colours; it is hidden from accessibility and never receives input.
export default forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & {assets:MediaAsset[]}>(function MentionTextArea({assets,className='',onScroll,onSelect,onChange,...props},ref){
 const [selecting,setSelecting]=useState(false);
 const mirror=useRef<HTMLDivElement>(null);
 const names=[...new Set(assets.map(a=>'@'+a.name))].sort((a,b)=>b.length-a.length);
 const value=String(props.value||'');
 const parts:ReactNode[]=[];let offset=0,plain=0;
 while(offset<value.length){const name=names.find(n=>value.startsWith(n,offset));if(!name){offset++;continue;}if(plain<offset)parts.push(value.slice(plain,offset));parts.push(<span className="se-inline-mention" key={offset}>{name}</span>);offset+=name.length;plain=offset;}
 parts.push(value.slice(plain)+'\n');
 return <div className={'se-mention-field '+className+(selecting?' is-selecting':'')}><div className="se-mention-input"><div ref={mirror} aria-hidden="true" className="se-mention-mirror">{parts}</div><textarea {...props} ref={ref} onSelect={e=>{setSelecting(e.currentTarget.selectionStart!==e.currentTarget.selectionEnd);onSelect?.(e);}} onChange={e=>{setSelecting(e.currentTarget.selectionStart!==e.currentTarget.selectionEnd);onChange?.(e);}} onScroll={e=>{if(mirror.current){mirror.current.scrollTop=e.currentTarget.scrollTop;mirror.current.scrollLeft=e.currentTarget.scrollLeft;}onScroll?.(e);}}/></div></div>;
});
