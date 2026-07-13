import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import CoursewareGrid from '../components/Library/CoursewareGrid';
import FilterBar from '../components/Library/FilterBar';
import PublishModal from '../components/Library/PublishModal';
import { useCoursewareStore } from '../store/coursewareStore';
import { useUIStore } from '../store/uiStore';
import { useConversationStore, getFrameworkForCourseware } from '../store/conversationStore';
import { openCoursewarePreview } from '../utils/previewWindow';
import toast from '../utils/toast';

type TabKey = 'all' | 'published' | 'draft';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'published', label: '已发布' },
  { key: 'draft', label: '未发布' },
];

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
    display: 'flex',
    gap: 7,
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
    height: 34,
    minWidth: 88,
    padding: '0 16px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    border: '1px solid #CBD5E1',
    borderColor: '#CBD5E1',
    background: '#F8FAFC',
    color: '#475569',
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s, background 0.15s, box-shadow 0.15s',
    outline: 'none',
  },
  tabHover: {
    background: '#F6FCFF',
    borderColor: '#BFE9F5',
    color: 'var(--agent-primary-text)',
    boxShadow: '0 4px 10px rgba(14, 165, 233, 0.08)',
  },
  tabActive: {
    background: '#F1FAFF',
    borderColor: '#BFE9F5',
    color: 'var(--agent-primary-text)',
    boxShadow: 'none',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#94A3B8',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#CBD5E1',
  },
  filterSearchRow: {
    marginBottom: 16,
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
};

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [hoveredTab, setHoveredTab] = useState<TabKey | null>(null);
  const [keyword, setKeyword] = useState('');
  const {
    coursewares,
    filterSubject,
    filterGrade,
    filterType,
    setFilter,
    deleteCourseware,
  } = useCoursewareStore();
  const {
    publishModalOpen,
    publishCoursewareId,
    closePublishModal,
    openPublishModal,
    markSourceDeleted,
  } = useUIStore();

  const filteredCoursewares = useMemo(() => {
    let result = coursewares.filter(courseware => courseware.isOwn);

    if (activeTab === 'published') {
      result = result.filter(courseware => courseware.isPublished);
    }
    if (activeTab === 'draft') {
      result = result.filter(courseware => !courseware.isPublished);
    }

    if (filterSubject !== '全部') {
      result = result.filter(courseware => courseware.subject === filterSubject);
    }
    if (filterGrade !== '全部') {
      result = result.filter(courseware => courseware.grade === filterGrade);
    }
    if (filterType !== '全部') {
      result = result.filter(courseware => courseware.type === filterType);
    }
    const query = keyword.trim().toLowerCase();
    if (query) {
      result = result.filter(courseware => (
        `${courseware.title}${courseware.subject}${courseware.grade}${courseware.type}${courseware.author}`
          .toLowerCase()
          .includes(query)
      ));
    }

    return [...result].sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime());
  }, [activeTab, coursewares, filterGrade, filterSubject, filterType, keyword]);

  const handlePreview = (coursewareId: number) => {
    const courseware = coursewares.find(item => item.id === coursewareId);
    if (courseware) {
      openCoursewarePreview(courseware, coursewares);
    }
  };

  const navigate = useNavigate();
  const createCloneConversation = useConversationStore((s) => s.createCloneConversation);
  const closePreview = useUIStore((s) => s.closePreview);

  const handleClone = (coursewareId: number) => {
    const courseware = coursewares.find(item => item.id === coursewareId);
    if (!courseware) return;
    const framework = getFrameworkForCourseware(coursewareId);
    createCloneConversation(courseware.title, framework, courseware.htmlContent);
    closePreview();
    toast('已带入原课件 HTML，可补充同款需求');
    navigate('/');
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
    const courseware = coursewares.find(item => item.id === coursewareId);
    const message = courseware?.isPublished
      ? '删除后该作品在生产 Agent 中不可见，确定删除吗？'
      : '确定删除这个未发布草稿吗？';
    if (confirm(message)) {
      deleteCourseware(coursewareId);
      markSourceDeleted(coursewareId);
      toast('已删除作品');
    }
  };

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
        <div style={styles.filterArea}>
          <FilterBar
            filterSubject={filterSubject}
            filterGrade={filterGrade}
            filterType={filterType}
            sortBy="最新"
            onFilterChange={setFilter}
            onSortChange={() => undefined}
            sortOptions={[]}
          />
        </div>
      </div>

      {filteredCoursewares.length > 0 ? (
        <CoursewareGrid
          coursewares={filteredCoursewares}
          onPreview={handlePreview}
          onClone={handleClone}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPublish={openPublishModal}
          showEditDelete
          showInsert={false}
          showStats={false}
          showPublishStatus
        />
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📭</div>
          <div style={styles.emptyText}>暂无课件</div>
          <div style={styles.emptyHint}>
            {activeTab === 'published' ? '暂无已发布作品' : activeTab === 'draft' ? '暂无未发布草稿' : '你还没有创建任何课件'}
          </div>
        </div>
      )}

      <AnimatePresence>
        {publishModalOpen && publishCoursewareId && (
          <PublishModal
            coursewareId={publishCoursewareId}
            onClose={closePublishModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
