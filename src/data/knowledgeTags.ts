export interface KnowledgeTag {
  id: string;
  label: string;
  children?: KnowledgeTag[];
}

export const knowledgeTagTree: KnowledgeTag[] = [
  {
    id: 'chinese',
    label: '语文',
    children: [
      {
        id: 'chinese-pinyin',
        label: '拼音',
        children: [
          { id: 'chinese-pinyin-initials', label: '声母' },
          { id: 'chinese-pinyin-finals', label: '韵母' },
          { id: 'chinese-pinyin-tones', label: '声调' },
          { id: 'chinese-pinyin-spelling', label: '拼读' },
        ],
      },
      {
        id: 'chinese-chars',
        label: '识字写字',
        children: [
          { id: 'chinese-chars-recognize', label: '认字' },
          { id: 'chinese-chars-stroke', label: '笔画笔顺' },
          { id: 'chinese-chars-radical', label: '偏旁部首' },
          { id: 'chinese-chars-structure', label: '字形结构' },
        ],
      },
      {
        id: 'chinese-reading',
        label: '阅读理解',
        children: [
          { id: 'chinese-reading-comprehension', label: '短文理解' },
          { id: 'chinese-reading-poetry', label: '古诗词' },
          { id: 'chinese-reading-idiom', label: '成语' },
        ],
      },
    ],
  },
  {
    id: 'math',
    label: '数学',
    children: [
      {
        id: 'math-number',
        label: '数与运算',
        children: [
          { id: 'math-number-recognize', label: '数字认知' },
          { id: 'math-number-addition', label: '加法' },
          { id: 'math-number-subtraction', label: '减法' },
          { id: 'math-number-multiplication', label: '乘法' },
          { id: 'math-number-division', label: '除法' },
          { id: 'math-number-table', label: '乘法口诀' },
        ],
      },
      {
        id: 'math-geometry',
        label: '图形与几何',
        children: [
          { id: 'math-geometry-shape', label: '平面图形' },
          { id: 'math-geometry-solid', label: '立体图形' },
          { id: 'math-geometry-symmetry', label: '对称' },
        ],
      },
      {
        id: 'math-logic',
        label: '逻辑推理',
        children: [
          { id: 'math-logic-pattern', label: '找规律' },
          { id: 'math-logic-classify', label: '分类与排序' },
        ],
      },
    ],
  },
  {
    id: 'english',
    label: '英语',
    children: [
      {
        id: 'english-alphabet',
        label: '字母',
        children: [
          { id: 'english-alphabet-upper', label: '大写字母' },
          { id: 'english-alphabet-lower', label: '小写字母' },
          { id: 'english-alphabet-match', label: '大小写配对' },
        ],
      },
      {
        id: 'english-words',
        label: '单词',
        children: [
          { id: 'english-words-animal', label: '动物' },
          { id: 'english-words-fruit', label: '水果' },
          { id: 'english-words-color', label: '颜色' },
          { id: 'english-words-body', label: '身体部位' },
          { id: 'english-words-family', label: '家庭成员' },
          { id: 'english-words-number', label: '数字' },
          { id: 'english-words-weather', label: '天气' },
          { id: 'english-words-food', label: '食物' },
        ],
      },
      {
        id: 'english-grammar',
        label: '语法',
        children: [
          { id: 'english-grammar-tense', label: '时态' },
          { id: 'english-grammar-singular-plural', label: '单复数' },
          { id: 'english-grammar-preposition', label: '介词' },
        ],
      },
      {
        id: 'english-sentence',
        label: '句型',
        children: [
          { id: 'english-sentence-greeting', label: '问候语' },
          { id: 'english-sentence-daily', label: '日常对话' },
          { id: 'english-sentence-question', label: '疑问句' },
        ],
      },
      {
        id: 'english-phonics',
        label: '自然拼读',
        children: [
          { id: 'english-phonics-vowel', label: '元音' },
          { id: 'english-phonics-consonant', label: '辅音' },
          { id: 'english-phonics-blend', label: '字母组合' },
        ],
      },
    ],
  },
  {
    id: 'science',
    label: '科学',
    children: [
      {
        id: 'science-nature',
        label: '自然常识',
        children: [
          { id: 'science-nature-animal', label: '动物世界' },
          { id: 'science-nature-plant', label: '植物认知' },
          { id: 'science-nature-weather', label: '天气现象' },
          { id: 'science-nature-season', label: '四季变化' },
        ],
      },
      {
        id: 'science-experiment',
        label: '科学实验',
        children: [
          { id: 'science-experiment-water', label: '水的变化' },
          { id: 'science-experiment-magnet', label: '磁铁' },
          { id: 'science-experiment-light', label: '光与影' },
        ],
      },
    ],
  },
];

/**
 * 根据课件标题和学科自动推荐知识点标签
 */
export function autoTagByTitle(title: string, subject: string): string[] {
  const tags: string[] = [];
  const t = title.toLowerCase();

  if (subject === '英语' || t.includes('英语')) {
    if (t.includes('字母') || t.includes('letter') || t.includes('alphabet')) {
      tags.push('english-alphabet-match', 'english-alphabet-upper', 'english-alphabet-lower');
    }
    if (t.includes('单词') || t.includes('word') || t.includes('拼写')) {
      tags.push('english-words-animal', 'english-words-fruit');
    }
    if (t.includes('动物') || t.includes('animal')) {
      tags.push('english-words-animal');
    }
    if (t.includes('水果') || t.includes('fruit')) {
      tags.push('english-words-fruit');
    }
    if (t.includes('颜色') || t.includes('color')) {
      tags.push('english-words-color');
    }
    if (t.includes('拼读') || t.includes('phonics')) {
      tags.push('english-phonics-vowel', 'english-phonics-consonant');
    }
    if (tags.length === 0) {
      tags.push('english-words-animal');
    }
  }

  if (subject === '数学' || t.includes('数学')) {
    if (t.includes('乘法') || t.includes('口诀')) {
      tags.push('math-number-multiplication', 'math-number-table');
    }
    if (t.includes('加法') || t.includes('加减')) {
      tags.push('math-number-addition');
    }
    if (t.includes('减法')) {
      tags.push('math-number-subtraction');
    }
    if (t.includes('图形') || t.includes('几何')) {
      tags.push('math-geometry-shape');
    }
    if (t.includes('规律') || t.includes('逻辑')) {
      tags.push('math-logic-pattern');
    }
    if (tags.length === 0) {
      tags.push('math-number-recognize');
    }
  }

  if (subject === '语文' || t.includes('语文')) {
    if (t.includes('拼音')) {
      tags.push('chinese-pinyin-spelling', 'chinese-pinyin-initials');
    }
    if (t.includes('识字') || t.includes('认字') || t.includes('汉字')) {
      tags.push('chinese-chars-recognize');
    }
    if (t.includes('古诗') || t.includes('诗词')) {
      tags.push('chinese-reading-poetry');
    }
    if (t.includes('成语')) {
      tags.push('chinese-reading-idiom');
    }
    if (tags.length === 0) {
      tags.push('chinese-chars-recognize');
    }
  }

  return [...new Set(tags)];
}

/**
 * 根据 id 获取标签的完整路径名（如 "英语 > 单词 > 动物"）
 */
export function getTagLabel(id: string, tree: KnowledgeTag[] = knowledgeTagTree): string | null {
  for (const node of tree) {
    if (node.id === id) return node.label;
    if (node.children) {
      const found = getTagLabel(id, node.children);
      if (found) return found;
    }
  }
  return null;
}
