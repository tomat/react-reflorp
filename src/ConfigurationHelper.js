import EntityState from './EntityState';
import EntityListState from './EntityListState';
import { PromiseState } from 'react-refetch';
import { update } from './utils/reducer';
import EntityConfiguration from './EntityConfiguration';

export const refetchPrefix = 'reflorp';

export default class ConfigurationHelper {
  constructor(configuration, dispatch) {
    this.dispatch = dispatch;
    this.baseUrl = configuration.baseUrl;
    this.pluralNames = {};
    this.entities = {};

    Object.keys(configuration.entities).sort((a, b) => {
      const entity1 = configuration.entities[a];
      const entity2 = configuration.entities[b];

      if (entity1.parent && !entity2.parent) { return 1; }
      if (!entity1.parent && entity2.parent) { return -1; }

      return 0;
    }).forEach((name) => {
      const entity = configuration.entities[name];

      if (entity.plural) {
        this.pluralNames[entity.plural] = name;
      } else {
        if (!this.pluralNames[name + 's']) {
          this.pluralNames[name + 's'] = name;
        } else {
          throw 'wat';
        }
      }

      this.entities[name] = new EntityConfiguration({
        dispatch,
        baseUrl: this.baseUrl,
        entity: name,
        plural: entity.plural || name + 's',
        parentEntity: (entity.parent || null),
        parentConfiguration: (entity.parent && this.entities[entity.parent]) || null,
      });
    });
  }

  getEntityDefaults = (possibleName) => {
    const name = this.getEntityName(possibleName);

    return this.entities[name].defaults || {};
  };

  getEntityName = (possibleName) => {
    if (this.entities[possibleName]) {
      return possibleName;
    }

    if (this.pluralNames[possibleName]) {
      if (this.entities[this.pluralNames[possibleName]]) {
        return this.pluralNames[possibleName];
      }
    }

    throw `Unknown entity name "${possibleName}"`;
  };

  getEntityFetches = (possibleName, options) => {
    const name = this.getEntityName(possibleName);
    const entityConfiguration = this.entities[name];

    let fetches = {};

    if (options.create) {
      /**
       * Create new entity
       */
      const createRefetch = entityConfiguration.refetch.create({
        parentId: options.parentId || false,
        onCreate: options.onCreate,
      });

      fetches = {
        ...fetches,
        ...createRefetch,
      };
    } else if (options.load === true && !options.id) {
      /**
       * Load entity list
       */
      const listRefetch = entityConfiguration.refetch.list({
        parentId: options.parentId || false,
        extra: options.extra || {},
      });

      fetches = {
        ...fetches,
        ...listRefetch,
      };

      /**
       * Load next page of entity list
       */
      const listMoreRefetch = entityConfiguration.refetch.more({
        parentId: options.parentId || false,
        extra: options.extra || {},
      });

      fetches = {
        ...fetches,
        ...listMoreRefetch,
      };
    } else {
      /**
       * Getting single entity by id
       */
      if (options.load === true) {
        /**
         * Load single entity by id
         */
        const singleRefetch = entityConfiguration.refetch.single({
          id: options.id,
          parentId: options.parentId || false,
          onCreate: options.onCreate,
        });

        fetches = {
          ...fetches,
          ...singleRefetch,
        };
      }

      /**
       * Edit single entity by id
       */
      const updateRefetch = entityConfiguration.refetch.update({
        id: options.id,
        parentId: options.parentId || false,
        onUpdate: options.onUpdate,
      });

      fetches = {
        ...fetches,
        ...updateRefetch,
      };

      /**
       * Delete single entity by id
       */
      const delRefetch = entityConfiguration.refetch.del({
        id: options.id,
        parentId: options.parentId || false,
        onDel: options.onDel,
      });

      fetches = {
        ...fetches,
        ...delRefetch,
      };
    }

    const prefixedFetches = {};
    Object.keys(fetches).forEach((k) => {
      prefixedFetches[refetchPrefix + k] = fetches[k];
    });

    return prefixedFetches;
  };

  getEntityState = (possibleName, options, fetches, state) => {
    const name = this.getEntityName(possibleName);
    const entityConfiguration = this.entities[name];
    const id = options.id || false;
    const parentId = options.parentId || false;

    if (options.create) {
      /**
       * Create new entity
       */
      const draftKey = entityConfiguration.newDraftKey({ parentId });
      const createKey = refetchPrefix + entityConfiguration.refetchCreateKey({ parentId });

      return new EntityState({
        entity: name,
        id: null,
        parentId,
        dirty: false,
        data: state[draftKey] || null,
        draft: state[draftKey] || {},
        onSave: (data) => {
          fetches[createKey](data);
        },
        onEdit: (data) => {
          this.dispatch(update(draftKey, PromiseState.resolve(data)));
        },
      });
    } else if (!options.id) {
      /**
       * Entity list
       */
      const listKey = entityConfiguration.listKey({ parentId, extra: options.extra });
      const listPageKey = entityConfiguration.listPageKey({ parentId, extra: options.extra });
      const listHasMoreKey = entityConfiguration.listHasMoreKey({ parentId, extra: options.extra });
      const refetchListMoreKey = refetchPrefix + entityConfiguration.refetchListMoreKey({ parentId, extra: options.extra });

      return new EntityListState({
        entity: name,
        parentId,
        extra: options.extra || {},
        data: state[listKey] || null,
        hasMore: state[listHasMoreKey],
        onMore: () => {
          fetches[refetchListMoreKey](state[listPageKey] + 1);
        },
      });
    } else {
      /**
       * Single entity by id
       */
      const key = entityConfiguration.singleKey({ id, parentId });
      const draftKey = entityConfiguration.draftKey({ id, parentId });

      const delKey = refetchPrefix + entityConfiguration.refetchDelKey({ id, parentId });
      const updateKey = refetchPrefix + entityConfiguration.refetchUpdateKey({ id, parentId });

      return new EntityState({
        entity: name,
        id,
        parentId,
        dirty: false,
        data: state[key] || null,
        draft: state[draftKey] || state[key] || null,
        onDel: (_then = () => {}, _catch = () => {}) => {
          fetches[delKey]({ then: _then, catch: _catch });
        },
        onEdit: (data) => {
          this.dispatch(update(draftKey, PromiseState.resolve(data)));
        },
        onSave: (data, _then = () => {}, _catch = () => {}) => {
          fetches[updateKey](data, { then: _then, catch: _catch });
        },
      });
    }
  };
}
