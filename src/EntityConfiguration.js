import { getUrl as builtinGetUrl } from './utils/getUrl';
import getKey from './utils/getKey';
import create from './refetch/create';
import list from './refetch/list';
import more from './refetch/more';
import single from './refetch/single';
import update from './refetch/update';
import del from './refetch/del';

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

    /** @type string */
    this.entity = entity;

    /** @type string */
    this.plural = plural;

    /** @type string */
    this.parentEntity = parentEntity;

    /** @type EntityConfiguration */
    this.parentConfiguration = parentConfiguration;

    /** @type function */
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
  listKey = ({ parentId = false, extra = {} }) => {
    return this.key({
      parentId,
      extra,
      flags: [ 'list' ],
    });
  };

  /*
   * Stores the latest page fetched for a list of entities
   */
  listPageKey = ({ parentId = false, extra = {} }) => {
    return this.key({
      parentId,
      extra,
      flags: [ 'list', 'page' ],
    });
  };

  /*
   * Stores the extra filters for a list of entities
   */
  listExtraKey = ({ parentId = false, extra = {} }) => {
    return this.key({
      parentId,
      extra,
      flags: [ 'list', 'extra' ],
    });
  };

  /*
   * Stores the more flag for a list of entities
   */
  listHasMoreKey = ({ parentId = false, extra = {} }) => {
    return this.key({
      parentId,
      extra,
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
  refetchListResponseKey = ({ parentId = false, extra = {} }) => {
    return this.key({
      parentId,
      extra,
      flags: [ 'refetch', 'list' ],
    });
  };

  /*
   * Refetch key for the function that fetches the next page in a list of entities
   */
  refetchListMoreKey = ({ parentId = false, extra = {} }) => {
    return this.key({
      parentId,
      extra,
      flags: [ 'refetch', 'list', 'more' ],
    });
  };

  /*
   * Refetch key for the response to fetching the next page in a list of entities
   */
  refetchListMoreResponseKey = ({ parentId = false, extra = {} }) => {
    return this.key({
      parentId,
      extra,
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
      flags: [ 'refetch', 'delete' ],
    });
  };

  /*
   * Refetch key for the response to deleting an entity
   */
  refetchDelResponseKey = ({ id, parentId = false }) => {
    return this.key({
      id,
      parentId,
      flags: [ 'refetch', 'delete', 'response' ],
    });
  };

  /*
   * Get URL to list or entity
   */
  url = ({ id = false, parentId = false, extra = {}, flags = [] }) => {
    return this.baseUrl + this._getUrl({
      entityConfiguration: this,
      id,
      parentId,
      extra,
      flags,
    });
  };

  /*
   * Get storage key for list or entity
   */
  key = ({ id = false, parentId = false, extra = {}, flags = [] }) => {
    return getKey({
      entityConfiguration: this,
      id,
      parentId,
      extra,
      flags,
    });
  };
}
