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
const tmp = require('tmp');
const { URL } = require('whatwg-url');

import * as config from '../lib/atom-xterm-config';
import AtomXtermModel from '../lib/atom-xterm-model';
import { AtomXtermProfilesSingleton } from '../lib/atom-xterm-profiles';

describe('AtomXtermModel', () => {
    let model;
    let pane;
    let element;
    let disposables;
    let emitter;

    beforeEach((done) => {
        let uri = 'atom-xterm://somesessionid/';
        spyOn(AtomXtermProfilesSingleton.instance, 'generateNewUri').and.returnValue(uri);
        let terminals_set = new Set;
        this.model = new AtomXtermModel({
            uri: uri,
            terminals_set: terminals_set
        });
        this.model.initializedPromise.then(() => {
            this.pane = jasmine.createSpyObj('pane',
                ['destroyItem', 'getActiveItem']);
            this.element = jasmine.createSpyObj('element',
                ['destroy', 'refitTerminal', 'focusOnTerminal', 'clickOnCurrentAnchor', 'getCurrentAnchorHref']);
            this.element.terminal = jasmine.createSpyObj('terminal',
                ['getSelection']);
            this.element.ptyProcess = jasmine.createSpyObj('ptyProcess',
                ['write']);
            this.disposables = new CompositeDisposable;
            this.emitter = new Emitter;
            tmp.dir({'unsafeCleanup': true}, (err, path, cleanupCallback) => {
                this.tmpdir = path;
                this.tmpdirCleanupCallback = cleanupCallback;
                done();
            });
        });
    });

    afterEach(() => {
        this.disposables.dispose();
        this.tmpdirCleanupCallback();
    });

    it('constructor with previous active item that has no getPath() method', (done) => {
        spyOn(atom.workspace, 'getActivePaneItem').and.returnValue({});
        let model = new AtomXtermModel({
            uri: 'atom-xterm://somesessionid/',
            terminals_set: new Set
        });
        model.initializedPromise.then(() => {
            expect(model.getPath()).toBe(config.getDefaultCwd());
            done();
        });
    });

    it('constructor with valid cwd passed in uri', (done) => {
        spyOn(atom.workspace, 'getActivePaneItem').and.returnValue({});
        let url = AtomXtermProfilesSingleton.instance.generateNewUrlFromProfileData({});
        url.searchParams.set('cwd', this.tmpdir);
        let model = new AtomXtermModel({
            uri: url.href,
            terminals_set: new Set
        });
        model.initializedPromise.then(() => {
            expect(model.getPath()).toBe(this.tmpdir);
            done();
        });
    });

    it('constructor with invalid cwd passed in uri', (done) => {
        spyOn(atom.workspace, 'getActivePaneItem').and.returnValue({});
        let url = AtomXtermProfilesSingleton.instance.generateNewUrlFromProfileData({});
        url.searchParams.set('cwd', path.join(this.tmpdir, 'non-existent-dir'));
        let model = new AtomXtermModel({
            uri: url.href,
            terminals_set: new Set
        });
        model.initializedPromise.then(() => {
            expect(model.getPath()).toBe(config.getDefaultCwd());
            done();
        });
    });

    it('constructor with previous active item that has getPath() method', (done) => {
        let previousActiveItem = jasmine.createSpyObj('somemodel', ['getPath']);
        previousActiveItem.getPath.and.returnValue(this.tmpdir);
        spyOn(atom.workspace, 'getActivePaneItem').and.returnValue(previousActiveItem);
        let model = new AtomXtermModel({
            uri: 'atom-xterm://somesessionid/',
            terminals_set: new Set
        });
        model.initializedPromise.then(() => {
            expect(model.getPath()).toBe(this.tmpdir);
            done();
        });
    });

    it('constructor with previous active item that has getPath() method returns file path', (done) => {
        let previousActiveItem = jasmine.createSpyObj('somemodel', ['getPath']);
        let filePath = path.join(this.tmpdir, 'somefile');
        fs.writeFile(filePath, '', (err) => {
            if (err) throw err;
            previousActiveItem.getPath.and.returnValue(filePath);
            spyOn(atom.workspace, 'getActivePaneItem').and.returnValue(previousActiveItem);
            let model = new AtomXtermModel({
                uri: 'atom-xterm://somesessionid/',
                terminals_set: new Set
            });
            model.initializedPromise.then(() => {
                expect(model.getPath()).toBe(this.tmpdir);
                done();
            });
        });
    });

    it('constructor with previous active item that has getPath() returning invalid path', (done) => {
        let previousActiveItem = jasmine.createSpyObj('somemodel', ['getPath']);
        previousActiveItem.getPath.and.returnValue(path.join(this.tmpdir, 'non-existent-dir'));
        spyOn(atom.workspace, 'getActivePaneItem').and.returnValue(previousActiveItem);
        let model = new AtomXtermModel({
            uri: 'atom-xterm://somesessionid/',
            terminals_set: new Set
        });
        model.initializedPromise.then(() => {
            expect(model.getPath()).toBe(config.getDefaultCwd());
            done();
        });
    });

    it('constructor with previous active item which exists in project path', (done) => {
        let previousActiveItem = jasmine.createSpyObj('somemodel', ['getPath']);
        spyOn(atom.workspace, 'getActivePaneItem').and.returnValue(previousActiveItem);
        let expected = ['/some/dir', null];
        spyOn(atom.project, 'relativizePath').and.returnValue(expected);
        let model = new AtomXtermModel({
            uri: 'atom-xterm://somesessionid/',
            terminals_set: new Set
        });
        model.initializedPromise.then(() => {
            expect(model.getPath()).toBe(expected[0]);
            done();
        });
    });

    it('constructor with custom title', (done) => {
        let model = new AtomXtermModel({
            uri: 'atom-xterm://somesessionid/?title=foo',
            terminals_set: new Set
        });
        model.initializedPromise.then(() => {
            expect(model.title).toBe('foo');
            done();
        });
    });

    it('serialize() no cwd set', (done) => {
        let model = new AtomXtermModel({
            uri: 'atom-xterm://somesessionid/',
            terminals_set: new Set
        });
        model.initializedPromise.then(() => {
            let url = AtomXtermProfilesSingleton.instance.generateNewUrlFromProfileData(model.profile);
            let expected = {
                deserializer: 'AtomXtermModel',
                version: '2017-09-17',
                uri: url.href,
            }
            expect(model.serialize()).toEqual(expected);
            done();
        });
    });

    it('serialize() cwd set in model', (done) => {
        let model = new AtomXtermModel({
            uri: 'atom-xterm://somesessionid/',
            terminals_set: new Set
        });
        model.initializedPromise.then(() => {
            model.profile.cwd = '/some/dir';
            let url = AtomXtermProfilesSingleton.instance.generateNewUrlFromProfileData(model.profile);
            let expected = {
                deserializer: 'AtomXtermModel',
                version: '2017-09-17',
                uri: url.href,
            }
            expect(model.serialize()).toEqual(expected);
            done();
        });
    });

    it('serialize() cwd set in uri', (done) => {
        let url = AtomXtermProfilesSingleton.instance.generateNewUrlFromProfileData({});
        url.searchParams.set('cwd', this.tmpdir);
        let model = new AtomXtermModel({
            uri: url.href,
            terminals_set: new Set
        });
        model.initializedPromise.then(() => {
            let url = AtomXtermProfilesSingleton.instance.generateNewUrlFromProfileData(model.profile);
            let expected = {
                deserializer: 'AtomXtermModel',
                version: '2017-09-17',
                uri: url.href,
            }
            expect(url.searchParams.get('cwd')).toEqual(this.tmpdir);
            expect(model.serialize()).toEqual(expected);
            done();
        });
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

    it('getURI()', (done) => {
        let uri = 'atom-xterm://somesessionid/';
        let terminals_set = new Set;
        let model = new AtomXtermModel({
            uri: uri,
            terminals_set: terminals_set
        });
        model.initializedPromise.then(() => {
            expect(model.getURI()).toBe(uri);
            done();
        });
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
        expect(this.model.getPath()).toBe(config.getDefaultCwd());
    });

    it('getPath() cwd set', () => {
        let expected = '/some/dir';
        this.model.profile.cwd = expected;
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

    it('handleNewDataArrival() current item is not in any pane', () => {
        this.model.pane = null;
        this.model.handleNewDataArrival();
        expect(this.model.modified).toBe(true);
    });

    it('handleNewDataArrival() model initially has no pane set', () => {
        this.pane.getActiveItem.and.returnValue({});
        spyOn(atom.workspace, 'paneForItem').and.returnValue(this.pane);
        this.model.handleNewDataArrival();
        expect(atom.workspace.paneForItem).toHaveBeenCalled();
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

    it('getSessionId()', (done) => {
        let expected = 'somesessionid';
        let uri = 'atom-xterm://' + expected + '/';
        let terminals_set = new Set;
        let model = new AtomXtermModel({
            uri: uri,
            terminals_set: terminals_set
        });
        model.initializedPromise.then(() => {
            expect(model.getSessionId()).toBe(expected);
            done();
        });
    });

    it('getSessionParameters() when no parameters set', (done) => {
        let uri = 'atom-xterm://somesessionid/';
        let terminals_set = new Set;
        let model = new AtomXtermModel({
            uri: uri,
            terminals_set: terminals_set
        });
        model.initializedPromise.then(() => {
            let url = AtomXtermProfilesSingleton.instance.generateNewUrlFromProfileData(model.profile);
            url.searchParams.sort();
            expect(model.getSessionParameters()).toBe(url.searchParams.toString());
            done();
        });
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

    it('setNewPane(event)', (done) => {
        let uri = 'atom-xterm://somesessionid/';
        let terminals_set = new Set;
        let model = new AtomXtermModel({
            uri: uri,
            terminals_set: terminals_set
        });
        model.initializedPromise.then(() => {
            let expected = {};
            model.setNewPane(expected);
            expect(model.pane).toBe(expected);
            done();
        });
    });

    it('clickOnCurrentAnchor()', () => {
        this.model.element = this.element;
        this.model.clickOnCurrentAnchor();
        expect(this.model.element.clickOnCurrentAnchor).toHaveBeenCalled();
    });

    it('getCurrentAnchorHref()', () => {
        this.model.element = this.element;
        this.model.getCurrentAnchorHref();
        expect(this.model.element.getCurrentAnchorHref).toHaveBeenCalled();
    });

    it('toggleProfileMenu()', () => {
        this.model.element = jasmine.createSpyObj('element', ['toggleProfileMenu']);
        this.model.toggleProfileMenu();
        expect(this.model.element.toggleProfileMenu).toHaveBeenCalled();
    });

    it('setNewProfile()', () => {
        let mock = jasmine.createSpy('mock');
        this.model.setNewProfile(mock);
        expect(this.model.profile).toBe(mock);
    });
});
