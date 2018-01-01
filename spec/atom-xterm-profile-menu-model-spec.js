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

import { AtomXtermProfileMenuModel } from '../lib/atom-xterm-profile-menu-model';

describe('AtomXtermProfileMenuModel', () => {
    this.atomXtermModel;

    beforeEach(() => {
        this.atomXtermModel = jasmine.createSpyObj('atomXtermModel', ['getElement']);
    });

    it('constructor()', () => {
        let model = new AtomXtermProfileMenuModel(this.atomXtermModel);
        expect(model).not.toBeUndefined();
    });

    it('destroy() no element set', () => {
        let model = new AtomXtermProfileMenuModel(this.atomXtermModel);
        model.destroy();
    });

    it('destroy() element set', () => {
        let model = new AtomXtermProfileMenuModel(this.atomXtermModel);
        model.element = jasmine.createSpyObj('element', ['destroy']);
        model.destroy();
        expect(model.element.destroy).toHaveBeenCalled();
    });

    it('getTitle()', () => {
        let model = new AtomXtermProfileMenuModel(this.atomXtermModel);
        expect(model.getTitle()).toBe('Atom Xterm Profile Menu');
    });

    it('getElement()', () => {
        let model = new AtomXtermProfileMenuModel(this.atomXtermModel);
        expect(model.getElement()).toBeUndefined();
    });

    it('setElement()', () => {
        let model = new AtomXtermProfileMenuModel(this.atomXtermModel);
        let mock = jasmine.createSpy('element');
        model.setElement(mock);
        expect(model.getElement()).toBe(mock);
    });

    it('getAtomXtermModelElement()', () => {
        let model = new AtomXtermProfileMenuModel(this.atomXtermModel);
        model.getAtomXtermModelElement();
        expect(model.atomXtermModel.getElement).toHaveBeenCalled();
    });
});
