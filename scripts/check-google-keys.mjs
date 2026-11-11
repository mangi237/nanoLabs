import { execFileSync } from 'node:child_process';
let matches;
try {
  matches = execFileSync('git', ['grep','-I','-l','-E','AIza[0-9A-Za-z_-]{35}','--','.'], {cwd:new URL('../',import.meta.url),encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
} catch (error) {
  if (error.status !== 1) throw error;
}
if (matches) throw new Error(`Google API key literals are not allowed in tracked source. Supply hosted keys through the CI environment. Files: ${matches.split('\n').join(', ')}`);
console.info('No Google API key literals in tracked source.');
