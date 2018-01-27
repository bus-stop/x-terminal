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

import * as nodePty from 'node-pty-prebuilt'

import * as config from '../lib/atom-xterm-config'
import AtomXtermElement from '../lib/atom-xterm-element'
import AtomXtermModel from '../lib/atom-xterm-model'

import { URL } from 'whatwg-url'

describe('AtomXterm', () => {
  const defaultUri = 'atom-xterm://somesessionid/'
  this.workspaceElement = null
  this.atomXtermPackage = null

  let createNewModel = (packageModule, uri = defaultUri) => {
    return new Promise((resolve, reject) => {
      let model = new AtomXtermModel({
        uri: uri,
        terminals_set: packageModule.terminals_set
      })
      model.initializedPromise.then(() => {
        model.pane = jasmine.createSpyObj('pane',
          ['destroyItem'])
        model.pane.getActiveItem = jasmine.createSpy('getActiveItem')
          .and.returnValue(model)
        spyOn(model, 'exit').and.callThrough()
        spyOn(model, 'copyFromTerminal').and.returnValue('some text from terminal')
        spyOn(model, 'pasteToTerminal')
        spyOn(model, 'openHoveredLink')
        spyOn(model, 'getHoveredLink')
        spyOn(model, 'restartPtyProcess')
        resolve(model)
      })
    })
  }

  let createNewElement = (packageModule) => {
    return new Promise((resolve, reject) => {
      let element = new AtomXtermElement()
      createNewModel(packageModule).then((model) => {
        element.initialize(model).then(() => {
          resolve(element)
        })
      })
    })
  }

  beforeEach((done) => {
    let ptyProcess = jasmine.createSpyObj('ptyProcess',
      ['kill', 'write', 'resize', 'on'])
    ptyProcess.process = jasmine.createSpy('process')
      .and.returnValue('sometestprocess')
    spyOn(nodePty, 'spawn').and.returnValue(ptyProcess)
    atom.config.clear()
    this.workspaceElement = atom.views.getView(atom.workspace)
    atom.packages.activatePackage('atom-xterm').then(() => {
      this.atomXtermPackage = atom.packages.getActivePackage('atom-xterm')
      spyOn(this.atomXtermPackage.mainModule.profilesSingleton, 'generateNewUri').and.returnValue(defaultUri)
      spyOn(atom.workspace, 'open').and.callFake(async (...args) => {
        return atom.workspace.openSync(...args)
      })
      this.atomXtermPackage.mainModule.config.spawnPtySettings.properties.command.default = config.getDefaultShellCommand()
      this.atomXtermPackage.mainModule.config.spawnPtySettings.properties.name.default = config.getDefaultTermType()
      this.atomXtermPackage.mainModule.config.spawnPtySettings.properties.cwd.default = config.getDefaultCwd()
      done()
    }, (reason) => {
      done()
      throw reason
    })
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:need-this-to-activate-package-for-tests-do-not-remove')
  })

  afterEach(() => {
    atom.packages.reset()
  })

  it('package is activated', () => {
    expect(atom.packages.isPackageActive('atom-xterm')).toBe(true)
  })

  it('deactivate package', () => {
    this.atomXtermPackage.deactivate()
    expect(this.atomXtermPackage.mainActivated).toBe(false)
  })

  it('run atom-xterm:open', () => {
    spyOn(atom.workspace, 'getActivePane').and.returnValue(null)
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:open')
    expect(atom.workspace.open.calls.allArgs()).toEqual([[defaultUri, {}]])
  })

  it('run atom-xterm:open-split-up and check arguments', () => {
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:open-split-up')
    expect(atom.workspace.open.calls.allArgs()).toEqual([[defaultUri, {'split': 'up'}]])
  })

  it('run atom-xterm:open-split-up and check element exists', () => {
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:open-split-up')
    expect(this.workspaceElement.querySelector('atom-xterm')).not.toBeNull()
  })

  it('run atom-xterm:open-split-down and check arguments', () => {
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:open-split-down')
    expect(atom.workspace.open.calls.allArgs()).toEqual([[defaultUri, {'split': 'down'}]])
  })

  it('run atom-xterm:open-split-down and check element exists', () => {
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:open-split-down')
    expect(this.workspaceElement.querySelector('atom-xterm')).not.toBeNull()
  })

  it('run atom-xterm:open-split-left and check arguments', () => {
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:open-split-left')
    expect(atom.workspace.open.calls.allArgs()).toEqual([[defaultUri, {'split': 'left'}]])
  })

  it('run atom-xterm:open-split-left and check element exists', () => {
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:open-split-left')
    expect(this.workspaceElement.querySelector('atom-xterm')).not.toBeNull()
  })

  it('run atom-xterm:open-split-right and check arguments', () => {
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:open-split-right')
    expect(atom.workspace.open.calls.allArgs()).toEqual([[defaultUri, {'split': 'right'}]])
  })

  it('run atom-xterm:open-split-down and check element exists', () => {
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:open-split-right')
    expect(this.workspaceElement.querySelector('atom-xterm')).not.toBeNull()
  })

  it('run atom-xterm:open-split-bottom-dock', () => {
    let mock = jasmine.createSpyObj('dock', ['getActivePane'])
    spyOn(atom.workspace, 'getBottomDock').and.returnValue(mock)
    mock.getActivePane.and.returnValue(null)
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:open-split-bottom-dock')
    expect(atom.workspace.open.calls.allArgs()).toEqual([[defaultUri, {}]])
  })

  it('run atom-xterm:open-split-left-dock', () => {
    let mock = jasmine.createSpyObj('dock', ['getActivePane'])
    spyOn(atom.workspace, 'getLeftDock').and.returnValue(mock)
    mock.getActivePane.and.returnValue(null)
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:open-split-left-dock')
    expect(atom.workspace.open.calls.allArgs()).toEqual([[defaultUri, {}]])
  })

  it('run atom-xterm:open-split-right-dock', () => {
    let mock = jasmine.createSpyObj('dock', ['getActivePane'])
    spyOn(atom.workspace, 'getRightDock').and.returnValue(mock)
    mock.getActivePane.and.returnValue(null)
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:open-split-right-dock')
    expect(atom.workspace.open.calls.allArgs()).toEqual([[defaultUri, {}]])
  })

  it('run atom-xterm:reorganize no terminals in workspace', () => {
    spyOn(this.atomXtermPackage.mainModule, 'reorganize').and.callThrough()
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:reorganize')
    expect(this.atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['current']])
  })

  it('run atom-xterm:reorganize one terminal in workspace', () => {
    spyOn(this.atomXtermPackage.mainModule, 'reorganize').and.callThrough()
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:open')
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:reorganize')
    expect(this.atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['current']])
  })

  it('run atom-xterm:reorganize-top no terminals in workspace', () => {
    spyOn(this.atomXtermPackage.mainModule, 'reorganize').and.callThrough()
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:reorganize-top')
    expect(this.atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['top']])
  })

  it('run atom-xterm:reorganize-top one terminal in workspace', () => {
    spyOn(this.atomXtermPackage.mainModule, 'reorganize').and.callThrough()
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:open')
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:reorganize-top')
    expect(this.atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['top']])
  })

  it('run atom-xterm:reorganize-bottom no terminals in workspace', () => {
    spyOn(this.atomXtermPackage.mainModule, 'reorganize').and.callThrough()
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:reorganize-bottom')
    expect(this.atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['bottom']])
  })

  it('run atom-xterm:reorganize-bottom one terminal in workspace', () => {
    spyOn(this.atomXtermPackage.mainModule, 'reorganize').and.callThrough()
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:open')
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:reorganize-bottom')
    expect(this.atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['bottom']])
  })

  it('run atom-xterm:reorganize-left no terminals in workspace', () => {
    spyOn(this.atomXtermPackage.mainModule, 'reorganize').and.callThrough()
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:reorganize-left')
    expect(this.atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['left']])
  })

  it('run atom-xterm:reorganize-left one terminal in workspace', () => {
    spyOn(this.atomXtermPackage.mainModule, 'reorganize').and.callThrough()
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:open')
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:reorganize-left')
    expect(this.atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['left']])
  })

  it('run atom-xterm:reorganize-right no terminals in workspace', () => {
    spyOn(this.atomXtermPackage.mainModule, 'reorganize').and.callThrough()
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:reorganize-right')
    expect(this.atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['right']])
  })

  it('run atom-xterm:reorganize-right one terminal in workspace', () => {
    spyOn(this.atomXtermPackage.mainModule, 'reorganize').and.callThrough()
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:open')
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:reorganize-right')
    expect(this.atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['right']])
  })

  it('run atom-xterm:reorganize-bottom-dock no terminals in workspace', () => {
    spyOn(this.atomXtermPackage.mainModule, 'reorganize').and.callThrough()
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:reorganize-bottom-dock')
    expect(this.atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['bottom-dock']])
  })

  it('run atom-xterm:reorganize-bottom-dock one terminal in workspace', () => {
    spyOn(this.atomXtermPackage.mainModule, 'reorganize').and.callThrough()
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:open')
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:reorganize-bottom-dock')
    expect(this.atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['bottom-dock']])
  })

  it('run atom-xterm:reorganize-left-dock no terminals in workspace', () => {
    spyOn(this.atomXtermPackage.mainModule, 'reorganize').and.callThrough()
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:reorganize-left-dock')
    expect(this.atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['left-dock']])
  })

  it('run atom-xterm:reorganize-left-dock one terminal in workspace', () => {
    spyOn(this.atomXtermPackage.mainModule, 'reorganize').and.callThrough()
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:open')
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:reorganize-left-dock')
    expect(this.atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['left-dock']])
  })

  it('run atom-xterm:reorganize-right-dock no terminals in workspace', () => {
    spyOn(this.atomXtermPackage.mainModule, 'reorganize').and.callThrough()
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:reorganize-right-dock')
    expect(this.atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['right-dock']])
  })

  it('run atom-xterm:reorganize-right-dock one terminal in workspace', () => {
    spyOn(this.atomXtermPackage.mainModule, 'reorganize').and.callThrough()
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:open')
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:reorganize-right-dock')
    expect(this.atomXtermPackage.mainModule.reorganize.calls.allArgs()).toEqual([['right-dock']])
  })

  it('run atom-xterm:close-all no terminals in workspace', () => {
    spyOn(this.atomXtermPackage.mainModule, 'exitAllTerminals').and.callThrough()
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:close-all')
    expect(this.atomXtermPackage.mainModule.exitAllTerminals).toHaveBeenCalled()
  })

  it('run atom-xterm:close-all one terminal in workspace', () => {
    spyOn(this.atomXtermPackage.mainModule, 'exitAllTerminals').and.callThrough()
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:open')
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:close-all')
    expect(this.atomXtermPackage.mainModule.exitAllTerminals).toHaveBeenCalled()
  })

  it('run atom-xterm:close', (done) => {
    createNewElement(this.atomXtermPackage.mainModule).then((element) => {
      spyOn(atom.workspace, 'getActivePaneItem').and.returnValue(element.model)
      atom.commands.dispatch(element, 'atom-xterm:close')
      expect(element.model.exit).toHaveBeenCalled()
      done()
    })
  })

  it('run atom-xterm:restart', (done) => {
    createNewElement(this.atomXtermPackage.mainModule).then((element) => {
      spyOn(atom.workspace, 'getActivePaneItem').and.returnValue(element.model)
      atom.commands.dispatch(element, 'atom-xterm:restart')
      expect(element.model.restartPtyProcess).toHaveBeenCalled()
      done()
    })
  })

  it('run atom-xterm:copy', (done) => {
    createNewElement(this.atomXtermPackage.mainModule).then((element) => {
      spyOn(atom.workspace, 'getActivePaneItem').and.returnValue(element.model)
      spyOn(atom.clipboard, 'write')
      atom.commands.dispatch(element, 'atom-xterm:copy')
      expect(atom.clipboard.write.calls.allArgs()).toEqual([['some text from terminal']])
      done()
    })
  })

  it('run atom-xterm:paste', (done) => {
    createNewElement(this.atomXtermPackage.mainModule).then((element) => {
      spyOn(atom.workspace, 'getActivePaneItem').and.returnValue(element.model)
      atom.clipboard.write('some text from clipboard')
      atom.commands.dispatch(element, 'atom-xterm:paste')
      expect(element.model.pasteToTerminal.calls.allArgs()).toEqual([['some text from clipboard']])
      done()
    })
  })

  it('run atom-xterm:open-link', (done) => {
    createNewElement(this.atomXtermPackage.mainModule).then((element) => {
      spyOn(atom.workspace, 'getActivePaneItem').and.returnValue(element.model)
      atom.commands.dispatch(element, 'atom-xterm:open-link')
      expect(element.model.openHoveredLink).toHaveBeenCalled()
      done()
    })
  })

  it('run atom-xterm:copy-link', (done) => {
    createNewElement(this.atomXtermPackage.mainModule).then((element) => {
      spyOn(atom.workspace, 'getActivePaneItem').and.returnValue(element.model)
      atom.commands.dispatch(element, 'atom-xterm:copy-link')
      expect(element.model.getHoveredLink).toHaveBeenCalled()
      done()
    })
  })

  it('run atom-xterm:copy-link with returned link', (done) => {
    createNewElement(this.atomXtermPackage.mainModule).then((element) => {
      spyOn(atom.workspace, 'getActivePaneItem').and.returnValue(element.model)
      let expected = 'https://atom.io'
      element.model.getHoveredLink.and.returnValue(expected)
      spyOn(atom.clipboard, 'write')
      atom.commands.dispatch(element, 'atom-xterm:copy-link')
      expect(atom.clipboard.write.calls.allArgs()).toEqual([[expected]])
      done()
    })
  })

  it('run atom-xterm:copy-link no returned link', (done) => {
    createNewElement(this.atomXtermPackage.mainModule).then((element) => {
      spyOn(atom.workspace, 'getActivePaneItem').and.returnValue(element.model)
      let expected = null
      element.model.getHoveredLink.and.returnValue(expected)
      spyOn(atom.clipboard, 'write')
      atom.commands.dispatch(element, 'atom-xterm:copy-link')
      expect(atom.clipboard.write).not.toHaveBeenCalled()
      done()
    })
  })

  it('openInCenterOrDock()', () => {
    let mock = jasmine.createSpyObj('dock', ['getActivePane'])
    mock.getActivePane.and.returnValue(null)
    this.atomXtermPackage.mainModule.openInCenterOrDock(mock)
    expect(atom.workspace.open.calls.allArgs()).toEqual([[defaultUri, {}]])
  })

  it('refitAllTerminals()', () => {
    // Should basically not fail.
    atom.commands.dispatch(this.workspaceElement, 'atom-xterm:open')
    this.atomXtermPackage.mainModule.refitAllTerminals()
  })

  it('deserializeAtomXtermModel() relaunching terminals on startup not allowed relaunchTerminalOnStartup not set in uri', () => {
    atom.config.set('atom-xterm.terminalSettings.allowRelaunchingTerminalsOnStartup', false)
    let url = new URL('atom-xterm://somesessionid/')
    let serializedModel = {
      deserializer: 'AtomXtermModel',
      version: '2017-09-17',
      uri: url.href
    }
    let model = this.atomXtermPackage.mainModule.deserializeAtomXtermModel(serializedModel)
    expect(model).toBeUndefined()
  })

  it('deserializeAtomXtermModel() relaunching terminals on startup not allowed relaunchTerminalOnStartup set in uri', () => {
    atom.config.set('atom-xterm.terminalSettings.allowRelaunchingTerminalsOnStartup', false)
    let url = new URL('atom-xterm://somesessionid/')
    url.searchParams.set('relaunchTerminalOnStartup', true)
    let serializedModel = {
      deserializer: 'AtomXtermModel',
      version: '2017-09-17',
      uri: url.href
    }
    let model = this.atomXtermPackage.mainModule.deserializeAtomXtermModel(serializedModel)
    expect(model).toBeUndefined()
  })

  it('deserializeAtomXtermModel() relaunching terminals on startup allowed relaunchTerminalOnStartup not set in uri', () => {
    let url = new URL('atom-xterm://somesessionid/')
    let serializedModel = {
      deserializer: 'AtomXtermModel',
      version: '2017-09-17',
      uri: url.href
    }
    let model = this.atomXtermPackage.mainModule.deserializeAtomXtermModel(serializedModel)
    model.pane = jasmine.createSpyObj('pane',
      ['destroyItem'])
    model.pane.getActiveItem = jasmine.createSpy('getActiveItem')
      .and.returnValue(model)
    expect(model instanceof AtomXtermModel).toBeTruthy()
  })

  it('deserializeAtomXtermModel() relaunching terminals on startup allowed relaunchTerminalOnStartup set to true in uri', () => {
    let url = new URL('atom-xterm://somesessionid/')
    url.searchParams.set('relaunchTerminalOnStartup', true)
    let serializedModel = {
      deserializer: 'AtomXtermModel',
      version: '2017-09-17',
      uri: url.href
    }
    let model = this.atomXtermPackage.mainModule.deserializeAtomXtermModel(serializedModel)
    model.pane = jasmine.createSpyObj('pane',
      ['destroyItem'])
    model.pane.getActiveItem = jasmine.createSpy('getActiveItem')
      .and.returnValue(model)
    expect(model instanceof AtomXtermModel).toBeTruthy()
  })

  it('deserializeAtomXtermModel() relaunching terminals on startup allowed relaunchTerminalOnStartup set to false in uri', () => {
    let url = new URL('atom-xterm://somesessionid/')
    url.searchParams.set('relaunchTerminalOnStartup', false)
    let serializedModel = {
      deserializer: 'AtomXtermModel',
      version: '2017-09-17',
      uri: url.href
    }
    let model = this.atomXtermPackage.mainModule.deserializeAtomXtermModel(serializedModel)
    expect(model).toBeUndefined()
  })

  it('open() basic uri', (done) => {
    atom.workspace.open.and.stub()
    let expectedUri = 'atom-xterm://somesessionid/'
    this.atomXtermPackage.mainModule.open(expectedUri).then(() => {
      expect(atom.workspace.open.calls.allArgs()).toEqual([[expectedUri, {}]])
      done()
    })
  })

  it('open() return AtomXtermModel', (done) => {
    let expectedUri = 'atom-xterm://somesessionid/'
    this.atomXtermPackage.mainModule.open(expectedUri).then((item) => {
      expect(item instanceof AtomXtermModel).toBe(true)
      done()
    })
  })

  it('open() alternate uri', (done) => {
    atom.workspace.open.and.stub()
    let expectedUri = 'atom-xterm://somesessionid/?blahblahblah'
    this.atomXtermPackage.mainModule.open(expectedUri).then(() => {
      expect(atom.workspace.open.calls.allArgs()).toEqual([[expectedUri, {}]])
      done()
    })
  })

  it('open() alternate options', (done) => {
    atom.workspace.open.and.stub()
    let expectedUri = 'atom-xterm://somesessionid/'
    let expectedOptions = {foo: 'bar'}
    this.atomXtermPackage.mainModule.open(expectedUri, expectedOptions).then(() => {
      expect(atom.workspace.open.calls.allArgs()).toEqual([[expectedUri, expectedOptions]])
      done()
    })
  })

  it('open() alternate uri and options', (done) => {
    atom.workspace.open.and.stub()
    let expectedUri = 'atom-xterm://somesessionid/?blahblahblah'
    let expectedOptions = {foo: 'bar'}
    this.atomXtermPackage.mainModule.open(expectedUri, expectedOptions).then(() => {
      expect(atom.workspace.open.calls.allArgs()).toEqual([[expectedUri, expectedOptions]])
      done()
    })
  })

  it('open() relaunchTerminalOnStartup set to true in config not set in uri', (done) => {
    atom.workspace.open.and.stub()
    let url = new URL('atom-xterm://somesessionid/')
    atom.config.set('atom-xterm.terminalSettings.relaunchTerminalOnStartup', true)
    this.atomXtermPackage.mainModule.open(url.href).then(() => {
      expect(atom.workspace.open.calls.allArgs()).toEqual([[url.href, {}]])
      done()
    })
  })

  it('open() relaunchTerminalOnStartup set to true in config set to false in uri', (done) => {
    atom.workspace.open.and.stub()
    let url = new URL('atom-xterm://somesessionid/')
    url.searchParams.set('relaunchTerminalOnStartup', false)
    atom.config.set('atom-xterm.terminalSettings.relaunchTerminalOnStartup', true)
    this.atomXtermPackage.mainModule.open(url.href).then(() => {
      expect(atom.workspace.open.calls.allArgs()).toEqual([[url.href, {}]])
      done()
    })
  })

  it('open() relaunchTerminalOnStartup set to true in config set to true in uri', (done) => {
    atom.workspace.open.and.stub()
    let url = new URL('atom-xterm://somesessionid/')
    url.searchParams.set('relaunchTerminalOnStartup', true)
    atom.config.set('atom-xterm.terminalSettings.relaunchTerminalOnStartup', true)
    this.atomXtermPackage.mainModule.open(url.href).then(() => {
      expect(atom.workspace.open.calls.allArgs()).toEqual([[url.href, {}]])
      done()
    })
  })

  it('openTerminal() check call to open', (done) => {
    this.atomXtermPackage.mainModule.openTerminal({}).then((item) => {
      let args = atom.workspace.open.calls.argsFor(0)
      let url = new URL(args[0])
      expect(url.protocol).toBe('atom-xterm:')
      done()
    })
  })

  it('openTerminal() check options passed', (done) => {
    this.atomXtermPackage.mainModule.openTerminal({}, {'split': 'down'}).then((item) => {
      let args = atom.workspace.open.calls.argsFor(0)
      let options = args[1]
      expect(options).toEqual({'split': 'down'})
      done()
    })
  })

  it('openTerminal() check call to open with command', (done) => {
    let profile = {
      command: 'somecommand'
    }
    this.atomXtermPackage.mainModule.openTerminal(profile).then((item) => {
      let args = atom.workspace.open.calls.argsFor(0)
      let url = new URL(args[0])
      expect(url.searchParams.get('command')).toBe('somecommand')
      done()
    })
  })

  it('openTerminal() check call to open with command and arguments', (done) => {
    let profile = {
      command: 'somecommand',
      args: ['--foo', '--bar', '--baz']
    }
    this.atomXtermPackage.mainModule.openTerminal(profile).then((item) => {
      let args = atom.workspace.open.calls.argsFor(0)
      let url = new URL(args[0])
      expect(url.searchParams.get('command')).toBe('somecommand')
      expect(JSON.parse(url.searchParams.get('args'))).toEqual(['--foo', '--bar', '--baz'])
      done()
    })
  })

  it('openTerminal() check returned item is AtomXtermModel', (done) => {
    this.atomXtermPackage.mainModule.openTerminal({}).then((item) => {
      expect(item instanceof AtomXtermModel).toBe(true)
      done()
    })
  })

  it('provideAtomXtermService() provides openTerminal() method', () => {
    let atomXtermService = this.atomXtermPackage.mainModule.provideAtomXtermService()
    expect(atomXtermService.hasOwnProperty('openTerminal')).toBe(true)
    expect(Object.prototype.toString.call(atomXtermService.openTerminal)).toBe('[object Function]')
  })

  it('provideAtomXtermService() openTerminal() returns AtomXtermModel', (done) => {
    let atomXtermService = this.atomXtermPackage.mainModule.provideAtomXtermService()
    atomXtermService.openTerminal({}).then((item) => {
      expect(item instanceof AtomXtermModel).toBe(true)
      done()
    })
  })

  it('atom-xterm.spawnPtySettings.command', () => {
    expect(atom.config.get('atom-xterm.spawnPtySettings.command')).toEqual(config.getDefaultShellCommand())
  })

  it('atom-xterm.spawnPtySettings.args', () => {
    expect(atom.config.get('atom-xterm.spawnPtySettings.args')).toEqual('[]')
  })

  it('atom-xterm.spawnPtySettings.name', () => {
    expect(atom.config.get('atom-xterm.spawnPtySettings.name')).toEqual(config.getDefaultTermType())
  })

  it('atom-xterm.spawnPtySettings.cwd', () => {
    expect(atom.config.get('atom-xterm.spawnPtySettings.cwd')).toEqual(config.getDefaultCwd())
  })

  it('atom-xterm.spawnPtySettings.env', () => {
    expect(atom.config.get('atom-xterm.spawnPtySettings.env')).toEqual('')
  })

  it('atom-xterm.spawnPtySettings.setEnv', () => {
    expect(atom.config.get('atom-xterm.spawnPtySettings.setEnv')).toEqual('{}')
  })

  it('atom-xterm.spawnPtySettings.deleteEnv', () => {
    expect(atom.config.get('atom-xterm.spawnPtySettings.deleteEnv')).toEqual('[]')
  })

  it('atom-xterm.spawnPtySettings.encoding', () => {
    expect(atom.config.get('atom-xterm.spawnPtySettings.encoding')).toEqual('')
  })

  it('atom-xterm.terminalSettings.fontSize', () => {
    expect(atom.config.get('atom-xterm.terminalSettings.fontSize')).toEqual(14)
  })

  it('atom-xterm.terminalSettings.leaveOpenAfterExit', () => {
    expect(atom.config.get('atom-xterm.terminalSettings.leaveOpenAfterExit')).toBeTruthy()
  })

  it('atom-xterm.terminalSettings.allowRelaunchingTerminalsOnStartup', () => {
    expect(atom.config.get('atom-xterm.terminalSettings.allowRelaunchingTerminalsOnStartup')).toBeTruthy()
  })

  it('atom-xterm.terminalSettings.relaunchTerminalOnStartup', () => {
    expect(atom.config.get('atom-xterm.terminalSettings.relaunchTerminalOnStartup')).toBeTruthy()
  })

  it('atom-xterm.terminalSettings.fontSize minimum 8', () => {
    atom.config.set('atom-xterm.terminalSettings.fontSize', 0)
    expect(atom.config.get('atom-xterm.terminalSettings.fontSize')).toEqual(8)
  })

  it('atom-xterm.terminalSettings.fontSize maximum 100', () => {
    atom.config.set('atom-xterm.terminalSettings.fontSize', 101)
    expect(atom.config.get('atom-xterm.terminalSettings.fontSize')).toEqual(100)
  })

  it('atom-xterm.terminalSettings.title', () => {
    expect(atom.config.get('atom-xterm.terminalSettings.title')).toEqual('')
  })
})
