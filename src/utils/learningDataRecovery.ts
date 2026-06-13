import type { LearningDataRecoveryItem, LearningDataRecoverySummary } from '../types';

export const learningDataRecoveryHelpText = '支持回收学生完成表现、错词记录、用时和互动奖励等学情数据。';

export const defaultRecoveryItems: LearningDataRecoveryItem[] = [
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
    description: '用于展示学生在互动过程中的奖励表现。',
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
