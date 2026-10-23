import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MediaAsset } from '../../data/videoCourseware/model';

export interface MentionFieldHandle {
 value:string; selectionStart:number; selectionEnd:number;
 focus:()=>void; setSelectionRange:(start:number,end:number)=>void;
 getBoundingClientRect:()=>DOMRect; getCaretClientRect:()=>DOMRect; closest:(selector:string)=>Element|null;
}
type Props={assets:MediaAsset[];className?:string;value?:string;readOnly?:boolean;placeholder?:string;'aria-label'?:string;
 onValueChange:(value:string)=>void;onSelectionChange:(field:MentionFieldHandle)=>void;onMentionRequest:(field:MentionFieldHandle)=>void};

// Chips occupy real layout space. Store plain @names, so scene contracts and pasted text stay compatible.
function textOf(node:Node):string {
 if(node.nodeType===Node.TEXT_NODE)return node.textContent||'';
 if(node instanceof HTMLElement&&node.dataset.mention)return node.dataset.mention;
 if(node.nodeName==='BR')return '\n';
 return Array.from(node.childNodes).map((child,index)=>((child.nodeName==='DIV'||child.nodeName==='P')&&index>0?'\n':'')+textOf(child)).join('');
}
function selectionIn(root:HTMLElement){
 const selection=window.getSelection();if(!selection?.rangeCount)return null;
 const range=selection.getRangeAt(0);if(!root.contains(range.startContainer)||!root.contains(range.endContainer))return null;
 const before=range.cloneRange();before.selectNodeContents(root);before.setEnd(range.startContainer,range.startOffset);
 const end=range.cloneRange();end.selectNodeContents(root);end.setEnd(range.endContainer,range.endOffset);
 return {start:textOf(before.cloneContents()).length,end:textOf(end.cloneContents()).length};
}
function setSelection(root:HTMLElement,start:number,end:number){
 const point=(offset:number):[Node,number]=>{
  const visit=(parent:Node):[Node,number]|null=>{
   for(const child of Array.from(parent.childNodes)){
    const size=textOf(child).length;
    if(offset>size){offset-=size;continue;}
    if(child.nodeType===Node.TEXT_NODE)return [child,offset];
    if(child instanceof HTMLElement&&(child.dataset.mention||child.tagName==='BR')){
     const index=Array.from(parent.childNodes).indexOf(child);return [parent,index+(offset>0?1:0)];
    }
    const nested=visit(child);if(nested)return nested;
   }return null;
  };return visit(root)||[root,root.childNodes.length];
 };
 const range=document.createRange(),a=point(start),b=point(end);range.setStart(...a);range.setEnd(...b);
 const selection=window.getSelection();selection?.removeAllRanges();selection?.addRange(range);
}
function paint(root:HTMLElement,value:string,assets:MediaAsset[]){
 const fragment=document.createDocumentFragment();
 const names=[...assets].sort((a,b)=>b.name.length-a.name.length);
 let offset=0,plain=0;
 while(offset<value.length){
  const asset=value[offset]==='@'?names.find(a=>value.startsWith('@'+a.name,offset)):undefined;
  if(!asset){offset++;continue;}
  if(plain<offset)fragment.append(document.createTextNode(value.slice(plain,offset)));
  const chip=document.createElement('span');chip.className='se-inline-mention';chip.dataset.mention='@'+asset.name;chip.dataset.assetId=asset.id;chip.dataset.mediaKind=asset.kind;chip.contentEditable='false';
  const icon=document.createElement('span');icon.className='se-mention-type-icon';icon.setAttribute('aria-hidden','true');
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.7');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',asset.kind==='audio'?'M11 5 6 9H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14':asset.kind==='video'?'M4 4h16v16H4zM4 8h16M4 16h16M8 4v4m8-4v4M8 16v4m8-4v4':'M4 4h16v16H4zM4 16l5-5 4 4 3-3 4 4M15 8h.01');svg.append(path);icon.append(svg);
  const label=document.createElement('span');label.textContent=asset.name;chip.append(icon,label);fragment.append(chip);
  offset+=asset.name.length+1;plain=offset;
 }
 fragment.append(document.createTextNode(value.slice(plain)));root.replaceChildren(fragment);
}
export default forwardRef<MentionFieldHandle,Props>(function MentionTextArea({assets,className='',value='',readOnly,placeholder,onValueChange,onSelectionChange,onMentionRequest,...props},ref){
 const root=useRef<HTMLDivElement>(null),composing=useRef(false),lastSelection=useRef({start:0,end:0});
 const [hovered,setHovered]=useState<{asset:MediaAsset;left:number;top:number}|null>(null);
 const handle=useMemo<MentionFieldHandle>(()=>({
  get value(){return root.current?textOf(root.current):'';},
  get selectionStart(){return (root.current&&selectionIn(root.current)||lastSelection.current).start;},
  get selectionEnd(){return (root.current&&selectionIn(root.current)||lastSelection.current).end;},
  focus:()=>root.current?.focus(),setSelectionRange:(start,end)=>{if(root.current)setSelection(root.current,start,end);lastSelection.current={start,end};},
  getCaretClientRect:()=>{const selection=window.getSelection();if(selection?.rangeCount&&root.current?.contains(selection.anchorNode)){const range=selection.getRangeAt(0).cloneRange();range.collapse(false);const rect=range.getBoundingClientRect();if(rect.height)return rect;}return root.current!.getBoundingClientRect();},
  getBoundingClientRect:()=>root.current!.getBoundingClientRect(),closest:selector=>root.current?.closest(selector)||null,
 }),[]);
 useImperativeHandle(ref,()=>handle);
 useLayoutEffect(()=>{
  const el=root.current;if(!el||composing.current)return;
  if(textOf(el)===value&&el.dataset.painted)return;
  const selected=selectionIn(el);paint(el,value,assets);el.dataset.painted='true';
  if(selected)setSelection(el,Math.min(selected.start,value.length),Math.min(selected.end,value.length));
 },[value,assets]);
 function remember(){if(root.current){const selected=selectionIn(root.current);if(selected)lastSelection.current=selected;}onSelectionChange(handle);}
 function changed(){remember();setHovered(null);if(!composing.current)onValueChange(handle.value);}
 return <div className={'se-mention-field '+className}><div ref={root} className="se-rich-input" tabIndex={0} role="textbox" aria-multiline="true" aria-readonly={readOnly} aria-label={props['aria-label']} contentEditable={!readOnly} suppressContentEditableWarning data-placeholder={placeholder}
  onInput={changed} onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={()=>{composing.current=false;changed();}}
  onKeyUp={remember} onMouseUp={remember} onBlur={remember}
  onKeyDown={e=>{if(readOnly||e.nativeEvent.isComposing)return;if(e.key==='@'){e.preventDefault();remember();onMentionRequest(handle);}else if(e.key==='Enter'){e.preventDefault();document.execCommand('insertText',false,'\n');}}}
  onPaste={e=>{if(readOnly)return;e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'));}}
  onCopy={e=>{const selected=selectionIn(root.current!);if(selected&&selected.start!==selected.end){e.preventDefault();e.clipboardData.setData('text/plain',handle.value.slice(selected.start,selected.end));}}}
  onCut={e=>{if(readOnly)return;const selected=selectionIn(root.current!);if(selected&&selected.start!==selected.end){e.preventDefault();e.clipboardData.setData('text/plain',handle.value.slice(selected.start,selected.end));document.execCommand('delete');}}}
  onPointerOver={e=>{const chip=(e.target as Element).closest<HTMLElement>('[data-asset-id]');const asset=assets.find(a=>a.id===chip?.dataset.assetId);if(!chip||asset?.kind!=='image'||!asset.url){setHovered(null);return;}const rect=chip.getBoundingClientRect();setHovered({asset,left:Math.max(8,Math.min(rect.left,window.innerWidth-232)),top:rect.bottom+164>window.innerHeight?Math.max(8,rect.top-164):rect.bottom+8});}}
  onPointerLeave={()=>setHovered(null)} onScroll={()=>setHovered(null)}
 />{hovered&&createPortal(<div className="se-image-hover" role="tooltip" style={{left:hovered.left,top:hovered.top}}><img src={hovered.asset.url} alt=""/><strong>{hovered.asset.name}</strong></div>,document.body)}</div>;
});
