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

import * as nodePty from 'node-pty-prebuilt-multiarch'
import { shell } from 'electron'

import { configDefaults } from '../src/config'
import { XTerminalElement } from '../src/element'
import { XTerminalModel } from '../src/model'

import path from 'path'

import temp from 'temp'
import { URL, URLSearchParams } from 'whatwg-url'

temp.track()

describe('XTerminalElement', () => {
	const savedPlatform = process.platform
	this.element = null
	this.tmpdir = null

	const createNewElement = async (uri = 'x-terminal://somesessionid/') => {
		const terminalsSet = new Set()
		const model = new XTerminalModel({
			uri: uri,
			terminals_set: terminalsSet,
		})
		await model.initializedPromise
		model.pane = jasmine.createSpyObj('pane',
			['removeItem', 'getActiveItem', 'destroyItem'])
		const element = new XTerminalElement()
		await element.initialize(model)
		await element.createTerminal()
		return element
	}

	beforeEach(async () => {
		atom.config.clear()
		atom.project.setPaths([])
		const ptyProcess = jasmine.createSpyObj('ptyProcess',
			['kill', 'write', 'resize', 'on', 'removeAllListeners'])
		ptyProcess.process = jasmine.createSpy('process')
			.and.returnValue('sometestprocess')
		spyOn(nodePty, 'spawn').and.returnValue(ptyProcess)
		spyOn(shell, 'openExternal')
		const element = await createNewElement()
		this.element = element
		this.tmpdir = await temp.mkdir()
	})

	afterEach(async () => {
		this.element.destroy()
		Object.defineProperty(process, 'platform', {
			value: savedPlatform,
		})
		await temp.cleanup()
		atom.config.clear()
	})

	it('initialize(model)', () => {
		// Simply test if the terminal has been created.
		expect(this.element.terminal).toBeTruthy()
	})

	it('initialize(model) check session-id', () => {
		expect(this.element.getAttribute('session-id')).toBe('somesessionid')
	})

	it('destroy() check ptyProcess killed', () => {
		this.element.destroy()
		expect(this.element.ptyProcess.kill).toHaveBeenCalled()
	})

	it('destroy() check terminal destroyed', () => {
		spyOn(this.element.terminal, 'dispose').and.callThrough()
		this.element.destroy()
		expect(this.element.terminal.dispose).toHaveBeenCalled()
	})

	it('destroy() check disposables disposed', () => {
		spyOn(this.element.disposables, 'dispose').and.callThrough()
		this.element.destroy()
		expect(this.element.disposables.dispose).toHaveBeenCalled()
	})

	it('getShellCommand()', () => {
		expect(this.element.getShellCommand()).toBe(configDefaults.command)
	})

	it('getShellCommand() command set in uri', async () => {
		const expected = 'somecommand'
		const params = new URLSearchParams({ command: expected })
		const url = new URL('x-terminal://?' + params.toString())
		const element = await createNewElement(url.href)
		expect(element.getShellCommand()).toBe(expected)
	})

	it('getArgs()', () => {
		expect(this.element.getArgs()).toEqual([])
	})

	it('getArgs() args set in uri', async () => {
		const expected = ['some', 'extra', 'args']
		const params = new URLSearchParams({ args: JSON.stringify(expected) })
		const url = new URL('x-terminal://?' + params.toString())
		const element = await createNewElement(url.href)
		expect(element.getArgs()).toEqual(expected)
	})

	it('getArgs() throw exception when args is not an array', () => {
		this.element.model.profile.args = {}
		expect(() => { this.element.getArgs() }).toThrow(new Error('Arguments set are not an array.'))
	})

	it('getTermType()', () => {
		expect(this.element.getTermType()).toBe(configDefaults.termType)
	})

	it('getTermType() name set in uri', async () => {
		const expected = 'sometermtype'
		const params = new URLSearchParams({ name: expected })
		const url = new URL('x-terminal://?' + params.toString())
		const element = await createNewElement(url.href)
		expect(element.getTermType()).toBe(expected)
	})

	it('checkPathIsDirectory() no path given', async () => {
		const isDirectory = await this.element.checkPathIsDirectory()
		expect(isDirectory).toBe(false)
	})

	it('checkPathIsDirectory() path set to undefined', async () => {
		const isDirectory = await this.element.checkPathIsDirectory(undefined)
		expect(isDirectory).toBe(false)
	})

	it('checkPathIsDirectory() path set to null', async () => {
		const isDirectory = await this.element.checkPathIsDirectory(null)
		expect(isDirectory).toBe(false)
	})

	it('checkPathIsDirectory() path set to tmpdir', async () => {
		const isDirectory = await this.element.checkPathIsDirectory(this.tmpdir)
		expect(isDirectory).toBe(true)
	})

	it('checkPathIsDirectory() path set to non-existent dir', async () => {
		const isDirectory = await this.element.checkPathIsDirectory(path.join(this.tmpdir, 'non-existent-dir'))
		expect(isDirectory).toBe(false)
	})

	it('getCwd()', async () => {
		const cwd = await this.element.getCwd()
		expect(cwd).toBe(configDefaults.cwd)
	})

	it('getCwd() cwd set in uri', async () => {
		const expected = this.tmpdir
		const params = new URLSearchParams({ cwd: expected })
		const url = new URL('x-terminal://?' + params.toString())
		const element = await createNewElement(url.href)
		const cwd = await element.getCwd()
		expect(cwd).toBe(expected)
	})

	it('getCwd() ignore cwd in uri if projectCwd is set', async () => {
		const expected = await temp.mkdir('projectCwd')
		spyOn(atom.project, 'getPaths').and.returnValue([expected])
		const params = new URLSearchParams({ projectCwd: true, cwd: this.tmpdir })
		const url = new URL('x-terminal://?' + params.toString())
		const element = await createNewElement(url.href)
		const cwd = await element.getCwd()
		expect(cwd).toBe(expected)
	})

	it('getCwd() model getPath() returns valid path', async () => {
		const previousActiveItem = jasmine.createSpyObj(
			'previousActiveItem',
			['getPath'],
		)
		previousActiveItem.getPath.and.returnValue(this.tmpdir)
		spyOn(atom.workspace, 'getActivePaneItem').and.returnValue(
			previousActiveItem,
		)
		const element = await createNewElement()
		const cwd = await element.getCwd()
		expect(cwd).toBe(this.tmpdir)
	})

	it('getCwd() model getPath() returns invalid path', async () => {
		const previousActiveItem = jasmine.createSpyObj(
			'previousActiveItem',
			['getPath'],
		)
		previousActiveItem.getPath.and.returnValue(path.join(this.tmpdir, 'non-existent-dir'))
		spyOn(atom.workspace, 'getActivePaneItem').and.returnValue(
			previousActiveItem,
		)
		const element = await createNewElement()
		const cwd = await element.getCwd()
		expect(cwd).toBe(configDefaults.cwd)
	})

	it('getCwd() non-existent cwd set in uri', async () => {
		const dir = path.join(this.tmpdir, 'non-existent-dir')
		const params = new URLSearchParams({ cwd: dir })
		const url = new URL('x-terminal://?' + params.toString())
		await createNewElement(url.href)
		const cwd = await this.element.getCwd()
		expect(cwd).toBe(configDefaults.cwd)
	})

	it('getCwd() non-existent project path added', async () => {
		spyOn(atom.project, 'getPaths').and.returnValue([path.join(this.tmpdir, 'non-existent-dir')])
		const element = await createNewElement()
		const cwd = await element.getCwd()
		expect(cwd).toBe(configDefaults.cwd)
	})

	it('getEnv()', () => {
		const NODE_ENV = process.env.NODE_ENV
		try {
			delete process.env.NODE_ENV
			expect(JSON.stringify(this.element.getEnv())).toEqual(JSON.stringify(process.env))
		} finally {
			process.env.NODE_ENV = NODE_ENV
		}
	})

	it('getEnv() env set in uri', async () => {
		const expected = { var1: 'value1', var2: 'value2' }
		const params = new URLSearchParams({ env: JSON.stringify(expected) })
		const url = new URL('x-terminal://?' + params.toString())
		const element = await createNewElement(url.href)
		expect(element.getEnv()).toEqual(expected)
	})

	it('getEnv() throw exception when env is not an object', () => {
		this.element.model.profile.env = []
		expect(() => { this.element.getEnv() }).toThrow(new Error('Environment set is not an object.'))
	})

	it('getEnv() setEnv set in uri', async () => {
		const expected = { var2: 'value2' }
		const params = new URLSearchParams({ env: JSON.stringify({ var1: 'value1' }), setEnv: JSON.stringify(expected) })
		const url = new URL('x-terminal://?' + params.toString())
		const element = await createNewElement(url.href)
		expect(element.getEnv().var2).toEqual(expected.var2)
	})

	it('getEnv() deleteEnv set in config', () => {
		atom.config.set('x-terminal.spawnPtySettings.env', JSON.stringify({ var1: 'value1' }))
		atom.config.set('x-terminal.spawnPtySettings.deleteEnv', JSON.stringify(['var1']))
		expect(this.element.getEnv().var1).toBe(undefined)
	})

	it('getEnv() deleteEnv set in uri', async () => {
		const params = new URLSearchParams({ env: JSON.stringify({ var1: 'value1' }), deleteEnv: JSON.stringify(['var1']) })
		const url = new URL('x-terminal://?' + params.toString())
		await createNewElement(url.href)
		expect(this.element.getEnv().var1).toBe(undefined)
	})

	it('getEnv() deleteEnv has precendence over senEnv', () => {
		atom.config.set('x-terminal.spawnPtySettings.env', JSON.stringify({ var1: 'value1' }))
		atom.config.set('x-terminal.spawnPtySettings.setEnv', JSON.stringify({ var2: 'value2' }))
		atom.config.set('x-terminal.spawnPtySettings.deleteEnv', JSON.stringify(['var2']))
		expect(this.element.getEnv().var2).toBe(undefined)
	})

	it('getEncoding()', () => {
		expect(this.element.getEncoding()).toBeNull()
	})

	it('getEncoding() encoding set in uri', async () => {
		const expected = 'someencoding'
		const params = new URLSearchParams({ encoding: expected })
		const url = new URL('x-terminal://?' + params.toString())
		const element = await createNewElement(url.href)
		expect(element.getEncoding()).toBe(expected)
	})

	it('leaveOpenAfterExit()', () => {
		expect(this.element.leaveOpenAfterExit()).toBe(true)
	})

	it('leaveOpenAfterExit() true set in uri', async () => {
		const expected = true
		const params = new URLSearchParams({ leaveOpenAfterExit: expected })
		const url = new URL('x-terminal://?' + params.toString())
		const element = await createNewElement(url.href)
		expect(element.leaveOpenAfterExit()).toBe(expected)
	})

	it('leaveOpenAfterExit() false set in uri', async () => {
		const expected = false
		const params = new URLSearchParams({ leaveOpenAfterExit: expected })
		const url = new URL('x-terminal://?' + params.toString())
		const element = await createNewElement(url.href)
		expect(element.leaveOpenAfterExit()).toBe(expected)
	})

	it('isPromptToStartup()', () => {
		expect(this.element.isPromptToStartup()).toBe(false)
	})

	it('isPromptToStartup() false set in uri', async () => {
		const expected = false
		const params = new URLSearchParams({ promptToStartup: expected })
		const url = new URL('x-terminal://?' + params.toString())
		const element = await createNewElement(url.href)
		expect(element.isPromptToStartup()).toBe(expected)
	})

	it('isPromptToStartup() true set in uri', async () => {
		const expected = true
		const params = new URLSearchParams({ promptToStartup: expected })
		const url = new URL('x-terminal://?' + params.toString())
		const element = await createNewElement(url.href)
		expect(element.isPromptToStartup()).toBe(expected)
	})

	it('isPtyProcessRunning() ptyProcess null, ptyProcessRunning false', () => {
		this.element.ptyProcess = null
		this.element.ptyProcessRunning = false
		expect(this.element.isPtyProcessRunning()).toBeFalsy()
	})

	it('isPtyProcessRunning() ptyProcess not null, ptyProcessRunning false', () => {
		this.element.ptyProcess = jasmine.createSpyObj('ptyProcess', ['kill'])
		this.element.ptyProcessRunning = false
		expect(this.element.isPtyProcessRunning()).toBeFalsy()
	})

	it('isPtyProcessRunning() ptyProcess not null, ptyProcessRunning true', () => {
		this.element.ptyProcess = jasmine.createSpyObj('ptyProcess', ['kill'])
		this.element.ptyProcessRunning = true
		expect(this.element.isPtyProcessRunning()).toBeTruthy()
	})

	describe('getTheme()', () => {
		it('Custom', () => {
			const theme = this.element.getTheme({ theme: 'Custom' })
			expect(theme).toEqual({
				background: '#000000',
				foreground: '#ffffff',
				selection: '#4d4d4d',
				cursor: '#ffffff',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Custom webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Custom' })
				expect(webgltheme.selection).toBe('#4d4d4d')
			})
		}

		it('Atom Dark', () => {
			const theme = this.element.getTheme({ theme: 'Atom Dark' })
			expect(theme).toEqual({
				background: '#1d1f21',
				foreground: '#c5c8c6',
				selection: '#999999',
				cursor: '#ffffff',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Atom Dark webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Atom Dark' })
				expect(webgltheme.selection).toBe('#999999')
			})
		}

		it('Atom Light', () => {
			const theme = this.element.getTheme({ theme: 'Atom Light' })
			expect(theme).toEqual({
				background: '#ffffff',
				foreground: '#555555',
				selection: '#afc4da',
				cursor: '#000000',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Atom Light webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Atom Light' })
				expect(webgltheme.selection).toBe('#afc4da')
			})
		}

		it('Base16 Tomorrow Dark', () => {
			const theme = this.element.getTheme({ theme: 'Base16 Tomorrow Dark' })
			expect(theme).toEqual({
				background: '#1d1f21',
				foreground: '#c5c8c6',
				selection: '#b4b7b4',
				// selectionForeground: '#e0e0e0',
				cursor: '#ffffff',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Base16 Tomorrow Dark webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Base16 Tomorrow Dark' })
				expect(webgltheme.selection).toBe('#b4b7b4')
			})
		}

		it('Base16 Tomorrow Light', () => {
			const theme = this.element.getTheme({ theme: 'Base16 Tomorrow Light' })
			expect(theme).toEqual({
				background: '#ffffff',
				foreground: '#1d1f21',
				selection: '#282a2e',
				// selectionForeground: '#e0e0e0',
				cursor: '#1d1f21',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Base16 Tomorrow Light webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Base16 Tomorrow Light' })
				expect(webgltheme.selection).toBe('#282a2e')
			})
		}

		it('Christmas', () => {
			const theme = this.element.getTheme({ theme: 'Christmas' })
			expect(theme).toEqual({
				background: '#0c0047',
				foreground: '#f81705',
				selection: '#298f16',
				cursor: '#009f59',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Christmas webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Christmas' })
				expect(webgltheme.selection).toBe('#298f16')
			})
		}

		it('City Lights', () => {
			const theme = this.element.getTheme({ theme: 'City Lights' })
			expect(theme).toEqual({
				background: '#181d23',
				foreground: '#666d81',
				selection: '#2a2f38',
				// selectionForeground: '#b7c5d3',
				cursor: '#528bff',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('City Lights webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'City Lights' })
				expect(webgltheme.selection).toBe('#2a2f38')
			})
		}

		it('Dracula', () => {
			const theme = this.element.getTheme({ theme: 'Dracula' })
			expect(theme).toEqual({
				background: '#1e1f29',
				foreground: 'white',
				selection: '#44475a',
				cursor: '#999999',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Dracula webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Dracula' })
				expect(webgltheme.selection).toBe('#44475a')
			})
		}

		it('Grass', () => {
			const theme = this.element.getTheme({ theme: 'Grass' })
			expect(theme).toEqual({
				background: 'rgb(19, 119, 61)',
				foreground: 'rgb(255, 240, 165)',
				selection: 'rgba(182, 73, 38, .99)',
				cursor: 'rgb(142, 40, 0)',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Grass webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Grass' })
				expect(webgltheme.selection).toBe('rgba(182, 73, 38, .99)')
			})
		}

		it('Homebrew', () => {
			const theme = this.element.getTheme({ theme: 'Homebrew' })
			expect(theme).toEqual({
				background: '#000000',
				foreground: 'rgb(41, 254, 20)',
				selection: 'rgba(7, 30, 155, .99)',
				cursor: 'rgb(55, 254, 38)',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Homebrew webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Homebrew' })
				expect(webgltheme.selection).toBe('rgba(7, 30, 155, .99)')
			})
		}

		it('Inverse', () => {
			const theme = this.element.getTheme({ theme: 'Inverse' })
			expect(theme).toEqual({
				background: '#ffffff',
				foreground: '#000000',
				selection: 'rgba(178, 215, 255, .99)',
				cursor: 'rgb(146, 146, 146)',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Inverse webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Inverse' })
				expect(webgltheme.selection).toBe('rgba(178, 215, 255, .99)')
			})
		}

		it('Linux', () => {
			const theme = this.element.getTheme({ theme: 'Linux' })
			expect(theme).toEqual({
				background: '#000000',
				foreground: 'rgb(230, 230, 230)',
				selection: 'rgba(155, 30, 7, .99)',
				cursor: 'rgb(200, 20, 25)',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Linux webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Linux' })
				expect(webgltheme.selection).toBe('rgba(155, 30, 7, .99)')
			})
		}

		it('Man Page', () => {
			const theme = this.element.getTheme({ theme: 'Man Page' })
			expect(theme).toEqual({
				background: 'rgb(254, 244, 156)',
				foreground: 'black',
				selection: 'rgba(178, 215, 255, .99)',
				cursor: 'rgb(146, 146, 146)',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Man Page webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Man Page' })
				expect(webgltheme.selection).toBe('rgba(178, 215, 255, .99)')
			})
		}

		it('Novel', () => {
			const theme = this.element.getTheme({ theme: 'Novel' })
			expect(theme).toEqual({
				background: 'rgb(223, 219, 196)',
				foreground: 'rgb(77, 47, 46)',
				selection: 'rgba(155, 153, 122, .99)',
				cursor: 'rgb(115, 99, 89)',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Novel webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Novel' })
				expect(webgltheme.selection).toBe('rgba(155, 153, 122, .99)')
			})
		}

		it('Ocean', () => {
			const theme = this.element.getTheme({ theme: 'Ocean' })
			expect(theme).toEqual({
				background: 'rgb(44, 102, 201)',
				foreground: 'white',
				selection: 'rgba(41, 134, 255, .99)',
				cursor: 'rgb(146, 146, 146)',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Ocean webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Ocean' })
				expect(webgltheme.selection).toBe('rgba(41, 134, 255, .99)')
			})
		}

		it('One Dark', () => {
			const theme = this.element.getTheme({ theme: 'One Dark' })
			expect(theme).toEqual({
				background: '#282c34',
				foreground: '#abb2bf',
				selection: '#9196a1',
				cursor: '#528bff',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('One Dark webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'One Dark' })
				expect(webgltheme.selection).toBe('#9196a1')
			})
		}

		it('One Light', () => {
			const theme = this.element.getTheme({ theme: 'One Light' })
			expect(theme).toEqual({
				background: 'hsl(230, 1%, 98%)',
				foreground: 'hsl(230, 8%, 24%)',
				selection: 'hsl(230, 1%, 90%)',
				cursor: 'hsl(230, 100%, 66%)',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('One Light webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'One Light' })
				expect(webgltheme.selection).toBe('hsl(230, 1%, 90%)')
			})
		}

		it('Predawn', () => {
			const theme = this.element.getTheme({ theme: 'Predawn' })
			expect(theme).toEqual({
				background: '#282828',
				foreground: '#f1f1f1',
				selection: 'rgba(255,255,255,0.25)',
				cursor: '#f18260',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Predawn webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Predawn' })
				expect(webgltheme.selection).toBe('rgba(255,255,255,0.25)')
			})
		}

		it('Pro', () => {
			const theme = this.element.getTheme({ theme: 'Pro' })
			expect(theme).toEqual({
				background: '#000000',
				foreground: 'rgb(244, 244, 244)',
				selection: 'rgba(82, 82, 82, .99)',
				cursor: 'rgb(96, 96, 96)',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Pro webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Pro' })
				expect(webgltheme.selection).toBe('rgba(82, 82, 82, .99)')
			})
		}

		it('Red Sands', () => {
			const theme = this.element.getTheme({ theme: 'Red Sands' })
			expect(theme).toEqual({
				background: 'rgb(143, 53, 39)',
				foreground: 'rgb(215, 201, 167)',
				selection: 'rgba(60, 25, 22, .99)',
				cursor: 'white',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Red Sands webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Red Sands' })
				expect(webgltheme.selection).toBe('rgba(60, 25, 22, .99)')
			})
		}

		it('Red', () => {
			const theme = this.element.getTheme({ theme: 'Red' })
			expect(theme).toEqual({
				background: '#000000',
				foreground: 'rgb(255, 38, 14)',
				selection: 'rgba(7, 30, 155, .99)',
				cursor: 'rgb(255, 38, 14)',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Red webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Red' })
				expect(webgltheme.selection).toBe('rgba(7, 30, 155, .99)')
			})
		}

		it('Silver Aerogel', () => {
			const theme = this.element.getTheme({ theme: 'Silver Aerogel' })
			expect(theme).toEqual({
				background: 'rgb(146, 146, 146)',
				foreground: '#000000',
				selection: 'rgba(120, 123, 156, .99)',
				cursor: 'rgb(224, 224, 224)',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Silver Aerogel webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Silver Aerogel' })
				expect(webgltheme.selection).toBe('rgba(120, 123, 156, .99)')
			})
		}

		it('Solarized Dark', () => {
			const theme = this.element.getTheme({ theme: 'Solarized Dark' })
			expect(theme).toEqual({
				background: '#042029',
				foreground: '#708284',
				selection: '#839496',
				cursor: '#819090',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Solarized Dark webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Solarized Dark' })
				expect(webgltheme.selection).toBe('#839496')
			})
		}

		it('Solarized Light', () => {
			const theme = this.element.getTheme({ theme: 'Solarized Light' })
			expect(theme).toEqual({
				background: '#fdf6e3',
				foreground: '#657a81',
				selection: '#ece7d5',
				cursor: '#586e75',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Solarized Light webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Solarized Light' })
				expect(webgltheme.selection).toBe('#ece7d5')
			})
		}

		it('Solid Colors', () => {
			const theme = this.element.getTheme({ theme: 'Solid Colors' })
			expect(theme).toEqual({
				background: 'rgb(120, 132, 151)',
				foreground: '#000000',
				selection: 'rgba(178, 215, 255, .99)',
				cursor: '#ffffff',
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Solid Colors webgl selection', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Solid Colors' })
				expect(webgltheme.selection).toBe('rgba(178, 215, 255, .99)')
			})
		}

		it('Standard', () => {
			const theme = this.element.getTheme({ theme: 'Standard' })
			const root = getComputedStyle(document.documentElement)
			expect(theme).toEqual({
				background: root.getPropertyValue('--standard-app-background-color'),
				foreground: root.getPropertyValue('--standard-text-color'),
				selection: root.getPropertyValue('--standard-background-color-selected'),
				cursor: root.getPropertyValue('--standard-text-color-highlight'),
				cursorAccent: '#000000',
				black: '#2e3436',
				red: '#cc0000',
				green: '#4e9a06',
				yellow: '#c4a000',
				blue: '#3465a4',
				magenta: '#75507b',
				cyan: '#06989a',
				white: '#d3d7cf',
				brightBlack: '#555753',
				brightRed: '#ef2929',
				brightGreen: '#8ae234',
				brightYellow: '#fce94f',
				brightBlue: '#729fcf',
				brightMagenta: '#ad7fa8',
				brightCyan: '#34e2e2',
				brightWhite: '#eeeeec',
			})
		})

		if (process.platform !== 'linux') {
			it('Standard webgl selection', async () => {
				const root = getComputedStyle(document.documentElement)
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				const element = await createNewElement(url.href)
				const webgltheme = element.getTheme({ theme: 'Standard' })
				expect(webgltheme.selection).toBe(root.getPropertyValue('--standard-background-color-selected'))
			})
		}
	})

	it('createTerminal() check terminal object', () => {
		expect(this.element.terminal).toBeTruthy()
	})

	it('createTerminal() check ptyProcess object', () => {
		expect(this.element.ptyProcess).toBeTruthy()
	})

	describe('loaded addons', () => {
		const { Terminal } = require('xterm')
		const { WebLinksAddon } = require('xterm-addon-web-links')
		const { WebglAddon } = require('xterm-addon-webgl')

		beforeEach(() => {
			spyOn(Terminal.prototype, 'loadAddon').and.callThrough()
		})

		it('createTerminal() enable web-link addon', async () => {
			const params = new URLSearchParams({ webLinks: true })
			const url = new URL('x-terminal://?' + params.toString())
			await createNewElement(url.href)
			const wasAdded = Terminal.prototype.loadAddon.calls.all().some(call => {
				return call.args[0] instanceof WebLinksAddon
			})
			expect(wasAdded).toBe(true)
		})

		it('createTerminal() disable web-link addon', async () => {
			const params = new URLSearchParams({ webLinks: false })
			const url = new URL('x-terminal://?' + params.toString())
			await createNewElement(url.href)
			const wasAdded = Terminal.prototype.loadAddon.calls.all().some(call => {
				return call.args[0] instanceof WebLinksAddon
			})
			expect(wasAdded).toBe(false)
		})

		if (process.platform !== 'linux') {
			it('createTerminal() enable webgl addon', async () => {
				const params = new URLSearchParams({ webgl: true })
				const url = new URL('x-terminal://?' + params.toString())
				await createNewElement(url.href)
				const wasAdded = Terminal.prototype.loadAddon.calls.all().some(call => {
					return call.args[0] instanceof WebglAddon
				})
				expect(wasAdded).toBe(true)
			})
		}

		it('createTerminal() disable webgl addon', async () => {
			const params = new URLSearchParams({ webgl: false })
			const url = new URL('x-terminal://?' + params.toString())
			await createNewElement(url.href)
			const wasAdded = Terminal.prototype.loadAddon.calls.all().some(call => {
				return call.args[0] instanceof WebglAddon
			})
			expect(wasAdded).toBe(false)
		})
	})

	it('restartPtyProcess() check new pty process created', async () => {
		const oldPtyProcess = this.element.ptyProcess
		const newPtyProcess = jasmine.createSpyObj('ptyProcess',
			['kill', 'write', 'resize', 'on', 'removeAllListeners'])
		newPtyProcess.process = jasmine.createSpy('process')
			.and.returnValue('sometestprocess')
		nodePty.spawn.and.returnValue(newPtyProcess)
		await this.element.restartPtyProcess()
		expect(this.element.ptyProcess).toBe(newPtyProcess)
		expect(oldPtyProcess).not.toBe(this.element.ptyProcess)
	})

	it('restartPtyProcess() check ptyProcessRunning set to true', async () => {
		const newPtyProcess = jasmine.createSpyObj('ptyProcess',
			['kill', 'write', 'resize', 'on', 'removeAllListeners'])
		newPtyProcess.process = jasmine.createSpy('process')
			.and.returnValue('sometestprocess')
		nodePty.spawn.and.returnValue(newPtyProcess)
		await this.element.restartPtyProcess()
		expect(this.element.ptyProcessRunning).toBe(true)
	})

	it('restartPtyProcess() command not found', async () => {
		spyOn(this.element, 'showNotification')
		this.element.model.profile.command = 'somecommand'
		const fakeCall = () => {
			throw Error('File not found: somecommand')
		}
		nodePty.spawn.and.callFake(fakeCall)
		await this.element.restartPtyProcess()
		expect(this.element.ptyProcess).toBe(null)
		expect(this.element.ptyProcessRunning).toBe(false)
		expect(this.element.showNotification.calls.argsFor(0)).toEqual(
			[
				"Could not find command 'somecommand'.",
				'error',
			],
		)
	})

	it('restartPtyProcess() some other error thrown', async () => {
		spyOn(this.element, 'showNotification')
		this.element.model.profile.command = 'somecommand'
		const fakeCall = () => {
			throw Error('Something went wrong')
		}
		nodePty.spawn.and.callFake(fakeCall)
		await this.element.restartPtyProcess()
		expect(this.element.ptyProcess).toBe(null)
		expect(this.element.ptyProcessRunning).toBe(false)
		expect(this.element.showNotification.calls.argsFor(0)).toEqual(
			[
				"Launching 'somecommand' raised the following error: Something went wrong",
				'error',
			],
		)
	})

	it('ptyProcess exit handler set ptyProcessRunning to false', () => {
		let exitHandler
		for (const arg of this.element.ptyProcess.on.calls.allArgs()) {
			if (arg[0] === 'exit') {
				exitHandler = arg[1]
				break
			}
		}
		spyOn(this.element.model, 'exit')
		spyOn(this.element, 'leaveOpenAfterExit').and.returnValue(false)
		exitHandler(0)
		expect(this.element.ptyProcessRunning).toBe(false)
	})

	it('ptyProcess exit handler code 0 don\'t leave open', () => {
		let exitHandler
		for (const arg of this.element.ptyProcess.on.calls.allArgs()) {
			if (arg[0] === 'exit') {
				exitHandler = arg[1]
				break
			}
		}
		spyOn(this.element.model, 'exit')
		spyOn(this.element, 'leaveOpenAfterExit').and.returnValue(false)
		exitHandler(0)
		expect(this.element.model.exit).toHaveBeenCalled()
	})

	it('ptyProcess exit handler code 1 don\'t leave open', () => {
		let exitHandler
		for (const arg of this.element.ptyProcess.on.calls.allArgs()) {
			if (arg[0] === 'exit') {
				exitHandler = arg[1]
				break
			}
		}
		spyOn(this.element.model, 'exit')
		spyOn(this.element, 'leaveOpenAfterExit').and.returnValue(false)
		exitHandler(1)
		expect(this.element.model.exit).toHaveBeenCalled()
	})

	it('ptyProcess exit handler code 0 leave open', () => {
		let exitHandler
		for (const arg of this.element.ptyProcess.on.calls.allArgs()) {
			if (arg[0] === 'exit') {
				exitHandler = arg[1]
				break
			}
		}
		spyOn(this.element.model, 'exit')
		spyOn(this.element, 'leaveOpenAfterExit').and.returnValue(true)
		exitHandler(0)
		expect(this.element.model.exit).not.toHaveBeenCalled()
	})

	it('ptyProcess exit handler code 0 leave open check top message', () => {
		let exitHandler
		for (const arg of this.element.ptyProcess.on.calls.allArgs()) {
			if (arg[0] === 'exit') {
				exitHandler = arg[1]
				break
			}
		}
		spyOn(this.element.model, 'exit')
		spyOn(this.element, 'leaveOpenAfterExit').and.returnValue(true)
		exitHandler(0)
		const successDiv = this.element.topDiv.querySelector('.x-terminal-notice-success')
		const errorDiv = this.element.topDiv.querySelector('.x-terminal-notice-error')
		expect(successDiv).not.toBeNull()
		expect(errorDiv).toBeNull()
	})

	it('ptyProcess exit handler code 1 leave open check top message', () => {
		let exitHandler
		for (const arg of this.element.ptyProcess.on.calls.allArgs()) {
			if (arg[0] === 'exit') {
				exitHandler = arg[1]
				break
			}
		}
		spyOn(this.element.model, 'exit')
		spyOn(this.element, 'leaveOpenAfterExit').and.returnValue(true)
		exitHandler(1)
		const successDiv = this.element.topDiv.querySelector('.x-terminal-notice-success')
		const errorDiv = this.element.topDiv.querySelector('.x-terminal-notice-error')
		expect(successDiv).toBeNull()
		expect(errorDiv).not.toBeNull()
	})

	it('ptyProcess exit handler code 0 leave open check top message has restart button', () => {
		let exitHandler
		for (const arg of this.element.ptyProcess.on.calls.allArgs()) {
			if (arg[0] === 'exit') {
				exitHandler = arg[1]
				break
			}
		}
		spyOn(this.element.model, 'exit')
		spyOn(this.element, 'leaveOpenAfterExit').and.returnValue(true)
		exitHandler(0)
		const messageDiv = this.element.topDiv.querySelector('.x-terminal-notice-success')
		const restartButton = messageDiv.querySelector('.btn-success')
		expect(restartButton).not.toBeNull()
	})

	it('ptyProcess exit handler code 1 leave open check top message has restart button', () => {
		let exitHandler
		for (const arg of this.element.ptyProcess.on.calls.allArgs()) {
			if (arg[0] === 'exit') {
				exitHandler = arg[1]
				break
			}
		}
		spyOn(this.element.model, 'exit')
		spyOn(this.element, 'leaveOpenAfterExit').and.returnValue(true)
		exitHandler(1)
		const messageDiv = this.element.topDiv.querySelector('.x-terminal-notice-error')
		const restartButton = messageDiv.querySelector('.btn-error')
		expect(restartButton).not.toBeNull()
	})

	it('ptyProcess exit handler code 0 leave open check restart button click handler', () => {
		let exitHandler
		for (const arg of this.element.ptyProcess.on.calls.allArgs()) {
			if (arg[0] === 'exit') {
				exitHandler = arg[1]
				break
			}
		}
		spyOn(this.element.model, 'exit')
		spyOn(this.element, 'leaveOpenAfterExit').and.returnValue(true)
		exitHandler(0)
		const messageDiv = this.element.topDiv.querySelector('.x-terminal-notice-success')
		const restartButton = messageDiv.querySelector('.btn-success')
		spyOn(this.element, 'restartPtyProcess')
		const mouseEvent = new MouseEvent('click')
		restartButton.dispatchEvent(mouseEvent)
		expect(this.element.restartPtyProcess).toHaveBeenCalled()
	})

	it('refitTerminal() initial state', () => {
		spyOn(this.element.fitAddon, 'proposeDimensions')
		this.element.refitTerminal()
		expect(this.element.fitAddon.proposeDimensions).not.toHaveBeenCalled()
	})

	it('refitTerminal() terminal not visible', () => {
		spyOn(this.element.fitAddon, 'proposeDimensions')
		this.element.mainDivContentRect = { width: 1, height: 1 }
		this.element.terminalDivInitiallyVisible = false
		this.element.refitTerminal()
		expect(this.element.fitAddon.proposeDimensions).not.toHaveBeenCalled()
	})

	it('refitTerminal() terminal no width', () => {
		spyOn(this.element.fitAddon, 'proposeDimensions')
		this.element.mainDivContentRect = { width: 0, height: 1 }
		this.element.terminalDivInitiallyVisible = true
		this.element.refitTerminal()
		expect(this.element.fitAddon.proposeDimensions).not.toHaveBeenCalled()
	})

	it('refitTerminal() terminal no height', () => {
		spyOn(this.element.fitAddon, 'proposeDimensions')
		this.element.mainDivContentRect = { width: 1, height: 0 }
		this.element.terminalDivInitiallyVisible = true
		this.element.refitTerminal()
		expect(this.element.fitAddon.proposeDimensions).not.toHaveBeenCalled()
	})

	it('refitTerminal() terminal completely visible', () => {
		spyOn(this.element.fitAddon, 'proposeDimensions').and.returnValue(null)
		this.element.mainDivContentRect = { width: 1, height: 1 }
		this.element.terminalDivInitiallyVisible = true
		this.element.refitTerminal()
		expect(this.element.fitAddon.proposeDimensions).toHaveBeenCalled()
	})

	it('refitTerminal() terminal size not changed', () => {
		spyOn(this.element.fitAddon, 'proposeDimensions').and.returnValue({
			cols: this.element.terminal.cols,
			rows: this.element.terminal.rows,
		})
		spyOn(this.element.terminal, 'resize')
		this.element.mainDivContentRect = { width: 1, height: 1 }
		this.element.terminalDivInitiallyVisible = true
		this.element.ptyProcessRunning = false
		this.element.refitTerminal()
		expect(this.element.terminal.resize).not.toHaveBeenCalled()
	})

	it('refitTerminal() terminal size cols increased', () => {
		spyOn(this.element.fitAddon, 'proposeDimensions').and.returnValue({
			cols: this.element.terminal.cols + 1,
			rows: this.element.terminal.rows,
		})
		spyOn(this.element.terminal, 'resize')
		this.element.mainDivContentRect = { width: 1, height: 1 }
		this.element.terminalDivInitiallyVisible = true
		this.element.ptyProcessRunning = false
		this.element.refitTerminal()
		expect(this.element.terminal.resize).toHaveBeenCalled()
	})

	it('refitTerminal() terminal size rows increased', () => {
		spyOn(this.element.fitAddon, 'proposeDimensions').and.returnValue({
			cols: this.element.terminal.cols,
			rows: this.element.terminal.rows + 1,
		})
		spyOn(this.element.terminal, 'resize')
		this.element.mainDivContentRect = { width: 1, height: 1 }
		this.element.terminalDivInitiallyVisible = true
		this.element.ptyProcessRunning = false
		this.element.refitTerminal()
		expect(this.element.terminal.resize).toHaveBeenCalled()
	})

	it('refitTerminal() terminal size cols and rows increased', () => {
		spyOn(this.element.fitAddon, 'proposeDimensions').and.returnValue({
			cols: this.element.terminal.cols + 1,
			rows: this.element.terminal.rows + 1,
		})
		spyOn(this.element.terminal, 'resize')
		this.element.mainDivContentRect = { width: 1, height: 1 }
		this.element.terminalDivInitiallyVisible = true
		this.element.ptyProcessRunning = false
		this.element.refitTerminal()
		expect(this.element.terminal.resize).toHaveBeenCalled()
	})

	it('refitTerminal() terminal size rows decreased', () => {
		spyOn(this.element.fitAddon, 'proposeDimensions').and.returnValue({
			cols: this.element.terminal.cols,
			rows: this.element.terminal.rows - 1,
		})
		spyOn(this.element.terminal, 'resize')
		this.element.mainDivContentRect = { width: 1, height: 1 }
		this.element.terminalDivInitiallyVisible = true
		this.element.ptyProcessRunning = false
		this.element.refitTerminal()
		expect(this.element.terminal.resize).toHaveBeenCalled()
	})

	it('refitTerminal() terminal size cols and rows decreased', () => {
		spyOn(this.element.fitAddon, 'proposeDimensions').and.returnValue({
			cols: this.element.terminal.cols - 1,
			rows: this.element.terminal.rows - 1,
		})
		spyOn(this.element.terminal, 'resize')
		this.element.mainDivContentRect = { width: 1, height: 1 }
		this.element.terminalDivInitiallyVisible = true
		this.element.ptyProcessRunning = false
		this.element.refitTerminal()
		expect(this.element.terminal.resize).toHaveBeenCalled()
	})

	it('refitTerminal() pty process size not changed ptyProcess running', () => {
		spyOn(this.element.fitAddon, 'proposeDimensions').and.returnValue({
			cols: this.element.ptyProcessCols,
			rows: this.element.ptyProcessRows,
		})
		spyOn(this.element.terminal, 'resize')
		this.element.mainDivContentRect = { width: 1, height: 1 }
		this.element.terminalDivInitiallyVisible = true
		this.element.ptyProcessRunning = true
		this.element.refitTerminal()
		expect(this.element.ptyProcess.resize).not.toHaveBeenCalled()
	})

	it('refitTerminal() pty process size cols increased ptyProcess running', () => {
		spyOn(this.element.fitAddon, 'proposeDimensions').and.returnValue({
			cols: this.element.ptyProcessCols + 1,
			rows: this.element.ptyProcessRows,
		})
		spyOn(this.element.terminal, 'resize')
		this.element.mainDivContentRect = { width: 1, height: 1 }
		this.element.terminalDivInitiallyVisible = true
		this.element.ptyProcessRunning = true
		this.element.refitTerminal()
		expect(this.element.ptyProcess.resize).toHaveBeenCalled()
	})

	it('refitTerminal() pty process size rows increased ptyProcess running', () => {
		spyOn(this.element.fitAddon, 'proposeDimensions').and.returnValue({
			cols: this.element.ptyProcessCols,
			rows: this.element.ptyProcessRows + 1,
		})
		spyOn(this.element.terminal, 'resize')
		this.element.mainDivContentRect = { width: 1, height: 1 }
		this.element.terminalDivInitiallyVisible = true
		this.element.ptyProcessRunning = true
		this.element.refitTerminal()
		expect(this.element.ptyProcess.resize).toHaveBeenCalled()
	})

	it('refitTerminal() pty process size cols and rows increased ptyProcess running', () => {
		spyOn(this.element.fitAddon, 'proposeDimensions').and.returnValue({
			cols: this.element.ptyProcessCols + 1,
			rows: this.element.ptyProcessRows + 1,
		})
		spyOn(this.element.terminal, 'resize')
		this.element.mainDivContentRect = { width: 1, height: 1 }
		this.element.terminalDivInitiallyVisible = true
		this.element.ptyProcessRunning = true
		this.element.refitTerminal()
		expect(this.element.ptyProcess.resize).toHaveBeenCalled()
	})

	it('refitTerminal() pty process size cols decreased ptyProcess running', () => {
		spyOn(this.element.fitAddon, 'proposeDimensions').and.returnValue({
			cols: this.element.ptyProcessCols - 1,
			rows: this.element.ptyProcessRows,
		})
		spyOn(this.element.terminal, 'resize')
		this.element.mainDivContentRect = { width: 1, height: 1 }
		this.element.terminalDivInitiallyVisible = true
		this.element.ptyProcessRunning = true
		this.element.refitTerminal()
		expect(this.element.ptyProcess.resize).toHaveBeenCalled()
	})

	it('refitTerminal() pty process size rows decreased ptyProcess running', () => {
		spyOn(this.element.fitAddon, 'proposeDimensions').and.returnValue({
			cols: this.element.ptyProcessCols,
			rows: this.element.ptyProcessRows - 1,
		})
		spyOn(this.element.terminal, 'resize')
		this.element.mainDivContentRect = { width: 1, height: 1 }
		this.element.terminalDivInitiallyVisible = true
		this.element.ptyProcessRunning = true
		this.element.refitTerminal()
		expect(this.element.ptyProcess.resize).toHaveBeenCalled()
	})

	it('refitTerminal() pty process size cols and rows decreased ptyProcess running', () => {
		spyOn(this.element.fitAddon, 'proposeDimensions').and.returnValue({
			cols: this.element.ptyProcessCols - 1,
			rows: this.element.ptyProcessRows - 1,
		})
		spyOn(this.element.terminal, 'resize')
		this.element.mainDivContentRect = { width: 1, height: 1 }
		this.element.terminalDivInitiallyVisible = true
		this.element.ptyProcessRunning = true
		this.element.refitTerminal()
		expect(this.element.ptyProcess.resize).toHaveBeenCalled()
	})

	it('refitTerminal() pty process size cols increased ptyProcess running check call args', () => {
		const expected = {
			cols: this.element.ptyProcessCols + 1,
			rows: this.element.ptyProcessRows,
		}
		spyOn(this.element.fitAddon, 'proposeDimensions').and.returnValue(expected)
		spyOn(this.element.terminal, 'resize')
		this.element.mainDivContentRect = { width: 1, height: 1 }
		this.element.terminalDivInitiallyVisible = true
		this.element.ptyProcessRunning = true
		this.element.refitTerminal()
		expect(this.element.ptyProcess.resize).toHaveBeenCalledWith(expected.cols, expected.rows)
	})

	it('refitTerminal() pty process size rows increased ptyProcess running check call args', () => {
		const expected = {
			cols: this.element.ptyProcessCols,
			rows: this.element.ptyProcessRows + 1,
		}
		spyOn(this.element.fitAddon, 'proposeDimensions').and.returnValue(expected)
		spyOn(this.element.terminal, 'resize')
		this.element.mainDivContentRect = { width: 1, height: 1 }
		this.element.terminalDivInitiallyVisible = true
		this.element.ptyProcessRunning = true
		this.element.refitTerminal()
		expect(this.element.ptyProcess.resize).toHaveBeenCalledWith(expected.cols, expected.rows)
	})

	it('refitTerminal() pty process size cols and rows increased ptyProcess running check call args', () => {
		const expected = {
			cols: this.element.ptyProcessCols + 1,
			rows: this.element.ptyProcessRows + 1,
		}
		spyOn(this.element.fitAddon, 'proposeDimensions').and.returnValue(expected)
		spyOn(this.element.terminal, 'resize')
		this.element.mainDivContentRect = { width: 1, height: 1 }
		this.element.terminalDivInitiallyVisible = true
		this.element.ptyProcessRunning = true
		this.element.refitTerminal()
		expect(this.element.ptyProcess.resize).toHaveBeenCalledWith(expected.cols, expected.rows)
	})

	it('refitTerminal() pty process size cols decreased ptyProcess running check call args', () => {
		const expected = {
			cols: this.element.ptyProcessCols - 1,
			rows: this.element.ptyProcessRows,
		}
		spyOn(this.element.fitAddon, 'proposeDimensions').and.returnValue(expected)
		spyOn(this.element.terminal, 'resize')
		this.element.mainDivContentRect = { width: 1, height: 1 }
		this.element.terminalDivInitiallyVisible = true
		this.element.ptyProcessRunning = true
		this.element.refitTerminal()
		expect(this.element.ptyProcess.resize).toHaveBeenCalledWith(expected.cols, expected.rows)
	})

	it('refitTerminal() pty process size rows decreased ptyProcess running check call args', () => {
		const expected = {
			cols: this.element.ptyProcessCols,
			rows: this.element.ptyProcessRows - 1,
		}
		spyOn(this.element.fitAddon, 'proposeDimensions').and.returnValue(expected)
		spyOn(this.element.terminal, 'resize')
		this.element.mainDivContentRect = { width: 1, height: 1 }
		this.element.terminalDivInitiallyVisible = true
		this.element.ptyProcessRunning = true
		this.element.refitTerminal()
		expect(this.element.ptyProcess.resize).toHaveBeenCalledWith(expected.cols, expected.rows)
	})

	it('refitTerminal() pty process size cols and rows decreased ptyProcess running check call args', () => {
		const expected = {
			cols: this.element.ptyProcessCols - 1,
			rows: this.element.ptyProcessRows - 1,
		}
		spyOn(this.element.fitAddon, 'proposeDimensions').and.returnValue(expected)
		spyOn(this.element.terminal, 'resize')
		this.element.mainDivContentRect = { width: 1, height: 1 }
		this.element.terminalDivInitiallyVisible = true
		this.element.ptyProcessRunning = true
		this.element.refitTerminal()
		expect(this.element.ptyProcess.resize).toHaveBeenCalledWith(expected.cols, expected.rows)
	})

	it('focusOnTerminal()', () => {
		spyOn(this.element.terminal, 'focus')
		spyOn(this.element.model, 'setActive')
		this.element.focusOnTerminal()
		expect(this.element.model.setActive).toHaveBeenCalled()
		expect(this.element.terminal.focus).toHaveBeenCalled()
	})

	it('focusOnTerminal() terminal not set', () => {
		this.element.terminal = null
		this.element.focusOnTerminal()
	})

	it('toggleProfileMenu()', (done) => {
		this.element.atomXtermProfileMenuElement = jasmine.createSpyObj(
			'atomXtermProfileMenuElement',
			[
				'toggleProfileMenu',
				'destroy',
			],
		)
		this.element.atomXtermProfileMenuElement.initializedPromise = Promise.resolve()
		this.element.atomXtermProfileMenuElement.toggleProfileMenu.and.callFake(() => {
			done()
		})
		this.element.toggleProfileMenu()
	})

	it('hideTerminal()', () => {
		this.element.hideTerminal()
		expect(this.element.terminalDiv.style.visibility).toBe('hidden')
	})

	it('showTerminal()', () => {
		this.element.showTerminal()
		expect(this.element.terminalDiv.style.visibility).toBe('visible')
	})

	it('hoveredLink initially null', () => {
		expect(this.element.hoveredLink).toBeNull()
	})

	it('terminalDiv initially does not have link class', () => {
		expect(this.element.terminalDiv.classList.contains('x-terminal-term-container-has-link')).toBe(false)
	})

	it('on \'data\' handler no custom title on win32 platform', async () => {
		Object.defineProperty(process, 'platform', {
			value: 'win32',
		})
		const newPtyProcess = jasmine.createSpyObj('ptyProcess',
			['kill', 'write', 'resize', 'on', 'removeAllListeners'])
		newPtyProcess.process = 'sometestprocess'
		nodePty.spawn.and.returnValue(newPtyProcess)
		await this.element.restartPtyProcess()
		const args = this.element.ptyProcess.on.calls.argsFor(0)
		const onDataCallback = args[1]
		onDataCallback('')
		expect(this.element.model.title).toBe('X Terminal')
	})

	it('on \'data\' handler no custom title on linux platform', async () => {
		Object.defineProperty(process, 'platform', {
			value: 'linux',
		})
		const newPtyProcess = jasmine.createSpyObj('ptyProcess',
			['kill', 'write', 'resize', 'on', 'removeAllListeners'])
		newPtyProcess.process = 'sometestprocess'
		nodePty.spawn.and.returnValue(newPtyProcess)
		await this.element.restartPtyProcess()
		const args = this.element.ptyProcess.on.calls.argsFor(0)
		const onDataCallback = args[1]
		onDataCallback('')
		expect(this.element.model.title).toBe('sometestprocess')
	})

	it('on \'data\' handler custom title on win32 platform', async () => {
		Object.defineProperty(process, 'platform', {
			value: 'win32',
		})
		const newPtyProcess = jasmine.createSpyObj('ptyProcess',
			['kill', 'write', 'resize', 'on', 'removeAllListeners'])
		newPtyProcess.process = 'sometestprocess'
		nodePty.spawn.and.returnValue(newPtyProcess)
		this.element.model.profile.title = 'foo'
		await this.element.restartPtyProcess()
		const args = this.element.ptyProcess.on.calls.argsFor(0)
		const onDataCallback = args[1]
		onDataCallback('')
		expect(this.element.model.title).toBe('foo')
	})

	it('on \'data\' handler custom title on linux platform', async () => {
		Object.defineProperty(process, 'platform', {
			value: 'linux',
		})
		const newPtyProcess = jasmine.createSpyObj('ptyProcess',
			['kill', 'write', 'resize', 'on', 'removeAllListeners'])
		newPtyProcess.process = 'sometestprocess'
		nodePty.spawn.and.returnValue(newPtyProcess)
		this.element.model.profile.title = 'foo'
		await this.element.restartPtyProcess()
		const args = this.element.ptyProcess.on.calls.argsFor(0)
		const onDataCallback = args[1]
		onDataCallback('')
		expect(this.element.model.title).toBe('foo')
	})

	it('on \'exit\' handler leave open after exit success', async () => {
		const newPtyProcess = jasmine.createSpyObj('ptyProcess',
			['kill', 'write', 'resize', 'on', 'removeAllListeners'])
		newPtyProcess.process = 'sometestprocess'
		nodePty.spawn.and.returnValue(newPtyProcess)
		this.element.model.profile.title = 'foo'
		await this.element.restartPtyProcess()
		const args = this.element.ptyProcess.on.calls.argsFor(1)
		const onExitCallback = args[1]
		this.element.model.profile.leaveOpenAfterExit = true
		onExitCallback(0)
		expect(this.element.querySelector('.x-terminal-notice-success')).toBeTruthy()
		expect(this.element.querySelector('.x-terminal-notice-error')).toBe(null)
	})

	it('on \'exit\' handler leave open after exit failure', async () => {
		const newPtyProcess = jasmine.createSpyObj('ptyProcess',
			['kill', 'write', 'resize', 'on', 'removeAllListeners'])
		newPtyProcess.process = 'sometestprocess'
		nodePty.spawn.and.returnValue(newPtyProcess)
		this.element.model.profile.title = 'foo'
		await this.element.restartPtyProcess()
		const args = this.element.ptyProcess.on.calls.argsFor(1)
		const onExitCallback = args[1]
		this.element.model.profile.leaveOpenAfterExit = true
		onExitCallback(1)
		expect(this.element.querySelector('.x-terminal-notice-success')).toBe(null)
		expect(this.element.querySelector('.x-terminal-notice-error')).toBeTruthy()
	})

	it('on \'exit\' handler do not leave open', async () => {
		const newPtyProcess = jasmine.createSpyObj('ptyProcess',
			['kill', 'write', 'resize', 'on', 'removeAllListeners'])
		newPtyProcess.process = 'sometestprocess'
		nodePty.spawn.and.returnValue(newPtyProcess)
		this.element.model.profile.title = 'foo'
		await this.element.restartPtyProcess()
		const args = this.element.ptyProcess.on.calls.argsFor(1)
		const onExitCallback = args[1]
		this.element.model.profile.leaveOpenAfterExit = false
		spyOn(this.element.model, 'exit')
		onExitCallback(1)
		expect(this.element.model.exit).toHaveBeenCalled()
	})

	it('showNotification() success message', () => {
		this.element.showNotification(
			'foo',
			'success',
		)
		const messageDiv = this.element.topDiv.querySelector('.x-terminal-notice-success')
		expect(messageDiv.textContent).toBe('fooRestart')
	})

	it('showNotification() error message', () => {
		this.element.showNotification(
			'foo',
			'error',
		)
		const messageDiv = this.element.topDiv.querySelector('.x-terminal-notice-error')
		expect(messageDiv.textContent).toBe('fooRestart')
	})

	it('showNotification() success message with Atom notification', () => {
		spyOn(atom.notifications, 'addSuccess')
		this.element.showNotification(
			'foo',
			'success',
		)
		expect(atom.notifications.addSuccess).toHaveBeenCalled()
	})

	it('showNotification() error message with Atom notification', () => {
		spyOn(atom.notifications, 'addError')
		this.element.showNotification(
			'foo',
			'error',
		)
		expect(atom.notifications.addError).toHaveBeenCalled()
	})

	it('showNotification() warning message with Atom notification', () => {
		spyOn(atom.notifications, 'addWarning')
		this.element.showNotification(
			'foo',
			'warning',
		)
		expect(atom.notifications.addWarning).toHaveBeenCalled()
	})

	it('showNotification() info message with Atom notification', () => {
		spyOn(atom.notifications, 'addInfo')
		this.element.showNotification(
			'foo',
			'info',
		)
		expect(atom.notifications.addInfo).toHaveBeenCalled()
	})

	it('showNotification() bogus info type with Atom notification', () => {
		const call = () => {
			this.element.showNotification(
				'foo',
				'bogus',
			)
		}
		expect(call).toThrow(new Error('Unknown info type: bogus'))
	})

	it('showNotification() custom restart button text', () => {
		this.element.showNotification(
			'foo',
			'info',
			'Some text',
		)
		const restartButton = this.element.topDiv.querySelector('.x-terminal-restart-btn')
		expect(restartButton.firstChild.nodeValue).toBe('Some text')
	})

	it('promptToStartup()', async () => {
		await this.element.promptToStartup()
		const restartButton = this.element.topDiv.querySelector('.x-terminal-restart-btn')
		expect(restartButton.firstChild.nodeValue).toBe('Start')
	})

	it('promptToStartup() check message without title', async () => {
		const command = ['some_command', 'a', 'b', 'c']
		spyOn(this.element, 'getShellCommand').and.returnValue(command[0])
		spyOn(this.element, 'getArgs').and.returnValue(command.slice(1))
		const expected = `New command ${JSON.stringify(command)} ready to start.`
		await this.element.promptToStartup()
		const messageDiv = this.element.topDiv.querySelector('.x-terminal-notice-info')
		expect(messageDiv.firstChild.nodeValue).toBe(expected)
	})

	it('promptToStartup() check message with title', async () => {
		this.element.model.profile.title = 'My Profile'
		const expected = 'New command for profile My Profile ready to start.'
		await this.element.promptToStartup()
		const messageDiv = this.element.topDiv.querySelector('.x-terminal-notice-info')
		expect(messageDiv.firstChild.nodeValue).toBe(expected)
	})

	it('use wheelScrollUp on terminal container', () => {
		const wheelEvent = new WheelEvent('wheel', {
			deltaY: -150,
		})
		this.element.terminalDiv.dispatchEvent(wheelEvent)
		expect(this.element.model.profile.fontSize).toBe(14)
	})

	it('use wheelScrollDown on terminal container', () => {
		const wheelEvent = new WheelEvent('wheel', {
			deltaY: 150,
		})
		this.element.terminalDiv.dispatchEvent(wheelEvent)
		expect(this.element.model.profile.fontSize).toBe(14)
	})

	it('use ctrl+wheelScrollUp on terminal container, editor.zoomFontWhenCtrlScrolling = true', () => {
		atom.config.set('editor.zoomFontWhenCtrlScrolling', true)
		const wheelEvent = new WheelEvent('wheel', {
			deltaY: -150,
			ctrlKey: true,
		})
		this.element.terminalDiv.dispatchEvent(wheelEvent)
		expect(this.element.model.profile.fontSize).toBe(15)
	})

	it('use ctrl+wheelScrollDown on terminal container, editor.zoomFontWhenCtrlScrolling = true', () => {
		atom.config.set('editor.zoomFontWhenCtrlScrolling', true)
		const wheelEvent = new WheelEvent('wheel', {
			deltaY: 150,
			ctrlKey: true,
		})
		this.element.terminalDiv.dispatchEvent(wheelEvent)
		expect(this.element.model.profile.fontSize).toBe(13)
	})

	it('use ctrl+wheelScrollUp on terminal container, editor.zoomFontWhenCtrlScrolling = false', () => {
		atom.config.set('editor.zoomFontWhenCtrlScrolling', false)
		const wheelEvent = new WheelEvent('wheel', {
			deltaY: -150,
			ctrlKey: true,
		})
		this.element.terminalDiv.dispatchEvent(wheelEvent)
		expect(this.element.model.profile.fontSize).toBe(14)
	})

	it('use ctrl+wheelScrollDown on terminal container, editor.zoomFontWhenCtrlScrolling = false', () => {
		atom.config.set('editor.zoomFontWhenCtrlScrolling', false)
		const wheelEvent = new WheelEvent('wheel', {
			deltaY: 150,
			ctrlKey: true,
		})
		this.element.terminalDiv.dispatchEvent(wheelEvent)
		expect(this.element.model.profile.fontSize).toBe(14)
	})

	it('use ctrl+wheelScrollUp font already at maximum', () => {
		this.element.model.profile.fontSize = configDefaults.maximumFontSize
		const wheelEvent = new WheelEvent('wheel', {
			deltaY: -150,
			ctrlKey: true,
		})
		this.element.terminalDiv.dispatchEvent(wheelEvent)
		expect(this.element.model.profile.fontSize).toBe(configDefaults.maximumFontSize)
	})

	it('use ctrl+wheelScrollDown font already at minimum', () => {
		this.element.model.profile.fontSize = configDefaults.minimumFontSize
		const wheelEvent = new WheelEvent('wheel', {
			deltaY: 150,
			ctrlKey: true,
		})
		this.element.terminalDiv.dispatchEvent(wheelEvent)
		expect(this.element.model.profile.fontSize).toBe(configDefaults.minimumFontSize)
	})

	it('copy on select', async () => {
		spyOn(atom.clipboard, 'write')
		this.element.model.profile.copyOnSelect = true
		await new Promise(resolve => this.element.terminal.write('test', resolve))
		this.element.terminal.selectLines(0, 0)
		const selection = this.element.terminal.getSelection()
		expect(atom.clipboard.write).toHaveBeenCalledWith(selection)
	})

	it('does not copy on clear selection', async () => {
		spyOn(atom.clipboard, 'write')
		this.element.model.profile.copyOnSelect = true
		await new Promise(resolve => this.element.terminal.write('test', resolve))
		this.element.terminal.selectLines(0, 0)
		atom.clipboard.write.calls.reset()
		this.element.terminal.clearSelection()
		expect(atom.clipboard.write).not.toHaveBeenCalled()
	})

	it('does not copy if copyOnSelect is false', async () => {
		spyOn(atom.clipboard, 'write')
		this.element.model.profile.copyOnSelect = false
		await new Promise(resolve => this.element.terminal.write('test', resolve))
		this.element.terminal.selectLines(0, 0)
		expect(atom.clipboard.write).not.toHaveBeenCalled()
	})

	it('getXtermOptions() default options', () => {
		const expected = {
			cursorBlink: true,
			fontSize: 14,
			fontFamily: 'monospace',
			theme: this.element.getTheme(),
		}
		expect(this.element.getXtermOptions()).toEqual(expected)
	})

	it('getXtermOptions() xtermOptions in profile', () => {
		this.element.model.profile.xtermOptions = {
			cursorBlink: true,
		}
		const expected = {
			cursorBlink: true,
			fontSize: 14,
			fontFamily: 'monospace',
			theme: this.element.getTheme(),
		}
		expect(this.element.getXtermOptions()).toEqual(expected)
	})

	it('applyPendingTerminalProfileOptions() terminal not visible', () => {
		spyOn(this.element, 'refitTerminal')
		this.element.terminalDivInitiallyVisible = false
		this.element.applyPendingTerminalProfileOptions()
		expect(this.element.refitTerminal).not.toHaveBeenCalled()
	})

	it('applyPendingTerminalProfileOptions() terminal visible no pending changes', () => {
		spyOn(this.element, 'refitTerminal')
		spyOn(this.element, 'setMainBackgroundColor')
		spyOn(this.element, 'restartPtyProcess')
		spyOn(this.element.terminal, 'setOption')
		this.element.terminalDivInitiallyVisible = true
		this.element.applyPendingTerminalProfileOptions()
		expect(this.element.setMainBackgroundColor).toHaveBeenCalled()
		expect(this.element.terminal.setOption).not.toHaveBeenCalled()
		expect(this.element.restartPtyProcess).not.toHaveBeenCalled()
		expect(this.element.refitTerminal).toHaveBeenCalled()
	})

	it('applyPendingTerminalProfileOptions() terminal visible pending xtermOptions', () => {
		spyOn(this.element, 'refitTerminal')
		spyOn(this.element, 'setMainBackgroundColor')
		spyOn(this.element, 'restartPtyProcess')
		spyOn(this.element.terminal, 'setOption')
		this.element.terminalDivInitiallyVisible = true
		this.element.pendingTerminalProfileOptions.xtermOptions = {
			cursorBlink: true,
		}
		this.element.applyPendingTerminalProfileOptions()
		expect(this.element.setMainBackgroundColor).toHaveBeenCalled()
		expect(this.element.terminal.setOption).toHaveBeenCalled()
		expect(this.element.restartPtyProcess).not.toHaveBeenCalled()
		expect(this.element.refitTerminal).toHaveBeenCalled()
	})

	it('applyPendingTerminalProfileOptions() terminal visible pending pty changes', () => {
		spyOn(this.element, 'refitTerminal')
		spyOn(this.element, 'setMainBackgroundColor')
		spyOn(this.element, 'restartPtyProcess')
		spyOn(this.element.terminal, 'setOption')
		this.element.terminalDivInitiallyVisible = true
		this.element.pendingTerminalProfileOptions.command = 'somecommand'
		this.element.applyPendingTerminalProfileOptions()
		expect(this.element.setMainBackgroundColor).toHaveBeenCalled()
		expect(this.element.terminal.setOption).not.toHaveBeenCalled()
		expect(this.element.restartPtyProcess).toHaveBeenCalled()
		expect(this.element.refitTerminal).toHaveBeenCalled()
	})

	it('applyPendingTerminalProfileOptions() terminal visible pending xtermOptions and pty changes', () => {
		spyOn(this.element, 'refitTerminal')
		spyOn(this.element, 'setMainBackgroundColor')
		spyOn(this.element, 'restartPtyProcess')
		spyOn(this.element.terminal, 'setOption')
		this.element.terminalDivInitiallyVisible = true
		this.element.pendingTerminalProfileOptions.xtermOptions = {
			cursorBlink: true,
		}
		this.element.pendingTerminalProfileOptions.command = 'somecommand'
		this.element.applyPendingTerminalProfileOptions()
		expect(this.element.setMainBackgroundColor).toHaveBeenCalled()
		expect(this.element.terminal.setOption).toHaveBeenCalled()
		expect(this.element.restartPtyProcess).toHaveBeenCalled()
		expect(this.element.refitTerminal).toHaveBeenCalled()
	})

	it('applyPendingTerminalProfileOptions() terminal not visible pending xtermOptions and pty changes kept', () => {
		spyOn(this.element, 'refitTerminal')
		this.element.terminalDivInitiallyVisible = false
		this.element.pendingTerminalProfileOptions.xtermOptions = {
			cursorBlink: true,
		}
		this.element.pendingTerminalProfileOptions.command = 'somecommand'
		this.element.applyPendingTerminalProfileOptions()
		expect(this.element.pendingTerminalProfileOptions).toEqual({
			xtermOptions: {
				cursorBlink: true,
			},
			command: 'somecommand',
		})
	})

	it('applyPendingTerminalProfileOptions() terminal visible pending xtermOptions and pty changes removed', () => {
		spyOn(this.element, 'refitTerminal')
		this.element.terminalDivInitiallyVisible = true
		this.element.pendingTerminalProfileOptions.xtermOptions = {
			cursorBlink: true,
		}
		this.element.pendingTerminalProfileOptions.command = 'somecommand'
		this.element.applyPendingTerminalProfileOptions()
		expect(this.element.pendingTerminalProfileOptions).toEqual({})
	})

	it('applyPendingTerminalProfileOptions() terminal not visible x-terminal options removed', () => {
		spyOn(this.element, 'refitTerminal')
		this.element.terminalDivInitiallyVisible = false
		this.element.pendingTerminalProfileOptions.leaveOpenAfterExit = true
		this.element.pendingTerminalProfileOptions.relaunchTerminalOnStartup = true
		this.element.pendingTerminalProfileOptions.title = 'foo'
		this.element.applyPendingTerminalProfileOptions()
		expect(this.element.pendingTerminalProfileOptions).toEqual({})
	})

	it('applyPendingTerminalProfileOptions() terminal visible x-terminal options removed', () => {
		spyOn(this.element, 'refitTerminal')
		this.element.terminalDivInitiallyVisible = true
		this.element.pendingTerminalProfileOptions.leaveOpenAfterExit = true
		this.element.pendingTerminalProfileOptions.relaunchTerminalOnStartup = true
		this.element.pendingTerminalProfileOptions.title = 'foo'
		this.element.applyPendingTerminalProfileOptions()
		expect(this.element.pendingTerminalProfileOptions).toEqual({})
	})

	it('queueNewProfileChanges() no previous changes', () => {
		spyOn(this.element, 'applyPendingTerminalProfileOptions')
		const profileChanges = {
			command: 'somecommand',
		}
		this.element.queueNewProfileChanges(profileChanges)
		expect(this.element.pendingTerminalProfileOptions).toEqual(profileChanges)
	})

	it('queueNewProfileChanges() previous command change made', () => {
		spyOn(this.element, 'applyPendingTerminalProfileOptions')
		this.element.pendingTerminalProfileOptions.command = 'somecommand'
		const profileChanges = {
			command: 'someothercommand',
		}
		this.element.queueNewProfileChanges(profileChanges)
		expect(this.element.pendingTerminalProfileOptions).toEqual(profileChanges)
	})

	it('queueNewProfileChanges() another setting', () => {
		spyOn(this.element, 'applyPendingTerminalProfileOptions')
		this.element.pendingTerminalProfileOptions.command = 'somecommand'
		const profileChanges = {
			args: ['--foo', '--bar', '--baz'],
		}
		this.element.queueNewProfileChanges(profileChanges)
		expect(this.element.pendingTerminalProfileOptions).toEqual({
			command: 'somecommand',
			args: ['--foo', '--bar', '--baz'],
		})
	})

	it('base profile changed, font size and xterm options remained the same', () => {
		const profile = {
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
			xtermOptions: {
				cursorBlink: true,
			},
		}
		spyOn(this.element.model, 'getProfile').and.returnValue(profile)
		spyOn(this.element.model, 'applyProfileChanges')
		this.element.profilesSingleton.emitter.emit(
			'did-reset-base-profile',
			profile,
		)
		expect(this.element.model.applyProfileChanges).toHaveBeenCalledWith({})
	})

	it('base profile changed, font size changed, xterm options remained the same', () => {
		const profile = {
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
			xtermOptions: {
				cursorBlink: true,
			},
		}
		const newBaseProfile = this.element.profilesSingleton.deepClone(profile)
		newBaseProfile.fontSize = 15
		spyOn(this.element.model, 'getProfile').and.returnValue(profile)
		spyOn(this.element.model, 'applyProfileChanges')
		this.element.profilesSingleton.emitter.emit(
			'did-reset-base-profile',
			newBaseProfile,
		)
		expect(this.element.model.applyProfileChanges).toHaveBeenCalledWith({
			fontSize: 15,
		})
	})

	it('base profile changed, font size remained the same, xterm options changed', () => {
		const profile = {
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
			xtermOptions: {
				cursorBlink: true,
			},
		}
		const newBaseProfile = this.element.profilesSingleton.deepClone(profile)
		newBaseProfile.xtermOptions = {
			cursorBlink: false,
		}
		spyOn(this.element.model, 'getProfile').and.returnValue(profile)
		spyOn(this.element.model, 'applyProfileChanges')
		this.element.profilesSingleton.emitter.emit(
			'did-reset-base-profile',
			newBaseProfile,
		)
		expect(this.element.model.applyProfileChanges).toHaveBeenCalledWith({
			xtermOptions: {
				cursorBlink: false,
			},
		})
	})

	it('base profile changed, font size and xterm options changed', () => {
		const profile = {
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
			xtermOptions: {
				cursorBlink: true,
			},
		}
		const newBaseProfile = this.element.profilesSingleton.deepClone(profile)
		newBaseProfile.fontSize = 15
		newBaseProfile.xtermOptions = {
			cursorBlink: false,
		}
		spyOn(this.element.model, 'getProfile').and.returnValue(profile)
		spyOn(this.element.model, 'applyProfileChanges')
		this.element.profilesSingleton.emitter.emit(
			'did-reset-base-profile',
			newBaseProfile,
		)
		expect(this.element.model.applyProfileChanges).toHaveBeenCalledWith({
			fontSize: 15,
			xtermOptions: {
				cursorBlink: false,
			},
		})
	})

	it('base profile changed, font size and xterm options remained the same, command changed', () => {
		const profile = {
			command: 'somecommand',
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
			xtermOptions: {
				cursorBlink: true,
			},
		}
		const newBaseProfile = this.element.profilesSingleton.deepClone(profile)
		newBaseProfile.command = 'someothercommand'
		spyOn(this.element.model, 'getProfile').and.returnValue(profile)
		spyOn(this.element.model, 'applyProfileChanges')
		this.element.profilesSingleton.emitter.emit(
			'did-reset-base-profile',
			newBaseProfile,
		)
		expect(this.element.model.applyProfileChanges).toHaveBeenCalledWith({})
	})
})
