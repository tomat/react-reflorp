React Reflorp
=========================

Basically a simple ORM using [React Refetch](https://github.com/heroku/react-refetch) as a backend, but the data is stored in the [Redux](https://github.com/reactjs/redux) store.

## Example project and demo
An example project can be found [here](https://github.com/tomat/reflorp), and the latest build of it should be live at http://reflorp.com

## Installation

Requires **React 0.14 or later.**

```
npm install --save react-reflorp
```

This assumes that you’re using [npm](http://npmjs.com/) package manager with a module bundler like [Webpack](http://webpack.github.io) or [Browserify](http://browserify.org/) to consume [CommonJS modules](http://webpack.github.io/docs/commonjs.html).

## Set up

In the following example code we have a simple app with boards and notes. Each board has a number of notes.

Boards have a single text field: `title`.

Notes also have a single text field: `summary`.

First, add the `Container` with a configuration object as a child of the `react-redux` `Provider`:

```javascript
// app.js

import { Container as ReflorpContainer } from 'react-reflorp';

[...]

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
  baseUrl: '/api',
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

## Usage

### Backend

Currently URL:s are automatically generated, and the basic structure can not be changed.

URL:s and methods are based on the names of the entities and the kind of request we're doing.

#### Single endpoints

Single board with id 1: `/board/1`

Single note with id 2 belonging to board with id 1: `/board/1/notes/2`

When `PATCH`:ing or `GET`:ing, single-endpoints should always return only the object requested.

Deleting an entity results in a `DELETE` to the single-endpoint.

#### List endpoints

List of boards, and used for creating new boards: `/boards`

List of notes belonging to board with id 1, and used for creating new notes on that board: `/board/1/notes`

Creating a new entity results in a `POST` to the corresponding list collection (creating a new board will `POST` to `/boards`), that should return the created object only.

##### Pagination

There is built-in rudimentary support for pagination, if you call `EntityListState#more()` a new `GET` will be sent to the same endpoint but with `?page=2`, and the result is appended to the end of the list. The page number is incremented until it receives an empty response.

If an empty page has been received the `EntityListState#hasMore` property is set to `false`.

### Frontend

The `@reflorp` decorator corresponds to the `@connect` decorator from `react-refetch`.

It takes a function mapping `props` and `context` to entities.

#### Loading and displaying

```javascript
// Board.js

import React, { PropTypes, Component } from 'react';
import { reflorp, EntityState, EntityListState } from 'react-reflorp';

@reflorp(({ id }) => ({
  board: { id, load: true },           // fetch the board data: GET /api/boards/${id}
  notes: { parentId: id, load: true }, // fetch the notes belonging to this board: GET /api/boards/${id}/notes
}))
export default class Board extends Component {
  static propTypes = {
    board: PropTypes.instanceOf(EntityState),
    notes: PropTypes.instanceOf(EntityListState),
  };

  render() {
    const { notes, board } = this.props;
    
    if (!notes.isFulfilled() || !board.isFulfilled()) {
      return <div>Loading...</div>;
    }

    return (
      <div>
        <h1>{board.data.value.title}</h1>
        <ul>
          {notes.data.value.map((note) => (
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

#### Creating

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
        <button disabled={board.isLoading()} onClick={board.save}>Create new board</button>
        {board.getError()}
      </form>
    );
  }
}
```

#### Editing and deleting

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
    note: PropTypes.instanceOf(EntityState),
  };

  render() {
    const { note } = this.props;
    
    if (note.isFulfilled()) {
      return <div>Loading...</div>;
    }

    return (
      <form>
        <input defaultValue={note.data.value.summary} onChange={note.handleChange} type="text" name="summary" placeholder="Summary" />
        <button disabled={note.isLoading()} onClick={note.save}>Save note</button>
        <button disabled={note.isLoading()} onClick={note.del}>Delete note</button>
        {note.getError()}
      </form>
    );
  }
}
```

## Support

This software is provided "as is", without warranty or support of any kind, express or implied. See [license](https://github.com/tomat/react-reflorp/blob/master/LICENSE.md) for details.

## License

[MIT](https://github.com/tomat/react-reflorp/blob/master/LICENSE.md)
