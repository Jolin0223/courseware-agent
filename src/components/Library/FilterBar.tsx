import React, { useState } from 'react';

interface FilterBarProps {
  subjects?: string[];
  grades?: string[];
  sortOptions?: string[];
  filterSubject: string;
  filterGrade: string;
  filterType: string;
  sortBy: string;
  onFilterChange: (key: string, value: string) => void;
  onSortChange: (value: string) => void;
}

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

const styles: Record<string, React.CSSProperties> = {
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
  sortBy,
  onFilterChange,
  onSortChange,
}) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const filters: { label: string; key: string; value: string; options: string[] }[] = [
    { label: '学科', key: 'subject', value: filterSubject, options: subjects },
    { label: '年级', key: 'grade', value: filterGrade, options: grades },
  ];

  return (
    <div style={{ padding: 0, marginBottom: 16 }}>
      {filters.map((f) => (
        <div key={f.key} style={styles.filterRow}>
          <span style={styles.filterLabel}>{f.label}</span>
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
