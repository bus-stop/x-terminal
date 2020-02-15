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

import { Emitter } from 'atom'

import { configDefaults, COLORS } from './config'

import fs from 'fs-extra'
import path from 'path'

import uuidv4 from 'uuid/v4'
import { URL } from 'whatwg-url'
import { detailedDiff } from 'deep-object-diff'

const X_TERMINAL_BASE_URI = 'x-terminal://'

const CONFIG_KEY_TO_PROFILE_KEY_MAPPING = {
	'x-terminal.spawnPtySettings.command': 'command',
	'x-terminal.spawnPtySettings.args': 'args',
	'x-terminal.spawnPtySettings.name': 'name',
	'x-terminal.spawnPtySettings.cwd': 'cwd',
	'x-terminal.spawnPtySettings.env': 'env',
	'x-terminal.spawnPtySettings.setEnv': 'setEnv',
	'x-terminal.spawnPtySettings.deleteEnv': 'deleteEnv',
	'x-terminal.spawnPtySettings.encoding': 'encoding',
	'x-terminal.terminalSettings.fontSize': 'fontSize',
	'x-terminal.terminalSettings.fontFamily': 'fontFamily',
	'x-terminal.terminalSettings.colors.theme': 'theme',
	'x-terminal.terminalSettings.colors.foreground': 'colorForeground',
	'x-terminal.terminalSettings.colors.background': 'colorBackground',
	'x-terminal.terminalSettings.colors.cursor': 'colorCursor',
	'x-terminal.terminalSettings.colors.cursorAccent': 'colorCursorAccent',
	'x-terminal.terminalSettings.colors.selection': 'colorSelection',
	'x-terminal.terminalSettings.colors.black': 'colorBlack',
	'x-terminal.terminalSettings.colors.red': 'colorRed',
	'x-terminal.terminalSettings.colors.green': 'colorGreen',
	'x-terminal.terminalSettings.colors.yellow': 'colorYellow',
	'x-terminal.terminalSettings.colors.blue': 'colorBlue',
	'x-terminal.terminalSettings.colors.magenta': 'colorMagenta',
	'x-terminal.terminalSettings.colors.cyan': 'colorCyan',
	'x-terminal.terminalSettings.colors.white': 'colorWhite',
	'x-terminal.terminalSettings.colors.brightBlack': 'colorBrightBlack',
	'x-terminal.terminalSettings.colors.brightRed': 'colorBrightRed',
	'x-terminal.terminalSettings.colors.brightGreen': 'colorBrightGreen',
	'x-terminal.terminalSettings.colors.brightYellow': 'colorBrightYellow',
	'x-terminal.terminalSettings.colors.brightBlue': 'colorBrightBlue',
	'x-terminal.terminalSettings.colors.brightMagenta': 'colorBrightMagenta',
	'x-terminal.terminalSettings.colors.brightCyan': 'colorBrightCyan',
	'x-terminal.terminalSettings.colors.brightWhite': 'colorBrightWhite',
	'x-terminal.terminalSettings.leaveOpenAfterExit': 'leaveOpenAfterExit',
	'x-terminal.terminalSettings.allowRelaunchingTerminalsOnStartup': 'allowRelaunchingTerminalsOnStartup',
	'x-terminal.terminalSettings.relaunchTerminalOnStartup': 'relaunchTerminalOnStartup',
	'x-terminal.terminalSettings.title': 'title',
	'x-terminal.terminalSettings.xtermOptions': 'xtermOptions',
	'x-terminal.terminalSettings.promptToStartup': 'promptToStartup',
}

const XTerminalProfilesSingletonSymbol = Symbol('XTerminalProfilesSingleton sentinel')

class XTerminalProfilesSingleton {
	constructor (symbolCheck) {
		if (XTerminalProfilesSingletonSymbol !== symbolCheck) {
			throw new Error('XTerminalProfilesSingleton cannot be instantiated directly.')
		}
		this.emitter = new Emitter()
		this.profilesConfigPath = path.join(configDefaults.getUserDataPath(), 'profiles.json')
		this.profiles = {}
		this.previousBaseProfile = null
		this.baseProfile = this.getDefaultProfile()
		this.resetBaseProfile()
		this.profilesLoadPromise = null
		this.reloadProfiles()
	}

	static get instance () {
		if (!this[XTerminalProfilesSingletonSymbol]) {
			this[XTerminalProfilesSingletonSymbol] = new XTerminalProfilesSingleton(XTerminalProfilesSingletonSymbol)
		}
		return this[XTerminalProfilesSingletonSymbol]
	}

	sortProfiles (profiles) {
		const orderedProfiles = {}
		Object.keys(profiles).sort().forEach((key) => {
			orderedProfiles[key] = profiles[key]
		})
		return orderedProfiles
	}

	async reloadProfiles () {
		let resolveLoad
		this.profilesLoadPromise = new Promise((resolve) => {
			resolveLoad = resolve
		})
		try {
			const data = await fs.readJson(this.profilesConfigPath)
			this.profiles = this.sortProfiles(data)
			this.emitter.emit('did-reload-profiles', this.getSanitizedProfilesData())
			resolveLoad()
		} catch (err) {
			// Create the profiles file.
			await this.updateProfiles({})
			this.emitter.emit('did-reload-profiles', this.getSanitizedProfilesData())
			resolveLoad()
		}
	}

	onDidReloadProfiles (callback) {
		return this.emitter.on('did-reload-profiles', callback)
	}

	onDidResetBaseProfile (callback) {
		return this.emitter.on('did-reset-base-profile', callback)
	}

	async updateProfiles (newProfilesConfigData) {
		await fs.ensureDir(path.dirname(this.profilesConfigPath))
		newProfilesConfigData = this.sortProfiles(newProfilesConfigData)
		await fs.writeJson(this.profilesConfigPath, newProfilesConfigData)
		this.profiles = newProfilesConfigData
	}

	deepClone (data) {
		return JSON.parse(JSON.stringify(data))
	}

	diffProfiles (oldProfile, newProfile) {
		// This method will return added or modified entries.
		const diff = detailedDiff(oldProfile, newProfile)
		return Object.assign(diff.added, diff.updated)
	}

	getDefaultProfile () {
		return {
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
			...Object.values(COLORS).reduce((obj, c) => {
				obj[c] = configDefaults[`getDefault${c.charAt(0).toUpperCase() + c.substring(1)}`]()
				return obj
			}, {}),
			leaveOpenAfterExit: configDefaults.getDefaultLeaveOpenAfterExit(),
			relaunchTerminalOnStartup: configDefaults.getDefaultRelaunchTerminalOnStartup(),
			title: null,
			xtermOptions: JSON.parse(configDefaults.getDefaultXtermOptions()),
			promptToStartup: configDefaults.getDefaultPromptToStartup(),
		}
	}

	getBaseProfile () {
		return this.deepClone(this.baseProfile)
	}

	validateJsonConfigSetting (name, defaultJsonValue) {
		const profileKey = CONFIG_KEY_TO_PROFILE_KEY_MAPPING[name]
		const previousValue = this.previousBaseProfile[profileKey]
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

	resetBaseProfile () {
		this.previousBaseProfile = this.deepClone(this.baseProfile)
		let env = this.validateJsonConfigSetting('x-terminal.spawnPtySettings.env', 'null')
		if (!env || env.constructor !== Object) {
			env = null
		}
		const encoding = atom.config.get('x-terminal.spawnPtySettings.encoding') || null
		let leaveOpenAfterExit = atom.config.get('x-terminal.terminalSettings.leaveOpenAfterExit')
		if (leaveOpenAfterExit !== true && leaveOpenAfterExit !== false) leaveOpenAfterExit = configDefaults.getDefaultLeaveOpenAfterExit()
		let relaunchTerminalOnStartup = atom.config.get('x-terminal.terminalSettings.relaunchTerminalOnStartup')
		if (relaunchTerminalOnStartup !== true && relaunchTerminalOnStartup !== false) relaunchTerminalOnStartup = configDefaults.getDefaultRelaunchTerminalOnStartup()
		const title = atom.config.get('x-terminal.terminalSettings.title') || configDefaults.getDefaultTitle()
		let promptToStartup = atom.config.get('x-terminal.terminalSettings.promptToStartup')
		if (promptToStartup !== true && promptToStartup !== false) promptToStartup = configDefaults.getDefaultPromptToStartup()
		this.baseProfile = {
			command: atom.config.get('x-terminal.spawnPtySettings.command') || configDefaults.getDefaultShellCommand(),
			args: this.validateJsonConfigSetting('x-terminal.spawnPtySettings.args', configDefaults.getDefaultArgs()),
			name: atom.config.get('x-terminal.spawnPtySettings.name') || configDefaults.getDefaultTermType(),
			cwd: atom.config.get('x-terminal.spawnPtySettings.cwd') || configDefaults.getDefaultCwd(),
			env: env,
			setEnv: this.validateJsonConfigSetting('x-terminal.spawnPtySettings.setEnv', configDefaults.getDefaultSetEnv()),
			deleteEnv: this.validateJsonConfigSetting('x-terminal.spawnPtySettings.deleteEnv', configDefaults.getDefaultDeleteEnv()),
			encoding: encoding,
			fontSize: atom.config.get('x-terminal.terminalSettings.fontSize') || configDefaults.getDefaultFontSize(),
			fontFamily: atom.config.get('x-terminal.terminalSettings.fontFamily') || configDefaults.getDefaultFontFamily(),
			theme: atom.config.get('x-terminal.terminalSettings.colors.theme') || configDefaults.getDefaultTheme(),
			...Object.keys(COLORS).reduce((obj, c) => {
				obj[COLORS[c]] = atom.config.get(`x-terminal.terminalSettings.colors.${c}`) || configDefaults[`getDefault${COLORS[c].charAt(0).toUpperCase() + COLORS[c].substring(1)}`]()
				return obj
			}, {}),
			leaveOpenAfterExit: leaveOpenAfterExit,
			relaunchTerminalOnStartup: relaunchTerminalOnStartup,
			title: title || null,
			xtermOptions: this.validateJsonConfigSetting('x-terminal.terminalSettings.xtermOptions', configDefaults.getDefaultXtermOptions()),
			promptToStartup: promptToStartup,
		}
		this.emitter.emit('did-reset-base-profile', this.getBaseProfile())
	}

	sanitizeData (data) {
		const sanitizedData = {}
		if ('command' in data) sanitizedData.command = data.command
		if ('args' in data) sanitizedData.args = data.args
		if ('name' in data) sanitizedData.name = data.name
		if ('cwd' in data) sanitizedData.cwd = data.cwd
		if ('env' in data) sanitizedData.env = data.env
		if ('setEnv' in data) sanitizedData.setEnv = data.setEnv
		if ('deleteEnv' in data) sanitizedData.deleteEnv = data.deleteEnv
		if ('encoding' in data) sanitizedData.encoding = data.encoding
		if ('fontSize' in data) sanitizedData.fontSize = data.fontSize
		if ('fontFamily' in data) sanitizedData.fontFamily = data.fontFamily
		if ('theme' in data) sanitizedData.theme = data.theme
		for (const c of Object.values(COLORS)) {
			if (c in data) sanitizedData[c] = data[c]
		}
		if ('leaveOpenAfterExit' in data) sanitizedData.leaveOpenAfterExit = data.leaveOpenAfterExit
		if ('relaunchTerminalOnStartup' in data) sanitizedData.relaunchTerminalOnStartup = data.relaunchTerminalOnStartup
		if ('title' in data) sanitizedData.title = data.title
		if ('xtermOptions' in data) sanitizedData.xtermOptions = data.xtermOptions
		if ('promptToStartup' in data) sanitizedData.promptToStartup = data.promptToStartup
		return this.deepClone(sanitizedData)
	}

	getSanitizedProfilesData () {
		const retval = {}
		for (const key in this.profiles) {
			retval[key] = this.sanitizeData(this.profiles[key])
		}
		return retval
	}

	async getProfiles () {
		await this.profilesLoadPromise
		return this.getSanitizedProfilesData()
	}

	async getProfile (profileName) {
		await this.profilesLoadPromise
		return {
			...this.deepClone(this.baseProfile),
			...this.sanitizeData(this.profiles[profileName] || {}),
		}
	}

	async isProfileExists (profileName) {
		await this.profilesLoadPromise
		return profileName in this.profiles
	}

	async setProfile (profileName, data) {
		await this.profilesLoadPromise
		const profileData = {
			...this.deepClone(this.baseProfile),
			...this.sanitizeData(data),
		}
		const newProfilesConfigData = {
			...this.deepClone(this.profiles),
		}
		newProfilesConfigData[profileName] = profileData
		await this.updateProfiles(newProfilesConfigData)
	}

	async deleteProfile (profileName) {
		await this.profilesLoadPromise
		const newProfilesConfigData = {
			...this.deepClone(this.profiles),
		}
		delete newProfilesConfigData[profileName]
		await this.updateProfiles(newProfilesConfigData)
	}

	generateNewUri () {
		return X_TERMINAL_BASE_URI + uuidv4() + '/'
	}

	generateNewUrlFromProfileData (data) {
		data = this.sanitizeData(data)
		const url = new URL(this.generateNewUri())
		// Command to run, can be basename of command or full path to command.
		if ('command' in data) url.searchParams.set('command', data.command)
		// Arguments to pass to command. This should be in a JSON array.
		if ('args' in data) url.searchParams.set('args', JSON.stringify(data.args))
		// This defines the term type to use ('xterm', 'xterm-color', etc.). This
		// option does nothing on Windows.
		if ('name' in data) url.searchParams.set('name', data.name)
		// Current working directory to start command in.
		if ('cwd' in data) url.searchParams.set('cwd', data.cwd)
		// Environment to use for command. This can be null or left out in which
		// case the current environment is used.
		if ('env' in data) url.searchParams.set('env', JSON.stringify(data.env))
		// Environment variables to set or override from the defined environment
		// above or the current environment when starting command.
		if ('setEnv' in data) url.searchParams.set('setEnv', JSON.stringify(data.setEnv))
		// Environment variables to delete when starting command.
		if ('deleteEnv' in data) url.searchParams.set('deleteEnv', JSON.stringify(data.deleteEnv))
		// Encoding to use when running command.
		if ('encoding' in data) url.searchParams.set('encoding', data.encoding)
		// Font size to use.
		if ('fontSize' in data) url.searchParams.set('fontSize', JSON.stringify(data.fontSize))
		// Font family to use.
		if ('fontFamily' in data) url.searchParams.set('fontFamily', data.fontFamily)
		// Theme to use.
		if ('theme' in data) url.searchParams.set('theme', data.theme)
		// Colors
		for (const c of Object.values(COLORS)) {
			if (c in data) url.searchParams.set(c, data[c])
		}
		// This determines whether to leave the terminal tab open when the command
		// has finished running.
		if ('leaveOpenAfterExit' in data) url.searchParams.set('leaveOpenAfterExit', JSON.stringify(data.leaveOpenAfterExit))
		// This determines whether the terminal tab should be restarted when Atom
		// is restarted.
		if ('relaunchTerminalOnStartup' in data) url.searchParams.set('relaunchTerminalOnStartup', JSON.stringify(data.relaunchTerminalOnStartup))
		// This is used to set a custom title for the new terminal tab.
		if ('title' in data) url.searchParams.set('title', data.title)
		// The options supported by the Terminal object in xterm.js. See also
		// https://github.com/xtermjs/xterm.js/blob/5f0217cdb0baf353b3deedfab25e6e9b49c3d45f/typings/xterm.d.ts#L31 .
		// NOTE: The 'fontSize', 'fontFamily', and 'theme' settings defined in the options here are ignored.
		if ('xtermOptions' in data) url.searchParams.set('xtermOptions', JSON.stringify(data.xtermOptions))
		// This determines whether to prompt the user to startup the terminal
		// process.
		if ('promptToStartup' in data) url.searchParams.set('promptToStartup', JSON.stringify(data.promptToStartup))
		return url
	}

	createProfileDataFromUri (uri) {
		let param
		const url = new URL(uri)
		const baseProfile = this.getBaseProfile()
		const newProfile = {}
		param = url.searchParams.get('command')
		if (param) newProfile.command = param
		if (!('command' in newProfile)) newProfile.command = baseProfile.command
		param = url.searchParams.get('args')
		if (param) newProfile.args = JSON.parse(param)
		if (!('args' in newProfile && newProfile.args)) newProfile.args = baseProfile.args
		param = url.searchParams.get('name')
		if (param) newProfile.name = param
		if (!('name' in newProfile)) newProfile.name = baseProfile.name
		param = url.searchParams.get('cwd')
		if (param) newProfile.cwd = param
		if (!('cwd' in newProfile)) newProfile.cwd = baseProfile.cwd
		param = url.searchParams.get('env')
		if (param) newProfile.env = JSON.parse(param)
		if (!('env' in newProfile && newProfile.env)) newProfile.env = baseProfile.env
		param = url.searchParams.get('setEnv')
		if (param) newProfile.setEnv = JSON.parse(param)
		if (!('setEnv' in newProfile && newProfile.setEnv)) newProfile.setEnv = baseProfile.setEnv
		param = url.searchParams.get('deleteEnv')
		if (param) newProfile.deleteEnv = JSON.parse(param)
		if (!('deleteEnv' in newProfile && newProfile.deleteEnv)) newProfile.deleteEnv = baseProfile.deleteEnv
		param = url.searchParams.get('encoding')
		if (param && param !== 'null') newProfile.encoding = param
		if (!('encoding' in newProfile)) newProfile.encoding = baseProfile.encoding
		param = url.searchParams.get('fontSize')
		if (param) newProfile.fontSize = JSON.parse(param)
		if (!('fontSize' in newProfile && newProfile.fontSize)) newProfile.fontSize = baseProfile.fontSize
		param = url.searchParams.get('fontFamily')
		if (param) newProfile.fontFamily = param
		if (!('fontFamily' in newProfile)) newProfile.fontFamily = baseProfile.fontFamily
		param = url.searchParams.get('theme')
		if (param) newProfile.theme = param
		if (!('theme' in newProfile)) newProfile.theme = baseProfile.theme
		for (const c of Object.values(COLORS)) {
			param = url.searchParams.get(c)
			if (param) newProfile[c] = param
			if (!(c in newProfile)) newProfile[c] = baseProfile[c]
		}
		param = url.searchParams.get('leaveOpenAfterExit')
		if (param) newProfile.leaveOpenAfterExit = JSON.parse(param)
		if (!('leaveOpenAfterExit' in newProfile && newProfile.leaveOpenAfterExit !== null && newProfile.leaveOpenAfterExit !== '')) newProfile.leaveOpenAfterExit = baseProfile.leaveOpenAfterExit
		param = url.searchParams.get('relaunchTerminalOnStartup')
		if (param) newProfile.relaunchTerminalOnStartup = JSON.parse(param)
		if (!('relaunchTerminalOnStartup' in newProfile && newProfile.relaunchTerminalOnStartup !== null && newProfile.relaunchTerminalOnStartup !== '')) newProfile.relaunchTerminalOnStartup = baseProfile.relaunchTerminalOnStartup
		param = url.searchParams.get('title')
		if (param && param !== 'null') newProfile.title = param
		if (!('title' in newProfile)) newProfile.title = baseProfile.title
		param = url.searchParams.get('xtermOptions')
		if (param) newProfile.xtermOptions = JSON.parse(param)
		if (!('xtermOptions' in newProfile && newProfile.xtermOptions)) newProfile.xtermOptions = baseProfile.xtermOptions
		param = url.searchParams.get('promptToStartup')
		if (param) newProfile.promptToStartup = JSON.parse(param)
		if (!('promptToStartup' in newProfile && newProfile.promptToStartup !== null && newProfile.promptToStartup !== '')) newProfile.promptToStartup = baseProfile.promptToStartup
		return newProfile
	}
}

export {
	X_TERMINAL_BASE_URI,
	XTerminalProfilesSingleton,
}
