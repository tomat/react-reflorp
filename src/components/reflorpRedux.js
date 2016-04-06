import { connect as connectRedux } from 'react-redux';
import { getEntities } from './reflorpRefetch';
import getName from '../utils/getName';

export default (mappings, ...restRedux) => {
  const entities = getEntities();

  return connectRedux((state, props) => {
    const entityMappings = mappings(state, props);
    const ret = entityMappings;

    Object.keys(entityMappings).forEach((entity) => {
      let entityMapping = entityMappings[entity];
      if (typeof entityMappings[entity] !== typeof {}) {
        entityMapping = {
          id: entityMapping,
        };
      }

      const id = entityMapping.id || entityMapping.parentId || 0;
      const parentId = entityMapping.parentId || false;
      const then = entityMapping.then || ((value) => value);
      const pluralMatches = entity.match(/^(.+)s$/);
      const createMatches = entity.match(/^(.+)Create$/);
      const createResponseMatches = entity.match(/^(.+)CreateResponse$/);
      const editMatches = entity.match(/^(.+)Edit$/);
      const editResponseMatches = entity.match(/^(.+)EditResponse$/);
      const loadMorePluralMatches = entity.match(/^(.+)sLoadMore$/);
      const loadMoreMatches = entity.match(/^(.+)LoadMore$/);

      // Simple single entity
      if (entities[entity]) {
        ret[entity] = state.reflorp[getName(entity, id)];
      // List of entities belonging to a parent
      } else if (pluralMatches && entities[pluralMatches[1]]) {
        ret[entity] = state.reflorp[getName(pluralMatches[1], false, id)];
      // Function for creating an entity
      } else if (createMatches && entities[createMatches[1]]) {
        ret[entity] = state.reflorp[entity];
      // Response to entity creation
      } else if (createResponseMatches && entities[createResponseMatches[1]]) {
        const parentId = id === 0 ? false : id;
        ret[entity] = state.reflorp[`${getName(createResponseMatches[1], false, parentId)}CreateResponse`];
      // Function for editing an entity
      } else if (editMatches && entities[editMatches[1]]) {
        ret[entity] = state.reflorp[`${editMatches[1]}Edit`].bind(null, id, parentId);
      // Response to entity edit
      } else if (editResponseMatches && entities[editResponseMatches[1]]) {
        ret[entity] = state.reflorp[`${getName(editResponseMatches[1], id, parentId)}EditResponse`];
      // Function for loading next page of a list of entities
      } else if (loadMorePluralMatches && entities[loadMorePluralMatches[1]]) {
        const page = state.reflorp[`${getName(loadMorePluralMatches[1], false, id)}Page`] || 1;
        ret[entity] = state.reflorp[`${loadMorePluralMatches[1]}LoadMore`].bind(null, false, id, { page: page + 1 });
      } else if (loadMoreMatches && entities[loadMoreMatches[1]]) {
        const page = state.reflorp[`${getName(loadMoreMatches[1], false, id)}Page`] || 1;
        ret[entity] = state.reflorp[`${loadMorePluralMatches[1]}LoadMore`].bind(null, false, entityMappings[entity], { page: page + 1 });
      }

      if (ret[entity] && ret[entity].value) {
        ret[entity].value = then(ret[entity].value);
      }
    });

    return ret;
  }, ...restRedux);
}
