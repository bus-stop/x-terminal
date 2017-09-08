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
import Terminal from 'xterm';

Terminal.loadAddon('fit');

class AtomXtermElement extends HTMLElement {

    initialize(model) {
        this.model = model;
        this.model.element = this;
        this.setAttribute('session-id', this.model.getSessionId());
        this.setAttribute('session-parameters', this.model.getSessionParameters());
        this.createTerminal();
        // An element resize detector is used to check when this element is
        // resized due to the pane resizing or due to the entire window
        // resizing.
        this.erd = elementResizeDetectorMaker({
            strategy: "scroll"
        });
        this.erd.listenTo(this, (element) => {
            this.refitTerminal();
        });
        this.currentClickedAnchor;
        this.addEventListener('mousedown', (event) => {
            let element = event.target;
            if (element.tagName.toLowerCase() === 'a') {
                this.currentClickedAnchor = element;
            } else {
                this.currentClickedAnchor = null;
            }
        })
        return this;
    }

    destroy() {
        this.ptyProcess.kill();
        this.terminal.destroy();
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

    getCwd() {
        let cwd = this.model.url.searchParams.get('cwd');
        if (cwd && fs.existsSync(cwd)) {
            return cwd;
        }
        cwd = this.model.getPath();
        if (cwd && fs.existsSync(cwd)) {
            return cwd;
        }
        // If the cwd from the model was invalid, reset it to null.
        this.model.cwd = null;
        cwd = atom.config.get('atom-xterm.spawnPtySettings.cwd');
        if (cwd && fs.existsSync(cwd)) {
            this.model.cwd = cwd;
        }
        return this.model.cwd;
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
        let cwd = this.getCwd();
        let env = this.getEnv();
        let encoding = this.getEncoding();
        options = {
            'name': name,
            'cols': 80,
            // This really large row count is to work around a problem related
            // to https://github.com/sourcelair/xterm.js/issues/661 .
            'rows': 200,
            'cwd': cwd,
            'env': env,
        }
        if (encoding) {
            // There's some issue if 'encoding=null' is passed in the options,
            // therefore, only set it if there's an actual encoding to set.
            options['encoding'] = encoding;
        }
        this.ptyProcess = spawnPty(command, args, options);
        this.terminal = new Terminal({
            'cols': options['cols'],
            'rows': options['rows'],
        });
        this.terminal.on('data', (data) => {
            this.ptyProcess.write(data);
        });
        this.terminal.on('resize', (size) => {
            this.ptyProcess.resize(this.terminal.cols, this.terminal.rows);
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
            this.ptyProcess.on('exit', () => {
                this.model.exit();
            });
        }

        // Attach terminal emulator to this element.
        this.terminal.open(this, false);
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
