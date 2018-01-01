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

import AtomXtermDeleteProfileElement from '../lib/atom-xterm-delete-profile-element';

describe('AtomXtermDeleteProfileElement', () => {
    this.model;

    beforeEach(() => {
        this.model = jasmine.createSpyObj('model', ['setElement']);
    });

    it('initialize()', () => {
        let element = new AtomXtermDeleteProfileElement;
        element.initialize(this.model);
        expect(element.promptButtonsDiv.childElementCount).toBe(0);
    });

    it('setNewPrompt()', () => {
        let element = new AtomXtermDeleteProfileElement;
        element.initialize(this.model);
        let profileName = 'foo';
        let confirmHandler = () => {};
        let cancelHandler = () => {};
        element.setNewPrompt(profileName, confirmHandler, cancelHandler);
        expect(element.messageDiv.textContent).toBe('Delete existing profile \'foo\'?');
    });
});
