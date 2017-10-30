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

class AtomXtermProfileMenuElement extends HTMLElement {
    initialize(atomXtermElement) {
        this.atomXtermElement = atomXtermElement;
        this.profilesSingleton = AtomXtermProfilesSingleton.instance;
        this.mainDiv = document.createElement('div');
        this.mainDiv.classList.add('atom-xterm-profile-menu-element-main-div');
        this.appendChild(this.mainDiv);
        this.initializedPromise = new Promise((resolve, reject) => {
            this.createProfilesDropDown().then((profilesDiv) => {
                let modelProfile = this.getModelProfile();
                // Profiles
                this.mainDiv.appendChild(profilesDiv);

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
                    defaultValue=this.profilesSingleton.getBaseProfile().command,
                    initialValue=modelProfile.command
                ));
                // Arguments
                this.mainDiv.appendChild(this.createTextbox(
                    id='args-textbox',
                    labelTitle='Arguments',
                    labelDescription='Arguments to pass to command. This must be defined as a JSON list.',
                    defaultValue=this.profilesSingleton.getBaseProfile().args,
                    initialValue=modelProfile.args
                ));
                // Terminal type
                this.mainDiv.appendChild(this.createTextbox(
                    id='name-textbox',
                    labelTitle='Terminal Type',
                    labelDescription='The terminal type to use for the terminal. Note that this does nothing on Windows.',
                    defaultValue=this.profilesSingleton.getBaseProfile().name,
                    initialValue=modelProfile.name
                ));
                // Current working directory.
                this.mainDiv.appendChild(this.createTextbox(
                    id='cwd-textbox',
                    labelTitle='Current Working Directory',
                    labelDescription='The current working directory to set for the terminal process.',
                    defaultValue=this.profilesSingleton.getBaseProfile().cwd,
                    initialValue=modelProfile.cwd
                ));
                // Environment
                this.mainDiv.appendChild(this.createTextbox(
                    id='env-textbox',
                    labelTitle='Environment',
                    labelDescription='The environment to use for the terminal process. If not set, the current environment is used. This must be defined as a JSON object.',
                    defaultValue=this.profilesSingleton.getBaseProfile().env,
                    initialValue=modelProfile.env
                ));
                // Environment overrides
                this.mainDiv.appendChild(this.createTextbox(
                    id='setenv-textbox',
                    labelTitle='Environment Overrides',
                    labelDescription='A key/value mapping of environment variables to set/override from the environment. This must be defined as a JSON object.',
                    defaultValue=this.profilesSingleton.getBaseProfile().setEnv,
                    initialValue=modelProfile.setEnv
                ));
                // Environment deletions
                this.mainDiv.appendChild(this.createTextbox(
                    id='deleteenv-textbox',
                    labelTitle='Environment Deletions',
                    labelDescription='A list of environment variables to delete from the environment. This must be defined as a JSON list.',
                    defaultValue=this.profilesSingleton.getBaseProfile().deleteEnv,
                    initialValue=modelProfile.deleteEnv
                ));
                // Encoding
                this.mainDiv.appendChild(this.createTextbox(
                    id='encoding-textbox',
                    labelTitle='Encoding',
                    labelDescription='The encoding to use for the terminal.',
                    defaultValue=this.profilesSingleton.getBaseProfile().encoding,
                    initialValue=modelProfile.encoding
                ));
                // TODO: Need to properly support setting font size per terminal session.
                // Leave open after terminal exit
                this.mainDiv.appendChild(this.createCheckbox(
                    id='leaveopenafterexit-checkbox',
                    labelTitle='Leave Open After Exit',
                    labelDescription='Whether to leave the terminal open after the terminal process has exited.',
                    defaultValue=this.profilesSingleton.getBaseProfile().leaveOpenAfterExit,
                    initialValue=modelProfile.leaveOpenAfterExit
                ));
                // Relaunch terminal on startup.
                this.mainDiv.appendChild(this.createCheckbox(
                    id='relaunchterminalonstartup-checkbox',
                    labelTitle='Relaunch terminal on startup',
                    labelDescription='Whether to relaunch the terminal after exiting the Atom editor.',
                    defaultValue=this.profilesSingleton.getBaseProfile().relaunchTerminalOnStartup,
                    initialValue=modelProfile.relaunchTerminalOnStartup
                ));
                resolve();
            });
        });
        return this.initializedPromise;
    }

    getModelProfile() {
        return this.atomXtermElement.model.profile;
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

    createProfilesDropDown() {
        return new Promise((resolve, reject) => {
            this.profilesSingleton.getProfiles().then((profiles) => {
                let menuItemContainer = this.createMenuItemContainer(
                    id='profiles-selection',
                    labelTitle='Profiles',
                    labelDescription='Available profiles'
                );
                let select = document.createElement('select');
                select.classList.add('atom-xterm-profile-menu-item-select');
                menuItemContainer.appendChild(select);
                let option = document.createElement('option');
                let text = document.createTextNode('');
                option.setAttribute('value', text);
                option.appendChild(text);
                select.appendChild(option);
                for (let profile in profiles) {
                    option = document.createElement('option');
                    text = document.createTextNode(profile);
                    option.setAttribute('value', text);
                    option.appendChild(text);
                    select.appendChild(option);
                }
                resolve(menuItemContainer);
            });
        });
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

    toggleProfileMenu() {
        let style = window.getComputedStyle(this, null);
        if (style.visibility === 'hidden') {
            this.style.visibility = 'visible';
        } else {
            this.style.visibility = 'hidden';
        }
    }
}

module.exports = document.registerElement('atom-xterm-profile', {
  prototype: AtomXtermProfileMenuElement.prototype
});
