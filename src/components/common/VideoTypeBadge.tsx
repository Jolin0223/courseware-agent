import type React from 'react';
import { Film } from 'lucide-react';

type VideoTypeBadgeSize = 'small' | 'large';

const sizes: Record<VideoTypeBadgeSize, { box: number; radius: number; icon: number; label: number }> = {
  small: { box: 30, radius: 8, icon: 15, label: 7 },
  large: { box: 44, radius: 12, icon: 22, label: 8 },
};

export default function VideoTypeBadge({ size = 'small' }: { size?: VideoTypeBadgeSize }) {
  const token = sizes[size];
  return <span aria-label="视频H5" style={{ ...styles.badge, width: token.box, height: token.box, borderRadius: token.radius }}>
    <Film size={token.icon} strokeWidth={2.25} />
    <span style={{ ...styles.label, fontSize: token.label }}>视频H5</span>
  </span>;
}

const styles = {
  badge: {
    display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    color: '#FFFFFF', background: 'var(--agent-hero-gradient)', border: '1px solid rgba(255,255,255,0.48)',
    boxShadow: '0 6px 14px var(--agent-focus-ring), inset 0 1px 0 rgba(255,255,255,0.24)', lineHeight: 1,
  } as React.CSSProperties,
  label: { marginTop: 1, color: '#FFFFFF', fontWeight: 950, lineHeight: 1 } as React.CSSProperties,
};
