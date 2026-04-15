// Logo 组件 - 素材管理平台
export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 底层青色方块 */}
      <rect
        x="2"
        y="8"
        width="20"
        height="20"
        rx="4"
        fill="#22D3EE"
        opacity="0.8"
      />
      {/* 上层绿色方块 */}
      <rect
        x="10"
        y="2"
        width="20"
        height="20"
        rx="4"
        fill="#4ADE80"
        opacity="0.9"
      />
      {/* 交集处的亮绿色 */}
      <rect
        x="10"
        y="8"
        width="12"
        height="14"
        rx="2"
        fill="#4ADE80"
      />
    </svg>
  );
}
