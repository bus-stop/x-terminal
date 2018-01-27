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

import { CompositeDisposable } from 'atom'
import { spawn as spawnPty } from 'node-pty-prebuilt'
import { Terminal } from 'xterm'
import * as fit from 'xterm/lib/addons/fit/fit'
import urlRegex from 'url-regex'
import { shell } from 'electron'

import AtomXtermProfileMenuElement from './atom-xterm-profile-menu-element'
import { AtomXtermProfileMenuModel } from './atom-xterm-profile-menu-model'
import { AtomXtermProfilesSingleton } from './atom-xterm-profiles'

import fs from 'fs-extra'

import elementResizeDetectorMaker from 'element-resize-detector'

Terminal.applyAddon(fit)

const STRICT_URL_REGEX = new RegExp(`(${urlRegex({exact: false, strict: true}).source})`)

class AtomXtermElement extends HTMLElement {
  initialize (model) {
    this.profilesSingleton = AtomXtermProfilesSingleton.instance
    this.model = model
    this.model.element = this
    this.disposables = new CompositeDisposable()
    this.topDiv = document.createElement('div')
    this.topDiv.classList.add('atom-xterm-top-div')
    this.appendChild(this.topDiv)
    this.mainDiv = document.createElement('div')
    this.mainDiv.classList.add('atom-xterm-main-div')
    this.appendChild(this.mainDiv)
    this.menuDiv = document.createElement('div')
    this.menuDiv.classList.add('atom-xterm-menu-div')
    this.mainDiv.appendChild(this.menuDiv)
    this.terminalDiv = document.createElement('div')
    this.terminalDiv.classList.add('atom-xterm-term-container')
    this.mainDiv.appendChild(this.terminalDiv)
    this.atomXtermProfileMenuElement = new AtomXtermProfileMenuElement()
    this.hoveredLink = null
    this.pendingXtermOptions = {}
    this.terminalDivIntersectionRatio = 0.0
    this.isInitialized = false
    this.initializedPromise = new Promise((resolve, reject) => {
      // Always wait for the model to finish initializing before proceeding.
      this.model.initializedPromise.then((atomXtermModel) => {
        this.setAttribute('session-id', this.model.getSessionId())
        this.atomXtermProfileMenuElement.initialize(new AtomXtermProfileMenuModel(this.model)).then(() => {
          this.menuDiv.append(this.atomXtermProfileMenuElement)
          this.createTerminal().then(() => {
            // An element resize detector is used to check when this element is
            // resized due to the pane resizing or due to the entire window
            // resizing.
            this.erd = elementResizeDetectorMaker({
              strategy: 'scroll'
            })
            this.erd.listenTo(this.mainDiv, (element) => {
              this.refitTerminal()
            })
            // Add an IntersectionObserver in order to apply new options and
            // refit as soon as the terminal is visible.
            this.terminalDivIntersectionObserver = new IntersectionObserver((entries, observer) => {
              // NOTE: Only the terminal div should be observed therefore there
              // should only be one entry.
              let entry = entries[0]
              this.terminalDivIntersectionRatio = entry.intersectionRatio
              if (this.terminalDivIntersectionRatio === 1.0) {
                this.applyPendingXtermOptions()
                this.refitTerminal()
              }
            }, {
              root: this,
              threshold: 1.0
            })
            this.terminalDivIntersectionObserver.observe(this.terminalDiv)
            resolve()
          })
        })
      }).then(() => {
        this.isInitialized = true
      })
    })
    return this.initializedPromise
  }

  destroy () {
    this.atomXtermProfileMenuElement.destroy()
    if (this.ptyProcess) {
      this.ptyProcess.kill()
    }
    if (this.terminal) {
      this.terminal.destroy()
    }
    this.disposables.dispose()
  }

  getShellCommand () {
    return this.model.profile.command
  }

  getArgs () {
    let args = this.model.profile.args
    if (!Array.isArray(args)) {
      throw new Error('Arguments set are not an array.')
    }
    return args
  }

  getTermType () {
    return this.model.profile.name
  }

  checkPathIsDirectory (path) {
    return new Promise((resolve, reject) => {
      if (path) {
        fs.stat(path, (err, stats) => {
          if (err) {
            resolve(false)
          }
          if (stats && stats.isDirectory()) {
            resolve(true)
          }
          resolve(false)
        })
      } else {
        resolve(false)
      }
    })
  }

  getCwd () {
    return new Promise((resolve, reject) => {
      let cwd = this.model.profile.cwd
      this.checkPathIsDirectory(cwd).then((isDirectory) => {
        if (isDirectory) {
          resolve(cwd)
        } else {
          cwd = this.model.getPath()
          this.checkPathIsDirectory(cwd).then((isDirectory) => {
            if (isDirectory) {
              resolve(cwd)
            } else {
              // If the cwd from the model was invalid, reset it to null.
              this.model.cwd = null
              cwd = this.profilesSingleton.getBaseProfile.cwd
              this.checkPathIsDirectory(cwd).then((isDirectory) => {
                if (isDirectory) {
                  this.model.cwd = cwd
                  resolve(cwd)
                }
                resolve(null)
              })
            }
          })
        }
      })
    })
  }

  getEnv () {
    let env = this.model.profile.env
    if (!env) {
      env = Object.assign({}, process.env)
    }
    if (typeof env !== 'object' || Array.isArray(env)) {
      throw new Error('Environment set is not an object.')
    }
    let setEnv = this.model.profile.setEnv
    let deleteEnv = this.model.profile.deleteEnv
    for (let key in setEnv) {
      env[key] = setEnv[key]
    }
    for (let key of deleteEnv) {
      delete env[key]
    }
    return env
  }

  getEncoding () {
    return this.model.profile.encoding
  }

  leaveOpenAfterExit () {
    return this.model.profile.leaveOpenAfterExit
  }

  isPtyProcessRunning () {
    return (this.ptyProcess && this.ptyProcessRunning)
  }

  createTerminal () {
    // Attach terminal emulator to this element and refit.
    this.terminal = new Terminal({
      cursorBlink: true,
      fontSize: this.model.profile.fontSize
    })
    this.terminal.open(this.terminalDiv)
    this.refitTerminal()
    this.ptyProcess = null
    this.ptyProcessRunning = false
    this.terminal.on('data', (data) => {
      if (this.isPtyProcessRunning()) {
        this.ptyProcess.write(data)
      }
    })
    this.terminal.on('resize', (data) => {
      if (this.isPtyProcessRunning()) {
        this.ptyProcess.resize(data.cols, data.rows)
      }
    })
    this.terminal.registerLinkMatcher(
      STRICT_URL_REGEX,
      (mouseEvent, uri) => {
        shell.openExternal(uri)
      },
      {
        matchIndex: 1,
        tooltipCallback: (mouseEvent, uri) => {
          this.setHoveredLink(uri)
        },
        leaveCallback: () => {
          this.clearHoveredLink()
        },
        priority: 100
      }
    )
    this.disposables.add(this.profilesSingleton.onDidResetBaseProfile((baseProfile) => {
      this.model.profile.fontSize = baseProfile.fontSize
      this.pendingXtermOptions.fontSize = this.model.profile.fontSize
      if (this.terminalDivIntersectionRatio === 1.0) {
        // Terminal is already completely visible, apply new settings and refit
        // now.
        this.applyPendingXtermOptions()
        this.refitTerminal()
      }
    }))
    return this.restartPtyProcess()
  }

  showNotification (message, infoType) {
    let messageDiv = document.createElement('div')
    let restartButton = document.createElement('button')
    restartButton.classList.add('btn')
    restartButton.appendChild(document.createTextNode('Restart'))
    restartButton.addEventListener('click', (event) => {
      this.restartPtyProcess()
    })
    restartButton.classList.add('btn-' + infoType)
    restartButton.classList.add('atom-xterm-restart-btn')
    messageDiv.classList.add('atom-xterm-notice-' + infoType)
    messageDiv.appendChild(document.createTextNode(message))
    messageDiv.appendChild(restartButton)
    this.topDiv.innerHTML = ''
    this.topDiv.appendChild(messageDiv)
    if (infoType === 'success') {
      atom.notifications.addSuccess(message)
    } else if (infoType === 'error') {
      atom.notifications.addError(message)
    } else if (infoType === 'warning') {
      atom.notifications.addWarning(message)
    } else if (infoType === 'info') {
      atom.notifications.addInfo(message)
    } else {
      throw new Error('Unknown info type: ' + infoType)
    }
  }

  restartPtyProcess () {
    return new Promise((resolve, reject) => {
      this.getCwd().then((cwd) => {
        if (this.ptyProcessRunning) {
          this.ptyProcess.removeAllListeners('exit')
          this.ptyProcess.kill()
        }
        // Reset the terminal.
        this.atomXtermProfileMenuElement.hideProfileMenu()
        this.terminal.reset()

        // Setup pty process.
        this.ptyProcessCommand = this.getShellCommand()
        this.ptyProcessArgs = this.getArgs()
        let name = this.getTermType()
        let env = this.getEnv()
        let encoding = this.getEncoding()

        // Attach pty process to terminal.
        // NOTE: This must be done after the terminal is attached to the
        // parent element and refitted.
        this.ptyProcessOptions = {
          'name': name,
          'cwd': cwd,
          'env': env
        }
        if (encoding) {
          // There's some issue if 'encoding=null' is passed in the options,
          // therefore, only set it if there's an actual encoding to set.
          this.ptyProcessOptions['encoding'] = encoding
        }

        this.ptyProcessOptions.cols = this.terminal.cols
        this.ptyProcessOptions.rows = this.terminal.rows
        this.ptyProcess = null
        this.ptyProcessRunning = false
        try {
          this.ptyProcess = spawnPty(this.ptyProcessCommand, this.ptyProcessArgs, this.ptyProcessOptions)
        } catch (err) {
          let message = 'Launching \'' + this.ptyProcessCommand + '\' raised the following error: ' + err.message
          if (err.message.startsWith('File not found:')) {
            message = 'Could not find command \'' + this.ptyProcessCommand + '\'.'
          }
          this.showNotification(
            message,
            'error'
          )
          resolve()
        }
        if (this.ptyProcess) {
          this.ptyProcessRunning = true
          this.ptyProcess.on('data', (data) => {
            let oldTitle = this.model.title
            if (this.model.profile.title !== null) {
              this.model.title = this.model.profile.title
            } else if (process.platform !== 'win32') {
              this.model.title = this.ptyProcess.process
            }
            if (oldTitle !== this.model.title) {
              this.model.emitter.emit('did-change-title', this.model.title)
            }
            this.terminal.write(data)
            this.model.handleNewDataArrival()
          })
          this.ptyProcess.on('exit', (code, signal) => {
            this.ptyProcessRunning = false
            if (!this.leaveOpenAfterExit()) {
              this.model.exit()
            } else {
              if (code === 0) {
                this.showNotification(
                  'The terminal process has finished successfully.',
                  'success'
                )
              } else {
                this.showNotification(
                  'The terminal process has exited with failure code \'' + code + '\'.',
                  'error'
                )
              }
            }
          })
          this.topDiv.innerHTML = ''
          resolve()
        }
      })
    })
  }

  applyPendingXtermOptions () {
    for (let key of Object.keys(this.pendingXtermOptions)) {
      this.terminal.setOption(key, this.pendingXtermOptions[key])
    }
    this.pendingXtermOptions = {}
  }

  refitTerminal () {
    // Only refit the terminal when it is completely visible.
    if (this.terminalDivIntersectionRatio === 1.0) {
      this.terminal.fit()
    }
  }

  focusOnTerminal () {
    if (this.terminal) {
      this.terminal.focus()
    }
  }

  toggleProfileMenu () {
    // The profile menu needs to be initialized before it can be toggled.
    this.atomXtermProfileMenuElement.initializedPromise.then(() => {
      this.atomXtermProfileMenuElement.toggleProfileMenu()
    })
  }

  setNewProfile (newProfile) {
    this.model.setNewProfile(newProfile)
  }

  hideTerminal () {
    this.terminalDiv.style.visibility = 'hidden'
  }

  showTerminal () {
    this.terminalDiv.style.visibility = 'visible'
  }

  setHoveredLink (link) {
    this.hoveredLink = link
    this.terminalDiv.classList.add('atom-xterm-term-container-has-link')
  }

  clearHoveredLink () {
    this.terminalDiv.classList.remove('atom-xterm-term-container-has-link')
    this.hoveredLink = null
  }

  openHoveredLink () {
    if (this.hoveredLink) {
      shell.openExternal(this.hoveredLink)
    }
  }

  getHoveredLink () {
    if (this.hoveredLink) {
      return this.hoveredLink
    }
  }
}

module.exports = document.registerElement('atom-xterm', {
  prototype: AtomXtermElement.prototype
})
