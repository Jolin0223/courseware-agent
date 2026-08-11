import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Cloud,
  Database,
  Eye,
  FileText,
  Folder,
  Grid2X2,
  Library,
  Plus,
  RotateCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type {
  TeachingContentSource,
  TeachingQuestionItem,
  TeachingWordItem,
  UploadedAttachment,
} from '../../types';
import './augustDemo.css';
import './TeachingContentPicker.css';

type PickerMode = 'question-bank' | 'word-book' | 'cloud-pages' | null;
type DemoQuestion = TeachingQuestionItem;
type DemoWord = TeachingWordItem & { unit: string };

interface TeachingContentPickerProps {
  disabled?: boolean;
  onAdd: (attachment: UploadedAttachment) => void;
  editAttachment?: UploadedAttachment | null;
  onUpdate?: (attachment: UploadedAttachment) => void;
  onEditEnd?: () => void;
}

const CONTENT_LIMITS = {
  questions: 20,
  words: 30,
  pages: 10,
} as const;

const baseQuestions: DemoQuestion[] = [
  { id: 'math-1', subject: '数学', type: '填空题', level: '一般', content: '农场里养了25只白兔和15只灰兔。饲养员要把灰兔关进笼子里，每个笼子最多关5只白兔或者3只灰兔。需要准备____个笼子才能把白兔全部关好。', knowledge: '除法应用', answer: '5', analysis: '白兔共有25只，每个笼子最多5只，25÷5=5。' },
  { id: 'math-2', subject: '数学', type: '填空题', level: '一般', content: '图书馆新买了40本故事书和20本科普书，管理员要把科普书平均摆到4个书架上。每个书架摆____本科普书。', knowledge: '平均分', answer: '5', analysis: '20÷4=5，每个书架摆5本科普书。' },
  { id: 'math-3', subject: '数学', type: '填空题', level: '一般', content: '原来有4个兴趣小组在做手工，每组6人，后来又来了12名同学。如果小组数量不变，那么现在平均每组有____人。', knowledge: '两步计算', answer: '9', analysis: '原有24人，加上12人共36人，36÷4=9。' },
  { id: 'math-4', subject: '数学', type: '应用题', level: '一般', content: '原来有6个小组在图书馆看书，每组5人，后来又加入了18人。如果分的组数不变，那么现在平均每组有____人。', knowledge: '两步计算', answer: '8', analysis: '原有30人，加上18人共48人，48÷6=8。' },
  { id: 'chinese-1', subject: '语文', type: '单选题', level: '容易', content: '“晴”的部首是下面哪一个？', knowledge: '偏旁部首', options: ['日', '青', '月', '目'], answer: '日', analysis: '“晴”与太阳和天气有关，部首是日字旁。' },
  { id: 'chinese-2', subject: '语文', type: '排序题', level: '较易', content: '按课文内容排列《小蝌蚪找妈妈》的情节顺序。', knowledge: '课文理解', answer: '遇到鲤鱼妈妈 → 遇到乌龟 → 找到青蛙妈妈', analysis: '按照小蝌蚪寻找妈妈时遇到不同动物的先后顺序排列。' },
  { id: 'chinese-3', subject: '语文', type: '填空题', level: '一般', content: '补全诗句：欲穷千里目，________。', knowledge: '古诗积累', answer: '更上一层楼', analysis: '诗句出自王之涣《登鹳雀楼》。' },
  { id: 'english-1', subject: '英语', type: '单选题', level: '容易', content: 'Choose the correct word for “下雨的”：____.', knowledge: '天气词汇', options: ['rainy', 'cloudy', 'windy', 'sunny'], answer: 'rainy', analysis: 'rain 表示“雨”，rainy 表示“下雨的”。' },
  { id: 'english-2', subject: '英语', type: '匹配题', level: '较易', content: 'Match rainy, cloudy, snowy and windy with the pictures.', knowledge: '天气词汇', answer: 'rainy-下雨；cloudy-多云；snowy-下雪；windy-有风', analysis: '根据图片中的雨、云、雪和风等天气特征完成匹配。' },
  { id: 'english-3', subject: '英语', type: '填空题', level: '一般', content: 'How is the weather? It is ______ today.', knowledge: '天气句型', answer: '根据图片填写 rainy / cloudy / snowy / windy / sunny', analysis: '使用 It is + 天气形容词描述当天的天气。' },
];

const extraQuestionContent = {
  数学: ['一本书有60页，小红已经看了24页，剩下的6天看完。平均每天看____页。', '二年级（1）班去春游，男生有16人，女生有8人，每4人一组，可以分成____组。', '裁缝店有一块长12米的蓝布和一块长15米的花布，现在每3米做一幅窗帘，可以做____幅窗帘。', '妈妈买了24颗巧克力和18颗水果糖，平均分给3个小朋友，每个小朋友分到____颗糖。', '体育室里有16个篮球和20个足球。老师把足球平均分给4个班级，每个班级分到____个足球。', '一盒彩笔有8支，6盒彩笔一共有____支。', '48名同学平均站成6排，每排有____名同学。', '一根24米长的绳子平均剪成3段，每段长____米。'],
  语文: ['选择“高兴”的近义词。', '“春眠不觉晓”的下一句是________。', '下面哪个词语描写的是春天？', '把“我 喜欢 读书”排列成一句通顺的话。', '“跑”字的部首是________。', '选择量词：一____小河。'],
  英语: ['Choose the word for “晴朗的”.', 'What colour is the sky?', 'Complete: I can ____ a kite.', 'Choose the correct plural form of book.', 'Match the animal words with the pictures.', 'Complete: How ____ you?'],
} as const;

const extraQuestions: DemoQuestion[] = [
  ...extraQuestionContent.数学.map((content, index) => ({ id: `math-extra-${index + 1}`, subject: '数学' as const, type: index % 3 === 0 ? '应用题' : '填空题', level: index % 2 === 0 ? '较易' : '一般', content, knowledge: index % 2 === 0 ? '除法应用' : '乘法应用', answer: String((index + 1) * 2), analysis: '根据题意列式计算并检查单位。' })),
  ...extraQuestionContent.语文.map((content, index) => ({ id: `chinese-extra-${index + 1}`, subject: '语文' as const, type: index % 2 === 0 ? '单选题' : '填空题', level: index % 3 === 0 ? '容易' : '较易', content, knowledge: '语文基础', answer: '参考答案', analysis: '结合词义、句意或课文内容作答。' })),
  ...extraQuestionContent.英语.map((content, index) => ({ id: `english-extra-${index + 1}`, subject: '英语' as const, type: index % 2 === 0 ? '单选题' : '填空题', level: index % 3 === 0 ? '容易' : '一般', content, knowledge: '英语基础', answer: '参考答案', analysis: '根据单词含义或句型结构作答。' })),
];

const demoQuestions = [...baseQuestions, ...extraQuestions];

const wordUnits: Record<string, Array<[string, string, string]>> = {
  'Unit 1': [['play football', '踢足球', '/pleɪ ˈfʊtbɔːl/'], ['fly a kite', '放风筝', '/flaɪ ə kaɪt/'], ['ride a bike', '骑自行车', '/raɪd ə baɪk/'], ['make a model plane', '做飞机模型', '/meɪk ə ˈmɒdl pleɪn/'], ['swim', '游泳', '/swɪm/'], ['make a snowman', '堆雪人', '/meɪk ə ˈsnəʊmæn/'], ["can't", '不能', '/kɑːnt/']],
  'Unit 2': [['rainy', '下雨的', '/ˈreɪni/'], ['cloudy', '多云的', '/ˈklaʊdi/'], ['snowy', '下雪的', '/ˈsnəʊi/'], ['windy', '有风的', '/ˈwɪndi/'], ['sunny', '晴朗的', '/ˈsʌni/'], ['umbrella', '雨伞', '/ʌmˈbrelə/'], ['weather', '天气', '/ˈweðə(r)/']],
  'Unit 3': [['school', '学校', '/skuːl/'], ['classroom', '教室', '/ˈklɑːsruːm/'], ['library', '图书馆', '/ˈlaɪbrəri/'], ['teacher', '老师', '/ˈtiːtʃə(r)/'], ['student', '学生', '/ˈstjuːdnt/'], ['desk', '书桌', '/desk/'], ['chair', '椅子', '/tʃeə(r)/']],
  'Unit 4': [['tiger', '老虎', '/ˈtaɪɡə(r)/'], ['panda', '熊猫', '/ˈpændə/'], ['rabbit', '兔子', '/ˈræbɪt/'], ['monkey', '猴子', '/ˈmʌŋki/'], ['elephant', '大象', '/ˈelɪfənt/'], ['giraffe', '长颈鹿', '/dʒəˈrɑːf/'], ['lion', '狮子', '/ˈlaɪən/']],
  'Unit 5': [['bread', '面包', '/bred/'], ['milk', '牛奶', '/mɪlk/'], ['rice', '米饭', '/raɪs/'], ['noodles', '面条', '/ˈnuːdlz/'], ['apple', '苹果', '/ˈæpl/'], ['banana', '香蕉', '/bəˈnɑːnə/'], ['orange', '橙子', '/ˈɒrɪndʒ/']],
  'Unit 6': [['run', '跑', '/rʌn/'], ['jump', '跳', '/dʒʌmp/'], ['dance', '跳舞', '/dɑːns/'], ['sing', '唱歌', '/sɪŋ/'], ['draw', '画画', '/drɔː/'], ['read', '阅读', '/riːd/'], ['write', '写', '/raɪt/']],
};

const demoWords: DemoWord[] = Object.entries(wordUnits).flatMap(([unit, words]) => words.map(([word, meaning, phonetic], index) => ({
  id: `${unit.toLowerCase().replace(' ', '-')}-${index + 1}`,
  word,
  meaning,
  phonetic,
  audioAvailable: true,
  unit,
})));

const cloudFiles = [
  { id: 'cloud-file-1', name: '1-Unit 1 Colours–Word Focus【词汇】', owner: '纪世新', date: '2026-01-14', size: '3.1 MB', pages: 6 },
  { id: 'cloud-file-2', name: '2-Unit 1 Colours–Grammar Focus【语法】', owner: '纪世新', date: '2026-01-14', size: '2.5 MB', pages: 8 },
  { id: 'cloud-file-3', name: '3-Unit 1 Colours–Go Starters【技能】', owner: '纪世新', date: '2026-01-14', size: '7.9 MB', pages: 12 },
  { id: 'cloud-file-4', name: '4-Unit 2 Animals–Word Focus【词汇】', owner: '纪世新', date: '2026-01-14', size: '15.7 MB', pages: 15 },
  { id: 'cloud-file-5', name: '5-Unit 2 Animals–Grammar Focus【语法】', owner: '纪世新', date: '2026-01-14', size: '3.7 MB', pages: 9 },
  { id: 'cloud-file-6', name: '6-Unit 2 Animals–Go Starters【技能】', owner: '纪世新', date: '2026-01-14', size: '4.1 MB', pages: 7 },
  { id: 'cloud-file-7', name: '7-Unit 3 School, Numbers 1–10–Word Focus【词汇】', owner: '纪世新', date: '2026-01-14', size: '5.2 MB', pages: 10 },
  { id: 'cloud-file-8', name: '8-Unit 3 School, Numbers 1–10–Grammar Focus【语法】', owner: '纪世新', date: '2026-01-14', size: '2.3 MB', pages: 8 },
  { id: 'cloud-file-9', name: '9-Unit 3 School, Numbers 1–10–Go Starters【技能】', owner: '纪世新', date: '2026-01-14', size: '8.2 MB', pages: 11 },
  { id: 'cloud-file-10', name: '10-Unit 4 Transport–Word Focus【词汇】', owner: '纪世新', date: '2026-01-14', size: '3.0 MB', pages: 6 },
];

const menuItems = [
  { id: 'question-bank', icon: Database, title: '从学科题库选题', description: '将所选题目做成互动练习、闯关或讲评' },
  { id: 'word-book', icon: BookOpen, title: '从英语词书选词', description: '围绕所选单词生成认读、听音、拼写或口语练习' },
  { id: 'cloud-pages', icon: Cloud, title: '从云盘课件选页面', description: '提取指定页面的内容、风格或玩法' },
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
  const [selectedUnit, setSelectedUnit] = useState(editingSource?.unit?.split('、')[0] || 'Unit 1');
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set(initialWords.map(item => item.id)));
  const [cloudScope, setCloudScope] = useState<'group' | 'school' | 'personal'>(editingSource?.cloudScope || 'group');
  const [selectedCloudFileId, setSelectedCloudFileId] = useState(editingSource?.cloudFileId || cloudFiles[0].id);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set(initialPages));
  const [cloudPageBatch, setCloudPageBatch] = useState(Math.floor(((initialPages[0] || 1) - 1) / 12));
  const [validationMessage, setValidationMessage] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const menuPopupRef = useRef<HTMLDivElement>(null);

  const visibleQuestions = useMemo(() => demoQuestions.filter(question => (
    question.subject === questionSubject && (questionType === '全部' || question.type === questionType)
  )), [questionSubject, questionType]);
  const visibleWords = useMemo(() => demoWords.filter(word => word.unit === selectedUnit), [selectedUnit]);
  const selectedWordItems = useMemo(() => demoWords.filter(word => selectedWords.has(word.id)), [selectedWords]);
  const selectedCloudFile = cloudFiles.find(file => file.id === selectedCloudFileId) || cloudFiles[0];
  const visibleCloudPages = Array.from(
    { length: Math.min(12, Math.max(0, selectedCloudFile.pages - cloudPageBatch * 12)) },
    (_, index) => cloudPageBatch * 12 + index + 1,
  );

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
      if (event.key === 'Escape') {
        setMode(null);
        if (editAttachment) onEditEnd?.();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [editAttachment, mode, onEditEnd]);

  const openPicker = (id: typeof menuItems[number]['id']) => {
    setMenuOpen(false);
    setValidationMessage('');
    if (id === 'question-bank') {
      setSelectedQuestions(new Set());
      setQuestionSubject('数学');
      setQuestionType('全部');
    }
    if (id === 'word-book') {
      setSelectedWords(new Set());
      setSelectedUnit('Unit 1');
    }
    if (id === 'cloud-pages') {
      setSelectedPages(new Set());
      setCloudPageBatch(0);
      setSelectedCloudFileId(cloudFiles[0].id);
    }
    setMode(id);
  };

  const closePicker = () => {
    setMode(null);
    setValidationMessage('');
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

  const toggleInSet = <T,>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, value: T) => {
    setValidationMessage('');
    setter(previous => {
      const next = new Set(previous);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const confirmQuestions = () => {
    if (selectedQuestions.size > CONTENT_LIMITS.questions) {
      setValidationMessage(`当前已选${selectedQuestions.size}题，Agent一次最多插入${CONTENT_LIMITS.questions}题，请删除后再确定。`);
      return;
    }
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
  };

  const confirmWords = () => {
    if (selectedWords.size > CONTENT_LIMITS.words) {
      setValidationMessage(`当前已选${selectedWords.size}个单词，Agent一次最多插入${CONTENT_LIMITS.words}个，请删除后再确定。`);
      return;
    }
    const words = demoWords.filter(word => selectedWords.has(word.id));
    if (!words.length) return;
    const units = Array.from(new Set(words.map(word => word.unit)));
    const unitLabel = units.join('、');
    saveAttachment({
      id: editAttachment?.teachingSource?.id || `word-book-${Date.now()}`,
      type: 'word-book',
      name: `人教一起二年级下 · ${units.length > 2 ? `${units.length}个单元` : unitLabel}`,
      sourceLabel: '英语词书',
      summary: `二年级下册 · ${unitLabel} · 已选 ${words.length} 个单词`,
      itemCount: words.length,
      items: words.map(item => item.word),
      wordItems: words,
      unit: unitLabel,
    });
  };

  const confirmCloudPages = () => {
    const pages = Array.from(selectedPages).sort((a, b) => a - b);
    if (pages.length > CONTENT_LIMITS.pages) {
      setValidationMessage(`当前已选${pages.length}页，Agent最多理解${CONTENT_LIMITS.pages}页，请删除后再导入。`);
      return;
    }
    if (!pages.length) return;
    const scopeLabel = cloudScope === 'group' ? '集团云盘' : cloudScope === 'school' ? '校本云盘' : '个人云盘';
    saveAttachment({
      id: editAttachment?.teachingSource?.id || `cloud-pages-${Date.now()}`,
      type: 'cloud-pages',
      name: selectedCloudFile.name,
      sourceLabel: scopeLabel,
      summary: `已选第 ${pages.join('、')} 页，共 ${pages.length} 页`,
      itemCount: pages.length,
      pageNumbers: pages,
      pageItems: pages.map(pageNumber => ({
        pageNumber,
        title: pageNumber === 1 ? 'Unit 1 Colours' : pageNumber % 3 === 0 ? 'Grammar Focus' : 'Word Focus',
        subtitle: pageNumber % 2 === 0 ? 'listen · choose' : 'look · match',
      })),
      cloudScope,
      cloudFileId: selectedCloudFile.id,
    });
  };

  const selectedCount = mode === 'question-bank' ? selectedQuestions.size : mode === 'word-book' ? selectedWords.size : selectedPages.size;
  const currentLimit = mode === 'question-bank' ? CONTENT_LIMITS.questions : mode === 'word-book' ? CONTENT_LIMITS.words : CONTENT_LIMITS.pages;
  const countUnit = mode === 'question-bank' ? '题' : mode === 'word-book' ? '个单词' : '页';
  const countOverLimit = selectedCount > currentLimit;
  const confirmAction = mode === 'question-bank' ? confirmQuestions : mode === 'word-book' ? confirmWords : confirmCloudPages;

  const pickerFooter = mode ? (
    <footer className={`iteach-picker-footer iteach-picker-footer-${mode}`}>
      {mode === 'word-book' ? (
        <div className={`iteach-word-footer-selection ${selectedWordItems.length > 3 ? 'has-overflow' : ''}`} tabIndex={selectedWordItems.length > 3 ? 0 : undefined}>
          <strong>已选择单词</strong>
          <div className="iteach-word-footer-summary">{selectedWordItems.slice(0, 3).map(word => <span key={word.id}>{word.word}<button aria-label={`删除 ${word.word}`} onClick={() => toggleInSet(setSelectedWords, word.id)}><X size={11} /></button></span>)}{selectedWordItems.length > 3 && <em>+{selectedWordItems.length - 3}</em>}</div>
          {selectedWordItems.length > 3 && (
            <section className="iteach-word-selection-popover" aria-label="全部已选单词">
              <header><span>已选单词 <b>共{selectedWordItems.length}个</b></span><button onClick={() => { setSelectedWords(new Set()); setValidationMessage(''); }}><Trash2 size={13} />清空</button></header>
              <div>{selectedWordItems.map(word => <span key={word.id}>{word.word}<button aria-label={`删除 ${word.word}`} onClick={() => toggleInSet(setSelectedWords, word.id)}><X size={11} /></button></span>)}</div>
            </section>
          )}
          {validationMessage && <span className="iteach-word-limit-message" role="alert">{validationMessage}</span>}
        </div>
      ) : mode === 'cloud-pages' ? (
        <button className="iteach-footer-select-all" onClick={() => {
          setValidationMessage('');
          setSelectedPages(selectedPages.size === selectedCloudFile.pages ? new Set() : new Set(Array.from({ length: selectedCloudFile.pages }, (_, index) => index + 1)));
        }}><span className={selectedPages.size === selectedCloudFile.pages ? 'is-checked' : ''}>{selectedPages.size === selectedCloudFile.pages && <Check size={13} />}</span>全选</button>
      ) : <span className="iteach-footer-source">iTeach 题库组件</span>}
      {mode !== 'word-book' && <div className="iteach-footer-status">
        <span className={countOverLimit ? 'is-over-limit' : ''}>已选：<b>{selectedCount}</b>{countUnit} / 最多{currentLimit}{countUnit}</span>
        {validationMessage && <span className="iteach-limit-message" role="alert">{validationMessage}</span>}
      </div>}
      <div className="iteach-footer-actions">
        <button className="iteach-button-secondary" onClick={closePicker}>取消</button>
        <button className="iteach-button-primary" disabled={!selectedCount} onClick={confirmAction}>{editAttachment ? '保存修改' : mode === 'cloud-pages' ? '确定导入' : '确定'}</button>
      </div>
    </footer>
  ) : null;

  const modal = mode ? createPortal(
    <div className="aug-modal-mask iteach-picker-mask" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) closePicker();
    }}>
      <section className={`aug-modal iteach-picker-modal iteach-${mode}-modal`} role="dialog" aria-modal="true" aria-label={mode === 'question-bank' ? '从学科题库选题' : mode === 'word-book' ? '从英语词书选词' : '从云盘课件选页面'}>
        {mode === 'question-bank' && (
          <>
            <header className="iteach-question-header">
              <nav><button className="is-active">试题库</button><button>试卷库</button></nav>
              <span>脑力与思维<ChevronDown size={13} /></span>
              <button className="iteach-close-button" onClick={closePicker} aria-label="关闭"><X size={18} /></button>
            </header>
            <main className="iteach-question-body">
              <div className="iteach-question-sourcebar">
                <nav><button className="is-active">本地题库</button><button>学科网题库</button><button>菁优网题库</button></nav>
                <label><input placeholder="请输入关键词" /><Search size={16} /></label>
              </div>
              <section className="iteach-question-filters">
                <div className="iteach-question-knowledge"><strong>知识树</strong><button>请选择<ChevronDown size={14} /></button></div>
                <div><strong>来源/试卷类型</strong>{['全部', '小升初真题', '市场教辅', '进门测', '出门测', '期末测试', '期中测试', '月考', '开学考试', '单元测试', '一课一练', '竞赛', '分层测', '校内'].map((item, index) => <button key={item} className={index === 0 ? 'is-active' : ''}>{item}</button>)}</div>
                <div><strong>题型</strong>{['全部', '单选题', '多选题', '填空题', '解答题', '判断题', '计算题', '应用题', '排序题', '综合题', '问答题', '匹配题', '图形题', '归类题'].map(item => <button key={item} className={questionType === item ? 'is-active' : ''} onClick={() => setQuestionType(item)}>{item}</button>)}</div>
                <div><strong>难度</strong>{['全部', '容易', '较易', '一般', '较难', '困难'].map((item, index) => <button key={item} className={index === 0 ? 'is-active' : ''}>{item}</button>)}</div>
                <div className="iteach-question-selects"><strong>更多条件</strong><button>请选择年份<ChevronDown size={14} /></button><button>请选择年级<ChevronDown size={14} /></button><button>请选择学期<ChevronDown size={14} /></button><span className="iteach-question-subjects">{(['数学', '语文', '英语'] as const).map(item => <button key={item} className={questionSubject === item ? 'is-active' : ''} onClick={() => { setQuestionSubject(item); setQuestionType('全部'); }}>{item}</button>)}</span></div>
              </section>
              <div className="iteach-question-results-bar">
                <span>共筛选 <b>10,000</b> 道题</span><button>综合排序<ChevronDown size={13} /></button><button className="is-active">最新<ChevronDown size={13} /></button>
                <button className="iteach-question-add-all" onClick={() => {
                  setValidationMessage('');
                  setSelectedQuestions(previous => new Set([...previous, ...visibleQuestions.map(question => question.id)]));
                }}>全部添加</button>
              </div>
              <div className="iteach-question-list">
                {visibleQuestions.map((question, index) => {
                  const selected = selectedQuestions.has(question.id);
                  return <article key={question.id} className={selected ? 'is-selected' : ''}>
                    <div className="iteach-question-meta"><span>{question.level}</span><span>{question.type}</span><small>来源：小学同步题库</small><em>利用表内除法解决问题</em></div>
                    <div className="iteach-question-content"><i>{index + 1}</i><p>{question.content}</p></div>
                    {selected && <div className="iteach-question-answer"><b>答案：{question.answer}</b><span>{question.analysis}</span></div>}
                    <div className="iteach-question-row-footer"><span>“线上/线下”均可使用</span><small>更新：2026-08-11 15:{String(53 - index).padStart(2, '0')}:12</small><div><button>纠错</button><button>{selected ? '收起解析' : '展开解析'}</button><button className={selected ? 'is-added' : ''} onClick={() => toggleInSet(setSelectedQuestions, question.id)}>{selected ? <><Check size={13} />已加入</> : <><Plus size={13} />加入</>}</button></div></div>
                  </article>;
                })}
              </div>
            </main>
            {pickerFooter}
          </>
        )}

        {mode === 'word-book' && (
          <>
            <header className="iteach-word-header">
              <div className="iteach-word-title"><span><BookOpen size={17} /></span><strong>词书选词</strong></div>
              <div className="iteach-word-filters"><button>二年级<ChevronDown size={13} /></button><button>下册<ChevronDown size={13} /></button><button>人教一起<ChevronDown size={13} /></button><button>人教一起 二年级下册<ChevronDown size={13} /></button><label><Search size={14} /><input placeholder="搜索你想要的单词" /></label></div>
              <button className="iteach-close-button" onClick={closePicker} aria-label="关闭"><X size={18} /></button>
            </header>
            <div className="iteach-word-body">
              <aside>{Object.keys(wordUnits).map(unit => <button key={unit} className={selectedUnit === unit ? 'is-active' : ''} onClick={() => setSelectedUnit(unit)}>{unit}</button>)}</aside>
              <main>
                <button className="iteach-word-select-all" onClick={() => {
                  setValidationMessage('');
                  const currentIds = visibleWords.map(word => word.id);
                  const allSelected = currentIds.every(id => selectedWords.has(id));
                  setSelectedWords(previous => {
                    const next = new Set(previous);
                    currentIds.forEach(id => allSelected ? next.delete(id) : next.add(id));
                    return next;
                  });
                }}><span className={visibleWords.every(word => selectedWords.has(word.id)) ? 'is-checked' : ''}>{visibleWords.every(word => selectedWords.has(word.id)) && <Check size={13} />}</span>全选</button>
                <div className="iteach-word-grid">{visibleWords.map(word => {
                  const selected = selectedWords.has(word.id);
                  return <button key={word.id} className={selected ? 'is-selected' : ''} onClick={() => toggleInSet(setSelectedWords, word.id)}>{word.word}</button>;
                })}</div>
              </main>
            </div>
            {pickerFooter}
          </>
        )}

        {mode === 'cloud-pages' && (
          <>
            <header className="iteach-cloud-header"><strong>云盘导入</strong><button className="iteach-close-button" onClick={closePicker} aria-label="关闭"><X size={18} /></button></header>
            <div className="iteach-cloud-body">
              <aside className="iteach-cloud-tree">
                <button className="is-root"><ChevronDown size={13} /><Cloud size={16} />集团云盘</button>
                {['编程', '博文妙笔', '创客', '机器人', '美术', '脑力与思维', '思辨与口才', '书法', '数学', '双语故事表演', '语文', '英语'].map(item => <button key={item} className={item === '双语故事表演' ? 'is-active' : ''}><ChevronRight size={12} /><Folder size={15} />{item}</button>)}
                <button className="is-root" onClick={() => setCloudScope('school')}><ChevronRight size={13} /><Library size={16} />校本云盘</button>
                <button className="is-root" onClick={() => setCloudScope('personal')}><ChevronRight size={13} /><Cloud size={16} />个人云盘</button>
              </aside>
              <main className="iteach-cloud-files">
                <div className="iteach-cloud-toolbar"><div><button><ArrowLeft size={16} />返回</button><span>集团云盘</span><ChevronRight size={13} /><span>【01】Y&K切片库</span><ChevronRight size={13} /><strong>【01】YLE Starters双语专项-新编辑器（切片版）</strong><small>（共50个）</small></div><div><label><Search size={15} /><input placeholder="搜索云盘文件" /></label><button aria-label="刷新"><RotateCw size={16} /></button><button className="is-active" aria-label="宫格视图"><Grid2X2 size={16} /></button></div></div>
                <div className="iteach-cloud-columns"><span>名称</span><span>创建人</span><span>最近修改</span><span>大小</span><i /></div>
                <div className="iteach-cloud-file-list">{cloudFiles.map(file => {
                  const selected = selectedCloudFileId === file.id;
                  return <button key={file.id} className={selected ? 'is-selected' : ''} onClick={() => { setSelectedCloudFileId(file.id); setSelectedPages(new Set()); setCloudPageBatch(0); setValidationMessage(''); }}><span className="iteach-cloud-radio">{selected && <Check size={11} />}</span><FileText size={18} /><b>{file.name}</b><small>{file.owner}</small><small>{file.date}</small><small>{file.size}</small><Eye size={15} /></button>;
                })}</div>
                <div className="iteach-cloud-pagination"><span>共 50 条</span><button disabled>‹</button>{[1, 2, 3, 4, 5].map(page => <button key={page} className={page === 1 ? 'is-active' : ''}>{page}</button>)}<button>›</button><button>10条/页<ChevronDown size={12} /></button></div>
              </main>
              <aside className="iteach-cloud-pages">
                <div className="iteach-cloud-page-grid">{visibleCloudPages.map(page => <button key={page} className={selectedPages.has(page) ? 'is-selected' : ''} onClick={() => toggleInSet(setSelectedPages, page)}><span className="iteach-cloud-page-check">{selectedPages.has(page) && <Check size={12} />}</span><span className={`iteach-cloud-thumb theme-${(page % 3) + 1}`}><i>Go Starters!</i><b>{page === 1 ? 'Unit 1 Colours' : page % 3 === 0 ? 'Grammar Focus' : 'Word Focus'}</b><small>{page % 2 === 0 ? 'listen · choose' : 'look · match'}</small></span><span>{page}.页面{page + 1}</span></button>)}</div>
                {selectedCloudFile.pages > 12 && <div className="iteach-cloud-page-pagination"><button disabled={cloudPageBatch === 0} onClick={() => setCloudPageBatch(previous => Math.max(0, previous - 1))}>上一页</button><span>{cloudPageBatch + 1} / {Math.ceil(selectedCloudFile.pages / 12)}</span><button disabled={(cloudPageBatch + 1) * 12 >= selectedCloudFile.pages} onClick={() => setCloudPageBatch(previous => previous + 1)}>下一页</button></div>}
              </aside>
            </div>
            {pickerFooter}
          </>
        )}
      </section>
    </div>,
    document.body,
  ) : null;

  const menu = menuOpen ? createPortal(
    <div ref={menuPopupRef} className={`aug-add-menu aug-add-menu-portal ${menuDirection === 'down' ? 'is-down' : ''}`} style={{ left: menuPosition.left, top: menuPosition.top, bottom: menuPosition.bottom }}>
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
