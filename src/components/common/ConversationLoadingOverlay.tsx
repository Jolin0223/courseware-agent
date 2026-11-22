import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './conversationLoadingOverlay.css';

/** A short history-loading state; all existing content stays visible underneath. */
export default function ConversationLoadingOverlay() {
  const statusRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = document.getElementById('root');
    const wasInert = root?.inert ?? false;
    const previousFocus = document.activeElement;
    if (root) root.inert = true;
    statusRef.current?.focus({ preventScroll: true });
    return () => {
      if (root) root.inert = wasInert;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  return createPortal(
    <div className="agent-conversation-loading" ref={statusRef} role="status" aria-live="polite" aria-label="正在加载会话" tabIndex={-1}>
      <span className="agent-conversation-loading-dots" aria-hidden="true">
        <i /><i /><i /><i />
      </span>
    </div>,
    document.body,
  );
}
