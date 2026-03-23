const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 4200);
const distDir = path.resolve(__dirname, '..', 'dist', 'frontend');

const contentTypeByExt = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.gif', 'image/gif'],
  ['.ico', 'image/x-icon'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.ttf', 'font/ttf'],
]);

function isCacheableAsset(requestPath) {
  if (requestPath === '/' || requestPath.endsWith('.html')) return false;
  return true;
}

function safeUrlPath(url) {
  try {
    const parsed = new URL(url, 'http://localhost');
    return decodeURIComponent(parsed.pathname);
  } catch {
    return '/';
  }
}

function sendFile(res, filePath, requestPath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = contentTypeByExt.get(ext) || 'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  if (isCacheableAsset(requestPath)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    res.setHeader('Cache-Control', 'no-cache');
  }

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    if (!res.headersSent) res.writeHead(500);
    res.end('Server error');
  });
  stream.pipe(res);
}

const server = http.createServer((req, res) => {
  const requestPath = safeUrlPath(req.url || '/');

  // Basic hardening: ignore path traversal.
  const rel = requestPath.replace(/^\/+/, '');
  const filePath = path.resolve(distDir, rel);
  if (!filePath.startsWith(distDir)) {
    res.writeHead(400);
    res.end('Bad request');
    return;
  }

  const resolvedPath = requestPath === '/' ? path.join(distDir, 'index.html') : filePath;

  fs.stat(resolvedPath, (err, stat) => {
    if (!err && stat.isFile()) {
      sendFile(res, resolvedPath, requestPath);
      return;
    }

    // SPA fallback.
    const indexPath = path.join(distDir, 'index.html');
    fs.stat(indexPath, (indexErr, indexStat) => {
      if (indexErr || !indexStat.isFile()) {
        res.writeHead(404);
        res.end('Not found (build the app first)');
        return;
      }
      sendFile(res, indexPath, '/');
    });
  });
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Serving ${distDir} at http://localhost:${port}`);
});

