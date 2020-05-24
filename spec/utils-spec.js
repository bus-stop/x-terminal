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

import * as utils from '../src/utils'

describe('Utilities', () => {
	it('clearDiv()', () => {
		const div = document.createElement('div')
		for (let i = 0; i < 10; i++) {
			div.appendChild(document.createElement('div'))
		}
		utils.clearDiv(div)
		expect(div.childElementCount).toBe(0)
	})

	it('clearDiv() empty div', () => {
		const div = document.createElement('div')
		utils.clearDiv(div)
		expect(div.childElementCount).toBe(0)
	})

	it('createHorizontalLine()', () => {
		const hLine = utils.createHorizontalLine()
		expect(hLine.tagName).toBe('DIV')
		expect(hLine.classList.contains('x-terminal-profile-menu-element-hline')).toBe(true)
		expect(hLine.textContent).toBe('.')
	})

	describe('recalculateActive()', () => {
		const createTerminals = (num = 1) => {
			const terminals = []
			for (let i = 0; i < num; i++) {
				terminals.push({
					activeIndex: i,
					isVisible () {},
					emitter: {
						emit () {},
					},
				})
			}
			return terminals
		}

		it('active first', () => {
			const terminals = createTerminals(2)
			const terminalsSet = new Set(terminals)
			utils.recalculateActive(terminalsSet, terminals[1])
			expect(terminals[0].activeIndex).toBe(1)
			expect(terminals[1].activeIndex).toBe(0)
		})

		it('visible before hidden', () => {
			const terminals = createTerminals(2)
			const terminalsSet = new Set(terminals)
			spyOn(terminals[1], 'isVisible').and.returnValue(true)
			utils.recalculateActive(terminalsSet)
			expect(terminals[0].activeIndex).toBe(1)
			expect(terminals[1].activeIndex).toBe(0)
		})

		it('allowHiddenToStayActive', () => {
			atom.config.set('x-terminal.terminalSettings.allowHiddenToStayActive', true)
			const terminals = createTerminals(2)
			const terminalsSet = new Set(terminals)
			spyOn(terminals[1], 'isVisible').and.returnValue(true)
			utils.recalculateActive(terminalsSet)
			expect(terminals[0].activeIndex).toBe(0)
			expect(terminals[1].activeIndex).toBe(1)
		})

		it('lower active index first', () => {
			const terminals = createTerminals(2)
			const terminalsSet = new Set(terminals)
			terminals[0].activeIndex = 1
			terminals[1].activeIndex = 0
			utils.recalculateActive(terminalsSet)
			expect(terminals[0].activeIndex).toBe(1)
			expect(terminals[1].activeIndex).toBe(0)
		})

		it('emit did-change-title', () => {
			const terminals = createTerminals(2)
			const terminalsSet = new Set(terminals)
			spyOn(terminals[0].emitter, 'emit')
			spyOn(terminals[1].emitter, 'emit')
			utils.recalculateActive(terminalsSet)
			expect(terminals[0].emitter.emit).toHaveBeenCalledWith('did-change-title')
			expect(terminals[1].emitter.emit).toHaveBeenCalledWith('did-change-title')
		})
	})
})
