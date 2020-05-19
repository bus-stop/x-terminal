/** @babel */

import * as xTerminal from '../src/x-terminal'

const xTerminalInstance = xTerminal.getInstance()

describe('x-terminal', () => {
	describe('getSelectedText()', () => {
		it('returns selection', () => {
			spyOn(atom.workspace, 'getActiveTextEditor').and.returnValue({
				getSelectedText () {
					return 'selection'
				},
			})
			const selection = xTerminalInstance.getSelectedText()
			expect(selection).toBe('selection')
		})

		it('returns removes newlines at the end', () => {
			spyOn(atom.workspace, 'getActiveTextEditor').and.returnValue({
				getSelectedText () {
					return 'line1\r\nline2\r\n'
				},
			})
			const selection = xTerminalInstance.getSelectedText()
			expect(selection).toBe('line1\r\nline2')
		})

		it('returns entire line if nothing selected and moves down', () => {
			const moveDown = jasmine.createSpy('moveDown')
			spyOn(atom.workspace, 'getActiveTextEditor').and.returnValue({
				getSelectedText () {
					return ''
				},
				getCursorBufferPosition () {
					return { row: 1, column: 1 }
				},
				lineTextForBufferRow (row) {
					return `line${row}`
				},
				moveDown,
			})
			const selection = xTerminalInstance.getSelectedText()
			expect(selection).toBe('line1')
			expect(moveDown).toHaveBeenCalledWith(1)
		})
	})
})
