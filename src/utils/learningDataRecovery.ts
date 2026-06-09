import type { LearningDataRecoveryItem, LearningDataRecoverySummary } from '../types';

export const learningDataRecoveryHelpText = '支持回收学生完成表现、错词记录、用时和游戏奖励等学情数据。';

export const defaultRecoveryItems: LearningDataRecoveryItem[] = [
  {
    id: 'final-score',
    label: '最终得分',
    description: '用于展示学生本次互动的整体表现。',
    checked: true,
  },
  {
    id: 'correct-count',
    label: '答对题数',
    description: '用于判断学生完成了多少有效答题。',
    checked: true,
  },
  {
    id: 'wrong-words',
    label: '错词记录',
    description: '用于生成错词巩固和个性化复习建议。',
    checked: true,
  },
  {
    id: 'reward-count',
    label: '收集到的装备数量',
    description: '用于展示学生在游戏过程中的奖励表现。',
    checked: true,
  },
  {
    id: 'total-time',
    label: '总用时',
    description: '用于判断学生完成互动的速度和熟练度。',
    checked: true,
  },
];

export const createLearningDataRecoverySummary = (
  selectedItems: LearningDataRecoveryItem[]
): LearningDataRecoverySummary => ({
  status: 'configured',
  selectedItems,
});
