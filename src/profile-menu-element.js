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

import { CompositeDisposable, TextEditor } from 'atom'
import marked from 'marked'

import { XTerminalProfilesSingleton } from './profiles'
import { XTerminalDeleteProfileModel } from './delete-profile-model'
import { XTerminalSaveProfileModel } from './save-profile-model'
import { createHorizontalLine } from './utils'
import { CONFIG_DATA } from './config.js'

class XTerminalProfileMenuElementImpl extends HTMLElement {
	async initialize (model) {
		this.model = model
		this.model.setElement(this)
		this.profilesSingleton = XTerminalProfilesSingleton.instance
		const topDiv = document.createElement('div')
		topDiv.classList.add('x-terminal-profile-menu-element-top-div')
		this.appendChild(topDiv)
		const leftDiv = document.createElement('div')
		leftDiv.classList.add('x-terminal-profile-menu-element-left-div')
		this.appendChild(leftDiv)
		this.mainDiv = document.createElement('div')
		this.mainDiv.classList.add('x-terminal-profile-menu-element-main-div')
		this.appendChild(this.mainDiv)
		const rightDiv = document.createElement('div')
		rightDiv.classList.add('x-terminal-profile-menu-element-right-div')
		this.appendChild(rightDiv)
		const bottomDiv = document.createElement('div')
		bottomDiv.classList.add('x-terminal-profile-menu-element-bottom-div')
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

		this.createFromConfig(baseProfile, modelProfile)

		this.deleteProfileModel = new XTerminalDeleteProfileModel(this)
		this.saveProfileModel = new XTerminalSaveProfileModel(this)

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

	createFromConfig (baseProfile, modelProfile) {
		for (const data of CONFIG_DATA) {
			if (!data.profileKey) continue
			const title = data.title || data.profileKey.charAt(0).toUpperCase() + data.profileKey.substring(1).replace(/[A-Z]/g, ' $&')
			const description = data.description || ''
			if (data.enum) {
				this.mainDiv.appendChild(this.createSelect(
					`${data.profileKey.toLowerCase()}-select`,
					title,
					description,
					baseProfile[data.profileKey],
					modelProfile[data.profileKey],
					data.enum,
				))
			} else if (data.type === 'color') {
				this.mainDiv.appendChild(this.createColor(
					`${data.profileKey.toLowerCase()}-color`,
					title,
					description,
					baseProfile[data.profileKey],
					modelProfile[data.profileKey],
				))
			} else if (data.type === 'boolean') {
				this.mainDiv.appendChild(this.createCheckbox(
					`${data.profileKey.toLowerCase()}-checkbox`,
					title,
					description,
					baseProfile[data.profileKey],
					modelProfile[data.profileKey],
				))
			} else {
				this.mainDiv.appendChild(this.createTextbox(
					`${data.profileKey.toLowerCase()}-textbox`,
					title,
					description,
					baseProfile[data.profileKey],
					modelProfile[data.profileKey],
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

	getMenuElements () {
		const menuElements = {}
		for (const data of CONFIG_DATA) {
			if (!data.profileKey) continue

			let type = 'textbox > atom-text-editor'
			if (data.enum) {
				type = 'select select'
			} else if (data.type === 'color') {
				type = 'color input'
			} else if (data.type === 'boolean') {
				type = 'checkbox input'
			}
			menuElements[data.profileKey] = this.mainDiv.querySelector(`#${data.profileKey.toLowerCase()}-${type}`)
		}
		return menuElements
	}

	getProfileMenuSettings () {
		const newProfile = {}
		const baseProfile = this.profilesSingleton.getBaseProfile()
		const menuElements = this.getMenuElements()
		for (const data of CONFIG_DATA) {
			if (!data.profileKey) continue
			newProfile[data.profileKey] = data.fromMenuSetting(menuElements[data.profileKey], baseProfile[data.profileKey])
		}
		return newProfile
	}

	applyProfileChanges (profileChanges) {
		this.hideProfileMenu()
		this.model.getXTerminalModel().applyProfileChanges(profileChanges)
	}

	restartTerminal () {
		this.hideProfileMenu()
		this.model.getXTerminalModelElement().restartPtyProcess()
	}

	createMenuItemContainer (id, labelTitle, labelDescription) {
		const menuItemContainer = document.createElement('div')
		menuItemContainer.classList.add('x-terminal-profile-menu-item')
		menuItemContainer.setAttribute('id', id)
		const menuItemLabel = document.createElement('label')
		menuItemLabel.classList.add('x-terminal-profile-menu-item-label')
		const titleDiv = document.createElement('div')
		titleDiv.classList.add('x-terminal-profile-menu-item-title')
		titleDiv.appendChild(document.createTextNode(labelTitle))
		menuItemLabel.appendChild(titleDiv)
		const descriptionDiv = document.createElement('div')
		descriptionDiv.classList.add('x-terminal-profile-menu-item-description')
		descriptionDiv.innerHTML = marked(labelDescription)
		menuItemLabel.appendChild(descriptionDiv)
		menuItemContainer.appendChild(menuItemLabel)
		return menuItemContainer
	}

	async createProfilesDropDownSelectItem () {
		const profiles = await this.profilesSingleton.getProfiles()
		const select = document.createElement('select')
		select.setAttribute('id', 'profiles-dropdown')
		select.classList.add('x-terminal-profile-menu-item-select')
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
		}, { passive: true })
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
		buttonsContainer.classList.add('x-terminal-profile-menu-buttons-div')
		let button = this.createButton()
		button.appendChild(document.createTextNode('Load Settings'))
		button.classList.add('btn-load')
		button.addEventListener('click', (event) => {
			this.loadProfile()
		}, { passive: true })
		buttonsContainer.appendChild(button)
		button = this.createButton()
		button.appendChild(document.createTextNode('Save Settings'))
		button.classList.add('btn-save')
		button.addEventListener('click', (event) => {
			this.saveProfile()
		}, { passive: true })
		buttonsContainer.appendChild(button)
		button = this.createButton()
		button.appendChild(document.createTextNode('Delete Settings'))
		button.classList.add('btn-delete')
		button.addEventListener('click', (event) => {
			this.deleteProfile()
		}, { passive: true })
		buttonsContainer.appendChild(button)
		button = this.createButton()
		button.appendChild(document.createTextNode('Restart'))
		button.classList.add('btn-restart')
		button.addEventListener('click', (event) => {
			this.restartTerminal()
		}, { passive: true })
		buttonsContainer.appendChild(button)
		button = this.createButton()
		button.appendChild(document.createTextNode('Hide Menu'))
		button.classList.add('btn-hide')
		button.addEventListener('click', (event) => {
			this.hideProfileMenu()
		}, { passive: true })
		buttonsContainer.appendChild(button)
		return buttonsContainer
	}

	createButton () {
		const button = document.createElement('button')
		button.classList.add('x-terminal-profile-menu-button')
		button.classList.add('btn')
		button.classList.add('inline-block-tight')
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
		menuItemContainer.classList.add('x-terminal-profile-menu-item')
		menuItemContainer.setAttribute('id', id)
		const menuItemLabel = document.createElement('label')
		menuItemLabel.classList.add('x-terminal-profile-menu-item-label')
		menuItemLabel.classList.add('x-terminal-profile-menu-item-label-color')
		const color = document.createElement('input')
		color.setAttribute('type', 'color')
		color.classList.add('x-terminal-profile-menu-item-color')
		color.value = this.toHex(defaultValue)
		if (initialValue !== undefined) {
			color.value = this.toHex(initialValue)
		}
		menuItemLabel.appendChild(color)
		const titleDiv = document.createElement('div')
		titleDiv.classList.add('x-terminal-profile-menu-item-title')
		titleDiv.appendChild(document.createTextNode(labelTitle))
		menuItemLabel.appendChild(titleDiv)
		menuItemContainer.appendChild(menuItemLabel)
		const descriptionDiv = document.createElement('div')
		descriptionDiv.classList.add('x-terminal-profile-menu-item-description')
		descriptionDiv.classList.add('x-terminal-profile-menu-item-description-color')
		descriptionDiv.innerHTML = marked(labelDescription)
		menuItemContainer.appendChild(descriptionDiv)
		return menuItemContainer
	}

	createSelect (id, labelTitle, labelDescription, defaultValue, initialValue, possibleValues) {
		const menuItemContainer = this.createMenuItemContainer(
			id,
			labelTitle,
			labelDescription,
		)
		const select = document.createElement('select')
		select.setAttribute('type', 'select')
		select.classList.add('x-terminal-profile-menu-item-select')
		select.classList.add('settings-view')
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
		menuItemContainer.appendChild(select)
		return menuItemContainer
	}

	createCheckbox (id, labelTitle, labelDescription, defaultValue, initialValue) {
		const menuItemContainer = document.createElement('div')
		menuItemContainer.classList.add('x-terminal-profile-menu-item')
		menuItemContainer.setAttribute('id', id)
		const menuItemLabel = document.createElement('label')
		menuItemLabel.classList.add('x-terminal-profile-menu-item-label')
		menuItemLabel.classList.add('x-terminal-profile-menu-item-label-checkbox')
		const checkbox = document.createElement('input')
		checkbox.setAttribute('type', 'checkbox')
		checkbox.classList.add('x-terminal-profile-menu-item-checkbox')
		checkbox.classList.add('input-checkbox')
		checkbox.checked = defaultValue
		if (initialValue !== undefined) {
			checkbox.checked = initialValue
		}
		menuItemLabel.appendChild(checkbox)
		const titleDiv = document.createElement('div')
		titleDiv.classList.add('x-terminal-profile-menu-item-title')
		titleDiv.appendChild(document.createTextNode(labelTitle))
		menuItemLabel.appendChild(titleDiv)
		menuItemContainer.appendChild(menuItemLabel)
		const descriptionDiv = document.createElement('div')
		descriptionDiv.classList.add('x-terminal-profile-menu-item-description')
		descriptionDiv.classList.add('x-terminal-profile-menu-item-description-checkbox')
		descriptionDiv.innerHTML = marked(labelDescription)
		menuItemContainer.appendChild(descriptionDiv)
		return menuItemContainer
	}

	isVisible () {
		const style = window.getComputedStyle(this, null)
		return (style.visibility === 'visible')
	}

	hideProfileMenu () {
		this.style.visibility = 'hidden'
		const e = this.model.getXTerminalModelElement()
		e.showTerminal()
		e.focusOnTerminal()
	}

	showProfileMenu () {
		this.model.getXTerminalModelElement().hideTerminal()
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
			this.model.getXTerminalModel().getProfile(),
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

	setNewMenuSettings (profile, clear = false) {
		for (const data of CONFIG_DATA) {
			if (!data.profileKey) continue

			if (data.enum) {
				const selector = `#${data.profileKey.toLowerCase()}-select select`
				const input = this.querySelector(selector)
				input.value = data.toMenuSetting(profile[data.profileKey])
			} else if (data.type === 'color') {
				const selector = `#${data.profileKey.toLowerCase()}-color input`
				const input = this.querySelector(selector)
				input.value = data.toMenuSetting(profile[data.profileKey])
			} else if (data.type === 'boolean') {
				const selector = `#${data.profileKey.toLowerCase()}-checkbox input`
				const checkbox = this.querySelector(selector)
				checkbox.checked = data.toMenuSetting(profile[data.profileKey])
			} else {
				const selector = `#${data.profileKey.toLowerCase()}-textbox > atom-text-editor`
				const model = this.querySelector(selector).getModel()
				if (!clear) {
					model.setText(data.toMenuSetting(profile[data.profileKey]))
				} else {
					model.setText('')
				}
			}
		}
	}
}

const XTerminalProfileMenuElement = document.registerElement('x-terminal-profile', {
	prototype: XTerminalProfileMenuElementImpl.prototype,
})

export {
	XTerminalProfileMenuElement,
}
