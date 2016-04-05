React Reflorp
=========================

Basically a simple ORM using [React Refetch](https://github.com/heroku/react-refetch) as a backend, but the data is stored in the [Redux](https://github.com/reactjs/redux) store.

## Installation

Requires **React 0.14 or later.**

```
npm install --save react-reflorp
```

This assumes that you’re using [npm](http://npmjs.com/) package manager with a module bundler like [Webpack](http://webpack.github.io) or [Browserify](http://browserify.org/) to consume [CommonJS modules](http://webpack.github.io/docs/commonjs.html).

## Set up

Configure Reflorp, this needs to happen before any code using a Reflorp decorator is loaded, and needs the store.

In the following example code we have a simple app with boards and notes. Each board has a number of notes.

```javascript
# store.js

import { reflorpSetStore, reflorpSetEntities, reflorpSetBaseUrl } from 'react-reflorp';

[...]

reflorpSetBaseUrl('/api');
reflorpSetEntities({
  board: {},
  note: {
    parent: 'board',
  },
});
reflorpSetStore(store);
```

Add the Reflorp Redux reducer with the key `reflorp` (important!).

```javascript
# reducers.js

import { reflorpReducer } from 'react-reflorp';

export default {
  reflorp: reflorpReducer,`
};
```

Add the `ReflorpWrapper` component to your upmost component (i e `App`):

```javascript
# App.js

import { ReflorpWrapper } from 'react-reflorp';

[...]

const App = ({ children }) => (
  <div className="app">
    <ReflorpWrapper />
    {children}
  </div>
);
```

## Usage

Both the `@refetch` and the `@redux` decorator will transparently handle data that does not match a configured entity as if it was sent to the regular `@connect` decorator.

### Refetch (@refetch)

Corresponds to the `@connect` decorator from `react-refetch`.

Use the `@refetch` decorator to load data.

Note that we don't actually catch any Reflorp props in this example, since all the data will be stored in the Redux store, and we don't use the data in this component anyway. Also, it is probably a bad idea to mix `@refetch` with `@redux` on the same component, use a wrapper!

```javascript
# ViewBoardPage.js

import React, { PropTypes, Component } from 'react';
import ViewBoard from 'components/ViewBoard';
import { PromiseState } from 'react-refetch';
import { refetch } from 'react-reflorp';

@refetch(({ params }) => ({
  board: { id: params.id },       // fetch the board data: GET /api/boards/${params.id}
  notes: { parentId: params.id }, // fetch the notes belonging to this board: GET /api/boards/${params.id}/notes
  foobar: { url: '/foo/bar' },    // regular Refetch
}))
export default class ViewBoardPage extends Component {
  static propTypes = {
    params: PropTypes.object,
    foobar: PropTypes.instanceOf(PromiseState),
  };

  render() {
    const { params } = this.props;

    return (
      <ViewBoard id={params.id} />
    );
  }
}
```

### Redux (@redux)

Corresponds to the `@connect` decorator from `react-redux`. 

Use the `@redux` decorator to inject data and helper functions. Everything that does not match an entity that is configured in Reflorp will be transparently handled as regular Redux:

```javascript
import React, { PropTypes, Component } from 'react';
import { PromiseState } from 'react-refetch';
import { redux } from 'react-reflorp';
import Note from 'components/Note';
import LoadMoreButton from 'components/LoadMoreButton';

@redux((state, props) => ({
  board: props.id,                       // injects the board data
  notes: {                               // injects the notes data, sorted by nr
    parentId: props.id,
    then: (notes) => (notes || null) && notes.sort((note1, note2) => note1.nr > note2.nr),
  },
  notesLoadMore: { parentId: props.id }, // injects a function that loads the next page of notes: GET /api/boards/${props.id}/notes?page=2
  bazqux: state.bazqux,                  // handled by Redux as usual
}))
export default class ViewBoard extends Component {
  static propTypes = {
    id: PropTypes.any,
    board: PropTypes.instanceOf(PromiseState).isRequired,
    notes: PropTypes.instanceOf(PromiseState).isRequired,
    notesLoadMore: PropTypes.func,
    bazqux: PropTypes.any,
  };

  render() {
    const { board, notes, id, notesLoadMore } = this.props;

    const view = PromiseState.all([board, notes]);

    let note;

    return (
      <div className={['hasLoader', (view.pending ? 'loading' : '')].join(' ')}>
        <Choose>
          <When condition={view.fulfilled}>
            <h1>{board.value.title}</h1>
            <div className="container-fluid">
              <For each="note" of={notes.value} index="i">
                <Note key={note.id} note={note} />
              </For>
            </div>
            <If condition={board.value.notesCount > notes.value.length}>
              <div key="loadMoreButton" className="text-center">
                <LoadMoreButton onClick={notesLoadMore} loading={view.refreshing} />
              </div>
            </If>
          </When>
          <When condition={view.rejected}>
            <div className="alert alert-danger">
              <span>{view.reason}</span>
            </div>
          </When>
        </Choose>
      </div>
    );
  }
}
```

## Support

This software is provided "as is", without warranty or support of any kind, express or implied. See [license](https://github.com/tomat/react-reflorp/blob/master/LICENSE.md) for details.

## License

[MIT](https://github.com/tomat/react-reflorp/blob/master/LICENSE.md)
