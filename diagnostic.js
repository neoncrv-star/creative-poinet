const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    
    let sqliteStatus = 'Checking...';
    try {
        require('sqlite3');
        sqliteStatus = '✅ SQLite3 Driver is INSTALLED';
    } catch (e) {
        sqliteStatus = '❌ SQLite3 Driver is MISSING: ' + e.message;
    }

    const html = `
        <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
            <h1 style="color: #2ecc71;">✅ Diagnostic Page: Server is ALIVE</h1>
            <p>If you see this page, Node.js is running correctly on your host.</p>
            <hr>
            <h3>Environment Details:</h3>
            <ul>
                <li><strong>Node Version:</strong> ${process.version}</li>
                <li><strong>Current Port (process.env.PORT):</strong> ${process.env.PORT || 'Not Set (using 3000)'}</li>
                <li><strong>CWD:</strong> ${process.cwd()}</li>
                <li><strong>SQLite Status:</strong> ${sqliteStatus}</li>
            </ul>
            <hr>
            <h3>Next Steps:</h3>
            <p>1. If SQLite Status is ❌, we MUST use MySQL for production because the host blocks SQLite installation.</p>
            <p>2. Share this info with your developer.</p>
        </div>
    `;
    res.end(html);
});

server.listen(port, () => {
    console.log(`Diagnostic server running at port ${port}`);
});
