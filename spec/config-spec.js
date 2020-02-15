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

import { configDefaults } from '../src/lib/config'

import os from 'os'
import path from 'path'

describe('Call to getDefaultShellCommand()', () => {
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
		expect(configDefaults.getDefaultShellCommand()).toBe('cmd.exe')
	})

	it('on win32 with COMSPEC set', () => {
		Object.defineProperty(process, 'platform', {
			value: 'win32',
		})
		const expected = 'somecommand.exe'
		process.env.COMSPEC = expected
		expect(configDefaults.getDefaultShellCommand()).toBe(expected)
	})

	it('on linux without SHELL set', () => {
		Object.defineProperty(process, 'platform', {
			value: 'linux',
		})
		if (process.env.SHELL) {
			delete process.env.SHELL
		}
		expect(configDefaults.getDefaultShellCommand()).toBe('/bin/sh')
	})

	it('on linux with SHELL set', () => {
		Object.defineProperty(process, 'platform', {
			value: 'linux',
		})
		const expected = 'somecommand'
		process.env.SHELL = expected
		expect(configDefaults.getDefaultShellCommand()).toBe(expected)
	})
})

describe('Call to getDefaultArgs()', () => {
	it('return []', () => {
		expect(configDefaults.getDefaultArgs()).toBe('[]')
	})
})

describe('Call to getDefaultTermType()', () => {
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
		expect(configDefaults.getDefaultTermType()).toBe('xterm-256color')
	})

	it('with TERM set', () => {
		const expected = 'sometermtype'
		process.env.TERM = expected
		expect(configDefaults.getDefaultTermType()).toBe(expected)
	})
})

describe('Call to getDefaultCwd()', () => {
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
		expect(configDefaults.getDefaultCwd()).toBe(expected)
	})

	it('on linux', () => {
		Object.defineProperty(process, 'platform', {
			value: 'linux',
		})
		const expected = '/some/dir'
		process.env.HOME = expected
		expect(configDefaults.getDefaultCwd()).toBe(expected)
	})
})

describe('Call to getDefaultEnv()', () => {
	it('return \'\'', () => {
		expect(configDefaults.getDefaultEnv()).toBe('')
	})
})

describe('Call to getDefaultSetEnv()', () => {
	it('return {}', () => {
		expect(configDefaults.getDefaultSetEnv()).toBe('{}')
	})
})

describe('Call to getDefaultDeleteEnv()', () => {
	it('return []', () => {
		expect(configDefaults.getDefaultDeleteEnv()).toBe('[]')
	})
})

describe('Call to getDefaultEncoding()', () => {
	it('return \'\'', () => {
		expect(configDefaults.getDefaultEncoding()).toBe('')
	})
})

describe('Call to getDefaultFontSize()', () => {
	it('return 14', () => {
		expect(configDefaults.getDefaultFontSize()).toBe(14)
	})
})

describe('Call to getMinimumFontSize()', () => {
	it('return 8', () => {
		expect(configDefaults.getMinimumFontSize()).toBe(8)
	})
})

describe('Call to getMaximumFontSize()', () => {
	it('return 100', () => {
		expect(configDefaults.getMaximumFontSize()).toBe(100)
	})
})

describe('Call to getDefaultFontFamily()', () => {
	it('return \'monospace\'', () => {
		expect(configDefaults.getDefaultFontFamily()).toBe('monospace')
	})
})

describe('Call to getDefaultTheme()', () => {
	it('return \'Custom\'', () => {
		expect(configDefaults.getDefaultTheme()).toBe('Custom')
	})
})

describe('Call to getDefaultColorForeground()', () => {
	it('return \'#ffffff\'', () => {
		expect(configDefaults.getDefaultColorForeground()).toBe('#ffffff')
	})
})

describe('Call to getDefaultColorBackground()', () => {
	it('return \'#000000\'', () => {
		expect(configDefaults.getDefaultColorBackground()).toBe('#000000')
	})
})

describe('Call to getDefaultColorCursor()', () => {
	it('return \'#ffffff\'', () => {
		expect(configDefaults.getDefaultColorCursor()).toBe('#ffffff')
	})
})

describe('Call to getDefaultColorCursorAccent()', () => {
	it('return \'#000000\'', () => {
		expect(configDefaults.getDefaultColorCursorAccent()).toBe('#000000')
	})
})

describe('Call to getDefaultColorSelection()', () => {
	it('return \'#4d4d4d\'', () => {
		expect(configDefaults.getDefaultColorSelection()).toBe('#4d4d4d')
	})
})

describe('Call to getDefaultColorBlack()', () => {
	it('return \'#2e3436\'', () => {
		expect(configDefaults.getDefaultColorBlack()).toBe('#2e3436')
	})
})

describe('Call to getDefaultColorRed()', () => {
	it('return \'#cc0000\'', () => {
		expect(configDefaults.getDefaultColorRed()).toBe('#cc0000')
	})
})

describe('Call to getDefaultColorGreen()', () => {
	it('return \'#4e9a06\'', () => {
		expect(configDefaults.getDefaultColorGreen()).toBe('#4e9a06')
	})
})

describe('Call to getDefaultColorYellow()', () => {
	it('return \'#c4a000\'', () => {
		expect(configDefaults.getDefaultColorYellow()).toBe('#c4a000')
	})
})

describe('Call to getDefaultColorBlue()', () => {
	it('return \'#3465a4\'', () => {
		expect(configDefaults.getDefaultColorBlue()).toBe('#3465a4')
	})
})

describe('Call to getDefaultColorMagenta()', () => {
	it('return \'#75507b\'', () => {
		expect(configDefaults.getDefaultColorMagenta()).toBe('#75507b')
	})
})

describe('Call to getDefaultColorCyan()', () => {
	it('return \'#06989a\'', () => {
		expect(configDefaults.getDefaultColorCyan()).toBe('#06989a')
	})
})

describe('Call to getDefaultColorWhite()', () => {
	it('return \'#d3d7cf\'', () => {
		expect(configDefaults.getDefaultColorWhite()).toBe('#d3d7cf')
	})
})

describe('Call to getDefaultColorBrightBlack()', () => {
	it('return \'#555753\'', () => {
		expect(configDefaults.getDefaultColorBrightBlack()).toBe('#555753')
	})
})

describe('Call to getDefaultColorBrightRed()', () => {
	it('return \'#ef2929\'', () => {
		expect(configDefaults.getDefaultColorBrightRed()).toBe('#ef2929')
	})
})

describe('Call to getDefaultColorBrightGreen()', () => {
	it('return \'#8ae234\'', () => {
		expect(configDefaults.getDefaultColorBrightGreen()).toBe('#8ae234')
	})
})

describe('Call to getDefaultColorBrightYellow()', () => {
	it('return \'#fce94f\'', () => {
		expect(configDefaults.getDefaultColorBrightYellow()).toBe('#fce94f')
	})
})

describe('Call to getDefaultColorBrightBlue()', () => {
	it('return \'#729fcf\'', () => {
		expect(configDefaults.getDefaultColorBrightBlue()).toBe('#729fcf')
	})
})

describe('Call to getDefaultColorBrightMagenta()', () => {
	it('return \'#ad7fa8\'', () => {
		expect(configDefaults.getDefaultColorBrightMagenta()).toBe('#ad7fa8')
	})
})

describe('Call to getDefaultColorBrightCyan()', () => {
	it('return \'#34e2e2\'', () => {
		expect(configDefaults.getDefaultColorBrightCyan()).toBe('#34e2e2')
	})
})

describe('Call to getDefaultColorBrightWhite()', () => {
	it('return \'#eeeeec\'', () => {
		expect(configDefaults.getDefaultColorBrightWhite()).toBe('#eeeeec')
	})
})

describe('Call to getDefaultLeaveOpenAfterExit()', () => {
	it('return true', () => {
		expect(configDefaults.getDefaultLeaveOpenAfterExit()).toBe(true)
	})
})

describe('Call to getDefaultAllowRelaunchingTerminalsOnStartup()', () => {
	it('return true', () => {
		expect(configDefaults.getDefaultAllowRelaunchingTerminalsOnStartup()).toBe(true)
	})
})

describe('Call to getDefaultRelaunchTerminalOnStartup()', () => {
	it('return true', () => {
		expect(configDefaults.getDefaultRelaunchTerminalOnStartup()).toBe(true)
	})
})

describe('Call to getDefaultXtermOptions()', () => {
	it('return {}', () => {
		expect(configDefaults.getDefaultXtermOptions()).toBe('{}')
	})
})

describe('Call to getUserDataPath()', () => {
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
		const expected = path.join(os.homedir(), 'AppData', 'Roaming', 'atom-xterm')
		expect(configDefaults.getUserDataPath()).toBe(expected)
	})

	it('on win32 with APPDATA set', () => {
		Object.defineProperty(process, 'platform', {
			value: 'win32',
		})
		process.env.APPDATA = path.join('/some', 'dir')
		const expected = path.join(process.env.APPDATA, 'atom-xterm')
		expect(configDefaults.getUserDataPath()).toBe(expected)
	})

	it('on darwin', () => {
		Object.defineProperty(process, 'platform', {
			value: 'darwin',
		})
		const expected = path.join(os.homedir(), 'Library', 'Application Support', 'atom-xterm')
		expect(configDefaults.getUserDataPath()).toBe(expected)
	})

	it('on linux without XDG_CONFIG_HOME set', () => {
		Object.defineProperty(process, 'platform', {
			value: 'linux',
		})
		if (process.env.XDG_CONFIG_HOME) {
			delete process.env.XDG_CONFIG_HOME
		}
		const expected = path.join(os.homedir(), '.config', 'atom-xterm')
		expect(configDefaults.getUserDataPath()).toBe(expected)
	})

	it('on linux with XDG_CONFIG_HOME set', () => {
		Object.defineProperty(process, 'platform', {
			value: 'linux',
		})
		process.env.XDG_CONFIG_HOME = path.join('/some', 'dir')
		const expected = path.join(process.env.XDG_CONFIG_HOME, 'atom-xterm')
		expect(configDefaults.getUserDataPath()).toBe(expected)
	})
})

describe('Call to getDefaultTitle()', () => {
	it('return \'\'', () => {
		expect(configDefaults.getDefaultTitle()).toBe('')
	})
})

describe('Call to getDefaultPromptToStartup()', () => {
	it('return false', () => {
		expect(configDefaults.getDefaultPromptToStartup()).toBe(false)
	})
})
