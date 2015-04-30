'use strict';

import { createStream } from 'cyclejs';
import mapValues from 'map-values';
import getParametersNames from 'get-parameter-names';


function _makeInjectFn(streamWithDependencies) {
    return function inject(inputObj) {
        for(let [ , { dependencies, stream } ] of Object.entries(streamWithDependencies)) {
            let streamDependencies = dependencies.map((dependencyName) => {
                if(!inputObj.hasOwnProperty(dependencyName)) {
                    throw new Error(`Dependency "${dependencyName}" is not available!`);
                }
                
                return inputObj[dependencyName];
            });

            stream.inject(...streamDependencies);
        }
        
        return inputObj;
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

