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

import { XTerminalProfileMenuElement } from '../src/profile-menu-element'

describe('XTerminalProfileMenuElement', () => {
	this.element = null

	beforeEach(async () => {
		const model = jasmine.createSpyObj(
			'atomXtermProfileMenuModel',
			[
				'setElement',
				'getXTerminalModel',
				'getXTerminalModelElement',
			],
		)
		model.atomXtermModel = jasmine.createSpyObj(
			'atomXtermModel',
			[
				'getProfile',
				'applyProfileChanges',
			],
		)
		model.atomXtermModel.getProfile.and.returnValue({})
		model.atomXtermModel.profile = {}
		const mock = jasmine.createSpyObj(
			'atomXtermElement',
			[
				'restartPtyProcess',
				'hideTerminal',
				'showTerminal',
				'focusOnTerminal',
			],
		)
		model.getXTerminalModel.and.returnValue(model.atomXtermModel)
		model.getXTerminalModelElement.and.returnValue(mock)
		this.element = new XTerminalProfileMenuElement()
		this.element.initialize(model)
		await this.element.initializedPromise
	})

	it('initialize()', async () => {
		await this.element.initializedPromise
	})

	it('destroy() disposables not set', () => {
		this.element.disposables = null
		this.element.destroy()
	})

	it('destroy() disposables is set', () => {
		this.element.disposables = jasmine.createSpyObj(
			'disposables',
			[
				'dispose',
			],
		)
		this.element.destroy()
		expect(this.element.disposables.dispose).toHaveBeenCalled()
	})

	it('getModelProfile()', () => {
		const mock = jasmine.createSpy('mock')
		this.element.model.atomXtermModel.profile = mock
		expect(this.element.getModelProfile()).toBe(mock)
	})

	it('getMenuElements()', () => {
		expect(this.element.getMenuElements()).toBeTruthy()
	})

	it('getProfileMenuSettings()', () => {
		const expected = this.element.profilesSingleton.getBaseProfile()
		const actual = this.element.getProfileMenuSettings()
		expect(actual).toEqual(expected)
	})

	it('applyProfileChanges()', () => {
		this.element.applyProfileChanges('foo')
		expect(this.element.model.getXTerminalModel().applyProfileChanges).toHaveBeenCalledWith('foo')
	})

	it('applyProfileChanges() profile menu hidden', () => {
		spyOn(this.element, 'hideProfileMenu')
		this.element.applyProfileChanges('foo')
		expect(this.element.hideProfileMenu).toHaveBeenCalled()
	})

	it('restartTerminal()', () => {
		this.element.restartTerminal()
		expect(this.element.model.getXTerminalModelElement().restartPtyProcess).toHaveBeenCalled()
	})

	it('restartTerminal() profile menu hidden', () => {
		spyOn(this.element, 'hideProfileMenu')
		this.element.restartTerminal()
		expect(this.element.hideProfileMenu).toHaveBeenCalled()
	})

	it('createMenuItemContainer() check id', () => {
		const container = this.element.createMenuItemContainer('foo', 'bar', 'baz')
		expect(container.getAttribute('id')).toBe('foo')
	})

	it('createMenuItemContainer() check title', () => {
		const container = this.element.createMenuItemContainer('foo', 'bar', 'baz')
		const titleDiv = container.querySelector('.x-terminal-profile-menu-item-title')
		expect(titleDiv.textContent).toBe('bar')
	})

	it('createMenuItemContainer() check description', () => {
		const container = this.element.createMenuItemContainer('foo', 'bar', 'baz')
		const descriptionDiv = container.querySelector('.x-terminal-profile-menu-item-description')
		expect(descriptionDiv.innerHTML).toBe('<p>baz</p>\n')
	})

	it('createProfilesDropDownSelectItem() check id', async () => {
		const select = await this.element.createProfilesDropDownSelectItem()
		expect(select.getAttribute('id')).toBe('profiles-dropdown')
	})

	it('createProfilesDropDownSelectItem() check classList', async () => {
		const select = await this.element.createProfilesDropDownSelectItem()
		expect(select.classList.contains('x-terminal-profile-menu-item-select')).toBe(true)
	})

	it('createProfilesDropDown()', async () => {
		const menuItemContainer = await this.element.createProfilesDropDown()
		expect(menuItemContainer.getAttribute('id')).toBe('profiles-selection')
	})

	it('createProfileMenuButtons()', () => {
		const buttonsContainer = this.element.createProfileMenuButtons()
		expect(buttonsContainer.classList.contains('x-terminal-profile-menu-buttons-div')).toBe(true)
	})

	it('createButton()', () => {
		const button = this.element.createButton()
		expect(button.classList.contains('x-terminal-profile-menu-button')).toBe(true)
	})

	it('createTextbox()', () => {
		const menuItemContainer = this.element.createTextbox('foo', 'bar', 'baz', 'cat', 'dog')
		expect(menuItemContainer.getAttribute('id')).toBe('foo')
	})

	it('createCheckbox()', () => {
		const menuItemContainer = this.element.createCheckbox('foo', 'bar', 'baz', true, false)
		expect(menuItemContainer.getAttribute('id')).toBe('foo')
	})

	it('isVisible() initial value', () => {
		expect(this.element.isVisible()).toBe(false)
	})

	it('hideProfileMenu()', () => {
		this.element.hideProfileMenu()
		expect(this.element.style.visibility).toBe('hidden')
	})

	it('hideProfileMenu() terminal shown', () => {
		this.element.hideProfileMenu()
		expect(this.element.model.getXTerminalModelElement().showTerminal).toHaveBeenCalled()
	})

	it('hideProfileMenu() terminal focused', () => {
		this.element.hideProfileMenu()
		expect(this.element.model.getXTerminalModelElement().focusOnTerminal).toHaveBeenCalled()
	})

	it('showProfileMenu()', () => {
		this.element.showProfileMenu()
		expect(this.element.style.visibility).toBe('visible')
	})

	it('showProfileMenu() terminal hidden', () => {
		this.element.showProfileMenu()
		expect(this.element.model.getXTerminalModelElement().hideTerminal).toHaveBeenCalled()
	})

	it('toggleProfileMenu() currently hidden', () => {
		spyOn(this.element, 'isVisible').and.returnValue(false)
		spyOn(this.element, 'showProfileMenu')
		this.element.toggleProfileMenu()
		expect(this.element.showProfileMenu).toHaveBeenCalled()
	})

	it('toggleProfileMenu() currently visible', () => {
		spyOn(this.element, 'isVisible').and.returnValue(true)
		spyOn(this.element, 'hideProfileMenu')
		this.element.toggleProfileMenu()
		expect(this.element.hideProfileMenu).toHaveBeenCalled()
	})

	it('getNewProfileAndChanges()', () => {
		spyOn(this.element, 'getProfileMenuSettings').and.returnValue({
			args: [
				'--foo',
				'--bar',
				'--baz',
			],
		})
		this.element.model.atomXtermModel.getProfile.and.returnValue({
			command: 'somecommand',
		})
		const expected = {
			newProfile: {
				args: [
					'--foo',
					'--bar',
					'--baz',
				],
			},
			profileChanges: {
				args: [
					'--foo',
					'--bar',
					'--baz',
				],
			},
		}
		const actual = this.element.getNewProfileAndChanges()
		expect(actual).toEqual(expected)
	})

	it('loadProfile()', () => {
		spyOn(this.element, 'applyProfileChanges')
		this.element.loadProfile()
		expect(this.element.applyProfileChanges).toHaveBeenCalled()
	})

	it('saveProfile()', () => {
		spyOn(this.element, 'promptForNewProfileName')
		this.element.saveProfile()
		expect(this.element.promptForNewProfileName).toHaveBeenCalled()
	})

	it('deleteProfile() nothing selected', () => {
		spyOn(this.element, 'promptDelete')
		this.element.deleteProfile()
		expect(this.element.promptDelete).not.toHaveBeenCalled()
	})

	it('deleteProfile() option selected', () => {
		spyOn(this.element, 'promptDelete')
		const mock = jasmine.createSpy('mock')
		mock.options = [{ text: 'foo' }]
		mock.selectedIndex = 0
		spyOn(this.element.mainDiv, 'querySelector').and.returnValue(mock)
		this.element.deleteProfile()
		expect(this.element.promptDelete).toHaveBeenCalledWith('foo')
	})

	it('promptDelete()', (done) => {
		spyOn(this.element.deleteProfileModel, 'promptDelete').and.callFake((newProfile) => {
			expect(newProfile).toBe('foo')
			done()
		})
		this.element.promptDelete('foo')
	})

	it('promptForNewProfileName()', (done) => {
		spyOn(this.element.saveProfileModel, 'promptForNewProfileName').and.callFake((newProfile, profileChanges) => {
			expect(newProfile).toBe('foo')
			expect(profileChanges).toBe('bar')
			done()
		})
		this.element.promptForNewProfileName('foo', 'bar')
	})

	it('setNewMenuSettings()', () => {
		this.element.setNewMenuSettings(this.element.profilesSingleton.getBaseProfile())
	})

	it('setNewMenuSettings() clear = true', () => {
		this.element.setNewMenuSettings(this.element.profilesSingleton.getBaseProfile(), true)
	})
})
