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

const os = require('os');
const path = require('path');

import { CompositeDisposable } from 'atom';
const tmp = require('tmp');
const { URL } = require('whatwg-url');

import * as config from '../lib/atom-xterm-config';
import { AtomXtermProfilesSingleton } from '../lib/atom-xterm-profiles';

describe('AtomXtermProfilesSingleton', () => {
    let getDefaultExpectedProfile = () => {
        return {
            command: 'somecommand',
            args: [],
            name: 'sometermtype',
            cwd: '/some/path',
            env: null,
            setEnv: {},
            deleteEnv: [],
            encoding: null,
            fontSize: 14,
            leaveOpenAfterExit: true,
            relaunchTerminalOnStartup: true,
            title: 'foo',
        };
    };

    let fakeAtomConfigGet = (key) => {
        if (key === 'atom-xterm.spawnPtySettings.command') {
            return 'somecommand';
        }
        if (key === 'atom-xterm.spawnPtySettings.args') {
            return JSON.stringify(['foo', 'bar']);
        }
        if (key === 'atom-xterm.spawnPtySettings.name') {
            return 'sometermtype';
        }
        if (key === 'atom-xterm.spawnPtySettings.cwd') {
            return '/some/path';
        }
        if (key === 'atom-xterm.spawnPtySettings.env') {
            return JSON.stringify({'PATH': '/usr/bin:/bin'});
        }
        if (key === 'atom-xterm.spawnPtySettings.setEnv') {
            return JSON.stringify({'FOO': 'BAR'});
        }
        if (key === 'atom-xterm.spawnPtySettings.deleteEnv') {
            return JSON.stringify(['FOO']);
        }
        if (key === 'atom-xterm.spawnPtySettings.encoding') {
            return 'someencoding';
        }
        if (key === 'atom-xterm.terminalSettings.fontSize') {
            return 20;
        }
        if (key === 'atom-xterm.terminalSettings.leaveOpenAfterExit') {
            return false;
        }
        if (key === 'atom-xterm.terminalSettings.relaunchTerminalOnStartup') {
            return false;
        }
        if (key === 'atom-xterm.terminalSettings.title') {
            return 'foo';
        }
        throw new Error('Unknown key: ' + key);
    };

    beforeEach((done) => {
        this.disposables = new CompositeDisposable;
        this.origProfilesConfigPath = AtomXtermProfilesSingleton.instance.profilesConfigPath;
        AtomXtermProfilesSingleton.instance.resetBaseProfile();
        AtomXtermProfilesSingleton.instance.profilesLoadPromise.then(() => {
            tmp.dir({'unsafeCleanup': true}, (err, _path, cleanupCallback) => {
                AtomXtermProfilesSingleton.instance.profilesConfigPath = path.join(_path, 'profiles.json');
                this.tmpdirCleanupCallback = cleanupCallback;
                AtomXtermProfilesSingleton.instance.reloadProfiles();
                AtomXtermProfilesSingleton.instance.profilesLoadPromise.then(() => {
                    done();
                });
            });
        });
    });

    afterEach(() => {
        this.tmpdirCleanupCallback();
        AtomXtermProfilesSingleton.instance.profilesConfigPath = this.origProfilesConfigPath;
        this.disposables.dispose();
    });

    it('AtomXtermProfilesSingleton cannot be instantiated directly', () => {
        let cb = () => {
            new AtomXtermProfilesSingleton;
        };
        expect(cb).toThrowError('AtomXtermProfilesSingleton cannot be instantiated directly.');
    });

    it('instance property works', () => {
        expect(AtomXtermProfilesSingleton.instance).toBeDefined;
    });

    it('has proper profiles.json path', () => {
        let expected = path.join(config.getUserDataPath(), 'profiles.json');
        // Need to check to original profiles config path.
        expect(this.origProfilesConfigPath).toBe(expected);
    });

    it('sortProfiles()', () => {
        let data = {
            'z': 'z',
            'y': 'y',
            'x': 'x',
        };
        let expected = {
            'x': 'x',
            'y': 'y',
            'z': 'z',
        };
        expect(AtomXtermProfilesSingleton.instance.sortProfiles(data)).toEqual(expected);
    });

    it('reloadProfiles()', (done) => {
        this.disposables.add(AtomXtermProfilesSingleton.instance.onDidReloadProfiles((profiles) => {
            done();
        }));
        AtomXtermProfilesSingleton.instance.reloadProfiles();
    });

    it('onDidReloadProfiles()', () => {
        // Should just work.
        this.disposables.add(AtomXtermProfilesSingleton.instance.onDidReloadProfiles((profiles) => {}));
    });

    it('updateProfiles()', (done) => {
        let expected = {
            'foo': 'bar'
        }
        AtomXtermProfilesSingleton.instance.updateProfiles(expected).then(() => {
            expect(AtomXtermProfilesSingleton.instance.profiles).toEqual(expected);
            done();
        });
    });

    it('deepClone()', () => {
        let data = {
            'z': 'z',
            'y': 'y',
            'x': 'x',
        };
        expect(AtomXtermProfilesSingleton.instance.deepClone(data)).toEqual(data);
        expect(AtomXtermProfilesSingleton.instance.deepClone(data)).not.toBe(data);
    });

    it('getBaseProfile()', () => {
        let env = atom.config.get('atom-xterm.spawnPtySettings.env') || config.getDefaultEnv();
        let encoding = atom.config.get('atom-xterm.spawnPtySettings.encoding') || config.getDefaultEncoding();
        let title = atom.config.get('atom-xterm.terminalSettings.title') || config.getDefaultTitle();
        let expected = {
            command: atom.config.get('atom-xterm.spawnPtySettings.command') || config.getDefaultShellCommand(),
            args: JSON.parse(atom.config.get('atom-xterm.spawnPtySettings.args') || config.getDefaultArgs()),
            name: atom.config.get('atom-xterm.spawnPtySettings.name') || config.getDefaultTermType(),
            cwd: atom.config.get('atom-xterm.spawnPtySettings.cwd') || config.getDefaultCwd(),
            env: JSON.parse(env || 'null'),
            setEnv: JSON.parse(atom.config.get('atom-xterm.spawnPtySettings.setEnv') || config.getDefaultSetEnv()),
            deleteEnv: JSON.parse(atom.config.get('atom-xterm.spawnPtySettings.deleteEnv') || config.getDefaultDeleteEnv()),
            encoding: encoding || null,
            fontSize: atom.config.get('atom-xterm.terminalSettings.fontSize') || config.getDefaultFontSize(),
            leaveOpenAfterExit: atom.config.get('atom-xterm.terminalSettings.leaveOpenAfterExit') || config.getDefaultLeaveOpenAfterExit(),
            relaunchTerminalOnStartup: atom.config.get('atom-xterm.terminalSettings.relaunchTerminalOnStartup') || config.getDefaultRelaunchTerminalOnStartup(),
            title: title || null,
        };
        expect(AtomXtermProfilesSingleton.instance.getBaseProfile()).toEqual(expected);
    });

    it('getBaseProfile() settings from atom.config', () => {
        spyOn(atom.config, 'get').and.callFake(fakeAtomConfigGet);
        AtomXtermProfilesSingleton.instance.resetBaseProfile();
        let expected = {
            command: 'somecommand',
            args: ['foo', 'bar'],
            name: 'sometermtype',
            cwd: '/some/path',
            env: {'PATH': '/usr/bin:/bin'},
            setEnv: {'FOO': 'BAR'},
            deleteEnv: ['FOO'],
            encoding: 'someencoding',
            fontSize: 20,
            leaveOpenAfterExit: false,
            relaunchTerminalOnStartup: false,
            title: 'foo',
        };
        expect(AtomXtermProfilesSingleton.instance.getBaseProfile()).toEqual(expected);
    });

    it('resetBaseProfile()', () => {
        AtomXtermProfilesSingleton.instance.baseProfile.env = 'asdfasdfafd';
        AtomXtermProfilesSingleton.instance.resetBaseProfile();
        expect(AtomXtermProfilesSingleton.instance.baseProfile.env).toBeNull();
    });

    it('sanitizeData() empty data', () => {
        expect(AtomXtermProfilesSingleton.instance.sanitizeData({})).toEqual({});
    });

    it('sanitizeData() unknown key set', () => {
        let data = {
            foo: 'bar',
        };
        expect(AtomXtermProfilesSingleton.instance.sanitizeData(data)).toEqual({});
    });

    it('sanitizeData() check all valid keys', () => {
        let data = {
            command: 'somecommand',
            args: [],
            name: 'sometermtype',
            cwd: '/some/path',
            env: null,
            setEnv: {},
            deleteEnv: [],
            encoding: '',
            fontSize: 14,
            leaveOpenAfterExit: true,
            relaunchTerminalOnStartup: true,
            title: '',
        };
        expect(AtomXtermProfilesSingleton.instance.sanitizeData(data)).toEqual(data);
    });

    it('sanitizeData() valid and unknown keys set', () => {
        let expected = {
            command: 'somecommand',
            args: [],
            name: 'sometermtype',
            cwd: '/some/path',
            env: null,
            setEnv: {},
            deleteEnv: [],
            encoding: '',
            fontSize: 14,
            leaveOpenAfterExit: true,
            relaunchTerminalOnStartup: true,
            title: '',
        };
        let data = Object.assign({}, expected, {
            foo: 'bar',
            baz: null,
        });
        expect(AtomXtermProfilesSingleton.instance.sanitizeData(data)).toEqual(expected);
    });

    it('getProfiles() no profiles defined', (done) => {
        AtomXtermProfilesSingleton.instance.getProfiles().then((profiles) => {
            expect(profiles).toEqual({});
            done();
        });
    });

    it('getProfile() no profiles defined', (done) => {
        AtomXtermProfilesSingleton.instance.getProfile('foo').then((profile) => {
            expect(profile).toEqual(AtomXtermProfilesSingleton.instance.getBaseProfile());
            done();
        });
    });

    it('isProfileExists() non-existent profile', (done) => {
        AtomXtermProfilesSingleton.instance.isProfileExists('foo').then((exists) => {
            expect(exists).toBe(false);
            done();
        });
    });

    it('isProfileExists() existent profile', (done) => {
        let data = {
            command: './manage.py',
            args: ['runserver', '9000'],
        };
        let expected = Object.assign({}, AtomXtermProfilesSingleton.instance.getBaseProfile(), data);
        let profileName = 'Django module runserver';
        AtomXtermProfilesSingleton.instance.setProfile(profileName, data).then(() => {
            AtomXtermProfilesSingleton.instance.isProfileExists(profileName).then((exists) => {
                expect(exists).toBe(true);
                done();
            });
        });
    });

    it('setProfile()', (done) => {
        let data = {
            command: './manage.py',
            args: ['runserver', '9000'],
        };
        let expected = Object.assign({}, AtomXtermProfilesSingleton.instance.getBaseProfile(), data);
        let profileName = 'Django module runserver';
        AtomXtermProfilesSingleton.instance.setProfile(profileName, data).then(() => {
            AtomXtermProfilesSingleton.instance.getProfile(profileName).then((profile) => {
                expect(profile).toEqual(expected);
                done();
            });
        });
    });

    it('deleteProfile()', (done) => {
        let data = {
            command: './manage.py',
            args: ['runserver', '9000'],
        };
        let expected = Object.assign({}, AtomXtermProfilesSingleton.instance.getBaseProfile(), data);
        let profileName = 'Django module runserver';
        AtomXtermProfilesSingleton.instance.setProfile(profileName, data).then(() => {
            AtomXtermProfilesSingleton.instance.deleteProfile(profileName).then(() => {
                AtomXtermProfilesSingleton.instance.isProfileExists(profileName).then((exists) => {
                    expect(exists).toBe(false);
                    done();
                });
            });
        });
    });

    it('generateNewUri() starts with atom-xterm://', () => {
        spyOn(AtomXtermProfilesSingleton.instance, 'generateNewUri').and.callThrough();
        expect(AtomXtermProfilesSingleton.instance.generateNewUri().startsWith('atom-xterm://')).toBe(true);
    });

    it('generateNewUri() ends with /', () => {
        spyOn(AtomXtermProfilesSingleton.instance, 'generateNewUri').and.callThrough();
        expect(AtomXtermProfilesSingleton.instance.generateNewUri().endsWith('/')).toBe(true);
    });

    it('generateNewUrlFromProfileData() empty data', () => {
        let url = AtomXtermProfilesSingleton.instance.generateNewUrlFromProfileData({});
        expect(url.searchParams.toString()).toBe('');
    });

    it('generateNewUrlFromProfileData() unknown key set', () => {
        let data = {
            foo: 'bar',
        };
        let url = AtomXtermProfilesSingleton.instance.generateNewUrlFromProfileData(data);
        expect(url.searchParams.toString()).toBe('');
    });

    it('generateNewUrlFromProfileData() check all valid keys', () => {
        let data = {
            command: 'somecommand',
            args: [],
            name: 'sometermtype',
            cwd: '/some/path',
            env: null,
            setEnv: {},
            deleteEnv: [],
            encoding: '',
            fontSize: 14,
            leaveOpenAfterExit: true,
            relaunchTerminalOnStartup: true,
            title: '',
        };
        let expected = 'args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=';
        let url = AtomXtermProfilesSingleton.instance.generateNewUrlFromProfileData(data);
        url.searchParams.sort();
        expect(url.searchParams.toString()).toBe(expected);
    });

    it('generateNewUrlFromProfileData() valid and unknown keys set', () => {
        let validData = {
            command: 'somecommand',
            args: [],
            name: 'sometermtype',
            cwd: '/some/path',
            env: null,
            setEnv: {},
            deleteEnv: [],
            encoding: '',
            fontSize: 14,
            leaveOpenAfterExit: true,
            relaunchTerminalOnStartup: true,
            title: '',
        };
        let data = Object.assign({}, validData, {
            foo: 'bar',
            baz: null,
        });
        let expected = 'args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=';
        let url = AtomXtermProfilesSingleton.instance.generateNewUrlFromProfileData(data);
        url.searchParams.sort();
        expect(url.searchParams.toString()).toEqual(expected);
    });

    it('createProfileDataFromUri() base URI', () => {
        let url = new URL('atom-xterm://somesessionid/');
        let expected = {}
        expected.command = config.getDefaultShellCommand();
        expected.args = JSON.parse(config.getDefaultArgs());
        expected.name = config.getDefaultTermType();
        expected.cwd = config.getDefaultCwd();
        expected.env = null;
        expected.setEnv = JSON.parse(config.getDefaultSetEnv());
        expected.deleteEnv = JSON.parse(config.getDefaultDeleteEnv());
        expected.encoding = null;
        expected.fontSize = config.getDefaultFontSize();
        expected.leaveOpenAfterExit = config.getDefaultLeaveOpenAfterExit();
        expected.relaunchTerminalOnStartup = config.getDefaultRelaunchTerminalOnStartup();
        expected.title = null;
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI with all params set', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=foo');
        let expected = getDefaultExpectedProfile();
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI with all params set and invalid params set', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=foo&foo=bar&baz=null');
        let expected = getDefaultExpectedProfile();
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI command set to null', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=null&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=foo');
        let expected = getDefaultExpectedProfile();
        expected.command = 'null';
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI command set to empty string', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=foo');
        let expected = getDefaultExpectedProfile();
        expected.command = config.getDefaultShellCommand();
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI args set to null', () => {
        let url = new URL('atom-xterm://somesessionid/?args=null&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=foo');
        let expected = getDefaultExpectedProfile();
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI args set to empty string', () => {
        let url = new URL('atom-xterm://somesessionid/?args=&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=foo');
        let expected = getDefaultExpectedProfile();
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI name set to null', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=null&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=foo');
        let expected = getDefaultExpectedProfile();
        expected.name = 'null';
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI name set to empty string', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=foo');
        let expected = getDefaultExpectedProfile();
        expected.name = config.getDefaultTermType();
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI cwd set to null', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=null&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=foo');
        let expected = getDefaultExpectedProfile();
        expected.cwd = 'null';
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI cwd set to empty string', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=foo');
        let expected = getDefaultExpectedProfile();
        expected.cwd = config.getDefaultCwd();
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI env set to null', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=foo');
        let expected = getDefaultExpectedProfile();
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI env set to empty string', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=foo');
        let expected = getDefaultExpectedProfile();
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI env set to empty object', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=%7B%7D&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=foo');
        let expected = getDefaultExpectedProfile();
        // Specifically defining an empty object for env will mean the
        // pty process will run with no environment.
        expected.env = {};
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI setEnv set to null', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=null&title=foo');
        let expected = getDefaultExpectedProfile();
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI setEnv set to empty string', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=&title=foo');
        let expected = getDefaultExpectedProfile();
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI deleteEnv set to null', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=null&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=foo');
        let expected = getDefaultExpectedProfile();
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI deleteEnv set to empty string', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=foo');
        let expected = getDefaultExpectedProfile();
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI encoding set to null', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=null&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=foo');
        let expected = getDefaultExpectedProfile();
        expected.encoding = null;
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI encoding set to empty string', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=foo');
        let expected = getDefaultExpectedProfile();
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI fontSize set to null', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=null&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=foo');
        let expected = getDefaultExpectedProfile();
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI fontSize set to empty string', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=foo');
        let expected = getDefaultExpectedProfile();
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI leaveOpenAfterExit set to null', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=null&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=foo');
        let expected = getDefaultExpectedProfile();
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI leaveOpenAfterExit set to empty string', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=foo');
        let expected = getDefaultExpectedProfile();
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI relaunchTerminalOnStartup set to null', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=null&setEnv=%7B%7D&title=foo');
        let expected = getDefaultExpectedProfile();
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI relaunchTerminalOnStartup set to empty string', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=&setEnv=%7B%7D&title=foo');
        let expected = getDefaultExpectedProfile();
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI title set to null', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=null&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=null');
        let expected = getDefaultExpectedProfile();
        expected.title = null;
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });

    it('createProfileDataFromUri() URI title set to empty string', () => {
        let url = new URL('atom-xterm://somesessionid/?args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=');
        let expected = getDefaultExpectedProfile();
        expected.title = null;
        expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected);
    });
});
