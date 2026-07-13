import type React from 'react';
import { FileCode2 } from 'lucide-react';

type HtmlTypeBadgeSize = 'mini' | 'small' | 'large';

interface HtmlTypeBadgeProps {
  size?: HtmlTypeBadgeSize;
}

const sizeMap: Record<HtmlTypeBadgeSize, {
  box: number;
  radius: number;
  icon: number;
  label: number;
}> = {
  mini: { box: 28, radius: 8, icon: 14, label: 7 },
  small: { box: 30, radius: 8, icon: 15, label: 7 },
  large: { box: 44, radius: 12, icon: 22, label: 8 },
};

export default function HtmlTypeBadge({ size = 'small' }: HtmlTypeBadgeProps) {
  const token = sizeMap[size];

  return (
    <span
      style={{
        ...styles.badge,
        width: token.box,
        height: token.box,
        borderRadius: token.radius,
      }}
      aria-label="HTML5"
    >
      <FileCode2 size={token.icon} strokeWidth={2.25} />
      <span style={{ ...styles.label, fontSize: token.label }}>HTML5</span>
    </span>
  );
}

const styles = {
  badge: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: '#FFFFFF',
    background: 'var(--agent-gradient)',
    border: '1px solid rgba(255,255,255,0.48)',
    boxShadow: '0 6px 14px var(--agent-focus-ring-strong), inset 0 1px 0 rgba(255,255,255,0.24)',
    lineHeight: 1,
  } as React.CSSProperties,
  label: {
    marginTop: 1,
    color: '#FFFFFF',
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
  } as React.CSSProperties,
};
