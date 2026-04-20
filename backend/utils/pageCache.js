const cache = new Map();

function cachePage(options = {}) {
  const ttlMs = Number(options.ttlMs) || 60_000;

  return (req, res, next) => {
    if (req.method !== 'GET') return next();

    const key = req.originalUrl || req.url || '/';
    const now = Date.now();
    const entry = cache.get(key);

    if (entry && now - entry.createdAt < entry.ttlMs) {
      res.setHeader('X-Page-Cache', 'HIT');
      return res.send(entry.body);
    }

    const originalSend = res.send.bind(res);

    res.send = (body) => {
      try {
        if (res.statusCode === 200 && req.method === 'GET') {
          if (typeof body === 'string' || Buffer.isBuffer(body)) {
            cache.set(key, {
              body,
              createdAt: Date.now(),
              ttlMs
            });
          }
        }
      } catch {}

      res.setHeader('X-Page-Cache', entry ? 'MISS-REFRESH' : 'MISS');
      return originalSend(body);
    };

    next();
  };
}

function invalidatePrefix(prefix) {
  for (const k of cache.keys()) {
    if (k.startsWith(prefix)) cache.delete(k);
  }
}

function invalidateRoutes(routes) {
  routes.forEach((r) => invalidatePrefix(r));
}

function clearAll() {
  cache.clear();
}

module.exports = { cachePage, invalidatePrefix, invalidateRoutes, clearAll };
