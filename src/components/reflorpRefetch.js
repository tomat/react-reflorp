import { connect as connectRefetch, PromiseState } from 'react-refetch';
import { update, updateDraft, updateList, append, refreshing, increaseCount, decreaseCount } from '../utils/reducer';
import getUrl from '../utils/getUrl';
import getName from '../utils/getName';

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

  Object.keys(realMapStateToProps).forEach((key) => {
    let realMapConfig = realMapStateToProps[key];
    if (typeof realMapConfig !== typeof {}) {
      realMapConfig = {
        id: realMapConfig,
      };
    }
    const realMap = realMapConfig.id || realMapConfig.parentId;

    const pluralMatches = key.match(/^(.+)s$/);
    const createMatches = key.match(/^(.+)Create$/);
    const editMatches = key.match(/^(.+)Edit/);
    const deleteMatches = key.match(/^(.+)Delete/);
    const loadMoreMatches = key.match(/^(.+)s?LoadMore$/);

    if (entities[key]) {
      const hashedName = getName(key, realMap);
      store.dispatch(update(hashedName, PromiseState.create()));
      store.dispatch(updateDraft(hashedName, PromiseState.create()));
      realMapStateToProps[key] = {
        url: getUrl(key, realMap),
        then: (value) => {
          store.dispatch(update(hashedName, PromiseState.resolve(value)));

          const draft = PromiseState.resolve(value);
          draft.saved = true;
          store.dispatch(updateDraft(hashedName, draft));

          return {
            value,
          };
        },
        catch: (reason, meta) => {
          store.dispatch(update(hashedName, PromiseState.reject(meta.response.statusText)));

          return {
            value: null,
          };
        },
      };
    } else if (pluralMatches && entities[pluralMatches[1]]) {
      const entityName = pluralMatches[1];
      const hashedName = getName(entityName, false, realMap);
      store.dispatch(update(hashedName, PromiseState.create()));
      realMapStateToProps[key] = {
        url: getUrl(entityName, false, realMap),
        then: (value) => {
          value.forEach((item) => {
            const itemHash = getName(entityName, item.id, realMap);
            store.dispatch(update(itemHash, PromiseState.resolve(item)));

            const draft = PromiseState.resolve(item);
            draft.saved = true;
            store.dispatch(updateDraft(itemHash, draft));
          });

          store.dispatch(update(hashedName, PromiseState.resolve(value)));

          return {
            value,
          };
        },
        catch: (reason, meta) => {
          store.dispatch(update(hashedName, PromiseState.reject(meta.response.statusText)));

          return {
            value: null,
          };
        },
      };
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

          store.dispatch(update(`${hash}CreateResponse`, PromiseState.create()));

          const ret = {};

          ret[`${hash}CreateResponse`] = {
            url,
            method: 'POST',
            body: JSON.stringify(data),
            force: true,
            then: (value) => {
              store.dispatch(update(`${hash}CreateResponse`, PromiseState.resolve(value)));

              const singleHash = getName(entityName, value.id, (parentId ? parentId : false));
              store.dispatch(update(singleHash, PromiseState.resolve(value)));

              const draft = PromiseState.resolve(value);
              draft.saved = true;
              store.dispatch(updateDraft(singleHash, draft));

              store.dispatch(append(hash, value));

              if (entityConfiguration.count) {
                const parentHash = getName(entityConfiguration.parent, parentId);
                store.dispatch(increaseCount(parentHash, entityConfiguration.count));
              }

              return {
                value,
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
              };
            },
          };

          return ret;
        };
      }
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

          store.dispatch(update(`${hash}EditResponse`, PromiseState.create()));

          ret[`${hash}EditResponse`] = {
            url,
            method: 'PATCH',
            body: JSON.stringify(data),
            force: true,
            then: (value) => {
              store.dispatch(update(`${hash}EditResponse`, PromiseState.resolve(value)));
              store.dispatch(update(hash, PromiseState.resolve(value)));

              const draft = PromiseState.resolve(value);
              draft.saved = true;
              store.dispatch(updateDraft(hash, draft));

              if (listHash) {
                store.dispatch(updateList(id, listHash, value));
              }

              return {
                value,
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
              };
            },
          };

          return ret;
        };
      }
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

          store.dispatch(update(`${hash}DeleteResponse`, PromiseState.create()));

          ret[`${hash}DeleteResponse`] = {
            url,
            method: 'DELETE',
            force: true,
            then: (value) => {
              store.dispatch(update(`${hash}DeleteResponse`, PromiseState.resolve({})));
              store.dispatch(update(hash, PromiseState.resolve({})));
              store.dispatch(updateDraft(hash, PromiseState.resolve({})));

              if (listHash) {
                store.dispatch(updateList(id, listHash, false));
              }

              if (entityConfiguration.count) {
                const parentHash = getName(entityConfiguration.parent, parentId);
                store.dispatch(decreaseCount(parentHash, entityConfiguration.count));
              }

              return {
                value,
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
                value: null,
              };
            },
          };

          return ret;
        };
      }
    } else if (loadMoreMatches) {
      const entityName = loadMoreMatches[1];
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
            hash = getName(entityName, id);
          }

          store.dispatch(refreshing(hash));
          store.dispatch(update(`${hash}Page`, extra.page));

          const ret = {};

          ret[hash] = {
            url,
            force: true,
            refreshing: true,
            then: (value) => {
              value.forEach((item) => {
                const itemHash = getName(entityName, item.id, parentId);
                store.dispatch(update(itemHash, PromiseState.resolve(item)));

                const draft = PromiseState.resolve(item);
                draft.saved = true;
                store.dispatch(updateDraft(itemHash, draft));
              });

              store.dispatch(append(hash, value));

              return {
                value,
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
