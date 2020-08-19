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

import os from 'os'
import path from 'path'

export function resetConfigDefaults () {
	return {
		command: process.platform === 'win32' ? (process.env.COMSPEC || 'cmd.exe') : (process.env.SHELL || '/bin/sh'),
		args: '[]',
		termType: process.env.TERM || 'xterm-256color',
		cwd: process.platform === 'win32' ? process.env.USERPROFILE : process.env.HOME,
		projectCwd: false,
		webgl: false,
		webLinks: true,
		env: '',
		setEnv: '{}',
		deleteEnv: '["NODE_ENV"]',
		encoding: '',
		fontSize: 14,
		// NOTE: Atom will crash if the font is set below 8.
		minimumFontSize: 8,
		maximumFontSize: 100,
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
		allowHiddenToStayActive: false,
		runInActive: false,
		leaveOpenAfterExit: true,
		allowRelaunchingTerminalsOnStartup: true,
		relaunchTerminalOnStartup: true,
		userDataPath: (() => {
			let appDataPath
			if (process.platform === 'win32') {
				appDataPath = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
			} else if (process.platform === 'darwin') {
				appDataPath = path.join(os.homedir(), 'Library', 'Application Support')
			} else {
				appDataPath = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config')
			}
			return path.join(appDataPath, 'x-terminal')
		})(),
		title: '',
		xtermOptions: '{}',
		promptToStartup: false,
		copyOnSelect: false,
		apiOpenPosition: 'Center',
	}
}

export const configDefaults = resetConfigDefaults()

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
				default: configDefaults.command,
				profileData: {
					defaultProfile: configDefaults.command,
					toUrlParam: (val) => val,
					fromUrlParam: (val) => val,
					checkUrlParam: (val) => true,
					toBaseProfile: (previousValue) => (atom.config.get('x-terminal.spawnPtySettings.command') || configDefaults.command),
					fromMenuSetting: (element, baseValue) => (element.getModel().getText() || baseValue),
					toMenuSetting: (val) => val,
				},
			},
			args: {
				title: 'Arguments',
				description: 'Arguments to pass to command, must be in a [JSON array](https://www.w3schools.com/JS/js_json_arrays.asp).',
				type: 'string',
				default: configDefaults.args,
				profileData: {
					defaultProfile: JSON.parse(configDefaults.args),
					toUrlParam: (val) => JSON.stringify(val),
					fromUrlParam: (val) => JSON.parse(val),
					checkUrlParam: (val) => !!val,
					toBaseProfile: (previousValue) => validateJsonConfigSetting('x-terminal.spawnPtySettings.args', configDefaults.args, previousValue),
					fromMenuSetting: (element, baseValue) => parseJson(element.getModel().getText(), baseValue, Array),
					toMenuSetting: (val) => JSON.stringify(val),
				},
			},
			name: {
				title: 'Terminal Type',
				description: 'The terminal type to use.',
				type: 'string',
				default: configDefaults.termType,
				profileData: {
					defaultProfile: configDefaults.termType,
					toUrlParam: (val) => val,
					fromUrlParam: (val) => val,
					checkUrlParam: (val) => true,
					toBaseProfile: (previousValue) => (atom.config.get('x-terminal.spawnPtySettings.name') || configDefaults.termType),
					fromMenuSetting: (element, baseValue) => (element.getModel().getText() || baseValue),
					toMenuSetting: (val) => val,
				},
			},
			cwd: {
				title: 'Working Directory',
				description: 'The working directory to use when launching command.',
				type: 'string',
				default: configDefaults.cwd,
				profileData: {
					defaultProfile: configDefaults.cwd,
					toUrlParam: (val) => val,
					fromUrlParam: (val) => val,
					checkUrlParam: (val) => true,
					toBaseProfile: (previousValue) => (atom.config.get('x-terminal.spawnPtySettings.cwd') || configDefaults.cwd),
					fromMenuSetting: (element, baseValue) => (element.getModel().getText() || baseValue),
					toMenuSetting: (val) => val,
				},
			},
			projectCwd: {
				title: 'Use Project Directory',
				description: 'Use the first project directory when launching command.',
				type: 'boolean',
				default: configDefaults.projectCwd,
				profileData: {
					defaultProfile: configDefaults.projectCwd,
					toUrlParam: (val) => JSON.stringify(val),
					fromUrlParam: (val) => JSON.parse(val),
					checkUrlParam: (val) => (val !== null && val !== ''),
					toBaseProfile: (previousValue) => validateBooleanConfigSetting('x-terminal.spawnPtySettings.projectCwd', configDefaults.projectCwd),
					fromMenuSetting: (element, baseValue) => element.checked,
					toMenuSetting: (val) => val,
				},
			},
			env: {
				title: 'Environment',
				description: 'The environment to use when launching command, must be in a [JSON object](https://www.w3schools.com/JS/js_json_objects.asp). If not set, defaults to the current environment.',
				type: 'string',
				default: configDefaults.env,
				profileData: {
					defaultProfile: null,
					toUrlParam: (val) => JSON.stringify(val),
					fromUrlParam: (val) => JSON.parse(val),
					checkUrlParam: (val) => !!val,
					toBaseProfile: (previousValue) => {
						let env = validateJsonConfigSetting('x-terminal.spawnPtySettings.env', 'null')
						if (!env || env.constructor !== Object) {
							env = null
						}
						return env
					},
					fromMenuSetting: (element, baseValue) => parseJson(element.getModel().getText(), baseValue, Object),
					toMenuSetting: (val) => convertNullToEmptyString(val),
				},
			},
			setEnv: {
				title: 'Environment Overrides',
				description: 'Environment variables to use in place of the Atom process environment, must be in a [JSON object](https://www.w3schools.com/JS/js_json_objects.asp).',
				type: 'string',
				default: configDefaults.setEnv,
				profileData: {
					defaultProfile: JSON.parse(configDefaults.setEnv),
					toUrlParam: (val) => JSON.stringify(val),
					fromUrlParam: (val) => JSON.parse(val),
					checkUrlParam: (val) => !!val,
					toBaseProfile: (previousValue) => validateJsonConfigSetting('x-terminal.spawnPtySettings.setEnv', configDefaults.setEnv),
					fromMenuSetting: (element, baseValue) => parseJson(element.getModel().getText(), baseValue, Object),
					toMenuSetting: (val) => JSON.stringify(val),
				},
			},
			deleteEnv: {
				title: 'Environment Deletions',
				description: 'Environment variables to delete from original environment, must be in a [JSON array](https://www.w3schools.com/JS/js_json_arrays.asp).',
				type: 'string',
				default: configDefaults.deleteEnv,
				profileData: {
					defaultProfile: JSON.parse(configDefaults.deleteEnv),
					toUrlParam: (val) => JSON.stringify(val),
					fromUrlParam: (val) => JSON.parse(val),
					checkUrlParam: (val) => !!val,
					toBaseProfile: (previousValue) => validateJsonConfigSetting('x-terminal.spawnPtySettings.deleteEnv', configDefaults.deleteEnv),
					fromMenuSetting: (element, baseValue) => parseJson(element.getModel().getText(), baseValue, Array),
					toMenuSetting: (val) => JSON.stringify(val),
				},
			},
			encoding: {
				title: 'Character Encoding',
				description: 'Character encoding to use in spawned terminal.',
				type: 'string',
				default: configDefaults.encoding,
				profileData: {
					defaultProfile: null,
					toUrlParam: (val) => val,
					fromUrlParam: (val) => (val === 'null' ? null : val),
					checkUrlParam: (val) => true,
					toBaseProfile: (previousValue) => (atom.config.get('x-terminal.spawnPtySettings.encoding') || null),
					fromMenuSetting: (element, baseValue) => (element.getModel().getText() || baseValue),
					toMenuSetting: (val) => convertNullToEmptyString(val),
				},
			},
		},
	},
	xtermAddons: {
		title: 'xterm.js Addons',
		description: 'Select the xterm.js addons to enable',
		type: 'object',
		properties: {
			webgl: {
				title: 'WebGL Renderer',
				description: 'Enable the WebGL-based renderer using the xterm.js [WebGL addon](https://github.com/xtermjs/xterm.js/tree/master/addons/xterm-addon-webgl)',
				type: 'boolean',
				default: configDefaults.webgl,
				profileData: {
					defaultProfile: configDefaults.webgl,
					toUrlParam: (val) => JSON.stringify(val),
					fromUrlParam: (val) => JSON.parse(val),
					checkUrlParam: (val) => (val !== null && val !== ''),
					toBaseProfile: (previousValue) => validateBooleanConfigSetting('x-terminal.xtermAddons.webgl', configDefaults.webgl),
					fromMenuSetting: (element, baseValue) => element.checked,
					toMenuSetting: (val) => val,
				},
			},
			webLinks: {
				title: 'Web Links',
				description: 'Enable clickable web links using the xterm.js [Web links addon](https://github.com/xtermjs/xterm.js/tree/master/addons/xterm-addon-web-links)',
				type: 'boolean',
				default: configDefaults.webLinks,
				profileData: {
					defaultProfile: configDefaults.webLinks,
					toUrlParam: (val) => JSON.stringify(val),
					fromUrlParam: (val) => JSON.parse(val),
					checkUrlParam: (val) => (val !== null && val !== ''),
					toBaseProfile: (previousValue) => validateBooleanConfigSetting('x-terminal.xtermAddons.webLinks', configDefaults.webLinks),
					fromMenuSetting: (element, baseValue) => element.checked,
					toMenuSetting: (val) => val,
				},
			},
		},
	},
	terminalSettings: {
		title: 'Terminal Emulator Settings',
		description: 'Settings for the terminal emulator.',
		type: 'object',
		properties: {
			title: {
				title: 'Terminal tab title',
				description: 'Title to use for terminal tabs.',
				type: 'string',
				default: configDefaults.title,
				profileData: {
					defaultProfile: null,
					toUrlParam: (val) => val,
					fromUrlParam: (val) => (val === 'null' ? null : val),
					checkUrlParam: (val) => true,
					toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.title') || configDefaults.title || null),
					fromMenuSetting: (element, baseValue) => (element.getModel().getText() || baseValue),
					toMenuSetting: (val) => (val || ''),
				},
			},
			xtermOptions: {
				title: 'xterm.js Terminal Options',
				description: 'Options to apply to xterm.js terminal objects, must be in a [JSON object](https://www.w3schools.com/JS/js_json_objects.asp). Read more on the supported [xterm.js API properties](https://xtermjs.org/docs/api/terminal/interfaces/iterminaloptions/#properties).',
				type: 'string',
				default: configDefaults.xtermOptions,
				profileData: {
					terminalFrontEnd: true,
					defaultProfile: JSON.parse(configDefaults.xtermOptions),
					toUrlParam: (val) => JSON.stringify(val),
					fromUrlParam: (val) => JSON.parse(val),
					checkUrlParam: (val) => !!val,
					toBaseProfile: (previousValue) => validateJsonConfigSetting('x-terminal.terminalSettings.xtermOptions', configDefaults.xtermOptions, previousValue),
					fromMenuSetting: (element, baseValue) => parseJson(element.getModel().getText(), baseValue, Object),
					toMenuSetting: (val) => JSON.stringify(val),
				},
			},
			fontFamily: {
				title: 'Font Family',
				description: 'Font family used in terminal emulator.',
				type: 'string',
				default: configDefaults.fontFamily,
				profileData: {
					terminalFrontEnd: true,
					defaultProfile: configDefaults.fontFamily,
					toUrlParam: (val) => val,
					fromUrlParam: (val) => val,
					checkUrlParam: (val) => true,
					toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.fontFamily') || configDefaults.fontFamily),
					fromMenuSetting: (element, baseValue) => (element.getModel().getText() || baseValue),
					toMenuSetting: (val) => val,
				},
			},
			fontSize: {
				title: 'Font Size',
				description: 'Font size used in terminal emulator.',
				type: 'integer',
				default: configDefaults.fontSize,
				minimum: configDefaults.minimumFontSize,
				maximum: configDefaults.maximumFontSize,
				profileData: {
					terminalFrontEnd: true,
					defaultProfile: configDefaults.fontSize,
					toUrlParam: (val) => JSON.stringify(val),
					fromUrlParam: (val) => JSON.parse(val),
					checkUrlParam: (val) => !!val,
					toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.fontSize') || configDefaults.fontSize),
					fromMenuSetting: (element, baseValue) => parseJson(element.getModel().getText(), baseValue, Number),
					toMenuSetting: (val) => val,
				},
			},
			defaultOpenPosition: {
				title: 'Default Open Position',
				description: 'Position to open terminal through service API or x-terminal:open.',
				type: 'string',
				enum: [
					'Center',
					'Split Up',
					'Split Down',
					'Split Left',
					'Split Right',
					'Bottom Dock',
					'Left Dock',
					'Right Dock',
				],
				default: configDefaults.apiOpenPosition,
			},
			promptToStartup: {
				title: 'Prompt to start command',
				description: 'Whether to prompt to start command in terminal on startup.',
				type: 'boolean',
				default: configDefaults.promptToStartup,
				profileData: {
					defaultProfile: configDefaults.promptToStartup,
					toUrlParam: (val) => JSON.stringify(val),
					fromUrlParam: (val) => JSON.parse(val),
					checkUrlParam: (val) => (val !== null && val !== ''),
					toBaseProfile: (previousValue) => validateBooleanConfigSetting('x-terminal.terminalSettings.promptToStartup', configDefaults.promptToStartup),
					fromMenuSetting: (element, baseValue) => element.checked,
					toMenuSetting: (val) => val,
				},
			},
			allowHiddenToStayActive: {
				title: 'Allow Hidden Terminal To Stay Active',
				description: 'When an active terminal is hidden keep it active until another terminal is focused.',
				type: 'boolean',
				default: configDefaults.allowHiddenToStayActive,
			},
			runInActive: {
				title: 'Run in Active Terminal',
				description: 'Whether to run commands from the service API in the active terminal or in a new terminal.',
				type: 'boolean',
				default: configDefaults.runInActive,
			},
			leaveOpenAfterExit: {
				title: 'Leave Open After Exit',
				description: 'Whether to leave terminal emulators open after their shell processes have exited.',
				type: 'boolean',
				default: configDefaults.leaveOpenAfterExit,
				profileData: {
					defaultProfile: configDefaults.leaveOpenAfterExit,
					toUrlParam: (val) => JSON.stringify(val),
					fromUrlParam: (val) => JSON.parse(val),
					checkUrlParam: (val) => (val !== null && val !== ''),
					toBaseProfile: (previousValue) => validateBooleanConfigSetting('x-terminal.terminalSettings.leaveOpenAfterExit', configDefaults.leaveOpenAfterExit),
					fromMenuSetting: (element, baseValue) => element.checked,
					toMenuSetting: (val) => val,
				},
			},
			allowRelaunchingTerminalsOnStartup: {
				title: 'Allow relaunching terminals on startup',
				description: 'Whether to allow relaunching terminals on startup.',
				type: 'boolean',
				default: configDefaults.allowRelaunchingTerminalsOnStartup,
			},
			relaunchTerminalOnStartup: {
				title: 'Relaunch terminal on startup',
				description: 'Whether to relaunch terminal on startup.',
				type: 'boolean',
				default: configDefaults.relaunchTerminalOnStartup,
				profileData: {
					defaultProfile: configDefaults.relaunchTerminalOnStartup,
					toUrlParam: (val) => JSON.stringify(val),
					fromUrlParam: (val) => JSON.parse(val),
					checkUrlParam: (val) => (val !== null && val !== ''),
					toBaseProfile: (previousValue) => validateBooleanConfigSetting('x-terminal.terminalSettings.relaunchTerminalOnStartup', configDefaults.relaunchTerminalOnStartup),
					fromMenuSetting: (element, baseValue) => element.checked,
					toMenuSetting: (val) => val,
				},
			},
			copyOnSelect: {
				title: 'Copy On Select',
				description: 'Copy text to clipboard on selection.',
				type: 'boolean',
				default: configDefaults.copyOnSelect,
				profileData: {
					defaultProfile: configDefaults.copyOnSelect,
					toUrlParam: (val) => JSON.stringify(val),
					fromUrlParam: (val) => JSON.parse(val),
					checkUrlParam: (val) => (val !== null && val !== ''),
					toBaseProfile: (previousValue) => validateBooleanConfigSetting('x-terminal.terminalSettings.copyOnSelect', configDefaults.copyOnSelect),
					fromMenuSetting: (element, baseValue) => element.checked,
					toMenuSetting: (val) => val,
				},
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
						default: configDefaults.theme,
						profileData: {
							terminalFrontEnd: true,
							defaultProfile: configDefaults.theme,
							toUrlParam: (val) => val,
							fromUrlParam: (val) => val,
							checkUrlParam: (val) => true,
							toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.colors.theme') || configDefaults.theme),
							fromMenuSetting: (element, baseValue) => (element.value || baseValue),
							toMenuSetting: (val) => val,
						},
					},
					foreground: {
						title: 'Text Color',
						description: 'This will be overridden if the theme is not \'Custom\'.',
						type: 'color',
						default: configDefaults.colorForeground,
						profileData: {
							terminalFrontEnd: true,
							defaultProfile: configDefaults.colorForeground,
							toUrlParam: (val) => val,
							fromUrlParam: (val) => val,
							checkUrlParam: (val) => true,
							toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.colors.foreground') || configDefaults.colorForeground),
							fromMenuSetting: (element, baseValue) => (element.value || baseValue),
							toMenuSetting: (val) => val,
						},
					},
					background: {
						title: 'Background Color',
						description: 'This will be overridden if the theme is not \'Custom\'.',
						type: 'color',
						default: configDefaults.colorBackground,
						profileData: {
							terminalFrontEnd: true,
							defaultProfile: configDefaults.colorBackground,
							toUrlParam: (val) => val,
							fromUrlParam: (val) => val,
							checkUrlParam: (val) => true,
							toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.colors.background') || configDefaults.colorBackground),
							fromMenuSetting: (element, baseValue) => (element.value || baseValue),
							toMenuSetting: (val) => val,
						},
					},
					cursor: {
						title: 'Cursor Color',
						description: 'Can be transparent. This will be overridden if the theme is not \'Custom\'.',
						type: 'color',
						default: configDefaults.colorCursor,
						profileData: {
							terminalFrontEnd: true,
							defaultProfile: configDefaults.colorCursor,
							toUrlParam: (val) => val,
							fromUrlParam: (val) => val,
							checkUrlParam: (val) => true,
							toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.colors.cursor') || configDefaults.colorCursor),
							fromMenuSetting: (element, baseValue) => (element.value || baseValue),
							toMenuSetting: (val) => val,
						},
					},
					cursorAccent: {
						title: 'Cursor Text Color',
						description: 'Can be transparent. This will be overridden if the theme is not \'Custom\'.',
						type: 'color',
						default: configDefaults.colorCursorAccent,
						profileData: {
							terminalFrontEnd: true,
							defaultProfile: configDefaults.colorCursorAccent,
							toUrlParam: (val) => val,
							fromUrlParam: (val) => val,
							checkUrlParam: (val) => true,
							toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.colors.cursorAccent') || configDefaults.colorCursorAccent),
							fromMenuSetting: (element, baseValue) => (element.value || baseValue),
							toMenuSetting: (val) => val,
						},
					},
					selection: {
						title: 'Selection Background Color',
						description: 'Can be transparent. This will be overridden if the theme is not \'Custom\'.',
						type: 'color',
						default: configDefaults.colorSelection,
						profileData: {
							terminalFrontEnd: true,
							defaultProfile: configDefaults.colorSelection,
							toUrlParam: (val) => val,
							fromUrlParam: (val) => val,
							checkUrlParam: (val) => true,
							toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.colors.selection') || configDefaults.colorSelection),
							fromMenuSetting: (element, baseValue) => (element.value || baseValue),
							toMenuSetting: (val) => val,
						},
					},
					black: {
						title: 'ANSI Black',
						description: '`\\x1b[30m`',
						type: 'color',
						default: configDefaults.colorBlack,
						profileData: {
							terminalFrontEnd: true,
							defaultProfile: configDefaults.colorBlack,
							toUrlParam: (val) => val,
							fromUrlParam: (val) => val,
							checkUrlParam: (val) => true,
							toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.colors.black') || configDefaults.colorBlack),
							fromMenuSetting: (element, baseValue) => (element.value || baseValue),
							toMenuSetting: (val) => val,
						},
					},
					red: {
						title: 'ANSI Red',
						description: '`\\x1b[31m`',
						type: 'color',
						default: configDefaults.colorRed,
						profileData: {
							terminalFrontEnd: true,
							defaultProfile: configDefaults.colorRed,
							toUrlParam: (val) => val,
							fromUrlParam: (val) => val,
							checkUrlParam: (val) => true,
							toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.colors.red') || configDefaults.colorRed),
							fromMenuSetting: (element, baseValue) => (element.value || baseValue),
							toMenuSetting: (val) => val,
						},
					},
					green: {
						title: 'ANSI Green',
						description: '`\\x1b[32m`',
						type: 'color',
						default: configDefaults.colorGreen,
						profileData: {
							terminalFrontEnd: true,
							defaultProfile: configDefaults.colorGreen,
							toUrlParam: (val) => val,
							fromUrlParam: (val) => val,
							checkUrlParam: (val) => true,
							toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.colors.green') || configDefaults.colorGreen),
							fromMenuSetting: (element, baseValue) => (element.value || baseValue),
							toMenuSetting: (val) => val,
						},
					},
					yellow: {
						title: 'ANSI Yellow',
						description: '`\\x1b[33m`',
						type: 'color',
						default: configDefaults.colorYellow,
						profileData: {
							terminalFrontEnd: true,
							defaultProfile: configDefaults.colorYellow,
							toUrlParam: (val) => val,
							fromUrlParam: (val) => val,
							checkUrlParam: (val) => true,
							toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.colors.yellow') || configDefaults.colorYellow),
							fromMenuSetting: (element, baseValue) => (element.value || baseValue),
							toMenuSetting: (val) => val,
						},
					},
					blue: {
						title: 'ANSI Blue',
						description: '`\\x1b[34m`',
						type: 'color',
						default: configDefaults.colorBlue,
						profileData: {
							terminalFrontEnd: true,
							defaultProfile: configDefaults.colorBlue,
							toUrlParam: (val) => val,
							fromUrlParam: (val) => val,
							checkUrlParam: (val) => true,
							toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.colors.blue') || configDefaults.colorBlue),
							fromMenuSetting: (element, baseValue) => (element.value || baseValue),
							toMenuSetting: (val) => val,
						},
					},
					magenta: {
						title: 'ANSI Magenta',
						description: '`\\x1b[35m`',
						type: 'color',
						default: configDefaults.colorMagenta,
						profileData: {
							terminalFrontEnd: true,
							defaultProfile: configDefaults.colorMagenta,
							toUrlParam: (val) => val,
							fromUrlParam: (val) => val,
							checkUrlParam: (val) => true,
							toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.colors.magenta') || configDefaults.colorMagenta),
							fromMenuSetting: (element, baseValue) => (element.value || baseValue),
							toMenuSetting: (val) => val,
						},
					},
					cyan: {
						title: 'ANSI Cyan',
						description: '`\\x1b[36m`',
						type: 'color',
						default: configDefaults.colorCyan,
						profileData: {
							terminalFrontEnd: true,
							defaultProfile: configDefaults.colorCyan,
							toUrlParam: (val) => val,
							fromUrlParam: (val) => val,
							checkUrlParam: (val) => true,
							toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.colors.cyan') || configDefaults.colorCyan),
							fromMenuSetting: (element, baseValue) => (element.value || baseValue),
							toMenuSetting: (val) => val,
						},
					},
					white: {
						title: 'ANSI White',
						description: '`\\x1b[37m`',
						type: 'color',
						default: configDefaults.colorWhite,
						profileData: {
							terminalFrontEnd: true,
							defaultProfile: configDefaults.colorWhite,
							toUrlParam: (val) => val,
							fromUrlParam: (val) => val,
							checkUrlParam: (val) => true,
							toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.colors.white') || configDefaults.colorWhite),
							fromMenuSetting: (element, baseValue) => (element.value || baseValue),
							toMenuSetting: (val) => val,
						},
					},
					brightBlack: {
						title: 'ANSI Bright Black',
						description: '`\\x1b[1;30m`',
						type: 'color',
						default: configDefaults.colorBrightBlack,
						profileData: {
							terminalFrontEnd: true,
							defaultProfile: configDefaults.colorBrightBlack,
							toUrlParam: (val) => val,
							fromUrlParam: (val) => val,
							checkUrlParam: (val) => true,
							toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.colors.brightBlack') || configDefaults.colorBrightBlack),
							fromMenuSetting: (element, baseValue) => (element.value || baseValue),
							toMenuSetting: (val) => val,
						},
					},
					brightRed: {
						title: 'ANSI Bright Red',
						description: '`\\x1b[1;31m`',
						type: 'color',
						default: configDefaults.colorBrightRed,
						profileData: {
							terminalFrontEnd: true,
							defaultProfile: configDefaults.colorBrightRed,
							toUrlParam: (val) => val,
							fromUrlParam: (val) => val,
							checkUrlParam: (val) => true,
							toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.colors.brightRed') || configDefaults.colorBrightRed),
							fromMenuSetting: (element, baseValue) => (element.value || baseValue),
							toMenuSetting: (val) => val,
						},
					},
					brightGreen: {
						title: 'ANSI Bright Green',
						description: '`\\x1b[1;32m`',
						type: 'color',
						default: configDefaults.colorBrightGreen,
						profileData: {
							terminalFrontEnd: true,
							defaultProfile: configDefaults.colorBrightGreen,
							toUrlParam: (val) => val,
							fromUrlParam: (val) => val,
							checkUrlParam: (val) => true,
							toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.colors.brightGreen') || configDefaults.colorBrightGreen),
							fromMenuSetting: (element, baseValue) => (element.value || baseValue),
							toMenuSetting: (val) => val,
						},
					},
					brightYellow: {
						title: 'ANSI Bright Yellow',
						description: '`\\x1b[1;33m`',
						type: 'color',
						default: configDefaults.colorBrightYellow,
						profileData: {
							terminalFrontEnd: true,
							defaultProfile: configDefaults.colorBrightYellow,
							toUrlParam: (val) => val,
							fromUrlParam: (val) => val,
							checkUrlParam: (val) => true,
							toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.colors.brightYellow') || configDefaults.colorBrightYellow),
							fromMenuSetting: (element, baseValue) => (element.value || baseValue),
							toMenuSetting: (val) => val,
						},
					},
					brightBlue: {
						title: 'ANSI Bright Blue',
						description: '`\\x1b[1;34m`',
						type: 'color',
						default: configDefaults.colorBrightBlue,
						profileData: {
							terminalFrontEnd: true,
							defaultProfile: configDefaults.colorBrightBlue,
							toUrlParam: (val) => val,
							fromUrlParam: (val) => val,
							checkUrlParam: (val) => true,
							toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.colors.brightBlue') || configDefaults.colorBrightBlue),
							fromMenuSetting: (element, baseValue) => (element.value || baseValue),
							toMenuSetting: (val) => val,
						},
					},
					brightMagenta: {
						title: 'ANSI Bright Magenta',
						description: '`\\x1b[1;35m`',
						type: 'color',
						default: configDefaults.colorBrightMagenta,
						profileData: {
							terminalFrontEnd: true,
							defaultProfile: configDefaults.colorBrightMagenta,
							toUrlParam: (val) => val,
							fromUrlParam: (val) => val,
							checkUrlParam: (val) => true,
							toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.colors.brightMagenta') || configDefaults.colorBrightMagenta),
							fromMenuSetting: (element, baseValue) => (element.value || baseValue),
							toMenuSetting: (val) => val,
						},
					},
					brightCyan: {
						title: 'ANSI Bright Cyan',
						description: '`\\x1b[1;36m`',
						type: 'color',
						default: configDefaults.colorBrightCyan,
						profileData: {
							terminalFrontEnd: true,
							defaultProfile: configDefaults.colorBrightCyan,
							toUrlParam: (val) => val,
							fromUrlParam: (val) => val,
							checkUrlParam: (val) => true,
							toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.colors.brightCyan') || configDefaults.colorBrightCyan),
							fromMenuSetting: (element, baseValue) => (element.value || baseValue),
							toMenuSetting: (val) => val,
						},
					},
					brightWhite: {
						title: 'ANSI Bright White',
						description: '`\\x1b[1;37m`',
						type: 'color',
						default: configDefaults.colorBrightWhite,
						profileData: {
							terminalFrontEnd: true,
							defaultProfile: configDefaults.colorBrightWhite,
							toUrlParam: (val) => val,
							fromUrlParam: (val) => val,
							checkUrlParam: (val) => true,
							toBaseProfile: (previousValue) => (atom.config.get('x-terminal.terminalSettings.colors.brightWhite') || configDefaults.colorBrightWhite),
							fromMenuSetting: (element, baseValue) => (element.value || baseValue),
							toMenuSetting: (val) => val,
						},
					},
				},
			},
		},
	},
})

function validateBooleanConfigSetting (name, defaultValue) {
	const value = atom.config.get(name)
	return (typeof value === 'boolean' ? value : defaultValue)
}

function validateJsonConfigSetting (name, defaultJsonValue, previousValue) {
	let value = atom.config.get(name)
	try {
		value = JSON.parse(value || defaultJsonValue) || previousValue
	} catch (e) {
		// This normally happens when the user is in the middle of updating some
		// setting that is a JSON string. Ignore syntax errors and use the last
		// known good config setting.
		if (!(e instanceof SyntaxError)) {
			throw e
		}
		value = previousValue
	}
	return value
}

function parseJson (value, defaultValue, type) {
	let retval = value
	try {
		retval = JSON.parse(retval)
	} catch (e) {
		if (!(e instanceof SyntaxError)) {
			throw e
		}
		retval = null
	}
	if (!retval || retval.constructor !== type) {
		retval = defaultValue
	}
	return retval
}

function convertNullToEmptyString (value) {
	if (value === null) {
		return ''
	}
	return JSON.stringify(value)
}

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

function configToData (obj, prefix) {
	const data = []
	for (const key in obj) {
		if (obj[key].type === 'object') {
			data.push(...configToData(obj[key].properties, `${prefix}.${key}`))
		} else {
			const profileData = obj[key].profileData
			if (profileData) {
				profileData.profileKey = key in COLORS ? COLORS[key] : key
				delete obj[key].profileData
			}
			const keyPath = `${prefix}.${key}`
			data.push({ ...obj[key], ...profileData, keyPath })
		}
	}
	return data
}

export const CONFIG_DATA = configToData(config, 'x-terminal')
