import { useState } from 'react';
import { Eye, Copy, Edit3, Trash2, Heart, Star, Download } from 'lucide-react';
import type { Courseware } from '../../types';
import { useUIStore } from '../../store/uiStore';
import toast from '../../utils/toast';

interface CoursewareGridProps {
  coursewares: Courseware[];
  onPreview: (id: number) => void;
  onClone: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  showEditDelete?: boolean;
  showInsert?: boolean;
}

const CoursewareGrid: React.FC<CoursewareGridProps> = ({
  coursewares,
  onPreview,
  onClone,
  onEdit,
  onDelete,
  showEditDelete = false,
  showInsert = true,
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 20,
      }}
    >
      {coursewares.map((cw) => (
        <CoursewareCard
          key={cw.id}
          courseware={cw}
          onPreview={onPreview}
          onClone={onClone}
          onEdit={onEdit}
          onDelete={onDelete}
          showEditDelete={showEditDelete}
          showInsert={showInsert}
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
  showEditDelete: boolean;
  showInsert: boolean;
}

const CoursewareCard: React.FC<CardProps> = ({
  courseware,
  onPreview,
  onClone,
  onEdit,
  onDelete,
  showEditDelete,
  showInsert,
}) => {
  const [hovered, setHovered] = useState(false);
  const { appMode, insertCourseware } = useUIStore();
  const isEmbedded = appMode === 'embedded';

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
    padding: '6px 12px',
    background: 'rgba(255,255,255,0.95)',
    borderRadius: 6,
    fontSize: 12,
    color: '#1E293B',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
    border: 'none',
    transition: '0.15s',
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${hovered ? '#CBD5E1' : '#E2E8F0'}`,
        transition: 'all 0.2s',
        cursor: 'pointer',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.08)' : 'none',
        transform: hovered ? 'translateY(-2px)' : 'none',
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

        {/* Action overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
            padding: 12,
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
            opacity: hovered ? 1 : 0,
            transition: '0.2s',
          }}
        >
          <button
            style={actionBtnStyle}
            onClick={(e) => { e.stopPropagation(); onPreview(courseware.id); }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.95)'; }}
          >
            <Eye size={14} /> 预览
          </button>
          <button
            style={actionBtnStyle}
            onClick={(e) => { e.stopPropagation(); onClone(courseware.id); }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.95)'; }}
          >
            <Copy size={14} /> 同款
          </button>
          {showEditDelete && courseware.isOwn && (
            <>
              <button
                style={actionBtnStyle}
                onClick={(e) => { e.stopPropagation(); onEdit?.(courseware.id); }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.95)'; }}
              >
                <Edit3 size={14} /> 编辑
              </button>
              <button
                style={actionBtnStyle}
                onClick={(e) => { e.stopPropagation(); onDelete?.(courseware.id); }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.95)'; }}
              >
                <Trash2 size={14} /> 删除
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info area */}
      <div style={{ padding: 14 }}>
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
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
          {courseware.author} · {courseware.publishTime}
        </div>
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
        {isEmbedded && showInsert && (
          <button
            onClick={handleInsert}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              width: '100%', padding: '7px 0', borderRadius: 6, border: 'none',
              background: 'linear-gradient(135deg, #00C9A7, #00A8E8)',
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
