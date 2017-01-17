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
    this.hasMore = hasMore;

    /** @type function */
    this.onMore = onMore;
  }

  isLoading = () => {
    return !!(this.data && (this.data.pending || this.data.refreshing));
  };

  isPending = () => {
    return !!(this.data && this.data.pending);
  };

  isRefreshing = () => {
    return !!(this.data && this.data.refreshing);
  };

  isFulfilled = () => {
    return !!(this.data && this.data.fulfilled);
  };

  more = () => {
    this.onMore();
  };

  getError = () => {
    if (this.data && this.data.rejected) {
      return this.data.reason;
    }

    return null;
  };
}
