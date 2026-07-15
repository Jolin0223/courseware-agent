import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BarChart3,
  BookOpenCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Layers3,
  RefreshCw,
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
  onConfirm?: (items: LearningDataRecoveryItem[]) => void;
}

type ReportCaseKey = 'fruit' | 'bowen' | 'bilingual' | 'brain';
type MetricIconKey = 'score' | 'accuracy' | 'time' | 'reward' | 'correct' | 'complete' | 'level';

interface ReportProfile {
  key: ReportCaseKey;
  title: string;
  drawerTitle: string;
  interactionTitle: string;
  interactionTime: string;
  metricRows: Array<{ id: string; label: string; value: string; icon: MetricIconKey }>;
}

const getReportProfile = (gameName: string, caseKey: ReportCaseKey): ReportProfile => {
  if (caseKey === 'bowen') {
    return {
      key: 'bowen',
      title: '近义词大挑战',
      drawerTitle: '近义词大挑战',
      interactionTitle: '近义词辨析闯关',
      interactionTime: '用时2分16秒',
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
      drawerTitle: '单词神枪手',
      interactionTitle: '单词神枪手',
      interactionTime: '用时1分42秒',
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
      drawerTitle: '比绳子长短',
      interactionTitle: '比一比绳子长短',
      interactionTime: '用时3分42秒',
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
    drawerTitle: '认识颜色',
    interactionTitle: '趣味互动',
    interactionTime: '用时2分18秒',
    metricRows: [
      { id: 'final-score', label: '总得分', value: '86分', icon: 'score' },
      { id: 'accuracy', label: '正确率', value: '84%', icon: 'accuracy' },
      { id: 'total-time', label: '总用时', value: '4分12秒', icon: 'time' },
      { id: 'correct-count', label: '答对题数', value: '21/25', icon: 'correct' },
      { id: 'completion-count', label: '完成次数', value: '1次', icon: 'complete' },
      { id: 'reward-count', label: '奖励数量', value: '8颗星', icon: 'reward' },
      { id: 'passed-levels', label: '通关关卡数', value: '3关', icon: 'level' },
      { id: 'max-streak', label: '最高连对', value: '6题', icon: 'correct' },
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
    /* eslint-disable react-hooks/set-state-in-effect -- Opening the modal must reset the user flow to the current courseware data. */
    setViewMode('preview');
    setItems(getRecoveryItemsForCourseware(coursewareTitle, initialItems));
    setReportCase(getCaseFromTitle(coursewareTitle));
    setShowCaseSwitch(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [coursewareTitle, initialItems, isOpen]);

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
              <div style={styles.title}>{viewMode === 'preview' ? '预览报告展示' : canModifyRecovery ? '修改报告数据' : '当前为旧版'}</div>
              {viewMode === 'preview' && (
                <div style={styles.subTitle}>学生端/家长端报告样式预览，正式报告将使用真实作答结果生成。</div>
              )}
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
                ? '当前互动游戏已支持学情数据回收，老师可修改需要进入报告展示的数据。'
                : '当前为旧版，请在最新版上查看和操作。'}
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
                    {isSubmitting ? '保存中...' : '确定'}
                  </button>
                ) : (
                  <div style={styles.readOnlyHint}>当前为旧版，请在最新版上查看和操作</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.previewContent}>
            <StudentReportPreview
              key={`${coursewareTitle || 'courseware'}-${reportCase}-${showCaseSwitch ? 'simple' : 'default'}`}
              coursewareTitle={coursewareTitle}
              selectedItems={selectedItems}
              reportCase={reportCase}
              isSimpleDemo={showCaseSwitch}
            />
            <div
              style={styles.previewBottomBar}
              onDoubleClick={() => {
                setShowCaseSwitch(prev => {
                  if (!prev) setReportCase('bowen');
                  if (prev) setReportCase(getCaseFromTitle(coursewareTitle));
                  return !prev;
                });
              }}
            >
              <div style={styles.previewInfo}>
                <div style={styles.previewInfoTitle}>当前报告展示</div>
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
  const [drawerOpen, setDrawerOpen] = useState(true);
  const profile = getReportProfile(coursewareTitle || '水果单词互动乐园', isSimpleDemo ? reportCase : getCaseFromTitle(coursewareTitle));
  const selectedIds = new Set(selectedItems.map(item => item.id));
  const visibleMetrics = profile.metricRows.filter(metric => selectedIds.has(metric.id));
  const metricViewportStyle = {
    ...styles.metricViewport,
    ...(visibleMetrics.length <= 4 ? styles.metricViewportDefault : styles.metricViewportScrollable),
  };
  const metricListStyle = {
    ...styles.drawerMetricList,
    ...(visibleMetrics.length <= 2 ? styles.drawerMetricListSingleColumn : {}),
  };
  return (
    <div style={styles.phonePreview}>
      <div style={styles.phoneScreenshot} />
      {drawerOpen && <div style={styles.drawerOverlay} />}
      {drawerOpen ? <div style={styles.reportDrawer}>
        <div style={styles.drawerHeader}>
          <div style={styles.drawerTitle}>{profile.drawerTitle}</div>
          <button type="button" style={styles.collapseButton} onClick={() => setDrawerOpen(false)}>
            收起 <ChevronUp size={14} />
          </button>
        </div>
        <div style={styles.reportDetailPanel}>
          <div style={styles.detailTitle}>
            <img
              src={reportDetailTitleUrl}
              alt="互动详情"
              style={styles.drawerTitleImage}
            />
          </div>
          <div style={styles.drawerSummary}>
            {visibleMetrics.length ? (
              <>
                本次记录了 <span style={styles.drawerSummaryCount}>{visibleMetrics.length}</span> 项学习表现
              </>
            ) : (
              '当前暂无可展示的学习表现'
            )}
          </div>
          <div className="learning-report-metric-scroll" style={metricViewportStyle}>
            {visibleMetrics.length ? (
              <div style={metricListStyle}>
                {visibleMetrics.map((metric, index) => {
                  const Icon = iconMap[metric.icon];
                  const accent = metricAccents[index % metricAccents.length];
                  return (
                    <div key={metric.id} style={{ ...styles.drawerMetricTile, borderColor: accent.border }}>
                      <span style={{ ...styles.drawerMetricIcon, background: accent.iconBg, color: accent.icon }}>
                        <Icon size={18} />
                      </span>
                      <span style={styles.drawerMetricLabel}>{metric.label}</span>
                      <span style={styles.drawerMetricValue}>{metric.value}</span>
                      <span style={{ ...styles.metricStar, background: accent.corner }} aria-hidden="true" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={styles.emptyMetricHint}>当前未选择可展示的学习表现指标</div>
            )}
          </div>
          <div style={styles.drawerFooterText}>
            <img
              src={reportFooterDecorationUrl}
              alt="每一次互动，都是一次小小的进步记录。"
              style={styles.footerDecorationImage}
            />
          </div>
        </div>
        <img src={reportGrassLeftUrl} alt="" aria-hidden="true" style={styles.grassLeft} />
        <img src={reportGrassRightUrl} alt="" aria-hidden="true" style={styles.grassRight} />
      </div> : (
        <button type="button" style={styles.openReportButton} onClick={() => setDrawerOpen(true)}>
          互动详情 <ChevronDown size={14} />
        </button>
      )}
    </div>
  );
}

const metricAccents = [
  { border: '#D1FAE5', iconBg: '#DCFCE7', icon: '#16A34A', corner: '#D9FBE7' },
  { border: '#DBEAFE', iconBg: '#DBEAFE', icon: '#2563EB', corner: '#DCEBFF' },
  { border: '#FED7AA', iconBg: '#FFEDD5', icon: '#F97316', corner: '#FFE4C2' },
  { border: '#FBCFE8', iconBg: '#FCE7F3', icon: '#DB2777', corner: '#FCE0F0' },
  { border: '#CCFBF1', iconBg: '#CCFBF1', icon: '#0F766E', corner: '#D0FAF2' },
  { border: '#DDD6FE', iconBg: '#EDE9FE', icon: '#7C3AED', corner: '#E7DEFF' },
];

const reportFooterDecorationUrl = '/images/report-footer-decoration-cropped.png';
const reportDetailTitleUrl = '/images/report-detail-title-cropped.png';
const reportGrassLeftUrl = '/images/report-grass-left.png';
const reportGrassRightUrl = '/images/report-grass-right.png';

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
    width: 'min(900px, 96vw)',
    maxHeight: '96vh',
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
    lineHeight: 1.45,
    maxWidth: 620,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    borderColor: '#E2E8F0',
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
    borderColor: '#D1FAE5',
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
    borderColor: '#E2E8F0',
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
    borderColor: '#CBD5E1',
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
    minWidth: 112,
    padding: '0 18px',
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
    borderColor: '#CBD5E1',
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
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: '8px 12px',
    lineHeight: 1.4,
  },
  previewContent: {
    position: 'relative',
    padding: '12px 20px 16px',
    overflowY: 'auto',
    background: '#F8FAFC',
  },
  previewBottomBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid #D1FAE5',
    borderColor: '#D1FAE5',
    background: '#FFFFFF',
    boxShadow: '0 10px 26px rgba(15, 23, 42, 0.05)',
    margin: '14px auto 0',
    maxWidth: 760,
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
  phonePreview: {
    position: 'relative',
    width: 'min(390px, 100%)',
    height: 750,
    margin: '0 auto',
    borderRadius: 18,
    background: '#F8FAFC',
    border: '1px solid #C7F9E8',
    boxShadow: '0 18px 50px rgba(14, 116, 144, 0.16)',
    overflow: 'hidden',
  },
  phoneScreenshot: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'url("/images/single-lesson-learning-report-copy.webp")',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'top center',
    backgroundColor: '#FFFFFF',
  },
  drawerOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.42)',
    zIndex: 3,
  },
  reportDrawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
    height: 560,
    maxHeight: '96%',
    padding: '20px 10px 8px',
    borderRadius: '18px 18px 0 0',
    border: 'none',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 -16px 38px rgba(15, 23, 42, 0.16)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 36,
    marginBottom: 10,
    padding: '0 12px',
  },
  drawerTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: 950,
    lineHeight: 1.2,
  },
  reportDetailPanel: {
    position: 'relative',
    zIndex: 2,
    flex: 1,
    minHeight: 0,
    padding: '24px 18px 10px',
    borderRadius: 16,
    border: '1px solid #A7F3D0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  detailTitle: {
    position: 'relative',
    zIndex: 2,
    height: 40,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 10,
  },
  drawerTitleImage: {
    width: 135,
    height: 'auto',
    objectFit: 'contain',
    display: 'block',
  },
  collapseButton: {
    height: 32,
    padding: '0 12px',
    borderRadius: 999,
    border: 'none',
    background: 'rgba(15, 23, 42, 0.68)',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 900,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  drawerSummary: {
    position: 'relative',
    zIndex: 2,
    alignSelf: 'center',
    padding: '8px 24px',
    borderRadius: 999,
    background: '#F1FDF8',
    color: '#334155',
    fontSize: 14,
    lineHeight: 1.4,
    fontWeight: 900,
    marginBottom: 14,
    whiteSpace: 'nowrap',
    boxShadow: 'inset 0 0 0 1px rgba(209, 250, 229, 0.72)',
    flexShrink: 0,
  },
  drawerSummaryCount: {
    color: '#16A34A',
    fontSize: 17,
    fontWeight: 950,
    padding: '0 2px',
  },
  drawerMetricList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
  },
  drawerMetricListSingleColumn: {
    gridTemplateColumns: '1fr',
  },
  metricViewport: {
    position: 'relative',
    zIndex: 2,
    minHeight: 0,
    paddingRight: 2,
    flexShrink: 0,
  },
  metricViewportDefault: {
    overflowY: 'hidden',
  },
  metricViewportScrollable: {
    maxHeight: 244,
    overflowY: 'auto',
  },
  drawerMetricTile: {
    position: 'relative',
    minHeight: 104,
    borderRadius: 14,
    background: 'rgba(255, 255, 255, 0.94)',
    padding: '14px 12px 42px',
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.045)',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
  },
  drawerMetricIcon: {
    position: 'absolute',
    left: 12,
    top: 13,
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: '#ECFDF5',
    color: '#16A34A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerMetricLabel: {
    display: 'block',
    fontSize: 13,
    color: '#64748B',
    fontWeight: 800,
    minHeight: 34,
    paddingLeft: 44,
    lineHeight: '34px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  drawerMetricValue: {
    display: 'block',
    position: 'absolute',
    left: 12,
    right: 34,
    bottom: 17,
    color: '#1F2937',
    fontSize: 23,
    fontWeight: 950,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  metricStar: {
    position: 'absolute',
    right: -9,
    bottom: -9,
    width: 34,
    height: 34,
    borderRadius: '50%',
    opacity: 0.96,
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
  drawerFooterText: {
    position: 'relative',
    zIndex: 2,
    flexShrink: 0,
    margin: 'auto 8px 4px',
    height: 86,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerDecorationImage: {
    width: '90%',
    height: '90%',
    objectFit: 'contain',
    display: 'block',
  },
  grassLeft: {
    position: 'absolute',
    left: -14,
    bottom: -2,
    width: 112,
    height: 'auto',
    zIndex: 4,
    pointerEvents: 'none',
  },
  grassRight: {
    position: 'absolute',
    right: -14,
    bottom: -2,
    width: 126,
    height: 'auto',
    zIndex: 4,
    pointerEvents: 'none',
  },
  openReportButton: {
    position: 'absolute',
    left: '50%',
    top: 625,
    transform: 'translateX(-50%)',
    zIndex: 4,
    height: 32,
    padding: '0 14px',
    borderRadius: 999,
    border: 'none',
    background: 'rgba(15, 23, 42, 0.68)',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 900,
    boxShadow: '0 8px 18px rgba(15, 23, 42, 0.18)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
};
