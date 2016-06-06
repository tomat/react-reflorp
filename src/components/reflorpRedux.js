import { connect as connectRedux } from 'react-redux';
import { PromiseState } from 'react-refetch';
import { getEntities } from './reflorpRefetch';
import getName from '../utils/getName';
import extend from 'extend';

export default (mappings, ...restRedux) => {
  return connectRedux((state, props) => {
    const entities = getEntities();
    Object.keys(entities).forEach((entity) => {
      if (entities[entity].plural && !entities[entity].singular) {
        entities[entities[entity].plural] = extend(true, {}, entities[entity]);
        entities[entities[entity].plural].singular = entity;
      }
    });

    const entityMappings = mappings(state, props);
    const ret = entityMappings;

    Object.keys(entityMappings).forEach((entity) => {
      let entityMapping = entityMappings[entity];
      if (!entityMappings[entity] || typeof entityMappings[entity] !== typeof {}) {
        entityMapping = {
          id: entityMapping,
        };
      }

      const id = (typeof entityMapping.id === 'undefined' ? false : entityMapping.id);
      const parentId = entityMapping.parentId || false;
      const then = entityMapping.then || ((value) => value);
      const extra = entityMapping.extra || {};
      const pluralMatches = entity.match(/^(.+)$/);
      const createMatches = entity.match(/^(.+)Create$/);
      const originalMatches = entity.match(/^(.+)Original$/);
      const createResponseMatches = entity.match(/^(.+)CreateResponse$/);
      const editMatches = entity.match(/^(.+)Edit$/);
      const editDraftMatches = entity.match(/^(.+)EditDraft$/);
      const editResponseMatches = entity.match(/^(.+)EditResponse$/);
      const deleteMatches = entity.match(/^(.+)Delete$/);
      const deleteResponseMatches = entity.match(/^(.+)DeleteResponse$/);
      const loadMoreMatches = entity.match(/^(.+)LoadMore$/);

      // Single entity belonging to parent in editing mode (receives draft)
      if (entities[entity] && parentId && entityMapping.edit && entities[entity].plural !== entity) {
        ret[entity] = state.reflorp[getName(entity, id, parentId) + 'Draft'];

        // If id is 0 we are creating a new entity, so use default data as a fallback
        if (id == 0 && !ret[entity] && entities[entity]) {
          ret[entity] = PromiseState.resolve(entities[entity].defaults || { id: 0 });
        }
      // Single original entity belonging to parent
      } else if (originalMatches && entities[originalMatches[1]] && parentId) {
        ret[entity] = state.reflorp[getName(originalMatches[1], id, parentId)];
      // Single entity belonging to parent
      } else if (entities[entity] && parentId && entities[entity].plural !== entity) {
        ret[entity] = state.reflorp[getName(entity, id, parentId)];
      // Simple single entity in editing mode (receives draft)
      } else if (entities[entity] && entityMapping.edit && entities[entity].plural !== entity) {
        ret[entity] = state.reflorp[getName(entity, id) + 'Draft'];

        // If id is 0 we are creating a new entity, so use default data as a fallback
        if (id == 0 && !ret[entity] && entities[entity]) {
          ret[entity] = PromiseState.resolve(entities[entity].defaults || { id: 0 });
        }
      // Simple single original entity
      } else if (originalMatches && entities[originalMatches[1]] && entities[originalMatches[1]].plural !== originalMatches[1]) {
        ret[entity] = state.reflorp[getName(originalMatches[1], id)];
      // Simple single entity
      } else if (entities[entity] && entities[entity].plural !== entity) {
        ret[entity] = state.reflorp[getName(entity, id)];
      // List of entities
      } else if (pluralMatches && entities[pluralMatches[1]] && entities[pluralMatches[1]].singular) {
        const injectHash = getName(entities[pluralMatches[1]].singular, id, parentId, extra);
        ret[entity] = state.reflorp[injectHash];
      // Function for creating an entity
      } else if (createMatches && entities[createMatches[1]]) {
        ret[entity] = state.reflorp[entity];
      // Response to entity creation
      } else if (createResponseMatches && entities[createResponseMatches[1]]) {
        ret[entity] = state.reflorp[`${getName(createResponseMatches[1], '0', parentId)}CreateResponse`];
      // Function for editing an entity
      } else if (editMatches && entities[editMatches[1]]) {
        if (id == 0) {
          ret[entity] = (data) => state.reflorp[`${editMatches[1]}Create`](data, parentId);
        } else {
          ret[entity] = state.reflorp[`${editMatches[1]}Edit`].bind(null, id, parentId);
        }
      // Function for editing the draft of an entity
      } else if (editDraftMatches && entities[editDraftMatches[1]]) {
        ret[entity] = state.reflorp[`${editDraftMatches[1]}EditDraft`].bind(null, id, parentId);
      // Response to entity edit
      } else if (editResponseMatches && entities[editResponseMatches[1]]) {
        ret[entity] = state.reflorp[`${getName(editResponseMatches[1], id, parentId)}EditResponse`];
      // Function for deleting an entity
      } else if (deleteMatches && entities[deleteMatches[1]]) {
        ret[entity] = state.reflorp[`${deleteMatches[1]}Delete`].bind(null, id, parentId);
      // Response to entity delete
      } else if (deleteResponseMatches && entities[deleteResponseMatches[1]]) {
        ret[entity] = state.reflorp[`${getName(deleteResponseMatches[1], id, parentId)}DeleteResponse`];
      // Function for loading next page of a list of entities
      } else if (loadMoreMatches) {
        let name = loadMoreMatches[1];
        if (entities[loadMoreMatches[1]].singular) {
          name = entities[loadMoreMatches[1]].singular;
        }
        const page = state.reflorp[`${getName(name, false, parentId, extra)}Page`] || 1;
        if (page === -1) {
          ret[entity] = false;
        } else {
          ret[entity] = state.reflorp[`${name}LoadMore`].bind(null, false, parentId, { page: page + 1, ...extra });
        }
      }

      if (ret[entity] && ret[entity].value) {
        ret[entity].value = then(ret[entity].value);
      }
      if (ret[entity] && ret[entity].value && entities[entity] && entities[entity].then) {
        ret[entity].value = entities[entity].then(ret[entity].value);
      }
    });

    return ret;
  }, ...restRedux);
}
