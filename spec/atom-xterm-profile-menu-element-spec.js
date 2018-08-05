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

import { AtomXtermProfileMenuElement } from '../src/lib/atom-xterm-profile-menu-element'

describe('AtomXtermProfileMenuElement', () => {
  this.element = null

  beforeEach((done) => {
    let model = jasmine.createSpyObj(
      'atomXtermProfileMenuModel',
      [
        'setElement',
        'getAtomXtermModel',
        'getAtomXtermModelElement'
      ]
    )
    model.atomXtermModel = jasmine.createSpyObj(
      'atomXtermModel',
      [
        'getProfile',
        'applyProfileChanges'
      ]
    )
    model.atomXtermModel.getProfile.and.returnValue({})
    model.atomXtermModel.profile = {}
    let mock = jasmine.createSpyObj(
      'atomXtermElement',
      [
        'restartPtyProcess',
        'hideTerminal',
        'showTerminal',
        'focusOnTerminal'
      ]
    )
    model.getAtomXtermModel.and.returnValue(model.atomXtermModel)
    model.getAtomXtermModelElement.and.returnValue(mock)
    this.element = new AtomXtermProfileMenuElement()
    this.element.initialize(model)
    this.element.initializedPromise.then(() => {
      done()
    })
  })

  it('initialize()', (done) => {
    this.element.initializedPromise.then(() => {
      done()
    })
  })

  it('destroy() disposables not set', () => {
    this.element.disposables = null
    this.element.destroy()
  })

  it('destroy() disposables is set', () => {
    this.element.disposables = jasmine.createSpyObj(
      'disposables',
      [
        'dispose'
      ]
    )
    this.element.destroy()
    expect(this.element.disposables.dispose).toHaveBeenCalled()
  })

  it('getModelProfile()', () => {
    let mock = jasmine.createSpy('mock')
    this.element.model.atomXtermModel.profile = mock
    expect(this.element.getModelProfile()).toBe(mock)
  })

  it('parseJson() array type', () => {
    let expected = ['foo']
    let actual = this.element.parseJson(
      '["foo"]',
      null,
      Array
    )
    expect(actual).toEqual(expected)
  })

  it('parseJson() object type', () => {
    let expected = {'foo': 'bar'}
    let actual = this.element.parseJson(
      '{"foo": "bar"}',
      null,
      Object
    )
    expect(actual).toEqual(expected)
  })

  it('parseJson() default value', () => {
    let expected = ['foo']
    let actual = this.element.parseJson(
      'null',
      expected,
      Array
    )
    expect(actual).toEqual(expected)
  })

  it('parseJson() syntax error', () => {
    let actual = this.element.parseJson(
      '[[',
      'foo',
      Array
    )
    expect(actual).toBe('foo')
  })

  it('getMenuElements()', () => {
    expect(this.element.getMenuElements()).toBeTruthy()
  })

  it('getProfileMenuSettings()', () => {
    let expected = this.element.profilesSingleton.getBaseProfile()
    let actual = this.element.getProfileMenuSettings()
    expect(actual).toEqual(expected)
  })

  it('applyProfileChanges()', () => {
    this.element.applyProfileChanges('foo')
    expect(this.element.model.getAtomXtermModel().applyProfileChanges).toHaveBeenCalledWith('foo')
  })

  it('applyProfileChanges() profile menu hidden', () => {
    spyOn(this.element, 'hideProfileMenu')
    this.element.applyProfileChanges('foo')
    expect(this.element.hideProfileMenu).toHaveBeenCalled()
  })

  it('restartTerminal()', () => {
    this.element.restartTerminal()
    expect(this.element.model.getAtomXtermModelElement().restartPtyProcess).toHaveBeenCalled()
  })

  it('restartTerminal() profile menu hidden', () => {
    spyOn(this.element, 'hideProfileMenu')
    this.element.restartTerminal()
    expect(this.element.hideProfileMenu).toHaveBeenCalled()
  })

  it('createMenuItemContainer() check id', () => {
    let container = this.element.createMenuItemContainer('foo', 'bar', 'baz')
    expect(container.getAttribute('id')).toBe('foo')
  })

  it('createMenuItemContainer() check title', () => {
    let container = this.element.createMenuItemContainer('foo', 'bar', 'baz')
    let titleDiv = container.querySelector('.atom-xterm-profile-menu-item-title')
    expect(titleDiv.textContent).toBe('bar')
  })

  it('createMenuItemContainer() check description', () => {
    let container = this.element.createMenuItemContainer('foo', 'bar', 'baz')
    let descriptionDiv = container.querySelector('.atom-xterm-profile-menu-item-description')
    expect(descriptionDiv.textContent).toBe('baz')
  })

  it('createProfilesDropDownSelectItem() check id', (done) => {
    this.element.createProfilesDropDownSelectItem().then((select) => {
      expect(select.getAttribute('id')).toBe('profiles-dropdown')
      done()
    })
  })

  it('createProfilesDropDownSelectItem() check classList', (done) => {
    this.element.createProfilesDropDownSelectItem().then((select) => {
      expect(select.classList.contains('atom-xterm-profile-menu-item-select')).toBe(true)
      done()
    })
  })

  it('createProfilesDropDown()', (done) => {
    this.element.createProfilesDropDown().then((menuItemContainer) => {
      expect(menuItemContainer.getAttribute('id')).toBe('profiles-selection')
      done()
    })
  })

  it('createProfileMenuButtons()', () => {
    let buttonsContainer = this.element.createProfileMenuButtons()
    expect(buttonsContainer.classList.contains('atom-xterm-profile-menu-buttons-div')).toBe(true)
  })

  it('createButton()', () => {
    let button = this.element.createButton()
    expect(button.classList.contains('atom-xterm-profile-menu-button')).toBe(true)
  })

  it('createTextbox()', () => {
    let menuItemContainer = this.element.createTextbox('foo', 'bar', 'baz', 'cat', 'dog')
    expect(menuItemContainer.getAttribute('id')).toBe('foo')
  })

  it('createCheckbox()', () => {
    let menuItemContainer = this.element.createCheckbox('foo', 'bar', 'baz', true, false)
    expect(menuItemContainer.getAttribute('id')).toBe('foo')
  })

  it('isVisible() initial value', () => {
    expect(this.element.isVisible()).toBe(false)
  })

  it('hideProfileMenu()', () => {
    this.element.hideProfileMenu()
    expect(this.element.style.visibility).toBe('hidden')
  })

  it('hideProfileMenu() terminal shown', () => {
    this.element.hideProfileMenu()
    expect(this.element.model.getAtomXtermModelElement().showTerminal).toHaveBeenCalled()
  })

  it('hideProfileMenu() terminal focused', () => {
    this.element.hideProfileMenu()
    expect(this.element.model.getAtomXtermModelElement().focusOnTerminal).toHaveBeenCalled()
  })

  it('showProfileMenu()', () => {
    this.element.showProfileMenu()
    expect(this.element.style.visibility).toBe('visible')
  })

  it('showProfileMenu() terminal hidden', () => {
    this.element.showProfileMenu()
    expect(this.element.model.getAtomXtermModelElement().hideTerminal).toHaveBeenCalled()
  })

  it('toggleProfileMenu() currently hidden', () => {
    spyOn(this.element, 'isVisible').and.returnValue(false)
    spyOn(this.element, 'showProfileMenu')
    this.element.toggleProfileMenu()
    expect(this.element.showProfileMenu).toHaveBeenCalled()
  })

  it('toggleProfileMenu() currently visible', () => {
    spyOn(this.element, 'isVisible').and.returnValue(true)
    spyOn(this.element, 'hideProfileMenu')
    this.element.toggleProfileMenu()
    expect(this.element.hideProfileMenu).toHaveBeenCalled()
  })

  it('getNewProfileAndChanges()', () => {
    spyOn(this.element, 'getProfileMenuSettings').and.returnValue({
      args: [
        '--foo',
        '--bar',
        '--baz'
      ]
    })
    this.element.model.atomXtermModel.getProfile.and.returnValue({
      command: 'somecommand'
    })
    let expected = {
      newProfile: {
        args: [
          '--foo',
          '--bar',
          '--baz'
        ]
      },
      profileChanges: {
        args: [
          '--foo',
          '--bar',
          '--baz'
        ]
      }
    }
    let actual = this.element.getNewProfileAndChanges()
    expect(actual).toEqual(expected)
  })

  it('loadProfile()', () => {
    spyOn(this.element, 'applyProfileChanges')
    this.element.loadProfile()
    expect(this.element.applyProfileChanges).toHaveBeenCalled()
  })

  it('saveProfile()', () => {
    spyOn(this.element, 'promptForNewProfileName')
    this.element.saveProfile()
    expect(this.element.promptForNewProfileName).toHaveBeenCalled()
  })

  it('deleteProfile() nothing selected', () => {
    spyOn(this.element, 'promptDelete')
    this.element.deleteProfile()
    expect(this.element.promptDelete).not.toHaveBeenCalled()
  })

  it('deleteProfile() option selected', () => {
    spyOn(this.element, 'promptDelete')
    let mock = jasmine.createSpy('mock')
    mock.options = [{'text': 'foo'}]
    mock.selectedIndex = 0
    spyOn(this.element.mainDiv, 'querySelector').and.returnValue(mock)
    this.element.deleteProfile()
    expect(this.element.promptDelete).toHaveBeenCalledWith('foo')
  })

  it('promptDelete()', (done) => {
    spyOn(this.element.deleteProfileModel, 'promptDelete').and.callFake((newProfile) => {
      expect(newProfile).toBe('foo')
      done()
    })
    this.element.promptDelete('foo')
  })

  it('promptForNewProfileName()', (done) => {
    spyOn(this.element.saveProfileModel, 'promptForNewProfileName').and.callFake((newProfile, profileChanges) => {
      expect(newProfile).toBe('foo')
      expect(profileChanges).toBe('bar')
      done()
    })
    this.element.promptForNewProfileName('foo', 'bar')
  })

  it('convertNullToEmptyString() value is null', () => {
    expect(this.element.convertNullToEmptyString(null)).toBe('')
  })

  it('convertNullToEmptyString() value is not null', () => {
    expect(this.element.convertNullToEmptyString('foo')).toBe('"foo"')
  })

  it('setNewMenuSettings()', () => {
    this.element.setNewMenuSettings(this.element.profilesSingleton.getBaseProfile())
  })

  it('setNewMenuSettings() clear = true', () => {
    this.element.setNewMenuSettings(this.element.profilesSingleton.getBaseProfile(), true)
  })
})
