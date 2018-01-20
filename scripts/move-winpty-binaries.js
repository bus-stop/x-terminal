'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function mkdtempSyncForRenamingDLLs(atomHome) {
    if (!atomHome) {
        throw new Error('must provide atomHome parameter');
    }
    var tmp = _path2.default.join(atomHome, 'tmp');
    if (!_fs2.default.existsSync(tmp)) _fs2.default.mkdirSync(tmp);
    return _fs2.default.mkdtempSync(_path2.default.join(tmp, 'moved-dll-'));
} /** @babel */
/*
 * Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

function main() {
    console.log('Executing script at \'' + _path2.default.resolve(__filename) + '\'');
    // Proceed only for Windows platforms.
    if (process.platform !== 'win32') {
        console.log('Not win32 platform, exiting.');
        process.exit(0);
    }

    console.log('=== Start process.argv log ===');
    process.argv.forEach(function (val, index) {
        console.log(index + ': ' + val);
    });
    console.log('=== End process.argv log ===');
    console.log('process.cwd(): ' + process.cwd());
    console.log('=== Start process.env log ===');
    Object.keys(process.env).forEach(function (key) {
        console.log(key + ' = ' + process.env[key]);
    });
    console.log('=== End process.env log ===');

    // NOTE: Atom package installs/updates are done through a staging directory
    // first. Therefore, this whole script is needed to deal with moving the
    // winpty binaries on Windows platforms.
    var homeDir = _os2.default.homedir();
    console.log('homeDir = \'' + homeDir + '\' from os.homedir()');
    var atomHome = process.env.ATOM_HOME;
    if (atomHome) {
        console.log('Using ATOM_HOME environment variable.');
        atomHome = _path2.default.resolve(atomHome);
    } else {
        atomHome = _path2.default.join(homeDir, '.atom');
        if (!_fs2.default.existsSync(atomHome)) {
            console.log('atomHome = \'' + atomHome + '\' doesn\'t exist.');
            console.log('Checking if home directory is set to .node-gyp path');
            var regexp = new RegExp(_path2.default.join('.atom', '.node-gyp').replace(/\.\\/g, '\\$&') + '$');
            if (regexp.test(homeDir)) {
                homeDir = _path2.default.resolve(_path2.default.join(homeDir, '..', '..'));
                console.log('Setting homeDir = \'' + homeDir + '\' from two directories lower from previous homeDir.');
                atomHome = _path2.default.join(homeDir, '.atom');
                console.log('New atomHome = \'' + atomHome + '\'.');
            }
        }
        if (!_fs2.default.existsSync(atomHome)) {
            console.log('Attempting use of HOMEDRIVE and HOMEPATH environment variables.');
            var homeDrive = process.env.HOMEDRIVE;
            var homePath = process.env.HOMEPATH;
            if (homeDrive && homePath) {
                homeDir = homeDrive + _path2.default.sep + homePath;
                console.log('homeDir = \'' + homeDir + '\' derived from HOMEDRIVE and HOMEPATH environment variables.');
            }
            atomHome = _path2.default.resolve(_path2.default.join(homeDir, '.atom'));
        }
    }
    console.log('Using atomHome = \'' + atomHome + '\'');
    var atomXtermPath = _path2.default.join(atomHome, 'packages', 'atom-xterm');
    console.log('Using atomXtermPath = \'' + atomXtermPath + '\'');
    if (!_fs2.default.existsSync(atomXtermPath)) {
        console.log('atom-xterm not installed, exiting.');
        process.exit(0);
    }
    var nodePtyPath = _path2.default.join(atomXtermPath, 'node_modules', 'node-pty');
    console.log('Using nodePtyPath = \'' + nodePtyPath + '\'');

    // Move the directories containing the Windows binaries under a tmp
    // directory.
    var nodePtyBuildReleasePath = _path2.default.join(nodePtyPath, 'build', 'Release');
    var nodePtyBuildDebugPath = _path2.default.join(nodePtyPath, 'build', 'Debug');
    if (_fs2.default.existsSync(nodePtyBuildReleasePath)) {
        var tmpdir = mkdtempSyncForRenamingDLLs(atomHome);
        var newPath = _path2.default.join(tmpdir, 'Release');
        console.log('Moving \'' + nodePtyBuildReleasePath + '\' to \'' + newPath + '\'.');
        _fs2.default.renameSync(nodePtyBuildReleasePath, newPath);
    }
    if (_fs2.default.existsSync(nodePtyBuildDebugPath)) {
        var _tmpdir = mkdtempSyncForRenamingDLLs(atomHome);
        var _newPath = _path2.default.join(_tmpdir, 'Debug');
        console.log('Moving \'' + nodePtyBuildDebugPath + '\' to \'' + _newPath + '\'.');
        _fs2.default.renameSync(nodePtyBuildDebugPath, _newPath);
    }
}

if (require.main === module) {
    main();
}