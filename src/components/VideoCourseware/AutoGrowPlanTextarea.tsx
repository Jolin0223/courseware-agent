import { useLayoutEffect, useRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

/** Fit wrapped content between two and six lines, including container resizes. */
export default function AutoGrowPlanTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
 const ref=useRef<HTMLTextAreaElement>(null);
 useLayoutEffect(()=>{
  const el=ref.current;if(!el)return;
  const fit=()=>{
   const css=getComputedStyle(el),line=parseFloat(css.lineHeight);
   const inset=parseFloat(css.paddingTop)+parseFloat(css.paddingBottom)+parseFloat(css.borderTopWidth)+parseFloat(css.borderBottomWidth);
   el.style.height='0px';
   const needed=el.scrollHeight+parseFloat(css.borderTopWidth)+parseFloat(css.borderBottomWidth);
   el.style.height=`${Math.max(2*line+inset,Math.min(6*line+inset,needed))}px`;
   el.style.overflowY=needed>6*line+inset+1?'auto':'hidden';
  };
  fit();let width=el.getBoundingClientRect().width;
  const observer=new ResizeObserver(()=>{const next=el.getBoundingClientRect().width;if(next!==width){width=next;fit();}});
  observer.observe(el);return()=>observer.disconnect();
 },[props.value]);
 return <textarea {...props} rows={2} ref={ref}/>;
}
