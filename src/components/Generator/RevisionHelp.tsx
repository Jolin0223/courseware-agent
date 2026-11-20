import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp, ListChecks, MessageSquareText, X } from 'lucide-react';

export default function RevisionHelp() {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<CSSProperties>({ visibility: 'hidden' });
  const [side, setSide] = useState<'above' | 'below'>('above');
  const id = useId();
  const dismiss = () => {
    setOpen(false);
  };
  useLayoutEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const trigger = buttonRef.current;
      const popover = popoverRef.current;
      if (!trigger || !popover) return;
      const rect = trigger.getBoundingClientRect();
      const shell = trigger.closest('.agent-chat-input-shell')?.getBoundingClientRect();
      const width = Math.min(360, (shell?.width ?? window.innerWidth) - 24, window.innerWidth - 24);
      const left = Math.min(Math.max(12, shell ? shell.left + 12 : rect.left - 20), window.innerWidth - width - 12);
      const above = rect.top - 24;
      const below = window.innerHeight - rect.bottom - 24;
      const openAbove = above >= popover.scrollHeight || above >= below;
      const maxHeight = Math.max(0, openAbove ? above : below);
      setSide(openAbove ? 'above' : 'below');
      setPosition({
        left, width, maxHeight,
        top: openAbove ? undefined : rect.bottom + 10,
        bottom: openAbove ? window.innerHeight - rect.top + 10 : undefined,
        '--revision-help-arrow': `${Math.max(18, Math.min(width - 18, rect.left + rect.width / 2 - left))}px`,
      } as CSSProperties);
    };
    updatePosition();
    const resize = new ResizeObserver(updatePosition);
    if (popoverRef.current) resize.observe(popoverRef.current);
    const shell = buttonRef.current?.closest('.agent-chat-input-shell');
    if (shell) resize.observe(shell);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      resize.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!buttonRef.current?.contains(event.target as Node) && !popoverRef.current?.contains(event.target as Node)) dismiss();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const focusedInside = popoverRef.current?.contains(document.activeElement);
      dismiss();
      if (focusedInside) buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  return <div className="ci-revision-help">
    <button ref={buttonRef} type="button" className="ci-revision-help-trigger" aria-label="修改说明" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(previous => !previous)}><CircleHelp size={16} aria-hidden="true"/></button>
    {open && createPortal(<div ref={popoverRef} id={id} role="dialog" aria-label="课件修改说明" className={`ci-revision-help-tip is-${side}`} style={position}>
      <div className="ci-revision-help-content">
        <div className="ci-revision-help-header">
          <strong>修改课件</strong>
          <button type="button" className="ci-revision-help-close" aria-label="关闭修改说明" onClick={() => { dismiss(); buttonRef.current?.focus(); }}><X size={16}/></button>
        </div>
        <div className="ci-revision-help-method">
          <span className="ci-revision-help-icon"><ListChecks size={18} aria-hidden="true"/></span>
          <div><div className="ci-revision-help-method-title"><strong>按场景修改</strong><span>更精准</span></div><p>改单个场景时，推荐先选场景再填写。</p></div>
        </div>
        <div className="ci-revision-help-method">
          <span className="ci-revision-help-icon"><MessageSquareText size={18} aria-hidden="true"/></span>
          <div><div className="ci-revision-help-method-title"><strong>直接输入修改</strong></div><p>改整体风格、新增场景等，可直接输入。</p></div>
        </div>
      </div>
    </div>, document.body)}
  </div>;
}
