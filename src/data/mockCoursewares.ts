import type { Courseware } from '../types';

// 示例课件的HTML内容
const animalSpellingHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>动物单词拼写游戏</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .game-container {
      background: white;
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      text-align: center;
      max-width: 500px;
      width: 90%;
    }
    .animal-emoji { font-size: 100px; margin: 20px 0; }
    .word-hint { font-size: 24px; color: #64748B; margin-bottom: 20px; }
    .input-area {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin: 20px 0;
    }
    .letter-box {
      width: 48px;
      height: 56px;
      border: 2px solid #E2E8F0;
      border-radius: 12px;
      font-size: 28px;
      font-weight: bold;
      text-align: center;
      line-height: 52px;
      background: #F8FAFC;
    }
    .stars { margin-top: 20px; }
    .star { color: #FCD34D; font-size: 32px; margin: 0 4px; }
    .btn {
      padding: 14px 32px;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      margin: 8px;
    }
    .btn-primary { background: #0EA5E9; color: white; }
    .btn-secondary { background: #F1F5F9; color: #64748B; }
    .progress { margin-top: 16px; color: #94A3B8; font-size: 14px; }
  </style>
</head>
<body>
  <div class="game-container">
    <h1 style="color: #1E293B; margin-bottom: 8px;">动物单词拼写</h1>
    <p style="color: #94A3B8;">看图拼出正确的英文单词</p>
    <div class="animal-emoji">🐕</div>
    <div class="word-hint">_ _ _</div>
    <div class="input-area">
      <div class="letter-box">D</div>
      <div class="letter-box">O</div>
      <div class="letter-box">G</div>
    </div>
    <div class="stars">
      <span class="star">⭐</span>
      <span class="star">⭐</span>
      <span class="star">⭐</span>
    </div>
    <div style="margin-top: 24px;">
      <button class="btn btn-secondary">提示</button>
      <button class="btn btn-primary">确认</button>
    </div>
    <div class="progress">第 3/10 题</div>
  </div>
</body>
</html>`;

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

const poemFillHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>望庐山瀑布古诗填空</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
      background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
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
    .poem-card {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      border-radius: 16px;
      padding: 30px;
      margin: 20px 0;
    }
    .poem-title { font-size: 20px; color: #92400E; margin-bottom: 16px; }
    .poem-author { font-size: 14px; color: #B45309; margin-bottom: 20px; }
    .poem-line {
      font-size: 28px;
      color: #1E293B;
      margin: 12px 0;
      line-height: 1.8;
    }
    .blank {
      display: inline-block;
      width: 60px;
      height: 36px;
      border-bottom: 3px solid #0EA5E9;
      margin: 0 4px;
      vertical-align: middle;
    }
    .options {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 24px;
    }
    .option-btn {
      padding: 12px 24px;
      border: 2px solid #E2E8F0;
      border-radius: 12px;
      font-size: 18px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
    }
    .option-btn:hover {
      border-color: #0EA5E9;
      background: #E0F2FE;
    }
  </style>
</head>
<body>
  <div class="game-container">
    <h1 style="color: #1E293B; margin-bottom: 8px;">📖 古诗填空</h1>
    <p style="color: #94A3B8;">填写正确的诗句</p>
    <div class="poem-card">
      <div class="poem-title">望庐山瀑布</div>
      <div class="poem-author">唐 · 李白</div>
      <div class="poem-line">日照香炉生紫烟，</div>
      <div class="poem-line">遥看瀑布挂前川。</div>
      <div class="poem-line">飞流直下三千尺，</div>
      <div class="poem-line">疑是银河<span class="blank"></span>九天。</div>
    </div>
    <div class="options">
      <button class="option-btn">落</button>
      <button class="option-btn">下</button>
      <button class="option-btn">挂</button>
      <button class="option-btn">流</button>
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

export const mockCoursewares: Courseware[] = [
  {
    id: 1,
    title: '动物单词拼写游戏',
    subject: '英语',
    grade: '三年级',
    type: '单词拼写',
    author: '张老师',
    publishTime: '2026-04-06',
    views: 1200,
    favorites: 89,
    likes: 156,
    htmlContent: animalSpellingHTML,
    isOwn: true,
    isPublished: true,
    showConversation: true,
  },
  {
    id: 2,
    title: '加减法气球爆炸',
    subject: '数学',
    grade: '一年级',
    type: '数学闯关',
    author: '李老师',
    publishTime: '2026-04-05',
    views: 890,
    favorites: 67,
    likes: 123,
    htmlContent: mathBalloonHTML,
    isOwn: false,
    isPublished: true,
    showConversation: true,
  },
  {
    id: 3,
    title: '望庐山瀑布古诗填空',
    subject: '语文',
    grade: '三年级',
    type: '古诗填空',
    author: '王老师',
    publishTime: '2026-04-04',
    views: 2100,
    favorites: 156,
    likes: 234,
    htmlContent: poemFillHTML,
    isOwn: false,
    isPublished: true,
    showConversation: true,
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
    showConversation: true,
  },
];
