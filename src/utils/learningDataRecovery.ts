import type { LearningDataRecoveryItem, LearningDataRecoverySummary } from '../types';

export const learningDataRecoveryHelpText = '支持回收得分、正确率、用时、答对题数、完成次数和奖励数量等学情指标。';

const metricItems: Record<string, Omit<LearningDataRecoveryItem, 'checked'>> = {
  finalScore: {
    id: 'final-score',
    label: '总得分',
    description: '用于展示学生本次互动的整体得分。',
  },
  accuracy: {
    id: 'accuracy',
    label: '正确率',
    description: '用于展示学生本次答题的准确程度。',
  },
  totalTime: {
    id: 'total-time',
    label: '总用时',
    description: '用于展示学生完成本次互动所用时间。',
  },
  correctCount: {
    id: 'correct-count',
    label: '答对题数',
    description: '用于展示学生答对了多少道题。',
  },
  completionCount: {
    id: 'completion-count',
    label: '完成次数',
    description: '用于展示学生完成本互动的次数。',
  },
  rewardCount: {
    id: 'reward-count',
    label: '奖励数量',
    description: '用于展示学生获得的星星、装备或奖励数量。',
  },
  passedLevels: {
    id: 'passed-levels',
    label: '通关关卡数',
    description: '用于展示学生通过了多少个关卡。',
  },
};

const withChecked = (items: Array<Omit<LearningDataRecoveryItem, 'checked'>>, checkedIds?: Set<string>): LearningDataRecoveryItem[] =>
  items.map(item => ({
    ...item,
    checked: checkedIds ? checkedIds.has(item.id) : true,
  }));

export const getRecoveryItemsForCourseware = (
  title?: string,
  initialItems?: LearningDataRecoveryItem[]
): LearningDataRecoveryItem[] => {
  const checkedIds = initialItems?.length
    ? new Set(initialItems.filter(item => item.checked).map(item => item.id))
    : undefined;
  const normalizedTitle = title || '';

  if (normalizedTitle.includes('近义词大挑战')) {
    return withChecked([
      metricItems.finalScore,
      metricItems.accuracy,
      metricItems.totalTime,
      metricItems.correctCount,
      metricItems.completionCount,
    ], checkedIds);
  }

  if (normalizedTitle.includes('单词神枪手')) {
    return withChecked([
      metricItems.finalScore,
      metricItems.accuracy,
      metricItems.totalTime,
      metricItems.correctCount,
      metricItems.completionCount,
      metricItems.rewardCount,
    ], checkedIds);
  }

  if (normalizedTitle.includes('比绳子长短')) {
    return withChecked([
      metricItems.finalScore,
      metricItems.accuracy,
      metricItems.totalTime,
      metricItems.correctCount,
      metricItems.completionCount,
      metricItems.passedLevels,
    ], checkedIds);
  }

  if (normalizedTitle.includes('水果单词互动乐园') || normalizedTitle.includes('水果单词')) {
    return withChecked([
      metricItems.finalScore,
      metricItems.accuracy,
      metricItems.totalTime,
      metricItems.correctCount,
      metricItems.completionCount,
      metricItems.rewardCount,
      metricItems.passedLevels,
    ], checkedIds);
  }

  return withChecked([
    metricItems.finalScore,
    metricItems.accuracy,
    metricItems.totalTime,
    metricItems.correctCount,
    metricItems.completionCount,
  ], checkedIds);
};

export const defaultRecoveryItems: LearningDataRecoveryItem[] = getRecoveryItemsForCourseware();

export const legacyRecoveryItems: LearningDataRecoveryItem[] = [
  {
    id: 'final-score',
    label: '总得分',
    description: '用于展示学生本次互动的整体表现。',
    checked: true,
  },
  {
    id: 'accuracy',
    label: '正确率',
    description: '用于展示学生本次答题的准确程度。',
    checked: true,
  },
  {
    id: 'correct-count',
    label: '答对题数',
    description: '用于判断学生完成了多少有效答题。',
    checked: true,
  },
  {
    id: 'answer-detail',
    label: '答题详情',
    description: '用于展示学生每道题的作答结果和易错题。',
    checked: true,
  },
  {
    id: 'question-review',
    label: '题目复盘',
    description: '用于展示学生在题目维度的得分、正确率和详情。',
    checked: true,
  },
  {
    id: 'wrong-words',
    label: '错词记录',
    description: '用于生成错词巩固和个性化复习建议。',
    checked: true,
  },
  {
    id: 'level-performance',
    label: '关卡表现',
    description: '用于展示学生在不同关卡中的完成情况。',
    checked: true,
  },
  {
    id: 'reward-count',
    label: '奖励记录',
    description: '用于展示学生在游戏过程中的奖励表现。',
    checked: true,
  },
  {
    id: 'total-time',
    label: '答题耗时',
    description: '用于判断学生完成互动的速度和熟练度。',
    checked: true,
  },
  {
    id: 'oral-performance',
    label: '口语表现',
    description: '用于展示学生在跟读、朗读等口语环节的表现。',
    checked: true,
  },
];

export const createLearningDataRecoverySummary = (
  selectedItems: LearningDataRecoveryItem[]
): LearningDataRecoverySummary => ({
  status: 'configured',
  selectedItems,
});
