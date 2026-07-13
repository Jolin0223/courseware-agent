export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/images/courseware-agent-favicon.png"
      alt=""
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        flexShrink: 0,
      }}
    />
  );
}
