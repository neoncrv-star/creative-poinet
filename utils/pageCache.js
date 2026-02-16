const cache = new Map();

function cachePage() {
  return (req, res, next) => {
    return next();
  };
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
