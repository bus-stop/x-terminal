/** @babel */
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

const fs = require('fs-extra');
const path = require('path');

import { CompositeDisposable, Emitter } from 'atom';
const { URL } = require('whatwg-url');

import { AtomXtermProfilesSingleton } from './atom-xterm-profiles';

const DEFAULT_TITLE = 'Atom Xterm';

export default class AtomXtermModel {
    constructor(options) {
        this.options = options;
        this.uri = this.options.uri;
        let url = new URL(this.uri);
        this.sessionId = url.host;
        this.profilesSingleton = AtomXtermProfilesSingleton.instance;
        this.profile = this.profilesSingleton.createProfileDataFromUri(this.uri);
        this.terminals_set = this.options.terminals_set;
        this.element;
        this.pane;
        this.title = DEFAULT_TITLE;
        if (this.profile.title !== null) {
            this.title = this.profile.title;
        }
        this.modified = false;
        this.emitter = new Emitter;
        this.disposables = new CompositeDisposable;
        this.terminals_set.add(this);

        // Determine appropriate initial working directory based on previous
        // active item. Since this involves async operations on the file
        // system, a Promise will be used to indicate when initialization is
        // done.
        this.isInitialized = false;
        this.initializedPromise = new Promise((resolve, reject) => {
            let baseProfile = this.profilesSingleton.getBaseProfile();
            let previousActiveItem = atom.workspace.getActivePaneItem();
            let cwd = this.profile.cwd;
            if (typeof previousActiveItem !== 'undefined' && typeof previousActiveItem.getPath === 'function') {
                cwd = previousActiveItem.getPath();
            }
            let dir = atom.project.relativizePath(cwd)[0];
            if (dir) {
                // Use project paths whenever they are available by default.
                this.profile.cwd = dir;
                resolve();
            } else if (cwd) {
                fs.exists(cwd, (exists) => {
                    if (exists) {
                        // Otherwise, if the path exists on the local file system, use the
                        // path or parent directory as appropriate.
                        fs.stat(cwd, (err, stats) => {
                            if (!stats.isDirectory()) {
                                cwd = path.dirname(cwd);
                                fs.stat(cwd, (err, stats) => {
                                    if (!stats.isDirectory) {
                                        this.profile.cwd = baseProfile.cwd;
                                        resolve();
                                    } else {
                                        this.profile.cwd = cwd;
                                        resolve();
                                    }
                                });
                            } else {
                                this.profile.cwd = cwd;
                                resolve();
                            }
                        });
                    } else {
                        this.profile.cwd = baseProfile.cwd;
                        resolve();
                    }
                });
            } else {
                this.profile.cwd = baseProfile.cwd;
                resolve();
            }
        }).then(() => {
            this.isInitialized = true;
        });
    }

    serialize() {
        return {
            deserializer: 'AtomXtermModel',
            version: '2017-09-17',
            uri: this.profilesSingleton.generateNewUrlFromProfileData(this.profile).href,
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
        return this.profile.cwd;
    }

    isModified() {
        return this.modified;
    }

    onDidChangeModified(callback) {
        return this.emitter.on('did-change-modified', callback);
    }

    handleNewDataArrival() {
        if (!this.pane) {
            this.pane = atom.workspace.paneForItem(this);
        }
        let oldIsModified = this.modified;
        let item;
        if (this.pane) {
            item = this.pane.getActiveItem();
        }
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
        return this.sessionId;
    }

    getSessionParameters() {
        let url = this.profilesSingleton.generateNewUrlFromProfileData(this.profile);
        url.searchParams.sort();
        return url.searchParams.toString();
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

    clickOnCurrentAnchor() {
        this.element.clickOnCurrentAnchor();
    }

    getCurrentAnchorHref() {
        return this.element.getCurrentAnchorHref();
    }

    toggleProfileMenu() {
        this.element.toggleProfileMenu();
    }

    setNewProfile(newProfile) {
        this.profile = newProfile;
    }
}
