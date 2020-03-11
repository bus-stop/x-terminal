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

import { XTerminalProfileMenuModel } from '../src/profile-menu-model'

describe('XTerminalProfileMenuModel', () => {
	this.atomXtermModel = null

	beforeEach(() => {
		this.atomXtermModel = jasmine.createSpyObj('atomXtermModel', ['getElement'])
	})

	it('constructor()', () => {
		const model = new XTerminalProfileMenuModel(this.atomXtermModel)
		expect(model).not.toBeUndefined()
	})

	it('destroy() no element set', () => {
		const model = new XTerminalProfileMenuModel(this.atomXtermModel)
		model.destroy()
	})

	it('destroy() element set', () => {
		const model = new XTerminalProfileMenuModel(this.atomXtermModel)
		model.element = jasmine.createSpyObj('element', ['destroy'])
		model.destroy()
		expect(model.element.destroy).toHaveBeenCalled()
	})

	it('getTitle()', () => {
		const model = new XTerminalProfileMenuModel(this.atomXtermModel)
		expect(model.getTitle()).toBe('X Terminal Profile Menu')
	})

	it('getElement()', () => {
		const model = new XTerminalProfileMenuModel(this.atomXtermModel)
		expect(model.getElement()).toBeNull()
	})

	it('setElement()', () => {
		const model = new XTerminalProfileMenuModel(this.atomXtermModel)
		const mock = jasmine.createSpy('element')
		model.setElement(mock)
		expect(model.getElement()).toBe(mock)
	})

	it('getXTerminalModelElement()', () => {
		const model = new XTerminalProfileMenuModel(this.atomXtermModel)
		model.getXTerminalModelElement()
		expect(model.atomXtermModel.getElement).toHaveBeenCalled()
	})

	it('getXTerminalModel()', () => {
		const model = new XTerminalProfileMenuModel(this.atomXtermModel)
		expect(model.getXTerminalModel()).toBe(this.atomXtermModel)
	})
})
