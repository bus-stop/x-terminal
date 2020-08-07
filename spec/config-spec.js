/** @babel */
/*
 * Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Copyright 2017-2018 Andres Mejia <amejia004@gmail.com>. All Rights Reserved.
 * Copyright (c) 2020 bus-stop All Rights Reserved.
 * Copyright (c) 2020 UziTech All Rights Reserved.
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

import { configDefaults, resetConfigDefaults } from '../src/config'

import os from 'os'
import path from 'path'

describe('Call to shellCommand()', () => {
	const savedPlatform = process.platform
	let savedEnv

	beforeEach(() => {
		savedEnv = JSON.parse(JSON.stringify(process.env))
	})

	afterEach(() => {
		process.env = savedEnv
		Object.defineProperty(process, 'platform', {
			value: savedPlatform,
		})
	})

	it('on win32 without COMSPEC set', () => {
		Object.defineProperty(process, 'platform', {
			value: 'win32',
		})
		if (process.env.COMSPEC) {
			delete process.env.COMSPEC
		}
		expect(resetConfigDefaults().command).toBe('cmd.exe')
	})

	it('on win32 with COMSPEC set', () => {
		Object.defineProperty(process, 'platform', {
			value: 'win32',
		})
		const expected = 'somecommand.exe'
		process.env.COMSPEC = expected
		expect(resetConfigDefaults().command).toBe(expected)
	})

	it('on linux without SHELL set', () => {
		Object.defineProperty(process, 'platform', {
			value: 'linux',
		})
		if (process.env.SHELL) {
			delete process.env.SHELL
		}
		expect(resetConfigDefaults().command).toBe('/bin/sh')
	})

	it('on linux with SHELL set', () => {
		Object.defineProperty(process, 'platform', {
			value: 'linux',
		})
		const expected = 'somecommand'
		process.env.SHELL = expected
		expect(resetConfigDefaults().command).toBe(expected)
	})
})

describe('Call to args()', () => {
	it('return []', () => {
		expect(configDefaults.args).toBe('[]')
	})
})

describe('Call to termType()', () => {
	let savedEnv

	beforeEach(() => {
		savedEnv = JSON.parse(JSON.stringify(process.env))
	})

	afterEach(() => {
		process.env = savedEnv
	})

	it('without TERM set', () => {
		if (process.env.TERM) {
			delete process.env.TERM
		}
		expect(resetConfigDefaults().termType).toBe('xterm-256color')
	})

	it('with TERM set', () => {
		const expected = 'sometermtype'
		process.env.TERM = expected
		expect(resetConfigDefaults().termType).toBe(expected)
	})
})

describe('Call to cwd()', () => {
	const savedPlatform = process.platform
	let savedEnv

	beforeEach(() => {
		savedEnv = JSON.parse(JSON.stringify(process.env))
	})

	afterEach(() => {
		process.env = savedEnv
		Object.defineProperty(process, 'platform', {
			value: savedPlatform,
		})
	})

	it('on win32', () => {
		Object.defineProperty(process, 'platform', {
			value: 'win32',
		})
		const expected = 'C:\\some\\dir'
		process.env.USERPROFILE = expected
		expect(resetConfigDefaults().cwd).toBe(expected)
	})

	it('on linux', () => {
		Object.defineProperty(process, 'platform', {
			value: 'linux',
		})
		const expected = '/some/dir'
		process.env.HOME = expected
		expect(resetConfigDefaults().cwd).toBe(expected)
	})
})

describe('Call to env()', () => {
	it('return \'\'', () => {
		expect(configDefaults.env).toBe('')
	})
})

describe('Call to setEnv()', () => {
	it('return {}', () => {
		expect(configDefaults.setEnv).toBe('{}')
	})
})

describe('Call to deleteEnv()', () => {
	it('return []', () => {
		expect(configDefaults.deleteEnv).toBe('["NODE_ENV"]')
	})
})

describe('Call to encoding()', () => {
	it('return \'\'', () => {
		expect(configDefaults.encoding).toBe('')
	})
})

describe('Call to fontSize()', () => {
	it('return 14', () => {
		expect(configDefaults.fontSize).toBe(14)
	})
})

describe('Call to minimumFontSize', () => {
	it('return 8', () => {
		expect(configDefaults.minimumFontSize).toBe(8)
	})
})

describe('Call to maximumFontSize', () => {
	it('return 100', () => {
		expect(configDefaults.maximumFontSize).toBe(100)
	})
})

describe('Call to fontFamily()', () => {
	it('return \'monospace\'', () => {
		expect(configDefaults.fontFamily).toBe('monospace')
	})
})

describe('Call to theme()', () => {
	it('return \'Custom\'', () => {
		expect(configDefaults.theme).toBe('Custom')
	})
})

describe('Call to colorForeground()', () => {
	it('return \'#ffffff\'', () => {
		expect(configDefaults.colorForeground).toBe('#ffffff')
	})
})

describe('Call to colorBackground()', () => {
	it('return \'#000000\'', () => {
		expect(configDefaults.colorBackground).toBe('#000000')
	})
})

describe('Call to colorCursor()', () => {
	it('return \'#ffffff\'', () => {
		expect(configDefaults.colorCursor).toBe('#ffffff')
	})
})

describe('Call to colorCursorAccent()', () => {
	it('return \'#000000\'', () => {
		expect(configDefaults.colorCursorAccent).toBe('#000000')
	})
})

describe('Call to colorSelection()', () => {
	it('return \'#4d4d4d\'', () => {
		expect(configDefaults.colorSelection).toBe('#4d4d4d')
	})
})

describe('Call to colorBlack()', () => {
	it('return \'#2e3436\'', () => {
		expect(configDefaults.colorBlack).toBe('#2e3436')
	})
})

describe('Call to colorRed()', () => {
	it('return \'#cc0000\'', () => {
		expect(configDefaults.colorRed).toBe('#cc0000')
	})
})

describe('Call to colorGreen()', () => {
	it('return \'#4e9a06\'', () => {
		expect(configDefaults.colorGreen).toBe('#4e9a06')
	})
})

describe('Call to colorYellow()', () => {
	it('return \'#c4a000\'', () => {
		expect(configDefaults.colorYellow).toBe('#c4a000')
	})
})

describe('Call to colorBlue()', () => {
	it('return \'#3465a4\'', () => {
		expect(configDefaults.colorBlue).toBe('#3465a4')
	})
})

describe('Call to colorMagenta()', () => {
	it('return \'#75507b\'', () => {
		expect(configDefaults.colorMagenta).toBe('#75507b')
	})
})

describe('Call to colorCyan()', () => {
	it('return \'#06989a\'', () => {
		expect(configDefaults.colorCyan).toBe('#06989a')
	})
})

describe('Call to colorWhite()', () => {
	it('return \'#d3d7cf\'', () => {
		expect(configDefaults.colorWhite).toBe('#d3d7cf')
	})
})

describe('Call to colorBrightBlack()', () => {
	it('return \'#555753\'', () => {
		expect(configDefaults.colorBrightBlack).toBe('#555753')
	})
})

describe('Call to colorBrightRed()', () => {
	it('return \'#ef2929\'', () => {
		expect(configDefaults.colorBrightRed).toBe('#ef2929')
	})
})

describe('Call to colorBrightGreen()', () => {
	it('return \'#8ae234\'', () => {
		expect(configDefaults.colorBrightGreen).toBe('#8ae234')
	})
})

describe('Call to colorBrightYellow()', () => {
	it('return \'#fce94f\'', () => {
		expect(configDefaults.colorBrightYellow).toBe('#fce94f')
	})
})

describe('Call to colorBrightBlue()', () => {
	it('return \'#729fcf\'', () => {
		expect(configDefaults.colorBrightBlue).toBe('#729fcf')
	})
})

describe('Call to colorBrightMagenta()', () => {
	it('return \'#ad7fa8\'', () => {
		expect(configDefaults.colorBrightMagenta).toBe('#ad7fa8')
	})
})

describe('Call to colorBrightCyan()', () => {
	it('return \'#34e2e2\'', () => {
		expect(configDefaults.colorBrightCyan).toBe('#34e2e2')
	})
})

describe('Call to colorBrightWhite()', () => {
	it('return \'#eeeeec\'', () => {
		expect(configDefaults.colorBrightWhite).toBe('#eeeeec')
	})
})

describe('Call to allowHiddenToStayActive()', () => {
	it('return false', () => {
		expect(configDefaults.allowHiddenToStayActive).toBe(false)
	})
})
describe('Call to runInActive()', () => {
	it('return false', () => {
		expect(configDefaults.runInActive).toBe(false)
	})
})

describe('Call to leaveOpenAfterExit()', () => {
	it('return true', () => {
		expect(configDefaults.leaveOpenAfterExit).toBe(true)
	})
})

describe('Call to allowRelaunchingTerminalsOnStartup()', () => {
	it('return true', () => {
		expect(configDefaults.allowRelaunchingTerminalsOnStartup).toBe(true)
	})
})

describe('Call to relaunchTerminalOnStartup()', () => {
	it('return true', () => {
		expect(configDefaults.relaunchTerminalOnStartup).toBe(true)
	})
})

describe('Call to xtermOptions()', () => {
	it('return {}', () => {
		expect(configDefaults.xtermOptions).toBe('{}')
	})
})

describe('Call to userDataPath()', () => {
	const savedPlatform = process.platform
	let savedEnv

	beforeEach(() => {
		savedEnv = JSON.parse(JSON.stringify(process.env))
	})

	afterEach(() => {
		process.env = savedEnv
		Object.defineProperty(process, 'platform', {
			value: savedPlatform,
		})
	})

	it('on win32 without APPDATA set', () => {
		Object.defineProperty(process, 'platform', {
			value: 'win32',
		})
		if (process.env.APPDATA) {
			delete process.env.APPDATA
		}
		const expected = path.join(os.homedir(), 'AppData', 'Roaming', 'x-terminal')
		expect(resetConfigDefaults().userDataPath).toBe(expected)
	})

	it('on win32 with APPDATA set', () => {
		Object.defineProperty(process, 'platform', {
			value: 'win32',
		})
		process.env.APPDATA = path.join('/some', 'dir')
		const expected = path.join(process.env.APPDATA, 'x-terminal')
		expect(resetConfigDefaults().userDataPath).toBe(expected)
	})

	it('on darwin', () => {
		Object.defineProperty(process, 'platform', {
			value: 'darwin',
		})
		const expected = path.join(os.homedir(), 'Library', 'Application Support', 'x-terminal')
		expect(resetConfigDefaults().userDataPath).toBe(expected)
	})

	it('on linux without XDG_CONFIG_HOME set', () => {
		Object.defineProperty(process, 'platform', {
			value: 'linux',
		})
		if (process.env.XDG_CONFIG_HOME) {
			delete process.env.XDG_CONFIG_HOME
		}
		const expected = path.join(os.homedir(), '.config', 'x-terminal')
		expect(resetConfigDefaults().userDataPath).toBe(expected)
	})

	it('on linux with XDG_CONFIG_HOME set', () => {
		Object.defineProperty(process, 'platform', {
			value: 'linux',
		})
		process.env.XDG_CONFIG_HOME = path.join('/some', 'dir')
		const expected = path.join(process.env.XDG_CONFIG_HOME, 'x-terminal')
		expect(resetConfigDefaults().userDataPath).toBe(expected)
	})
})

describe('Call to title()', () => {
	it('return \'\'', () => {
		expect(configDefaults.title).toBe('')
	})
})

describe('Call to promptToStartup()', () => {
	it('return false', () => {
		expect(configDefaults.promptToStartup).toBe(false)
	})
})

describe('Call to apiOpenPosition()', () => {
	it('return \'Center\'', () => {
		expect(configDefaults.apiOpenPosition).toBe('Center')
	})
})
