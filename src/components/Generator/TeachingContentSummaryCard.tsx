import { BookOpenText, Database, Presentation, X } from 'lucide-react';
import type { UploadedAttachment } from '../../types';

interface TeachingContentSummaryCardProps {
  attachment: UploadedAttachment;
  onOpen: () => void;
  onRemove?: () => void;
}

export default function TeachingContentSummaryCard({
  attachment,
  onOpen,
  onRemove,
}: TeachingContentSummaryCardProps) {
  const source = attachment.teachingSource;
  if (!source) return null;

  const SourceIcon = source.type === 'question-bank' ? Database : source.type === 'word-book' ? BookOpenText : Presentation;
  const displayTitle = source.type === 'question-bank'
    ? '学科题目'
    : source.type === 'word-book'
      ? '双语词书'
      : '云盘课件';
  const countLabel = source.type === 'question-bank'
    ? `已选 ${source.itemCount} 题`
    : source.type === 'word-book'
      ? `已选 ${source.itemCount} 词`
      : `已选 ${source.itemCount} 页`;

  return (
    <div
      className={`aug-teaching-attachment aug-teaching-attachment-${source.type}`}
      role="button"
      tabIndex={0}
      aria-label={`查看${displayTitle}，${countLabel}`}
      onClick={onOpen}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <span className="aug-teaching-attachment-icon"><SourceIcon size={18} strokeWidth={1.9} /></span>
      <span className="aug-teaching-attachment-body">
        <b>{displayTitle}</b>
        <em>{countLabel}</em>
      </span>
      {onRemove && (
        <span className="aug-teaching-attachment-actions">
          <button type="button" onClick={event => { event.stopPropagation(); onRemove(); }} aria-label={`移除${displayTitle}`}><X size={15} /></button>
        </span>
      )}
    </div>
  );
}
