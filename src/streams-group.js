'use strict';

let createStream;
function getCreateStream() {
  return createStream || (createStream = require('cyclejs').createStream);
}

const COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
function getParameterNames(fn) {
  let code = fn.toString().replace(COMMENTS, '');
  let result = code.slice(code.indexOf('(') + 1, code.indexOf(')'))
    .match(/([^\s,]+)/g);
  return result === null ? [] : result;
}

function mapValues(obj, map) {
  var result = {};
  for (var key in obj) { if (obj.hasOwnProperty(key)) {
    result[key] = map(obj[key], key);
  }}
  return result;
}

function mergeObject(acc, obj) {
  for (let key in obj) { if (obj.hasOwnProperty(key)) {
    acc[key] = obj[key];
  }}
  return acc;
}

function makeInjectFn(streamsWithDeps) {
  return function inject(...inputObjects) {
    let combinedInputObject = inputObjects.length === 1 ?
      inputObjects[0] :
      inputObjects.reduce(mergeObject, {});
    for (let key in streamsWithDeps) { if (streamsWithDeps.hasOwnProperty(key)) {
      let {dependencies, stream} = streamsWithDeps[key];
      let streamDependencies = dependencies.map((dependencyName) => {
        if (!combinedInputObject.hasOwnProperty(dependencyName)) {
          throw new Error(`Dependency "${dependencyName}" is not available!"`);
        }
        return combinedInputObject[dependencyName];
      });
      stream.inject.apply(stream, streamDependencies);
    }}
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
    for (var streamName in group) { if (group.hasOwnProperty(streamName)) {
      let stream = group[streamName];
      stream.dispose();
    }}
  };
}

export default function createStreamsGroup(definition) {
  let streamDefs = (typeof definition === 'function') ? definition() : definition;
  if (Array.isArray(streamDefs)) {
    throw new TypeError('Cycle Streams Group cannot be an array, must be an object.');
  }
  if (typeof streamDefs !== 'object' || streamDefs === null) {
    throw new TypeError('Cycle Streams Group must be an object.');
  }
  if (this instanceof createStreamsGroup) { // jshint ignore:line
    throw new Error('Cannot use `new` on `createStreamsGroup()`, it is not a ' +
      'constructor.');
  }

  let createStream = getCreateStream();
  let streamsWithDeps = mapValues(streamDefs, (streamFn) => ({
    dependencies: getParameterNames(streamFn),
    stream: createStream(streamFn)
  }));
  let group = mapValues(streamsWithDeps, ({stream}) => stream);
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

