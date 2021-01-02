/** @babel */

import * as xTerminal from '../src/x-terminal'

const xTerminalInstance = xTerminal.getInstance()

describe('x-terminal', () => {
	beforeEach(async () => {
		await xTerminalInstance.activate()
	})

	afterEach(async () => {
		await xTerminalInstance.deactivate()
	})

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
			const model = await xTerminalInstance.openInCenterOrDock(atom.workspace)
			await model.initializedPromise
			await model.element.createTerminal()

			expect(model.element).toHaveFocus()
			xTerminalInstance.unfocus()
			expect(model.element).not.toHaveFocus()
		})
	})

	describe('focus()', () => {
		it('opens new terminal', async () => {
			const workspace = atom.views.getView(atom.workspace)
			jasmine.attachToDOM(workspace)
			workspace.focus()
			spyOn(xTerminalInstance, 'open')

			expect(xTerminalInstance.open).not.toHaveBeenCalled()
			xTerminalInstance.focus()
			expect(xTerminalInstance.open).toHaveBeenCalledTimes(1)
		})

		it('focuses terminal', async () => {
			const workspace = atom.views.getView(atom.workspace)
			jasmine.attachToDOM(workspace)
			const model = await xTerminalInstance.openInCenterOrDock(atom.workspace)
			await model.initializedPromise
			await model.element.createTerminal()
			workspace.focus()

			expect(model.element).not.toHaveFocus()
			xTerminalInstance.focus()
			expect(model.element).toHaveFocus()
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

	describe('close()', () => {
		let activeTerminal
		beforeEach(() => {
			activeTerminal = {
				element: {
					initializedPromise: Promise.resolve(),
				},
				exit: jasmine.createSpy('activeTerminal.exit'),
			}
			spyOn(xTerminalInstance, 'getActiveTerminal').and.returnValue(activeTerminal)
		})

		it('closes terminal', async () => {
			await xTerminalInstance.close()

			expect(activeTerminal.exit).toHaveBeenCalled()
		})
	})

	describe('restart()', () => {
		let activeTerminal
		beforeEach(() => {
			activeTerminal = {
				element: {
					initializedPromise: Promise.resolve(),
				},
				restartPtyProcess: jasmine.createSpy('activeTerminal.restartPtyProcess'),
			}
			spyOn(xTerminalInstance, 'getActiveTerminal').and.returnValue(activeTerminal)
		})

		it('restarts terminal', async () => {
			await xTerminalInstance.restart()

			expect(activeTerminal.restartPtyProcess).toHaveBeenCalled()
		})
	})

	describe('copy()', () => {
		let activeTerminal
		beforeEach(() => {
			activeTerminal = {
				element: {
					initializedPromise: Promise.resolve(),
				},
				copyFromTerminal: jasmine.createSpy('activeTerminal.copy').and.returnValue('copied'),
			}
			spyOn(xTerminalInstance, 'getActiveTerminal').and.returnValue(activeTerminal)
			spyOn(atom.clipboard, 'write')
		})

		it('copys terminal', async () => {
			await xTerminalInstance.copy()

			expect(atom.clipboard.write).toHaveBeenCalledWith('copied')
		})
	})

	describe('paste()', () => {
		let activeTerminal
		beforeEach(() => {
			activeTerminal = {
				element: {
					initializedPromise: Promise.resolve(),
				},
				pasteToTerminal: jasmine.createSpy('activeTerminal.paste'),
			}
			spyOn(xTerminalInstance, 'getActiveTerminal').and.returnValue(activeTerminal)
			spyOn(atom.clipboard, 'read').and.returnValue('copied')
		})

		it('pastes terminal', async () => {
			await xTerminalInstance.paste()

			expect(activeTerminal.pasteToTerminal).toHaveBeenCalledWith('copied')
		})
	})

	describe('clear()', () => {
		let activeTerminal
		beforeEach(() => {
			activeTerminal = {
				element: {
					initializedPromise: Promise.resolve(),
				},
				clear: jasmine.createSpy('activeTerminal.clear'),
			}
			spyOn(xTerminalInstance, 'getActiveTerminal').and.returnValue(activeTerminal)
		})

		it('clears terminal', async () => {
			await xTerminalInstance.clear()

			expect(activeTerminal.clear).toHaveBeenCalled()
		})
	})

	describe('open()', () => {
		let uri
		beforeEach(() => {
			uri = xTerminalInstance.profilesSingleton.generateNewUri()
			spyOn(atom.workspace, 'open')
		})

		it('simple', async () => {
			await xTerminalInstance.open(uri)

			expect(atom.workspace.open).toHaveBeenCalledWith(uri, {})
		})

		it('target to cwd', async () => {
			const testPath = '/test/path'
			spyOn(xTerminalInstance, 'getPath').and.returnValue(testPath)
			await xTerminalInstance.open(
				uri,
				{ target: true },
			)

			const url = new URL(atom.workspace.open.calls.mostRecent().args[0])

			expect(url.searchParams.get('cwd')).toBe(testPath)
		})
	})
})

describe('x-terminal services', () => {
	beforeEach(async () => {
		atom.packages.triggerDeferredActivationHooks()
		atom.packages.triggerActivationHook('core:loaded-shell-environment')
		await atom.packages.activatePackage('x-terminal')
	})

	it('terminal.run', async () => {
		spyOn(xTerminalInstance, 'runCommands')
		const service = await new Promise(resolve => {
			atom.packages.serviceHub.consume('terminal', '^1.0.0', resolve)
		})
		service.run(['test'])
		expect(xTerminalInstance.runCommands).toHaveBeenCalledWith(['test'])
	})

	it('platformioIDETerminal.run', async () => {
		spyOn(xTerminalInstance, 'runCommands')
		const service = await new Promise(resolve => {
			atom.packages.serviceHub.consume('platformioIDETerminal', '^1.1.0', resolve)
		})
		service.run(['test'])
		expect(xTerminalInstance.runCommands).toHaveBeenCalledWith(['test'])
	})

	it('atom-xterm.openTerminal', async () => {
		spyOn(xTerminalInstance, 'openTerminal')
		const service = await new Promise(resolve => {
			atom.packages.serviceHub.consume('atom-xterm', '^2.0.0', resolve)
		})
		service.openTerminal({})
		expect(xTerminalInstance.openTerminal).toHaveBeenCalledWith({})
	})
})
