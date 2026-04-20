const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('*', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; padding: 50px;">
            <h1 style="color: #3498db;">🚀 Minimal Express Test: SUCCESS</h1>
            <p>If you see this, Express is working correctly on Node ${process.version}.</p>
            <p>This means our previous 503 was caused by a specific dependency (likely Database or Storage).</p>
            <hr>
            <p>Current Port: ${port}</p>
        </div>
    `);
});

app.listen(port, () => {
    console.log('Minimal test app running...');
});
