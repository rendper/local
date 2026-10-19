const { v2: webdav } = require('webdav-server');
const express = require('express');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 10000;
const UPLOAD_DIR = path.join(__dirname, 'files');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Set up User Manager with a username and password
const userManager = new webdav.SimpleUserManager();
const user = userManager.addUser('admin', 'password123', false);

// Set up Privilege Manager to give the user full access
const privilegeManager = new webdav.SimplePathPrivilegeManager();
privilegeManager.setRights(user, '/', ['all']);

const server = new webdav.WebDAVServer({
    httpAuthentication: new webdav.HTTPBasicAuthentication(userManager),
    privilegeManager: privilegeManager,
    storage: new webdav.FileSystem(UPLOAD_DIR),
    autoLoad: true
});

const app = express();

// Mount WebDAV server onto root path
app.use(webdav.extensions.express('/', server));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Render WebDAV Server running on port ${PORT}`);
});
