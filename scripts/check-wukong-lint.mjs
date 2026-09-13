import { ESLint } from 'eslint';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

// Compare the touched legacy page with the preserved source baseline without mutating it.
const lint = new ESLint();
const file = 'src/pages/GeneratorPage.tsx';
const baseline = execFileSync('git', ['show', `ccfec46:${file}`], { encoding: 'utf8' });
const before = (await lint.lintText(baseline, { filePath: file }))[0];
const after = (await lint.lintFiles([file]))[0];
const brief = result => ({
  errors: result.errorCount,
  warnings: result.warningCount,
  messages: result.messages.map(message => ({
    line: message.line,
    rule: message.ruleId,
    firstLine: message.message.split('\n')[0],
  })),
});
const signature = result => result.messages.map(m => `${m.severity}|${m.ruleId}|${m.message.split('\n')[0]}`).sort();
const noNewDiagnostics = JSON.stringify(signature(before)) === JSON.stringify(signature(after));
const report = { baselineCommit: 'ccfec46', file, noNewDiagnostics, baseline: brief(before), current: brief(after) };
writeFileSync('docs/wukong-lint-check.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ noNewDiagnostics, baselineErrors: before.errorCount, baselineWarnings: before.warningCount, currentErrors: after.errorCount, currentWarnings: after.warningCount }));
if (!noNewDiagnostics) process.exitCode = 1;
