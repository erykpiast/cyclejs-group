# cyclejs-group
Utility for the [Cycle.js framework](https://github.com/staltz/cycle) for reducing
boilerplate when creating many dependent streams.

## Why may I need it?
Usually in a Cycle.js application or component you want to create more than one stream,
especially for intent and model parts. It's 100% possible to do it with pure JS,
but it requires a lot of boilerplate code when different streams depend on each other.
This utility covers common case and makes creating complicated programs easier.

## Example usage

Let's say, you want to create simple application, that allows you to add two numbers.
With pure Cycle.js and [cyclejs-stream](https://github.com/erykpiast/cyclejs-stream) you can do it like this:

```javascript
import { Rx, run } from '@cycle/core';
import { makeDOMDriver, h } from '@cycle/dom';
import createStream from 'cyclejs-stream';

let a$ = createStream((changeA$) =>
  changeA$
    .map(value => parseInt(value, 10))
    .filter(value => !isNaN(value))
    .startWith(1)
    .distinctUntilChanged()
);

let b$ = createStream((changeB$) =>
  changeB$
    .map(value => parseInt(value, 10))
    .filter(value => !isNaN(value))
    .startWith(1)
    .distinctUntilChanged()
);

let c$ = createStream((a$, b$) =>
  Rx.Observable.combineLatest(
    a$, b$,
    (a, b) =>
      a + b
));

let vtree$ = createStream((a$, b$, c$) =>
  Rx.Observable.combineLatest(
    a$, b$, c$,
    (a, b, c) =>
    h('form',
      h('fieldset', [
        h('legend', 'Add two numbers'),
        h('input#a', {
          type: 'number',
          value: a,
        }),
        h('input#b', {
          type: 'number',
          value: b,
        }),
        h('output', {
          value: c,
          htmlFor: 'a,b'
        })
      ])
    )
  )
);

let changeA$ = createStream((interactions) =>
   interactions
    .get('#a', 'input')
    .map(({ target }) => target.value)
);

let changeA$ = createStream((interactions) =>
  interactions
    .get('#b', 'input')
    .map(({ target }) => target.value)
);

run(({ DOM }) => {
  a$.inject(changeA$);
  b$.inject(changeB$);
  c$.inject(a$, b$);
  vtree$.inject(a$, b$, c$);
  changeA$.inject(DOM);
  changeB$.inject(DOM);
  
  return {
    DOM: vtree$
  };
}, {
  dom: makeDomDriver('.js-container')
});

```

Seems easy for now, but when streams number grows, amount of boilerplate will grow proportionally.
With `createGroup` you can achieve the same effect in more compact way and create batch of streams from plain functions.
Thanks to `inject` method of the group, you can make streams form one group available for streams from another one.
Connection is detected based on names of function parameters and keys of the group object. The whole concept of grouping
streams can help with separation of concerns and increase readability of your code.

```javascript
import { Rx, run } from '@cycle/core';
import { makeDOMDriver, h } from '@cycle/dom';
import createGroup from 'cyclejs-group';

let model = createGroup({
  a$: (changeA$) =>
    changeA$
      .map(value => parseInt(value, 10))
      .filter(value => !isNaN(value))
      .startWith(1)
      .distinctUntilChanged()
  b$: (changeB$) =>
    changeB$
      .map(value => parseInt(value, 10))
      .filter(value => !isNaN(value))
      .startWith(1)
      .distinctUntilChanged(),
  c$: (a$, b$) =>
    Rx.Observable.combineLatest(
      a$, b$,
      (a, b) =>
        a + b
  )
});

let intent = createGroup({
  changeA$: (interactions) =>
    interactions
      .get('#a', 'input')
      .map(({ target }) => target.value),
  changeB$: (interactions) =>
    interactions
      .get('#b', 'input')
      .map(({ target }) => target.value)
});

let view = createGroup({
  vtree$: (a$, b$, c$) =>
    Rx.Observable.combineLatest(
      a$, b$, c$,
      (a, b, c) =>
        h('form',
          h('fieldset', [
            h('legend', 'Add two numbers'),
              h('input#a', {
                type: 'number',
                value: a,
              }),
              h('input#b', {
                type: 'number',
                value: b,
              }),
              h('output', {
                value: c,
                htmlFor: 'a,b'
              })
            ]
          )
        )
    )
});

run(({ DOM }) => {
  model.inject(intent, model); // self-injection to make a$ and b$ available for c$
  view.inject(model);
  intent.inject({ interactions: DOM });

  return {
    DOM: view.vtree$
  };
}, {
  dom: makeDomDriver('.js-container')
});
```
