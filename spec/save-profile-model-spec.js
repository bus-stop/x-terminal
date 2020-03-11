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

import { XTerminalSaveProfileModel } from '../src/save-profile-model'
import * as atomXtermModelModule from '../src/model'

describe('XTerminalSaveProfileModel', () => {
	this.atomXtermProfileMenuElement = null

	beforeEach(() => {
		this.atomXtermProfileMenuElement = jasmine.createSpyObj(
			'atomXtermProfileMenuElement',
			[
				'applyProfileChanges',
				'restartTerminal',
				'isVisible',
				'focus',
			],
		)
	})

	it('constructor()', () => {
		const model = new XTerminalSaveProfileModel(this.atomXtermProfileMenuElement)
		expect(model).not.toBeNull()
	})

	it('getTitle()', () => {
		const model = new XTerminalSaveProfileModel(this.atomXtermProfileMenuElement)
		expect(model.getTitle()).toBe('X Terminal Save Profile Model')
	})

	it('getElement()', () => {
		const model = new XTerminalSaveProfileModel(this.atomXtermProfileMenuElement)
		expect(model.getElement()).toBeNull()
	})

	it('setElement()', () => {
		const model = new XTerminalSaveProfileModel(this.atomXtermProfileMenuElement)
		const element = jasmine.createSpy('atomXtermSaveProfileElement')
		model.setElement(element)
		expect(model.getElement()).toBe(element)
	})

	it('getTextbox()', () => {
		const model = new XTerminalSaveProfileModel(this.atomXtermProfileMenuElement)
		const mock = jasmine.createSpy('textbox')
		model.textbox = mock
		expect(model.getTextbox()).toBe(mock)
	})

	it('updateProfile()', (done) => {
		const model = new XTerminalSaveProfileModel(this.atomXtermProfileMenuElement)
		spyOn(model.profilesSingleton, 'setProfile').and.returnValue(Promise.resolve())
		model.atomXtermProfileMenuElement.applyProfileChanges.and.callFake((profileChanges) => {
			expect(profileChanges).toBe('baz')
			done()
		})
		model.updateProfile('foo', {}, 'baz')
	})

	it('confirm() no name given', () => {
		const model = new XTerminalSaveProfileModel(this.atomXtermProfileMenuElement)
		model.textbox = jasmine.createSpyObj('textbox', ['getText'])
		model.textbox.getText.and.returnValue('')
		spyOn(model.profilesSingleton, 'isProfileExists').and.returnValue(Promise.resolve(false))
		model.confirm({})
		expect(model.profilesSingleton.isProfileExists).not.toHaveBeenCalled()
	})

	it('confirm() name given does not exist', (done) => {
		const model = new XTerminalSaveProfileModel(this.atomXtermProfileMenuElement)
		model.textbox = jasmine.createSpyObj('textbox', ['getText'])
		model.textbox.getText.and.returnValue('foo')
		spyOn(model.profilesSingleton, 'isProfileExists').and.returnValue(Promise.resolve(false))
		spyOn(model, 'updateProfile').and.callFake((profileName, newProfile, profileChanges) => {
			expect(profileName).toBe('foo')
			expect(newProfile).toEqual({})
			expect(profileChanges).toBe('baz')
			done()
		})
		model.confirm({}, 'baz')
	})

	it('confirm() name given exists', (done) => {
		const model = new XTerminalSaveProfileModel(this.atomXtermProfileMenuElement)
		model.textbox = jasmine.createSpyObj('textbox', ['getText'])
		model.textbox.getText.and.returnValue('foo')
		spyOn(model.profilesSingleton, 'isProfileExists').and.returnValue(Promise.resolve(true))
		spyOn(model, 'close')
		spyOn(model.overwriteProfileModel, 'promptOverwrite').and.callFake((profileChanges) => {
			expect(model.close).toHaveBeenCalledWith(false)
			done()
		})
		model.confirm({}, 'baz')
	})

	it('close() panel is not visible', () => {
		const model = new XTerminalSaveProfileModel(this.atomXtermProfileMenuElement)
		model.panel = jasmine.createSpyObj('panel', ['isVisible', 'hide'])
		model.panel.isVisible.and.returnValue(false)
		model.textbox = jasmine.createSpyObj('textbox', ['setText'])
		model.atomXtermProfileMenuElement.isVisible.and.returnValue(false)
		model.close()
		expect(model.panel.hide).not.toHaveBeenCalled()
	})

	it('close() panel is visible profile menu element is not visible', () => {
		const model = new XTerminalSaveProfileModel(this.atomXtermProfileMenuElement)
		model.panel = jasmine.createSpyObj('panel', ['isVisible', 'hide'])
		model.panel.isVisible.and.returnValue(true)
		model.textbox = jasmine.createSpyObj('textbox', ['setText'])
		model.atomXtermProfileMenuElement.isVisible.and.returnValue(false)
		model.close()
		expect(model.panel.hide).toHaveBeenCalled()
		expect(model.atomXtermProfileMenuElement.focus).not.toHaveBeenCalled()
	})

	it('close() panel is visible profile menu element is visible', () => {
		const model = new XTerminalSaveProfileModel(this.atomXtermProfileMenuElement)
		model.panel = jasmine.createSpyObj('panel', ['isVisible', 'hide'])
		model.panel.isVisible.and.returnValue(true)
		model.textbox = jasmine.createSpyObj('textbox', ['setText'])
		model.atomXtermProfileMenuElement.isVisible.and.returnValue(true)
		model.close()
		expect(model.panel.hide).toHaveBeenCalled()
		expect(model.atomXtermProfileMenuElement.focus).toHaveBeenCalled()
	})

	it('close() panel is visible profile menu element is visible focusMenuElement = false', () => {
		const model = new XTerminalSaveProfileModel(this.atomXtermProfileMenuElement)
		model.panel = jasmine.createSpyObj('panel', ['isVisible', 'hide'])
		model.panel.isVisible.and.returnValue(true)
		model.textbox = jasmine.createSpyObj('textbox', ['setText'])
		model.atomXtermProfileMenuElement.isVisible.and.returnValue(true)
		model.close(false)
		expect(model.panel.hide).toHaveBeenCalled()
		expect(model.atomXtermProfileMenuElement.focus).not.toHaveBeenCalled()
	})

	it('promptForNewProfileName() modal is not visible current item is not XTerminalModel', () => {
		const model = new XTerminalSaveProfileModel(this.atomXtermProfileMenuElement)
		model.panel = jasmine.createSpyObj('panel', ['isVisible', 'show'])
		model.panel.isVisible.and.returnValue(false)
		model.element = jasmine.createSpyObj('element', ['setNewTextbox'])
		spyOn(atomXtermModelModule, 'currentItemIsXTerminalModel').and.returnValue(false)
		model.promptForNewProfileName({}, 'baz')
		expect(model.panel.show).not.toHaveBeenCalled()
	})

	it('promptForNewProfileName() modal is not visible current item is XTerminalModel', () => {
		const model = new XTerminalSaveProfileModel(this.atomXtermProfileMenuElement)
		model.panel = jasmine.createSpyObj('panel', ['isVisible', 'show'])
		model.panel.isVisible.and.returnValue(false)
		model.element = jasmine.createSpyObj('element', ['setNewTextbox'])
		spyOn(atomXtermModelModule, 'currentItemIsXTerminalModel').and.returnValue(true)
		model.promptForNewProfileName({}, 'baz')
		expect(model.panel.show).toHaveBeenCalled()
	})

	it('promptForNewProfileName() modal is visible current item is not XTerminalModel', () => {
		const model = new XTerminalSaveProfileModel(this.atomXtermProfileMenuElement)
		model.panel = jasmine.createSpyObj('panel', ['isVisible', 'show'])
		model.panel.isVisible.and.returnValue(true)
		model.element = jasmine.createSpyObj('element', ['setNewTextbox'])
		spyOn(atomXtermModelModule, 'currentItemIsXTerminalModel').and.returnValue(false)
		model.promptForNewProfileName({}, 'baz')
		expect(model.panel.show).not.toHaveBeenCalled()
	})

	it('promptForNewProfileName() modal is visible current item is XTerminalModel', () => {
		const model = new XTerminalSaveProfileModel(this.atomXtermProfileMenuElement)
		model.panel = jasmine.createSpyObj('panel', ['isVisible', 'show'])
		model.panel.isVisible.and.returnValue(true)
		model.element = jasmine.createSpyObj('element', ['setNewTextbox'])
		spyOn(atomXtermModelModule, 'currentItemIsXTerminalModel').and.returnValue(true)
		model.promptForNewProfileName({}, 'baz')
		expect(model.panel.show).not.toHaveBeenCalled()
	})
})
