/**
 * Production Entry Point Bridge v4.0 (Universal Recovery Mode)
 * This file handles the handover and catches ALL errors (sync & async).
 */

const path = require('path');
const fs = require('fs');
const http = require('http');

console.log('--- PRODUCTION BRIDGE STARTING (v4.0) ---');

// GLOBAL ERROR HANDLERS (Absolute priority)
process.on('uncaughtException', (err) => {
    console.error('🔥 UNCAUGHT EXCEPTION:', err.message);
    console.error(err.stack);
    startEmergencyServer(err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
    startEmergencyServer(reason instanceof Error ? reason : new Error(String(reason)));
});

function startEmergencyServer(err) {
    const port = process.env.PORT || 3000;
    try {
        const server = http.createServer((req, res) => {
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
                <div style="font-family: sans-serif; padding: 40px; color: #721c24; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px;">
                    <h1 style="margin-top: 0;">❌ Fatal Application Error</h1>
                    <p>The application crashed completely. Details below:</p>
                    <pre style="background: #fff; padding: 15px; border-radius: 4px; overflow: auto; border: 1px solid #ddd;">${err.stack || err.message || err}</pre>
                </div>
            `);
        });
        server.listen(port, () => {
            console.log(`Emergency server started on port ${port}`);
        });
    } catch (e) {
        console.error('Failed to start emergency server:', e);
    }
}

const backendPath = path.join(__dirname, 'backend', 'app.js');

try {
    if (!fs.existsSync(backendPath)) {
        throw new Error('Critical: backend/app.js not found at ' + backendPath);
    }
    
    // Attempt handover
    require(backendPath);
    console.log('--- HANDOVER SUCCESSFUL ---');

} catch (err) {
    console.error('❌ HANDOVER ERROR:', err.message);
    startEmergencyServer(err);
}
  