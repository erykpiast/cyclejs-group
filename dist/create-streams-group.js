'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } };

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

exports['default'] = createStreamsGroup;

require('core-js/fn/object/entries');

var _createStream = require('cyclejs');

var _mapValues = require('map-values');

var _mapValues2 = _interopRequireDefault(_mapValues);

var _mergeObjects = require('merge-object');

var _mergeObjects2 = _interopRequireDefault(_mergeObjects);

var _getParametersNames = require('get-parameter-names');

var _getParametersNames2 = _interopRequireDefault(_getParametersNames);

'use strict';

function _makeInjectFn(streamWithDependencies) {
    return function inject() {
        for (var _len = arguments.length, inputObjects = Array(_len), _key = 0; _key < _len; _key++) {
            inputObjects[_key] = arguments[_key];
        }

        var combinedInputObject = inputObjects.length === 1 ? inputObjects[0] : inputObjects.reduce(_mergeObjects2['default'], {});

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = Object.entries(streamWithDependencies)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var _step$value = _slicedToArray(_step.value, 2);

                var _step$value$1 = _step$value[1];
                var dependencies = _step$value$1.dependencies;
                var stream = _step$value$1.stream;

                var streamDependencies = dependencies.map(function (dependencyName) {
                    if (!combinedInputObject.hasOwnProperty(dependencyName)) {
                        throw new Error('Dependency "' + dependencyName + '" is not available!');
                    }

                    return combinedInputObject[dependencyName];
                });

                stream.inject.apply(stream, _toConsumableArray(streamDependencies));
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator['return']) {
                    _iterator['return']();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
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
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = Object.entries(group)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var _step2$value = _slicedToArray(_step2.value, 2);

                var stream = _step2$value[1];

                stream.dispose();
            }
        } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                    _iterator2['return']();
                }
            } finally {
                if (_didIteratorError2) {
                    throw _iteratorError2;
                }
            }
        }
    };
}

function createStreamsGroup(definition) {
    var streamsDefs = 'function' === typeof definition ? definition() : definition;

    if ('object' !== typeof streamsDefs || streamsDefs === null || Array.isArray(streamsDefs)) {
        throw new TypeError('Cycle Streams Group must be an object.');
    }

    if (this instanceof createStreamsGroup) {
        // jshint ignore:line
        throw new Error('Cannot use `new` operator on `createStreamsGroup()`, it is not a constructor.');
    }

    var streamsWithDeps = _mapValues2['default'](streamsDefs, function (streamFn) {
        return {
            dependencies: _getParametersNames2['default'](streamFn),
            stream: _createStream.createStream(streamFn)
        };
    });

    var group = _mapValues2['default'](streamsWithDeps, function (_ref) {
        var stream = _ref.stream;
        return stream;
    });

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

module.exports = exports['default'];