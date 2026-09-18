const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const exe = path.resolve(process.argv[2] || path.join(root, 'src-tauri/target/release/hero-siege-item-codex.exe'));
const link = process.argv[3];
const child = spawn(exe, link ? [link] : [], {
  cwd: path.dirname(exe), detached: true, stdio: 'ignore', windowsHide: true,
  env: { ...process.env, ITEM_CODEX_QA: '1', WEBVIEW2_USER_DATA_FOLDER: path.join(root, 'qa/native-profile'), WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: '--remote-debugging-port=9238 --remote-debugging-address=127.0.0.1' },
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.unref();
fs.mkdirSync(path.join(root, 'qa'), { recursive: true });
fs.writeFileSync(path.join(root, 'qa/native-process.json'), JSON.stringify({ pid: child.pid, exe, link: link ?? null }));
console.log(JSON.stringify({ pid: child.pid, exe, link: link ?? null }));
