import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  X,
} from 'lucide-react';
import {
  inspirationSeedData,
  type InspirationPlayway,
  type InspirationTabId,
} from '../../data/inspirationSeedData';

export interface GameplayInspiration {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
  ageRange: string;
  learningAction: string;
  interactionTags: string[];
  structure: string[];
  adaptationText: string;
  promptEnhancement: string;
  sourceType: string;
  typeLabel: string;
}

interface InspirationSectionProps {
  selectedInspirationId?: string | null;
  onApplyInspiration?: (item: GameplayInspiration, sourceElement?: HTMLElement | null) => void;
}

const tabIcons: Record<InspirationTabId, React.ElementType> = {
  featured: Sparkles,
  recognition: BookOpenCheck,
  logic: Brain,
  spatial: Shapes,
  puzzle: Puzzle,
  junior_math: Calculator,
  scenario: Sparkles,
};

const cardsPerPage = 8;

const isKnownAge = (ageText: string) => Boolean(ageText && ageText !== '未标注');

const sortByFinalSeedOrder = (items: InspirationPlayway[]) => items.slice().sort((a, b) => {
  if (a.isFeatured && b.isFeatured) {
    return (a.featuredRank ?? 999) - (b.featuredRank ?? 999) || a.sourceOrder - b.sourceOrder;
  }
  if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
  return a.sourceOrder - b.sourceOrder;
});

const getVisibleCardTags = (playway: InspirationPlayway) => (
  playway.suitableTags
    .filter(item => item !== playway.secondaryLabel && item !== '未标注')
    .slice(0, 2)
);

const getVisibleSuitableTags = (playway: InspirationPlayway) => (
  playway.suitableTags.filter(item => item && item !== '未标注')
);

const renderCardCover = (playway: InspirationPlayway) => {
  return (
    <div style={styles.cardCover}>
      {playway.coverUrl ? (
        <img src={playway.coverUrl} alt={`${playway.displayTitle}封面`} style={styles.cardCoverImage} />
      ) : (
        <div style={styles.cardCoverEmpty}>{playway.secondaryLabel}</div>
      )}
    </div>
  );
};

const toGameplayInspiration = (playway: InspirationPlayway): GameplayInspiration => ({
  id: playway.id,
  title: playway.displayTitle,
  summary: playway.shortDesc,
  keywords: playway.suitableTags,
  ageRange: playway.ageText,
  learningAction: playway.secondaryLabel,
  interactionTags: [playway.secondaryLabel, ...getVisibleCardTags(playway)].filter(Boolean),
  structure: playway.flowSteps,
  adaptationText: playway.adaptationText,
  promptEnhancement: playway.templatePrompt,
  sourceType: playway.primaryCategory,
  typeLabel: playway.secondaryLabel,
});

export const buildStructuredInspirationPrompt = (item: GameplayInspiration, currentInput: string) => {
  const cleaned = currentInput
    .replace(/<已套用玩法>[\s\S]*?<\/已套用玩法>/g, '')
    .replace(/已套用「[^」]+」玩法[\s\S]*$/g, '')
    .replace(/^(?:教学内容|你的需求)：/g, '')
    .trim();
  const content = cleaned;
  const ageLine = isKnownAge(item.ageRange) ? `适用年龄：${item.ageRange}\n` : '';

  return `你的需求：${content}

<已套用玩法>
玩法名称：${item.title}
玩法类型：${item.typeLabel}
${ageLine}适合内容：${item.keywords.join('、')}

课堂互动流程：
${item.structure.map((step, index) => `${index + 1}. ${step}`).join('\n')}

玩法改编建议：
${item.adaptationText}

玩法要求：
${item.promptEnhancement}

本次生成要求：
1. 保留上方“你的需求”里的年级、学科、知识点、素材说明或老师补充要求。
2. 只把互动玩法切换为「${item.title}」，不要丢失老师已经输入的内容。
3. 按该玩法生成可直接课堂使用的互动课件，包含明确题目、操作方式、正确反馈、错误提示和完成总结。
</已套用玩法>`;
};

export default function InspirationSection({
  selectedInspirationId,
  onApplyInspiration,
}: InspirationSectionProps) {
  const [activeTab, setActiveTab] = useState<InspirationTabId>('featured');
  const [activeSecondary, setActiveSecondary] = useState('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [examplePlaywayId, setExamplePlaywayId] = useState<string | null>(null);
  const lastActionKeyRef = useRef('');
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const subNavWrapRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef(new Map<InspirationTabId, HTMLButtonElement>());
  const [subNavPointerLeft, setSubNavPointerLeft] = useState(78);

  const updateSubNavPointer = useCallback(() => {
    const activeTabElement = tabRefs.current.get(activeTab);
    const subNavWrapElement = subNavWrapRef.current;
    if (!activeTabElement || !subNavWrapElement) return;

    const tabRect = activeTabElement.getBoundingClientRect();
    const wrapRect = subNavWrapElement.getBoundingClientRect();
    const pointerWidth = 12;
    const nextLeft = tabRect.left + tabRect.width / 2 - wrapRect.left - pointerWidth / 2;
    const clampedLeft = Math.max(12, Math.min(wrapRect.width - 24, nextLeft));

    setSubNavPointerLeft(prev => (
      Math.abs(prev - clampedLeft) < 0.5 ? prev : clampedLeft
    ));
  }, [activeTab]);

  const primaryFilteredPlayways = useMemo(() => {
    const byTab = inspirationSeedData.playways.filter(item => (
      activeTab === 'featured' ? item.isFeatured : item.primaryCategory === activeTab
    ));
    return sortByFinalSeedOrder(byTab);
  }, [activeTab]);

  const secondaryOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    primaryFilteredPlayways.forEach(item => {
      if (!map.has(item.secondaryCategory)) {
        map.set(item.secondaryCategory, {
          id: item.secondaryCategory,
          name: item.secondaryLabel,
        });
      }
    });
    return Array.from(map.values());
  }, [primaryFilteredPlayways]);

  const visiblePlayways = useMemo(() => (
    activeSecondary === 'all'
      ? primaryFilteredPlayways
      : primaryFilteredPlayways.filter(item => item.secondaryCategory === activeSecondary)
  ), [activeSecondary, primaryFilteredPlayways]);

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

  const handleTabChange = (tab: InspirationTabId) => {
    setActiveTab(tab);
    setActiveSecondary('all');
    setPageIndex(0);
    setExamplePlaywayId(null);
  };

  useEffect(() => {
    if (activeTab === 'featured') return;

    const frame = window.requestAnimationFrame(updateSubNavPointer);
    const resizeObserver = new ResizeObserver(updateSubNavPointer);
    const tabsElement = tabsRef.current;
    const subNavWrapElement = subNavWrapRef.current;
    const activeTabElement = tabRefs.current.get(activeTab);

    if (tabsElement) resizeObserver.observe(tabsElement);
    if (subNavWrapElement) resizeObserver.observe(subNavWrapElement);
    if (activeTabElement) resizeObserver.observe(activeTabElement);
    window.addEventListener('resize', updateSubNavPointer);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSubNavPointer);
    };
  }, [activeTab, secondaryOptions.length, updateSubNavPointer]);

  const handleSecondaryChange = (secondary: string) => {
    setActiveSecondary(secondary);
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
        <div
          ref={tabsRef}
          className="inspiration-scroll"
          style={styles.tabs}
          onScroll={updateSubNavPointer}
        >
          {inspirationSeedData.categories.tabs.map(tab => {
            const Icon = tabIcons[tab.id];
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(node) => {
                  if (node) {
                    tabRefs.current.set(tab.id, node);
                  } else {
                    tabRefs.current.delete(tab.id);
                  }
                }}
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

        {activeTab !== 'featured' && secondaryOptions.length > 0 && (
          <div ref={subNavWrapRef} style={styles.subNavWrap}>
            <div style={{ ...styles.subNavPointer, left: subNavPointerLeft }} />
            <div className="inspiration-scroll" style={styles.subNav}>
              <button
                type="button"
                style={{ ...styles.subNavPill, ...(activeSecondary === 'all' ? styles.subNavPillActive : {}) }}
                onMouseDown={event => event.preventDefault()}
                onClick={() => handleSecondaryChange('all')}
              >
                全部
              </button>
              {secondaryOptions.map(option => {
                const active = activeSecondary === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    style={{ ...styles.subNavPill, ...(active ? styles.subNavPillActive : {}) }}
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => handleSecondaryChange(option.id)}
                  >
                    {option.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="inspiration-card-grid" style={styles.templateGrid}>
        {pagedPlayways.map(playway => {
          const selected = selectedInspirationId === playway.id;
          return (
            <article key={playway.id} style={{ ...styles.card, ...(selected ? styles.cardSelected : {}) }}>
              {renderCardCover(playway)}

              <div style={styles.cardBody}>
                <div style={styles.cardHeader}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={styles.cardTitle}>{playway.displayTitle}</h3>
                  </div>
                  {selected && (
                    <span style={styles.selectedBadge}>
                      <CheckCircle2 size={12} />
                      已套用
                    </span>
                  )}
                </div>

                <p style={styles.description}>{playway.shortDesc}</p>

                <div style={styles.cardActions}>
                  <button
                    style={styles.detailBtn}
                    title="玩法效果示例"
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

      {examplePlayway && createPortal((
        <div style={styles.exampleOverlay} onClick={() => setExamplePlaywayId(null)}>
          <div
            className="inspiration-example-dialog"
            style={styles.exampleDialog}
            onClick={event => event.stopPropagation()}
          >
            <div style={styles.exampleHeader}>
              <div>
                <div style={styles.exampleEyebrow}>玩法效果示例</div>
                <h3 style={styles.exampleTitle}>{examplePlayway.displayTitle}</h3>
                <p style={styles.exampleSubtitle}>
                  先看这个玩法在课堂上的呈现效果。套用后，AI 会按你填写的需求重新生成一节新课。
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
                {examplePlayway.examplePreviewUrl ? (
                  <iframe
                    title={`${examplePlayway.displayTitle}玩法示例`}
                    sandbox="allow-scripts allow-same-origin"
                    src={examplePlayway.examplePreviewUrl}
                    style={styles.exampleIframe}
                  />
                ) : (
                  <div style={styles.exampleEmptyPreview}>该玩法题板预览暂未配置</div>
                )}
              </div>

              <aside style={styles.exampleInfo}>
                <div style={styles.exampleBlock}>
                  <div style={styles.blockLabel}>这个玩法适合</div>
                  <div style={styles.tagRow}>
                    {getVisibleSuitableTags(examplePlayway).map(item => <span key={item} style={styles.tag}>{item}</span>)}
                  </div>
                </div>
                <div style={styles.exampleBlock}>
                  <div style={styles.blockLabel}>课堂流程</div>
                  <div style={styles.flow}>
                    {examplePlayway.flowSteps.map((step, index) => (
                      <span key={step} style={styles.flowStep}>
                        {step}{index < examplePlayway.flowSteps.length - 1 ? ' →' : ''}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={styles.exampleBlock}>
                  <div style={styles.blockLabel}>可以怎么改成你的课</div>
                  <div style={styles.exampleText}>
                    {examplePlayway.adaptationText}
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
    gap: 8,
    marginBottom: 14,
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
  subNavWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    padding: '8px 10px',
    borderRadius: 12,
    background: 'rgba(255, 255, 255, 0.58)',
    border: '1px solid rgba(125, 211, 197, 0.45)',
    overflow: 'visible',
  },
  subNavPointer: {
    position: 'absolute',
    top: -6,
    left: 78,
    width: 12,
    height: 12,
    transform: 'rotate(45deg)',
    background: 'rgba(255, 255, 255, 0.8)',
    borderLeft: '1px solid rgba(125, 211, 197, 0.45)',
    borderTop: '1px solid rgba(125, 211, 197, 0.45)',
  },
  subNav: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    overflowX: 'auto',
    position: 'relative',
    zIndex: 1,
  },
  subNavPill: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    padding: '0 10px',
    borderRadius: 999,
    border: '1px solid transparent',
    background: 'transparent',
    color: '#64748B',
    fontSize: 12,
    fontWeight: 850,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    outline: 'none',
  },
  subNavPillActive: {
    background: '#FFFFFF',
    borderColor: 'var(--agent-primary)',
    color: 'var(--agent-primary-text)',
    boxShadow: '0 6px 14px rgba(34, 197, 190, 0.12)',
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
    minHeight: 244,
    padding: 0,
    borderRadius: 14,
    border: '1px solid var(--agent-border)',
    background: '#FFFFFF',
    boxShadow: '0 10px 24px rgba(37, 74, 120, 0.07)',
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: 'var(--agent-primary)',
    boxShadow: '0 10px 24px var(--agent-focus-ring-strong)',
  },
  cardCover: {
    position: 'relative',
    aspectRatio: '16 / 9',
    minHeight: 104,
    overflow: 'hidden',
    background: '#F8FAFC',
  },
  cardCoverImage: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cardCoverEmpty: {
    display: 'flex',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #ECFDF5, #E0F2FE)',
    color: 'var(--agent-primary-text)',
    fontSize: 13,
    fontWeight: 900,
  },
  cardBody: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    padding: 12,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
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
    fontSize: 12,
    lineHeight: 1.4,
    minHeight: 34,
    maxHeight: 34,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 9,
  },
  detailBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 30,
    padding: '0 10px',
    borderRadius: 8,
    border: '1px solid rgba(14, 165, 233, 0.34)',
    background: 'linear-gradient(180deg, rgba(240, 249, 255, 0.96), rgba(236, 253, 245, 0.92))',
    color: 'var(--agent-primary-text)',
    fontSize: 12,
    fontWeight: 850,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 6px 14px rgba(14, 165, 233, 0.08)',
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    padding: '0 12px',
    borderRadius: 8,
    border: 'none',
    background: 'var(--agent-action-gradient)',
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
    width: 'min(1180px, calc(100vw - 40px))',
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
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: 16,
    padding: 18,
  },
  examplePreviewShell: {
    minWidth: 0,
    aspectRatio: '16 / 9',
    borderRadius: 14,
    overflow: 'hidden',
    border: '1px solid var(--agent-border)',
    background: '#FFFFFF',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
  },
  exampleIframe: {
    display: 'block',
    width: '100%',
    height: '100%',
    border: 0,
    background: '#FFFFFF',
  },
  exampleEmptyPreview: {
    display: 'flex',
    width: '100%',
    height: '100%',
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 850,
    background: '#F8FAFC',
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
    border: '1px solid rgba(14, 165, 233, 0.14)',
    background: 'rgba(240, 249, 255, 0.92)',
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
