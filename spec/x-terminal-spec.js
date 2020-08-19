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

	describe('unfocus()', () => {
		it('focuses atom-workspace', async () => {
			jasmine.attachToDOM(atom.views.getView(atom.workspace))
			await xTerminalInstance.activate()
			const model = await xTerminalInstance.openInCenterOrDock(atom.workspace)
			await model.initializedPromise
			await model.element.createTerminal()

			expect(model.element).toHaveFocus()
			xTerminalInstance.unfocus()
			expect(model.element).not.toHaveFocus()
		})
	})

	describe('runCommands()', () => {
		let activeTerminal, newTerminal, commands
		beforeEach(() => {
			activeTerminal = {
				element: {
					initializedPromise: Promise.resolve(),
				},
				runCommand: jasmine.createSpy('activeTerminal.runCommand'),
			}
			newTerminal = {
				element: {
					initializedPromise: Promise.resolve(),
				},
				runCommand: jasmine.createSpy('newTerminal.runCommand'),
			}
			commands = [
				'command 1',
				'command 2',
			]
			spyOn(xTerminalInstance, 'getActiveTerminal').and.returnValue(activeTerminal)
			spyOn(xTerminalInstance, 'open').and.returnValue(newTerminal)
		})

		it('runs commands in new terminal', async () => {
			await xTerminalInstance.runCommands(commands)

			expect(xTerminalInstance.getActiveTerminal).not.toHaveBeenCalled()
			expect(newTerminal.runCommand).toHaveBeenCalledWith('command 1')
			expect(newTerminal.runCommand).toHaveBeenCalledWith('command 2')
		})

		it('runs commands in active terminal', async () => {
			atom.config.set('x-terminal.terminalSettings.runInActive', true)
			await xTerminalInstance.runCommands(commands)

			expect(xTerminalInstance.open).not.toHaveBeenCalled()
			expect(activeTerminal.runCommand).toHaveBeenCalledWith('command 1')
			expect(activeTerminal.runCommand).toHaveBeenCalledWith('command 2')
		})

		it('runs commands in new terminal if none active', async () => {
			xTerminalInstance.getActiveTerminal.and.returnValue()
			atom.config.set('x-terminal.terminalSettings.runInActive', true)
			await xTerminalInstance.runCommands(commands)

			expect(xTerminalInstance.getActiveTerminal).toHaveBeenCalled()
			expect(newTerminal.runCommand).toHaveBeenCalledWith('command 1')
			expect(newTerminal.runCommand).toHaveBeenCalledWith('command 2')
		})
	})
})
