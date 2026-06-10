import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Award,
  BarChart3,
  BookOpenCheck,
  Check,
  Clock3,
  Eye,
  FileText,
  Layers3,
  Mic2,
  RefreshCw,
  Tag,
  Target,
  X,
} from 'lucide-react';
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

type ReportCaseKey = 'animal' | 'bilingual' | 'level';

interface AnswerReviewItem {
  question: string;
  result: string;
  isCorrect: boolean;
}

interface TableModule {
  title: string;
  headers: string[];
  rows: string[][];
  accent?: 'orange' | 'green';
}

interface ReportProfile {
  key: ReportCaseKey;
  title: string;
  student: string;
  overview: string;
  tags: string[];
  suggestion: string;
  metricRows: Array<{ label: string; value: string; icon: 'score' | 'accuracy' | 'time' | 'reward' | 'wrong' }>;
  answerReview?: AnswerReviewItem[];
  words?: string[];
  levels?: Array<{ level: string; desc: string; value: string }>;
  reward?: string;
  oral?: Array<{ label: string; value: string }>;
  tables?: TableModule[];
}

const getReportProfile = (gameName: string, caseKey: ReportCaseKey): ReportProfile => {
  if (caseKey === 'bilingual') {
    return {
      key: 'bilingual',
      title: '双语课堂闯关',
      student: '一年级二班 · 王小雨',
      overview: '汇总孩子在「双语课堂闯关」互动游戏中的表现，覆盖 1 个班级、3 个任务环节和 5 个错题关卡。',
      tags: ['双语理解', '课堂反应', '错题巩固'],
      suggestion: '孩子整体完成度较高，正确率达到 90%。建议继续复盘 5 个错题关卡，并在双语听辨环节增加一次巩固练习。',
      metricRows: [
        { label: '正确率', value: '90%', icon: 'accuracy' },
        { label: '耗时', value: '25s', icon: 'time' },
        { label: '错题关卡', value: '5', icon: 'wrong' },
      ],
      tables: [
        {
          title: '班级表现',
          headers: ['班级', '正确率', '耗时', '错题关卡'],
          rows: [['一年级二班', '90%', '25s', '5']],
          accent: 'orange',
        },
        {
          title: '题目复盘',
          headers: ['得分', '正确率', '用时(s)', '详情'],
          rows: [['3 / 3', '100.0%', '17s', '✅✅✅']],
        },
      ],
      levels: [
        { level: '任务 1', desc: '双语词义匹配', value: '100%' },
        { level: '任务 2', desc: '听音判断', value: '90%' },
        { level: '任务 3', desc: '错题复盘', value: '80%' },
      ],
    };
  }

  if (caseKey === 'level') {
    return {
      key: 'level',
      title: '颜色单词闯关',
      student: '学生：王小雨 · 本次练习',
      overview: '汇总孩子在「颜色单词闯关」互动游戏中的表现，覆盖 4 个关卡、10 道图词匹配和听音选择题。',
      tags: ['颜色识别', '听音辨词', '图词匹配'],
      suggestion: '孩子在基础颜色识别上表现稳定，综合匹配关卡仍有提升空间。建议优先复习 orange、purple，并再次完成第 3 关。',
      metricRows: [
        { label: '总得分', value: '88分', icon: 'score' },
        { label: '正确率', value: '82%', icon: 'accuracy' },
        { label: '答题耗时', value: '4分05秒', icon: 'time' },
      ],
      answerReview: [
        { question: '第 2 题 · 图片识词', result: 'red 回答正确', isCorrect: true },
        { question: '第 6 题 · 听音选颜色', result: 'orange 选成 purple', isCorrect: false },
        { question: '第 9 题 · 图词匹配', result: 'green 回答正确', isCorrect: true },
      ],
      words: ['orange', 'purple'],
      levels: [
        { level: '关卡 1', desc: '基础颜色识别', value: '100%' },
        { level: '关卡 2', desc: '听音辨词', value: '80%' },
        { level: '关卡 3', desc: '综合匹配', value: '70%' },
        { level: '关卡 4', desc: '错题复盘', value: '75%' },
      ],
      reward: '本次获得 3 枚星星，完成 4 个关卡中的 3 个。',
    };
  }

  const title = gameName || '动物单词玩一玩';
  return {
    key: 'animal',
    title,
    student: '学生：王小雨 · 本次练习',
    overview: `汇总孩子在「${title}」互动游戏中的表现，覆盖 3 个关卡、12 道动物单词选择题。`,
    tags: ['动物识别', '听音辨词', '图词匹配'],
    suggestion: '孩子已掌握基础动物识别，在听音辨词环节仍有少量混淆。建议优先复习 rabbit、dog、cat，并再次完成听音匹配练习。',
    metricRows: [
      { label: '总得分', value: '92分', icon: 'score' },
      { label: '正确率', value: '86%', icon: 'accuracy' },
      { label: '答题耗时', value: '3分18秒', icon: 'time' },
      { label: '奖励记录', value: '5个', icon: 'reward' },
    ],
    answerReview: [
      { question: '第 3 题 · 听音选动物', result: 'rabbit 选成 dog', isCorrect: false },
      { question: '第 7 题 · 图片识词', result: 'cat 回答正确', isCorrect: true },
      { question: '第 10 题 · 图词匹配', result: 'dog 回答正确', isCorrect: true },
    ],
    words: ['cat', 'dog', 'rabbit'],
    levels: [
      { level: '关卡 1', desc: '基础动物识别', value: '100%' },
      { level: '关卡 2', desc: '听音辨词', value: '80%' },
      { level: '关卡 3', desc: '综合匹配', value: '75%' },
    ],
    reward: '本次收集 5 个装备，连续完成 3 个关卡。',
    oral: [
      { label: '发音准确度', value: '88%' },
      { label: '流利度', value: '良好' },
    ],
  };
};

const iconMap = {
  score: Target,
  accuracy: BookOpenCheck,
  time: Clock3,
  reward: Award,
  wrong: FileText,
};

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
  const [reportCase, setReportCase] = useState<ReportCaseKey>('animal');
  const [showCaseSwitch, setShowCaseSwitch] = useState(false);
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

        <div style={styles.tabs} onDoubleClick={() => setShowCaseSwitch(prev => !prev)}>
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
            预览学情报告
          </button>
          {showCaseSwitch && activeTab === 'preview' && (
            <div style={styles.caseSwitch}>
              {[
                ['animal', '英语'],
                ['bilingual', '双语'],
                ['level', '闯关'],
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
                {isSubmitting ? '生成中...' : '确定并重新生成课件'}
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.previewContent}>
            <StudentReportPreview
              coursewareTitle={coursewareTitle}
              selectedItems={selectedItems}
              reportCase={reportCase}
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
}: {
  coursewareTitle?: string;
  selectedItems: LearningDataRecoveryItem[];
  reportCase: ReportCaseKey;
}) {
  const [showPublishedRadar, setShowPublishedRadar] = useState(false);
  const [showKnowledgeTags, setShowKnowledgeTags] = useState(false);
  const profile = getReportProfile(coursewareTitle || '动物单词玩一玩', reportCase);
  const names = selectedItems.map(item => item.label);
  const has = (label: string) => names.includes(label);
  const hasAny = (...labels: string[]) => labels.some(label => has(label));
  const showMetrics = hasAny('总得分', '最终得分', '正确率', '答对题数', '答题耗时', '总用时', '奖励记录', '收集到的装备数量');
  const showAnswerReview = hasAny('答题详情', '题目复盘');
  const showWrongWords = has('错词记录');
  const showLevel = has('关卡表现');
  const showReward = hasAny('奖励记录', '收集到的装备数量');
  const showOral = has('口语表现');

  return (
    <div style={styles.reportCanvas}>
      <div style={styles.reportHeader}>
        <div style={styles.headerGlow} />
        <div style={styles.reportHeaderMain}>
          <div>
            <div style={styles.reportKicker}>学生个性化学情报告</div>
            <div style={styles.reportTitle}>{profile.title}</div>
            <div style={styles.reportMeta}>{profile.student}</div>
          </div>
          <div style={styles.reportBadge}>已完成</div>
        </div>
      </div>

      <div style={styles.reportBody}>
        <section style={styles.reportSection}>
          <div style={styles.sectionTitle}>学习概览</div>
          <div style={styles.overviewCard}>{profile.overview}</div>
        </section>

        <section style={styles.reportSection}>
          <div style={styles.sectionTitle}>学习表现</div>
          <div style={styles.moduleStack}>
            {showMetrics && (
              <DynamicModule icon={<Target size={15} />} title="本次表现">
                <div style={styles.metricList}>
                  {profile.metricRows.map(metric => {
                    const Icon = iconMap[metric.icon];
                    return (
                      <div key={metric.label} style={styles.metricTile}>
                        <span style={styles.metricIcon}><Icon size={15} /></span>
                        <span style={styles.metricValue}>{metric.value}</span>
                        <span style={styles.metricLabel}>{metric.label}</span>
                      </div>
                    );
                  })}
                </div>
              </DynamicModule>
            )}

            {profile.tables?.map(table => (
              <DynamicModule key={table.title} icon={<FileText size={15} />} title={table.title}>
                <div style={styles.tableWrap}>
                  <div style={{ ...styles.tableHeader, ...(table.accent === 'orange' ? styles.tableHeaderOrange : {}) }}>
                    {table.headers.map(header => <span key={header}>{header}</span>)}
                  </div>
                  {table.rows.map((row, rowIndex) => (
                    <div key={`${table.title}-${rowIndex}`} style={styles.tableRow}>
                      {row.map((cell, cellIndex) => <span key={`${cell}-${cellIndex}`}>{cell}</span>)}
                    </div>
                  ))}
                </div>
              </DynamicModule>
            ))}

            {showAnswerReview && profile.answerReview && (
              <DynamicModule icon={<FileText size={15} />} title="答题详情">
                <div style={styles.answerRows}>
                  {profile.answerReview.map(item => (
                    <div key={item.question} style={styles.answerRow}>
                      <span style={styles.answerName}>{item.question}</span>
                      <span style={item.isCorrect ? styles.answerCorrect : styles.answerMistake}>{item.result}</span>
                    </div>
                  ))}
                </div>
              </DynamicModule>
            )}

            {showWrongWords && profile.words?.length ? (
              <DynamicModule icon={<BookOpenCheck size={15} />} title="错词记录">
                <div style={styles.wordList}>
                  {profile.words.map(word => <span key={word} style={styles.wordPill}>{word}</span>)}
                </div>
                <div style={styles.moduleDesc}>建议课后优先复习图片识词和听音辨词。</div>
              </DynamicModule>
            ) : null}

            {showLevel && profile.levels && (
              <DynamicModule icon={<Layers3 size={15} />} title="关卡表现">
                <div style={styles.levelList}>
                  {profile.levels.map(item => (
                    <div key={item.level} style={styles.levelRow}>
                      <div style={styles.levelText}>
                        <span style={styles.levelName}>{item.level}</span>
                        <span style={styles.levelDesc}>{item.desc}</span>
                      </div>
                      <span style={styles.levelValue}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </DynamicModule>
            )}

            {showReward && profile.reward && (
              <DynamicModule icon={<Award size={15} />} title="奖励成就">
                <div style={styles.achievement}>{profile.reward}</div>
              </DynamicModule>
            )}

            {showOral && profile.oral && (
              <DynamicModule icon={<Mic2 size={15} />} title="口语表现">
                <div style={styles.oralGrid}>
                  {profile.oral.map(item => <span key={item.label}>{item.label}：{item.value}</span>)}
                </div>
              </DynamicModule>
            )}
          </div>
        </section>

        <section style={styles.reportSection}>
          <div style={styles.sectionTitle}>知识点雷达图</div>
          <div
            style={showPublishedRadar ? styles.radarReady : styles.radarPending}
            onDoubleClick={() => setShowPublishedRadar(prev => !prev)}
          >
            {showPublishedRadar ? (
              <>
                <div style={styles.radarChart}>
                  <div style={{ ...styles.radarAxis, transform: 'rotate(0deg)' }} />
                  <div style={{ ...styles.radarAxis, transform: 'rotate(72deg)' }} />
                  <div style={{ ...styles.radarAxis, transform: 'rotate(144deg)' }} />
                  <div style={styles.radarShape} />
                </div>
                <div style={styles.radarLegend}>
                  {profile.tags.map((tag, index) => (
                    <div key={tag} style={styles.radarLegendRow}>
                      <span>{tag}</span>
                      <strong>{[92, 86, 78][index] || 80}%</strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div style={styles.radarPendingIcon}><Tag size={18} /></div>
                <div style={styles.radarPendingText}>
                  <div style={styles.radarPendingTitle}>发布并完成知识点标签后生成真实雷达图</div>
                  <div style={styles.radarPendingDesc}>
                    预览态展示报告位置。正式报告会读取资源发布后绑定的集团知识点标签或校本标签，再结合学生作答数据生成各维度掌握度。
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <section style={{ ...styles.reportSection, ...styles.overallSection }}>
          <div style={styles.sectionTitle}>整体表现</div>
          <div style={styles.tagToggleArea} onDoubleClick={() => setShowKnowledgeTags(prev => !prev)}>
            {showKnowledgeTags ? (
              <div style={styles.tagList}>
                {profile.tags.map(tag => <span key={tag} style={styles.tag}>{tag}</span>)}
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
  tabs: {
    display: 'flex',
    alignItems: 'center',
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
  caseSwitch: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 6,
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
    minWidth: 168,
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
  radarChart: {
    width: 116,
    height: 116,
    borderRadius: '50%',
    border: '1px solid #BBF7D0',
    background: 'radial-gradient(circle, #FFFFFF 0 28%, #F7FEE7 29% 56%, #DCFCE7 57% 100%)',
    position: 'relative',
    overflow: 'hidden',
  },
  radarAxis: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: 1,
    height: '100%',
    background: '#86EFAC',
    transformOrigin: 'center',
  },
  radarShape: {
    position: 'absolute',
    left: 27,
    top: 19,
    width: 64,
    height: 74,
    background: 'rgba(34, 197, 94, 0.34)',
    border: '2px solid #16A34A',
    clipPath: 'polygon(50% 0%, 90% 36%, 74% 100%, 22% 82%, 8% 28%)',
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
