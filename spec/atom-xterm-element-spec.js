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

const path = require('path');

const tmp = require('tmp');
const { URL, URLSearchParams } = require('whatwg-url');

import AtomXtermElement from '../lib/atom-xterm-element';
import AtomXtermModel from '../lib/atom-xterm-model';

describe('AtomXtermElement', () => {
    let element;
    let tmpdirObj;

    let createNewElement = (uri='atom-xterm://somesessionid/') => {
        let terminals_set = new Set;
        let model = new AtomXtermModel(uri, terminals_set);
        model.pane = jasmine.createSpyObj('pane',
            ['removeItem', 'getActiveItem', 'destroyItem']);
        let element = new AtomXtermElement;
        element.initialize(model);
        return element;
    };

    beforeEach(() => {
        atom.config.clear();
        atom.project.setPaths([]);
        this.element = createNewElement();
        this.tmpdirObj = tmp.dirSync({'unsafeCleanup': true});
    });

    afterEach(() => {
        // Destroy the pty processes ASAP.
        this.element.ptyProcess.kill();
        this.tmpdirObj.removeCallback();
        atom.config.clear();
    });

    it('initialize(model)', () => {
        // Simply test if the terminal has been created.
        expect(this.element.terminal).toBeTruthy();
    });

    it('initialize(model) check session-id', () => {
        expect(this.element.getAttribute('session-id')).toBe('somesessionid');
    });

    it('initialize(model) check session-parameters when none set', () => {
        expect(this.element.getAttribute('session-parameters')).toBe('');
    });

    it('initialize(model) check session-parameters when parameters set', () => {
        let element = createNewElement(uri='atom-xterm://somesessionid/?foo=bar');
        expect(element.getAttribute('session-parameters')).toBe('foo=bar');
    });

    it('destroy() check ptyProcess killed', () => {
        spyOn(this.element.ptyProcess, 'kill').and.callThrough();
        this.element.destroy();
        expect(this.element.ptyProcess.kill).toHaveBeenCalled();
    });

    it('destroy() check terminal destroyed', () => {
        spyOn(this.element.terminal, 'destroy').and.callThrough();
        this.element.destroy();
        expect(this.element.terminal.destroy).toHaveBeenCalled();
    });

    it('getShellCommand()', () => {
        expect(this.element.getShellCommand()).toBeNull();
    });

    it('getShellCommand() command set in config', () => {
        let expected = 'somecommand';
        atom.config.set('atom-xterm.spawnPtySettings.command', expected);
        expect(this.element.getShellCommand()).toBe(expected);
    });

    it('getShellCommand() command set in uri', () => {
        let expected = 'somecommand';
        let params = new URLSearchParams({'command': expected});
        let url = new URL('atom-xterm://?' + params.toString());
        this.element.ptyProcess.kill();
        this.element = createNewElement(uri=url.href);
        expect(this.element.getShellCommand()).toBe(expected);
    });

    it('getArgs()', () => {
        expect(this.element.getArgs()).toEqual([]);
    });

    it('getArgs() args set in config', () => {
        let expected = ['some', 'extra', 'args'];
        atom.config.set('atom-xterm.spawnPtySettings.args', JSON.stringify(expected));
        expect(this.element.getArgs()).toEqual(expected);
    });

    it('getArgs() args set in uri', () => {
        let expected = ['some', 'extra', 'args'];
        let params = new URLSearchParams({'args': JSON.stringify(expected)});
        let url = new URL('atom-xterm://?' + params.toString());
        this.element.ptyProcess.kill();
        this.element = createNewElement(uri=url.href);
        expect(this.element.getArgs()).toEqual(expected);
    });

    it('getArgs() throw exception when args is not an array', () => {
        let params = new URLSearchParams({'args': '{}'});
        this.element.model.url = new URL('atom-xterm://?' + params.toString());
        expect(() => {this.element.getArgs();}).toThrow('Arguments set are not an array.');
    });

    it('getTermType()', () => {
        expect(this.element.getTermType()).toBeNull();
    });

    it('getTermType() name set in config', () => {
        let expected = 'sometermtype';
        atom.config.set('atom-xterm.spawnPtySettings.name', expected);
        expect(this.element.getTermType()).toBe(expected);
    });

    it('getTermType() name set in uri', () => {
        let expected = 'sometermtype';
        let params = new URLSearchParams({'name': expected});
        let url = new URL('atom-xterm://?' + params.toString());
        this.element.ptyProcess.kill();
        this.element = createNewElement(uri=url.href);
        expect(this.element.getTermType()).toBe(expected);
    });

    it('getCwd()', () => {
        expect(this.element.getCwd()).toBeNull();
    });

    it('getCwd() cwd set in config', () => {
        let expected = this.tmpdirObj.name;
        atom.config.set('atom-xterm.spawnPtySettings.cwd', expected);
        expect(this.element.getCwd()).toBe(expected);
    });

    it('getCwd() cwd set in uri', () => {
        let expected = this.tmpdirObj.name;
        let params = new URLSearchParams({'cwd': expected});
        let url = new URL('atom-xterm://?' + params.toString());
        this.element.ptyProcess.kill();
        this.element = createNewElement(uri=url.href);
        expect(this.element.getCwd()).toBe(expected);
    });

    it('getCwd() model getPath() returns valid path', () => {
        spyOn(this.element.model, 'getPath').and.returnValue(this.tmpdirObj.name);
        expect(this.element.getCwd()).toBe(this.tmpdirObj.name);
    });

    it('getCwd() model getPath() returns invalid path', () => {
        spyOn(this.element.model, 'getPath').and.returnValue(path.join(this.tmpdirObj.name, 'non-existent-dir'));
        expect(this.element.getCwd()).toBeNull();
    });

    it('getCwd() non-existent cwd set in config', () => {
        let dir = path.join(this.tmpdirObj.name, 'non-existent-dir');
        atom.config.set('atom-xterm.spawnPtySettings.cwd', dir);
        expect(this.element.getCwd()).toBeNull();
    });

    it('getCwd() non-existent cwd set in uri', () => {
        let dir = path.join(this.tmpdirObj.name, 'non-existent-dir');
        let params = new URLSearchParams({'cwd': dir});
        let url = new URL('atom-xterm://?' + params.toString());
        this.element.ptyProcess.kill();
        this.element = createNewElement(uri=url.href);
        expect(this.element.getCwd()).toBeNull();
    });

    it('getCwd() non-existent project path added', () => {
        spyOn(atom.project, 'getPaths').and.returnValue([path.join(this.tmpdirObj.name, 'non-existent-dir')]);
        expect(this.element.getCwd()).toBeNull();
    });

    it('getEnv()', () => {
        expect(this.element.getEnv()).toEqual(process.env);
    });

    it('getEnv() env set in config', () => {
        let expected = {'var1': 'value1', 'var2': 'value2', 'var2': 'value2'};
        atom.config.set('atom-xterm.spawnPtySettings.env', JSON.stringify(expected));
        expect(this.element.getEnv()).toEqual(expected);
    });

    it('getEnv() env set in uri', () => {
        let expected = {'var1': 'value1', 'var2': 'value2', 'var2': 'value2'};
        let params = new URLSearchParams({'env': JSON.stringify(expected)});
        let url = new URL('atom-xterm://?' + params.toString());
        this.element.ptyProcess.kill();
        this.element = createNewElement(uri=url.href);
        expect(this.element.getEnv()).toEqual(expected);
    });

    it('getEnv() throw exception when env is not an object', () => {
        let params = new URLSearchParams({'env': '[]'});
        this.element.model.url = new URL('atom-xterm://?' + params.toString());
        expect(() => {this.element.getEnv();}).toThrow('Environment set is not an object.');
    });

    it('getEnv() setEnv set in config', () => {
        let expected = {'var2': 'value2'};
        atom.config.set('atom-xterm.spawnPtySettings.env', JSON.stringify({'var1': 'value1'}));
        atom.config.set('atom-xterm.spawnPtySettings.setEnv', JSON.stringify(expected));
        expect(this.element.getEnv()['var2']).toEqual(expected['var2']);
    });

    it('getEnv() setEnv set in uri', () => {
        let expected = {'var2': 'value2'};
        let params = new URLSearchParams({'env': JSON.stringify({'var1': 'value1'}), 'setEnv': JSON.stringify(expected)});
        let url = new URL('atom-xterm://?' + params.toString());
        this.element.ptyProcess.kill();
        this.element = createNewElement(uri=url.href);
        expect(this.element.getEnv()['var2']).toEqual(expected['var2']);
    });

    it('getEnv() deleteEnv set in config', () => {
        atom.config.set('atom-xterm.spawnPtySettings.env', JSON.stringify({'var1': 'value1'}));
        atom.config.set('atom-xterm.spawnPtySettings.deleteEnv', JSON.stringify(['var1']));
        expect(this.element.getEnv()['var1']).toBe(undefined);
    });

    it('getEnv() deleteEnv set in uri', () => {
        let params = new URLSearchParams({'env': JSON.stringify({'var1': 'value1'}), 'deleteEnv': JSON.stringify(['var1'])});
        let url = new URL('atom-xterm://?' + params.toString());
        this.element.ptyProcess.kill();
        this.element = createNewElement(uri=url.href);
        expect(this.element.getEnv()['var1']).toBe(undefined);
    });

    it('getEnv() deleteEnv has precendence over senEnv', () => {
        atom.config.set('atom-xterm.spawnPtySettings.env', JSON.stringify({'var1': 'value1'}));
        atom.config.set('atom-xterm.spawnPtySettings.setEnv', JSON.stringify({'var2': 'value2'}));
        atom.config.set('atom-xterm.spawnPtySettings.deleteEnv', JSON.stringify(['var2']));
        expect(this.element.getEnv()['var2']).toBe(undefined);
    });

    it('getEncoding()', () => {
        expect(this.element.getEncoding()).toBeNull();
    });

    it('getEncoding() encoding set in config', () => {
        let expected = 'someencoding';
        atom.config.set('atom-xterm.spawnPtySettings.encoding', expected);
        expect(this.element.getEncoding()).toBe(expected);
    });

    it('getEncoding() encoding set in uri', () => {
        let expected = 'someencoding';
        let params = new URLSearchParams({'encoding': expected});
        this.element.model.url = new URL('atom-xterm://?' + params.toString());
        expect(this.element.getEncoding()).toBe(expected);
    });

    it('leaveOpenAfterExit()', () => {
        expect(this.element.leaveOpenAfterExit()).toBe(false);
    });

    it('leaveOpenAfterExit() value set in config', () => {
        let expected = true;
        atom.config.set('atom-xterm.terminalSettings.leaveOpenAfterExit', expected);
        expect(this.element.leaveOpenAfterExit()).toBe(expected);
    });

    it('leaveOpenAfterExit() true set in uri', () => {
        let expected = true;
        let params = new URLSearchParams({'leaveOpenAfterExit': expected});
        this.element.model.url = new URL('atom-xterm://?' + params.toString());
        expect(this.element.leaveOpenAfterExit()).toBe(expected);
    });

    it('leaveOpenAfterExit() false set in uri', () => {
        let expected = false;
        let params = new URLSearchParams({'leaveOpenAfterExit': expected});
        this.element.model.url = new URL('atom-xterm://?' + params.toString());
        expect(this.element.leaveOpenAfterExit()).toBe(expected);
    });

    it('leaveOpenAfterExit() anything other than true set in uri', () => {
        let params = new URLSearchParams({'leaveOpenAfterExit': 'somestring'});
        this.element.model.url = new URL('atom-xterm://?' + params.toString());
        expect(this.element.leaveOpenAfterExit()).toBe(false);
    });

    it('createTerminal() check terminal object', () => {
        expect(this.element.terminal).toBeTruthy();
    });

    it('createTerminal() check ptyProcess object', () => {
        expect(this.element.ptyProcess).toBeTruthy();
    });

    it('refitTerminal()', () => {
        spyOn(this.element.terminal, 'fit');
        this.element.refitTerminal();
        expect(this.element.terminal.fit).toHaveBeenCalled();
    });

    it('focusOnTerminal()', () => {
        spyOn(this.element.terminal, 'focus');
        this.element.focusOnTerminal();
        expect(this.element.terminal.focus).toHaveBeenCalled();
    });
});
