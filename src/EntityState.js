export default class EntityState {
  constructor({
    data,
    draft,
    dirty,
    entity,
    id,
    parentId,
    dispatch,
    onSave = () => {},
    onEdit = () => {},
    onDel = () => {},
  }) {
    /** @type PromiseState */
    this.data = data;

    /** @type PromiseState */
    this.draft = draft;

    /** @type string */
    this.entity = entity;

    /** @type string */
    this.id = id;

    /** @type string */
    this.parentId = parentId;

    /** @type bool */
    this.dirty = dirty;

    /** @type function */
    this.dispatch = dispatch;

    /** @type function */
    this.onSave = onSave;

    /** @type function */
    this.onEdit = onEdit;

    /** @type function */
    this.onDel = onDel;
  }

  save = (_then, _catch) => {
    const newData = this.draft.value;

    this.onSave(newData, _then, _catch);
  };

  edit = (draft) => {
    const newData = { ...this.draft.value, ...draft };

    this.onEdit(newData);
  };

  del = () => {
    this.onDel();
  };

  reset = () => {
    this.onEdit({ ...this.data.value });
  };

  isLoading = () => {
    const dataLoading = !!(this.data && (this.data.pending || this.data.refreshing));
    const draftLoading = !!(this.draft && (this.draft.pending || this.draft.refreshing));

    return (dataLoading || draftLoading);
  };

  isRefreshing = () => {
    const dataRefreshing = !!(this.data && this.data.refreshing);
    const draftRefreshing = !!(this.draft && this.draft.refreshing);

    return (dataRefreshing || draftRefreshing);
  };

  isPending = () => {
    const dataPending = !!(this.data && this.data.pending);
    const draftPending = !!(this.draft && this.draft.pending);

    return (dataPending || draftPending);
  };

  isFulfilled = () => {
    return !!(this.data && this.data.fulfilled);
  };

  getError = () => {
    let error = false;
    if (this.data && this.data.rejected) {
      error = this.data.reason;
    }

    if (this.draft && this.draft.rejected) {
      error = this.draft.reason;
    }

    return (error === false ? error : (error ? error : 'Unknown error'));
  };

  handleChange = ({ target, property, value }) => {
    if (target) {
      property = target.name;

      if (target.type === 'checkbox') {
        value = !!target.checked;
      } else {
        value = target.value;
      }
    }

    if (property) {
      const newData = { ...this.draft.value };

      if (property.indexOf('.') !== -1) {
        const [ field, field2 ] = property.split('.');
        if (field2) {
          newData[field][field2] = value;
        } else {
          newData[field] = value;
        }
      } else {
        newData[property] = value;
      }

      this.edit(newData);
    }
  };
}
