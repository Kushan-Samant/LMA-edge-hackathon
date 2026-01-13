const fetch = require('node-fetch');

// The URL to ping. Render provides RENDER_EXTERNAL_URL in the environment.
// We fall back to localhost for local testing.
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000/health';

// Render free tier spins down after 15 minutes of inactivity.
// We ping every 10 minutes to be safe.
const PING_INTERVAL = 10 * 60 * 1000;

function keepAlive() {
    console.log(`[KeepAlive] Pinging ${RENDER_URL} inside keepalive script...`);
    fetch(RENDER_URL)
        .then(res => {
            console.log(`[KeepAlive] Ping status: ${res.status} ${res.statusText}`);
        })
        .catch(err => {
            console.error(`[KeepAlive] Ping failed: ${err.message}`);
        });
}

// Start immediately then loop
console.log('[KeepAlive] Starting keep-alive service...');
keepAlive();
setInterval(keepAlive, PING_INTERVAL);
