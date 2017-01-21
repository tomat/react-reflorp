import { default as builtinGetUrl } from './utils/getUrl';
import getKey from './utils/getKey';
import create from './refetch/create';
import list from './refetch/list';
import more from './refetch/more';
import single from './refetch/single';
import update from './refetch/update';
import del from './refetch/del';

/**
 * @api
 */
export default class EntityConfiguration {
  constructor({
    dispatch,
    baseUrl,
    entity,
    plural = entity + 's',
    parentEntity = null,
    parentConfiguration = null,
    getUrl = builtinGetUrl,
  }) {
    /** @type function */
    this.dispatch = dispatch;

    /** @type string */
    this.baseUrl = baseUrl;

    /**
     * @type string
     * @api
     */
    this.entity = entity;

    /**
     * @type string
     * @api
     */
    this.plural = plural;

    /**
     * @type string
     * @api
     * */
    this.parentEntity = parentEntity;

    /**
     * @type EntityConfiguration
     * @api
     */
    this.parentConfiguration = parentConfiguration;

    /**
     * @type function
     * @api
     */
    this._getUrl = (typeof getUrl === 'function' ? getUrl : builtinGetUrl);

    this.refetch = {
      single: single(this),
      list: list(this),
      more: more(this),
      create: create(this),
      update: update(this),
      del: del(this),
    };
  }

  /*
   * Stores the draft used when creating a new entity
   */
  newDraftKey = ({ parentId = false }) => {
    return this.key({
      parentId,
      flags: [ 'new', 'draft' ],
    });
  };

  /*
   * Stores a single entity
   */
  singleKey = ({ id, parentId = false }) => {
    return this.key({
      id,
      parentId,
      flags: [ 'single' ],
    });
  };

  /*
   * Stores a draft used when editing a single entity
   */
  draftKey = ({ id, parentId = false }) => {
    return this.key({
      id,
      parentId,
      flags: [ 'draft' ],
    });
  };

  /*
   * Stores a list of entities
   */
  listKey = ({ parentId = false, query = {} }) => {
    return this.key({
      parentId,
      query,
      flags: [ 'list' ],
    });
  };

  /*
   * Stores the latest page fetched for a list of entities
   */
  listPageKey = ({ parentId = false, query = {} }) => {
    return this.key({
      parentId,
      query,
      flags: [ 'list', 'page' ],
    });
  };

  /*
   * Stores the query filters for a list of entities
   */
  listQueryKey = ({ parentId = false, query = {} }) => {
    return this.key({
      parentId,
      query,
      flags: [ 'list', 'query' ],
    });
  };

  /*
   * Stores the more flag for a list of entities
   */
  listHasMoreKey = ({ parentId = false, query = {} }) => {
    return this.key({
      parentId,
      query,
      flags: [ 'list', 'hasMore' ],
    });
  };

  /*
   * Refetch key for the response to fetching a single entity
   */
  refetchSingleResponseKey = ({ id, parentId = false }) => {
    return this.key({
      id,
      parentId,
      flags: [ 'refetch' ],
    });
  };

  /*
   * Refetch key for the response to fetching a list of entities
   */
  refetchListResponseKey = ({ parentId = false, query = {} }) => {
    return this.key({
      parentId,
      query,
      flags: [ 'refetch', 'list' ],
    });
  };

  /*
   * Refetch key for the function that fetches the next page in a list of entities
   */
  refetchListMoreKey = ({ parentId = false, query = {} }) => {
    return this.key({
      parentId,
      query,
      flags: [ 'refetch', 'list', 'more' ],
    });
  };

  /*
   * Refetch key for the response to fetching the next page in a list of entities
   */
  refetchListMoreResponseKey = ({ parentId = false, query = {} }) => {
    return this.key({
      parentId,
      query,
      flags: [ 'refetch', 'list', 'more' ],
    });
  };

  /*
   * Refetch key for the function that creates a new entity
   */
  refetchCreateKey = ({ parentId = false }) => {
    return this.key({
      parentId,
      flags: [ 'refetch', 'create' ],
    });
  };

  /*
   * Refetch key for the response to creating an entity
   */
  refetchCreateResponseKey = ({ parentId = false }) => {
    return this.key({
      parentId,
      flags: [ 'refetch', 'create', 'response' ],
    });
  };

  /*
   * Refetch key for the function that updates an entity
   */
  refetchUpdateKey = ({ id, parentId = false }) => {
    return this.key({
      id,
      parentId,
      flags: [ 'refetch', 'update' ],
    });
  };

  /*
   * Refetch key for the response to updating an entity
   */
  refetchUpdateResponseKey = ({ id, parentId = false }) => {
    return this.key({
      id,
      parentId,
      flags: [ 'refetch', 'update', 'response' ],
    });
  };

  /*
   * Refetch key for the function that deletes an entity
   */
  refetchDelKey = ({ id, parentId = false }) => {
    return this.key({
      id,
      parentId,
      flags: [ 'refetch', 'del' ],
    });
  };

  /*
   * Refetch key for the response to deleting an entity
   */
  refetchDelResponseKey = ({ id, parentId = false }) => {
    return this.key({
      id,
      parentId,
      flags: [ 'refetch', 'del', 'response' ],
    });
  };

  /*
   * Get URL to list or entity
   */
  url = ({ id = false, parentId = false, query = {}, flags = [] }) => {
    return this.baseUrl + this._getUrl({
      entityConfiguration: this,
      id,
      parentId,
      query,
      flags,
    });
  };

  /*
   * Get storage key for list or entity
   */
  key = ({ id = false, parentId = false, query = {}, flags = [] }) => {
    return getKey({
      entityConfiguration: this,
      id,
      parentId,
      query,
      flags,
    });
  };
}
