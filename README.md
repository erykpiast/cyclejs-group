# cyclejs-group
Utility for the [Cycle.js framework](https://github.com/staltz/cycle) for reducing boilerplate when creating groups of streams.

## Why may I need it?
Usually in a Cycle.js application or component you want to create more than one stream, especially for intent and model parts. It's 100% possible to do it with pure JS, but it requires a lot of boilerplate code. This utility covers common case and makes creating complicated programs easier.

## Example usage

Let's say, you want to create simple application, that allows you to add two numbers. With pure Cycle.js you can do it like this:

```javascript
import { createStream, render, h, Rx } from 'cyclejs';

let a$ = createStream((changeA$) => changeA$
    .map(value => parseInt(value, 10))
    .filter(value => !isNaN(value))
    .startWith(1)
    .distinctUntilChanged()
);

let b$ = createStream((changeB$) => changeB$
    .map(value => parseInt(value, 10))
    .filter(value => !isNaN(value))
    .startWith(1)
    .distinctUntilChanged()
);

let c = createStream((a$, b$) => Rx.Observable.combineLatest(
    a$, b$,
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

Seems easy for now, but when streams number grows, amount of boilerplate will grow proportionally. With `createGroup` you can achieve the same effect in more compact way and create batch of streams from plain functions. Thanks to `inject` method of the group, you can make streams form one group available for streams from another one. Connection is detected based on names of function parameters and keys of the group object.

```javascript
import { createStream, render, h, Rx } from 'cyclejs';
import createGroup from 'cyclejs-group';

let model = createGroup({
    a$: (changeA$) => changeA$
        .map(value => parseInt(value, 10))
        .filter(value => !isNaN(value))
        .startWith(1)
        .distinctUntilChanged()
    b$: (changeB$) => changeB$
        .map(value => parseInt(value, 10))
        .filter(value => !isNaN(value))
        .startWith(1)
        .distinctUntilChanged(),
    c$: (a$, b$) => Rx.Observable.combineLatest(
        a$, b$,
        (a, b) => a + b
  )
});

let intent = createGroup({
    changeA$: (interaction$) => interaction$
        .choose('#a', 'input')
        .map(({ target }) => target.value),
    changeB$: (interaction$) => interaction$
        .choose('#b', 'input')
        .map(({ target }) => target.value)
});

let view = createGroup({
    vtree$: (a$, b$, c$) => Rx.Observable.combineLatest(
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

let user = createGroup({
    interaction$: (vtree$) => render(vtree$, document.body).interaction$
});

model.inject(intent, model); // self-injection to make a$ and b$ available for c$
view.inject(model);
user.inject(view);
intent.inject(user);
```
