import { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CirclePlay,
  Clock3,
  Film,
  Info,
  Layers3,
  Loader2,
  PencilLine,
  Play,
  Sparkles,
  X,
} from 'lucide-react';
import type { TeachingVideoPlan, TeachingVideoProgress, TeachingVideoShot } from '../../types';
import './teachingVideo.css';

interface TeachingVideoPlanCardProps {
  plan: TeachingVideoPlan;
  onConfirm?: () => void;
}

const formatDuration = (seconds: number) => `00:${String(Math.round(seconds)).padStart(2, '0')}`;

const ShotVisual = ({ shot, compact = false, playable = false }: { shot: TeachingVideoShot; compact?: boolean; playable?: boolean }) => {
  if (playable && shot.videoAsset) {
    return (
      <div className="tv-shot-visual is-video">
        <video key={shot.videoAsset} src={shot.videoAsset} poster={shot.posterAsset} controls playsInline preload="metadata" />
      </div>
    );
  }

  if (shot.route === 'deterministic-animation') {
    const tensCount = shot.id === 'S04' ? 1 : 4;
    const onesCount = shot.id === 'S04' ? 4 : 1;
    return (
      <div className={`tv-shot-visual is-math${compact ? ' is-compact' : ''}`}>
        <div className="tv-math-table">
          <span className="tv-tens">{Array.from({ length: tensCount }, (_, index) => <i key={`ten-${index}`} />)}</span>
          <span className="tv-ones">{Array.from({ length: onesCount }, (_, index) => <i key={`one-${index}`} />)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`tv-shot-visual${compact ? ' is-compact' : ''}`}>
      {shot.videoAsset && !compact
        ? <video key={shot.videoAsset} src={shot.videoAsset} poster={shot.posterAsset} muted playsInline preload="metadata" />
        : <img src={shot.posterAsset || shot.referenceImage || '/video-demo/S01-reference-v1.png'} alt={`${shot.title}分镜画面`} />}
    </div>
  );
};

const getQaLabel = (shot: TeachingVideoShot) => {
  if (shot.generationUse === 'experiment-only') return '模型对照样片';
  if (shot.audioAsset && shot.qaStatus === 'pass') return '已配音成片';
  if (shot.qaStatus === 'pass') return '预览可用';
  if (shot.qaStatus === 'rejected') return '需要重生';
  return '需要复核';
};

const TeachingVideoPlanCard = ({ plan, onConfirm }: TeachingVideoPlanCardProps) => {
  const [selectedShotId, setSelectedShotId] = useState(plan.shots[0]?.id || '');
  const [promptOpen, setPromptOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);
  const selectedShot = useMemo(
    () => plan.shots.find(shot => shot.id === selectedShotId) || plan.shots[0],
    [plan.shots, selectedShotId],
  );
  const isConfirmed = plan.status === 'confirmed';

  if (!selectedShot) return null;

  return (
    <>
      <section className="tv-plan-card" aria-label="教学视频脚本与分镜">
        <header className="tv-card-header">
          <div className="tv-card-title">
            <span className="tv-card-icon"><Film size={18} /></span>
            <div>
              <div className="tv-title-line">
                <h2>教学视频脚本与分镜</h2>
                <span className={`tv-status ${isConfirmed ? 'is-confirmed' : ''}`}>
                  {isConfirmed ? <><Check size={12} /> 已确认</> : '待确认'}
                </span>
              </div>
              <p>{isConfirmed ? '角色分声线、逐句字幕与完整成片已生成。' : '视频是整份课件的讲解环节，确认后与互动练习一起生成。'}</p>
            </div>
          </div>
        </header>

        <div className="tv-course-structure" aria-label="课件结构">
          <span className="tv-structure-label">本次课件结构</span>
          <div className="tv-structure-flow">
            <span><i>1</i><b>情境导入</b><small>互动页面</small></span>
            <ChevronRight size={14} />
            <span className="is-current"><i>2</i><b>动画讲解</b><small>教学视频 · {plan.totalDurationSec}秒</small></span>
            <ChevronRight size={14} />
            <span><i>3</i><b>巩固练习</b><small>2 个互动任务</small></span>
          </div>
        </div>

        <div className="tv-summary-row">
          <span><Clock3 size={13} /> {plan.totalDurationSec} 秒</span>
          <span><Film size={13} /> {plan.shots.length} 个分镜</span>
          <span><Layers3 size={13} /> {plan.ratio}</span>
          <span><Sparkles size={13} /> 角色与音色统一</span>
          {plan.fullVideoAsset && (
            <button type="button" className="tv-full-preview-button" onClick={() => setFullPreviewOpen(true)}>
              <CirclePlay size={13} /> 预览完整成片
            </button>
          )}
        </div>

        <div className="tv-workspace">
          <div className="tv-shot-list" role="tablist" aria-label="视频分镜">
            {plan.shots.map((shot, index) => (
              <button
                key={shot.id}
                type="button"
                role="tab"
                aria-selected={shot.id === selectedShot.id}
                className={shot.id === selectedShot.id ? 'is-selected' : ''}
                onClick={() => {
                  setSelectedShotId(shot.id);
                  setPromptOpen(false);
                }}
              >
                <span className="tv-shot-number">{index + 1}</span>
                <span className="tv-shot-copy"><b>{shot.title}</b><small>{shot.purpose}</small></span>
                <span className={`tv-route ${shot.route === 'deterministic-animation' ? 'is-code' : ''}`}>
                  {shot.route === 'deterministic-animation' ? '精确动画' : 'AI画面'}
                </span>
                <time>{shot.durationSec}s</time>
              </button>
            ))}
          </div>

          <div className="tv-shot-detail">
            <button type="button" className="tv-preview-trigger" onClick={() => setPreviewOpen(true)}>
              <ShotVisual shot={selectedShot} />
              <span className="tv-preview-play"><Play size={18} fill="currentColor" /></span>
              <span className="tv-preview-duration">{formatDuration(selectedShot.durationSec)}</span>
            </button>
            <div className="tv-shot-detail-copy">
              <div className="tv-shot-detail-heading">
                <div><span>{selectedShot.id}</span><h3>{selectedShot.title}</h3></div>
                <button type="button" onClick={() => setPromptOpen(value => !value)}>
                  <PencilLine size={13} /> 编辑镜头 <ChevronDown size={13} className={promptOpen ? 'is-open' : ''} />
                </button>
              </div>
              {selectedShot.videoAsset && (
                <div className={`tv-real-result is-${selectedShot.qaStatus || 'needs-review'}`}>
                  <b>{getQaLabel(selectedShot)}</b>
                  <span>{selectedShot.qaNote}</span>
                </div>
              )}
              <dl>
                <div>
                  <dt>讲解词</dt>
                  <dd>
                    {selectedShot.cues?.length ? (
                      <span className="tv-script-lines">
                        {selectedShot.cues.map(cue => (
                          <span key={`${cue.startSec}-${cue.speaker}`}>
                            <i className={cue.kind === 'narration' ? 'is-narration' : ''}>{cue.speakerLabel}</i>
                            <span>{cue.text}</span>
                          </span>
                        ))}
                      </span>
                    ) : selectedShot.voiceover}
                  </dd>
                </div>
                <div><dt>画面文字</dt><dd>{selectedShot.overlay}</dd></div>
              </dl>
              {promptOpen && (
                <div className="tv-prompt-editor">
                  <label htmlFor={`tv-prompt-${selectedShot.id}`}>画面动作描述</label>
                  <textarea key={selectedShot.id} id={`tv-prompt-${selectedShot.id}`} defaultValue={selectedShot.visualPrompt} rows={5} />
                  <small>角色由基准图锁定；字幕与画面文字不交给视频模型生成。</small>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="tv-safety-note">
          <Info size={15} />
          <div><b>故事一致性与说话人控制</b><span>6 个镜头只使用原 3 页信息；画外讲解时人物闭嘴，对话时保留完整多人构图且仅当前说话人开口，男童、女童、温爷爷和讲解分别使用独立音色。</span></div>
        </div>

        <footer className="tv-card-footer">
          <div className="tv-card-actions">
            <button type="button" className="tv-secondary-button"><PencilLine size={15} /> 修改整体脚本</button>
            <button type="button" className="tv-primary-button" disabled={isConfirmed} onClick={onConfirm}>
              {isConfirmed ? <><Check size={15} /> 已确认视频脚本</> : <><CirclePlay size={16} /> 确认视频脚本并继续</>}
            </button>
          </div>
        </footer>
      </section>

      {previewOpen && (
        <div className="tv-preview-mask" role="presentation" onMouseDown={() => setPreviewOpen(false)}>
          <section className="tv-preview-modal" role="dialog" aria-modal="true" aria-label="教学视频分镜预览" onMouseDown={event => event.stopPropagation()}>
            <header>
              <div><span><Film size={17} /></span><div><h3>分镜预览</h3><p>{selectedShot.id} · {selectedShot.title}</p></div></div>
              <button type="button" aria-label="关闭预览" onClick={() => setPreviewOpen(false)}><X size={18} /></button>
            </header>
            <div className="tv-preview-stage">
              <ShotVisual shot={selectedShot} playable />
              {selectedShot.overlay && <div className="tv-deterministic-overlay"><b>{selectedShot.overlay}</b></div>}
            </div>
            <div className="tv-preview-timeline">
              {plan.shots.map(shot => (
                <button key={shot.id} type="button" className={shot.id === selectedShot.id ? 'is-selected' : ''} onClick={() => setSelectedShotId(shot.id)}>
                  <ShotVisual shot={shot} compact />
                  <span><b>{shot.id}</b><small>{shot.durationSec}s</small></span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {fullPreviewOpen && plan.fullVideoAsset && (
        <div className="tv-preview-mask" role="presentation" onMouseDown={() => setFullPreviewOpen(false)}>
          <section className="tv-preview-modal" role="dialog" aria-modal="true" aria-label="教学视频完整成片预览" onMouseDown={event => event.stopPropagation()}>
            <header>
              <div><span><Film size={17} /></span><div><h3>完整成片</h3><p>6 个分镜 · 角色独立配音 · {Math.round(plan.fullVideoDurationSec || plan.totalDurationSec)} 秒</p></div></div>
              <button type="button" aria-label="关闭完整成片预览" onClick={() => setFullPreviewOpen(false)}><X size={18} /></button>
            </header>
            <div className="tv-preview-stage">
              <video className="tv-full-video" src={plan.fullVideoAsset} poster={plan.fullVideoPosterAsset} controls autoPlay playsInline preload="metadata" />
            </div>
            <div className="tv-full-preview-note">
              <CheckCircle2 size={15} />
              <span>字幕只显示台词；旁白段人物保持闭嘴，对话段由当前说话人自然开口。</span>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export const TeachingVideoProgressCard = ({ progress }: { progress: TeachingVideoProgress }) => (
  <section className="tv-progress-card" aria-label="教学视频生成进度">
    <header>
      <span className="tv-card-icon"><Film size={18} /></span>
      <div><h2>{progress.title}</h2><p>{progress.summary}</p></div>
      <span className="tv-demo-badge">流程演示</span>
    </header>
    <div className="tv-progress-list">
      {progress.stages.map((stage, index) => (
        <div key={stage.id} className={`is-${stage.status}`}>
          <span className="tv-progress-icon">
            {stage.status === 'completed' ? <CheckCircle2 size={17} /> : stage.status === 'in-progress' ? <Loader2 size={17} /> : index + 1}
          </span>
          <span className="tv-progress-copy"><b>{stage.title}</b><small>{stage.detail}</small></span>
          <span className="tv-progress-status">
            {stage.status === 'completed' ? '已完成' : stage.status === 'ready' ? '待提交' : stage.status === 'in-progress' ? '生成中' : stage.status === 'failed' ? '需处理' : '等待中'}
          </span>
        </div>
      ))}
    </div>
  </section>
);

export default TeachingVideoPlanCard;
