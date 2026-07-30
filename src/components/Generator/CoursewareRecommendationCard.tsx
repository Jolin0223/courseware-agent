import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Copy, PlayCircle, Route, Sparkles, X } from 'lucide-react';
import type { CoursewareRecommendationMessage } from '../../types';
import './augustDemo.css';

interface CoursewareRecommendationCardProps {
  data: CoursewareRecommendationMessage;
  readOnly?: boolean;
  onChoose: (recommendationId?: string) => void;
}

export default function CoursewareRecommendationCard({ data, readOnly, onChoose }: CoursewareRecommendationCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const locked = readOnly || Boolean(data.action);

  return (
    <>
      <section className={`aug-recommendation-card ${locked ? 'is-readonly' : ''}`}>
        <header>
          <div>
            <div className="aug-rec-heading"><span><Sparkles size={15} /></span><h3>相似课件推荐</h3></div>
            <p>已从你可见的课件中筛选，优先展示与当前需求最接近的结果</p>
          </div>
          <span className="aug-rec-count">{data.recommendations.length} 个结果</span>
        </header>

        <div className="aug-recommendation-grid">
          {data.recommendations.slice(0, 3).map(recommendation => (
            <article key={recommendation.id} className={data.selectedRecommendationId === recommendation.id ? 'is-selected' : ''}>
              <div className="aug-rec-cover">
                {recommendation.thumbnail ? <img src={recommendation.thumbnail} alt={`${recommendation.title}封面`} /> : <div className="aug-rec-cover-fallback">{recommendation.subject}</div>}
                <span>{recommendation.badge}</span>
              </div>
              <div className="aug-rec-body">
                <small className="aug-rec-meta">{recommendation.subject} · {recommendation.grade}{recommendation.author ? ` · ${recommendation.author}` : ''}</small>
                <h4>{recommendation.title}</h4>
                <p>{recommendation.reason}</p>
                <div className="aug-rec-flow" aria-label={`课堂流程：${recommendation.flow.join('，')}`}><Route size={13} /><span>{recommendation.flow.join(' → ')}</span></div>
                <div className="aug-rec-actions">
                  <button className="aug-rec-preview" disabled={!recommendation.previewUrl} onClick={() => { setPreviewTitle(recommendation.title); setPreviewUrl(recommendation.previewUrl || null); }}><PlayCircle size={15} />预览课件</button>
                  <button className="aug-rec-clone" disabled={locked} onClick={() => onChoose(recommendation.id)}><Copy size={14} />一键同款</button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <footer>
          {data.action === 'clone' ? (
            <span>已选择「{data.recommendations.find(item => item.id === data.selectedRecommendationId)?.title}」，将创建一份新课件，原课件不受影响。</span>
          ) : data.action === 'new' ? (
            <span>已跳过推荐，将按当前教学需求从头生成。</span>
          ) : (
            <button onClick={() => onChoose()} disabled={locked}>没有合适的，继续按当前需求新建 <ArrowRight size={15} /></button>
          )}
        </footer>
      </section>

      {previewUrl && createPortal(
        <div className="aug-modal-mask aug-preview-mask" onMouseDown={event => { if (event.target === event.currentTarget) setPreviewUrl(null); }}>
          <section className="aug-courseware-preview" role="dialog" aria-modal="true">
            <header><div><b>{previewTitle}</b><span>完整课件预览</span></div><button className="aug-icon-button" onClick={() => setPreviewUrl(null)} aria-label="关闭"><X size={19} /></button></header>
            <div className="aug-courseware-preview-stage">
              <iframe src={previewUrl} title={`${previewTitle}预览`} />
            </div>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
