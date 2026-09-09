import { useState } from 'react';
import { ArrowRight, BookOpenText, CheckCircle2, Copy, PlayCircle, RefreshCw, Sparkles } from 'lucide-react';
import type {
  CoursewareRecommendation,
  CoursewareRecommendationMessage,
  CoursewareRecommendationTier,
} from '../../types';
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

const tierPriority: Record<CoursewareRecommendationTier, number> = {
  direct_use: 1,
  knowledge_match: 2,
  gameplay_reuse: 3,
};

const tierLabels: Record<CoursewareRecommendationTier, string> = {
  direct_use: '知识点和玩法均相似',
  knowledge_match: '知识点相似',
  gameplay_reuse: '交互玩法相似',
};

const tierReasons: Record<CoursewareRecommendationTier, string> = {
  direct_use: '知识点和玩法都符合当前需求，可直接使用',
  knowledge_match: '知识点相近，玩法未完全命中，可先预览',
  gameplay_reuse: '交互玩法相近，可同款后替换知识点',
};

const fallbackTierReason = '综合考虑课件内容与互动设计，为你推荐此课件';

const tierIcons = {
  direct_use: CheckCircle2,
  knowledge_match: BookOpenText,
  gameplay_reuse: RefreshCw,
};

const gameplayRequirementPattern = /玩法|游戏|点击|拖拽|拖动|连线|配对|排序|闯关|消除|竞速|探索|转盘|拼图|抢答|录音|跟读|滑动|选择题|填空题|匹配题|排序题|判断题|问答题|自动判题|答错反馈|奖励|计分|倒计时/i;

const getRecommendationTier = (
  recommendation: CoursewareRecommendation,
  userRequirement: string,
): CoursewareRecommendationTier | undefined => {
  if (recommendation.recommendationTier && recommendation.recommendationTier in tierPriority) {
    return recommendation.recommendationTier;
  }

  const dimensions = new Set(recommendation.matchPoints?.map(point => point.dimension) || []);
  const hasKnowledgeMatch = dimensions.has('知识点');
  const hasStructureMatch = ['题型', '交互机制', '玩法机制', '互动能力']
    .some(dimension => dimensions.has(dimension as NonNullable<CoursewareRecommendation['matchPoints']>[number]['dimension']));
  const hasExplicitGameplayRequirement = gameplayRequirementPattern.test(userRequirement);

  if (hasKnowledgeMatch && (!hasExplicitGameplayRequirement || hasStructureMatch)) return 'direct_use';
  if (hasKnowledgeMatch) return 'knowledge_match';
  if (hasStructureMatch) return 'gameplay_reuse';
  return undefined;
};

export default function CoursewareRecommendationCard({ data, readOnly, onChoose, onPreview }: CoursewareRecommendationCardProps) {
  const [previewRecommendation, setPreviewRecommendation] = useState<CoursewareRecommendation | null>(null);
  const locked = readOnly || Boolean(data.action);
  const userRequirement = data.originalUserRequirement || data.promptForFramework;
  const displayedRecommendations = data.recommendations
    .map((recommendation, sourceIndex) => ({
      recommendation,
      sourceIndex,
      tier: getRecommendationTier(recommendation, userRequirement),
    }))
    .sort((left, right) => {
      const leftPriority = left.tier ? tierPriority[left.tier] : Number.MAX_SAFE_INTEGER;
      const rightPriority = right.tier ? tierPriority[right.tier] : Number.MAX_SAFE_INTEGER;
      return leftPriority - rightPriority || left.sourceIndex - right.sourceIndex;
    })
    .slice(0, 6);

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
          {displayedRecommendations.map(({ recommendation, tier }) => {
            const TierIcon = tier ? tierIcons[tier] : null;
            const tierReason = tier ? tierReasons[tier] : fallbackTierReason;

            return (
              <article key={recommendation.id} className={data.selectedRecommendationId === recommendation.id ? 'is-selected' : ''}>
                <div className="aug-rec-cover">
                  {recommendation.thumbnail ? <img src={recommendation.thumbnail} alt={`${recommendation.title}封面`} /> : <div className="aug-rec-cover-fallback">{recommendation.subject}</div>}
                  {tier && TierIcon && (
                    <span className={`aug-rec-tier aug-rec-tier-${tier}`}><TierIcon size={12} strokeWidth={2.4} />{tierLabels[tier]}</span>
                  )}
                </div>
                <div className="aug-rec-body">
                  <small className="aug-rec-meta">{recommendation.subject} · {recommendation.grade} · {getResourceLocationLabel(recommendation)}</small>
                  <h4>{recommendation.title}</h4>
                  <div className="aug-rec-evidence">
                    <span>推荐理由</span>
                    <p>{tierReason}</p>
                  </div>
                  <div className="aug-rec-actions">
                    <button className="aug-rec-preview" disabled={!recommendation.previewUrl} onClick={() => openPreview(recommendation)}><PlayCircle size={15} />预览课件</button>
                    <button className="aug-rec-clone" disabled={locked} onClick={() => onChoose(recommendation.id)}><Copy size={14} />一键同款</button>
                  </div>
                </div>
              </article>
            );
          })}
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
