/*
 * Copyright 2017-2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Copyright 2017-2018 Andres Mejia <amejia004@gmail.com>. All Rights Reserved.
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

function mkdtempSyncForRenamingDLLs(atomHome) {
    if (!atomHome) throw 'must provide atomHome parameter';
    let tmp = path.join(atomHome, 'tmp');
    if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);
    return fs.mkdtempSync(path.join(tmp, 'moved-dll-'));
}

function main() {
    console.log('Executing script at \'' + __filename + '\'');
    // Proceed only for Windows platforms.
    if (process.platform !== 'win32') {
        console.log('Not win32 platform, exiting.');
        process.exit(0);
    }

    console.log('=== Start process.argv log ===');
    process.argv.forEach((val, index) => {
        console.log(`${index}: ${val}`);
    });
    console.log('=== End process.argv log ===');
    console.log('process.cwd(): ' + process.cwd());
    console.log('=== Start process.env log ===');
    Object.keys(process.env).forEach(function(key) {
        console.log(key + ' = ' + process.env[key]);
    });
    console.log('=== End process.env log ===');

    // NOTE: Atom package installs/updates are done through a staging directory
    // first. Therefore, this whole script is needed to deal with moving the
    // winpty binaries on Windows platforms.
    let homeDir = os.homedir();
    console.log('homeDir = \'' + homeDir + '\' from os.homedir()');
    let atomHome = process.env.ATOM_HOME;
    if (atomHome) {
        console.log('Using ATOM_HOME environment variable.');
        atomHome = path.resolve(atomHome);
    } else {
        atomHome = path.join(homeDir, '.atom');
        if (!fs.existsSync(atomHome)) {
            console.log('atomHome = \'' + atomHome + '\' doesn\'t exist.');
            console.log('Checking if home directory is set to .node-gyp path');
            let regexp = new RegExp(path.join('.atom', '.node-gyp').replace(/\.\\/g, "\\$&") + '$');
            if (regexp.test(homeDir)) {
                homeDir = path.resolve(path.join(homeDir, '..', '..'));
                console.log('Setting homeDir = \'' + homeDir + '\' from two directories lower from previous homeDir.');
                atomHome = path.join(homeDir, '.atom');
                console.log('New atomHome = \'' + atomHome + '\'.');
            }
        }
        if (!fs.existsSync(atomHome)) {
            console.log('Attempting use of HOMEDRIVE and HOMEPATH environment variables.');
            let homeDrive = process.env.HOMEDRIVE;
            let homePath = process.env.HOMEPATH;
            if (homeDrive && homePath) {
                homeDir = homeDrive + path.sep + homePath;
                console.log('homeDir = \'' + homeDir + '\' derived from HOMEDRIVE and HOMEPATH environment variables.');
            }
            atomHome = path.resolve(path.join(homeDir, '.atom'));
        }
    }
    console.log('Using atomHome = \'' + atomHome + '\'');
    let atomXtermPath = path.join(atomHome, 'packages', 'atom-xterm');
    console.log('Using atomXtermPath = \'' + atomXtermPath + '\'');
    if (!fs.existsSync(atomXtermPath)) {
        console.log('atom-xterm not installed, exiting.');
        process.exit(0);
    }
    let nodePtyPath = path.join(atomXtermPath, 'node_modules', 'node-pty');
    console.log('Using nodePtyPath = \'' + nodePtyPath + '\'');

    // Move the directories containing the Windows binaries under a tmp
    // directory.
    let nodePtyBuildReleasePath = path.join(nodePtyPath, 'build', 'Release');
    let nodePtyBuildDebugPath = path.join(nodePtyPath, 'build', 'Debug');
    if (fs.existsSync(nodePtyBuildReleasePath)) {
        let tmpdir = mkdtempSyncForRenamingDLLs(atomHome);
        let newPath = path.join(tmpdir, 'Release');
        console.log('Moving \'' + nodePtyBuildReleasePath + '\' to \'' + newPath + '\'.');
        fs.renameSync(nodePtyBuildReleasePath, newPath);
    }
    if (fs.existsSync(nodePtyBuildDebugPath)) {
        let tmpdir = mkdtempSyncForRenamingDLLs(atomHome);
        let newPath = path.join(tmpdir, 'Debug');
        console.log('Moving \'' + nodePtyBuildDebugPath + '\' to \'' + newPath + '\'.')
        fs.renameSync(nodePtyBuildDebugPath, newPath);
    }
}

if (require.main === module) {
    main();
}
