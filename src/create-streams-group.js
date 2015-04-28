import { createStream } from 'cyclejs';
import each from 'foreach';
import mapValues from 'map-values';
import getParametersNames from 'get-parameter-names';


export default function createStreamsGroup(definition) {
    let streams = ('function' === typeof definition) ?
        definition() :
        definition;

    if(('object' !== typeof streams) || (streams === null)) {
        throw new TypeError('streams group has to be an object');
    }

    streams = mapValues(streams, (streamFn) => ({
        deps: getParametersNames(streamFn),
        stream: createStream(streamFn)
    }));

    let inject = function() {
        // merge all injectable collections, including own ones
        let toInject = mapValues(streams, ({ stream }) => stream);

        for(var i = 0, maxi = arguments.length; i < maxi; i++) {
            each(arguments[i], (injectable, injectableName) => {
                if(toInject.hasOwnProperty(injectableName)) {
                    throw new Error(`injectable "${injectableName}" is duplicated!`);
                }

                toInject[injectableName] = injectable;
            });
        }

        each(streams, ({ deps, stream }) => {
            let streamDeps = deps.map((depName) => {
                if(!toInject.hasOwnProperty(depName)) {
                    throw new Error(`dependency "${depName}" is not available!"`);
                }

                /*
                if('function' === typeof toInject[depName].tap) {
                    return toInject[depName]
                        .tap(console.log.bind(console, depName));
                } else if('function' === typeof toInject[depName].choose) {
                    return {
                        choose: (selector, event) =>
                            toInject[depName]
                                .choose(selector, event)
                                .tap(console.log.bind(console, `${selector}@${event}`))
                    };
                } else {
                    return toInject[depName];
                }
                /*/
                return toInject[depName];
                //*/
            });

            stream.inject.apply(stream, streamDeps);
        });
    };

    let exports = mapValues(streams, ({ stream }) => stream);
    // add `inject` as not enumerable property to make it not visible for `each` function
    Object.defineProperty(exports, 'inject', {
        enumerable: false,
        value: inject
    });
    Object.freeze(exports);

    return exports;
}
