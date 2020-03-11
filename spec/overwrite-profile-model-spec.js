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

import { XTerminalOverwriteProfileModel } from '../src/overwrite-profile-model'

describe('XTerminalOverwriteProfileModel', () => {
	this.atomXtermSaveProfileModel = null

	beforeEach(() => {
		this.atomXtermSaveProfileModel = jasmine.createSpyObj(
			'atomXtermSaveProfileModel',
			[
				'promptForNewProfileName',
			],
		)
	})

	it('constructor()', () => {
		const model = new XTerminalOverwriteProfileModel(this.atomXtermSaveProfileModel)
		expect(model).not.toBeNull()
	})

	it('getTitle()', () => {
		const model = new XTerminalOverwriteProfileModel(this.atomXtermSaveProfileModel)
		expect(model.getTitle()).toBe('X Terminal Overwrite Profile Model')
	})

	it('getElement()', () => {
		const model = new XTerminalOverwriteProfileModel(this.atomXtermSaveProfileModel)
		expect(model.getElement()).toBeNull()
	})

	it('setElement()', () => {
		const model = new XTerminalOverwriteProfileModel(this.atomXtermSaveProfileModel)
		const element = jasmine.createSpy('atomXtermOverwriteProfileElement')
		model.setElement(element)
		expect(model.getElement()).toBe(element)
	})

	it('close() panel is not visible', () => {
		const model = new XTerminalOverwriteProfileModel(this.atomXtermSaveProfileModel)
		model.panel = jasmine.createSpyObj('panel', ['isVisible', 'hide'])
		model.panel.isVisible.and.returnValue(false)
		model.close('foo', 'bar')
		expect(model.panel.hide).not.toHaveBeenCalled()
		expect(model.atomXtermSaveProfileModel.promptForNewProfileName).not.toHaveBeenCalled()
	})

	it('close() panel is visible', () => {
		const model = new XTerminalOverwriteProfileModel(this.atomXtermSaveProfileModel)
		model.panel = jasmine.createSpyObj('panel', ['isVisible', 'hide'])
		model.panel.isVisible.and.returnValue(true)
		model.close('foo', 'bar')
		expect(model.panel.hide).toHaveBeenCalled()
		expect(model.atomXtermSaveProfileModel.promptForNewProfileName).not.toHaveBeenCalled()
	})

	it('close() reprompt panel is not visible', () => {
		const model = new XTerminalOverwriteProfileModel(this.atomXtermSaveProfileModel)
		model.panel = jasmine.createSpyObj('panel', ['isVisible', 'hide'])
		model.panel.isVisible.and.returnValue(false)
		model.close('foo', 'bar', true)
		expect(model.panel.hide).not.toHaveBeenCalled()
		expect(model.atomXtermSaveProfileModel.promptForNewProfileName).not.toHaveBeenCalled()
	})

	it('close() reprompt panel is visible', () => {
		const model = new XTerminalOverwriteProfileModel(this.atomXtermSaveProfileModel)
		model.panel = jasmine.createSpyObj('panel', ['isVisible', 'hide'])
		model.panel.isVisible.and.returnValue(true)
		model.close('foo', 'bar', true)
		expect(model.panel.hide).toHaveBeenCalled()
		expect(model.atomXtermSaveProfileModel.promptForNewProfileName).toHaveBeenCalled()
	})

	it('promptOverwrite() panel is shown', () => {
		const model = new XTerminalOverwriteProfileModel(this.atomXtermSaveProfileModel)
		model.panel = jasmine.createSpyObj('panel', ['show', 'isVisible', 'hide'])
		model.panel.isVisible.and.returnValue(true)
		model.element = jasmine.createSpyObj('atomXtermDeleteProfileElement', ['setNewPrompt'])
		model.promptOverwrite('foo', 'bar', 'baz')
		expect(model.panel.show).toHaveBeenCalled()
	})

	it('promptOverwrite() new prompt is set', () => {
		const model = new XTerminalOverwriteProfileModel(this.atomXtermSaveProfileModel)
		model.panel = jasmine.createSpyObj('panel', ['show', 'isVisible', 'hide'])
		model.panel.isVisible.and.returnValue(true)
		model.element = jasmine.createSpyObj('atomXtermDeleteProfileElement', ['setNewPrompt'])
		model.promptOverwrite('foo', 'bar', 'baz')
		expect(model.element.setNewPrompt).toHaveBeenCalled()
	})
})
