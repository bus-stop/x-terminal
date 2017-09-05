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

import AtomXterm from '../lib/atom-xterm';
import * as config from '../lib/atom-xterm-config';
import AtomXtermElement from '../lib/atom-xterm-element';
import AtomXtermModel from '../lib/atom-xterm-model';

describe('AtomXterm', () => {
    const default_uri = 'atom-xterm://somesessionid/';
    let workspaceElement;
    let atomXtermPackage;

    let createNewModel = (package_module, uri=default_uri) => {
        let model = new AtomXtermModel(uri, package_module.terminals_set);
        model.pane = jasmine.createSpyObj('pane',
            ['destroyItem']);
        model.pane.getActiveItem = jasmine.createSpy('getActiveItem')
            .and.returnValue(model);
        spyOn(model, 'exit').and.callThrough();
        spyOn(model, 'copyFromTerminal').and.returnValue('some text from terminal');
        spyOn(model, 'pasteToTerminal');
        return model;
    };

    let createNewElement = (package_module) => {
        let element = new AtomXtermElement;
        element.initialize(createNewModel(package_module));
        return element;
    };

    beforeEach((done) => {
        workspaceElement = atom.views.getView(atom.workspace);
        atom.packages.activatePackage('atom-xterm').then(() => {
            atomXtermPackage = atom.packages.getActivePackage('atom-xterm');
            spyOn(atomXtermPackage.mainModule, 'generateNewUri').and.returnValue(default_uri);
            done();
        }, (reason) => {
            done();
            throw reason;
        });
        atom.commands.dispatch(workspaceElement, 'atom-xterm:need-this-to-activate-package-for-tests-do-not-remove');
        spyOn(atom.workspace, 'open').and.callFake(atom.workspace.openSync);
    });

    afterEach(() => {
        atom.packages.reset();
    });

    it('package is activated', () => {
        expect(atom.packages.isPackageActive('atom-xterm')).toBe(true);
    });

    it('deactivate package', () => {
        atomXtermPackage.deactivate();
        expect(atomXtermPackage.mainActivated).toBe(false);
    });

    it('generateNewUri() starts with atom-xterm://', () => {
        atomXtermPackage.mainModule.generateNewUri.and.callThrough();
        expect(atomXtermPackage.mainModule.generateNewUri().startsWith('atom-xterm://')).toBe(true);
    });

    it('generateNewUri() ends with /', () => {
        atomXtermPackage.mainModule.generateNewUri.and.callThrough();
        expect(atomXtermPackage.mainModule.generateNewUri().endsWith('/')).toBe(true);
    });

    it('run atom-xterm:open and check arguments', () => {
        atom.commands.dispatch(workspaceElement, 'atom-xterm:open');
        expect(atom.workspace.open.calls.allArgs()).toEqual([[default_uri, {}]]);
    });

    it('run atom-xterm:open and check element exists', () => {
        atom.commands.dispatch(workspaceElement, 'atom-xterm:open');
        expect(workspaceElement.querySelector('atom-xterm')).not.toBeNull();
    });

    it('run atom-xterm:open-split-up and check arguments', () => {
        atom.commands.dispatch(workspaceElement, 'atom-xterm:open-split-up');
        expect(atom.workspace.open.calls.allArgs()).toEqual([[default_uri, {'split': 'up'}]]);
    });

    it('run atom-xterm:open-split-up and check element exists', () => {
        atom.commands.dispatch(workspaceElement, 'atom-xterm:open-split-up');
        expect(workspaceElement.querySelector('atom-xterm')).not.toBeNull();
    });

    it('run atom-xterm:open-split-down and check arguments', () => {
        atom.commands.dispatch(workspaceElement, 'atom-xterm:open-split-down');
        expect(atom.workspace.open.calls.allArgs()).toEqual([[default_uri, {'split': 'down'}]]);
    });

    it('run atom-xterm:open-split-down and check element exists', () => {
        atom.commands.dispatch(workspaceElement, 'atom-xterm:open-split-down');
        expect(workspaceElement.querySelector('atom-xterm')).not.toBeNull();
    });

    it('run atom-xterm:open-split-left and check arguments', () => {
        atom.commands.dispatch(workspaceElement, 'atom-xterm:open-split-left');
        expect(atom.workspace.open.calls.allArgs()).toEqual([[default_uri, {'split': 'left'}]]);
    });

    it('run atom-xterm:open-split-left and check element exists', () => {
        atom.commands.dispatch(workspaceElement, 'atom-xterm:open-split-left');
        expect(workspaceElement.querySelector('atom-xterm')).not.toBeNull();
    });

    it('run atom-xterm:open-split-right and check arguments', () => {
        atom.commands.dispatch(workspaceElement, 'atom-xterm:open-split-right');
        expect(atom.workspace.open.calls.allArgs()).toEqual([[default_uri, {'split': 'right'}]]);
    });

    it('run atom-xterm:open-split-down and check element exists', () => {
        atom.commands.dispatch(workspaceElement, 'atom-xterm:open-split-right');
        expect(workspaceElement.querySelector('atom-xterm')).not.toBeNull();
    });

    it('run atom-xterm:reorganize no terminals in workspace', () => {
        spyOn(atomXtermPackage.mainModule, 'reorganize').and.callThrough();
        atom.commands.dispatch(workspaceElement, 'atom-xterm:reorganize');
        expect(atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['current']]);
    });

    it('run atom-xterm:reorganize one terminal in workspace', () => {
        spyOn(atomXtermPackage.mainModule, 'reorganize').and.callThrough();
        atom.commands.dispatch(workspaceElement, 'atom-xterm:open');
        atom.commands.dispatch(workspaceElement, 'atom-xterm:reorganize');
        expect(atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['current']]);
    });

    it('run atom-xterm:reorganize-top no terminals in workspace', () => {
        spyOn(atomXtermPackage.mainModule, 'reorganize').and.callThrough();
        atom.commands.dispatch(workspaceElement, 'atom-xterm:reorganize-top');
        expect(atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['top']]);
    });

    it('run atom-xterm:reorganize-top one terminal in workspace', () => {
        spyOn(atomXtermPackage.mainModule, 'reorganize').and.callThrough();
        atom.commands.dispatch(workspaceElement, 'atom-xterm:open');
        atom.commands.dispatch(workspaceElement, 'atom-xterm:reorganize-top');
        expect(atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['top']]);
    });

    it('run atom-xterm:reorganize-bottom no terminals in workspace', () => {
        spyOn(atomXtermPackage.mainModule, 'reorganize').and.callThrough();
        atom.commands.dispatch(workspaceElement, 'atom-xterm:reorganize-bottom');
        expect(atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['bottom']]);
    });

    it('run atom-xterm:reorganize-bottom one terminal in workspace', () => {
        spyOn(atomXtermPackage.mainModule, 'reorganize').and.callThrough();
        atom.commands.dispatch(workspaceElement, 'atom-xterm:open');
        atom.commands.dispatch(workspaceElement, 'atom-xterm:reorganize-bottom');
        expect(atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['bottom']]);
    });

    it('run atom-xterm:reorganize-left no terminals in workspace', () => {
        spyOn(atomXtermPackage.mainModule, 'reorganize').and.callThrough();
        atom.commands.dispatch(workspaceElement, 'atom-xterm:reorganize-left');
        expect(atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['left']]);
    });

    it('run atom-xterm:reorganize-left one terminal in workspace', () => {
        spyOn(atomXtermPackage.mainModule, 'reorganize').and.callThrough();
        atom.commands.dispatch(workspaceElement, 'atom-xterm:open');
        atom.commands.dispatch(workspaceElement, 'atom-xterm:reorganize-left');
        expect(atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['left']]);
    });

    it('run atom-xterm:reorganize-right no terminals in workspace', () => {
        spyOn(atomXtermPackage.mainModule, 'reorganize').and.callThrough();
        atom.commands.dispatch(workspaceElement, 'atom-xterm:reorganize-right');
        expect(atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['right']]);
    });

    it('run atom-xterm:reorganize-right one terminal in workspace', () => {
        spyOn(atomXtermPackage.mainModule, 'reorganize').and.callThrough();
        atom.commands.dispatch(workspaceElement, 'atom-xterm:open');
        atom.commands.dispatch(workspaceElement, 'atom-xterm:reorganize-right');
        expect(atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['right']]);
    });

    it('run atom-xterm:close-all no terminals in workspace', () => {
        spyOn(atomXtermPackage.mainModule, 'exitAllTerminals').and.callThrough();
        atom.commands.dispatch(workspaceElement, 'atom-xterm:close-all');
        expect(atomXtermPackage.mainModule.exitAllTerminals).toHaveBeenCalled();
    });

    it('run atom-xterm:close-all one terminal in workspace', () => {
        spyOn(atomXtermPackage.mainModule, 'exitAllTerminals').and.callThrough();
        atom.commands.dispatch(workspaceElement, 'atom-xterm:open');
        atom.commands.dispatch(workspaceElement, 'atom-xterm:close-all');
        expect(atomXtermPackage.mainModule.exitAllTerminals).toHaveBeenCalled();
    });

    it('run atom-xterm:close', () => {
        let element = createNewElement(
            package_module=atomXtermPackage.mainModule
        );
        spyOn(atom.workspace, 'getActivePaneItem').and.returnValue(element.model);
        atom.commands.dispatch(element, 'atom-xterm:close');
        expect(element.model.exit).toHaveBeenCalled();
    });

    it('run atom-xterm:copy', () => {
        let element = createNewElement(
            package_module=atomXtermPackage.mainModule
        );
        spyOn(atom.workspace, 'getActivePaneItem').and.returnValue(element.model);
        spyOn(atom.clipboard, 'write');
        atom.commands.dispatch(element, 'atom-xterm:copy');
        expect(atom.clipboard.write.calls.allArgs()).toEqual([['some text from terminal']]);
    });

    it('run atom-xterm:paste', () => {
        let element = createNewElement(
            package_module=atomXtermPackage.mainModule
        );
        spyOn(atom.workspace, 'getActivePaneItem').and.returnValue(element.model);
        atom.clipboard.write('some text from clipboard');
        atom.commands.dispatch(element, 'atom-xterm:paste');
        expect(element.model.pasteToTerminal.calls.allArgs()).toEqual([['some text from clipboard']]);
    });

    it('refitAllTerminals()', () => {
        // Should basically not fail.
        atom.commands.dispatch(workspaceElement, 'atom-xterm:open');
        atomXtermPackage.mainModule.refitAllTerminals();
    });

    describe('AtomXterm settings', () => {
        it('atom-xterm.spawnPtySettings.command', () => {
            expect(atom.config.get('atom-xterm.spawnPtySettings.command')).toEqual(config.getDefaultShellCommand());
        });

        it('atom-xterm.spawnPtySettings.args', () => {
            expect(atom.config.get('atom-xterm.spawnPtySettings.args')).toEqual('[]');
        });

        it('atom-xterm.spawnPtySettings.name', () => {
            expect(atom.config.get('atom-xterm.spawnPtySettings.name')).toEqual(config.getDefaultTermType());
        });

        it('atom-xterm.spawnPtySettings.cwd', () => {
            expect(atom.config.get('atom-xterm.spawnPtySettings.cwd')).toEqual(config.getDefaultCwd());
        });

        it('atom-xterm.spawnPtySettings.env', () => {
            expect(atom.config.get('atom-xterm.spawnPtySettings.env')).toEqual('');
        });

        it('atom-xterm.spawnPtySettings.setEnv', () => {
            expect(atom.config.get('atom-xterm.spawnPtySettings.setEnv')).toEqual('{}');
        });

        it('atom-xterm.spawnPtySettings.deleteEnv', () => {
            expect(atom.config.get('atom-xterm.spawnPtySettings.deleteEnv')).toEqual('[]');
        });

        it('atom-xterm.spawnPtySettings.encoding', () => {
            expect(atom.config.get('atom-xterm.spawnPtySettings.encoding')).toEqual('');
        });

        it('atom-xterm.terminalSettings.fontSize', () => {
            expect(atom.config.get('atom-xterm.terminalSettings.fontSize')).toEqual(14);
        });

        it('atom-xterm.terminalSettings.leaveOpenAfterExit', () => {
            expect(atom.config.get('atom-xterm.terminalSettings.leaveOpenAfterExit')).toBeFalsy();
        });

        // Tests that set specific config values should go last.
        it('atom-xterm.terminalSettings.fontSize minimum 8', () => {
            atom.config.set('atom-xterm.terminalSettings.fontSize', 7);
            expect(atom.config.get('atom-xterm.terminalSettings.fontSize')).toEqual(8);
        });
    });
});
