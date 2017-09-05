'use babel';
/*
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
const path = require('path');

import { CompositeDisposable, Emitter } from 'atom';
const { URL } = require('whatwg-url');

const DEFAULT_TITLE = 'Atom Xterm';

export default class AtomXtermModel {
    constructor(uri, terminals_set) {
        this.uri = uri;
        this.url = new URL(this.uri);
        this.terminals_set = terminals_set;
        this.element;
        this.pane;
        this.title = DEFAULT_TITLE;
        this.modified = false;
        this.emitter = new Emitter;
        this.disposables = new CompositeDisposable;
        this.terminals_set.add(this);

        // Determine appropriate initial working directory based on previous
        // active item.
        this.cwd;
        let previousActiveItem = atom.workspace.getActivePaneItem();
        if (typeof previousActiveItem !== 'undefined' && typeof previousActiveItem.getPath === 'function') {
            this.cwd = previousActiveItem.getPath();
        }
        let dir = atom.project.relativizePath(this.cwd)[0];
        if (dir) {
            // Use project paths whenever they are available by default.
            this.cwd = dir;
        } else if (fs.existsSync(this.cwd)) {
            // Otherwise, if the path exists on the local file system, use the
            // path or parent directory as appropriate.
            let stats = fs.statSync(this.cwd);
            if (!stats.isDirectory()) {
                this.cwd = path.dirname(this.cwd);
            }
        } else {
            // Just set cwd to null for non-existent paths.
            this.cwd = null;
        }
    }

    destroy() {
        if (this.element) {
            this.element.destroy();
        }
        this.disposables.dispose();
        this.terminals_set.delete(this);
    }

    getTitle() {
        return this.title;
    }

    getElement() {
        return this.element;
    }

    getURI() {
        return this.uri;
    }

    getLongTitle() {
        if (this.title === DEFAULT_TITLE) {
            return DEFAULT_TITLE;
        }
        return DEFAULT_TITLE + ' (' + this.title + ')';
    }

    onDidChangeTitle(callback) {
        return this.emitter.on('did-change-title', callback);
    }

    getIconName() {
        return 'terminal';
    }

    getPath() {
        return this.cwd;
    }

    isModified() {
        return this.modified;
    }

    onDidChangeModified(callback) {
        return this.emitter.on('did-change-modified', callback);
    }

    handleNewDataArrival() {
        let oldIsModified = this.modified;
        let item = this.pane.getActiveItem();
        if (item === this) {
            this.modified = false;
        } else {
            this.modified = true;
        }
        if (oldIsModified !== this.modified) {
            this.emitter.emit('did-change-modified', this.modified);
        }
    }

    getSessionId() {
        return this.url.host;
    }

    getSessionParameters() {
        return this.url.searchParams.toString();
    }

    refitTerminal() {
        // Only refit if there's a DOM element attached to the model.
        if (this.element) {
            this.element.refitTerminal();
        }
    }

    focusOnTerminal() {
        this.element.focusOnTerminal();
        let oldIsModified = this.modified;
        this.modified = false;
        if (oldIsModified !== this.modified) {
            this.emitter.emit('did-change-modified', this.modified);
        }
    }

    exit() {
        this.pane.destroyItem(this, true);
    }

    copyFromTerminal() {
        return this.element.terminal.getSelection();
    }

    pasteToTerminal(text) {
        this.element.ptyProcess.write(text);
    }

    setNewPane(pane) {
        this.pane = pane;
    }
}
