import { connect as connectRefetch, PromiseState } from 'react-refetch';
import { remove, create, update, updateMulti, updateBatch, updateAllLists, appendAllLists, refreshing, increaseCount, decreaseCount } from '../utils/reducer';
import getUrl from '../utils/getUrl';
import getName from '../utils/getName';
import extend from 'extend';
import buildRequest from 'react-refetch/lib/utils/buildRequest';

let entities = {};
let store = {};
let baseUrl = '';

export const setEntities = (newEntities) => { entities = newEntities; };
export const setStore = (newStore) => { store = newStore; };
export const getEntities = () => entities;
export const getStore = () => store;
export const setBaseUrl = (newBaseUrl) => { baseUrl = newBaseUrl };
export const getBaseUrl = () => baseUrl;

export default (mapStateToProps) => connectRefetch((props, context) => {
  const realMapStateToProps = mapStateToProps(props, context);
  Object.keys(entities).forEach((entity) => {
    if (entities[entity].plural && !entities[entity].singular) {
      entities[entities[entity].plural] = extend(true, {}, entities[entity]);
      entities[entities[entity].plural].singular = entity;
    }
  });

  Object.keys(realMapStateToProps).forEach((key) => {
    let realMapConfig = realMapStateToProps[key];
    if (typeof realMapConfig !== typeof {}) {
      realMapConfig = {
        id: realMapConfig,
      };
    }
    const realId = realMapConfig.id || false;
    const parentId = realMapConfig.parentId || false;
    const extra = realMapConfig.extra || {};

    const pluralMatches = key.match(/^(.+)$/);
    const createMatches = key.match(/^(.+)Create$/);
    const editMatches = key.match(/^(.+)Edit$/);
    const editDraftMatches = key.match(/^(.+)EditDraft$/);
    const deleteMatches = key.match(/^(.+)Delete/);
    const loadMoreMatches = key.match(/^(.+)LoadMore$/);

    // Single entity
    if (entities[key] && !entities[key].singular) {
      const hashedName = getName(key, realId, parentId);

      const url = getUrl(key, realId, parentId);
      realMapStateToProps[key] = {
        url,
        comparison: url,
        buildRequest: (mapping) => {
          store.dispatch(create(hashedName, PromiseState.create()));
          store.dispatch(create(`${hashedName}Draft`, PromiseState.create()));

          return buildRequest(mapping);
        },
        then: (value) => {
          store.dispatch(update(hashedName, PromiseState.resolve(value)));

          const draft = PromiseState.resolve(value);
          draft.saved = true;
          store.dispatch(update(`${hashedName}Draft`, draft));

          return {
            value,
            comparison: url,
            force: true,
          };
        },
        catch: (reason, meta) => {
          store.dispatch(update(hashedName, PromiseState.reject(meta.response.statusText)));

          return {
            value: null,
            comparison: url,
            force: true,
          };
        },
      };
    // List of entities
    } else if (pluralMatches && entities[pluralMatches[1]] && entities[pluralMatches[1]].singular) {
      const entityName = entities[pluralMatches[1]].singular;
      const hashedName = getName(entityName, realId, parentId, extra);

      const url = getUrl(entityName, realId, parentId, extra);
      realMapStateToProps[key] = {
        url,
        comparison: url,
        buildRequest: (mapping) => {
          store.dispatch(create(hashedName, PromiseState.create()));
          store.dispatch(update(`${hashedName}Page`, 1));
          store.dispatch(update(`${hashedName}Extra`, extra));
          
          return buildRequest(mapping);
        },
        then: (value) => {
          const updates = {};
          value.forEach((item) => {
            const itemHash = getName(entityName, item.id, parentId);
            updates[itemHash] = PromiseState.resolve(item);

            const draft = PromiseState.resolve(item);
            draft.saved = true;
            updates[`${itemHash}Draft`] = draft;
          });

          store.dispatch(updateMulti(updates));
          store.dispatch(update(hashedName, PromiseState.resolve(value)));

          return {
            value,
            force: true,
            comparison: url,
          };
        },
        catch: (reason, meta) => {
          store.dispatch(update(hashedName, PromiseState.reject(meta.response.statusText)));

          return {
            value: null,
            force: true,
            comparison: url,
          };
        },
      };
    // Create entity
    } else if (createMatches) {
      const entityName = createMatches[1];
      const entityConfiguration = entities[entityName];
      if (entityConfiguration) {
        realMapStateToProps[key] = (data, parentId = false) => {
          let url;
          let hash;
          if (entityConfiguration.parent && parentId) {
            url = getUrl(entityName, false, parentId);
            hash = getName(entityName, false, parentId);
          } else {
            url = getUrl(entityName);
            hash = getName(entityName);
          }

          const ret = {};

          // Reset errors if called with data = false
          if (data === false) {
            store.dispatch(update(`${hash}CreateResponse`, null));

            return ret;
          }

          ret[`${hash}CreateResponse`] = {
            url,
            comparison: url,
            method: 'POST',
            body: JSON.stringify(data),
            force: true,
            buildRequest: (mapping) => {
              store.dispatch(update(`${hash}CreateResponse`, PromiseState.create()));

              return buildRequest(mapping);
            },
            then: (value) => {
              const multi = [];
              multi.push(update(`${hash}CreateResponse`, PromiseState.resolve(value)));

              const singleHash = getName(entityName, value.id, parentId);
              multi.push(update(singleHash, PromiseState.resolve(value)));

              const draft = PromiseState.resolve(value);
              draft.saved = true;
              multi.push(update(`${singleHash}Draft`, draft));

              multi.push(appendAllLists(entityName, parentId, [ value ]));

              if (entityConfiguration.count) {
                const parentHash = getName(entityConfiguration.parent, parentId);
                multi.push(increaseCount(parentHash, entityConfiguration.count));
              }

              // There may be a draft here with id = 0, so remove it
              if (parentId) {
                multi.push(remove(`${getName(entityName, '0', parentId)}Draft`));
              } else {
                multi.push(remove(`${getName(entityName, '0')}Draft`));
              }

              store.dispatch(updateBatch(multi));

              return {
                value,
                comparison: url,
                force: true,
                andThen: (newData) => {
                  if (entityConfiguration.onCreate) {
                    entityConfiguration.onCreate(newData);
                  }

                  return {};
                },
              };
            },
            catch: (exception) => {
              store.dispatch(update(`${hash}CreateResponse`, PromiseState.reject({
                message: exception.cause.error,
              })));

              return {
                value: null,
                comparison: url,
                force: true,
              };
            },
          };

          return ret;
        };
      }
    // Edit entity
    } else if (editMatches) {
      const entityName = editMatches[1];
      const entityConfiguration = entities[entityName];
      if (entityConfiguration) {
        realMapStateToProps[key] = (id, parentId = false, data) => {
          let url;
          let hash;
          let listHash;

          if (entityConfiguration.parent && parentId) {
            url = getUrl(entityName, id, parentId);
            hash = getName(entityName, id, parentId);
            listHash = getName(entityName, false, parentId);
          } else {
            url = getUrl(entityName, id);
            hash = getName(entityName, id);
          }

          const ret = {};

          // Reset errors if called with data = false
          if (data === false) {
            store.dispatch(update(`${hash}EditResponse`, null));

            return ret;
          }

          ret[`${hash}EditResponse`] = {
            url,
            comparison: url,
            method: 'PATCH',
            body: JSON.stringify(data),
            force: true,
            buildRequest: (mapping) => {
              store.dispatch(update(`${hash}EditResponse`, PromiseState.create()));

              return buildRequest(mapping);
            },
            then: (value) => {
              store.dispatch(update(`${hash}EditResponse`, PromiseState.resolve(value)));
              store.dispatch(update(hash, PromiseState.resolve(value)));

              const draft = PromiseState.resolve(value);
              draft.saved = true;
              store.dispatch(update(`${hash}Draft`, draft));

              if (listHash) {
                store.dispatch(updateAllLists(entityName, id, parentId, value));
              }

              return {
                value,
                comparison: url,
                force: true,
                andThen: (newData) => {
                  if (entityConfiguration.onEdit) {
                    entityConfiguration.onEdit(newData);
                  }

                  return {};
                },
              };
            },
            catch: (exception) => {
              store.dispatch(update(`${hash}EditResponse`, PromiseState.reject({
                message: exception.cause.error,
              })));

              return {
                value: null,
                comparison: url,
                force: true,
              };
            },
          };

          return ret;
        };
      }
    // Edit entity draft
    } else if (editDraftMatches) {
      const entityName = editDraftMatches[1];
      const entityConfiguration = entities[entityName];
      if (entityConfiguration) {
        realMapStateToProps[key] = (id, parentId = false, data) => {
          let hash;

          if (entityConfiguration.parent && parentId) {
            hash = getName(entityName, id, parentId);
          } else {
            hash = getName(entityName, id);
          }

          const draft = PromiseState.resolve(data);
          draft.saved = false;
          store.dispatch(update(`${hash}Draft`, draft));

          return {};
        };
      }
    // Delete entity
    } else if (deleteMatches) {
      const entityName = deleteMatches[1];
      const entityConfiguration = entities[entityName];
      if (entityConfiguration) {
        realMapStateToProps[key] = (id, parentId = false) => {
          let url;
          let hash;
          let listHash;

          if (entityConfiguration.parent && parentId) {
            url = getUrl(entityName, id, parentId);
            hash = getName(entityName, id, parentId);
            listHash = getName(entityName, false, parentId);
          } else {
            url = getUrl(entityName, id);
            hash = getName(entityName, id);
          }

          const ret = {};

          ret[`${hash}DeleteResponse`] = {
            url,
            comparison: url,
            method: 'DELETE',
            force: true,
            buildRequest: (mapping) => {
              store.dispatch(update(`${hash}DeleteResponse`, PromiseState.create()));

              return buildRequest(mapping);
            },
            then: (value) => {
              if (listHash) {
                store.dispatch(updateAllLists(entityName, id, parentId, false));
              }

              store.dispatch(update(`${hash}DeleteResponse`, PromiseState.resolve(null)));

              store.dispatch(update(hash, PromiseState.resolve(null)));
              store.dispatch(update(`${hash}Draft`, PromiseState.resolve(null)));

              if (entityConfiguration.count) {
                const parentHash = getName(entityConfiguration.parent, parentId);
                store.dispatch(decreaseCount(parentHash, entityConfiguration.count));
              }

              return {
                value,
                comparison: url,
                force: true,
                andThen: (newData) => {
                  if (entityConfiguration.onDelete) {
                    entityConfiguration.onDelete(newData);
                  }

                  return {};
                },
              };
            },
            catch: (exception) => {
              store.dispatch(update(`${hash}DeleteResponse`, PromiseState.reject({
                message: exception.cause.error,
              })));

              return {
                comparison: url,
                force: true,
                value: null,
              };
            },
          };

          return ret;
        };
      }
    // Load more entities
    } else if (loadMoreMatches) {
      let entityName = loadMoreMatches[1];
      if (entities[entityName] && entities[entityName].singular) {
        entityName = entities[entityName].singular;
      }
      const entityConfiguration = entities[entityName];
      if (entityConfiguration) {
        realMapStateToProps[key] = (id, parentId = false, extra = { page: 1 }) => {
          let url;
          let hash;
          if (entityConfiguration.parent && parentId) {
            url = getUrl(entityName, id, parentId, extra);
            hash = getName(entityName, id, parentId);
          } else {
            url = getUrl(entityName, id, false, extra);
            hash = getName(entityName, id, false);
          }

          const ret = {};

          ret[hash] = {
            url,
            comparison: url,
            force: true,
            refreshing: true,
            buildRequest: (mapping) => {
              store.dispatch(refreshing(hash));
              store.dispatch(update(`${hash}Page`, extra.page));

              return buildRequest(mapping);
            },
            then: (value) => {
              const updates = {};
              value.forEach((item) => {
                const itemHash = getName(entityName, item.id, parentId);
                updates[itemHash] = PromiseState.resolve(item);

                const draft = PromiseState.resolve(item);
                draft.saved = true;
                updates[`${itemHash}Draft`] = draft;
              });

              if (value.length === 0) {
                updates[`${hash}Page`] = -1;
              }

              store.dispatch(updateMulti(updates));

              store.dispatch(appendAllLists(entityName, parentId, value));

              return {
                value,
                comparison: url,
                force: true,
              };
            },
          };

          return ret;
        };
      }
    }

    Object.keys(realMapConfig).forEach((config) => {
      if (config !== 'id') {
        realMapStateToProps[key][config] = realMapConfig[config];
      }
    });
  });

  return realMapStateToProps;
});
