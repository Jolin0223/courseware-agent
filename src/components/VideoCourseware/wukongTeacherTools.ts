// Visuals belong to this lesson. A different lesson supplies its own tool design.
export const wukongTeacherToolsCSS = `
@font-face{font-family:TeacherRound;src:url('/wukong/assets/fonts/cuyuan.woff')}
#teacher-tools{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;container-type:inline-size;color:#284e3b;font-family:TeacherRound,'PingFang SC',sans-serif}
#teacher-tools [hidden]{display:none!important}
#tools-trigger{position:absolute;left:clamp(10px,2cqw,24px);bottom:clamp(10px,2cqw,24px);display:flex;align-items:center;gap:7px;padding:8px 12px;min-height:34px;border:1px solid #edcf8f;border-radius:11px;background:linear-gradient(135deg,#315f49,#1c4939);color:#fff1c6;box-shadow:0 3px 0 #153b2bb3,0 4px 15px #183e3333;pointer-events:auto;cursor:pointer;font:inherit;font-size:clamp(12px,1.65cqw,19px);line-height:1.2}
#tools-trigger svg{width:clamp(17px,2cqw,24px);height:clamp(17px,2cqw,24px);color:#ebc676}
#tools-trigger:hover{background:#386d50;box-shadow:0 3px 0 #153b2bb3,0 5px 19px #183e3355}
#tools-trigger:focus-visible,#tools-close:focus-visible,#tools-list button:focus-visible{outline:2px solid #dea93b;outline-offset:-2px}
#tools-shade{position:absolute;inset:0;pointer-events:none}
#tools-panel{position:absolute;left:clamp(10px,2cqw,24px);bottom:clamp(10px,2cqw,24px);display:flex;flex-direction:column;width:25%;height:25%;overflow:hidden;border:1px solid #d9b976;border-radius:10px;background:#fff9e9;box-shadow:0 5px 22px #10382444;pointer-events:auto}
#tools-head{display:flex;align-items:center;gap:5px;min-height:29px;padding:4px 7px;border-bottom:1px solid #e8d6ae;background:#fff4d8;flex-shrink:0}
#tools-head h1{font:inherit;font-size:clamp(12px,1.1cqw,16px);margin:0;color:#284b38;white-space:nowrap}
#tools-close{display:grid;place-items:center;flex-shrink:0;margin-left:auto;width:21px;height:21px;padding:0;border:0;border-radius:50%;background:transparent;color:#6d623e;cursor:pointer;font-size:20px;line-height:1}
#tools-close:hover{background:#f3e2b8}
#tools-list{min-height:0;overflow:auto;padding:3px 4px;scrollbar-width:thin;scrollbar-color:#c2aa76 transparent;overscroll-behavior:contain}
.tools-group{margin:0}.tools-group h2{display:none}.tools-scenes{display:grid;grid-template-columns:minmax(0,1fr);gap:2px}
#tools-list button{display:block;min-width:0;width:100%;text-align:left;border:0;border-radius:4px;padding:5px 6px;background:transparent;color:#4a5e42;font:inherit;font-size:clamp(11px,1cqw,15px);line-height:1.3;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#tools-list button:hover{background:#f6edcf}
#tools-list button[aria-current='step']{background:#345f47;color:#fff1c9}
#tools-list button[aria-current='step']:before{content:'◆';color:#f3ca72;font-size:8px;margin-right:5px}
@media(prefers-reduced-motion:reduce){#teacher-tools *{scroll-behavior:auto}}
`;
export const wukongTeacherToolsMarkup = `<div id="teacher-tools" hidden>
 <button id="tools-trigger" type="button" aria-label="打开教师工具" aria-expanded="false" aria-controls="tools-panel"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 5h12v13H7a3 3 0 0 1 0-6h12M7 5a2 2 0 0 0-4 0v12a4 4 0 0 0 4 4h13" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 8h6M10 11h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg><span>教师工具</span></button>
 <div id="tools-shade" hidden><section id="tools-panel" role="dialog" aria-labelledby="tools-title"><header id="tools-head"><h1 id="tools-title">教师工具</h1><button id="tools-close" type="button" aria-label="关闭教师工具">×</button></header><div id="tools-list"></div></section></div>
</div>`;
