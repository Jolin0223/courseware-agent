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
type PublishScopeFilter = '全部' | 'group' | 'school' | 'personal';
const emptyStateImageUrl = 'https://aigc-material.xdf.cn/lingguang-aigc/material/chenjialing12/AkBhExjm-d30cd552-7abd-4e4d-b052-1315735222da.png';

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
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [hoveredTab, setHoveredTab] = useState<TabKey | null>(null);
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
      result = result.filter(courseware => courseware.isPublished && !courseware.isDeleted);
    }
    if (activeTab === 'draft') {
      result = result.filter(courseware => !courseware.isPublished && !courseware.isDeleted);
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
    const query = keyword.trim().toLowerCase();
    if (query) {
      result = result.filter(courseware => (
        `${courseware.title}${courseware.subject}${courseware.grade}${courseware.type}${courseware.author}`
          .toLowerCase()
          .includes(query)
      ));
    }

    return [...result].sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime());
  }, [activeTab, coursewares, filterGrade, filterPublishScope, filterSchool, filterSubject, filterType, keyword]);

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
    setPendingDeleteId(coursewareId);
  };

  const pendingDeleteCourseware = coursewares.find(item => item.id === pendingDeleteId);
  const deleteConfirmCopy = pendingDeleteCourseware?.isDeleted
    ? {
      title: '移除已删除记录',
      body: '移除后这条记录将不再出现在我的创作列表中。',
      action: '确认移除',
    }
    : pendingDeleteCourseware?.isPublished
      ? {
        title: '删除已发布课件',
        body: '删除后该作品在资源库中不可见，已插入的课件会提示源资源已删除。',
        action: '确认删除',
      }
      : {
        title: '删除未发布草稿',
        body: '删除后这个草稿不会再保留。',
        action: '确认删除',
      };

  const confirmDelete = () => {
    if (!pendingDeleteCourseware) return;
    const coursewareId = pendingDeleteCourseware.id;
    if (pendingDeleteCourseware.isPublished && !pendingDeleteCourseware.isDeleted) {
      updateCourseware(coursewareId, { isDeleted: true, isPublished: false });
      markSourceDeleted(coursewareId);
      toast('已标记为已删除');
      setPendingDeleteId(null);
      return;
    }
    deleteCourseware(coursewareId);
    toast(pendingDeleteCourseware.isDeleted ? '已移除记录' : '已删除草稿');
    setPendingDeleteId(null);
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
