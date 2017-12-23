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
import { currentItemIsAtomXtermModel } from './atom-xterm-utils';

class AtomXtermSaveProfileModel {
    constructor(atomXtermProfileMenuElement) {
        this.atomXtermProfileMenuElement = atomXtermProfileMenuElement;
        this.profilesSingleton = AtomXtermProfilesSingleton.instance;
        this.textbox = new TextEditor({mini: true});
        this.textbox.getElement().addEventListener('blur', (event) => {
            this.close();
        });
        this.element;
        this.newProfile;
        this.panel = atom.workspace.addModalPanel({
            item: this,
            visible: false
        });
        atom.commands.add(this.textbox.getElement(), 'core:confirm', () => {
            this.confirm();
        });
        atom.commands.add(this.textbox.getElement(), 'core:cancel', () => {
            this.close();
        })
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

    toggle() {
        this.panel.isVisible() ? this.close() : this.open();
    }

    confirm() {
        let profileName = this.textbox.getText();
        if (!profileName) {
            // Simply do nothing.
            return;
        }
        this.profilesSingleton.setProfile(profileName, this.newProfile).then(() => {
            this.profilesSingleton.reloadProfiles();
            this.profilesSingleton.profilesLoadPromise.then(() => {
                this.atomXtermProfileMenuElement.applyProfileChanges(this.newProfile);
                this.atomXtermProfileMenuElement.restartTerminal();
                this.atomXtermProfileMenuElement.reloadProfilesMenuItem();
                this.close();
            });
        });
    }

    close() {
        if (!this.panel.isVisible()) {
            return;
        }
        this.textbox.setText('');
        this.newProfile = null;
        this.panel.hide();
        // TODO: Is it possible for the profile menu to become hidden?
        if (this.atomXtermProfileMenuElement.isVisible()) {
            this.atomXtermProfileMenuElement.focus();
        }
    }

    promptForNewProfileName(newProfile) {
        this.newProfile = newProfile;
        // TODO: Is it possible for the active item to change while the
        // modal is displayed.
        if (this.panel.isVisible() || !currentItemIsAtomXtermModel()) {
            return;
        }
        this.panel.show();
        this.textbox.getElement().focus();
    }
}

export {
    AtomXtermSaveProfileModel
}
