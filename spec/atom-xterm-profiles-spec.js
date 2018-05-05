/** @babel */
/*
 * Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

import { CompositeDisposable } from 'atom'

import * as config from '../lib/atom-xterm-config'
import { AtomXtermProfilesSingleton } from '../lib/atom-xterm-profiles'

import path from 'path'

import tmp from 'tmp'
import { URL } from 'whatwg-url'

describe('AtomXtermProfilesSingleton', () => {
  const getDefaultExpectedProfile = () => {
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
      xtermOptions: {
        theme: {
          background: '#FFF'
        }
      },
      promptToStartup: false
    }
  }

  const getDefaultExpectedUrl = () => {
    let url = new URL('atom-xterm://somesessionid')
    let defaultProfile = getDefaultExpectedProfile()
    url.searchParams.set('command', defaultProfile.command)
    url.searchParams.set('args', JSON.stringify(defaultProfile.args))
    url.searchParams.set('name', defaultProfile.name)
    url.searchParams.set('cwd', defaultProfile.cwd)
    url.searchParams.set('env', JSON.stringify(defaultProfile.env))
    url.searchParams.set('setEnv', JSON.stringify(defaultProfile.setEnv))
    url.searchParams.set('deleteEnv', JSON.stringify(defaultProfile.deleteEnv))
    url.searchParams.set('encoding', defaultProfile.encoding)
    url.searchParams.set('fontSize', JSON.stringify(defaultProfile.fontSize))
    url.searchParams.set('leaveOpenAfterExit', JSON.stringify(defaultProfile.leaveOpenAfterExit))
    url.searchParams.set('relaunchTerminalOnStartup', JSON.stringify(defaultProfile.relaunchTerminalOnStartup))
    url.searchParams.set('title', defaultProfile.title)
    url.searchParams.set('xtermOptions', JSON.stringify(defaultProfile.xtermOptions))
    url.searchParams.set('promptToStartup', JSON.stringify(defaultProfile.promptToStartup))
    return url
  }

  const fakeAtomConfigGet = (key) => {
    if (key === 'atom-xterm.spawnPtySettings.command') {
      return 'somecommand'
    }
    if (key === 'atom-xterm.spawnPtySettings.args') {
      return JSON.stringify(['foo', 'bar'])
    }
    if (key === 'atom-xterm.spawnPtySettings.name') {
      return 'sometermtype'
    }
    if (key === 'atom-xterm.spawnPtySettings.cwd') {
      return '/some/path'
    }
    if (key === 'atom-xterm.spawnPtySettings.env') {
      return JSON.stringify({'PATH': '/usr/bin:/bin'})
    }
    if (key === 'atom-xterm.spawnPtySettings.setEnv') {
      return JSON.stringify({'FOO': 'BAR'})
    }
    if (key === 'atom-xterm.spawnPtySettings.deleteEnv') {
      return JSON.stringify(['FOO'])
    }
    if (key === 'atom-xterm.spawnPtySettings.encoding') {
      return 'someencoding'
    }
    if (key === 'atom-xterm.terminalSettings.fontSize') {
      return 20
    }
    if (key === 'atom-xterm.terminalSettings.leaveOpenAfterExit') {
      return false
    }
    if (key === 'atom-xterm.terminalSettings.relaunchTerminalOnStartup') {
      return false
    }
    if (key === 'atom-xterm.terminalSettings.title') {
      return 'foo'
    }
    if (key === 'atom-xterm.terminalSettings.xtermOptions') {
      return JSON.stringify({
        theme: {
          background: '#FFF'
        }
      })
    }
    if (key === 'atom-xterm.terminalSettings.promptToStartup') {
      return true
    }
    throw new Error('Unknown key: ' + key)
  }

  beforeEach((done) => {
    this.origAtomConfigGet = atom.config.get
    this.disposables = new CompositeDisposable()
    this.origProfilesConfigPath = AtomXtermProfilesSingleton.instance.profilesConfigPath
    AtomXtermProfilesSingleton.instance.resetBaseProfile()
    AtomXtermProfilesSingleton.instance.profilesLoadPromise.then(() => {
      tmp.dir({'unsafeCleanup': true}, (err, _path, cleanupCallback) => {
        if (err) {
          throw err
        }
        AtomXtermProfilesSingleton.instance.profilesConfigPath = path.join(_path, 'profiles.json')
        this.tmpdirCleanupCallback = cleanupCallback
        AtomXtermProfilesSingleton.instance.reloadProfiles()
        AtomXtermProfilesSingleton.instance.profilesLoadPromise.then(() => {
          done()
        })
      })
    })
  })

  afterEach(() => {
    atom.config.get = this.origAtomConfigGet
    this.tmpdirCleanupCallback()
    AtomXtermProfilesSingleton.instance.profilesConfigPath = this.origProfilesConfigPath
    this.disposables.dispose()
  })

  it('AtomXtermProfilesSingleton cannot be instantiated directly', () => {
    let cb = () => {
      return new AtomXtermProfilesSingleton()
    }
    expect(cb).toThrowError('AtomXtermProfilesSingleton cannot be instantiated directly.')
  })

  it('instance property works', () => {
    expect(AtomXtermProfilesSingleton.instance).toBeDefined()
  })

  it('has proper profiles.json path', () => {
    let expected = path.join(config.getUserDataPath(), 'profiles.json')
    // Need to check to original profiles config path.
    expect(this.origProfilesConfigPath).toBe(expected)
  })

  it('sortProfiles()', () => {
    let data = {
      'z': 'z',
      'y': 'y',
      'x': 'x'
    }
    let expected = {
      'x': 'x',
      'y': 'y',
      'z': 'z'
    }
    expect(AtomXtermProfilesSingleton.instance.sortProfiles(data)).toEqual(expected)
  })

  it('reloadProfiles()', (done) => {
    this.disposables.add(AtomXtermProfilesSingleton.instance.onDidReloadProfiles((profiles) => {
      done()
    }))
    AtomXtermProfilesSingleton.instance.reloadProfiles()
  })

  it('onDidReloadProfiles()', () => {
    // Should just work.
    this.disposables.add(AtomXtermProfilesSingleton.instance.onDidReloadProfiles((profiles) => {}))
  })

  it('onDidResetBaseProfile()', () => {
    // Should just work.
    this.disposables.add(AtomXtermProfilesSingleton.instance.onDidResetBaseProfile((baseProfile) => {}))
  })

  it('updateProfiles()', (done) => {
    let expected = {
      'foo': 'bar'
    }
    AtomXtermProfilesSingleton.instance.updateProfiles(expected).then(() => {
      expect(AtomXtermProfilesSingleton.instance.profiles).toEqual(expected)
      done()
    })
  })

  it('deepClone()', () => {
    let data = {
      'z': 'z',
      'y': 'y',
      'x': 'x'
    }
    expect(AtomXtermProfilesSingleton.instance.deepClone(data)).toEqual(data)
    expect(AtomXtermProfilesSingleton.instance.deepClone(data)).not.toBe(data)
  })

  it('getBaseProfile()', () => {
    let env = atom.config.get('atom-xterm.spawnPtySettings.env') || config.getDefaultEnv()
    let encoding = atom.config.get('atom-xterm.spawnPtySettings.encoding') || config.getDefaultEncoding()
    let title = atom.config.get('atom-xterm.terminalSettings.title') || config.getDefaultTitle()
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
      xtermOptions: JSON.parse(atom.config.get('atom-xterm.terminalSettings.xtermOptions') || config.getDefaultXtermOptions()),
      promptToStartup: atom.config.get('atom-xterm.terminalSettings.promptToStartup') || config.getDefaultPromptToStartup()
    }
    expect(AtomXtermProfilesSingleton.instance.getBaseProfile()).toEqual(expected)
  })

  it('getBaseProfile() settings from atom.config', () => {
    spyOn(atom.config, 'get').and.callFake(fakeAtomConfigGet)
    AtomXtermProfilesSingleton.instance.resetBaseProfile()
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
      xtermOptions: {
        theme: {
          background: '#FFF'
        }
      },
      promptToStartup: true
    }
    expect(AtomXtermProfilesSingleton.instance.getBaseProfile()).toEqual(expected)
  })

  it('resetBaseProfile()', () => {
    AtomXtermProfilesSingleton.instance.baseProfile.env = 'asdfasdfafd'
    AtomXtermProfilesSingleton.instance.resetBaseProfile()
    expect(AtomXtermProfilesSingleton.instance.baseProfile.env).toBeNull()
  })

  it('sanitizeData() empty data', () => {
    expect(AtomXtermProfilesSingleton.instance.sanitizeData({})).toEqual({})
  })

  it('sanitizeData() unknown key set', () => {
    let data = {
      foo: 'bar'
    }
    expect(AtomXtermProfilesSingleton.instance.sanitizeData(data)).toEqual({})
  })

  it('sanitizeData() check all valid keys', () => {
    let data = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.sanitizeData(data)).toEqual(data)
  })

  it('sanitizeData() valid and unknown keys set', () => {
    let expected = getDefaultExpectedProfile()
    let data = Object.assign({}, expected, {
      foo: 'bar',
      baz: null
    })
    expect(AtomXtermProfilesSingleton.instance.sanitizeData(data)).toEqual(expected)
  })

  it('getProfiles() no profiles defined', (done) => {
    AtomXtermProfilesSingleton.instance.getProfiles().then((profiles) => {
      expect(profiles).toEqual({})
      done()
    })
  })

  it('getProfile() no profiles defined', (done) => {
    AtomXtermProfilesSingleton.instance.getProfile('foo').then((profile) => {
      expect(profile).toEqual(AtomXtermProfilesSingleton.instance.getBaseProfile())
      done()
    })
  })

  it('isProfileExists() non-existent profile', (done) => {
    AtomXtermProfilesSingleton.instance.isProfileExists('foo').then((exists) => {
      expect(exists).toBe(false)
      done()
    })
  })

  it('isProfileExists() existent profile', (done) => {
    let data = {
      command: './manage.py',
      args: ['runserver', '9000']
    }
    let profileName = 'Django module runserver'
    AtomXtermProfilesSingleton.instance.setProfile(profileName, data).then(() => {
      AtomXtermProfilesSingleton.instance.isProfileExists(profileName).then((exists) => {
        expect(exists).toBe(true)
        done()
      })
    })
  })

  it('setProfile()', (done) => {
    let data = {
      command: './manage.py',
      args: ['runserver', '9000']
    }
    let expected = Object.assign({}, AtomXtermProfilesSingleton.instance.getBaseProfile(), data)
    let profileName = 'Django module runserver'
    AtomXtermProfilesSingleton.instance.setProfile(profileName, data).then(() => {
      AtomXtermProfilesSingleton.instance.getProfile(profileName).then((profile) => {
        expect(profile).toEqual(expected)
        done()
      })
    })
  })

  it('deleteProfile()', (done) => {
    let data = {
      command: './manage.py',
      args: ['runserver', '9000']
    }
    let profileName = 'Django module runserver'
    AtomXtermProfilesSingleton.instance.setProfile(profileName, data).then(() => {
      AtomXtermProfilesSingleton.instance.deleteProfile(profileName).then(() => {
        AtomXtermProfilesSingleton.instance.isProfileExists(profileName).then((exists) => {
          expect(exists).toBe(false)
          done()
        })
      })
    })
  })

  it('generateNewUri() starts with atom-xterm://', () => {
    spyOn(AtomXtermProfilesSingleton.instance, 'generateNewUri').and.callThrough()
    expect(AtomXtermProfilesSingleton.instance.generateNewUri().startsWith('atom-xterm://')).toBe(true)
  })

  it('generateNewUri() ends with /', () => {
    spyOn(AtomXtermProfilesSingleton.instance, 'generateNewUri').and.callThrough()
    expect(AtomXtermProfilesSingleton.instance.generateNewUri().endsWith('/')).toBe(true)
  })

  it('generateNewUrlFromProfileData() empty data', () => {
    let url = AtomXtermProfilesSingleton.instance.generateNewUrlFromProfileData({})
    expect(url.searchParams.toString()).toBe('')
  })

  it('generateNewUrlFromProfileData() unknown key set', () => {
    let data = {
      foo: 'bar'
    }
    let url = AtomXtermProfilesSingleton.instance.generateNewUrlFromProfileData(data)
    expect(url.searchParams.toString()).toBe('')
  })

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
      promptToStartup: false
    }
    let expected = 'args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&promptToStartup=false&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title='
    let url = AtomXtermProfilesSingleton.instance.generateNewUrlFromProfileData(data)
    url.searchParams.sort()
    expect(url.searchParams.toString()).toBe(expected)
  })

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
      xtermOptions: {
        theme: {
          background: '#FFF'
        }
      },
      promptToStartup: false
    }
    let data = Object.assign({}, validData, {
      foo: 'bar',
      baz: null
    })
    let expected = 'args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&promptToStartup=false&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=&xtermOptions=%7B%22theme%22%3A%7B%22background%22%3A%22%23FFF%22%7D%7D'
    let url = AtomXtermProfilesSingleton.instance.generateNewUrlFromProfileData(data)
    url.searchParams.sort()
    expect(url.searchParams.toString()).toEqual(expected)
  })

  it('createProfileDataFromUri() base URI', () => {
    let url = new URL('atom-xterm://somesessionid/')
    let expected = {}
    expected.command = config.getDefaultShellCommand()
    expected.args = JSON.parse(config.getDefaultArgs())
    expected.name = config.getDefaultTermType()
    expected.cwd = config.getDefaultCwd()
    expected.env = null
    expected.setEnv = JSON.parse(config.getDefaultSetEnv())
    expected.deleteEnv = JSON.parse(config.getDefaultDeleteEnv())
    expected.encoding = null
    expected.fontSize = config.getDefaultFontSize()
    expected.leaveOpenAfterExit = config.getDefaultLeaveOpenAfterExit()
    expected.relaunchTerminalOnStartup = config.getDefaultRelaunchTerminalOnStartup()
    expected.title = null
    expected.xtermOptions = JSON.parse(config.getDefaultXtermOptions())
    expected.promptToStartup = config.getDefaultPromptToStartup()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI with all params set', () => {
    let url = getDefaultExpectedUrl()
    let expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI with all params set and invalid params set', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('foo', 'text')
    url.searchParams.set('bar', null)
    let expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI command set to null', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('command', null)
    let expected = getDefaultExpectedProfile()
    expected.command = 'null'
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI command set to empty string', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('command', '')
    let expected = getDefaultExpectedProfile()
    expected.command = config.getDefaultShellCommand()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI args set to null', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('args', null)
    let expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI args set to empty string', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('args', '')
    let expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI name set to null', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('name', null)
    let expected = getDefaultExpectedProfile()
    expected.name = 'null'
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI name set to empty string', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('name', '')
    let expected = getDefaultExpectedProfile()
    expected.name = config.getDefaultTermType()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI cwd set to null', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('cwd', null)
    let expected = getDefaultExpectedProfile()
    expected.cwd = 'null'
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI cwd set to empty string', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('cwd', '')
    let expected = getDefaultExpectedProfile()
    expected.cwd = config.getDefaultCwd()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI env set to null', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('env', null)
    let expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI env set to empty string', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('env', '')
    let expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI env set to empty object', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('env', '{}')
    let expected = getDefaultExpectedProfile()
    // Specifically defining an empty object for env will mean the
    // pty process will run with no environment.
    expected.env = {}
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI setEnv set to null', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('setEnv', null)
    let expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI setEnv set to empty string', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('setEnv', '')
    let expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI deleteEnv set to null', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('deleteEnv', null)
    let expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI deleteEnv set to empty string', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('deleteEnv', '')
    let expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI encoding set to null', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('encoding', null)
    let expected = getDefaultExpectedProfile()
    expected.encoding = null
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI encoding set to empty string', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('encoding', '')
    let expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI fontSize set to null', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('fontSize', null)
    let expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI fontSize set to empty string', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('fontSize', '')
    let expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI leaveOpenAfterExit set to null', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('leaveOpenAfterExit', null)
    let expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI leaveOpenAfterExit set to empty string', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('leaveOpenAfterExit', '')
    let expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI relaunchTerminalOnStartup set to null', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('relaunchTerminalOnStartup', null)
    let expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI relaunchTerminalOnStartup set to empty string', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('relaunchTerminalOnStartup', '')
    let expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI title set to null', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('title', null)
    let expected = getDefaultExpectedProfile()
    expected.title = null
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI title set to empty string', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('title', '')
    let expected = getDefaultExpectedProfile()
    expected.title = null
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI xtermOptions set to null', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('xtermOptions', null)
    let expected = getDefaultExpectedProfile()
    expected.xtermOptions = {}
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI xtermOptions set to empty string', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('xtermOptions', '')
    let expected = getDefaultExpectedProfile()
    expected.xtermOptions = {}
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI promptToStartup set to null', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('promptToStartup', null)
    let expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI promptToStartup set to empty string', () => {
    let url = getDefaultExpectedUrl()
    url.searchParams.set('promptToStartup', '')
    let expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('diffProfiles() no change between objects', () => {
    let baseProfile = AtomXtermProfilesSingleton.instance.getBaseProfile()
    let expected = {}
    let actual = AtomXtermProfilesSingleton.instance.diffProfiles(baseProfile, baseProfile)
    expect(actual).toEqual(expected)
  })

  it('diffProfiles() removed entries', () => {
    let baseProfile = AtomXtermProfilesSingleton.instance.getBaseProfile()
    let profileChanges = {}
    let expected = {}
    let actual = AtomXtermProfilesSingleton.instance.diffProfiles(baseProfile, profileChanges)
    expect(actual).toEqual(expected)
  })

  it('diffProfiles() modified entries', () => {
    let baseProfile = AtomXtermProfilesSingleton.instance.getBaseProfile()
    let profileChanges = {
      command: 'someothercommand'
    }
    let expected = {
      command: 'someothercommand'
    }
    let actual = AtomXtermProfilesSingleton.instance.diffProfiles(baseProfile, profileChanges)
    expect(actual).toEqual(expected)
  })

  it('diffProfiles() added entries', () => {
    let oldProfile = {
      command: 'somecommand'
    }
    let profileChanges = {
      args: [
        '--foo',
        '--bar',
        '--baz'
      ]
    }
    let expected = {
      args: [
        '--foo',
        '--bar',
        '--baz'
      ]
    }
    let actual = AtomXtermProfilesSingleton.instance.diffProfiles(oldProfile, profileChanges)
    expect(actual).toEqual(expected)
  })

  it('diffProfiles() added and modified entries', () => {
    let oldProfile = {
      command: 'somecommand'
    }
    let profileChanges = {
      command: 'someothercommand',
      args: [
        '--foo',
        '--bar',
        '--baz'
      ]
    }
    let expected = {
      command: 'someothercommand',
      args: [
        '--foo',
        '--bar',
        '--baz'
      ]
    }
    let actual = AtomXtermProfilesSingleton.instance.diffProfiles(oldProfile, profileChanges)
    expect(actual).toEqual(expected)
  })

  it('getDefaultProfile()', () => {
    let expected = {
      command: config.getDefaultShellCommand(),
      args: JSON.parse(config.getDefaultArgs()),
      name: config.getDefaultTermType(),
      cwd: config.getDefaultCwd(),
      env: null,
      setEnv: JSON.parse(config.getDefaultSetEnv()),
      deleteEnv: JSON.parse(config.getDefaultDeleteEnv()),
      encoding: null,
      fontSize: config.getDefaultFontSize(),
      leaveOpenAfterExit: config.getDefaultLeaveOpenAfterExit(),
      relaunchTerminalOnStartup: config.getDefaultRelaunchTerminalOnStartup(),
      title: null,
      xtermOptions: JSON.parse(config.getDefaultXtermOptions()),
      promptToStartup: config.getDefaultPromptToStartup()
    }
    expect(AtomXtermProfilesSingleton.instance.getDefaultProfile()).toEqual(expected)
  })

  it('validateJsonConfigSetting() empty string config value', () => {
    spyOn(atom.config, 'get').and.returnValue('')
    let actual = AtomXtermProfilesSingleton.instance.validateJsonConfigSetting(
      'atom-xterm.spawnPtySettings.args',
      '["foo", "bar"]'
    )
    expect(actual).toEqual(['foo', 'bar'])
  })

  it('validateJsonConfigSetting() non-empty string config value', () => {
    spyOn(atom.config, 'get').and.returnValue('["baz"]')
    let actual = AtomXtermProfilesSingleton.instance.validateJsonConfigSetting(
      'atom-xterm.spawnPtySettings.args',
      '["foo", "bar"]'
    )
    expect(actual).toEqual(['baz'])
  })

  it('validateJsonConfigSetting() bad JSON string config value', () => {
    spyOn(atom.config, 'get').and.returnValue('[]]')
    AtomXtermProfilesSingleton.instance.previousBaseProfile.args = ['baz']
    let actual = AtomXtermProfilesSingleton.instance.validateJsonConfigSetting(
      'atom-xterm.spawnPtySettings.args',
      '["foo", "bar"]'
    )
    expect(actual).toEqual(['baz'])
  })

  it('validateJsonConfigSetting() empty string config value null default value', () => {
    spyOn(atom.config, 'get').and.returnValue('')
    AtomXtermProfilesSingleton.instance.previousBaseProfile.args = ['foo', 'bar']
    let actual = AtomXtermProfilesSingleton.instance.validateJsonConfigSetting(
      'atom-xterm.spawnPtySettings.args',
      'null'
    )
    expect(actual).toEqual(['foo', 'bar'])
  })

  it('validateJsonConfigSetting() non-empty string config value null default value', () => {
    spyOn(atom.config, 'get').and.returnValue('["baz"]')
    let actual = AtomXtermProfilesSingleton.instance.validateJsonConfigSetting(
      'atom-xterm.spawnPtySettings.args',
      'null'
    )
    expect(actual).toEqual(['baz'])
  })

  it('validateJsonConfigSetting() bad JSON string config value null default value', () => {
    spyOn(atom.config, 'get').and.returnValue('[]]')
    AtomXtermProfilesSingleton.instance.previousBaseProfile.args = ['foo', 'bar']
    let actual = AtomXtermProfilesSingleton.instance.validateJsonConfigSetting(
      'atom-xterm.spawnPtySettings.args',
      'null'
    )
    expect(actual).toEqual(['foo', 'bar'])
  })
})
