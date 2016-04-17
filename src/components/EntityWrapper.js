import React, { Component, PropTypes } from 'react';
import { PromiseState } from 'react-refetch';
import redux from './reflorpRedux';
import refetch from './reflorpRefetch';

@refetch((props) => {
  const mapping = {};
  const entityList = props.entities || {};
  if (props.entity) {
    entityList[props.entity] = { id: props.id, parentId: props.parentId, load: props.load, edit: props.edit, extra: props.extra };
  }

  Object.keys(entityList).forEach((entity) => {
    const entityData = entityList[entity];
    if (entityData.load) {
      mapping[entity] = { id: entityData.id, parentId: entityData.parentId, extra: entityData.extra };
    }
  });

  return mapping;
})
@redux((state, props) => {
  const mapping = {};
  const entityList = props.entities || {};
  if (props.entity) {
    entityList[props.entity] = { id: props.id, parentId: props.parentId };
  }

  Object.keys(entityList).forEach((entity) => {
    const entityData = entityList[entity];
    if (entityData.edit !== false) {
      mapping[entity] = { id: entityData.id, parentId: entityData.parentId, edit: true };
      mapping[`${entity}Edit`] = { id: entityData.id, parentId: entityData.parentId };
      mapping[`${entity}EditDraft`] = { id: entityData.id, parentId: entityData.parentId };
      mapping[`${entity}EditResponse`] = { id: entityData.id, parentId: entityData.parentId };
      mapping[`${entity}Delete`] = { id: entityData.id, parentId: entityData.parentId };
      mapping[`${entity}DeleteResponse`] = { id: entityData.id, parentId: entityData.parentId };
    } else {
      mapping[entity] = { id: entityData.id, parentId: entityData.parentId };
    }
    mapping[`${entity}LoadMore`] = { id: entityData.id, parentId: entityData.parentId, extra: entityData.extra };
    mapping[`${entity}LoadMoreResponse`] = { id: entityData.id, parentId: entityData.parentId, extra: entityData.extra };
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
    entities: PropTypes.object,
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
    const { children, entity, entities, id, parentId, className } = this.props;

    const entityList = entities || {};
    if (entity) {
      entityList[entity] = { id, parentId };
    }

    const datas = {};
    const loadMores = {};
    const loadMoreResponses = {};
    const edits = {};
    const editDrafts = {};
    const deletes = {};
    const responses = [];
    const dataResponses = [];
    const deleteResponses = [];
    const editResponses = [];
    Object.keys(entityList).forEach((entityKey) => {
      const editResponse = this.props[`${entityKey}EditResponse`];
      const deleteResponse = this.props[`${entityKey}DeleteResponse`];
      const data = this.props[entityKey];

      if (data) {
        datas[entityKey] = data.value;
        responses.push(data);
        dataResponses.push(data);
      }

      if (this.props[`${entityKey}LoadMore`]) {
        loadMores[entityKey] = this.props[`${entityKey}LoadMore`];
        const loadMoreResponse = this.props[`${entityKey}LoadMoreResponse`];
        if (loadMoreResponse) {
          loadMoreResponses[entityKey] = loadMoreResponse;
          responses.push(loadMoreResponse);
        }
      }
      if (this.props[`${entityKey}Edit`]) {
        edits[entityKey] = this.props[`${entityKey}Edit`];
        editDrafts[entityKey] = this.props[`${entityKey}EditDraft`];
        deletes[entityKey] = this.props[`${entityKey}Delete`];
      }
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
    const dataResponsesPs = PromiseState.all(dataResponses);
    const error = (allResponses && allResponses.rejected ? allResponses.reason.message : '');

    if (!children) {
      return null;
    }

    const childProps = {
      data: (entity ? datas[entity] : datas),
      error,
      loading: (allResponses && allResponses.pending ? true : false),
      hasData: (dataResponsesPs && dataResponsesPs.fulfilled ? true : false),
    };

    if (entity) {
      childProps.doLoadMore = loadMores[entity];
      childProps.doEdit = edits[entity];
      childProps.doEditDraft = editDrafts[entity];
      childProps.doDelete = deletes[entity];
    } else {
      childProps.doLoadMore = loadMores;
      childProps.doEdit = edits;
      childProps.doEditDraft = editDrafts;
      childProps.doDelete = deletes;
    }
    childProps.loadMoreResponse = (loadMoreResponses ? PromiseState.all(loadMoreResponses) : false);
    childProps.deleteResponse = (deleteResponses ? PromiseState.all(deleteResponses) : false);
    childProps.editResponse = (editResponses ? PromiseState.all(editResponses) : false);

    childProps.saveAll = () => {
      Object.keys(edits).forEach((entityKey) => {
        edits[entityKey](datas[entityKey]);
      });
    };

    childProps.handleChange = (e) => {
      const name = e.target.name;

      let value;

      if (e.target.type === 'checkbox') {
        value = !!e.target.checked;
      } else {
        value = e.target.value;
      }

      if (name) {
        if (name.indexOf('.') !== -1) {
          const [ myEntity, field ] = name.split('.');
          const newData = { ...datas[myEntity] };
          newData[field] = value;
          editDrafts[myEntity](newData);
        } else {
          const newData = { ...datas[entity] };
          newData[e.target.name] = value;
          editDrafts[entity](newData);
        }
      }
    };

    const element = React.cloneElement(React.Children.only(children), childProps);

    return (
      <div className={[ (className ? className : ''), 'reflorp-loader', (allResponses && (allResponses.pending || allResponses.refreshing) ? 'reflorp-loader-loading' : '') ].join(' ')}>
        {element}
      </div>
    );
  }
}

export default EntityWrapper;
