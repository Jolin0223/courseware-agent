export type CoursewareEntryLoadingMode = 'clone' | 'edit';

interface CoursewareEntryLoadingProps {
  mode: CoursewareEntryLoadingMode;
  title?: string;
  resourceId?: string;
}

const LOADING_ROBOT_URL = '/assets/courseware-entry-loading-robot.png';

const modeCopy = {
  clone: {
    title: '正在创建同款课件',
    description: '正在带入原课件内容和第一版结果，请稍候。',
    modeLabel: '一键同款',
  },
  edit: {
    title: '正在进入编辑页',
    description: '正在加载当前素材对应的会话信息，请稍候。',
    modeLabel: '编辑',
  },
} satisfies Record<CoursewareEntryLoadingMode, {
  title: string;
  description: string;
  modeLabel: string;
}>;

export default function CoursewareEntryLoading({
  mode,
  title,
  resourceId,
}: CoursewareEntryLoadingProps) {
  const copy = modeCopy[mode];
  const materialText = resourceId || title || '正在读取';

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes entryLoadingDot {
          0%, 100% { transform: scale(0.82); opacity: 0.28; }
          42% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes entryLoadingBreathe {
          0%, 100% { opacity: 0.72; transform: scale(0.98); }
          50% { opacity: 1; transform: scale(1.02); }
        }
        @media (max-width: 760px) {
          .courseware-entry-loading-card {
            width: min(420px, calc(100vw - 32px)) !important;
            min-height: 318px !important;
            padding: 0 22px 24px !important;
            border-radius: 18px !important;
          }
          .courseware-entry-loading-visual {
            width: min(310px, 86vw) !important;
            height: 154px !important;
            margin-top: 0 !important;
          }
          .courseware-entry-loading-title {
            font-size: 22px !important;
          }
          .courseware-entry-loading-meta {
            max-width: 100% !important;
            white-space: normal !important;
          }
        }
      `}</style>

      <section className="courseware-entry-loading-card" style={styles.card} aria-live="polite">
        <div className="courseware-entry-loading-visual" style={styles.visual}>
          <span style={styles.robotGlow} />
          <img src={LOADING_ROBOT_URL} alt="" draggable={false} style={styles.robotImage} />
          <span style={styles.robotMask} />
        </div>

        <h1 className="courseware-entry-loading-title" style={styles.title}>{copy.title}</h1>
        <p style={styles.description}>{copy.description}</p>

        <div style={styles.dots} aria-hidden="true">
          {Array.from({ length: 12 }).map((_, index) => (
            <span
              key={index}
              style={{
                ...styles.dot,
                ...(index < 2 ? styles.activeDot : {}),
                animationDelay: `${index * 0.12}s`,
              }}
            />
          ))}
        </div>

        <div className="courseware-entry-loading-meta" style={styles.meta}>
          <span>模式：{copy.modeLabel}</span>
          <span style={styles.metaDivider} />
          <span>素材ID：{materialText}</span>
        </div>
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    background: [
      'radial-gradient(circle at 22% 24%, rgba(255, 255, 255, 0.95) 0, rgba(255, 255, 255, 0) 28%)',
      'radial-gradient(circle at 78% 58%, rgba(198, 236, 255, 0.7) 0, rgba(198, 236, 255, 0) 34%)',
      'linear-gradient(180deg, #F5FAFF 0%, #EAF6FF 100%)',
    ].join(', '),
  },
  card: {
    width: 'min(560px, calc(100vw - 56px))',
    minHeight: 366,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 34px 26px',
    borderRadius: 20,
    border: '1px solid rgba(214, 231, 244, 0.86)',
    background: 'rgba(255, 255, 255, 0.86)',
    boxShadow: '0 24px 72px rgba(59, 104, 147, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(10px)',
    textAlign: 'center',
    overflow: 'hidden',
  },
  visual: {
    position: 'relative',
    width: 374,
    height: 196,
    marginTop: 0,
    marginBottom: 2,
    overflow: 'hidden',
    flexShrink: 0,
  },
  robotGlow: {
    position: 'absolute',
    left: '50%',
    top: 19,
    width: 190,
    height: 150,
    transform: 'translateX(-50%)',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(66, 184, 255, 0.18), rgba(66, 184, 255, 0) 68%)',
    filter: 'blur(4px)',
    animation: 'entryLoadingBreathe 2.4s ease-in-out infinite',
  },
  robotImage: {
    position: 'absolute',
    left: '50%',
    top: -56,
    width: 360,
    height: 240,
    transform: 'translateX(-50%)',
    objectFit: 'cover',
    objectPosition: 'center top',
    userSelect: 'none',
    pointerEvents: 'none',
    WebkitMaskImage: 'radial-gradient(ellipse at 50% 43%, #000 44%, rgba(0, 0, 0, 0.78) 60%, rgba(0, 0, 0, 0.28) 72%, transparent 86%)',
    maskImage: 'radial-gradient(ellipse at 50% 43%, #000 44%, rgba(0, 0, 0, 0.78) 60%, rgba(0, 0, 0, 0.28) 72%, transparent 86%)',
  },
  robotMask: {
    position: 'absolute',
    left: 34,
    right: 34,
    bottom: 20,
    height: 42,
    borderRadius: '50%',
    background: 'linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.72) 52%, rgba(255,255,255,0.92))',
    boxShadow: '0 -12px 34px rgba(255,255,255,0.82)',
  },
  title: {
    margin: '0 0 10px',
    color: '#0F172A',
    fontSize: 24,
    lineHeight: 1.25,
    fontWeight: 900,
    letterSpacing: 0,
  },
  description: {
    margin: 0,
    color: '#64748B',
    fontSize: 13,
    lineHeight: 1.7,
    fontWeight: 650,
  },
  dots: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    height: 10,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    background: '#C9D8E8',
    animation: 'entryLoadingDot 1.45s ease-in-out infinite',
  },
  activeDot: {
    width: 6,
    height: 6,
    background: 'var(--agent-primary)',
    boxShadow: '0 0 0 3px rgba(2, 116, 252, 0.08)',
  },
  meta: {
    maxWidth: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 22,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 1.45,
    fontWeight: 750,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  metaDivider: {
    width: 1,
    height: 12,
    borderRadius: 999,
    background: '#D8E4EF',
    flexShrink: 0,
  },
};
