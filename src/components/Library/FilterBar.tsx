import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

interface FilterBarProps {
  subjects?: string[];
  grades?: string[];
  sortOptions?: string[];
  filterSubject: string;
  filterGrade: string;
  filterType: string;
  filterPublishScope?: PublishScopeFilter;
  filterSchool?: string;
  sortBy: string;
  onFilterChange: (key: string, value: string) => void;
  onPublishScopeChange?: (value: PublishScopeFilter) => void;
  onSchoolChange?: (value: string) => void;
  onSortChange: (value: string) => void;
}

type PublishScopeFilter = '全部' | 'group' | 'school' | 'personal';

const defaultSubjects = [
  '全部', '双语故事表演', '脑力与思维', '博文妙笔',
  '语文', '创客', '美术', '思辨与口才',
  '机器人', '编程', '书法', '数学', '英语',
];

const defaultGrades = [
  '全部', 'S1', 'S2', 'S3',
  '一年级', '二年级', '三年级',
  '四年级', '五年级', '六年级',
];

const defaultSortOptions = ['最热', '最新', '最多收藏', '最多下载'];

const publishScopeOptions: { value: PublishScopeFilter; label: string }[] = [
  { value: '全部', label: '全部' },
  { value: 'group', label: '集团资源库' },
  { value: 'school', label: '校本资源库' },
  { value: 'personal', label: '个人资源库' },
];

const schools = ['北京学校', '上海学校', '广州学校', '武汉学校', '天津学校', '西安学校', '南京学校', '深圳学校'];

const styles: Record<string, React.CSSProperties> = {
  filterRow: {
    display: 'grid',
    gridTemplateColumns: '64px minmax(0, 1fr)',
    alignItems: 'center',
    columnGap: 10,
    marginBottom: 8,
  },
  filterLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 13,
    fontWeight: 750,
    color: '#1E293B',
    width: 64,
    minWidth: 64,
    lineHeight: '32px',
    whiteSpace: 'nowrap' as const,
  },
  filterTags: {
    display: 'flex',
    flexWrap: 'nowrap',
    gap: 7,
    overflowX: 'auto',
    scrollbarWidth: 'none',
  },
  filterTag: {
    height: 32,
    padding: '0 12px',
    borderRadius: 10,
    border: '1px solid #CBD5E1',
    borderColor: '#CBD5E1',
    background: '#F8FAFC',
    fontSize: 13,
    fontWeight: 850,
    color: '#475569',
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s, background 0.15s, box-shadow 0.15s',
    whiteSpace: 'nowrap' as const,
    outline: 'none',
  },
  publishLocationRow: {
    alignItems: 'center',
  },
  publishLocationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
    flex: 1,
  },
  schoolDropdownWrap: {
    position: 'relative' as const,
    flexShrink: 0,
  },
  schoolSelect: {
    height: 32,
    minWidth: 132,
    borderRadius: 10,
    border: '1px solid #CBD5E1',
    borderColor: '#CBD5E1',
    background: '#FFFFFF',
    color: '#334155',
    padding: '0 10px 0 12px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    outline: 'none',
    transition: 'border-color 0.15s, color 0.15s, background 0.15s, box-shadow 0.15s',
  },
  schoolSelectActive: {
    background: '#F6FCFF',
    borderColor: '#BFE9F5',
    color: 'var(--agent-primary-text)',
    boxShadow: '0 6px 14px rgba(14, 165, 233, 0.09)',
  },
  schoolDropdown: {
    position: 'absolute',
    top: 38,
    left: 0,
    width: 220,
    padding: 8,
    borderRadius: 10,
    border: '1px solid #D8E5EF',
    background: '#FFFFFF',
    boxShadow: '0 14px 32px rgba(15, 23, 42, 0.14)',
    zIndex: 20,
  },
  schoolSearchBox: {
    height: 34,
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '0 9px',
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
    maxHeight: 208,
    overflowY: 'auto',
  },
  schoolOption: {
    width: '100%',
    minHeight: 34,
    border: 'none',
    borderRadius: 8,
    background: '#FFFFFF',
    color: '#334155',
    fontSize: 13,
    fontWeight: 650,
    padding: '0 9px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    textAlign: 'left',
    outline: 'none',
  },
  schoolOptionActive: {
    background: '#F1FAFF',
    color: 'var(--agent-primary-text)',
    fontWeight: 800,
  },
  schoolEmpty: {
    padding: '12px 8px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
  },
  filterTagHover: {
    background: '#F6FCFF',
    borderColor: '#BFE9F5',
    color: 'var(--agent-primary-text)',
    boxShadow: '0 4px 10px rgba(14, 165, 233, 0.08)',
  },
  filterTagActive: {
    background: '#F1FAFF',
    borderColor: '#BFE9F5',
    color: 'var(--agent-primary-text)',
    fontWeight: 700,
    boxShadow: 'none',
  },
  sortRow: {
    display: 'flex',
    gap: 8,
    marginTop: 4,
  },
};

const FilterBar: React.FC<FilterBarProps> = ({
  subjects = defaultSubjects,
  grades = defaultGrades,
  sortOptions = defaultSortOptions,
  filterSubject,
  filterGrade,
  filterPublishScope,
  filterSchool = '广州学校',
  sortBy,
  onFilterChange,
  onPublishScopeChange,
  onSchoolChange,
  onSortChange,
}) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState('');
  const schoolDropdownRef = useRef<HTMLDivElement>(null);
  const filters: { label: string; key: string; value: string; options: string[] }[] = [
    { label: '学科', key: 'subject', value: filterSubject, options: subjects },
    { label: '年级', key: 'grade', value: filterGrade, options: grades },
  ];
  const filteredSchools = schools.filter(school => school.includes(schoolSearch.trim()));
  const renderFilterLabel = (label: string) => (
    <span style={styles.filterLabel} aria-label={label}>
      {Array.from(label).map((char, index) => (
        <span key={`${label}-${index}`}>{char}</span>
      ))}
    </span>
  );

  useEffect(() => {
    const handleClickAway = (event: MouseEvent) => {
      if (schoolDropdownRef.current && !schoolDropdownRef.current.contains(event.target as Node)) {
        setSchoolOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, []);

  return (
    <div style={{ padding: 0, marginBottom: 16 }}>
      {filterPublishScope && onPublishScopeChange && (
        <div style={{ ...styles.filterRow, ...styles.publishLocationRow }}>
          {renderFilterLabel('发布位置')}
          <div style={styles.publishLocationControls}>
            <div style={styles.filterTags}>
              {publishScopeOptions.map((opt) => {
                const isActive = filterPublishScope === opt.value;
                const stateKey = `publish-scope-${opt.value}`;
                const isHovered = hoveredKey === stateKey;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    style={{
                      ...styles.filterTag,
                      ...(isHovered && !isActive ? styles.filterTagHover : {}),
                      ...(isActive ? styles.filterTagActive : {}),
                    }}
                    onMouseEnter={() => setHoveredKey(stateKey)}
                    onMouseLeave={() => setHoveredKey(null)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onPublishScopeChange(opt.value);
                      if (opt.value !== 'school') setSchoolOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {filterPublishScope === 'school' && onSchoolChange && (
        <div style={styles.filterRow}>
          {renderFilterLabel('选择分校')}
          <div style={styles.schoolDropdownWrap} ref={schoolDropdownRef}>
            <button
              type="button"
              style={{
                ...styles.schoolSelect,
                ...(schoolOpen ? styles.schoolSelectActive : {}),
              }}
              onClick={() => setSchoolOpen(open => !open)}
            >
              <span>{filterSchool || '选择分校'}</span>
              <ChevronDown
                size={14}
                color="#64748B"
                style={{
                  transform: schoolOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s',
                }}
              />
            </button>
            {schoolOpen && (
              <div style={styles.schoolDropdown}>
                <div style={styles.schoolSearchBox}>
                  <Search size={14} color="#94A3B8" />
                  <input
                    value={schoolSearch}
                    onChange={event => setSchoolSearch(event.target.value)}
                    placeholder="搜索分校"
                    style={styles.schoolSearchInput}
                    autoFocus
                  />
                </div>
                <div style={styles.schoolOptionList}>
                  {filteredSchools.length === 0 ? (
                    <div style={styles.schoolEmpty}>未找到匹配分校</div>
                  ) : (
                    filteredSchools.map(school => {
                      const active = filterSchool === school;
                      return (
                        <button
                          key={school}
                          type="button"
                          style={{
                            ...styles.schoolOption,
                            ...(active ? styles.schoolOptionActive : {}),
                          }}
                          onClick={() => {
                            onSchoolChange(school);
                            setSchoolOpen(false);
                            setSchoolSearch('');
                          }}
                        >
                          <span>{school}</span>
                          {active && <Check size={14} color="#00A67D" strokeWidth={2.5} />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {filters.map((f) => (
        <div key={f.key} style={styles.filterRow}>
          {renderFilterLabel(f.label)}
          <div style={styles.filterTags}>
            {f.options.map((opt) => {
              const isActive = f.value === opt || (opt === '全部' && f.value === '全部');
              const stateKey = `${f.key}-${opt}`;
              const isHovered = hoveredKey === stateKey;
              return (
                <button
                  key={opt}
                  type="button"
                  style={{
                    ...styles.filterTag,
                    ...(isHovered && !isActive ? styles.filterTagHover : {}),
                    ...(isActive ? styles.filterTagActive : {}),
                  }}
                  onMouseEnter={() => setHoveredKey(stateKey)}
                  onMouseLeave={() => setHoveredKey(null)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onFilterChange(f.key, opt)}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {sortOptions.length > 0 && (
        <div style={styles.sortRow}>
          {sortOptions.map((opt) => {
            const isActive = sortBy === opt;
            const stateKey = `sort-${opt}`;
            const isHovered = hoveredKey === stateKey;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onSortChange(opt)}
                onMouseEnter={() => setHoveredKey(stateKey)}
                onMouseLeave={() => setHoveredKey(null)}
                onMouseDown={(event) => event.preventDefault()}
                style={{
                  ...styles.filterTag,
                  height: 30,
                  padding: '0 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  ...(isHovered && !isActive ? styles.filterTagHover : {}),
                  ...(isActive ? styles.filterTagActive : {}),
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
