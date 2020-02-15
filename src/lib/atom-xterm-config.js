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

import os from 'os'
import path from 'path'

export const COLORS = {
	foreground: 'colorForeground',
	background: 'colorBackground',
	cursor: 'colorCursor',
	cursorAccent: 'colorCursorAccent',
	selection: 'colorSelection',
	black: 'colorBlack',
	red: 'colorRed',
	green: 'colorGreen',
	yellow: 'colorYellow',
	blue: 'colorBlue',
	magenta: 'colorMagenta',
	cyan: 'colorCyan',
	white: 'colorWhite',
	brightBlack: 'colorBrightBlack',
	brightRed: 'colorBrightRed',
	brightGreen: 'colorBrightGreen',
	brightYellow: 'colorBrightYellow',
	brightBlue: 'colorBrightBlue',
	brightMagenta: 'colorBrightMagenta',
	brightCyan: 'colorBrightCyan',
	brightWhite: 'colorBrightWhite',
}

export const configDefaults = {

	getDefaultShellCommand () {
		if (process.platform === 'win32') {
			return process.env.COMSPEC || 'cmd.exe'
		}
		return process.env.SHELL || '/bin/sh'
	},

	getDefaultArgs () {
		return '[]'
	},

	getDefaultTermType () {
		return process.env.TERM || 'xterm-256color'
	},

	getDefaultCwd () {
		if (process.platform === 'win32') {
			return process.env.USERPROFILE
		}
		return process.env.HOME
	},

	getDefaultEnv () {
		return ''
	},

	getDefaultSetEnv () {
		return '{}'
	},

	getDefaultDeleteEnv () {
		return '[]'
	},

	getDefaultEncoding () {
		return ''
	},

	getDefaultFontSize () {
		return 14
	},

	getMinimumFontSize () {
		// NOTE: Atom will crash if the font is set below 8.
		return 8
	},

	getMaximumFontSize () {
		return 100
	},

	getDefaultFontFamily () {
		return 'monospace'
	},

	getDefaultTheme () {
		return 'Custom'
	},

	getDefaultColorForeground () {
		return '#ffffff'
	},

	getDefaultColorBackground () {
		return '#000000'
	},

	getDefaultColorCursor () {
		return '#ffffff'
	},

	getDefaultColorCursorAccent () {
		return '#000000'
	},

	getDefaultColorSelection () {
		return '#4d4d4d'
	},

	getDefaultColorBlack () {
		return '#2e3436'
	},

	getDefaultColorRed () {
		return '#cc0000'
	},

	getDefaultColorGreen () {
		return '#4e9a06'
	},

	getDefaultColorYellow () {
		return '#c4a000'
	},

	getDefaultColorBlue () {
		return '#3465a4'
	},

	getDefaultColorMagenta () {
		return '#75507b'
	},

	getDefaultColorCyan () {
		return '#06989a'
	},

	getDefaultColorWhite () {
		return '#d3d7cf'
	},

	getDefaultColorBrightBlack () {
		return '#555753'
	},

	getDefaultColorBrightRed () {
		return '#ef2929'
	},

	getDefaultColorBrightGreen () {
		return '#8ae234'
	},

	getDefaultColorBrightYellow () {
		return '#fce94f'
	},

	getDefaultColorBrightBlue () {
		return '#729fcf'
	},

	getDefaultColorBrightMagenta () {
		return '#ad7fa8'
	},

	getDefaultColorBrightCyan () {
		return '#34e2e2'
	},

	getDefaultColorBrightWhite () {
		return '#eeeeec'
	},

	getDefaultLeaveOpenAfterExit () {
		return true
	},

	getDefaultAllowRelaunchingTerminalsOnStartup () {
		return true
	},

	getDefaultRelaunchTerminalOnStartup () {
		return true
	},

	getUserDataPath () {
		let appDataPath
		if (process.platform === 'win32') {
			appDataPath = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
		} else if (process.platform === 'darwin') {
			appDataPath = path.join(os.homedir(), 'Library', 'Application Support')
		} else {
			appDataPath = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config')
		}
		return path.join(appDataPath, 'atom-xterm')
	},

	getDefaultTitle () {
		return ''
	},

	getDefaultXtermOptions () {
		return '{}'
	},

	getDefaultPromptToStartup () {
		return false
	},
}

function configOrder (obj) {
	let order = 1
	for (const name in obj) {
		obj[name].order = order++
		if (obj[name].type === 'object' && 'properties' in obj[name]) {
			configOrder(obj[name].properties)
		}
	}
	return obj
}

export const config = configOrder({
	spawnPtySettings: {
		title: 'Shell Process Settings',
		description: 'Settings related to the process running the shell.',
		type: 'object',
		properties: {
			command: {
				title: 'Command',
				description: 'Command to run',
				type: 'string',
				default: configDefaults.getDefaultShellCommand(),
			},
			args: {
				title: 'Arguments',
				description: 'Arguments to pass to command, must be in a JSON array.',
				type: 'string',
				default: configDefaults.getDefaultArgs(),
			},
			name: {
				title: 'Terminal Type',
				description: 'The terminal type to use.',
				type: 'string',
				default: configDefaults.getDefaultTermType(),
			},
			cwd: {
				title: 'Working Directory',
				description: 'The working directory to use when launching command.',
				type: 'string',
				default: configDefaults.getDefaultCwd(),
			},
			env: {
				title: 'Environment',
				description: 'The environment to use when launching command, must be in a JSON object. If not set, defaults to the current environment.',
				type: 'string',
				default: configDefaults.getDefaultEnv(),
			},
			setEnv: {
				title: 'Environment Overrides',
				description: 'Environment variables to use in place of the atom process environment, must be in a JSON object.',
				type: 'string',
				default: configDefaults.getDefaultSetEnv(),
			},
			deleteEnv: {
				title: 'Environment Deletions',
				description: 'Environment variables to delete from original environment, must be in a JSON array.',
				type: 'string',
				default: configDefaults.getDefaultDeleteEnv(),
			},
			encoding: {
				title: 'Character Encoding',
				description: 'Character encoding to use in spawned terminal.',
				type: 'string',
				default: configDefaults.getDefaultEncoding(),
			},
		},
	},
	terminalSettings: {
		title: 'Terminal Emulator Settings',
		description: 'Settings for the terminal emulator.',
		type: 'object',
		properties: {
			fontSize: {
				title: 'Font Size',
				description: 'Font size used in terminal emulator.',
				type: 'integer',
				default: configDefaults.getDefaultFontSize(),
				minimum: configDefaults.getMinimumFontSize(),
				maximum: configDefaults.getMaximumFontSize(),
			},
			fontFamily: {
				title: 'Font Family',
				description: 'Font family used in terminal emulator.',
				type: 'string',
				default: configDefaults.getDefaultFontFamily(),
			},
			colors: {
				title: 'Colors',
				description: 'Settings for the terminal colors.',
				type: 'object',
				properties: {
					theme: {
						title: 'Theme',
						description: 'Theme used in terminal emulator.',
						type: 'string',
						enum: [
							'Custom',
							'Atom Dark',
							'Atom Light',
							'Base16 Tomorrow Dark',
							'Base16 Tomorrow Light',
							'Christmas',
							'City Lights',
							'Dracula',
							'Grass',
							'Homebrew',
							'Inverse',
							'Linux',
							'Man Page',
							'Novel',
							'Ocean',
							'One Dark',
							'One Light',
							'Predawn',
							'Pro',
							'Red Sands',
							'Red',
							'Silver Aerogel',
							'Solarized Dark',
							'Solarized Light',
							'Solid Colors',
							'Standard',
						],
						default: configDefaults.getDefaultTheme(),
					},
					foreground: {
						title: 'Text Color',
						description: 'This will be overridden if the theme is not \'Custom\'.',
						type: 'color',
						default: configDefaults.getDefaultColorForeground(),
					},
					background: {
						title: 'Background Color',
						description: 'This will be overridden if the theme is not \'Custom\'.',
						type: 'color',
						default: configDefaults.getDefaultColorBackground(),
					},
					cursor: {
						title: 'Cursor Color',
						description: 'Can be transparent. This will be overridden if the theme is not \'Custom\'.',
						type: 'color',
						default: configDefaults.getDefaultColorCursor(),
					},
					cursorAccent: {
						title: 'Cursor Text Color',
						description: 'Can be transparent. This will be overridden if the theme is not \'Custom\'.',
						type: 'color',
						default: configDefaults.getDefaultColorCursorAccent(),
					},
					selection: {
						title: 'Selection Background Color',
						description: 'Can be transparent. This will be overridden if the theme is not \'Custom\'.',
						type: 'color',
						default: configDefaults.getDefaultColorSelection(),
					},
					black: {
						title: 'ANSI Black',
						description: '`\\x1b[30m`',
						type: 'color',
						default: configDefaults.getDefaultColorBlack(),
					},
					red: {
						title: 'ANSI Red',
						description: '`\\x1b[31m`',
						type: 'color',
						default: configDefaults.getDefaultColorRed(),
					},
					green: {
						title: 'ANSI Green',
						description: '`\\x1b[32m`',
						type: 'color',
						default: configDefaults.getDefaultColorGreen(),
					},
					yellow: {
						title: 'ANSI Yellow',
						description: '`\\x1b[33m`',
						type: 'color',
						default: configDefaults.getDefaultColorYellow(),
					},
					blue: {
						title: 'ANSI Blue',
						description: '`\\x1b[34m`',
						type: 'color',
						default: configDefaults.getDefaultColorBlue(),
					},
					magenta: {
						title: 'ANSI Magenta',
						description: '`\\x1b[35m`',
						type: 'color',
						default: configDefaults.getDefaultColorMagenta(),
					},
					cyan: {
						title: 'ANSI Cyan',
						description: '`\\x1b[36m`',
						type: 'color',
						default: configDefaults.getDefaultColorCyan(),
					},
					white: {
						title: 'ANSI White',
						description: '`\\x1b[37m`',
						type: 'color',
						default: configDefaults.getDefaultColorWhite(),
					},
					brightBlack: {
						title: 'ANSI Bright Black',
						description: '`\\x1b[1;30m`',
						type: 'color',
						default: configDefaults.getDefaultColorBrightBlack(),
					},
					brightRed: {
						title: 'ANSI Bright Red',
						description: '`\\x1b[1;31m`',
						type: 'color',
						default: configDefaults.getDefaultColorBrightRed(),
					},
					brightGreen: {
						title: 'ANSI Bright Green',
						description: '`\\x1b[1;32m`',
						type: 'color',
						default: configDefaults.getDefaultColorBrightGreen(),
					},
					brightYellow: {
						title: 'ANSI Bright Yellow',
						description: '`\\x1b[1;33m`',
						type: 'color',
						default: configDefaults.getDefaultColorBrightYellow(),
					},
					brightBlue: {
						title: 'ANSI Bright Blue',
						description: '`\\x1b[1;34m`',
						type: 'color',
						default: configDefaults.getDefaultColorBrightBlue(),
					},
					brightMagenta: {
						title: 'ANSI Bright Magenta',
						description: '`\\x1b[1;35m`',
						type: 'color',
						default: configDefaults.getDefaultColorBrightMagenta(),
					},
					brightCyan: {
						title: 'ANSI Bright Cyan',
						description: '`\\x1b[1;36m`',
						type: 'color',
						default: configDefaults.getDefaultColorBrightCyan(),
					},
					brightWhite: {
						title: 'ANSI Bright White',
						description: '`\\x1b[1;37m`',
						type: 'color',
						default: configDefaults.getDefaultColorBrightWhite(),
					},
				},
			},
			leaveOpenAfterExit: {
				title: 'Leave Open After Exit',
				description: 'Whether to leave terminal emulators open after their shell processes have exited.',
				type: 'boolean',
				default: configDefaults.getDefaultLeaveOpenAfterExit(),
			},
			allowRelaunchingTerminalsOnStartup: {
				title: 'Allow relaunching terminals on startup',
				description: 'Whether to allow relaunching terminals on startup.',
				type: 'boolean',
				default: configDefaults.getDefaultAllowRelaunchingTerminalsOnStartup(),
			},
			relaunchTerminalOnStartup: {
				title: 'Relaunch terminal on startup',
				description: 'Whether to relaunch terminal on startup.',
				type: 'boolean',
				default: configDefaults.getDefaultRelaunchTerminalOnStartup(),
			},
			title: {
				title: 'Terminal tab title',
				description: 'Title to use for terminal tabs.',
				type: 'string',
				default: configDefaults.getDefaultTitle(),
			},
			xtermOptions: {
				title: 'xterm.js Terminal Options',
				description: 'Options to apply to xterm.js Terminal objects. (https://xtermjs.org/docs/api/terminal/interfaces/iterminaloptions/#properties)',
				type: 'string',
				default: configDefaults.getDefaultXtermOptions(),
			},
			promptToStartup: {
				title: 'Prompt to start command',
				description: 'Whether to prompt to start command in terminal on startup.',
				type: 'boolean',
				default: configDefaults.getDefaultPromptToStartup(),
			},
		},
	},
})
