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

import { CompositeDisposable, Disposable } from 'atom'
import { spawn as spawnPty } from 'node-pty-prebuilt-multiarch'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { WebglAddon } from 'xterm-addon-webgl'
import { shell } from 'electron'

import { configDefaults, COLORS, CONFIG_DATA } from './config'
import { XTerminalProfileMenuElement } from './profile-menu-element'
import { XTerminalProfileMenuModel } from './profile-menu-model'
import { XTerminalProfilesSingleton } from './profiles'

import fs from 'fs-extra'

const PTY_PROCESS_OPTIONS = new Set([
	'command',
	'args',
	'name',
	'cwd',
	'env',
	'setEnv',
	'deleteEnv',
	'encoding',
])
const X_TERMINAL_OPTIONS = [
	'leaveOpenAfterExit',
	'relaunchTerminalOnStartup',
	'title',
	'promptToStartup',
]

class XTerminalElementImpl extends HTMLElement {
	async initialize (model) {
		this.profilesSingleton = XTerminalProfilesSingleton.instance
		this.model = model
		this.model.element = this
		this.disposables = new CompositeDisposable()
		this.topDiv = document.createElement('div')
		this.topDiv.classList.add('x-terminal-top-div')
		this.appendChild(this.topDiv)
		this.mainDiv = document.createElement('div')
		this.mainDiv.classList.add('x-terminal-main-div')
		this.appendChild(this.mainDiv)
		this.menuDiv = document.createElement('div')
		this.menuDiv.classList.add('x-terminal-menu-div')
		this.mainDiv.appendChild(this.menuDiv)
		this.terminalDiv = document.createElement('div')
		this.terminalDiv.classList.add('x-terminal-term-container')
		this.mainDiv.appendChild(this.terminalDiv)
		this.atomXtermProfileMenuElement = new XTerminalProfileMenuElement()
		this.hoveredLink = null
		this.pendingTerminalProfileOptions = {}
		this.mainDivContentRect = null
		this.terminalDivInitiallyVisible = false
		this.isInitialized = false
		let resolveInit, rejectInit
		this.initializedPromise = new Promise((resolve, reject) => {
			resolveInit = resolve
			rejectInit = reject
		})
		try {
			// Always wait for the model to finish initializing before proceeding.
			await this.model.initializedPromise
			this.setAttribute('session-id', this.model.getSessionId())
			await this.atomXtermProfileMenuElement.initialize(new XTerminalProfileMenuModel(this.model))
			this.menuDiv.append(this.atomXtermProfileMenuElement)
			// An element resize detector is used to check when this element is
			// resized due to the pane resizing or due to the entire window
			// resizing.
			this.mainDivResizeObserver = new ResizeObserver(entries => {
				const lastEntry = entries.pop()
				this.mainDivContentRect = lastEntry.contentRect
				this.refitTerminal()
			})
			this.mainDivResizeObserver.observe(this.mainDiv)
			this.disposables.add(new Disposable(() => {
				this.mainDivResizeObserver.disconnect()
				this.mainDivResizeObserver = null
			}))
			// Add an IntersectionObserver in order to apply new options and
			// refit as soon as the terminal is visible.
			this.terminalDivIntersectionObserver = new IntersectionObserver(async entries => {
				const lastEntry = entries.pop()
				if (lastEntry.intersectionRatio === 1.0) {
					this.terminalDivInitiallyVisible = true
					try {
						await this.createTerminal()
						this.applyPendingTerminalProfileOptions()
						resolveInit()
					} catch (ex) {
						rejectInit(ex)
					}
					// Remove observer once visible
					this.terminalDivIntersectionObserver.disconnect()
					this.terminalDivIntersectionObserver = null
				}
			}, {
				root: this,
				threshold: 1.0,
			})
			this.terminalDivIntersectionObserver.observe(this.terminalDiv)
			this.disposables.add(new Disposable(() => {
				if (this.terminalDivIntersectionObserver) {
					this.terminalDivIntersectionObserver.disconnect()
				}
			}))
			// Add event handler for increasing/decreasing the font when
			// holding 'ctrl' and moving the mouse wheel up or down.
			this.terminalDiv.addEventListener(
				'wheel',
				(wheelEvent) => {
					if (!wheelEvent.ctrlKey || !atom.config.get('editor.zoomFontWhenCtrlScrolling')) {
						return
					}

					let fontSize = this.model.profile.fontSize + (wheelEvent.deltaY < 0 ? 1 : -1)
					if (fontSize < configDefaults.minimumFontSize) {
						fontSize = configDefaults.minimumFontSize
					} else if (fontSize > configDefaults.maximumFontSize) {
						fontSize = configDefaults.maximumFontSize
					}
					this.model.applyProfileChanges({ fontSize: fontSize })
					wheelEvent.stopPropagation()
				},
				{ capture: true },
			)
		} catch (ex) {
			rejectInit(ex)
			throw ex
		}
		this.isInitialized = true
	}

	destroy () {
		this.atomXtermProfileMenuElement.destroy()
		if (this.ptyProcess) {
			this.ptyProcess.kill()
		}
		if (this.terminal) {
			this.terminal.dispose()
		}
		this.disposables.dispose()
	}

	getShellCommand () {
		return this.model.profile.command
	}

	getArgs () {
		const args = this.model.profile.args
		if (!Array.isArray(args)) {
			throw new Error('Arguments set are not an array.')
		}
		return args
	}

	getTermType () {
		return this.model.profile.name
	}

	async checkPathIsDirectory (path) {
		if (path) {
			try {
				const stats = await fs.stat(path)
				if (stats && stats.isDirectory()) {
					return true
				}
			} catch (err) {}
		}

		return false
	}

	async getCwd () {
		let cwd = this.model.profile.cwd
		if (await this.checkPathIsDirectory(cwd)) {
			return cwd
		}

		cwd = this.model.getPath()
		if (await this.checkPathIsDirectory(cwd)) {
			return cwd
		}

		// If the cwd from the model was invalid, reset it to null.
		this.model.cwd = null
		cwd = this.profilesSingleton.getBaseProfile.cwd
		if (await this.checkPathIsDirectory(cwd)) {
			this.model.cwd = cwd
			return cwd
		}

		return null
	}

	getEnv () {
		let env = this.model.profile.env
		if (!env) {
			env = { ...process.env }
		}
		if (typeof env !== 'object' || Array.isArray(env)) {
			throw new Error('Environment set is not an object.')
		}
		const setEnv = this.model.profile.setEnv
		const deleteEnv = this.model.profile.deleteEnv
		for (const key in setEnv) {
			env[key] = setEnv[key]
		}
		for (const key of deleteEnv) {
			delete env[key]
		}
		return env
	}

	getEncoding () {
		return this.model.profile.encoding
	}

	leaveOpenAfterExit () {
		return this.model.profile.leaveOpenAfterExit
	}

	isPromptToStartup () {
		return this.model.profile.promptToStartup
	}

	isPtyProcessRunning () {
		return (this.ptyProcess && this.ptyProcessRunning)
	}

	getTheme (profile = {}) {
		const colors = {}
		for (const color in COLORS) {
			const colorItem = COLORS[color]
			colors[color] = profile[colorItem] || this.model.profile[colorItem]
		}
		// themes modified from https://github.com/bus-stop/terminus/tree/master/styles/themes
		switch (profile.theme || this.model.profile.theme) {
			case 'Atom Dark':
				colors.background = '#1d1f21'
				colors.foreground = '#c5c8c6'
				colors.selection = '#999999'
				colors.cursor = '#ffffff'
				break
			case 'Atom Light':
				colors.background = '#ffffff'
				colors.foreground = '#555555'
				colors.selection = '#afc4da'
				colors.cursor = '#000000'
				break
			case 'Base16 Tomorrow Dark':
				colors.background = '#1d1f21'
				colors.foreground = '#c5c8c6'
				colors.selection = '#b4b7b4'
				// colors.selectionForeground = '#e0e0e0'
				colors.cursor = '#ffffff'
				break
			case 'Base16 Tomorrow Light':
				colors.background = '#ffffff'
				colors.foreground = '#1d1f21'
				colors.selection = '#282a2e'
				// colors.selectionForeground = '#e0e0e0'
				colors.cursor = '#1d1f21'
				break
			case 'Christmas':
				colors.background = '#0c0047'
				colors.foreground = '#f81705'
				colors.selection = '#298f16'
				colors.cursor = '#009f59'
				break
			case 'City Lights':
				colors.background = '#181d23'
				colors.foreground = '#666d81'
				colors.selection = '#2a2f38'
				// colors.selectionForeground = '#b7c5d3'
				colors.cursor = '#528bff'
				break
			case 'Dracula':
				colors.background = '#1e1f29'
				colors.foreground = 'white'
				colors.selection = '#44475a'
				colors.cursor = '#999999'
				break
			case 'Grass':
				colors.background = 'rgb(19, 119, 61)'
				colors.foreground = 'rgb(255, 240, 165)'
				colors.selection = 'rgba(182, 73, 38, .99)'
				colors.cursor = 'rgb(142, 40, 0)'
				break
			case 'Homebrew':
				colors.background = '#000000'
				colors.foreground = 'rgb(41, 254, 20)'
				colors.selection = 'rgba(7, 30, 155, .99)'
				colors.cursor = 'rgb(55, 254, 38)'
				break
			case 'Inverse':
				colors.background = '#ffffff'
				colors.foreground = '#000000'
				colors.selection = 'rgba(178, 215, 255, .99)'
				colors.cursor = 'rgb(146, 146, 146)'
				break
			case 'Linux':
				colors.background = '#000000'
				colors.foreground = 'rgb(230, 230, 230)'
				colors.selection = 'rgba(155, 30, 7, .99)'
				colors.cursor = 'rgb(200, 20, 25)'
				break
			case 'Man Page':
				colors.background = 'rgb(254, 244, 156)'
				colors.foreground = 'black'
				colors.selection = 'rgba(178, 215, 255, .99)'
				colors.cursor = 'rgb(146, 146, 146)'
				break
			case 'Novel':
				colors.background = 'rgb(223, 219, 196)'
				colors.foreground = 'rgb(77, 47, 46)'
				colors.selection = 'rgba(155, 153, 122, .99)'
				colors.cursor = 'rgb(115, 99, 89)'
				break
			case 'Ocean':
				colors.background = 'rgb(44, 102, 201)'
				colors.foreground = 'white'
				colors.selection = 'rgba(41, 134, 255, .99)'
				colors.cursor = 'rgb(146, 146, 146)'
				break
			case 'One Dark':
				colors.background = '#282c34'
				colors.foreground = '#abb2bf'
				colors.selection = '#9196a1'
				colors.cursor = '#528bff'
				break
			case 'One Light':
				colors.background = 'hsl(230, 1%, 98%)'
				colors.foreground = 'hsl(230, 8%, 24%)'
				colors.selection = 'hsl(230, 1%, 90%)'
				colors.cursor = 'hsl(230, 100%, 66%)'
				break
			case 'Predawn':
				colors.background = '#282828'
				colors.foreground = '#f1f1f1'
				colors.selection = 'rgba(255,255,255,0.25)'
				colors.cursor = '#f18260'
				break
			case 'Pro':
				colors.background = '#000000'
				colors.foreground = 'rgb(244, 244, 244)'
				colors.selection = 'rgba(82, 82, 82, .99)'
				colors.cursor = 'rgb(96, 96, 96)'
				break
			case 'Red Sands':
				colors.background = 'rgb(143, 53, 39)'
				colors.foreground = 'rgb(215, 201, 167)'
				colors.selection = 'rgba(60, 25, 22, .99)'
				colors.cursor = 'white'
				break
			case 'Red':
				colors.background = '#000000'
				colors.foreground = 'rgb(255, 38, 14)'
				colors.selection = 'rgba(7, 30, 155, .99)'
				colors.cursor = 'rgb(255, 38, 14)'
				break
			case 'Silver Aerogel':
				colors.background = 'rgb(146, 146, 146)'
				colors.foreground = '#000000'
				colors.selection = 'rgba(120, 123, 156, .99)'
				colors.cursor = 'rgb(224, 224, 224)'
				break
			case 'Solarized Dark':
				colors.background = '#042029'
				colors.foreground = '#708284'
				colors.selection = '#839496'
				colors.cursor = '#819090'
				break
			case 'Solarized Light':
				colors.background = '#fdf6e3'
				colors.foreground = '#657a81'
				colors.selection = '#ece7d5'
				colors.cursor = '#586e75'
				break
			case 'Solid Colors':
				colors.background = 'rgb(120, 132, 151)'
				colors.foreground = '#000000'
				colors.selection = 'rgba(178, 215, 255, .99)'
				colors.cursor = '#ffffff'
				break
			case 'Standard': {
				const root = getComputedStyle(document.documentElement)
				colors.background = root.getPropertyValue('--standard-app-background-color')
				colors.foreground = root.getPropertyValue('--standard-text-color')
				colors.selection = root.getPropertyValue('--standard-background-color-selected')
				colors.cursor = root.getPropertyValue('--standard-text-color-highlight')
				break
			}
		}

		return colors
	}

	getXtermOptions () {
		const xtermOptions = {
			cursorBlink: true,
			...this.model.profile.xtermOptions,
		}
		xtermOptions.fontSize = this.model.profile.fontSize
		xtermOptions.fontFamily = this.model.profile.fontFamily
		xtermOptions.theme = this.getTheme(this.model.profile)
		// NOTE: The cloning is needed because the Terminal class modifies the
		// options passed to it.
		return this.profilesSingleton.deepClone(xtermOptions)
	}

	setMainBackgroundColor () {
		const xtermOptions = this.getXtermOptions()
		if (xtermOptions.theme && xtermOptions.theme.background) {
			this.style.backgroundColor = xtermOptions.theme.background
		} else {
			this.style.backgroundColor = '#000000'
		}
	}

	async createTerminal () {
		// Attach terminal emulator to this element and refit.
		this.setMainBackgroundColor()
		this.terminal = new Terminal(this.getXtermOptions())
		this.fitAddon = new FitAddon()
		this.terminal.loadAddon(this.fitAddon)
		if (this.model.profile.webLinks) {
			this.terminal.loadAddon(new WebLinksAddon((e, uri) => { shell.openExternal(uri) }))
		}
		this.terminal.open(this.terminalDiv)
		if (this.model.profile.webgl) {
			this.terminal.loadAddon(new WebglAddon())
		}
		this.ptyProcessCols = 80
		this.ptyProcessRows = 25
		this.refitTerminal()
		this.ptyProcess = null
		this.ptyProcessRunning = false
		this.disposables.add(this.terminal.onData((data) => {
			if (this.isPtyProcessRunning()) {
				this.ptyProcess.write(data)
			}
		}))
		this.disposables.add(this.terminal.onSelectionChange(() => {
			if (this.model.profile.copyOnSelect) {
				let text = this.terminal.getSelection()
				if (text) {
					const rawLines = text.split(/\r?\n/g)
					const lines = rawLines.map(line => line.replace(/\s/g, ' ').trimRight())
					text = lines.join('\n')
					atom.clipboard.write(text)
				}
			}
		}))
		this.disposables.add(this.profilesSingleton.onDidResetBaseProfile((baseProfile) => {
			const frontEndSettings = {}
			for (const data of CONFIG_DATA) {
				if (!data.profileKey) continue
				if (data.terminalFrontEnd) {
					frontEndSettings[data.profileKey] = baseProfile[data.profileKey]
				}
			}
			const profileChanges = this.profilesSingleton.diffProfiles(
				this.model.getProfile(),
				// Only allow changes to settings related to the terminal front end
				// to be applied to existing terminals.
				frontEndSettings,
			)
			this.model.applyProfileChanges(profileChanges)
		}))
		if (this.isPromptToStartup()) {
			this.promptToStartup()
		} else {
			await this.restartPtyProcess()
		}
	}

	showNotification (message, infoType, restartButtonText = 'Restart') {
		const messageDiv = document.createElement('div')
		const restartButton = document.createElement('button')
		restartButton.classList.add('btn')
		restartButton.appendChild(document.createTextNode(restartButtonText))
		restartButton.addEventListener('click', (event) => {
			this.restartPtyProcess()
		}, { passive: true })
		restartButton.classList.add('btn-' + infoType)
		restartButton.classList.add('x-terminal-restart-btn')
		messageDiv.classList.add('x-terminal-notice-' + infoType)
		messageDiv.appendChild(document.createTextNode(message))
		messageDiv.appendChild(restartButton)
		this.topDiv.innerHTML = ''
		this.topDiv.appendChild(messageDiv)
		if (infoType === 'success') {
			atom.notifications.addSuccess(message)
		} else if (infoType === 'error') {
			atom.notifications.addError(message)
		} else if (infoType === 'warning') {
			atom.notifications.addWarning(message)
		} else if (infoType === 'info') {
			atom.notifications.addInfo(message)
		} else {
			throw new Error('Unknown info type: ' + infoType)
		}
	}

	async promptToStartup () {
		let message
		if (this.model.profile.title === null) {
			const command = [this.getShellCommand()]
			command.push(...this.getArgs())
			message = `New command ${JSON.stringify(command)} ready to start.`
		} else {
			message = `New command for profile ${this.model.profile.title} ready to start.`
		}
		this.showNotification(
			message,
			'info',
			'Start',
		)
	}

	async restartPtyProcess () {
		const cwd = await this.getCwd()
		if (this.ptyProcessRunning) {
			this.ptyProcess.removeAllListeners('exit')
			this.ptyProcess.kill()
		}
		// Reset the terminal.
		this.atomXtermProfileMenuElement.hideProfileMenu()
		this.terminal.reset()

		// Setup pty process.
		this.ptyProcessCommand = this.getShellCommand()
		this.ptyProcessArgs = this.getArgs()
		const name = this.getTermType()
		const env = this.getEnv()
		const encoding = this.getEncoding()

		// Attach pty process to terminal.
		// NOTE: This must be done after the terminal is attached to the
		// parent element and refitted.
		this.ptyProcessOptions = {
			name: name,
			cwd: cwd,
			env: env,
		}
		if (encoding) {
			// There's some issue if 'encoding=null' is passed in the options,
			// therefore, only set it if there's an actual encoding to set.
			this.ptyProcessOptions.encoding = encoding
		}

		this.ptyProcessOptions.cols = this.ptyProcessCols
		this.ptyProcessOptions.rows = this.ptyProcessRows
		this.ptyProcess = null
		this.ptyProcessRunning = false
		try {
			this.ptyProcess = spawnPty(this.ptyProcessCommand, this.ptyProcessArgs, this.ptyProcessOptions)

			if (this.ptyProcess) {
				this.ptyProcessRunning = true
				this.ptyProcess.on('data', (data) => {
					const oldTitle = this.model.title
					if (this.model.profile.title !== null) {
						this.model.title = this.model.profile.title
					} else if (process.platform !== 'win32') {
						this.model.title = this.ptyProcess.process
					}
					if (oldTitle !== this.model.title) {
						this.model.emitter.emit('did-change-title', this.model.title)
					}
					this.terminal.write(data)
					this.model.handleNewDataArrival()
				})
				this.ptyProcess.on('exit', (code, signal) => {
					this.ptyProcessRunning = false
					if (!this.leaveOpenAfterExit()) {
						this.model.exit()
					} else {
						if (code === 0) {
							this.showNotification(
								'The terminal process has finished successfully.',
								'success',
							)
						} else {
							this.showNotification(
								'The terminal process has exited with failure code \'' + code + '\'.',
								'error',
							)
						}
					}
				})
				this.topDiv.innerHTML = ''
			}
		} catch (err) {
			let message = 'Launching \'' + this.ptyProcessCommand + '\' raised the following error: ' + err.message
			if (err.message.startsWith('File not found:')) {
				message = 'Could not find command \'' + this.ptyProcessCommand + '\'.'
			}
			this.showNotification(
				message,
				'error',
			)
		}
	}

	applyPendingTerminalProfileOptions () {
		// For any changes involving the xterm.js Terminal object, only apply them
		// when the terminal is visible.
		if (this.terminalDivInitiallyVisible) {
			const xtermOptions = this.pendingTerminalProfileOptions.xtermOptions || {}
			// NOTE: For legacy reasons, the font size is defined from the 'fontSize'
			// key outside of any defined xterm.js Terminal options.
			delete xtermOptions.fontSize
			if ('fontSize' in this.pendingTerminalProfileOptions) {
				xtermOptions.fontSize = this.pendingTerminalProfileOptions.fontSize
				delete this.pendingTerminalProfileOptions.fontSize
			}
			delete xtermOptions.fontFamily
			if ('fontFamily' in this.pendingTerminalProfileOptions) {
				xtermOptions.fontFamily = this.pendingTerminalProfileOptions.fontFamily
				delete this.pendingTerminalProfileOptions.fontFamily
			}
			delete xtermOptions.theme
			if (
				'theme' in this.pendingTerminalProfileOptions ||
				Object.values(COLORS).some(c => c in this.pendingTerminalProfileOptions)
			) {
				xtermOptions.theme = this.getTheme(this.pendingTerminalProfileOptions)
				delete this.pendingTerminalProfileOptions.theme
				Object.values(COLORS).forEach(c => delete this.pendingTerminalProfileOptions[c])
			}
			this.setMainBackgroundColor()
			for (const key of Object.keys(xtermOptions)) {
				this.terminal.setOption(key, xtermOptions[key])
			}
			delete this.pendingTerminalProfileOptions.xtermOptions

			// Restart the pty process if changes to the pty process settings are
			// being made.
			// NOTE: When applying new pty settings, the terminal still needs to be
			// visible.
			const a = new Set(Object.keys(this.pendingTerminalProfileOptions))
			const intersection = new Set([...a].filter(x => PTY_PROCESS_OPTIONS.has(x)))
			if (intersection.size !== 0) {
				this.restartPtyProcess()
				for (const key of intersection) {
					delete this.pendingTerminalProfileOptions[key]
				}
			}

			this.refitTerminal()
		}

		// x-terminal specific options can be removed since at this point they
		// should already be applied in the terminal's profile.
		for (const key of X_TERMINAL_OPTIONS) {
			delete this.pendingTerminalProfileOptions[key]
		}
	}

	refitTerminal () {
		// Only refit the terminal when it is completely visible.
		if (
			this.terminalDivInitiallyVisible &&
			this.mainDivContentRect &&
			this.mainDivContentRect.width > 0 &&
			this.mainDivContentRect.height > 0
		) {
			this.fitAddon.fit()
			const geometry = this.fitAddon.proposeDimensions()
			if (geometry && this.isPtyProcessRunning()) {
				// Resize pty process
				if (this.ptyProcessCols !== geometry.cols || this.ptyProcessRows !== geometry.rows) {
					this.ptyProcess.resize(geometry.cols, geometry.rows)
					this.ptyProcessCols = geometry.cols
					this.ptyProcessRows = geometry.rows
				}
			}
		}
	}

	focusOnTerminal () {
		if (this.terminal) {
			this.model.setActive()
			this.terminal.focus()
		}
	}

	async toggleProfileMenu () {
		// The profile menu needs to be initialized before it can be toggled.
		await this.atomXtermProfileMenuElement.initializedPromise
		this.atomXtermProfileMenuElement.toggleProfileMenu()
	}

	hideTerminal () {
		this.terminalDiv.style.visibility = 'hidden'
	}

	showTerminal () {
		this.terminalDiv.style.visibility = 'visible'
	}

	queueNewProfileChanges (profileChanges) {
		this.pendingTerminalProfileOptions = {
			...this.pendingTerminalProfileOptions,
			...profileChanges,
		}
		this.applyPendingTerminalProfileOptions()
	}
}

const XTerminalElement = document.registerElement('x-terminal', {
	prototype: XTerminalElementImpl.prototype,
})

export {
	XTerminalElement,
}
