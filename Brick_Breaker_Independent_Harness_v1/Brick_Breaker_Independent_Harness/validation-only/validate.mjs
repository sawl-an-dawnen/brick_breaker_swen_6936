import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function execute(name) {
  const r=spawnSync(process.execPath,['runner.mjs','--impl',`./validation-only/${name}`,'--label',`validation-${name}`],{
    cwd:root,encoding:'utf8',maxBuffer:20*1024*1024
  });
  process.stdout.write(r.stdout??'');process.stderr.write(r.stderr??'');
  const output=(r.stdout??'')+(r.stderr??'');
  const get=(key)=>Number(output.match(new RegExp(`^# ${key} (\\d+)$`,'m'))?.[1]);
  return {exit:r.status,pass:get('pass'),fail:get('fail'),tests:get('tests')};
}
const reference=execute('reference');
const broken=execute('broken');
console.log('Calibration summary:',JSON.stringify({reference,broken}));
if(reference.exit!==0||reference.tests!==28||reference.pass!==28||reference.fail!==0){
  console.error('Reference fixture validation FAILED');process.exitCode=1;
}
if(broken.exit===0||broken.tests!==28||broken.fail<1){
  console.error('Broken fixture validation FAILED: expected detected failures across 28 tests');process.exitCode=1;
}
if(!process.exitCode)console.log('VALIDATION PASSED: reference passes 28/28, broken fixture is rejected.');
