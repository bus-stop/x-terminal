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

import { CompositeDisposable, TextEditor } from 'atom'

import { AtomXtermProfilesSingleton } from './atom-xterm-profiles'
import { AtomXtermDeleteProfileModel } from './atom-xterm-delete-profile-model'
import { AtomXtermSaveProfileModel } from './atom-xterm-save-profile-model'
import { createHorizontalLine } from './atom-xterm-utils'

class AtomXtermProfileMenuElementImpl extends HTMLElement {
  initialize (model) {
    this.model = model
    this.model.setElement(this)
    this.profilesSingleton = AtomXtermProfilesSingleton.instance
    let topDiv = document.createElement('div')
    topDiv.classList.add('atom-xterm-profile-menu-element-top-div')
    this.appendChild(topDiv)
    let leftDiv = document.createElement('div')
    leftDiv.classList.add('atom-xterm-profile-menu-element-left-div')
    this.appendChild(leftDiv)
    this.mainDiv = document.createElement('div')
    this.mainDiv.classList.add('atom-xterm-profile-menu-element-main-div')
    this.appendChild(this.mainDiv)
    let rightDiv = document.createElement('div')
    rightDiv.classList.add('atom-xterm-profile-menu-element-right-div')
    this.appendChild(rightDiv)
    let bottomDiv = document.createElement('div')
    bottomDiv.classList.add('atom-xterm-profile-menu-element-bottom-div')
    this.appendChild(bottomDiv)
    this.disposables = new CompositeDisposable()
    this.initializedPromise = new Promise((resolve, reject) => {
      this.createProfilesDropDown().then((profilesDiv) => {
        let modelProfile = this.getModelProfile()
        let baseProfile = this.profilesSingleton.getBaseProfile()
        // Profiles
        this.mainDiv.appendChild(profilesDiv)

        // Buttons div
        this.mainDiv.appendChild(this.createProfileMenuButtons())

        // Horizontal line.
        this.mainDiv.appendChild(createHorizontalLine())

        // Command
        this.mainDiv.appendChild(this.createTextbox(
          'command-textbox',
          'Command',
          'Command to run in the terminal.',
          baseProfile.command,
          modelProfile.command
        ))
        // Arguments
        this.mainDiv.appendChild(this.createTextbox(
          'args-textbox',
          'Arguments',
          'Arguments to pass to command. This must be defined as a JSON list.',
          baseProfile.args,
          modelProfile.args
        ))
        // Terminal type
        this.mainDiv.appendChild(this.createTextbox(
          'name-textbox',
          'Terminal Type',
          'The terminal type to use for the terminal. Note that this does nothing on Windows.',
          baseProfile.name,
          modelProfile.name
        ))
        // Current working directory.
        this.mainDiv.appendChild(this.createTextbox(
          'cwd-textbox',
          'Current Working Directory',
          'The current working directory to set for the terminal process.',
          baseProfile.cwd,
          modelProfile.cwd
        ))
        // Environment
        this.mainDiv.appendChild(this.createTextbox(
          'env-textbox',
          'Environment',
          'The environment to use for the terminal process. If not set, the current environment is used. This must be defined as a JSON object.',
          baseProfile.env,
          modelProfile.env
        ))
        // Environment overrides
        this.mainDiv.appendChild(this.createTextbox(
          'setenv-textbox',
          'Environment Overrides',
          'A key/value mapping of environment variables to set/override from the environment. This must be defined as a JSON object.',
          baseProfile.setEnv,
          modelProfile.setEnv
        ))
        // Environment deletions
        this.mainDiv.appendChild(this.createTextbox(
          'deleteenv-textbox',
          'Environment Deletions',
          'A list of environment variables to delete from the environment. This must be defined as a JSON list.',
          baseProfile.deleteEnv,
          modelProfile.deleteEnv
        ))
        // Encoding
        this.mainDiv.appendChild(this.createTextbox(
          'encoding-textbox',
          'Encoding',
          'The encoding to use for the terminal.',
          baseProfile.encoding,
          modelProfile.encoding
        ))
        // Font size
        this.mainDiv.appendChild(this.createTextbox(
          'fontsize-textbox',
          'Font Size',
          'The font size to use for the terminal.',
          baseProfile.fontSize,
          modelProfile.fontSize
        ))
        // Leave open after terminal exit
        this.mainDiv.appendChild(this.createCheckbox(
          'leaveopenafterexit-checkbox',
          'Leave Open After Exit',
          'Whether to leave the terminal open after the terminal process has exited.',
          baseProfile.leaveOpenAfterExit,
          modelProfile.leaveOpenAfterExit
        ))
        // Relaunch terminal on startup.
        this.mainDiv.appendChild(this.createCheckbox(
          'relaunchterminalonstartup-checkbox',
          'Relaunch terminal on startup',
          'Whether to relaunch the terminal after exiting the Atom editor.',
          baseProfile.relaunchTerminalOnStartup,
          modelProfile.relaunchTerminalOnStartup
        ))
        // Title
        this.mainDiv.appendChild(this.createTextbox(
          'title-textbox',
          'Title',
          'The title to give to the terminal tab.',
          baseProfile.title,
          modelProfile.title
        ))
        // xterm.js Terminal options
        this.mainDiv.appendChild(this.createTextbox(
          'xtermoptions-textbox',
          'xterm.js Terminal Options',
          'The xterm.js options to use for Terminal object (i.e to apply theme for example). This must be defined as a JSON object.',
          baseProfile.xtermOptions,
          modelProfile.xtermOptions
        ))
        // Prompt to startup terminal command
        this.mainDiv.appendChild(this.createCheckbox(
          'prompttostartup-checkbox',
          'Prompt to start command',
          'Whether to prompt to start command in terminal on startup.',
          baseProfile.promptToStartup,
          modelProfile.promptToStartup
        ))

        this.deleteProfileModel = new AtomXtermDeleteProfileModel(this)
        this.saveProfileModel = new AtomXtermSaveProfileModel(this)

        this.disposables.add(this.profilesSingleton.onDidReloadProfiles((profiles) => {
          this.createProfilesDropDownSelectItem().then((select) => {
            let menuItemContainer = this.mainDiv.querySelector('#profiles-selection')
            while (menuItemContainer.firstChild) {
              menuItemContainer.removeChild(menuItemContainer.firstChild)
            }
            menuItemContainer.appendChild(select)
          })
        }))
        resolve()
      })
    })
    return this.initializedPromise
  }

  destroy () {
    if (this.disposables) {
      this.disposables.dispose()
    }
  }

  getModelProfile () {
    return this.model.atomXtermModel.profile
  }

  parseJson (value, defaultValue, type) {
    let retval = value
    try {
      retval = JSON.parse(retval)
    } catch (e) {
      if (!(e instanceof SyntaxError)) {
        throw e
      }
      retval = null
    }
    if (!retval || retval.constructor !== type) {
      retval = defaultValue
    }
    return retval
  }

  getMenuElements () {
    let menuElements = {}
    menuElements.commandElement = this.mainDiv.querySelector('#command-textbox atom-text-editor')
    menuElements.argsElement = this.mainDiv.querySelector('#args-textbox atom-text-editor')
    menuElements.nameElement = this.mainDiv.querySelector('#name-textbox atom-text-editor')
    menuElements.cwdElement = this.mainDiv.querySelector('#cwd-textbox atom-text-editor')
    menuElements.envElement = this.mainDiv.querySelector('#env-textbox atom-text-editor')
    menuElements.setEnvElement = this.mainDiv.querySelector('#setenv-textbox atom-text-editor')
    menuElements.deleteEnvElement = this.mainDiv.querySelector('#deleteenv-textbox atom-text-editor')
    menuElements.encodingElement = this.mainDiv.querySelector('#encoding-textbox atom-text-editor')
    menuElements.fontSizeElement = this.mainDiv.querySelector('#fontsize-textbox atom-text-editor')
    menuElements.leaveOpenAfterExitElement = this.mainDiv.querySelector('#leaveopenafterexit-checkbox .atom-xterm-profile-menu-item-checkbox')
    menuElements.relaunchTerminalOnStartupElement = this.mainDiv.querySelector('#relaunchterminalonstartup-checkbox .atom-xterm-profile-menu-item-checkbox')
    menuElements.titleElement = this.mainDiv.querySelector('#title-textbox atom-text-editor')
    menuElements.xtermOptionsElement = this.mainDiv.querySelector('#xtermoptions-textbox atom-text-editor')
    menuElements.promptToStartupElement = this.mainDiv.querySelector('#prompttostartup-checkbox .atom-xterm-profile-menu-item-checkbox')
    return menuElements
  }

  getProfileMenuSettings () {
    let newProfile = {}
    let baseProfile = this.profilesSingleton.getBaseProfile()
    let menuElements = this.getMenuElements()
    newProfile.command = menuElements.commandElement.getModel().getText() || baseProfile.command
    newProfile.args = this.parseJson(
      menuElements.argsElement.getModel().getText(),
      baseProfile.args,
      Array
    )
    newProfile.name = menuElements.nameElement.getModel().getText() || baseProfile.name
    newProfile.cwd = menuElements.cwdElement.getModel().getText() || baseProfile.cwd
    newProfile.env = this.parseJson(
      menuElements.envElement.getModel().getText(),
      baseProfile.env,
      Object
    )
    newProfile.setEnv = this.parseJson(
      menuElements.setEnvElement.getModel().getText(),
      baseProfile.setEnv,
      Object
    )
    newProfile.deleteEnv = this.parseJson(
      menuElements.deleteEnvElement.getModel().getText(),
      baseProfile.deleteEnv,
      Array
    )
    newProfile.encoding = menuElements.encodingElement.getModel().getText() || baseProfile.encoding
    newProfile.fontSize = this.parseJson(
      menuElements.fontSizeElement.getModel().getText(),
      baseProfile.fontSize,
      Number
    )
    newProfile.leaveOpenAfterExit = menuElements.leaveOpenAfterExitElement.checked
    newProfile.relaunchTerminalOnStartup = menuElements.relaunchTerminalOnStartupElement.checked
    newProfile.title = menuElements.titleElement.getModel().getText() || baseProfile.title
    newProfile.xtermOptions = this.parseJson(
      menuElements.xtermOptionsElement.getModel().getText(),
      baseProfile.xtermOptions,
      Object
    )
    newProfile.promptToStartup = menuElements.promptToStartupElement.checked
    return newProfile
  }

  applyProfileChanges (profileChanges) {
    this.hideProfileMenu()
    this.model.getAtomXtermModel().applyProfileChanges(profileChanges)
  }

  restartTerminal () {
    this.hideProfileMenu()
    this.model.getAtomXtermModelElement().restartPtyProcess()
  }

  createMenuItemContainer (id, labelTitle, labelDescription) {
    let menuItemContainer = document.createElement('div')
    menuItemContainer.classList.add('atom-xterm-profile-menu-item')
    menuItemContainer.setAttribute('id', id)
    let menuItemLabel = document.createElement('label')
    menuItemLabel.classList.add('atom-xterm-profile-menu-item-label')
    let titleDiv = document.createElement('div')
    titleDiv.classList.add('atom-xterm-profile-menu-item-title')
    titleDiv.appendChild(document.createTextNode(labelTitle))
    menuItemLabel.appendChild(titleDiv)
    let descriptionDiv = document.createElement('div')
    descriptionDiv.classList.add('atom-xterm-profile-menu-item-description')
    descriptionDiv.appendChild(document.createTextNode(labelDescription))
    menuItemLabel.appendChild(descriptionDiv)
    menuItemContainer.appendChild(menuItemLabel)
    return menuItemContainer
  }

  createProfilesDropDownSelectItem () {
    return new Promise((resolve, reject) => {
      this.profilesSingleton.getProfiles().then((profiles) => {
        let select = document.createElement('select')
        select.setAttribute('id', 'profiles-dropdown')
        select.classList.add('atom-xterm-profile-menu-item-select')
        let option = document.createElement('option')
        let text = document.createTextNode('')
        option.setAttribute('value', text)
        option.appendChild(text)
        select.appendChild(option)
        for (let profile in profiles) {
          option = document.createElement('option')
          text = document.createTextNode(profile)
          option.setAttribute('value', text.textContent)
          option.appendChild(text)
          select.appendChild(option)
        }
        select.addEventListener('change', (event) => {
          let profile = this.profilesSingleton.getBaseProfile()
          if (!event.target.value) {
            this.setNewMenuSettings(profile, true)
          } else {
            this.profilesSingleton.getProfile(event.target.value).then((profile) => {
              this.setNewMenuSettings(profile)
            })
          }
        })
        resolve(select)
      })
    })
  }

  createProfilesDropDown () {
    let menuItemContainer = this.createMenuItemContainer(
      'profiles-selection',
      'Profiles',
      'Available profiles'
    )
    return new Promise((resolve, reject) => {
      this.createProfilesDropDownSelectItem().then((select) => {
        menuItemContainer.appendChild(select)
        resolve(menuItemContainer)
      })
    })
  }

  createProfileMenuButtons () {
    let buttonsContainer = document.createElement('div')
    buttonsContainer.classList.add('atom-xterm-profile-menu-buttons-div')
    let button = this.createButton()
    button.appendChild(document.createTextNode('Load Settings'))
    button.addEventListener('click', (event) => {
      this.loadProfile()
    })
    buttonsContainer.appendChild(button)
    button = this.createButton()
    button.appendChild(document.createTextNode('Save Settings'))
    button.addEventListener('click', (event) => {
      this.saveProfile()
    })
    buttonsContainer.appendChild(button)
    button = this.createButton()
    button.appendChild(document.createTextNode('Delete Settings'))
    button.addEventListener('click', (event) => {
      this.deleteProfile()
    })
    buttonsContainer.appendChild(button)
    button = this.createButton()
    button.appendChild(document.createTextNode('Restart'))
    button.addEventListener('click', (event) => {
      this.restartTerminal()
    })
    buttonsContainer.appendChild(button)
    button = this.createButton()
    button.appendChild(document.createTextNode('Hide Menu'))
    button.addEventListener('click', (event) => {
      this.hideProfileMenu()
    })
    buttonsContainer.appendChild(button)
    return buttonsContainer
  }

  createButton () {
    let button = document.createElement('button')
    button.classList.add('atom-xterm-profile-menu-button')
    return button
  }

  createTextbox (id, labelTitle, labelDescription, defaultValue, initialValue) {
    let menuItemContainer = this.createMenuItemContainer(
      id,
      labelTitle,
      labelDescription
    )
    let textbox = new TextEditor({
      mini: true,
      placeholderText: defaultValue
    })
    if (initialValue) {
      if (initialValue.constructor === Array || initialValue.constructor === Object) {
        textbox.setText(JSON.stringify(initialValue))
      } else {
        textbox.setText(initialValue)
      }
    }
    menuItemContainer.appendChild(textbox.getElement())
    return menuItemContainer
  }

  createCheckbox (id, labelTitle, labelDescription, defaultValue, initialValue) {
    let menuItemContainer = document.createElement('div')
    menuItemContainer.classList.add('atom-xterm-profile-menu-item')
    menuItemContainer.setAttribute('id', id)
    let menuItemLabel = document.createElement('label')
    menuItemLabel.classList.add('atom-xterm-profile-menu-item-label')
    menuItemLabel.classList.add('atom-xterm-profile-menu-item-label-checkbox')
    let checkbox = document.createElement('input')
    checkbox.setAttribute('type', 'checkbox')
    checkbox.classList.add('atom-xterm-profile-menu-item-checkbox')
    checkbox.checked = defaultValue
    if (initialValue !== undefined) {
      checkbox.checked = initialValue
    }
    menuItemLabel.appendChild(checkbox)
    let titleDiv = document.createElement('div')
    titleDiv.classList.add('atom-xterm-profile-menu-item-title')
    titleDiv.appendChild(document.createTextNode(labelTitle))
    menuItemLabel.appendChild(titleDiv)
    menuItemContainer.appendChild(menuItemLabel)
    let descriptionDiv = document.createElement('div')
    descriptionDiv.classList.add('atom-xterm-profile-menu-item-description')
    descriptionDiv.classList.add('atom-xterm-profile-menu-item-description-checkbox')
    descriptionDiv.appendChild(document.createTextNode(labelDescription))
    menuItemContainer.appendChild(descriptionDiv)
    return menuItemContainer
  }

  isVisible () {
    let style = window.getComputedStyle(this, null)
    return (style.visibility === 'visible')
  }

  hideProfileMenu () {
    this.style.visibility = 'hidden'
    let e = this.model.getAtomXtermModelElement()
    e.showTerminal()
    e.focusOnTerminal()
  }

  showProfileMenu () {
    this.model.getAtomXtermModelElement().hideTerminal()
    this.style.visibility = 'visible'
  }

  toggleProfileMenu () {
    if (!this.isVisible()) {
      this.showProfileMenu()
    } else {
      this.hideProfileMenu()
    }
  }

  getNewProfileAndChanges () {
    let newProfile = this.getProfileMenuSettings()
    let profileChanges = this.profilesSingleton.diffProfiles(
      this.model.getAtomXtermModel().getProfile(),
      newProfile
    )
    return {
      newProfile: newProfile,
      profileChanges: profileChanges
    }
  }

  loadProfile () {
    let newProfileAndChanges = this.getNewProfileAndChanges()
    this.applyProfileChanges(newProfileAndChanges.profileChanges)
  }

  saveProfile () {
    // Get the current profile settings before entering the promise.
    let newProfileAndChanges = this.getNewProfileAndChanges()
    this.promptForNewProfileName(
      newProfileAndChanges.newProfile,
      newProfileAndChanges.profileChanges
    )
  }

  deleteProfile () {
    let e = this.mainDiv.querySelector('#profiles-dropdown')
    let profileName = e.options[e.selectedIndex].text
    if (!profileName) {
      atom.notifications.addWarning('Profile must be selected in order to delete it.')
      return
    }
    this.promptDelete(profileName)
  }

  promptDelete (newProfile) {
    return new Promise((resolve, reject) => {
      this.deleteProfileModel.promptDelete(newProfile)
    })
  }

  promptForNewProfileName (newProfile, profileChanges) {
    return new Promise((resolve, reject) => {
      this.saveProfileModel.promptForNewProfileName(newProfile, profileChanges)
    })
  }

  convertNullToEmptyString (value) {
    if (value === null) {
      return ''
    }
    return JSON.stringify(value)
  }

  setNewMenuSettings (profile, clear = false) {
    let newTextList = []
    let value
    newTextList.push(
      // Command
      {
        'id': 'command-textbox',
        'value': profile.command
      }
    )
    value = JSON.stringify(profile.args)
    newTextList.push(
      // Arguments
      {
        'id': 'args-textbox',
        'value': value
      }
    )
    newTextList.push(
      // Terminal type
      {
        'id': 'name-textbox',
        'value': profile.name
      }
    )
    newTextList.push(
      // Current working directory
      {
        'id': 'cwd-textbox',
        'value': profile.cwd
      }
    )
    value = this.convertNullToEmptyString(profile.env)
    newTextList.push(
      // Environment
      {
        'id': 'env-textbox',
        'value': value
      }
    )
    value = JSON.stringify(profile.setEnv)
    newTextList.push(
      // Environment overrides
      {
        'id': 'setenv-textbox',
        'value': value
      }
    )
    value = JSON.stringify(profile.deleteEnv)
    newTextList.push(
      // Environment deletions
      {
        'id': 'deleteenv-textbox',
        'value': value
      }
    )
    value = this.convertNullToEmptyString(profile.encoding)
    newTextList.push(
      // Encoding
      {
        'id': 'encoding-textbox',
        'value': value
      }
    )
    value = profile.fontSize
    newTextList.push(
      // Font size
      {
        'id': 'fontsize-textbox',
        'value': value
      }
    )
    value = profile.title || ''
    newTextList.push(
      // Title
      {
        'id': 'title-textbox',
        'value': value
      }
    )
    value = JSON.stringify(profile.xtermOptions)
    newTextList.push(
      // xterm.js Terminal options
      {
        'id': 'xtermoptions-textbox',
        'value': value
      }
    )
    for (let newText of newTextList) {
      let selector = '#' + newText.id + ' > atom-text-editor'
      let model = this.querySelector(selector).getModel()
      if (!clear) {
        model.setText(newText.value)
      } else {
        model.setText('')
      }
    }

    let newCheckboxList = [
      // Leave open after terminal exit
      {
        'id': 'leaveopenafterexit-checkbox',
        'value': profile.leaveOpenAfterExit
      },
      // Relaunch terminal on startup
      {
        'id': 'relaunchterminalonstartup-checkbox',
        'value': profile.relaunchTerminalOnStartup
      },
      // Prompt to startup terminal command
      {
        'id': 'prompttostartup-checkbox',
        'value': profile.promptToStartup
      }
    ]
    for (let newCheckbox of newCheckboxList) {
      let selector = '#' + newCheckbox.id + ' input'
      let checkbox = this.querySelector(selector)
      checkbox.checked = newCheckbox.value
    }
  }
}

const AtomXtermProfileMenuElement = document.registerElement('atom-xterm-profile', {
  prototype: AtomXtermProfileMenuElementImpl.prototype
})

export {
  AtomXtermProfileMenuElement
}
