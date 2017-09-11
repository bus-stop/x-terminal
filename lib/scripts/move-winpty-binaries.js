'use babel';
/*
 * Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Copyright 2017 Andres Mejia <amejia004@gmail.com>. All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function main() {
    // Proceed only for Windows platforms.
    if (process.platform !== 'win32') {
        process.exit(0);
    }

    // Determine if node-pty is under the atom-xterm install path.
    let nodePtyPath;
    try {
        nodePtyPath = require.resolve('node-pty');
    } catch (e) {
        process.exit(0);
    }
    let atomXtermPath = path.resolve(path.join(__dirname, '..', '..'));
    let basename = path.basename(nodePtyPath);
    while (basename !== 'node-pty') {
        nodePtyPath = path.resolve(path.join(nodePtyPath, '..'));
        basename = path.basename(nodePtyPath);
    }
    let regexp = new RegExp('^' + escapeRegExp(atomXtermPath + path.sep));
    if (!regexp.test(nodePtyPath)) {
        process.exit(0);
    }

    // Move the directories containing the Windows binaries under the tmp
    // directory.
    let nodePtyBuildReleasePath = path.join(nodePtyPath, 'build', 'Release');
    let nodePtyBuildDebugPath = path.join(nodePtyPath, 'build', 'Debug');
    if (fs.existsSync(nodePtyBuildReleasePath)) {
        let tmpdir = fs.mkdtempSync(os.tmpdir() + path.sep);
        let newPath = path.join(tmpdir, 'Release');
        console.log('Moving \'' + nodePtyBuildReleasePath + '\' to \'' + newPath + '\'.');
        fs.renameSync(nodePtyBuildReleasePath, newPath);
    }
    if (fs.existsSync(nodePtyBuildDebugPath)) {
        let tmpdir = fs.mkdtempSync(os.tmpdir() + path.sep);
        let newPath = path.join(tmpdir, 'Debug');
        console.log('Moving \'' + nodePtyBuildDebugPath + '\' to \'' + newPath + '\'.')
        fs.renameSync(nodePtyBuildDebugPath, newPath);
    }
}

if (require.main === module) {
    main();
}
