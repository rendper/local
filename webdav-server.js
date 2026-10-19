const { v2: webdav } = require('webdav-server');
const express = require('express');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 10000;
const UPLOAD_DIR = path.join(__dirname, 'files');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// User setup for RaiDrive
const userManager = new webdav.SimpleUserManager();
const user = userManager.addUser('admin', 'password123', false);

const privilegeManager = new webdav.SimplePathPrivilegeManager();
privilegeManager.setRights(user, '/', ['all']);

const server = new webdav.WebDAVServer({
    httpAuthentication: new webdav.HTTPBasicAuthentication(userManager),
    privilegeManager: privilegeManager,
    storage: new webdav.FileSystem(UPLOAD_DIR)
});

const app = express();

// Mount WebDAV route
app.use(webdav.extensions.express('/', server));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Render WebDAV Server is LIVE on port ${PORT}`);
});
