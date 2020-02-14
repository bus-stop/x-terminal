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
import { spawn as spawnPty } from 'node-pty-prebuilt-multiarch'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { WebglAddon } from 'xterm-addon-webgl'
import { shell } from 'electron'

import atomXtermConfig from './atom-xterm-config'
import { AtomXtermProfileMenuElement } from './atom-xterm-profile-menu-element'
import { AtomXtermProfileMenuModel } from './atom-xterm-profile-menu-model'
import { AtomXtermProfilesSingleton } from './atom-xterm-profiles'

import fs from 'fs-extra'

import elementResizeDetectorMaker from 'element-resize-detector'

const PTY_PROCESS_OPTIONS = new Set([
  'command',
  'args',
  'name',
  'cwd',
  'env',
  'setEnv',
  'deleteEnv',
  'encoding'
])
const ATOM_XTERM_OPTIONS = [
  'leaveOpenAfterExit',
  'relaunchTerminalOnStartup',
  'title',
  'promptToStartup'
]

class AtomXtermElementImpl extends HTMLElement {
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
    this.pendingTerminalProfileOptions = {}
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
              const entry = entries[0]
              this.terminalDivIntersectionRatio = entry.intersectionRatio
              this.applyPendingTerminalProfileOptions()
            }, {
              root: this,
              threshold: 1.0
            })
            this.terminalDivIntersectionObserver.observe(this.terminalDiv)
            // Add event handler for increasing/decreasing the font when
            // holding 'ctrl' and moving the mouse wheel up or down.
            this.terminalDiv.addEventListener(
              'wheel',
              (wheelEvent) => {
                if (wheelEvent.ctrlKey && atom.config.get('editor.zoomFontWhenCtrlScrolling')) {
                  if (wheelEvent.deltaY < 0) {
                    let fontSize = this.model.profile.fontSize + 1
                    if (fontSize > atomXtermConfig.getMaximumFontSize()) {
                      fontSize = atomXtermConfig.getMaximumFontSize()
                    }
                    this.model.applyProfileChanges({ fontSize: fontSize })
                    wheelEvent.stopPropagation()
                  } else if (wheelEvent.deltaY > 0) {
                    let fontSize = this.model.profile.fontSize - 1
                    if (fontSize < atomXtermConfig.getMinimumFontSize()) {
                      fontSize = atomXtermConfig.getMinimumFontSize()
                    }
                    this.model.applyProfileChanges({ fontSize: fontSize })
                    wheelEvent.stopPropagation()
                  }
                }
              },
              { capture: true }
            )
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
      this.terminal.dispose()
    }
    this.disposables.dispose()
  }

  getShellCommand () {
    return this.model.profile.command
  }

  getArgs () {
    const args = this.model.profile.args
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
    const setEnv = this.model.profile.setEnv
    const deleteEnv = this.model.profile.deleteEnv
    for (const key in setEnv) {
      env[key] = setEnv[key]
    }
    for (const key of deleteEnv) {
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

  isPromptToStartup () {
    return this.model.profile.promptToStartup
  }

  isPtyProcessRunning () {
    return (this.ptyProcess && this.ptyProcessRunning)
  }

  getTheme (profile) {
    let colors = {}
    // themes modified from https://github.com/bus-stop/terminus/tree/master/styles/themes
    switch (profile.theme || this.model.profile.theme) {
      case 'Atom Dark':
        colors = {
          background: '#1d1f21',
          foreground: '#c5c8c6',
          selection: '#999',
          cursor: '#fff'
        }
        break
      case 'Atom Light':
        colors = {
          background: '#fff',
          foreground: '#555',
          selection: '#afc4da',
          cursor: '#000'
        }
        break
      case 'Base16 Tomorrow Dark':
        colors = {
          background: '#1d1f21',
          foreground: '#c5c8c6',
          selection: '#b4b7b4',
          // selectionForeground: '#e0e0e0',
          cursor: '#fff'
        }
        break
      case 'Base16 Tomorrow Light':
        colors = {
          background: '#fff',
          foreground: '#1d1f21',
          selection: '#282a2e',
          // selectionForeground: '#e0e0e0',
          cursor: '#1d1f21'
        }
        break
      case 'Christmas':
        colors = {
          background: '#0c0047',
          foreground: '#f81705',
          selection: '#298f16',
          cursor: '#009f59'
        }
        break
      case 'City Lights':
        colors = {
          background: '#181d23',
          foreground: '#666d81',
          selection: '#2a2f38',
          // selectionForeground: '#b7c5d3',
          cursor: '#528bff'
        }
        break
      case 'Dracula':
        colors = {
          background: '#1e1f29',
          foreground: 'white',
          selection: '#44475a',
          cursor: '#999999'
        }
        break
      case 'Grass':
        colors = {
          background: 'rgb(19, 119, 61)',
          foreground: 'rgb(255, 240, 165)',
          selection: 'rgba(182, 73, 38, .99)',
          cursor: 'rgb(142, 40, 0)'
        }
        break
      case 'Homebrew':
        colors = {
          background: '#000',
          foreground: 'rgb(41, 254, 20)',
          selection: 'rgba(7, 30, 155, .99)',
          cursor: 'rgb(55, 254, 38)'
        }
        break
      case 'Inverse':
        colors = {
          background: '#fff',
          foreground: '#000',
          selection: 'rgba(178, 215, 255, .99)',
          cursor: 'rgb(146, 146, 146)'
        }
        break
      case 'Linux':
        colors = {
          background: '#000',
          foreground: 'rgb(230, 230, 230)',
          selection: 'rgba(155, 30, 7, .99)',
          cursor: 'rgb(200, 20, 25)'
        }
        break
      case 'Man Page':
        colors = {
          background: 'rgb(254, 244, 156)',
          foreground: 'black',
          selection: 'rgba(178, 215, 255, .99)',
          cursor: 'rgb(146, 146, 146)'
        }
        break
      case 'Novel':
        colors = {
          background: 'rgb(223, 219, 196)',
          foreground: 'rgb(77, 47, 46)',
          selection: 'rgba(155, 153, 122, .99)',
          cursor: 'rgb(115, 99, 89)'
        }
        break
      case 'Ocean':
        colors = {
          background: 'rgb(44, 102, 201)',
          foreground: 'white',
          selection: 'rgba(41, 134, 255, .99)',
          cursor: 'rgb(146, 146, 146)'
        }
        break
      case 'One Dark':
        colors = {
          background: '#282c34',
          foreground: '#abb2bf',
          selection: '#9196a1',
          cursor: '#528bff'
        }
        break
      case 'One Light':
        colors = {
          background: 'hsl(230, 1%, 98%)',
          foreground: 'hsl(230, 8%, 24%)',
          selection: 'hsl(230, 1%, 90%)',
          cursor: 'hsl(230, 100%, 66%)'
        }
        break
      case 'Predawn':
        colors = {
          background: '#282828',
          foreground: '#f1f1f1',
          selection: 'rgba(255,255,255,0.25)',
          cursor: '#f18260'
        }
        break
      case 'Pro':
        colors = {
          background: '#000',
          foreground: 'rgb(244, 244, 244)',
          selection: 'rgba(82, 82, 82, .99)',
          cursor: 'rgb(96, 96, 96)'
        }
        break
      case 'Red Sands':
        colors = {
          background: 'rgb(143, 53, 39)',
          foreground: 'rgb(215, 201, 167)',
          selection: 'rgba(60, 25, 22, .99)',
          cursor: 'white'
        }
        break
      case 'Red':
        colors = {
          background: '#000',
          foreground: 'rgb(255, 38, 14)',
          selection: 'rgba(7, 30, 155, .99)',
          cursor: 'rgb(255, 38, 14)'
        }
        break
      case 'Silver Aerogel':
        colors = {
          background: 'rgb(146, 146, 146)',
          foreground: '#000',
          selection: 'rgba(120, 123, 156, .99)',
          cursor: 'rgb(224, 224, 224)'
        }
        break
      case 'Solarized Dark':
        colors = {
          background: '#042029',
          foreground: '#708284',
          selection: '#839496',
          cursor: '#819090'
        }
        break
      case 'Solarized Light':
        colors = {
          background: '#fdf6e3',
          foreground: '#657a81',
          selection: '#ece7d5',
          cursor: '#586e75'
        }
        break
      case 'Solid Colors':
        colors = {
          background: 'rgb(120, 132, 151)',
          foreground: '#000',
          selection: 'rgba(178, 215, 255, .99)',
          cursor: '#fff'
        }
        break
      case 'Standard': {
        const root = getComputedStyle(document.documentElement)
        colors = {
          background: root.getPropertyValue('--standard-app-background-color'),
          foreground: root.getPropertyValue('--standard-text-color'),
          cursor: root.getPropertyValue('--standard-text-color-highlight')
        }
        break
      }
      case 'Custom':
        colors = {
          foreground: profile.colorForeground || this.model.profile.colorForeground,
          background: profile.colorBackground || this.model.profile.colorBackground,
          cursor: profile.colorCursor || this.model.profile.colorCursor,
          cursorAccent: profile.colorCursorAccent || this.model.profile.colorCursorAccent,
          selection: profile.colorSelection || this.model.profile.colorSelection
        }
        break
    }

    colors.black = profile.colorBlack || this.model.profile.colorBlack
    colors.red = profile.colorRed || this.model.profile.colorRed
    colors.green = profile.colorGreen || this.model.profile.colorGreen
    colors.yellow = profile.colorYellow || this.model.profile.colorYellow
    colors.blue = profile.colorBlue || this.model.profile.colorBlue
    colors.magenta = profile.colorMagenta || this.model.profile.colorMagenta
    colors.cyan = profile.colorCyan || this.model.profile.colorCyan
    colors.white = profile.colorWhite || this.model.profile.colorWhite
    colors.brightBlack = profile.colorBrightBlack || this.model.profile.colorBrightBlack
    colors.brightRed = profile.colorBrightRed || this.model.profile.colorBrightRed
    colors.brightGreen = profile.colorBrightGreen || this.model.profile.colorBrightGreen
    colors.brightYellow = profile.colorBrightYellow || this.model.profile.colorBrightYellow
    colors.brightBlue = profile.colorBrightBlue || this.model.profile.colorBrightBlue
    colors.brightMagenta = profile.colorBrightMagenta || this.model.profile.colorBrightMagenta
    colors.brightCyan = profile.colorBrightCyan || this.model.profile.colorBrightCyan
    colors.brightWhite = profile.colorBrightWhite || this.model.profile.colorBrightWhite

    console.log(profile, colors);
    return colors

    // // strings can be any css color string
    // // (e.g. 'color-name', '#rgb', '#rrggbb', 'rgb(r, g, b)', 'hsl(h, s, l)')
    // // some values may have alpha channel
    // // (e.g.  '#rgba', '#rrggbbaa', 'rgba(r, g, b, a)', 'hsla(h, s, l, a)')
    // {
    //   /** The default foreground color */
    //   foreground: '',
    //   /** The default background color */
    //   background: '',
    //   /** The cursor color (can be transparent) */
    //   cursor: '',
    //   /** The accent color of the cursor (fg color for a block cursor) (can be transparent) */
    //   cursorAccent: '',
    //   /** The selection background color (can be transparent) */
    //   selection: '',
    //   /** ANSI black (eg. `\x1b[30m`) */
    //   black: '',
    //   /** ANSI red (eg. `\x1b[31m`) */
    //   red: '',
    //   /** ANSI green (eg. `\x1b[32m`) */
    //   green: '',
    //   /** ANSI yellow (eg. `\x1b[33m`) */
    //   yellow: '',
    //   /** ANSI blue (eg. `\x1b[34m`) */
    //   blue: '',
    //   /** ANSI magenta (eg. `\x1b[35m`) */
    //   magenta: '',
    //   /** ANSI cyan (eg. `\x1b[36m`) */
    //   cyan: '',
    //   /** ANSI white (eg. `\x1b[37m`) */
    //   white: '',
    //   /** ANSI bright black (eg. `\x1b[1;30m`) */
    //   brightBlack: '',
    //   /** ANSI bright red (eg. `\x1b[1;31m`) */
    //   brightRed: '',
    //   /** ANSI bright green (eg. `\x1b[1;32m`) */
    //   brightGreen: '',
    //   /** ANSI bright yellow (eg. `\x1b[1;33m`) */
    //   brightYellow: '',
    //   /** ANSI bright blue (eg. `\x1b[1;34m`) */
    //   brightBlue: '',
    //   /** ANSI bright magenta (eg. `\x1b[1;35m`) */
    //   brightMagenta: '',
    //   /** ANSI bright cyan (eg. `\x1b[1;36m`) */
    //   brightCyan: '',
    //   /** ANSI bright white (eg. `\x1b[1;37m`) */
    //   brightWhite: ''
    // }
  }

  getXtermOptions () {
    let xtermOptions = {
      cursorBlink: true
    }
    xtermOptions = Object.assign(xtermOptions, this.model.profile.xtermOptions)
    xtermOptions.fontSize = this.model.profile.fontSize
    xtermOptions.fontFamily = this.model.profile.fontFamily
    xtermOptions.theme = this.getTheme(this.model.profile)
    // NOTE: The cloning is needed because the Terminal class modifies the
    // options passed to it.
    return this.profilesSingleton.deepClone(xtermOptions)
  }

  setMainBackgroundColor () {
    const xtermOptions = this.getXtermOptions()
    if (xtermOptions.theme && xtermOptions.theme.background) {
      this.style.backgroundColor = xtermOptions.theme.background
    } else {
      this.style.backgroundColor = '#000'
    }
  }

  createTerminal () {
    // Attach terminal emulator to this element and refit.
    this.setMainBackgroundColor()
    this.terminal = new Terminal(this.getXtermOptions())
    this.fitAddon = new FitAddon()
    this.terminal.loadAddon(this.fitAddon)
    this.terminal.loadAddon(new WebLinksAddon())
    this.terminal.open(this.terminalDiv)
    this.terminal.loadAddon(new WebglAddon())
    this.ptyProcessCols = 80
    this.ptyProcessRows = 25
    this.refitTerminal()
    this.ptyProcess = null
    this.ptyProcessRunning = false
    this.terminal.onData((data) => {
      if (this.isPtyProcessRunning()) {
        this.ptyProcess.write(data)
      }
    })
    this.disposables.add(this.profilesSingleton.onDidResetBaseProfile((baseProfile) => {
      const profileChanges = this.profilesSingleton.diffProfiles(
        this.model.getProfile(),
        {
          // Only allow changes to settings related to the terminal front end
          // to be applied to existing terminals.
          fontSize: baseProfile.fontSize,
          fontFamily: baseProfile.fontFamily,
          theme: baseProfile.theme,
          colorForeground: baseProfile.colorForeground,
          colorBackground: baseProfile.colorBackground,
          colorCursor: baseProfile.colorCursor,
          colorCursorAccent: baseProfile.colorCursorAccent,
          colorSelection: baseProfile.colorSelection,
          colorBlack: baseProfile.colorBlack,
          colorRed: baseProfile.colorRed,
          colorGreen: baseProfile.colorGreen,
          colorYellow: baseProfile.colorYellow,
          colorBlue: baseProfile.colorBlue,
          colorMagenta: baseProfile.colorMagenta,
          colorCyan: baseProfile.colorCyan,
          colorWhite: baseProfile.colorWhite,
          colorBrightBlack: baseProfile.colorBrightBlack,
          colorBrightRed: baseProfile.colorBrightRed,
          colorBrightGreen: baseProfile.colorBrightGreen,
          colorBrightYellow: baseProfile.colorBrightYellow,
          colorBrightBlue: baseProfile.colorBrightBlue,
          colorBrightMagenta: baseProfile.colorBrightMagenta,
          colorBrightCyan: baseProfile.colorBrightCyan,
          colorBrightWhite: baseProfile.colorBrightWhite,
          xtermOptions: baseProfile.xtermOptions
        }
      )
      console.log("changes", profileChanges);
      this.model.applyProfileChanges(profileChanges)
    }))
    if (this.isPromptToStartup()) {
      return this.promptToStartup()
    }
    return this.restartPtyProcess()
  }

  showNotification (message, infoType, restartButtonText = 'Restart') {
    const messageDiv = document.createElement('div')
    const restartButton = document.createElement('button')
    restartButton.classList.add('btn')
    restartButton.appendChild(document.createTextNode(restartButtonText))
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

  promptToStartup () {
    return new Promise((resolve, reject) => {
      let message
      if (this.model.profile.title === null) {
        const command = [this.getShellCommand()]
        command.push(...this.getArgs())
        message = `New command ${JSON.stringify(command)} ready to start.`
      } else {
        message = `New command for profile ${this.model.profile.title} ready to start.`
      }
      this.showNotification(
        message,
        'info',
        'Start'
      )
      resolve()
    })
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
        const name = this.getTermType()
        const env = this.getEnv()
        const encoding = this.getEncoding()

        // Attach pty process to terminal.
        // NOTE: This must be done after the terminal is attached to the
        // parent element and refitted.
        this.ptyProcessOptions = {
          name: name,
          cwd: cwd,
          env: env
        }
        if (encoding) {
          // There's some issue if 'encoding=null' is passed in the options,
          // therefore, only set it if there's an actual encoding to set.
          this.ptyProcessOptions.encoding = encoding
        }

        this.ptyProcessOptions.cols = this.ptyProcessCols
        this.ptyProcessOptions.rows = this.ptyProcessRows
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
            const oldTitle = this.model.title
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

  applyPendingTerminalProfileOptions () {
    // For any changes involving the xterm.js Terminal object, only apply them
    // when the terminal is visible.
    if (this.terminalDivIntersectionRatio === 1.0) {
      const xtermOptions = this.pendingTerminalProfileOptions.xtermOptions || {}
      // NOTE: For legacy reasons, the font size is defined from the 'fontSize'
      // key outside of any defined xterm.js Terminal options.
      delete xtermOptions.fontSize
      if ('fontSize' in this.pendingTerminalProfileOptions) {
        xtermOptions.fontSize = this.pendingTerminalProfileOptions.fontSize
        delete this.pendingTerminalProfileOptions.fontSize
      }
      delete xtermOptions.fontFamily
      if ('fontFamily' in this.pendingTerminalProfileOptions) {
        xtermOptions.fontFamily = this.pendingTerminalProfileOptions.fontFamily
        delete this.pendingTerminalProfileOptions.fontFamily
      }
      delete xtermOptions.theme // TODO: is this right?
      if (
        'theme' in this.pendingTerminalProfileOptions ||
        'colorForeground' in this.pendingTerminalProfileOptions ||
        'colorBackground' in this.pendingTerminalProfileOptions ||
        'colorCursor' in this.pendingTerminalProfileOptions ||
        'colorCursorAccent' in this.pendingTerminalProfileOptions ||
        'colorSelection' in this.pendingTerminalProfileOptions ||
        'colorBlack' in this.pendingTerminalProfileOptions ||
        'colorRed' in this.pendingTerminalProfileOptions ||
        'colorGreen' in this.pendingTerminalProfileOptions ||
        'colorYellow' in this.pendingTerminalProfileOptions ||
        'colorBlue' in this.pendingTerminalProfileOptions ||
        'colorMagenta' in this.pendingTerminalProfileOptions ||
        'colorCyan' in this.pendingTerminalProfileOptions ||
        'colorWhite' in this.pendingTerminalProfileOptions ||
        'colorBrightBlack' in this.pendingTerminalProfileOptions ||
        'colorBrightRed' in this.pendingTerminalProfileOptions ||
        'colorBrightGreen' in this.pendingTerminalProfileOptions ||
        'colorBrightYellow' in this.pendingTerminalProfileOptions ||
        'colorBrightBlue' in this.pendingTerminalProfileOptions ||
        'colorBrightMagenta' in this.pendingTerminalProfileOptions ||
        'colorBrightCyan' in this.pendingTerminalProfileOptions ||
        'colorBrightWhite' in this.pendingTerminalProfileOptions
      ) {
        xtermOptions.theme = this.getTheme(this.pendingTerminalProfileOptions)
        delete this.pendingTerminalProfileOptions.theme
        delete this.pendingTerminalProfileOptions.colorForeground
        delete this.pendingTerminalProfileOptions.colorBackground
        delete this.pendingTerminalProfileOptions.colorCursor
        delete this.pendingTerminalProfileOptions.colorCursorAccent
        delete this.pendingTerminalProfileOptions.colorSelection
        delete this.pendingTerminalProfileOptions.colorBlack
        delete this.pendingTerminalProfileOptions.colorRed
        delete this.pendingTerminalProfileOptions.colorGreen
        delete this.pendingTerminalProfileOptions.colorYellow
        delete this.pendingTerminalProfileOptions.colorBlue
        delete this.pendingTerminalProfileOptions.colorMagenta
        delete this.pendingTerminalProfileOptions.colorCyan
        delete this.pendingTerminalProfileOptions.colorWhite
        delete this.pendingTerminalProfileOptions.colorBrightBlack
        delete this.pendingTerminalProfileOptions.colorBrightRed
        delete this.pendingTerminalProfileOptions.colorBrightGreen
        delete this.pendingTerminalProfileOptions.colorBrightYellow
        delete this.pendingTerminalProfileOptions.colorBrightBlue
        delete this.pendingTerminalProfileOptions.colorBrightMagenta
        delete this.pendingTerminalProfileOptions.colorBrightCyan
        delete this.pendingTerminalProfileOptions.colorBrightWhite
      }
      this.setMainBackgroundColor()
      for (const key of Object.keys(xtermOptions)) {
        this.terminal.setOption(key, xtermOptions[key])
      }
      delete this.pendingTerminalProfileOptions.xtermOptions

      // Restart the pty process if changes to the pty process settings are
      // being made.
      // NOTE: When applying new pty settings, the terminal still needs to be
      // visible.
      const a = new Set(Object.keys(this.pendingTerminalProfileOptions))
      const intersection = new Set([...a].filter(x => PTY_PROCESS_OPTIONS.has(x)))
      if (intersection.size !== 0) {
        this.restartPtyProcess()
        for (const key of intersection) {
          delete this.pendingTerminalProfileOptions[key]
        }
      }

      this.refitTerminal()
    }

    // atom-xterm specific options can be removed since at this point they
    // should already be applied in the terminal's profile.
    for (const key of ATOM_XTERM_OPTIONS) {
      delete this.pendingTerminalProfileOptions[key]
    }
  }

  refitTerminal () {
    // Only refit the terminal when it is completely visible.
    if (this.terminalDivIntersectionRatio === 1.0) {
      this.fitAddon.fit()
      const geometry = this.fitAddon.proposeDimensions()
      if (geometry && this.isPtyProcessRunning()) {
        // Resize pty process
        if (this.ptyProcessCols !== geometry.cols || this.ptyProcessRows !== geometry.rows) {
          this.ptyProcess.resize(geometry.cols, geometry.rows)
          this.ptyProcessCols = geometry.cols
          this.ptyProcessRows = geometry.rows
        }
      }
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

  queueNewProfileChanges (profileChanges) {
    this.pendingTerminalProfileOptions = Object.assign(this.pendingTerminalProfileOptions, profileChanges)
    this.applyPendingTerminalProfileOptions()
  }
}

const AtomXtermElement = document.registerElement('atom-xterm', {
  prototype: AtomXtermElementImpl.prototype
})

export {
  AtomXtermElement
}
