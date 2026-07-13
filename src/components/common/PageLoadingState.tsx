import type React from 'react';
import { PlayCircle } from 'lucide-react';

interface PageLoadingStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  fill?: boolean;
  variant?: 'full' | 'dots';
  style?: React.CSSProperties;
}

export default function PageLoadingState({
  title = '正在加载内容',
  description = '内容较大时会稍等片刻',
  icon = <PlayCircle size={22} />,
  fill = false,
  variant = 'full',
  style,
}: PageLoadingStateProps) {
  const isDots = variant === 'dots';

  return (
    <div style={{ ...styles.wrap(fill, isDots), ...style }}>
      <style>{`
        @keyframes pageLoadingOrbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pageLoadingIconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes pageLoadingDot {
          0%, 80%, 100% { transform: scale(0.72); opacity: 0.42; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes pageLoadingShimmer {
          0% { transform: translateX(-34%); opacity: 0; }
          30% { opacity: 0.72; }
          100% { transform: translateX(34%); opacity: 0; }
        }
      `}</style>
      {!isDots && (
        <div style={styles.iconBox}>
          <span style={styles.orbit} />
          <span style={styles.shimmer} />
          <span style={styles.icon}>{icon}</span>
        </div>
      )}
      <div style={isDots ? styles.dotsTitle : styles.title}>{title}</div>
      {!isDots && <div style={styles.description}>{description}</div>}
      <div style={styles.dots} aria-hidden="true">
        <span style={{ ...styles.dot, animationDelay: '0s' }} />
        <span style={{ ...styles.dot, animationDelay: '0.16s' }} />
        <span style={{ ...styles.dot, animationDelay: '0.32s' }} />
      </div>
    </div>
  );
}

const styles = {
  wrap: (fill: boolean, isDots: boolean): React.CSSProperties => ({
    position: fill ? 'absolute' : 'relative',
    inset: fill ? 0 : undefined,
    zIndex: fill ? 1 : undefined,
    width: '100%',
    height: fill ? '100%' : undefined,
    minHeight: fill ? undefined : isDots ? 120 : 220,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isDots ? 8 : 9,
    padding: isDots ? 18 : 28,
    color: '#64748B',
    background: isDots ? 'rgba(248, 254, 252, 0.86)' : 'radial-gradient(circle at 50% 44%, rgba(191, 233, 245, 0.36), rgba(255,255,255,0) 30%), linear-gradient(135deg, #F8FEFC 0%, #F0F9FF 100%)',
  }),
  iconBox: {
    position: 'relative',
    width: 58,
    height: 58,
    borderRadius: 20,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.9)',
    border: '1px solid var(--agent-border)',
    boxShadow: '0 18px 42px rgba(14, 165, 233, 0.14), inset 0 1px 0 rgba(255,255,255,0.96)',
    overflow: 'hidden',
  } as React.CSSProperties,
  orbit: {
    position: 'absolute',
    inset: 7,
    borderRadius: 999,
    border: '2px solid rgba(191, 233, 245, 0.78)',
    borderTopColor: 'var(--agent-primary)',
    borderRightColor: 'var(--agent-secondary)',
    animation: 'pageLoadingOrbit 1.35s linear infinite',
  } as React.CSSProperties,
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 26,
    background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.76), rgba(255,255,255,0))',
    transform: 'translateX(-34%)',
    animation: 'pageLoadingShimmer 2.2s ease-in-out infinite',
  } as React.CSSProperties,
  icon: {
    position: 'relative',
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 999,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--agent-primary-text)',
    animation: 'pageLoadingIconFloat 1.6s ease-in-out infinite',
  } as React.CSSProperties,
  title: {
    marginTop: 7,
    color: '#0F172A',
    fontSize: 16,
    fontWeight: 950,
    lineHeight: 1.35,
  } as React.CSSProperties,
  description: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: 760,
    lineHeight: 1.45,
  } as React.CSSProperties,
  dotsTitle: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: 760,
    lineHeight: 1.4,
  } as React.CSSProperties,
  dots: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    height: 12,
  } as React.CSSProperties,
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    background: 'var(--agent-primary)',
    animation: 'pageLoadingDot 1.4s infinite ease-in-out both',
  } as React.CSSProperties,
};
