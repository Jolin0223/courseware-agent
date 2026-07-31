import { useState } from 'react';
import { Eye, Copy, Edit3, Trash2, Heart, Star, Download, Send, Clock3, CheckCircle2 } from 'lucide-react';
import type { Courseware } from '../../types';
import { useUIStore } from '../../store/uiStore';
import toast from '../../utils/toast';

interface CoursewareGridProps {
  coursewares: Courseware[];
  onPreview: (id: number) => void;
  onClone: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onPublish?: (id: number) => void;
  showEditDelete?: boolean;
  showInsert?: boolean;
  showStats?: boolean;
  showPublishStatus?: boolean;
  showOwnerMeta?: boolean;
}

const CoursewareGrid: React.FC<CoursewareGridProps> = ({
  coursewares,
  onPreview,
  onClone,
  onEdit,
  onDelete,
  onPublish,
  showEditDelete = false,
  showInsert = true,
  showStats = true,
  showPublishStatus = false,
  showOwnerMeta = true,
}) => {
  return (
    <div
      className="library-courseware-grid"
    >
      {coursewares.map((cw) => (
        <CoursewareCard
          key={cw.id}
          courseware={cw}
          onPreview={onPreview}
          onClone={onClone}
          onEdit={onEdit}
          onDelete={onDelete}
          onPublish={onPublish}
          showEditDelete={showEditDelete}
          showInsert={showInsert}
          showStats={showStats}
          showPublishStatus={showPublishStatus}
          showOwnerMeta={showOwnerMeta}
        />
      ))}
    </div>
  );
};

interface CardProps {
  courseware: Courseware;
  onPreview: (id: number) => void;
  onClone: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onPublish?: (id: number) => void;
  showEditDelete: boolean;
  showInsert: boolean;
  showStats: boolean;
  showPublishStatus: boolean;
  showOwnerMeta: boolean;
}

const getStatusMeta = (courseware: Courseware, isHistoricalPublished: boolean) => {
  if (courseware.isDeleted) {
    return {
      label: '已删除',
      description: '资源已删除',
      icon: <Trash2 size={13} strokeWidth={2.4} />,
      background: 'rgba(255, 255, 255, 0.9)',
      color: '#B42318',
      borderColor: 'rgba(254, 202, 202, 0.95)',
      shadow: 'rgba(180, 35, 24, 0.10)',
    };
  }
  if (!courseware.isPublished) {
    return {
      label: '未发布',
      description: '未发布草稿',
      icon: <Clock3 size={13} strokeWidth={2.4} />,
      background: 'rgba(255, 251, 235, 0.92)',
      color: '#B45309',
      borderColor: 'rgba(253, 230, 138, 0.96)',
      shadow: 'rgba(180, 83, 9, 0.10)',
    };
  }
  if (isHistoricalPublished) {
    return {
      label: '历史发布',
      description: '历史发布版本',
      icon: <CheckCircle2 size={13} strokeWidth={2.4} />,
      background: 'rgba(239, 246, 255, 0.92)',
      color: '#1D4ED8',
      borderColor: 'rgba(191, 219, 254, 0.96)',
      shadow: 'rgba(29, 78, 216, 0.10)',
    };
  }
  return {
    label: '已发布',
    description: '已同步资源库',
    icon: <CheckCircle2 size={13} strokeWidth={2.4} />,
    background: 'rgba(240, 253, 249, 0.92)',
    color: 'var(--agent-primary-text)',
    borderColor: 'rgba(167, 243, 208, 0.96)',
    shadow: 'rgba(15, 118, 110, 0.10)',
  };
};

const CoursewareCard: React.FC<CardProps> = ({
  courseware,
  onPreview,
  onClone,
  onEdit,
  onDelete,
  onPublish,
  showEditDelete,
  showInsert,
  showStats,
  showPublishStatus,
  showOwnerMeta,
}) => {
  const [hovered, setHovered] = useState(false);
  const { appMode, insertCourseware } = useUIStore();
  const isEmbedded = appMode === 'embedded';
  const isHistoricalPublished = Boolean(courseware.isPublished && (courseware.id === 4 || courseware.id === 6));
  const isDeleted = Boolean(courseware.isDeleted);
  const statusMeta = getStatusMeta(courseware, isHistoricalPublished);

  const handleInsert = (e: React.MouseEvent) => {
    e.stopPropagation();
    insertCourseware({
      id: courseware.id,
      title: courseware.title,
      version: 'v1.0',
      htmlContent: courseware.htmlContent,
      slideIndex: 0,
      hasUpdate: false,
    });
    toast(`"${courseware.title}" 已插入课件`);
  };

  const actionBtnStyle: React.CSSProperties = {
    height: 29,
    padding: '0 10px',
    background: 'rgba(255,255,255,0.95)',
    borderRadius: 9,
    fontSize: 12,
    fontWeight: 750,
    color: '#1E3A5F',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
    border: '1px solid rgba(226, 242, 250, 0.92)',
    transition: '0.15s',
    boxShadow: '0 6px 14px rgba(15, 23, 42, 0.12)',
  };
  const mutedActionBtnStyle: React.CSSProperties = {
    ...actionBtnStyle,
    background: 'rgba(255,255,255,0.88)',
    color: '#475569',
  };

  const renderActionButton = (
    label: string,
    icon: React.ReactNode,
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void,
    muted = false,
  ) => (
    <button
      style={muted ? mutedActionBtnStyle : actionBtnStyle}
      onClick={onClick}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = muted ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.95)'; }}
    >
      {icon} {label}
    </button>
  );

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 10,
        overflow: 'hidden',
        border: `1px solid ${isDeleted ? '#E5EAF0' : hovered ? 'var(--agent-border)' : '#E2E8F0'}`,
        transition: 'all 0.2s',
        cursor: 'pointer',
        boxShadow: hovered && !isDeleted ? '0 10px 26px var(--agent-shadow)' : '0 1px 2px rgba(15,23,42,0.03)',
        transform: hovered && !isDeleted ? 'translateY(-1px)' : 'none',
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '16/9',
          overflow: 'hidden',
          background: '#f8fafc',
        }}
      >
        {courseware.htmlContent ? (
          <iframe
            srcDoc={courseware.htmlContent}
            title={courseware.title}
            style={{
              width: '200%',
              height: '200%',
              transform: 'scale(0.5)',
              transformOrigin: 'top left',
              border: 'none',
              pointerEvents: 'none',
              filter: isDeleted ? 'grayscale(0.3) saturate(0.75)' : 'none',
              opacity: isDeleted ? 0.72 : 1,
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 50%, #7DD3FC 100%)',
            }}
          />
        )}

        {isDeleted && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(248, 250, 252, 0.08), rgba(15, 23, 42, 0.18))',
              pointerEvents: 'none',
            }}
          />
        )}

        {showPublishStatus && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              height: 26,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '0 8px',
              borderRadius: 999,
              background: statusMeta.background,
              color: statusMeta.color,
              fontSize: 12,
              fontWeight: 850,
              border: `1px solid ${statusMeta.borderColor}`,
              boxShadow: `0 5px 14px ${statusMeta.shadow}`,
              backdropFilter: 'blur(8px)',
            }}
          >
            {statusMeta.icon}
            {statusMeta.label}
          </div>
        )}

        {/* Action overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(15, 23, 42, 0.58))',
            padding: 10,
            display: 'flex',
            gap: 6,
            justifyContent: 'center',
            opacity: hovered ? 1 : 0,
            transition: '0.2s',
          }}
        >
          {!isDeleted && renderActionButton(
            '预览',
            <Eye size={14} />,
            (e) => { e.stopPropagation(); onPreview(courseware.id); },
          )}
          {(courseware.isPublished || isDeleted) && renderActionButton(
            '同款',
            <Copy size={14} />,
            (e) => { e.stopPropagation(); onClone(courseware.id); },
            isDeleted,
          )}
          {showEditDelete && courseware.isOwn && (
            <>
              {!isDeleted && !isHistoricalPublished && renderActionButton(
                '编辑',
                <Edit3 size={14} />,
                (e) => { e.stopPropagation(); onEdit?.(courseware.id); },
              )}
              {!isDeleted && !courseware.isPublished && onPublish && renderActionButton(
                '发布',
                <Send size={14} />,
                (e) => { e.stopPropagation(); onPublish(courseware.id); },
              )}
              {renderActionButton(
                isDeleted ? '移除' : '删除',
                <Trash2 size={14} />,
                (e) => { e.stopPropagation(); onDelete?.(courseware.id); },
                isDeleted,
              )}
            </>
          )}
        </div>
      </div>

      {/* Info area */}
      <div style={{ padding: '12px 12px 13px' }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#1E293B',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {courseware.title}
        </div>
        {showOwnerMeta && (
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
            {courseware.author} · {courseware.publishTime}
          </div>
        )}
        {showStats ? (
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#94A3B8', marginTop: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Eye size={13} /> {courseware.views}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Heart size={13} /> {courseware.favorites}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Star size={13} /> {courseware.likes}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, color: '#94A3B8', marginTop: 8 }}>
            <span>{courseware.subject}</span>
            <span>·</span>
            <span>{courseware.grade}</span>
            <span>·</span>
            <span>{statusMeta.description}</span>
          </div>
        )}
        {isEmbedded && showInsert && (
          <button
            onClick={handleInsert}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              width: '100%', height: 34, padding: '0 12px', borderRadius: 10, border: 'none',
              background: 'var(--agent-action-gradient)',
              color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              marginTop: 10,
            }}
          >
            <Download size={12} /> 插入课件
          </button>
        )}
      </div>
    </div>
  );
};

export default CoursewareGrid;
