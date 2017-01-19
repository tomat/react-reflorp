import React, { Component } from 'react';
import { connect as defaultRefetch } from 'react-refetch';
import { connect as redux } from 'react-redux';
import hoistStatics from 'hoist-non-react-statics';
import { refetchPrefix } from '../ConfigurationHelper';

const defaultMapPropsToEntities = () => ({});
const defaultOptions = {
  hideUntilLoaded: false,

};

const getDisplayName = (WrappedComponent) => {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
};

// Helps track hot reloading.
let nextVersion = 0;

export default (mapPropsToEntities, additionalOptions = {}) => {
  const options = { ...defaultOptions, ...additionalOptions };
  const finalMapPropsToEntities = mapPropsToEntities || defaultMapPropsToEntities;
  const dependsOnContext = finalMapPropsToEntities.length == 2;

  const refetch = (options.refetch && typeof options.refetch === 'function' ? options.refetch : defaultRefetch);

  const version = nextVersion++;

  return (WrappedComponent) => {
    @refetch((props, context) => {
      const fetchOptions = finalMapPropsToEntities(props, context);

      const helper = context.store.getState().reflorp.configuration;

      let fetches = {};

      Object.keys(fetchOptions).forEach((k) => {
        fetches = { ...fetches, ...helper.getEntityFetches(k, fetchOptions[k]) };
      });

      return fetches;
    })
    @redux((state) => ({
      reflorp: state.reflorp,
    }))
    class ReflorpConnect extends Component {
      constructor(props, context) {
        super(props, context);

        this.version = version;
        this.helper = props.reflorp.configuration;
        this.state = this.getFreshState(props);
      }

      getFreshState = (props) => {
        const { reflorp, dispatch, ...realProps } = props;
        const newState = {};
        const fetchOptions = finalMapPropsToEntities(realProps, this.context);

        Object.keys(fetchOptions).forEach((k) => {
          const fetches = {};

          Object.keys(realProps).forEach((p) => {
            if (p.indexOf(refetchPrefix) === 0) {
              fetches[p] = realProps[p];
            }
          });

          const entityState = this.helper.getEntityState(k, fetchOptions[k], fetches, reflorp);
          entityState.dispatch = dispatch;
          newState[k] = entityState;
        });

        return newState;
      };

      componentWillReceiveProps(props) {
        this.setState(this.getFreshState(props));
      }

      render() {
        const { reflorp, dispatch, ...props } = this.props;
        const { ...state } = this.state;

        const realProps = {};

        Object.keys(props).forEach((k) => {
          if (k.indexOf(refetchPrefix) !== 0) {
            realProps[k] = props[k];
          }
        });

        if (options.hideUntilLoaded) {
          let fulfilled = true;
          Object.keys(state).forEach((k) => {
            fulfilled = fulfilled && state[k].isFulfilled();
          });

          if (!fulfilled) {
            return null;
          }
        }

        return (
          <WrappedComponent {...realProps} {...state} />
        );
      }
    }

    ReflorpConnect.displayName = `Reflorp.reflorp(${getDisplayName(WrappedComponent)})`;
    ReflorpConnect.WrappedComponent = WrappedComponent;

    if (dependsOnContext && WrappedComponent.contextTypes) {
      ReflorpConnect.contextTypes = WrappedComponent.contextTypes;
    }

    if (process.env.NODE_ENV !== 'production') {
      ReflorpConnect.prototype.componentWillUpdate = function () {
        if (this.version === version) {
          return;
        }

        // We are hot reloading!
        this.version = version;
      };
    }

    return hoistStatics(ReflorpConnect, WrappedComponent);
  };
};
