import type { Courseware } from '../types';

export function openCoursewarePreview(courseware: Courseware, allCoursewares: Courseware[]) {
  const recommendations = allCoursewares
    .filter(c => c.id !== courseware.id && c.isPublished)
    .slice(0, 5);

  const recItems = recommendations.map(r => `
    <div class="rec-item" onclick="window.location.reload()">
      <div class="rec-thumb">
        <div class="rec-thumb-placeholder">${r.subject === '英语' ? '📚' : r.subject === '数学' ? '🔢' : '📖'}</div>
      </div>
      <div class="rec-info">
        <div class="rec-title">${r.title}</div>
        <div class="rec-meta">${r.subject} · ${r.grade}</div>
      </div>
    </div>
  `).join('');

  const previewWindow = window.open('', '_blank', 'width=1280,height=860');
  if (!previewWindow || !courseware.htmlContent) return;

  previewWindow.document.write(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${courseware.title} - 互动课件 AI Agent</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', sans-serif;
      background: #F0F2F5;
      min-height: 100vh;
      color: #1E293B;
    }

    /* Top Nav */
    .top-nav {
      background: #fff;
      height: 56px;
      display: flex;
      align-items: center;
      padding: 0 24px;
      border-bottom: 1px solid #E2E8F0;
      gap: 12px;
    }
    .nav-logo {
      display: flex; align-items: center; justify-content: center;
    }
    .nav-logo svg { width: 28px; height: 28px; }
    .nav-title {
      font-size: 16px; font-weight: 600; color: #1E293B; flex: 1;
    }
    .nav-download {
      padding: 5px 12px; border: 1px solid #E2E8F0; border-radius: 6px;
      background: #fff; font-size: 12px; color: #94A3B8; cursor: pointer;
      transition: all 0.15s; display: flex; align-items: center; gap: 4px;
    }
    .nav-download:hover { border-color: #00C9A7; color: #00C9A7; }

    /* Main Layout */
    .main-layout {
      display: flex;
      margin: 20px 0;
      gap: 20px;
      padding: 0 24px;
    }
    .left-section { flex: 1; min-width: 0; }
    .right-section { width: 280px; flex-shrink: 0; }

    /* Preview Area */
    .preview-card {
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .preview-frame-wrap {
      position: relative;
      aspect-ratio: 16/9;
      background: #f8f8f8;
    }
    .preview-frame-wrap iframe {
      width: 100%; height: 100%; border: none;
    }
    .fullscreen-btn {
      position: absolute; top: 12px; right: 12px;
      background: rgba(255,255,255,0.9); border: none; border-radius: 8px;
      padding: 6px 14px; font-size: 13px; cursor: pointer;
      display: flex; align-items: center; gap: 6px;
      color: #475569; box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: background 0.15s;
    }
    .fullscreen-btn:hover { background: #fff; }

    /* Bottom Info */
    .info-section {
      padding: 16px 20px;
      border-top: 1px solid #F1F5F9;
    }
    .desc-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 14px;
    }
    .desc-quote {
      color: #CBD5E1; font-size: 28px; line-height: 1; flex-shrink: 0; margin-top: -4px;
    }
    .desc-text {
      font-size: 13px; color: #64748B; line-height: 1.6; flex: 1;
      overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    }
    .desc-badge {
      flex-shrink: 0; padding: 6px 18px;
      background: linear-gradient(135deg, #00C9A7, #00B4A0);
      border: none; border-radius: 8px;
      font-size: 13px; color: #fff; cursor: pointer; font-weight: 500;
      transition: all 0.15s; white-space: nowrap;
    }
    .desc-badge:hover { opacity: 0.9; }

    .author-row {
      display: flex; align-items: center; justify-content: space-between;
    }
    .author-left {
      display: flex; align-items: center; gap: 10px;
    }
    .author-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, #00C9A7, #00A8E8);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 14px; font-weight: 600;
    }
    .author-name { font-size: 14px; color: #334155; font-weight: 500; }
    .author-stats {
      display: flex; align-items: center; gap: 14px; margin-left: 16px;
    }
    .stat-item {
      display: flex; align-items: center; gap: 4px; font-size: 12px; color: #94A3B8;
      cursor: pointer; transition: color 0.15s; user-select: none;
    }
    .stat-item:hover { color: #00C9A7; }
    .stat-item.active { color: #00C9A7; }
    .action-buttons { display: flex; gap: 10px; }
    .btn-secondary {
      padding: 8px 20px; border: 1px solid #E2E8F0; border-radius: 8px;
      background: #fff; font-size: 13px; color: #475569; cursor: pointer;
      display: flex; align-items: center; gap: 6px; transition: all 0.15s;
    }
    .btn-secondary:hover { border-color: #00C9A7; color: #00C9A7; }
    .btn-primary {
      padding: 8px 24px; border: none; border-radius: 8px;
      background: linear-gradient(135deg, #00C9A7, #00B4A0);
      font-size: 13px; color: #fff; cursor: pointer; font-weight: 500;
      display: flex; align-items: center; gap: 6px; transition: all 0.15s;
    }
    .btn-primary:hover { opacity: 0.9; }

    /* Right: Recommendations */
    .rec-card {
      background: #fff; border-radius: 12px; padding: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .rec-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 14px;
    }
    .rec-header-title { font-size: 15px; font-weight: 600; color: #1E293B; }
    .rec-header-count { font-size: 12px; color: #94A3B8; }
    .rec-list { display: flex; flex-direction: column; gap: 12px; }
    .rec-item {
      display: flex; gap: 12px; cursor: pointer; padding: 6px;
      border-radius: 8px; transition: background 0.15s;
    }
    .rec-item:hover { background: #F8FAFE; }
    .rec-thumb {
      width: 80px; height: 56px; border-radius: 8px; overflow: hidden;
      background: #F1F5F9; flex-shrink: 0;
    }
    .rec-thumb-placeholder {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; background: linear-gradient(135deg, #E0F2FE, #F0E7FE);
    }
    .rec-info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
    .rec-title {
      font-size: 13px; font-weight: 500; color: #334155;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      margin-bottom: 4px;
    }
    .rec-meta { font-size: 12px; color: #94A3B8; }
  </style>
</head>
<body>
  <div class="top-nav">
    <div class="nav-logo"><svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="8" width="20" height="20" rx="4" fill="#22D3EE" opacity="0.8"/><rect x="10" y="2" width="20" height="20" rx="4" fill="#4ADE80" opacity="0.9"/><rect x="10" y="8" width="12" height="14" rx="2" fill="#4ADE80"/></svg></div>
    <div class="nav-title">互动课件 AI Agent</div>
    <button class="nav-download" onclick="handleDownload()">⬇ 下载</button>
  </div>

  <div class="main-layout">
    <div class="left-section">
      <div class="preview-card">
        <div class="preview-frame-wrap">
          <iframe srcdoc="${courseware.htmlContent.replace(/"/g, '&quot;')}" title="${courseware.title}"></iframe>
          <button class="fullscreen-btn" onclick="document.querySelector('iframe').requestFullscreen()">
            🔲 全屏
          </button>
        </div>
        <div class="info-section">
          <div class="desc-row">
            <span class="desc-quote">❝</span>
            <span class="desc-text">面向${courseware.grade}学生的${courseware.subject}${courseware.type}互动课件，通过趣味游戏化设计提升学习兴趣与效果。</span>
            <div class="action-buttons">
              <button class="btn-secondary" onclick="window.close()">💬 查看对话</button>
              <button class="desc-badge" onclick="window.opener && window.opener.postMessage({ type: 'clone-courseware', coursewareId: ${courseware.id} }, '*'); window.close();">✨ 一键同款</button>
            </div>
          </div>
          <div class="author-row">
            <div class="author-left">
              <div class="author-avatar">${courseware.author.charAt(0)}</div>
              <span class="author-name">${courseware.author}</span>
              <div class="author-stats">
                <span class="stat-item">👁 ${courseware.views}</span>
                <span class="stat-item" id="likeBtn" onclick="toggleLike()">❤️ <span id="likeCount">${courseware.likes}</span></span>
                <span class="stat-item" id="favBtn" onclick="toggleFav()">⭐ <span id="favCount">${courseware.favorites}</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="right-section">
      <div class="rec-card">
        <div class="rec-header">
          <span class="rec-header-title">相关推荐</span>
          <span class="rec-header-count">${recommendations.length}个</span>
        </div>
        <div class="rec-list">
          ${recItems}
        </div>
      </div>
    </div>
  </div>
</body>
<script>
  let liked = false, faved = false;
  const likeBase = ${courseware.likes}, favBase = ${courseware.favorites};
  function toggleLike() {
    liked = !liked;
    document.getElementById('likeCount').textContent = likeBase + (liked ? 1 : 0);
    document.getElementById('likeBtn').className = liked ? 'stat-item active' : 'stat-item';
  }
  function toggleFav() {
    faved = !faved;
    document.getElementById('favCount').textContent = favBase + (faved ? 1 : 0);
    document.getElementById('favBtn').className = faved ? 'stat-item active' : 'stat-item';
  }
  function handleDownload() {
    const iframe = document.querySelector('iframe');
    const content = iframe ? iframe.srcdoc || iframe.contentDocument.documentElement.outerHTML : '';
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = '${courseware.title}.html'; a.click();
    URL.revokeObjectURL(url);
  }
</script>
</html>`);
  previewWindow.document.close();
}
