import { useMemo, useState } from 'react';
import { BarChart3, Check, Eye, RefreshCw, X } from 'lucide-react';
import type { LearningDataRecoveryItem } from '../../types';
import { defaultRecoveryItems } from '../../utils/learningDataRecovery';

interface LearningDataRecoveryModalProps {
  isOpen?: boolean;
  coursewareTitle?: string;
  initialItems?: LearningDataRecoveryItem[];
  mode?: 'create' | 'edit';
  onClose?: () => void;
  onRegenerate?: (items: LearningDataRecoveryItem[]) => void;
  onConfirm?: (items: LearningDataRecoveryItem[]) => void;
}

export default function LearningDataRecoveryModal({
  isOpen,
  coursewareTitle,
  initialItems,
  onClose,
  onRegenerate,
  onConfirm,
}: LearningDataRecoveryModalProps) {
  const [activeTab, setActiveTab] = useState<'config' | 'preview'>('config');
  const [items, setItems] = useState<LearningDataRecoveryItem[]>(initialItems?.length ? initialItems : defaultRecoveryItems);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedItems = useMemo(() => items.filter(item => item.checked), [items]);
  const selectedCount = selectedItems.length;

  if (isOpen === false) return null;

  const toggleItem = (id: string) => {
    if (isSubmitting) return;
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleRegenerate = () => {
    if (selectedCount === 0 || isSubmitting) return;
    setIsSubmitting(true);
    window.setTimeout(() => {
      onRegenerate?.(selectedItems);
      onConfirm?.(selectedItems);
      setIsSubmitting(false);
      onClose?.();
    }, 600);
  };

  return (
    <div style={styles.mask} onClick={onClose}>
      <div style={styles.dialog} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.iconCircle}><BarChart3 size={20} /></div>
            <div>
              <div style={styles.title}>查看学情数据</div>
              <div style={styles.subTitle}>{coursewareTitle || '当前课件'} 已完成学情数据回收设计</div>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(activeTab === 'config' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('config')}
          >
            <RefreshCw size={15} />
            修改回收数据
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === 'preview' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('preview')}
          >
            <Eye size={15} />
            查看样式图
          </button>
        </div>

        {activeTab === 'config' ? (
          <div style={styles.content}>
            <div style={styles.notice}>
              当前 HTML 已自动写入学情数据回收能力。老师可修改需要回收的数据；修改后需要重新生成下一版 HTML。
            </div>

            <div style={styles.itemList}>
              {items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  style={{
                    ...styles.item,
                    ...(item.checked ? styles.itemChecked : {}),
                    ...(isSubmitting ? styles.itemDisabled : {}),
                  }}
                >
                  <span style={{
                    ...styles.checkbox,
                    ...(item.checked ? styles.checkboxChecked : {}),
                  }}>
                    {item.checked && <Check size={14} strokeWidth={3} />}
                  </span>
                  <span style={styles.itemText}>
                    <span style={styles.itemLabel}>{item.label}</span>
                    <span style={styles.itemDesc}>{item.description}</span>
                  </span>
                </button>
              ))}
            </div>

            <div style={styles.footer}>
              <div style={styles.footerHint}>已选择 {selectedCount} 项回收数据</div>
              <button
                style={{
                  ...styles.primaryBtn,
                  opacity: selectedCount === 0 || isSubmitting ? 0.55 : 1,
                  cursor: selectedCount === 0 || isSubmitting ? 'not-allowed' : 'pointer',
                }}
                disabled={selectedCount === 0 || isSubmitting}
                onClick={handleRegenerate}
              >
                {isSubmitting ? '生成中...' : '确定'}
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.previewContent}>
            <StudentReportPreview selectedItems={selectedItems} />
          </div>
        )}
      </div>
    </div>
  );
}

function StudentReportPreview({ selectedItems }: { selectedItems: LearningDataRecoveryItem[] }) {
  const names = selectedItems.map(item => item.label);
  const has = (label: string) => names.includes(label);

  return (
    <div style={styles.reportCanvas}>
      <div style={styles.reportHeader}>
        <div>
          <div style={styles.reportKicker}>学生个性化学情报告</div>
          <div style={styles.reportTitle}>水果单词互动乐园</div>
        </div>
        <div style={styles.reportScore}>{has('最终得分') ? '92' : '--'}<span>分</span></div>
      </div>

      <div style={styles.metricGrid}>
        <div style={styles.metricCard}>
          <span style={styles.metricValue}>{has('答对题数') ? '8/10' : '--'}</span>
          <span style={styles.metricLabel}>答题表现</span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricValue}>{has('总用时') ? '3分18秒' : '--'}</span>
          <span style={styles.metricLabel}>完成用时</span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricValue}>{has('收集到的装备数量') ? '5个' : '--'}</span>
          <span style={styles.metricLabel}>游戏奖励</span>
        </div>
      </div>

      <div style={styles.reportSection}>
        <div style={styles.sectionTitle}>知识点掌握</div>
        <div style={styles.radarWrap}>
          <div style={styles.radar}>
            <div style={{ ...styles.radarLine, transform: 'rotate(0deg)' }} />
            <div style={{ ...styles.radarLine, transform: 'rotate(72deg)' }} />
            <div style={{ ...styles.radarLine, transform: 'rotate(144deg)' }} />
            <div style={styles.radarShape} />
          </div>
          <div style={styles.tagList}>
            {['apple', 'banana', 'orange', 'grape'].map(tag => (
              <span key={tag} style={styles.tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.reportSection}>
        <div style={styles.sectionTitle}>个性化建议</div>
        <div style={styles.suggestion}>
          {has('错词记录')
            ? '本次易错词为 orange、grape，建议课后优先复习图片识词和听音辨词。'
            : '本次报告未回收错词记录，仅展示整体完成表现。'}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  mask: {
    position: 'fixed',
    inset: 0,
    zIndex: 4000,
    background: 'rgba(15, 23, 42, 0.46)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: 'min(860px, 96vw)',
    maxHeight: '88vh',
    background: '#FFFFFF',
    borderRadius: 14,
    boxShadow: '0 28px 90px rgba(15, 23, 42, 0.28)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: '18px 20px 16px',
    borderBottom: '1px solid #E2E8F0',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: '#F0FDFA',
    color: 'var(--agent-primary-text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: 800,
    color: '#0F172A',
  },
  subTitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748B',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    color: '#64748B',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    display: 'flex',
    gap: 8,
    padding: '12px 20px 0',
    background: '#FFFFFF',
  },
  tab: {
    height: 36,
    padding: '0 14px',
    borderRadius: '8px 8px 0 0',
    border: '1px solid #E2E8F0',
    borderBottom: 'none',
    background: '#F8FAFC',
    color: '#64748B',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  tabActive: {
    background: '#FFFFFF',
    color: 'var(--agent-primary-text)',
    borderColor: '#99F6E4',
  },
  content: {
    padding: '16px 20px 20px',
    overflowY: 'auto',
  },
  notice: {
    padding: '12px 14px',
    borderRadius: 10,
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    color: '#475569',
    fontSize: 13,
    lineHeight: 1.6,
    marginBottom: 14,
  },
  itemList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 10,
  },
  item: {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    cursor: 'pointer',
    textAlign: 'left',
  },
  itemChecked: {
    borderColor: '#99F6E4',
    background: '#F0FDFA',
  },
  itemDisabled: {
    cursor: 'default',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    border: '1.5px solid #CBD5E1',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxChecked: {
    background: 'var(--agent-primary)',
    borderColor: 'var(--agent-primary)',
  },
  itemText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: 800,
    color: '#1E293B',
  },
  itemDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 1.45,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
    paddingTop: 14,
    borderTop: '1px solid #E2E8F0',
  },
  footerHint: {
    fontSize: 13,
    color: '#64748B',
  },
  primaryBtn: {
    height: 36,
    minWidth: 84,
    padding: '0 20px',
    borderRadius: 8,
    border: 'none',
    background: 'var(--agent-gradient)',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 800,
  },
  previewContent: {
    padding: '16px 20px 22px',
    overflowY: 'auto',
    background: '#F8FAFC',
  },
  reportCanvas: {
    width: 'min(420px, 100%)',
    margin: '0 auto',
    borderRadius: 18,
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    boxShadow: '0 16px 48px rgba(15, 23, 42, 0.12)',
    overflow: 'hidden',
  },
  reportHeader: {
    padding: 18,
    background: 'linear-gradient(135deg, #0EA5E9, #14B8A6)',
    color: '#FFFFFF',
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  reportKicker: {
    fontSize: 12,
    opacity: 0.86,
    fontWeight: 700,
  },
  reportTitle: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: 900,
  },
  reportScore: {
    fontSize: 32,
    fontWeight: 900,
    lineHeight: 1,
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    padding: 14,
  },
  metricCard: {
    borderRadius: 10,
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    padding: '10px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: 900,
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  reportSection: {
    padding: '0 16px 16px',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: '#0F172A',
    marginBottom: 10,
  },
  radarWrap: {
    display: 'grid',
    gridTemplateColumns: '124px 1fr',
    alignItems: 'center',
    gap: 12,
  },
  radar: {
    width: 116,
    height: 116,
    borderRadius: '50%',
    border: '1px solid #CBD5E1',
    background: 'radial-gradient(circle, #FFFFFF 0 28%, #F8FAFC 29% 56%, #ECFEFF 57% 100%)',
    position: 'relative',
    overflow: 'hidden',
  },
  radarLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: 1,
    height: '100%',
    background: '#CBD5E1',
    transformOrigin: 'center',
  },
  radarShape: {
    position: 'absolute',
    left: 28,
    top: 20,
    width: 62,
    height: 72,
    background: 'rgba(20, 184, 166, 0.28)',
    border: '2px solid #14B8A6',
    clipPath: 'polygon(50% 0%, 92% 35%, 72% 100%, 20% 82%, 8% 28%)',
  },
  tagList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    padding: '5px 9px',
    borderRadius: 999,
    background: '#F0FDFA',
    border: '1px solid #99F6E4',
    color: '#0F766E',
    fontSize: 12,
    fontWeight: 800,
  },
  suggestion: {
    padding: 12,
    borderRadius: 10,
    background: '#FFF7ED',
    border: '1px solid #FED7AA',
    color: '#9A3412',
    fontSize: 13,
    lineHeight: 1.6,
  },
};
