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

const publishScopes = [
  { key: 'group', label: '集团资源库', hint: '全国/集团老师可见' },
  { key: 'school', label: '校本资源库', hint: '按学校沉淀校本内容' },
  { key: 'personal', label: '个人资源库', hint: '仅自己可见' },
] as const;

const SHELL_URL = (import.meta.env.VITE_SHELL_URL || 'http://localhost:5174').replace(/\/$/, '');

const schools = ['北京学校', '上海学校', '广州学校', '武汉学校', '天津学校', '西安学校', '南京学校', '深圳学校'];

type PublishMode = 'publish' | 'update' | 'new-game';

interface UpdateTargetOption {
  id: string;
  name: string;
  currentSessionNumber?: number;
  nextSessionNumber?: number;
  urlLabel?: string;
}

interface PublishModalProps {
  coursewareId: number;
  onClose: () => void;
  onPublishSuccess?: () => void;
  mode?: PublishMode;
  updateTargets?: UpdateTargetOption[];
  selectedUpdateTargetId?: string | null;
  onUpdateTargetChange?: (id: string) => void;
}

export default function PublishModal({
  coursewareId,
  onClose,
  onPublishSuccess,
  mode = 'publish',
  updateTargets = [],
  selectedUpdateTargetId,
  onUpdateTargetChange,
}: PublishModalProps) {
  const { coursewares, addCourseware, updateCourseware } = useCoursewareStore();

  const courseware = useMemo(() => {
    return coursewares.find(c => c.id === coursewareId)
      || mockCoursewares.find(c => c.id === coursewareId);
  }, [coursewareId, coursewares]);

  const [title, setTitle] = useState(courseware?.title || '');
  const [publishScope, setPublishScope] = useState<'group' | 'school' | 'personal'>(courseware?.resourceScope || 'school');
  const [selectedSchool, setSelectedSchool] = useState(courseware?.schoolName || '广州学校');
  const [subject, setSubject] = useState(courseware?.subject || '语文');
  const [grade, setGrade] = useState(courseware?.grade || '一年级');
  const [selectedTags, setSelectedTags] = useState<string[]>(() =>
    autoTagByTitle(courseware?.title || '', courseware?.subject || '')
  );
  const [contentTags, setContentTags] = useState<string[]>(['闯关玩法', '语音跟读', '果园视觉风格']);
  const [contentTagInput, setContentTagInput] = useState('');
  const [editingContentTagIndex, setEditingContentTagIndex] = useState<number | null>(null);
  const [editingContentTagValue, setEditingContentTagValue] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
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
  const schoolDropdownRef = useRef<HTMLDivElement>(null);
  const updateTargetDropdownRef = useRef<HTMLDivElement>(null);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false);
  const [updateTargetDropdownOpen, setUpdateTargetDropdownOpen] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false);
      }
      if (schoolDropdownRef.current && !schoolDropdownRef.current.contains(e.target as Node)) {
        setSchoolDropdownOpen(false);
      }
      if (updateTargetDropdownRef.current && !updateTargetDropdownRef.current.contains(e.target as Node)) {
        setUpdateTargetDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (publishScope === 'personal') {
      setTagDropdownOpen(false);
      setTagSearch('');
    }
  }, [publishScope]);

  const toggleTag = useCallback((id: string) => {
    setSelectedTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  }, []);

  const removeTag = useCallback((id: string) => {
    setSelectedTags(prev => prev.filter(t => t !== id));
  }, []);

  const addContentTag = useCallback((value: string) => {
    const next = value.trim();
    if (!next) return;
    setContentTags(prev => prev.includes(next) ? prev : [...prev, next]);
    setContentTagInput('');
  }, []);

  const removeContentTag = useCallback((index: number) => {
    setContentTags(prev => prev.filter((_, i) => i !== index));
    if (editingContentTagIndex === index) {
      setEditingContentTagIndex(null);
      setEditingContentTagValue('');
    }
  }, [editingContentTagIndex]);

  const startEditContentTag = useCallback((index: number, value: string) => {
    setEditingContentTagIndex(index);
    setEditingContentTagValue(value);
  }, []);

  const commitEditContentTag = useCallback(() => {
    if (editingContentTagIndex === null) return;
    const next = editingContentTagValue.trim();
    setContentTags(prev => {
      if (!next) return prev.filter((_, i) => i !== editingContentTagIndex);
      return prev.map((tag, i) => i === editingContentTagIndex ? next : tag);
    });
    setEditingContentTagIndex(null);
    setEditingContentTagValue('');
  }, [editingContentTagIndex, editingContentTagValue]);

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
  const filteredSchools = useMemo(() => {
    const query = schoolSearch.trim().toLowerCase();
    if (!query) return schools;
    return schools.filter(school => school.toLowerCase().includes(query));
  }, [schoolSearch]);

  const handlePublish = () => {
    if (!title.trim()) {
      toast('请输入游戏名称');
      return;
    }
    if (mode === 'update' && updateTargets.length > 1 && !selectedUpdateTargetId) {
      toast('请选择要更新的互动游戏');
      return;
    }
    if (publishScope === 'school' && !selectedSchool) {
      toast('请选择发布到哪个学校');
      return;
    }
    if (publishScope !== 'personal' && selectedTags.length === 0) {
      toast(`请选择${publishScope === 'school' ? '校本标签' : '知识点标签'}`);
      return;
    }
    if (mode === 'new-game' && courseware) {
      const nextId = Math.max(...coursewares.map(item => item.id), coursewareId) + 1;
      addCourseware({
        ...courseware,
        id: nextId,
        title: title.trim(),
        resourceScope: publishScope,
        schoolName: publishScope === 'school' ? selectedSchool : undefined,
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
        resourceScope: publishScope,
        schoolName: publishScope === 'school' ? selectedSchool : undefined,
        subject,
        grade,
        isPublished: true,
      });
    }
    const scopeLabel = publishScopes.find(item => item.key === publishScope)?.label || '资源库';
    toast(mode === 'update' ? `已更新发布到${scopeLabel}~` : mode === 'new-game' ? `已发布为新互动游戏，并同步到${scopeLabel}~` : `发布成功，已同步到${scopeLabel}~`);
    onPublishSuccess?.();
    onClose();

    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('returnTo');
    if (returnTo) {
      window.setTimeout(() => {
        const nextReturnUrl = new URL(returnTo);
        nextReturnUrl.searchParams.set('scene', 'collected');
        nextReturnUrl.searchParams.set('scope', publishScope === 'school' ? 'school' : 'group');
        window.location.href = nextReturnUrl.toString();
      }, 650);
    }
  };

  const modalTitle = mode === 'update' ? '更新发布' : mode === 'new-game' ? '发布为新互动游戏' : '发布作品';
  const primaryText = mode === 'update' ? '确认更新发布' : mode === 'new-game' ? '确认发布为新游戏' : '确认发布';
  const shouldShowUpdateTargets = mode === 'update' && updateTargets.length > 1;
  const selectedUpdateTarget = updateTargets.find(target => target.id === selectedUpdateTargetId) || updateTargets[0];
  const shouldShowResourceTags = publishScope !== 'personal';
  const resourceTagLabel = publishScope === 'school' ? '校本标签' : '知识点标签';
  const resourceTagPlaceholder = publishScope === 'school' ? '点击选择校本标签...' : '点击选择知识点标签...';
  const openSchoolTagManager = () => {
    window.open(`${SHELL_URL}/?scene=tagAdmin&scope=school`, '_blank', 'noopener,noreferrer');
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

          <div style={styles.field}>
            <label style={styles.label}><span style={styles.required}>*</span> 发布到</label>
            <div style={styles.scopeGrid}>
              {publishScopes.map(item => {
                const active = publishScope === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setPublishScope(item.key)}
                    style={{
                      ...styles.scopeCard,
                      ...(active ? styles.scopeCardActive : {}),
                    }}
                  >
                    <span style={styles.scopeLabelRow}>
                      <span style={styles.radioDotOuter}>
                        {active && <span style={styles.radioDotInner} />}
                      </span>
                      <span style={styles.scopeCopy}>
                        <span style={styles.scopeName}>{item.label}</span>
                        <span style={styles.scopeHint}>{item.hint}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {publishScope === 'school' && (
            <div style={styles.field} ref={schoolDropdownRef}>
              <label style={styles.label}><span style={styles.required}>*</span> 选择学校</label>
              <button
                type="button"
                onClick={() => setSchoolDropdownOpen(open => !open)}
                style={{
                  ...styles.schoolSelect,
                  ...(schoolDropdownOpen ? styles.schoolSelectActive : {}),
                }}
              >
                <span style={styles.schoolSelectValue}>{selectedSchool || '请选择学校'}</span>
                <ChevronDown
                  size={16}
                  color="#64748B"
                  style={{
                    flexShrink: 0,
                    transform: schoolDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s',
                  }}
                />
              </button>
              {schoolDropdownOpen && (
                <div style={styles.schoolDropdown}>
                  <div style={styles.schoolSearchBox}>
                    <Search size={14} color="#94A3B8" />
                    <input
                      value={schoolSearch}
                      onChange={e => setSchoolSearch(e.target.value)}
                      placeholder="搜索学校"
                      style={styles.schoolSearchInput}
                      autoFocus
                    />
                  </div>
                  <div style={styles.schoolOptionList}>
                    {filteredSchools.length === 0 ? (
                      <div style={styles.schoolEmpty}>未找到匹配学校</div>
                    ) : (
                      filteredSchools.map(school => {
                        const active = selectedSchool === school;
                        return (
                          <button
                            key={school}
                            type="button"
                            onClick={() => {
                              setSelectedSchool(school);
                              setSchoolDropdownOpen(false);
                              setSchoolSearch('');
                            }}
                            style={{
                              ...styles.schoolOption,
                              ...(active ? styles.schoolOptionActive : {}),
                            }}
                          >
                            <span>{school}</span>
                            {active && <Check size={15} color="#00A67D" strokeWidth={2.6} />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
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
                onFocus={e => e.currentTarget.parentElement!.style.borderColor = 'var(--agent-primary)'}
                onBlur={e => e.currentTarget.parentElement!.style.borderColor = '#E2E8F0'}
              />
              <span style={styles.count}>{title.length} / 30</span>
            </div>
          </div>

          {shouldShowUpdateTargets && selectedUpdateTarget && (
            <div style={styles.field} ref={updateTargetDropdownRef}>
              <div style={styles.labelRow}>
                <label style={{ ...styles.label, marginBottom: 0 }}><span style={styles.required}>*</span> 选择要更新的游戏</label>
                <span style={styles.inlineHelp}>当前会话窗口中有多个已发布的游戏，需要选择更新哪个已发布的游戏。</span>
              </div>
              <button
                type="button"
                onClick={() => setUpdateTargetDropdownOpen(open => !open)}
                style={{
                  ...styles.updateTargetSelect,
                  ...(updateTargetDropdownOpen ? styles.updateTargetSelectActive : {}),
                }}
              >
                <span style={styles.updateTargetSelected}>
                  <span style={styles.updateTargetName}>{selectedUpdateTarget.name}</span>
                  <span style={styles.updateTargetMeta}>
                    当前课件中使用：会话第 {selectedUpdateTarget.currentSessionNumber || '-'} 版；更新后替换为：会话第 {selectedUpdateTarget.nextSessionNumber || '-'} 版，原链接不变
                  </span>
                </span>
                <ChevronDown
                  size={16}
                  color="#64748B"
                  style={{
                    flexShrink: 0,
                    transform: updateTargetDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s',
                  }}
                />
              </button>

              {updateTargetDropdownOpen && (
                <div style={styles.updateTargetDropdown}>
                  {updateTargets.map(target => {
                    const selected = selectedUpdateTargetId === target.id;
                    return (
                      <button
                        key={target.id}
                        type="button"
                        onClick={() => {
                          onUpdateTargetChange?.(target.id);
                          setUpdateTargetDropdownOpen(false);
                        }}
                        style={{
                          ...styles.updateTargetOption,
                          ...(selected ? styles.updateTargetOptionActive : {}),
                        }}
                      >
                        <span style={styles.updateTargetOptionTop}>
                          <span style={styles.updateTargetName}>{target.name}</span>
                          {selected && <Check size={15} color="#00A67D" strokeWidth={2.5} />}
                        </span>
                        <span style={styles.updateTargetMeta}>当前课件中使用：会话第 {target.currentSessionNumber || '-'} 版</span>
                        <span style={styles.updateTargetMeta}>更新后替换为：会话第 {target.nextSessionNumber || '-'} 版，原链接不变</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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

          {shouldShowResourceTags && (
            <div style={styles.field} ref={tagDropdownRef}>
                <div style={styles.labelRow}>
                  <label style={{ ...styles.label, marginBottom: 0 }}><span style={styles.required}>*</span> {resourceTagLabel} <span style={styles.aiTag}>AI默认推荐</span></label>
                  {publishScope === 'school' && (
                    <button type="button" style={styles.tagManageBtn} onClick={openSchoolTagManager}>
                      编辑校本标签
                    </button>
                  )}
                </div>
                
                <div
                  onClick={() => setTagDropdownOpen(true)}
                  style={{
                    ...styles.tagSelector,
                    ...(tagDropdownOpen ? styles.tagSelectorActive : {}),
                  }}
                >
                  {selectedTags.length === 0 && (
                    <span style={{ color: '#94A3B8', fontSize: 13, lineHeight: '26px' }}>{resourceTagPlaceholder}</span>
                  )}
                  {selectedTags.map(tagId => {
                    const label = getTagLabel(tagId);
                    if (!label) return null;
                    return (
                      <span
                        key={tagId}
                        style={styles.selectedTag}
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
                  <div style={styles.tagDropdown}>
                    <div style={styles.tagDropdownHeader}>
                      <div style={styles.tagSearchBox}>
                        <Search size={14} color="#94A3B8" />
                        <input
                          type="text"
                          value={tagSearch}
                          onChange={e => setTagSearch(e.target.value)}
                          placeholder={`搜索${resourceTagLabel}...`}
                          style={styles.tagSearchInput}
                          autoFocus
                        />
                      </div>
                      <span style={styles.tagSelectedCount}>已选 {selectedTags.length}</span>
                    </div>
                    <div style={styles.tagTree}>
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
          )}

          <div style={styles.field}>
            <div style={styles.labelRow}>
              <label style={{ ...styles.label, marginBottom: 0 }}>内容标签 <span style={styles.aiTag}>AI默认推荐</span></label>
              <span style={styles.optionalHint}>非必填，用于标记玩法或视觉风格</span>
            </div>
            <div style={styles.contentTagBox}>
              {contentTags.map((tag, index) => (
                editingContentTagIndex === index ? (
                  <input
                    key={`editing-${index}`}
                    value={editingContentTagValue}
                    onChange={e => setEditingContentTagValue(e.target.value)}
                    onBlur={commitEditContentTag}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commitEditContentTag();
                      }
                      if (e.key === 'Escape') {
                        setEditingContentTagIndex(null);
                        setEditingContentTagValue('');
                      }
                    }}
                    style={styles.contentTagEditInput}
                    autoFocus
                  />
                ) : (
                  <span key={`${tag}-${index}`} style={styles.contentTag}>
                    <button
                      type="button"
                      onClick={() => startEditContentTag(index, tag)}
                      style={styles.contentTagText}
                      title="点击修改内容标签"
                    >
                      {tag}
                    </button>
                    <span
                      onClick={() => removeContentTag(index)}
                      style={styles.contentTagRemove}
                      title="删除内容标签"
                    >
                      <X size={12} />
                    </span>
                  </span>
                )
              ))}
              <input
                value={contentTagInput}
                onChange={e => setContentTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addContentTag(contentTagInput);
                  }
                }}
                onBlur={() => addContentTag(contentTagInput)}
                placeholder="输入自定义标签，回车添加"
                style={styles.contentTagInput}
              />
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
    height: 'min(880px, 92vh)',
    maxHeight: '92vh',
    overflow: 'hidden',
    boxShadow: '0 24px 80px rgba(15, 23, 42, 0.22)',
    display: 'flex',
    flexDirection: 'column',
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
    overflowY: 'auto',
    flex: 1,
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
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  tagManageBtn: {
    height: 26,
    border: '1px solid #BFEFE4',
    background: 'var(--agent-soft)',
    color: '#008F78',
    borderRadius: 6,
    padding: '0 10px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  required: {
    color: '#EF4444',
    fontWeight: 700,
  },
  aiTag: {
    fontSize: 11,
    color: 'var(--agent-primary)',
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
  updateTargetSelect: {
    width: '100%',
    minHeight: 52,
    padding: '9px 12px',
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s',
  },
  updateTargetSelectActive: {
    borderColor: 'var(--agent-primary)',
    boxShadow: '0 0 0 3px var(--agent-focus-ring)',
  },
  updateTargetSelected: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    minWidth: 0,
    flex: 1,
  },
  updateTargetName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1E293B',
    lineHeight: 1.35,
  },
  updateTargetMeta: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 1.45,
  },
  updateTargetDropdown: {
    position: 'absolute',
    left: 0,
    right: 0,
    marginTop: 4,
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 10,
    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.14)',
    zIndex: 30,
    maxHeight: 280,
    overflowY: 'auto',
    padding: 6,
  },
  updateTargetOption: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 4,
    padding: '10px 12px',
    borderRadius: 8,
    border: 'none',
    background: '#FFFFFF',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.12s',
  },
  updateTargetOptionActive: {
    background: '#F0FDFA',
  },
  updateTargetOptionTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
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
    borderColor: 'var(--agent-primary)',
    background: 'var(--agent-soft-strong)',
    color: 'var(--agent-primary-text)',
    fontWeight: 700,
  },
  schoolSelect: {
    width: '100%',
    height: 42,
    borderRadius: 8,
    border: '1px solid #D8E2EF',
    background: '#FFFFFF',
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  schoolSelectActive: {
    borderColor: 'var(--agent-primary)',
    boxShadow: '0 0 0 3px var(--agent-focus-ring)',
  },
  schoolSelectValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: 600,
  },
  schoolDropdown: {
    position: 'absolute',
    left: 0,
    right: 0,
    marginTop: 6,
    borderRadius: 10,
    border: '1px solid #D8E5EF',
    background: '#FFFFFF',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.14)',
    padding: 8,
    zIndex: 35,
  },
  schoolSearchBox: {
    height: 36,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 10px',
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    background: '#F8FAFE',
    marginBottom: 6,
  },
  schoolSearchInput: {
    flex: 1,
    minWidth: 0,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: '#1E293B',
    fontSize: 13,
  },
  schoolOptionList: {
    maxHeight: 220,
    overflowY: 'auto',
    padding: '2px 0',
  },
  schoolOption: {
    width: '100%',
    minHeight: 36,
    border: 'none',
    borderRadius: 8,
    background: '#FFFFFF',
    color: '#334155',
    fontSize: 14,
    padding: '0 10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    textAlign: 'left',
  },
  schoolOptionActive: {
    background: '#ECFDF5',
    color: 'var(--agent-primary-text)',
    fontWeight: 700,
  },
  schoolEmpty: {
    padding: '14px 10px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
  },
  scopeGrid: {
    display: 'flex',
    gap: 12,
  },
  scopeCard: {
    flex: 1,
    minHeight: 68,
    borderRadius: 10,
    border: '1px solid #D8E2EF',
    background: '#FFFFFF',
    padding: '12px 14px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s',
  },
  scopeCardActive: {
    background: 'var(--agent-soft)',
    borderColor: 'var(--agent-primary)',
    boxShadow: '0 0 0 3px var(--agent-focus-ring)',
  },
  scopeLabelRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    height: '100%',
  },
  radioDotOuter: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    border: '1.5px solid var(--agent-primary)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  radioDotInner: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--agent-primary)',
  },
  scopeCopy: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 0,
  },
  scopeName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1E293B',
    flexShrink: 0,
  },
  scopeHint: {
    display: 'block',
    paddingLeft: 0,
    fontSize: 12,
    lineHeight: 1.4,
    color: '#64748B',
    whiteSpace: 'normal',
  },
  inlineHelp: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 1.4,
  },
  optionalHint: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
  },
  tagSelector: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    padding: '7px 10px',
    minHeight: 40,
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    background: '#FAFBFC',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  tagSelectorActive: {
    borderColor: 'var(--agent-primary)',
    background: '#FFFFFF',
    boxShadow: '0 0 0 3px var(--agent-focus-ring)',
  },
  selectedTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 8px 2px 10px',
    background: '#E0FBF4',
    color: 'var(--agent-primary-text)',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    lineHeight: '22px',
  },
  contentTagBox: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    minHeight: 44,
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    background: '#FAFBFC',
  },
  contentTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
    padding: '3px 7px 3px 10px',
    borderRadius: 999,
    background: '#E0FBF4',
    border: '1px solid #BFEFE4',
    color: 'var(--agent-primary-text)',
    fontSize: 12,
    fontWeight: 600,
    lineHeight: '22px',
  },
  contentTagText: {
    border: 'none',
    padding: 0,
    margin: 0,
    background: 'transparent',
    color: 'inherit',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'text',
    maxWidth: 150,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  contentTagRemove: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    opacity: 0.65,
  },
  contentTagInput: {
    minWidth: 160,
    flex: 1,
    height: 28,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: '#1E293B',
    fontSize: 13,
  },
  contentTagEditInput: {
    width: 132,
    height: 28,
    padding: '0 9px',
    borderRadius: 999,
    border: '1px solid var(--agent-primary)',
    outline: 'none',
    background: '#FFFFFF',
    color: '#1E293B',
    fontSize: 12,
    fontWeight: 600,
    boxShadow: '0 0 0 3px var(--agent-focus-ring-strong)',
  },
  tagDropdown: {
    marginTop: 6,
    background: '#fff',
    border: '1px solid #D8E5EF',
    borderRadius: 10,
    boxShadow: '0 8px 22px rgba(15, 23, 42, 0.10)',
    maxHeight: 230,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  tagDropdownHeader: {
    padding: '8px 10px',
    borderBottom: '1px solid #F1F5F9',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  tagSearchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    background: '#F8FAFE',
    borderRadius: 7,
    border: '1px solid #E2E8F0',
    flex: 1,
  },
  tagSearchInput: {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: 13,
    color: '#1E293B',
    flex: 1,
  },
  tagSelectedCount: {
    color: '#00A67D',
    background: '#ECFDF5',
    borderRadius: 999,
    padding: '4px 9px',
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  tagTree: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 0',
  },
  fieldTip: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
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
    border: 'none',
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
    flexShrink: 0,
    background: '#FFFFFF',
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
    background: 'var(--agent-gradient)',
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
            background: (isSelected || isAllSelected) ? 'var(--agent-primary)' : isPartial ? 'var(--agent-primary)' : '#fff',
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
