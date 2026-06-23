import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Award,
  BarChart3,
  BookOpenCheck,
  Check,
  Clock3,
  Layers3,
  RefreshCw,
  Tag,
  Target,
  X,
} from 'lucide-react';
import type { LearningDataRecoveryItem } from '../../types';
import { getRecoveryItemsForCourseware } from '../../utils/learningDataRecovery';

interface LearningDataRecoveryModalProps {
  isOpen?: boolean;
  coursewareTitle?: string;
  initialItems?: LearningDataRecoveryItem[];
  isLatestVersion?: boolean;
  mode?: 'create' | 'edit';
  onClose?: () => void;
  onRegenerate?: (items: LearningDataRecoveryItem[]) => void;
  onConfirm?: (items: LearningDataRecoveryItem[]) => void;
}

type ReportCaseKey = 'fruit' | 'bowen' | 'bilingual' | 'brain';
type MetricIconKey = 'score' | 'accuracy' | 'time' | 'reward' | 'correct' | 'complete' | 'level';

interface ReportProfile {
  key: ReportCaseKey;
  title: string;
  tags: Array<{ label: string; value: number }>;
  suggestion: string;
  metricRows: Array<{ id: string; label: string; value: string; icon: MetricIconKey }>;
}

const getReportProfile = (gameName: string, caseKey: ReportCaseKey): ReportProfile => {
  if (caseKey === 'bowen') {
    return {
      key: 'bowen',
      title: '近义词大挑战',
      tags: [
        { label: '近义词辨析', value: 92 },
        { label: '语境理解', value: 86 },
        { label: '准确用词', value: 78 },
      ],
      suggestion: '本次能根据句子语境选择合适的近义词，整体掌握较好；“屹立、矗立、耸立”这类易混词还可以继续通过例句巩固。',
      metricRows: [
        { id: 'final-score', label: '总得分', value: '40分', icon: 'score' },
        { id: 'accuracy', label: '正确率', value: '80%', icon: 'accuracy' },
        { id: 'total-time', label: '总用时', value: '2分16秒', icon: 'time' },
        { id: 'correct-count', label: '答对题数', value: '4/5', icon: 'correct' },
        { id: 'completion-count', label: '完成次数', value: '1次', icon: 'complete' },
      ],
    };
  }

  if (caseKey === 'bilingual') {
    return {
      key: 'bilingual',
      title: '单词神枪手',
      tags: [
        { label: '图词匹配', value: 90 },
        { label: '单词辨认', value: 84 },
        { label: '快速反应', value: 80 },
      ],
      suggestion: '本次能较快完成图片与英文单词的匹配，身体部位类单词掌握稳定；个别形近词、音近词还可以继续巩固。',
      metricRows: [
        { id: 'final-score', label: '总得分', value: '110分', icon: 'score' },
        { id: 'accuracy', label: '正确率', value: '85%', icon: 'accuracy' },
        { id: 'total-time', label: '总用时', value: '1分42秒', icon: 'time' },
        { id: 'correct-count', label: '答对题数', value: '11/13', icon: 'correct' },
        { id: 'completion-count', label: '完成次数', value: '1次', icon: 'complete' },
        { id: 'reward-count', label: '奖励数量', value: '5个', icon: 'reward' },
      ],
    };
  }

  if (caseKey === 'brain') {
    return {
      key: 'brain',
      title: '比绳子长短',
      tags: [
        { label: '长短比较', value: 90 },
        { label: '空间观察', value: 86 },
        { label: '路径判断', value: 82 },
      ],
      suggestion: '本次能通过观察和拉直比较绳子长短，基础比较能力较好；遇到路径更复杂的关卡时，可以继续练习按格数判断长短。',
      metricRows: [
        { id: 'final-score', label: '总得分', value: '90分', icon: 'score' },
        { id: 'accuracy', label: '正确率', value: '90%', icon: 'accuracy' },
        { id: 'total-time', label: '总用时', value: '3分42秒', icon: 'time' },
        { id: 'correct-count', label: '答对题数', value: '9/10', icon: 'correct' },
        { id: 'completion-count', label: '完成次数', value: '1次', icon: 'complete' },
        { id: 'passed-levels', label: '通关关卡数', value: '10关', icon: 'level' },
      ],
    };
  }

  const title = gameName || '水果单词互动乐园';
  return {
    key: 'fruit',
    title,
    tags: [
      { label: '水果词汇识别', value: 88 },
      { label: '图词匹配', value: 82 },
    ],
    suggestion: '本次能完成水果单词认读、跟读和游戏巩固，基础词汇识别较稳定；可继续复习 watermelon、strawberry 等较长单词。',
    metricRows: [
      { id: 'final-score', label: '总得分', value: '86分', icon: 'score' },
      { id: 'accuracy', label: '正确率', value: '84%', icon: 'accuracy' },
      { id: 'total-time', label: '总用时', value: '4分12秒', icon: 'time' },
      { id: 'correct-count', label: '答对题数', value: '21/25', icon: 'correct' },
      { id: 'completion-count', label: '完成次数', value: '1次', icon: 'complete' },
      { id: 'reward-count', label: '奖励数量', value: '8颗星', icon: 'reward' },
      { id: 'passed-levels', label: '通关关卡数', value: '3关', icon: 'level' },
    ],
  };
};

const iconMap = {
  score: Target,
  accuracy: BookOpenCheck,
  time: Clock3,
  reward: Award,
  correct: Check,
  complete: RefreshCw,
  level: Layers3,
};

const getCaseFromTitle = (title?: string): ReportCaseKey => {
  if (title?.includes('近义词大挑战')) return 'bowen';
  if (title?.includes('单词神枪手')) return 'bilingual';
  if (title?.includes('比绳子长短')) return 'brain';
  return 'fruit';
};

export default function LearningDataRecoveryModal({
  isOpen,
  coursewareTitle,
  initialItems,
  isLatestVersion = true,
  onClose,
  onRegenerate,
  onConfirm,
}: LearningDataRecoveryModalProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'config'>('preview');
  const [items, setItems] = useState<LearningDataRecoveryItem[]>(() => getRecoveryItemsForCourseware(coursewareTitle, initialItems));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportCase, setReportCase] = useState<ReportCaseKey>(() => getCaseFromTitle(coursewareTitle));
  const [showCaseSwitch, setShowCaseSwitch] = useState(false);
  const selectedItems = useMemo(() => items.filter(item => item.checked), [items]);
  const selectedCount = selectedItems.length;
  const canModifyRecovery = isLatestVersion;

  useEffect(() => {
    if (!isOpen) return;
    setViewMode('preview');
    setReportCase(getCaseFromTitle(coursewareTitle));
    setShowCaseSwitch(false);
  }, [coursewareTitle, isOpen]);

  if (isOpen === false) return null;

  const toggleItem = (id: string) => {
    if (!canModifyRecovery || isSubmitting) return;
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
              <div style={styles.title}>{viewMode === 'preview' ? '学情报告预览' : canModifyRecovery ? '修改报告数据' : '查看回收数据'}</div>
              <div style={styles.subTitle}>
                {viewMode === 'preview'
                  ? `以下为「${coursewareTitle || '当前课件'}」的学生端/家长端报告示意`
                  : canModifyRecovery
                    ? '选择需要进入学情报告的回收数据，确认后将重新生成下一版课件'
                    : '当前为历史版本，仅可查看本版已生效的回收数据'}
              </div>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        {viewMode === 'config' ? (
          <div style={styles.content}>
            <div style={styles.notice}>
              {canModifyRecovery
                ? '当前 HTML 已自动写入学情数据回收能力。老师可修改需要回收的数据；修改后需要重新生成下一版 HTML。'
                : '当前为历史版本，仅可查看本版已生效的学情数据回收配置，无法修改。'}
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
                    ...(!canModifyRecovery || isSubmitting ? styles.itemDisabled : {}),
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
              <div style={styles.footerHint}>
                {canModifyRecovery ? `已选择 ${selectedCount} 项回收数据` : `本版已回收 ${selectedCount} 项学情数据`}
              </div>
              <div style={styles.footerActions}>
                <button type="button" style={styles.secondaryBtn} onClick={() => setViewMode('preview')}>
                  {canModifyRecovery ? '取消，返回预览' : '返回预览'}
                </button>
                {canModifyRecovery ? (
                  <button
                    style={{
                      ...styles.primaryBtn,
                      opacity: selectedCount === 0 || isSubmitting ? 0.55 : 1,
                      cursor: selectedCount === 0 || isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                    disabled={selectedCount === 0 || isSubmitting}
                    onClick={handleRegenerate}
                  >
                    {isSubmitting ? '生成中...' : '确定并重新生成课件'}
                  </button>
                ) : (
                  <div style={styles.readOnlyHint}>历史版本仅支持查看，请在最新版本中修改回收数据</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.previewContent}>
            <div
              style={styles.previewTopBar}
              onDoubleClick={() => {
                setShowCaseSwitch(prev => {
                  if (!prev) setReportCase('bowen');
                  if (prev) setReportCase(getCaseFromTitle(coursewareTitle));
                  return !prev;
                });
              }}
            >
              <div style={styles.previewInfo}>
                <div style={styles.previewInfoTitle}>当前报告将展示</div>
                <div style={styles.previewInfoDesc}>
                  {selectedItems.length
                    ? selectedItems.map(item => item.label).join('、')
                    : '暂无可展示的学习表现指标'}
                </div>
              </div>
              <button type="button" style={styles.adjustBtn} onClick={() => setViewMode('config')}>
                <RefreshCw size={15} />
                修改报告数据
              </button>
              {showCaseSwitch && (
                <div style={styles.caseSwitch}>
                  {[
                    ['bowen', '博文'],
                    ['bilingual', '双语'],
                    ['brain', '脑力'],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      style={{ ...styles.caseBtn, ...(reportCase === key ? styles.caseBtnActive : {}) }}
                      onClick={() => setReportCase(key as ReportCaseKey)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={styles.notice}>
              这里仅示意学生端/家长端收到的个性化学情报告样式，当前展示为模拟数据，正式报告会使用学生真实作答结果生成。
            </div>
            <StudentReportPreview
              coursewareTitle={coursewareTitle}
              selectedItems={selectedItems}
              reportCase={reportCase}
              isSimpleDemo={showCaseSwitch}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function StudentReportPreview({
  coursewareTitle,
  selectedItems,
  reportCase,
  isSimpleDemo,
}: {
  coursewareTitle?: string;
  selectedItems: LearningDataRecoveryItem[];
  reportCase: ReportCaseKey;
  isSimpleDemo?: boolean;
}) {
  const [showPublishedRadar, setShowPublishedRadar] = useState(false);
  const [showKnowledgeTags, setShowKnowledgeTags] = useState(false);
  const profile = getReportProfile(coursewareTitle || '水果单词互动乐园', isSimpleDemo ? reportCase : getCaseFromTitle(coursewareTitle));
  const selectedIds = new Set(selectedItems.map(item => item.id));
  const visibleMetrics = profile.metricRows.filter(metric => selectedIds.has(metric.id));
  const showPublishedData = showPublishedRadar || showKnowledgeTags;
  const useBarKnowledgeChart = profile.tags.length < 3;

  return (
    <div style={styles.reportCanvas}>
      <div style={styles.reportHeader}>
        <div style={styles.headerGlow} />
        <div style={styles.reportHeaderMain}>
          <div>
            <div style={styles.reportKicker}>学生个性化学情报告</div>
            <div style={styles.reportTitle}>{profile.title}</div>
          </div>
          <div style={styles.reportBadge}>已完成</div>
        </div>
      </div>

      <div style={styles.reportBody}>
        <section style={styles.reportSection}>
          <div style={styles.sectionTitle}>学习表现</div>
          <div style={styles.moduleStack}>
            <DynamicModule icon={<Target size={15} />} title="本次表现">
              {visibleMetrics.length ? (
                <div style={styles.metricList}>
                  {visibleMetrics.map(metric => {
                    const Icon = iconMap[metric.icon];
                    return (
                      <div key={metric.id} style={styles.metricTile}>
                        <span style={styles.metricIcon}><Icon size={15} /></span>
                        <span style={styles.metricValue}>{metric.value}</span>
                        <span style={styles.metricLabel}>{metric.label}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={styles.emptyMetricHint}>当前未选择可展示的学习表现指标</div>
              )}
            </DynamicModule>
          </div>
        </section>

        <section style={styles.reportSection}>
          <div style={styles.sectionTitle}>{useBarKnowledgeChart ? '知识点掌握度' : '知识点雷达图'}</div>
          <div
            style={showPublishedData ? styles.radarReady : styles.radarPending}
            onDoubleClick={() => setShowPublishedRadar(prev => !prev)}
          >
            {showPublishedData ? (
              <>
                {useBarKnowledgeChart ? (
                  <KnowledgeBarChart tags={profile.tags} />
                ) : (
                  <>
                    <RadarChart tags={profile.tags} />
                    <div style={styles.radarLegend}>
                      {profile.tags.map(tag => (
                        <div key={tag.label} style={styles.radarLegendRow}>
                          <span>{tag.label}</span>
                          <strong>{tag.value}%</strong>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div style={styles.radarPendingIcon}><Tag size={18} /></div>
                <div style={styles.radarPendingText}>
                  <div style={styles.radarPendingTitle}>
                    {useBarKnowledgeChart ? '发布并完成知识点标签后生成真实掌握度图' : '发布并完成知识点标签后生成真实雷达图'}
                  </div>
                  <div style={styles.radarPendingDesc}>
                    预览态展示报告位置。正式报告会读取资源发布后绑定的集团知识点标签或校本标签；标签少于 3 个时用柱状图展示，3 个及以上时用雷达图展示。
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <section style={{ ...styles.reportSection, ...styles.overallSection }}>
          <div style={styles.sectionTitle}>整体表现</div>
          <div style={styles.tagToggleArea} onDoubleClick={() => setShowKnowledgeTags(prev => !prev)}>
            {showPublishedData ? (
              <div style={styles.tagList}>
                {profile.tags.map(tag => <span key={tag.label} style={styles.tag}>{tag.label}</span>)}
              </div>
            ) : (
              <div style={styles.tagPending}>发布并完成知识点标签后展示本次涉及的知识点标签</div>
            )}
          </div>
          <div style={styles.suggestion}>{profile.suggestion}</div>
        </section>
      </div>
    </div>
  );
}

function KnowledgeBarChart({ tags }: { tags: ReportProfile['tags'] }) {
  return (
    <div style={styles.knowledgeBarChart} aria-label="知识点掌握度柱状图">
      <div style={styles.knowledgeBarPlot}>
        {tags.map(tag => (
          <div key={tag.label} style={styles.knowledgeBarColumn}>
            <div style={styles.knowledgeBarValue}>{tag.value}%</div>
            <div style={{ ...styles.knowledgeBarFill, height: `${tag.value}%` }} />
            <div style={styles.knowledgeBarLabel}>{tag.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RadarChart({ tags }: { tags: ReportProfile['tags'] }) {
  const size = 116;
  const center = size / 2;
  const maxRadius = 47;
  const points = tags.map((tag, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / tags.length;
    const radius = maxRadius * (tag.value / 100);
    return {
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    };
  });
  const polygon = points.map(point => `${point.x},${point.y}`).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={styles.radarSvg} aria-label="知识点雷达图">
      {[1, 0.66, 0.33].map(ring => (
        <circle
          key={ring}
          cx={center}
          cy={center}
          r={maxRadius * ring}
          fill={ring === 1 ? '#F0FDF4' : 'none'}
          stroke="#BBF7D0"
          strokeWidth="1"
        />
      ))}
      {tags.map((tag, index) => {
        const angle = -Math.PI / 2 + (index * Math.PI * 2) / tags.length;
        const x = center + Math.cos(angle) * maxRadius;
        const y = center + Math.sin(angle) * maxRadius;
        return <line key={tag.label} x1={center} y1={center} x2={x} y2={y} stroke="#86EFAC" strokeWidth="1" />;
      })}
      <polygon points={polygon} fill="rgba(34, 197, 94, 0.34)" stroke="#16A34A" strokeWidth="2" />
      {points.map((point, index) => (
        <circle key={tags[index].label} cx={point.x} cy={point.y} r="3" fill="#16A34A" />
      ))}
    </svg>
  );
}

function DynamicModule({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div style={styles.detailModule}>
      <div style={styles.moduleHeader}>
        <span style={styles.moduleIcon}>{icon}</span>
        <span style={styles.moduleTitle}>{title}</span>
      </div>
      {children}
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
  caseSwitch: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  caseBtn: {
    height: 28,
    padding: '0 10px',
    borderRadius: 999,
    border: '1px solid #D1FAE5',
    background: '#F8FAFC',
    color: '#64748B',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
  },
  caseBtnActive: {
    background: '#22C55E',
    borderColor: '#22C55E',
    color: '#FFFFFF',
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
    opacity: 0.86,
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
  footerActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    height: 36,
    minWidth: 168,
    padding: '0 20px',
    borderRadius: 8,
    border: 'none',
    background: 'var(--agent-gradient)',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 800,
  },
  secondaryBtn: {
    height: 36,
    padding: '0 16px',
    borderRadius: 8,
    border: '1px solid #CBD5E1',
    background: '#FFFFFF',
    color: '#475569',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
  },
  readOnlyHint: {
    fontSize: 13,
    color: '#64748B',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    padding: '8px 12px',
    lineHeight: 1.4,
  },
  previewContent: {
    padding: '16px 20px 22px',
    overflowY: 'auto',
    background: '#F8FAFC',
  },
  previewTopBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid #D1FAE5',
    background: '#FFFFFF',
    boxShadow: '0 10px 26px rgba(15, 23, 42, 0.05)',
    marginBottom: 12,
  },
  previewInfo: {
    minWidth: 0,
    flex: 1,
  },
  previewInfoTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: 850,
    marginBottom: 4,
  },
  previewInfoDesc: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 1.5,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  adjustBtn: {
    height: 34,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '0 14px',
    borderRadius: 8,
    border: '1.5px solid var(--agent-primary)',
    background: 'var(--agent-soft)',
    color: 'var(--agent-primary-text)',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    flexShrink: 0,
  },
  reportCanvas: {
    width: 'min(460px, 100%)',
    margin: '0 auto',
    borderRadius: 18,
    background: '#FFFFFF',
    border: '1px solid #D9F99D',
    boxShadow: '0 16px 48px rgba(22, 163, 74, 0.15)',
    overflow: 'hidden',
  },
  reportHeader: {
    position: 'relative',
    overflow: 'hidden',
    padding: 0,
    background: 'linear-gradient(135deg, #22C55E 0%, #84CC16 52%, #38BDF8 100%)',
    color: '#FFFFFF',
  },
  headerGlow: {
    position: 'absolute',
    right: -26,
    top: -34,
    width: 150,
    height: 150,
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.28)',
  },
  reportHeaderMain: {
    position: 'relative',
    padding: 18,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  reportKicker: {
    fontSize: 12,
    opacity: 0.92,
    fontWeight: 800,
  },
  reportTitle: {
    marginTop: 6,
    fontSize: 19,
    fontWeight: 900,
    lineHeight: 1.25,
  },
  reportMeta: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.9,
    fontWeight: 700,
  },
  reportBadge: {
    flexShrink: 0,
    padding: '6px 10px',
    borderRadius: 999,
    background: 'rgba(255, 255, 255, 0.24)',
    border: '1px solid rgba(255, 255, 255, 0.42)',
    boxShadow: '0 6px 18px rgba(21, 128, 61, 0.16)',
    fontSize: 12,
    fontWeight: 900,
  },
  reportBody: {
    padding: '16px 14px 18px',
    background: '#F7FEE7',
  },
  reportSection: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: '#14532D',
    marginBottom: 10,
  },
  overviewCard: {
    padding: 12,
    borderRadius: 12,
    background: '#FFFFFF',
    border: '1px solid #DCFCE7',
    color: '#334155',
    fontSize: 13,
    lineHeight: 1.6,
  },
  moduleStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  detailModule: {
    padding: 12,
    borderRadius: 12,
    background: '#FFFFFF',
    border: '1px solid #DCFCE7',
    boxShadow: '0 6px 18px rgba(22, 163, 74, 0.06)',
  },
  moduleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  moduleIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    background: '#DCFCE7',
    color: '#15803D',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  moduleTitle: {
    fontSize: 13,
    fontWeight: 900,
    color: '#0F172A',
  },
  metricList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 8,
  },
  metricTile: {
    minHeight: 70,
    borderRadius: 12,
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    padding: '10px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 5,
  },
  metricIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    background: '#ECFDF5',
    color: '#15803D',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 900,
    color: '#0F172A',
    lineHeight: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: 700,
  },
  emptyMetricHint: {
    padding: 12,
    borderRadius: 10,
    background: '#F8FAFC',
    border: '1px dashed #CBD5E1',
    color: '#64748B',
    fontSize: 12,
    lineHeight: 1.5,
  },
  tableWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    border: '1px solid #E2E8F0',
  },
  tableHeader: {
    display: 'grid',
    gridAutoFlow: 'column',
    gridAutoColumns: '1fr',
    background: '#F8FAFC',
    color: '#0F172A',
    fontSize: 13,
    fontWeight: 900,
    textAlign: 'center',
    borderBottom: '1px solid #E2E8F0',
  },
  tableHeaderOrange: {
    background: '#FB8500',
    color: '#FFFFFF',
  },
  tableRow: {
    display: 'grid',
    gridAutoFlow: 'column',
    gridAutoColumns: '1fr',
    background: '#FFFFFF',
    color: '#111827',
    fontSize: 13,
    fontWeight: 800,
    textAlign: 'center',
  },
  answerRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  answerRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 8,
    alignItems: 'center',
    padding: '8px 0',
    borderTop: '1px solid #F1F5F9',
  },
  answerName: {
    minWidth: 0,
    fontSize: 12,
    color: '#334155',
    fontWeight: 700,
  },
  answerCorrect: {
    fontSize: 12,
    color: '#047857',
    fontWeight: 800,
  },
  answerMistake: {
    fontSize: 12,
    color: '#C2410C',
    fontWeight: 800,
  },
  wordList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordPill: {
    padding: '6px 10px',
    borderRadius: 999,
    background: '#FFF7ED',
    border: '1px solid #FED7AA',
    color: '#C2410C',
    fontSize: 12,
    fontWeight: 900,
  },
  moduleDesc: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 1.55,
  },
  levelList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  levelRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 10,
    alignItems: 'center',
    padding: '8px 10px',
    borderRadius: 10,
    background: '#F8FAFC',
  },
  levelText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  levelName: {
    fontSize: 12,
    fontWeight: 900,
    color: '#0F172A',
  },
  levelDesc: {
    fontSize: 11,
    color: '#64748B',
  },
  levelValue: {
    fontSize: 13,
    fontWeight: 900,
    color: '#0F766E',
  },
  achievement: {
    padding: 10,
    borderRadius: 10,
    background: '#FEFCE8',
    color: '#854D0E',
    border: '1px solid #FEF08A',
    fontSize: 12,
    lineHeight: 1.55,
    fontWeight: 700,
  },
  oralGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 8,
    color: '#334155',
    fontSize: 12,
    fontWeight: 800,
  },
  radarPending: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    border: '1px dashed #86EFAC',
    background: '#F0FDF4',
    cursor: 'default',
  },
  radarPendingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: '#FFFFFF',
    color: '#15803D',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(21, 128, 61, 0.08)',
  },
  radarPendingText: {
    minWidth: 0,
  },
  radarPendingTitle: {
    fontSize: 13,
    fontWeight: 900,
    color: '#0F172A',
    marginBottom: 5,
  },
  radarPendingDesc: {
    fontSize: 12,
    lineHeight: 1.55,
    color: '#64748B',
  },
  radarReady: {
    display: 'grid',
    gridTemplateColumns: '132px 1fr',
    gap: 12,
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    background: '#FFFFFF',
    border: '1px solid #BBF7D0',
  },
  radarSvg: {
    width: 116,
    height: 116,
    display: 'block',
  },
  knowledgeBarChart: {
    gridColumn: '1 / -1',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    minWidth: 0,
  },
  knowledgeBarPlot: {
    position: 'relative',
    width: '100%',
    height: 150,
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    alignItems: 'end',
    gap: 22,
    padding: '18px 18px 10px',
    borderRadius: 14,
    background: '#FFFFFF',
    border: '1px solid #DCFCE7',
  },
  knowledgeBarColumn: {
    position: 'relative',
    height: '100%',
    display: 'grid',
    gridTemplateRows: '18px 1fr auto',
    justifyItems: 'center',
    alignItems: 'end',
    gap: 7,
    zIndex: 1,
  },
  knowledgeBarValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: 900,
    lineHeight: 1,
  },
  knowledgeBarFill: {
    width: 'min(56px, 70%)',
    borderRadius: '12px 12px 8px 8px',
    background: 'linear-gradient(180deg, #38BDF8 0%, #22C55E 52%, #84CC16 100%)',
    boxShadow: '0 8px 16px rgba(34, 197, 94, 0.24)',
  },
  knowledgeBarLabel: {
    maxWidth: '100%',
    color: '#14532D',
    fontSize: 12,
    fontWeight: 900,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  radarLegend: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  radarLegendRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    fontSize: 12,
    color: '#334155',
    fontWeight: 800,
  },
  tagToggleArea: {
    minHeight: 30,
    marginBottom: 10,
  },
  tagList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    padding: '5px 9px',
    borderRadius: 999,
    background: '#E0F2FE',
    border: '1px solid #BAE6FD',
    color: '#0369A1',
    fontSize: 12,
    fontWeight: 800,
  },
  tagPending: {
    padding: '8px 10px',
    borderRadius: 10,
    border: '1px dashed #CBD5E1',
    background: '#FFFFFF',
    color: '#64748B',
    fontSize: 12,
    lineHeight: 1.45,
  },
  suggestion: {
    padding: 12,
    borderRadius: 10,
    background: '#FFFFFF',
    border: '1px solid #DCFCE7',
    color: '#334155',
    fontSize: 13,
    lineHeight: 1.6,
  },
  overallSection: {
    marginBottom: 0,
  },
};
