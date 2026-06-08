// Logo 组件 - 素材管理平台
export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <img
        src="/images/iteach-workbench-logo.png"
        alt=""
        aria-hidden="true"
        style={{
          display: 'var(--agent-workbench-logo-display, none)',
          width: size,
          height: size,
          objectFit: 'contain',
        }}
      />
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'var(--agent-default-logo-display, block)' }}
      >
        {/* 底层青色方块 */}
        <rect
          x="2"
          y="8"
          width="20"
          height="20"
          rx="4"
          fill="var(--agent-secondary)"
          opacity="0.8"
        />
        {/* 上层绿色方块 */}
        <rect
          x="10"
          y="2"
          width="20"
          height="20"
          rx="4"
          fill="var(--agent-primary)"
          opacity="0.9"
        />
        {/* 交集处的亮绿色 */}
        <rect
          x="10"
          y="8"
          width="12"
          height="14"
          rx="2"
          fill="var(--agent-accent)"
        />
      </svg>
    </span>
  );
}
