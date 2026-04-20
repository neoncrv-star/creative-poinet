function withTimeout(promise, ms, fallback) {
    return Promise.race([
        promise,
        new Promise(function (resolve) {
            setTimeout(function () {
                resolve(fallback);
            }, ms);
        })
    ]);
}

module.exports = withTimeout;
