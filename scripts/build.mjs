import { execFileSync } from 'node:child_process';
import { mkdirSync, copyFileSync, cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
execFileSync(process.execPath, [path.join(root,'node_modules/tailwindcss/lib/cli.js'),
  '-c',path.join(root,'tailwind.config.cjs'),'-i',path.join(root,'src/portfolio.css'),
  '-o',path.join(root,'portfolio.css'),'--minify'],{cwd:root,stdio:'inherit'});
const output = path.join(root,'dist');
mkdirSync(output,{recursive:true});
for (const file of ['index.html','portfolio.css','styles.css','login.html','dashboard.html']) {
  copyFileSync(path.join(root,file),path.join(output,file));
}
for (const directory of ['assets','js']) {
  cpSync(path.join(root,directory),path.join(output,directory),{recursive:true});
}
console.log('Built static portfolio in dist/');
