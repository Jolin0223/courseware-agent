import MessageExpandButton from './MessageExpandButton';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Keep a long submitted request readable without taking over the conversation. */
export default function SceneEditMessage({ children }: { children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const measure = () => setOverflowing(content.scrollHeight > 260);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);
  return <div className="agent-scene-edit-message-wrap">
   <div className="agent-scene-edit-message" aria-label="已发送的场景修改">
    <div ref={viewportRef} className={'agent-scene-edit-viewport'+(expanded ? ' is-expanded' : '')} tabIndex={overflowing ? 0 : undefined} role="region" aria-label="场景修改明细">
      <div ref={contentRef}>{children}</div>
    </div>
    {overflowing && !expanded && <div className="agent-scene-edit-fade"/>}
   </div>
    {overflowing && <MessageExpandButton expanded={expanded} onClick={() => {
      if (expanded && viewportRef.current) viewportRef.current.scrollTop = 0;
      setExpanded(value => !value);
    }}/>}
  </div>;
}
