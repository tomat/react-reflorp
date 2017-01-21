/**
 * @api
 */
export default class EntityListState {
  constructor({
    data,
    entity,
    parentId = false,
    query = {},
    dispatch,
    hasMore = true,
    onMore = () => {},
    _then = (v) => v,
  }) {
    /** @type PromiseState */
    this.data = data;

    /** @type string */
    this.entity = entity;

    /** @type string */
    this.parentId = parentId;

    /** @type object */
    this.query = query;

    /** @type function */
    this.dispatch = dispatch;

    /** @type bool */
    this.pending = !!(this.data && this.data.pending);

    /** @type bool */
    this.refreshing = !!(this.data && this.data.refreshing);

    /** @type bool */
    this.loading = this.pending || this.refreshing;

    /** @type bool */
    this.fulfilled = !!(this.data && this.data.fulfilled);

    /** @type bool */
    this.settled = !!(this.data && this.data.settled);

    /** @type bool */
    this.rejected = !!(this.data && this.data.rejected);

    /** @type object|string */
    this.reason = this.data && this.data.reason;

    /** @type object */
    this.value = this.data && this.data.value;

    /** @type object */
    this.value = this.data && this.data.value && _then(this.data.value);

    /** @type string|bool */
    this.error = (
      (this.data && this.data.rejected)
        ? (this.data.reason ? this.data.reason : 'Unknown error')
        : false
    );

    /** @type bool */
    this.hasMore = hasMore;

    /** @type function */
    this.onMore = onMore;
  }

  more = () => {
    this.onMore();
  };
}
