function withTimeout(promise, ms, fallback) {
    return Promise.race([
        promise.catch(function () { return fallback; }),
        new Promise(function (resolve) {
            setTimeout(function () {
                resolve(fallback);
            }, ms);
        })
    ]);
}

module.exports = withTimeout;
