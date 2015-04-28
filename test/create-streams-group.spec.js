/* global suite, test */

import chai from 'chai';
import { assert } from 'chai';

import createStreamsGroup from '../src/create-streams-group';

suite('API test', () => {

    test('Should be a function', () => {

        assert.isFunction(createStreamsGroup);

    });

    test('Should accept one argument', () => {

        assert.equal(createStreamsGroup.length, 1);

    });

});