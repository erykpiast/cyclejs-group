'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = createStreamsGroup;
'use strict';

var createStream = undefined;
function getCreateStream() {
  return createStream || (createStream = require('cyclejs').createStream);
}

var COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
function getParameterNames(fn) {
  var code = fn.toString().replace(COMMENTS, '');
  var result = code.slice(code.indexOf('(') + 1, code.indexOf(')')).match(/([^\s,]+)/g);
  return result === null ? [] : result;
}

function mapValues(obj, map) {
  var result = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = map(obj[key], key);
    }
  }
  return result;
}

function mergeObject(acc, obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      acc[key] = obj[key];
    }
  }
  return acc;
}

function makeInjectFn(streamsWithDeps) {
  return function inject() {
    for (var _len = arguments.length, inputObjects = Array(_len), _key = 0; _key < _len; _key++) {
      inputObjects[_key] = arguments[_key];
    }

    var combinedInputObject = inputObjects.length === 1 ? inputObjects[0] : inputObjects.reduce(mergeObject, {});
    for (var key in streamsWithDeps) {
      if (streamsWithDeps.hasOwnProperty(key)) {
        var _streamsWithDeps$key = streamsWithDeps[key];
        var dependencies = _streamsWithDeps$key.dependencies;
        var stream = _streamsWithDeps$key.stream;

        var streamDependencies = dependencies.map(function (dependencyName) {
          if (!combinedInputObject.hasOwnProperty(dependencyName)) {
            throw new Error('Dependency "' + dependencyName + '" is not available!"');
          }
          return combinedInputObject[dependencyName];
        });
        stream.inject.apply(stream, streamDependencies);
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

function makeDisposeFn(group) {
  return function dispose() {
    for (var streamName in group) {
      if (group.hasOwnProperty(streamName)) {
        var stream = group[streamName];
        stream.dispose();
      }
    }
  };
}

function createStreamsGroup(definition) {
  var streamDefs = typeof definition === 'function' ? definition() : definition;
  if (Array.isArray(streamDefs)) {
    throw new TypeError('Cycle Streams Group cannot be an array, must be an object.');
  }
  if (typeof streamDefs !== 'object' || streamDefs === null) {
    throw new TypeError('Cycle Streams Group must be an object.');
  }
  if (this instanceof createStreamsGroup) {
    // jshint ignore:line
    throw new Error('Cannot use `new` on `createStreamsGroup()`, it is not a ' + 'constructor.');
  }

  var createStream = getCreateStream();
  var streamsWithDeps = mapValues(streamDefs, function (streamFn) {
    return {
      dependencies: getParameterNames(streamFn),
      stream: createStream(streamFn)
    };
  });
  var group = mapValues(streamsWithDeps, function (_ref) {
    var stream = _ref.stream;
    return stream;
  });
  Object.defineProperty(group, 'dispose', {
    enumerable: false,
    value: makeDisposeFn(group)
  });
  Object.defineProperty(group, 'inject', {
    enumerable: false,
    value: makeInjectFn(streamsWithDeps)
  });
  return group;
}

module.exports = exports['default'];