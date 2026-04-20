const fs = require('fs');
const path = require('path');
const http = require('http');

/**
 * PRODUCTION CLEAN REBUILD SCRIPT (v1.0)
 * This script deletes the current node_modules and package-lock.json 
 * to force Hostinger to perform a clean, fresh installation.
 */

const projectRoot = __dirname;
const nodeModules = path.join(projectRoot, 'node_modules');
const lockFile = path.join(projectRoot, 'package-lock.json');

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    
    let report = '--- CLEAN REBUILD REPORT ---\n';
    
    try {
        if (fs.existsSync(nodeModules)) {
            report += 'Cleaning node_modules...\n';
            fs.rmSync(nodeModules, { recursive: true, force: true });
            report += '✅ node_modules DELETED.\n';
        } else {
            report += 'ℹ️ node_modules already empty.\n';
        }

        if (fs.existsSync(lockFile)) {
            fs.unlinkSync(lockFile);
            report += '✅ package-lock.json DELETED.\n';
        }

        report += '\n--- NEXT STEPS ---\n';
        report += '1. Go to Hostinger Panel -> Deployments.\n';
        report += '2. Trigger a RE-DEPLOY to install fresh dependencies.\n';
        report += '3. CHANGE Startup File back to app.js.\n';

    } catch (e) {
        report += '❌ ERROR during cleanup: ' + e.message;
    }

    res.end(`<pre>${report}</pre>`);
});

server.listen(port, () => {
    console.log('Cleanup server running at port ' + port);
});
