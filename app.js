/**
 * Production Entry Point Bridge v3.0 (Rescue Mode)
 * This file handles the handover to /backend/app.js and catches fatal errors.
 */

const path = require('path');
const fs = require('fs');
const http = require('http');

console.log('--- PRODUCTION BRIDGE STARTING (v3.0) ---');

const backendPath = path.join(__dirname, 'backend', 'app.js');

try {
    if (!fs.existsSync(backendPath)) {
        throw new Error('Critical: backend/app.js not found at ' + backendPath);
    }
    
    // Attempt handover
    require(backendPath);
    console.log('--- HANDOVER SUCCESSFUL ---');

} catch (err) {
    console.error('❌ CRITICAL BOOT ERROR:', err.message);
    console.error(err.stack);

    // EMERGENCY RECOVERY SERVER
    // If the main app fails to boot, we start a tiny server to show the error
    // so the user isn't stuck with a generic 503.
    const port = process.env.PORT || 3000;
    const server = http.createServer((req, res) => {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
            <div style="font-family: sans-serif; padding: 40px; color: #721c24; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px;">
                <h1 style="margin-top: 0;">❌ Application Boot Error</h1>
                <p>The application crashed during initialization. Details below:</p>
                <pre style="background: #fff; padding: 15px; border-radius: 4px; overflow: auto; border: 1px solid #ddd;">${err.stack}</pre>
                <hr>
                <p><strong>Common Causes:</strong> Missing dependencies, syntax errors, or environmental restrictions.</p>
            </div>
        `);
    });

    server.listen(port, () => {
        console.log(`Recovery server running on port ${port} to display boot error.`);
    });
}
