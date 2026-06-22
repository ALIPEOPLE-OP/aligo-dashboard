// Simple static file server for dashboard (port 8080)
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 8080;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  let filePath;
  try { filePath = path.join(ROOT, decodeURIComponent(url)); }
  catch(e) { filePath = path.join(ROOT, url); }

  if (url === '/') filePath = path.join(ROOT, '알리고_대시보드.html');

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500);
      res.end(err.code === 'ENOENT' ? 'Not Found' : 'Server Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log('Dashboard server running at http://localhost:' + PORT + '/알리고_대시보드.html');
});
