import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { create } from '../utils/reducer';
import ConfigurationHelper from '../ConfigurationHelper';

export default class Container extends Component {
  static contextTypes = {
    store: PropTypes.object,
  };
  static propTypes = {
    configuration: PropTypes.object,
  };

  componentWillMount() {
    const configurationHelper = new ConfigurationHelper(this.props.configuration, this.context.store.dispatch);

    this.context.store.dispatch(create('configuration', configurationHelper));
  }

  render() {
    return React.Children.only(this.props.children);
  }
}
