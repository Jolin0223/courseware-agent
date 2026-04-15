import React from 'react';
import { X } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

interface EditorDrawerProps {
  children: React.ReactNode;
}

export default function EditorDrawer({ children }: EditorDrawerProps) {
  const { editorDrawerOpen, closeEditorDrawer } = useUIStore();

  return (
    <>
      {editorDrawerOpen && (
        <div style={styles.overlay} onClick={closeEditorDrawer} />
      )}
      <div style={{
        ...styles.drawer,
        transform: editorDrawerOpen ? 'translateX(0)' : 'translateX(100%)',
      }}>
        <div style={styles.header}>
          <span style={styles.title}>互动课件 AI Agent</span>
          <button style={styles.closeBtn} onClick={closeEditorDrawer}>
            <X size={18} />
          </button>
        </div>
        <div style={styles.body}>
          {children}
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.3)',
    zIndex: 999,
  },
  drawer: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '75vw',
    maxWidth: 1200,
    height: '100vh',
    background: '#F8FAFE',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.3s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderBottom: '1px solid #E2E8F0',
    background: '#fff',
    flexShrink: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1E293B',
  },
  closeBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 8,
    border: 'none',
    background: '#F1F5F9',
    color: '#64748B',
    cursor: 'pointer',
  },
  body: {
    flex: 1,
    overflow: 'auto',
  },
};
