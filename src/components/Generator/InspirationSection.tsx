import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpenCheck,
  Brain,
  Calculator,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  PlayCircle,
  Puzzle,
  Sparkles,
  Shapes,
  Trophy,
  X,
} from 'lucide-react';
import animalsAdventureHTML from '../../assets/courseware/animals_adventure.html?raw';
import animalsPlayOnlyHTML from '../../assets/courseware/animals_play_only.html?raw';
import fruitGardenHTML from '../../assets/courseware/fruit_garden_adventure.html?raw';
import fruitReadAloudHTML from '../../assets/courseware/fruit_garden_read_aloud_only.html?raw';
import mathRacingDemoHTML from '../../assets/courseware/examples/math_racing_demo.html?raw';
import wisdomJumpPinyinDemoHTML from '../../assets/courseware/examples/wisdom_jump_pinyin_demo.html?raw';
import wordDisguiseDemoHTML from '../../assets/courseware/examples/word_disguise_demo.html?raw';
import {
  inspirationSeedData,
  type InspirationAgeBandId,
  type InspirationPlayway,
  type InspirationTabId,
} from '../../data/inspirationSeedData';

export interface GameplayInspiration {
  id: string;
  title: string;
  summary: string;
  subjects: string[];
  keywords: string[];
  ageRange: string;
  learningAction: string;
  interactionTags: string[];
  structure: string[];
  enhancements: string[];
  visual: string;
  promptEnhancement: string;
  sourceType: string;
  replaceableContent: string[];
  typeLabel: string;
}

interface InspirationSectionProps {
  selectedInspirationId?: string | null;
  onApplyInspiration?: (item: GameplayInspiration, sourceElement?: HTMLElement | null) => void;
}

const tabIcons: Record<InspirationTabId, React.ElementType> = {
  featured: Sparkles,
  action: Trophy,
  english: BookOpenCheck,
  junior_math: Calculator,
  logic: Brain,
  spatial: Shapes,
  puzzle: Puzzle,
};

const exampleHtmlById: Record<string, string> = {
  fruit_garden_full: fruitGardenHTML,
  fruit_read_aloud: fruitReadAloudHTML,
  animals_spelling: animalsAdventureHTML,
  animals_play_only: animalsPlayOnlyHTML,
  wisdom_jump_pinyin_demo: wisdomJumpPinyinDemoHTML,
  math_racing_demo: mathRacingDemoHTML,
  word_disguise_demo: wordDisguiseDemoHTML,
};

const exampleFallbackLabel: Record<string, string> = {
  fruit_garden_full: '英语图文互动示例',
  fruit_read_aloud: '听音跟读互动示例',
  animals_spelling: '单词拼写互动示例',
  animals_play_only: '闯关答题节奏示例',
  wisdom_jump_pinyin_demo: '拼音跳跃玩法示例',
  math_racing_demo: '口算赛车玩法示例',
  word_disguise_demo: '单词找物玩法示例',
};

const ageBandTabs: Array<{ id: InspirationAgeBandId; name: string; ageText: string }> = [
  { id: 'all', name: '全部年龄', ageText: '6-14岁' },
  ...inspirationSeedData.categories.ageBands,
];

const cardsPerPage = 8;

const featuredIds = new Set(
  inspirationSeedData.playways
    .slice()
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 16)
    .map(item => item.id),
);

const hasAgeOverlap = (playwayAgeText: string, bandId: InspirationAgeBandId) => {
  if (bandId === 'all') return true;
  const ageTexts: Record<Exclude<InspirationAgeBandId, 'all'>, string> = {
    age_4_6: '4-6岁',
    age_6_10: '6-10岁',
    age_10_14: '10-14岁',
  };
  return playwayAgeText === ageTexts[bandId];
};

const toGameplayInspiration = (playway: InspirationPlayway): GameplayInspiration => ({
  id: playway.id,
  title: playway.title,
  summary: playway.shortDesc,
  subjects: playway.subjectTags,
  keywords: playway.suitableFor,
  ageRange: playway.ageText,
  learningAction: playway.typeLabel,
  interactionTags: playway.cardTags,
  structure: playway.classFlow,
  enhancements: playway.replaceableContent,
  visual: playway.recommendedStyleIds.join('、') || 'AI 默认匹配',
  promptEnhancement: playway.templatePrompt || playway.promptSnippet,
  sourceType: playway.category,
  replaceableContent: playway.replaceableContent,
  typeLabel: playway.typeLabel,
});

export const buildStructuredInspirationPrompt = (item: GameplayInspiration, currentInput: string) => {
  const cleaned = currentInput
    .replace(/<已套用玩法>[\s\S]*?<\/已套用玩法>/g, '')
    .replace(/已套用「[^」]+」玩法[\s\S]*$/g, '')
    .replace(/^教学内容：/g, '')
    .trim();
  const content = cleaned;
  const replaceable = item.replaceableContent.length > 0
    ? item.replaceableContent.join('、')
    : '题目、选项、素材、反馈语';

  return `教学内容：${content}

<已套用玩法>
玩法名称：${item.title}
玩法类型：${item.typeLabel}
适用年龄：${item.ageRange}
适合内容：${item.keywords.join('、')}

课堂互动流程：
${item.structure.map((step, index) => `${index + 1}. ${step}`).join('\n')}

可替换内容：
${replaceable}

玩法要求：
${item.promptEnhancement}

本次生成要求：
1. 保留上方“教学内容”里的年级、学科、知识点或老师补充要求。
2. 只把互动玩法切换为「${item.title}」，不要丢失老师已经输入的内容。
3. 按该玩法生成可直接课堂使用的互动课件，包含明确题目、操作方式、正确反馈、错误提示和完成总结。
</已套用玩法>`;
};

export default function InspirationSection({
  selectedInspirationId,
  onApplyInspiration,
}: InspirationSectionProps) {
  const [activeTab, setActiveTab] = useState<InspirationTabId>('featured');
  const [activeAgeBand, setActiveAgeBand] = useState<InspirationAgeBandId>('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [examplePlaywayId, setExamplePlaywayId] = useState<string | null>(null);
  const lastActionKeyRef = useRef('');

  const primaryFilteredPlayways = useMemo(() => {
    const byTab = inspirationSeedData.playways.filter(item => (
      activeTab === 'featured' ? featuredIds.has(item.id) : item.category === activeTab
    ));
    return byTab
      .filter(item => hasAgeOverlap(item.ageText, activeAgeBand))
      .sort((a, b) => b.priority - a.priority);
  }, [activeAgeBand, activeTab]);

  const visiblePlayways = useMemo(() => (
    primaryFilteredPlayways
  ), [primaryFilteredPlayways]);

  const totalPages = Math.max(1, Math.ceil(visiblePlayways.length / cardsPerPage));
  const pagedPlayways = useMemo(() => {
    const safePageIndex = Math.min(pageIndex, totalPages - 1);
    const start = safePageIndex * cardsPerPage;
    return visiblePlayways.slice(start, start + cardsPerPage);
  }, [pageIndex, totalPages, visiblePlayways]);

  const examplePlayway = useMemo(
    () => inspirationSeedData.playways.find(item => item.id === examplePlaywayId) || null,
    [examplePlaywayId],
  );

  const example = examplePlayway
    ? inspirationSeedData.examples.find(item => item.id === examplePlayway.exampleId) || null
    : null;

  const handleTabChange = (tab: InspirationTabId) => {
    setActiveTab(tab);
    setPageIndex(0);
    setExamplePlaywayId(null);
  };

  const handleAgeBandChange = (ageBand: InspirationAgeBandId) => {
    setActiveAgeBand(ageBand);
    setPageIndex(0);
    setExamplePlaywayId(null);
  };

  const handleApply = (playway: InspirationPlayway, sourceElement?: HTMLElement | null) => {
    onApplyInspiration?.(toGameplayInspiration(playway), sourceElement);
  };

  const runOnce = (key: string, action: () => void) => {
    if (lastActionKeyRef.current === key) return;
    lastActionKeyRef.current = key;
    action();
    window.setTimeout(() => {
      if (lastActionKeyRef.current === key) lastActionKeyRef.current = '';
    }, 240);
  };

  return (
    <section style={styles.shell}>
      <style>{`
        .inspiration-scroll { scrollbar-width: none; }
        .inspiration-scroll::-webkit-scrollbar { display: none; }
        @media (max-width: 980px) {
          .inspiration-header {
            flex-direction: column;
            align-items: flex-start !important;
          }
          .inspiration-hint {
            text-align: left !important;
          }
          .inspiration-card-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .inspiration-example-dialog {
            width: calc(100vw - 28px) !important;
            max-height: calc(100vh - 28px) !important;
          }
          .inspiration-example-body {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div className="inspiration-header" style={styles.header}>
        <div style={styles.eyebrow}>
          <Sparkles size={15} />
          灵感推荐区
        </div>
        <div className="inspiration-hint" style={styles.headerHint}>
          不知道怎么设计互动课件时，可以来这找找灵感
        </div>
      </div>

      <div style={styles.filterPanel}>
        <div className="inspiration-scroll" style={styles.tabs}>
          {inspirationSeedData.categories.tabs.map(tab => {
            const Icon = tabIcons[tab.id];
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}
                onMouseDown={event => event.preventDefault()}
                onClick={() => handleTabChange(tab.id)}
              >
                <Icon size={15} />
                {tab.name}
              </button>
            );
          })}
        </div>

        <div style={styles.ageAndRefresh}>
          <div className="inspiration-scroll" style={styles.ageTabs}>
            {ageBandTabs.map(ageBand => {
              const active = activeAgeBand === ageBand.id;
              return (
                <button
                  key={ageBand.id}
                  style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => handleAgeBandChange(ageBand.id)}
                >
                  {ageBand.name}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      <div className="inspiration-card-grid" style={styles.templateGrid}>
        {pagedPlayways.map(playway => {
          const selected = selectedInspirationId === playway.id;
          const exampleTitle = exampleFallbackLabel[playway.exampleId] || '玩法效果示例';
          return (
            <article key={playway.id} style={{ ...styles.card, ...(selected ? styles.cardSelected : {}) }}>
              <div style={styles.cardHeader}>
                <div style={{ minWidth: 0 }}>
                  <div style={styles.cardKicker}>{playway.ageText} · {playway.typeLabel}</div>
                  <h3 style={styles.cardTitle}>{playway.title}</h3>
                </div>
                {selected && (
                  <span style={styles.selectedBadge}>
                    <CheckCircle2 size={12} />
                    已套用
                  </span>
                )}
              </div>

              <p style={styles.description}>{playway.shortDesc}</p>

              <div style={styles.compactMeta}>
                {playway.classFlow.slice(0, 3).join(' → ')}
              </div>

              <div style={styles.compactTags}>
                {playway.cardTags.slice(0, 3).map(item => <span key={item} style={styles.tag}>{item}</span>)}
              </div>

              <div style={styles.cardActions}>
                <button
                  style={styles.detailBtn}
                  title={exampleTitle}
                  data-playway-id={playway.id}
                  data-example-id={playway.exampleId}
                  onPointerUp={() => runOnce(`example-${playway.id}`, () => setExamplePlaywayId(playway.id))}
                  onClick={() => runOnce(`example-${playway.id}`, () => setExamplePlaywayId(playway.id))}
                >
                  <PlayCircle size={14} />
                  试玩一下
                </button>
                <button
                  style={styles.primaryBtn}
                  onPointerUp={(event) => runOnce(`apply-${playway.id}`, () => handleApply(playway, event.currentTarget))}
                  onClick={(event) => runOnce(`apply-${playway.id}`, () => handleApply(playway, event.currentTarget))}
                >
                  套用玩法
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {pagedPlayways.length === 0 && (
        <div style={styles.emptyState}>当前分类下暂无匹配玩法，可以切换年龄段或点击其他分类看看。</div>
      )}

      {visiblePlayways.length > cardsPerPage && (
        <div style={styles.pagination}>
          <button
            type="button"
            style={{ ...styles.pageButton, ...(pageIndex <= 0 ? styles.pageButtonDisabled : {}) }}
            disabled={pageIndex <= 0}
            onClick={() => setPageIndex(prev => Math.max(0, prev - 1))}
          >
            <ChevronLeft size={15} />
            上一页
          </button>
          <div style={styles.pageDots}>
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`第 ${index + 1} 页`}
                style={{ ...styles.pageDot, ...(index === pageIndex ? styles.pageDotActive : {}) }}
                onClick={() => setPageIndex(index)}
              />
            ))}
          </div>
          <div style={styles.pageText}>{Math.min(pageIndex + 1, totalPages)} / {totalPages}</div>
          <button
            type="button"
            style={{ ...styles.pageButton, ...(pageIndex >= totalPages - 1 ? styles.pageButtonDisabled : {}) }}
            disabled={pageIndex >= totalPages - 1}
            onClick={() => setPageIndex(prev => Math.min(totalPages - 1, prev + 1))}
          >
            下一页
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {examplePlayway && example && createPortal((
        <div style={styles.exampleOverlay} onClick={() => setExamplePlaywayId(null)}>
          <div
            className="inspiration-example-dialog"
            style={styles.exampleDialog}
            onClick={event => event.stopPropagation()}
          >
            <div style={styles.exampleHeader}>
              <div>
                <div style={styles.exampleEyebrow}>玩法效果示例</div>
                <h3 style={styles.exampleTitle}>{examplePlayway.title}</h3>
                <p style={styles.exampleSubtitle}>
                  {examplePlayway.originalExampleId === null
                    ? '先看这种互动在课堂上怎么玩。套用后，AI 会按你填写的教学内容重新生成一节新课。'
                    : '先看这个玩法在课堂上的呈现效果。套用后，AI 会按你填写的教学内容重新生成一节新课。'}
                </p>
              </div>
              <button
                aria-label="关闭玩法示例"
                style={styles.exampleCloseBtn}
                onClick={() => setExamplePlaywayId(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="inspiration-example-body" style={styles.exampleBody}>
              <div style={styles.examplePreviewShell}>
                <iframe
                  title={`${examplePlayway.title}玩法示例`}
                  sandbox="allow-scripts"
                  srcDoc={exampleHtmlById[example.id] || animalsPlayOnlyHTML}
                  style={styles.exampleIframe}
                />
              </div>

              <aside style={styles.exampleInfo}>
                <p style={styles.exampleNote}>{example.note}</p>
                <div style={styles.exampleBlock}>
                  <div style={styles.blockLabel}>这个玩法适合</div>
                  <div style={styles.tagRow}>
                    {examplePlayway.suitableFor.map(item => <span key={item} style={styles.tag}>{item}</span>)}
                  </div>
                </div>
                <div style={styles.exampleBlock}>
                  <div style={styles.blockLabel}>课堂流程</div>
                  <div style={styles.flow}>
                    {examplePlayway.classFlow.map((step, index) => (
                      <span key={step} style={styles.flowStep}>
                        {step}{index < examplePlayway.classFlow.length - 1 ? ' →' : ''}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={styles.exampleBlock}>
                  <div style={styles.blockLabel}>可以怎么改成你的课</div>
                  <div style={styles.exampleText}>
                    把{examplePlayway.suitableFor.slice(0, 3).join('、')}换成你的知识点，
                    再替换{examplePlayway.replaceableContent.slice(0, 3).join('、')}，玩法节奏和反馈会一起带入。
                  </div>
                </div>
                <button
                  style={styles.exampleApplyBtn}
                  onClick={(event) => {
                    handleApply(examplePlayway, event.currentTarget);
                    setExamplePlaywayId(null);
                  }}
                >
                  套用这个玩法
                </button>
              </aside>
            </div>
          </div>
        </div>
      ), document.body)}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    position: 'relative',
    width: '100%',
    maxWidth: 1080,
    margin: '0 auto',
    padding: 16,
    borderRadius: 16,
    background: 'var(--agent-panel-gradient)',
    border: '1px solid var(--agent-border)',
    boxShadow: '0 14px 36px var(--agent-shadow), inset 0 1px 0 rgba(255,255,255,0.9)',
    overflow: 'hidden',
  },
  header: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 10,
    padding: '2px 2px 0',
  },
  eyebrow: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    color: 'var(--agent-primary-text)',
    fontSize: 18,
    fontWeight: 900,
    marginBottom: 0,
  },
  countBadge: {
    height: 22,
    padding: '0 8px',
    borderRadius: 999,
    background: '#FFFFFF',
    color: '#64748B',
    border: '1px solid var(--agent-border)',
    fontSize: 11,
    fontWeight: 900,
    lineHeight: '22px',
  },
  headerHint: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 1.35,
    textAlign: 'right',
    whiteSpace: 'nowrap',
  },
  filterPanel: {
    display: 'grid',
    gap: 9,
    marginBottom: 11,
  },
  tabs: {
    display: 'flex',
    gap: 8,
    minWidth: 0,
    overflowX: 'auto',
  },
  tab: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 32,
    padding: '0 12px',
    borderRadius: 8,
    border: '1px solid var(--agent-border)',
    background: '#FFFFFF',
    color: '#475569',
    fontSize: 13,
    fontWeight: 850,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    outline: 'none',
  },
  tabActive: {
    borderColor: 'var(--agent-primary)',
    background: 'var(--agent-soft-strong)',
    color: 'var(--agent-primary-text)',
  },
  ageAndRefresh: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  ageTabs: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    overflowX: 'auto',
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 12,
  },
  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 166,
    padding: 14,
    borderRadius: 10,
    border: '1px solid var(--agent-border)',
    background: '#FFFFFF',
    boxShadow: '0 8px 20px rgba(37, 74, 120, 0.05)',
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: 'var(--agent-primary)',
    boxShadow: '0 10px 24px var(--agent-focus-ring-strong)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  cardKicker: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: 850,
    marginBottom: 4,
  },
  cardTitle: {
    margin: 0,
    color: '#0F172A',
    fontSize: 16,
    fontWeight: 900,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  selectedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    height: 22,
    padding: '0 8px',
    borderRadius: 999,
    background: 'var(--agent-soft-strong)',
    color: 'var(--agent-primary-text)',
    fontSize: 11,
    fontWeight: 900,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  description: {
    margin: 0,
    color: '#334155',
    fontSize: 13,
    lineHeight: 1.4,
    minHeight: 36,
    maxHeight: 36,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  compactMeta: {
    marginTop: 10,
    color: 'var(--agent-primary-text)',
    fontSize: 12,
    fontWeight: 850,
    lineHeight: 1.35,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  compactTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 10,
  },
  detailBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 30,
    padding: '0 10px',
    borderRadius: 8,
    border: '1px solid var(--agent-border)',
    background: '#FFFFFF',
    color: 'var(--agent-secondary-text)',
    fontSize: 12,
    fontWeight: 850,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    padding: '0 12px',
    borderRadius: 8,
    border: 'none',
    background: 'var(--agent-gradient)',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 950,
    cursor: 'pointer',
    boxShadow: '0 7px 14px var(--agent-shadow)',
    whiteSpace: 'nowrap',
  },
  emptyState: {
    marginTop: 10,
    padding: 18,
    borderRadius: 12,
    background: '#FFFFFF',
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    border: '1px solid var(--agent-border)',
  },
  exampleOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 20000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    background: 'rgba(15, 23, 42, 0.34)',
    backdropFilter: 'blur(10px)',
  },
  exampleDialog: {
    width: 'min(1080px, calc(100vw - 40px))',
    maxHeight: 'calc(100vh - 40px)',
    overflow: 'auto',
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.72)',
    background: 'linear-gradient(180deg, rgba(248, 253, 252, 0.98), rgba(255,255,255,0.98))',
    boxShadow: '0 28px 80px rgba(15, 23, 42, 0.22)',
  },
  exampleHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    padding: '18px 20px 14px',
    borderBottom: '1px solid var(--agent-border)',
  },
  exampleEyebrow: {
    color: 'var(--agent-primary-text)',
    fontSize: 12,
    fontWeight: 900,
    marginBottom: 4,
  },
  exampleTitle: {
    margin: 0,
    color: '#0F172A',
    fontSize: 22,
    fontWeight: 950,
    lineHeight: 1.2,
  },
  exampleSubtitle: {
    margin: '6px 0 0',
    color: '#64748B',
    fontSize: 13,
    lineHeight: 1.45,
  },
  exampleCloseBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: 10,
    border: '1px solid var(--agent-border)',
    background: '#FFFFFF',
    color: '#475569',
    cursor: 'pointer',
    flexShrink: 0,
  },
  exampleBody: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.45fr) minmax(280px, 0.55fr)',
    gap: 16,
    padding: 18,
  },
  examplePreviewShell: {
    minWidth: 0,
    borderRadius: 14,
    overflow: 'hidden',
    border: '1px solid var(--agent-border)',
    background: '#FFFFFF',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
  },
  exampleIframe: {
    display: 'block',
    width: '100%',
    height: 430,
    border: 0,
    background: '#FFFFFF',
  },
  exampleInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    minWidth: 0,
  },
  exampleNote: {
    margin: 0,
    padding: 12,
    borderRadius: 12,
    background: 'var(--agent-soft)',
    border: '1px solid var(--agent-border)',
    color: 'var(--agent-primary-text)',
    fontSize: 13,
    lineHeight: 1.55,
    fontWeight: 800,
  },
  exampleBlock: {
    padding: 12,
    borderRadius: 12,
    background: '#FFFFFF',
    border: '1px solid var(--agent-border)',
  },
  exampleApplyBtn: {
    height: 38,
    borderRadius: 10,
    border: 'none',
    background: 'var(--agent-action-gradient)',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 950,
    cursor: 'pointer',
    boxShadow: '0 10px 22px var(--agent-action-shadow)',
  },
  blockLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: 850,
    marginBottom: 6,
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    height: 23,
    padding: '0 7px',
    borderRadius: 999,
    background: 'var(--agent-soft)',
    color: 'var(--agent-primary-text)',
    fontSize: 11,
    fontWeight: 850,
    lineHeight: '23px',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 14,
  },
  pageButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 32,
    padding: '0 11px',
    borderRadius: 8,
    border: '1px solid var(--agent-border)',
    background: '#FFFFFF',
    color: '#475569',
    fontSize: 12,
    fontWeight: 850,
    cursor: 'pointer',
  },
  pageButtonDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  pageDots: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  pageDot: {
    width: 7,
    height: 7,
    padding: 0,
    borderRadius: 999,
    border: 'none',
    background: '#CBD5E1',
    cursor: 'pointer',
  },
  pageDotActive: {
    width: 18,
    background: 'var(--agent-primary)',
  },
  pageText: {
    minWidth: 36,
    color: '#64748B',
    fontSize: 12,
    fontWeight: 850,
    textAlign: 'center',
  },
  flow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
    padding: 9,
    borderRadius: 10,
    background: '#F8FAFC',
    color: '#475569',
    fontSize: 12,
    lineHeight: 1.45,
  },
  flowStep: {
    fontWeight: 700,
  },
  exampleText: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 1.55,
  },
};
