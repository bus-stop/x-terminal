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
const tmp = require('tmp');

import AtomXtermModel from '../lib/atom-xterm-model';

describe('AtomXtermModel', () => {
    let model;
    let pane;
    let element;
    let disposables;
    let emitter;

    beforeEach(() => {
        let uri = 'atom-xterm://somesessionid/';
        let terminals_set = new Set;
        this.model = new AtomXtermModel(uri, terminals_set);
        this.pane = jasmine.createSpyObj('pane',
            ['destroyItem', 'getActiveItem']);
        this.element = jasmine.createSpyObj('element',
            ['destroy', 'refitTerminal', 'focusOnTerminal']);
        this.element.terminal = jasmine.createSpyObj('terminal',
            ['getSelection']);
        this.element.ptyProcess = jasmine.createSpyObj('ptyProcess',
            ['write']);
        this.disposables = new CompositeDisposable;
        this.emitter = new Emitter;
        this.tmpdirObj = tmp.dirSync({'unsafeCleanup': true});
    });

    afterEach(() => {
        this.disposables.dispose();
        this.tmpdirObj.removeCallback();
    });

    it('constructor with previous active item that has no getPath() method', () => {
        spyOn(atom.workspace, 'getActivePaneItem').and.returnValue({});
        let model = new AtomXtermModel('atom-xterm://somesessionid/', new Set);
        expect(model.getPath()).toBeNull();
    });

    it('constructor with previous active item that has getPath() method', () => {
        let previousActiveItem = jasmine.createSpyObj('somemodel', ['getPath']);
        previousActiveItem.getPath.and.returnValue(this.tmpdirObj.name);
        spyOn(atom.workspace, 'getActivePaneItem').and.returnValue(previousActiveItem);
        let model = new AtomXtermModel('atom-xterm://somesessionid/', new Set);
        expect(model.getPath()).toBe(this.tmpdirObj.name);
    });

    it('constructor with previous active item that has getPath() method returns file path', () => {
        let previousActiveItem = jasmine.createSpyObj('somemodel', ['getPath']);
        let filePath = path.join(this.tmpdirObj.name, 'somefile');
        let fd = fs.openSync(filePath, 'w');
        fs.closeSync(fd);
        previousActiveItem.getPath.and.returnValue(filePath);
        spyOn(atom.workspace, 'getActivePaneItem').and.returnValue(previousActiveItem);
        let model = new AtomXtermModel('atom-xterm://somesessionid/', new Set);
        expect(model.getPath()).toBe(this.tmpdirObj.name);
    });

    it('constructor with previous active item that has getPath() returning invalid path', () => {
        let previousActiveItem = jasmine.createSpyObj('somemodel', ['getPath']);
        previousActiveItem.getPath.and.returnValue(path.join(this.tmpdirObj.name, 'non-existent-dir'));
        spyOn(atom.workspace, 'getActivePaneItem').and.returnValue(previousActiveItem);
        let model = new AtomXtermModel('atom-xterm://somesessionid/', new Set);
        expect(model.getPath()).toBeNull();
    });

    it('constructor with previous active item which exists in project path', () => {
        let previousActiveItem = jasmine.createSpyObj('somemodel', ['getPath']);
        spyOn(atom.workspace, 'getActivePaneItem').and.returnValue(previousActiveItem);
        let expected = ['/some/dir', null];
        spyOn(atom.project, 'relativizePath').and.returnValue(expected);
        let model = new AtomXtermModel('atom-xterm://somesessionid/', new Set);
        expect(model.getPath()).toBe(expected[0]);
    });

    it('destroy() check element is destroyed when set', () => {
        this.model.element = this.element;
        this.model.destroy();
        expect(this.model.element.destroy).toHaveBeenCalled();
    });

    it('destroy() disposables disposed', () => {
        spyOn(this.model.disposables, 'dispose').and.callThrough();
        this.model.destroy();
        expect(this.model.disposables.dispose).toHaveBeenCalled();
    });

    it('destroy() check model removed from terminals_set', () => {
        spyOn(this.model.terminals_set, 'delete').and.callThrough();
        this.model.destroy();
        expect(this.model.terminals_set.delete.calls.allArgs()).toEqual([[this.model]]);
    });

    it('getTitle() with default title', () => {
        expect(this.model.getTitle()).toBe('Atom Xterm');
    });

    it('getTitle() with new title', () => {
        let expected = 'some new title';
        this.model.title = expected;
        expect(this.model.getTitle()).toBe(expected);
    });

    it('getElement()', () => {
        let expected = {'somekey': 'somevalue'};
        this.model.element = expected;
        expect(this.model.getElement()).toBe(expected);
    });

    it('getURI()', () => {
        let uri = 'atom-xterm://somesessionid/';
        let terminals_set = new Set;
        let model = new AtomXtermModel(uri, terminals_set);
        expect(model.getURI()).toBe(uri);
    });

    it('getLongTitle() with default title', () => {
        expect(this.model.getLongTitle()).toBe('Atom Xterm');
    });

    it('getLongTitle() with new title', () => {
        let expected = 'Atom Xterm (some new title)';
        this.model.title = 'some new title';
        expect(this.model.getLongTitle()).toBe(expected);
    });

    it('onDidChangeTitle()', () => {
        let callbackCalled = false;
        this.disposables.add(this.model.onDidChangeTitle(() => {
            callbackCalled = true;
        }));
        this.model.emitter.emit('did-change-title');
        expect(callbackCalled).toBe(true);
    });

    it('getIconName()', () => {
        expect(this.model.getIconName()).toBe('terminal');
    });

    it('isModified()', () => {
        expect(this.model.isModified()).toBe(false);
    });

    it('isModified() modified attribute set to true', () => {
        this.model.modified = true;
        expect(this.model.isModified()).toBe(true);
    });

    it('getPath()', () => {
        expect(this.model.getPath()).toBeNull();
    });

    it('getPath() cwd set', () => {
        let expected = '/some/dir';
        this.model.cwd = expected;
        expect(this.model.getPath()).toBe(expected);
    });

    it('onDidChangeModified()', () => {
        let callbackCalled = false;
        this.disposables.add(this.model.onDidChangeModified(() => {
            callbackCalled = true;
        }));
        this.model.emitter.emit('did-change-modified');
        expect(callbackCalled).toBe(true);
    });

    it('handleNewDataArrival() current item is active item', () => {
        this.pane.getActiveItem.and.returnValue(this.model);
        this.model.pane = this.pane;
        this.model.handleNewDataArrival();
        expect(this.model.modified).toBe(false);
    });

    it('handleNewDataArrival() current item is not active item', () => {
        this.pane.getActiveItem.and.returnValue({});
        this.model.pane = this.pane;
        this.model.handleNewDataArrival();
        expect(this.model.modified).toBe(true);
    });

    it('handleNewDataArrival() modified value of false not changed', () => {
        this.pane.getActiveItem.and.returnValue(this.model);
        this.model.pane = this.pane;
        spyOn(this.model.emitter, 'emit');
        this.model.handleNewDataArrival();
        expect(this.model.emitter.emit).toHaveBeenCalledTimes(0);
    });

    it('handleNewDataArrival() modified value of true not changed', () => {
        this.pane.getActiveItem.and.returnValue({});
        this.model.pane = this.pane;
        this.model.modified = true;
        spyOn(this.model.emitter, 'emit');
        this.model.handleNewDataArrival();
        expect(this.model.emitter.emit).toHaveBeenCalledTimes(0);
    });

    it('handleNewDataArrival() modified value changed', () => {
        this.pane.getActiveItem.and.returnValue({});
        this.model.pane = this.pane;
        spyOn(this.model.emitter, 'emit');
        this.model.handleNewDataArrival();
        expect(this.model.emitter.emit).toHaveBeenCalled();
    });

    it('getSessionId()', () => {
        let expected = 'somesessionid';
        let uri = 'atom-xterm://' + expected + '/';
        let terminals_set = new Set;
        let model = new AtomXtermModel(uri, terminals_set);
        expect(model.getSessionId()).toBe(expected);
    });

    it('getSessionParameters() when no parameters set', () => {
        let uri = 'atom-xterm://somesessionid/';
        let terminals_set = new Set;
        let model = new AtomXtermModel(uri, terminals_set);
        expect(model.getSessionParameters()).toBe('');
    });

    it('getSessionParameters() when parameters set', () => {
        let expected = 'foo=bar';
        let uri = 'atom-xterm://somesessionid/?' + expected;
        let terminals_set = new Set;
        let model = new AtomXtermModel(uri, terminals_set);
        expect(model.getSessionParameters()).toBe(expected);
    });

    it('refitTerminal() without element set', () => {
        // Should just work.
        this.model.refitTerminal();
    });

    it('refitTerminal() with element set', () => {
        this.model.element = this.element;
        this.model.refitTerminal();
        expect(this.model.element.refitTerminal).toHaveBeenCalled();
    });

    it('focusOnTerminal()', () => {
        this.model.element = this.element;
        this.model.focusOnTerminal();
        expect(this.model.element.focusOnTerminal).toHaveBeenCalled();
    });

    it('focusOnTerminal() reset modified value old modified value was false', () => {
        this.model.element = this.element;
        this.model.focusOnTerminal();
        expect(this.model.modified).toBe(false);
    });

    it('focusOnTerminal() reset modified value old modified value was true', () => {
        this.model.element = this.element;
        this.model.modified = true;
        this.model.focusOnTerminal();
        expect(this.model.modified).toBe(false);
    });

    it('focusOnTerminal() no event emitted old modified value was false', () => {
        this.model.element = this.element;
        spyOn(this.model.emitter, 'emit');
        this.model.focusOnTerminal();
        expect(this.model.emitter.emit).toHaveBeenCalledTimes(0);
    });

    it('focusOnTerminal() event emitted old modified value was true', () => {
        this.model.element = this.element;
        this.model.modified = true;
        spyOn(this.model.emitter, 'emit');
        this.model.focusOnTerminal();
        expect(this.model.emitter.emit).toHaveBeenCalled();
    });

    it('exit()', () => {
        this.model.pane = this.pane;
        this.model.exit();
        expect(this.model.pane.destroyItem.calls.allArgs()).toEqual([[this.model, true]]);
    });

    it('copyFromTerminal()', () => {
        this.model.element = this.element;
        this.model.copyFromTerminal();
        expect(this.model.element.terminal.getSelection).toHaveBeenCalled();
    });

    it('pasteToTerminal(text)', () => {
        this.model.element = this.element;
        let expected_text = 'some text';
        this.model.pasteToTerminal(expected_text);
        expect(this.model.element.ptyProcess.write.calls.allArgs()).toEqual([[expected_text]]);
    });

    it('setNewPane(event)', () => {
        let uri = 'atom-xterm://somesessionid/';
        let terminals_set = new Set;
        let model = new AtomXtermModel(uri, terminals_set);
        let expected = {};
        model.setNewPane(expected);
        expect(model.pane).toBe(expected);
    });
});
