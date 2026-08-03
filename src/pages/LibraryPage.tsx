import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import CoursewareGrid from '../components/Library/CoursewareGrid';
import FilterBar from '../components/Library/FilterBar';
import { useCoursewareStore } from '../store/coursewareStore';
import { useUIStore } from '../store/uiStore';
import toast from '../utils/toast';
import type { Courseware } from '../types';

type TabKey = 'published' | 'draft' | 'deleted';
type DraftTimeFilterKey = 'all' | 'today' | 'week' | 'month' | 'earlier';
type PublishScopeFilter = '全部' | 'group' | 'school' | 'personal';
const emptyStateImageUrl = 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/riHClEj5-640638f5-44cd-44db-ad19-67bf535ceb3f.png';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'published', label: '已发布' },
  { key: 'draft', label: '未发布草稿' },
  { key: 'deleted', label: '已删除' },
];

const draftTimeFilters: { key: DraftTimeFilterKey; label: string }[] = [
  { key: 'all', label: '全部时间' },
  { key: 'today', label: '今天' },
  { key: 'week', label: '近7天' },
  { key: 'month', label: '近30天' },
  { key: 'earlier', label: '更早' },
];

const getCoursewareEditTime = (courseware: Courseware) => courseware.editedAt || `${courseware.publishTime} 00:00:00`;

const parseLocalDateTime = (dateText: string) => {
  const normalized = dateText.includes('T')
    ? dateText
    : dateText.includes(' ')
      ? dateText.replace(' ', 'T')
      : `${dateText}T00:00:00`;
  return new Date(`${normalized}+08:00`);
};

const getDayDiff = (dateText: string) => {
  const currentDate = new Date('2026-08-03T00:00:00+08:00');
  const targetDate = parseLocalDateTime(dateText);
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.floor((currentDate.getTime() - targetDate.getTime()) / oneDay);
};

const getDraftGroupKey = (courseware: Courseware) => (
  courseware.draftGroupId
  || [courseware.title, courseware.subject, courseware.grade, courseware.type].join('|')
);

const aggregateDraftCoursewares = (drafts: Courseware[]) => {
  const groups = new Map<string, Courseware[]>();
  drafts.forEach(courseware => {
    const key = getDraftGroupKey(courseware);
    groups.set(key, [...(groups.get(key) || []), courseware]);
  });

  return Array.from(groups.values()).map(group => {
    const sorted = [...group].sort((a, b) => (
      parseLocalDateTime(getCoursewareEditTime(b)).getTime() - parseLocalDateTime(getCoursewareEditTime(a)).getTime()
    ));
    return {
      ...sorted[0],
      draftVersionCount: group.length,
    };
  });
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '32px 40px',
    maxWidth: 1400,
    margin: '0 auto',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  tabs: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    padding: 3,
    borderRadius: 12,
    border: '1px solid #DDE7F0',
    background: 'linear-gradient(180deg, #FFFFFF 0%, #F7FAFD 100%)',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
    width: 'fit-content',
  },
  tabsSearchRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
  },
  tab: {
    height: 30,
    minWidth: 76,
    padding: '0 14px',
    borderRadius: 9,
    fontSize: 14,
    fontWeight: 700,
    border: 'none',
    background: 'transparent',
    color: '#475569',
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s, background 0.15s, box-shadow 0.15s',
    outline: 'none',
  },
  tabHover: {
    background: 'rgba(240, 251, 255, 0.86)',
    color: 'var(--agent-primary-text)',
    boxShadow: 'inset 0 0 0 1px #DDF3FA',
  },
  tabActive: {
    background: '#FFFFFF',
    color: '#0759C9',
    boxShadow: '0 7px 18px rgba(2, 116, 252, 0.12), inset 0 0 0 1px #BFE9F5',
  },
  emptyState: {
    textAlign: 'center',
    padding: '86px 20px',
    color: '#94A3B8',
  },
  emptyImage: {
    width: 252,
    height: 252,
    objectFit: 'contain' as const,
    marginBottom: 14,
    opacity: 0.94,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: 700,
    color: '#94A3B8',
  },
  filterSearchRow: {
    marginBottom: 16,
  },
  draftFilterRow: {
    display: 'grid',
    gridTemplateColumns: '64px minmax(0, 1fr)',
    alignItems: 'center',
    columnGap: 10,
    marginBottom: 12,
  },
  draftFilterLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 64,
    minWidth: 64,
    fontSize: 13,
    fontWeight: 750,
    color: '#1E293B',
    lineHeight: '32px',
    whiteSpace: 'nowrap',
  },
  draftFilterTags: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    overflowX: 'auto',
    scrollbarWidth: 'none',
  },
  draftFilterTag: {
    height: 32,
    padding: '0 12px',
    borderRadius: 10,
    border: '1px solid #CBD5E1',
    borderColor: '#CBD5E1',
    background: '#F8FAFC',
    color: '#475569',
    fontSize: 13,
    fontWeight: 850,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    outline: 'none',
    transition: 'border-color 0.15s, color 0.15s, background 0.15s, box-shadow 0.15s',
  },
  draftFilterTagHover: {
    background: '#F6FCFF',
    borderColor: '#BFE9F5',
    color: 'var(--agent-primary-text)',
    boxShadow: '0 4px 10px rgba(14, 165, 233, 0.08)',
  },
  draftFilterTagActive: {
    background: '#F1FAFF',
    borderColor: '#BFE9F5',
    color: 'var(--agent-primary-text)',
    fontWeight: 700,
  },
  filterArea: {
    flex: 1,
    minWidth: 0,
  },
  searchBox: {
    width: 300,
    height: 38,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 12px',
    border: '1px solid var(--agent-border)',
    borderRadius: 8,
    background: '#FFFFFF',
    color: 'var(--agent-primary-text)',
    flexShrink: 0,
  },
  searchInput: {
    width: '100%',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: '#1E293B',
    fontSize: 13,
  },
  confirmMask: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 24000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: 'rgba(15, 23, 42, 0.36)',
    backdropFilter: 'blur(5px)',
  },
  confirmCard: {
    width: 360,
    maxWidth: 'calc(100vw - 40px)',
    borderRadius: 12,
    border: '1px solid rgba(226, 232, 240, 0.96)',
    background: '#FFFFFF',
    boxShadow: '0 24px 70px rgba(15, 23, 42, 0.24)',
    padding: 18,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: '#0F172A',
    marginBottom: 6,
  },
  confirmBody: {
    fontSize: 13,
    lineHeight: 1.6,
    color: '#64748B',
    marginBottom: 18,
  },
  confirmActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
  },
  confirmCancel: {
    height: 34,
    padding: '0 14px',
    borderRadius: 9,
    border: '1px solid #D8E2EF',
    background: '#FFFFFF',
    color: '#475569',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  confirmPrimary: {
    height: 34,
    padding: '0 15px',
    borderRadius: 9,
    border: 'none',
    background: 'linear-gradient(135deg, #EF4444, #F97316)',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 8px 18px rgba(239, 68, 68, 0.18)',
  },
};

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('published');
  const [hoveredTab, setHoveredTab] = useState<TabKey | null>(null);
  const [draftTimeFilter, setDraftTimeFilter] = useState<DraftTimeFilterKey>('all');
  const [hoveredDraftTimeFilter, setHoveredDraftTimeFilter] = useState<DraftTimeFilterKey | null>(null);
  const [keyword, setKeyword] = useState('');
  const [filterPublishScope, setFilterPublishScope] = useState<PublishScopeFilter>('全部');
  const [filterSchool, setFilterSchool] = useState('广州学校');
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const {
    coursewares,
    filterSubject,
    filterGrade,
    filterType,
    setFilter,
    updateCourseware,
  } = useCoursewareStore();
  const {
    markSourceDeleted,
  } = useUIStore();

  const filteredCoursewares = useMemo(() => {
    let result = coursewares.filter(courseware => courseware.isOwn);

    if (activeTab === 'published') {
      result = result.filter(courseware => courseware.isPublished && !courseware.isDeleted);
    }
    if (activeTab === 'draft') {
      result = result.filter(courseware => !courseware.isPublished && !courseware.isDeleted);
      if (draftTimeFilter !== 'all') {
        result = result.filter(courseware => {
          const diff = getDayDiff(getCoursewareEditTime(courseware));
          if (draftTimeFilter === 'today') return diff === 0;
          if (draftTimeFilter === 'week') return diff >= 0 && diff <= 7;
          if (draftTimeFilter === 'month') return diff >= 0 && diff <= 30;
          return diff > 30;
        });
      }
      result = aggregateDraftCoursewares(result);
    }
    if (activeTab === 'deleted') {
      result = result.filter(courseware => courseware.isDeleted);
    }

    if (activeTab === 'published') {
      if (filterSubject !== '全部') {
        result = result.filter(courseware => courseware.subject === filterSubject);
      }
      if (filterGrade !== '全部') {
        result = result.filter(courseware => courseware.grade === filterGrade);
      }
      if (filterType !== '全部') {
        result = result.filter(courseware => courseware.type === filterType);
      }
      if (filterPublishScope !== '全部') {
        result = result.filter(courseware => {
          const scope = courseware.resourceScope || (!courseware.isPublished ? 'personal' : 'school');
          if (scope !== filterPublishScope) return false;
          if (scope === 'school') {
            return (courseware.schoolName || '广州学校') === filterSchool;
          }
          return true;
        });
      }
    }
    const query = keyword.trim().toLowerCase();
    if (query) {
      result = result.filter(courseware => (
        `${courseware.title}${courseware.subject}${courseware.grade}${courseware.type}${courseware.author}`
          .toLowerCase()
          .includes(query)
      ));
    }

    return [...result].sort((a, b) => (
      parseLocalDateTime(getCoursewareEditTime(b)).getTime() - parseLocalDateTime(getCoursewareEditTime(a)).getTime()
    ));
  }, [activeTab, coursewares, draftTimeFilter, filterGrade, filterPublishScope, filterSchool, filterSubject, filterType, keyword]);

  const navigate = useNavigate();
  const closePreview = useUIStore((s) => s.closePreview);

  const handleClone = (coursewareId: number) => {
    const courseware = coursewares.find(item => item.id === coursewareId);
    if (!courseware) return;
    closePreview();
    navigate(`/?cloneCoursewareId=${coursewareId}`);
  };

  const handleEdit = (coursewareId: number) => {
    const params = new URLSearchParams({
      mode: 'edit',
      conversationId: coursewareId === 1 ? 'demo-published-game-1' : `demo-courseware-${coursewareId}`,
      resourceId: `AI-DEMO-${String(coursewareId).padStart(4, '0')}`,
    });
    navigate(`/?${params.toString()}`);
  };

  const handleDelete = (coursewareId: number) => {
    setPendingDeleteId(coursewareId);
  };

  const pendingDeleteCourseware = coursewares.find(item => item.id === pendingDeleteId);
  const deleteConfirmCopy = {
    title: '删除已发布课件',
    body: '删除后该作品在资源库中不可见，已插入的课件会提示源资源已删除。',
    action: '确认删除',
  };

  const confirmDelete = () => {
    if (!pendingDeleteCourseware) return;
    if (!pendingDeleteCourseware.isPublished || pendingDeleteCourseware.isDeleted) {
      setPendingDeleteId(null);
      return;
    }
    const coursewareId = pendingDeleteCourseware.id;
    if (pendingDeleteCourseware.isPublished && !pendingDeleteCourseware.isDeleted) {
      updateCourseware(coursewareId, { isDeleted: true, isPublished: false });
      markSourceDeleted(coursewareId);
      toast('已标记为已删除');
      setPendingDeleteId(null);
      return;
    }
  };

  const renderDraftFilterLabel = (label: string) => (
    <span style={styles.draftFilterLabel} aria-label={label}>
      {Array.from(label).map((char, index) => (
        <span key={`${label}-${index}`}>{char}</span>
      ))}
    </span>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>我的创作</h1>
        <p style={styles.subtitle}>管理你创建的互动课件</p>
      </div>

      <div style={styles.tabsSearchRow}>
        <div style={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              style={{
                ...styles.tab,
                ...(hoveredTab === tab.key && activeTab !== tab.key ? styles.tabHover : {}),
                ...(activeTab === tab.key ? styles.tabActive : {}),
              }}
              onMouseEnter={() => setHoveredTab(tab.key)}
              onMouseLeave={() => setHoveredTab(null)}
              onMouseDown={event => event.preventDefault()}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <label style={styles.searchBox}>
          <Search size={16} />
          <input
            value={keyword}
            onChange={event => setKeyword(event.target.value)}
            placeholder="搜索作品名称"
            style={styles.searchInput}
          />
        </label>
      </div>

      <div style={styles.filterSearchRow}>
        {activeTab === 'draft' && (
          <div style={styles.draftFilterRow}>
            {renderDraftFilterLabel('编辑时间')}
            <div style={styles.draftFilterTags}>
              {draftTimeFilters.map(filter => {
                const active = draftTimeFilter === filter.key;
                const hovered = hoveredDraftTimeFilter === filter.key;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    style={{
                      ...styles.draftFilterTag,
                      ...(hovered && !active ? styles.draftFilterTagHover : {}),
                      ...(active ? styles.draftFilterTagActive : {}),
                    }}
                    onMouseEnter={() => setHoveredDraftTimeFilter(filter.key)}
                    onMouseLeave={() => setHoveredDraftTimeFilter(null)}
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => setDraftTimeFilter(filter.key)}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {activeTab === 'published' && (
          <div style={styles.filterArea}>
          <FilterBar
            filterSubject={filterSubject}
            filterGrade={filterGrade}
            filterType={filterType}
            filterPublishScope={filterPublishScope}
            filterSchool={filterSchool}
            sortBy="最新"
            onFilterChange={setFilter}
            onPublishScopeChange={setFilterPublishScope}
            onSchoolChange={setFilterSchool}
            onSortChange={() => undefined}
            sortOptions={[]}
          />
          </div>
        )}
      </div>

      {filteredCoursewares.length > 0 ? (
        <CoursewareGrid
          coursewares={filteredCoursewares}
          onClone={handleClone}
          onEdit={handleEdit}
          onDelete={handleDelete}
          layout={activeTab === 'draft' ? 'draft-list' : 'grid'}
          showEditDelete
          showInsert={false}
          showStats={false}
          showOwnerMeta={false}
          showPublishStatus
        />
      ) : (
        <div style={styles.emptyState}>
          <img src={emptyStateImageUrl} alt="" style={styles.emptyImage} />
          <div style={styles.emptyText}>这里内容空空的哦~</div>
        </div>
      )}

      {pendingDeleteCourseware && (
        <div
          style={styles.confirmMask}
          onClick={() => setPendingDeleteId(null)}
        >
          <section
            style={styles.confirmCard}
            onClick={event => event.stopPropagation()}
          >
            <div style={styles.confirmTitle}>{deleteConfirmCopy.title}</div>
            <div style={styles.confirmBody}>{deleteConfirmCopy.body}</div>
            <div style={styles.confirmActions}>
              <button
                type="button"
                style={styles.confirmCancel}
                onClick={() => setPendingDeleteId(null)}
              >
                取消
              </button>
              <button
                type="button"
                style={styles.confirmPrimary}
                onClick={confirmDelete}
              >
                {deleteConfirmCopy.action}
              </button>
            </div>
          </section>
        </div>
      )}

    </div>
  );
}
