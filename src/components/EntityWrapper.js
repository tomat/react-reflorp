import React, { Component, PropTypes } from 'react';
import { PromiseState } from 'react-refetch';
import redux from './reflorpRedux';
import refetch from './reflorpRefetch';
import debounce from '../utils/debounce.js';

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
    entityList[props.entity] = { id: props.id, parentId: props.parentId, edit: props.edit, create: props.create, extra: props.extra };
  }

  Object.keys(entityList).forEach((entity) => {
    const entityData = entityList[entity];

    if (entityData.create) {
      entityData.id = '0';
    }

    if (entityData.edit !== false) {
      mapping[entity] = { id: entityData.id, parentId: entityData.parentId, edit: true, extra: entityData.extra };
      mapping[`${entity}Original`] = { id: entityData.id, parentId: entityData.parentId, extra: entityData.extra };
      mapping[`${entity}Edit`] = { id: entityData.id, parentId: entityData.parentId };
      mapping[`${entity}EditDraft`] = { id: entityData.id, parentId: entityData.parentId };
      mapping[`${entity}EditResponse`] = { id: entityData.id, parentId: entityData.parentId };
      mapping[`${entity}Delete`] = { id: entityData.id, parentId: entityData.parentId };
      mapping[`${entity}DeleteResponse`] = { id: entityData.id, parentId: entityData.parentId };
    } else {
      mapping[entity] = { id: entityData.id, parentId: entityData.parentId, then: entityData.then, extra: entityData.extra };
      mapping[`${entity}Original`] = { id: entityData.id, parentId: entityData.parentId, then: entityData.then, extra: entityData.extra };
    }
    if (entityData.create) {
      mapping[`${entity}Create`] = true;
      mapping[`${entity}CreateResponse`] = { id: entityData.id, parentId: entityData.parentId };
    }
    if (entityData.parentId && !entityData.id) {
      mapping[`${entity}LoadMore`] = { id: entityData.id, parentId: entityData.parentId, extra: entityData.extra };
      mapping[`${entity}LoadMoreResponse`] = { id: entityData.id, parentId: entityData.parentId, extra: entityData.extra };
    }
  });

  return mapping;
})
class EntityWrapper extends Component {
  static propTypes = {
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    onCreate: PropTypes.func,
    children: PropTypes.node,
    parentId: PropTypes.any,
    id: PropTypes.any,
    entity: PropTypes.string,
    entities: PropTypes.object,
    hideUntilLoaded: PropTypes.bool,
  };

  static defaultProps = {
    hideUntilLoaded: false,
  };

  constructor() {
    super();

    this.state = {
      created: {},
      edited: {},
      deleted: {},
    };
  }

  componentWillReceiveProps(nextProps) {
    const { onCreate, onEdit, onDelete, entity, entities, id, parentId } = nextProps;
    const { edited, deleted, created } = this.state;

    const entityList = entities || {};
    if (entity) {
      entityList[entity] = { id, parentId };
    }

    Object.keys(entityList).forEach((entityKey) => {
      const createResponse = nextProps[`${entityKey}CreateResponse`];
      const editResponse = nextProps[`${entityKey}EditResponse`];
      const deleteResponse = nextProps[`${entityKey}DeleteResponse`];

      if (createResponse) {
        if (createResponse.fulfilled) {
          if (onCreate && !created[entityKey]) {
            const newCreated = { ...created };
            const value = createResponse.value;
            newCreated[entityKey] = true;
            this.setState({
              created: newCreated,
            }, () => onCreate(value));
          }
        } else {
          const newCreated = { ...created };
          delete newCreated[entityKey];
          this.setState({
            created: newCreated,
          });
        }
      }

      if (editResponse) {
        if (editResponse.fulfilled) {
          if (onEdit && !edited[entityKey]) {
            const newEdited = { ...edited };
            const value = editResponse.value;
            newEdited[entityKey] = true;
            this.setState({
              edited: newEdited,
            }, () => onEdit(value));
          }
        } else {
          const newEdited = { ...edited };
          delete newEdited[entityKey];
          this.setState({
            edited: newEdited,
          });
        }
      }

      if (deleteResponse) {
        if (deleteResponse.fulfilled) {
          if (onDelete && !deleted[entityKey]) {
            const newDeleted = { ...deleted };
            const value = entityList[entityKey];
            newDeleted[entityKey] = true;
            this.setState({
              deleted: newDeleted,
            }, () => onDelete(value));
          }
        } else {
          const newDeleted = { ...deleted };
          delete newDeleted[entityKey];
          this.setState({
            deleted: newDeleted,
          });
        }
      }
    });
  }

  render() {
    const { children, entity, entities, id, parentId, className, hideUntilLoaded } = this.props;

    const entityList = entities || {};
    if (entity) {
      entityList[entity] = { id, parentId };
    }

    const datas = {};
    const saved = {};
    const loadMores = {};
    const loadMoreResponses = {};
    const edits = {};
    const editDrafts = {};
    const deletes = {};
    const responses = [];
    const dataResponses = [];
    const createResponses = [];
    const deleteResponses = [];
    const editResponses = [];
    Object.keys(entityList).forEach((entityKey) => {
      const createResponse = this.props[`${entityKey}CreateResponse`];
      const editResponse = this.props[`${entityKey}EditResponse`];
      const deleteResponse = this.props[`${entityKey}DeleteResponse`];
      const data = this.props[entityKey];

      if (data) {
        datas[entityKey] = data.value;
        saved[entityKey] = data.saved;
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
        if (this.props[`${entityKey}Original`]) {
          datas[`${entityKey}Original`] = this.props[`${entityKey}Original`].value;
        }
        edits[entityKey] = this.props[`${entityKey}Edit`];
        editDrafts[entityKey] = this.props[`${entityKey}EditDraft`];
        deletes[entityKey] = this.props[`${entityKey}Delete`];
      }
      if (createResponse) {
        createResponses.push(createResponse);
        responses.push(createResponse);
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
      saved: (entity ? saved[entity] : saved),
      error,
      loading: (allResponses && (allResponses.pending || allResponses.refreshing) ? true : false),
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

    childProps.handleChangeDebounced = (wait = 50) => {
      const debouncedChange = debounce(childProps.handleChange, wait);

      return (e) => {
        if (e.persist) {
          e.persist();
        }

        debouncedChange(e);
      }
    };

    return (
      <div className={[ (className ? className : ''), 'reflorp-loader', (allResponses && (allResponses.pending || allResponses.refreshing) ? 'reflorp-loader-loading' : '') ].join(' ')}>
        {(childProps.hasData || !hideUntilLoaded ? React.cloneElement(React.Children.only(children), childProps) : <noscript />)}
      </div>
    );
  }
}

export default EntityWrapper;
