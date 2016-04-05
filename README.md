React Reflorp
=========================

A simple, declarative, and composable way to reflorp your flux.

## Installation

Requires **React 0.14 or later.**

```
npm install --save react-reflorp
```

This assumes that you’re using [npm](http://npmjs.com/) package manager with a module bundler like [Webpack](http://webpack.github.io) or [Browserify](http://browserify.org/) to consume [CommonJS modules](http://webpack.github.io/docs/commonjs.html).

## Motivation

This project uses [React Redux](https://github.com/rackt/react-redux) and [React Refetch](https://github.com/heroku/react-refetch).

## Example

Configure Reflorp, this needs to happen before any code using a Reflorp decorator is loaded, and needs the store.

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

Add the Reflorp Redux reducer with the key "reflorp" (important!).
    
    # reducers.js
    
    import { reflorpReducer } from 'react-reflorp';
    
    export default {
      reflorp: reflorpReducer,
    };

Wrap your App component in ReflorpWrapper:

    # App.js
    
    import { ReflorpWrapper } from 'react-reflorp';
    
    [...]
    
    const App = ({ children }) => (
      <ReflorpWrapper>
        <div className="myApp">
            {children}
        </div>
      </ReflorpWrapper>
    );

Use the @refetch decorator to load data:

    # ViewBoardPage.js
    
    import React, { PropTypes, Component } from 'react';
    import ViewBoard from 'components/ViewBoard';
    import { refetch } from 'react-reflorp';
    
    @refetch(({ params }) => ({
      board: { id: params.id },
      notes: { parentId: params.id },
    }))
    export default class ViewBoardPage extends Component {
      static propTypes = {
        params: PropTypes.object,
      };
    
      render() {
        const { params } = this.props;
    
        return (
          <ViewBoard id={params.id} />
        );
      }
    }

Use the @redux decorator to inject the data and helper functions:

    import React, { PropTypes, Component } from 'react';
    import { PromiseState } from 'react-refetch';
    import { redux } from 'react-reflorp';
    import Note from 'components/Note';
    import LoadMoreButton from 'components/LoadMoreButton';
    
    @redux((state, props) => ({
      board: props.id,
      notes: {
        parentId: props.id,
        then: (notes) => (notes || null) && notes.sort((note1, note2) => note1.nr > note2.nr),
      },
      notesLoadMore: { parentId: props.id },
    }))
    export default class ViewBoard extends Component {
      static propTypes = {
        id: PropTypes.any,
        board: PropTypes.instanceOf(PromiseState).isRequired,
        notes: PropTypes.instanceOf(PromiseState).isRequired,
        notesLoadMore: PropTypes.func,
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

## Support

This software is provided "as is", without warranty or support of any kind, express or implied. See [license](https://github.com/tomat/react-reflorp/blob/master/LICENSE.md) for details.

## License

[MIT](https://github.com/tomat/react-reflorp/blob/master/LICENSE.md)
