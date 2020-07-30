/** @babel */
/*
 * Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Copyright 2017-2018 Andres Mejia <amejia004@gmail.com>. All Rights Reserved.
 * Copyright (c) 2020 UziTech All Rights Reserved.
 * Copyright (c) 2020 bus-stop All Rights Reserved.
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

import { configDefaults } from '../src/config'
import { XTerminalProfilesSingleton } from '../src/profiles'

import path from 'path'

import temp from 'temp'
import { URL } from 'whatwg-url'

temp.track()

describe('XTerminalProfilesSingleton', () => {
	const getDefaultExpectedProfile = () => {
		return {
			command: 'somecommand',
			args: [],
			name: 'sometermtype',
			cwd: '/some/path',
			projectCwd: true,
			env: null,
			setEnv: {},
			deleteEnv: ['NODE_ENV'],
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
			copyOnSelect: false,
			webgl: true,
			webLinks: false,
		}
	}

	const getDefaultExpectedUrl = () => {
		const url = new URL('x-terminal://somesessionid')
		const defaultProfile = getDefaultExpectedProfile()
		url.searchParams.set('command', defaultProfile.command)
		url.searchParams.set('args', JSON.stringify(defaultProfile.args))
		url.searchParams.set('name', defaultProfile.name)
		url.searchParams.set('cwd', defaultProfile.cwd)
		url.searchParams.set('projectCwd', defaultProfile.projectCwd)
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
		url.searchParams.set('copyOnSelect', JSON.stringify(defaultProfile.copyOnSelect))
		url.searchParams.set('webgl', defaultProfile.webgl)
		url.searchParams.set('webLinks', defaultProfile.webLinks)
		return url
	}

	const fakeAtomConfigGet = (key) => {
		if (key === 'x-terminal.spawnPtySettings.command') {
			return 'somecommand'
		}
		if (key === 'x-terminal.spawnPtySettings.args') {
			return JSON.stringify(['foo', 'bar'])
		}
		if (key === 'x-terminal.spawnPtySettings.name') {
			return 'sometermtype'
		}
		if (key === 'x-terminal.spawnPtySettings.cwd') {
			return '/some/path'
		}
		if (key === 'x-terminal.spawnPtySettings.projectCwd') {
			return true
		}
		if (key === 'x-terminal.spawnPtySettings.env') {
			return JSON.stringify({ PATH: '/usr/bin:/bin' })
		}
		if (key === 'x-terminal.spawnPtySettings.setEnv') {
			return JSON.stringify({ FOO: 'BAR' })
		}
		if (key === 'x-terminal.spawnPtySettings.deleteEnv') {
			return JSON.stringify(['FOO'])
		}
		if (key === 'x-terminal.spawnPtySettings.encoding') {
			return 'someencoding'
		}
		if (key === 'x-terminal.terminalSettings.fontSize') {
			return 20
		}
		if (key === 'x-terminal.terminalSettings.fontFamily') {
			return 'test'
		}
		if (key === 'x-terminal.terminalSettings.colors.theme') {
			return 'Homebrew'
		}
		if (key === 'x-terminal.terminalSettings.colors.foreground') {
			return '#123456'
		}
		if (key === 'x-terminal.terminalSettings.colors.background') {
			return '#123457'
		}
		if (key === 'x-terminal.terminalSettings.colors.cursor') {
			return '#123458'
		}
		if (key === 'x-terminal.terminalSettings.colors.cursorAccent') {
			return '#123459'
		}
		if (key === 'x-terminal.terminalSettings.colors.selection') {
			return '#123460'
		}
		if (key === 'x-terminal.terminalSettings.colors.black') {
			return '#123461'
		}
		if (key === 'x-terminal.terminalSettings.colors.red') {
			return '#123462'
		}
		if (key === 'x-terminal.terminalSettings.colors.green') {
			return '#123463'
		}
		if (key === 'x-terminal.terminalSettings.colors.yellow') {
			return '#123464'
		}
		if (key === 'x-terminal.terminalSettings.colors.blue') {
			return '#123465'
		}
		if (key === 'x-terminal.terminalSettings.colors.magenta') {
			return '#123466'
		}
		if (key === 'x-terminal.terminalSettings.colors.cyan') {
			return '#123467'
		}
		if (key === 'x-terminal.terminalSettings.colors.white') {
			return '#123468'
		}
		if (key === 'x-terminal.terminalSettings.colors.brightBlack') {
			return '#123469'
		}
		if (key === 'x-terminal.terminalSettings.colors.brightRed') {
			return '#123470'
		}
		if (key === 'x-terminal.terminalSettings.colors.brightGreen') {
			return '#123471'
		}
		if (key === 'x-terminal.terminalSettings.colors.brightYellow') {
			return '#123472'
		}
		if (key === 'x-terminal.terminalSettings.colors.brightBlue') {
			return '#123473'
		}
		if (key === 'x-terminal.terminalSettings.colors.brightMagenta') {
			return '#123474'
		}
		if (key === 'x-terminal.terminalSettings.colors.brightCyan') {
			return '#123475'
		}
		if (key === 'x-terminal.terminalSettings.colors.brightWhite') {
			return '#123476'
		}
		if (key === 'x-terminal.terminalSettings.leaveOpenAfterExit') {
			return false
		}
		if (key === 'x-terminal.terminalSettings.relaunchTerminalOnStartup') {
			return false
		}
		if (key === 'x-terminal.terminalSettings.title') {
			return 'foo'
		}
		if (key === 'x-terminal.terminalSettings.xtermOptions') {
			return JSON.stringify({
				cursorBlink: true,
			})
		}
		if (key === 'x-terminal.terminalSettings.promptToStartup') {
			return true
		}
		if (key === 'x-terminal.terminalSettings.copyOnSelect') {
			return true
		}
		if (key === 'x-terminal.xtermAddons.webgl') {
			return true
		}
		if (key === 'x-terminal.xtermAddons.webLinks') {
			return false
		}
		throw new Error('Unknown key: ' + key)
	}

	beforeEach(async () => {
		this.origAtomConfigGet = atom.config.get
		this.disposables = new CompositeDisposable()
		this.origProfilesConfigPath = XTerminalProfilesSingleton.instance.profilesConfigPath
		XTerminalProfilesSingleton.instance.resetBaseProfile()
		await XTerminalProfilesSingleton.instance.profilesLoadPromise
		const _path = await temp.mkdir()
		XTerminalProfilesSingleton.instance.profilesConfigPath = path.join(_path, 'profiles.json')
		XTerminalProfilesSingleton.instance.reloadProfiles()
		await XTerminalProfilesSingleton.instance.profilesLoadPromise
	})

	afterEach(async () => {
		atom.config.get = this.origAtomConfigGet
		await temp.cleanup()
		XTerminalProfilesSingleton.instance.profilesConfigPath = this.origProfilesConfigPath
		this.disposables.dispose()
	})

	it('XTerminalProfilesSingleton cannot be instantiated directly', () => {
		const cb = () => {
			return new XTerminalProfilesSingleton()
		}
		expect(cb).toThrowError('XTerminalProfilesSingleton cannot be instantiated directly.')
	})

	it('instance property works', () => {
		expect(XTerminalProfilesSingleton.instance).toBeDefined()
	})

	it('has proper profiles.json path', () => {
		const expected = path.join(configDefaults.userDataPath, 'profiles.json')
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
		expect(XTerminalProfilesSingleton.instance.sortProfiles(data)).toEqual(expected)
	})

	it('reloadProfiles()', (done) => {
		this.disposables.add(XTerminalProfilesSingleton.instance.onDidReloadProfiles((profiles) => {
			done()
		}))
		XTerminalProfilesSingleton.instance.reloadProfiles()
	})

	it('onDidReloadProfiles()', () => {
		// Should just work.
		this.disposables.add(XTerminalProfilesSingleton.instance.onDidReloadProfiles((profiles) => {}))
	})

	it('onDidResetBaseProfile()', () => {
		// Should just work.
		this.disposables.add(XTerminalProfilesSingleton.instance.onDidResetBaseProfile((baseProfile) => {}))
	})

	it('updateProfiles()', async () => {
		const expected = {
			foo: 'bar',
		}
		await XTerminalProfilesSingleton.instance.updateProfiles(expected)
		expect(XTerminalProfilesSingleton.instance.profiles).toEqual(expected)
	})

	it('deepClone()', () => {
		const data = {
			z: 'z',
			y: 'y',
			x: 'x',
		}
		expect(XTerminalProfilesSingleton.instance.deepClone(data)).toEqual(data)
		expect(XTerminalProfilesSingleton.instance.deepClone(data)).not.toBe(data)
	})

	it('getBaseProfile()', () => {
		const env = atom.config.get('x-terminal.spawnPtySettings.env') || configDefaults.env
		const encoding = atom.config.get('x-terminal.spawnPtySettings.encoding') || configDefaults.encoding
		const title = atom.config.get('x-terminal.terminalSettings.title') || configDefaults.title
		const expected = {
			command: atom.config.get('x-terminal.spawnPtySettings.command') || configDefaults.command,
			args: JSON.parse(atom.config.get('x-terminal.spawnPtySettings.args') || configDefaults.args),
			name: atom.config.get('x-terminal.spawnPtySettings.name') || configDefaults.termType,
			cwd: atom.config.get('x-terminal.spawnPtySettings.cwd') || configDefaults.cwd,
			projectCwd: atom.config.get('x-terminal.spawnPtySettings.projectCwd') || configDefaults.projectCwd,
			env: JSON.parse(env || 'null'),
			setEnv: JSON.parse(atom.config.get('x-terminal.spawnPtySettings.setEnv') || configDefaults.setEnv),
			deleteEnv: JSON.parse(atom.config.get('x-terminal.spawnPtySettings.deleteEnv') || configDefaults.deleteEnv),
			encoding: encoding || null,
			fontSize: atom.config.get('x-terminal.terminalSettings.fontSize') || configDefaults.fontSize,
			fontFamily: atom.config.get('x-terminal.terminalSettings.fontFamily') || configDefaults.fontFamily,
			theme: atom.config.get('x-terminal.terminalSettings.colors.theme') || configDefaults.theme,
			colorForeground: atom.config.get('x-terminal.terminalSettings.colors.foreground') || configDefaults.colorForeground,
			colorBackground: atom.config.get('x-terminal.terminalSettings.colors.background') || configDefaults.colorBackground,
			colorCursor: atom.config.get('x-terminal.terminalSettings.colors.cursor') || configDefaults.colorCursor,
			colorCursorAccent: atom.config.get('x-terminal.terminalSettings.colors.cursorAccent') || configDefaults.colorCursorAccent,
			colorSelection: atom.config.get('x-terminal.terminalSettings.colors.selection') || configDefaults.colorSelection,
			colorBlack: atom.config.get('x-terminal.terminalSettings.colors.black') || configDefaults.colorBlack,
			colorRed: atom.config.get('x-terminal.terminalSettings.colors.red') || configDefaults.colorRed,
			colorGreen: atom.config.get('x-terminal.terminalSettings.colors.green') || configDefaults.colorGreen,
			colorYellow: atom.config.get('x-terminal.terminalSettings.colors.yellow') || configDefaults.colorYellow,
			colorBlue: atom.config.get('x-terminal.terminalSettings.colors.blue') || configDefaults.colorBlue,
			colorMagenta: atom.config.get('x-terminal.terminalSettings.colors.magenta') || configDefaults.colorMagenta,
			colorCyan: atom.config.get('x-terminal.terminalSettings.colors.cyan') || configDefaults.colorCyan,
			colorWhite: atom.config.get('x-terminal.terminalSettings.colors.white') || configDefaults.colorWhite,
			colorBrightBlack: atom.config.get('x-terminal.terminalSettings.colors.brightBlack') || configDefaults.colorBrightBlack,
			colorBrightRed: atom.config.get('x-terminal.terminalSettings.colors.brightRed') || configDefaults.colorBrightRed,
			colorBrightGreen: atom.config.get('x-terminal.terminalSettings.colors.brightGreen') || configDefaults.colorBrightGreen,
			colorBrightYellow: atom.config.get('x-terminal.terminalSettings.colors.brightYellow') || configDefaults.colorBrightYellow,
			colorBrightBlue: atom.config.get('x-terminal.terminalSettings.colors.brightBlue') || configDefaults.colorBrightBlue,
			colorBrightMagenta: atom.config.get('x-terminal.terminalSettings.colors.brightMagenta') || configDefaults.colorBrightMagenta,
			colorBrightCyan: atom.config.get('x-terminal.terminalSettings.colors.brightCyan') || configDefaults.colorBrightCyan,
			colorBrightWhite: atom.config.get('x-terminal.terminalSettings.colors.brightWhite') || configDefaults.colorBrightWhite,
			leaveOpenAfterExit: atom.config.get('x-terminal.terminalSettings.leaveOpenAfterExit') || configDefaults.leaveOpenAfterExit,
			relaunchTerminalOnStartup: atom.config.get('x-terminal.terminalSettings.relaunchTerminalOnStartup') || configDefaults.relaunchTerminalOnStartup,
			title: title || null,
			xtermOptions: JSON.parse(atom.config.get('x-terminal.terminalSettings.xtermOptions') || configDefaults.xtermOptions),
			promptToStartup: atom.config.get('x-terminal.terminalSettings.promptToStartup') || configDefaults.promptToStartup,
			copyOnSelect: atom.config.get('x-terminal.terminalSettings.copyOnSelect') || configDefaults.copyOnSelect,
			webgl: atom.config.get('x-terminal.xtermAddons.webgl') || configDefaults.webgl,
			webLinks: atom.config.get('x-terminal.xtermAddons.webLinks') || configDefaults.webLinks,
		}
		expect(XTerminalProfilesSingleton.instance.getBaseProfile()).toEqual(expected)
	})

	it('getBaseProfile() settings from atom.config', () => {
		spyOn(atom.config, 'get').and.callFake(fakeAtomConfigGet)
		XTerminalProfilesSingleton.instance.resetBaseProfile()
		const expected = {
			command: 'somecommand',
			args: ['foo', 'bar'],
			name: 'sometermtype',
			cwd: '/some/path',
			projectCwd: true,
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
			copyOnSelect: true,
			webgl: true,
			webLinks: false,
		}
		expect(XTerminalProfilesSingleton.instance.getBaseProfile()).toEqual(expected)
	})

	it('resetBaseProfile()', () => {
		XTerminalProfilesSingleton.instance.baseProfile.env = 'asdfasdfafd'
		XTerminalProfilesSingleton.instance.resetBaseProfile()
		expect(XTerminalProfilesSingleton.instance.baseProfile.env).toBeNull()
	})

	it('sanitizeData() empty data', () => {
		expect(XTerminalProfilesSingleton.instance.sanitizeData({})).toEqual({})
	})

	it('sanitizeData() unknown key set', () => {
		const data = {
			foo: 'bar',
		}
		expect(XTerminalProfilesSingleton.instance.sanitizeData(data)).toEqual({})
	})

	it('sanitizeData() check all valid keys', () => {
		const data = getDefaultExpectedProfile()
		expect(XTerminalProfilesSingleton.instance.sanitizeData(data)).toEqual(data)
	})

	it('sanitizeData() valid and unknown keys set', () => {
		const expected = getDefaultExpectedProfile()
		const data = {
			...expected,
			foo: 'bar',
			baz: null,
		}
		expect(XTerminalProfilesSingleton.instance.sanitizeData(data)).toEqual(expected)
	})

	it('getProfiles() no profiles defined', async () => {
		const profiles = await XTerminalProfilesSingleton.instance.getProfiles()
		expect(profiles).toEqual({})
	})

	it('getProfile() no profiles defined', async () => {
		const profile = await XTerminalProfilesSingleton.instance.getProfile('foo')
		expect(profile).toEqual(XTerminalProfilesSingleton.instance.getBaseProfile())
	})

	it('isProfileExists() non-existent profile', async () => {
		const exists = await XTerminalProfilesSingleton.instance.isProfileExists('foo')
		expect(exists).toBe(false)
	})

	it('isProfileExists() existent profile', async () => {
		const data = {
			command: './manage.py',
			args: ['runserver', '9000'],
		}
		const profileName = 'Django module runserver'
		await XTerminalProfilesSingleton.instance.setProfile(profileName, data)
		const exists = await XTerminalProfilesSingleton.instance.isProfileExists(profileName)
		expect(exists).toBe(true)
	})

	it('setProfile()', async () => {
		const data = {
			command: './manage.py',
			args: ['runserver', '9000'],
		}
		const expected = {
			...XTerminalProfilesSingleton.instance.getBaseProfile(),
			...data,
		}
		const profileName = 'Django module runserver'
		await XTerminalProfilesSingleton.instance.setProfile(profileName, data)
		const profile = await XTerminalProfilesSingleton.instance.getProfile(profileName)
		expect(profile).toEqual(expected)
	})

	it('deleteProfile()', async () => {
		const data = {
			command: './manage.py',
			args: ['runserver', '9000'],
		}
		const profileName = 'Django module runserver'
		await XTerminalProfilesSingleton.instance.setProfile(profileName, data)
		await XTerminalProfilesSingleton.instance.deleteProfile(profileName)
		const exists = await XTerminalProfilesSingleton.instance.isProfileExists(profileName)
		expect(exists).toBe(false)
	})

	it('generateNewUri() starts with x-terminal://', () => {
		spyOn(XTerminalProfilesSingleton.instance, 'generateNewUri').and.callThrough()
		expect(XTerminalProfilesSingleton.instance.generateNewUri().startsWith('x-terminal://')).toBe(true)
	})

	it('generateNewUri() ends with /', () => {
		spyOn(XTerminalProfilesSingleton.instance, 'generateNewUri').and.callThrough()
		expect(XTerminalProfilesSingleton.instance.generateNewUri().endsWith('/')).toBe(true)
	})

	it('generateNewUrlFromProfileData() empty data', () => {
		const url = XTerminalProfilesSingleton.instance.generateNewUrlFromProfileData({})
		expect(url.searchParams.toString()).toBe('')
	})

	it('generateNewUrlFromProfileData() unknown key set', () => {
		const data = {
			foo: 'bar',
		}
		const url = XTerminalProfilesSingleton.instance.generateNewUrlFromProfileData(data)
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
			copyOnSelect: false,
		}
		const expected = 'args=%5B%5D&command=somecommand&copyOnSelect=false&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&promptToStartup=false&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title='
		const url = XTerminalProfilesSingleton.instance.generateNewUrlFromProfileData(data)
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
			copyOnSelect: false,
		}
		const data = {
			...validData,
			foo: 'bar',
			baz: null,
		}
		const expected = 'args=%5B%5D&command=somecommand&copyOnSelect=false&cwd=%2Fsome%2Fpath&deleteEnv=%5B%5D&encoding=&env=null&fontSize=14&leaveOpenAfterExit=true&name=sometermtype&promptToStartup=false&relaunchTerminalOnStartup=true&setEnv=%7B%7D&title=&xtermOptions=%7B%22cursorBlink%22%3Atrue%7D'
		const url = XTerminalProfilesSingleton.instance.generateNewUrlFromProfileData(data)
		url.searchParams.sort()
		expect(url.searchParams.toString()).toEqual(expected)
	})

	it('createProfileDataFromUri() base URI', () => {
		const url = new URL('x-terminal://somesessionid/')
		const expected = {
			command: configDefaults.command,
			args: JSON.parse(configDefaults.args),
			name: configDefaults.termType,
			cwd: configDefaults.cwd,
			projectCwd: configDefaults.projectCwd,
			env: null,
			setEnv: JSON.parse(configDefaults.setEnv),
			deleteEnv: JSON.parse(configDefaults.deleteEnv),
			encoding: null,
			fontSize: configDefaults.fontSize,
			fontFamily: configDefaults.fontFamily,
			theme: configDefaults.theme,
			colorForeground: configDefaults.colorForeground,
			colorBackground: configDefaults.colorBackground,
			colorCursor: configDefaults.colorCursor,
			colorCursorAccent: configDefaults.colorCursorAccent,
			colorSelection: configDefaults.colorSelection,
			colorBlack: configDefaults.colorBlack,
			colorRed: configDefaults.colorRed,
			colorGreen: configDefaults.colorGreen,
			colorYellow: configDefaults.colorYellow,
			colorBlue: configDefaults.colorBlue,
			colorMagenta: configDefaults.colorMagenta,
			colorCyan: configDefaults.colorCyan,
			colorWhite: configDefaults.colorWhite,
			colorBrightBlack: configDefaults.colorBrightBlack,
			colorBrightRed: configDefaults.colorBrightRed,
			colorBrightGreen: configDefaults.colorBrightGreen,
			colorBrightYellow: configDefaults.colorBrightYellow,
			colorBrightBlue: configDefaults.colorBrightBlue,
			colorBrightMagenta: configDefaults.colorBrightMagenta,
			colorBrightCyan: configDefaults.colorBrightCyan,
			colorBrightWhite: configDefaults.colorBrightWhite,
			leaveOpenAfterExit: configDefaults.leaveOpenAfterExit,
			relaunchTerminalOnStartup: configDefaults.relaunchTerminalOnStartup,
			title: null,
			xtermOptions: JSON.parse(configDefaults.xtermOptions),
			promptToStartup: configDefaults.promptToStartup,
			copyOnSelect: configDefaults.copyOnSelect,
			webgl: configDefaults.webgl,
			webLinks: configDefaults.webLinks,
		}
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI with all params set', () => {
		const url = getDefaultExpectedUrl()
		const expected = getDefaultExpectedProfile()
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI with all params set and invalid params set', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('foo', 'text')
		url.searchParams.set('bar', null)
		const expected = getDefaultExpectedProfile()
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI command set to null', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('command', null)
		const expected = getDefaultExpectedProfile()
		expected.command = 'null'
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI command set to empty string', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('command', '')
		const expected = getDefaultExpectedProfile()
		expected.command = configDefaults.command
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI args set to null', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('args', null)
		const expected = getDefaultExpectedProfile()
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI args set to empty string', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('args', '')
		const expected = getDefaultExpectedProfile()
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI name set to null', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('name', null)
		const expected = getDefaultExpectedProfile()
		expected.name = 'null'
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI name set to empty string', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('name', '')
		const expected = getDefaultExpectedProfile()
		expected.name = configDefaults.termType
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI cwd set to null', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('cwd', null)
		const expected = getDefaultExpectedProfile()
		expected.cwd = 'null'
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI cwd set to empty string', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('cwd', '')
		const expected = getDefaultExpectedProfile()
		expected.cwd = configDefaults.cwd
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI env set to null', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('env', null)
		const expected = getDefaultExpectedProfile()
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI env set to empty string', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('env', '')
		const expected = getDefaultExpectedProfile()
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI env set to empty object', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('env', '{}')
		const expected = getDefaultExpectedProfile()
		// Specifically defining an empty object for env will mean the
		// pty process will run with no environment.
		expected.env = {}
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI setEnv set to null', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('setEnv', null)
		const expected = getDefaultExpectedProfile()
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI setEnv set to empty string', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('setEnv', '')
		const expected = getDefaultExpectedProfile()
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI deleteEnv set to null', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('deleteEnv', null)
		const expected = getDefaultExpectedProfile()
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI deleteEnv set to empty string', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('deleteEnv', '')
		const expected = getDefaultExpectedProfile()
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI encoding set to null', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('encoding', null)
		const expected = getDefaultExpectedProfile()
		expected.encoding = null
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI encoding set to empty string', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('encoding', '')
		const expected = getDefaultExpectedProfile()
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI fontSize set to null', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('fontSize', null)
		const expected = getDefaultExpectedProfile()
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI fontSize set to empty string', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('fontSize', '')
		const expected = getDefaultExpectedProfile()
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI leaveOpenAfterExit set to null', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('leaveOpenAfterExit', null)
		const expected = getDefaultExpectedProfile()
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI leaveOpenAfterExit set to empty string', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('leaveOpenAfterExit', '')
		const expected = getDefaultExpectedProfile()
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI relaunchTerminalOnStartup set to null', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('relaunchTerminalOnStartup', null)
		const expected = getDefaultExpectedProfile()
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI relaunchTerminalOnStartup set to empty string', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('relaunchTerminalOnStartup', '')
		const expected = getDefaultExpectedProfile()
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI title set to null', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('title', null)
		const expected = getDefaultExpectedProfile()
		expected.title = null
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI title set to empty string', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('title', '')
		const expected = getDefaultExpectedProfile()
		expected.title = null
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI xtermOptions set to null', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('xtermOptions', null)
		const expected = getDefaultExpectedProfile()
		expected.xtermOptions = {}
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI xtermOptions set to empty string', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('xtermOptions', '')
		const expected = getDefaultExpectedProfile()
		expected.xtermOptions = {}
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI promptToStartup set to null', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('promptToStartup', null)
		const expected = getDefaultExpectedProfile()
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI promptToStartup set to empty string', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('promptToStartup', '')
		const expected = getDefaultExpectedProfile()
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI copyOnSelect set to null', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('copyOnSelect', null)
		const expected = getDefaultExpectedProfile()
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('createProfileDataFromUri() URI copyOnSelect set to empty string', () => {
		const url = getDefaultExpectedUrl()
		url.searchParams.set('copyOnSelect', '')
		const expected = getDefaultExpectedProfile()
		expect(XTerminalProfilesSingleton.instance.createProfileDataFromUri(url.href)).toEqual(expected)
	})

	it('diffProfiles() no change between objects', () => {
		const baseProfile = XTerminalProfilesSingleton.instance.getBaseProfile()
		const expected = {}
		const actual = XTerminalProfilesSingleton.instance.diffProfiles(baseProfile, baseProfile)
		expect(actual).toEqual(expected)
	})

	it('diffProfiles() removed entries', () => {
		const baseProfile = XTerminalProfilesSingleton.instance.getBaseProfile()
		const profileChanges = {}
		const expected = {}
		const actual = XTerminalProfilesSingleton.instance.diffProfiles(baseProfile, profileChanges)
		expect(actual).toEqual(expected)
	})

	it('diffProfiles() modified entries', () => {
		const baseProfile = XTerminalProfilesSingleton.instance.getBaseProfile()
		const profileChanges = {
			command: 'someothercommand',
		}
		const expected = {
			command: 'someothercommand',
		}
		const actual = XTerminalProfilesSingleton.instance.diffProfiles(baseProfile, profileChanges)
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
		const actual = XTerminalProfilesSingleton.instance.diffProfiles(oldProfile, profileChanges)
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
		const actual = XTerminalProfilesSingleton.instance.diffProfiles(oldProfile, profileChanges)
		expect(actual).toEqual(expected)
	})

	it('getDefaultProfile()', () => {
		const expected = {
			command: configDefaults.command,
			args: JSON.parse(configDefaults.args),
			name: configDefaults.termType,
			cwd: configDefaults.cwd,
			projectCwd: configDefaults.projectCwd,
			env: null,
			setEnv: JSON.parse(configDefaults.setEnv),
			deleteEnv: JSON.parse(configDefaults.deleteEnv),
			encoding: null,
			fontSize: configDefaults.fontSize,
			fontFamily: configDefaults.fontFamily,
			theme: configDefaults.theme,
			colorForeground: configDefaults.colorForeground,
			colorBackground: configDefaults.colorBackground,
			colorCursor: configDefaults.colorCursor,
			colorCursorAccent: configDefaults.colorCursorAccent,
			colorSelection: configDefaults.colorSelection,
			colorBlack: configDefaults.colorBlack,
			colorRed: configDefaults.colorRed,
			colorGreen: configDefaults.colorGreen,
			colorYellow: configDefaults.colorYellow,
			colorBlue: configDefaults.colorBlue,
			colorMagenta: configDefaults.colorMagenta,
			colorCyan: configDefaults.colorCyan,
			colorWhite: configDefaults.colorWhite,
			colorBrightBlack: configDefaults.colorBrightBlack,
			colorBrightRed: configDefaults.colorBrightRed,
			colorBrightGreen: configDefaults.colorBrightGreen,
			colorBrightYellow: configDefaults.colorBrightYellow,
			colorBrightBlue: configDefaults.colorBrightBlue,
			colorBrightMagenta: configDefaults.colorBrightMagenta,
			colorBrightCyan: configDefaults.colorBrightCyan,
			colorBrightWhite: configDefaults.colorBrightWhite,
			leaveOpenAfterExit: configDefaults.leaveOpenAfterExit,
			relaunchTerminalOnStartup: configDefaults.relaunchTerminalOnStartup,
			title: null,
			xtermOptions: JSON.parse(configDefaults.xtermOptions),
			promptToStartup: configDefaults.promptToStartup,
			copyOnSelect: configDefaults.copyOnSelect,
			webgl: configDefaults.webgl,
			webLinks: configDefaults.webLinks,
		}
		expect(XTerminalProfilesSingleton.instance.getDefaultProfile()).toEqual(expected)
	})
})
