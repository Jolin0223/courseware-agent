import { ESLint } from 'eslint';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const lint = new ESLint();
const files = ['src/components/Generator/ImageGenerationPanelV2.tsx','src/components/Generator/AudioGenerationPanel.tsx','src/App.tsx','src/components/Generator/ChatInput.tsx','src/components/Generator/CoursewareCard.tsx','src/components/Generator/GenerationPreferencePicker.tsx','src/components/Generator/PreviewPanel.tsx','src/components/Generator/RequirementCard.tsx','src/data/mockConversations.ts','src/pages/GeneratorPage.tsx','src/pages/WukongFlowPage.tsx','src/types/index.ts'];
const signature = message => `${message.severity}|${message.ruleId}|${message.message.split('\n')[0]}`;
const results=[];
for (const file of files) {
  const baseline='ea8b05b';
  const before=(await lint.lintText(execFileSync('git',['show',`${baseline}:${file}`],{encoding:'utf8'}),{filePath:file}))[0];
  const after=(await lint.lintFiles([file]))[0];
  const remaining=before.messages.map(signature);
  const introduced=after.messages.filter(m=>{const i=remaining.indexOf(signature(m));if(i<0)return true;remaining.splice(i,1);return false;}).map(m=>({line:m.line,rule:m.ruleId,message:m.message.split('\n')[0]}));
  results.push({file,baselineErrors:before.errorCount,baselineWarnings:before.warningCount,errors:after.errorCount,warnings:after.warningCount,introduced});
}
const newResults=await lint.lintFiles(['src/components/VideoCourseware','src/data/videoCourseware','src/store/videoCoursewareStore.ts']);
const newDiagnostics=newResults.flatMap(r=>r.messages.map(m=>({file:r.filePath,line:m.line,rule:m.ruleId,message:m.message.split('\n')[0]})));
const passed=results.every(r=>!r.introduced.length)&&newDiagnostics.length===0;
writeFileSync('docs/video-platform-lint-check.json',JSON.stringify({baseline:'ea8b05b',passed,existingFiles:results,newFilesDiagnostics:newDiagnostics},null,2));
console.log(JSON.stringify({passed,existingDiagnostics:results.reduce((n,r)=>n+r.errors+r.warnings,0),introduced:results.filter(r=>r.introduced.length),newDiagnostics},null,2));
if(!passed)process.exitCode=1;
