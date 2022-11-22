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

import { createXTerminalProfileMenuElement } from '../src/profile-menu-element'

describe('XTerminalProfileMenuElement', () => {
	let element

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
		element = createXTerminalProfileMenuElement()
		element.initialize(model)
		await element.initializedPromise
	})

	it('initialize()', async () => {
		await element.initializedPromise
	})

	it('destroy() disposables not set', () => {
		element.disposables = null
		element.destroy()
	})

	it('destroy() disposables is set', () => {
		element.disposables = jasmine.createSpyObj(
			'disposables',
			[
				'dispose',
			],
		)
		element.destroy()
		expect(element.disposables.dispose).toHaveBeenCalled()
	})

	it('getModelProfile()', () => {
		const mock = jasmine.createSpy('mock')
		element.model.atomXtermModel.profile = mock
		expect(element.getModelProfile()).toBe(mock)
	})

	it('getMenuElements()', () => {
		expect(element.getMenuElements()).toBeTruthy()
	})

	it('getProfileMenuSettings()', () => {
		const expected = element.profilesSingleton.getBaseProfile()
		const actual = element.getProfileMenuSettings()
		expect(actual).toEqual(expected)
	})

	it('applyProfileChanges()', () => {
		element.applyProfileChanges('foo')
		expect(element.model.getXTerminalModel().applyProfileChanges).toHaveBeenCalledWith('foo')
	})

	it('applyProfileChanges() profile menu hidden', () => {
		spyOn(element, 'hideProfileMenu')
		element.applyProfileChanges('foo')
		expect(element.hideProfileMenu).toHaveBeenCalled()
	})

	it('restartTerminal()', () => {
		element.restartTerminal()
		expect(element.model.getXTerminalModelElement().restartPtyProcess).toHaveBeenCalled()
	})

	it('restartTerminal() profile menu hidden', () => {
		spyOn(element, 'hideProfileMenu')
		element.restartTerminal()
		expect(element.hideProfileMenu).toHaveBeenCalled()
	})

	it('createMenuItemContainer() check id', () => {
		const container = element.createMenuItemContainer('foo', 'bar', 'baz')
		expect(container.getAttribute('id')).toBe('foo')
	})

	it('createMenuItemContainer() check title', () => {
		const container = element.createMenuItemContainer('foo', 'bar', 'baz')
		const titleDiv = container.querySelector('.x-terminal-profile-menu-item-title')
		expect(titleDiv.textContent).toBe('bar')
	})

	it('createMenuItemContainer() check description', () => {
		const container = element.createMenuItemContainer('foo', 'bar', 'baz')
		const descriptionDiv = container.querySelector('.x-terminal-profile-menu-item-description')
		expect(descriptionDiv.innerHTML).toBe('<p>baz</p>\n')
	})

	it('createProfilesDropDownSelectItem() check id', async () => {
		const select = await element.createProfilesDropDownSelectItem()
		expect(select.getAttribute('id')).toBe('profiles-dropdown')
	})

	it('createProfilesDropDownSelectItem() check classList', async () => {
		const select = await element.createProfilesDropDownSelectItem()
		expect(select.classList.contains('x-terminal-profile-menu-item-select')).toBe(true)
	})

	it('createProfilesDropDown()', async () => {
		const menuItemContainer = await element.createProfilesDropDown()
		expect(menuItemContainer.getAttribute('id')).toBe('profiles-selection')
	})

	it('createProfileMenuButtons()', () => {
		const buttonsContainer = element.createProfileMenuButtons()
		expect(buttonsContainer.classList.contains('x-terminal-profile-menu-buttons-div')).toBe(true)
	})

	it('createButton()', () => {
		const button = element.createButton()
		expect(button.classList.contains('x-terminal-profile-menu-button')).toBe(true)
	})

	it('createTextbox()', () => {
		const menuItemContainer = element.createTextbox('foo', 'bar', 'baz', 'cat', 'dog')
		expect(menuItemContainer.getAttribute('id')).toBe('foo')
	})

	it('createCheckbox()', () => {
		const menuItemContainer = element.createCheckbox('foo', 'bar', 'baz', true, false)
		expect(menuItemContainer.getAttribute('id')).toBe('foo')
	})

	it('isVisible() initial value', () => {
		expect(element.isVisible()).toBe(false)
	})

	it('hideProfileMenu()', () => {
		element.hideProfileMenu()
		expect(element.style.visibility).toBe('hidden')
	})

	it('hideProfileMenu() terminal shown', () => {
		element.hideProfileMenu()
		expect(element.model.getXTerminalModelElement().showTerminal).toHaveBeenCalled()
	})

	it('hideProfileMenu() terminal focused', () => {
		element.hideProfileMenu()
		expect(element.model.getXTerminalModelElement().focusOnTerminal).toHaveBeenCalled()
	})

	it('showProfileMenu()', () => {
		element.showProfileMenu()
		expect(element.style.visibility).toBe('visible')
	})

	it('showProfileMenu() terminal hidden', () => {
		element.showProfileMenu()
		expect(element.model.getXTerminalModelElement().hideTerminal).toHaveBeenCalled()
	})

	it('toggleProfileMenu() currently hidden', () => {
		spyOn(element, 'isVisible').and.returnValue(false)
		spyOn(element, 'showProfileMenu')
		element.toggleProfileMenu()
		expect(element.showProfileMenu).toHaveBeenCalled()
	})

	it('toggleProfileMenu() currently visible', () => {
		spyOn(element, 'isVisible').and.returnValue(true)
		spyOn(element, 'hideProfileMenu')
		element.toggleProfileMenu()
		expect(element.hideProfileMenu).toHaveBeenCalled()
	})

	it('getNewProfileAndChanges()', () => {
		spyOn(element, 'getProfileMenuSettings').and.returnValue({
			args: [
				'--foo',
				'--bar',
				'--baz',
			],
		})
		element.model.atomXtermModel.getProfile.and.returnValue({
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
		const actual = element.getNewProfileAndChanges()
		expect(actual).toEqual(expected)
	})

	it('loadProfile()', () => {
		spyOn(element, 'applyProfileChanges')
		element.loadProfile()
		expect(element.applyProfileChanges).toHaveBeenCalled()
	})

	it('saveProfile()', () => {
		spyOn(element, 'promptForNewProfileName')
		element.saveProfile()
		expect(element.promptForNewProfileName).toHaveBeenCalled()
	})

	it('deleteProfile() nothing selected', () => {
		spyOn(element, 'promptDelete')
		element.deleteProfile()
		expect(element.promptDelete).not.toHaveBeenCalled()
	})

	it('deleteProfile() option selected', () => {
		spyOn(element, 'promptDelete')
		const mock = jasmine.createSpy('mock')
		mock.options = [{ text: 'foo' }]
		mock.selectedIndex = 0
		spyOn(element.mainDiv, 'querySelector').and.returnValue(mock)
		element.deleteProfile()
		expect(element.promptDelete).toHaveBeenCalledWith('foo')
	})

	it('promptDelete()', (done) => {
		spyOn(element.deleteProfileModel, 'promptDelete').and.callFake((newProfile) => {
			expect(newProfile).toBe('foo')
			done()
		})
		element.promptDelete('foo')
	})

	it('promptForNewProfileName()', (done) => {
		spyOn(element.saveProfileModel, 'promptForNewProfileName').and.callFake((newProfile, profileChanges) => {
			expect(newProfile).toBe('foo')
			expect(profileChanges).toBe('bar')
			done()
		})
		element.promptForNewProfileName('foo', 'bar')
	})

	it('setNewMenuSettings()', () => {
		element.setNewMenuSettings(element.profilesSingleton.getBaseProfile())
	})

	it('setNewMenuSettings() clear = true', () => {
		element.setNewMenuSettings(element.profilesSingleton.getBaseProfile(), true)
	})
})
