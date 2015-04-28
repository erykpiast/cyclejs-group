'use strict';

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports['default'] = createStreamsGroup;

var _createStream = require('cyclejs');

var _each = require('foreach');

var _each2 = _interopRequireDefault(_each);

var _mapValues = require('map-values');

var _mapValues2 = _interopRequireDefault(_mapValues);

var _getParametersNames = require('get-parameter-names');

var _getParametersNames2 = _interopRequireDefault(_getParametersNames);

function createStreamsGroup(definition) {
    var streams = 'function' === typeof definition ? definition() : definition;

    if ('object' !== typeof streams || streams === null) {
        throw new TypeError('streams group has to be an object');
    }

    streams = _mapValues2['default'](streams, function (streamFn) {
        return {
            deps: _getParametersNames2['default'](streamFn),
            stream: _createStream.createStream(streamFn)
        };
    });

    var inject = function inject() {
        // merge all injectable collections, including own ones
        var toInject = _mapValues2['default'](streams, function (_ref) {
            var stream = _ref.stream;
            return stream;
        });

        for (var i = 0, maxi = arguments.length; i < maxi; i++) {
            _each2['default'](arguments[i], function (injectable, injectableName) {
                if (toInject.hasOwnProperty(injectableName)) {
                    throw new Error('injectable "' + injectableName + '" is duplicated!');
                }

                toInject[injectableName] = injectable;
            });
        }

        _each2['default'](streams, function (_ref2) {
            var deps = _ref2.deps;
            var stream = _ref2.stream;

            var streamDeps = deps.map(function (depName) {
                if (!toInject.hasOwnProperty(depName)) {
                    throw new Error('dependency "' + depName + '" is not available!"');
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

    var exports = _mapValues2['default'](streams, function (_ref3) {
        var stream = _ref3.stream;
        return stream;
    });
    // add `inject` as not enumerable property to make it not visible for `each` function
    Object.defineProperty(exports, 'inject', {
        enumerable: false,
        value: inject
    });
    Object.freeze(exports);

    return exports;
}

module.exports = exports['default'];