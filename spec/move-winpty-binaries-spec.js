/** @babel */
/*
 * Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Copyright 2017-2018 Andres Mejia <amejia004@gmail.com>. All Rights Reserved.
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

import fs from 'fs-extra'
import os from 'os'
import path from 'path'

import temp from 'temp'

import * as script from '../src/scripts/move-winpty-binaries'

temp.track()

describe('move-winpty-binaries script', () => {
	beforeEach(async () => {
		spyOn(process, 'exit').and.callFake((exitCode) => {
			throw new Error(`process.exit(${exitCode}) called`)
		})
		spyOn(console, 'log')
		this.tmpdir = await temp.mkdir()
	})

	afterEach(async () => {
		await temp.cleanup()
	})

	it('mkdtempSyncForRenamingDLLs() no atomHome specified', () => {
		expect(() => script.mkdtempSyncForRenamingDLLs()).toThrow(new Error('must provide atomHome parameter'))
	})

	it('mkdtempSyncForRenamingDLLs() correct template given', () => {
		const atomHome = this.tmpdir
		const expectedTemplate = path.join(atomHome, 'tmp', 'moved-dll-')
		spyOn(fs, 'mkdtempSync')
		script.mkdtempSyncForRenamingDLLs(atomHome)
		expect(fs.mkdtempSync.calls.argsFor(0)).toEqual([expectedTemplate])
	})

	it('mkdtempSyncForRenamingDLLs() path created', async () => {
		const atomHome = this.tmpdir
		const tmpPath = script.mkdtempSyncForRenamingDLLs(atomHome)
		const stats = await fs.lstat(tmpPath)
		expect(stats.isDirectory())
	})

	it('mkdtempSyncForRenamingDLLs() correct leading directories created', async () => {
		const atomHome = this.tmpdir
		const expectedTmpDir = path.join(atomHome, 'tmp')
		script.mkdtempSyncForRenamingDLLs(atomHome)
		const stats = await fs.lstat(expectedTmpDir)
		expect(stats.isDirectory())
	})

	it('mkdtempSyncForRenamingDLLs() different directory per call', () => {
		const atomHome = this.tmpdir
		const firstTmpPath = script.mkdtempSyncForRenamingDLLs(atomHome)
		const secondTmpPath = script.mkdtempSyncForRenamingDLLs(atomHome)
		expect(firstTmpPath).not.toEqual(secondTmpPath)
	})

	describe('main()', () => {
		const savedPlatform = process.platform
		let savedEnv

		beforeEach(() => {
			savedEnv = JSON.parse(JSON.stringify(process.env))
			spyOn(fs, 'renameSync')
			spyOn(os, 'homedir').and.returnValue(this.tmpdir)
			process.env.ATOM_HOME = path.join(this.tmpdir, '.atom')
			fs.ensureDirSync(process.env.ATOM_HOME)
		})

		afterEach(() => {
			process.env = savedEnv
			Object.defineProperty(process, 'platform', {
				value: savedPlatform,
			})
		})

		it('not win32', () => {
			Object.defineProperty(process, 'platform', {
				value: 'linux',
			})
			expect(() => script.main()).toThrow(new Error('process.exit(0) called'))
		})

		it('is win32 atom-xterm not installed', () => {
			Object.defineProperty(process, 'platform', {
				value: 'win32',
			})
			expect(() => script.main()).toThrow(new Error('process.exit(0) called'))
		})

		describe('is win32 atom-xterm installed', () => {
			beforeEach(() => {
				const atomXtermPath = path.join(
					process.env.ATOM_HOME,
					'packages',
					'atom-xterm',
				)
				const nodePtyPath = path.join(atomXtermPath, 'node_modules', 'node-pty')
				const nodePtyPrebuiltPath = path.join(atomXtermPath, 'node_modules', 'node-pty-prebuilt-multiarch')
				this.nodePtyBuildReleasePath = path.join(nodePtyPath, 'build', 'Release')
				this.nodePtyBuildDebugPath = path.join(nodePtyPath, 'build', 'Debug')
				this.nodePtyPrebuiltBuildReleasePath = path.join(nodePtyPrebuiltPath, 'build', 'Release')
				this.nodePtyPrebuiltBuildDebugPath = path.join(nodePtyPrebuiltPath, 'build', 'Debug')
				fs.ensureDirSync(this.nodePtyBuildReleasePath)
				fs.ensureDirSync(this.nodePtyBuildDebugPath)
				fs.ensureDirSync(this.nodePtyPrebuiltBuildReleasePath)
				fs.ensureDirSync(this.nodePtyPrebuiltBuildDebugPath)
				Object.defineProperty(process, 'platform', {
					value: 'win32',
				})
			})

			it('node-pty build directories exist', () => {
				script.main()
				expect(fs.renameSync.calls.count()).toBe(4)
				expect(fs.renameSync.calls.argsFor(0)[0]).toBe(this.nodePtyBuildReleasePath)
				expect(fs.renameSync.calls.argsFor(1)[0]).toBe(this.nodePtyBuildDebugPath)
				expect(fs.renameSync.calls.argsFor(2)[0]).toBe(this.nodePtyPrebuiltBuildReleasePath)
				expect(fs.renameSync.calls.argsFor(3)[0]).toBe(this.nodePtyPrebuiltBuildDebugPath)
			})

			it('node-pty Release directory does not exist', () => {
				fs.removeSync(this.nodePtyBuildReleasePath)
				script.main()
				expect(fs.renameSync.calls.count()).toBe(3)
				expect(fs.renameSync.calls.argsFor(0)[0]).toBe(this.nodePtyBuildDebugPath)
				expect(fs.renameSync.calls.argsFor(1)[0]).toBe(this.nodePtyPrebuiltBuildReleasePath)
				expect(fs.renameSync.calls.argsFor(2)[0]).toBe(this.nodePtyPrebuiltBuildDebugPath)
			})

			it('node-pty Debug directory does not exist', () => {
				fs.removeSync(this.nodePtyBuildDebugPath)
				script.main()
				expect(fs.renameSync.calls.count()).toBe(3)
				expect(fs.renameSync.calls.argsFor(0)[0]).toBe(this.nodePtyBuildReleasePath)
				expect(fs.renameSync.calls.argsFor(1)[0]).toBe(this.nodePtyPrebuiltBuildReleasePath)
				expect(fs.renameSync.calls.argsFor(2)[0]).toBe(this.nodePtyPrebuiltBuildDebugPath)
			})

			it('node-pty Release and Debug directories do not exist', () => {
				fs.removeSync(this.nodePtyBuildReleasePath)
				fs.removeSync(this.nodePtyBuildDebugPath)
				script.main()
				expect(fs.renameSync.calls.count()).toBe(2)
				expect(fs.renameSync.calls.argsFor(0)[0]).toBe(this.nodePtyPrebuiltBuildReleasePath)
				expect(fs.renameSync.calls.argsFor(1)[0]).toBe(this.nodePtyPrebuiltBuildDebugPath)
			})

			it('node-pty does not exist, node-pty-prebuilt Release directory does not exist', () => {
				fs.removeSync(this.nodePtyBuildReleasePath)
				fs.removeSync(this.nodePtyBuildDebugPath)
				fs.removeSync(this.nodePtyPrebuiltBuildReleasePath)
				script.main()
				expect(fs.renameSync.calls.count()).toBe(1)
				expect(fs.renameSync.calls.argsFor(0)[0]).toBe(this.nodePtyPrebuiltBuildDebugPath)
			})

			it('node-pty does not exist, node-pty-prebuilt Debug directory does not exist', () => {
				fs.removeSync(this.nodePtyBuildReleasePath)
				fs.removeSync(this.nodePtyBuildDebugPath)
				fs.removeSync(this.nodePtyPrebuiltBuildDebugPath)
				script.main()
				expect(fs.renameSync.calls.count()).toBe(1)
				expect(fs.renameSync.calls.argsFor(0)[0]).toBe(this.nodePtyPrebuiltBuildReleasePath)
			})

			it('node-pty does not exist, node-pty-prebuilt Release and Debug directories do not exist', () => {
				fs.removeSync(this.nodePtyBuildReleasePath)
				fs.removeSync(this.nodePtyBuildDebugPath)
				fs.removeSync(this.nodePtyPrebuiltBuildReleasePath)
				fs.removeSync(this.nodePtyPrebuiltBuildDebugPath)
				script.main()
				expect(fs.renameSync).not.toHaveBeenCalled()
			})
		})
	})
})
