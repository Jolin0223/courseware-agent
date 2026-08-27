import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpenText, Check, ChevronDown, ChevronUp, Database, Pause, Play, Plus, Presentation, Trash2, Video, X } from 'lucide-react';
import type {
  TeachingCloudPageItem,
  TeachingContentSource,
  TeachingQuestionItem,
  TeachingWordItem,
  UploadedAttachment,
} from '../../types';
import './augustDemo.css';

interface TeachingContentPreviewModalProps {
  attachment: UploadedAttachment | null;
  onClose: () => void;
  readOnly?: boolean;
  onChange?: (attachment: UploadedAttachment) => void;
  onRemove?: (attachmentId: string) => void;
  onAdd?: (attachment: UploadedAttachment) => void;
}

const getQuestionItems = (source: TeachingContentSource): TeachingQuestionItem[] => (
  source.questionItems || (source.items || []).map((content, index) => ({
    id: `${source.id}-question-${index}`,
    subject: '数学',
    type: '题目',
    level: '未标注',
    knowledge: '未标注',
    content,
  }))
);

const getWordItems = (source: TeachingContentSource): TeachingWordItem[] => (
  source.wordItems || (source.items || []).map(word => ({ id: word, word }))
);

const getPageItems = (source: TeachingContentSource): TeachingCloudPageItem[] => (
  source.pageItems || (source.pageNumbers || []).map(pageNumber => ({
    pageNumber,
    title: pageNumber === 1 ? 'Unit Review' : pageNumber % 3 === 0 ? 'Ask and answer' : 'rainy · cloudy',
    subtitle: pageNumber % 2 === 0 ? 'sunny · windy' : 'listen · choose',
  }))
);

const updateSourceAfterRemoval = (source: TeachingContentSource, itemIds: Set<string | number>): TeachingContentSource => {
  if (source.type === 'question-bank') {
    const questionItems = getQuestionItems(source).filter(item => !itemIds.has(item.id));
    const subjects = Array.from(new Set(questionItems.map(item => item.subject))).join('、');
    const knowledge = questionItems.map(item => item.knowledge).filter((item, index, all) => all.indexOf(item) === index).slice(0, 2).join('、');
    return {
      ...source,
      name: `${subjects || '学科'}题库 · ${questionItems.length}题`,
      summary: `小学 · ${knowledge || '已选题目'} · 已选 ${questionItems.length} 题`,
      itemCount: questionItems.length,
      items: questionItems.map(item => item.content),
      questionItems,
    };
  }

  if (source.type === 'word-book') {
    const wordItems = getWordItems(source).filter(item => !itemIds.has(item.id));
    return {
      ...source,
      summary: source.summary.replace(/已选\s*\d+\s*个单词/, `已选 ${wordItems.length} 个单词`),
      itemCount: wordItems.length,
      items: wordItems.map(item => item.word),
      wordItems,
    };
  }

  const pageItems = getPageItems(source).filter(item => !itemIds.has(item.pageNumber));
  const pageNumbers = pageItems.map(item => item.pageNumber).sort((a, b) => a - b);
  return {
    ...source,
    summary: `已选第 ${pageNumbers.join('、')} 页，共 ${pageNumbers.length} 页`,
    itemCount: pageNumbers.length,
    pageNumbers,
    pageItems,
  };
};

export default function TeachingContentPreviewModal({
  attachment,
  onClose,
  readOnly = false,
  onChange,
  onRemove,
  onAdd,
}: TeachingContentPreviewModalProps) {
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string | number>>(new Set());
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Set<string>>(new Set());
  const [activeAnalysisVideo, setActiveAnalysisVideo] = useState<TeachingQuestionItem | null>(null);
  const source = attachment?.teachingSource;
  const closeModal = useCallback(() => {
    setSelectedItemIds(new Set());
    setExpandedQuestionIds(new Set());
    setActiveAnalysisVideo(null);
    onClose();
  }, [onClose]);

  const items = useMemo(() => {
    if (!source) return [];
    if (source.type === 'question-bank') return getQuestionItems(source);
    if (source.type === 'word-book') return getWordItems(source);
    return getPageItems(source);
  }, [source]);

  useEffect(() => {
    if (!attachment) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (activeAnalysisVideo) setActiveAnalysisVideo(null);
      else closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeAnalysisVideo, attachment, closeModal]);

  if (!attachment || !source) return null;

  const SourceIcon = source.type === 'question-bank' ? Database : source.type === 'word-book' ? BookOpenText : Presentation;
  const title = source.type === 'question-bank' ? '已选题目' : source.type === 'word-book' ? '已选单词' : '已选课件页面';
  const addLabel = source.type === 'question-bank' ? '继续添加题目' : source.type === 'word-book' ? '继续添加单词' : '继续添加页面';
  const countUnit = source.type === 'question-bank' ? '题' : source.type === 'word-book' ? '个单词' : '页';

  const removeItems = (itemIds: Set<string | number>) => {
    if (readOnly || !onChange || !onRemove) return;
    const nextSource = updateSourceAfterRemoval(source, itemIds);
    if (!nextSource.itemCount) {
      onRemove(attachment.id);
      closeModal();
      return;
    }
    onChange({ ...attachment, teachingSource: nextSource, name: nextSource.name });
  };

  const toggleItemSelection = (itemId: string | number) => {
    setSelectedItemIds(previous => {
      const next = new Set(previous);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const itemIds: Array<string | number> = source.type === 'question-bank'
    ? (items as TeachingQuestionItem[]).map(item => item.id)
    : source.type === 'word-book'
      ? (items as TeachingWordItem[]).map(item => item.id)
      : (items as TeachingCloudPageItem[]).map(item => item.pageNumber);
  const allItemsSelected = itemIds.length > 0 && itemIds.every(itemId => selectedItemIds.has(itemId));
  const pageItems = source.type === 'cloud-pages' ? items as TeachingCloudPageItem[] : [];
  const selectionHint = source.type === 'question-bank'
    ? '勾选一题或多题后删除'
    : source.type === 'word-book'
      ? '勾选一个或多个单词后删除'
      : '勾选一页或多页后删除';

  const toggleQuestionAnalysis = (questionId: string) => {
    setExpandedQuestionIds(previous => {
      const next = new Set(previous);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const toggleWordAudio = (wordId: string) => {
    if (playingWordId === wordId) {
      setPlayingWordId(null);
      window.speechSynthesis?.cancel();
      return;
    }
    setPlayingWordId(wordId);
    window.setTimeout(() => setPlayingWordId(current => current === wordId ? null : current), 1200);
  };

  return createPortal(
    <div className="aug-modal-mask" onMouseDown={event => { if (event.target === event.currentTarget) closeModal(); }}>
      <section className={`aug-content-preview-modal aug-content-preview-modal-${source.type} ${readOnly ? 'is-read-only' : ''}`} role="dialog" aria-modal="true" aria-labelledby="teaching-content-preview-title">
        <header className="aug-modal-header">
          <div className="aug-content-preview-heading">
            <span><SourceIcon size={19} /></span>
            <div><h2 id="teaching-content-preview-title">{title}</h2></div>
            {readOnly && <em className="aug-content-preview-state">已发送</em>}
          </div>
          <button type="button" className="aug-icon-button" onClick={closeModal} aria-label="关闭"><X size={19} /></button>
        </header>

        <div className={`aug-content-preview-body aug-content-preview-${source.type}`}>
          {!readOnly && <div className="aug-preview-selection-toolbar">
            <span>{selectionHint}</span>
            <div>
              <button type="button" className="aug-preview-select-all" onClick={() => setSelectedItemIds(allItemsSelected ? new Set() : new Set(itemIds))}>{allItemsSelected ? '取消全选' : '全选'}</button>
              <button type="button" className="aug-preview-batch-delete" disabled={selectedItemIds.size === 0} onClick={() => {
                removeItems(selectedItemIds);
                setSelectedItemIds(new Set());
              }}><Trash2 size={14} />删除所选{selectedItemIds.size > 0 ? `（${selectedItemIds.size}）` : ''}</button>
            </div>
          </div>}

          {source.type === 'question-bank' && (items as TeachingQuestionItem[]).map((question, index) => {
            const selected = selectedItemIds.has(question.id);
            const expanded = expandedQuestionIds.has(question.id);
            return (
              <article key={question.id} className={`aug-preview-question-card ${selected ? 'is-selected' : ''}`}>
                {!readOnly && <button type="button" className="aug-preview-item-select" aria-label={`${selected ? '取消选择' : '选择'}第${index + 1}题`} aria-pressed={selected} onClick={() => toggleItemSelection(question.id)}>
                  <span className="aug-preview-item-check">{selected && <Check size={13} />}</span>
                </button>}
                <div className="aug-preview-question-main">
                  <div className="aug-preview-question-meta-row">
                    <div className="aug-preview-question-meta"><span className="is-level">{question.level}</span><span className="is-type">{question.type}</span><small>来源：{question.source || '暂无'}</small></div>
                    <span className="aug-preview-knowledge-tag">{question.knowledge || '暂无知识点'}</span>
                  </div>
                  <div className="aug-preview-question-content"><span>{index + 1}</span><h3>{question.content}</h3></div>
                  {question.options && <div className="aug-preview-options">{question.options.map((option, optionIndex) => <span key={option}>{String.fromCharCode(65 + optionIndex)}. {option}</span>)}</div>}
                  <button type="button" className="aug-preview-analysis-toggle" aria-expanded={expanded} onClick={() => toggleQuestionAnalysis(question.id)}>
                    {expanded ? '收起解析' : '展开解析'}{expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  {expanded && <section className="aug-preview-analysis-details" aria-label={`第${index + 1}题解析`}>
                    <div className="aug-preview-analysis-answer"><span>答案</span><strong>{question.answer || '暂无'}</strong></div>
                    <div className="aug-preview-analysis-explanation"><span>解析</span><p>{question.analysis || '暂无'}</p></div>
                    <div className="aug-preview-analysis-support">
                      <div><span>知识图谱</span><p>{question.knowledgeGraph || '暂无'}</p></div>
                      <div><span>题目ID</span><code>{question.id || '暂无'}</code></div>
                    </div>
                    <div className="aug-preview-analysis-video">
                      <span>解析视频</span>
                      {question.analysisVideoUrl ? <button type="button" onClick={() => setActiveAnalysisVideo(question)} aria-label={`播放${question.analysisVideoTitle || '题目解析视频'}`}>
                        <span className="aug-preview-analysis-video-thumb"><Play size={20} fill="currentColor" /><small>{question.analysisVideoDuration || '视频'}</small></span>
                        <span className="aug-preview-analysis-video-copy"><b>{question.analysisVideoTitle || '题目解析视频'}</b><small>点击播放视频讲解</small></span>
                      </button> : <span className="aug-preview-analysis-empty">暂无</span>}
                    </div>
                  </section>}
                </div>
              </article>
            );
          })}

          {source.type === 'word-book' && <div className="aug-preview-word-grid">{(items as TeachingWordItem[]).map(word => {
            const selected = selectedItemIds.has(word.id);
            return (
            <article key={word.id} className={`aug-preview-word-card ${selected ? 'is-selected' : ''}`}>
              {!readOnly && <button type="button" className="aug-preview-item-select" aria-label={`${selected ? '取消选择' : '选择'}${word.word}`} aria-pressed={selected} onClick={() => toggleItemSelection(word.id)}>
                <span className="aug-preview-item-check">{selected && <Check size={13} />}</span>
              </button>}
              <div><h3>{word.word}</h3><span>{word.phonetic || '暂无音标'}</span><p>{word.meaning || '暂无释义'}</p></div>
              <div className="aug-preview-word-actions">
                {word.audioAvailable && <button type="button" onClick={() => toggleWordAudio(word.id)} aria-label={`${playingWordId === word.id ? '停止' : '试听'}${word.word}`}>{playingWordId === word.id ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}</button>}
              </div>
            </article>
            );
          })}</div>}

          {source.type === 'cloud-pages' && <>
            <div className="aug-preview-page-grid">{pageItems.map(page => {
              const selected = selectedItemIds.has(page.pageNumber);
              const pageContent = <>
                <span className="aug-preview-page-thumb"><i>Weather</i><b>{page.title}</b><small>{page.subtitle}</small></span>
                <span className="aug-preview-page-footer">原课件第 {page.pageNumber} 页</span>
              </>;
              return (
                <article key={page.pageNumber} className={`aug-preview-page-card ${selected ? 'is-selected' : ''}`}>
                  {readOnly ? <div className="aug-preview-page-select">{pageContent}</div> : <button type="button" className="aug-preview-page-select" aria-pressed={selected} onClick={() => toggleItemSelection(page.pageNumber)}>
                    <span className="aug-preview-page-check">{selected && <Check size={13} />}</span>
                    {pageContent}
                  </button>}
                </article>
              );
            })}</div>
          </>}
        </div>

        <footer className="aug-modal-footer aug-content-preview-footer">
          <span>{readOnly ? `本次已提交 ${source.itemCount}${countUnit}，仅支持查看` : `发送后将按当前保留的 ${source.itemCount}${countUnit}读取内容`}</span>
          <div>{!readOnly && onAdd && <button type="button" className="aug-button-secondary aug-content-add-button" onClick={() => {
            setSelectedItemIds(new Set());
            setExpandedQuestionIds(new Set());
            onAdd(attachment);
          }}><Plus size={15} />{addLabel}</button>}<button type="button" className="aug-button-primary" onClick={closeModal}>{readOnly ? '关闭' : '完成'}</button></div>
        </footer>
      </section>
      {activeAnalysisVideo?.analysisVideoUrl && <div className="aug-analysis-video-mask" onMouseDown={event => { if (event.target === event.currentTarget) setActiveAnalysisVideo(null); }}>
        <section className="aug-analysis-video-modal" role="dialog" aria-modal="true" aria-labelledby="aug-analysis-video-title">
          <header>
            <div><span><Video size={18} /></span><div><h3 id="aug-analysis-video-title">{activeAnalysisVideo.analysisVideoTitle || '题目解析视频'}</h3><p>解析视频 · {activeAnalysisVideo.analysisVideoDuration || '时长暂无'}</p></div></div>
            <button type="button" className="aug-icon-button" onClick={() => setActiveAnalysisVideo(null)} aria-label="关闭解析视频"><X size={18} /></button>
          </header>
          <video src={activeAnalysisVideo.analysisVideoUrl} controls autoPlay playsInline aria-label={activeAnalysisVideo.analysisVideoTitle || '题目解析视频'} />
        </section>
      </div>}
    </div>,
    document.body,
  );
}
