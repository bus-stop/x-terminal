/** @babel */
/*
 * Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Copyright 2017 Andres Mejia <amejia004@gmail.com>. All Rights Reserved.
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

import { TextEditor } from 'atom';

import { AtomXtermProfilesSingleton } from './atom-xterm-profiles';
import { AtomXtermSaveProfileModel } from './atom-xterm-save-profile-model';

class AtomXtermProfileMenuElement extends HTMLElement {
    initialize(atomXtermElement) {
        this.atomXtermElement = atomXtermElement;
        this.profilesSingleton = AtomXtermProfilesSingleton.instance;
        this.outerDiv = document.createElement('div');
        this.outerDiv.classList.add('atom-xterm-profile-menu-element-outer-div');
        this.appendChild(this.outerDiv);
        this.mainDiv = document.createElement('div');
        this.mainDiv.classList.add('atom-xterm-profile-menu-element-main-div');
        this.outerDiv.appendChild(this.mainDiv);
        this.initializedPromise = new Promise((resolve, reject) => {
            this.createProfilesDropDown().then((profilesDiv) => {
                let modelProfile = this.getModelProfile();
                let baseProfile = this.profilesSingleton.getBaseProfile();
                // Profiles
                this.mainDiv.appendChild(profilesDiv);

                // Buttons div
                this.mainDiv.appendChild(this.createProfileMenuButtons());

                // Horizontal line.
                let hLine = document.createElement('div');
                hLine.classList.add('atom-xterm-profile-menu-element-hline');
                hLine.appendChild(document.createTextNode('.'));
                this.mainDiv.appendChild(hLine);

                // Command
                this.mainDiv.appendChild(this.createTextbox(
                    id='command-textbox',
                    labelTitle='Command',
                    labelDescription='Command to run in the terminal.',
                    defaultValue=baseProfile.command,
                    initialValue=modelProfile.command
                ));
                // Arguments
                this.mainDiv.appendChild(this.createTextbox(
                    id='args-textbox',
                    labelTitle='Arguments',
                    labelDescription='Arguments to pass to command. This must be defined as a JSON list.',
                    defaultValue=baseProfile.args,
                    initialValue=modelProfile.args
                ));
                // Terminal type
                this.mainDiv.appendChild(this.createTextbox(
                    id='name-textbox',
                    labelTitle='Terminal Type',
                    labelDescription='The terminal type to use for the terminal. Note that this does nothing on Windows.',
                    defaultValue=baseProfile.name,
                    initialValue=modelProfile.name
                ));
                // Current working directory.
                this.mainDiv.appendChild(this.createTextbox(
                    id='cwd-textbox',
                    labelTitle='Current Working Directory',
                    labelDescription='The current working directory to set for the terminal process.',
                    defaultValue=baseProfile.cwd,
                    initialValue=modelProfile.cwd
                ));
                // Environment
                this.mainDiv.appendChild(this.createTextbox(
                    id='env-textbox',
                    labelTitle='Environment',
                    labelDescription='The environment to use for the terminal process. If not set, the current environment is used. This must be defined as a JSON object.',
                    defaultValue=baseProfile.env,
                    initialValue=modelProfile.env
                ));
                // Environment overrides
                this.mainDiv.appendChild(this.createTextbox(
                    id='setenv-textbox',
                    labelTitle='Environment Overrides',
                    labelDescription='A key/value mapping of environment variables to set/override from the environment. This must be defined as a JSON object.',
                    defaultValue=baseProfile.setEnv,
                    initialValue=modelProfile.setEnv
                ));
                // Environment deletions
                this.mainDiv.appendChild(this.createTextbox(
                    id='deleteenv-textbox',
                    labelTitle='Environment Deletions',
                    labelDescription='A list of environment variables to delete from the environment. This must be defined as a JSON list.',
                    defaultValue=baseProfile.deleteEnv,
                    initialValue=modelProfile.deleteEnv
                ));
                // Encoding
                this.mainDiv.appendChild(this.createTextbox(
                    id='encoding-textbox',
                    labelTitle='Encoding',
                    labelDescription='The encoding to use for the terminal.',
                    defaultValue=baseProfile.encoding,
                    initialValue=modelProfile.encoding
                ));
                // TODO: Need to properly support setting font size per terminal session.
                // Leave open after terminal exit
                this.mainDiv.appendChild(this.createCheckbox(
                    id='leaveopenafterexit-checkbox',
                    labelTitle='Leave Open After Exit',
                    labelDescription='Whether to leave the terminal open after the terminal process has exited.',
                    defaultValue=baseProfile.leaveOpenAfterExit,
                    initialValue=modelProfile.leaveOpenAfterExit
                ));
                // Relaunch terminal on startup.
                this.mainDiv.appendChild(this.createCheckbox(
                    id='relaunchterminalonstartup-checkbox',
                    labelTitle='Relaunch terminal on startup',
                    labelDescription='Whether to relaunch the terminal after exiting the Atom editor.',
                    defaultValue=baseProfile.relaunchTerminalOnStartup,
                    initialValue=modelProfile.relaunchTerminalOnStartup
                ));

                this.saveProfileModel = new AtomXtermSaveProfileModel(this);
                resolve();
            });
        });
        return this.initializedPromise;
    }

    getModelProfile() {
        return this.atomXtermElement.model.profile;
    }

    parseJson(value, defaultValue, type) {
        let retval = value;
        try {
            retval = JSON.parse(retval);
        } catch (e) {
            if (!(e instanceof SyntaxError)) {
                throw e;
            }
            retval = null;
        }
        if (!retval || retval.constructor !== type) {
            retval = defaultValue;
        }
        return retval;
    }

    getMenuElements() {
        let menuElements = {};
        menuElements.commandElement = this.mainDiv.querySelector('#command-textbox atom-text-editor');
        menuElements.argsElement = this.mainDiv.querySelector('#args-textbox atom-text-editor');
        menuElements.nameElement = this.mainDiv.querySelector('#name-textbox atom-text-editor');
        menuElements.cwdElement = this.mainDiv.querySelector('#cwd-textbox atom-text-editor');
        menuElements.envElement = this.mainDiv.querySelector('#env-textbox atom-text-editor');
        menuElements.setEnvElement = this.mainDiv.querySelector('#setenv-textbox atom-text-editor');
        menuElements.deleteEnvElement = this.mainDiv.querySelector('#deleteenv-textbox atom-text-editor');
        menuElements.encodingElement = this.mainDiv.querySelector('#encoding-textbox atom-text-editor');
        menuElements.leaveOpenAfterExitElement = this.mainDiv.querySelector('#leaveopenafterexit-checkbox .atom-xterm-profile-menu-item-checkbox');
        menuElements.relaunchTerminalOnStartupElement = this.mainDiv.querySelector('#relaunchterminalonstartup-checkbox .atom-xterm-profile-menu-item-checkbox');
        return menuElements;
    }

    getProfileMenuSettings() {
        let newProfile = {};
        let baseProfile = this.profilesSingleton.getBaseProfile();
        let menuElements = this.getMenuElements();
        newProfile.command = menuElements.commandElement.getModel().getText() || baseProfile.command;
        newProfile.args = this.parseJson(
            value=menuElements.argsElement.getModel().getText(),
            defaultValue=baseProfile.args,
            type=Array
        );
        newProfile.name = menuElements.nameElement.getModel().getText() || baseProfile.name;
        newProfile.cwd = menuElements.cwdElement.getModel().getText() || baseProfile.cwd;
        newProfile.env = this.parseJson(
            value=menuElements.envElement.getModel().getText(),
            defaultValue=baseProfile.env,
            type=Object
        );
        newProfile.setEnv = this.parseJson(
            value=menuElements.setEnvElement.getModel().getText(),
            defaultValue=baseProfile.setEnv,
            type=Object
        );
        newProfile.deleteEnv = this.parseJson(
            value=menuElements.deleteEnvElement.getModel().getText(),
            defaultValue=baseProfile.deleteEnv,
            type=Array
        );
        newProfile.encoding = menuElements.encodingElement.getModel().getText() || baseProfile.encoding;
        newProfile.leaveOpenAfterExit = menuElements.leaveOpenAfterExitElement.checked;
        newProfile.relaunchTerminalOnStartup = menuElements.relaunchTerminalOnStartupElement.checked;
        return newProfile;
    }

    applyProfileChanges(newProfile) {
        this.atomXtermElement.setNewProfile(newProfile);
    }

    restartTerminal() {
        this.atomXtermElement.restartPtyProcess();
    }

    createMenuItemContainer(id, labelTitle, labelDescription) {
        let menuItemContainer = document.createElement('div');
        menuItemContainer.classList.add('atom-xterm-profile-menu-item');
        menuItemContainer.setAttribute('id', id);
        let menuItemLabel = document.createElement('label');
        menuItemLabel.classList.add('atom-xterm-profile-menu-item-label');
        let titleDiv = document.createElement('div');
        titleDiv.classList.add('atom-xterm-profile-menu-item-title');
        titleDiv.appendChild(document.createTextNode(labelTitle));
        menuItemLabel.appendChild(titleDiv);
        let descriptionDiv = document.createElement('div');
        descriptionDiv.classList.add('atom-xterm-profile-menu-item-description');
        descriptionDiv.appendChild(document.createTextNode(labelDescription));
        menuItemLabel.appendChild(descriptionDiv);
        menuItemContainer.appendChild(menuItemLabel);
        return menuItemContainer;
    }

    createProfilesDropDownSelectItem() {
        return new Promise((resolve, reject) => {
            this.profilesSingleton.getProfiles().then((profiles) => {
                let select = document.createElement('select');
                select.classList.add('atom-xterm-profile-menu-item-select');
                let option = document.createElement('option');
                let text = document.createTextNode('');
                option.setAttribute('value', text);
                option.appendChild(text);
                select.appendChild(option);
                for (let profile in profiles) {
                    option = document.createElement('option');
                    text = document.createTextNode(profile);
                    option.setAttribute('value', text.textContent);
                    option.appendChild(text);
                    select.appendChild(option);
                }
                select.addEventListener('change', (event) => {
                    let profile = this.profilesSingleton.getBaseProfile();
                    if (!event.target.value) {
                        this.setNewMenuSettings(profile, clear=true);
                    } else {
                        this.profilesSingleton.getProfile(event.target.value).then((profile) => {
                            this.setNewMenuSettings(profile);
                        });
                    }
                });
                resolve(select);
            });
        });
    }

    createProfilesDropDown() {
        let menuItemContainer = this.createMenuItemContainer(
            id='profiles-selection',
            labelTitle='Profiles',
            labelDescription='Available profiles'
        );
        return new Promise((resolve, reject) => {
            this.createProfilesDropDownSelectItem().then((select) => {
                menuItemContainer.appendChild(select);
                resolve(menuItemContainer);
            });
        });
    }

    createProfileMenuButtons() {
        let buttonsContainer = document.createElement('div');
        buttonsContainer.classList.add('atom-xterm-profile-menu-buttons-div');
        let button = this.createButton();
        button.appendChild(document.createTextNode('Load Settings and Restart'));
        button.addEventListener('click', (event) => {
            this.loadProfile();
        });
        buttonsContainer.appendChild(button);
        button = this.createButton();
        button.appendChild(document.createTextNode('Save Settings and Restart'));
        button.addEventListener('click', (event) => {
            this.saveProfile();
        });
        buttonsContainer.appendChild(button);
        button = this.createButton();
        button.appendChild(document.createTextNode('Restart'));
        button.addEventListener('click', (event) => {
            this.restartTerminal();
        });
        buttonsContainer.appendChild(button);
        button = this.createButton();
        button.appendChild(document.createTextNode('Hide Menu'));
        button.addEventListener('click', (event) => {
            this.hideProfileMenu();
        });
        buttonsContainer.appendChild(button);
        return buttonsContainer;
    }

    createButton() {
        let button = document.createElement('button');
        button.classList.add('atom-xterm-profile-menu-button');
        return button;
    }

    createTextbox(id, labelTitle, labelDescription, defaultValue, initialValue) {
        let menuItemContainer = this.createMenuItemContainer(
            id=id,
            labelTitle=labelTitle,
            labelDescription=labelDescription
        );
        let textbox = new TextEditor({
            mini: true,
            placeholderText: defaultValue
        });
        if (initialValue) {
            if (initialValue.constructor === Array || initialValue.constructor === Object) {
                textbox.setText(JSON.stringify(initialValue));
            } else {
                textbox.setText(initialValue);
            }
        }
        menuItemContainer.appendChild(textbox.getElement());
        return menuItemContainer;
    }

    createCheckbox(id, labelTitle, labelDescription, defaultValue, initialValue) {
        let menuItemContainer = document.createElement('div');
        menuItemContainer.classList.add('atom-xterm-profile-menu-item');
        menuItemContainer.setAttribute('id', id);
        let menuItemLabel = document.createElement('label');
        menuItemLabel.classList.add('atom-xterm-profile-menu-item-label');
        menuItemLabel.classList.add('atom-xterm-profile-menu-item-label-checkbox');
        let checkbox = document.createElement('input');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.classList.add('atom-xterm-profile-menu-item-checkbox');
        checkbox.checked = defaultValue;
        if (initialValue !== undefined) {
            checkbox.checked = initialValue;
        }
        menuItemLabel.appendChild(checkbox);
        let titleDiv = document.createElement('div');
        titleDiv.classList.add('atom-xterm-profile-menu-item-title');
        titleDiv.appendChild(document.createTextNode(labelTitle));
        menuItemLabel.appendChild(titleDiv);
        menuItemContainer.appendChild(menuItemLabel);
        let descriptionDiv = document.createElement('div');
        descriptionDiv.classList.add('atom-xterm-profile-menu-item-description');
        descriptionDiv.classList.add('atom-xterm-profile-menu-item-description-checkbox');
        descriptionDiv.appendChild(document.createTextNode(labelDescription));
        menuItemContainer.appendChild(descriptionDiv);
        return menuItemContainer;
    }

    isVisible() {
        let style = window.getComputedStyle(this, null);
        return (style.visibility !== 'hidden');
    }

    hideProfileMenu() {
        this.style.visibility = 'hidden';
    }

    showProfileMenu() {
        this.style.visibility = 'visible';
    }

    toggleProfileMenu() {
        if (!this.isVisible()) {
            this.showProfileMenu();
        } else {
            this.hideProfileMenu();
        }
    }

    loadProfile() {
        let newProfile = this.getProfileMenuSettings();
        this.applyProfileChanges(newProfile);
        this.restartTerminal();
    }

    saveProfile() {
        // Get the current profile settings before entering the promise.
        let newProfile = this.getProfileMenuSettings();
        this.promptForNewProfileName(newProfile);
    }

    promptForNewProfileName(newProfile) {
        return new Promise((resolve, reject) => {
            this.saveProfileModel.promptForNewProfileName(newProfile);
        });
    }

    convertNullToEmptyString(value) {
        if (value === null) {
            return '';
        }
        return JSON.stringify(value);
    }

    setNewMenuSettings(profile, clear = false) {
        let newTextList = [];
        let value;
        newTextList.push(
            // Command
            {
                'id': 'command-textbox',
                'value': profile.command,
            }
        )
        value = JSON.stringify(profile.args);
        newTextList.push(
            // Arguments
            {
                'id': 'args-textbox',
                'value': value,
            }
        )
        newTextList.push(
            // Terminal type
            {
                'id': 'name-textbox',
                'value': profile.name,
            }
        )
        newTextList.push(
            // Current working directory
            {
                'id': 'cwd-textbox',
                'value': profile.cwd,
            }
        )
        value = this.convertNullToEmptyString(profile.env);
        newTextList.push(
            // Environment
            {
                'id': 'env-textbox',
                'value': value,
            }
        )
        value = JSON.stringify(profile.setEnv);
        newTextList.push(
            // Environment overres
            {
                'id': 'setenv-textbox',
                'value': value,
            }
        )
        value = JSON.stringify(profile.deleteEnv);
        newTextList.push(
            // Environment deletions
            {
                'id': 'deleteenv-textbox',
                'value': value,
            }
        )
        value = this.convertNullToEmptyString(profile.encoding);
        newTextList.push(
            // Encoding
            {
                'id': 'encoding-textbox',
                'value': value,
            }
        )
        for (let newText of newTextList) {
            let selector = '#' + newText.id + ' > atom-text-editor';
            let model = this.querySelector(selector).getModel();
            if (!clear) {
                model.setText(newText.value);
            } else {
                model.setText('');
            }
        }

        // TODO: Need to properly support setting font size per terminal session.
        let newCheckboxList = [
            // Leave open after terminal exit
            {
                'id': 'leaveopenafterexit-checkbox',
                'value': profile.leaveOpenAfterExit,
            },
            // Relaunch terminal on startup
            {
                'id': 'relaunchterminalonstartup-checkbox',
                'value': profile.relaunchTerminalOnStartup,
            },
        ];
        for (let newCheckbox of newCheckboxList) {
            let selector = '#' + newCheckbox.id + ' input';
            let checkbox = this.querySelector(selector);
            checkbox.checked = newCheckbox.value;
        }
    }

    reloadProfilesMenuItem() {
        this.createProfilesDropDownSelectItem().then((select) => {
            let menuItemContainer = this.mainDiv.querySelector('#profiles-selection');
            while (menuItemContainer.firstChild) {
                menuItemContainer.removeChild(menuItemContainer.firstChild);
            }
            menuItemContainer.appendChild(select);
        });
    }
}

module.exports = document.registerElement('atom-xterm-profile', {
    prototype: AtomXtermProfileMenuElement.prototype
});
