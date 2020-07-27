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

import { Emitter } from 'atom'

import { recalculateActive } from './utils'
import { XTerminalProfilesSingleton } from './profiles'

import fs from 'fs-extra'
import path from 'path'
import os from 'os'

import { URL } from 'whatwg-url'

const DEFAULT_TITLE = 'X Terminal'

/**
 * The main terminal model, or rather item, displayed in the Atom workspace.
 *
 * @class
 */
class XTerminalModel {
	// NOTE: Though the class is publically accessible, all methods except for the
	// ones defined at the very bottom of the class should be considered private
	// and subject to change at any time.
	constructor (options) {
		this.options = options
		this.uri = this.options.uri
		const url = new URL(this.uri)
		this.sessionId = url.host
		this.profilesSingleton = XTerminalProfilesSingleton.instance
		this.profile = this.profilesSingleton.createProfileDataFromUri(this.uri)
		this.terminals_set = this.options.terminals_set
		this.activeIndex = this.terminals_set.size
		this.element = null
		this.pane = null
		this.title = DEFAULT_TITLE
		if (this.profile.title !== null) {
			this.title = this.profile.title
		}
		this.modified = false
		this.emitter = new Emitter()
		this.terminals_set.add(this)

		// Determine appropriate initial working directory based on previous
		// active item. Since this involves async operations on the file
		// system, a Promise will be used to indicate when initialization is
		// done.
		this.isInitialized = false
		this.initializedPromise = this.initialize().then(() => {
			this.isInitialized = true
		})
	}

	async initialize () {
		const baseProfile = this.profilesSingleton.getBaseProfile()
		const previousActiveItem = atom.workspace.getActivePaneItem()
		let cwd = this.profile.projectCwd ? atom.project.getPaths()[0] : this.profile.cwd
		if (typeof previousActiveItem !== 'undefined' && typeof previousActiveItem.getPath === 'function') {
			cwd = previousActiveItem.getPath()
		}
		const dir = atom.project.relativizePath(cwd)[0]
		if (dir) {
			// Use project paths whenever they are available by default.
			this.profile.cwd = dir
			return
		}
		if (!cwd) {
			this.profile.cwd = baseProfile.cwd
			return
		}
		const exists = await fs.exists(cwd)
		if (!exists) {
			this.profile.cwd = baseProfile.cwd
			return
		}

		// Otherwise, if the path exists on the local file system, use the
		// path or parent directory as appropriate.
		const stats = await fs.stat(cwd)
		if (stats.isDirectory()) {
			this.profile.cwd = cwd
			return
		}

		cwd = path.dirname(cwd)
		const dirStats = await fs.stat(cwd)
		if (dirStats.isDirectory) {
			this.profile.cwd = cwd
			return
		}

		this.profile.cwd = baseProfile.cwd
	}

	serialize () {
		return {
			deserializer: 'XTerminalModel',
			version: '2017-09-17',
			uri: this.profilesSingleton.generateNewUrlFromProfileData(this.profile).href,
		}
	}

	destroy () {
		if (this.element) {
			this.element.destroy()
		}
		this.terminals_set.delete(this)
	}

	getTitle () {
		return (this.isActiveTerminal() ? '* ' : '') + this.title
		// return this.activeIndex + '|' + this.title
	}

	getElement () {
		return this.element
	}

	getURI () {
		return this.uri
	}

	getLongTitle () {
		if (this.title === DEFAULT_TITLE) {
			return DEFAULT_TITLE
		}
		return DEFAULT_TITLE + ' (' + this.title + ')'
	}

	onDidChangeTitle (callback) {
		return this.emitter.on('did-change-title', callback)
	}

	getIconName () {
		return 'terminal'
	}

	getPath () {
		return this.profile.cwd
	}

	isModified () {
		return this.modified
	}

	onDidChangeModified (callback) {
		return this.emitter.on('did-change-modified', callback)
	}

	handleNewDataArrival () {
		if (!this.pane) {
			this.pane = atom.workspace.paneForItem(this)
		}
		const oldIsModified = this.modified
		let item
		if (this.pane) {
			item = this.pane.getActiveItem()
		}
		if (item === this) {
			this.modified = false
		} else {
			this.modified = true
		}
		if (oldIsModified !== this.modified) {
			this.emitter.emit('did-change-modified', this.modified)
		}
	}

	getSessionId () {
		return this.sessionId
	}

	getSessionParameters () {
		const url = this.profilesSingleton.generateNewUrlFromProfileData(this.profile)
		url.searchParams.sort()
		return url.searchParams.toString()
	}

	refitTerminal () {
		// Only refit if there's a DOM element attached to the model.
		if (this.element) {
			this.element.refitTerminal()
		}
	}

	focusOnTerminal () {
		this.element.focusOnTerminal()
		const oldIsModified = this.modified
		this.modified = false
		if (oldIsModified !== this.modified) {
			this.emitter.emit('did-change-modified', this.modified)
		}
	}

	exit () {
		this.pane.destroyItem(this, true)
	}

	restartPtyProcess () {
		if (this.element) {
			this.element.restartPtyProcess()
		}
	}

	copyFromTerminal () {
		return this.element.terminal.getSelection()
	}

	runCommand (cmd) {
		this.pasteToTerminal(cmd + os.EOL.charAt(0))
	}

	pasteToTerminal (text) {
		this.element.ptyProcess.write(text)
	}

	setActive () {
		recalculateActive(this.terminals_set, this)
	}

	isVisible () {
		return this.pane && this.pane.getActiveItem() === this && (!this.dock || this.dock.isVisible())
	}

	isActiveTerminal () {
		return this.activeIndex === 0 && (atom.config.get('x-terminal.terminalSettings.allowHiddenToStayActive') || this.isVisible())
	}

	setNewPane (pane) {
		this.pane = pane
		const location = this.pane.getContainer().getLocation()
		switch (location) {
			case 'left':
				this.dock = atom.workspace.getLeftDock()
				break
			case 'right':
				this.dock = atom.workspace.getRightDock()
				break
			case 'bottom':
				this.dock = atom.workspace.getBottomDock()
				break
			default:
				this.dock = null
		}
	}

	toggleProfileMenu () {
		this.element.toggleProfileMenu()
	}

	/* Public methods are defined below this line. */

	/**
   * Retrieve profile for this {@link XTerminalModel} instance.
   *
   * @function
   * @return {Object} Profile for {@link XTerminalModel} instance.
   */
	getProfile () {
		return this.profile
	}

	/**
   * Apply profile changes to {@link XTerminalModel} instance.
   *
   * @function
   * @param {Object} profileChanges Profile changes to apply.
   */
	applyProfileChanges (profileChanges) {
		profileChanges = this.profilesSingleton.sanitizeData(profileChanges)
		this.profile = this.profilesSingleton.deepClone({
			...this.profile,
			...profileChanges,
		})
		this.element.queueNewProfileChanges(profileChanges)
	}
}

function isXTerminalModel (item) {
	return (item instanceof XTerminalModel)
}

function currentItemIsXTerminalModel () {
	return isXTerminalModel(atom.workspace.getActivePaneItem())
}

export {
	XTerminalModel,
	isXTerminalModel,
	currentItemIsXTerminalModel,
}
