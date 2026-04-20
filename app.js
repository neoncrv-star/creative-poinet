/**
 * Production Entry Point Bridge v2.0
 * This file ensures compatibility with Hostinger/Shared hosting
 */

const path = require('path');
const fs = require('fs');

console.log('--- PRODUCTION BRIDGE STARTING ---');
console.log('Current Directory:', process.cwd());
console.log('Environment:', process.env.NODE_ENV || 'not set');
console.log('Port:', process.env.PORT || 'not set');

const backendPath = path.join(__dirname, 'backend', 'app.js');

if (!fs.existsSync(backendPath)) {
    console.error('❌ CRITICAL ERROR: backend/app.js not found at', backendPath);
    process.exit(1);
}

try {
    require(backendPath);
    console.log('--- BRIDGE HANDOVER COMPLETE ---');
} catch (err) {
    console.error('❌ CRITICAL ERROR in backend/app.js handover:', err.message);
    console.error(err.stack);
    process.exit(1);
}
