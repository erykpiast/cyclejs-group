'use strict';

import 'babel/polyfill';

import { createStream } from 'cyclejs';
import mapValues from 'map-values';
import mergeObjects from 'merge-object';
import getParametersNames from 'get-parameter-names';


function _makeInjectFn(streamWithDependencies) {
    return function inject(...inputObjects) {
        let combinedInputObject = inputObjects.length === 1 ?
            inputObjects[0] :
            inputObjects.reduce(mergeObjects, {});

        for(let [ , { dependencies, stream } ] of Object.entries(streamWithDependencies)) {
            let streamDependencies = dependencies.map((dependencyName) => {
                if(!combinedInputObject.hasOwnProperty(dependencyName)) {
                    throw new Error(`Dependency "${dependencyName}" is not available!`);
                }

                return combinedInputObject[dependencyName];
            });

            stream.inject(...streamDependencies);
        }

        if (inputObjects.length === 1) {
            return inputObjects[0];
        } else if (inputObjects.length > 1) {
            return inputObjects;
        } else {
            return null;
        }
    };
}


function _makeDisposeFn(group) {
    return function dispose() {
        for (let [ , stream ] of Object.entries(group)) {
            stream.dispose();
        }
    };
}

export default function createStreamsGroup(definition) {
    let streamsDefs = ('function' === typeof definition) ?
        definition() :
        definition;

    if(('object' !== typeof streamsDefs) ||
        (streamsDefs === null) ||
        Array.isArray(streamsDefs)
    ) {
        throw new TypeError('Cycle Streams Group must be an object.');
    }

    if (this instanceof createStreamsGroup) { // jshint ignore:line
        throw new Error('Cannot use `new` operator on `createStreamsGroup()`, it is not a constructor.');
    }

    let streamsWithDeps = mapValues(streamsDefs, (streamFn) => ({
        dependencies: getParametersNames(streamFn),
        stream: createStream(streamFn)
    }));

    let group = mapValues(streamsWithDeps, ({ stream }) => stream);

    // add `inject` and `dispose` as not enumerable properties to make them
    // not visible for `each` function
    Object.defineProperty(group, 'inject', {
        enumerable: false,
        value: _makeInjectFn(streamsWithDeps)
    });

    Object.defineProperty(group, 'dispose', {
        enumerable: false,
        value: _makeDisposeFn(group)
    });

    Object.freeze(group);

    return group;
}

