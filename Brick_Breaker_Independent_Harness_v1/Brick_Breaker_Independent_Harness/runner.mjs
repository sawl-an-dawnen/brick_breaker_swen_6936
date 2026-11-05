import { spawnSync } from 'node:child_process';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
function usage(){
  console.error('Usage: node runner.mjs --impl PATH --label NAME');
  console.error('PATH is a game implementation directory or gameLogic.js file.');
}
function argsOf(argv) {
  const opts={};
  for(let i=0;i<argv.length;i++) {
    if(!['--impl','--label'].includes(argv[i]) || !argv[i+1]) throw Error(`Invalid argument ${argv[i]}`);
    if(opts[argv[i]])throw Error(`Repeated argument ${argv[i]}`);
    opts[argv[i]]=argv[++i];
  }
  if(!opts['--impl']||!opts['--label'])throw Error('Both --impl and --label are required');
  if(!/^[\w.-]{1,80}$/.test(opts['--label']))throw Error('Label must be 1-80 safe filename characters');
  return opts;
}
let opts;
try {opts=argsOf(process.argv.slice(2));}catch(e){usage();console.error(e.message);process.exit(2);}
const candidate=path.resolve(process.cwd(),opts['--impl']);
let file=candidate;
try {if((await stat(candidate)).isDirectory())file=path.join(candidate,'gameLogic.js');
  if(!(await stat(file)).isFile())throw Error('Not a file');
}catch(e){console.error(`Cannot read implementation ${file}: ${e.message}`);process.exit(2);}
await mkdir(path.join(root,'results'),{recursive:true});
const now=new Date().toISOString().replace(/[:.]/g,'-');
const report=path.join(root,'results',`${opts['--label']}_${now}.tap`);
const child=spawnSync(process.execPath,['--test','--test-reporter=tap',path.join(root,'tests','brick.test.mjs')],{
  cwd:root,env:{...process.env,BRICK_IMPL:file},encoding:'utf8',maxBuffer:20*1024*1024
});
const output=(child.stdout??'')+(child.stderr??'');
await writeFile(report,`# Implementation: ${file}\n# Label: ${opts['--label']}\n# Executed: ${new Date().toISOString()}\n${output}`,'utf8');
process.stdout.write(output);
console.log(`\nImplementation: ${file}`);
console.log(`TAP report: ${report}`);
if(child.error) console.error('Execution error:',child.error.message);
process.exit(child.status===0&&!child.error?0:(child.status||1));
