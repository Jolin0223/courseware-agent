import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import CoursewareGrid from '../components/Library/CoursewareGrid';
import FilterBar from '../components/Library/FilterBar';
import PublishModal from '../components/Library/PublishModal';
import { useCoursewareStore } from '../store/coursewareStore';
import { useUIStore } from '../store/uiStore';
import { useConversationStore, getFrameworkForCourseware } from '../store/conversationStore';
import { openCoursewarePreview } from '../utils/previewWindow';
import toast from '../utils/toast';

type TabKey = 'all' | 'created' | 'collected' | 'history';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'created', label: '我发布的' },
  { key: 'collected', label: '我收藏的' },
  { key: 'history', label: '生成记录' },
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
    gap: 4,
    padding: '4px',
    background: '#F1F5F9',
    borderRadius: 10,
    marginBottom: 24,
    width: 'fit-content',
  },
  tab: {
    padding: '10px 20px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    border: 'none',
    background: 'transparent',
    color: '#64748B',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: '#FFFFFF',
    color: '#1E293B',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
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
};

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const { 
    coursewares, 
    filterSubject, 
    filterGrade, 
    filterType, 
    sortBy, 
    setFilter, 
    setSortBy,
    deleteCourseware,
  } = useCoursewareStore();
  const { 
    publishModalOpen,
    publishCoursewareId,
    closePublishModal,
    markSourceDeleted,
  } = useUIStore();
  
  const filteredCoursewares = useMemo(() => {
    let result = [...coursewares];
    
    // Tab filter
    switch (activeTab) {
      case 'created':
        result = result.filter(c => c.isOwn);
        break;
      case 'collected':
        // 模拟收藏
        result = result.filter(c => !c.isOwn);
        break;
      case 'history':
        result = result.filter(c => c.isOwn);
        break;
    }
    
    // Subject filter
    if (filterSubject !== '全部') {
      result = result.filter(c => c.subject === filterSubject);
    }
    
    // Grade filter
    if (filterGrade !== '全部') {
      result = result.filter(c => c.grade === filterGrade);
    }
    
    // Type filter
    if (filterType !== '全部') {
      result = result.filter(c => c.type === filterType);
    }
    
    // Sort
    switch (sortBy) {
      case '最热':
        result.sort((a, b) => b.views - a.views);
        break;
      case '最新':
        result.sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime());
        break;
      case '最多收藏':
        result.sort((a, b) => b.favorites - a.favorites);
        break;
      case '最多下载':
        result.sort((a, b) => b.likes - a.likes);
        break;
    }
    
    return result;
  }, [coursewares, activeTab, filterSubject, filterGrade, filterType, sortBy]);
  
  const handlePreview = (coursewareId: number) => {
    const cw = coursewares.find(c => c.id === coursewareId);
    if (cw) {
      openCoursewarePreview(cw, coursewares);
    }
  };
  
  const navigate = useNavigate();
  const createCloneConversation = useConversationStore((s) => s.createCloneConversation);

  const handleClone = (coursewareId: number) => {
    const cw = coursewares.find(c => c.id === coursewareId);
    if (!cw) return;
    const framework = getFrameworkForCourseware(coursewareId);
    createCloneConversation(cw.title, framework);
    toast(`已创建同款会话：同款-${cw.title}`);
    navigate('/');
  };
  
  const handleEdit = () => {
    alert('编辑课件（Demo 模拟）');
  };
  
  const handleDelete = (coursewareId: number) => {
    if (confirm('确定要删除这个课件吗？')) {
      deleteCourseware(coursewareId);
      markSourceDeleted(coursewareId);
    }
  };
  
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>我的作品</h1>
        <p style={styles.subtitle}>管理你创建和收藏的互动课件</p>
      </div>
      
      {/* Tabs */}
      <div style={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            style={{
              ...styles.tab,
              ...(activeTab === tab.key ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Filter Bar */}
      <FilterBar
        filterSubject={filterSubject}
        filterGrade={filterGrade}
        filterType={filterType}
        sortBy={sortBy}
        onFilterChange={setFilter}
        onSortChange={setSortBy}
        sortOptions={[]}
      />
      
      {/* Content */}
      {filteredCoursewares.length > 0 ? (
        <CoursewareGrid
          coursewares={filteredCoursewares}
          onPreview={handlePreview}
          onClone={handleClone}
          onEdit={handleEdit}
          onDelete={handleDelete}
          showEditDelete={activeTab === 'created' || activeTab === 'history'}
          showInsert={activeTab !== 'history'}
        />
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📭</div>
          <div style={styles.emptyText}>暂无课件</div>
          <div style={styles.emptyHint}>
            {activeTab === 'created' 
              ? '你还没有创建任何课件，去首页生成吧！' 
              : activeTab === 'collected'
              ? '你还没有收藏任何课件'
              : '这里空空如也'}
          </div>
        </div>
      )}
      
      {/* Publish Modal */}
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
