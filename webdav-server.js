const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const UPLOAD_DIR = path.join(__dirname, 'files');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

app.use(express.json());

// Web Dashboard UI
app.get('/', (req, res) => {
    res.send(`
        <html style="background:#101827; color:white; font-family:Arial; padding:40px;">
            <div style="max-width: 600px; margin: auto;">
                <h2>📁 Render Cloud File Server</h2>
                <p style="color:#88a0b8;">Drag & drop files or use the form below to save them to your server.</p>
                
                <form action="/upload" method="post" enctype="multipart/form-data" style="background:#182738; padding:20px; border-radius:8px; margin-bottom:20px; border: 2px dashed #35506c;">
                    <input type="file" name="file" style="color:white; margin-bottom:10px;" required /><br>
                    <button type="submit" style="padding:8px 20px; background:#22a9e8; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Upload to Server</button>
                </form>

                <h3>Files on Server:</h3>
                <ul id="fileList" style="list-style:none; padding:0;"></ul>
            </div>
            <script>
                fetch('/files').then(res => res.json()).then(files => {
                    const list = document.getElementById('fileList');
                    if(files.length === 0) list.innerHTML = "<li style='color:#88a0b8;'>No files on server yet.</li>";
                    files.forEach(f => {
                        list.innerHTML += \`<li style="background:#182738; margin:8px 0; padding:10px 15px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
                            <a href="/files/\${f}" target="_blank" style="color:#5bd18a; text-decoration:none; font-weight:bold;">\${f}</a> 
                            <button onclick="deleteFile('\${f}')" style="background:#ed4545; color:white; border:none; border-radius:4px; cursor:pointer; padding:5px 12px; font-weight:bold;">Delete</button>
                        </li>\`;
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

// List files API
app.get('/files', (req, res) => {
    fs.readdir(UPLOAD_DIR, (err, files) => {
        if (err) return res.status(500).json({ error: "Unable to scan directory" });
        res.json(files);
    });
});

// Download / View file
app.get('/files/:filename', (req, res) => {
    const filePath = path.join(UPLOAD_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ status: "error", message: "Not on server" });
    }
    res.sendFile(filePath);
});

// Upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
    res.redirect('/');
});

// Delete endpoint (Returns "Not on server" if it doesn't exist)
app.delete('/files/:filename', (req, res) => {
    const filePath = path.join(UPLOAD_DIR, req.params.filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ status: "success", message: "Not on server" });
    }

    fs.unlink(filePath, (err) => {
        if (err) return res.status(500).json({ error: "Could not delete file" });
        res.json({ status: "success", message: "Deleted from server" });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Render File Server running on port ${PORT}`);
});
