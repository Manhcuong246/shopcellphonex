// Script xoa dong "Co-authored-by: Cursor" khoi file commit message.
// Git hook prepare-commit-msg goi script nay tren Windows neu hook sh khong chay.
const fs = require('fs');
const path = process.argv[2];
if (!path || !fs.existsSync(path)) process.exit(0);
let content = fs.readFileSync(path, 'utf8');
// Xoa moi dang: Co-authored-by: Cursor <...> hoac cursoragent
content = content
  .replace(/\n?Co-authored-by:\s*Cursor\s*<[^>]+>\s*\n?/gi, '\n')
  .replace(/\n?Co-authored-by:\s*cursoragent[^\n]*\n?/gi, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();
fs.writeFileSync(path, content + (content.endsWith('\n') ? '' : '\n'));
process.exit(0);
