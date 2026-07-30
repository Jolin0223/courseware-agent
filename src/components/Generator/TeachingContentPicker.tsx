import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Cloud,
  Database,
  FileText,
  Plus,
  Search,
  X,
} from 'lucide-react';
import type {
  TeachingContentSource,
  TeachingQuestionItem,
  TeachingWordItem,
  UploadedAttachment,
} from '../../types';
import './augustDemo.css';

type PickerMode = 'question-bank' | 'word-book' | 'cloud-pages' | null;

interface TeachingContentPickerProps {
  disabled?: boolean;
  onAdd: (attachment: UploadedAttachment) => void;
  editAttachment?: UploadedAttachment | null;
  onUpdate?: (attachment: UploadedAttachment) => void;
  onEditEnd?: () => void;
}

type DemoQuestion = TeachingQuestionItem;

const demoQuestions: DemoQuestion[] = [
  { id: 'math-1', subject: '数学', type: '填空题', level: '容易', content: '28场比赛中，有____人参加了乒乓球选拔赛。', knowledge: '组合数计算', answer: '8', analysis: '根据表格中的参赛项目逐项计数，参加乒乓球选拔赛的共有 8 人。' },
  { id: 'math-2', subject: '数学', type: '单选题', level: '较易', content: '把 12 个苹果平均分给 3 个小组，每组有多少个？', knowledge: '除法应用', options: ['3个', '4个', '6个', '9个'], answer: '4个', analysis: '平均分用除法计算：12 ÷ 3 = 4。' },
  { id: 'math-3', subject: '数学', type: '判断题', level: '一般', content: '两个相同的三角形一定能拼成一个平行四边形。', knowledge: '图形与几何', options: ['正确', '错误'], answer: '正确', analysis: '两个全等三角形沿对应边拼接，可以组成一个平行四边形。' },
  { id: 'math-4', subject: '数学', type: '应用题', level: '一般', content: '一根绳子剪去 1/4 后还剩 6 米，原来长多少米？', knowledge: '分数应用', answer: '8米', analysis: '剩下的是原长的 3/4，原长为 6 ÷ 3/4 = 8 米。' },
  { id: 'chinese-1', subject: '语文', type: '单选题', level: '容易', content: '“晴”的部首是下面哪一个？', knowledge: '偏旁部首', options: ['日', '青', '月', '目'], answer: '日', analysis: '“晴”与太阳和天气有关，部首是日字旁。' },
  { id: 'chinese-2', subject: '语文', type: '排序题', level: '较易', content: '按课文内容排列《小蝌蚪找妈妈》的情节顺序。', knowledge: '课文理解', answer: '遇到鲤鱼妈妈 → 遇到乌龟 → 找到青蛙妈妈', analysis: '按照小蝌蚪寻找妈妈时遇到不同动物的先后顺序排列。' },
  { id: 'chinese-3', subject: '语文', type: '填空题', level: '一般', content: '补全诗句：欲穷千里目，________。', knowledge: '古诗积累', answer: '更上一层楼', analysis: '诗句出自王之涣《登鹳雀楼》。' },
  { id: 'english-1', subject: '英语', type: '单选题', level: '容易', content: 'Choose the correct word for “下雨的”：____.', knowledge: '天气词汇', options: ['rainy', 'cloudy', 'windy', 'sunny'], answer: 'rainy', analysis: 'rain 表示“雨”，rainy 表示“下雨的”。' },
  { id: 'english-2', subject: '英语', type: '匹配题', level: '较易', content: 'Match rainy, cloudy, snowy and windy with the pictures.', knowledge: '天气词汇', answer: 'rainy-下雨；cloudy-多云；snowy-下雪；windy-有风', analysis: '根据图片中的雨、云、雪和风等天气特征完成匹配。' },
  { id: 'english-3', subject: '英语', type: '填空题', level: '一般', content: 'How is the weather? It is ______ today.', knowledge: '天气句型', answer: '根据图片填写 rainy / cloudy / snowy / windy / sunny', analysis: '使用 It is + 天气形容词描述当天的天气。' },
];

const demoWords: TeachingWordItem[] = [
  { id: 'rainy', word: 'rainy', phonetic: '/ˈreɪni/', meaning: '下雨的', audioAvailable: true },
  { id: 'cloudy', word: 'cloudy', phonetic: '/ˈklaʊdi/', meaning: '多云的', audioAvailable: true },
  { id: 'snowy', word: 'snowy', phonetic: '/ˈsnəʊi/', meaning: '下雪的', audioAvailable: true },
  { id: 'windy', word: 'windy', phonetic: '/ˈwɪndi/', meaning: '有风的', audioAvailable: true },
  { id: 'sunny', word: 'sunny', phonetic: '/ˈsʌni/', meaning: '晴朗的', audioAvailable: true },
  { id: 'umbrella', word: 'umbrella', phonetic: '/ʌmˈbrelə/', meaning: '雨伞', audioAvailable: true },
  { id: 'weather', word: 'weather', phonetic: '/ˈweðə(r)/', meaning: '天气', audioAvailable: true },
  { id: 'wow', word: 'wow', phonetic: '/waʊ/', meaning: '哇', audioAvailable: true },
  { id: "let's", word: "let's", phonetic: '/lets/', meaning: '让我们', audioAvailable: true },
];

const cloudFiles = [
  { id: 'cloud-file-1', name: '期末 通用 一年级上 全册课件.pptx', owner: '李肖萌', date: '2026-01-12', pages: 68 },
  { id: 'cloud-file-2', name: '一年级英语自然拼读合集.pptx', owner: '李肖萌', date: '2026-01-12', pages: 42 },
  { id: 'cloud-file-3', name: 'Weather 单元复习互动课件.pptx', owner: '王老师', date: '2026-07-18', pages: 10 },
];

const menuItems = [
  { id: 'question-bank', icon: Database, title: '从学科题库选题', description: '将所选题目做成互动练习、闯关或讲评' },
  { id: 'word-book', icon: BookOpen, title: '从英语词书选词', description: '围绕所选单词生成认读、听音、拼写或口语练习' },
  { id: 'cloud-pages', icon: Cloud, title: '从云盘课件选页面', description: '提取指定页面的内容、风格或玩法，生成新课件' },
] as const;

const createAttachment = (source: TeachingContentSource): UploadedAttachment => ({
  id: source.id,
  type: source.type,
  name: source.name,
  teachingSource: source,
});

export default function TeachingContentPicker({
  disabled,
  onAdd,
  editAttachment,
  onUpdate,
  onEditEnd,
}: TeachingContentPickerProps) {
  const editingSource = editAttachment?.teachingSource;
  const initialQuestions = editingSource?.type === 'question-bank' ? editingSource.questionItems || [] : [];
  const initialWords = editingSource?.type === 'word-book' ? editingSource.wordItems || [] : [];
  const initialPages = editingSource?.type === 'cloud-pages' ? editingSource.pageNumbers || [] : [];
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuDirection, setMenuDirection] = useState<'up' | 'down'>('up');
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number | 'auto'; bottom: number | 'auto' }>({ left: 0, top: 0, bottom: 'auto' });
  const [mode, setMode] = useState<PickerMode>(editingSource?.type || null);
  const [questionSubject, setQuestionSubject] = useState<DemoQuestion['subject']>(initialQuestions[0]?.subject || '数学');
  const [questionType, setQuestionType] = useState('全部');
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set(initialQuestions.map(item => item.id)));
  const [selectedUnit, setSelectedUnit] = useState(editingSource?.unit || 'Unit 2');
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set(initialWords.map(item => item.id)));
  const [cloudScope, setCloudScope] = useState<'group' | 'school' | 'personal'>(editingSource?.cloudScope || 'group');
  const [selectedCloudFileId, setSelectedCloudFileId] = useState(editingSource?.cloudFileId || cloudFiles[0].id);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set(initialPages));
  const [cloudPageBatch, setCloudPageBatch] = useState(Math.floor(((initialPages[0] || 1) - 1) / 12));
  const menuRef = useRef<HTMLDivElement>(null);
  const menuPopupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node) && !menuPopupRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [menuOpen]);

  useEffect(() => {
    if (!mode) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMode(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mode]);

  const visibleQuestions = useMemo(() => demoQuestions.filter(question => (
    question.subject === questionSubject && (questionType === '全部' || question.type === questionType)
  )), [questionSubject, questionType]);

  const openPicker = (id: typeof menuItems[number]['id']) => {
    setMenuOpen(false);
    if (id === 'question-bank') setSelectedQuestions(new Set());
    if (id === 'word-book') setSelectedWords(new Set());
    if (id === 'cloud-pages') {
      setSelectedPages(new Set());
      setCloudPageBatch(0);
    }
    setMode(id);
  };

  const closePicker = () => {
    setMode(null);
    if (editAttachment) onEditEnd?.();
  };

  const saveAttachment = (source: TeachingContentSource) => {
    const attachment = createAttachment(source);
    if (editAttachment && editAttachment.type === source.type) {
      onUpdate?.({ ...attachment, id: editAttachment.id });
    } else {
      onAdd(attachment);
    }
    closePicker();
  };

  const toggleInSet = <T,>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, value: T, limit: number) => {
    setter(previous => {
      const next = new Set(previous);
      if (next.has(value)) next.delete(value);
      else if (next.size < limit) next.add(value);
      return next;
    });
  };

  const confirmQuestions = () => {
    const questions = demoQuestions.filter(question => selectedQuestions.has(question.id));
    if (!questions.length) return;
    const subjects = Array.from(new Set(questions.map(question => question.subject))).join('、');
    saveAttachment({
      id: editAttachment?.teachingSource?.id || `question-bank-${Date.now()}`,
      type: 'question-bank',
      name: `${subjects}题库 · ${questions.length}题`,
      sourceLabel: '学科题库',
      summary: `小学 · ${questions.map(question => question.knowledge).filter((item, index, all) => all.indexOf(item) === index).slice(0, 2).join('、')} · 已选 ${questions.length} 题`,
      itemCount: questions.length,
      items: questions.map(question => question.content),
      questionItems: questions,
    });
    setSelectedQuestions(new Set());
  };

  const confirmWords = () => {
    const words = demoWords.filter(word => selectedWords.has(word.id));
    if (!words.length) return;
    saveAttachment({
      id: editAttachment?.teachingSource?.id || `word-book-${Date.now()}`,
      type: 'word-book',
      name: `人教一起二年级下 · ${selectedUnit}`,
      sourceLabel: '英语词书',
      summary: `二年级下册 · ${selectedUnit} · 已选 ${words.length} 个单词`,
      itemCount: words.length,
      items: words.map(item => item.word),
      wordItems: words,
      unit: selectedUnit,
    });
    setSelectedWords(new Set());
  };

  const confirmCloudPages = () => {
    const file = cloudFiles.find(item => item.id === selectedCloudFileId) || cloudFiles[0];
    const pages = Array.from(selectedPages).sort((a, b) => a - b);
    if (!pages.length) return;
    const scopeLabel = cloudScope === 'group' ? '集团云盘' : cloudScope === 'school' ? '校本云盘' : '个人云盘';
    saveAttachment({
      id: editAttachment?.teachingSource?.id || `cloud-pages-${Date.now()}`,
      type: 'cloud-pages',
      name: file.name,
      sourceLabel: scopeLabel,
      summary: `已选第 ${pages.join('、')} 页，共 ${pages.length} 页`,
      itemCount: pages.length,
      pageNumbers: pages,
      pageItems: pages.map(pageNumber => ({
        pageNumber,
        title: pageNumber === 1 ? 'Unit Review' : pageNumber % 3 === 0 ? 'Ask and answer' : 'rainy · cloudy',
        subtitle: pageNumber % 2 === 0 ? 'sunny · windy' : 'listen · choose',
      })),
      cloudScope,
      cloudFileId: file.id,
    });
    setSelectedPages(new Set());
    setCloudPageBatch(0);
  };

  const modal = mode ? createPortal(
    <div className="aug-modal-mask" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) closePicker();
    }}>
      <section className={`aug-modal aug-modal-${mode}`} role="dialog" aria-modal="true">
        <header className="aug-modal-header">
          <div>
            <h2>{mode === 'question-bank' ? '从学科题库选题' : mode === 'word-book' ? '从英语词书选词' : '从云盘课件选择页面'}</h2>
            <p>{mode === 'question-bank' ? '筛选并选择本次课件要使用的题目' : mode === 'word-book' ? '按教材与单元选择本次要练习的单词' : '原课件不受影响，只读取你选中的页面内容'}</p>
          </div>
          <button className="aug-icon-button" onClick={closePicker} aria-label="关闭"><X size={19} /></button>
        </header>

        {mode === 'question-bank' && (
          <div className="aug-picker-body aug-question-layout">
            <aside className="aug-picker-aside">
              <label className="aug-search"><Search size={16} /><input placeholder="搜索知识点" /></label>
              <h3>知识树</h3>
              {['思维_计算（1.0版）', '思维_几何（1.0版）', '思维_数论（1.0版）', '校内_数与代数', '校内_图形与几何', '校内_统计与概率'].map((item, index) => (
                <button key={item} className={`aug-tree-item ${index === 3 ? 'is-active' : ''}`}><ChevronRight size={15} />{item}</button>
              ))}
            </aside>
            <main className="aug-picker-main">
              <div className="aug-filter-block">
                <div className="aug-filter-row"><strong>学科</strong>{(['数学', '语文', '英语'] as const).map(item => <button key={item} className={questionSubject === item ? 'is-active' : ''} onClick={() => { setQuestionSubject(item); setQuestionType('全部'); }}>{item}</button>)}</div>
                <div className="aug-filter-row"><strong>题型</strong>{['全部', '单选题', '填空题', '判断题', '应用题', '排序题', '匹配题'].map(item => <button key={item} className={questionType === item ? 'is-active' : ''} onClick={() => setQuestionType(item)}>{item}</button>)}</div>
                <div className="aug-filter-row"><strong>难度</strong>{['全部', '容易', '较易', '一般', '较难'].map((item, index) => <button key={item} className={index === 0 ? 'is-active' : ''}>{item}</button>)}</div>
                <div className="aug-select-row"><button>三年级 <ChevronRight size={14} /></button><button>上学期 <ChevronRight size={14} /></button><button>全国 <ChevronRight size={14} /></button></div>
              </div>
              <div className="aug-results-toolbar">
                <span>共筛选 <b>10,000</b> 道题</span>
                <button onClick={() => setSelectedQuestions(previous => {
                  const next = new Set(previous);
                  visibleQuestions.forEach(question => { if (next.size < 20) next.add(question.id); });
                  return next;
                })}>加入本页全部题目</button>
              </div>
              <div className="aug-question-list">
                {visibleQuestions.map((question, index) => {
                  const selected = selectedQuestions.has(question.id);
                  return <button key={question.id} className={`aug-question-item ${selected ? 'is-selected' : ''}`} onClick={() => toggleInSet(setSelectedQuestions, question.id, 20)}>
                    <span className="aug-question-index">{index + 1}</span>
                    <span className="aug-question-copy">
                      <span><i>{question.level}</i><i>{question.type}</i>{question.knowledge}</span>
                      <b>{question.content}</b>
                      {selected && (
                        <span className="aug-question-detail">
                          {question.options?.length ? <em>{question.options.join(' / ')}</em> : null}
                          <strong>答案：{question.answer}</strong>
                          <small>{question.analysis}</small>
                        </span>
                      )}
                    </span>
                    <span className="aug-check">{selected && <Check size={15} />}</span>
                  </button>;
                })}
              </div>
            </main>
          </div>
        )}

        {mode === 'word-book' && (
          <div className="aug-picker-body aug-word-layout">
            <aside className="aug-unit-list">
              <h3>词书选词</h3>
              {['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5', 'Unit 6'].map(unit => <button key={unit} className={selectedUnit === unit ? 'is-active' : ''} onClick={() => setSelectedUnit(unit)}>{unit}</button>)}
            </aside>
            <main className="aug-picker-main">
              <div className="aug-word-filters">
                <button>二年级 <ChevronRight size={14} /></button><button>下册 <ChevronRight size={14} /></button><button>人教一起 <ChevronRight size={14} /></button><button>人教一起 二年级下册 <ChevronRight size={14} /></button>
                <label className="aug-search"><Search size={16} /><input placeholder="搜索你想要的单词" /></label>
              </div>
              <button className="aug-select-all" onClick={() => setSelectedWords(selectedWords.size === demoWords.length ? new Set() : new Set(demoWords.map(item => item.id)))}><span className={selectedWords.size === demoWords.length ? 'is-checked' : ''}>{selectedWords.size === demoWords.length && <Check size={14} />}</span>全选</button>
              <div className="aug-word-grid">
                {demoWords.map(word => {
                  const selected = selectedWords.has(word.id);
                  return (
                    <button key={word.id} className={selected ? 'is-selected' : ''} onClick={() => toggleInSet(setSelectedWords, word.id, 30)}>
                      <span>
                        <b>{word.word}</b>
                        {selected && <small>{word.phonetic} · {word.meaning}</small>}
                      </span>
                      {selected && <Check size={15} />}
                    </button>
                  );
                })}
              </div>
            </main>
          </div>
        )}

        {mode === 'cloud-pages' && (
          <div className="aug-picker-body aug-cloud-layout">
            <aside className="aug-cloud-scopes">
              <h3>云盘导入</h3>
              {([['group', '集团云盘'], ['school', '校本云盘'], ['personal', '个人云盘']] as const).map(([id, label]) => <button key={id} className={cloudScope === id ? 'is-active' : ''} onClick={() => setCloudScope(id)}><Cloud size={16} />{label}</button>)}
            </aside>
            <main className="aug-cloud-files">
              <div className="aug-cloud-path">集团云盘 <ChevronRight size={14} /> 期末复习课件 <ChevronRight size={14} /> 一年级</div>
              {cloudFiles.map(file => <button key={file.id} className={selectedCloudFileId === file.id ? 'is-selected' : ''} onClick={() => { setSelectedCloudFileId(file.id); setSelectedPages(new Set()); setCloudPageBatch(0); }}>
                <span className="aug-radio">{selectedCloudFileId === file.id && <span />}</span><FileText size={18} /><b>{file.name}</b><small>{file.owner}</small><small>{file.date}</small>
              </button>)}
            </main>
            <aside className="aug-cloud-pages">
              <div className="aug-cloud-pages-title"><div><b>手动选择页面</b><span>跨页勾选会保留</span></div><span>最多20页</span></div>
              <div className="aug-page-grid">
                {Array.from({ length: Math.min(12, Math.max(0, (cloudFiles.find(file => file.id === selectedCloudFileId)?.pages || 8) - cloudPageBatch * 12)) }, (_, index) => cloudPageBatch * 12 + index + 1).map(page => <button key={page} className={selectedPages.has(page) ? 'is-selected' : ''} onClick={() => toggleInSet(setSelectedPages, page, 20)}>
                  <span className="aug-page-check">{selectedPages.has(page) && <Check size={13} />}</span>
                  <span className="aug-page-preview"><i>Weather</i><b>{page === 1 ? 'Unit Review' : page % 3 === 0 ? 'Ask and answer' : 'rainy  cloudy'}</b><small>{page % 2 === 0 ? 'sunny · windy' : 'listen · choose'}</small></span>
                  <span>页面 {page}</span>
                </button>)}
              </div>
              <div className="aug-page-pagination">
                <button disabled={cloudPageBatch === 0} onClick={() => setCloudPageBatch(previous => Math.max(0, previous - 1))}>上一页</button>
                <span>{cloudPageBatch * 12 + 1}-{Math.min((cloudPageBatch + 1) * 12, cloudFiles.find(file => file.id === selectedCloudFileId)?.pages || 8)} / 共 {cloudFiles.find(file => file.id === selectedCloudFileId)?.pages || 8} 页</span>
                <button disabled={(cloudPageBatch + 1) * 12 >= (cloudFiles.find(file => file.id === selectedCloudFileId)?.pages || 8)} onClick={() => setCloudPageBatch(previous => previous + 1)}>下一页</button>
              </div>
            </aside>
          </div>
        )}

        <footer className="aug-modal-footer">
          <span>{mode === 'question-bank' ? `已选 ${selectedQuestions.size}/20 题` : mode === 'word-book' ? `已选 ${selectedWords.size}/30 个单词` : `已选 ${selectedPages.size}/20 页`}</span>
          <div><button className="aug-button-secondary" onClick={closePicker}>取消</button><button className="aug-button-primary" disabled={mode === 'question-bank' ? !selectedQuestions.size : mode === 'word-book' ? !selectedWords.size : !selectedPages.size} onClick={mode === 'question-bank' ? confirmQuestions : mode === 'word-book' ? confirmWords : confirmCloudPages}>{editAttachment ? '保存修改' : '确定添加'}</button></div>
        </footer>
      </section>
    </div>,
    document.body,
  ) : null;

  const menu = menuOpen ? createPortal(
    <div
      ref={menuPopupRef}
      className={`aug-add-menu aug-add-menu-portal ${menuDirection === 'down' ? 'is-down' : ''}`}
      style={{ left: menuPosition.left, top: menuPosition.top, bottom: menuPosition.bottom }}
    >
      {menuItems.map(item => {
        const Icon = item.icon;
        return <button key={item.id} className={`aug-add-menu-item aug-add-menu-item-${item.id}`} onClick={() => openPicker(item.id)}><span className="aug-add-menu-icon"><Icon size={18} /></span><span className="aug-add-menu-copy"><b>{item.title}</b><small>{item.description}</small></span><ChevronRight className="aug-add-menu-arrow" size={16} /></button>;
      })}
    </div>,
    document.body,
  ) : null;

  return (
    <div className="aug-add-content" ref={menuRef}>
      <button className="aug-add-trigger" type="button" disabled={disabled} onClick={() => {
        if (!menuOpen && menuRef.current) {
          const rect = menuRef.current.getBoundingClientRect();
          const direction = rect.top < 330 ? 'down' : 'up';
          const menuWidth = Math.min(382, window.innerWidth - 32);
          setMenuDirection(direction);
          setMenuPosition({
            left: Math.max(16, Math.min(rect.left, window.innerWidth - menuWidth - 16)),
            top: direction === 'down' ? rect.bottom + 8 : 'auto',
            bottom: direction === 'up' ? window.innerHeight - rect.top + 8 : 'auto',
          });
        }
        setMenuOpen(previous => !previous);
      }} aria-expanded={menuOpen} aria-label="教学内容">
        <span className="aug-add-trigger-icon"><Plus size={12} strokeWidth={2.4} /></span>
        <span>教学内容</span>
        <ChevronDown className={`aug-add-trigger-chevron ${menuOpen ? 'is-open' : ''}`} size={14} />
      </button>
      {menu}
      {modal}
    </div>
  );
}
