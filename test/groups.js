'use strict';
/* global describe, it */
let assert = require('assert');
let Cycle = require('cyclejs');
let {Rx} = Cycle;
let createStreamsGroup = require('../src/streams-group');

describe('createStreamsGroup', function () {
  it('should throw an error when given no arguments', function () {
    assert.throws(() => createStreamsGroup(),
      /Cycle Streams Group must be an object./i);
  });

  it('should throw an error when used as a constructor', function () {
    assert.throws(() => new createStreamsGroup({}), /Cannot use `new`/i);
  });

  it('should only accept one function or one object as parameter', function () {
    assert.throws(() => createStreamsGroup(['foo$', 'bar$']),
      'Cycle Streams Group cannot be an array, must be an object.');
    assert.throws(() => createStreamsGroup('foo$'),
      'Cycle Streams Group must be an object.');
    assert.throws(() => createStreamsGroup(12345),
      'Cycle Streams Group must be an object.');
    assert.doesNotThrow(() => createStreamsGroup({foo$: () => Rx.Observable.just(1)}));
  });

  it('should throw an error when definitionFn doesn\'t return object', function () {
    assert.throws(() => createStreamsGroup(() => 'not a fn'),
      'Cycle Streams Group must be an object.');
    assert.throws(() => createStreamsGroup(() => 12345),
      'Cycle Streams Group must be an object.');
  });

  it('should return an injectable disposable object of Rx.Observables', function () {
    var stream = createStreamsGroup({
      foo$: (asd$) => asd$.map(x => 3 * x),
      bar$: (lol$) => lol$.map(x => 5 * x)
    });
    assert.strictEqual(typeof stream, 'object');
    assert.strictEqual(typeof stream.foo$, 'object');
    assert.strictEqual(typeof stream.bar$, 'object');
    assert.strictEqual(typeof stream.foo$.subscribe, 'function');
    assert.strictEqual(typeof stream.bar$.subscribe, 'function');
    assert.strictEqual(typeof stream.inject, 'function');
    assert.strictEqual(typeof stream.dispose, 'function');
  });
});

describe('Groups', function () {
  it('should be injectable with a simple object of Observables', function (done) {
    let group = createStreamsGroup({
      foo$: (asd$) => asd$.map(x => 3 * x),
      bar$: (lol$) => lol$.map(x => 5 * x)
    });
    let inputs = {
      asd$: Rx.Observable.just(2),
      lol$: Rx.Observable.just(4)
    };
    Rx.Observable.combineLatest(group.foo$, group.bar$, (foo, bar) => [foo, bar])
    .subscribe(([foo, bar]) => {
      assert.strictEqual(foo, 6);
      assert.strictEqual(bar, 20);
      done();
    });
    group.inject(inputs);
  });

  it('should be injectable with another Group', function (done) {
    let group1 = createStreamsGroup({
      foo$: (asd$) => asd$.map(x => 3 * x),
      bar$: (lol$) => lol$.map(x => 5 * x)
    });
    let group2 = createStreamsGroup({
      asd$: () => Rx.Observable.just(2),
      lol$: () => Rx.Observable.just(4)
    });
    Rx.Observable.combineLatest(group1.foo$, group1.bar$, (foo, bar) => [foo, bar])
      .subscribe(([foo, bar]) => {
        assert.strictEqual(foo, 6);
        assert.strictEqual(bar, 20);
        done();
      });
    group1.inject(group2);
  });

  it('should be circularly injectable with another Group', function (done) {
    let group1 = createStreamsGroup({
      foo$: (asd$) => asd$.map(x => 3 * x).delay(80).shareReplay(1)
    });
    let group2 = createStreamsGroup({
      asd$: (foo$) => foo$.map(x => 5 * x).delay(100).startWith(2)
    });
    group2.asd$.elementAt(2).subscribe(x => {
      assert.strictEqual(x, 2 * 3 * 5 * 3 * 5);
      done();
      group1.dispose();
      group2.dispose();
    });
    group2.inject(group1).inject(group2);
  });

  it('should not operate after dispose() has been called', function (done) {
    let first$ = Rx.Observable.interval(100).map(x => x + 1).take(6);
    var group = createStreamsGroup({
      second$: first$ => first$.map(x => x * 10)
    });
    group.inject({first$});
    group.second$.subscribe(function (x) {
      assert.notStrictEqual(x, 30);
    });
    setTimeout(function () { group.dispose(); }, 250);
    setTimeout(function () { done(); }, 400);
  });

  describe('injection', function () {
    it('should return the same given input', function () {
      let group = createStreamsGroup({
        foo$: (asd$) => asd$.map(x => 3 * x),
        bar$: (lol$) => lol$.map(x => 5 * x)
      });
      let inputs = {
        asd$: Rx.Observable.just(2),
        lol$: Rx.Observable.just(4)
      };
      let outputs = group.inject(inputs);
      assert.strictEqual(typeof outputs, 'object');
      assert.strictEqual(outputs.asd$, inputs.asd$);
      assert.strictEqual(outputs.lol$, inputs.lol$);
    });

    it('should return an array when given multiple inputs', function () {
      let group = createStreamsGroup({
        foo$: (asd$) => asd$.map(x => 3 * x),
        bar$: (lol$) => lol$.map(x => 5 * x)
      });
      let input1 = {
        asd$: Rx.Observable.just(2)
      };
      let input2 = {
        lol$: Rx.Observable.just(4)
      };
      let outputs = group.inject(input1, input2);
      assert.strictEqual(Array.isArray(outputs), true);
      assert.strictEqual(outputs.length, 2);
      assert.strictEqual(typeof outputs[0].asd$.subscribe, 'function');
      assert.strictEqual(typeof outputs[1].lol$.subscribe, 'function');
      assert.strictEqual(outputs[0].asd$, input1.asd$);
      assert.strictEqual(outputs[1].lol$, input2.lol$);
    });
  });
});
