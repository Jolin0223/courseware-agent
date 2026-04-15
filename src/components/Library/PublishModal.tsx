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
  '博文妙笔', '书法', '数学', '英语',
];

const grades = [
  'S1', 'S2', 'S3',
  '一年级', '二年级', '三年级',
  '四年级', '五年级', '六年级',
];

function generatePlayGuide(title: string, subject: string, grade: string): string {
  return `本课件面向${grade}学生，是一款${subject}学科的互动游戏——"${title}"。学生通过点击、拖拽等操作完成趣味挑战，系统自动判定对错并给予即时反馈，支持多轮闯关和积分奖励，帮助学生在游戏中巩固知识、提升学习兴趣。`;
}

interface PublishModalProps {
  coursewareId: number;
  onClose: () => void;
  onPublishSuccess?: () => void;
}

export default function PublishModal({ coursewareId, onClose, onPublishSuccess }: PublishModalProps) {
  const { coursewares, updateCourseware } = useCoursewareStore();

  const courseware = useMemo(() => {
    return coursewares.find(c => c.id === coursewareId)
      || mockCoursewares.find(c => c.id === coursewareId);
  }, [coursewareId, coursewares]);

  const [title, setTitle] = useState(courseware?.title || '');
  const [subject, setSubject] = useState(courseware?.subject || '语文');
  const [grade, setGrade] = useState(courseware?.grade || '一年级');
  const [playGuide, setPlayGuide] = useState(() =>
    generatePlayGuide(courseware?.title || '', courseware?.subject || '语文', courseware?.grade || '一年级')
  );
  const [showConversation, setShowConversation] = useState(true);
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

  const getAllLeafIds = (node: KnowledgeTag): string[] => {
    if (!node.children) return [node.id];
    return node.children.flatMap(getAllLeafIds);
  };

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
    updateCourseware(coursewareId, {
      title,
      subject,
      grade,
      showConversation,
      isPublished: true,
    });
    toast('发布成功~');
    onPublishSuccess?.();
    onClose();
  };

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
          <span style={styles.title}>发布作品</span>
          <button style={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div style={styles.content}>
          {/* 课件标题 */}
          <div style={styles.field}>
            <label style={styles.label}>📌 课件标题</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={styles.input}
              onFocus={e => e.currentTarget.style.borderColor = '#00C9A7'}
              onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'}
            />
          </div>

          {/* 年级 & 学科 */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>🎓 年级 <span style={styles.aiTag}>AI推荐</span></label>
              <select value={grade} onChange={e => setGrade(e.target.value)} style={styles.select}>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>📚 学科 <span style={styles.aiTag}>AI推荐</span></label>
              <select value={subject} onChange={e => setSubject(e.target.value)} style={styles.select}>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* 知识点标签 */}
          <div style={styles.field} ref={tagDropdownRef}>
            <label style={styles.label}>🏷️ 知识点标签 <span style={styles.aiTag}>AI推荐</span></label>
            
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
                      borderRadius: 12,
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

          {/* 玩法说明 */}
          <div style={styles.field}>
            <label style={styles.label}>🎮 玩法说明 <span style={styles.aiTag}>AI生成</span></label>
            <textarea
              value={playGuide}
              onChange={e => setPlayGuide(e.target.value)}
              style={styles.textarea}
              rows={3}
              onFocus={e => e.currentTarget.style.borderColor = '#00C9A7'}
              onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'}
            />
          </div>

          {/* 查看历史对话开关 */}
          <div style={styles.field}>
            <div style={styles.switchRow}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#1E293B' }}>💬 查看历史对话</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                  开启后，其他老师可以通过查看回放看到你的历史对话
                </div>
              </div>
              <div
                onClick={() => setShowConversation(v => !v)}
                style={{
                  ...styles.switchTrack,
                  background: showConversation ? '#00C9A7' : '#CBD5E1',
                }}
              >
                <div style={{
                  ...styles.switchThumb,
                  transform: showConversation ? 'translateX(20px)' : 'translateX(2px)',
                }} />
              </div>
            </div>
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
            确认发布
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
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 680,
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #E2E8F0',
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
    padding: '20px 24px',
  },
  field: {
    marginBottom: 16,
    position: 'relative' as const,
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
    fontWeight: 500,
    color: '#1E293B',
    marginBottom: 8,
  },
  aiTag: {
    fontSize: 11,
    color: '#00C9A7',
    background: '#ECFDF5',
    padding: '1px 6px',
    borderRadius: 4,
    fontWeight: 500,
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box' as const,
  },
  select: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    background: '#fff',
    cursor: 'pointer',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
    lineHeight: 1.6,
    fontFamily: 'inherit',
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
    padding: '16px 24px',
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
