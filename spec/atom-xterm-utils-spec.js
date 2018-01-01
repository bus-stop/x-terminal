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

import AtomXtermModel from '../lib/atom-xterm-model';
import * as utils from '../lib/atom-xterm-utils';

describe('Utilities', () => {
    it('isAtomXtermModel() item is not AtomXtermModel', () => {
        let item = document.createElement('div');
        expect(utils.isAtomXtermModel(item)).toBe(false);
    });

    it('isAtomXtermModel() item is AtomXtermModel', () => {
        let item = new AtomXtermModel({
            'uri': 'atom-xterm://',
            'terminals_set': new Set
        });
        expect(utils.isAtomXtermModel(item)).toBe(true);
    });

    it('clearDiv()', () => {
        let div = document.createElement('div');
        for (let i = 0; i < 10; i++) {
            div.appendChild(document.createElement('div'));
        }
        utils.clearDiv(div);
        expect(div.childElementCount).toBe(0);
    });

    it('clearDiv() empty div', () => {
        let div = document.createElement('div');
        utils.clearDiv(div);
        expect(div.childElementCount).toBe(0);
    });

    it('createHorizontalLine()', () => {
        let hLine = utils.createHorizontalLine();
        expect(hLine.tagName).toBe('DIV');
        expect(hLine.classList.contains('atom-xterm-profile-menu-element-hline')).toBe(true);
        expect(hLine.textContent).toBe('.');
    });
});
