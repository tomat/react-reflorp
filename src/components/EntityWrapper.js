import React, { Component, PropTypes } from 'react';
import { PromiseState } from 'react-refetch';
import redux from './reflorpRedux';

@redux((state, props) => {
  const mapping = {};
  const entityList = props.entities || {};
  if (props.entity) {
    entityList[props.entity] = { id: props.id, parentId: props.parentId };
  }

  Object.keys(entityList).forEach((entity) => {
    const entityData = entityList[entity];
    mapping[entity] = { id: entityData.id, parentId: entityData.parentId, edit: true };
    mapping[`${entity}Edit`] = { id: entityData.id, parentId: entityData.parentId };
    mapping[`${entity}EditResponse`] = { id: entityData.id, parentId: entityData.parentId };
    mapping[`${entity}Delete`] = { id: entityData.id, parentId: entityData.parentId };
    mapping[`${entity}DeleteResponse`] = { id: entityData.id, parentId: entityData.parentId };
  });

  return mapping;
})
class EntityWrapper extends Component {
  static propTypes = {
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    children: PropTypes.node,
    parentId: PropTypes.any,
    id: PropTypes.any,
    entity: PropTypes.string,
    entities: PropTypes.array,
  };

  constructor() {
    super();

    this.state = {
      edited: false,
      deleted: false,
    };
  }

  componentWillReceiveProps(nextProps) {
    const { onEdit, onDelete, entity, entities, id, parentId } = nextProps;
    const { edited, deleted } = this.state;

    const entityList = entities || {};
    if (entity) {
      entityList[entity] = { id, parentId };
    }

    Object.keys(entityList).forEach((entityKey) => {
      const editResponse = nextProps[`${entityKey}EditResponse`];
      const deleteResponse = nextProps[`${entityKey}DeleteResponse`];

      if (editResponse) {
        if (editResponse.fulfilled) {
          if (onEdit && !edited) {
            this.setState({
              edited: true,
            }, onEdit);
          }
        } else {
          this.setState({
            edited: false,
          });
        }
      }

      if (deleteResponse) {
        if (deleteResponse.fulfilled) {
          if (onDelete && !deleted) {
            this.setState({
              deleted: true,
            }, onDelete);
          }
        } else {
          this.setState({
            deleted: false,
          });
        }
      }
    });
  }

  render() {
    const { children, entity, entities, id, parentId } = this.props;

    const entityList = entities || {};
    if (entity) {
      entityList[entity] = { id, parentId };
    }

    const datas = {};
    const edits = {};
    const deletes = {};
    const responses = [];
    const deleteResponses = [];
    const editResponses = [];
    Object.keys(entityList).forEach((entityKey) => {
      const editResponse = this.props[`${entity}EditResponse`];
      const deleteResponse = this.props[`${entity}DeleteResponse`];
      const data = this.props[entityKey];

      datas[entity] = data;
      if (data) {
        responses.push(data);
      }
      edits[entity] = this.props[`${entity}Edit`];
      deletes[entity] = this.props[`${entity}Delete`];
      if (editResponse) {
        editResponses.push(editResponse);
        responses.push(editResponse);
      }
      if (deleteResponse) {
        deleteResponses.push(deleteResponse);
        responses.push(deleteResponse);
      }
    });

    const allResponses = PromiseState.all(responses);
    const error = (allResponses && allResponses.rejected ? allResponses.reason.message : '');

    const childProps = {
      data: (entity ? datas[entity] : datas).value,
      error,
    };

    if (entity) {
      childProps.doEdit = edits[entity];
      childProps.doDelete = deletes[entity];
      childProps.deleteResponse = (deleteResponses ? PromiseState.all(deleteResponses) : false);
      childProps.editResponse = (editResponses ? PromiseState.all(editResponses) : false);
    } else {
      childProps.doEdit = edits;
      childProps.doDelete = deletes;
      childProps.deleteResponse = (deleteResponses ? PromiseState.all(deleteResponses) : false);
      childProps.editResponse = (editResponses ? PromiseState.all(editResponses) : false);
    }

    const element = React.cloneElement(React.Children.only(children), childProps);

    return (
      <div className={['reflorp-loader', (allResponses && allResponses.pending ? 'reflorp-loader-loading' : '')].join(' ')}>
        {element}
      </div>
    );
  }
}

export default EntityWrapper;
