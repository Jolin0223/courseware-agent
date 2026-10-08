export interface PreviewAnnotation {
  id: number;
  x: number;
  y: number;
  text: string;
  pageLabel: string;
  deviceLabel: string;
  targetText?: string;
  targetTag?: string;
  videoTimeSeconds?: number;
  viewportWidth: number;
  viewportHeight: number;
  screenshotDataUrl?: string;
  screenshotWidth?: number;
  screenshotHeight?: number;
}

export interface PreviewAnnotationBatch {
  coursewareId: number;
  coursewareTitle: string;
  version: string;
  versionLabel: string;
  createdAt: string;
  annotations: PreviewAnnotation[];
}

export const buildPreviewAnnotationPrompt = (batch: PreviewAnnotationBatch) => {
  const lines = batch.annotations.map(annotation => {
    const location = [
      annotation.pageLabel,
      annotation.deviceLabel,
      annotation.videoTimeSeconds !== undefined
        ? `视频 ${annotation.videoTimeSeconds.toFixed(1)} 秒`
        : undefined,
      annotation.targetText ? `对象「${annotation.targetText}」` : undefined,
      `位置 ${Math.round(annotation.x)}%, ${Math.round(annotation.y)}%`,
    ].filter(Boolean).join(' · ');

    return `${annotation.id}. ${annotation.text}\n   上下文：${location}${annotation.screenshotDataUrl ? '\n   附件：已附带该位置的标注截图' : ''}`;
  });

  return [
    `请仅修改课件《${batch.coursewareTitle}》${batch.versionLabel}中标注的 ${batch.annotations.length} 处内容；未标注页面保持不变：`,
    ...lines,
  ].join('\n');
};
