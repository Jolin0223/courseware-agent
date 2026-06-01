import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Search, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { mockCoursewares } from '../../data/mockCoursewares';
import { useCoursewareStore } from '../../store/coursewareStore';
import { knowledgeTagTree, autoTagByTitle, getTagLabel } from '../../data/knowledgeTags';
import type { KnowledgeTag } from '../../data/knowledgeTags';
import toast from '../../utils/toast';

const subjects = [
  '语文', '创客', '美术', '思辨与口才',
  '脑力与思维', '双语故事表演', '机器人', '编程',
  '博文妙笔', '书法', '数学', '英语', '顾问通识', '系统工具',
];

const grades = [
  'S1', 'S2', 'S3',
  '一年级', '二年级', '三年级',
  '四年级', '五年级', '六年级',
];

type PublishMode = 'publish' | 'update' | 'new-game';

interface PublishModalProps {
  coursewareId: number;
  onClose: () => void;
  onPublishSuccess?: () => void;
  mode?: PublishMode;
}

export default function PublishModal({ coursewareId, onClose, onPublishSuccess, mode = 'publish' }: PublishModalProps) {
  const { coursewares, addCourseware, updateCourseware } = useCoursewareStore();

  const courseware = useMemo(() => {
    return coursewares.find(c => c.id === coursewareId)
      || mockCoursewares.find(c => c.id === coursewareId);
  }, [coursewareId, coursewares]);

  const [title, setTitle] = useState(courseware?.title || '');
  const [subject, setSubject] = useState(courseware?.subject || '语文');
  const [grade, setGrade] = useState(courseware?.grade || '一年级');
  const [selectedTags, setSelectedTags] = useState<string[]>(() =>
    autoTagByTitle(courseware?.title || '', courseware?.subject || '')
  );
  const [tagSearch, setTagSearch] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    const autoTags = autoTagByTitle(courseware?.title || '', courseware?.subject || '');
    const expandParents = (nodes: KnowledgeTag[], parents: string[]) => {
      for (const node of nodes) {
        if (autoTags.includes(node.id)) {
          parents.forEach(p => initial.add(p));
        }
        if (node.children) {
          expandParents(node.children, [...parents, node.id]);
        }
      }
    };
    expandParents(knowledgeTagTree, []);
    return initial;
  });
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleTag = useCallback((id: string) => {
    setSelectedTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  }, []);

  const removeTag = useCallback((id: string) => {
    setSelectedTags(prev => prev.filter(t => t !== id));
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filterTree = useCallback((nodes: KnowledgeTag[], query: string): KnowledgeTag[] => {
    if (!query) return nodes;
    const q = query.toLowerCase();
    return nodes.reduce<KnowledgeTag[]>((acc, node) => {
      if (node.label.toLowerCase().includes(q)) {
        acc.push(node);
      } else if (node.children) {
        const filtered = filterTree(node.children, query);
        if (filtered.length > 0) {
          acc.push({ ...node, children: filtered });
        }
      }
      return acc;
    }, []);
  }, []);

  const subjectTagTree = useMemo(() => {
    const subjectMap: Record<string, string> = {
      '语文': 'chinese', '数学': 'math', '英语': 'english', '科学': 'science',
    };
    const matchId = subjectMap[subject];
    if (!matchId) return knowledgeTagTree;
    const matched = knowledgeTagTree.find(n => n.id === matchId);
    return matched ? (matched.children || []) : knowledgeTagTree;
  }, [subject]);

  const filteredTree = useMemo(() => filterTree(subjectTagTree, tagSearch), [tagSearch, filterTree, subjectTagTree]);

  const handlePublish = () => {
    if (!title.trim()) {
      toast('请输入游戏名称');
      return;
    }
    if (mode === 'new-game' && courseware) {
      const nextId = Math.max(...coursewares.map(item => item.id), coursewareId) + 1;
      addCourseware({
        ...courseware,
        id: nextId,
        title: title.trim(),
        subject,
        grade,
        publishTime: new Date().toISOString().split('T')[0],
        views: 0,
        favorites: 0,
        likes: 0,
        isOwn: true,
        isPublished: true,
      });
    } else {
      updateCourseware(coursewareId, {
        title: title.trim(),
        subject,
        grade,
        isPublished: true,
      });
    }
    toast(mode === 'update' ? '更新发布成功~' : mode === 'new-game' ? '已发布为新互动游戏~' : '发布成功~');
    onPublishSuccess?.();
    onClose();
  };

  const modalTitle = mode === 'update' ? '更新发布' : mode === 'new-game' ? '发布为新互动游戏' : '发布作品';
  const primaryText = mode === 'update' ? '确认更新发布' : mode === 'new-game' ? '确认发布为新游戏' : '确认发布';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={styles.overlay}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <span style={styles.title}>{modalTitle}</span>
          <button style={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div style={styles.content}>
          {mode === 'update' && (
            <div style={styles.updateNotice}>
              本次发布会更新当前互动游戏的已发布版本，已插入课件中的互动游戏会同步使用新版本。
            </div>
          )}

          {mode === 'new-game' && (
            <div style={styles.newGameNotice}>
              本次发布会创建一个新的互动游戏资源，原已发布/插入课件的互动游戏不会受到影响。
            </div>
          )}

          {/* 游戏名称 */}
          <div style={styles.field}>
            <label style={styles.label}><span style={styles.required}>*</span> 游戏名称</label>
            <div style={styles.inputWrap}>
              <input
                type="text"
                value={title}
                maxLength={30}
                onChange={e => setTitle(e.target.value.slice(0, 30))}
                style={styles.input}
                onFocus={e => e.currentTarget.parentElement!.style.borderColor = '#00C9A7'}
                onBlur={e => e.currentTarget.parentElement!.style.borderColor = '#E2E8F0'}
              />
              <span style={styles.count}>{title.length} / 30</span>
            </div>
          </div>

          {/* 科目 */}
          <div style={styles.field}>
            <label style={styles.label}><span style={styles.required}>*</span> 科目</label>
            <div style={styles.chipGroup}>
              {subjects.map(s => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  style={{
                    ...styles.chip,
                    ...(subject === s ? styles.chipActive : {}),
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* 年级 */}
          <div style={styles.field}>
            <label style={styles.label}><span style={styles.required}>*</span> 年级</label>
            <div style={styles.chipGroup}>
              {grades.map(g => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  style={{
                    ...styles.chip,
                    ...(grade === g ? styles.chipActive : {}),
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* 知识点标签 */}
          <div style={styles.field} ref={tagDropdownRef}>
            <label style={styles.label}>知识点标签 <span style={styles.aiTag}>AI默认推荐</span></label>
            
            <div
              onClick={() => setTagDropdownOpen(true)}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                padding: '8px 12px',
                minHeight: 42,
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                background: '#FAFBFC',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
                ...(tagDropdownOpen ? { borderColor: '#00C9A7' } : {}),
              }}
            >
              {selectedTags.length === 0 && (
                <span style={{ color: '#94A3B8', fontSize: 13, lineHeight: '26px' }}>点击选择知识点标签...</span>
              )}
              {selectedTags.map(tagId => {
                const label = getTagLabel(tagId);
                if (!label) return null;
                return (
                  <span
                    key={tagId}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px 2px 10px',
                      background: '#E0FBF4',
                      color: '#047857',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 500,
                      lineHeight: '22px',
                    }}
                  >
                    {label}
                    <span
                      onClick={(e) => { e.stopPropagation(); removeTag(tagId); }}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 0.6 }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                    >
                      <X size={12} />
                    </span>
                  </span>
                );
              })}
            </div>

            {tagDropdownOpen && (
              <div style={{
                position: 'absolute',
                left: 0,
                right: 0,
                marginTop: 4,
                background: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                zIndex: 20,
                maxHeight: 280,
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{ padding: '8px 10px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#F8FAFE', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                    <Search size={14} color="#94A3B8" />
                    <input
                      type="text"
                      value={tagSearch}
                      onChange={e => setTagSearch(e.target.value)}
                      placeholder="搜索知识点..."
                      style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: '#1E293B', flex: 1 }}
                      autoFocus
                    />
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
                  {filteredTree.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>无匹配结果</div>
                  ) : (
                    filteredTree.map(node => (
                      <TreeNode
                        key={node.id}
                        node={node}
                        depth={0}
                        selectedTags={selectedTags}
                        expandedNodes={expandedNodes}
                        onToggleTag={toggleTag}
                        onToggleExpand={toggleExpand}
                        searchQuery={tagSearch}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        <div style={styles.footer}>
          <button
            style={{ ...styles.btn, ...styles.btnCancel }}
            onClick={onClose}
          >
            取消
          </button>
          <button
            style={{ ...styles.btn, ...styles.btnPrimary }}
            onClick={handlePublish}
          >
            {primaryText}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.38)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modal: {
    background: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    maxWidth: 1040,
    maxHeight: '92vh',
    overflowY: 'visible' as const,
    boxShadow: '0 24px 80px rgba(15, 23, 42, 0.22)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 22px 12px',
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1E293B',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748B',
  },
  content: {
    padding: '8px 22px 20px',
  },
  field: {
    marginBottom: 18,
    position: 'relative' as const,
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 14,
    fontWeight: 600,
    color: '#1E293B',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
    fontWeight: 700,
  },
  aiTag: {
    fontSize: 11,
    color: '#00C9A7',
    background: '#ECFDF5',
    padding: '1px 6px',
    borderRadius: 4,
    fontWeight: 500,
  },
  updateNotice: {
    padding: '10px 12px',
    borderRadius: 8,
    background: '#FEF3C7',
    color: '#92400E',
    fontSize: 13,
    lineHeight: 1.5,
    marginBottom: 16,
  },
  newGameNotice: {
    padding: '10px 12px',
    borderRadius: 8,
    background: '#E0F2FE',
    color: '#075985',
    fontSize: 13,
    lineHeight: 1.5,
    marginBottom: 16,
  },
  inputWrap: {
    width: '100%',
    border: '1px solid #E2E8F0',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    transition: 'border-color 0.15s',
    background: '#FFFFFF',
    boxSizing: 'border-box' as const,
  },
  input: {
    flex: 1,
    minWidth: 0,
    padding: '9px 12px',
    border: 'none',
    fontSize: 14,
    outline: 'none',
    background: 'transparent',
    boxSizing: 'border-box' as const,
  },
  count: {
    padding: '0 10px',
    color: '#94A3B8',
    fontSize: 13,
    flexShrink: 0,
  },
  chipGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    minWidth: 52,
    height: 34,
    padding: '0 16px',
    borderRadius: 999,
    border: '1px solid #CBD5E1',
    background: '#F8FAFC',
    color: '#334155',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  chipActive: {
    borderColor: '#00C9A7',
    background: '#CCFBF1',
    color: '#047857',
    fontWeight: 700,
  },
  switchRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'background 0.2s',
    position: 'relative' as const,
    flexShrink: 0,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    position: 'absolute' as const,
    top: 2,
    transition: 'transform 0.2s',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    padding: '14px 22px 18px',
    borderTop: '1px solid #E2E8F0',
  },
  btn: {
    padding: '12px 24px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.15s',
  },
  btnCancel: {
    background: '#FFFFFF',
    color: '#64748B',
    border: '1px solid #E2E8F0',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #00C9A7, #00A8E8)',
    color: '#FFFFFF',
  },
};

function TreeNode({
  node,
  depth,
  selectedTags,
  expandedNodes,
  onToggleTag,
  onToggleExpand,
  searchQuery,
}: {
  node: KnowledgeTag;
  depth: number;
  selectedTags: string[];
  expandedNodes: Set<string>;
  onToggleTag: (id: string) => void;
  onToggleExpand: (id: string) => void;
  searchQuery: string;
}) {
  const hasChildren = !!node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id) || !!searchQuery;
  const isLeaf = !hasChildren;
  const isSelected = selectedTags.includes(node.id);

  const getAllLeafIds = (n: KnowledgeTag): string[] => {
    if (!n.children) return [n.id];
    return n.children.flatMap(getAllLeafIds);
  };

  const leafIds = hasChildren ? getAllLeafIds(node) : [];
  const selectedLeafCount = leafIds.filter(id => selectedTags.includes(id)).length;
  const isPartial = hasChildren && selectedLeafCount > 0 && selectedLeafCount < leafIds.length;
  const isAllSelected = hasChildren && leafIds.length > 0 && selectedLeafCount === leafIds.length;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '5px 10px 5px ' + (12 + depth * 20) + 'px',
          cursor: 'pointer',
          transition: 'background 0.1s',
          fontSize: 13,
          color: '#334155',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFE'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        onClick={() => {
          if (isLeaf) {
            onToggleTag(node.id);
          } else {
            onToggleExpand(node.id);
          }
        }}
      >
        {hasChildren ? (
          <span style={{ display: 'flex', alignItems: 'center', width: 16, flexShrink: 0 }}>
            {isExpanded ? <ChevronDown size={14} color="#94A3B8" /> : <ChevronRight size={14} color="#94A3B8" />}
          </span>
        ) : (
          <span style={{ width: 16, flexShrink: 0 }} />
        )}

        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 16,
            height: 16,
            borderRadius: 3,
            border: (isSelected || isAllSelected) ? 'none' : '1.5px solid #CBD5E1',
            background: (isSelected || isAllSelected) ? '#00C9A7' : isPartial ? '#00C9A7' : '#fff',
            flexShrink: 0,
            transition: 'all 0.15s',
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (isLeaf) {
              onToggleTag(node.id);
            }
          }}
        >
          {(isSelected || isAllSelected) && <Check size={11} color="#fff" strokeWidth={3} />}
          {isPartial && !isAllSelected && (
            <span style={{ width: 8, height: 2, background: '#fff', borderRadius: 1 }} />
          )}
        </span>

        <span style={{ flex: 1, userSelect: 'none' }}>{node.label}</span>
        {hasChildren && (
          <span style={{ fontSize: 11, color: '#94A3B8' }}>{selectedLeafCount}/{leafIds.length}</span>
        )}
      </div>

      {hasChildren && isExpanded && node.children!.map(child => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          selectedTags={selectedTags}
          expandedNodes={expandedNodes}
          onToggleTag={onToggleTag}
          onToggleExpand={onToggleExpand}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  );
}
