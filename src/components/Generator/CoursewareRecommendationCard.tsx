import { useState } from 'react';
import { ArrowRight, CheckCircle2, Copy, PlayCircle, Sparkles } from 'lucide-react';
import type { CoursewareRecommendation, CoursewareRecommendationMessage } from '../../types';
import CoursewareResourcePreviewModal from './CoursewareResourcePreviewModal';
import './augustDemo.css';

interface CoursewareRecommendationCardProps {
  data: CoursewareRecommendationMessage;
  readOnly?: boolean;
  onChoose: (recommendationId?: string) => void;
  onPreview?: (recommendationId: string) => void;
}

const getResourceLocationLabel = (recommendation: CoursewareRecommendation) => {
  if (recommendation.resourceScope === 'group') return '集团资源库';
  if (recommendation.resourceScope === 'school') {
    const schoolName = recommendation.schoolName?.trim();
    return schoolName ? `校本资源库·${schoolName.replace(/学校$/, '分校')}` : '校本资源库';
  }
  return '个人资源库';
};

export default function CoursewareRecommendationCard({ data, readOnly, onChoose, onPreview }: CoursewareRecommendationCardProps) {
  const [previewRecommendation, setPreviewRecommendation] = useState<CoursewareRecommendation | null>(null);
  const locked = readOnly || Boolean(data.action);

  const openPreview = (recommendation: CoursewareRecommendation) => {
    setPreviewRecommendation(recommendation);
    onPreview?.(recommendation.id);
  };

  return (
    <>
      <section className={`aug-recommendation-card ${locked ? 'is-readonly' : ''}`}>
        <header>
          <div>
            <div className="aug-rec-heading"><span><Sparkles size={15} /></span><h3>为你推荐</h3></div>
          </div>
          <span className="aug-rec-count">推荐 {Math.min(data.recommendations.length, 6)} 个</span>
        </header>

        <div className="aug-recommendation-grid">
          {data.recommendations.slice(0, 6).map(recommendation => (
            <article key={recommendation.id} className={data.selectedRecommendationId === recommendation.id ? 'is-selected' : ''}>
              <div className="aug-rec-cover">
                {recommendation.thumbnail ? <img src={recommendation.thumbnail} alt={`${recommendation.title}封面`} /> : <div className="aug-rec-cover-fallback">{recommendation.subject}</div>}
              </div>
              <div className="aug-rec-body">
                <small className="aug-rec-meta">{recommendation.subject} · {recommendation.grade} · {getResourceLocationLabel(recommendation)}</small>
                <h4>{recommendation.title}</h4>
                <div className="aug-rec-actions">
                  <button className="aug-rec-preview" disabled={!recommendation.previewUrl} onClick={() => openPreview(recommendation)}><PlayCircle size={15} />预览课件</button>
                  <button className="aug-rec-clone" disabled={locked} onClick={() => onChoose(recommendation.id)}><Copy size={14} />一键同款</button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <footer>
          {data.action === 'clone' ? (
            <span>已选择「{data.recommendations.find(item => item.id === data.selectedRecommendationId)?.title}」，将创建一份新课件，原课件不受影响。</span>
          ) : data.action === 'iteach' ? (
            <span><CheckCircle2 size={14} />已打开 iTeach 中的「{data.recommendations.find(item => item.id === data.selectedRecommendationId)?.title}」</span>
          ) : data.action === 'used' ? (
            <span><CheckCircle2 size={14} />「{data.recommendations.find(item => item.id === data.selectedRecommendationId)?.title}」已在课件编辑器使用</span>
          ) : data.action === 'new' ? (
            <span>已跳过推荐，将按当前教学需求从头生成。</span>
          ) : (
            <button onClick={() => onChoose()} disabled={locked}>没有合适的，继续按当前需求新建 <ArrowRight size={15} /></button>
          )}
        </footer>
      </section>

      {previewRecommendation && (
        <CoursewareResourcePreviewModal
          key={previewRecommendation.id}
          resource={{
            id: previewRecommendation.id,
            title: previewRecommendation.title,
            previewUrl: previewRecommendation.previewUrl,
            coverUrl: previewRecommendation.thumbnail,
            materialId: previewRecommendation.materialId || previewRecommendation.id,
            resourceOwner: previewRecommendation.resourceOwner || '当前账号可见资源',
            contentTags: previewRecommendation.contentTags || [],
            knowledgePoints: previewRecommendation.knowledgePoints || [],
            uploader: previewRecommendation.author,
          }}
          cloneDisabled={locked}
          onClose={() => setPreviewRecommendation(null)}
          showIteachSearch
          onClone={() => {
            onChoose(previewRecommendation.id);
            setPreviewRecommendation(null);
          }}
        />
      )}
    </>
  );
}
