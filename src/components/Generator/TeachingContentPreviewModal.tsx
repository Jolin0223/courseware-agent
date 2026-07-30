import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpenText, Database, Pause, Play, Presentation, Trash2, X } from 'lucide-react';
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
  onChange: (attachment: UploadedAttachment) => void;
  onRemove: (attachmentId: string) => void;
  onEdit: (attachment: UploadedAttachment) => void;
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

const updateSourceAfterRemoval = (source: TeachingContentSource, itemId: string | number): TeachingContentSource => {
  if (source.type === 'question-bank') {
    const questionItems = getQuestionItems(source).filter(item => item.id !== itemId);
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
    const wordItems = getWordItems(source).filter(item => item.id !== itemId);
    return {
      ...source,
      summary: source.summary.replace(/已选\s*\d+\s*个单词/, `已选 ${wordItems.length} 个单词`),
      itemCount: wordItems.length,
      items: wordItems.map(item => item.word),
      wordItems,
    };
  }

  const pageItems = getPageItems(source).filter(item => item.pageNumber !== itemId);
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
  onChange,
  onRemove,
  onEdit,
}: TeachingContentPreviewModalProps) {
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);
  const source = attachment?.teachingSource;

  const items = useMemo(() => {
    if (!source) return [];
    if (source.type === 'question-bank') return getQuestionItems(source);
    if (source.type === 'word-book') return getWordItems(source);
    return getPageItems(source);
  }, [source]);

  if (!attachment || !source) return null;

  const SourceIcon = source.type === 'question-bank' ? Database : source.type === 'word-book' ? BookOpenText : Presentation;
  const title = source.type === 'question-bank' ? '预览所选题目' : source.type === 'word-book' ? '预览所选单词' : '预览所选课件页面';

  const removeItem = (itemId: string | number) => {
    const nextSource = updateSourceAfterRemoval(source, itemId);
    if (!nextSource.itemCount) {
      onRemove(attachment.id);
      onClose();
      return;
    }
    onChange({ ...attachment, teachingSource: nextSource, name: nextSource.name });
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
    <div className="aug-modal-mask" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="aug-content-preview-modal" role="dialog" aria-modal="true">
        <header className="aug-modal-header">
          <div className="aug-content-preview-heading">
            <span><SourceIcon size={19} /></span>
            <div><h2>{title}</h2><p>{source.name} · {source.itemCount}{source.type === 'question-bank' ? '题' : source.type === 'word-book' ? '个单词' : '页'}</p></div>
          </div>
          <button type="button" className="aug-icon-button" onClick={onClose} aria-label="关闭"><X size={19} /></button>
        </header>

        <div className={`aug-content-preview-body aug-content-preview-${source.type}`}>
          {source.type === 'question-bank' && (items as TeachingQuestionItem[]).map((question, index) => (
            <article key={question.id} className="aug-preview-question-card">
              <div className="aug-preview-item-index">{index + 1}</div>
              <div className="aug-preview-question-main">
                <div className="aug-preview-meta"><span>{question.subject}</span><span>{question.type}</span><span>{question.level}</span><span>{question.knowledge}</span></div>
                <h3>{question.content}</h3>
                {question.options && <div className="aug-preview-options">{question.options.map((option, optionIndex) => <span key={option}>{String.fromCharCode(65 + optionIndex)}. {option}</span>)}</div>}
                {(question.answer || question.analysis) && <div className="aug-preview-answer"><b>答案：{question.answer || '暂无'}</b>{question.analysis && <p>解析：{question.analysis}</p>}</div>}
              </div>
              <button type="button" className="aug-preview-remove-item" onClick={() => removeItem(question.id)} aria-label={`移除第${index + 1}题`}><Trash2 size={15} /></button>
            </article>
          ))}

          {source.type === 'word-book' && <div className="aug-preview-word-grid">{(items as TeachingWordItem[]).map(word => (
            <article key={word.id} className="aug-preview-word-card">
              <div><h3>{word.word}</h3><span>{word.phonetic || '暂无音标'}</span><p>{word.meaning || '暂无释义'}</p></div>
              <div className="aug-preview-word-actions">
                {word.audioAvailable && <button type="button" onClick={() => toggleWordAudio(word.id)} aria-label={`${playingWordId === word.id ? '停止' : '试听'}${word.word}`}>{playingWordId === word.id ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}</button>}
                <button type="button" onClick={() => removeItem(word.id)} aria-label={`移除${word.word}`}><Trash2 size={15} /></button>
              </div>
            </article>
          ))}</div>}

          {source.type === 'cloud-pages' && <div className="aug-preview-page-grid">{(items as TeachingCloudPageItem[]).map(page => (
            <article key={page.pageNumber} className="aug-preview-page-card">
              <div className="aug-preview-page-thumb"><i>Weather</i><b>{page.title}</b><small>{page.subtitle}</small></div>
              <div className="aug-preview-page-footer"><span>原课件第 {page.pageNumber} 页</span><button type="button" onClick={() => removeItem(page.pageNumber)} aria-label={`移除第${page.pageNumber}页`}><Trash2 size={15} /></button></div>
            </article>
          ))}</div>}
        </div>

        <footer className="aug-modal-footer aug-content-preview-footer">
          <span>发送后将按当前选择读取内容</span>
          <div><button type="button" className="aug-button-secondary" onClick={() => onEdit(attachment)}>修改选择</button><button type="button" className="aug-button-primary" onClick={onClose}>完成</button></div>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
