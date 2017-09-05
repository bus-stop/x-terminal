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
const path = require('path');

import { CompositeDisposable } from 'atom';
const uuidv4 = require('uuid/v4');

import * as config from './atom-xterm-config';
import AtomXtermElement from './atom-xterm-element';
import AtomXtermModel from './atom-xterm-model';

const ATOM_XTERM_BASE_URI = 'atom-xterm://';

export default {

    'config': {
        'spawnPtySettings': {
            'title': 'Shell Process Settings',
            'description': 'Settings related to the process running the shell.',
            'type': 'object',
            'properties': {
                'command': {
                    'title': 'Command',
                    'description': 'Command to run',
                    'type': 'string',
                    'default': config.getDefaultShellCommand()
                },
                'args': {
                    'title': 'Arguments',
                    'description': 'Arguments to pass to command, must be in a JSON array.',
                    'type': 'string',
                    'default': '[]'
                },
                'name': {
                    'title': 'Terminal Type',
                    'description': 'The terminal type to use.',
                    'type': 'string',
                    'default': config.getDefaultTermType()
                },
                'cwd': {
                    'title': 'Working Directory',
                    'description': 'The working directory to use when launching command.',
                    'type': 'string',
                    'default': config.getDefaultCwd()
                },
                'env': {
                    'title': 'Environment',
                    'description': 'The environment to use when launching command, must be in a JSON object. If not set, defaults to the current environment.',
                    'type': 'string',
                    'default': ''
                },
                'setEnv': {
                    'title': 'Environment Overrides',
                    'description': 'Environment variables to use in place of the atom process environment, must be in a JSON object.',
                    'type': 'string',
                    'default': '{}'
                },
                'deleteEnv': {
                    'title': 'Environment Deletions',
                    'description': 'Environment variables to delete from original environment, must be in a JSON array.',
                    'type': 'string',
                    'default': '[]'
                },
                'encoding': {
                    'title': 'Character Encoding',
                    'description': 'Character encoding to use in spawned terminal.',
                    'type': 'string',
                    'default': ''
                },
            },
        },
        'terminalSettings': {
            'title': 'Terminal Emulator Settings',
            'description': 'Settings for the terminal emulator.',
            'type': 'object',
            'properties': {
                'fontSize': {
                    'title': 'Font Size',
                    'description': 'Font size used in terminal emulator.',
                    'type': 'integer',
                    'default': 14,
                    'minimum': 8,
                },
                'leaveOpenAfterExit': {
                    'title': 'Leave Open After Exit',
                    'description': 'Whether to leave terminal emulators open after their shell processes have exited.',
                    'type': 'boolean',
                    'default': false
                },
            },
        },
    },

    activate(state) {
        // Disposables for this plugin.
        this.disposables = new CompositeDisposable;

        // Set holding all terminals available at any moment.
        this.terminals_set = new Set;

        // Add style sheet needed by xterm.
        let sourcePath = path.join(path.dirname(require.resolve('xterm')), 'xterm.css');
        fs.readFile(sourcePath, 'utf-8', (err, data) => {
            if (err) throw err;
            this.disposables.add(atom.styles.addStyleSheet(data, {'sourcePath': sourcePath}));
        });

        // Add our atom-xterm specific styles.
        let fontSize = atom.config.get('atom-xterm.terminalSettings.fontSize');
        let stylesElementSourcePath = 'atom-xterm-styles';
        this.disposables.add(atom.styles.addStyleSheet(
            config.getStyles(fontSize),
            {'sourcePath': 'atom-xterm-styles'}
        ));

        // Monitor for changes to the fontSize config value.
        this.disposables.add(atom.config.onDidChange('atom-xterm.terminalSettings.fontSize', ({newValue, oldValue}) => {
            let styleElement = atom.styles.styleElementsBySourcePath[stylesElementSourcePath];
            styleElement.textContent = config.getStyles(newValue);
            atom.styles.emitter.emit('did-update-style-element', styleElement);
            if (oldValue !== newValue) {
                // TODO: For some reason, terminals in the workspace need to be
                // refitted twice whenever the font changes.
                this.refitAllTerminals();
                this.refitAllTerminals();
            }
        }));

        // Register view provider for terminal emulator item.
        this.disposables.add(atom.views.addViewProvider(AtomXtermModel, (atomXtermModel) => {
            let atomXtermElement = new AtomXtermElement;
            atomXtermElement.initialize(atomXtermModel);
            return atomXtermElement;
        }));

        // Add opener for terminal emulator item.
        this.disposables.add(atom.workspace.addOpener((uri) => {
            if (uri.startsWith(ATOM_XTERM_BASE_URI)) {
                let item = new AtomXtermModel(uri, this.terminals_set);
                return item;
            }
        }));

        // Add callbacks to existing panes and future added panes.
        for (let pane of atom.workspace.getPanes()) {
            this.disposables.add(pane.onDidAddItem((event) => {
                if (event.item instanceof AtomXtermModel) {
                    event.item.setNewPane(pane);
                }
            }));
        }
        this.disposables.add(atom.workspace.onDidAddPane((event) => {
            this.disposables.add(event.pane.onDidAddItem((paneEvent) => {
                if (paneEvent.item instanceof AtomXtermModel) {
                    paneEvent.item.setNewPane(event.pane);
                }
            }));
        }));

        // Add callbacks to workspace.
        this.disposables.add(atom.workspace.onDidStopChangingActivePaneItem((item) => {
            if (item instanceof AtomXtermModel) {
                item.focusOnTerminal();
            }
        }));

        // Add commands.
        this.disposables.add(atom.commands.add('atom-workspace', {
            'atom-xterm:open': () => this.open(uri = this.generateNewUri()),
            'atom-xterm:open-split-up': () => this.open(
                uri = this.generateNewUri(),
                options = {'split': 'up'}
            ),
            'atom-xterm:open-split-down': () => this.open(
                uri = this.generateNewUri(),
                options = {'split': 'down'}
            ),
            'atom-xterm:open-split-left': () => this.open(
                uri = this.generateNewUri(),
                options = {'split': 'left'}
            ),
            'atom-xterm:open-split-right': () => this.open(
                uri = this.generateNewUri(),
                options = {'split': 'right'}
            ),
            'atom-xterm:reorganize': () => this.reorganize('current'),
            'atom-xterm:reorganize-top': () => this.reorganize('top'),
            'atom-xterm:reorganize-bottom': () => this.reorganize('bottom'),
            'atom-xterm:reorganize-left': () => this.reorganize('left'),
            'atom-xterm:reorganize-right': () => this.reorganize('right'),
            'atom-xterm:close-all': () => this.exitAllTerminals(),
            'atom-xterm:need-this-to-activate-package-for-tests-do-not-remove': () => {
                /*
                 * This is just here for activating the package in tests.
                 * From the main program, the 'core:loaded-shell-environment'
                 * activation hook is used to activate the package.
                 */
            },
        }));
        this.disposables.add(atom.commands.add('atom-xterm', {
            'atom-xterm:close': () => this.close(),
            'atom-xterm:copy': () => this.copy(),
            'atom-xterm:paste': () => this.paste()
        }));
    },

    deactivate() {
        this.exitAllTerminals();
        this.disposables.dispose();
    },

    refitAllTerminals() {
        let currentActivePane = atom.workspace.getActivePane();
        let currentActiveItem = currentActivePane.getActiveItem();
        for (let terminal of this.terminals_set) {
            // To refit, simply bring the terminal in focus in order for the
            // resize event to refit the terminal.
            let paneActiveItem = terminal.pane.getActiveItem();
            terminal.pane.getElement().focus();
            terminal.pane.setActiveItem(terminal);
            terminal.pane.setActiveItem(paneActiveItem);
        }
        currentActivePane.getElement().focus();
        currentActivePane.setActiveItem(currentActiveItem);
    },

    exitAllTerminals() {
        for (let terminal of this.terminals_set) {
            terminal.exit();
        }
    },

    generateNewUri() {
        return ATOM_XTERM_BASE_URI + uuidv4() + '/';
    },

    open(uri, options = {}) {
        atom.workspace.open(uri, options);
    },

    performOperationOnItem(operation) {
        let item = atom.workspace.getActivePaneItem();
        if (item instanceof AtomXtermModel) {
            switch(operation) {
                case 'close':
                    item.exit();
                    break;
                case 'copy':
                    atom.clipboard.write(item.copyFromTerminal());
                    break;
                case 'paste':
                    item.pasteToTerminal(atom.clipboard.read());
                    break;
                default:
                    throw "Unknown operation: " + operation;
            }
        }
    },

    close() {
        this.performOperationOnItem('close');
    },

    copy() {
        this.performOperationOnItem('copy');
    },

    paste() {
        this.performOperationOnItem('paste');
    },

    reorganize(orientation) {
        if (this.terminals_set.size == 0) {
            return;
        }
        let activePane = atom.workspace.getActivePane();
        let activeItem = activePane.getActiveItem();
        let newPane;
        switch(orientation) {
            case 'current':
                newPane = activePane;
                break;
            case 'top':
                newPane = activePane.findTopmostSibling().splitUp();
                break;
            case 'bottom':
                newPane = activePane.findBottommostSibling().splitDown();
                break;
            case 'left':
                newPane = activePane.findLeftmostSibling().splitLeft();
                break;
            case 'right':
                newPane = activePane.findRightmostSibling().splitRight();
                break;
            default:
                throw "Unknown orientation: " + orientation;
        }
        for (let item of this.terminals_set) {
            item.pane.moveItemToPane(item, newPane, -1);
        }
        if (activeItem instanceof AtomXtermModel) {
            if (atom.workspace.getPanes().length > 1) {
                // When reorganizing still leaves more than one pane in the
                // workspace, another pane that doesn't include the newly
                // reorganized terminal tabs needs to be focused in order for
                // the terminal views to get properly resized in the new pane.
                // All this is yet another quirk.
                for (let pane of atom.workspace.getPanes()) {
                    if (pane !== activeItem.pane) {
                        pane.getElement().focus();
                        break;
                    }
                }
            }
            activeItem.pane.getElement().focus();
            activeItem.pane.setActiveItem(activeItem);
        }
        else if (activeItem instanceof HTMLElement) {
            activeItem.focus();
        } else if (typeof activeItem.getElement === 'function') {
            activeItem = activeItem.getElement();
            activeItem.focus();
        }
    },

};
