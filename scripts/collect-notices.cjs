const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const root = path.resolve(__dirname, '..');
const notices = ['Hero Siege Item Codex — Third-party notices\n\nThis fan catalog includes open-source software. The following notices preserve the license text supplied with its dependencies. Some platform or build dependencies are included for completeness. Font notices also accompany the bundled fonts. Game data and artwork remain attributed to their respective owners.\n'];
function collect(folder, title) {
  if (!fs.existsSync(folder)) return;
  const files = fs.readdirSync(folder, { withFileTypes: true }).filter(f => f.isFile() && /^(licen[cs]e|copying|notice|ofl)([._-]|$)/i.test(f.name));
  for (const file of files) {
    notices.push('\n' + '='.repeat(72) + '\n' + title + ' — ' + file.name + '\n' + '='.repeat(72) + '\n' + fs.readFileSync(path.join(folder, file.name), 'utf8'));
  }
}
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json')));
for (const [folder, info] of Object.entries(lock.packages)) {
  if (!folder || info.dev) continue;
  collect(path.join(root, folder), folder.replace(/^node_modules\//, '') + ' ' + info.version);
}
const registryRoot = path.join(os.homedir(), '.cargo/registry/src');
const registries = fs.readdirSync(registryRoot).map(name => path.join(registryRoot, name));
const cargoLock = fs.readFileSync(path.join(root, 'src-tauri/Cargo.lock'), 'utf8');
for (const match of cargoLock.matchAll(/\[\[package\]\]\r?\nname = "([^"]+)"\r?\nversion = "([^"]+)"/g)) {
  for (const registry of registries) collect(path.join(registry, `${match[1]}-${match[2]}`), `${match[1]} ${match[2]}`);
}
for (const name of ['Cormorant-OFL.txt', 'Manrope-OFL.txt']) notices.push('\n' + name + '\n' + fs.readFileSync(path.join(root, 'web/public/fonts', name), 'utf8'));
fs.mkdirSync(path.join(root, 'distribution'), { recursive: true });
const destination = path.join(root, 'distribution/THIRD_PARTY_NOTICES.txt');
fs.writeFileSync(destination, notices.join('\n'));
console.log(`Collected ${notices.length - 1} license notices (${fs.statSync(destination).size} bytes).`);
