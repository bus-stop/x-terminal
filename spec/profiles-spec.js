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

import { configDefaults } from '../src/lib/config'
import { AtomXtermProfilesSingleton } from '../src/lib/profiles'

import path from 'path'

import temp from 'temp'
import { URL } from 'whatwg-url'

temp.track()

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
			fontFamily: 'monospace',
			theme: 'Custom',
			colorForeground: '#ffffff',
			colorBackground: '#000000',
			colorCursor: '#ffffff',
			colorCursorAccent: '#000000',
			colorSelection: '#4d4d4d',
			colorBlack: '#2e3436',
			colorRed: '#cc0000',
			colorGreen: '#4e9a06',
			colorYellow: '#c4a000',
			colorBlue: '#3465a4',
			colorMagenta: '#75507b',
			colorCyan: '#06989a',
			colorWhite: '#d3d7cf',
			colorBrightBlack: '#555753',
			colorBrightRed: '#ef2929',
			colorBrightGreen: '#8ae234',
			colorBrightYellow: '#fce94f',
			colorBrightBlue: '#729fcf',
			colorBrightMagenta: '#ad7fa8',
			colorBrightCyan: '#34e2e2',
			colorBrightWhite: '#eeeeec',
			leaveOpenAfterExit: true,
			relaunchTerminalOnStartup: true,
			title: 'foo',
			xtermOptions: {
				cursorBlink: true,
			},
			promptToStartup: false,
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
		if (key === 'atom-xterm.terminalSettings.fontFamily') {
			return 'test'
		}
		if (key === 'atom-xterm.terminalSettings.colors.theme') {
			return 'Homebrew'
		}
		if (key === 'atom-xterm.terminalSettings.colors.foreground') {
			return '#123456'
		}
		if (key === 'atom-xterm.terminalSettings.colors.background') {
			return '#123457'
		}
		if (key === 'atom-xterm.terminalSettings.colors.cursor') {
			return '#123458'
		}
		if (key === 'atom-xterm.terminalSettings.colors.cursorAccent') {
			return '#123459'
		}
		if (key === 'atom-xterm.terminalSettings.colors.selection') {
			return '#123460'
		}
		if (key === 'atom-xterm.terminalSettings.colors.black') {
			return '#123461'
		}
		if (key === 'atom-xterm.terminalSettings.colors.red') {
			return '#123462'
		}
		if (key === 'atom-xterm.terminalSettings.colors.green') {
			return '#123463'
		}
		if (key === 'atom-xterm.terminalSettings.colors.yellow') {
			return '#123464'
		}
		if (key === 'atom-xterm.terminalSettings.colors.blue') {
			return '#123465'
		}
		if (key === 'atom-xterm.terminalSettings.colors.magenta') {
			return '#123466'
		}
		if (key === 'atom-xterm.terminalSettings.colors.cyan') {
			return '#123467'
		}
		if (key === 'atom-xterm.terminalSettings.colors.white') {
			return '#123468'
		}
		if (key === 'atom-xterm.terminalSettings.colors.brightBlack') {
			return '#123469'
		}
		if (key === 'atom-xterm.terminalSettings.colors.brightRed') {
			return '#123470'
		}
		if (key === 'atom-xterm.terminalSettings.colors.brightGreen') {
			return '#123471'
		}
		if (key === 'atom-xterm.terminalSettings.colors.brightYellow') {
			return '#123472'
		}
		if (key === 'atom-xterm.terminalSettings.colors.brightBlue') {
			return '#123473'
		}
		if (key === 'atom-xterm.terminalSettings.colors.brightMagenta') {
			return '#123474'
		}
		if (key === 'atom-xterm.terminalSettings.colors.brightCyan') {
			return '#123475'
		}
		if (key === 'atom-xterm.terminalSettings.colors.brightWhite') {
			return '#123476'
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
				cursorBlink: true,
			})
		}
		if (key === 'atom-xterm.terminalSettings.promptToStartup') {
			return true
		}
		throw new Error('Unknown key: ' + key)
	}

	beforeEach(async () => {
		this.origAtomConfigGet = atom.config.get
		this.disposables = new CompositeDisposable()
		this.origProfilesConfigPath = AtomXtermProfilesSingleton.instance.profilesConfigPath
		AtomXtermProfilesSingleton.instance.resetBaseProfile()
		await AtomXtermProfilesSingleton.instance.profilesLoadPromise
		const _path = await temp.mkdir()
		AtomXtermProfilesSingleton.instance.profilesConfigPath = path.join(_path, 'profiles.json')
		AtomXtermProfilesSingleton.instance.reloadProfiles()
		await AtomXtermProfilesSingleton.instance.profilesLoadPromise
	})

	afterEach(async () => {
		atom.config.get = this.origAtomConfigGet
		await temp.cleanup()
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
		const expected = path.join(configDefaults.getUserDataPath(), 'profiles.json')
		// Need to check to original profiles config path.
		expect(this.origProfilesConfigPath).toBe(expected)
	})

	it('sortProfiles()', () => {
		const data = {
			z: 'z',
			y: 'y',
			x: 'x',
		}
		const expected = {
			x: 'x',
			y: 'y',
			z: 'z',
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

	it('updateProfiles()', async () => {
		const expected = {
			foo: 'bar',
		}
		await AtomXtermProfilesSingleton.instance.updateProfiles(expected)
		expect(AtomXtermProfilesSingleton.instance.profiles).toEqual(expected)
	})

	it('deepClone()', () => {
		const data = {
			z: 'z',
			y: 'y',
			x: 'x',
		}
		expect(AtomXtermProfilesSingleton.instance.deepClone(data)).toEqual(data)
		expect(AtomXtermProfilesSingleton.instance.deepClone(data)).not.toBe(data)
	})

	it('getBaseProfile()', () => {
		const env = atom.config.get('atom-xterm.spawnPtySettings.env') || configDefaults.getDefaultEnv()
		const encoding = atom.config.get('atom-xterm.spawnPtySettings.encoding') || configDefaults.getDefaultEncoding()
		const title = atom.config.get('atom-xterm.terminalSettings.title') || configDefaults.getDefaultTitle()
		const expected = {
			command: atom.config.get('atom-xterm.spawnPtySettings.command') || configDefaults.getDefaultShellCommand(),
			args: JSON.parse(atom.config.get('atom-xterm.spawnPtySettings.args') || configDefaults.getDefaultArgs()),
			name: atom.config.get('atom-xterm.spawnPtySettings.name') || configDefaults.getDefaultTermType(),
			cwd: atom.config.get('atom-xterm.spawnPtySettings.cwd') || configDefaults.getDefaultCwd(),
			env: JSON.parse(env || 'null'),
			setEnv: JSON.parse(atom.config.get('atom-xterm.spawnPtySettings.setEnv') || configDefaults.getDefaultSetEnv()),
			deleteEnv: JSON.parse(atom.config.get('atom-xterm.spawnPtySettings.deleteEnv') || configDefaults.getDefaultDeleteEnv()),
			encoding: encoding || null,
			fontSize: atom.config.get('atom-xterm.terminalSettings.fontSize') || configDefaults.getDefaultFontSize(),
			fontFamily: atom.config.get('atom-xterm.terminalSettings.fontFamily') || configDefaults.getDefaultFontFamily(),
			theme: atom.config.get('atom-xterm.terminalSettings.colors.theme') || configDefaults.getDefaultTheme(),
			colorForeground: atom.config.get('atom-xterm.terminalSettings.colors.foreground') || configDefaults.getDefaultColorForeground(),
			colorBackground: atom.config.get('atom-xterm.terminalSettings.colors.background') || configDefaults.getDefaultColorBackground(),
			colorCursor: atom.config.get('atom-xterm.terminalSettings.colors.cursor') || configDefaults.getDefaultColorCursor(),
			colorCursorAccent: atom.config.get('atom-xterm.terminalSettings.colors.cursorAccent') || configDefaults.getDefaultColorCursorAccent(),
			colorSelection: atom.config.get('atom-xterm.terminalSettings.colors.selection') || configDefaults.getDefaultColorSelection(),
			colorBlack: atom.config.get('atom-xterm.terminalSettings.colors.black') || configDefaults.getDefaultColorBlack(),
			colorRed: atom.config.get('atom-xterm.terminalSettings.colors.red') || configDefaults.getDefaultColorRed(),
			colorGreen: atom.config.get('atom-xterm.terminalSettings.colors.green') || configDefaults.getDefaultColorGreen(),
			colorYellow: atom.config.get('atom-xterm.terminalSettings.colors.Yellow') || configDefaults.getDefaultColorYellow(),
			colorBlue: atom.config.get('atom-xterm.terminalSettings.colors.blue') || configDefaults.getDefaultColorBlue(),
			colorMagenta: atom.config.get('atom-xterm.terminalSettings.colors.Magenta') || configDefaults.getDefaultColorMagenta(),
			colorCyan: atom.config.get('atom-xterm.terminalSettings.colors.cyan') || configDefaults.getDefaultColorCyan(),
			colorWhite: atom.config.get('atom-xterm.terminalSettings.colors.White') || configDefaults.getDefaultColorWhite(),
			colorBrightBlack: atom.config.get('atom-xterm.terminalSettings.colors.brightBlack') || configDefaults.getDefaultColorBrightBlack(),
			colorBrightRed: atom.config.get('atom-xterm.terminalSettings.colors.brightRed') || configDefaults.getDefaultColorBrightRed(),
			colorBrightGreen: atom.config.get('atom-xterm.terminalSettings.colors.brightGreen') || configDefaults.getDefaultColorBrightGreen(),
			colorBrightYellow: atom.config.get('atom-xterm.terminalSettings.colors.brightYellow') || configDefaults.getDefaultColorBrightYellow(),
			colorBrightBlue: atom.config.get('atom-xterm.terminalSettings.colors.brightBlue') || configDefaults.getDefaultColorBrightBlue(),
			colorBrightMagenta: atom.config.get('atom-xterm.terminalSettings.colors.brightMagenta') || configDefaults.getDefaultColorBrightMagenta(),
			colorBrightCyan: atom.config.get('atom-xterm.terminalSettings.colors.brightCyan') || configDefaults.getDefaultColorBrightCyan(),
			colorBrightWhite: atom.config.get('atom-xterm.terminalSettings.colors.brightWhite') || configDefaults.getDefaultColorBrightWhite(),
			leaveOpenAfterExit: atom.config.get('atom-xterm.terminalSettings.leaveOpenAfterExit') || configDefaults.getDefaultLeaveOpenAfterExit(),
			relaunchTerminalOnStartup: atom.config.get('atom-xterm.terminalSettings.relaunchTerminalOnStartup') || configDefaults.getDefaultRelaunchTerminalOnStartup(),
			title: title || null,
			xtermOptions: JSON.parse(atom.config.get('atom-xterm.terminalSettings.xtermOptions') || configDefaults.getDefaultXtermOptions()),
			promptToStartup: atom.config.get('atom-xterm.terminalSettings.promptToStartup') || configDefaults.getDefaultPromptToStartup(),
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
			fontFamily: 'test',
			theme: 'Homebrew',
			colorForeground: '#123456',
			colorBackground: '#123457',
			colorCursor: '#123458',
			colorCursorAccent: '#123459',
			colorSelection: '#123460',
			colorBlack: '#123461',
			colorRed: '#123462',
			colorGreen: '#123463',
			colorYellow: '#123464',
			colorBlue: '#123465',
			colorMagenta: '#123466',
			colorCyan: '#123467',
			colorWhite: '#123468',
			colorBrightBlack: '#123469',
			colorBrightRed: '#123470',
			colorBrightGreen: '#123471',
			colorBrightYellow: '#123472',
			colorBrightBlue: '#123473',
			colorBrightMagenta: '#123474',
			colorBrightCyan: '#123475',
			colorBrightWhite: '#123476',
			leaveOpenAfterExit: false,
			relaunchTerminalOnStartup: false,
			title: 'foo',
			xtermOptions: {
				cursorBlink: true,
			},
			promptToStartup: true,
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
			foo: 'bar',
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
			baz: null,
		})
		expect(AtomXtermProfilesSingleton.instance.sanitizeData(data)).toEqual(expected)
	})

	it('getProfiles() no profiles defined', async () => {
		const profiles = await AtomXtermProfilesSingleton.instance.getProfiles()
		expect(profiles).toEqual({})
	})

	it('getProfile() no profiles defined', async () => {
		const profile = await AtomXtermProfilesSingleton.instance.getProfile('foo')
		expect(profile).toEqual(AtomXtermProfilesSingleton.instance.getBaseProfile())
	})

	it('isProfileExists() non-existent profile', async () => {
		const exists = await AtomXtermProfilesSingleton.instance.isProfileExists('foo')
		expect(exists).toBe(false)
	})

	it('isProfileExists() existent profile', async () => {
		const data = {
			command: './manage.py',
			args: ['runserver', '9000'],
		}
		const profileName = 'Django module runserver'
		await AtomXtermProfilesSingleton.instance.setProfile(profileName, data)
		const exists = await AtomXtermProfilesSingleton.instance.isProfileExists(profileName)
		expect(exists).toBe(true)
	})

	it('setProfile()', async () => {
		const data = {
			command: './manage.py',
			args: ['runserver', '9000'],
		}
		const expected = Object.assign({}, AtomXtermProfilesSingleton.instance.getBaseProfile(), data)
		const profileName = 'Django module runserver'
		await AtomXtermProfilesSingleton.instance.setProfile(profileName, data)
		const profile = await AtomXtermProfilesSingleton.instance.getProfile(profileName)
		expect(profile).toEqual(expected)
	})

	it('deleteProfile()', async () => {
		const data = {
			command: './manage.py',
			args: ['runserver', '9000'],
		}
		const profileName = 'Django module runserver'
		await AtomXtermProfilesSingleton.instance.setProfile(profileName, data)
		await AtomXtermProfilesSingleton.instance.deleteProfile(profileName)
		const exists = await AtomXtermProfilesSingleton.instance.isProfileExists(profileName)
		expect(exists).toBe(false)
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
			foo: 'bar',
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
			promptToStartup: false,
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
				cursorBlink: true,
			},
			promptToStartup: false,
		}
		const data = Object.assign({}, validData, {
			foo: 'bar',
			baz: null,
		})
		const expected = 'args=%5B%5D&command=somecommand&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&promptToStartup=false&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=&xtermOptions=%7B%22cursorBlink%22%3Atrue%7D'
		const url = AtomXtermProfilesSingleton.instance.generateNewUrlFromProfileData(data)
		url.searchParams.sort()
		expect(url.searchParams.toString()).toEqual(expected)
	})

	it('createProfileDataFromUri() base URI', () => {
		const url = new URL('atom-xterm://somesessionid/')
		const expected = {
			command: configDefaults.getDefaultShellCommand(),
			args: JSON.parse(configDefaults.getDefaultArgs()),
			name: configDefaults.getDefaultTermType(),
			cwd: configDefaults.getDefaultCwd(),
			env: null,
			setEnv: JSON.parse(configDefaults.getDefaultSetEnv()),
			deleteEnv: JSON.parse(configDefaults.getDefaultDeleteEnv()),
			encoding: null,
			fontSize: configDefaults.getDefaultFontSize(),
			fontFamily: configDefaults.getDefaultFontFamily(),
			theme: configDefaults.getDefaultTheme(),
			colorForeground: configDefaults.getDefaultColorForeground(),
			colorBackground: configDefaults.getDefaultColorBackground(),
			colorCursor: configDefaults.getDefaultColorCursor(),
			colorCursorAccent: configDefaults.getDefaultColorCursorAccent(),
			colorSelection: configDefaults.getDefaultColorSelection(),
			colorBlack: configDefaults.getDefaultColorBlack(),
			colorRed: configDefaults.getDefaultColorRed(),
			colorGreen: configDefaults.getDefaultColorGreen(),
			colorYellow: configDefaults.getDefaultColorYellow(),
			colorBlue: configDefaults.getDefaultColorBlue(),
			colorMagenta: configDefaults.getDefaultColorMagenta(),
			colorCyan: configDefaults.getDefaultColorCyan(),
			colorWhite: configDefaults.getDefaultColorWhite(),
			colorBrightBlack: configDefaults.getDefaultColorBrightBlack(),
			colorBrightRed: configDefaults.getDefaultColorBrightRed(),
			colorBrightGreen: configDefaults.getDefaultColorBrightGreen(),
			colorBrightYellow: configDefaults.getDefaultColorBrightYellow(),
			colorBrightBlue: configDefaults.getDefaultColorBrightBlue(),
			colorBrightMagenta: configDefaults.getDefaultColorBrightMagenta(),
			colorBrightCyan: configDefaults.getDefaultColorBrightCyan(),
			colorBrightWhite: configDefaults.getDefaultColorBrightWhite(),
			leaveOpenAfterExit: configDefaults.getDefaultLeaveOpenAfterExit(),
			relaunchTerminalOnStartup: configDefaults.getDefaultRelaunchTerminalOnStartup(),
			title: null,
			xtermOptions: JSON.parse(configDefaults.getDefaultXtermOptions()),
			promptToStartup: configDefaults.getDefaultPromptToStartup(),
		}
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
		expected.command = configDefaults.getDefaultShellCommand()
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
		expected.name = configDefaults.getDefaultTermType()
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
		expected.cwd = configDefaults.getDefaultCwd()
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
			command: 'someothercommand',
		}
		const expected = {
			command: 'someothercommand',
		}
		const actual = AtomXtermProfilesSingleton.instance.diffProfiles(baseProfile, profileChanges)
		expect(actual).toEqual(expected)
	})

	it('diffProfiles() added entries', () => {
		const oldProfile = {
			command: 'somecommand',
		}
		const profileChanges = {
			args: [
				'--foo',
				'--bar',
				'--baz',
			],
		}
		const expected = {
			args: [
				'--foo',
				'--bar',
				'--baz',
			],
		}
		const actual = AtomXtermProfilesSingleton.instance.diffProfiles(oldProfile, profileChanges)
		expect(actual).toEqual(expected)
	})

	it('diffProfiles() added and modified entries', () => {
		const oldProfile = {
			command: 'somecommand',
		}
		const profileChanges = {
			command: 'someothercommand',
			args: [
				'--foo',
				'--bar',
				'--baz',
			],
		}
		const expected = {
			command: 'someothercommand',
			args: [
				'--foo',
				'--bar',
				'--baz',
			],
		}
		const actual = AtomXtermProfilesSingleton.instance.diffProfiles(oldProfile, profileChanges)
		expect(actual).toEqual(expected)
	})

	it('getDefaultProfile()', () => {
		const expected = {
			command: configDefaults.getDefaultShellCommand(),
			args: JSON.parse(configDefaults.getDefaultArgs()),
			name: configDefaults.getDefaultTermType(),
			cwd: configDefaults.getDefaultCwd(),
			env: null,
			setEnv: JSON.parse(configDefaults.getDefaultSetEnv()),
			deleteEnv: JSON.parse(configDefaults.getDefaultDeleteEnv()),
			encoding: null,
			fontSize: configDefaults.getDefaultFontSize(),
			fontFamily: configDefaults.getDefaultFontFamily(),
			theme: configDefaults.getDefaultTheme(),
			colorForeground: configDefaults.getDefaultColorForeground(),
			colorBackground: configDefaults.getDefaultColorBackground(),
			colorCursor: configDefaults.getDefaultColorCursor(),
			colorCursorAccent: configDefaults.getDefaultColorCursorAccent(),
			colorSelection: configDefaults.getDefaultColorSelection(),
			colorBlack: configDefaults.getDefaultColorBlack(),
			colorRed: configDefaults.getDefaultColorRed(),
			colorGreen: configDefaults.getDefaultColorGreen(),
			colorYellow: configDefaults.getDefaultColorYellow(),
			colorBlue: configDefaults.getDefaultColorBlue(),
			colorMagenta: configDefaults.getDefaultColorMagenta(),
			colorCyan: configDefaults.getDefaultColorCyan(),
			colorWhite: configDefaults.getDefaultColorWhite(),
			colorBrightBlack: configDefaults.getDefaultColorBrightBlack(),
			colorBrightRed: configDefaults.getDefaultColorBrightRed(),
			colorBrightGreen: configDefaults.getDefaultColorBrightGreen(),
			colorBrightYellow: configDefaults.getDefaultColorBrightYellow(),
			colorBrightBlue: configDefaults.getDefaultColorBrightBlue(),
			colorBrightMagenta: configDefaults.getDefaultColorBrightMagenta(),
			colorBrightCyan: configDefaults.getDefaultColorBrightCyan(),
			colorBrightWhite: configDefaults.getDefaultColorBrightWhite(),
			leaveOpenAfterExit: configDefaults.getDefaultLeaveOpenAfterExit(),
			relaunchTerminalOnStartup: configDefaults.getDefaultRelaunchTerminalOnStartup(),
			title: null,
			xtermOptions: JSON.parse(configDefaults.getDefaultXtermOptions()),
			promptToStartup: configDefaults.getDefaultPromptToStartup(),
		}
		expect(AtomXtermProfilesSingleton.instance.getDefaultProfile()).toEqual(expected)
	})

	it('validateJsonConfigSetting() empty string config value', () => {
		spyOn(atom.config, 'get').and.returnValue('')
		const actual = AtomXtermProfilesSingleton.instance.validateJsonConfigSetting(
			'atom-xterm.spawnPtySettings.args',
			'["foo", "bar"]',
		)
		expect(actual).toEqual(['foo', 'bar'])
	})

	it('validateJsonConfigSetting() non-empty string config value', () => {
		spyOn(atom.config, 'get').and.returnValue('["baz"]')
		const actual = AtomXtermProfilesSingleton.instance.validateJsonConfigSetting(
			'atom-xterm.spawnPtySettings.args',
			'["foo", "bar"]',
		)
		expect(actual).toEqual(['baz'])
	})

	it('validateJsonConfigSetting() bad JSON string config value', () => {
		spyOn(atom.config, 'get').and.returnValue('[]]')
		AtomXtermProfilesSingleton.instance.previousBaseProfile.args = ['baz']
		const actual = AtomXtermProfilesSingleton.instance.validateJsonConfigSetting(
			'atom-xterm.spawnPtySettings.args',
			'["foo", "bar"]',
		)
		expect(actual).toEqual(['baz'])
	})

	it('validateJsonConfigSetting() empty string config value null default value', () => {
		spyOn(atom.config, 'get').and.returnValue('')
		AtomXtermProfilesSingleton.instance.previousBaseProfile.args = ['foo', 'bar']
		const actual = AtomXtermProfilesSingleton.instance.validateJsonConfigSetting(
			'atom-xterm.spawnPtySettings.args',
			'null',
		)
		expect(actual).toEqual(['foo', 'bar'])
	})

	it('validateJsonConfigSetting() non-empty string config value null default value', () => {
		spyOn(atom.config, 'get').and.returnValue('["baz"]')
		const actual = AtomXtermProfilesSingleton.instance.validateJsonConfigSetting(
			'atom-xterm.spawnPtySettings.args',
			'null',
		)
		expect(actual).toEqual(['baz'])
	})

	it('validateJsonConfigSetting() bad JSON string config value null default value', () => {
		spyOn(atom.config, 'get').and.returnValue('[]]')
		AtomXtermProfilesSingleton.instance.previousBaseProfile.args = ['foo', 'bar']
		const actual = AtomXtermProfilesSingleton.instance.validateJsonConfigSetting(
			'atom-xterm.spawnPtySettings.args',
			'null',
		)
		expect(actual).toEqual(['foo', 'bar'])
	})
})
