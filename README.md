# cyclejs-create-streams-group
Utility for CycleJS framework for reducing boilerplate when creating groups of streams.

## Why may I need it?
Usually in CycleJS application or component you want to create more than one stream, especially for intent and model parts. It's 100% possible to do it with pure JS, but it requires a lot of boilerplate code. This utility covers common case and lets creating complicated programs easily.

## Example usage

Let's say, you want to create simple application, that allows to add two numbers. With pure JS and Cycle you can do it like that:

```javascript
import { createStream, render, h, Rx } from 'cyclejs';

let a = createStream((changeA$) => changeA$
   .map((value) => parseInt(value, 10))
   .filter((value) => !isNaN(value))
   .distinctUntilChanged()
);

let b = createStream((changeB$) => changeB$
   .map((value) => parseInt(value, 10))
   .filter((value) => !isNaN(value))
   .distinctUntilChanged()
);

let c = createStream((a$, b$) => Rx.Observable.combineLatest(
  a$,
  b$,
  (a, b) => a + b
));

let vtree$ = createStream((a$, b$, c$) =>
  Rx.Observable.combineLatest(a$, b$, c$, (a, b, c) =>
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

let changeA$ = createStream((interaction$) =>
  interaction$
    .choose('#a', 'input')
    .map(({ target }) => target.value)
);

let changeA$ = createStream((interaction$) =>
  interaction$
    .choose('#b', 'input')
    .map(({ target }) => target.value)
);

let interaction$ = createStream((vtree$) => render(vtree$, document.body).interaction$);

a$.inject(changeA$);
b$.inject(changeB$);
c$.inject(a$, b$);
vtree$.inject(a$, b$, c$);
interaction$.inject(vtree$);
changeA$.inject(interaction$);
changeB$.inject(interaction$);
```
