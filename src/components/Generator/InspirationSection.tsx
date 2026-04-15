import React, { useState, useMemo } from 'react';
import { Eye, Heart, Star, Download } from 'lucide-react';
import { useCoursewareStore } from '../../store/coursewareStore';
import { useUIStore } from '../../store/uiStore';
import { openCoursewarePreview } from '../../utils/previewWindow';
import toast from '../../utils/toast';
import type { Courseware } from '../../types';

const SUBJECTS = [
  '语文', '创客', '美术', '思辨与口才',
  '脑力与思维', '双语故事表演', '机器人', '编程',
  '博文妙笔', '书法', '数学', '英语'
];

const GRADES = [
  'S1', 'S2', 'S3',
  '一年级', '二年级', '三年级',
  '四年级', '五年级', '六年级'
];

const AVATAR_COLORS = ['#00C9A7', '#00A8E8', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981'];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 24 }) => {
  const color = getAvatarColor(name);
  const initial = name.charAt(0);
  
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${color}, ${color}dd)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: size * 0.5,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '0 24px',
  },
  header: {
    marginBottom: 20,
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    color: '#1E293B',
    flexShrink: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1E293B',
    flexShrink: 0,
    minWidth: 40,
  },
  filterTags: {
    display: 'flex',
    flexWrap: 'nowrap',
    gap: 8,
    overflow: 'hidden',
  },
  filterTag: {
    padding: '4px 14px',
    borderRadius: 16,
    border: '1px solid #E2E8F0',
    background: '#fff',
    fontSize: 13,
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
    outline: 'none',
  },
  filterTagActive: {
    background: '#00C9A7',
    borderColor: '#00C9A7',
    color: '#fff',
  },
  sortRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 16,
  },
  card: {
    background: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #E2E8F0',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  thumbnail: {
    position: 'relative',
    aspectRatio: '16/9',
    background: '#F8FAFC',
    overflow: 'hidden',
  },
  thumbnailInner: {
    width: '200%',
    height: '200%',
    transform: 'scale(0.5)',
    transformOrigin: 'top left',
    border: 'none',
    pointerEvents: 'none',
  },
  info: {
    padding: '10px 12px',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1E293B',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: 8,
  },
  authorRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  authorInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 12,
    color: '#475569',
    fontWeight: 500,
    maxWidth: 80,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  stats: {
    display: 'flex',
    gap: 10,
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    fontSize: 11,
    color: '#94A3B8',
    padding: '2px 6px',
    borderRadius: 4,
    transition: 'all 0.15s',
  },
  statActive: {
    color: '#00C9A7',
    background: 'rgba(0, 201, 167, 0.1)',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 48,
    background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 50%, #7DD3FC 100%)',
  },
};

// FilterDropdown removed — replaced by inline tag filters

function InspirationCard({ courseware, allCoursewares }: { courseware: Courseware; allCoursewares: Courseware[] }) {
  const [hovered, setHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const { appMode, insertCourseware } = useUIStore();
  const isEmbedded = appMode === 'embedded';
  
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-action]')) {
      return;
    }
    openCoursewarePreview(courseware, allCoursewares);
  };

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
  
  return (
    <div
      style={{
        ...styles.card,
        borderColor: hovered ? '#CBD5E1' : '#E2E8F0',
        boxShadow: hovered ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      <div style={styles.thumbnail}>
        {courseware.htmlContent ? (
          <iframe
            srcDoc={courseware.htmlContent}
            title={courseware.title}
            style={styles.thumbnailInner}
          />
        ) : (
          <div style={styles.placeholder}>
            {courseware.subject === '英语' ? '📚' : courseware.subject === '数学' ? '🔢' : '📖'}
          </div>
        )}
      </div>
      <div style={styles.info}>
        <div style={styles.cardTitle}>{courseware.title}</div>
        {isEmbedded && (
          <button
            data-action="insert"
            onClick={handleInsert}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              width: '100%', padding: '6px 0', borderRadius: 6, border: 'none',
              background: 'linear-gradient(135deg, #00C9A7, #00A8E8)',
              color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              marginBottom: 6,
            }}
          >
            <Download size={12} /> 插入课件
          </button>
        )}
        <div style={styles.authorRow}>
          <div style={styles.authorInfo}>
            <Avatar name={courseware.author} size={20} />
            <span style={styles.authorName}>{courseware.author}</span>
          </div>
          <div style={styles.stats}>
            <span style={styles.stat}>
              <Eye size={11} /> {courseware.views}
            </span>
            <span 
              style={{
                ...styles.stat,
                ...(favorited ? styles.statActive : {}),
                cursor: 'pointer',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setFavorited(!favorited);
              }}
              data-action="favorite"
            >
              <Heart size={11} fill={favorited ? '#00C9A7' : 'none'} /> {courseware.favorites + (favorited ? 1 : 0)}
            </span>
            <span 
              style={{
                ...styles.stat,
                ...(liked ? styles.statActive : {}),
                cursor: 'pointer',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setLiked(!liked);
              }}
              data-action="like"
            >
              <Star size={11} fill={liked ? '#00C9A7' : 'none'} /> {courseware.likes + (liked ? 1 : 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InspirationSection() {
  const { coursewares, sortBy, setSortBy } = useCoursewareStore();
  
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string | null>(null);

  // 筛选课件
  const filteredCoursewares = useMemo(() => {
    let filtered = [...coursewares];
    
    if (subjectFilter) {
      filtered = filtered.filter(c => c.subject === subjectFilter);
    }
    if (gradeFilter) {
      filtered = filtered.filter(c => c.grade === gradeFilter);
    }
    
    // 排序
    switch (sortBy) {
      case '最热':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case '最新':
        filtered.sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime());
        break;
      case '最多收藏':
        filtered.sort((a, b) => b.favorites - a.favorites);
        break;
      default:
        filtered.sort((a, b) => b.views - a.views);
    }
    
    return filtered.slice(0, 6);
  }, [coursewares, sortBy, subjectFilter, gradeFilter]);
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.headerLeft}>
            <div style={styles.title}>灵感大厅</div>
            <div style={styles.subtitle}>精选优质课件，激发创作灵感</div>
          </div>
          <div style={styles.filterTags}>
            {['最热', '最新', '最多收藏'].map((opt) => (
              <button
                key={opt}
                style={{
                  ...styles.filterTag,
                  ...(sortBy === opt ? styles.filterTagActive : {}),
                }}
                onClick={() => setSortBy(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* 学科平铺标签 */}
        <div style={styles.filterRow}>
          <span style={styles.filterLabel}>学科</span>
          <div style={styles.filterTags}>
            <button
              style={{
                ...styles.filterTag,
                ...(!subjectFilter ? styles.filterTagActive : {}),
              }}
              onClick={() => setSubjectFilter(null)}
            >
              全部
            </button>
            {SUBJECTS.map((s) => (
              <button
                key={s}
                style={{
                  ...styles.filterTag,
                  ...(subjectFilter === s ? styles.filterTagActive : {}),
                }}
                onClick={() => setSubjectFilter(subjectFilter === s ? null : s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 年级平铺标签 */}
        <div style={styles.filterRow}>
          <span style={styles.filterLabel}>年级</span>
          <div style={styles.filterTags}>
            <button
              style={{
                ...styles.filterTag,
                ...(!gradeFilter ? styles.filterTagActive : {}),
              }}
              onClick={() => setGradeFilter(null)}
            >
              全部
            </button>
            {GRADES.map((g) => (
              <button
                key={g}
                style={{
                  ...styles.filterTag,
                  ...(gradeFilter === g ? styles.filterTagActive : {}),
                }}
                onClick={() => setGradeFilter(gradeFilter === g ? null : g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={styles.grid}>
        {filteredCoursewares.map((cw) => (
          <InspirationCard 
            key={cw.id} 
            courseware={cw}
            allCoursewares={coursewares}
          />
        ))}
      </div>
    </div>
  );
}
