const cache = new Map();

function keyFromReq(req) {
  const url = req.originalUrl || req.url || '/';
  return url.split('#')[0];
}

function shouldBypass(req) {
  if (req.method !== 'GET') return true;
  if (req.path && req.path.startsWith('/admin')) return true;
  if (req.session && req.session.userId) return true; // bypass for logged-in users
  return false;
}

function cachePage({ ttlMs = 60_000, staleMs = 600_000, customKey } = {}) {
  return (req, res, next) => {
    if (shouldBypass(req)) return next();
    const k = customKey ? customKey(req) : keyFromReq(req);
    const now = Date.now();
    const entry = cache.get(k);
    if (entry) {
      if (entry.expireAt > now) {
        res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttlMs / 1000)}, stale-while-revalidate=${Math.floor(staleMs / 1000)}, stale-if-error=86400`);
        if (entry.headers) {
          Object.entries(entry.headers).forEach(([h, v]) => {
            try { res.setHeader(h, v); } catch {}
          });
        }
        return res.send(entry.body);
      }
      if (entry.staleUntil > now) {
        // Serve stale and trigger background refresh once
        if (!entry.refreshing) {
          entry.refreshing = true;
          cache.set(k, entry);
          // background regeneration
          regenerate(req, k, ttlMs, staleMs).catch(() => {});
        }
        res.setHeader('Cache-Control', `public, max-age=0, stale-while-revalidate=${Math.floor(staleMs / 1000)}, stale-if-error=86400`);
        if (entry.headers) {
          Object.entries(entry.headers).forEach(([h, v]) => {
            try { res.setHeader(h, v); } catch {}
          });
        }
        return res.send(entry.body);
      }
    }
    // Miss: capture render/send
    const originalSend = res.send.bind(res);
    res.send = (body) => {
      try {
        const ctype = (res.getHeader('Content-Type') || '').toString();
        if (res.statusCode === 200 && ctype.includes('text/html')) {
          const headersToPersist = {};
          ['Content-Type', 'Content-Language'].forEach(h => {
            const v = res.getHeader(h);
            if (v) headersToPersist[h] = v;
          });
          cache.set(k, {
            body,
            headers: headersToPersist,
            expireAt: Date.now() + ttlMs,
            staleUntil: Date.now() + ttlMs + staleMs,
            refreshing: false
          });
          res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttlMs / 1000)}, stale-while-revalidate=${Math.floor(staleMs / 1000)}, stale-if-error=86400`);
        }
      } catch {}
      return originalSend(body);
    };
    next();
  };
}

async function regenerate(req, key, ttlMs, staleMs) {
  return new Promise((resolve) => {
    // Clone a minimal request for internal re-fetch using http
    const http = require('http');
    const options = {
      method: 'GET',
      host: req.headers.host.split(':')[0],
      port: req.socket.localPort || 3000,
      path: req.originalUrl
    };
    const t0 = Date.now();
    const req2 = http.request(options, (resp) => {
      let chunks = [];
      const ctype = resp.headers['content-type'] || '';
      resp.on('data', (d) => chunks.push(d));
      resp.on('end', () => {
        try {
          if (resp.statusCode === 200 && String(ctype).includes('text/html')) {
            const body = Buffer.concat(chunks).toString('utf8');
            cache.set(key, {
              body,
              headers: { 'Content-Type': ctype },
              expireAt: Date.now() + ttlMs,
              staleUntil: Date.now() + ttlMs + staleMs,
              refreshing: false
            });
          } else {
            // no cache on non-200
          }
        } catch {}
        resolve(Date.now() - t0);
      });
    });
    req2.on('error', () => resolve(0));
    req2.end();
  });
}

function invalidatePrefix(prefix) {
  for (const k of cache.keys()) {
    if (k.startsWith(prefix)) cache.delete(k);
  }
}

function invalidateRoutes(routes) {
  routes.forEach(r => invalidatePrefix(r));
}

function clearAll() {
  cache.clear();
}

module.exports = { cachePage, invalidatePrefix, invalidateRoutes, clearAll };

