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

import { CompositeDisposable, TextEditor } from 'atom'

import { AtomXtermProfilesSingleton } from './atom-xterm-profiles'
import { AtomXtermDeleteProfileModel } from './atom-xterm-delete-profile-model'
import { AtomXtermSaveProfileModel } from './atom-xterm-save-profile-model'
import { createHorizontalLine } from './atom-xterm-utils'
import { config, COLORS } from './atom-xterm-config.js'

class AtomXtermProfileMenuElementImpl extends HTMLElement {
	async initialize (model) {
		this.model = model
		this.model.setElement(this)
		this.profilesSingleton = AtomXtermProfilesSingleton.instance
		const topDiv = document.createElement('div')
		topDiv.classList.add('atom-xterm-profile-menu-element-top-div')
		this.appendChild(topDiv)
		const leftDiv = document.createElement('div')
		leftDiv.classList.add('atom-xterm-profile-menu-element-left-div')
		this.appendChild(leftDiv)
		this.mainDiv = document.createElement('div')
		this.mainDiv.classList.add('atom-xterm-profile-menu-element-main-div')
		this.appendChild(this.mainDiv)
		const rightDiv = document.createElement('div')
		rightDiv.classList.add('atom-xterm-profile-menu-element-right-div')
		this.appendChild(rightDiv)
		const bottomDiv = document.createElement('div')
		bottomDiv.classList.add('atom-xterm-profile-menu-element-bottom-div')
		this.appendChild(bottomDiv)
		this.disposables = new CompositeDisposable()
		let resolveInit
		this.initializedPromise = new Promise((resolve, reject) => {
			resolveInit = resolve
		})

		const profilesDiv = await this.createProfilesDropDown()
		const modelProfile = this.getModelProfile()
		const baseProfile = this.profilesSingleton.getBaseProfile()
		// Profiles
		this.mainDiv.appendChild(profilesDiv)

		// Buttons div
		this.mainDiv.appendChild(this.createProfileMenuButtons())

		// Horizontal line.
		this.mainDiv.appendChild(createHorizontalLine())

		this.createFromConfig(config, baseProfile, modelProfile)

		this.deleteProfileModel = new AtomXtermDeleteProfileModel(this)
		this.saveProfileModel = new AtomXtermSaveProfileModel(this)

		this.disposables.add(this.profilesSingleton.onDidReloadProfiles(async (profiles) => {
			const select = await this.createProfilesDropDownSelectItem()
			const menuItemContainer = this.mainDiv.querySelector('#profiles-selection')
			while (menuItemContainer.firstChild) {
				menuItemContainer.removeChild(menuItemContainer.firstChild)
			}
			menuItemContainer.appendChild(select)
		}))
		resolveInit()
	}

	createFromConfig (configObj, baseProfile, modelProfile) {
		for (const name in configObj) {
			const item = configObj[name]
			if (item.type === 'object') {
				this.createFromConfig(item.properties, baseProfile, modelProfile)
				continue
			}
			const title = item.title || name.charAt(0).toUpperCase() + name.substring(1).replace(/[A-Z]/g, ' $&')
			const description = item.description || ''
			if (item.enum) {
				this.mainDiv.appendChild(this.createSelect(
					`${name.toLowerCase()}-select`,
					title,
					description,
					baseProfile[name],
					modelProfile[name],
					item.enum,
				))
			} else if (item.type === 'color') {
				const profileName = COLORS[name]
				this.mainDiv.appendChild(this.createColor(
					`${profileName.toLowerCase()}-color`,
					title,
					description,
					baseProfile[profileName],
					modelProfile[profileName],
				))
			} else if (item.type === 'boolean') {
				this.mainDiv.appendChild(this.createCheckbox(
					`${name.toLowerCase()}-checkbox`,
					title,
					description,
					baseProfile[name],
					modelProfile[name],
				))
			} else {
				this.mainDiv.appendChild(this.createTextbox(
					`${name.toLowerCase()}-textbox`,
					title,
					description,
					baseProfile[name],
					modelProfile[name],
				))
			}
		}
	}

	destroy () {
		if (this.disposables) {
			this.disposables.dispose()
		}
	}

	getModelProfile () {
		return this.model.atomXtermModel.profile
	}

	parseJson (value, defaultValue, type) {
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

	getMenuElements () {
		const menuElements = {}
		menuElements.commandElement = this.mainDiv.querySelector('#command-textbox atom-text-editor')
		menuElements.argsElement = this.mainDiv.querySelector('#args-textbox atom-text-editor')
		menuElements.nameElement = this.mainDiv.querySelector('#name-textbox atom-text-editor')
		menuElements.cwdElement = this.mainDiv.querySelector('#cwd-textbox atom-text-editor')
		menuElements.envElement = this.mainDiv.querySelector('#env-textbox atom-text-editor')
		menuElements.setEnvElement = this.mainDiv.querySelector('#setenv-textbox atom-text-editor')
		menuElements.deleteEnvElement = this.mainDiv.querySelector('#deleteenv-textbox atom-text-editor')
		menuElements.encodingElement = this.mainDiv.querySelector('#encoding-textbox atom-text-editor')
		menuElements.fontSizeElement = this.mainDiv.querySelector('#fontsize-textbox atom-text-editor')
		menuElements.fontFamilyElement = this.mainDiv.querySelector('#fontfamily-textbox atom-text-editor')
		menuElements.themeElement = this.mainDiv.querySelector('#theme-select .atom-xterm-profile-menu-item-select')
		for (const c of Object.values(COLORS)) {
			menuElements[`${c}Element`] = this.mainDiv.querySelector(`#${c.toLowerCase()}-color .atom-xterm-profile-menu-item-color`)
		}

		menuElements.leaveOpenAfterExitElement = this.mainDiv.querySelector('#leaveopenafterexit-checkbox .atom-xterm-profile-menu-item-checkbox')
		menuElements.relaunchTerminalOnStartupElement = this.mainDiv.querySelector('#relaunchterminalonstartup-checkbox .atom-xterm-profile-menu-item-checkbox')
		menuElements.titleElement = this.mainDiv.querySelector('#title-textbox atom-text-editor')
		menuElements.xtermOptionsElement = this.mainDiv.querySelector('#xtermoptions-textbox atom-text-editor')
		menuElements.promptToStartupElement = this.mainDiv.querySelector('#prompttostartup-checkbox .atom-xterm-profile-menu-item-checkbox')
		return menuElements
	}

	getProfileMenuSettings () {
		const newProfile = {}
		const baseProfile = this.profilesSingleton.getBaseProfile()
		const menuElements = this.getMenuElements()
		newProfile.command = menuElements.commandElement.getModel().getText() || baseProfile.command
		newProfile.args = this.parseJson(
			menuElements.argsElement.getModel().getText(),
			baseProfile.args,
			Array,
		)
		newProfile.name = menuElements.nameElement.getModel().getText() || baseProfile.name
		newProfile.cwd = menuElements.cwdElement.getModel().getText() || baseProfile.cwd
		newProfile.env = this.parseJson(
			menuElements.envElement.getModel().getText(),
			baseProfile.env,
			Object,
		)
		newProfile.setEnv = this.parseJson(
			menuElements.setEnvElement.getModel().getText(),
			baseProfile.setEnv,
			Object,
		)
		newProfile.deleteEnv = this.parseJson(
			menuElements.deleteEnvElement.getModel().getText(),
			baseProfile.deleteEnv,
			Array,
		)
		newProfile.encoding = menuElements.encodingElement.getModel().getText() || baseProfile.encoding
		newProfile.fontSize = this.parseJson(
			menuElements.fontSizeElement.getModel().getText(),
			baseProfile.fontSize,
			Number,
		)
		newProfile.fontFamily = menuElements.fontFamilyElement.getModel().getText() || baseProfile.fontFamily
		newProfile.theme = menuElements.themeElement.value || baseProfile.theme
		for (const c of Object.values(COLORS)) {
			newProfile[c] = menuElements[`${c}Element`].value || baseProfile[c]
		}
		newProfile.leaveOpenAfterExit = menuElements.leaveOpenAfterExitElement.checked
		newProfile.relaunchTerminalOnStartup = menuElements.relaunchTerminalOnStartupElement.checked
		newProfile.title = menuElements.titleElement.getModel().getText() || baseProfile.title
		newProfile.xtermOptions = this.parseJson(
			menuElements.xtermOptionsElement.getModel().getText(),
			baseProfile.xtermOptions,
			Object,
		)
		newProfile.promptToStartup = menuElements.promptToStartupElement.checked
		return newProfile
	}

	applyProfileChanges (profileChanges) {
		this.hideProfileMenu()
		this.model.getAtomXtermModel().applyProfileChanges(profileChanges)
	}

	restartTerminal () {
		this.hideProfileMenu()
		this.model.getAtomXtermModelElement().restartPtyProcess()
	}

	createMenuItemContainer (id, labelTitle, labelDescription) {
		const menuItemContainer = document.createElement('div')
		menuItemContainer.classList.add('atom-xterm-profile-menu-item')
		menuItemContainer.setAttribute('id', id)
		const menuItemLabel = document.createElement('label')
		menuItemLabel.classList.add('atom-xterm-profile-menu-item-label')
		const titleDiv = document.createElement('div')
		titleDiv.classList.add('atom-xterm-profile-menu-item-title')
		titleDiv.appendChild(document.createTextNode(labelTitle))
		menuItemLabel.appendChild(titleDiv)
		const descriptionDiv = document.createElement('div')
		descriptionDiv.classList.add('atom-xterm-profile-menu-item-description')
		descriptionDiv.appendChild(document.createTextNode(labelDescription))
		menuItemLabel.appendChild(descriptionDiv)
		menuItemContainer.appendChild(menuItemLabel)
		return menuItemContainer
	}

	async createProfilesDropDownSelectItem () {
		const profiles = await this.profilesSingleton.getProfiles()
		const select = document.createElement('select')
		select.setAttribute('id', 'profiles-dropdown')
		select.classList.add('atom-xterm-profile-menu-item-select')
		let option = document.createElement('option')
		let text = document.createTextNode('')
		option.setAttribute('value', text)
		option.appendChild(text)
		select.appendChild(option)
		for (const profile in profiles) {
			option = document.createElement('option')
			text = document.createTextNode(profile)
			option.setAttribute('value', text.textContent)
			option.appendChild(text)
			select.appendChild(option)
		}
		select.addEventListener('change', async (event) => {
			if (event.target.value) {
				const profile = await this.profilesSingleton.getProfile(event.target.value)
				this.setNewMenuSettings(profile)
			} else {
				const profile = this.profilesSingleton.getBaseProfile()
				this.setNewMenuSettings(profile, true)
			}
		})
		return select
	}

	async createProfilesDropDown () {
		const menuItemContainer = this.createMenuItemContainer(
			'profiles-selection',
			'Profiles',
			'Available profiles',
		)
		const select = await this.createProfilesDropDownSelectItem()
		menuItemContainer.appendChild(select)
		return menuItemContainer
	}

	createProfileMenuButtons () {
		const buttonsContainer = document.createElement('div')
		buttonsContainer.classList.add('atom-xterm-profile-menu-buttons-div')
		let button = this.createButton()
		button.appendChild(document.createTextNode('Load Settings'))
		button.addEventListener('click', (event) => {
			this.loadProfile()
		})
		buttonsContainer.appendChild(button)
		button = this.createButton()
		button.appendChild(document.createTextNode('Save Settings'))
		button.addEventListener('click', (event) => {
			this.saveProfile()
		})
		buttonsContainer.appendChild(button)
		button = this.createButton()
		button.appendChild(document.createTextNode('Delete Settings'))
		button.addEventListener('click', (event) => {
			this.deleteProfile()
		})
		buttonsContainer.appendChild(button)
		button = this.createButton()
		button.appendChild(document.createTextNode('Restart'))
		button.addEventListener('click', (event) => {
			this.restartTerminal()
		})
		buttonsContainer.appendChild(button)
		button = this.createButton()
		button.appendChild(document.createTextNode('Hide Menu'))
		button.addEventListener('click', (event) => {
			this.hideProfileMenu()
		})
		buttonsContainer.appendChild(button)
		return buttonsContainer
	}

	createButton () {
		const button = document.createElement('button')
		button.classList.add('atom-xterm-profile-menu-button')
		return button
	}

	createTextbox (id, labelTitle, labelDescription, defaultValue, initialValue) {
		const menuItemContainer = this.createMenuItemContainer(
			id,
			labelTitle,
			labelDescription,
		)
		const textbox = new TextEditor({
			mini: true,
			placeholderText: defaultValue,
		})
		if (initialValue) {
			if (initialValue.constructor === Array || initialValue.constructor === Object) {
				textbox.setText(JSON.stringify(initialValue))
			} else {
				textbox.setText(initialValue)
			}
		}
		menuItemContainer.appendChild(textbox.getElement())
		return menuItemContainer
	}

	toHex (color) {
		color = color.replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)/, 'rgb($1, $2, $3)').trim()
		const ctx = document.createElement('canvas').getContext('2d')
		ctx.fillStyle = color
		return ctx.fillStyle
	}

	createColor (id, labelTitle, labelDescription, defaultValue, initialValue) {
		const menuItemContainer = document.createElement('div')
		menuItemContainer.classList.add('atom-xterm-profile-menu-item')
		menuItemContainer.setAttribute('id', id)
		const menuItemLabel = document.createElement('label')
		menuItemLabel.classList.add('atom-xterm-profile-menu-item-label')
		menuItemLabel.classList.add('atom-xterm-profile-menu-item-label-color')
		const color = document.createElement('input')
		color.setAttribute('type', 'color')
		color.classList.add('atom-xterm-profile-menu-item-color')
		color.value = this.toHex(defaultValue)
		if (initialValue !== undefined) {
			color.value = this.toHex(initialValue)
		}
		menuItemLabel.appendChild(color)
		const titleDiv = document.createElement('div')
		titleDiv.classList.add('atom-xterm-profile-menu-item-title')
		titleDiv.appendChild(document.createTextNode(labelTitle))
		menuItemLabel.appendChild(titleDiv)
		menuItemContainer.appendChild(menuItemLabel)
		const descriptionDiv = document.createElement('div')
		descriptionDiv.classList.add('atom-xterm-profile-menu-item-description')
		descriptionDiv.classList.add('atom-xterm-profile-menu-item-description-color')
		descriptionDiv.appendChild(document.createTextNode(labelDescription))
		menuItemContainer.appendChild(descriptionDiv)
		return menuItemContainer
	}

	createSelect (id, labelTitle, labelDescription, defaultValue, initialValue, possibleValues) {
		const menuItemContainer = document.createElement('div')
		menuItemContainer.classList.add('atom-xterm-profile-menu-item')
		menuItemContainer.setAttribute('id', id)
		const menuItemLabel = document.createElement('label')
		menuItemLabel.classList.add('atom-xterm-profile-menu-item-label')
		menuItemLabel.classList.add('atom-xterm-profile-menu-item-label-select')
		const select = document.createElement('select')
		select.setAttribute('type', 'select')
		select.classList.add('atom-xterm-profile-menu-item-select')
		for (let optionValue of possibleValues) {
			if (typeof optionValue !== 'object') {
				optionValue = {
					value: optionValue,
					description: optionValue,
				}
			}
			const option = document.createElement('option')
			option.setAttribute('value', optionValue.value)
			option.textContent = optionValue.description
			select.appendChild(option)
		}
		select.value = defaultValue
		if (initialValue !== undefined) {
			select.value = initialValue
		}
		menuItemLabel.appendChild(select)
		const titleDiv = document.createElement('div')
		titleDiv.classList.add('atom-xterm-profile-menu-item-title')
		titleDiv.appendChild(document.createTextNode(labelTitle))
		menuItemLabel.appendChild(titleDiv)
		menuItemContainer.appendChild(menuItemLabel)
		const descriptionDiv = document.createElement('div')
		descriptionDiv.classList.add('atom-xterm-profile-menu-item-description')
		descriptionDiv.classList.add('atom-xterm-profile-menu-item-description-select')
		descriptionDiv.appendChild(document.createTextNode(labelDescription))
		menuItemContainer.appendChild(descriptionDiv)
		return menuItemContainer
	}

	createCheckbox (id, labelTitle, labelDescription, defaultValue, initialValue) {
		const menuItemContainer = document.createElement('div')
		menuItemContainer.classList.add('atom-xterm-profile-menu-item')
		menuItemContainer.setAttribute('id', id)
		const menuItemLabel = document.createElement('label')
		menuItemLabel.classList.add('atom-xterm-profile-menu-item-label')
		menuItemLabel.classList.add('atom-xterm-profile-menu-item-label-checkbox')
		const checkbox = document.createElement('input')
		checkbox.setAttribute('type', 'checkbox')
		checkbox.classList.add('atom-xterm-profile-menu-item-checkbox')
		checkbox.checked = defaultValue
		if (initialValue !== undefined) {
			checkbox.checked = initialValue
		}
		menuItemLabel.appendChild(checkbox)
		const titleDiv = document.createElement('div')
		titleDiv.classList.add('atom-xterm-profile-menu-item-title')
		titleDiv.appendChild(document.createTextNode(labelTitle))
		menuItemLabel.appendChild(titleDiv)
		menuItemContainer.appendChild(menuItemLabel)
		const descriptionDiv = document.createElement('div')
		descriptionDiv.classList.add('atom-xterm-profile-menu-item-description')
		descriptionDiv.classList.add('atom-xterm-profile-menu-item-description-checkbox')
		descriptionDiv.appendChild(document.createTextNode(labelDescription))
		menuItemContainer.appendChild(descriptionDiv)
		return menuItemContainer
	}

	isVisible () {
		const style = window.getComputedStyle(this, null)
		return (style.visibility === 'visible')
	}

	hideProfileMenu () {
		this.style.visibility = 'hidden'
		const e = this.model.getAtomXtermModelElement()
		e.showTerminal()
		e.focusOnTerminal()
	}

	showProfileMenu () {
		this.model.getAtomXtermModelElement().hideTerminal()
		this.style.visibility = 'visible'
	}

	toggleProfileMenu () {
		if (!this.isVisible()) {
			this.showProfileMenu()
		} else {
			this.hideProfileMenu()
		}
	}

	getNewProfileAndChanges () {
		const newProfile = this.getProfileMenuSettings()
		const profileChanges = this.profilesSingleton.diffProfiles(
			this.model.getAtomXtermModel().getProfile(),
			newProfile,
		)
		return {
			newProfile: newProfile,
			profileChanges: profileChanges,
		}
	}

	loadProfile () {
		const newProfileAndChanges = this.getNewProfileAndChanges()
		this.applyProfileChanges(newProfileAndChanges.profileChanges)
	}

	saveProfile () {
		// Get the current profile settings before entering the promise.
		const newProfileAndChanges = this.getNewProfileAndChanges()
		this.promptForNewProfileName(
			newProfileAndChanges.newProfile,
			newProfileAndChanges.profileChanges,
		)
	}

	deleteProfile () {
		const e = this.mainDiv.querySelector('#profiles-dropdown')
		const profileName = e.options[e.selectedIndex].text
		if (!profileName) {
			atom.notifications.addWarning('Profile must be selected in order to delete it.')
			return
		}
		this.promptDelete(profileName)
	}

	async promptDelete (newProfile) {
		this.deleteProfileModel.promptDelete(newProfile)
	}

	async promptForNewProfileName (newProfile, profileChanges) {
		this.saveProfileModel.promptForNewProfileName(newProfile, profileChanges)
	}

	convertNullToEmptyString (value) {
		if (value === null) {
			return ''
		}
		return JSON.stringify(value)
	}

	setNewMenuSettings (profile, clear = false) {
		const newTextList = {
			'command-textbox': profile.command,
			'args-textbox': JSON.stringify(profile.args),
			'name-textbox': profile.name,
			'cwd-textbox': profile.cwd,
			'env-textbox': this.convertNullToEmptyString(profile.env),
			'setenv-textbox': JSON.stringify(profile.setEnv),
			'deleteenv-textbox': JSON.stringify(profile.deleteEnv),
			'encoding-textbox': this.convertNullToEmptyString(profile.encoding),
			'fontsize-textbox': profile.fontSize,
			'fontfamily-textbox': profile.fontFamily,
			'title-textbox': profile.title || '',
			'xtermoptions-textbox': JSON.stringify(profile.xtermOptions),
		}
		for (const newText in newTextList) {
			const selector = '#' + newText + ' > atom-text-editor'
			const model = this.querySelector(selector).getModel()
			if (!clear) {
				model.setText(newTextList[newText])
			} else {
				model.setText('')
			}
		}

		const newCheckboxList = {
			'leaveopenafterexit-checkbox': profile.leaveOpenAfterExit,
			'relaunchterminalonstartup-checkbox': profile.relaunchTerminalOnStartup,
			'prompttostartup-checkbox': profile.promptToStartup,
		}
		for (const newCheckbox in newCheckboxList) {
			const selector = '#' + newCheckbox + ' input'
			const checkbox = this.querySelector(selector)
			checkbox.checked = newCheckboxList[newCheckbox]
		}
		const newValueList = {}
		for (const c of Object.values(COLORS)) {
			newValueList[`${c.toLowerCase()}-color`] = profile[c]
		}
		for (const newValue in newValueList) {
			const selector = '#' + newValue + ' input'
			const input = this.querySelector(selector)
			input.value = newValueList[newValue]
		}
		const newSelectList = {
			'theme-select': profile.theme,
		}
		for (const newValue in newSelectList) {
			const selector = '#' + newValue + ' select'
			const input = this.querySelector(selector)
			input.value = newSelectList[newValue]
		}
	}
}

const AtomXtermProfileMenuElement = document.registerElement('atom-xterm-profile', {
	prototype: AtomXtermProfileMenuElementImpl.prototype,
})

export {
	AtomXtermProfileMenuElement,
}
