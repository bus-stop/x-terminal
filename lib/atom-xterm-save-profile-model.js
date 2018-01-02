/** @babel */
/*
 * Copyright 2017-2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

import { TextEditor } from 'atom';

import { AtomXtermProfilesSingleton } from './atom-xterm-profiles';
import { AtomXtermOverwriteProfileModel } from './atom-xterm-overwrite-profile-model';
import { currentItemIsAtomXtermModel } from './atom-xterm-utils';

class AtomXtermSaveProfileModel {
    constructor(atomXtermProfileMenuElement) {
        this.atomXtermProfileMenuElement = atomXtermProfileMenuElement;
        this.profilesSingleton = AtomXtermProfilesSingleton.instance;
        this.element;
        this.panel = atom.workspace.addModalPanel({
            item: this,
            visible: false
        });
        this.overwriteProfileModel = new AtomXtermOverwriteProfileModel(this);
    }

    getTitle() {
        return 'atom-xterm Save Profile Model';
    }

    getElement() {
        return this.element;
    }

    setElement(element) {
        this.element = element;
    }

    getTextbox() {
        return this.textbox;
    }

    updateProfile(profileName, newProfile) {
        this.profilesSingleton.setProfile(profileName, newProfile).then(() => {
            this.profilesSingleton.reloadProfiles();
            this.profilesSingleton.profilesLoadPromise.then(() => {
                this.atomXtermProfileMenuElement.applyProfileChanges(newProfile);
                this.close();
            });
        });
    }

    confirm(newProfile) {
        let profileName = this.textbox.getText();
        if (!profileName) {
            // Simply do nothing.
            return;
        }
        this.profilesSingleton.isProfileExists(profileName).then((exists) => {
            if (exists) {
                this.close(false);
                this.overwriteProfileModel.promptOverwrite(profileName, newProfile);
            } else {
                this.updateProfile(profileName, newProfile);
            }
        });
    }

    close(focusMenuElement = true) {
        if (!this.panel.isVisible()) {
            return;
        }
        this.textbox.setText('');
        this.panel.hide();
        if (this.atomXtermProfileMenuElement.isVisible() && focusMenuElement) {
            this.atomXtermProfileMenuElement.focus();
        }
    }

    promptForNewProfileName(newProfile) {
        // TODO: Is it possible for the active item to change while the
        // modal is displayed.
        if (this.panel.isVisible() || !currentItemIsAtomXtermModel()) {
            return;
        }
        this.textbox = new TextEditor({mini: true});
        this.textbox.getElement().addEventListener('blur', (event) => {
            this.close();
        });
        atom.commands.add(this.textbox.getElement(), 'core:confirm', () => {
            this.confirm(newProfile);
        });
        atom.commands.add(this.textbox.getElement(), 'core:cancel', () => {
            this.close();
        });
        this.element.setNewTextbox(this.textbox);
        this.panel.show();
        this.textbox.getElement().focus();
    }
}

export {
    AtomXtermSaveProfileModel
}
