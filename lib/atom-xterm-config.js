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

import os from 'os'
import path from 'path'

export default {

  getDefaultShellCommand () {
    if (process.platform === 'win32') {
      return process.env.COMSPEC || 'cmd.exe'
    }
    return process.env.SHELL || '/bin/sh'
  },

  getDefaultArgs () {
    return '[]'
  },

  getDefaultTermType () {
    return process.env.TERM || 'xterm-256color'
  },

  getDefaultCwd () {
    if (process.platform === 'win32') {
      return process.env.USERPROFILE
    }
    return process.env.HOME
  },

  getDefaultEnv () {
    return ''
  },

  getDefaultSetEnv () {
    return '{}'
  },

  getDefaultDeleteEnv () {
    return '[]'
  },

  getDefaultEncoding () {
    return ''
  },

  getDefaultFontSize () {
    return 14
  },

  getMinimumFontSize () {
    // NOTE: Atom will crash if the font is set below 8.
    return 8
  },

  getMaximumFontSize () {
    return 100
  },

  getDefaultLeaveOpenAfterExit () {
    return true
  },

  getDefaultAllowRelaunchingTerminalsOnStartup () {
    return true
  },

  getDefaultRelaunchTerminalOnStartup () {
    return true
  },

  getUserDataPath () {
    let appDataPath
    if (process.platform === 'win32') {
      appDataPath = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
    } else if (process.platform === 'darwin') {
      appDataPath = path.join(os.homedir(), 'Library', 'Application Support')
    } else {
      appDataPath = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config')
    }
    return path.join(appDataPath, 'atom-xterm')
  },

  getDefaultTitle () {
    return ''
  },

  getDefaultXtermOptions () {
    return '{}'
  },

  getDefaultPromptToStartup () {
    return false
  }
}
