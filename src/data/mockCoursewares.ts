import type { Courseware } from '../types';
import fruitGardenHTML from '../assets/courseware/fruit_garden_adventure.html?raw';
import { createLearningDataRecoverySummary, getRecoveryItemsForCourseware } from '../utils/learningDataRecovery';

// 示例课件的HTML内容
const mathBalloonHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>加减法气球爆炸</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .game-container {
      background: white;
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      text-align: center;
      max-width: 600px;
      width: 90%;
    }
    .question { font-size: 48px; font-weight: bold; color: #1E293B; margin: 30px 0; }
    .balloons { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin: 30px 0; }
    .balloon {
      width: 80px;
      height: 100px;
      border-radius: 50% 50% 50% 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 28px;
      font-weight: bold;
      color: white;
      cursor: pointer;
      transition: transform 0.2s;
      position: relative;
    }
    .balloon:hover { transform: scale(1.1); }
    .balloon::after {
      content: '';
      position: absolute;
      bottom: -20px;
      width: 2px;
      height: 20px;
      background: #CBD5E1;
    }
    .balloon.red { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .balloon.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
    .balloon.green { background: linear-gradient(135deg, #22c55e, #16a34a); }
    .balloon.yellow { background: linear-gradient(135deg, #eab308, #ca8a04); }
    .score-board {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #E2E8F0;
    }
    .score-item { text-align: center; }
    .score-value { font-size: 32px; font-weight: bold; color: #0EA5E9; }
    .score-label { font-size: 14px; color: #94A3B8; }
  </style>
</head>
<body>
  <div class="game-container">
    <h1 style="color: #1E293B; margin-bottom: 8px;">🎈 加减法气球爆炸</h1>
    <p style="color: #94A3B8;">点击正确答案让气球爆炸！</p>
    <div class="question">5 + 3 = ?</div>
    <div class="balloons">
      <div class="balloon red">6</div>
      <div class="balloon blue">8</div>
      <div class="balloon green">7</div>
      <div class="balloon yellow">9</div>
    </div>
    <div class="score-board">
      <div class="score-item">
        <div class="score-value">15</div>
        <div class="score-label">得分</div>
      </div>
      <div class="score-item">
        <div class="score-value">3</div>
        <div class="score-label">连对</div>
      </div>
    </div>
  </div>
</body>
</html>`;

const wordMatchHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>单词消除游戏</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .game-container {
      background: white;
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      text-align: center;
      max-width: 600px;
      width: 90%;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 24px 0;
    }
    .card {
      aspect-ratio: 1;
      border-radius: 12px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      border: 2px solid transparent;
    }
    .card.english {
      background: linear-gradient(135deg, #E0F2FE, #BAE6FD);
      color: #0369A1;
    }
    .card.chinese {
      background: linear-gradient(135deg, #FEE2E2, #FECACA);
      color: #B91C1C;
    }
    .card.selected {
      border-color: #0EA5E9;
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
    }
    .card.matched {
      opacity: 0.5;
      pointer-events: none;
    }
    .timer {
      font-size: 24px;
      font-weight: bold;
      color: #0EA5E9;
    }
  </style>
</head>
<body>
  <div class="game-container">
    <h1 style="color: #1E293B; margin-bottom: 8px;">🎯 单词消除</h1>
    <p style="color: #94A3B8;">匹配英文单词和中文意思</p>
    <div class="timer">⏱️ 01:30</div>
    <div class="grid">
      <div class="card english">apple</div>
      <div class="card chinese">苹果</div>
      <div class="card english">banana</div>
      <div class="card chinese">香蕉</div>
      <div class="card english">cat</div>
      <div class="card chinese">猫</div>
      <div class="card english">dog</div>
      <div class="card chinese">狗</div>
    </div>
  </div>
</body>
</html>`;

const listeningHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>听力练习</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .game-container {
      background: white;
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      text-align: center;
      max-width: 500px;
      width: 90%;
    }
    .play-btn {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0EA5E9, #0284C7);
      border: none;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 30px auto;
      box-shadow: 0 8px 24px rgba(14, 165, 233, 0.4);
      transition: transform 0.2s;
    }
    .play-btn:hover { transform: scale(1.05); }
    .play-btn svg { width: 40px; height: 40px; fill: white; margin-left: 4px; }
    .question-num { font-size: 14px; color: #94A3B8; margin-bottom: 8px; }
    .question-text { font-size: 24px; color: #1E293B; font-weight: 600; margin-bottom: 24px; }
    .options { display: flex; flex-direction: column; gap: 12px; }
    .option {
      padding: 16px 24px;
      border: 2px solid #E2E8F0;
      border-radius: 12px;
      font-size: 16px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }
    .option:hover { border-color: #0EA5E9; background: #E0F2FE; }
  </style>
</head>
<body>
  <div class="game-container">
    <h1 style="color: #1E293B; margin-bottom: 8px;">🎧 听力练习</h1>
    <p style="color: #94A3B8;">听录音选择正确答案</p>
    <button class="play-btn">
      <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
    </button>
    <div class="question-num">第 1 题</div>
    <div class="question-text">你听到了什么？</div>
    <div class="options">
      <div class="option">A. Good morning</div>
      <div class="option">B. Good afternoon</div>
      <div class="option">C. Good evening</div>
      <div class="option">D. Good night</div>
    </div>
  </div>
</body>
</html>`;

const embeddedCoursewareHTML = (src: string, title: string) => `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <base href="/" />
  <style>
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #fff; }
    iframe { width: 100%; height: 100%; border: 0; display: block; background: #fff; }
  </style>
</head>
<body>
  <iframe src="${src}" title="${title}"></iframe>
</body>
</html>`;

const synonymChallengeHTML = embeddedCoursewareHTML('/case-games/synonym/index.html', '近义词大挑战');
const wordShooterHTML = embeddedCoursewareHTML('/case-games/word-shooter/index.html', '单词神枪手');
const ropeLengthHTML = embeddedCoursewareHTML('/case-games/rope-length/index.html', '比绳子长短');
const sunWukongDressupHTML = embeddedCoursewareHTML('/demo-history/sun-wukong-dressup/index.html', '孙悟空换装搭配挑战');
const battleshipLogicHTML = embeddedCoursewareHTML('/demo-history/battleship-logic/index.html', '战舰逻辑挑战-行列推理');
const clockReadingHTML = embeddedCoursewareHTML('/demo-history/clock-reading.html', '转一转找答案-时钟认读');
const fractionPizzaHTML = embeddedCoursewareHTML('/demo-history/fraction-pizza.html', '分数披萨店-分数配餐');
const dialogueLinkingHTML = embeddedCoursewareHTML('/demo-history/dialogue-linking/index.html', '对话连连看-问答连线');
const makeAWordJellyHTML = embeddedCoursewareHTML('/demo-history/make-a-word-jelly/index.html', 'Make-a-Word果冻拼词');
const hanziRushHTML = embeddedCoursewareHTML('/demo-history/hanzi-rush/index.html', '汉字拼图Rush-部件拼字');

const learningDataFor = (title: string) => createLearningDataRecoverySummary(getRecoveryItemsForCourseware(title));

export const mockCoursewares: Courseware[] = [
  {
    id: 1,
    title: '水果单词互动乐园',
    subject: '英语',
    grade: '一年级',
    type: '水果单词',
    author: '张老师',
    publishTime: '2026-04-06',
    views: 1200,
    favorites: 89,
    likes: 156,
    htmlContent: fruitGardenHTML,
    isOwn: true,
    isPublished: true,
    resourceScope: 'school',
    schoolName: '广州学校',
    showConversation: true,
    learningDataRecovery: learningDataFor('水果单词互动乐园'),
  },
  {
    id: 2,
    title: '近义词大挑战',
    subject: '语文',
    grade: '三年级',
    type: '近义词辨析',
    author: '王老师',
    publishTime: '2026-04-05',
    views: 890,
    favorites: 67,
    likes: 123,
    htmlContent: synonymChallengeHTML,
    isOwn: false,
    isPublished: true,
    showConversation: true,
    learningDataRecovery: learningDataFor('近义词大挑战'),
  },
  {
    id: 20,
    title: '孙悟空换装搭配挑战',
    subject: '语文',
    grade: '二年级',
    type: '情境搭配',
    author: 'Jolin',
    publishTime: '2026-07-10',
    views: 1280,
    favorites: 96,
    likes: 168,
    htmlContent: sunWukongDressupHTML,
    isOwn: true,
    isPublished: false,
    resourceScope: 'personal',
    showConversation: true,
    learningDataRecovery: learningDataFor('孙悟空换装搭配挑战'),
  },
  {
    id: 21,
    title: '战舰逻辑挑战-行列推理',
    subject: '数学',
    grade: '三年级',
    type: '行列推理',
    author: 'Jolin',
    publishTime: '2026-07-09',
    views: 1160,
    favorites: 88,
    likes: 153,
    htmlContent: battleshipLogicHTML,
    isOwn: true,
    isPublished: true,
    resourceScope: 'group',
    showConversation: true,
    learningDataRecovery: learningDataFor('战舰逻辑挑战-行列推理'),
  },
  {
    id: 22,
    title: '转一转找答案-时钟认读',
    subject: '数学',
    grade: '一年级',
    type: '时钟认读',
    author: 'Jolin',
    publishTime: '2026-07-08',
    views: 1040,
    favorites: 76,
    likes: 141,
    htmlContent: clockReadingHTML,
    isOwn: true,
    isPublished: true,
    resourceScope: 'school',
    schoolName: '广州学校',
    showConversation: true,
    learningDataRecovery: learningDataFor('转一转找答案-时钟认读'),
  },
  {
    id: 23,
    title: '分数披萨店-分数配餐',
    subject: '数学',
    grade: '三年级',
    type: '分数认知',
    author: 'Jolin',
    publishTime: '2026-07-07',
    views: 1090,
    favorites: 82,
    likes: 149,
    htmlContent: fractionPizzaHTML,
    isOwn: true,
    isPublished: true,
    resourceScope: 'group',
    showConversation: true,
    learningDataRecovery: learningDataFor('分数披萨店-分数配餐'),
  },
  {
    id: 24,
    title: '对话连连看-问答连线',
    subject: '英语',
    grade: '二年级',
    type: '问答连线',
    author: 'Jolin',
    publishTime: '2026-07-06',
    views: 980,
    favorites: 71,
    likes: 132,
    htmlContent: dialogueLinkingHTML,
    isOwn: true,
    isPublished: true,
    resourceScope: 'school',
    schoolName: '深圳学校',
    showConversation: true,
    learningDataRecovery: learningDataFor('对话连连看-问答连线'),
  },
  {
    id: 25,
    title: 'Make-a-Word果冻拼词',
    subject: '英语',
    grade: '二年级',
    type: '单词拼写',
    author: 'Jolin',
    publishTime: '2026-07-05',
    views: 1210,
    favorites: 94,
    likes: 166,
    htmlContent: makeAWordJellyHTML,
    isOwn: true,
    isPublished: true,
    resourceScope: 'school',
    schoolName: '广州学校',
    showConversation: true,
    learningDataRecovery: learningDataFor('Make-a-Word果冻拼词'),
  },
  {
    id: 26,
    title: '汉字拼图Rush-部件拼字',
    subject: '语文',
    grade: '二年级',
    type: '部件拼字',
    author: 'Jolin',
    publishTime: '2026-07-04',
    views: 990,
    favorites: 73,
    likes: 136,
    htmlContent: hanziRushHTML,
    isOwn: true,
    isPublished: true,
    isDeleted: true,
    resourceScope: 'personal',
    showConversation: true,
    learningDataRecovery: learningDataFor('汉字拼图Rush-部件拼字'),
  },
  {
    id: 3,
    title: '单词神枪手',
    subject: '英语',
    grade: '三年级',
    type: '图词匹配',
    author: '张老师',
    publishTime: '2026-04-04',
    views: 2100,
    favorites: 156,
    likes: 234,
    htmlContent: wordShooterHTML,
    isOwn: false,
    isPublished: true,
    showConversation: true,
    learningDataRecovery: learningDataFor('单词神枪手'),
  },
  {
    id: 7,
    title: '比绳子长短',
    subject: '数学',
    grade: '一年级',
    type: '长短比较',
    author: '李老师',
    publishTime: '2026-04-03',
    views: 960,
    favorites: 72,
    likes: 141,
    htmlContent: ropeLengthHTML,
    isOwn: false,
    isPublished: true,
    showConversation: true,
    learningDataRecovery: learningDataFor('比绳子长短'),
  },
  {
    id: 4,
    title: '水果单词消除游戏',
    subject: '英语',
    grade: '二年级',
    type: '单词消除',
    author: '赵老师',
    publishTime: '2026-04-03',
    views: 1560,
    favorites: 112,
    likes: 198,
    htmlContent: wordMatchHTML,
    isOwn: true,
    isPublished: true,
    resourceScope: 'group',
    showConversation: false,
  },
  {
    id: 5,
    title: '英语听力练习-问候语',
    subject: '英语',
    grade: '一年级',
    type: '听力练习',
    author: '张老师',
    publishTime: '2026-04-02',
    views: 780,
    favorites: 45,
    likes: 89,
    htmlContent: listeningHTML,
    isOwn: true,
    isPublished: false,
    resourceScope: 'personal',
    showConversation: true,
  },
  {
    id: 6,
    title: '乘法口诀闯关',
    subject: '数学',
    grade: '二年级',
    type: '数学闯关',
    author: '刘老师',
    publishTime: '2026-04-01',
    views: 2340,
    favorites: 189,
    likes: 267,
    htmlContent: mathBalloonHTML,
    isOwn: true,
    isPublished: true,
    resourceScope: 'school',
    schoolName: '上海学校',
    showConversation: true,
  },
];
