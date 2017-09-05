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

import * as config from '../lib/atom-xterm-config';

describe('Call to getDefaultShellCommand()', () => {
    const savedPlatform = process.platform;
    let savedEnv;

    beforeEach(() => {
        savedEnv = JSON.parse(JSON.stringify(process.env));
    });

    afterEach(() => {
        process.env = savedEnv;
        Object.defineProperty(process, 'platform', {
            'value': savedPlatform
        });
    });

    it('on win32 without COMSPEC set', () => {
        Object.defineProperty(process, 'platform', {
            'value': 'win32'
        });
        if (process.env.COMSPEC) {
            delete process.env.COMSPEC;
        }
        expect(config.getDefaultShellCommand()).toBe('cmd.exe');
    });

    it('on win32 with COMSPEC set', () => {
        Object.defineProperty(process, 'platform', {
            'value': 'win32'
        });
        let expected = 'somecommand.exe';
        process.env.COMSPEC = expected;
        expect(config.getDefaultShellCommand()).toBe(expected);
    });

    it('on linux without SHELL set', () => {
        Object.defineProperty(process, 'platform', {
            'value': 'linux'
        });
        if (process.env.SHELL) {
            delete process.env.SHELL;
        }
        expect(config.getDefaultShellCommand()).toBe('/bin/sh');
    });

    it('on linux with SHELL set', () => {
        Object.defineProperty(process, 'platform', {
            'value': 'linux'
        });
        let expected = 'somecommand';
        process.env.SHELL = expected;
        expect(config.getDefaultShellCommand()).toBe(expected);
    });
});

describe('Call to getDefaultTermType()', () => {
    let savedEnv;

    beforeEach(() => {
        savedEnv = JSON.parse(JSON.stringify(process.env));
    });

    afterEach(() => {
        process.env = savedEnv;
    });

    it('without TERM set', () => {
        if (process.env.TERM) {
            delete process.env.TERM;
        }
        expect(config.getDefaultTermType()).toBe('xterm-color');
    });

    it('with TERM set', () => {
        let expected = 'sometermtype';
        process.env.TERM = expected;
        expect(config.getDefaultTermType()).toBe(expected);
    });
});

describe('Call to getDefaultCwd()', () => {
    const savedPlatform = process.platform;
    let savedEnv;

    beforeEach(() => {
        savedEnv = JSON.parse(JSON.stringify(process.env));
    });

    afterEach(() => {
        process.env = savedEnv;
        Object.defineProperty(process, 'platform', {
            'value': savedPlatform
        });
    });

    it('on win32', () => {
        Object.defineProperty(process, 'platform', {
            'value': 'win32'
        });
        let expected = 'C:\\some\\dir';
        process.env.USERPROFILE = expected;
        expect(config.getDefaultCwd()).toBe(expected);
    });

    it('on linux', () => {
        Object.defineProperty(process, 'platform', {
            'value': 'linux'
        });
        let expected = '/some/dir';
        process.env.HOME = expected;
        expect(config.getDefaultCwd()).toBe(expected);
    });
});

describe('Call to getStyles(fontSize)', () => {
    it('fontSize is a Number', () => {
        let fontSize = 14;
        expect(config.getStyles(fontSize)).toBe('atom-xterm .terminal { font-size: 14px; }');
    });

    it('fontSize is a String', () => {
        let fontSize = '14';
        expect(config.getStyles(fontSize)).toBe('atom-xterm .terminal { font-size: 14px; }');
    });
});
