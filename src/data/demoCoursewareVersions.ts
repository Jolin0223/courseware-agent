import type { CoursewareResult } from '../types';
import fruitGardenHTML from '../assets/courseware/fruit_garden_adventure.html?raw';
import animalsAdventureHTML from '../assets/courseware/animals_adventure.html?raw';
import fruitGardenReadAloudOnlyHTML from '../assets/courseware/fruit_garden_read_aloud_only.html?raw';
import animalsPlayOnlyHTML from '../assets/courseware/animals_play_only.html?raw';
import { createLearningDataRecoverySummary, getRecoveryItemsForCourseware } from '../utils/learningDataRecovery';

const recoveryFor = (title: string) => createLearningDataRecoverySummary(getRecoveryItemsForCourseware(title));

export const demoVersionResults: CoursewareResult[] = [
  {
    title: '水果单词互动乐园',
    version: 'v1.0',
    htmlContent: fruitGardenHTML,
    learningDataRecovery: recoveryFor('水果单词互动乐园'),
  },
  {
    title: '动物单词互动乐园',
    version: 'v2.0',
    htmlContent: animalsAdventureHTML,
    learningDataRecovery: recoveryFor('动物单词互动乐园'),
  },
  {
    title: '水果单词读一读',
    version: 'v3.0',
    htmlContent: fruitGardenReadAloudOnlyHTML,
    learningDataRecovery: recoveryFor('水果单词读一读'),
  },
  {
    title: '颜色单词认一认',
    version: 'v4.0',
    htmlContent: fruitGardenReadAloudOnlyHTML,
    learningDataRecovery: recoveryFor('颜色单词认一认'),
  },
  {
    title: '动物单词玩一玩',
    version: 'v5.0',
    htmlContent: animalsPlayOnlyHTML,
    learningDataRecovery: recoveryFor('动物单词玩一玩'),
  },
];

export const demoSessionVersions = [
  {
    version: 'v1',
    sessionNumber: 1,
    title: '水果单词互动乐园',
    htmlContent: fruitGardenHTML,
    publishTargetId: 'game-b',
    isHistoricalPublished: true,
    createdAt: '2026-06-05 19:21',
  },
  {
    version: 'v2',
    sessionNumber: 2,
    title: '动物单词互动乐园',
    htmlContent: animalsAdventureHTML,
    publishTargetId: 'game-b',
    isCurrentPublished: true,
    createdAt: '2026-06-05 19:34',
  },
  {
    version: 'v3',
    sessionNumber: 3,
    title: '水果单词读一读',
    htmlContent: fruitGardenReadAloudOnlyHTML,
    publishTargetId: 'game-a',
    isCurrentPublished: true,
    createdAt: '2026-06-05 19:46',
  },
  {
    version: 'v4',
    sessionNumber: 4,
    title: '颜色单词认一认',
    htmlContent: fruitGardenReadAloudOnlyHTML,
    publishTargetId: 'game-removed',
    isRemoved: true,
    createdAt: '2026-06-05 19:55',
  },
  {
    version: 'v5',
    sessionNumber: 5,
    title: '动物单词玩一玩',
    htmlContent: animalsPlayOnlyHTML,
    createdAt: '2026-06-05 20:02',
  },
] as const;

export const demoPublishedTargets = [
  {
    id: 'game-a',
    name: '水果单词读一读',
    currentVersion: 'v3',
    urlLabel: '固定链接 A',
  },
  {
    id: 'game-b',
    name: '动物单词互动乐园',
    currentVersion: 'v2',
    urlLabel: '固定链接 B',
  },
];
