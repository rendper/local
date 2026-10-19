const { v2: webdav } = require('webdav-server');
const express = require('express');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 10000;
const UPLOAD_DIR = path.join(__dirname, 'files');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const app = express();

// Create WebDAV server instance mapped to our directory
const server = new webdav.WebDAVServer({
    storage: new webdav.FileSystem(UPLOAD_DIR),
    autoLoad: true
});

// Root welcome page info
app.get('/', (req, res) => {
    res.send(`
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
});

// Mount the WebDAV server properly into Express
app.use(webdav.extensions.express('/', server));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Render WebDAV Server running on port ${PORT}`);
});
