import React, { useState } from 'react';
import { Monitor, Layout } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export default function ModeSwitcher() {
  const { appMode, setAppMode } = useUIStore();
  const [hovered, setHovered] = useState<string | null>(null);

  const modes = [
    { key: 'standalone' as const, label: '独立模式', icon: Monitor },
    { key: 'embedded' as const, label: '编辑器模式', icon: Layout },
  ];

  return (
    <div style={styles.container}>
      {modes.map(m => {
        const active = appMode === m.key;
        const Icon = m.icon;
        return (
          <button
            key={m.key}
            style={{
              ...styles.btn,
              ...(active ? styles.btnActive : {}),
              ...(hovered === m.key && !active ? styles.btnHover : {}),
            }}
            onClick={() => setAppMode(m.key)}
            onMouseEnter={() => setHovered(m.key)}
            onMouseLeave={() => setHovered(null)}
          >
            <Icon size={14} />
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    background: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
    gap: 2,
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    fontSize: 13,
    color: '#64748B',
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  },
  btnActive: {
    background: '#fff',
    color: '#1E293B',
    fontWeight: 600,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  btnHover: {
    background: 'rgba(255,255,255,0.5)',
  },
};
