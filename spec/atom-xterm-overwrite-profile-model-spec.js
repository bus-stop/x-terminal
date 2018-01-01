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

import { AtomXtermOverwriteProfileModel } from '../lib/atom-xterm-overwrite-profile-model';

describe('AtomXtermOverwriteProfileModel', () => {
    this.atomXtermSaveProfileModel;

    beforeEach(() => {
        this.atomXtermSaveProfileModel = jasmine.createSpyObj(
            'atomXtermSaveProfileModel',
            [
                'promptForNewProfileName'
            ]
        );
    });

    it('constructor()', () => {
        let model = new AtomXtermOverwriteProfileModel(this.atomXtermSaveProfileModel);
        expect(model).not.toBeNull();
    });

    it('getTitle()', () => {
        let model = new AtomXtermOverwriteProfileModel(this.atomXtermSaveProfileModel);
        expect(model.getTitle()).toBe('atom-xterm Overwrite Profile Model');
    });

    it('getElement()', () => {
        let model = new AtomXtermOverwriteProfileModel(this.atomXtermSaveProfileModel);
        expect(model.getElement()).toBeUndefined();
    });

    it('setElement()', () => {
        let model = new AtomXtermOverwriteProfileModel(this.atomXtermSaveProfileModel);
        let element = jasmine.createSpy('atomXtermOverwriteProfileElement');
        model.setElement(element);
        expect(model.getElement()).toBe(element);
    });

    it('close() panel is not visible', () => {
        let model = new AtomXtermOverwriteProfileModel(this.atomXtermSaveProfileModel);
        model.panel = jasmine.createSpyObj('panel', ['isVisible', 'hide']);
        model.panel.isVisible.and.returnValue(false);
        model.close('foo');
        expect(model.panel.hide).not.toHaveBeenCalled();
        expect(model.atomXtermSaveProfileModel.promptForNewProfileName).not.toHaveBeenCalled();
    });

    it('close() panel is visible', () => {
        let model = new AtomXtermOverwriteProfileModel(this.atomXtermSaveProfileModel);
        model.panel = jasmine.createSpyObj('panel', ['isVisible', 'hide']);
        model.panel.isVisible.and.returnValue(true);
        model.close('foo');
        expect(model.panel.hide).toHaveBeenCalled();
        expect(model.atomXtermSaveProfileModel.promptForNewProfileName).not.toHaveBeenCalled();
    });

    it('close() reprompt panel is not visible', () => {
        let model = new AtomXtermOverwriteProfileModel(this.atomXtermSaveProfileModel);
        model.panel = jasmine.createSpyObj('panel', ['isVisible', 'hide']);
        model.panel.isVisible.and.returnValue(false);
        model.close('foo', true);
        expect(model.panel.hide).not.toHaveBeenCalled();
        expect(model.atomXtermSaveProfileModel.promptForNewProfileName).not.toHaveBeenCalled();
    });

    it('close() reprompt panel is visible', () => {
        let model = new AtomXtermOverwriteProfileModel(this.atomXtermSaveProfileModel);
        model.panel = jasmine.createSpyObj('panel', ['isVisible', 'hide']);
        model.panel.isVisible.and.returnValue(true);
        model.close('foo', true);
        expect(model.panel.hide).toHaveBeenCalled();
        expect(model.atomXtermSaveProfileModel.promptForNewProfileName).toHaveBeenCalled();
    });

    it('promptOverwrite() panel is shown', () => {
        let model = new AtomXtermOverwriteProfileModel(this.atomXtermSaveProfileModel);
        model.panel = jasmine.createSpyObj('panel', ['show', 'isVisible', 'hide']);
        model.panel.isVisible.and.returnValue(true);
        model.element = jasmine.createSpyObj('atomXtermDeleteProfileElement', ['setNewPrompt']);
        model.promptOverwrite('foo', 'bar');
        expect(model.panel.show).toHaveBeenCalled();
    });

    it('promptOverwrite() new prompt is set', () => {
        let model = new AtomXtermOverwriteProfileModel(this.atomXtermSaveProfileModel);
        model.panel = jasmine.createSpyObj('panel', ['show', 'isVisible', 'hide']);
        model.panel.isVisible.and.returnValue(true);
        model.element = jasmine.createSpyObj('atomXtermDeleteProfileElement', ['setNewPrompt']);
        model.promptOverwrite('foo', 'bar');
        expect(model.element.setNewPrompt).toHaveBeenCalled();
    });
});
