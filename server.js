const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Render Persistent Disk mount path (Use /var/data/files on Render, or local folder for testing)
const UPLOAD_DIR = process.env.RENDER ? '/var/data/files' : path.join(__dirname, 'files');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

app.use(express.json());

// 1. Web Dashboard (Open this in your browser on Windows 11 to view/upload/delete files easily)
app.get('/', (req, res) => {
    res.send(`
        <html style="background:#101827; color:white; font-family:Arial; padding:20px;">
            <h2>📁 Render File Server (Windows 11 Connected)</h2>
            <form action="/upload" method="post" enctype="multipart/form-data" style="margin-bottom:20px;">
                <input type="file" name="file" style="color:white;" />
                <button type="submit" style="padding:5px 15px; background:#22a9e8; color:white; border:none; cursor:pointer;">Upload to Server</button>
            </form>
            <h3>Files Currently on Server:</h3>
            <ul id="fileList"></ul>
            <script>
                fetch('/files').then(res => res.json()).then(files => {
                    const list = document.getElementById('fileList');
                    if(files.length === 0) list.innerHTML = "<li>No files on server.</li>";
                    files.forEach(f => {
                        list.innerHTML += \`<li style="margin:8px 0;"><a href="/files/\${f}" target="_blank" style="color:#5bd18a;">\${f}</a> <button onclick="deleteFile('\${f}')" style="margin-left:10px; background:#ed4545; color:white; border:none; cursor:pointer; padding:2px 8px;">Delete</button></li>\`;
                    });
                });
                function deleteFile(name) {
                    fetch('/files/' + name, { method: 'DELETE' })
                        .then(res => res.json())
                        .then(data => {
                            alert(data.message);
                            location.reload();
                        });
                }
            </script>
        </html>
    `);
});

// 2. List all files
app.get('/files', (req, res) => {
    fs.readdir(UPLOAD_DIR, (err, files) => {
        if (err) return res.status(500).json({ error: "Unable to scan directory" });
        res.json(files);
    });
});

// 3. Download / View a specific file
app.get('/files/:filename', (req, res) => {
    const filePath = path.join(UPLOAD_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ status: "error", message: "Not on server" });
    }
    res.sendFile(filePath);
});

// 4. Upload a file
app.post('/upload', upload.single('file'), (req, res) => {
    res.redirect('/');
});

// 5. Delete a file (Returns "Not on server" if it doesn't exist)
app.delete('/files/:filename', (req, res) => {
    const filePath = path.join(UPLOAD_DIR, req.params.filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ status: "error", message: "Not on server" });
    }

    fs.unlink(filePath, (err) => {
        if (err) return res.status(500).json({ error: "Could not delete file" });
        res.json({ status: "success", message: "Deleted from server" });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Render File Server listening on port ${PORT}`);
});
