'use strict';

var _require = require('./stream.js');

var createStream = _require.createStream;

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

function makeInjectFn(streamsWithDeps) {
  return function inject(inputObj) {
    for (var key in streamsWithDeps) {
      if (streamsWithDeps.hasOwnProperty(key)) {
        var _streamsWithDeps$key = streamsWithDeps[key];
        var dependencies = _streamsWithDeps$key.dependencies;
        var stream = _streamsWithDeps$key.stream;

        var streamDependencies = dependencies.map(function (dependencyName) {
          if (!inputObj.hasOwnProperty(dependencyName)) {
            throw new Error('Dependency "' + dependencyName + '" is not available!"');
          }
          return inputObj[dependencyName];
        });
        stream.inject.apply(stream, streamDependencies);
      }
    }
    return inputObj;
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

module.exports = {
  createStreamsGroup: createStreamsGroup
};