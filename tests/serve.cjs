const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };

function serve(req, res) {
  let filename;
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    filename = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  } catch { res.writeHead(400).end(); return; }
  if (!filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (!['.html', '.css', '.js', '.svg'].includes(path.extname(filename))) { res.writeHead(404).end(); return; }
  fs.readFile(filename, (error, content) => {
    if (error) res.writeHead(404).end('Não encontrado');
    else res.writeHead(200, { 'Content-Type': types[path.extname(filename)], 'Cache-Control': 'no-store' }).end(content);
  });
}
module.exports = { serve };
if (require.main === module) {
  const port = Number(process.env.PORT || 4173);
  http.createServer(serve).listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
}
