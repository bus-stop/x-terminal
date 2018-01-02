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

import { AtomXtermSaveProfileModel } from '../lib/atom-xterm-save-profile-model';
import * as utils from '../lib/atom-xterm-utils';

describe('AtomXtermSaveProfileModel', () => {
    this.atomXtermProfileMenuElement;

    beforeEach(() => {
        this.atomXtermProfileMenuElement = jasmine.createSpyObj(
            'atomXtermProfileMenuElement',
            [
                'applyProfileChanges',
                'restartTerminal',
                'isVisible',
                'focus',
            ]
        );
    });

    it('constructor()', () => {
        let model = new AtomXtermSaveProfileModel(this.atomXtermProfileMenuElement);
        expect(model).not.toBeNull();
    });

    it('getTitle()', () => {
        let model = new AtomXtermSaveProfileModel(this.atomXtermProfileMenuElement);
        expect(model.getTitle()).toBe('atom-xterm Save Profile Model');
    });

    it('getElement()', () => {
        let model = new AtomXtermSaveProfileModel(this.atomXtermProfileMenuElement);
        expect(model.getElement()).toBeUndefined();
    });

    it('setElement()', () => {
        let model = new AtomXtermSaveProfileModel(this.atomXtermProfileMenuElement);
        let element = jasmine.createSpy('atomXtermSaveProfileElement');
        model.setElement(element);
        expect(model.getElement()).toBe(element);
    });

    it('getTextbox()', () => {
        let model = new AtomXtermSaveProfileModel(this.atomXtermProfileMenuElement);
        let mock = jasmine.createSpy('textbox');
        model.textbox = mock;
        expect(model.getTextbox()).toBe(mock);
    });

    it('updateProfile()', (done) => {
        let model = new AtomXtermSaveProfileModel(this.atomXtermProfileMenuElement);
        spyOn(model.profilesSingleton, 'setProfile').and.returnValue(Promise.resolve());
        model.atomXtermProfileMenuElement.applyProfileChanges.and.callFake(() => {
            done();
        });
        model.updateProfile('foo', {});
    });

    it('confirm() no name given', () => {
        let model = new AtomXtermSaveProfileModel(this.atomXtermProfileMenuElement);
        model.textbox = jasmine.createSpyObj('textbox', ['getText']);
        model.textbox.getText.and.returnValue('');
        spyOn(model.profilesSingleton, 'isProfileExists').and.returnValue(Promise.resolve(false));
        model.confirm({});
        expect(model.profilesSingleton.isProfileExists).not.toHaveBeenCalled();
    });

    it('confirm() name given does not exist', (done) => {
        let model = new AtomXtermSaveProfileModel(this.atomXtermProfileMenuElement);
        model.textbox = jasmine.createSpyObj('textbox', ['getText']);
        model.textbox.getText.and.returnValue('foo');
        spyOn(model.profilesSingleton, 'isProfileExists').and.returnValue(Promise.resolve(false));
        spyOn(model, 'updateProfile').and.callFake(() => {
            done();
        });
        model.confirm({});
    });

    it('confirm() name given exists', (done) => {
        let model = new AtomXtermSaveProfileModel(this.atomXtermProfileMenuElement);
        model.textbox = jasmine.createSpyObj('textbox', ['getText']);
        model.textbox.getText.and.returnValue('foo');
        spyOn(model.profilesSingleton, 'isProfileExists').and.returnValue(Promise.resolve(true));
        spyOn(model, 'close');
        spyOn(model.overwriteProfileModel, 'promptOverwrite').and.callFake(() => {
            expect(model.close).toHaveBeenCalledWith(false);
            done();
        });
        model.confirm({});
    });

    it('close() panel is not visible', () => {
        let model = new AtomXtermSaveProfileModel(this.atomXtermProfileMenuElement);
        model.panel = jasmine.createSpyObj('panel', ['isVisible', 'hide']);
        model.panel.isVisible.and.returnValue(false);
        model.textbox = jasmine.createSpyObj('textbox', ['setText']);
        model.atomXtermProfileMenuElement.isVisible.and.returnValue(false);
        model.close();
        expect(model.panel.hide).not.toHaveBeenCalled();
    });

    it('close() panel is visible profile menu element is not visible', () => {
        let model = new AtomXtermSaveProfileModel(this.atomXtermProfileMenuElement);
        model.panel = jasmine.createSpyObj('panel', ['isVisible', 'hide']);
        model.panel.isVisible.and.returnValue(true);
        model.textbox = jasmine.createSpyObj('textbox', ['setText']);
        model.atomXtermProfileMenuElement.isVisible.and.returnValue(false);
        model.close();
        expect(model.panel.hide).toHaveBeenCalled();
        expect(model.atomXtermProfileMenuElement.focus).not.toHaveBeenCalled();
    });

    it('close() panel is visible profile menu element is visible', () => {
        let model = new AtomXtermSaveProfileModel(this.atomXtermProfileMenuElement);
        model.panel = jasmine.createSpyObj('panel', ['isVisible', 'hide']);
        model.panel.isVisible.and.returnValue(true);
        model.textbox = jasmine.createSpyObj('textbox', ['setText']);
        model.atomXtermProfileMenuElement.isVisible.and.returnValue(true);
        model.close();
        expect(model.panel.hide).toHaveBeenCalled();
        expect(model.atomXtermProfileMenuElement.focus).toHaveBeenCalled();
    });

    it('close() panel is visible profile menu element is visible focusMenuElement = false', () => {
        let model = new AtomXtermSaveProfileModel(this.atomXtermProfileMenuElement);
        model.panel = jasmine.createSpyObj('panel', ['isVisible', 'hide']);
        model.panel.isVisible.and.returnValue(true);
        model.textbox = jasmine.createSpyObj('textbox', ['setText']);
        model.atomXtermProfileMenuElement.isVisible.and.returnValue(true);
        model.close(false);
        expect(model.panel.hide).toHaveBeenCalled();
        expect(model.atomXtermProfileMenuElement.focus).not.toHaveBeenCalled();
    });

    it('promptForNewProfileName() modal is not visible current item is not AtomXtermModel', () => {
        let model = new AtomXtermSaveProfileModel(this.atomXtermProfileMenuElement);
        model.panel = jasmine.createSpyObj('panel', ['isVisible', 'show']);
        model.panel.isVisible.and.returnValue(false);
        model.element = jasmine.createSpyObj('element', ['setNewTextbox']);
        spyOn(utils, 'currentItemIsAtomXtermModel').and.returnValue(false);
        model.promptForNewProfileName({});
        expect(model.panel.show).not.toHaveBeenCalled();
    });

    it('promptForNewProfileName() modal is not visible current item is AtomXtermModel', () => {
        let model = new AtomXtermSaveProfileModel(this.atomXtermProfileMenuElement);
        model.panel = jasmine.createSpyObj('panel', ['isVisible', 'show']);
        model.panel.isVisible.and.returnValue(false);
        model.element = jasmine.createSpyObj('element', ['setNewTextbox']);
        spyOn(utils, 'currentItemIsAtomXtermModel').and.returnValue(true);
        model.promptForNewProfileName({});
        expect(model.panel.show).toHaveBeenCalled();
    });

    it('promptForNewProfileName() modal is visible current item is not AtomXtermModel', () => {
        let model = new AtomXtermSaveProfileModel(this.atomXtermProfileMenuElement);
        model.panel = jasmine.createSpyObj('panel', ['isVisible', 'show']);
        model.panel.isVisible.and.returnValue(true);
        model.element = jasmine.createSpyObj('element', ['setNewTextbox']);
        spyOn(utils, 'currentItemIsAtomXtermModel').and.returnValue(false);
        model.promptForNewProfileName({});
        expect(model.panel.show).not.toHaveBeenCalled();
    });

    it('promptForNewProfileName() modal is visible current item is AtomXtermModel', () => {
        let model = new AtomXtermSaveProfileModel(this.atomXtermProfileMenuElement);
        model.panel = jasmine.createSpyObj('panel', ['isVisible', 'show']);
        model.panel.isVisible.and.returnValue(true);
        model.element = jasmine.createSpyObj('element', ['setNewTextbox']);
        spyOn(utils, 'currentItemIsAtomXtermModel').and.returnValue(true);
        model.promptForNewProfileName({});
        expect(model.panel.show).not.toHaveBeenCalled();
    });
});
