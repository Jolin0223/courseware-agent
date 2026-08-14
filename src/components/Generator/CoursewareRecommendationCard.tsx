import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, CheckCircle2, Copy, PlayCircle, Sparkles, Target, X } from 'lucide-react';
import type { CoursewareRecommendation, CoursewareRecommendationMessage } from '../../types';
import './augustDemo.css';

interface CoursewareRecommendationCardProps {
  data: CoursewareRecommendationMessage;
  readOnly?: boolean;
  onChoose: (recommendationId?: string) => void;
}

export default function CoursewareRecommendationCard({ data, readOnly, onChoose }: CoursewareRecommendationCardProps) {
  const [previewRecommendation, setPreviewRecommendation] = useState<CoursewareRecommendation | null>(null);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [copiedMaterialId, setCopiedMaterialId] = useState(false);
  const locked = readOnly || Boolean(data.action);

  useEffect(() => {
    setPreviewLoaded(false);
    setCopiedMaterialId(false);
  }, [previewRecommendation?.id]);

  const copyMaterialId = async (materialId: string) => {
    await navigator.clipboard.writeText(materialId);
    setCopiedMaterialId(true);
    window.setTimeout(() => setCopiedMaterialId(false), 1500);
  };

  return (
    <>
      <section className={`aug-recommendation-card ${locked ? 'is-readonly' : ''}`}>
        <header>
          <div>
            <div className="aug-rec-heading"><span><Sparkles size={15} /></span><h3>为你推荐</h3></div>
            <p>按本次需求的有效标签统一筛选</p>
          </div>
          <span className="aug-rec-count">{data.recommendations.length} 个可用课件</span>
        </header>

        <div className="aug-recommendation-grid">
          {data.recommendations.slice(0, 6).map(recommendation => (
            <article key={recommendation.id} className={data.selectedRecommendationId === recommendation.id ? 'is-selected' : ''}>
              <div className="aug-rec-cover">
                {recommendation.thumbnail ? <img src={recommendation.thumbnail} alt={`${recommendation.title}封面`} /> : <div className="aug-rec-cover-fallback">{recommendation.subject}</div>}
              </div>
              <div className="aug-rec-body">
                <small className="aug-rec-meta">{recommendation.subject} · {recommendation.grade}{recommendation.author ? ` · ${recommendation.author}` : ''}</small>
                <h4>{recommendation.title}</h4>
                <div className="aug-rec-match-points" aria-label="本次需求匹配点">
                  {(recommendation.matchPoints || []).slice(0, 3).map(point => (
                    <span key={`${point.dimension}-${point.label}`}>
                      <Target size={11} />
                      <b>{point.dimension}</b>
                      <em>{point.label}</em>
                    </span>
                  ))}
                </div>
                <div className="aug-rec-actions">
                  <button className="aug-rec-preview" disabled={!recommendation.previewUrl} onClick={() => setPreviewRecommendation(recommendation)}><PlayCircle size={15} />预览课件</button>
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

      {previewRecommendation && createPortal(
        <div className="aug-resource-preview-mask" onMouseDown={event => { if (event.target === event.currentTarget) setPreviewRecommendation(null); }}>
          <aside className="aug-resource-preview-drawer" role="dialog" aria-modal="true" aria-label={`${previewRecommendation.title}课件预览`}>
            <header>
              <div>
                <small>互动课件资源</small>
                <h3>{previewRecommendation.title}</h3>
              </div>
              <button type="button" aria-label="关闭课件预览" onClick={() => setPreviewRecommendation(null)}><X size={18} /></button>
            </header>

            <div className="aug-resource-preview-body">
              <div className="aug-resource-preview-stage">
                {previewRecommendation.previewUrl ? (
                  <>
                    <iframe
                      title={`${previewRecommendation.title}试玩`}
                      sandbox="allow-scripts allow-same-origin"
                      src={previewRecommendation.previewUrl}
                      onLoad={() => setPreviewLoaded(true)}
                    />
                    {!previewLoaded && <div className="aug-resource-preview-loading">正在加载课件</div>}
                  </>
                ) : previewRecommendation.thumbnail ? (
                  <img src={previewRecommendation.thumbnail} alt={`${previewRecommendation.title}封面`} />
                ) : (
                  <div className="aug-resource-preview-empty">该课件暂未配置试玩</div>
                )}
              </div>

              <div className="aug-resource-preview-details">
                <section>
                  <small>素材ID</small>
                  <div className="aug-resource-id-row">
                    <code>{previewRecommendation.materialId || previewRecommendation.id}</code>
                    <button type="button" aria-label="复制素材ID" onClick={() => copyMaterialId(previewRecommendation.materialId || previewRecommendation.id)}>
                      {copiedMaterialId ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </section>

                <section>
                  <small>资源归属</small>
                  <strong>{previewRecommendation.resourceOwner || '当前账号可见资源'}</strong>
                </section>

                {(previewRecommendation.matchPoints || []).length > 0 && (
                  <section>
                    <small>本次匹配点</small>
                    <div className="aug-resource-match-list">
                      {(previewRecommendation.matchPoints || []).map(point => (
                        <span key={`${point.dimension}-${point.label}`}><b>{point.dimension}</b>{point.label}</span>
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  <small>内容标签</small>
                  <div className="aug-resource-tag-list">
                    {(previewRecommendation.contentTags || []).map(tag => <span key={tag}>{tag}</span>)}
                  </div>
                </section>

                <section>
                  <small>知识点</small>
                  <div className="aug-resource-tag-list is-knowledge">
                    {(previewRecommendation.knowledgePoints || []).map(point => <span key={point}>{point}</span>)}
                  </div>
                </section>

                {previewRecommendation.author && (
                  <section className="aug-resource-author">
                    <small>上传者</small>
                    <span>{previewRecommendation.author}</span>
                  </section>
                )}
              </div>
            </div>

            <footer>
              <button type="button" className="is-secondary" onClick={() => setPreviewRecommendation(null)}>关闭</button>
              <button
                type="button"
                className="is-primary"
                disabled={locked}
                onClick={() => {
                  onChoose(previewRecommendation.id);
                  setPreviewRecommendation(null);
                }}
              >
                <Copy size={14} />一键同款
              </button>
            </footer>
          </aside>
        </div>,
        document.body,
      )}
    </>
  );
}
