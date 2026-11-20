import type { CSSProperties } from 'react';

// Shared by ordinary long messages and submitted scene-edit messages.
const style: CSSProperties = {
  marginTop: 6, height: 26, padding: '0 10px', borderRadius: 10,
  border: '1px solid #CFEAF7', background: 'rgba(255, 255, 255, 0.92)',
  color: 'var(--agent-primary-text)', fontSize: 12, fontWeight: 850,
  cursor: 'pointer', boxShadow: '0 6px 16px rgba(15, 23, 42, 0.08)',
};
export default function MessageExpandButton({expanded,onClick}:{expanded:boolean;onClick:()=>void}) {
  return <button type="button" style={style} aria-expanded={expanded} onClick={onClick}>{expanded?'收起内容':'展开全部'}</button>;
}
