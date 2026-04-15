import React from 'react';

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
  '全部', '语文', '创客', '美术', '思辨与口才',
  '脑力与思维', '双语故事表演', '机器人', '编程',
  '博文妙笔', '书法', '数学', '英语',
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
              return (
                <button
                  key={opt}
                  style={{
                    ...styles.filterTag,
                    ...(isActive ? styles.filterTagActive : {}),
                  }}
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
            return (
              <button
                key={opt}
                onClick={() => onSortChange(opt)}
                style={{
                  padding: '4px 14px',
                  borderRadius: 16,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: '0.15s',
                  border: 'none',
                  background: isActive ? '#0EA5E9' : '#F1F5F9',
                  color: isActive ? '#fff' : '#64748B',
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
