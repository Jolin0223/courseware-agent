import { LoaderCircle } from 'lucide-react';

interface GlobalLoadingOverlayProps {
  title?: string;
}

export default function GlobalLoadingOverlay({
  title = '正在加载',
}: GlobalLoadingOverlayProps) {
  return (
    <div style={styles.mask} aria-live="polite">
      <style>{`
        @keyframes globalLoadingSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={styles.content}>
        <LoaderCircle size={26} strokeWidth={2.2} style={styles.spinner} />
        <span style={styles.title}>{title}</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  mask: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(248, 250, 252, 0.78)',
    backdropFilter: 'blur(2px)',
  },
  content: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
  },
  spinner: {
    color: 'var(--agent-primary)',
    animation: 'globalLoadingSpin 0.85s linear infinite',
  },
  title: {
    color: '#334155',
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.4,
  },
};
