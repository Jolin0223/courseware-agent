// Visuals belong to this lesson. A different lesson supplies its own tool design.
export const wukongTeacherToolsCSS = `
@font-face{font-family:TeacherRound;src:url('/wukong/assets/fonts/cuyuan.woff')}
/* All dimensions use the same 1920×1080 coordinates as the lesson canvas. */
#teacher-tools{position:absolute;inset:0;width:1920px;height:1080px;pointer-events:none;color:#284e3b;font-family:TeacherRound,'PingFang SC',sans-serif}
#teacher-tools [hidden]{display:none!important}
#tools-trigger{position:absolute;left:32px;bottom:32px;display:flex;align-items:center;justify-content:center;gap:8px;width:184px;height:56px;padding:8px 14px;border:2px solid #edcf8f;border-radius:14px;background:linear-gradient(135deg,#315f49,#1c4939);color:#fff1c6;box-shadow:0 4px 0 #153b2bb3,0 6px 20px #183e3333;pointer-events:auto;cursor:pointer;font:inherit;font-size:26px;line-height:1.2}
#tools-trigger svg{width:28px;height:28px;flex-shrink:0;color:#ebc676}
#tools-trigger:hover{background:#386d50}
#tools-trigger:focus-visible,#tools-close:focus-visible,#tools-list button:focus-visible{outline:3px solid #dea93b;outline-offset:-3px}
#tools-shade{position:absolute;inset:0;pointer-events:none}
#tools-panel{position:absolute;left:32px;bottom:32px;display:flex;flex-direction:column;width:960px;height:540px;overflow:hidden;border:2px solid #d9b976;border-radius:20px;background:#fff9e9;box-shadow:0 8px 30px #10382444;pointer-events:auto}
#tools-head{display:flex;align-items:center;gap:12px;min-height:68px;padding:10px 20px;border-bottom:2px solid #e8d6ae;background:#fff4d8;flex-shrink:0}
#tools-head h1{font:inherit;font-size:32px;margin:0;color:#284b38}
#tools-close{display:grid;place-items:center;flex-shrink:0;margin-left:auto;width:42px;height:42px;padding:0;border:0;border-radius:50%;background:transparent;color:#6d623e;cursor:pointer;font-size:36px;line-height:1}
#tools-close:hover{background:#f3e2b8}
#tools-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-content:start;gap:10px;min-height:0;overflow:auto;padding:16px;scrollbar-width:thin;scrollbar-color:#c2aa76 transparent;overscroll-behavior:contain}
.tools-group,.tools-scenes{display:contents}.tools-group h2{display:none}
#tools-list button{display:block;min-width:0;width:100%;text-align:left;border:1px solid #e4d8bb;border-radius:9px;padding:11px 12px;background:#fffdf5;color:#4a5e42;font:inherit;font-size:28px;line-height:1.3;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#tools-list button:hover{background:#f6edcf}
#tools-list button[aria-current='step']{background:#345f47;border-color:#345f47;color:#fff1c9}
#tools-list button[aria-current='step']:before{content:'◆';color:#f3ca72;font-size:15px;margin-right:8px}
@media(prefers-reduced-motion:reduce){#teacher-tools *{scroll-behavior:auto}}
`;
export const wukongTeacherToolsMarkup = `<div id="teacher-tools" hidden>
 <button id="tools-trigger" type="button" aria-label="打开教师工具" aria-expanded="false" aria-controls="tools-panel"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 5h12v13H7a3 3 0 0 1 0-6h12M7 5a2 2 0 0 0-4 0v12a4 4 0 0 0 4 4h13" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 8h6M10 11h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg><span>教师工具</span></button>
 <div id="tools-shade" hidden><section id="tools-panel" role="dialog" aria-labelledby="tools-title"><header id="tools-head"><h1 id="tools-title">教师工具</h1><button id="tools-close" type="button" aria-label="关闭教师工具">×</button></header><div id="tools-list"></div></section></div>
</div>`;
