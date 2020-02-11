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

import atomXtermConfig from '../src/lib/atom-xterm-config'
import { AtomXtermProfilesSingleton } from '../src/lib/atom-xterm-profiles'

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
    const url = new URL('atom-xterm://somesessionid')
    const defaultProfile = getDefaultExpectedProfile()
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
      return JSON.stringify({ PATH: '/usr/bin:/bin' })
    }
    if (key === 'atom-xterm.spawnPtySettings.setEnv') {
      return JSON.stringify({ FOO: 'BAR' })
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
      tmp.dir({ unsafeCleanup: true }, (err, _path, cleanupCallback) => {
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
    const cb = () => {
      return new AtomXtermProfilesSingleton()
    }
    expect(cb).toThrowError('AtomXtermProfilesSingleton cannot be instantiated directly.')
  })

  it('instance property works', () => {
    expect(AtomXtermProfilesSingleton.instance).toBeDefined()
  })

  it('has proper profiles.json path', () => {
    const expected = path.join(atomXtermConfig.getUserDataPath(), 'profiles.json')
    // Need to check to original profiles config path.
    expect(this.origProfilesConfigPath).toBe(expected)
  })

  it('sortProfiles()', () => {
    const data = {
      z: 'z',
      y: 'y',
      x: 'x'
    }
    const expected = {
      x: 'x',
      y: 'y',
      z: 'z'
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
    const expected = {
      foo: 'bar'
    }
    AtomXtermProfilesSingleton.instance.updateProfiles(expected).then(() => {
      expect(AtomXtermProfilesSingleton.instance.profiles).toEqual(expected)
      done()
    })
  })

  it('deepClone()', () => {
    const data = {
      z: 'z',
      y: 'y',
      x: 'x'
    }
    expect(AtomXtermProfilesSingleton.instance.deepClone(data)).toEqual(data)
    expect(AtomXtermProfilesSingleton.instance.deepClone(data)).not.toBe(data)
  })

  it('getBaseProfile()', () => {
    const env = atom.config.get('atom-xterm.spawnPtySettings.env') || atomXtermConfig.getDefaultEnv()
    const encoding = atom.config.get('atom-xterm.spawnPtySettings.encoding') || atomXtermConfig.getDefaultEncoding()
    const title = atom.config.get('atom-xterm.terminalSettings.title') || atomXtermConfig.getDefaultTitle()
    const expected = {
      command: atom.config.get('atom-xterm.spawnPtySettings.command') || atomXtermConfig.getDefaultShellCommand(),
      args: JSON.parse(atom.config.get('atom-xterm.spawnPtySettings.args') || atomXtermConfig.getDefaultArgs()),
      name: atom.config.get('atom-xterm.spawnPtySettings.name') || atomXtermConfig.getDefaultTermType(),
      cwd: atom.config.get('atom-xterm.spawnPtySettings.cwd') || atomXtermConfig.getDefaultCwd(),
      env: JSON.parse(env || 'null'),
      setEnv: JSON.parse(atom.config.get('atom-xterm.spawnPtySettings.setEnv') || atomXtermConfig.getDefaultSetEnv()),
      deleteEnv: JSON.parse(atom.config.get('atom-xterm.spawnPtySettings.deleteEnv') || atomXtermConfig.getDefaultDeleteEnv()),
      encoding: encoding || null,
      fontSize: atom.config.get('atom-xterm.terminalSettings.fontSize') || atomXtermConfig.getDefaultFontSize(),
      leaveOpenAfterExit: atom.config.get('atom-xterm.terminalSettings.leaveOpenAfterExit') || atomXtermConfig.getDefaultLeaveOpenAfterExit(),
      relaunchTerminalOnStartup: atom.config.get('atom-xterm.terminalSettings.relaunchTerminalOnStartup') || atomXtermConfig.getDefaultRelaunchTerminalOnStartup(),
      title: title || null,
      xtermOptions: JSON.parse(atom.config.get('atom-xterm.terminalSettings.xtermOptions') || atomXtermConfig.getDefaultXtermOptions()),
      promptToStartup: atom.config.get('atom-xterm.terminalSettings.promptToStartup') || atomXtermConfig.getDefaultPromptToStartup()
    }
    expect(AtomXtermProfilesSingleton.instance.getBaseProfile()).toEqual(expected)
  })

  it('getBaseProfile() settings from atom.config', () => {
    spyOn(atom.config, 'get').and.callFake(fakeAtomConfigGet)
    AtomXtermProfilesSingleton.instance.resetBaseProfile()
    const expected = {
      command: 'somecommand',
      args: ['foo', 'bar'],
      name: 'sometermtype',
      cwd: '/some/path',
      env: { PATH: '/usr/bin:/bin' },
      setEnv: { FOO: 'BAR' },
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
    const data = {
      foo: 'bar'
    }
    expect(AtomXtermProfilesSingleton.instance.sanitizeData(data)).toEqual({})
  })

  it('sanitizeData() check all valid keys', () => {
    const data = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.sanitizeData(data)).toEqual(data)
  })

  it('sanitizeData() valid and unknown keys set', () => {
    const expected = getDefaultExpectedProfile()
    const data = Object.assign({}, expected, {
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
    const data = {
      command: './manage.py',
      args: ['runserver', '9000']
    }
    const profileName = 'Django module runserver'
    AtomXtermProfilesSingleton.instance.setProfile(profileName, data).then(() => {
      AtomXtermProfilesSingleton.instance.isProfileExists(profileName).then((exists) => {
        expect(exists).toBe(true)
        done()
      })
    })
  })

  it('setProfile()', (done) => {
    const data = {
      command: './manage.py',
      args: ['runserver', '9000']
    }
    const expected = Object.assign({}, AtomXtermProfilesSingleton.instance.getBaseProfile(), data)
    const profileName = 'Django module runserver'
    AtomXtermProfilesSingleton.instance.setProfile(profileName, data).then(() => {
      AtomXtermProfilesSingleton.instance.getProfile(profileName).then((profile) => {
        expect(profile).toEqual(expected)
        done()
      })
    })
  })

  it('deleteProfile()', (done) => {
    const data = {
      command: './manage.py',
      args: ['runserver', '9000']
    }
    const profileName = 'Django module runserver'
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
    const url = AtomXtermProfilesSingleton.instance.generateNewUrlFromProfileData({})
    expect(url.searchParams.toString()).toBe('')
  })

  it('generateNewUrlFromProfileData() unknown key set', () => {
    const data = {
      foo: 'bar'
    }
    const url = AtomXtermProfilesSingleton.instance.generateNewUrlFromProfileData(data)
    expect(url.searchParams.toString()).toBe('')
  })

  it('generateNewUrlFromProfileData() check all valid keys', () => {
    const data = {
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
    const expected = 'args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&promptToStartup=false&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title='
    const url = AtomXtermProfilesSingleton.instance.generateNewUrlFromProfileData(data)
    url.searchParams.sort()
    expect(url.searchParams.toString()).toBe(expected)
  })

  it('generateNewUrlFromProfileData() valid and unknown keys set', () => {
    const validData = {
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
    const data = Object.assign({}, validData, {
      foo: 'bar',
      baz: null
    })
    const expected = 'args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&promptToStartup=false&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=&xtermOptions=%7B%22theme%22%3A%7B%22background%22%3A%22%23FFF%22%7D%7D'
    const url = AtomXtermProfilesSingleton.instance.generateNewUrlFromProfileData(data)
    url.searchParams.sort()
    expect(url.searchParams.toString()).toEqual(expected)
  })

  it('createProfileDataFromUri() base URI', () => {
    const url = new URL('atom-xterm://somesessionid/')
    const expected = {}
    expected.command = atomXtermConfig.getDefaultShellCommand()
    expected.args = JSON.parse(atomXtermConfig.getDefaultArgs())
    expected.name = atomXtermConfig.getDefaultTermType()
    expected.cwd = atomXtermConfig.getDefaultCwd()
    expected.env = null
    expected.setEnv = JSON.parse(atomXtermConfig.getDefaultSetEnv())
    expected.deleteEnv = JSON.parse(atomXtermConfig.getDefaultDeleteEnv())
    expected.encoding = null
    expected.fontSize = atomXtermConfig.getDefaultFontSize()
    expected.leaveOpenAfterExit = atomXtermConfig.getDefaultLeaveOpenAfterExit()
    expected.relaunchTerminalOnStartup = atomXtermConfig.getDefaultRelaunchTerminalOnStartup()
    expected.title = null
    expected.xtermOptions = JSON.parse(atomXtermConfig.getDefaultXtermOptions())
    expected.promptToStartup = atomXtermConfig.getDefaultPromptToStartup()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI with all params set', () => {
    const url = getDefaultExpectedUrl()
    const expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI with all params set and invalid params set', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('foo', 'text')
    url.searchParams.set('bar', null)
    const expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI command set to null', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('command', null)
    const expected = getDefaultExpectedProfile()
    expected.command = 'null'
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI command set to empty string', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('command', '')
    const expected = getDefaultExpectedProfile()
    expected.command = atomXtermConfig.getDefaultShellCommand()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI args set to null', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('args', null)
    const expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI args set to empty string', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('args', '')
    const expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI name set to null', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('name', null)
    const expected = getDefaultExpectedProfile()
    expected.name = 'null'
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI name set to empty string', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('name', '')
    const expected = getDefaultExpectedProfile()
    expected.name = atomXtermConfig.getDefaultTermType()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI cwd set to null', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('cwd', null)
    const expected = getDefaultExpectedProfile()
    expected.cwd = 'null'
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI cwd set to empty string', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('cwd', '')
    const expected = getDefaultExpectedProfile()
    expected.cwd = atomXtermConfig.getDefaultCwd()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI env set to null', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('env', null)
    const expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI env set to empty string', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('env', '')
    const expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI env set to empty object', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('env', '{}')
    const expected = getDefaultExpectedProfile()
    // Specifically defining an empty object for env will mean the
    // pty process will run with no environment.
    expected.env = {}
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI setEnv set to null', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('setEnv', null)
    const expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI setEnv set to empty string', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('setEnv', '')
    const expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI deleteEnv set to null', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('deleteEnv', null)
    const expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI deleteEnv set to empty string', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('deleteEnv', '')
    const expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI encoding set to null', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('encoding', null)
    const expected = getDefaultExpectedProfile()
    expected.encoding = null
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI encoding set to empty string', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('encoding', '')
    const expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI fontSize set to null', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('fontSize', null)
    const expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI fontSize set to empty string', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('fontSize', '')
    const expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI leaveOpenAfterExit set to null', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('leaveOpenAfterExit', null)
    const expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI leaveOpenAfterExit set to empty string', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('leaveOpenAfterExit', '')
    const expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI relaunchTerminalOnStartup set to null', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('relaunchTerminalOnStartup', null)
    const expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI relaunchTerminalOnStartup set to empty string', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('relaunchTerminalOnStartup', '')
    const expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI title set to null', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('title', null)
    const expected = getDefaultExpectedProfile()
    expected.title = null
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI title set to empty string', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('title', '')
    const expected = getDefaultExpectedProfile()
    expected.title = null
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI xtermOptions set to null', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('xtermOptions', null)
    const expected = getDefaultExpectedProfile()
    expected.xtermOptions = {}
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI xtermOptions set to empty string', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('xtermOptions', '')
    const expected = getDefaultExpectedProfile()
    expected.xtermOptions = {}
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI promptToStartup set to null', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('promptToStartup', null)
    const expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('createProfileDataFromUri() URI promptToStartup set to empty string', () => {
    const url = getDefaultExpectedUrl()
    url.searchParams.set('promptToStartup', '')
    const expected = getDefaultExpectedProfile()
    expect(AtomXtermProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
  })

  it('diffProfiles() no change between objects', () => {
    const baseProfile = AtomXtermProfilesSingleton.instance.getBaseProfile()
    const expected = {}
    const actual = AtomXtermProfilesSingleton.instance.diffProfiles(baseProfile, baseProfile)
    expect(actual).toEqual(expected)
  })

  it('diffProfiles() removed entries', () => {
    const baseProfile = AtomXtermProfilesSingleton.instance.getBaseProfile()
    const profileChanges = {}
    const expected = {}
    const actual = AtomXtermProfilesSingleton.instance.diffProfiles(baseProfile, profileChanges)
    expect(actual).toEqual(expected)
  })

  it('diffProfiles() modified entries', () => {
    const baseProfile = AtomXtermProfilesSingleton.instance.getBaseProfile()
    const profileChanges = {
      command: 'someothercommand'
    }
    const expected = {
      command: 'someothercommand'
    }
    const actual = AtomXtermProfilesSingleton.instance.diffProfiles(baseProfile, profileChanges)
    expect(actual).toEqual(expected)
  })

  it('diffProfiles() added entries', () => {
    const oldProfile = {
      command: 'somecommand'
    }
    const profileChanges = {
      args: [
        '--foo',
        '--bar',
        '--baz'
      ]
    }
    const expected = {
      args: [
        '--foo',
        '--bar',
        '--baz'
      ]
    }
    const actual = AtomXtermProfilesSingleton.instance.diffProfiles(oldProfile, profileChanges)
    expect(actual).toEqual(expected)
  })

  it('diffProfiles() added and modified entries', () => {
    const oldProfile = {
      command: 'somecommand'
    }
    const profileChanges = {
      command: 'someothercommand',
      args: [
        '--foo',
        '--bar',
        '--baz'
      ]
    }
    const expected = {
      command: 'someothercommand',
      args: [
        '--foo',
        '--bar',
        '--baz'
      ]
    }
    const actual = AtomXtermProfilesSingleton.instance.diffProfiles(oldProfile, profileChanges)
    expect(actual).toEqual(expected)
  })

  it('getDefaultProfile()', () => {
    const expected = {
      command: atomXtermConfig.getDefaultShellCommand(),
      args: JSON.parse(atomXtermConfig.getDefaultArgs()),
      name: atomXtermConfig.getDefaultTermType(),
      cwd: atomXtermConfig.getDefaultCwd(),
      env: null,
      setEnv: JSON.parse(atomXtermConfig.getDefaultSetEnv()),
      deleteEnv: JSON.parse(atomXtermConfig.getDefaultDeleteEnv()),
      encoding: null,
      fontSize: atomXtermConfig.getDefaultFontSize(),
      leaveOpenAfterExit: atomXtermConfig.getDefaultLeaveOpenAfterExit(),
      relaunchTerminalOnStartup: atomXtermConfig.getDefaultRelaunchTerminalOnStartup(),
      title: null,
      xtermOptions: JSON.parse(atomXtermConfig.getDefaultXtermOptions()),
      promptToStartup: atomXtermConfig.getDefaultPromptToStartup()
    }
    expect(AtomXtermProfilesSingleton.instance.getDefaultProfile()).toEqual(expected)
  })

  it('validateJsonConfigSetting() empty string config value', () => {
    spyOn(atom.config, 'get').and.returnValue('')
    const actual = AtomXtermProfilesSingleton.instance.validateJsonConfigSetting(
      'atom-xterm.spawnPtySettings.args',
      '["foo", "bar"]'
    )
    expect(actual).toEqual(['foo', 'bar'])
  })

  it('validateJsonConfigSetting() non-empty string config value', () => {
    spyOn(atom.config, 'get').and.returnValue('["baz"]')
    const actual = AtomXtermProfilesSingleton.instance.validateJsonConfigSetting(
      'atom-xterm.spawnPtySettings.args',
      '["foo", "bar"]'
    )
    expect(actual).toEqual(['baz'])
  })

  it('validateJsonConfigSetting() bad JSON string config value', () => {
    spyOn(atom.config, 'get').and.returnValue('[]]')
    AtomXtermProfilesSingleton.instance.previousBaseProfile.args = ['baz']
    const actual = AtomXtermProfilesSingleton.instance.validateJsonConfigSetting(
      'atom-xterm.spawnPtySettings.args',
      '["foo", "bar"]'
    )
    expect(actual).toEqual(['baz'])
  })

  it('validateJsonConfigSetting() empty string config value null default value', () => {
    spyOn(atom.config, 'get').and.returnValue('')
    AtomXtermProfilesSingleton.instance.previousBaseProfile.args = ['foo', 'bar']
    const actual = AtomXtermProfilesSingleton.instance.validateJsonConfigSetting(
      'atom-xterm.spawnPtySettings.args',
      'null'
    )
    expect(actual).toEqual(['foo', 'bar'])
  })

  it('validateJsonConfigSetting() non-empty string config value null default value', () => {
    spyOn(atom.config, 'get').and.returnValue('["baz"]')
    const actual = AtomXtermProfilesSingleton.instance.validateJsonConfigSetting(
      'atom-xterm.spawnPtySettings.args',
      'null'
    )
    expect(actual).toEqual(['baz'])
  })

  it('validateJsonConfigSetting() bad JSON string config value null default value', () => {
    spyOn(atom.config, 'get').and.returnValue('[]]')
    AtomXtermProfilesSingleton.instance.previousBaseProfile.args = ['foo', 'bar']
    const actual = AtomXtermProfilesSingleton.instance.validateJsonConfigSetting(
      'atom-xterm.spawnPtySettings.args',
      'null'
    )
    expect(actual).toEqual(['foo', 'bar'])
  })
})
