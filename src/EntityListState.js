export default class EntityListState {
  constructor({
    data,
    entity,
    parentId = false,
    extra = {},
    dispatch,
    hasMore = true,
    onMore = () => {},
  }) {
    /** @type PromiseState */
    this.data = data;

    /** @type string */
    this.entity = entity;

    /** @type string */
    this.parentId = parentId;

    /** @type object */
    this.extra = extra;

    /** @type function */
    this.dispatch = dispatch;

    /** @type bool */
    this.pending = this.data.pending;

    /** @type bool */
    this.refreshing = this.data.refreshing;

    /** @type bool */
    this.loading = this.pending || this.refreshing;

    /** @type bool */
    this.fulfilled = this.data.fulfilled;

    /** @type bool */
    this.settled = this.data.settled;

    /** @type bool */
    this.rejected = this.data.rejected;

    /** @type object|string */
    this.reason = this.data.reason;

    /** @type object */
    this.value = this.data.value;

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
