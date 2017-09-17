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

const elementResizeDetectorMaker = require('element-resize-detector');
import { spawn as spawnPty } from 'node-pty';
// NOTE: Once xterm.js v3 is released, this needs to be imported as
// import { Terminal } from 'xterm';
import Terminal from 'xterm';

Terminal.loadAddon('fit');

class AtomXtermElement extends HTMLElement {

    initialize(model) {
        this.model = model;
        this.model.element = this;
        this.topDiv = document.createElement('div');
        this.appendChild(this.topDiv);
        this.terminalDiv = document.createElement('div');
        this.terminalDiv.classList.add('atom-xterm-term-container');
        this.appendChild(this.terminalDiv);
        this.isInitialized = false;
        this.initializedPromise = new Promise((resolve, reject) => {
            // Always wait for the model to finish initializing before proceeding.
            this.model.initializedPromise.then((atomXtermModel) => {
                this.setAttribute('session-id', this.model.getSessionId());
                this.setAttribute('session-parameters', this.model.getSessionParameters());
                this.createTerminal().then(() => {
                    // An element resize detector is used to check when this element is
                    // resized due to the pane resizing or due to the entire window
                    // resizing.
                    this.erd = elementResizeDetectorMaker({
                        strategy: "scroll"
                    });
                    this.erd.listenTo(this.terminalDiv, (element) => {
                        this.refitTerminal();
                    });
                    this.currentClickedAnchor;
                    this.terminalDiv.addEventListener('mousedown', (event) => {
                        let element = event.target;
                        if (element.tagName.toLowerCase() === 'a') {
                            this.currentClickedAnchor = element;
                        } else {
                            this.currentClickedAnchor = null;
                        }
                    });
                    resolve();
                });
            }).then(() => {
                this.isInitialized = true;
            });
        });
        return this.initializedPromise;
    }

    destroy() {
        if (this.ptyProcess) {
            this.ptyProcess.kill();
        }
        if (this.terminal) {
            this.terminal.destroy();
        }
    }

    getShellCommand() {
        return this.model.url.searchParams.get('command') ||
            atom.config.get('atom-xterm.spawnPtySettings.command') ||
            null;
    }

    getArgs() {
        let args = this.model.url.searchParams.get('args') || atom.config.get('atom-xterm.spawnPtySettings.args') || null;
        if (args) {
            args = JSON.parse(args);
        } else {
            args = [];
        }
        if (!Array.isArray(args)) {
            throw 'Arguments set are not an array.';
        }
        return args;
    }

    getTermType() {
        return this.model.url.searchParams.get('name') ||
            atom.config.get('atom-xterm.spawnPtySettings.name') ||
            null;
    }

    checkPathIsDirectory(path) {
        return new Promise((resolve, reject) => {
            if (path) {
                fs.stat(path, (err, stats) => {
                    if (stats && stats.isDirectory()) {
                        resolve(true);
                    }
                    resolve(false);
                });
            } else {
                resolve(false);
            }
        });
    }

    getCwd() {
        return new Promise((resolve, reject) => {
            let cwd = this.model.url.searchParams.get('cwd');
            this.checkPathIsDirectory(cwd).then((isDirectory) => {
                if (isDirectory) {
                    resolve(cwd);
                } else {
                    cwd = this.model.getPath();
                    this.checkPathIsDirectory(cwd).then((isDirectory) => {
                        if (isDirectory) {
                            resolve(cwd);
                        } else {
                            // If the cwd from the model was invalid, reset it to null.
                            this.model.cwd = null;
                            cwd = atom.config.get('atom-xterm.spawnPtySettings.cwd');
                            this.checkPathIsDirectory(cwd).then((isDirectory) => {
                                if (isDirectory) {
                                    this.model.cwd = cwd;
                                    resolve(cwd);
                                }
                                resolve(null);
                            });
                        }
                    });
                }
            });
        });
    }

    getEnv() {
        let env = this.model.url.searchParams.get('env') || atom.config.get('atom-xterm.spawnPtySettings.env') || null;
        if (env) {
            env = JSON.parse(env);
        } else {
            env = Object.assign({}, process.env);
        }
        if (typeof env !== 'object' || Array.isArray(env)) {
            throw 'Environment set is not an object.';
        }
        let setEnv = this.model.url.searchParams.get('setEnv') || atom.config.get('atom-xterm.spawnPtySettings.setEnv') || '{}';
        setEnv = JSON.parse(setEnv);
        let deleteEnv = this.model.url.searchParams.get('deleteEnv') || atom.config.get('atom-xterm.spawnPtySettings.deleteEnv') || '[]';
        deleteEnv = JSON.parse(deleteEnv);
        for (let key in setEnv) {
            env[key] = setEnv[key];
        }
        for (let key of deleteEnv) {
            delete env[key];
        }
        return env;
    }

    getEncoding() {
        return this.model.url.searchParams.get('encoding') ||
            atom.config.get('atom-xterm.spawnPtySettings.encoding') ||
            null;
    }

    leaveOpenAfterExit() {
        let leaveOpenAfterExit = this.model.url.searchParams.get('leaveOpenAfterExit');
        if (leaveOpenAfterExit === 'true') {
            leaveOpenAfterExit = true;
        } else {
            leaveOpenAfterExit = false;
        }
        return leaveOpenAfterExit ||
            atom.config.get('atom-xterm.terminalSettings.leaveOpenAfterExit') ||
            false;
    }

    createTerminal() {
        // Setup pty process and terminal emulator.
        let command = this.getShellCommand();
        let args = this.getArgs();
        let name = this.getTermType();
        let env = this.getEnv();
        let encoding = this.getEncoding();
        let cwd;
        return new Promise((resolve, reject) => {
            this.getCwd().then((_cwd) => {
                cwd = _cwd;
                // Attach terminal emulator to this element and refit.
                this.terminal = new Terminal({
                    cursorBlink: true
                });
                this.terminal.open(this.terminalDiv, false);
                this.refitTerminal();

                // Attach pty process to terminal.
                // NOTE: This must be done after the terminal is attached to the
                // parent element and refitted.
                options = {
                    'name': name,
                    'cols': this.terminal.cols,
                    'rows': this.terminal.rows,
                    'cwd': cwd,
                    'env': env,
                }
                if (encoding) {
                    // There's some issue if 'encoding=null' is passed in the options,
                    // therefore, only set it if there's an actual encoding to set.
                    options['encoding'] = encoding;
                }
                this.ptyProcess = spawnPty(command, args, options);

                // Add all listeners.
                this.terminal.on('data', (data) => {
                    this.ptyProcess.write(data);
                });
                this.terminal.on('resize', (size) => {
                    this.ptyProcess.resize(size.cols, size.rows);
                });
                this.ptyProcess.on('data', (data) => {
                    let old_title = this.model.title;
                    this.model.title = this.ptyProcess.process;
                    if (old_title !== this.model.title) {
                        this.model.emitter.emit('did-change-title', this.model.title);
                    }
                    this.terminal.write(data);
                    this.model.handleNewDataArrival();
                });
                if (!this.leaveOpenAfterExit()) {
                    this.ptyProcess.on('exit', (code, signal) => {
                        this.model.exit();
                    });
                }
                resolve();
            });
        });
    }

    refitTerminal() {
        this.terminal.fit();
    }

    focusOnTerminal() {
        this.terminal.focus();
    }

    clickOnCurrentAnchor() {
        if (this.currentClickedAnchor) {
            this.currentClickedAnchor.click();
        }
    }

    getCurrentAnchorHref() {
        if (this.currentClickedAnchor) {
            return this.currentClickedAnchor.getAttribute('href');
        }
    }
}

module.exports = document.registerElement('atom-xterm', {
  prototype: AtomXtermElement.prototype
});
