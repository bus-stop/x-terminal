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

import { Emitter } from 'atom'

import atomXtermConfig from './atom-xterm-config'

import fs from 'fs-extra'
import path from 'path'

import uuidv4 from 'uuid/v4'
import { URL } from 'whatwg-url'
import { detailedDiff } from 'deep-object-diff'

const ATOM_XTERM_BASE_URI = 'atom-xterm://'

const CONFIG_KEY_TO_PROFILE_KEY_MAPPING = {
  'atom-xterm.spawnPtySettings.command': 'command',
  'atom-xterm.spawnPtySettings.args': 'args',
  'atom-xterm.spawnPtySettings.name': 'name',
  'atom-xterm.spawnPtySettings.cwd': 'cwd',
  'atom-xterm.spawnPtySettings.env': 'env',
  'atom-xterm.spawnPtySettings.setEnv': 'setEnv',
  'atom-xterm.spawnPtySettings.deleteEnv': 'deleteEnv',
  'atom-xterm.spawnPtySettings.encoding': 'encoding',
  'atom-xterm.terminalSettings.fontSize': 'fontSize',
  'atom-xterm.terminalSettings.fontFamily': 'fontFamily',
  'atom-xterm.terminalSettings.colors.theme': 'theme',
  'atom-xterm.terminalSettings.colors.foreground': 'colorForeground',
  'atom-xterm.terminalSettings.colors.background': 'colorBackground',
  'atom-xterm.terminalSettings.colors.cursor': 'colorCursor',
  'atom-xterm.terminalSettings.colors.cursorAccent': 'colorCursorAccent',
  'atom-xterm.terminalSettings.colors.selection': 'colorSelection',
  'atom-xterm.terminalSettings.colors.black': 'colorBlack',
  'atom-xterm.terminalSettings.colors.red': 'colorRed',
  'atom-xterm.terminalSettings.colors.green': 'colorGreen',
  'atom-xterm.terminalSettings.colors.yellow': 'colorYellow',
  'atom-xterm.terminalSettings.colors.blue': 'colorBlue',
  'atom-xterm.terminalSettings.colors.magenta': 'colorMagenta',
  'atom-xterm.terminalSettings.colors.cyan': 'colorCyan',
  'atom-xterm.terminalSettings.colors.white': 'colorWhite',
  'atom-xterm.terminalSettings.colors.brightBlack': 'colorBrightBlack',
  'atom-xterm.terminalSettings.colors.brightRed': 'colorBrightRed',
  'atom-xterm.terminalSettings.colors.brightGreen': 'colorBrightGreen',
  'atom-xterm.terminalSettings.colors.brightYellow': 'colorBrightYellow',
  'atom-xterm.terminalSettings.colors.brightBlue': 'colorBrightBlue',
  'atom-xterm.terminalSettings.colors.brightMagenta': 'colorBrightMagenta',
  'atom-xterm.terminalSettings.colors.brightCyan': 'colorBrightCyan',
  'atom-xterm.terminalSettings.colors.brightWhite': 'colorBrightWhite',
  'atom-xterm.terminalSettings.leaveOpenAfterExit': 'leaveOpenAfterExit',
  'atom-xterm.terminalSettings.allowRelaunchingTerminalsOnStartup': 'allowRelaunchingTerminalsOnStartup',
  'atom-xterm.terminalSettings.relaunchTerminalOnStartup': 'relaunchTerminalOnStartup',
  'atom-xterm.terminalSettings.title': 'title',
  'atom-xterm.terminalSettings.xtermOptions': 'xtermOptions',
  'atom-xterm.terminalSettings.promptToStartup': 'promptToStartup'
}

const AtomXtermProfilesSingletonSymbol = Symbol('AtomXtermProfilesSingleton sentinel')

class AtomXtermProfilesSingleton {
  constructor (symbolCheck) {
    if (AtomXtermProfilesSingletonSymbol !== symbolCheck) {
      throw new Error('AtomXtermProfilesSingleton cannot be instantiated directly.')
    }
    this.emitter = new Emitter()
    this.profilesConfigPath = path.join(atomXtermConfig.getUserDataPath(), 'profiles.json')
    this.profiles = {}
    this.previousBaseProfile = null
    this.baseProfile = this.getDefaultProfile()
    this.resetBaseProfile()
    this.profilesLoadPromise = null
    this.reloadProfiles()
  }

  static get instance () {
    if (!this[AtomXtermProfilesSingletonSymbol]) {
      this[AtomXtermProfilesSingletonSymbol] = new AtomXtermProfilesSingleton(AtomXtermProfilesSingletonSymbol)
    }
    return this[AtomXtermProfilesSingletonSymbol]
  }

  sortProfiles (profiles) {
    const orderedProfiles = {}
    Object.keys(profiles).sort().forEach((key) => {
      orderedProfiles[key] = profiles[key]
    })
    return orderedProfiles
  }

  reloadProfiles () {
    this.profilesLoadPromise = new Promise((resolve, reject) => {
      fs.readJson(this.profilesConfigPath, (err, data) => {
        if (err) {
          // Create the profiles file.
          this.updateProfiles({}).then(() => {
            this.emitter.emit('did-reload-profiles', this.getSanitizedProfilesData())
            resolve()
          })
        } else {
          this.profiles = this.sortProfiles(data)
          this.emitter.emit('did-reload-profiles', this.getSanitizedProfilesData())
          resolve()
        }
      })
    })
  }

  onDidReloadProfiles (callback) {
    return this.emitter.on('did-reload-profiles', callback)
  }

  onDidResetBaseProfile (callback) {
    return this.emitter.on('did-reset-base-profile', callback)
  }

  updateProfiles (newProfilesConfigData) {
    return new Promise((resolve, reject) => {
      fs.ensureDir(path.dirname(this.profilesConfigPath), (err) => {
        if (err) reject(err)
        newProfilesConfigData = this.sortProfiles(newProfilesConfigData)
        fs.writeJson(this.profilesConfigPath, newProfilesConfigData, (err) => {
          if (err) reject(err)
          this.profiles = newProfilesConfigData
          resolve()
        })
      })
    })
  }

  deepClone (data) {
    return JSON.parse(JSON.stringify(data))
  }

  diffProfiles (oldProfile, newProfile) {
    // This method will return added or modified entries.
    const diff = detailedDiff(oldProfile, newProfile)
    return Object.assign(diff.added, diff.updated)
  }

  getDefaultProfile () {
    return {
      command: atomXtermConfig.getDefaultShellCommand(),
      args: JSON.parse(atomXtermConfig.getDefaultArgs()),
      name: atomXtermConfig.getDefaultTermType(),
      cwd: atomXtermConfig.getDefaultCwd(),
      env: null,
      setEnv: JSON.parse(atomXtermConfig.getDefaultSetEnv()),
      deleteEnv: JSON.parse(atomXtermConfig.getDefaultDeleteEnv()),
      encoding: null,
      fontSize: atomXtermConfig.getDefaultFontSize(),
      fontFamily: atomXtermConfig.getDefaultFontFamily(),
      theme: atomXtermConfig.getDefaultTheme(),
      colorForeground: atomXtermConfig.getDefaultColorForeground(),
      colorBackground: atomXtermConfig.getDefaultColorBackground(),
      colorCursor: atomXtermConfig.getDefaultColorCursor(),
      colorCursorAccent: atomXtermConfig.getDefaultColorCursorAccent(),
      colorSelection: atomXtermConfig.getDefaultColorSelection(),
      colorBlack: atomXtermConfig.getDefaultColorBlack(),
      colorRed: atomXtermConfig.getDefaultColorRed(),
      colorGreen: atomXtermConfig.getDefaultColorGreen(),
      colorYellow: atomXtermConfig.getDefaultColorYellow(),
      colorBlue: atomXtermConfig.getDefaultColorBlue(),
      colorMagenta: atomXtermConfig.getDefaultColorMagenta(),
      colorCyan: atomXtermConfig.getDefaultColorCyan(),
      colorWhite: atomXtermConfig.getDefaultColorWhite(),
      colorBrightBlack: atomXtermConfig.getDefaultColorBrightBlack(),
      colorBrightRed: atomXtermConfig.getDefaultColorBrightRed(),
      colorBrightGreen: atomXtermConfig.getDefaultColorBrightGreen(),
      colorBrightYellow: atomXtermConfig.getDefaultColorBrightYellow(),
      colorBrightBlue: atomXtermConfig.getDefaultColorBrightBlue(),
      colorBrightMagenta: atomXtermConfig.getDefaultColorBrightMagenta(),
      colorBrightCyan: atomXtermConfig.getDefaultColorBrightCyan(),
      colorBrightWhite: atomXtermConfig.getDefaultColorBrightWhite(),
      leaveOpenAfterExit: atomXtermConfig.getDefaultLeaveOpenAfterExit(),
      relaunchTerminalOnStartup: atomXtermConfig.getDefaultRelaunchTerminalOnStartup(),
      title: null,
      xtermOptions: JSON.parse(atomXtermConfig.getDefaultXtermOptions()),
      promptToStartup: atomXtermConfig.getDefaultPromptToStartup()
    }
  }

  getBaseProfile () {
    return this.deepClone(this.baseProfile)
  }

  validateJsonConfigSetting (name, defaultJsonValue) {
    const profileKey = CONFIG_KEY_TO_PROFILE_KEY_MAPPING[name]
    const previousValue = this.previousBaseProfile[profileKey]
    let value = atom.config.get(name)
    try {
      value = JSON.parse(value || defaultJsonValue) || previousValue
    } catch (e) {
      // This normally happens when the user is in the middle of updating some
      // setting that is a JSON string. Ignore syntax errors and use the last
      // known good config setting.
      if (!(e instanceof SyntaxError)) {
        throw e
      }
      value = previousValue
    }
    return value
  }

  resetBaseProfile () {
    this.previousBaseProfile = this.deepClone(this.baseProfile)
    let env = this.validateJsonConfigSetting('atom-xterm.spawnPtySettings.env', 'null')
    if (!env || env.constructor !== Object) {
      env = null
    }
    const encoding = atom.config.get('atom-xterm.spawnPtySettings.encoding') || null
    let leaveOpenAfterExit = atom.config.get('atom-xterm.terminalSettings.leaveOpenAfterExit')
    if (leaveOpenAfterExit !== true && leaveOpenAfterExit !== false) leaveOpenAfterExit = atomXtermConfig.getDefaultLeaveOpenAfterExit()
    let relaunchTerminalOnStartup = atom.config.get('atom-xterm.terminalSettings.relaunchTerminalOnStartup')
    if (relaunchTerminalOnStartup !== true && relaunchTerminalOnStartup !== false) relaunchTerminalOnStartup = atomXtermConfig.getDefaultRelaunchTerminalOnStartup()
    const title = atom.config.get('atom-xterm.terminalSettings.title') || atomXtermConfig.getDefaultTitle()
    let promptToStartup = atom.config.get('atom-xterm.terminalSettings.promptToStartup')
    if (promptToStartup !== true && promptToStartup !== false) promptToStartup = atomXtermConfig.getDefaultPromptToStartup()
    this.baseProfile = {
      command: atom.config.get('atom-xterm.spawnPtySettings.command') || atomXtermConfig.getDefaultShellCommand(),
      args: this.validateJsonConfigSetting('atom-xterm.spawnPtySettings.args', atomXtermConfig.getDefaultArgs()),
      name: atom.config.get('atom-xterm.spawnPtySettings.name') || atomXtermConfig.getDefaultTermType(),
      cwd: atom.config.get('atom-xterm.spawnPtySettings.cwd') || atomXtermConfig.getDefaultCwd(),
      env: env,
      setEnv: this.validateJsonConfigSetting('atom-xterm.spawnPtySettings.setEnv', atomXtermConfig.getDefaultSetEnv()),
      deleteEnv: this.validateJsonConfigSetting('atom-xterm.spawnPtySettings.deleteEnv', atomXtermConfig.getDefaultDeleteEnv()),
      encoding: encoding,
      fontSize: atom.config.get('atom-xterm.terminalSettings.fontSize') || atomXtermConfig.getDefaultFontSize(),
      fontFamily: atom.config.get('atom-xterm.terminalSettings.fontFamily') || atomXtermConfig.getDefaultFontFamily(),
      theme: atom.config.get('atom-xterm.terminalSettings.colors.theme') || atomXtermConfig.getDefaultTheme(),
      colorForeground: atom.config.get('atom-xterm.terminalSettings.colors.foreground') || atomXtermConfig.getDefaultColorForeground(),
      colorBackground: atom.config.get('atom-xterm.terminalSettings.colors.background') || atomXtermConfig.getDefaultColorBackground(),
      colorCursor: atom.config.get('atom-xterm.terminalSettings.colors.cursor') || atomXtermConfig.getDefaultColorCursor(),
      colorCursorAccent: atom.config.get('atom-xterm.terminalSettings.colors.cursorAccent') || atomXtermConfig.getDefaultColorCursorAccent(),
      colorSelection: atom.config.get('atom-xterm.terminalSettings.colors.selection') || atomXtermConfig.getDefaultColorSelection(),
      colorBlack: atom.config.get('atom-xterm.terminalSettings.colors.black') || atomXtermConfig.getDefaultColorBlack(),
      colorRed: atom.config.get('atom-xterm.terminalSettings.colors.red') || atomXtermConfig.getDefaultColorRed(),
      colorGreen: atom.config.get('atom-xterm.terminalSettings.colors.green') || atomXtermConfig.getDefaultColorGreen(),
      colorYellow: atom.config.get('atom-xterm.terminalSettings.colors.yellow') || atomXtermConfig.getDefaultColorYellow(),
      colorBlue: atom.config.get('atom-xterm.terminalSettings.colors.blue') || atomXtermConfig.getDefaultColorBlue(),
      colorMagenta: atom.config.get('atom-xterm.terminalSettings.colors.magenta') || atomXtermConfig.getDefaultColorMagenta(),
      colorCyan: atom.config.get('atom-xterm.terminalSettings.colors.cyan') || atomXtermConfig.getDefaultColorCyan(),
      colorWhite: atom.config.get('atom-xterm.terminalSettings.colors.white') || atomXtermConfig.getDefaultColorWhite(),
      colorBrightBlack: atom.config.get('atom-xterm.terminalSettings.colors.brightBlack') || atomXtermConfig.getDefaultColorBrightBlack(),
      colorBrightRed: atom.config.get('atom-xterm.terminalSettings.colors.brightRed') || atomXtermConfig.getDefaultColorBrightRed(),
      colorBrightGreen: atom.config.get('atom-xterm.terminalSettings.colors.brightGreen') || atomXtermConfig.getDefaultColorBrightGreen(),
      colorBrightYellow: atom.config.get('atom-xterm.terminalSettings.colors.brightYellow') || atomXtermConfig.getDefaultColorBrightYellow(),
      colorBrightBlue: atom.config.get('atom-xterm.terminalSettings.colors.brightBlue') || atomXtermConfig.getDefaultColorBrightBlue(),
      colorBrightMagenta: atom.config.get('atom-xterm.terminalSettings.colors.brightMagenta') || atomXtermConfig.getDefaultColorBrightMagenta(),
      colorBrightCyan: atom.config.get('atom-xterm.terminalSettings.colors.brightCyan') || atomXtermConfig.getDefaultColorBrightCyan(),
      colorBrightWhite: atom.config.get('atom-xterm.terminalSettings.colors.brightWhite') || atomXtermConfig.getDefaultColorBrightWhite(),
      leaveOpenAfterExit: leaveOpenAfterExit,
      relaunchTerminalOnStartup: relaunchTerminalOnStartup,
      title: title || null,
      xtermOptions: this.validateJsonConfigSetting('atom-xterm.terminalSettings.xtermOptions', atomXtermConfig.getDefaultXtermOptions()),
      promptToStartup: promptToStartup
    }
    this.emitter.emit('did-reset-base-profile', this.getBaseProfile())
  }

  sanitizeData (data) {
    const sanitizedData = {}
    if ('command' in data) sanitizedData.command = data.command
    if ('args' in data) sanitizedData.args = data.args
    if ('name' in data) sanitizedData.name = data.name
    if ('cwd' in data) sanitizedData.cwd = data.cwd
    if ('env' in data) sanitizedData.env = data.env
    if ('setEnv' in data) sanitizedData.setEnv = data.setEnv
    if ('deleteEnv' in data) sanitizedData.deleteEnv = data.deleteEnv
    if ('encoding' in data) sanitizedData.encoding = data.encoding
    if ('fontSize' in data) sanitizedData.fontSize = data.fontSize
    if ('fontFamily' in data) sanitizedData.fontFamily = data.fontFamily
    if ('theme' in data) sanitizedData.theme = data.theme
    if ('colorForeground' in data) sanitizedData.colorForeground = data.colorForeground
    if ('colorBackground' in data) sanitizedData.colorBackground = data.colorBackground
    if ('colorCursor' in data) sanitizedData.colorCursor = data.colorCursor
    if ('colorCursorAccent' in data) sanitizedData.colorCursorAccent = data.colorCursorAccent
    if ('colorSelection' in data) sanitizedData.colorSelection = data.colorSelection
    if ('colorBlack' in data) sanitizedData.colorBlack = data.colorBlack
    if ('colorRed' in data) sanitizedData.colorRed = data.colorRed
    if ('colorGreen' in data) sanitizedData.colorGreen = data.colorGreen
    if ('colorYellow' in data) sanitizedData.colorYellow = data.colorYellow
    if ('colorBlue' in data) sanitizedData.colorBlue = data.colorBlue
    if ('colorMagenta' in data) sanitizedData.colorMagenta = data.colorMagenta
    if ('colorCyan' in data) sanitizedData.colorCyan = data.colorCyan
    if ('colorWhite' in data) sanitizedData.colorWhite = data.colorWhite
    if ('colorBrightBlack' in data) sanitizedData.colorBrightBlack = data.colorBrightBlack
    if ('colorBrightRed' in data) sanitizedData.colorBrightRed = data.colorBrightRed
    if ('colorBrightGreen' in data) sanitizedData.colorBrightGreen = data.colorBrightGreen
    if ('colorBrightYellow' in data) sanitizedData.colorBrightYellow = data.colorBrightYellow
    if ('colorBrightBlue' in data) sanitizedData.colorBrightBlue = data.colorBrightBlue
    if ('colorBrightMagenta' in data) sanitizedData.colorBrightMagenta = data.colorBrightMagenta
    if ('colorBrightCyan' in data) sanitizedData.colorBrightCyan = data.colorBrightCyan
    if ('colorBrightWhite' in data) sanitizedData.colorBrightWhite = data.colorBrightWhite
    if ('leaveOpenAfterExit' in data) sanitizedData.leaveOpenAfterExit = data.leaveOpenAfterExit
    if ('relaunchTerminalOnStartup' in data) sanitizedData.relaunchTerminalOnStartup = data.relaunchTerminalOnStartup
    if ('title' in data) sanitizedData.title = data.title
    if ('xtermOptions' in data) sanitizedData.xtermOptions = data.xtermOptions
    if ('promptToStartup' in data) sanitizedData.promptToStartup = data.promptToStartup
    return this.deepClone(sanitizedData)
  }

  getSanitizedProfilesData () {
    const retval = {}
    for (const key in this.profiles) {
      retval[key] = this.sanitizeData(this.profiles[key])
    }
    return retval
  }

  getProfiles () {
    return new Promise((resolve, reject) => {
      this.profilesLoadPromise.then(() => {
        resolve(this.getSanitizedProfilesData())
      })
    })
  }

  getProfile (profileName) {
    return new Promise((resolve, reject) => {
      this.profilesLoadPromise.then(() => {
        resolve(Object.assign(
          {},
          this.deepClone(this.baseProfile),
          this.sanitizeData(this.profiles[profileName] || {})
        ))
      })
    })
  }

  isProfileExists (profileName) {
    return new Promise((resolve, reject) => {
      this.profilesLoadPromise.then(() => {
        resolve(profileName in this.profiles)
      })
    })
  }

  setProfile (profileName, data) {
    return new Promise((resolve, reject) => {
      this.profilesLoadPromise.then(() => {
        const profileData = Object.assign(
          {},
          this.deepClone(this.baseProfile),
          this.sanitizeData(data)
        )
        const newProfilesConfigData = Object.assign(
          {},
          this.deepClone(this.profiles)
        )
        newProfilesConfigData[profileName] = profileData
        this.updateProfiles(newProfilesConfigData).then(() => {
          resolve()
        })
      })
    })
  }

  deleteProfile (profileName) {
    return new Promise((resolve, reject) => {
      this.profilesLoadPromise.then(() => {
        const newProfilesConfigData = Object.assign(
          {},
          this.deepClone(this.profiles)
        )
        delete newProfilesConfigData[profileName]
        this.updateProfiles(newProfilesConfigData).then(() => {
          resolve()
        })
      })
    })
  }

  generateNewUri () {
    return ATOM_XTERM_BASE_URI + uuidv4() + '/'
  }

  generateNewUrlFromProfileData (data) {
    data = this.sanitizeData(data)
    const url = new URL(this.generateNewUri())
    // Command to run, can be basename of command or full path to command.
    if ('command' in data) url.searchParams.set('command', data.command)
    // Arguments to pass to command. This should be in a JSON array.
    if ('args' in data) url.searchParams.set('args', JSON.stringify(data.args))
    // This defines the term type to use ('xterm', 'xterm-color', etc.). This
    // option does nothing on Windows.
    if ('name' in data) url.searchParams.set('name', data.name)
    // Current working directory to start command in.
    if ('cwd' in data) url.searchParams.set('cwd', data.cwd)
    // Environment to use for command. This can be null or left out in which
    // case the current environment is used.
    if ('env' in data) url.searchParams.set('env', JSON.stringify(data.env))
    // Environment variables to set or override from the defined environment
    // above or the current environment when starting command.
    if ('setEnv' in data) url.searchParams.set('setEnv', JSON.stringify(data.setEnv))
    // Environment variables to delete when starting command.
    if ('deleteEnv' in data) url.searchParams.set('deleteEnv', JSON.stringify(data.deleteEnv))
    // Encoding to use when running command.
    if ('encoding' in data) url.searchParams.set('encoding', data.encoding)
    // Font size to use.
    if ('fontSize' in data) url.searchParams.set('fontSize', JSON.stringify(data.fontSize))
    // Font family to use.
    if ('fontFamily' in data) url.searchParams.set('fontFamily', data.fontFamily)
    // Theme to use.
    if ('theme' in data) url.searchParams.set('theme', data.theme)
    // Colors
    if ('colorForeground' in data) url.searchParams.set('colorForeground', data.colorForeground)
    if ('colorBackground' in data) url.searchParams.set('colorBackground', data.colorBackground)
    if ('colorCursor' in data) url.searchParams.set('colorCursor', data.colorCursor)
    if ('colorCursorAccent' in data) url.searchParams.set('colorCursorAccent', data.colorCursorAccent)
    if ('colorSelection' in data) url.searchParams.set('colorSelection', data.colorSelection)
    if ('colorBlack' in data) url.searchParams.set('colorBlack', data.colorBlack)
    if ('colorRed' in data) url.searchParams.set('colorRed', data.colorRed)
    if ('colorGreen' in data) url.searchParams.set('colorGreen', data.colorGreen)
    if ('colorYellow' in data) url.searchParams.set('colorYellow', data.colorYellow)
    if ('colorBlue' in data) url.searchParams.set('colorBlue', data.colorBlue)
    if ('colorMagenta' in data) url.searchParams.set('colorMagenta', data.colorMagenta)
    if ('colorCyan' in data) url.searchParams.set('colorCyan', data.colorCyan)
    if ('colorWhite' in data) url.searchParams.set('colorWhite', data.colorWhite)
    if ('colorBrightBlack' in data) url.searchParams.set('colorBrightBlack', data.colorBrightBlack)
    if ('colorBrightRed' in data) url.searchParams.set('colorBrightRed', data.colorBrightRed)
    if ('colorBrightGreen' in data) url.searchParams.set('colorBrightGreen', data.colorBrightGreen)
    if ('colorBrightYellow' in data) url.searchParams.set('colorBrightYellow', data.colorBrightYellow)
    if ('colorBrightBlue' in data) url.searchParams.set('colorBrightBlue', data.colorBrightBlue)
    if ('colorBrightMagenta' in data) url.searchParams.set('colorBrightMagenta', data.colorBrightMagenta)
    if ('colorBrightCyan' in data) url.searchParams.set('colorBrightCyan', data.colorBrightCyan)
    if ('colorBrightWhite' in data) url.searchParams.set('colorBrightWhite', data.colorBrightWhite)
    // This determines whether to leave the terminal tab open when the command
    // has finished running.
    if ('leaveOpenAfterExit' in data) url.searchParams.set('leaveOpenAfterExit', JSON.stringify(data.leaveOpenAfterExit))
    // This determines whether the terminal tab should be restarted when Atom
    // is restarted.
    if ('relaunchTerminalOnStartup' in data) url.searchParams.set('relaunchTerminalOnStartup', JSON.stringify(data.relaunchTerminalOnStartup))
    // This is used to set a custom title for the new terminal tab.
    if ('title' in data) url.searchParams.set('title', data.title)
    // The options supported by the Terminal object in xterm.js. See also
    // https://github.com/xtermjs/xterm.js/blob/5f0217cdb0baf353b3deedfab25e6e9b49c3d45f/typings/xterm.d.ts#L31 .
    // NOTE: The 'fontSize', 'fontFamily', and 'theme' settings defined in the options here are ignored.
    if ('xtermOptions' in data) url.searchParams.set('xtermOptions', JSON.stringify(data.xtermOptions))
    // This determines whether to prompt the user to startup the terminal
    // process.
    if ('promptToStartup' in data) url.searchParams.set('promptToStartup', JSON.stringify(data.promptToStartup))
    return url
  }

  createProfileDataFromUri (uri) {
    let param
    const url = new URL(uri)
    const baseProfile = this.getBaseProfile()
    const newProfile = {}
    param = url.searchParams.get('command')
    if (param) newProfile.command = param
    if (!('command' in newProfile)) newProfile.command = baseProfile.command
    param = url.searchParams.get('args')
    if (param) newProfile.args = JSON.parse(param)
    if (!('args' in newProfile && newProfile.args)) newProfile.args = baseProfile.args
    param = url.searchParams.get('name')
    if (param) newProfile.name = param
    if (!('name' in newProfile)) newProfile.name = baseProfile.name
    param = url.searchParams.get('cwd')
    if (param) newProfile.cwd = param
    if (!('cwd' in newProfile)) newProfile.cwd = baseProfile.cwd
    param = url.searchParams.get('env')
    if (param) newProfile.env = JSON.parse(param)
    if (!('env' in newProfile && newProfile.env)) newProfile.env = baseProfile.env
    param = url.searchParams.get('setEnv')
    if (param) newProfile.setEnv = JSON.parse(param)
    if (!('setEnv' in newProfile && newProfile.setEnv)) newProfile.setEnv = baseProfile.setEnv
    param = url.searchParams.get('deleteEnv')
    if (param) newProfile.deleteEnv = JSON.parse(param)
    if (!('deleteEnv' in newProfile && newProfile.deleteEnv)) newProfile.deleteEnv = baseProfile.deleteEnv
    param = url.searchParams.get('encoding')
    if (param && param !== 'null') newProfile.encoding = param
    if (!('encoding' in newProfile)) newProfile.encoding = baseProfile.encoding
    param = url.searchParams.get('fontSize')
    if (param) newProfile.fontSize = JSON.parse(param)
    if (!('fontSize' in newProfile && newProfile.fontSize)) newProfile.fontSize = baseProfile.fontSize
    param = url.searchParams.get('fontFamily')
    if (param) newProfile.fontFamily = param
    if (!('fontFamily' in newProfile)) newProfile.fontFamily = baseProfile.fontFamily
    param = url.searchParams.get('theme')
    if (param) newProfile.theme = param
    if (!('theme' in newProfile)) newProfile.theme = baseProfile.theme
    param = url.searchParams.get('colorForeground')
    if (param) newProfile.colorForeground = param
    if (!('colorForeground' in newProfile)) newProfile.colorForeground = baseProfile.colorForeground
    param = url.searchParams.get('colorBackground')
    if (param) newProfile.colorBackground = param
    if (!('colorBackground' in newProfile)) newProfile.colorBackground = baseProfile.colorBackground
    param = url.searchParams.get('colorCursor')
    if (param) newProfile.colorCursor = param
    if (!('colorCursor' in newProfile)) newProfile.colorCursor = baseProfile.colorCursor
    param = url.searchParams.get('colorCursorAccent')
    if (param) newProfile.colorCursorAccent = param
    if (!('colorCursorAccent' in newProfile)) newProfile.colorCursorAccent = baseProfile.colorCursorAccent
    param = url.searchParams.get('colorSelection')
    if (param) newProfile.colorSelection = param
    if (!('colorSelection' in newProfile)) newProfile.colorSelection = baseProfile.colorSelection
    param = url.searchParams.get('colorBlack')
    if (param) newProfile.colorBlack = param
    if (!('colorBlack' in newProfile)) newProfile.colorBlack = baseProfile.colorBlack
    param = url.searchParams.get('colorRed')
    if (param) newProfile.colorRed = param
    if (!('colorRed' in newProfile)) newProfile.colorRed = baseProfile.colorRed
    param = url.searchParams.get('colorGreen')
    if (param) newProfile.colorGreen = param
    if (!('colorGreen' in newProfile)) newProfile.colorGreen = baseProfile.colorGreen
    param = url.searchParams.get('colorYellow')
    if (param) newProfile.colorYellow = param
    if (!('colorYellow' in newProfile)) newProfile.colorYellow = baseProfile.colorYellow
    param = url.searchParams.get('colorBlue')
    if (param) newProfile.colorBlue = param
    if (!('colorBlue' in newProfile)) newProfile.colorBlue = baseProfile.colorBlue
    param = url.searchParams.get('colorMagenta')
    if (param) newProfile.colorMagenta = param
    if (!('colorMagenta' in newProfile)) newProfile.colorMagenta = baseProfile.colorMagenta
    param = url.searchParams.get('colorCyan')
    if (param) newProfile.colorCyan = param
    if (!('colorCyan' in newProfile)) newProfile.colorCyan = baseProfile.colorCyan
    param = url.searchParams.get('colorWhite')
    if (param) newProfile.colorWhite = param
    if (!('colorWhite' in newProfile)) newProfile.colorWhite = baseProfile.colorWhite
    param = url.searchParams.get('colorBrightBlack')
    if (param) newProfile.colorBrightBlack = param
    if (!('colorBrightBlack' in newProfile)) newProfile.colorBrightBlack = baseProfile.colorBrightBlack
    param = url.searchParams.get('colorBrightRed')
    if (param) newProfile.colorBrightRed = param
    if (!('colorBrightRed' in newProfile)) newProfile.colorBrightRed = baseProfile.colorBrightRed
    param = url.searchParams.get('colorBrightGreen')
    if (param) newProfile.colorBrightGreen = param
    if (!('colorBrightGreen' in newProfile)) newProfile.colorBrightGreen = baseProfile.colorBrightGreen
    param = url.searchParams.get('colorBrightYellow')
    if (param) newProfile.colorBrightYellow = param
    if (!('colorBrightYellow' in newProfile)) newProfile.colorBrightYellow = baseProfile.colorBrightYellow
    param = url.searchParams.get('colorBrightBlue')
    if (param) newProfile.colorBrightBlue = param
    if (!('colorBrightBlue' in newProfile)) newProfile.colorBrightBlue = baseProfile.colorBrightBlue
    param = url.searchParams.get('colorBrightMagenta')
    if (param) newProfile.colorBrightMagenta = param
    if (!('colorBrightMagenta' in newProfile)) newProfile.colorBrightMagenta = baseProfile.colorBrightMagenta
    param = url.searchParams.get('colorBrightCyan')
    if (param) newProfile.colorBrightCyan = param
    if (!('colorBrightCyan' in newProfile)) newProfile.colorBrightCyan = baseProfile.colorBrightCyan
    param = url.searchParams.get('colorBrightWhite')
    if (param) newProfile.colorBrightWhite = param
    if (!('colorBrightWhite' in newProfile)) newProfile.colorBrightWhite = baseProfile.colorBrightWhite
    param = url.searchParams.get('leaveOpenAfterExit')
    if (param) newProfile.leaveOpenAfterExit = JSON.parse(param)
    if (!('leaveOpenAfterExit' in newProfile && newProfile.leaveOpenAfterExit !== null && newProfile.leaveOpenAfterExit !== '')) newProfile.leaveOpenAfterExit = baseProfile.leaveOpenAfterExit
    param = url.searchParams.get('relaunchTerminalOnStartup')
    if (param) newProfile.relaunchTerminalOnStartup = JSON.parse(param)
    if (!('relaunchTerminalOnStartup' in newProfile && newProfile.relaunchTerminalOnStartup !== null && newProfile.relaunchTerminalOnStartup !== '')) newProfile.relaunchTerminalOnStartup = baseProfile.relaunchTerminalOnStartup
    param = url.searchParams.get('title')
    if (param && param !== 'null') newProfile.title = param
    if (!('title' in newProfile)) newProfile.title = baseProfile.title
    param = url.searchParams.get('xtermOptions')
    if (param) newProfile.xtermOptions = JSON.parse(param)
    if (!('xtermOptions' in newProfile && newProfile.xtermOptions)) newProfile.xtermOptions = baseProfile.xtermOptions
    param = url.searchParams.get('promptToStartup')
    if (param) newProfile.promptToStartup = JSON.parse(param)
    if (!('promptToStartup' in newProfile && newProfile.promptToStartup !== null && newProfile.promptToStartup !== '')) newProfile.promptToStartup = baseProfile.promptToStartup
    return newProfile
  }
}

export {
  ATOM_XTERM_BASE_URI,
  AtomXtermProfilesSingleton
}
