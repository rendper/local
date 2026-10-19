const { v2: webdav } = require('webdav-server');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 10000;

// Use a local folder within the app directory for the free tier
const UPLOAD_DIR = path.join(__dirname, 'files');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Create WebDAV server mapped to our directory
const server = new webdav.WebDAVServer({
    storage: new webdav.FileSystem(UPLOAD_DIR),
    autoLoad: true
});

// HTTP wrapper to handle requests and provide standard HTML fallback
http.createServer((req, res) => {
    if (req.url === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(`
            <html style="background:#101827; color:white; font-family:Arial; padding:30px;">
                <h2>📁 Render WebDAV File Server is Running</h2>
                <p>Map this server directly into Windows 11 File Explorer using your Render URL:</p>
                <code style="background:#1c2b3d; padding:10px; display:block; color:#5bd18a;">https://your-app-name.onrender.com</code>
                <p style="margin-top:20px;"><b>Instructions for Windows 11:</b><br>
                1. Open File Explorer -> Click <b>This PC</b><br>
                2. Click the three dots (...) in the top menu -> Select <b>Map network drive</b><br>
                3. Paste your Render URL into the Folder box and click Finish.</p>
            </html>
        `);
    }

    server.execute(req, res);
}).listen(PORT, '0.0.0.0', () => {
    console.log(`Render WebDAV Server running on port ${PORT}`);
});
