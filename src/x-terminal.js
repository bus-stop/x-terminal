/** @babel */
/** @module x-terminal */
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

import { CONFIG_DATA } from './config'
import { recalculateActive } from './utils'
import { XTerminalElement } from './element'
import { XTerminalModel, isXTerminalModel } from './model'
import { X_TERMINAL_BASE_URI, XTerminalProfilesSingleton } from './profiles'
import { XTerminalProfileMenuElement } from './profile-menu-element'
import { XTerminalProfileMenuModel } from './profile-menu-model'
import { XTerminalDeleteProfileElement } from './delete-profile-element'
import { XTerminalDeleteProfileModel } from './delete-profile-model'
import { XTerminalOverwriteProfileElement } from './overwrite-profile-element'
import { XTerminalOverwriteProfileModel } from './overwrite-profile-model'
import { XTerminalSaveProfileElement } from './save-profile-element'
import { XTerminalSaveProfileModel } from './save-profile-model'

import { URL } from 'whatwg-url'

const XTerminalSingletonSymbol = Symbol('XTerminalSingleton sentinel')

class XTerminalSingleton {
	constructor (symbolCheck) {
		if (XTerminalSingletonSymbol !== symbolCheck) {
			throw new Error('XTerminalSingleton cannot be instantiated directly.')
		}
	}

	static get instance () {
		if (!this[XTerminalSingletonSymbol]) {
			this[XTerminalSingletonSymbol] = new XTerminalSingleton(XTerminalSingletonSymbol)
		}
		return this[XTerminalSingletonSymbol]
	}

	activate (state) {
		// Load profiles configuration.
		this.profilesSingleton = XTerminalProfilesSingleton.instance

		// Reset base profile in case this package was deactivated then
		// reactivated.
		this.profilesSingleton.resetBaseProfile()

		// Disposables for this plugin.
		this.disposables = new CompositeDisposable()

		// Set holding all terminals available at any moment.
		this.terminals_set = new Set()

		// Monitor for changes to all config values.
		for (const data of CONFIG_DATA) {
			this.disposables.add(atom.config.onDidChange(data.keyPath, ({ newValue, oldValue }) => {
				this.profilesSingleton.resetBaseProfile()
			}))
		}

		this.disposables.add(
			// Register view provider for terminal emulator item.
			atom.views.addViewProvider(XTerminalModel, (atomXtermModel) => {
				const atomXtermElement = new XTerminalElement()
				atomXtermElement.initialize(atomXtermModel)
				return atomXtermElement
			}),
			// Register view provider for terminal emulator profile menu item.
			atom.views.addViewProvider(XTerminalProfileMenuModel, (atomXtermProfileMenuModel) => {
				const atomXtermProfileMenuElement = new XTerminalProfileMenuElement()
				atomXtermProfileMenuElement.initialize(atomXtermProfileMenuModel)
				return atomXtermProfileMenuElement
			}),
			// Register view profile for modal items.
			atom.views.addViewProvider(XTerminalDeleteProfileModel, (atomXtermDeleteProfileModel) => {
				const atomXtermDeleteProfileElement = new XTerminalDeleteProfileElement()
				atomXtermDeleteProfileElement.initialize(atomXtermDeleteProfileModel)
				return atomXtermDeleteProfileElement
			}),
			atom.views.addViewProvider(XTerminalOverwriteProfileModel, (atomXtermOverwriteProfileModel) => {
				const atomXtermOverwriteProfileElement = new XTerminalOverwriteProfileElement()
				atomXtermOverwriteProfileElement.initialize(atomXtermOverwriteProfileModel)
				return atomXtermOverwriteProfileElement
			}),
			atom.views.addViewProvider(XTerminalSaveProfileModel, (atomXtermSaveProfileModel) => {
				const atomXtermSaveProfileElement = new XTerminalSaveProfileElement()
				atomXtermSaveProfileElement.initialize(atomXtermSaveProfileModel)
				return atomXtermSaveProfileElement
			}),

			// Add opener for terminal emulator item.
			atom.workspace.addOpener((uri) => {
				if (uri.startsWith(X_TERMINAL_BASE_URI)) {
					const item = new XTerminalModel({
						uri: uri,
						terminals_set: this.terminals_set,
					})
					return item
				}
			}),

			// Set callback to run on current and future panes.
			atom.workspace.observePanes((pane) => {
				// In callback, set another callback to run on current and future items.
				this.disposables.add(pane.observeItems((item) => {
					// In callback, set current pane for terminal items.
					if (isXTerminalModel(item)) {
						item.setNewPane(pane)
					}
					recalculateActive(this.terminals_set)
				}))
				recalculateActive(this.terminals_set)
			}),

			// Add callbacks to run for current and future active items on active panes.
			atom.workspace.observeActivePaneItem((item) => {
				// In callback, focus specifically on terminal when item is terminal item.
				if (isXTerminalModel(item)) {
					item.focusOnTerminal()
				}
				recalculateActive(this.terminals_set)
			}),

			atom.workspace.getRightDock().observeVisible((visible) => {
				if (visible) {
					const item = atom.workspace.getRightDock().getActivePaneItem()
					if (isXTerminalModel(item)) {
						item.focusOnTerminal()
					}
				}
				recalculateActive(this.terminals_set)
			}),

			atom.workspace.getLeftDock().observeVisible((visible) => {
				if (visible) {
					const item = atom.workspace.getLeftDock().getActivePaneItem()
					if (isXTerminalModel(item)) {
						item.focusOnTerminal()
					}
				}
				recalculateActive(this.terminals_set)
			}),

			atom.workspace.getBottomDock().observeVisible((visible) => {
				if (visible) {
					const item = atom.workspace.getBottomDock().getActivePaneItem()
					if (isXTerminalModel(item)) {
						item.focusOnTerminal()
					}
				}
				recalculateActive(this.terminals_set)
			}),

			// Add commands.
			atom.commands.add('atom-workspace', {
				'x-terminal:open': () => this.open(
					this.profilesSingleton.generateNewUri(),
					this.addDefaultPosition(),
				),
				'x-terminal:open-center': () => this.openInCenterOrDock(atom.workspace),
				'x-terminal:open-split-up': () => this.open(
					this.profilesSingleton.generateNewUri(),
					{ split: 'up' },
				),
				'x-terminal:open-split-down': () => this.open(
					this.profilesSingleton.generateNewUri(),
					{ split: 'down' },
				),
				'x-terminal:open-split-left': () => this.open(
					this.profilesSingleton.generateNewUri(),
					{ split: 'left' },
				),
				'x-terminal:open-split-right': () => this.open(
					this.profilesSingleton.generateNewUri(),
					{ split: 'right' },
				),
				'x-terminal:open-split-bottom-dock': () => this.openInCenterOrDock(atom.workspace.getBottomDock()),
				'x-terminal:open-split-left-dock': () => this.openInCenterOrDock(atom.workspace.getLeftDock()),
				'x-terminal:open-split-right-dock': () => this.openInCenterOrDock(atom.workspace.getRightDock()),
				'x-terminal:toggle-profile-menu': () => this.toggleProfileMenu(),
				'x-terminal:reorganize': () => this.reorganize('current'),
				'x-terminal:reorganize-top': () => this.reorganize('top'),
				'x-terminal:reorganize-bottom': () => this.reorganize('bottom'),
				'x-terminal:reorganize-left': () => this.reorganize('left'),
				'x-terminal:reorganize-right': () => this.reorganize('right'),
				'x-terminal:reorganize-bottom-dock': () => this.reorganize('bottom-dock'),
				'x-terminal:reorganize-left-dock': () => this.reorganize('left-dock'),
				'x-terminal:reorganize-right-dock': () => this.reorganize('right-dock'),
				'x-terminal:close-all': () => this.exitAllTerminals(),
				'x-terminal:insert-selected-text': () => this.insertSelection(),
				'x-terminal:run-selected-text': () => this.runSelection(),
			}),
			atom.commands.add('x-terminal', {
				'x-terminal:close': () => this.close(),
				'x-terminal:restart': () => this.restart(),
				'x-terminal:copy': () => this.copy(),
				'x-terminal:paste': () => this.paste(),
				'x-terminal:unfocus': () => this.unfocus(),
			}),
		)
	}

	deactivate () {
		this.exitAllTerminals()
		this.disposables.dispose()
	}

	deserializeXTerminalModel (serializedModel, atomEnvironment) {
		const pack = atom.packages.enablePackage('x-terminal')
		pack.preload()
		pack.activateNow()
		const allowRelaunchingTerminalsOnStartup = atom.config.get('x-terminal.terminalSettings.allowRelaunchingTerminalsOnStartup')
		if (!allowRelaunchingTerminalsOnStartup) {
			return
		}
		const url = new URL(serializedModel.uri)
		const relaunchTerminalOnStartup = url.searchParams.get('relaunchTerminalOnStartup')
		if (relaunchTerminalOnStartup === 'false') {
			return
		}
		return new XTerminalModel({
			uri: url.href,
			terminals_set: this.terminals_set,
		})
	}

	openInCenterOrDock (centerOrDock, options = {}) {
		const pane = centerOrDock.getActivePane()
		if (pane) {
			options.pane = pane
		}
		return this.open(
			this.profilesSingleton.generateNewUri(),
			options,
		)
	}

	refitAllTerminals () {
		const currentActivePane = atom.workspace.getActivePane()
		const currentActiveItem = currentActivePane.getActiveItem()
		for (const terminal of this.terminals_set) {
			// To refit, simply bring the terminal in focus in order for the
			// resize event to refit the terminal.
			const paneActiveItem = terminal.pane.getActiveItem()
			terminal.pane.getElement().focus()
			terminal.pane.setActiveItem(terminal)
			terminal.pane.setActiveItem(paneActiveItem)
		}
		currentActivePane.getElement().focus()
		currentActivePane.setActiveItem(currentActiveItem)
	}

	exitAllTerminals () {
		for (const terminal of this.terminals_set) {
			terminal.exit()
		}
	}

	getSelectedText () {
		const editor = atom.workspace.getActiveTextEditor()
		if (!editor) {
			return ''
		}

		let selectedText = ''
		const selection = editor.getSelectedText()
		if (selection) {
			selectedText = selection.replace(/[\r\n]+$/, '')
		} else {
			const cursor = editor.getCursorBufferPosition()
			if (cursor) {
				const line = editor.lineTextForBufferRow(cursor.row)
				selectedText = line
				editor.moveDown(1)
			}
		}

		return selectedText
	}

	getActiveTerminal () {
		const terminals = [...this.terminals_set]
		return terminals.find(t => t.isActiveTerminal())
	}

	insertSelection () {
		const selection = this.getSelectedText()
		const terminal = this.getActiveTerminal()
		if (selection && terminal) {
			terminal.pasteToTerminal(selection)
		}
	}

	runSelection () {
		const selection = this.getSelectedText()
		const terminal = this.getActiveTerminal()
		if (selection && terminal) {
			terminal.runCommand(selection)
		}
	}

	async open (uri, options = {}) {
		const url = new URL(uri)
		let relaunchTerminalOnStartup = url.searchParams.get('relaunchTerminalOnStartup')
		if (relaunchTerminalOnStartup === null) {
			relaunchTerminalOnStartup = this.profilesSingleton.getBaseProfile().relaunchTerminalOnStartup
			if (!relaunchTerminalOnStartup) {
				url.searchParams.set('relaunchTerminalOnStartup', false)
			}
		}
		return atom.workspace.open(url.href, options)
	}

	/**
	 * Service function which is a wrapper around 'atom.workspace.open()'. The
	 * only difference with this function from 'atom.workspace.open()' is that it
	 * accepts a profile Object as the first argument.
	 *
	 * @async
	 * @function
	 * @param {Object} profile Profile data to use when opening terminal.
	 * @param {Object} options Options to pass to call to 'atom.workspace.open()'.
	 * @return {XTerminalModel} Instance of XTerminalModel.
	 */
	async openTerminal (profile, options = {}) {
		options = this.addDefaultPosition(options)
		return this.open(
			XTerminalProfilesSingleton.instance.generateNewUrlFromProfileData(profile),
			options,
		)
	}

	/**
	 * Service function which opens a terminal and runs the commands.
	 *
	 * @async
	 * @function
	 * @param {string[]} commands Commands to run in the terminal.
	 * @return {XTerminalModel} Instance of XTerminalModel.
	 */
	async runCommands (commands) {
		let terminal
		if (atom.config.get('x-terminal.terminalSettings.runInActive')) {
			terminal = this.getActiveTerminal()
		}

		if (!terminal) {
			const options = this.addDefaultPosition()
			terminal = await this.open(
				XTerminalProfilesSingleton.instance.generateNewUri(),
				options,
			)
		}

		await terminal.element.initializedPromise
		for (const command of commands) {
			terminal.runCommand(command)
		}
	}

	addDefaultPosition (options = {}) {
		const position = atom.config.get('x-terminal.terminalSettings.defaultOpenPosition')
		switch (position) {
			case 'Center': {
				const pane = atom.workspace.getActivePane()
				if (pane && !('pane' in options)) {
					options.pane = pane
				}
				break
			}
			case 'Split Up':
				if (!('split' in options)) {
					options.split = 'up'
				}
				break
			case 'Split Down':
				if (!('split' in options)) {
					options.split = 'down'
				}
				break
			case 'Split Left':
				if (!('split' in options)) {
					options.split = 'left'
				}
				break
			case 'Split Right':
				if (!('split' in options)) {
					options.split = 'right'
				}
				break
			case 'Bottom Dock': {
				const pane = atom.workspace.getBottomDock().getActivePane()
				if (pane && !('pane' in options)) {
					options.pane = pane
				}
				break
			}
			case 'Left Dock': {
				const pane = atom.workspace.getLeftDock().getActivePane()
				if (pane && !('pane' in options)) {
					options.pane = pane
				}
				break
			}
			case 'Right Dock': {
				const pane = atom.workspace.getRightDock().getActivePane()
				if (pane && !('pane' in options)) {
					options.pane = pane
				}
				break
			}
		}
		return options
	}

	/**
	 * Function providing service functions offered by 'atom-xterm' service.
	 *
	 * @function
	 * @returns {Object} Object holding service functions.
	 */
	provideAtomXtermService () {
		return {
			openTerminal: async (...args) => {
				return this.openTerminal(...args)
			},
		}
	}

	/**
	 * Function providing service functions offered by 'platformioIDETerminal' service.
	 *
	 * @function
	 * @returns {Object} Object holding service functions.
	 */
	providePlatformIOIDEService () {
		return {
			updateProcessEnv (vars) {
				for (const name in vars) {
					process.env[name] = vars[name]
				}
			},
			run: (commands) => {
				return this.runCommands(commands)
			},
			getTerminalViews: () => {
				return this.terminals_set
			},
			open: () => {
				return this.openTerminal()
			},
		}
	}

	performOperationOnItem (operation) {
		const item = atom.workspace.getActivePaneItem()
		if (isXTerminalModel(item)) {
			switch (operation) {
				case 'close':
					item.exit()
					break
				case 'restart':
					item.restartPtyProcess()
					break
				case 'copy':
					atom.clipboard.write(item.copyFromTerminal())
					break
				case 'paste':
					item.pasteToTerminal(atom.clipboard.read())
					break
				default:
					throw new Error('Unknown operation: ' + operation)
			}
		}
	}

	close () {
		this.performOperationOnItem('close')
	}

	restart () {
		this.performOperationOnItem('restart')
	}

	copy () {
		this.performOperationOnItem('copy')
	}

	paste () {
		this.performOperationOnItem('paste')
	}

	unfocus () {
		atom.views.getView(atom.workspace).focus()
	}

	toggleProfileMenu () {
		const item = atom.workspace.getActivePaneItem()
		if (isXTerminalModel(item)) {
			item.toggleProfileMenu()
		}
	}

	reorganize (orientation) {
		if (this.terminals_set.size === 0) {
			return
		}
		const activePane = atom.workspace.getActivePane()
		let activeItem = activePane.getActiveItem()
		let newPane
		switch (orientation) {
			case 'current':
				newPane = activePane
				break
			case 'top':
				newPane = activePane.findTopmostSibling().splitUp()
				break
			case 'bottom':
				newPane = activePane.findBottommostSibling().splitDown()
				break
			case 'left':
				newPane = activePane.findLeftmostSibling().splitLeft()
				break
			case 'right':
				newPane = activePane.findRightmostSibling().splitRight()
				break
			case 'bottom-dock':
				newPane = atom.workspace.getBottomDock().getActivePane()
				break
			case 'left-dock':
				newPane = atom.workspace.getLeftDock().getActivePane()
				break
			case 'right-dock':
				newPane = atom.workspace.getRightDock().getActivePane()
				break
			default:
				throw new Error('Unknown orientation: ' + orientation)
		}
		for (const item of this.terminals_set) {
			item.pane.moveItemToPane(item, newPane, -1)
		}
		if (isXTerminalModel(activeItem)) {
			if (atom.workspace.getPanes().length > 1) {
				// When reorganizing still leaves more than one pane in the
				// workspace, another pane that doesn't include the newly
				// reorganized terminal tabs needs to be focused in order for
				// the terminal views to get properly resized in the new pane.
				// All this is yet another quirk.
				for (const pane of atom.workspace.getPanes()) {
					if (pane !== activeItem.pane) {
						pane.getElement().focus()
						break
					}
				}
			}
			activeItem.pane.getElement().focus()
			activeItem.pane.setActiveItem(activeItem)
		} else if (activeItem instanceof HTMLElement) {
			activeItem.focus()
		} else if (typeof activeItem.getElement === 'function') {
			activeItem = activeItem.getElement()
			activeItem.focus()
		}
	}
}

export { config } from './config'

export function getInstance () {
	return XTerminalSingleton.instance
}

export function activate (state) {
	return XTerminalSingleton.instance.activate(state)
}

export function deactivate () {
	return XTerminalSingleton.instance.deactivate()
}

export function deserializeXTerminalModel (serializedModel, atomEnvironment) {
	return XTerminalSingleton.instance.deserializeXTerminalModel(
		serializedModel,
		atomEnvironment,
	)
}

export function provideAtomXtermService () {
	return XTerminalSingleton.instance.provideAtomXtermService()
}

export function providePlatformIOIDEService () {
	return XTerminalSingleton.instance.providePlatformIOIDEService()
}
