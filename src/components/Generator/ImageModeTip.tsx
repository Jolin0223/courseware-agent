import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import './imageModeTip.css';
// A fresh notice revision restores the first view after prototype verification.
const tipKey='resource-image-mode-tip-v3';
const dismissedEvent='resource-image-mode-tip-dismissed';
let dismissed=false;
export function dismissImageModeTip(){
 dismissed=true;
 try{localStorage.setItem(tipKey,'dismissed');}catch{/* Keep the current session preference. */}
 window.dispatchEvent(new Event(dismissedEvent));
}
export default function ImageModeTip({onDismiss}:{onDismiss?:()=>void}){
 const [show,setShow]=useState(()=>{try{return !dismissed&&localStorage.getItem(tipKey)!=='dismissed';}catch{return !dismissed;}});
 useEffect(()=>{const hide=()=>{setShow(false);onDismiss?.();};window.addEventListener(dismissedEvent,hide);return()=>window.removeEventListener(dismissedEvent,hide);},[onDismiss]);
 if(!show)return null;
 return <span className="resource-image-mode-tip" role="status">图生图换位置啦~<button aria-label="知道了，关闭提示" onClick={dismissImageModeTip}><X size={11}/></button></span>;
}
