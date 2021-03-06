React Reflorp
=========================

Basically a simple ORM using [Refetch](https://github.com/heroku/react-refetch), but the data is stored in [Redux](https://github.com/reactjs/redux).

# Example project and demo

An example project can be found [here](https://github.com/tomat/reflorp), and the latest build of it should be live at http://reflorp.com

# Installation

Requires **React 0.14 or later** and [react-redux](https://github.com/reactjs/react-redux).

```
npm install --save react-reflorp
```

This assumes that you’re using [npm](http://npmjs.com/) package manager with a module bundler like [Webpack](http://webpack.github.io) or [Browserify](http://browserify.org/) to consume [CommonJS modules](http://webpack.github.io/docs/commonjs.html).

# Basic example

In the example code throughout this README we have a simple app with boards and notes. Each board has a number of notes,
and each note belongs to a single board. Both notes and boards have a unique `id` property, boards have a `title`
(string) property, and notes have a `summary` (string) property.

```javascript
// app.js
const configuration = {
  entities: {
    board: {
      plural: 'boards',
    },
    note: {
      parent: 'board',
      plural: 'notes',
    },
  },
  baseUrl: '/api', // is prepended to all URL:s
};
```

```javascript
// Board.js
import { reflorp, EntityState, EntityListState } from 'react-reflorp';

@reflorp(({ id }) => ({
  // fetch the board data: GET /api/boards/${id}
  board: { id, load: true },
}))
export default class Board extends Component {
  static propTypes = {
    id: PropTypes.string,
    board: PropTypes.instanceOf(EntityState),
  };

  render() {
    const { board } = this.props;

    if (board.pending) {
      return <div>Loading...</div>;
    }

    return (
      <div>
        <h1>{board.value.title}</h1>
      </div>
    );
  }
}
```

# Setup

First, add the `Container` with a configuration object as a child of the react-redux `Provider`:

```javascript
// app.js

import { Container as ReflorpContainer } from 'react-reflorp';

const configuration = {
  entities: {
    board: {
      plural: 'boards',
    },
    note: {
      parent: 'board',
      plural: 'notes',
    },
  },
  baseUrl: '/api', // is prepended to all URL:s
};

ReactDOM.render(
  <Provider store={store}>
    <ReflorpContainer configuration={configuration}>
      <App />
    </ReflorpContainer>
  </Provider>,
  document.getElementById('app')
);
```

Then, add the reducer:

```javascript
// reducers.js

import { reducer as reflorp } from 'react-reflorp';

export default {
  reflorp,
};
```

# Frontend

The `@reflorp` decorator corresponds to the `@connect` decorator from Refetch.

It takes a function mapping `props` and `context` to entities, and as a second argument an `options` object.

By default it just injects the available data from the redux store. With `load: true` it will actually go fetch the data
from the backend, and keep the component informed about that process.
 
The actual data and metadata is enclosed inside the `EntityState` and `EntityListState` abstractions, which are
described further down.

## Example: Loading and displaying

```javascript
// Board.js

import React, { PropTypes, Component } from 'react';
import { reflorp, EntityState, EntityListState } from 'react-reflorp';

@reflorp(({ id }) => ({
  // fetch the board data: GET /api/boards/${id}
  board: { id, load: true },
  // fetch the notes belonging to this board: GET /api/boards/${id}/notes
  notes: {
    parentId: id,
    load: true,
    // Sorts the notes.value property by id before they are sent to our component
    then: (notes) => (notes || null) && notes.sort((note1, note2) => note1.id > note2.id),
  },
}), { hideUntilLoaded: true })
export default class Board extends Component {
  static propTypes = {
    id: PropTypes.string,
    board: PropTypes.instanceOf(EntityState),
    notes: PropTypes.instanceOf(EntityListState),
  };

  render() {
    const { notes, board } = this.props;

    if (notes.pending || board.pending) {
      return <div>Loading...</div>;
    }

    return (
      <div>
        <h1>{board.value.title}</h1>
        <ul>
          {notes.value.map((note) => (
            <li>{note.summary}</li>
          ))}
        </ul>
        {notes.hasMore && (
          <button onClick={notes.more}>Load more notes...</button>
        )}
      </div>
    );
  }
}
```

## Example: Creating

```javascript
// CreateBoard.js

import React, { PropTypes, Component } from 'react';
import { reflorp, EntityState } from 'react-reflorp';

@reflorp(() => ({
  board: {
    create: true,
    onCreate: (board) => {
      const boardId = board.value.id;
      // Here you may for example redirect to the view board page
    },
  },
}))
export default class CreateBoard extends Component {
  static propTypes = {
    board: PropTypes.instanceOf(EntityState),
  };

  render() {
    const { board } = this.props;

    return (
      <form>
        <input onChange={board.handleChange} type="text" name="title" placeholder="Title" />
        <button disabled={board.loading} onClick={board.save}>Create new board</button>
        {board.rejected && board.error}
      </form>
    );
  }
}
```

## Example: Editing and deleting

```javascript
// EditNote.js

import React, { PropTypes, Component } from 'react';
import { reflorp, EntityState } from 'react-reflorp';

@reflorp(({ noteId, boardId }) => ({
  note: {
    id: noteId,
    parentId: boardId,
    load: true,
    onDel: () => {
      // Callback for when the note has been deleted
      // Here you may for example redirect back to another view
    },
  },
}))
export default class EditNote extends Component {
  static propTypes = {
    noteId: PropTypes.string,
    boardId: PropTypes.string,
    note: PropTypes.instanceOf(EntityState),
  };

  render() {
    const { note } = this.props;
    
    if (note.pending) {
      return <div>Loading...</div>;
    }

    return (
      <form>
        <input
          defaultValue={note.value.summary}
          onChange={note.handleChange}
          type="text"
          name="summary"
          placeholder="Summary"
        />
        <button disabled={note.loading} onClick={note.save}>Save note</button>
        <button disabled={note.loading} onClick={note.del}>Delete note</button>
        {note.draft.rejected && note.draft.reason}
      </form>
    );
  }
}
```

# API

## Decorator

The options available for each entity are:

- `id` - `string`: the id of the entity we want to get
- `parentId` - `string`: the id of the parent of the entity or entities we want to get
- `load` - `bool`: loads the data from the backend (default is false)
- `then` - `function`: using this option we can filter all the incoming values before they reach our component,
for example if we want to sort a list, or only show certain parts of it
- `create` - `bool`: enables create mode, at this point there is no original data, only a draft, and saving will create
a new entity with a POST (default is false)
- `onCreate` - `function`: callback for when a new entity was created in create mode
- `onDel` - `function`: callback for when the entity was deleted
- `onUpdate` - `function`: callback for when the entity was updated successfully

The options available as the second argument (applies to all entities):

- `refetch` - `function`: a custom instance of Refetch `connect`, see
[Advanced: Override Refetch defaults.](#advanced-override-refetch-defaults)
- `hideUntilLoaded` - `bool`: passing `hideUntilLoaded: true` will wait for all initial loads to complete before the
wrapped component is mounted (default is false)

## State objects

The state objects `EntityState` and `EntityListState` are the link between your component and Reflorp. They
contain data and metadata about either a single entity, or a list of entities.

Both state objects below have these properties:
- `value` - `array|object`: the actual data as received from the server
- `pending` - `bool`: true if the data is being fetched for the first time (`value` is null)
- `refreshing` - `bool`: true if the data is being updated in some way (`value` is present but may soon be outdated)
- `fulfilled` - `bool`: true if the latest request was successful
- `rejected` - `bool`: true if the latest request was unsuccessful
  - Usually a rejected `PromiseState` does not have a value, but here we actually keep the latest value accessible, even
  if it may be out of date depending of the kind of error occurred
- `settled` - `bool`: true if the latest request has been completed, regardless of whether it was a success or not

### EntityState

A synchronous representation of a single entity and its metadata, with helper functions for dispatching common actions
to redux.

It has the following properties:
- `data` - `PromiseState`: describes the state of the data for this entity
- `draft` - `PromiseState`: describes the state of the draft for this entity
  - the draft contains changes made with `edit()` that have not yet been sent to the server with `save()`
  - it also contains information on the latest `PATCH` or `DELETE` request for this entity
- `entity` - `string`: the name of the entity type (i e `board`)
- `id` - `string`: the id of the entity (i e `1`)
- `parentId` - `string`: the id of the parent of the entity (i e `2`)
- `loading` - `bool`: true if either `data.pending` or `data.refreshing` is true

And the following functions:
- `save(thenCallback, catchCallback)`: sends what is currently in the draft as a `PATCH` or `POST` (depending on if
we're in edit or create mode) to the backend
- `edit(draft)`: updates the current draft for this entity (is merged shallowly with the previous draft)
- `del(thenCallback, catchCallback)`: sends a `DELETE` to the backend
  - If this request is successful the entity will be removed entirely from the store
- `reset()`: resets the draft to the latest data fetched from the backend
- `handleChange()`: helper function that updates fields in the draft according to the `name` attribute of the `input`
field it is called from
  - `<input onChange={note.handleChange} name="summary">` will keep the `summary` field of the `note` draft updated
  when the input value is changed, see the [Editing and deleting](#example-editing-and-deleting) example above.

### EntityListState

A synchronous representation of a list of entities and its metadata, with helper functions for dispatching common
actions to redux.

It has the following properties:
- `data` - `PromiseState`: describes the state of the data
- `entity` - `string`: the name of the entity type (i e `board`)
- `parentId` - `string`: the id of the parent of these entities (i e `2`)
- `loading` - `bool`: true if either `data.pending` or `data.refreshing` is true
- `hasMore` - `bool`: true if the next page of this list is probably not empty

And the following functions:
- `more()`: fetches additional data from the backend, see [Pagination.](#pagination)

# Backend

By default, URL:s for fetching and changing things are automatically generated. URL:s and methods are based on the names
of the entities and the type of request we're doing.

| Method | URL               | Response | Description                                                                                | Type   |
|--------|-------------------|----------|--------------------------------------------------------------------------------------------|--------|
| POST   | /boards           | object   | Creates a new entity                                                                       | create |
| GET    | /boards           | object[] | Returns a list of entities                                                                 | list   |
| GET    | /boards?page=2    | object[] | Returns the second page of a list of entities                                              | list   |
| GET    | /boards/1         | object   | Returns a single entity                                                                    | single |
| PATCH  | /boards/1         | object   | Updates a single entity, returns the same entity with changes                              | update |
| DELETE | /boards/1         | -        | Deletes a single entity                                                                    | del    |
| POST   | /boards/1/notes   | object   | Creates a new entity belonging to a parent entity                                          | create |
| GET    | /boards/1/notes   | object[] | Returns a list of entities belonging to a parent entity                                    | list   |
| GET    | /boards/1/notes/2 | object   | Returns a single entity with a parent entity                                               | single |
| PATCH  | /boards/1/notes/2 | object   | Updates a single entity belonging to a parent entity, returns the same entity with changes | update |
| DELETE | /boards/1/notes/2 | -        | Deletes a single entity belonging to a parent entity                                       | del    |

### Pagination

There is built-in rudimentary support for pagination, if you call `EntityListState#more()` a new `GET` will be sent to
the same endpoint but with `?page=2`, and the result is appended to the end of the list. The page number is incremented
until it receives an empty response.

If an empty page has been received the `EntityListState#hasMore` property is set to `false`.

## Advanced: Override Refetch defaults

Refetch has a convenient way to override certain defaults and hook in to internal stuff before and after requests are
sent. You can do this with Reflorp as well by passing in your own `refetch` function with the `options` object as the
second parameter to the decorator.

```
import { connect } from 'react-refetch';
import { reflorp } from 'react-reflorp';

const refetch = connect.defaults({
  credentials: 'include',
});

@reflorp(
  ({ id }) => ({
    board: { id, load: true },
    notes: { parentId: id, load: true },
  }),
  {
    refetch,
    hideUntilLoaded: true,
  }
)
```

## Advanced: Customize URL:s

There are two configuration options that can help you here:

- `baseUrl` - `string`: This will basically be prepended to all URL:s, regardless of which `getUrl` function is used
- `getUrl` - `function`: By default Reflorp uses an internal `getUrl` function that will generate REST:y URL:s like in
the examples, but if you want you can override that function and build your own URL:s.

### Example

A call to `getUrl` might look something like this:

```
getUrl({
    entityConfiguration: (se below),
    id: "1",
    parentId: false,
    query: { page: 2 },
    flags: ["list"],
});
```

The `flags` parameter indicates what type of request this is (see the Type column under [Backend](#backend)).

The `query` parameter contains the additional filtering that should be sent (by default they are sent in the query part
of the URL).

The `entityConfiguration` parameter contains an internal representation of the configuration for the current entity. It
has the following properties:

- `parentEntity` - `EntityConfiguration`: The configuration for the parent entity, if any
- `entity` - `string`: The name of this entity type (i e `board`)
- `plural` - `string`: The plural name of this entity type as configured by you (i e `boards`)

# Known limitations

## Two levels of entities, no multiple parents

We currently only support two levels of entities, and an entity can not have multiple parents. You can still use a
custom `getUrl` function to achieve this to some extent, via the `query` property, but it won't be as smooth.

# PromiseState

Internally we use the excellent `PromiseState` class from Refetch, which is fully documented
[over here](https://github.com/heroku/react-refetch/blob/master/docs/api.md#promisestate). The Reflorp state objects are
basically just wrappers around one or more `PromiseState` objects.

# Support

This software is provided "as is", without warranty or support of any kind, express or implied. See
[license](https://github.com/tomat/react-reflorp/blob/master/LICENSE.md) for details.

# License

[MIT](https://github.com/tomat/react-reflorp/blob/master/LICENSE.md)
