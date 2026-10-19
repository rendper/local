const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 10000;
const UPLOAD_DIR = path.join(__dirname, 'files');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({ dest: UPLOAD_DIR });

// Secure Authentication Middleware (Credentials stay hidden in server code & env vars)
const authMiddleware = (req, res, next) => {
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':');

    // User credentials mapped securely
    const validBara = username === 'bar9a' && password === process.env.pass_bara;
    const validEda = username === 'em2bk' && password === process.env.pass_eda;

    if (username && password && (validBara || validEda)) {
        return next();
    }

    res.set('WWW-Authenticate', 'Basic realm="Secure Render File Server"');
    res.status(401).send('Authentication required.');
};

app.use(authMiddleware);

// Serve uploaded files statically so clicking them opens/downloads them
app.use('/files', express.static(UPLOAD_DIR));

// Web Dashboard Interface
app.get('/', (req, res) => {
    fs.readdir(UPLOAD_DIR, (err, files) => {
        if (err) files = [];
        let fileListHtml = files.map(f => `
            <li style="margin: 8px 0;">
                <a href="/files/${f}" target="_blank" style="font-size: 16px; text-decoration: none; color: #0066cc;">📄 ${f}</a>
            </li>
        `).join('');
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>Render Secure File Server</title></head>
            <body style="font-family: Arial, sans-serif; padding: 40px; background: #f4f7f6;">
                <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    <h2>📁 Secure Render File Server</h2>
                    <hr style="border:0; border-top:1px solid #eee; margin: 20px 0;">
                    
                    <h3>Upload a File</h3>
                    <form action="/upload" method="POST" enctype="multipart/form-data" style="margin-bottom: 25px;">
                        <input type="file" name="file" required style="margin-bottom: 10px;" /><br>
                        <button type="submit" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Upload</button>
                    </form>

                    <h3>Files on Server (Click to View/Download)</h3>
                    <ul style="list-style-type: none; padding: 0;">
                        ${fileListHtml.length > 0 ? fileListHtml : '<p style="color: #888;">No files uploaded yet.</p>'}
                    </ul>
                </div>
            </body>
            </html>
        `);
    });
});

// Web Upload Route
app.post('/upload', upload.single('file'), (req, res) => {
    if (req.file) {
        const targetPath = path.join(UPLOAD_DIR, req.file.originalname);
        // If file already exists, replace it cleanly
        if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
        fs.renameSync(req.file.path, targetPath);
    }
    res.redirect('/');
});

// API Upload Route for local sync script
app.post('/upload-api', upload.single('file'), (req, res) => {
    if (req.file) {
        const targetPath = path.join(UPLOAD_DIR, req.file.originalname);
        if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
        fs.renameSync(req.file.path, targetPath);
        return res.json({ success: true });
    }
    res.status(400).json({ error: 'No file uploaded' });
});

// API Delete Route for local sync script (`Z:` drive deletions)
app.delete('/files/:filename', (req, res) => {
    const filePath = path.join(UPLOAD_DIR, req.params.filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Not on server' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Secure Web Server running on port ${PORT}`);
});
