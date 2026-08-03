import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpenCheck,
  Brain,
  Calculator,
  CheckCircle2,
  Copy,
  Flame,
  PlayCircle,
  Puzzle,
  Route,
  Sparkles,
  Shapes,
  X,
} from 'lucide-react';
import {
  inspirationSeedData,
  type InspirationPlayway,
  type InspirationTabId,
} from '../../data/inspirationSeedData';
import PageLoadingState from '../common/PageLoadingState';

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
  examplePreviewUrl?: string;
  coverUrl?: string;
  materialId?: string;
}

interface InspirationSectionProps {
  selectedInspirationId?: string | null;
  onApplyInspiration?: (item: GameplayInspiration, sourceElement?: HTMLElement | null) => void;
  onCloneInspiration?: (item: GameplayInspiration, sourceElement?: HTMLElement | null) => void;
}

const tabIcons: Record<InspirationTabId, React.ElementType> = {
  featured: Flame,
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

const createCloneMeta = (playway: InspirationPlayway) => {
  const materialId = playway.exampleId || playway.id.replace(/-/g, '');
  const contentTags = getVisibleSuitableTags(playway);
  const knowledgePoints = [
    playway.secondaryLabel,
    ...getVisibleSuitableTags(playway).filter(item => item !== playway.secondaryLabel),
  ].slice(0, 3);

  return {
    materialId,
    resourceOwner: '集团资源 / 双语故事表演 / S3',
    contentTags: contentTags.length ? contentTags : [playway.secondaryLabel],
    knowledgePoints: knowledgePoints.length ? knowledgePoints : [playway.displayTitle],
    uploader: '陈佳玲 2026-07-30 18:20:09',
    modifier: '陈佳玲 2026-07-30 18:20:09',
    size: `${Math.max(2.1, Math.min(8.8, playway.templatePrompt.length / 4200)).toFixed(2)}K`,
  };
};

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

const renderAdaptationText = (text: string) => (
  <div style={styles.exampleText}>
    {text
      .split(/(?<=[。；：])/)
      .map(item => item.trim())
      .filter(Boolean)
      .map((item, index) => (
        <p key={`${item}-${index}`} style={styles.exampleTextParagraph}>{item}</p>
      ))}
  </div>
);

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
  examplePreviewUrl: playway.examplePreviewUrl,
  coverUrl: playway.coverUrl,
  materialId: playway.exampleId,
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
  onCloneInspiration,
}: InspirationSectionProps) {
  const [activeTab, setActiveTab] = useState<InspirationTabId>('featured');
  const [activeSecondary, setActiveSecondary] = useState('all');
  const [visibleCount, setVisibleCount] = useState(cardsPerPage);
  const [examplePlaywayId, setExamplePlaywayId] = useState<string | null>(null);
  const [clonePreviewPlaywayId, setClonePreviewPlaywayId] = useState<string | null>(null);
  const [examplePreviewLoaded, setExamplePreviewLoaded] = useState(false);
  const [clonePreviewLoaded, setClonePreviewLoaded] = useState(false);
  const [recommendationMode, setRecommendationMode] = useState<'clone' | 'template'>('clone');
  const [copiedMaterialId, setCopiedMaterialId] = useState<string | null>(null);
  const lastActionKeyRef = useRef('');
  const titleClickStateRef = useRef<{ count: number; timer: number | null }>({ count: 0, timer: null });
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const subNavWrapRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef(new Map<InspirationTabId, HTMLButtonElement>());
  const [subNavPointerLeft, setSubNavPointerLeft] = useState(78);
  const [hoveredFilterKey, setHoveredFilterKey] = useState<string | null>(null);

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

  const displayedPlayways = useMemo(() => (
    visiblePlayways.slice(0, visibleCount)
  ), [visibleCount, visiblePlayways]);

  const clonePlayways = useMemo(() => (
    sortByFinalSeedOrder(inspirationSeedData.playways.filter(item => item.isFeatured))
  ), []);

  const currentVisiblePlayways = recommendationMode === 'clone' ? clonePlayways : visiblePlayways;
  const currentDisplayedPlayways = recommendationMode === 'clone'
    ? clonePlayways.slice(0, visibleCount)
    : displayedPlayways;
  const currentHasMorePlayways = visibleCount < currentVisiblePlayways.length;

  const examplePlayway = useMemo(
    () => inspirationSeedData.playways.find(item => item.id === examplePlaywayId) || null,
    [examplePlaywayId],
  );

  const clonePreviewPlayway = useMemo(
    () => inspirationSeedData.playways.find(item => item.id === clonePreviewPlaywayId) || null,
    [clonePreviewPlaywayId],
  );

  useEffect(() => {
    setExamplePreviewLoaded(false);
  }, [examplePlaywayId]);

  useEffect(() => {
    setClonePreviewLoaded(false);
  }, [clonePreviewPlaywayId]);

  useEffect(() => () => {
    const timer = titleClickStateRef.current.timer;
    if (timer) window.clearTimeout(timer);
  }, []);

  const handleTabChange = (tab: InspirationTabId) => {
    setActiveTab(tab);
    setActiveSecondary('all');
    setVisibleCount(cardsPerPage);
    setExamplePlaywayId(null);
    setClonePreviewPlaywayId(null);
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
    setVisibleCount(cardsPerPage);
    setExamplePlaywayId(null);
    setClonePreviewPlaywayId(null);
  };

  useEffect(() => {
    if (!currentHasMorePlayways) return undefined;

    const node = loadMoreRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisibleCount(prev => Math.min(prev + cardsPerPage, currentVisiblePlayways.length));
    }, { rootMargin: '240px 0px' });

    observer.observe(node);
    return () => observer.disconnect();
  }, [currentHasMorePlayways, currentVisiblePlayways.length]);

  const handleApply = (playway: InspirationPlayway, sourceElement?: HTMLElement | null) => {
    onApplyInspiration?.(toGameplayInspiration(playway), sourceElement);
  };

  const handleClone = (playway: InspirationPlayway, sourceElement?: HTMLElement | null) => {
    onCloneInspiration?.(toGameplayInspiration(playway), sourceElement);
  };

  const handleTitleClick = () => {
    const clickState = titleClickStateRef.current;
    clickState.count += 1;

    if (clickState.timer) {
      window.clearTimeout(clickState.timer);
    }

    if (clickState.count >= 3) {
      clickState.count = 0;
      clickState.timer = null;
      setRecommendationMode(prev => (prev === 'clone' ? 'template' : 'clone'));
      setExamplePlaywayId(null);
      setClonePreviewPlaywayId(null);
      return;
    }

    clickState.timer = window.setTimeout(() => {
      clickState.count = 0;
      clickState.timer = null;
    }, 850);
  };

  const handleCopyMaterialId = async (materialId: string) => {
    try {
      await navigator.clipboard?.writeText(materialId);
      setCopiedMaterialId(materialId);
      window.setTimeout(() => {
        setCopiedMaterialId(current => (current === materialId ? null : current));
      }, 1200);
    } catch {
      setCopiedMaterialId(null);
    }
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
            align-self: flex-start !important;
          }
          .inspiration-card-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .inspiration-example-dialog {
            width: calc(100vw - 28px) !important;
            max-height: calc(100vh - 28px) !important;
          }
          .inspiration-clone-body {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 760px) {
          .inspiration-example-body {
            grid-template-columns: 1fr !important;
          }
          .inspiration-clone-drawer {
            width: calc(100vw - 24px) !important;
            max-height: calc(100vh - 24px) !important;
            margin: 12px !important;
            border-radius: 16px !important;
          }
          .inspiration-clone-body {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div className="inspiration-header" style={styles.header}>
        <div
          style={styles.eyebrow}
          onClick={handleTitleClick}
          aria-label="灵感推荐区"
        >
          <Sparkles size={15} />
          灵感推荐区
        </div>
      </div>

      {recommendationMode === 'template' && (
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
                  style={{
                    ...styles.tab,
                    ...(hoveredFilterKey === `tab-${tab.id}` && !active ? styles.filterButtonHover : {}),
                    ...(active ? styles.tabActive : {}),
                  }}
                  onMouseEnter={() => setHoveredFilterKey(`tab-${tab.id}`)}
                  onMouseLeave={() => setHoveredFilterKey(null)}
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => handleTabChange(tab.id)}
                >
                  {tab.id === 'featured' ? (
                    <span style={styles.featuredTabIcon}>🔥</span>
                  ) : (
                    <Icon size={15} />
                  )}
                  {tab.id === 'featured' ? '精选推荐' : tab.name}
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
                  style={{
                    ...styles.subNavPill,
                    ...(hoveredFilterKey === 'secondary-all' && activeSecondary !== 'all' ? styles.filterButtonHover : {}),
                    ...(activeSecondary === 'all' ? styles.subNavPillActive : {}),
                  }}
                  onMouseEnter={() => setHoveredFilterKey('secondary-all')}
                  onMouseLeave={() => setHoveredFilterKey(null)}
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
                      style={{
                        ...styles.subNavPill,
                        ...(hoveredFilterKey === `secondary-${option.id}` && !active ? styles.filterButtonHover : {}),
                        ...(active ? styles.subNavPillActive : {}),
                      }}
                      onMouseEnter={() => setHoveredFilterKey(`secondary-${option.id}`)}
                      onMouseLeave={() => setHoveredFilterKey(null)}
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
      )}

      <div className="inspiration-card-grid" style={styles.templateGrid}>
        {currentDisplayedPlayways.map(playway => {
          const selected = selectedInspirationId === playway.id;
          return (
            <article
              key={playway.id}
              style={{
                ...styles.card,
                ...(recommendationMode === 'clone' ? styles.cloneCard : {}),
                ...(selected ? styles.cardSelected : {}),
              }}
            >
              {renderCardCover(playway)}

              <div style={styles.cardBody}>
                <div style={styles.cardHeader}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={styles.cardTitle}>{playway.displayTitle}</h3>
                  </div>
                  {selected && (
                    <span style={styles.selectedBadge}>
                      <CheckCircle2 size={12} />
                      {recommendationMode === 'clone' ? '已同款' : '已套用'}
                    </span>
                  )}
                </div>

                {recommendationMode === 'template' && (
                  <p style={styles.description} aria-label={`课堂流程：${playway.flowSteps.slice(0, 4).join('，')}`}>
                    <span style={styles.descriptionIconBox} aria-hidden="true">
                      <Route size={13} style={styles.descriptionIcon} />
                    </span>
                    {playway.flowSteps.slice(0, 4).join(' → ')}
                  </p>
                )}

                <div style={styles.cardActions}>
                  <button
                    style={styles.detailBtn}
                    aria-label={`${playway.displayTitle}效果预览`}
                    data-playway-id={playway.id}
                    data-example-id={playway.exampleId}
                    onPointerUp={() => runOnce(`example-${playway.id}`, () => {
                      if (recommendationMode === 'clone') {
                        setClonePreviewPlaywayId(playway.id);
                      } else {
                        setExamplePlaywayId(playway.id);
                      }
                    })}
                    onClick={() => runOnce(`example-${playway.id}`, () => {
                      if (recommendationMode === 'clone') {
                        setClonePreviewPlaywayId(playway.id);
                      } else {
                        setExamplePlaywayId(playway.id);
                      }
                    })}
                  >
                    <PlayCircle size={14} />
                    试玩一下
                  </button>
                  <button
                    style={styles.primaryBtn}
                    onPointerUp={(event) => runOnce(`${recommendationMode}-${playway.id}`, () => {
                      if (recommendationMode === 'clone') {
                        handleClone(playway, event.currentTarget);
                      } else {
                        handleApply(playway, event.currentTarget);
                      }
                    })}
                    onClick={(event) => runOnce(`${recommendationMode}-${playway.id}`, () => {
                      if (recommendationMode === 'clone') {
                        handleClone(playway, event.currentTarget);
                      } else {
                        handleApply(playway, event.currentTarget);
                      }
                    })}
                  >
                    {recommendationMode === 'clone' ? '一键同款' : '套用模板'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {currentDisplayedPlayways.length === 0 && (
        <div style={styles.emptyState}>当前分类下暂无匹配玩法，可以切换年龄段或点击其他分类看看。</div>
      )}

      {currentHasMorePlayways && (
        <div ref={loadMoreRef} style={styles.loadMoreSentinel}>
          向下浏览，自动加载更多课件
        </div>
      )}

      {!currentHasMorePlayways && currentVisiblePlayways.length > cardsPerPage && (
        <div style={styles.loadMoreSentinel}>
          {recommendationMode === 'clone' ? '已展示全部课件' : '已展示全部玩法'}
        </div>
      )}

      {recommendationMode === 'clone' && clonePreviewPlayway && createPortal((
        <div style={styles.clonePreviewOverlay} onClick={() => setClonePreviewPlaywayId(null)}>
          <aside
            className="inspiration-clone-drawer"
            style={styles.cloneDrawer}
            onClick={event => event.stopPropagation()}
          >
            <div style={styles.cloneDrawerHeader}>
              <div style={{ minWidth: 0 }}>
                <div style={styles.cloneDrawerEyebrow}>互动课件资源</div>
                <h3 style={styles.cloneDrawerTitle}>{clonePreviewPlayway.displayTitle}</h3>
              </div>
              <button
                aria-label="关闭课件预览"
                style={styles.exampleCloseBtn}
                onClick={() => setClonePreviewPlaywayId(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="inspiration-clone-body" style={styles.cloneDrawerBody}>
              <div style={styles.clonePreviewStage}>
                {clonePreviewPlayway.examplePreviewUrl ? (
                  <>
                    <iframe
                      title={`${clonePreviewPlayway.displayTitle}试玩`}
                      sandbox="allow-scripts allow-same-origin"
                      src={clonePreviewPlayway.examplePreviewUrl}
                      style={styles.exampleIframe}
                      onLoad={() => setClonePreviewLoaded(true)}
                    />
                    {!clonePreviewLoaded && (
                      <PageLoadingState
                        fill
                        variant="dots"
                        title="正在加载中"
                      />
                    )}
                  </>
                ) : clonePreviewPlayway.coverUrl ? (
                  <img src={clonePreviewPlayway.coverUrl} alt={`${clonePreviewPlayway.displayTitle}封面`} style={styles.clonePreviewImage} />
                ) : (
                  <div style={styles.exampleEmptyPreview}>该课件暂未配置试玩</div>
                )}
              </div>

              <div style={styles.cloneDetailPanel}>
                {(() => {
                  const meta = createCloneMeta(clonePreviewPlayway);
                  const shortenedId = meta.materialId.length > 24
                    ? `${meta.materialId.slice(0, 24)}...`
                    : meta.materialId;
                  const auditRows = [
                    { label: '上传', value: meta.uploader },
                    { label: '修改', value: meta.modifier },
                    { label: '大小', value: meta.size },
                  ];
                  return (
                    <div style={styles.cloneResourcePanel}>
                      <div style={styles.cloneHeroMeta}>
                        <span style={styles.cloneFieldLabel}>素材ID</span>
                        <div style={styles.cloneMaterialValue}>
                          <span style={styles.cloneMaterialId}>{shortenedId}</span>
                          <button
                            type="button"
                            aria-label="复制素材ID"
                            style={styles.copyButton}
                            onClick={() => handleCopyMaterialId(meta.materialId)}
                          >
                            {copiedMaterialId === meta.materialId ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      <div style={styles.cloneDetailSection}>
                        <span style={styles.cloneFieldLabel}>资源归属</span>
                        <div style={styles.cloneOwnerPill}>{meta.resourceOwner}</div>
                      </div>

                      <div style={styles.cloneDetailSection}>
                        <span style={styles.cloneFieldLabel}>内容标签</span>
                        <div style={styles.cloneTagGrid}>
                          {meta.contentTags.map(tag => (
                            <span key={tag} style={styles.cloneContentTag}>{tag}</span>
                          ))}
                        </div>
                      </div>

                      <div style={styles.cloneDetailSection}>
                        <span style={styles.cloneFieldLabel}>知识点</span>
                        <div style={styles.cloneTagGrid}>
                          {meta.knowledgePoints.map(point => (
                            <span key={point} style={styles.cloneKnowledgeTag}>{point}</span>
                          ))}
                        </div>
                      </div>

                      <div style={styles.cloneAuditBox}>
                        {auditRows.map(row => (
                          <div key={row.label} style={styles.cloneAuditRow}>
                            <span style={styles.cloneAuditLabel}>{row.label}</span>
                            <span style={styles.cloneAuditValue}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div style={styles.cloneDrawerFooter}>
              <button
                style={styles.cloneSecondaryBtn}
                onClick={() => setClonePreviewPlaywayId(null)}
              >
                关闭
              </button>
              <button
                style={styles.clonePrimaryBtn}
                onClick={(event) => {
                  handleClone(clonePreviewPlayway, event.currentTarget);
                  setClonePreviewPlaywayId(null);
                }}
              >
                一键同款
              </button>
            </div>
          </aside>
        </div>
      ), document.body)}

      {recommendationMode === 'template' && examplePlayway && createPortal((
        <div style={styles.exampleOverlay} onClick={() => setExamplePlaywayId(null)}>
          <div
            className="inspiration-example-dialog"
            style={styles.exampleDialog}
            onClick={event => event.stopPropagation()}
          >
            <div style={styles.exampleHeader}>
              <div>
                <div style={styles.exampleEyebrow}>模板效果示例</div>
                <h3 style={styles.exampleTitle}>{examplePlayway.displayTitle}</h3>
                <p style={styles.exampleSubtitle}>
                  先看这个模板在课堂上的呈现效果。套用后，AI 会按你填写的需求重新生成一节新课。
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
                  <>
                    <iframe
                      title={`${examplePlayway.displayTitle}模板示例`}
                      sandbox="allow-scripts allow-same-origin"
                      src={examplePlayway.examplePreviewUrl}
                      style={styles.exampleIframe}
                      onLoad={() => setExamplePreviewLoaded(true)}
                    />
                    {!examplePreviewLoaded && (
                      <PageLoadingState
                        fill
                        variant="dots"
                        title="正在加载中"
                      />
                    )}
                  </>
                ) : (
                  <div style={styles.exampleEmptyPreview}>该模板示例暂未配置</div>
                )}
              </div>

              <aside style={styles.exampleInfo}>
                <div style={styles.exampleBlock}>
                  <div style={styles.blockLabel}>这个模板适合</div>
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
                <div style={{ ...styles.exampleBlock, ...styles.inspirationBlock }}>
                  <div style={styles.inspirationBlockLabel}>
                    <Sparkles size={13} />
                    可以怎么改成你的课
                  </div>
                  {renderAdaptationText(examplePlayway.adaptationText)}
                </div>
                <button
                  style={styles.exampleApplyBtn}
                  onClick={(event) => {
                    handleApply(examplePlayway, event.currentTarget);
                    setExamplePlaywayId(null);
                  }}
                >
                  套用这个模板
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
    border: 'none',
    boxShadow: 'none',
    overflow: 'hidden',
  },
  header: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 14,
    padding: '2px 2px 0',
  },
  eyebrow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--agent-primary-text)',
    fontSize: 20,
    fontWeight: 900,
    marginBottom: 0,
    cursor: 'default',
    userSelect: 'none',
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
  filterPanel: {
    position: 'relative',
    zIndex: 2,
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
    borderRadius: 10,
    border: '1px solid #CBD5E1',
    borderColor: '#CBD5E1',
    background: '#F8FAFC',
    color: '#475569',
    fontSize: 13,
    fontWeight: 850,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    outline: 'none',
    transition: 'border-color 0.15s, color 0.15s, background 0.15s, box-shadow 0.15s',
  },
  featuredTabIcon: {
    fontSize: 15,
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 15,
  },
  filterButtonHover: {
    background: '#F6FCFF',
    borderColor: '#BFE9F5',
    color: 'var(--agent-primary-text)',
    boxShadow: '0 4px 10px rgba(14, 165, 233, 0.08)',
  },
  tabActive: {
    borderColor: '#BFE9F5',
    background: '#F1FAFF',
    color: 'var(--agent-primary-text)',
    fontWeight: 700,
    boxShadow: 'none',
  },
  subNavWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    padding: 4,
    borderRadius: 10,
    background: 'rgba(255, 255, 255, 0.68)',
    border: '1px solid var(--agent-border)',
    overflow: 'visible',
  },
  subNavPointer: {
    position: 'absolute',
    top: -6,
    left: 78,
    width: 12,
    height: 12,
    transform: 'rotate(45deg)',
    display: 'none',
  },
  subNav: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
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
    padding: '0 12px',
    borderRadius: 10,
    border: '1px solid #CBD5E1',
    borderColor: '#CBD5E1',
    background: '#F8FAFC',
    color: '#475569',
    fontSize: 12,
    fontWeight: 850,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    outline: 'none',
    transition: 'border-color 0.15s, color 0.15s, background 0.15s, box-shadow 0.15s',
  },
  subNavPillActive: {
    background: '#F1FAFF',
    borderColor: '#BFE9F5',
    color: 'var(--agent-primary-text)',
    fontWeight: 700,
    boxShadow: 'none',
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
    borderColor: 'var(--agent-border)',
    background: '#FFFFFF',
    boxShadow: '0 10px 24px rgba(37, 74, 120, 0.07)',
    overflow: 'hidden',
  },
  cloneCard: {
    minHeight: 198,
    borderRadius: 12,
    boxShadow: '0 8px 22px rgba(37, 74, 120, 0.065)',
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
    borderRadius: 8,
    background: 'var(--agent-soft-strong)',
    color: 'var(--agent-primary-text)',
    fontSize: 11,
    fontWeight: 900,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  cloneMetaLine: {
    minHeight: 20,
    color: '#64748B',
    fontSize: 12,
    fontWeight: 750,
    lineHeight: 1.45,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cloneTagLine: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    minHeight: 25,
    marginTop: 7,
    overflow: 'hidden',
  },
  cloneTinyTag: {
    display: 'inline-flex',
    alignItems: 'center',
    maxWidth: 74,
    height: 22,
    padding: '0 7px',
    borderRadius: 7,
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    color: '#475569',
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  description: {
    margin: 0,
    color: '#334155',
    fontSize: 12,
    lineHeight: 1.4,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 6,
    minHeight: 34,
    maxHeight: 34,
    overflow: 'hidden',
  },
  descriptionIcon: {
    color: 'var(--agent-primary-text)',
  },
  descriptionIconBox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
    background: '#F1FAFF',
    border: '1px solid #BFE9F5',
    boxShadow: '0 3px 8px rgba(14, 165, 233, 0.08)',
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
    borderRadius: 10,
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
    borderRadius: 10,
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
  clonePreviewOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 20000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    background: 'rgba(15, 23, 42, 0.30)',
    backdropFilter: 'blur(8px)',
  },
  cloneDrawer: {
    width: 'min(1240px, calc(100vw - 40px))',
    maxHeight: 'calc(100vh - 40px)',
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: 18,
    border: '1px solid rgba(255, 255, 255, 0.76)',
    background: '#FFFFFF',
    boxShadow: '0 28px 80px rgba(15, 23, 42, 0.22)',
  },
  cloneDrawerHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    padding: '16px 18px 13px',
    borderBottom: '1px solid #E2E8F0',
    background: 'linear-gradient(180deg, #F8FDFF 0%, #FFFFFF 100%)',
  },
  cloneDrawerEyebrow: {
    marginBottom: 5,
    color: '#0F8FB2',
    fontSize: 12,
    fontWeight: 900,
    lineHeight: 1,
  },
  cloneDrawerTitle: {
    margin: 0,
    color: '#0F172A',
    fontSize: 18,
    fontWeight: 950,
    lineHeight: 1.25,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cloneDrawerBody: {
    display: 'grid',
    gridTemplateColumns: 'minmax(620px, 1fr) 330px',
    gap: 16,
    minHeight: 0,
    padding: 16,
    overflowY: 'auto',
    background: '#FFFFFF',
  },
  clonePreviewStage: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16 / 9',
    margin: 0,
    flexShrink: 0,
    overflow: 'hidden',
    borderRadius: 12,
    border: '1px solid #DDEAF0',
    background: '#000000',
    boxShadow: '0 14px 34px rgba(15, 23, 42, 0.14)',
  },
  clonePreviewImage: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cloneDetailPanel: {
    display: 'grid',
    alignContent: 'start',
    minWidth: 0,
    padding: '1px 0 4px',
    overflowY: 'auto',
  },
  cloneResourcePanel: {
    display: 'grid',
    gap: 11,
    padding: 12,
    borderRadius: 14,
    border: '1px solid #DCEAF2',
    background: 'linear-gradient(180deg, #F9FDFF 0%, #FFFFFF 46%)',
    boxShadow: '0 14px 34px rgba(37, 74, 120, 0.08)',
  },
  cloneHeroMeta: {
    display: 'grid',
    gap: 7,
    padding: '12px 12px 11px',
    borderRadius: 11,
    border: '1px solid #CFEAF7',
    background: 'linear-gradient(135deg, rgba(240, 251, 255, 0.96), rgba(245, 253, 250, 0.94))',
  },
  cloneDetailSection: {
    display: 'grid',
    gap: 8,
    padding: '10px 11px',
    borderRadius: 11,
    border: '1px solid #E2EAF1',
    background: '#FFFFFF',
  },
  cloneFieldLabel: {
    color: '#8DA0B3',
    fontSize: 12,
    fontWeight: 900,
    lineHeight: 1,
  },
  cloneMaterialValue: {
    display: 'inline-flex',
    alignItems: 'center',
    maxWidth: '100%',
    minWidth: 0,
    gap: 6,
  },
  cloneMaterialId: {
    display: 'inline-block',
    maxWidth: 'calc(100% - 30px)',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: '#13233A',
    fontSize: 13,
    fontWeight: 950,
    lineHeight: 1.4,
  },
  cloneOwnerPill: {
    minWidth: 0,
    width: 'fit-content',
    maxWidth: '100%',
    padding: '5px 9px',
    borderRadius: 999,
    border: '1px solid #BFE9F5',
    background: '#F0FBFF',
    color: '#0E7490',
    fontSize: 12,
    fontWeight: 900,
    lineHeight: 1.35,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cloneTagGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 7,
  },
  cloneContentTag: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 24,
    padding: '0 8px',
    borderRadius: 8,
    border: '1px solid #C7F3EE',
    background: '#F0FDFA',
    color: '#0F766E',
    fontSize: 12,
    fontWeight: 850,
    lineHeight: 1.2,
  },
  cloneKnowledgeTag: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 24,
    padding: '0 8px',
    borderRadius: 8,
    border: '1px solid #DFE9F2',
    background: '#F8FAFC',
    color: '#475569',
    fontSize: 12,
    fontWeight: 850,
    lineHeight: 1.2,
  },
  cloneAuditBox: {
    display: 'grid',
    gap: 8,
    padding: '10px 11px',
    borderRadius: 11,
    border: '1px solid #E2EAF1',
    background: '#F8FAFC',
  },
  cloneAuditRow: {
    display: 'grid',
    gridTemplateColumns: '38px minmax(0, 1fr)',
    gap: 10,
    alignItems: 'center',
    minHeight: 22,
    fontSize: 12,
    lineHeight: 1.45,
  },
  cloneAuditLabel: {
    color: '#8DA0B3',
    fontWeight: 900,
    textAlign: 'justify',
    textAlignLast: 'justify',
  },
  cloneAuditValue: {
    minWidth: 0,
    color: '#2F3B4A',
    fontWeight: 850,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  copyButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    marginLeft: 5,
    borderRadius: 6,
    border: '1px solid #DDEAF0',
    background: '#FFFFFF',
    color: '#64748B',
    cursor: 'pointer',
    verticalAlign: 'middle',
  },
  cloneDrawerFooter: {
    marginTop: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    padding: '13px 18px 16px',
    borderTop: '1px solid #E2E8F0',
    background: '#FFFFFF',
  },
  cloneSecondaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    padding: '0 16px',
    borderRadius: 10,
    border: '1px solid #CBD5E1',
    background: '#FFFFFF',
    color: '#475569',
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
  },
  clonePrimaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    padding: '0 18px',
    borderRadius: 10,
    border: 'none',
    background: 'var(--agent-action-gradient)',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 950,
    cursor: 'pointer',
    boxShadow: '0 10px 22px var(--agent-shadow)',
  },
  exampleDialog: {
    width: 'min(1180px, calc(100vw - 40px))',
    maxHeight: 'calc(100vh - 40px)',
    overflow: 'hidden',
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
    padding: '14px 18px 12px',
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
    fontSize: 20,
    fontWeight: 950,
    lineHeight: 1.2,
  },
  exampleSubtitle: {
    margin: '4px 0 0',
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
    gridTemplateColumns: 'minmax(0, 1.45fr) minmax(260px, 0.55fr)',
    alignItems: 'stretch',
    gap: 14,
    padding: 14,
  },
  examplePreviewShell: {
    position: 'relative',
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
    gap: 10,
    minWidth: 0,
    minHeight: 0,
    height: '100%',
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
    padding: 10,
    borderRadius: 12,
    background: '#FFFFFF',
    border: '1px solid var(--agent-border)',
  },
  exampleApplyBtn: {
    marginTop: 'auto',
    height: 38,
    borderRadius: 10,
    border: 'none',
    background: 'var(--agent-action-gradient)',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 950,
    cursor: 'pointer',
    boxShadow: '0 10px 22px rgba(255, 138, 0, 0.18)',
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
  loadMoreSentinel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    marginTop: 12,
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
    lineHeight: 1.4,
  },
  flowStep: {
    fontWeight: 700,
  },
  exampleText: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 1.5,
    overflow: 'hidden',
  },
  exampleTextParagraph: {
    margin: 0,
  },
  inspirationBlock: {
    position: 'relative',
    flex: '1 1 auto',
    minHeight: 132,
    background: '#F8FEFC',
    borderColor: 'rgba(20, 184, 166, 0.30)',
    boxShadow: '0 6px 14px rgba(15, 118, 110, 0.05)',
  },
  inspirationBlockLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    color: 'var(--agent-primary-text)',
    fontSize: 12,
    fontWeight: 950,
    marginBottom: 6,
  },
};
